/**
 * OrderStore — 订单核心状态管理 (Phase 3 精简版)
 *
 * 职责：订单 CRUD + 计时器 + 离线计费
 * 拆分出的模块：cart.ts (购物车)、payment.ts (微信支付)
 */
import type { Order, OrderItem } from '@/types'
import { tabletApi } from '@/api/modules/tablet'
import { authStore } from './auth'
import { ref } from 'vue'
import { calculateFee, cacheBillingData, getCachedBillingData, type BillingCache } from '@/utils/offline-billing'
import { offlineCache } from '@/utils/offline-cache'

class OrderStore {
  order = ref<Order | null>(null)
  orderItems = ref<OrderItem[]>([])
  isLoading = ref(false)
  durationMinutes = ref(0)
  remainingMinutes = ref(0)
  timer: number | null = null

  tableStatus = ref<'idle' | 'occupied' | 'reserved' | 'maintenance'>('idle')
  tableNumber = ref('')
  tableHourlyRate = ref(0)

  offlineFee = ref(0)
  private billingCache: BillingCache | null = null

  // ==================== 桌台信息 ====================

  setTableInfo(info: { status?: string; name?: string; hourly_rate?: number | string }): void {
    if (info.status) this.tableStatus.value = info.status as any
    if (info.name) this.tableNumber.value = info.name
    if (info.hourly_rate) this.tableHourlyRate.value = Number(info.hourly_rate)
  }

  // ==================== 离线计费 ====================

  cacheBillingInfo(pricingInfo: any, startTime: string): void {
    this.billingCache = {
      start_time: startTime,
      base_rate: this.tableHourlyRate.value || 0,
      prepaid_hours: this.prepaidHours || 0,
      periods: pricingInfo?.periods || [],
      member_level: offlineCache.getMemberInfo()?.level || undefined,
    }
    cacheBillingData(this.billingCache)
  }

  loadBillingCache(): void {
    this.billingCache = getCachedBillingData()
    if (this.billingCache) {
      this.tableHourlyRate.value = this.billingCache.base_rate
    }
  }

  updateOfflineFee(): void {
    if (!this.billingCache) return
    this.offlineFee.value = calculateFee(this.billingCache, this.durationMinutes.value)
  }

  // ==================== 计算属性 ====================

  get isOrderActive(): boolean {
    return !!this.order.value && this.order.value.status === 'in_progress'
  }

  get orderId(): string {
    return String(this.order.value?.id || '')
  }

  get orderNo(): string {
    return this.order.value?.order_no || ''
  }

  get status(): string {
    return this.order.value?.status || 'idle'
  }

  get totalAmount(): number {
    return Number(this.order.value?.final_amount) || 0
  }

  get hourlyRate(): number {
    return Number(this.order.value?.hourly_rate) || 0
  }

  get currentRate(): number {
    return Number(this.order.value?.current_rate) || Number(this.order.value?.hourly_rate) || 0
  }

  get prepaidHours(): number {
    return Number(this.order.value?.prepaid_hours) || 0
  }

  get isPrepaid(): boolean {
    return this.prepaidHours > 0
  }

  get tableFee(): number {
    return Number(this.order.value?.table_fee) || 0
  }

  get productFee(): number {
    return Number(this.order.value?.product_fee) || 0
  }

  get assistantFee(): number {
    return Number(this.order.value?.assistant_fee) || 0
  }

  get hasAssistantItems(): boolean {
    return (this.orderItems.value || []).some((i: any) => i.item_type === 'assistant' && i.status !== 'cancelled')
  }

  get totalFee(): number {
    return this.tableFee + this.productFee + this.assistantFee + Number((this.order.value as any)?.chargingFee || this.order.value?.charging_fee || 0) + Number(this.order.value?.merge_fee || 0)
  }

  get formattedDuration(): string {
    const hours = Math.floor(this.durationMinutes.value / 60)
    const minutes = this.durationMinutes.value % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  get formattedRemaining(): string {
    const hours = Math.floor(this.remainingMinutes.value / 60)
    const minutes = this.remainingMinutes.value % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  // ==================== 订单 CRUD ====================

  async quickCreateOrder(playerCount: number = 2): Promise<any> {
    this.isLoading.value = true
    try {
      const order = await tabletApi.quickCreateOrder({
        table_id: String(authStore.tableId),
        player_count: playerCount,
      })
      // 确认模式：返回 {need_confirm, token, expires_at}
      if (order?.need_confirm) return order
      // 直接开台模式
      this.order.value = order as Order
      this.orderItems.value = (order as Order).items || []
      this.durationMinutes.value = Number((order as Order).duration_minutes) || 0
      this.startTimer()
      return order
    } catch {
      return null
    } finally {
      this.isLoading.value = false
    }
  }

  async prepaidCreateOrder(hours: number, playerCount: number = 2): Promise<Order | null> {
    this.isLoading.value = true
    try {
      const order = await tabletApi.prepaidCreateOrder({
        table_id: String(authStore.tableId),
        prepaid_hours: hours,
        player_count: playerCount,
      })
      this.order.value = order
      this.orderItems.value = order.items || []
      this.durationMinutes.value = Number(order.duration_minutes) || 0
      this.remainingMinutes.value = hours * 60
      this.startTimer()
      return order
    } catch {
      return null
    } finally {
      this.isLoading.value = false
    }
  }

  async getTableOrder(showLoading: boolean = false): Promise<Order | null> {
    try {
      const order = await tabletApi.getTableOrder(String(authStore.tableId), { showLoading })
      if (order && order.id) {
        this.order.value = order
        this.orderItems.value = order.items || []
        this.durationMinutes.value = Number(order.duration_minutes) || 0
        this.remainingMinutes.value = Number(order.remaining_minutes) || 0
        if (this.isOrderActive && !this.timer) {
          this.startTimer()
        }
        return order
      }
      // API 返回空 → 桌台已空闲（换台/关台），清空所有缓存
      console.log('[OrderStore] getTableOrder 返回空，重置状态')
      this.reset()
      return null
    } catch (e) {
      console.error('[OrderStore] getTableOrder 错误:', e)
      this.reset()
      return null
    }
  }

  async getOrderDetail(orderId: string): Promise<Order | null> {
    try {
      const order = await tabletApi.getOrder(orderId)
      this.order.value = order
      this.orderItems.value = order.items || []
      return order
    } catch {
      return null
    }
  }

  async checkout(payType: string = 'wechat'): Promise<boolean> {
    if (!this.orderId) return false
    this.isLoading.value = true
    try {
      await tabletApi.checkout({ order_id: this.orderId, pay_type: payType })
      this.reset()
      return true
    } catch {
      return false
    } finally {
      this.isLoading.value = false
    }
  }

  async closeOrder(): Promise<boolean> {
    if (!this.orderId) return false
    this.isLoading.value = true
    try {
      await tabletApi.closeOrder(this.orderId)
      this.reset()
      return true
    } catch {
      return false
    } finally {
      this.isLoading.value = false
    }
  }

  // ==================== 计时器 ====================

  private startTimer(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.durationMinutes.value++
      this.updateOfflineFee()
      if (this.isPrepaid && this.remainingMinutes.value > 0) {
        this.remainingMinutes.value--
      }
      if (this.isPrepaid && this.remainingMinutes.value === 0) {
        this.stopTimer()
      }
    }, 60000) as unknown as number
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async tick(): Promise<void> {
    if (!this.orderId) return
    try {
      const result = await tabletApi.tickOrder(this.orderId)
      this.durationMinutes.value = Number(result.duration_minutes) || 0
      if (result.remaining_minutes !== undefined) {
        this.remainingMinutes.value = Number(result.remaining_minutes) || 0
      }
      if (this.billingCache) {
        this.billingCache.base_rate = this.hourlyRate
        this.billingCache.prepaid_hours = this.prepaidHours
        cacheBillingData(this.billingCache)
      }
      this.updateOfflineFee()
    } catch { /* silent */ }
  }

  async getCurrentFee(): Promise<number> {
    if (!this.orderId) return 0
    try {
      const result = await tabletApi.getOrderFee(this.orderId)
      this.durationMinutes.value = Number(result.duration_minutes) || 0
      if (result.current_rate) {
        const orderData = this.order.value as any
        if (orderData) orderData.current_rate = result.current_rate
      }
      return Number(result.fee) || 0
    } catch {
      return 0
    }
  }

  reset(): void {
    this.stopTimer()
    this.order.value = null
    this.orderItems.value = []
    this.durationMinutes.value = 0
    this.remainingMinutes.value = 0
    this.tableStatus.value = 'idle'
    this.tableNumber.value = ''
    this.tableHourlyRate.value = 0
    this.offlineFee.value = 0
    this.billingCache = null
  }

  /** 换台/并台后桌台被释放 — 重置所有状态 */
  releaseTable(reason: string): void {
    console.log('[orderStore] 桌台释放: ' + reason)
    this.reset()
  }
}

export const orderStore = new OrderStore()
