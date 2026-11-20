/**
 * ChargingController — 充电业务编排层
 *
 * 职责:
 *   1. 串联 API 调用与硬件操作的先后顺序
 *   2. 管理运行时生命周期（保活、自动断电）
 *   3. 提供统一错误语义，向上层隐藏协议细节
 *
 * 依赖注入: 通过构造函数接收 SerialPortDriver，方便测试时替换为 Mock
 * 设计原则: "先 API 后硬件" — API 成功才操作硬件，硬件失败则 API 已经记录
 */
import type { SerialPortDriver, SerialStatusCallback } from './SerialPortDriver'
import type { PortStatus } from '@/utils/serial-protocol'
import { tabletApi } from '@/api'
import { orderStore } from '@/stores/order'
import { authStore } from '@/stores/auth'

export interface ChargingState {
  enabled: boolean
  fee: number
  activePorts: number
  sessions: any[]
}

export class ChargingController {
  private driver: SerialPortDriver
  private onStatusChange: ((status: PortStatus) => void) | null = null
  private autoStopEnabled = false // 不允许自动停止，仅手动或结算关台时停止
  private autoStartEnabled = false

  /** 跟踪哪些端口有活跃充电会话（服务端数据） */
  private activePortSet = new Set<string>()

  /** 防止重复自动停止 */
  private stoppingPorts = new Set<string>()

  /** 上一次硬件状态（用于边沿检测） */
  private lastHardwareStatus: PortStatus | null = null

  constructor(driver: SerialPortDriver) {
    this.driver = driver
  }

  // ==================== 初始化 ====================

  /**
   * 初始化硬件并注册状态回调。
   * 回调中处理手机移除 → 自动断电逻辑。
   */
  initHardware(): boolean {
    const callback: SerialStatusCallback = (status) => {
      this.onStatusChange?.(status)
      this.lastHardwareStatus = status ? { ...status } : null

      // 串口状态变化时立即按端口修复不一致：该开的必须开
      if (this.activePortSet.has('left') && !status.leftCharging) {
        console.warn('[充电] 硬件回调检测到左口异常断开，立即修复')
        this.retryHardware(() => this.driver.startCharging('left'), '左口即时修复')
      }
      if (this.activePortSet.has('right') && !status.rightCharging) {
        console.warn('[充电] 硬件回调检测到右口异常断开，立即修复')
        this.retryHardware(() => this.driver.startCharging('right'), '右口即时修复')
      }
    }

    return this.driver.init(callback)
  }

  hasActiveSessions(): boolean {
    return this.activePortSet.size > 0
  }

  /** 注册外部状态观察者（供 useCharging 做边沿检测） */
  setStatusChangeHandler(fn: ((status: PortStatus) => void) | null) {
    this.onStatusChange = fn
  }

  // ==================== API 交互 ====================

  async loadConfig(): Promise<Record<string, any> | null> {
    try {
      const cfg = await tabletApi.getChargingConfig()
      this.autoStartEnabled = !!cfg?.auto_start
      return cfg  // 返回完整配置，包含 rate_per_hour 等
    } catch {
      return null
    }
  }

  async loadStatus(): Promise<ChargingState | null> {
    if (!orderStore.orderId) return null
    try {
      const data = await tabletApi.getChargingStatus(orderStore.orderId)
      const sessions = data?.sessions || []
      const activeList = sessions.filter((s: any) => s.status === 'active')
      this.activePortSet = new Set(activeList.map((s: any) => s.port))
      return {
        enabled: true,
        fee: data?.total_fee || 0,
        activePorts: activeList.length,
        sessions,
      }
    } catch {
      return null
    }
  }

  // ==================== 充电控制 ====================

  /** 硬件操作重试（3次，间隔1秒） */
  private async retryHardware(op: () => boolean, label: string): Promise<boolean> {
    for (let i = 0; i < 3; i++) {
      if (op()) return true
      if (i < 2) {
        console.warn(`[充电] ${label} 失败，第${i + 1}次重试...`)
        await new Promise(r => setTimeout(r, 1000))
      }
    }
    return false
  }

  /**
   * 启动指定口充电。
   * API 成功 → 硬件重试3次 → 失败则回滚 API
   */
  async startCharging(port: 'left' | 'right'): Promise<void> {
    const orderId = orderStore.orderId
    const tableId = String(authStore.tableId)

    // 1. API 记录充电开始
    await tabletApi.startCharging({ order_id: orderId, table_id: tableId, port })

    // 2. 准备硬件运行时环境
    if (!this.driver.prepareRuntime()) {
      // 回滚 API
      await tabletApi.stopCharging({ order_id: orderId, port }).catch(() => {})
      throw new Error('充电运行环境准备失败')
    }

    // 3. 硬件上电（重试3次）
    const ok = await this.retryHardware(
      () => this.driver.startCharging(port),
      `${port}口上电`
    )
    if (!ok) {
      // 回滚 API
      await tabletApi.stopCharging({ order_id: orderId, port }).catch(() => {})
      throw new Error(`串口命令发送失败，${port === 'left' ? '左侧' : '右侧'}充电口未成功上电`)
    }

    // 4. 更新本地状态
    this.activePortSet.add(port)
  }

  /**
   * 停止指定口充电。
   * API 调用 → 硬件断电（重试3次）→ 清理运行时
   */
  async stopCharging(port: 'left' | 'right'): Promise<void> {
    const orderId = orderStore.orderId

    // 1. API 记录充电停止
    await tabletApi.stopCharging({ order_id: orderId, port })

    // 2. 硬件断电（重试3次）
    await this.retryHardware(
      () => this.driver.stopCharging(port),
      `${port}口断电`
    )
    // 硬件失败不抛异常——API 已记录停止，下次 loadStatus 会重新同步

    // 3. 更新本地状态
    this.activePortSet.delete(port)

    // 4. 所有端口都停了 → 关闭运行时
    if (this.activePortSet.size === 0) {
      this.driver.stopRuntime()
    }
  }

  /**
   * 按端口同步：对比每个端口的服务端状态与硬件状态，逐个修复不一致
   */
  async syncHardwareWithServer(): Promise<void> {
    const state = await this.loadStatus()
    if (!state) return

    // 从服务端 sessions 中获取每个端口的状态
    const serverActivePorts = new Set<string>()
    for (const s of state.sessions) {
      if (s.port) serverActivePorts.add(s.port as string)
    }
    this.activePortSet = serverActivePorts

    for (const port of ['left', 'right'] as const) {
      const serverOn = serverActivePorts.has(port)
      const hwOn = this.driver.isCharging(port)  // 需要驱动支持单端口查询

      if (serverOn && !hwOn) {
        // 服务端有活跃充电但硬件没开 → 修复开启
        console.warn(`[充电] ${port}口不一致：服务端活跃但硬件关闭，自动修复`)
        if (!this.driver.isOpen()) this.driver.prepareRuntime()
        await this.retryHardware(
          () => this.driver.startCharging(port),
          `${port}口自动修复上电`
        )
      } else if (!serverOn && hwOn) {
        // 硬件开着但服务端无活跃充电 → 修复关闭
        console.warn(`[充电] ${port}口不一致：硬件开启但服务端无活跃，自动修复`)
        this.driver.stopCharging(port)
      }
    }

    // 都没有活跃充电 → 关闭串口运行时
    if (serverActivePorts.size === 0 && this.driver.isOpen()) {
      this.driver.stopRuntime()
    }
  }

  /**
   * 自动停止充电（手机移除触发）。
   * 内部有防重入保护。
   */
  async autoStopCharging(port: 'left' | 'right'): Promise<void> {
    // 检查是否真的有活跃会话
    if (!this.activePortSet.has(port)) return
    // 防重入
    if (this.stoppingPorts.has(port)) return

    this.stoppingPorts.add(port)
    try {
      await this.stopCharging(port)
    } finally {
      this.stoppingPorts.delete(port)
    }
  }

  // ==================== 保活 ====================

  /** 仅在有活跃充电时才应调用 */
  sendKeepalive(): boolean {
    return this.driver.sendKeepalive()
  }

  // ==================== 生命周期 ====================

  /** 是否处于运行时状态 */
  get isRuntimeActive(): boolean {
    return this.driver.isOpen()
  }

  /** 完全释放硬件资源 */
  dispose(): void {
    this.autoStopEnabled = false
    this.activePortSet.clear()
    this.stoppingPorts.clear()
    this.onStatusChange = null
    this.driver.close()
  }
}

/** 获取默认 ChargingController 实例（按需创建） */
let defaultInstance: ChargingController | null = null

export function getChargingController(driver: SerialPortDriver): ChargingController {
  if (!defaultInstance) {
    defaultInstance = new ChargingController(driver)
  }
  return defaultInstance
}

/** 测试/替换用：重置默认实例 */
export function resetChargingController(): void {
  defaultInstance?.dispose()
  defaultInstance = null
}
