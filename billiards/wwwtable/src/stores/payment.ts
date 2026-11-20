/**
 * PaymentStore — 微信扫码支付状态管理
 *
 * 从 bill/index.vue 内联逻辑提取，统一支付生命周期：
 *   创建 NATIVE 支付 → 显示二维码 → 3秒轮询 → paid/failed
 *
 * 不依赖 UI 框架，可在 Node 环境测试（需 mock tabletApi）
 */
import { ref } from 'vue'
import { tabletApi } from '@/api/modules/tablet'

export type PayState = 'idle' | 'preparing' | 'waiting' | 'paid' | 'failed' | 'expired'

class PaymentStore {
  state = ref<PayState>('idle')
  token = ref('')
  amount = ref(0)
  qrCode = ref('')
  paymentId = ref('')
  countdown = ref(0)
  errorMsg = ref('')

  private timer: any = null
  private pollTimer: any = null

  get isActive() { return this.state.value === 'preparing' || this.state.value === 'waiting' }

  async prepare(orderId: string): Promise<boolean> {
    this.reset()
    try {
      const res = await tabletApi.preparePayment(orderId)
      this.token.value = res.token
      this.amount.value = res.amount
      this.state.value = 'preparing'
      return true
    } catch (e: any) {
      this.errorMsg.value = e?.message || '准备结算失败'
      return false
    }
  }

  async createAndPay(orderId: string): Promise<boolean> {
    if (this.state.value !== 'preparing') return false
    try {
      const res = await tabletApi.createPayment({
        order_id: orderId,
        token: this.token.value,
        channel: 'wechat',
        trade_type: 'NATIVE',
        amount: this.amount.value,
        description: `台桌消费 ¥${this.amount.value}`,
      })
      this.paymentId.value = res.payment_id
      this.qrCode.value = (() => { const u = res.qr_code || res.pay_url || ''; return u ? `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(u)}` : '' })()
      this.state.value = 'waiting'
      this.startCountdown()
      this.startPolling(orderId)
      return true
    } catch (e: any) {
      this.state.value = 'failed'
      this.errorMsg.value = e?.message || '创建支付失败'
      return false
    }
  }

  private startCountdown() {
    this.countdown.value = 300
    this.timer = setInterval(() => {
      this.countdown.value--
      if (this.countdown.value <= 0) {
        clearInterval(this.timer)
        this.timer = null
        this.state.value = 'expired'
      }
    }, 1000)
  }

  private startPolling(orderId: string) {
    this.pollTimer = setInterval(async () => {
      try {
        const res = await tabletApi.queryPayment(orderId)
        if (res.status === 'paid') { this.state.value = 'paid'; this.stopAll() }
        else if (res.status === 'failed') { this.state.value = 'failed'; this.stopAll() }
      } catch { /* retry */ }
    }, 2000)
  }

  markPaid() { this.state.value = 'paid'; this.stopAll() }

  reset() {
    this.stopAll()
    this.state.value = 'idle'
    this.token.value = ''; this.amount.value = 0; this.qrCode.value = ''; this.paymentId.value = ''
    this.countdown.value = 0; this.errorMsg.value = ''
  }

  private stopAll() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null }
  }
}

export const paymentStore = new PaymentStore()
