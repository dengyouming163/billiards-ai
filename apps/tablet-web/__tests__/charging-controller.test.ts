/**
 * charging-controller.test.ts — ChargingController 集成测试
 *
 * 使用 MockSerialPortDriver 验证业务编排逻辑：
 *   API 调用先后顺序 / 错误传播 / autoStop / 运行时生命周期
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChargingController } from '../src/services/ChargingController'
import { MockSerialPortDriver } from '../src/services/MockSerialPortDriver'

// ========== Mock 外部依赖 ==========

vi.mock('@/api', () => ({
  tabletApi: {
    getChargingConfig: vi.fn(),
    getChargingStatus: vi.fn(),
    startCharging: vi.fn(),
    stopCharging: vi.fn(),
  },
}))

vi.mock('@/stores/order', () => ({
  orderStore: {
    get orderId() { return 'order-001' },
  },
}))

vi.mock('@/stores/auth', () => ({
  authStore: {
    get tableId() { return 'table-001' },
  },
}))

import { tabletApi } from '@/api'
import { orderStore } from '@/stores/order'

// ========== 测试套 ==========

describe('ChargingController', () => {
  let controller: ChargingController
  let driver: MockSerialPortDriver

  beforeEach(() => {
    vi.clearAllMocks()
    driver = new MockSerialPortDriver()
    controller = new ChargingController(driver)
    driver.init(() => {})
  })

  // ========== 初始化 ==========

  describe('initHardware', () => {
    it('初始化成功', () => {
      const d = new MockSerialPortDriver()
      const ctrl = new ChargingController(d)
      expect(ctrl.initHardware()).toBe(true)
      expect(d.isOpen()).toBe(true)
    })

    it('初始化后 status handler 可接收回调', () => {
      const d = new MockSerialPortDriver()
      const ctrl = new ChargingController(d)
      ctrl.initHardware()

      const statuses: any[] = []
      ctrl.setStatusChangeHandler((s) => statuses.push(s))

      d.simulatePhoneChange(true, false)
      expect(statuses).toHaveLength(1)
      expect(statuses[0].leftPhone).toBe(true)
      expect(statuses[0].rightPhone).toBe(false)
    })
  })

  // ========== 充电启停 ==========

  describe('startCharging', () => {
    it('正常情况下: API → prepareRuntime → startCharging(left)', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)

      await controller.startCharging('left')

      // 验证命令顺序
      const cmds = driver.commandLog
      const prepIdx = cmds.indexOf('prepareRuntime')
      const startIdx = cmds.indexOf('start:left')
      expect(prepIdx).toBeLessThan(startIdx, 'prepareRuntime 必须先于 startCharging')
      expect(driver.isRuntimePrepared).toBe(true)
    })

    it('API 调用参数正确', async () => {
      const startCharging = vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)

      await controller.startCharging('right')

      expect(startCharging).toHaveBeenCalledWith({
        order_id: 'order-001',
        table_id: 'table-001',
        port: 'right',
      })
    })

    it('启动后 hasActiveSessions 返回 true', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      await controller.startCharging('left')
      expect(controller.hasActiveSessions()).toBe(true)
    })

    it('prepareRuntime 失败 → 抛错且不调用 startCharging 硬件', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      vi.mocked(tabletApi.stopCharging).mockResolvedValue(undefined)

      // 让 driver.prepareRuntime 返回 false
      const badDriver = new MockSerialPortDriver()
      badDriver.init(() => {})
      const failPrepare: any = {
        ...badDriver,
        prepareRuntime: () => false,
      }
      const ctrl = new ChargingController(failPrepare)

      await expect(ctrl.startCharging('left')).rejects.toThrow('充电运行环境准备失败')
    })
  })

  describe('stopCharging', () => {
    beforeEach(async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      vi.mocked(tabletApi.stopCharging).mockResolvedValue(undefined)
      await controller.startCharging('left')
      driver.resetCommands()
    })

    it('正常情况下: API → stopCharging(left)', async () => {
      await controller.stopCharging('left')

      const cmds = driver.commandLog
      expect(cmds).toContain('stop:left')
    })

    it('单端口停止后 hasActiveSessions 返回 false', async () => {
      await controller.stopCharging('left')
      expect(controller.hasActiveSessions()).toBe(false)
    })

    it('所有端口停止后自动调用 stopRuntime', async () => {
      await controller.stopCharging('left')

      const cmds = driver.commandLog
      expect(cmds).toContain('stopRuntime')
      expect(driver.isRuntimePrepared).toBe(false)
    })

    it('还有活跃端口时不调用 stopRuntime', async () => {
      // 先启动两个端口
      await controller.startCharging('left')
      driver.mockStatus.leftCharging = true
      await controller.startCharging('right')
      driver.mockStatus.rightCharging = true
      driver.resetCommands()

      // 只停一个
      await controller.stopCharging('left')

      expect(driver.commandLog).not.toContain('stopRuntime')
    })
  })

  // ========== 自动停止 ==========

  describe('autoStopCharging', () => {
    it('无活跃会话 → 无操作', async () => {
      vi.mocked(tabletApi.stopCharging).mockResolvedValue(undefined)

      await controller.autoStopCharging('left')

      // stopCharging API 不应该被调用
      expect(tabletApi.stopCharging).not.toHaveBeenCalled()
    })

    it('有活跃会话 → 正常停止', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      vi.mocked(tabletApi.stopCharging).mockResolvedValue(undefined)

      await controller.startCharging('left')
      driver.resetCommands()

      await controller.autoStopCharging('left')

      expect(tabletApi.stopCharging).toHaveBeenCalledWith({
        order_id: 'order-001',
        port: 'left',
      })
      expect(driver.commandLog).toContain('stop:left')
    })

    it('同一端口并发 autoStop → 防重入（只执行一次）', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      vi.mocked(tabletApi.stopCharging).mockResolvedValue(undefined)

      await controller.startCharging('left')

      // 并发两个 autoStop
      await Promise.all([
        controller.autoStopCharging('left'),
        controller.autoStopCharging('left'),
      ])

      // start:left (setMock) + stop:left (1次)
      // 因为第二次 autoStop 被防重入拦截
      const stopCommands = driver.commandLog.filter(c => c === 'stop:left')
      expect(stopCommands).toHaveLength(1)
    })
  })

  // ========== 保活 ==========

  describe('sendKeepalive', () => {
    it('发送保活命令', () => {
      controller.sendKeepalive()
      expect(driver.commandLog).toContain('keepalive')
    })
  })

  // ========== 运行时状态 ==========

  describe('isRuntimeActive', () => {
    it('初始化后返回 true', () => {
      expect(controller.isRuntimeActive).toBe(true)
    })

    it('dispose 后返回 false', () => {
      controller.dispose()
      expect(controller.isRuntimeActive).toBe(false)
    })
  })

  // ========== dispose ==========

  describe('dispose', () => {
    it('完全清理: close 驱动 + 清空内部状态', async () => {
      vi.mocked(tabletApi.startCharging).mockResolvedValue(undefined)
      await controller.startCharging('left')

      controller.dispose()

      expect(driver.commandLog).toContain('close')
      expect(driver.isOpen()).toBe(false)
      expect(controller.hasActiveSessions()).toBe(false)
      expect(controller.isRuntimeActive).toBe(false)
    })
  })
})
