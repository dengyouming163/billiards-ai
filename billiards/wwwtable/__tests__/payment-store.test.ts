/**
 * payment-store.test.ts — PaymentStore 单元测试
 * 对齐实际 PaymentStore API: state, reset(), prepare(), createAndPay()
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/api/modules/tablet', () => ({
  tabletApi: {
    preparePayment: vi.fn(),
    createPayment: vi.fn(),
    queryPayment: vi.fn(),
  },
}))

import { paymentStore } from '../src/stores/payment'
import { tabletApi } from '@/api/modules/tablet'

describe('PaymentStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    paymentStore.reset()
  })

  describe('initial state', () => {
    it('初始状态为 idle', () => {
      expect(paymentStore.state.value).toBe('idle')
      expect(paymentStore.qrCode.value).toBe('')
      expect(paymentStore.paymentId.value).toBe('')
      expect(paymentStore.amount.value).toBe(0)
    })
  })

  describe('prepare', () => {
    it('成功准备支付 → 状态变为 preparing', async () => {
      vi.mocked(tabletApi.preparePayment).mockResolvedValue({
        token: 'tok-001', amount: 100, breakdown: {}, expires_at: '',
      })

      const ok = await paymentStore.prepare('order-001')

      expect(ok).toBe(true)
      expect(paymentStore.state.value).toBe('preparing')
      expect(paymentStore.token.value).toBe('tok-001')
      expect(paymentStore.amount.value).toBe(100)
    })

    it('prepare 失败 → 返回 false', async () => {
      vi.mocked(tabletApi.preparePayment).mockRejectedValue(new Error('fail'))

      const ok = await paymentStore.prepare('order-001')

      expect(ok).toBe(false)
      expect(paymentStore.state.value).toBe('idle')
    })
  })

  describe('reset', () => {
    it('清除后所有状态复位', async () => {
      vi.mocked(tabletApi.preparePayment).mockResolvedValue({
        token: 'tok-003', amount: 50, breakdown: {}, expires_at: '',
      })
      await paymentStore.prepare('order-003')

      paymentStore.reset()

      expect(paymentStore.state.value).toBe('idle')
      expect(paymentStore.qrCode.value).toBe('')
      expect(paymentStore.paymentId.value).toBe('')
      expect(paymentStore.amount.value).toBe(0)
    })

    it('idle 状态下 reset 无副作用', () => {
      paymentStore.reset()
      expect(paymentStore.state.value).toBe('idle')
    })
  })

  describe('isActive', () => {
    it('idle 状态下 isActive=false', () => {
      expect(paymentStore.isActive).toBe(false)
    })
  })
})
