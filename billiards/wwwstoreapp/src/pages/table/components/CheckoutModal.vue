<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <!-- Header -->
      <view class="modal-header">
        <text class="modal-title">结账 · {{ tableName }}</text>
        <text v-if="durationStr" class="modal-sub">已用 {{ durationStr }}</text>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="billLoading" class="center-hint"><text>加载中...</text></view>
        <template v-else>
          <!-- ===== 1. 应付金额 ===== -->
          <view class="card card-amount">
            <text class="card-label">应付金额</text>
            <text class="card-amount-value">¥{{ finalAmount.toFixed(2) }}</text>
            <text v-if="countdown > 0" class="card-amount-timer" :class="countdown <= 10 ? 'timer-warn' : ''">金额锁定 {{ countdown }}s</text>
            <view v-if="discountAmount > 0 || roundingAmount > 0" class="card-amount-detail">
              <view class="amount-detail-row"><text>应收合计</text><text>¥{{ payableAmount.toFixed(2) }}</text></view>
              <view v-if="discountAmount > 0" class="amount-detail-row discount"><text>优惠折扣</text><text>-¥{{ discountAmount.toFixed(2) }}</text></view>
              <view v-if="roundingAmount > 0" class="amount-detail-row rounding"><text>抹零</text><text>-¥{{ roundingAmount.toFixed(2) }}</text></view>
            </view>
          </view>

          <!-- ===== 2. 套餐券 ===== -->
          <view v-if="hasPrepaid" class="card card-coupon">
            <text class="coupon-title">🎫 套餐券 · 台费 ¥0</text>
            <text class="coupon-detail">预付{{ prepaidHours }}小时 · 剩余{{ remainingMinutes }}分钟</text>
          </view>

          <!-- ===== 折扣 + 抹零 ===== -->
          <view class="card card-discounts">
            <text class="card-title">优惠与抹零</text>
            <view class="discount-list">
              <view
                v-for="d in discountOptions"
                :key="d.id"
                class="discount-chip"
                :class="{ active: selectedDiscountId === d.id }"
                @click="selectedDiscountId = d.id"
              >{{ d.discount_name }}</view>
            </view>
            <view class="rounding-row">
              <view class="rounding-info">
                <text class="rounding-icon">🧾</text>
                <view>
                  <text class="rounding-label">抹零</text>
                  <text class="rounding-amount">-¥{{ roundingAmount.toFixed(2) }}</text>
                </view>
              </view>
              <switch :checked="useRounding" @change="useRounding = !useRounding" color="#059669" />
            </view>
          </view>

          <!-- ===== 4. 会员余额（优先抵扣） ===== -->
          <view class="card card-balance">
            <text class="card-title">会员余额</text>
            <view v-if="memberInfo" class="balance-member-row">
              <view class="balance-avatar">{{ (memberInfo.name || '?')[0] }}</view>
              <view class="balance-member-info">
                <text class="balance-member-name">{{ memberInfo.name }}</text>
                <text class="balance-member-balance">余额 ¥{{ memberBalance.toFixed(2) }}</text>
              </view>
              <switch :checked="useBalance" @change="useBalance = !useBalance" color="#6366f1" />
            </view>
            <view v-else class="balance-empty">
              <text class="balance-empty-text">未绑定会员，无法使用余额抵扣</text>
            </view>
            <view v-if="useBalance && memberBalance > 0" class="balance-deduction-card">
              <text class="balance-deduction-label">余额抵扣</text>
              <text class="balance-deduction-value">-¥{{ balanceDeduction.toFixed(2) }}</text>
              <text v-if="memberBalance < finalAmount" class="balance-insufficient">
                余额不足，剩余 <text class="balance-remain">¥{{ remainingAfterBalance.toFixed(2) }}</text> 需现金支付
              </text>
            </view>
          </view>

          <!-- ===== 5. 现金收款（金额固定，不可修改） ===== -->
          <view v-if="remainingAfterBalance > 0" class="card card-cash">
            <text class="card-title">{{ balanceDeduction > 0 ? '现金补收' : '现金收款' }}</text>
            <text class="cash-amount-label">应付金额</text>
            <text class="cash-amount-fixed">¥{{ remainingAfterBalance.toFixed(2) }}</text>
          </view>

          <!-- ===== 6. 结算按钮 ===== -->
          <button class="btn-checkout" :disabled="processing || finalAmount < 0" @click="handleCheckout">
            {{ processing ? '结算中...' : checkoutLabel }}
          </button>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getCurrentOrder, checkoutOrder, getDiscountList } from '@/api/modules/table'
import type { DiscountItem } from '@/api/modules/table'
import { authStore } from '@/stores/auth'

const props = defineProps<{ visible: boolean; tableId: string; tableName: string }>()
const emit = defineEmits(['close', 'completed'])

interface BillData {
  id?: string
  durationMinutes?: number; duration_minutes?: number
  tableFee?: number; table_fee?: number
  mergeFee?: number; merge_fee?: number
  productFee?: number; product_fee?: number
  assistantFee?: number; assistant_fee?: number
  chargingFee?: number; charging_fee?: number
  prepaidHours?: number; prepaid_hours?: number
  remainingMinutes?: number; remaining_minutes?: number
  payableAmount?: number; payable_amount?: number
  memberInfo?: { name?: string; balance?: number }
  member_info?: { name?: string; balance?: number }
}

const billData = ref<BillData | null>(null)
const billLoading = ref(true)
const processing = ref(false)
const billLockedAt = ref('')
const countdown = ref(60)
let countdownTimer: ReturnType<typeof setInterval> | null = null
const tableFee = computed(() => billData.value?.tableFee || billData.value?.table_fee || 0)
const productFee = computed(() => billData.value?.productFee || billData.value?.product_fee || 0)
const assistantFee = computed(() => billData.value?.assistantFee || billData.value?.assistant_fee || 0)
const chargingFee = computed(() => billData.value?.chargingFee || billData.value?.charging_fee || 0)
const mergeFee = computed(() => billData.value?.mergeFee || billData.value?.merge_fee || 0)
const total = computed(() => tableFee.value + productFee.value + assistantFee.value + chargingFee.value + mergeFee.value)

const payableAmount = computed(() => {
  const v = billData.value?.payable_amount ?? billData.value?.payableAmount
  return v !== undefined && v !== null ? Number(v) : total.value
})

const memberInfo = computed(() => billData.value?.memberInfo || billData.value?.member_info || null)
const memberBalance = computed(() => Number(memberInfo.value?.balance || 0))
const hasPrepaid = computed(() => (billData.value?.prepaidHours || billData.value?.prepaid_hours || 0) > 0)
const prepaidHours = computed(() => billData.value?.prepaidHours || billData.value?.prepaid_hours || 0)
const remainingMinutes = computed(() => Math.max(0, billData.value?.remainingMinutes || billData.value?.remaining_minutes || 0))

// 折扣 — 后台 API 返回字段: discount_name, discount_type, discount_value, id, rounding_mode
const discountOptions = ref<DiscountItem[]>([{ id: '', discount_name: '无折扣', discount_type: '', discount_value: 0 }])
const selectedDiscountId = ref('')

const activeDiscount = computed(() => discountOptions.value.find(d => d.id === selectedDiscountId.value))
const discountAmount = computed(() => {
  const d = activeDiscount.value
  if (!d || !d.discount_value) return 0
  if (d.discount_type === 'rate') {
    return Math.round((payableAmount.value || total.value) * (100 - d.discount_value)) / 100
  }
  return Math.min(Number(d.discount_value), payableAmount.value || total.value)
})

const useRounding = ref(false)
const roundingAmount = computed(() => {
  if (!useRounding.value) return 0
  return parseFloat((payableAmount.value % 1).toFixed(2))
})

const finalAmount = computed(() => {
  const val = payableAmount.value - discountAmount.value - roundingAmount.value
  return val > 0 ? val : 0
})

const useBalance = ref(true)
const balanceDeduction = computed(() => {
  if (!useBalance.value || memberBalance.value <= 0 || !memberInfo.value) return 0
  return Math.min(memberBalance.value, finalAmount.value)
})
const remainingAfterBalance = computed(() => Math.max(0, finalAmount.value - balanceDeduction.value))

const checkoutLabel = computed(() => {
  if (balanceDeduction.value > 0 && remainingAfterBalance.value > 0) {
    return `余额 -¥${balanceDeduction.value.toFixed(2)} + 现金 ¥${remainingAfterBalance.value.toFixed(2)} → 确认结算`
  }
  if (balanceDeduction.value > 0) {
    return `全额余额支付 ¥${finalAmount.value.toFixed(2)} → 确认结算`
  }
  return `现金结算 ¥${finalAmount.value.toFixed(2)} → 确认结算`
})

const durationStr = computed(() => {
  const d = billData.value?.durationMinutes || billData.value?.duration_minutes || 0
  if (!d) return ''
  return `${Math.floor(d / 60)}小时${d % 60}分`
})

function startCountdown() {
  clearInterval(countdownTimer as any)
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer as any)
      loadBill()
    }
  }, 1000)
}

async function loadBill() {
  if (!props.tableId) return
  billLoading.value = true
  try {
    const data = await getCurrentOrder(props.tableId) as unknown as BillData
    billData.value = data
    billLockedAt.value = (data as any)?.bill_locked_at || (data as any)?.billLockedAt || ''
    startCountdown()
  } catch { billData.value = null }
  finally { billLoading.value = false }
}

async function loadDiscounts() {
  try {
    const list = await getDiscountList()
    if (list && list.length > 0) {
      discountOptions.value = [{ id: '', discount_name: '无折扣', discount_type: '', discount_value: 0 }, ...list.filter((d: any) => d.status === 1)]
    }
  } catch {}
}

watch(() => props.visible, (v) => {
  if (v) {
    loadBill()
    loadDiscounts()
    selectedDiscountId.value = ''
    useRounding.value = false
    useBalance.value = true
  } else {
    clearInterval(countdownTimer as any)
    countdown.value = 60
  }
})

async function handleCheckout() {
  if (processing.value || finalAmount.value < 0) return
  const oid = billData.value?.id || ''
  if (!oid) {
    uni.showToast({ title: '获取订单信息失败', icon: 'none' })
    return
  }

  processing.value = true
  try {
    const payAmount = remainingAfterBalance.value
    const channel = remainingAfterBalance.value <= 0 ? 'member_balance' : 'cash'

    const params: Record<string, any> = {
      order_id: oid,
      pay_type: channel,
      pay_amount: finalAmount.value,
      cash_paid: 0,
      wechat_paid: 0,
      alipay_paid: 0,
      balance_paid: balanceDeduction.value,
      card_paid: 0,
      ...(channel === 'cash' && remainingAfterBalance.value > 0 ? { cash_paid: payAmount } : {}),
      discount: discountAmount.value,
      discount_type: activeDiscount.value?.discount_type || null,
      discount_value: activeDiscount.value?.discount_value || null,
      rounding_mode: useRounding.value ? 'yuan' : 'none',
      rounding_amount: roundingAmount.value,
      bill_locked_at: billLockedAt.value,
      operator_id: String(authStore.userInfo?.id || ''),
      operator_name: authStore.userInfo?.name || '',
      channel,
      remark: '',
    }

    await checkoutOrder(params)
    uni.showToast({ title: '结账成功', icon: 'success' })
    emit('completed')
    emit('close')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '结账失败', icon: 'none' })
  } finally {
    processing.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #f8fafc; border-radius: 36rpx 36rpx 0 0; max-height: 85vh; display: flex; flex-direction: column; }
.modal-header { padding: 32rpx 32rpx 24rpx; background: linear-gradient(135deg, #059669, #10b981); position: relative; }
.modal-title { display: block; font-size: 36rpx; font-weight: 800; color: #fff; }
.modal-sub { display: block; font-size: 24rpx; color: rgba(255,255,255,.7); margin-top: 6rpx; }
.modal-close { position: absolute; top: 32rpx; right: 32rpx; font-size: 36rpx; color: rgba(255,255,255,.8); padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx); }
.center-hint { text-align: center; padding: 120rpx 0; color: #9ca3af; font-size: 28rpx; }

.card { background: #fff; border-radius: 28rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.03); }
.card-title { font-size: 28rpx; font-weight: 700; color: #1e293b; margin-bottom: 18rpx; display: block; }

.card-amount { text-align: center; padding: 40rpx 28rpx 32rpx; border: 2rpx solid #a7f3d0; }
.card-label { font-size: 26rpx; color: #64748b; margin-bottom: 12rpx; display: block; }
.card-amount-value { font-size: 68rpx; font-weight: 800; color: #059669; }
.card-amount-timer { font-size: 24rpx; color: #94a3b8; margin-top: 12rpx; display: block; }
.card-amount-timer.timer-warn { color: #ef4444; font-weight: 700; }
.card-amount-detail { margin-top: 24rpx; padding-top: 20rpx; border-top: 1rpx solid #e2e8f0; }
.amount-detail-row { display: flex; justify-content: space-between; padding: 6rpx 0; font-size: 24rpx; color: #64748b; }
.amount-detail-row.discount { color: #ef4444; }
.amount-detail-row.rounding { color: #f59e0b; }

.card-coupon { background: #fffbeb; border: 2rpx solid #fcd34d; }
.coupon-title { display: block; font-size: 28rpx; font-weight: 700; color: #92400e; }
.coupon-detail { display: block; font-size: 24rpx; color: #a16207; margin-top: 6rpx; }

.discount-list { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 20rpx; }
.discount-chip {
  padding: 14rpx 24rpx; background: #f1f5f9; border-radius: 20rpx; font-size: 24rpx; color: #475569;
  &.active { background: #ecfdf5; color: #059669; font-weight: 700; box-shadow: 0 0 0 2rpx #059669 inset; }
}
.rounding-row { display: flex; align-items: center; justify-content: space-between; background: #f8fafc; border-radius: 20rpx; padding: 16rpx 20rpx; }
.rounding-info { display: flex; align-items: center; gap: 12rpx; }
.rounding-icon { font-size: 32rpx; }
.rounding-label { font-size: 26rpx; font-weight: 600; color: #1e293b; display: block; }
.rounding-amount { font-size: 22rpx; color: #94a3b8; display: block; }

.card-balance { border: 1rpx solid #e0e7ff; }
.balance-member-row { display: flex; align-items: center; gap: 16rpx; }
.balance-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #818cf8); display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 700; color: #fff; flex-shrink: 0; }
.balance-member-info { flex: 1; }
.balance-member-name { font-size: 28rpx; font-weight: 700; color: #1e293b; display: block; }
.balance-member-balance { font-size: 24rpx; color: #6366f1; margin-top: 4rpx; display: block; }
.balance-empty { padding: 24rpx 0; text-align: center; }
.balance-empty-text { font-size: 26rpx; color: #94a3b8; }
.balance-deduction-card { margin-top: 20rpx; padding: 24rpx; background: #eef2ff; border-radius: 20rpx; text-align: center; }
.balance-deduction-label { font-size: 24rpx; color: #6366f1; display: block; }
.balance-deduction-value { font-size: 44rpx; font-weight: 800; color: #4f46e5; display: block; margin-top: 4rpx; }
.balance-insufficient { font-size: 24rpx; color: #f59e0b; margin-top: 12rpx; display: block; }
.balance-remain { font-weight: 700; }

.card-cash { border: 2rpx solid #e2e8f0; text-align: center; }
.cash-amount-label { font-size: 24rpx; color: #94a3b8; margin-bottom: 12rpx; display: block; }
.cash-amount-fixed { font-size: 52rpx; font-weight: 800; color: #1e293b; display: block; }

.btn-checkout {
  width: 100%; padding: 32rpx; background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; border-radius: 28rpx; font-size: 32rpx; font-weight: 800; border: none;
  margin-top: 8rpx; box-shadow: 0 8rpx 24rpx rgba(5,150,105,.25);
  &[disabled] { opacity: 0.5; box-shadow: none; }
}
</style>
