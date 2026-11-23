<template>
  <view class="page">
    <Header />
    <StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadToday">
      <view class="content-wrap">
        <!-- 今日概览 -->
        <view class="hero-section">
          <view class="hero-bg"></view>
          <view class="hero-content">
            <view class="hero-copy">
              <text class="hero-eyebrow">业绩中心</text>
              <text class="hero-title">服务时长报表</text>
            </view>
            <view class="stats-grid">
              <view class="stat-card">
                <text class="stat-value">{{ todayOrders }}</text>
                <text class="stat-label">服务订单</text>
              </view>
              <view class="stat-card">
                <text class="stat-value">{{ formatDuration(todayDuration) }}</text>
                <text class="stat-label">服务时长</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 服务时长明细 -->
        <view class="section-card">
          <view class="section-header">
            <text class="section-title">服务时长明细</text>
          </view>

          <!-- 日期筛选 -->
          <view class="date-picker-bar">
            <view class="quick-dates">
              <view v-for="d in dateOptions" :key="d.key" class="date-chip"
                :class="{ active: dateType === d.key }" @click="switchDate(d.key)">
                <text>{{ d.label }}</text>
              </view>
              <view class="date-chip" :class="{ active: dateType === 'custom' }" @click="openCustomDate">
                <text>自定义</text>
              </view>
            </view>
            <view v-if="showCustomDate" class="custom-range">
              <picker mode="date" :value="customStart" :end="todayStr()" @change="onStartChange" class="date-picker">
                <view class="date-pick-box">{{ customStart || '开始日期' }}</view>
              </picker>
              <text class="date-sep">至</text>
              <picker mode="date" :value="customEnd" :end="todayStr()" @change="onEndChange" class="date-picker">
                <view class="date-pick-box">{{ customEnd || '结束日期' }}</view>
              </picker>
            </view>
          </view>

          <!-- 汇总 -->
          <view class="summary-row">
            <view class="summary-item">
              <text class="summary-val">{{ durationList.length }}</text>
              <text class="summary-lbl">服务单数</text>
            </view>
            <view class="summary-item">
              <text class="summary-val">{{ formatDuration(totalDuration) }}</text>
              <text class="summary-lbl">总时长</text>
            </view>
            <view class="summary-item">
              <text class="summary-val">{{ formatDuration(avgDuration) }}</text>
              <text class="summary-lbl">均时</text>
            </view>
          </view>

          <!-- 列表 -->
          <view v-if="durationList.length > 0" class="duration-list">
            <view v-for="(item, idx) in durationList" :key="idx" class="duration-row">
              <view class="dr-left">
                <text class="dr-date">{{ item.date }}</text>
                <text class="dr-weekday">{{ item.weekday }}</text>
              </view>
              <view class="dr-mid">
                <text class="dr-table">{{ item.table_name || '-' }}</text>
              </view>
              <view class="dr-right">
                <text class="dr-duration">{{ formatDuration(item.duration_minutes || 0) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-hint">
            <text>该时间段暂无需服务数据</text>
          </view>
        </view>

        <!-- 每日汇总 · 助教服务 -->
        <view class="section-card daily-section">
          <view class="section-header">
            <text class="section-title">每日汇总 · 助教服务</text>
            <text v-if="dailyLoading" class="refresh-hint">加载中...</text>
            <text v-else class="refresh-hint" @click="loadDailySummary">刷新</text>
          </view>

          <!-- 日期选择 (复用时服务时长明细的筛选) -->
          <view class="date-picker-bar">
            <view class="quick-dates">
              <view v-for="d in dailyDateOptions" :key="d.key" class="date-chip"
                :class="{ active: dailyDateType === d.key }" @click="switchDailyDate(d.key)">
                <text>{{ d.label }}</text>
              </view>
              <view class="date-chip" :class="{ active: dailyDateType === 'custom' }" @click="openDailyCustom">
                <text>自定义</text>
              </view>
            </view>
            <view v-if="showDailyCustom" class="custom-range">
              <picker mode="date" :value="dailyCustomStart" @change="onDailyStartChange" class="date-picker">
                <view class="date-pick-box">{{ dailyCustomStart || '开始日期' }}</view>
              </picker>
              <text class="date-sep">至</text>
              <picker mode="date" :value="dailyCustomEnd" @change="onDailyEndChange" class="date-picker">
                <view class="date-pick-box">{{ dailyCustomEnd || '结束日期' }}</view>
              </picker>
            </view>
            <text class="date-hint">最多查询30天</text>
          </view>

          <view v-if="dailyList.length > 0" class="daily-list">
            <view v-for="(day, idx) in dailyList" :key="idx" class="daily-row">
              <view class="daily-left">
                <text class="daily-date">{{ day.date }}</text>
                <text class="daily-weekday">{{ day.weekday }}</text>
              </view>
              <view class="daily-right">
                <text class="daily-stat">{{ day.order_count }}单</text>
                <text class="daily-stat">{{ formatDuration(day.total_duration) }}</text>
              </view>
            </view>
          </view>
          <view v-else-if="!dailyLoading" class="empty-hint">
            <text>暂无数据</text>
          </view>
        </view>
      </view>
    </StateView>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getPerformance, getDurationReport, getDailySummary } from '@/api/modules/performance'
import type { TodayPerformance, DurationReportItem, DailySummaryItem } from '@/api/modules/performance'
import TabBar from '@/components/TabBar.vue'
import Header from '@/components/Header.vue'
import StateView from '@/components/StateView.vue'

const todayData = ref<TodayPerformance>({
  today_income: 0, today_orders: 0, today_duration: 0, today_rating: 0
})
const durationList = ref<DurationReportItem[]>([])
const loading = ref(false)
const hasError = ref(false)

const todayOrders = computed(() => todayData.value?.today_orders || 0)
const todayDuration = computed(() => todayData.value?.today_duration || 0)

const totalDuration = computed(() => durationList.value.reduce((s, i) => s + (i.duration_minutes || 0), 0))
const avgDuration = computed(() => {
  if (durationList.value.length === 0) return 0
  return Math.round(totalDuration.value / durationList.value.length)
})

const todayStr = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const dateType = ref('week')
const customStart = ref(todayStr())
const customEnd = ref(todayStr())
const showCustomDate = ref(false)

const dateOptions = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
]

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  const fd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  switch (dateType.value) {
    case 'week': {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
      return { start: fd(mon), end: fd(now) }
    }
    case 'month': {
      return { start: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01', end: fd(now) }
    }
    case 'custom': return { start: customStart.value, end: customEnd.value }
    default: return { start: fd(now), end: fd(now) }
  }
}

function switchDate(key: string) {
  dateType.value = key
  showCustomDate.value = false
  loadDurationReport()
}

function openCustomDate() { dateType.value = 'custom'; showCustomDate.value = true }

function onStartChange(e: any) { customStart.value = e.detail.value; dateType.value = 'custom'; if (customEnd.value) loadDurationReport() }
function onEndChange(e: any) { customEnd.value = e.detail.value; dateType.value = 'custom'; if (customStart.value) loadDurationReport() }

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

async function loadToday() {
  hasError.value = false
  loading.value = true
  try {
    const result = await getPerformance('today')
    todayData.value = result || { today_income: 0, today_orders: 0, today_duration: 0, today_rating: 0 }
    await Promise.all([loadDurationReport(), loadDailySummary()])
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

async function loadDurationReport() {
  const { start, end } = getDateRange()
  try {
    const result = await getDurationReport(start, end)
    durationList.value = result || []
  } catch {
    durationList.value = []
  }
}

// ===== 每日汇总 — 日期区间 (最多30天) =====
const dailyList = ref<DailySummaryItem[]>([])
const dailyLoading = ref(false)

const todayStr1 = () => {
  const d = new Date()
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const dailyDateType = ref('week')
const dailyCustomStart = ref(todayStr1())
const dailyCustomEnd = ref(todayStr1())
const showDailyCustom = ref(false)

const dailyDateOptions = [
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
]

function getDailyDateRange(): { start: string; end: string } {
  const now = new Date()
  const fd = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  switch (dailyDateType.value) {
    case 'week': {
      const day = now.getDay() || 7
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1)
      return { start: fd(mon), end: fd(now) }
    }
    case 'month': {
      return { start: now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01', end: fd(now) }
    }
    case 'custom': return { start: dailyCustomStart.value, end: dailyCustomEnd.value }
    default: return { start: fd(now), end: fd(now) }
  }
}

function switchDailyDate(key: string) {
  dailyDateType.value = key
  showDailyCustom.value = false
  loadDailySummary()
}

function openDailyCustom() { dailyDateType.value = 'custom'; showDailyCustom.value = true }
function onDailyStartChange(e: any) { dailyCustomStart.value = e.detail.value; dailyDateType.value = 'custom'; if (dailyCustomEnd.value) loadDailySummary() }
function onDailyEndChange(e: any) { dailyCustomEnd.value = e.detail.value; dailyDateType.value = 'custom'; if (dailyCustomStart.value) loadDailySummary() }

async function loadDailySummary() {
  dailyLoading.value = true
  const { start, end } = getDailyDateRange()
  try {
    const result = await getDailySummary(start, end)
    dailyList.value = result || []
  } catch {
    dailyList.value = []
  } finally {
    dailyLoading.value = false
  }
}

onMounted(() => loadToday())
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f2f3f5;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.content-wrap { padding: 18rpx 24rpx 0; }

.hero-section {
  position: relative; padding: 36rpx 30rpx; overflow: hidden;
  border-radius: 38rpx; margin-top: 6rpx; margin-bottom: 22rpx;
  box-shadow: 0 18rpx 40rpx rgba(5, 150, 105, 0.18);
}

.hero-bg {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background:
    radial-gradient(circle at top right, rgba(255,255,255,.2) 0, rgba(255,255,255,0) 34%),
    radial-gradient(circle at left bottom, rgba(255,255,255,.14) 0, rgba(255,255,255,0) 28%),
    linear-gradient(135deg, #0f766e 0%, #059669 52%, #047857 100%);
}

.hero-content { position: relative; z-index: 1; }

.hero-copy { display: flex; flex-direction: column; gap: 10rpx; margin-bottom: 24rpx; }

.hero-eyebrow {
  font-size: 22rpx; font-weight: 700; letter-spacing: 2rpx; color: rgba(255,255,255,.82);
}

.hero-title {
  font-size: 42rpx; font-weight: 800; line-height: 1.24; color: #fff; display: block;
}

.stats-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx;
}

.stat-card {
  background: rgba(255,255,255,.14); backdrop-filter: blur(10px);
  border-radius: 30rpx; padding: 26rpx 18rpx; text-align: left;
  border: 1rpx solid rgba(255,255,255,.2);
  display: flex; flex-direction: column; gap: 12rpx;
}

.stat-value { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,.9); display: block; }

.section-card {
  background: linear-gradient(180deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.91) 100%);
  margin-bottom: 22rpx; border-radius: 34rpx; padding: 30rpx;
  box-shadow: 0 12rpx 36rpx rgba(15,23,42,.06);
  border: 1rpx solid rgba(255,255,255,.82);
}

.section-header { margin-bottom: 20rpx; display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 30rpx; font-weight: 700; color: #0f172a; }
.refresh-hint { font-size: 22rpx; color: #059669; font-weight: 600; }
.date-hint { font-size: 20rpx; color: #94a3b8; display: block; margin-top: 8rpx; }

/* Date picker */
.date-picker-bar { margin-bottom: 20rpx; }
.quick-dates { display: flex; gap: 12rpx; flex-wrap: wrap; }
.date-chip {
  padding: 12rpx 24rpx; border-radius: 20rpx; font-size: 24rpx;
  background: #f1f5f9; color: #64748b;
  &.active { background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-weight: 600; }
}
.custom-range { display: flex; align-items: center; gap: 12rpx; margin-top: 16rpx; }
.date-picker { flex: 1; }
.date-pick-box {
  padding: 16rpx 20rpx; background: #f8fafc; border: 1rpx solid #e2e8f0;
  border-radius: 16rpx; font-size: 24rpx; color: #1e293b; text-align: center;
}
.date-sep { font-size: 24rpx; color: #94a3b8; flex-shrink: 0; }

/* Summary */
.summary-row { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.summary-item {
  flex: 1; text-align: center; padding: 20rpx 0;
  background: #f8fafc; border-radius: 20rpx;
}
.summary-val { font-size: 30rpx; font-weight: 700; color: #059669; display: block; }
.summary-lbl { font-size: 22rpx; color: #64748b; margin-top: 4rpx; display: block; }

/* Duration list */
.duration-list { display: flex; flex-direction: column; }
.duration-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 22rpx 0; border-bottom: 1rpx solid #f4f4f5;
}
.duration-row:last-child { border-bottom: none; }
.dr-left { display: flex; flex-direction: column; gap: 4rpx; width: 160rpx; }
.dr-date { font-size: 26rpx; font-weight: 600; color: #1e293b; }
.dr-weekday { font-size: 22rpx; color: #94a3b8; }
.dr-mid { flex: 1; }
.dr-table { font-size: 26rpx; color: #64748b; }
.dr-right { flex-shrink: 0; }
.dr-duration { font-size: 28rpx; font-weight: 700; color: #059669; }
.empty-hint { text-align: center; color: #94a3b8; font-size: 24rpx; padding: 40rpx 0; }

/* Daily summary */
.daily-section {  }
.daily-list { display: flex; flex-direction: column; }
.daily-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24rpx 0; border-bottom: 1rpx solid #f4f4f5;
}
.daily-row:last-child { border-bottom: none; }
.daily-left { display: flex; flex-direction: column; gap: 4rpx; }
.daily-date { font-size: 28rpx; font-weight: 600; color: #1e293b; }
.daily-weekday { font-size: 22rpx; color: #94a3b8; }
.daily-right { display: flex; gap: 24rpx; }
.daily-stat { font-size: 28rpx; font-weight: 700; color: #059669; }
.load-more { text-align: center; padding: 24rpx 0; font-size: 24rpx; color: #94a3b8; }
.load-more-btn { color: #059669; font-weight: 600; }
</style>
