<template>
  <view class="assistant-home page-content">
    <view class="hero-card">
      <view class="hero-stats">
        <view class="hero-stat-card">
          <view class="hero-stat-icon-wrap">
            <text class="hero-stat-icon">📋</text>
          </view>
          <view class="hero-stat-info">
            <text class="hero-stat-value">{{ profile.today_orders || 0 }}</text>
            <text class="hero-stat-label">接单量</text>
          </view>
        </view>
        <view class="hero-stat-card">
          <view class="hero-stat-icon-wrap">
            <text class="hero-stat-icon">⏱</text>
          </view>
          <view class="hero-stat-info">
            <text class="hero-stat-value">{{ formatDuration(profile.today_duration || 0) }}</text>
            <text class="hero-stat-label">服务时长</text>
          </view>
        </view>
      </view>

      <view class="hero-status-bar">
        <view class="hero-status-left">
          <view class="hero-status-dot" :class="status === 1 || status === 2 ? 'active' : ''"></view>
          <text class="hero-status-text">{{ statusLabel }}</text>
        </view>
        <view class="hero-status-right">
          <view v-if="status === 0" class="hero-switch-btn on" @click="handleGoOnline">上线接单</view>
          <view v-else-if="status === 1" class="hero-switch-btn off" @click="handleGoOffline">停止接单</view>
          <view v-else class="hero-switch-btn busy">服务中</view>
        </view>
      </view>
    </view>

    <view class="section-bar">
      <text class="section-title">接单列表</text>
      <text class="section-link" @click="goMyOrders">📋 我的订单</text>
    </view>

    <scroll-view class="status-tabs" scroll-x :show-scrollbar="false">
      <view class="tabs-inner">
        <view v-for="tab in statusTabs" :key="tab.key" class="tab-item"
          :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <text>{{ tab.label }}{{ tab.key === 'all' ? ' ' + orders.length : '' }}</text>
        </view>
      </view>
    </scroll-view>

    <StateView :loading="loading" :empty="!loading && orders.length === 0" empty-msg="暂无订单"
      :error="hasError" error-msg="加载失败" @retry="loadOrders">
      <view v-for="order in orders" :key="order.id" class="order-card">
        <view class="oc-head">
          <view class="oc-head-left">
            <text class="oc-table">桌 {{ order.table_no || order.table_name }}</text>
            <text class="oc-no">#{{ order.order_no }}</text>
          </view>
          <view class="oc-status" :class="'st-'+order.status">{{ order.status_name || statusText(order.status) }}</view>
        </view>

        <view class="oc-body">
          <view class="oc-grid">
            <view class="oc-grid-item">
              <text class="oc-grid-label">客户</text>
              <text class="oc-grid-value">{{ order.student_name || '-' }}</text>
            </view>
            <view class="oc-grid-item">
              <text class="oc-grid-label">金额</text>
              <text class="oc-grid-price">¥{{ order.price || order.total_amount || order.amount || 0 }}</text>
            </view>
            <view class="oc-grid-item" v-if="order.status === 'in_progress' && order.start_time">
              <text class="oc-grid-label">计时</text>
              <text class="oc-grid-timer">{{ getElapsed(order.start_time) }}</text>
            </view>
          </view>
        </view>

        <view class="oc-foot">
          <text v-if="order.status === 'pending'" class="oc-hint">等待收银确认</text>
          <button v-if="order.status === 'accepted'" class="btn-action btn-start" @click="handleStart(order)">开始服务</button>
          <button v-if="order.status === 'in_progress'" class="btn-action btn-end" @click="handleComplete(order)">结束服务</button>
          <text v-if="order.status === 'completed'" class="oc-done">已完成</text>
        </view>
      </view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getProfile, goOnline, goOffline, getAssistantStatus, type ProfileData } from '@/api/modules/profile'
import { getAssistantOrderList } from '@/api/modules/order'
import StateView from '@/components/StateView.vue'

const profile = ref<ProfileData>({ id: '', name: '', phone: '', role: '', store_name: '', join_time: '', avatar: '', nickname: '', signature: '', tags: [], album: [], services: [], today_income: 0, today_orders: 0, today_duration: 0, status: 0 })
const status = ref(0)
const loading = ref(false)
const hasError = ref(false)
const activeTab = ref('all')
const orders = ref<any[]>([])
const now = ref(Date.now())

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'accepted', label: '已确认' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const statusLabel = computed(() => status.value === 0 ? '未上线' : status.value === 1 ? '在线接单中' : '服务中')
const todayIncome = computed(() => profile.value.today_income || 0)

function statusText(s: string): string {
  const map: Record<string, string> = { pending: '待确认', accepted: '已确认', in_progress: '服务中', completed: '已完成' }
  return map[s] || s
}

function getElapsed(startTime: string): string {
  if (!startTime) return ''
  const diff = Math.floor((now.value - new Date(startTime.replace('T', ' ')).getTime()) / 1000)
  const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0分钟'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}

async function initStatus() {
  try { const res = await getAssistantStatus(); status.value = res.status ?? 0 }
  catch { status.value = 0 }
}

async function loadProfile() {
  try { const data = await getProfile(); profile.value = data; status.value = data.status ?? status.value }
  catch { /* silent */ }
}

async function loadOrders() {
  loading.value = true
  hasError.value = false
  try {
    const params: any = { page_no: 1, page_size: 50 }
    if (activeTab.value !== 'all') params.status = activeTab.value
    const result = await getAssistantOrderList(params)
    orders.value = result.list || []
  } catch { hasError.value = true }
  finally { loading.value = false }
}

function switchTab(key: string) { activeTab.value = key; loadOrders() }

async function handleGoOnline() {
  try { await goOnline(); status.value = 1; uni.showToast({ title: '已上线', icon: 'success' }) }
  catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
}

async function handleGoOffline() {
  uni.showModal({
    title: '确认下线', content: '下线后不再接收新订单，但进行中的服务不受影响',
    success: async (res) => {
      if (!res.confirm) return
      try { await goOffline(); status.value = 0; uni.showToast({ title: '已下线', icon: 'success' }) }
      catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function handleStart(order: any) {
  uni.showModal({
    title: '开始服务', content: `确认开始为${order.student_name || ''}服务？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const { orderStore } = await import('@/stores/order')
        await orderStore.start(order.id)
        status.value = 2
        uni.showToast({ title: '服务已开始', icon: 'success' })
        loadOrders()
      } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function handleComplete(order: any) {
  uni.showModal({
    title: '结束服务', content: '确认结束当前服务？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const { orderStore } = await import('@/stores/order')
        await orderStore.complete(order.id)
        status.value = 1
        uni.showToast({ title: '服务已结束', icon: 'success' })
        loadOrders()
      } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

function goMyOrders() { uni.navigateTo({ url: '/pages/assistant-orders/index' }) }

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  initStatus(); loadProfile(); loadOrders()
  pollTimer = setInterval(loadOrders, 15000)
  tickTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})

defineExpose({ loadOrders })
</script>

<style lang="scss" scoped>
.assistant-home {
  min-height: 100vh;
  padding: 30rpx 24rpx 0;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.page-content {
  padding-bottom: calc(env(safe-area-inset-bottom) + 132rpx);
}

.hero-card {
  margin-top: 8rpx;
  padding: 36rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  box-shadow: 0 16rpx 48rpx rgba(5, 150, 105, 0.25);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 8rpx 0 24rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.15);
}

.hero-stat-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.hero-stat-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-stat-icon {
  font-size: 32rpx;
}

.hero-stat-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.hero-stat-value {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
}

.hero-stat-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.65);
}

.hero-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24rpx;
}

.hero-status-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hero-status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.hero-status-dot.active {
  background: #fff;
  box-shadow: 0 0 12rpx rgba(255, 255, 255, 0.6);
}

.hero-status-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.hero-status-right {
  flex-shrink: 0;
}

.hero-switch-btn {
  padding: 18rpx 40rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.hero-switch-btn.on {
  background: #fff;
  color: #059669;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
}

.hero-switch-btn.off {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.hero-switch-btn.busy {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rpx 4rpx 0;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.section-link {
  font-size: 26rpx;
  color: #059669;
  font-weight: 700;
}

.status-tabs {
  width: 100%;
  white-space: nowrap;
  padding: 4rpx 0;
}

.tabs-inner {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  min-width: 100%;
}

.assistant-home :deep(.state-content) {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tab-item {
  padding: 16rpx 34rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background: #fff;
  border-radius: 36rpx;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item.active {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8rpx 18rpx rgba(5, 150, 105, 0.22);
}

.order-card {
  background: #fff;
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.oc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.oc-head-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.oc-table {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.oc-no {
  font-size: 24rpx;
  color: #9ca3af;
}

.oc-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 10rpx 22rpx;
  border-radius: 24rpx;
}

.st-pending { background: rgba(255, 149, 0, 0.1); color: #e67c00; }
.st-accepted, .st-in_progress { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.st-completed { background: rgba(52, 199, 89, 0.1); color: #22c55e; }

.oc-body {
  margin-bottom: 20rpx;
}

.oc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.oc-grid-item {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
}

.oc-grid-label {
  font-size: 22rpx;
  color: #9ca3af;
  display: block;
  margin-bottom: 8rpx;
}

.oc-grid-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
}

.oc-grid-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #059669;
}

.oc-grid-timer {
  font-size: 28rpx;
  font-weight: 600;
  color: #3b82f6;
  font-variant-numeric: tabular-nums;
}

.oc-foot {
  text-align: center;
  padding-top: 16rpx;
}

.oc-hint {
  font-size: 26rpx;
  color: #9ca3af;
}

.oc-done {
  font-size: 26rpx;
  color: #059669;
  font-weight: 600;
}

.btn-action {
  height: 88rpx;
  padding: 0 64rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  transition: transform 0.15s ease;
}

.btn-action:active {
  transform: scale(0.97);
}

.btn-start {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(5, 150, 105, 0.25);
}

.btn-end {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.25);
}

.oc-foot button::after {
  border: none;
}
</style>