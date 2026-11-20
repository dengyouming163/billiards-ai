<template>
  <view class="page">
    <!-- Date Filter -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: dateType === 'today' }" @click="setDate('today')">今天</view>
      <view class="filter-item" :class="{ active: dateType === 'week' }" @click="setDate('week')">本周</view>
      <view class="filter-item" :class="{ active: dateType === 'month' }" @click="setDate('month')">本月</view>
      <view class="filter-item" :class="{ active: dateType === 'all' }" @click="setDate('all')">全部</view>
      <view class="filter-item" :class="{ active: dateType === 'custom' }" @click="setDate('custom')">自定义</view>
    </view>
    <view class="custom-date" v-if="dateType === 'custom'">
      <picker mode="date" :value="customStart" :end="customEnd || todayStr" @change="onStartChange">
        <view class="date-chip">{{ customStart || '开始日期' }}</view>
      </picker>
      <text class="date-sep">至</text>
      <picker mode="date" :value="customEnd" :start="customStart" :end="todayStr" @change="onEndChange">
        <view class="date-chip">{{ customEnd || '结束日期' }}</view>
      </picker>
      <view class="date-btn" @click="loadData">确定</view>
    </view>

    <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <StateView :loading="loading && list.length === 0"
        :empty="!loading && list.length === 0" :error="hasError"
        empty-msg="暂无服务订单" error-msg="加载失败" @retry="loadData">
        <view class="card-list">
          <view class="order-card" v-for="item in list" :key="item.id">
            <view class="card-head">
              <text class="order-no">#{{ item.order_no }}</text>
              <view class="order-status" :class="'s-' + item.status">
                {{ statusText(item.status) }}
              </view>
            </view>
            <view class="card-body">
              <view class="info-row">
                <text class="info-label">台桌</text>
                <text class="info-value">{{ item.table_name || item.table_no || '-' }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">学员</text>
                <text class="info-value">{{ item.student_name || '-' }}</text>
              </view>
              <view class="info-row" v-if="item.duration || item.actual_duration">
                <text class="info-label">时长</text>
                <text class="info-value">{{ item.actual_duration || item.duration }}分钟</text>
              </view>
              <view class="info-row">
                <text class="info-label">时间</text>
                <text class="info-value">{{ formatTime(item.created_at) }}</text>
              </view>
            </view>
            <view class="card-foot">
              <text class="order-amount">¥{{ $n(item.total_amount || item.actual_amount || 0).toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </StateView>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAllAssistantOrders } from '@/api/modules/order'
import StateView from '@/components/StateView.vue'

const list = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)
const dateType = ref('month')
const customStart = ref('')
const customEnd = ref('')
const todayStr = new Date().toISOString().split('T')[0]

function $n(v: any) { const n = Number(v); return isNaN(n) ? 0 : n }

function statusText(s: string) {
  const m: Record<string, string> = { pending: '待处理', in_progress: '进行中', completed: '已完成', cancelled: '已取消' }
  return m[s] || s || '-'
}

function formatTime(t: string) {
  if (!t) return '-'
  const d = new Date(t.replace('T', ' '))
  const m = String(d.getMonth()+1).padStart(2,'0')
  const day = String(d.getDate()).padStart(2,'0')
  const h = String(d.getHours()).padStart(2,'0')
  const min = String(d.getMinutes()).padStart(2,'0')
  return `${m}-${day} ${h}:${min}`
}

function setDate(type: string) { dateType.value = type; loadData() }

function getDateRange() {
  const now = new Date()
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  if (dateType.value === 'today') return { start_date: fmt(now), end_date: fmt(now) }
  if (dateType.value === 'custom') return { start_date: customStart.value, end_date: customEnd.value }
  if (dateType.value === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1)
    return { start_date: fmt(start), end_date: fmt(now) }
  }
  if (dateType.value === 'month') {
    return { start_date: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end_date: fmt(now) }
  }
  return {}
}
function onStartChange(e: any) { customStart.value = e.detail.value }
function onEndChange(e: any) { customEnd.value = e.detail.value }

onMounted(() => { loadData() })

async function loadData() {
  loading.value = true; hasError.value = false
  try {
    const params: any = { page_size: 100, ...getDateRange() }
    const result = await getAllAssistantOrders(params)
    list.value = Array.isArray(result) ? result : (result.list || result.data || [])
  } catch { hasError.value = true; list.value = []
  } finally { loading.value = false; refreshing.value = false }
}

function onRefresh() { refreshing.value = true; loadData() }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #0f172a; display: flex; flex-direction: column; }
.filter-bar { display: flex; gap: 16rpx; padding: 16rpx 24rpx; background: rgba(30, 41, 59, 0.7); flex-shrink: 0; border: 1rpx solid rgba(71, 85, 105, 0.3); }
.filter-item { padding: 12rpx 28rpx; border-radius: 20rpx; font-size: 26rpx; color: #94a3b8; background: rgba(71, 85, 105, 0.3); }
.filter-item.active { background: #f59e0b; color: #fff; font-weight: 600; }
.custom-date { display: flex; align-items: center; gap: 12rpx; padding: 12rpx 24rpx; background: rgba(30, 41, 59, 0.7); border: 1rpx solid rgba(71, 85, 105, 0.3); }
.date-chip { padding: 10rpx 20rpx; background: rgba(71, 85, 105, 0.3); border-radius: 12rpx; font-size: 24rpx; color: #f8fafc; }
.date-sep { font-size: 24rpx; color: #64748b; }
.date-btn { padding: 10rpx 24rpx; background: #f59e0b; color: #fff; border-radius: 12rpx; font-size: 24rpx; }
.content-scroll { flex: 1; padding: 16rpx 24rpx; }
.card-list { display: flex; flex-direction: column; gap: 12rpx; padding-bottom: 40rpx; }
.order-card { background: rgba(30, 41, 59, 0.7); border-radius: 20rpx; padding: 20rpx 24rpx; border: 1rpx solid rgba(71, 85, 105, 0.3); }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.order-no { font-size: 24rpx; color: #64748b; }
.order-status { font-size: 22rpx; padding: 4rpx 12rpx; border-radius: 12rpx; font-weight: 500; }
.s-completed { background: rgba(71, 85, 105, 0.3); color: #f59e0b; }
.s-in_progress { background: rgba(96, 165, 250, 0.15); color: #60a5fa; }
.s-cancelled { background: rgba(248, 113, 113, 0.15); color: #f87171; }
.s-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
.card-body { display: flex; flex-direction: column; gap: 6rpx; margin-bottom: 12rpx; }
.info-row { display: flex; justify-content: space-between; }
.info-label { font-size: 24rpx; color: #64748b; }
.info-value { font-size: 26rpx; color: #f8fafc; }
.card-foot { text-align: right; padding-top: 12rpx; border-top: 1rpx solid rgba(71, 85, 105, 0.3); }
.order-amount { font-size: 32rpx; font-weight: 700; color: #dc2626; }
</style>
