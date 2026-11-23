<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">订单中心</text>
        <text class="hero-title">订单流转一屏收口</text>
        <text class="hero-desc">按状态、时间和类型快速筛选，让进行中订单、已结账记录和异常单据都更清晰。</text>
      </view>
    </view>

    <view class="filter-bar">
      <view class="status-tabs scroll-x">
        <view
          v-for="s in statusTabs"
          :key="s.key"
          class="status-tab"
          :class="{ active: filters.status === s.key }"
          @click="onStatusChange(s.key)"
        >{{ s.label }}</view>
      </view>
      <view class="filter-row">
        <picker mode="selector" :range="dateOptions" range-key="label" @change="onDateChange">
          <view class="filter-chip">
            <text class="chip-icon">📅</text>
            <text>{{ currentDateLabel }}</text>
            <text class="chip-arrow">▼</text>
          </view>
        </picker>
        <picker mode="selector" :range="typeOptions" range-key="label" @change="onTypeChange">
          <view class="filter-chip">
            <text class="chip-icon">🏷️</text>
            <text>{{ currentTypeLabel }}</text>
            <text class="chip-arrow">▼</text>
          </view>
        </picker>
      </view>
      <view class="search-row">
        <view class="search-wrap">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索台桌名称或订单号"
            confirm-type="search"
            @confirm="onSearch"
          />
        </view>
      </view>
    </view>

    <scroll-view
      class="content-scroll"
      scroll-y
      enhanced
      show-scrollbar="false"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <StateView
        :loading="loading && list.length === 0"
        :empty="list.length === 0 && !loading"
        :error="hasError"
        empty-msg="暂无订单记录"
        error-msg="加载失败"
        @retry="loadData(true)"
      >
        <view class="card-list">
          <view
            class="order-card"
            :class="'card-' + item.status"
            v-for="item in list"
            :key="item.id"
            @click="goDetail(item.id)"
          >
            <view class="card-accent" />
            <view class="card-inner">
              <view class="card-head">
                <text class="card-no">#{{ item.order_no }}</text>
                <view class="card-status" :class="statusClass(item.status)">
                  <text class="status-dot" />
                  <text class="status-text">{{ statusText(item.status) }}</text>
                </view>
              </view>
              <view class="card-body">
                <view class="card-info">
                  <view class="info-row">
                    <view class="info-icon-wrap">
                      <text class="info-icon">🎱</text>
                    </view>
                    <text class="info-value">{{ item.table_name || '-' }}</text>
                  </view>
                  <view class="info-row">
                    <view class="info-icon-wrap">
                      <text class="info-icon">📋</text>
                    </view>
                    <text class="info-value">{{ typeLabel(item.type) }}</text>
                  </view>
                  <view class="info-row">
                    <view class="info-icon-wrap">
                      <text class="info-icon">⏰</text>
                    </view>
                    <text class="info-value">{{ formatTime(item.start_time) }} → {{ item.end_time ? formatTime(item.end_time) : '进行中' }}</text>
                  </view>
                </view>
                <view class="card-amount">
                  <template v-if="item.status === 'in_progress'">
                    <text class="amount-duration">{{ elapsedText(item) }}</text>
                    <text class="amount-label" v-if="item.items && item.items.length">
                      🛒{{ item.items.filter((i:any) => i.item_type === 'product').length }}件<text v-if="item.items.some((i:any) => i.item_type === 'assistant')"> · 👤助教</text>
                    </text>
                    <text class="amount-label estimated-label">进行中</text>
                  </template>
                  <template v-else>
                    <text class="amount-value">¥{{ $num(item.final_amount).toFixed(2) }}</text>
                    <text class="amount-label" v-if="item.member_name">{{ item.member_name }}</text>
                  </template>
                </view>
              </view>
            </view>
          </view>
        </view>
      </StateView>

      <view class="load-more" v-if="loading && list.length > 0">
        <view class="load-spinner" />
        <text class="load-text">加载中...</text>
      </view>
      <view class="load-end" v-if="!hasMore && list.length > 0">
        <view class="load-line" />
        <text class="load-text">已经到底了</text>
        <view class="load-line" />
      </view>
    </scroll-view>

    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderList } from '@/api/modules/order'
import type { MainOrder } from '@/types'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'
import { formatDateTimeFixed } from '@/utils/date'

const list = ref<MainOrder[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)
const searchKeyword = ref('')

function $num(v: any): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const filters = reactive({
  status: 'all',
  dateRange: 'week',
  type: 'all',
})

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已结账' },
  { key: 'cancelled', label: '已取消' },
]

const dateOptions = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '本月' },
  { key: 'all', label: '全部时间' },
]

const typeOptions = [
  { key: 'all', label: '全部类型' },
  { key: 'table', label: '台桌开台' },
  { key: 'assistant', label: '助教服务' },
  { key: 'product', label: '商品销售' },
]

const currentDateLabel = computed(() => {
  const found = dateOptions.find(d => d.key === filters.dateRange)
  return found ? found.label : '近7天'
})

const currentTypeLabel = computed(() => {
  const found = typeOptions.find(t => t.key === filters.type)
  return found ? found.label : '全部类型'
})

const statusSummaryLabel = computed(() => {
  const found = statusTabs.find(tab => tab.key === filters.status)
  return found ? found.label : '全部'
})

function statusClass(status: string): string {
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return ''
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

function formatTime(timeStr: string): string {
	const formatted = formatDateTimeFixed(timeStr)
	return formatted === '-' ? '-' : formatted.slice(5)
}

function onStatusChange(key: string) {
  filters.status = key
  loadData(true)
}

function onDateChange(e: any) {
  const index = Number(e.detail.value)
  filters.dateRange = dateOptions[index].key
  loadData(true)
}

function onTypeChange(e: any) {
  const index = Number(e.detail.value)
  filters.type = typeOptions[index].key
  loadData(true)
}

function onSearch() {
  loadData(true)
}

function goDetail(orderId: string) {
  uni.navigateTo({ url: `/pages/orders/detail?order_id=${orderId}` })
}

onMounted(() => {
  loadData(true)
})

async function onRefresh() {
  refreshing.value = true
  await loadData(true)
  refreshing.value = false
}

async function onLoadMore() {
  if (loading.value || !hasMore.value) return
  loading.value = true
  const prevPage = page.value
  page.value++
  try {
    await loadData(false)
  } catch {
    page.value = prevPage
  }
  loading.value = false
}

async function loadData(reset: boolean) {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  hasError.value = false

  try {
    const result = await getOrderList({
      status: filters.status === 'all' ? '' : filters.status,
      dateRange: filters.dateRange,
      type: filters.type === 'all' ? '' : filters.type,
      keyword: searchKeyword.value.trim() || '',
      page: page.value,
      page_size: 20,
    })

    const dataList: MainOrder[] = result.data || []
    const total = result.pagination?.total || 0

    if (reset) {
      list.value = dataList
    } else {
      list.value = [...list.value, ...dataList]
    }

    hasMore.value = list.value.length < total
  } catch (e: any) {
    if (reset) {
      list.value = []
    }
    hasError.value = true
    console.error('加载订单列表失败', e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
/* ========== Page Layout ========== */
.page {
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx);
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.hero-card,
.filter-bar {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 34rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.hero-card {
  margin-top: 18rpx;
  padding: 34rpx 30rpx;
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.hero-eyebrow {
  font-size: 22rpx;
  color: #059669;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.hero-title {
  font-size: 42rpx;
  line-height: 1.24;
  font-weight: 800;
  color: #0f172a;
}

.hero-desc {
  font-size: 24rpx;
  line-height: 1.7;
  color: #64748b;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18rpx;
}

.hero-stat {
  padding: 24rpx;
  border-radius: 28rpx;
  background: #f7faf9;
  display: flex;
  flex-direction: column;
  gap: 12rpx;

  &.accent {
    background: linear-gradient(135deg, #0f766e 0%, #059669 100%);

    .hero-stat-label,
    .hero-stat-value {
      color: #fff;
    }
  }
}

.hero-stat-label {
  font-size: 22rpx;
  color: #64748b;
}

.hero-stat-value {
  font-size: 40rpx;
  line-height: 1.1;
  color: #0f172a;
  font-weight: 800;

  &.small {
    font-size: 32rpx;
  }
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.hero-tag {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: #eef7f3;
  color: #0f766e;
  font-size: 22rpx;
  font-weight: 600;
}

.filter-bar {
  margin-top: 20rpx;
  padding: 22rpx;
}

.status-tabs {
  display: flex;
  gap: 14rpx;
  padding: 4rpx 2rpx 18rpx;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.status-tab {
  padding: 16rpx 32rpx;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 500;
  color: #64748b;
  background: #f4f7f6;
  border: 2rpx solid transparent;
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  flex-shrink: 0;

  &.active {
    background: linear-gradient(135deg, #0f766e 0%, #059669 100%);
    color: #fff;
    font-weight: 600;
    box-shadow: 0 12rpx 24rpx rgba(5, 150, 105, 0.22);
  }

  &:active:not(.active) {
    transform: scale(0.95);
    background: #edf2f0;
  }
}

.filter-row {
  display: flex;
  gap: 14rpx;
  margin-bottom: 18rpx;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: #f7faf9;
  border: 1.5rpx solid #e5ece8;
  font-size: 24rpx;
  color: #64748b;
  font-weight: 500;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.96);
    background: #eef3f1;
    border-color: #d6dfda;
  }
}

.chip-icon {
  font-size: 24rpx;
  line-height: 1;
}

.chip-arrow {
  font-size: 16rpx;
  color: #94a3b8;
  margin-left: 2rpx;
}

.search-row {
  margin-bottom: 0;
}

.search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 24rpx;
  font-size: 26rpx;
  z-index: 1;
  pointer-events: none;
}

.search-input {
  background: #f7faf9;
  border-radius: 999rpx;
  height: 84rpx;
  padding: 0 28rpx 0 64rpx;
  font-size: 26rpx;
  color: #0f172a;
  width: 100%;
  border: 1.5rpx solid transparent;
  transition: all 0.25s ease;

  &::placeholder {
    color: #94a3b8;
  }

  &:focus {
    background: #fff;
    border-color: rgba(5, 150, 105, 0.24);
    box-shadow: 0 0 0 6rpx rgba(5, 150, 105, 0.06);
  }
}

.content-scroll {
  flex: 1;
  min-height: 0;
  padding: 20rpx 0 0;
  overflow-x: hidden;
}

.content-scroll :deep(.state-content) {
  height: 100%;
}

.content-scroll :deep(.state-empty),
.content-scroll :deep(.state-loading),
.content-scroll :deep(.state-error) {
  padding: 24rpx 0 0;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  width: 100%;
}

.order-card {
  position: relative;
  border-radius: 34rpx;
  overflow: hidden;
  width: 100%;
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease;
  box-shadow:
    0 10rpx 28rpx rgba(15, 23, 42, 0.06),
    0 0 0 1rpx rgba(255, 255, 255, 0.7);

  &:active {
    transform: scale(0.97);
    box-shadow:
      0 1rpx 4rpx rgba(0, 0, 0, 0.03),
      0 3rpx 10rpx rgba(0, 0, 0, 0.02),
      0 0 0 1rpx rgba(0, 0, 0, 0.03);
  }
}

.card-accent {
  height: 6rpx;
  width: 100%;
  flex-shrink: 0;
}

.card-inner {
  display: flex;
  flex-direction: column;
  padding: 28rpx 28rpx 30rpx;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-no {
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 0.3rpx;
}

.card-status {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.status-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 21rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

.card-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24rpx;
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-icon-wrap {
  width: 42rpx;
  height: 42rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon {
  font-size: 19rpx;
  line-height: 1;
}

.info-value {
  font-size: 25rpx;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
  padding-top: 4rpx;
}

.amount-duration {
  font-size: 30rpx;
  font-weight: 700;
  color: #d97706;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 800;
  background: linear-gradient(135deg, $color-primary 0%, #0d9488 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5rpx;
}

.amount-label {
  font-size: 22rpx;
  color: #94a3b8;
  max-width: 160rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-in_progress {
  background: linear-gradient(160deg, #ecfdf5 0%, #d1fae5 50%, #ccfbf1 100%);

  .card-accent {
    background: linear-gradient(90deg, #34d399, #2dd4bf);
  }

  .card-no {
    color: #047857;
  }

  .card-status {
    background: rgba(255, 255, 255, 0.75);
    border: 1.5rpx solid #6ee7b7;
  }

  .status-dot {
    background: #059669;
  }

  .status-text {
    color: #065f46;
  }

  .info-value {
    color: #047857;
  }

  .info-icon-wrap {
    background: rgba(209, 250, 229, 0.7);
  }
}

.card-completed {
  background: linear-gradient(160deg, #f8fafc 0%, #f1f5f9 50%, #eef2f6 100%);

  .card-accent {
    background: linear-gradient(90deg, #94a3b8, #cbd5e1);
  }

  .card-no {
    color: #334155;
  }

  .card-status {
    background: rgba(255, 255, 255, 0.8);
    border: 1.5rpx solid #cbd5e1;
  }

  .status-dot {
    background: #64748b;
  }

  .status-text {
    color: #475569;
  }

  .info-value {
    color: #475569;
  }

  .info-icon-wrap {
    background: rgba(241, 245, 249, 0.9);
  }
}

.card-cancelled {
  background: linear-gradient(160deg, #fef2f2 0%, #fee2e2 50%, #fef0f0 100%);

  .card-accent {
    background: linear-gradient(90deg, #fca5a5, #fecaca);
  }

  .card-no {
    color: #991b1b;
  }

  .card-status {
    background: rgba(255, 255, 255, 0.75);
    border: 1.5rpx solid #fecaca;
  }

  .status-dot {
    background: #dc2626;
  }

  .status-text {
    color: #b91c1c;
  }

  .info-value {
    color: #991b1b;
  }

  .info-icon-wrap {
    background: rgba(254, 226, 226, 0.7);
  }
}

.order-card:not(.card-in_progress):not(.card-completed):not(.card-cancelled) {
  background: linear-gradient(160deg, #ffffff 0%, #fafafa 100%);

  .card-accent {
    background: linear-gradient(90deg, #d1d5db, #e5e7eb);
  }

  .card-no {
    color: $color-text-primary;
  }

  .card-status {
    background: rgba(255, 255, 255, 0.75);
    border: 1.5rpx solid #e5e7eb;
  }

  .status-dot {
    background: #9ca3af;
  }

  .status-text {
    color: #6b7280;
  }

  .info-value {
    color: $color-text-primary;
  }

  .info-icon-wrap {
    background: rgba(243, 244, 246, 0.9);
  }
}

.load-more,
.load-end {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16rpx;
  padding: 36rpx 0 20rpx;
}

.load-spinner {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid #e5e7eb;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

.load-line {
  width: 48rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #d4d4d8, transparent);
  border-radius: 1rpx;
}

.load-text {
  font-size: 23rpx;
  color: $color-text-muted;
  font-weight: 400;
  white-space: nowrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
