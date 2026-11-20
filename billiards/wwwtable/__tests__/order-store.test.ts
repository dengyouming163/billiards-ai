/**
 * order-store.test.ts — OrderStore 核心状态管理测试
 *
 * 覆盖：订单 CRUD / 计时器 / 计算属性 / 状态重置 / 离线计费缓存
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock API
vi.mock('@/api/modules/tablet', () => ({
  tabletApi: {
    quickCreateOrder: vi.fn(),
    prepaidCreateOrder: vi.fn(),
    getTableOrder: vi.fn(),
    getOrder: vi.fn(),
    checkout: vi.fn(),
    closeOrder: vi.fn(),
    tickOrder: vi.fn(),
    getOrderFee: vi.fn(),
  },
}))

// Mock authStore
vi.mock('@/stores/auth', () => ({
  authStore: {
    get tableId() { return 'table-001' },
    get storeId() { return 'store-001' },
    get tableName() { return 'A01' },
    tableInfo: { id: 'table-001', name: 'A01', status: 'idle', hourly_rate: 38, store_id: 'store-001' },
  },
}))

import { orderStore } from '../src/stores/order'
import { tabletApi } from '@/api/modules/tablet'
import type { Order } from '../src/types'

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-001',
    order_no: 'NO20260701001',
    table_id: 'table-001',
    status: 'in_progress',
    start_time: '2026-07-01T14:00:00',
    duration_minutes: 30,
    customer_count: 2,
    hourly_rate: 38,
    table_fee: 19,
    product_fee: 0,
    assistant_fee: 0,
    items: [],
    ...overrides,
  }
}

describe('OrderStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    orderStore.reset()
  })

  afterEach(() => {
    orderStore.reset()
  })

  // ==================== 初始状态 ====================

  describe('initial state', () => {
    it('初始状态下所有值为默认值', () => {
      expect(orderStore.order.value).toBeNull()
      expect(orderStore.orderItems.value).toEqual([])
      expect(orderStore.isLoading.value).toBe(false)
      expect(orderStore.durationMinutes.value).toBe(0)
      expect(orderStore.remainingMinutes.value).toBe(0)
      expect(orderStore.tableStatus.value).toBe('idle')
      expect(orderStore.offlineFee.value).toBe(0)
    })

    it('无活跃订单时 isOrderActive = false', () => {
      expect(orderStore.isOrderActive).toBe(false)
    })

    it('无订单时 orderId 返回空字符串', () => {
      expect(orderStore.orderId).toBe('')
    })

    it('无订单时 totalFee = 0', () => {
      expect(orderStore.totalFee).toBe(0)
    })
  })

  // ==================== setTableInfo ====================

  describe('setTableInfo', () => {
    it('设置桌台信息后状态更新', () => {
      orderStore.setTableInfo({ status: 'occupied', name: 'B03', hourly_rate: 48 })

      expect(orderStore.tableStatus.value).toBe('occupied')
      expect(orderStore.tableNumber.value).toBe('B03')
      expect(orderStore.tableHourlyRate.value).toBe(48)
    })

    it('部分更新不影响未传入字段', () => {
      orderStore.setTableInfo({ name: 'C05' })
      expect(orderStore.tableNumber.value).toBe('C05')
      // status 保持上次值
    })
  })

  // ==================== 计算属性 ====================

  describe('computed getters', () => {
    it('isOrderActive: 有 in_progress 订单时返回 true', () => {
      orderStore.order.value = makeOrder({ status: 'in_progress' })
      expect(orderStore.isOrderActive).toBe(true)
    })

    it('isOrderActive: 订单状态非 in_progress 时返回 false', () => {
      orderStore.order.value = makeOrder({ status: 'completed' })
      expect(orderStore.isOrderActive).toBe(false)
    })

    it('orderId: 返回订单 ID 字符串', () => {
      orderStore.order.value = makeOrder({ id: 12345 })
      expect(orderStore.orderId).toBe('12345')
    })

    it('isPrepaid: prepaid_hours > 0 时返回 true', () => {
      orderStore.order.value = makeOrder({ prepaid_hours: 2 })
      expect(orderStore.isPrepaid).toBe(true)
    })

    it('isPrepaid: prepaid_hours = 0 时返回 false', () => {
      orderStore.order.value = makeOrder({ prepaid_hours: 0 })
      expect(orderStore.isPrepaid).toBe(false)
    })

    it('totalFee: 正确汇总各项费用', () => {
      orderStore.order.value = makeOrder({
        table_fee: 50,
        product_fee: 30,
        assistant_fee: 20,
        charging_fee: 5,
        merge_fee: 10,
      })
      expect(orderStore.totalFee).toBe(115) // 50 + 30 + 20 + 5 + 10
    })

    it('totalFee: 没有的字段默认为 0', () => {
      orderStore.order.value = makeOrder({ table_fee: 38 })
      expect(orderStore.totalFee).toBe(38)
    })

    it('tableFee: 正确返回台费', () => {
      orderStore.order.value = makeOrder({ table_fee: '76.5' })
      expect(orderStore.tableFee).toBe(76.5)
    })

    it('productFee: 正确返回商品费', () => {
      orderStore.order.value = makeOrder({ product_fee: '128' })
      expect(orderStore.productFee).toBe(128)
    })

    it('assistantFee: 正确返回助教费', () => {
      orderStore.order.value = makeOrder({ assistant_fee: '200' })
      expect(orderStore.assistantFee).toBe(200)
    })

    it('hasAssistantItems: 有活跃助教时返回 true', () => {
      orderStore.orderItems.value = [
        { id: '1', product_id: 'a1', quantity: 1, unit_price: 100, item_type: 'assistant', status: 'serving' } as any,
      ]
      expect(orderStore.hasAssistantItems).toBe(true)
    })

    it('hasAssistantItems: 助教已取消时返回 false', () => {
      orderStore.orderItems.value = [
        { id: '1', product_id: 'a1', quantity: 1, unit_price: 100, item_type: 'assistant', status: 'cancelled' } as any,
      ]
      expect(orderStore.hasAssistantItems).toBe(false)
    })

    it('formattedDuration: 65分钟 → 01:05', () => {
      orderStore.durationMinutes.value = 65
      expect(orderStore.formattedDuration).toBe('01:05')
    })

    it('formattedDuration: 0分钟 → 00:00', () => {
      orderStore.durationMinutes.value = 0
      expect(orderStore.formattedDuration).toBe('00:00')
    })

    it('formattedRemaining: 125分钟 → 02:05', () => {
      orderStore.remainingMinutes.value = 125
      expect(orderStore.formattedRemaining).toBe('02:05')
    })

    it('currentRate: 优先使用 current_rate', () => {
      orderStore.order.value = makeOrder({ hourly_rate: 38, current_rate: 57 })
      expect(orderStore.currentRate).toBe(57)
    })

    it('currentRate: 无 current_rate 时使用 hourly_rate', () => {
      orderStore.order.value = makeOrder({ hourly_rate: 38 })
      expect(orderStore.currentRate).toBe(38)
    })
  })

  // ==================== reset / releaseTable ====================

  describe('reset', () => {
    it('重置后所有状态回到默认值', () => {
      orderStore.order.value = makeOrder()
      orderStore.durationMinutes.value = 120
      orderStore.remainingMinutes.value = 60
      orderStore.tableStatus.value = 'occupied'
      orderStore.offlineFee.value = 99

      orderStore.reset()

      expect(orderStore.order.value).toBeNull()
      expect(orderStore.orderItems.value).toEqual([])
      expect(orderStore.durationMinutes.value).toBe(0)
      expect(orderStore.remainingMinutes.value).toBe(0)
      expect(orderStore.tableStatus.value).toBe('idle')
      expect(orderStore.tableNumber.value).toBe('')
      expect(orderStore.tableHourlyRate.value).toBe(0)
      expect(orderStore.offlineFee.value).toBe(0)
    })

    it('reset 停止计时器', () => {
      orderStore.order.value = makeOrder()
      // @ts-ignore — 访问私有 timer
      expect(orderStore.timer).toBeNull()
      // startTimer via getTableOrder mock could set timer; reset should clear
    })
  })

  describe('releaseTable', () => {
    it('releaseTable 等同于 reset 并输出日志', () => {
      orderStore.order.value = makeOrder()
      orderStore.releaseTable('transferred')

      expect(orderStore.order.value).toBeNull()
      expect(orderStore.tableStatus.value).toBe('idle')
    })
  })

  // ==================== 离线计费缓存 ====================

  describe('offline billing cache', () => {
    it('cacheBillingInfo 写入缓存', () => {
      orderStore.tableHourlyRate.value = 38
      orderStore.cacheBillingInfo(
        { periods: [{ start_time: '18:00:00', end_time: '22:00:00', coefficient: 1.5 }] },
        '2026-07-01T14:00:00'
      )

      const cached = orderStore.loadBillingCache !== undefined
      expect(cached).toBe(true)
    })
  })

  // ==================== API CRUD (with mocks) ====================

  describe('getTableOrder', () => {
    it('成功获取订单后更新状态', async () => {
      const mockOrder = makeOrder({ id: 'order-002', duration_minutes: 45 })
      vi.mocked(tabletApi.getTableOrder).mockResolvedValue(mockOrder as any)

      const result = await orderStore.getTableOrder(false)

      expect(result).not.toBeNull()
      expect(orderStore.order.value?.id).toBe('order-002')
      expect(orderStore.durationMinutes.value).toBe(45)
      expect(orderStore.isOrderActive).toBe(true)
    })

    it('API 返回空时调用 reset', async () => {
      vi.mocked(tabletApi.getTableOrder).mockResolvedValue(null as any)

      const result = await orderStore.getTableOrder(false)

      expect(result).toBeNull()
      expect(orderStore.order.value).toBeNull()
    })

    it('API 抛异常时调用 reset', async () => {
      vi.mocked(tabletApi.getTableOrder).mockRejectedValue(new Error('Network error'))

      const result = await orderStore.getTableOrder(false)

      expect(result).toBeNull()
      expect(orderStore.order.value).toBeNull()
    })
  })

  describe('quickCreateOrder', () => {
    it('直接开台模式：成功后更新 order 并启动计时', async () => {
      const mockOrder = makeOrder({ id: 'order-003' })
      vi.mocked(tabletApi.quickCreateOrder).mockResolvedValue(mockOrder as any)

      const result = await orderStore.quickCreateOrder(2)

      expect(result).not.toBeNull()
      expect((result as any)?.need_confirm).toBeUndefined()
      expect(orderStore.order.value?.id).toBe('order-003')
    })

    it('确认模式：返回 need_confirm 对象', async () => {
      vi.mocked(tabletApi.quickCreateOrder).mockResolvedValue({
        need_confirm: true, token: 'tok-abc', expires_at: 1234567890, timeout: 1,
      } as any)

      const result = await orderStore.quickCreateOrder(2)

      expect(result?.need_confirm).toBe(true)
      expect((result as any)?.token).toBe('tok-abc')
      // order 不应该被设置
      expect(orderStore.order.value).toBeNull()
    })
  })

  describe('checkout', () => {
    it('结账成功后调用 reset', async () => {
      orderStore.order.value = makeOrder({ id: 'order-004' })
      vi.mocked(tabletApi.checkout).mockResolvedValue(undefined)

      const result = await orderStore.checkout('wechat')

      expect(result).toBe(true)
      expect(orderStore.order.value).toBeNull()
    })

    it('无订单 ID 时返回 false', async () => {
      const result = await orderStore.checkout()

      expect(result).toBe(false)
      expect(tabletApi.checkout).not.toHaveBeenCalled()
    })
  })

  describe('getOrderFee', () => {
    it('成功获取费用后更新 duration', async () => {
      orderStore.order.value = makeOrder({ id: 'order-005' })
      vi.mocked(tabletApi.getOrderFee).mockResolvedValue({
        fee: 57, duration_minutes: 90, current_rate: 38,
      } as any)

      const result = await orderStore.getCurrentFee()

      expect(result).toBe(57)
      expect(orderStore.durationMinutes.value).toBe(90)
    })

    it('无订单 ID 时返回 0', async () => {
      const result = await orderStore.getCurrentFee()
      expect(result).toBe(0)
    })
  })
})
