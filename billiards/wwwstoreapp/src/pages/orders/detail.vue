<template>
  <view class="page">
    <StateView
      :loading="loading"
      :error="hasError"
      :empty="!order && !loading && !hasError"
      empty-msg="订单不存在或已被删除"
      error-msg="加载失败"
      @retry="loadDetail"
    >
      <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false" v-if="order">
        <view class="hero-card">
          <view class="hero-glow" />
          <view class="hero-pattern" />
          <view class="hero-status-pill" :class="statusClass(order.status)">
            <text class="hero-status-dot" />
            <text class="hero-status-text">{{ statusText(order.status) }}</text>
          </view>
          <text class="hero-no">#{{ order.order_no }}</text>
          <view class="hero-amount-wrap" v-if="order.status === 'in_progress'">
            <text class="hero-amount">{{ elapsedText }}</text>
            <text class="hero-amount-sub">已用时长</text>
          </view>
          <view class="hero-amount-wrap" v-else>
            <text class="hero-amount-symbol">¥</text>
            <text class="hero-amount">{{ $num(order.final_amount).toFixed(2) }}</text>
          </view>
        </view>

        <view class="section-card">
          <view class="section-title-row">
            <view class="section-accent" />
            <text class="section-title">基本信息</text>
          </view>
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">台桌</text>
              <text class="info-value">{{ order.table_name || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">类型</text>
              <text class="info-value">{{ typeLabel(order.type) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">操作员</text>
              <text class="info-value">{{ order.operator_name || '-' }}</text>
            </view>
            <view class="info-item" v-if="order.member_name">
              <text class="info-label">会员</text>
              <text class="info-value">{{ order.member_name }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">开始时间</text>
              <text class="info-value">{{ formatDateTime(order.start_time) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">结束时间</text>
              <text class="info-value">{{ order.end_time ? formatDateTime(order.end_time) : '进行中' }}</text>
            </view>
            <view class="info-item" v-if="order.duration_minutes !== undefined && order.duration_minutes !== null">
              <text class="info-label">时长</text>
              <text class="info-value">{{ durationText }}</text>
            </view>
            <view class="info-item" v-if="order.remark">
              <text class="info-label">备注</text>
              <text class="info-value">{{ order.remark }}</text>
            </view>
          </view>
        </view>

        <view class="section-card" v-if="order.items && order.items.length > 0">
          <view class="section-title-row">
            <view class="section-accent" />
            <text class="section-title">消费明细</text>
          </view>
          <view class="item-list">
            <view class="item-row" v-for="item in order.items" :key="item.id">
              <view class="item-left">
                <view class="item-icon-circle" :class="'icon-' + item.item_type">
                  <text class="item-icon-emoji">{{ itemIcon(item.item_type) }}</text>
                </view>
                <view class="item-info">
                  <text class="item-name">{{ item.item_name }}</text>
                  <text class="item-meta">{{ item.quantity }} × ¥{{ $num(item.unit_price).toFixed(2) }}</text>
                </view>
              </view>
              <text class="item-price">¥{{ $num(item.final_price || item.total_price || (item.unit_price * (item.quantity || 1))).toFixed(2) }}</text>
            </view>
          </view>
        </view>

        <view class="section-card" v-if="order.status === 'completed'">
          <view class="section-title-row">
            <view class="section-accent" />
            <text class="section-title">支付信息</text>
          </view>
          <view class="payment-list">
            <view class="payment-row" v-if="order.cash_paid > 0">
              <view class="payment-method-wrap">
                <view class="payment-dot dot-cash" />
                <text class="payment-method">现金</text>
              </view>
              <text class="payment-amount">¥{{ $num(order.cash_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.wechat_paid > 0">
              <view class="payment-method-wrap">
                <view class="payment-dot dot-wechat" />
                <text class="payment-method">微信</text>
              </view>
              <text class="payment-amount">¥{{ $num(order.wechat_paid).toFixed(2) }}</text>
            </view>
              <view class="payment-row" v-if="order.card_paid > 0">
              <view class="payment-method-wrap">
                <view class="payment-dot dot-card" />
                <text class="payment-method">刷卡</text>
              </view>
              <text class="payment-amount">¥{{ $num(order.card_paid).toFixed(2) }}</text>
            </view>
          </view>
        </view>

        <view class="section-card summary-card">
          <view class="section-title-row">
            <view class="section-accent accent-summary" />
            <text class="section-title">账单汇总</text>
          </view>
          <view class="summary-content">
            <view class="summary-row">
              <text class="summary-label">原价金额</text>
              <text class="summary-value">¥{{ $num(order.original_amount).toFixed(2) }}</text>
            </view>
            <view class="summary-row" v-if="order.discount_amount > 0">
              <text class="summary-label">优惠减免</text>
              <text class="summary-value discount">-¥{{ $num(order.discount_amount).toFixed(2) }}</text>
            </view>
            <view class="summary-divider" />
            <view class="summary-row total-row">
              <text class="summary-total-label">实付金额</text>
              <text class="summary-total-value">¥{{ $num(order.final_amount).toFixed(2) }}</text>
            </view>
          </view>
          <view class="checkout-btn" v-if="order.status === 'in_progress'" @click="handleCheckout">
            <text class="checkout-btn-text">立即结算</text>
            <text class="checkout-btn-arrow">→</text>
          </view>
        </view>

        <view class="section-card action-card" v-if="order.status === 'in_progress'">
          <view class="action-btn" @click="goTable">
            <text class="action-btn-text">前往台桌继续操作</text>
            <text class="action-btn-arrow">→</text>
          </view>
        </view>

        <view class="bottom-safe" />
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getOrderDetail } from '@/api/modules/order'
import type { MainOrder } from '@/types'
import StateView from '@/components/StateView.vue'

const orderId = ref('')
const order = ref<MainOrder | null>(null)
const loading = ref(true)
const hasError = ref(false)

function $num(v: any): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  orderId.value = currentPage.options?.order_id || ''
  loadDetail()
})

function loadDetail() {
  if (!orderId.value) return
  loading.value = true
  hasError.value = false

  getOrderDetail(orderId.value)
    .then((res: any) => {
      order.value = res.data || res
    })
    .catch((e: any) => {
      console.error('加载订单详情失败', e)
      hasError.value = true
    })
    .finally(() => {
      loading.value = false
    })
}

const elapsedText = computed(() => {
	  if (!order.value || order.value.duration_minutes == null) return '--'
	  let minutes = Number(order.value.duration_minutes)
	  if (!minutes && order.value.start_time) {
	    minutes = Math.max(0, Math.floor((Date.now() - new Date(order.value.start_time.replace('T', ' ')).getTime()) / 60000))
	  }
	  if (minutes < 60) return minutes + '分钟'
	  const h = Math.floor(minutes / 60)
	  const m = minutes % 60
	  return m > 0 ? h + 'h' + m + 'm' : h + '小时'
	})

	const durationText = computed(() => {
  if (!order.value || order.value.duration_minutes == null) return ''
  const totalMin = Number(order.value.duration_minutes)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`
  if (hours > 0) return `${hours}小时`
  return `${mins}分钟`
})

function statusClass(status: string): string {
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  return 'cancelled'
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    in_progress: '进行中',
    completed: '已结账',
    cancelled: '已取消',
    paused: '已暂停',
    merged: '已合并',
  }
  return map[status] || status
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    table: '台桌开台',
    assistant: '助教服务',
    product: '商品销售',
    quick_order: '快速下单',
  }
  return map[type] || type
}

function itemIcon(itemType: string): string {
  const icons: Record<string, string> = {
    table: '🎱',
    product: '🛒',
    assistant: '👤',
    merge_fee: '🔗',
  }
  return icons[itemType] || '📋'
}

function formatDateTime(timeStr: string): string {
  if (!timeStr) return '-'
  const d = new Date(timeStr.replace('T', ' '))
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
}

function goTable() {
  if (!order.value || !order.value.table_id) return
  uni.navigateTo({ url: `/pages/table/detail?table_id=${order.value.table_id}` })
}

function handleCheckout() {
  if (!order.value) return
  uni.navigateTo({ url: `/pages/orders/checkout?order_id=${order.value.id}` })
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 32rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: #ffffff;
  position: relative;
  z-index: 10;

  &::after {
    content: '';
    position: absolute;
    left: 32rpx;
    right: 32rpx;
    bottom: 0;
    height: 1rpx;
    background: rgba(0, 0, 0, 0.06);
    transform: scaleY(0.5);
  }
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  color: #059669;
  font-weight: 500;
  padding: 8rpx 4rpx;
  transition: opacity 200ms ease-out;

  &:active {
    opacity: 0.6;
  }
}

.back-icon {
  font-size: 30rpx;
  font-weight: 600;
}

.header-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #09090b;
  letter-spacing: 1rpx;
}

.header-placeholder {
  width: 100rpx;
}

.content-scroll {
  flex: 1;
  padding: 20rpx 24rpx;
  overflow-x: hidden;
  width: 94%;
}

.hero-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #047857 0%, #059669 40%, #10b981 100%);
  border-radius: 36rpx;
  padding: 52rpx 36rpx 48rpx;
  margin-bottom: 16rpx;
  text-align: center;
  box-shadow:
    0 8rpx 32rpx rgba(5, 150, 105, 0.25),
    0 2rpx 8rpx rgba(5, 150, 105, 0.15);
}

.hero-glow {
  position: absolute;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%);
  top: -80rpx;
  right: -60rpx;
  pointer-events: none;
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

.hero-status-pill {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 28rpx;
  border-radius: 40rpx;
  margin-bottom: 24rpx;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1rpx solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.18);
  z-index: 1;

  &.completed {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.cancelled {
    background: rgba(239, 68, 68, 0.2);
    border-color: rgba(239, 68, 68, 0.3);
  }

  &.in_progress {
    animation: pulse-subtle 2.5s ease-in-out infinite;
  }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.82; }
}

.hero-status-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #fff;
  flex-shrink: 0;

  .cancelled & {
    background: #fca5a5;
  }
}

.hero-status-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2rpx;
}

.hero-no {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16rpx;
  letter-spacing: 1rpx;
  position: relative;
  z-index: 1;
}

.hero-amount-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.hero-amount-symbol {
  font-size: 40rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  margin-right: 4rpx;
}

.hero-amount {
  font-size: 72rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -1rpx;
  text-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.1);
}

.hero-amount-sub {
  display: block;
  font-size: 24rpx;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4rpx;
}

.section-card {
  background: #ffffff;
  border-radius: 28rpx;
  padding: 30rpx 28rpx;
  margin-bottom: 16rpx;
  box-shadow:
    0 4rpx 24rpx rgba(0, 0, 0, 0.06),
    0 0 0 1rpx rgba(0, 0, 0, 0.03);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;

  &:active {
    transform: scale(0.99);
  }
}

.action-card {
  padding: 16rpx 0;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 24rpx;
}

.section-accent {
  width: 6rpx;
  height: 28rpx;
  border-radius: 3rpx;
  background: linear-gradient(180deg, #059669, #10b981);
  flex-shrink: 0;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #09090b;
  letter-spacing: 1rpx;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0 32rpx;
}

.info-item {
  width: calc(50% - 16rpx);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f4f4f5;
  transition: background 200ms ease-out;

  &:active {
    background: #fafafa;
    border-radius: 12rpx;
    padding-left: 12rpx;
    padding-right: 12rpx;
  }

  &:nth-last-child(-n+2) {
    border-bottom: none;
  }

  &:only-child {
    width: 100%;
  }
}

.info-label {
  font-size: 22rpx;
  color: #a1a1aa;
  font-weight: 400;
}

.info-value {
  font-size: 26rpx;
  color: #09090b;
  font-weight: 500;
}

.item-list {
  display: flex;
  flex-direction: column;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #f4f4f5;
  transition: background 200ms ease-out;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #fafaf9;
    margin: 0 -12rpx;
    padding: 18rpx 12rpx;
    border-radius: 16rpx;
    border-bottom: none;
  }
}

.item-left {
  display: flex;
  align-items: center;
  gap: 18rpx;
  flex: 1;
  min-width: 0;
}

.item-icon-circle {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 200ms ease-out;

  &.icon-table {
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  }

  &.icon-product {
    background: linear-gradient(135deg, #fef3c7, #fde68a);
  }

  &.icon-assistant {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
  }

  &.icon-merge_fee {
    background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
  }

  .item-row:active & {
    transform: scale(0.92);
  }
}

.item-icon-emoji {
  font-size: 28rpx;
  line-height: 1;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.item-name {
  font-size: 26rpx;
  color: #09090b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 22rpx;
  color: #a1a1aa;
}

.item-price {
  font-size: 28rpx;
  color: #09090b;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.payment-list {
  display: flex;
  flex-direction: column;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;

  &.total-row {
    border-top: 1rpx dashed #e5e7eb;
    padding-top: 24rpx;
    margin-top: 8rpx;
  }
}

.payment-method-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.payment-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &.dot-cash { background: #f59e0b; }
  &.dot-wechat { background: #07c160; }
  &.dot-alipay { background: #1677ff; }
  &.dot-balance { background: #8b5cf6; }
  &.dot-card { background: #64748b; }
}

.payment-method {
  font-size: 26rpx;
  color: #71717a;
  font-weight: 400;
}

.payment-amount {
  font-size: 26rpx;
  color: #09090b;
  font-weight: 600;

  &.total {
    font-size: 34rpx;
    color: #059669;
    font-weight: 800;
  }

  &.discount {
    color: #059669;
    font-weight: 600;
  }
}

.payment-total-label {
  font-size: 28rpx;
  color: #09090b;
  font-weight: 600;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 30rpx 0;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-radius: 24rpx;
  box-shadow:
    0 6rpx 20rpx rgba(5, 150, 105, 0.15),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;

  &:active {
    transform: scale(0.97);
    box-shadow:
      0 3rpx 10rpx rgba(5, 150, 105, 0.1),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.7);
  }
}

.action-btn-text {
  font-size: 32rpx;
  color: #047857;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.action-btn-arrow {
  font-size: 30rpx;
  color: #047857;
  font-weight: 700;
  transition: transform 200ms ease-out;

  .action-btn:active & {
    transform: translateX(8rpx);
  }
}

.bottom-safe {
  height: calc(60rpx + env(safe-area-inset-bottom));
}

/* 账单汇总板块 */
.summary-card {
  padding: 36rpx 32rpx;
  margin-bottom: 20rpx;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  border: 2rpx solid #e5e7eb;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.summary-content {
  padding: 28rpx 24rpx;
  background: #f9fafb;
  border-radius: 24rpx;
  margin-bottom: 28rpx;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;

  &.total-row {
    padding: 24rpx 0 8rpx;
  }
}

.summary-divider {
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #d1d5db, transparent);
  margin: 8rpx 0;
}

.summary-label {
  font-size: 28rpx;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 30rpx;
  color: #374151;
  font-weight: 600;

  &.discount {
    color: #059669;
  }
}

.summary-total-label {
  font-size: 34rpx;
  color: #111827;
  font-weight: 700;
}

.summary-total-value {
  font-size: 48rpx;
  color: #059669;
  font-weight: 800;
  letter-spacing: -1rpx;
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 32rpx 0;
  background: linear-gradient(135deg, #047857 0%, #059669 50%, #10b981 100%);
  border-radius: 28rpx;
  box-shadow:
    0 8rpx 24rpx rgba(5, 150, 105, 0.35),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.2);
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;

  &:active {
    transform: scale(0.97);
    box-shadow:
      0 4rpx 12rpx rgba(5, 150, 105, 0.25),
      inset 0 2rpx 0 rgba(255, 255, 255, 0.2);
  }
}

.checkout-btn-text {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.checkout-btn-arrow {
  font-size: 34rpx;
  color: #ffffff;
  font-weight: 700;
  transition: transform 200ms ease-out;

  .checkout-btn:active & {
    transform: translateX(8rpx);
  }
}
</style>
