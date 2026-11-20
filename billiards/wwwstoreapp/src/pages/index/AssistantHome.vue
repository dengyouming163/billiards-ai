<template>
  <view class="assistant-home page-content">
    <view class="status-card">
      <view class="status-left">
        <view class="status-dot" :class="status === 1 || status === 2 ? 'active' : ''"></view>
        <view class="status-info">
          <text class="status-text">{{ statusLabel }}</text>
          <text class="status-sub">{{ profile.today_orders }}单 / {{ formatDuration(profile.today_duration) }}</text>
        </view>
      </view>
      <view class="status-right">
        <view v-if="status === 0" class="status-btn on" @click="handleGoOnline">上线接单</view>
        <view v-else-if="status === 1" class="status-btn off" @click="handleGoOffline">停止接单</view>
        <view v-else class="status-btn busy">服务中</view>
      </view>
    </view>

    <view class="stats-row">
      <view class="stat-item">
        <view class="stat-icon-wrap">
          <text class="stat-emoji">📋</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ profile.today_orders || 0 }}</text>
          <text class="stat-label">今日接单</text>
        </view>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <view class="stat-icon-wrap">
          <text class="stat-emoji">⏱</text>
        </view>
        <view class="stat-content">
          <text class="stat-value">{{ formatDuration(profile.today_duration || 0) }}</text>
          <text class="stat-label">服务时长</text>
        </view>
      </view>
    </view>

    <view class="section-bar">
      <text class="section-title">接单列表</text>
      <text class="section-link" @click="goMyOrders">我的订单</text>
    </view>

    <view class="status-tabs">
      <view class="tabs-inner">
        <view v-for="tab in statusTabs" :key="tab.key" class="tab-item"
          :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <text>{{ tab.label }}{{ tab.key === 'all' ? ' ' + orders.length : '' }}</text>
        </view>
      </view>
    </view>

    <StateView :loading="loading" :empty="!loading && orders.length === 0" empty-msg="暂无订单"
      :error="hasError" error-msg="加载失败" @retry="loadOrders">
      <view class="order-list">
        <view v-for="order in orders" :key="order.id" class="order-card" @click="handleOrderClick(order)">
          <view class="order-left">
            <view class="order-table-tag">
              <text class="table-icon">🎱</text>
              <text class="table-no">{{ order.table_no || order.table_name }}</text>
            </view>
            <text class="order-no">#{{ order.order_no }}</text>
            <view class="order-meta">
              <view class="meta-item">
                <text class="meta-emoji">👤</text>
                <text>{{ order.student_name || '-' }}</text>
              </view>
              <view class="meta-item" v-if="order.status === 'in_progress' && order.start_time">
                <text class="meta-emoji">⏱</text>
                <text class="timer">{{ getElapsed(order.start_time) }}</text>
              </view>
            </view>
          </view>
          <view class="order-right">
            <view class="order-price">¥{{ order.price || order.total_amount || order.amount || 0 }}</view>
            <view class="order-status" :class="'st-'+order.status">{{ order.status_name || statusText(order.status) }}</view>
            <view class="order-actions" v-if="order.status === 'accepted' || order.status === 'in_progress'">
              <button v-if="order.status === 'accepted'" class="btn-action btn-start" @click.stop="handleStart(order)">开始服务</button>
              <button v-if="order.status === 'in_progress'" class="btn-action btn-end" @click.stop="handleComplete(order)">结束服务</button>
            </view>
          </view>
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
''

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
  return h > 0 ? `${h}h${m}m` : `${m}m`
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

function handleOrderClick(order: any) {
  if (order.status === 'in_progress') {
    uni.navigateTo({ url: `/pages/assistant-orders/detail?id=${order.id}` })
  }
}

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
  padding: 24rpx;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.page-content { padding-bottom: calc(env(safe-area-inset-bottom) + 132rpx); }

.status-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.status-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #cccccc;
}

.status-dot.active {
  background: #07C160;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.status-text {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.status-sub {
  font-size: 22rpx;
  color: #999999;
}

.status-right {
  flex-shrink: 0;
}

.status-btn {
  padding: 14rpx 32rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.status-btn.on {
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;
  border: 1rpx solid #07C160;
}

.status-btn.off {
  background: rgba(255, 82, 82, 0.1);
  color: #FF5252;
  border: 1rpx solid #FF5252;
}

.status-btn.busy {
  background: rgba(255, 151, 106, 0.1);
  color: #FF976A;
  border: 1rpx solid #FF976A;
}

.stats-row {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.stat-icon-wrap {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: rgba(7, 193, 96, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-emoji {
  font-size: 28rpx;
  line-height: 1;
}

.meta-emoji {
  font-size: 22rpx;
  line-height: 1;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
}

.stat-divider {
  width: 1rpx;
  height: 48rpx;
  background: #e5e5e5;
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rpx 0;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
}

.section-link {
  font-size: 26rpx;
  color: #07C160;
  font-weight: 600;
}

.status-tabs {
  width: 100%;
  overflow-x: auto;
  padding: 4rpx 0;
}

.tabs-inner {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}

.tab-item {
  padding: 12rpx 28rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #999999;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background: #ffffff;
  border-radius: 999rpx;
  flex-shrink: 0;
  transition: all 0.2s;
}

.tab-item.active {
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;
  font-weight: 600;
  border: 1rpx solid #07C160;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.order-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  gap: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.order-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.order-table-tag {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.table-icon {
  font-size: 28rpx;
}

.table-no {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.order-no {
  font-size: 24rpx;
  color: #999999;
}

.order-meta {
  display: flex;
  gap: 20rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 22rpx;
  color: #999999;
}

.meta-item .timer {
  color: #007AFF;
  font-variant-numeric: tabular-nums;
}

.order-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
  flex-shrink: 0;
}

.order-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #FF976A;
}

.order-status {
  font-size: 22rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.st-pending { background: rgba(255, 151, 106, 0.1); color: #FF976A; }
.st-accepted, .st-in_progress { background: rgba(0, 122, 255, 0.1); color: #007AFF; }
.st-completed { background: rgba(7, 193, 96, 0.1); color: #07C160; }

.order-actions {
  margin-top: 4rpx;
}

.btn-action {
  height: 64rpx;
  padding: 0 32rpx;
  border-radius: 32rpx;
  font-size: 26rpx;
  font-weight: 700;
  border: none;
  transition: transform 0.15s ease;
}

.btn-action:active {
  transform: scale(0.97);
}

.btn-start {
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;
  border: 1rpx solid #07C160;
}

.btn-end {
  background: rgba(255, 82, 82, 0.1);
  color: #FF5252;
  border: 1rpx solid #FF5252;
}

.order-actions button::after {
  border: none;
}
</style>