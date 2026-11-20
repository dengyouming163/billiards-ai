<template>
  <view class="table-page">
    <Header />
    <view class="page-body">
      <view class="status-filter">
        <view
          v-for="s in statusOptions"
          :key="s.key"
          class="filter-chip"
          :class="{ active: activeStatus === s.key }"
          @click="activeStatus = s.key"
        >
          {{ s.label }}
        </view>
      </view>

      <QuickActions
        @open-table-requests="showOpenTableRequests = true"
        @order-reminder="showOrderReminder = true"
        @assistant-reminder="showAssistantReminder = true"
      />

      <ZoneFilter :items="zoneOptions" :selected="activeZone" @select="activeZone = $event" />

      <scroll-view
        class="table-scroll"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
      >
        <StateView :loading="loading && !groupedTables.length" :empty="!loading && groupedTables.length === 0 && !hasError" :error="hasError" empty-msg="暂无台桌" error-msg="加载失败" @retry="loadTables(true)">
          <TableGrid :groups="groupedTables" @table-click="handleTableClick" @table-longpress="handleTableLongPress" />
        </StateView>
        <view v-if="loading && !groupedTables.length" class="loading-hint">
          <text>加载中...</text>
        </view>
      </scroll-view>
    </view>
    <view class="refresh-fab" @click="onRefresh">
      <text class="refresh-icon">↻</text>
    </view>
    <TabBar />

    <view class="overlay" v-if="showOpenPopup" @click.self="showOpenPopup = false">
      <view class="popup">
        <view class="popup-header">
          <text class="popup-title">开台 - {{ selectedTable?.number }}</text>
          <text class="popup-close" @click="showOpenPopup = false">✕</text>
        </view>
        <view class="popup-body">
          <view class="form-row">
            <text class="form-label">人数</text>
            <view class="number-control">
              <text class="nc-btn" @click="changePlayerCount(-1)">−</text>
              <text class="nc-value">{{ playerCount }}</text>
              <text class="nc-btn" @click="changePlayerCount(1)">+</text>
            </view>
          </view>
          <button class="btn-open" :disabled="opening" @click="confirmOpen">
            {{ opening ? '开台中...' : '确认开台' }}
          </button>
          <button class="btn-open btn-open-coupon" @click="handleCouponOpenFromPopup">套餐券开台</button>
          <button class="btn-open btn-open-temp" @click="handleTempOpenFromPopup">临时开台</button>
        </view>
      </view>
    </view>
    <OpenTableRequestsModal :visible="showOpenTableRequests" @close="showOpenTableRequests = false" @resolved="onRefresh" />
    <OrderReminderModal :visible="showOrderReminder" @close="showOrderReminder = false" @updated="onRefresh" />
    <AssistantReminderModal :visible="showAssistantReminder" @close="showAssistantReminder = false" @updated="onRefresh" />
    <CouponOpenModal :visible="showCouponModal" @close="showCouponModal = false" @opened="onRefresh" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import QuickActions from './components/QuickActions.vue'
import OpenTableRequestsModal from './components/OpenTableRequestsModal.vue'
import OrderReminderModal from './components/OrderReminderModal.vue'
import AssistantReminderModal from './components/AssistantReminderModal.vue'
import CouponOpenModal from './components/CouponOpenModal.vue'
import ZoneFilter from './components/ZoneFilter.vue'
import TableGrid from './components/TableGrid.vue'
import StateView from '@/components/StateView.vue'
import { getTableList, getTableStats, openTable, tempOpenTable } from '@/api/modules/table'
import type { Table } from '@/api/modules/table'
import { authStore } from '@/stores/auth'

const statusOptions = [
  { key: 'all', label: '全部' },
  { key: 'idle', label: '空闲' },
  { key: 'occupied', label: '使用中' },
  { key: 'reserved', label: '预约' },
  { key: 'maintenance', label: '维护中' },
]

const activeStatus = ref('all')
const activeZone = ref('all')
const tables = ref<Table[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)
const page = ref(1)
const hasMore = ref(true)

const zoneOptions = computed(() => {
  const seen = new Set<string>()
  const zones: { key: string; label: string }[] = [{ key: 'all', label: '全部区域' }]
  tables.value.forEach((t) => {
    const key = t.zone_id || ''
    if (key && !seen.has(key)) {
      seen.add(key)
      zones.push({ key, label: t.zone_name || key })
    }
  })
  return zones
})

const filteredTables = computed(() => {
  let list = tables.value

  if (activeStatus.value !== 'all') {
    list = list.filter((t) => t.status === activeStatus.value)
  }

  if (activeZone.value !== 'all') {
    list = list.filter((t) => t.zone_id === activeZone.value)
  }

  return list
})

const groupedTables = computed(() => {
  const map = new Map<string, Table[]>()
  filteredTables.value.forEach((t) => {
    const key = t.zone_id || '__default__'
    if (!map.has(key)) {
      map.set(key, [])
    }
    map.get(key)!.push(t)
  })

  return Array.from(map.entries()).map(([key, tableList]) => {
    const label = tableList[0]?.zone_name || key
    return { key, label, tables: tableList }
  })
})

const idleCount = computed(() => filteredTables.value.filter(t => t.status === 'idle').length)
const occupiedCount = computed(() => filteredTables.value.filter(t => t.status === 'occupied').length)

const showOpenPopup = ref(false)
const showOpenTableRequests = ref(false)
const showOrderReminder = ref(false)
const showAssistantReminder = ref(false)
const showCouponModal = ref(false)
const selectedTable = ref<Table | null>(null)
const playerCount = ref(2)
const opening = ref(false)
const statsData = ref<Record<string, any>>({})

async function loadTables(reset = false) {
  if (reset) {
    page.value = 1
    hasMore.value = true
  }

  hasError.value = false
	loading.value = true
	try {
		const result = await getTableList({ page_size: 100, page: page.value })
			const list = result.data || []
		if (reset) {
			tables.value = list
		} else {
			tables.value = [...tables.value, ...list]
		}
		hasMore.value = list.length === 100 && result.pagination.page < result.pagination.total_pages
	} catch (e) {
		hasError.value = true
		console.error('加载台桌列表失败', e)
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
    loading.value = false
    refreshing.value = false
  }
}

async function loadStats() {
  try {
    const res: any = await getTableStats()
    statsData.value = res || {}
  } catch (e) {
    console.error('加载统计数据失败', e)
  }
}

function onRefresh() {
  refreshing.value = true
  loadTables(true)
  loadStats()
}

function onLoadMore() {
  if (!hasMore.value || loading.value) return
  page.value++
  loadTables(false)
}

function handleTableClick(table: Table) {
  if (table.status === 'idle' || table.status === 'reserved') {
    selectedTable.value = table
    playerCount.value = 2
    showOpenPopup.value = true
  } else if (table.status === 'occupied') {
    const orderId = table.current_order?.id || table.current_order?.order_id || ''
    uni.navigateTo({ url: `/pages/table/detail?table_id=${table.id}&order_id=${orderId}` })
  }
}

function handleTableLongPress(table: Table) {
  // 长按改为直接打开临时开台弹窗（保留兼容）
  if (table.status !== 'idle') return
  handleTableClick(table)
  nextTick(() => {
    if (showOpenPopup.value) {
      handleTempOpenFromPopup()
    }
  })
}

async function handleTempOpenFromPopup() {
  const table = selectedTable.value
  if (!table) return
  try {
    await tempOpenTable({ table_id: table.id })
    showOpenPopup.value = false
    uni.showToast({ title: '临时开台成功', icon: 'success' })
    loadTables(true)
    loadStats()
  } catch (e: any) {
    uni.showToast({ title: e.message || '临时开台失败', icon: 'none' })
  }
}

function changePlayerCount(delta: number) {
  const next = playerCount.value + delta
  if (next >= 1 && next <= 10) {
    playerCount.value = next
  }
}

async function confirmOpen() {
  if (!selectedTable.value) return
  opening.value = true
  try {
    const res: any = await openTable({
      table_id: selectedTable.value.id,
      player_count: playerCount.value,
      operator_id: String(authStore.userInfo?.id || ''),
      operator_name: authStore.userInfo?.name || '',
    })
    showOpenPopup.value = false
    uni.showToast({ title: '开台成功', icon: 'success' })
    loadTables(true)
    loadStats()
  } catch (e: any) {
    uni.showToast({ title: e.message || '开台失败', icon: 'none' })
  } finally {
    opening.value = false
  }
}

function handleCouponOpenFromPopup() {
  showOpenPopup.value = false
  showCouponModal.value = true
}

function handleCouponOpen() {
  showCouponModal.value = true
}

onMounted(() => {
  loadTables(true)
  loadStats()
})

onShow(() => {
  loadTables(true)
  loadStats()
})
</script>

<style lang="scss" scoped>
.table-page {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
}

.page-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 30rpx 24rpx calc(env(safe-area-inset-bottom) + 156rpx);
}

.summary-strip {
  margin-top: 8rpx;
  padding: 4rpx 4rpx 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  row-gap: 8rpx;
}

.summary-item {
  font-size: 22rpx;
  color: #333333;
  font-weight: 600;
}

.summary-dot {
  margin: 0 12rpx;
  font-size: 20rpx;
  color: #999999;
}

.status-filter {
  display: flex;
  gap: 14rpx;
  padding: 4rpx 2rpx 0;
  white-space: nowrap;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.filter-chip {
  padding: 16rpx 30rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #999999;
  background: #ffffff;
  flex-shrink: 0;
  transition: all 0.2s;
  border: 1rpx solid #e5e5e5;

  &.active {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    border-color: #07C160;
  }
}

.table-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.refresh-fab {
  position: fixed;
  right: 24rpx;
  bottom: calc(env(safe-area-inset-bottom) + 160rpx);
  width: 92rpx;
  height: 92rpx;
  background: #07C160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(7, 193, 96, 0.3);
  z-index: 500;
}
.refresh-fab:active { transform: scale(.9); }
.refresh-icon { font-size: 36rpx; color: #ffffff; font-weight: 700; }

.loading-hint {
  text-align: center;
  padding: 40rpx 0;
  color: #999999;
  font-size: 26rpx;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.popup {
  background: #ffffff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 32rpx 28rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 144rpx);
  max-height: 70vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.popup-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #000000;
}

.popup-close {
  font-size: 32rpx;
  color: #999999;
  padding: 8rpx;
}

.popup-body {
  padding-bottom: env(safe-area-inset-bottom);
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.form-label {
  font-size: 30rpx;
  color: #000000;
  font-weight: 600;
}

.number-control {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.nc-btn {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #f7f7f7;
  text-align: center;
  line-height: 68rpx;
  font-size: 32rpx;
  color: #000000;
  border: 1rpx solid #e5e5e5;
}

.nc-value {
  font-size: 36rpx;
  font-weight: 700;
  min-width: 60rpx;
  text-align: center;
  color: #000000;
}

.btn-open {
  width: 100%;
  padding: 24rpx;
  background: #07C160;
  color: #ffffff;
  border-radius: 36rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;

  &[disabled] {
    opacity: 0.6;
  }
}

.btn-open-coupon {
  margin-top: 18rpx;
  background: #ffffff;
  color: #07C160;
  border: 2rpx solid #07C160;
}

.btn-open-temp {
  margin-top: 18rpx;
  background: #f7f7f7;
  color: #666666;
  border: 2rpx solid #e5e5e5;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1100;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.modal-content {
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.modal-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.modal-close {
  font-size: 32rpx;
  color: #999999;
  padding: 8rpx;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding-top: 24rpx;
}

.empty-tip {
  text-align: center;
  padding: 60rpx 0;
  color: #999999;
  font-size: 28rpx;
}

.coupon-item {
  padding: 24rpx;
  margin-bottom: 16rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
  border: 2rpx solid transparent;
  transition: all 0.2s;

  &.selected {
    border-color: #07C160;
    background: rgba(7, 193, 96, 0.06);
  }
}

.coupon-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8rpx;
}

.coupon-desc {
  display: block;
  font-size: 24rpx;
  color: #999999;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx;
  background: #ffffff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #000000;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 22rpx;
  color: #999999;
}
</style>
