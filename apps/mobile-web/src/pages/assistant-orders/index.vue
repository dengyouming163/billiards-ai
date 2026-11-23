<template>
  <view class="page">
    <!-- 日期筛选 -->
    <view class="date-tabs">
      <view v-for="d in dateOptions" :key="d.key" class="date-tab" :class="{ active: dateType === d.key }" @click="switchDate(d.key)">
        <text>{{ d.label }}</text>
      </view>
    </view>
    <view v-if="dateType === 'custom'" class="custom-range">
      <picker mode="date" :value="customStart" :end="todayStr" @change="onStartChange">
        <view class="range-picker">{{ customStart || '开始日期' }}</view>
      </picker>
      <text class="range-sep">至</text>
      <picker mode="date" :value="customEnd" :end="todayStr" @change="onEndChange">
        <view class="range-picker">{{ customEnd || '结束日期' }}</view>
      </picker>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-row">
      <view class="stat-item"><text class="stat-val">{{ stats.total_orders || 0 }}</text><text class="stat-lbl">总订单</text></view>
      <view class="stat-item"><text class="stat-val">{{ stats.total_hours || 0 }}h</text><text class="stat-lbl">总时长</text></view>
      <view class="stat-item"><text class="stat-val">¥{{ stats.total_revenue || 0 }}</text><text class="stat-lbl">总提成</text></view>
    </view>

    <view class="list-section">
      <StateView :loading="loading" :empty="list.length === 0 && !loading" empty-msg="暂无服务记录" :error="hasError" error-msg="加载失败" @retry="loadAll">
        <view v-for="item in list" :key="item.id" class="record-card">
          <view class="rc-head">
            <text class="rc-no">#{{ item.order_no }}</text>
            <text class="rc-date">{{ item.start_time || item.created_at }}</text>
          </view>
          <view class="rc-body">
            <view class="rc-row"><text>桌台</text><text>{{ item.table_no || '-' }}</text></view>
            <view class="rc-row"><text>时长</text><text>{{ item.duration_minutes ? Math.floor(item.duration_minutes / 60) + 'h' + (item.duration_minutes % 60) + 'm' : '-' }}</text></view>
            <view class="rc-row"><text>服务费</text><text>¥{{ item.assistant_fee || 0 }}</text></view>
            <view class="rc-row total"><text>提成</text><text class="emerald fw">¥{{ item.commission_amount || 0 }}</text></view>
          </view>
        </view>
      </StateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssistantRecords, getAssistantStats } from '@/api/modules/order'
import StateView from '@/components/StateView.vue'

const dateType = ref('today')
const dateOptions = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' },
]
const customStart = ref('')
const customEnd = ref('')
const todayStr = new Date().toISOString().split('T')[0]

function onStartChange(e: any) { customStart.value = e.detail.value; loadAll() }
function onEndChange(e: any) { customEnd.value = e.detail.value; loadAll() }

const list = ref<any[]>([])
const stats = ref({ total_orders: 0, total_hours: 0, total_revenue: 0 })
const loading = ref(false)
const hasError = ref(false)

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  const fmt = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  switch (dateType.value) {
    case 'today': return { start: fmt(now), end: fmt(now) }
    case 'yesterday': {
      const y = new Date(now); y.setDate(y.getDate() - 1)
      return { start: fmt(y), end: fmt(y) }
    }
    case 'month': {
      return { start: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01', end: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)) }
    }
    case 'custom': return { start: customStart.value, end: customEnd.value }
    default: return { start: '', end: '' }
  }
}

function switchDate(key: string) { dateType.value = key; loadAll() }

async function loadAll() {
  const { start, end } = getDateRange()
  const params = { page_no: 1, page_size: 50, start_date: start, end_date: end }

  loading.value = true; hasError.value = false
  try {
    const [recRes, statsRes] = await Promise.all([
      getAssistantRecords(params),
      getAssistantStats({ start_date: start, end_date: end } as any),
    ])
    list.value = (recRes as any).list || (recRes as any).data || []
    const s: any = statsRes
    stats.value = {
      total_orders: s.order_count || 0,
      total_hours: s.total_duration ? Math.round(s.total_duration / 60) : 0,
      total_revenue: s.total_income || 0,
    }
  } catch { hasError.value = true }
  finally { loading.value = false }
}

onMounted(() => loadAll())
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fafafa; padding: 24rpx; }
.date-tabs { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.date-tab { padding: 12rpx 28rpx; font-size: 24rpx; font-weight: 500; color: #6b7280; background: #f3f4f6; border-radius: 20rpx; transition: all 0.2s; }
.date-tab.active { background: #059669; color: #fff; font-weight: 600; }
.custom-range { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.range-picker { padding: 14rpx 24rpx; background: #f3f4f6; border-radius: 14rpx; font-size: 24rpx; color: #374151; }
.range-sep { font-size: 24rpx; color: #9ca3af; }
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 24rpx; }
.stat-item { background: #fff; border-radius: 16rpx; padding: 28rpx 16rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.stat-val { display: block; font-size: 36rpx; font-weight: 700; color: #059669; margin-bottom: 8rpx; }
.stat-lbl { font-size: 24rpx; color: #9ca3af; }
.record-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.rc-head { display: flex; justify-content: space-between; margin-bottom: 16rpx; padding-bottom: 12rpx; border-bottom: 1rpx solid #f3f4f6; }
.rc-no { font-size: 28rpx; font-weight: 600; color: #1f2937; }
.rc-date { font-size: 24rpx; color: #9ca3af; }
.rc-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #6b7280; }
.rc-row.total { border-top: 1rpx solid #f3f4f6; margin-top: 8rpx; padding-top: 14rpx; }
.emerald { color: #059669; }
.fw { font-weight: 700; font-size: 30rpx; }
</style>
