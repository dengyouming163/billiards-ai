<template>
  <view class="container">
    <!-- 成功页 -->
    <SuccessPage
      v-if="showSuccess"
      :paid-amount="paidAmount"
      :table-name="bill.table_name"
      :order-no="bill.order_no"
      @go-home="goHome"
    />

    <!-- 固定头部 -->
    <view v-else class="sticky-header">
      <view class="header-card">
        <view class="header-row">
          <view class="header-left">
            <view class="header-icon-wrap">
              <view class="icon-glow"></view>
              <text class="icon-text">📋</text>
            </view>
            <view class="header-title-wrap">
              <text class="header-title">账单详情</text>
              <text class="header-subtitle">#{{ bill?.order_no || '' }}</text>
            </view>
          </view>
          <view class="header-right">
            <view class="back-btn" @click="goBack">
              <text class="back-icon">←</text>
              <text class="back-text">返回</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 头部占位 -->
    <view class="header-placeholder"></view>

    <!-- 加载中 -->
    <template v-if="isLoading">
      <view class="loading-state"><view class="loading-spinner"></view><text class="loading-text">加载账单中...</text></view>
    </template>

    <!-- 账单主界面 -->
    <template v-else>

      <!-- 状态卡片 -->
      <view class="status-card">
        <view class="status-header">
          <view class="status-badge" :class="bill.status">
            <view class="status-dot"></view>
            <text>{{ statusLabel }}</text>
          </view>
          <text class="status-order">#{{ bill.order_no }}</text>
        </view>
        <view class="status-main">
          <view class="timer-wrap">
            <text class="timer-label">消费时长</text>
            <text class="timer-text">{{ displayTime }}</text>
          </view>
          <view class="fee-wrap">
            <text class="fee-label">当前费用</text>
            <text class="fee-text">¥{{ displayFee }}</text>
          </view>
        </view>
        <view class="status-meta">
          <view class="meta-item">
            <text class="meta-icon">🕐</text>
            <text class="meta-label">开台</text>
            <text class="meta-value">{{ bill.start_time || '-' }}</text>
          </view>
          <view class="meta-item">
            <text class="meta-icon">👥</text>
            <text class="meta-label">人数</text>
            <text class="meta-value">{{ bill.customer_count || 0 }}人</text>
          </view>
          <view class="meta-item" v-if="bill.prepaid_hours > 0">
            <text class="meta-icon">🎫</text>
            <text class="meta-label">套餐</text>
            <text class="meta-value">{{ bill.coupon_package_name || '预付' }} {{ bill.prepaid_hours }}h</text>
          </view>
        </view>
      </view>

      <!-- 账单汇总 -->
      <view class="bill-summary-card">
        <view class="bs-header">
          <view class="bs-icon-wrap">
            <text class="bs-icon">💰</text>
          </view>
          <text class="bs-title">账单汇总</text>
        </view>
        <view class="bs-grid">
          <view class="bs-item">
            <text class="bs-label">账单总额</text>
            <text class="bs-val">¥{{ formatPrice(bill.total_amount || computedTotalFee) }}</text>
          </view>
          <view class="bs-item bs-paid" v-if="(bill.paid_amount || 0) > 0">
            <text class="bs-label">已支付</text>
            <text class="bs-val">-¥{{ formatPrice(bill.paid_amount || 0) }}</text>
          </view>
          <view class="bs-item bs-payable">
            <text class="bs-label">待支付</text>
            <text class="bs-val">¥{{ formatPrice(bill.payable_amount || computedTotalFee) }}</text>
          </view>
        </view>
      </view>

      <!-- 消费明细 -->
      <view class="fee-panel">
        <view class="fee-panel-head" @click="feeExpanded = !feeExpanded">
          <view class="fee-panel-left">
            <view class="panel-icon-wrap">
              <text class="panel-icon">📋</text>
            </view>
            <text class="fee-panel-title">消费明细</text>
            <text class="items-count">{{ allBillItems.length }}项</text>
          </view>
          <text class="fee-panel-arrow">{{ feeExpanded ? '▲' : '▼' }}</text>
        </view>
        <view class="fee-panel-body" v-if="feeExpanded">
          <view class="detail-list">
            <view class="detail-item" v-for="item in allBillItems" :key="item.id">
              <view class="di-left">
                <view class="di-icon-wrap" :class="'di-icon-' + item.item_type">
                  <text class="di-icon">{{ itemTypeIcon(item.item_type, item) }}</text>
                </view>
                <view class="di-info">
                  <text class="di-name">{{ item.name }}{{ item.quantity > 1 ? ' ×' + item.quantity : '' }}</text>
                  <view class="di-meta-row">
                    <text class="di-meta">{{ itemTypeLabel(item.item_type, item) }}</text>
                    <view class="di-status-tag" :class="item.status">
                      {{ itemStatusLabel(item) }}
                    </view>
                  </view>
                </view>
              </view>
              <view class="di-right">
                <text class="di-price">¥{{ formatPrice(item.price) }}</text>
                <text v-if="item.is_paid" class="di-paid-tag">已付</text>
              </view>
            </view>
          </view>
          <view class="fee-panel-footer">
            <view v-if="bill.member_discount > 0" class="discount-row">
              <view class="dr-left">
                <text class="dr-icon">🎁</text>
                <text class="dr-name">会员折扣</text>
              </view>
              <text class="dr-price">-¥{{ formatPrice(bill.member_discount) }}</text>
            </view>
            <view class="total-row">
              <text class="total-label">合计</text>
              <text class="total-price">¥{{ formatPrice(computedTotalFee) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 已点商品 -->
      <view class="items-panel" v-if="groupedProductItems.length > 0">
        <view class="items-panel-head">
          <view class="panel-icon">📦</view>
          <text class="items-panel-title">已点商品</text>
          <text class="items-count">{{ groupedProductItems.length }}种</text>
        </view>
        <view class="items-list">
          <view class="item-card" v-for="item in groupedProductItems" :key="item.id">
            <view class="item-icon-wrap">
              <text class="item-emoji">{{ item.emoji || '📦' }}</text>
            </view>
            <view class="item-info">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-meta">x{{ item.quantity }} · {{ itemStatusLabel(item) }}</text>
            </view>
            <text class="item-price">¥{{ formatPrice(item.price) }}</text>
          </view>
        </view>
      </view>

      <!-- 助教服务 -->
      <view class="items-panel" v-if="assistantItems.length > 0">
        <view class="items-panel-head">
          <view class="panel-icon">👨‍🏫</view>
          <text class="items-panel-title">助教服务</text>
          <text class="items-count">{{ assistantItems.length }}位</text>
        </view>
        <view class="items-list">
          <view class="item-card" v-for="item in assistantItems" :key="item.id">
            <view class="item-icon-wrap">
              <text class="item-emoji">👨‍🏫</text>
            </view>
            <view class="item-info">
              <text class="item-name">{{ item.assistant_name || item.name }}</text>
              <view class="item-meta-row">
                <text class="item-meta">¥{{ item.hourly_rate }}/h</text>
                <text class="item-status-tag" :class="item.status">{{ statusCN[item.status] || assistantStatusLabel(item.status) }}</text>
                <text class="item-meta" v-if="item.started_at">{{ calcTimer(item) }}</text>
              </view>
            </view>
            <text class="item-price">¥{{ formatPrice(item.price) }}</text>
          </view>
        </view>
      </view>

      <!-- 会员入口 -->
      <view class="member-card" @click="onMemberEntry">
        <view class="member-left">
          <view class="member-icon-wrap">
            <text class="member-icon">👤</text>
          </view>
          <text class="member-text">{{ bill.member_info ? (bill.member_info.name || '已绑定') : '绑定会员享折扣' }}</text>
        </view>
        <text class="member-arrow">›</text>
      </view>
      <!-- 会员绑定输入 -->
      <view class="member-input-row" v-if="showMemberInput">
        <input v-model="memberPhone" placeholder="输入会员手机号" class="member-phone-input" />
        <button @click="handleBindMember" class="member-bind-btn">绑定</button>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!groupedProductItems.length && !assistantItems.length">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无消费明细</text>
      </view>
    </template>

    <!-- 会员区域 -->
    <view v-if="!showSuccess && !isLoading" class="member-section">
      <view class="member-login-card" @click="showMemberQR = true" v-if="!memberInfo">
        <view class="mlc-left">
          <view class="mlc-icon-wrap">
            <view class="mlc-icon-glow"></view>
            <text class="mlc-icon">👤</text>
          </view>
          <view class="mlc-info">
            <text class="mlc-title">会员登录</text>
            <text class="mlc-desc">扫码绑定享专属折扣</text>
          </view>
        </view>
        <view class="mlc-arrow-wrap">
          <text class="mlc-arrow">›</text>
        </view>
      </view>
      <view class="member-info-card" v-else>
        <view class="mic-header">
          <view class="mic-icon-wrap">
            <view class="mic-ring"></view>
            <text class="mic-icon">👤</text>
          </view>
          <view class="mic-info">
            <text class="mic-name">{{ memberInfo.name || '会员' }}</text>
            <text class="mic-level">{{ memberInfo.level_name || '' }}{{ memberInfo.level_discount ? ' · '+(memberInfo.level_discount/10).toFixed(1)+'折' : '' }}</text>
          </view>
          <view class="mic-balance-wrap">
            <text class="mic-balance">¥{{ formatPrice(memberInfo.balance || 0) }}</text>
            <text class="mic-balance-label">余额</text>
          </view>
        </view>
        <view class="mic-actions">
          <view class="mic-action-btn" @click="showMemberQR = true">
            <text>切换会员</text>
          </view>
          <view class="mic-action-btn secondary" @click="unbindMember">
            <text>解绑</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部支付栏 -->
    <view v-if="!showSuccess && !isLoading" class="bottom-bar">
      <view class="bottom-card">
        <view class="bottom-left">
          <text class="bottom-label">应付金额</text>
          <text class="bottom-amount">¥{{ formatPrice(computedTotalFee) }}</text>
        </view>
        <view class="bottom-actions">
          <view class="bottom-back-btn" @click="goBack">
            <text>返回</text>
          </view>
          <view class="bottom-btn" @click="handleCheckout">
            <text>请求结账</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 微信扫码支付弹窗 -->
    <QRPayModal
      :visible="showPayQR"
      :qr-code-url="qrCodeUrl"
      :amount="computedTotalFee"
      :pay-status="payStatus"
      :status-text="payStatusText"
      @close="closePayQR"
    />
    <!-- 会员扫码弹窗 -->
    <view class="qr-overlay" v-if="showMemberQR" @click="showMemberQR = false">
      <view class="qr-modal" @click.stop>
        <text class="qr-close" @click="showMemberQR = false">✕</text>
        <text class="qr-title">会员扫码登录</text>
        <view class="qr-image-wrap">
          <image v-if="memberQrUrl" class="qr-image" :src="memberQrUrl" mode="aspectFit" />
          <view v-else class="qr-loading"><view class="qr-spinner"></view><text>生成中...</text></view>
        </view>
        <text class="qr-hint">请使用微信扫描二维码绑定会员</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import PageHeader from '@/components/standard/PageHeader.vue'
import SuccessPage from './components/SuccessPage.vue'
import QRPayModal from './components/QRPayModal.vue'
import { tabletApi } from '@/api'
import { authStore } from '@/stores/auth'
import { paymentStore } from '@/stores/payment'
import { orderStore } from '@/stores/order'
import { formatPrice } from '@/utils/format'

// ===== 数据 =====
const isLoading = ref(true)
const feeExpanded = ref(true)
const now = ref(Date.now())
let tickTimer: number | null = null

interface BillData {
  table_name: string; order_no: string; order_id: string; status: string
  start_time: string; customer_count: number; prepaid_hours: number
  coupon_package_name: string; coupon_price: number
  table_fee: number; product_fee: number; assistant_fee: number; merge_fee: number
  member_discount: number; total_fee: number; charging_fee: number
  hourly_rate: number; duration_minutes: number
  total_amount: number; paid_amount: number; payable_amount: number
  items: any[]; member_info: any
}

const bill = ref<BillData>({
  table_name: '', order_no: '', order_id: '', status: 'in_progress',
  start_time: '', customer_count: 0, prepaid_hours: 0,
  coupon_package_name: '', coupon_price: 0,
  table_fee: 0, product_fee: 0, assistant_fee: 0, merge_fee: 0,
  member_discount: 0, total_fee: 0, charging_fee: 0,
  hourly_rate: 0, duration_minutes: 0,
  total_amount: 0, paid_amount: 0, payable_amount: 0,
  items: [], member_info: null,
})

const showPayQR = ref(false)
const showSuccess = ref(false)

// 桥接 paymentStore 状态到模板
const qrCodeUrl = computed(() => paymentStore.qrCode.value)
const payStatus = computed(() => paymentStore.state.value)
const paidAmount = computed(() => paymentStore.amount.value)
const payStatusText = computed(() => ({
  idle: '准备中', preparing: '锁定金额中', waiting: '等待支付', paid: '支付成功', failed: '支付失败', expired: '已过期',
} as Record<string,string>)[paymentStore.state.value] || '准备中')

// 会员绑定
const showMemberQR = ref(false)
const memberQrUrl = ref('')
const memberInfo = computed(() => (bill.value as any)?.member_info || null)
const payMethod = ref<'balance' | 'wechat'>('balance')

function unbindMember() {
  // 调用解绑API
  const oid = bill.value.order_id
  if (!oid) return
  tabletApi.bindMember({ order_id: oid, member_id: '' }).catch(() => {})
  bill.value.member_info = null as any
  uni.showToast({ title: '已解绑', icon: 'none' })
}

watch(showMemberQR, (v) => {
  if (v) {
    // 生成会员绑定二维码
    const oid = bill.value.order_id
    if (oid) {
      memberQrUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`https://poolstore.kyyp.cn/member-bind?order_id=${oid}`)}`
      // 开始轮询会员绑定状态
      const timer = setInterval(async () => {
        try {
          const data = await tabletApi.getTableOrder(String(authStore.tableId), { showLoading: false }) as any
          if (data?.member_info) {
            bill.value.member_info = data.member_info
            showMemberQR.value = false
            clearInterval(timer)
          }
        } catch {}
      }, 3000)
      setTimeout(() => clearInterval(timer), 120000)
    }
  }
})

// ===== 计算属性 =====
const statusLabelMap: Record<string,string> = { in_progress:'使用中', pending:'待结算', settled:'已结账', cancelled:'已取消' }
const statusLabel = computed(() => statusLabelMap[bill.value.status] || bill.value.status || '未知')
const assistantStatusLabel = (s: string) => ({ pending:'待确认', processing:'可开始', serving:'服务中', completed:'已完成', cancelled:'已取消' } as any)[s] || s

const statusCN: Record<string,string> = {
  preorder_pending:'待确认', pending:'待接单', processing:'处理中', delivered:'已送达', cancelled:'已取消',
  serving:'服务中', completed:'已完成', active:'计费中'
}
function itemStatusLabel(item: any): string {
  if (item.item_type === 'table') return '计费中'
  return statusCN[item.status] || item.status
}

// 只显示已产生费用的商品（已送达）
const productItems = computed(() => bill.value.items.filter(i => i.item_type === 'product' && i.status === 'delivered'))

// 已点商品合并同款
const groupedProductItems = computed(() => {
  const map = new Map<string, any>()
  for (const item of productItems.value) {
    const key = item.name
    if (map.has(key)) {
      const m = map.get(key)
      m.quantity += (item.quantity || 0)
      m.price += Number(item.price || 0)
    } else {
      map.set(key, { ...item, price: Number(item.price || 0) })
    }
  }
  return [...map.values()]
})

const assistantItems = computed(() => bill.value.items.filter(i => i.item_type === 'assistant'))

function calcTimer(item: any): string {
  if (!item.started_at) return ''
  const d = Math.max(0, Math.floor((Date.now() - new Date(item.started_at).getTime()) / 1000))
  const h = Math.floor(d/3600); const m = Math.floor((d%3600)/60); const s = d%60
  return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')
}

const displayTime = computed(() => {
  void now.value
  if (!bill.value.start_time) return '00:00:00'
  const diff = Math.max(0, Math.floor((Date.now() - new Date(bill.value.start_time).getTime()) / 1000))
  const h = Math.floor(diff/3600); const m = Math.floor((diff%3600)/60); const s = diff%60
  return [h,m,s].map(n=>String(n).padStart(2,'0')).join(':')
})


const computedTotalFee = computed(() => {
  void now.value
  // 优先使用后端计算的待支付金额
  if (bill.value.payable_amount > 0) return bill.value.payable_amount
  return bill.value.table_fee + bill.value.product_fee + orderStore.assistantFee + (bill.value.charging_fee || 0) + (bill.value.merge_fee || 0) - bill.value.member_discount
})

const displayFee = computed(() => {
  void now.value
  return formatPrice(Number(bill.value.table_fee) + Number(bill.value.product_fee) + Number(orderStore.assistantFee) + Number(bill.value.charging_fee || 0) + Number(bill.value.merge_fee || 0))
})

// 所有消费明细项（从items中提取，排除cancelled/rejected）
const allBillItems = computed(() => {
  const items = (bill.value.items as any[]) || []
  return items.filter((i: any) => !['cancelled', 'rejected', 'preorder_pending'].includes(i.status))
})
function itemTypeIcon(type: string, item: any) {
  if (item.is_paid) return '✅'
  if (type === 'table') return '🎱'
  if (type === 'product') return '📦'
  if (type === 'assistant') return '👨‍🏫'
  if (type === 'charging') return '🔋'
  if (type === 'merge_fee') return '🔗'
  return '💰'
}
function itemTypeLabel(type: string, item: any) {
  if (type === 'table') return item.billing_mode === 'flat_rate' ? '固定时长' : '台费'
  if (type === 'product') return '商品'
  if (type === 'assistant') return item.billing_mode === 'flat_rate' ? '固定' + (item.quantity||0) + 'h' : '助教'
  if (type === 'charging') return '充电'
  if (type === 'merge_fee') return '并入'
  return type
}

// ===== 数据加载 =====
async function loadBill() {
  isLoading.value = true
  try {
    const order = await tabletApi.getTableOrder(String(authStore.tableId), { showLoading: false })
    if (order && order.id) {
      bill.value = {
        table_name: (order as any).table_name || authStore.tableName || '',
        order_no: order.order_no || '',
        order_id: String(order.id),
        status: order.status || 'in_progress',
        start_time: order.start_time || '',
        customer_count: Number(order.customer_count) || 0,
        prepaid_hours: Number(order.prepaid_hours) || 0,
        coupon_package_name: (order as any).coupon_package_name || '',
        coupon_price: Number((order as any).coupon_price) || 0,
        table_fee: Number(order.table_fee) || 0,
        product_fee: Number(order.product_fee) || 0,
        assistant_fee: Number(order.assistant_fee) || 0,
        member_discount: Number((order as any).member_discount) || 0,
        total_fee: Number(order.total_fee) || Number(order.final_amount) || 0,
        charging_fee: Number((order as any).chargingFee || (order as any).charging_fee) || 0,
        merge_fee: Number((order as any).merge_fee) || 0,
        hourly_rate: Number(order.hourly_rate) || 0,
        duration_minutes: Number(order.duration_minutes) || 0,
        items: (order.items || []) as any[],
        member_info: (order as any).member_info || null,
        total_amount: Number((order as any).total_amount) || 0,
        paid_amount: Number((order as any).paid_amount) || 0,
        payable_amount: Number((order as any).payable_amount) || 0,
      }
      if (!bill.value.total_fee) bill.value.total_fee = bill.value.table_fee + bill.value.product_fee + bill.value.assistant_fee + (bill.value.charging_fee || 0)
      startTickTimer()
    }
  } catch { uni.showToast({ title: '加载账单失败', icon: 'none' }) }
  finally { isLoading.value = false }
}

function startTickTimer() {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(() => { now.value = Date.now() }, 60000) as unknown as number
}

// ===== 支付（委托给 PaymentStore） =====
async function handleCheckout() {
  if (!bill.value.order_id || bill.value.total_fee <= 0) {
    uni.showToast({ title: '订单数据异常', icon: 'none' })
    return
  }
  const ok = await paymentStore.prepare(bill.value.order_id)
  if (!ok) {
    uni.showToast({ title: paymentStore.errorMsg.value || '结算准备失败', icon: 'none' })
    return
  }
  showPayQR.value = true
  const created = await paymentStore.createAndPay(bill.value.order_id)
  if (!created) {
    showPayQR.value = false
    uni.showToast({ title: paymentStore.errorMsg.value || '创建支付失败', icon: 'none' })
  }
}

// 监听支付完成
watch(() => paymentStore.state.value, async (s) => {
  if (s === 'paid') {
    // 支付成功后，通知后端结算订单 + 清除本地订单状态
    try {
      await tabletApi.checkout({ order_id: bill.value.order_id, pay_type: 'wechat' })
    } catch (e: any) {
      console.error('[Bill] checkout API failed:', e?.message || e)
    }
    orderStore.reset()
    setTimeout(() => { showPayQR.value = false; showSuccess.value = true }, 1200)
  } else if (s === 'failed') {
    uni.showToast({ title: '支付失败', icon: 'none' })
    closePayQR()
  } else if (s === 'expired') {
    showPayQR.value = false
    uni.showModal({ title: '提示', content: '结算已过期，金额可能已变化，请重新结算', showCancel: false })
    paymentStore.reset()
  }
})

function closePayQR() { paymentStore.reset(); showPayQR.value = false }
const memberPhone = ref('')
const showMemberInput = ref(false)

function onMemberEntry() {
  if (bill.value.member_info) return // 已绑定，无需再操作
  showMemberInput.value = !showMemberInput.value
}

async function handleBindMember() {
  if (!memberPhone.value) return
  try {
    await tabletApi.bindMemberByPhone({ order_id: bill.value.order_id, phone: memberPhone.value })
    uni.showToast({ title: '会员已绑定', icon: 'success' })
    showMemberInput.value = false
    loadBill()
  } catch (e: any) { uni.showToast({ title: e?.message || '绑定失败', icon: 'none' }) }
}
function goBack() { uni.navigateBack() }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }

onMounted(() => { loadBill() })
onUnmounted(() => { paymentStore.reset(); if (tickTimer) clearInterval(tickTimer) })
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

$primary: #07C160;
$primary-dark: #06AD56;
$bg: #f7f7f7;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.container {
  min-height: 100vh;
  padding: 32rpx;
  padding-bottom: 360rpx;
  background: $bg;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse at 20% 30%, rgba($primary, .05), transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(6, 182, 212, .04), transparent 50%);
    pointer-events: none;
  }
}

/* === Sticky Header === */
.sticky-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 16rpx 24rpx;
  padding-top: calc(env(safe-area-inset-top) + 16rpx);
  background: linear-gradient(180deg, rgba($bg, 0.98), rgba($bg, 0.95) 80%, transparent);

  .header-card {
    background: $card-bg;
    border-radius: 40rpx;
    padding: 28rpx 32rpx;
    border: 2rpx solid rgba($primary, 0.1);
    box-shadow: 
      0 8rpx 32rpx rgba(0, 0, 0, 0.06),
      0 0 24rpx rgba($primary, 0.04);
    backdrop-filter: blur(20rpx);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .header-icon-wrap {
    position: relative;
    width: 88rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.05));
    border-radius: 24rpx;
    border: 2rpx solid rgba($primary, 0.15);
  }

  .icon-glow {
    display: none;
  }

  .icon-text {
    font-size: 48rpx;
    position: relative;
    z-index: 2;
  }

  .header-title-wrap {
    display: flex;
    flex-direction: column;
  }

  .header-title {
    font-size: 56rpx;
    font-weight: 800;
    color: $text-primary;
    letter-spacing: 3rpx;
  }

  .header-subtitle {
    font-size: 34rpx;
    color: $text-secondary;
    margin-top: 4rpx;
    font-weight: 500;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }
}

.header-placeholder {
  height: 220rpx;
}

/* Back Button */
.back-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 88rpx;
  padding: 0 40rpx;
  background: $card-bg;
  border-radius: 44rpx;
  border: 2rpx solid rgba($primary, 0.3);
  box-shadow: 
    0 4rpx 16rpx rgba($primary, 0.1);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.95);
    border-color: $primary;
    background: rgba($primary, 0.05);
  }

  .back-icon {
    font-size: 48rpx;
    color: $primary;
    font-weight: 800;
    line-height: 1;
  }

  .back-text {
    font-size: 44rpx;
    color: $primary;
    font-weight: 600;
    letter-spacing: 1rpx;
  }
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 320rpx;
}

.loading-spinner {
  width: 140rpx;
  height: 140rpx;
  border: 12rpx solid #e5e5e5;
  border-top-color: $primary;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 48rpx;
}

.loading-text {
  font-size: 60rpx;
  color: $text-secondary;
}

/* === Status Card === */
.status-card {
  background: $card-bg;
  border-radius: 40rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba($primary, 0.1);
  box-shadow: 
    0 8rpx 32rpx rgba(0, 0, 0, 0.06),
    0 0 24rpx rgba($primary, 0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6rpx;
    background: linear-gradient(90deg, transparent, $primary, transparent);
  }
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 32rpx;
  border-radius: 36rpx;
  font-size: 38rpx;
  font-weight: 600;

  .status-dot {
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
  }

  &.in_progress {
    background: linear-gradient(135deg, rgba($primary, 0.15), rgba($primary, 0.06));
    color: $primary;
    .status-dot {
      background: $primary;
      box-shadow: 0 0 12rpx rgba($primary, 0.4);
    }
  }

  &.settled {
    background: linear-gradient(135deg, rgba($primary, 0.15), rgba($primary, 0.06));
    color: $primary;
    .status-dot {
      background: $primary;
      box-shadow: 0 0 12rpx rgba($primary, 0.4);
    }
  }

  &.cancelled {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
    color: #ef4444;
    .status-dot {
      background: #ef4444;
      box-shadow: 0 0 12rpx rgba(239, 68, 68, 0.3);
    }
  }
}

.status-order {
  font-size: 38rpx;
  color: $text-secondary;
  font-weight: 500;
}

.status-main {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20rpx 0;
  margin-bottom: 20rpx;
  border-bottom: 2rpx solid rgba($primary, 0.1);
}

.timer-wrap, .fee-wrap {
  text-align: center;
}

.timer-label, .fee-label {
  display: block;
  font-size: 30rpx;
  color: $text-secondary;
  margin-bottom: 12rpx;
}

.timer-text {
  font-size: 120rpx;
  font-weight: 800;
  color: $text-primary;
  font-family: 'Courier New', monospace;
  letter-spacing: 8rpx;
}

.fee-text {
  font-size: 80rpx;
  font-weight: 800;
  color: $primary;
}

.status-meta {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.meta-icon {
  font-size: 40rpx;
}

.meta-label {
  font-size: 28rpx;
  color: $text-secondary;
}

.meta-value {
  font-size: 40rpx;
  color: $text-primary;
  font-weight: 600;
}

/* === Fee Panel === */
.fee-panel {
  background: $card-bg;
  border-radius: 40rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba($primary, 0.08);
  box-shadow: 
    0 8rpx 32rpx rgba(0, 0, 0, 0.06),
    0 0 20rpx rgba($primary, 0.03);
  overflow: hidden;
}

.fee-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 2rpx solid rgba($primary, 0.08);
}

.fee-panel-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.panel-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.04));
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba($primary, 0.1);
}

.panel-icon {
  font-size: 40rpx;
}

.fee-panel-title {
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  letter-spacing: 2rpx;
}

.fee-panel-arrow {
  font-size: 48rpx;
  color: $primary;
  font-weight: 300;
}

.fee-panel-body {
  padding: 24rpx 32rpx 28rpx;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 28rpx;
  background: rgba($primary, 0.03);
  border-radius: 28rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid rgba($primary, 0.05);
  transition: all 0.3s ease;

  &:active {
    background: rgba($primary, 0.06);
    border-color: rgba($primary, 0.1);
  }

  .fee-label {
    font-size: 42rpx;
    color: $text-secondary;
    font-weight: 500;
  }

  .fee-value {
    font-size: 44rpx;
    color: $text-primary;
    font-weight: 600;

    &.price {
      color: $primary;
      font-weight: 700;
    }

    &.discount {
      color: $primary;
      font-weight: 700;
    }

    &.total-price {
      font-size: 68rpx;
      font-weight: 800;
      color: $primary;
      letter-spacing: 2rpx;
    }
  }
}

.fee-row.total {
  padding: 28rpx 28rpx;
  margin-top: 16rpx;
  margin-bottom: 0;
  border: 2rpx solid rgba($primary, 0.15);
  background: linear-gradient(145deg, rgba($primary, 0.08), rgba($primary, 0.03));
  box-shadow: 0 4rpx 16rpx rgba($primary, 0.06);
}

/* === Items Panel === */
.items-panel {
  background: $card-bg;
  border-radius: 40rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba($primary, 0.08);
  box-shadow: 
    0 8rpx 32rpx rgba(0, 0, 0, 0.06),
    0 0 20rpx rgba($primary, 0.03);
}

.items-panel-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 28rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid rgba($primary, 0.08);
}

.items-panel-title {
  font-size: 48rpx;
  font-weight: 700;
  color: $text-primary;
  flex: 1;
  letter-spacing: 2rpx;
}

.items-count {
  font-size: 36rpx;
  color: $text-secondary;
  background: rgba($primary, 0.06);
  padding: 10rpx 24rpx;
  border-radius: 28rpx;
  border: 2rpx solid rgba($primary, 0.12);
  font-weight: 500;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx;
  background: rgba($primary, 0.03);
  border-radius: 28rpx;
  border: 2rpx solid rgba($primary, 0.05);
  transition: all 0.3s ease;

  &:active {
    background: rgba($primary, 0.06);
    border-color: rgba($primary, 0.12);
    transform: scale(0.99);
  }
}

.item-icon-wrap {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.04));
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2rpx solid rgba($primary, 0.1);
  box-shadow: 0 4rpx 16rpx rgba($primary, 0.06);
}

.item-emoji {
  font-size: 56rpx;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 46rpx;
  color: $text-primary;
  font-weight: 600;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
}

.item-meta {
  font-size: 34rpx;
  color: $text-secondary;
  font-weight: 500;
}

.item-meta-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.item-status-tag {
  font-size: 32rpx;
  padding: 8rpx 20rpx;
  border-radius: 18rpx;
  font-weight: 600;

  &.pending {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 2rpx solid rgba(245, 158, 11, 0.15);
  }

  &.processing {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 2rpx solid rgba(59, 130, 246, 0.15);
  }

  &.serving {
    background: rgba($primary, 0.1);
    color: $primary;
    border: 2rpx solid rgba($primary, 0.15);
  }

  &.completed {
    background: rgba(107, 114, 128, 0.08);
    color: $text-secondary;
  }
}

.item-price {
  font-size: 52rpx;
  color: $primary;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 1rpx;
}

/* === Member === */
.member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $card-bg;
  border-radius: 32rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid rgba($primary, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  &:active {
    border-color: rgba($primary, 0.3);
    background: rgba($primary, 0.05);
  }

  .member-left {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .member-icon-wrap {
    width: 64rpx;
    height: 64rpx;
    background: rgba($primary, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba($primary, 0.15);
  }

  .member-icon {
    font-size: 36rpx;
  }

  .member-text {
    font-size: 42rpx;
    color: $primary;
    font-weight: 600;
  }

  .member-arrow {
    font-size: 56rpx;
    color: rgba($primary, 0.3);
  }
}

.member-input-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  padding: 0 8rpx;

  .member-phone-input {
    flex: 1;
    background: $card-bg;
    border: 2rpx solid rgba($primary, 0.2);
    border-radius: 24rpx;
    padding: 20rpx 28rpx;
    font-size: 42rpx;
    color: $text-primary;
    min-height: 80rpx;
  }

  .member-bind-btn {
    background: linear-gradient(135deg, $primary, $primary-dark);
    color: #fff;
    border: none;
    border-radius: 24rpx;
    padding: 20rpx 40rpx;
    font-size: 42rpx;
    font-weight: 700;
    min-height: 80rpx;
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.3);

    &:active {
      transform: scale(0.97);
    }
  }
}

/* === Empty === */
.empty-state {
  text-align: center;
  padding: 80rpx 0;

  .empty-icon {
    font-size: 120rpx;
    display: block;
    margin-bottom: 20rpx;
  }

  .empty-text {
    font-size: 40rpx;
    color: $text-secondary;
  }
}

/* === Bottom Bar === */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
  background: linear-gradient(180deg, rgba($bg, 0), rgba($bg, 0.95) 20%, $bg);
  z-index: 100;
}

.bottom-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $card-bg;
  border-radius: 40rpx;
  padding: 32rpx;
  border: 2rpx solid rgba($primary, 0.1);
  box-shadow: 
    0 -8rpx 32rpx rgba(0, 0, 0, 0.08),
    0 0 24rpx rgba($primary, 0.04);
}

.bottom-left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.bottom-label {
  font-size: 38rpx;
  color: $text-secondary;
  font-weight: 500;
}

.bottom-amount {
  font-size: 88rpx;
  font-weight: 800;
  color: $primary;
  letter-spacing: 3rpx;
}

.bottom-actions {
  display: flex;
  gap: 20rpx;
  align-items: center;
}

.bottom-back-btn {
  height: 120rpx;
  padding: 0 56rpx;
  background: rgba($primary, 0.08);
  border-radius: 48rpx;
  border: 2rpx solid rgba($primary, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba($primary, 0.08);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.97);
    background: rgba($primary, 0.12);
    border-color: rgba($primary, 0.3);
  }

  text {
    font-size: 44rpx;
    font-weight: 600;
    color: $primary;
    letter-spacing: 1rpx;
  }
}

.bottom-btn {
  height: 120rpx;
  padding: 0 72rpx;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8rpx 32rpx rgba($primary, 0.35),
    0 0 20rpx rgba($primary, 0.15);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: shimmer 3s ease-in-out infinite;
  }

  &:active {
    transform: scale(0.97);
    box-shadow: 
      0 4rpx 16rpx rgba($primary, 0.25),
      0 0 12rpx rgba($primary, 0.1);
  }

  text {
    font-size: 52rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 3rpx;
    position: relative;
    z-index: 1;
  }
}

/* === 账单汇总 === */
.bill-summary-card {
  background: $card-bg;
  border-radius: 40rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 2rpx solid rgba($primary, 0.08);
  box-shadow: 
    0 8rpx 32rpx rgba(0, 0, 0, 0.06),
    0 0 20rpx rgba($primary, 0.03);

  .bs-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 28rpx;
    padding-bottom: 20rpx;
    border-bottom: 2rpx solid rgba($primary, 0.08);
  }

  .bs-icon-wrap {
    width: 72rpx;
    height: 72rpx;
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.05));
    border-radius: 24rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba($primary, 0.12);
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.06);
  }

  .bs-icon { font-size: 44rpx; }

  .bs-title {
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 2rpx;
  }

  .bs-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20rpx;
  }

  .bs-item {
    background: rgba($primary, 0.03);
    border-radius: 28rpx;
    padding: 28rpx 20rpx;
    text-align: center;
    border: 2rpx solid rgba($primary, 0.05);
    transition: all 0.3s ease;

    &:active {
      background: rgba($primary, 0.06);
      border-color: rgba($primary, 0.12);
      transform: scale(0.98);
    }
  }

  .bs-label {
    display: block;
    font-size: 28rpx;
    color: $text-secondary;
    margin-bottom: 12rpx;
    font-weight: 500;
  }

  .bs-val {
    font-size: 48rpx;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 1rpx;
  }

  .bs-paid {
    .bs-val {
      color: $primary;
    }
  }

  .bs-payable {
    background: linear-gradient(145deg, rgba($primary, 0.08), rgba($primary, 0.03));
    border-color: rgba($primary, 0.12);
    box-shadow: 0 4rpx 16rpx rgba($primary, 0.05);
    
    .bs-val {
      color: $primary;
      font-size: 56rpx;
    }
  }
}

/* === 会员 === */
.member-section {
  padding: 0 32rpx;
  margin-bottom: 32rpx;
}

.member-login-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $card-bg;
  border-radius: 48rpx;
  padding: 48rpx;
  border: 3rpx solid rgba($primary, 0.1);
  box-shadow: 
    0 12rpx 40rpx rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.99);
    border-color: rgba($primary, 0.25);
    background: rgba($primary, 0.05);
  }

  .mlc-left {
    display: flex;
    align-items: center;
    gap: 32rpx;
  }

  .mlc-icon-wrap {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.05));
    border-radius: 50%;
    border: 3rpx solid rgba($primary, 0.15);
  }

  .mlc-icon-glow {
    display: none;
  }

  .mlc-icon {
    font-size: 64rpx;
    position: relative;
    z-index: 2;
  }

  .mlc-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .mlc-title {
    font-size: 60rpx;
    font-weight: 700;
    color: $text-primary;
  }

  .mlc-desc {
    font-size: 44rpx;
    color: $text-secondary;
  }

  .mlc-arrow-wrap {
    width: 88rpx;
    height: 88rpx;
    background: rgba($primary, 0.08);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba($primary, 0.15);
  }

  .mlc-arrow {
    font-size: 72rpx;
    color: $primary;
    font-weight: 600;
  }
}

.member-info-card {
  background: $card-bg;
  border-radius: 48rpx;
  padding: 48rpx;
  border: 3rpx solid rgba($primary, 0.15);
  box-shadow: 
    0 12rpx 40rpx rgba(0, 0, 0, 0.08),
    0 0 40rpx rgba($primary, 0.04);

  .mic-header {
    display: flex;
    align-items: center;
    gap: 32rpx;
    margin-bottom: 40rpx;
    padding-bottom: 32rpx;
    border-bottom: 2rpx solid rgba($primary, 0.1);
  }

  .mic-icon-wrap {
    position: relative;
    width: 130rpx;
    height: 130rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba($primary, 0.12), rgba($primary, 0.06));
    border-radius: 50%;
    border: 3rpx solid rgba($primary, 0.18);
  }

  .mic-ring {
    display: none;
  }

  .mic-icon {
    font-size: 72rpx;
    position: relative;
    z-index: 2;
  }

  .mic-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .mic-name {
    font-size: 64rpx;
    font-weight: 700;
    color: $text-primary;
  }

  .mic-level {
    font-size: 44rpx;
    color: $primary;
  }

  .mic-balance-wrap {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4rpx;
    padding: 20rpx 32rpx;
    background: linear-gradient(135deg, rgba($primary, 0.08), rgba($primary, 0.04));
    border-radius: 32rpx;
    border: 2rpx solid rgba($primary, 0.15);
  }

  .mic-balance {
    font-size: 72rpx;
    font-weight: 800;
    color: $primary;
  }

  .mic-balance-label {
    font-size: 36rpx;
    color: rgba($primary, 0.6);
  }

  .mic-actions {
    display: flex;
    gap: 24rpx;
    justify-content: flex-end;
  }

  .mic-action-btn {
    padding: 24rpx 48rpx;
    background: linear-gradient(135deg, rgba($primary, 0.15), rgba($primary, 0.06));
    border-radius: 32rpx;
    border: 2rpx solid rgba($primary, 0.2);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.97);
      background: linear-gradient(135deg, rgba($primary, 0.22), rgba($primary, 0.1));
    }

    text {
      font-size: 48rpx;
      font-weight: 600;
      color: $primary;
    }

    &.secondary {
      background: rgba(107, 114, 128, 0.08);
      border-color: rgba(107, 114, 128, 0.15);

      text {
        color: $text-secondary;
      }

      &:active {
        background: rgba(107, 114, 128, 0.12);
      }
    }
  }
}

/* === 支付方式 === */
.pay-methods { display: flex; gap: 12rpx; margin: 0 24rpx 12rpx; }
.pay-method { flex: 1; padding: 16rpx 12rpx; background: rgba($primary, 0.04); border: 2rpx solid rgba($primary, 0.08); border-radius: 16rpx; text-align: center; }
.pay-method.active { border-color: $primary; background: rgba($primary, 0.1); }
.pm-label { font-size: 22rpx; color: $text-secondary; display: block; }
.pm-amount { font-size: 26rpx; font-weight: 700; color: $text-primary; margin-top: 4rpx; display: block; }

/* === 消费明细列表 === */
.detail-list {
  padding: 8rpx 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 24rpx;
  margin-bottom: 8rpx;
  background: rgba($primary, 0.03);
  border-radius: 24rpx;
  border: 2rpx solid rgba($primary, 0.05);
  transition: all 0.3s ease;

  &:active {
    background: rgba($primary, 0.06);
    border-color: rgba($primary, 0.1);
    transform: scale(0.99);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.di-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}

.di-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2rpx solid rgba($primary, 0.1);
  background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.03));

  &.di-icon-table {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.04));
    border-color: rgba(99, 102, 241, 0.15);
  }

  &.di-icon-product {
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.04));
    border-color: rgba($primary, 0.15);
  }

  &.di-icon-assistant {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.04));
    border-color: rgba(236, 72, 153, 0.15);
  }

  &.di-icon-charging {
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(251, 146, 60, 0.04));
    border-color: rgba(251, 146, 60, 0.15);
  }

  &.di-icon-merge_fee {
    background: linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(147, 51, 234, 0.04));
    border-color: rgba(147, 51, 234, 0.15);
  }
}

.di-icon {
  font-size: 36rpx;
}

.di-info {
  flex: 1;
  min-width: 0;
}

.di-name {
  font-size: 42rpx;
  color: $text-primary;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
  letter-spacing: 1rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.di-meta-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
}

.di-meta {
  font-size: 32rpx;
  color: $text-secondary;
  font-weight: 500;
}

.di-status-tag {
  font-size: 28rpx;
  padding: 6rpx 18rpx;
  border-radius: 16rpx;
  font-weight: 600;

  &.pending, &.preorder_pending {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
    border: 2rpx solid rgba(245, 158, 11, 0.15);
  }

  &.processing {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 2rpx solid rgba(59, 130, 246, 0.15);
  }

  &.delivered {
    background: rgba($primary, 0.1);
    color: $primary;
    border: 2rpx solid rgba($primary, 0.15);
  }

  &.serving {
    background: rgba($primary, 0.1);
    color: $primary;
    border: 2rpx solid rgba($primary, 0.15);
  }

  &.completed {
    background: rgba(107, 114, 128, 0.08);
    color: $text-secondary;
    border: 2rpx solid rgba(107, 114, 128, 0.12);
  }

  &.active {
    background: rgba($primary, 0.1);
    color: $primary;
    border: 2rpx solid rgba($primary, 0.15);
  }

  &.cancelled {
    background: rgba(239, 68, 68, 0.08);
    color: rgba(239, 68, 68, 0.6);
    border: 2rpx solid rgba(239, 68, 68, 0.12);
  }
}

.di-right {
  text-align: right;
  flex-shrink: 0;
}

.di-price {
  font-size: 46rpx;
  font-weight: 700;
  color: $text-primary;
  display: block;
  letter-spacing: 1rpx;
}

.di-paid-tag {
  font-size: 26rpx;
  color: $primary;
  background: rgba($primary, 0.1);
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  margin-top: 8rpx;
  display: inline-block;
  border: 2rpx solid rgba($primary, 0.15);
}

.fee-panel-footer {
  margin-top: 16rpx;
  padding: 20rpx 24rpx;
  background: rgba($primary, 0.04);
  border-radius: 20rpx;
  border: 2rpx solid rgba($primary, 0.08);
}

.discount-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 0;
  margin-bottom: 12rpx;
  border-bottom: 2rpx dashed rgba($primary, 0.08);

  .dr-left {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  .dr-icon {
    font-size: 36rpx;
  }

  .dr-name {
    font-size: 38rpx;
    color: $primary;
    font-weight: 600;
  }

  .dr-price {
    font-size: 44rpx;
    font-weight: 700;
    color: $primary;
    letter-spacing: 1rpx;
  }
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;

  .total-label {
    font-size: 44rpx;
    font-weight: 700;
    color: $text-primary;
    letter-spacing: 2rpx;
  }

  .total-price {
    font-size: 60rpx;
    font-weight: 800;
    color: $primary;
    letter-spacing: 3rpx;
  }
}

</style>
