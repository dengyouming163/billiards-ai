/**
 * useCharging — 手机充电管理
 *
 * 职责: 充电 UI 状态 / 轮询 / 手机移除边沿检测 / 生命周期串联
 *
 * 核心变更 (Phase 2):
 *   - 不再直接调用 serial-port.ts 的 8 个底层函数
 *   - 通过 ChargingController 编排 API + 硬件操作
 *   - 硬件驱动通过依赖注入 (RealSerialPortDriver / MockSerialPortDriver)
 */
import { ref, computed, onUnmounted } from 'vue'
import { ChargingController } from '@/services/ChargingController'
import { RealSerialPortDriver } from '@/services/RealSerialPortDriver'
import type { SerialPortDriver } from '@/services/SerialPortDriver'
import type { PortStatus } from '@/utils/serial-protocol'
import { orderStore } from '@/stores/order'

export function useCharging(driver?: SerialPortDriver) {
  // ---- 硬件抽象层 ----
  const hw = driver || new RealSerialPortDriver()
  const controller = new ChargingController(hw)

  // ---- 状态 ----
  const showChargingModal = ref(false)
  const chargingEnabled = ref(false)
  const chargingFee = ref(0)
  const chargingActivePorts = ref(0)
  const chargingSessions = ref<any[]>([])
  let lastHardwareStatus: PortStatus | null = null

  /** 防重入：autoStop 进行中的端口 */
  const autoStoppingPorts = new Set<string>()
  let chargingPollTimer: ReturnType<typeof setInterval> | null = null

  // ---- 端口查询（纯 UI 逻辑保留在 composable） ----
  function getPortStatus(p: string): string {
    return chargingSessions.value.find((s: any) => s.port === p && s.status === 'active') ? 'active' : 'idle'
  }

  function getPortStatusText(p: string): string {
    return getPortStatus(p) === 'active' ? '充电中' : '空闲'
  }

  function getPortElapsed(p: string): string {
    const s = chargingSessions.value.find((s: any) => s.port === p)
    if (!s?.elapsed_seconds) return '00:00'
    const h = Math.floor(s.elapsed_seconds / 3600)
    const m = Math.floor((s.elapsed_seconds % 3600) / 60)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // ---- 配置与状态加载（委托给 controller） ----
  const chargingConfig = ref<Record<string, any>>({})

  async function loadChargingConfig(showToast = false): Promise<boolean> {
    const result = await controller.loadConfig()
    if (result) {
      chargingEnabled.value = result.enabled
      chargingConfig.value = result
      if (!result.enabled && showToast) {
        uni.showToast({ title: '充电功能未启用', icon: 'none' })
      }
      return result.enabled
    }
    chargingEnabled.value = false
    if (showToast) uni.showToast({ title: '充电配置加载失败', icon: 'none' })
    return false
  }

  const chargingBillingDesc = computed(() => {
    const cfg = chargingConfig.value
    if (!cfg || !cfg.enabled) return '充电功能未启用'
    const parts: string[] = []
    if (cfg.rate_per_hour > 0) parts.push(`¥${cfg.rate_per_hour}/半小时`)
    if (cfg.rate_per_minute > 0) parts.push(`¥${cfg.rate_per_minute}/分钟`)
    if (cfg.free_minutes > 0) parts.push(`前${cfg.free_minutes}分钟免费`)
    if (parts.length === 0) return '计费标准未配置'
    return '计费标准：' + parts.join('，')
  })

  async function loadChargingStatus() {
    const state = await controller.loadStatus()
    if (state) {
      chargingFee.value = state.total_fee ?? state.fee ?? 0
      chargingSessions.value = state.sessions || []
      chargingActivePorts.value = state.active_ports || state.activePorts || 0
    }
  }

  // ---- 充电控制（订单流程委托给 controller） ----

  async function startChargingPort(port: string) {
    try {
      await controller.startCharging(port as 'left' | 'right')
      uni.showToast({ title: '充电已启动', icon: 'success' })
      await loadChargingStatus()
    } catch (e: any) {
      uni.showToast({ title: e?.message || '启动失败', icon: 'none' })
    }
  }

  async function stopChargingPort(port: string) {
    try {
      await controller.stopCharging(port as 'left' | 'right')
      uni.showToast({ title: '充电已停止', icon: 'success' })
      await loadChargingStatus()
    } catch (e: any) {
      uni.showToast({ title: e?.message || '停止失败', icon: 'none' })
    }
  }

  /** 手机移除 → 自动断电（仅"已连接→断开"边沿触发） */
  async function autoStopChargingPort(port: string) {
    if (autoStoppingPorts.has(port)) return
    if (!controller.hasActiveSessions()) return

    autoStoppingPorts.add(port)
    try {
      await controller.autoStopCharging(port as 'left' | 'right')
      await loadChargingStatus()
    } catch {
      // 自动停止失败静默
    } finally {
      autoStoppingPorts.delete(port)
    }
  }

  // ---- 轮询 ----
  function startChargingPoll() {
    if (chargingPollTimer) clearInterval(chargingPollTimer)
    chargingPollTimer = setInterval(() => {
      loadChargingStatus()  // 始终轮询，保持首页充电卡片数据实时
      if (controller.hasActiveSessions()) controller.sendKeepalive()
    }, 5000)
  }

  // ---- 串口初始化 (仅 APP-PLUS) ----
  function initChargingSerial() {
    // #ifdef APP-PLUS
    const ok = controller.initHardware()
    if (!ok) {
      console.warn('[充电] 串口初始化失败')
      return
    }

    // 注册硬件状态回调：边沿检测 + 自动断电
    controller.setStatusChangeHandler((status: PortStatus) => {
      const prev = lastHardwareStatus

      // 边沿检测：已连接 → 断开
      if (prev?.leftPhone === true && status.leftPhone === false) {
        autoStopChargingPort('left')
      }
      if (prev?.rightPhone === true && status.rightPhone === false) {
        autoStopChargingPort('right')
      }

      lastHardwareStatus = { ...status }
    })
    // #endif
  }

  // ---- 生命周期入口 ----
  async function init() {
    await loadChargingConfig()
    startChargingPoll()
    initChargingSerial()
    // 启动时同步硬件与服务器状态
    setTimeout(() => controller.syncHardwareWithServer(), 1000)
  }

  /** 手动触发硬件同步（网络恢复后调用） */
  async function syncHardware() {
    await controller.syncHardwareWithServer()
  }

  function dispose() {
    if (chargingPollTimer) clearInterval(chargingPollTimer)
    chargingPollTimer = null
    controller.dispose()
  }

  return {
    // 状态
    showChargingModal, chargingEnabled, chargingFee, chargingActivePorts,
    chargingSessions,
    // 端口查询
    getPortStatus, getPortStatusText, getPortElapsed,
    // 操作
    startChargingPort, stopChargingPort,
    loadChargingConfig, loadChargingStatus, chargingConfig, chargingBillingDesc, syncHardware,
    // 生命周期
    init, dispose,
  }
}
