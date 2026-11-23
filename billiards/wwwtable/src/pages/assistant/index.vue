<template>
  <view class="container">
    <!-- Sticky Header -->
    <view class="sticky-header">
      <view class="header-card">
        <view class="header-row">
          <view class="header-left">
            <view class="header-icon-wrap">
              <view class="icon-glow"></view>
              <view class="icon-user"></view>
            </view>
            <view class="header-title-wrap">
              <text class="header-title">教练</text>
              <text class="header-count">{{ assistants.length }}</text>
            </view>
          </view>

          <view class="header-right">
            <view class="status-tag" :class="{ empty: !orderStore.isOrderActive || activeAssistantOrders.length === 0 }" @click="orderStore.isOrderActive && activeAssistantOrders.length > 0 && (showAssistantOrdersModal = true)">
              <template v-if="!orderStore.isOrderActive">还未开台</template>
              <template v-else-if="activeAssistantOrders.length === 0">暂无教练服务</template>
              <template v-else>{{ activeAssistantOrders.length }}位教练 · <template v-if="servingCount > 0">{{ servingCount }}位服务中</template><template v-else-if="pendingCount > 0">{{ pendingCount }}位等待确认</template><template v-else-if="readyCount > 0">{{ readyCount }}位可开始</template></template>
            </view>
            <view class="search-btn" @click="toggleSearch">
              <text>🔍</text>
            </view>
          </view>
        </view>
      </view>

      <view class="search-bar" v-if="showSearch">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input class="search-input" v-model="searchKeyword" placeholder="搜索教练..." />
          <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">✕</view>
        </view>
      </view>

      <scroll-view scroll-x class="filter-scroll" :show-scrollbar="false">
        <view class="filter-row">
          <view class="filter-chip" :class="{ active: filterType === 'all' }" @click="filterType = 'all'"><text>全部</text></view>
          <view class="filter-chip" :class="{ active: filterType === 'available' }" @click="filterType = 'available'"><text>可预约</text></view>
          <view v-for="level in assistantLevels" :key="level.id"
            class="filter-chip" :class="{ active: filterType === level.id || filterType === level.code }"
            @click="filterType = level.id"><text>{{ level.name }}</text></view>
        </view>
      </scroll-view>
    </view>

    <!-- 3列图片卡片列表 — 完全复用 product 页面卡片设计语言 -->
    <scroll-view class="assistant-list" scroll-y :show-scrollbar="false">
      <view class="product-grid">
        <view class="product-card" v-for="a in filteredAssistants" :key="a.id" @click="selectAssistant(a)">
          <!-- 全幅图片 — 与 product-image-full 完全一致的实现 -->
          <view class="product-image-full">
            <image
              v-if="getAssistantImage(a)"
              class="product-img-full"
              :src="getAssistantImage(a)"
              mode="aspectFill"
            />
            <text v-else class="product-emoji-full">👨‍🏫</text>

            <!-- 角标：在线状态 -->
            <view class="online-dot" v-if="a.status === 1 && !a.is_busy"></view>

            <!-- 休息遮罩 -->
            <view class="busy-overlay rest-overlay" v-if="a.status === 0">
              <text class="busy-text">休息</text>
            </view>

            <!-- 忙碌遮罩 -->
            <view class="busy-overlay" v-if="a.is_busy">
              <text class="busy-text">服务中</text>
            </view>

            <!-- 图片底部渐变 + 叠加信息 — 与 product-overlay 一致 -->
            <view class="product-overlay">
              <view class="overlay-gradient"></view>
              <view class="overlay-content">
                <text class="product-name">{{ a.name }}</text>
                <view class="product-price-row">
                  <view class="price-wrap">
                    <text class="price-value">{{ calcMinuteRate(a.hourly_rate) }}</text>
                    <text class="price-unit">/分钟</text>
                  </view>
                  <view class="add-btn" :class="{ busy: a.is_busy }" @click.stop="selectAssistant(a)">
                    <view class="add-btn-glow"></view>
                    <text>{{ a.is_busy ? '忙' : '+' }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="!loaded" class="loading-state">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>

    <!-- 详情弹窗 — 重设计：顶部大图轮播 + 信息下排 -->
    <ContentModal
      :visible="!!selectedAssistant"
      :title="selectedAssistant?.name || '教练详情'"
      :show-footer="true"
      height="75vh"
      @close="closeModal"
    >
        <scroll-view class="modal-body" scroll-y v-if="selectedAssistant">
          <!-- 相册轮播大图 -->
          <view class="carousel-wrap" v-if="hasAlbum">
            <swiper class="carousel" :current="carouselIdx" @change="onCarouselChange" circular indicator-dots indicator-color="rgba(255,255,255,.3)" indicator-active-color="#c9a962">
              <swiper-item v-for="(url, ai) in selectedAssistant.album" :key="ai">
                <image class="carousel-img" :src="url" mode="aspectFill" />
              </swiper-item>
            </swiper>
          </view>
          <!-- 无相册占位 -->
          <view class="carousel-placeholder" v-else>
            <text class="placeholder-emoji">👨‍🏫</text>
          </view>

          <!-- 等级 + 评分 + 价格 紧凑一行 -->
          <view class="detail-meta-bar">
            <text class="meta-level">{{ selectedAssistant.level_name }}</text>
            <text class="meta-divider">·</text>
            <text class="meta-rating">★ {{ selectedAssistant.rating }}</text>
            <text class="meta-divider">·</text>
            <text class="meta-price">¥{{ calcMinuteRate(selectedAssistant.hourly_rate) }}/分钟</text>
          </view>

          <!-- 个人介绍 + 擅长技能 -->
          <view class="info-block" v-if="selectedAssistant.introduction || (selectedAssistant.skills && selectedAssistant.skills.length)">
            <text class="info-body" v-if="selectedAssistant.introduction">{{ selectedAssistant.introduction }}</text>
            <view class="skill-tags" v-if="selectedAssistant.skills && selectedAssistant.skills.length">
              <text class="skill-tag" v-for="tag in selectedAssistant.skills" :key="tag">{{ tag }}</text>
            </view>
          </view>

          <!-- 选择时长 -->
          <view class="info-block">
            <text class="info-title">选择时长</text>
            <view class="duration-row">
              <view class="dur-chip" v-for="d in durations" :key="d" :class="{ active: selectedDuration === d }" @click="selectedDuration = d">
                <text class="dur-label">{{ d }}小时</text>
                <text class="dur-price">¥{{ (selectedAssistant?.hourly_rate || 0) * d }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
        <template #footer>
          <view class="fixed-book-bar">
            <text class="fb-price">¥{{ (selectedAssistant?.hourly_rate || 0) * selectedDuration }}</text>
            <view class="fb-btn" :class="{ loading: booking }" @click="handleBook">{{ booking ? '预约中...' : '立即预约' }}</view>
          </view>
        </template>
      </ContentModal>

    <!-- 教练服务管理弹窗 -->
    <ContentModal
      :visible="showAssistantOrdersModal"
      title="当前教练服务"
      @close="showAssistantOrdersModal = false"
    >
        <scroll-view class="modal-body" scroll-y>
          <view v-if="activeAssistantOrders.length > 0">
            <view class="service-item" v-for="item in activeAssistantOrders" :key="item.item_id || item.id">
              <view class="si-avatar">
                <image v-if="item.assistant_avatar" :src="item.assistant_avatar" mode="aspectFill" />
                <text v-else>👨‍🏫</text>
              </view>
              <view class="si-info">
                <text class="si-name">{{ item.assistant_name }}</text>
                <view class="si-meta">
                  <text class="si-rate">¥{{ item.hourly_rate }}/h</text>
                  <text class="si-status" :class="item.status">{{ statusLabel(item.status) }}</text>
                </view>
                <text class="si-duration" v-if="item.status === 'serving' && item.started_at">
                  {{ calcAssistantTimer(item) }}
                </text>
              </view>
              <view class="si-actions">
                <view class="si-btn start" v-if="item.status === 'processing'" @click.stop="handleStartAssistant(item)">开始</view>
                <view class="si-btn end" v-if="item.status === 'serving'" @click.stop="handleEndAssistant(item)">结束</view>
                <view class="si-btn cancel" v-if="item.status === 'pending' || item.status === 'processing'" @click.stop="handleCancelAssistant(item)">取消</view>
              </view>
            </view>
          </view>
          <view v-else class="modal-empty">
            <text class="modal-empty-icon">👨‍🏫</text>
            <text class="modal-empty-text">暂无进行中的教练服务</text>
          </view>
        </scroll-view>
        <template #footer>
          <view class="footer-action secondary" @click="showAssistantOrdersModal = false">关闭</view>
        </template>
      </ContentModal>

    <view class="call-waiter-btn-wrap">
      <view 
        class="call-waiter-btn" 
        :class="{ calling: isCallingWaiter }"
        @click="callWaiter"
      >
        <view class="btn-glow-ring" v-if="isCallingWaiter"></view>
        <view class="btn-pulse-ring" v-if="isCallingWaiter"></view>
        <view class="call-icon-wrap">
          <view class="icon-glow"></view>
          <text class="call-icon">{{ isCallingWaiter ? '⏳' : '🛎️' }}</text>
        </view>
      </view>
    </view>

    <AlertModal
      :visible="showCancelWaiterModal"
      icon="🛎️"
      title="确定要取消呼叫服务员吗？"
      message="取消后服务员可能仍在赶来途中"
      confirm-text="确定取消"
      cancel-text="继续等待"
      :confirm-danger="true"
      @confirm="showCancelWaiterModal = false; cancelWaiterCall()"
      @cancel="showCancelWaiterModal = false"
    />

  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { tabletApi } from '@/api'
import { orderStore } from '@/stores/order'
import { authStore } from '@/stores/auth'
import { tableWs } from '@/utils/websocket'
import PageHeader from '@/components/standard/PageHeader.vue'
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import { isOnline } from '@/utils/network'
import { useServiceCall } from '@/composables/useServiceCall'
import { offlineCache } from '@/utils/offline-cache'
import { offlineQueue } from '@/utils/offline-queue'
import { useTabState } from '@/stores/tabState'

const tab = useTabState('assistant')

const {
  isCallingWaiter, showCancelWaiterModal,
  callWaiter, cancelWaiterCall, dispose: disposeServiceCall,
} = useServiceCall()

// 搜索
const showSearch = ref(false)
const searchKeyword = ref('')
function toggleSearch() { showSearch.value = !showSearch.value; if (!showSearch.value) searchKeyword.value = '' }
function clearSearch() { searchKeyword.value = '' }

// 详情弹窗 — 相册轮播
const carouselIdx = ref(0)
function onCarouselChange(e: any) { carouselIdx.value = e.detail.current }
const hasAlbum = computed(() => selectedAssistant.value?.album && selectedAssistant.value.album.length > 0)

function parseSkills(raw: any): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed } catch {}
    return raw.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

function calcMinuteRate(hourlyRate: number): string {
  const perMin = hourlyRate / 60
  return perMin >= 1 ? perMin.toFixed(0) : perMin.toFixed(2)
}

interface Assistant {
  id: string
  name: string
  avatar?: string
  profile_avatar?: string
  album?: string[]
  level_id?: string
  level_name: string
  introduction: string
  hourly_rate: number
  is_online: number
  is_busy: boolean
  skills: string[]
  rating: number
  gift_count: number
}

interface AssistantLevel {
  id: string
  name: string
  code: string
  color?: string
  hourly_rate?: number
  description?: string
  sort_order?: number
  status?: number
}

const assistants = ref<Assistant[]>([])
const assistantLevels = ref<AssistantLevel[]>([])
const filterType = ref('all')
const selectedAssistant = ref<Assistant | null>(null)
const selectedDuration = ref(1)
const durations = [1, 2, 3]
const booking = ref(false)
const loaded = ref(false)
const orderLoadedOnce = ref(false)

const assistantOrders = ref<any[]>([])
const showAssistantOrdersModal = ref(false)
const timerTick = ref(0)
let assistantPollTimer: ReturnType<typeof setInterval> | null = null
let assistantClockTimer: ReturnType<typeof setInterval> | null = null

const servingCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'serving').length)
const pendingCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'pending').length)
const readyCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'processing').length)
const activeAssistantOrders = computed(() => assistantOrders.value.filter((i: any) => i.status !== 'cancelled'))

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    processing: '可开始',
    serving: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    accepted: '已接单',
    preorder_pending: '待确认',
    confirmed: '已确认',
    delivered: '已完成'
  }
  return map[status] || status || '未知'
}

const calcAssistantTimer = (item: any): string => {
  void timerTick.value
  if (!item.started_at) return '00:00:00'
  const diff = Math.floor((Date.now() - new Date(item.started_at).getTime()) / 1000)
  if (diff < 0) return '00:00:00'
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function loadAssistantOrders() {
  if (!orderStore.orderId) return
  try {
    const data = await tabletApi.getAssistantOrders(orderStore.orderId)
    assistantOrders.value = Array.isArray(data) ? data : ((data as any)?.data || [])
    orderLoadedOnce.value = true
  } catch {
    if (!orderLoadedOnce.value) {
      uni.showToast({ title: '加载教练订单失败', icon: 'none' })
    }
  }
}

function startAssistantClock() {
  if (assistantClockTimer) clearInterval(assistantClockTimer)
  assistantClockTimer = setInterval(() => { timerTick.value++ }, 1000) as unknown as number
}

function stopAssistantClock() {
  if (assistantClockTimer) { clearInterval(assistantClockTimer); assistantClockTimer = null }
}

async function loadOrderStatus() {
  try { await orderStore.getTableOrder() } catch {}
}

function startAssistantPoll() {
  if (assistantPollTimer) clearInterval(assistantPollTimer)
  loadAssistantOrders()
  assistantPollTimer = setInterval(() => loadAssistantOrders(), 30000) as unknown as number
}

function stopAssistantPoll() {
  if (assistantPollTimer) { clearInterval(assistantPollTimer); assistantPollTimer = null }
}

watch(() => assistantOrders.value.filter((i: any) => i.status === 'serving').length, (count) => {
  count > 0 ? startAssistantClock() : stopAssistantClock()
})

async function handleStartAssistant(item: any) {
  const itemId = item.item_id || item.id
  try {
    await tabletApi.startAssistantService(itemId)
    uni.showToast({ title: '服务已开始', icon: 'success' })
    await loadAssistantOrders()
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}

async function handleEndAssistant(item: any) {
  const itemId = item.item_id || item.id
  try {
    await tabletApi.endAssistantService(itemId)
    uni.showToast({ title: '服务已结束', icon: 'success' })
    await loadAssistantOrders()
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}

async function handleCancelAssistant(item: any) {
  const itemId = item.item_id || item.id
  try {
    await tabletApi.cancelAssistant(itemId)
    uni.showToast({ title: '已取消', icon: 'success' })
    await loadAssistantOrders()
  } catch {
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

/** 提取教练首张图片（预计算避免 uni-app 模板复杂表达式兼容问题） */
function getAssistantImage(a: any): string {
  return a.profile_avatar || (a.album && a.album.length > 0 ? a.album[0] : '') || a.avatar || ''
}

const filteredAssistants = computed(() => {
  let result = assistants.value
  if (filterType.value === 'available') {
    result = result.filter(a => !a.is_busy && a.is_online === 1)
  } else {
    const level = assistantLevels.value.find(l => l.id === filterType.value || l.code === filterType.value)
    if (level) {
      result = result.filter(a => a.level_id === level.id || a.level_name === level.name)
    }
  }
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    const kw = searchKeyword.value.toLowerCase()
    result = result.filter(a => a.name.toLowerCase().includes(kw))
  }
  return result
})

async function loadAssistants() {
  if (!isOnline.value) {
    const cached = offlineCache.getAllAssistants()
    if (cached.length > 0) {
      assistants.value = cached.map(a => ({
        id: a.id, name: a.name, avatar: a.avatar,
        profile_avatar: a.avatar, is_online: a.is_online ? 1 : 0,
        is_busy: false, level_id: a.level_id, level_name: a.level_name,
        hourly_rate: a.hourly_rate, skills: [], rating: 5, gift_count: 0,
        introduction: '',
      } as any))
      loaded.value = true
      return
    }
  }
  try {
    const res = await tabletApi.getAssistants() as any[]
    assistants.value = res.map((item: any) => ({
      ...item,
      id: String(item.id),
      avatar: item.profile_avatar || item.avatar || '',
      profile_avatar: item.profile_avatar || item.avatar || '',
      album: item.album || [],
      level_id: String(item.level_id || ''),
      skills: parseSkills(item.skills),
      is_busy: item.is_busy || false,
      level_name: item.level_name || '初级教练',
      introduction: item.introduction || '',
      gift_count: Number(item.gift_count) || 0,
      rating: Number(item.rating) || 0,
    }))
    tab.markLoaded()
  } catch {
    uni.showToast({ title: '加载教练失败', icon: 'none' })
  }
}

function selectAssistant(assistant: Assistant) {
  if (assistant.is_busy) {
    uni.showToast({ title: '该教练当前忙碌中', icon: 'none' })
    return
  }
  selectedAssistant.value = assistant
}

function goToHome() { uni.switchTab({ url: '/pages/index/index' }) }
function closeModal() { selectedAssistant.value = null }

async function handleBook() {
  if (!orderStore.isOrderActive) {
    uni.showModal({ title: '提示', content: '请先开台后再预约教练' })
    return
  }
  if (!selectedAssistant.value) return

  booking.value = true

  if (!isOnline.value) {
    offlineQueue.enqueue('book_assistant', {
      order_id: orderStore.orderId,
      assistant_id: selectedAssistant.value.id,
      duration: selectedDuration.value,
    })
    uni.showToast({ title: '已加入离线队列', icon: 'none', duration: 1500 })
    booking.value = false
    closeModal()
    return
  }

  try {
    await tabletApi.bookAssistant({
      order_id: orderStore.orderId,
      assistant_id: selectedAssistant.value.id,
      duration: selectedDuration.value,
    })
    uni.showToast({ title: `预约成功(${selectedDuration.value}小时)，等待教练确认`, duration: 2000 })
    closeModal()
    loadAssistantOrders()
  } catch (e: any) {
    uni.showToast({ title: e.errMsg || e.msg || '预约失败', icon: 'none' })
  } finally {
    booking.value = false
  }
}

async function loadAssistantLevels() {
  try {
    const data = await tabletApi.getAssistantLevels()
    if (data && Array.isArray(data)) {
      assistantLevels.value = data.map((item: any) => ({
        ...item, id: String(item.id), code: item.code || '', name: item.name || '',
      }))
    } else {
      assistantLevels.value = []
    }
  } catch {
    assistantLevels.value = []
  }
}

onMounted(async () => {
  if (!tab.loaded) { loaded.value = false }
  await loadOrderStatus()
  await loadAssistants()
  loaded.value = true
  await loadAssistantLevels()
  startAssistantPoll()

  // WebSocket: 监听教练订单状态变更
  const tableId = authStore.tableId
  if (tableId) {
    tableWs.connect(tableId).catch(() => {})
  }
  tableWs.on('order_item_status', (data: any) => {
    if (data && data.item_type === 'assistant') {
      loadAssistantOrders()
    }
  })
  tableWs.on('order_update', () => {
    loadAssistantOrders()
  })
})

onShow(() => {
  startAssistantPoll()
  loadAssistantOrders()
})

onHide(() => {
  stopAssistantPoll()
})

onUnmounted(() => {
  stopAssistantClock()
  stopAssistantPoll()
  disposeServiceCall()
  tableWs.off('order_item_status', () => {})
  tableWs.off('order_update', () => {})
})
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

$gold: #c9a962; $bg: #0f0f16;

/* ── Container ── */
.container {
  padding: 0; min-height: 100vh; padding-bottom: 200rpx;
  background: linear-gradient(180deg, $bg 0%, #12121a 30%, #1a1a2e 70%, $bg 100%);
  position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse at 20% 20%, rgba($gold,.05), transparent 50%), radial-gradient(ellipse at 80% 60%, rgba(139,92,246,.04), transparent 50%); pointer-events: none; }
}

/* ── Sticky Header ── */
.sticky-header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 28rpx 40rpx;
  background: linear-gradient(180deg, rgba($bg,.98), rgba($bg,.95));
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($gold,.1);
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,.4);
  &::after { content: ''; position: absolute; bottom: -2rpx; left: 0; right: 0; height: 2rpx; background: linear-gradient(90deg, transparent, rgba($gold,.3), transparent); }

  .header-card {
    background: linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(20, 20, 40, 0.95));
    border-radius: 48rpx;
    padding: 40rpx 48rpx;
    margin-bottom: 32rpx;
    border: 3rpx solid rgba($gold, 0.15);
    box-shadow: 0 12rpx 48rpx rgba(0,0,0,0.35), 0 0 40rpx rgba($gold, 0.08), inset 0 1rpx 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(20rpx);
  }

  .header-row {
    display: flex; align-items: center; justify-content: space-between; gap: 32rpx;
  }

  .header-left {
    display: flex; align-items: center; gap: 28rpx; flex-shrink: 0;
  }

  .header-icon-wrap {
    position: relative; width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center;
  }

  .icon-glow {
    position: absolute; width: 100%; height: 100%;
    background: radial-gradient(circle, rgba($gold, 0.4) 0%, transparent 70%);
    border-radius: 50%; animation: iconPulse 3s ease-in-out infinite;
  }

  .icon-user {
    position: relative; width: 44rpx; height: 44rpx;
    border: 4rpx solid $gold; border-radius: 50%;
    box-shadow: 0 0 20rpx rgba($gold, 0.8), inset 0 0 10rpx rgba($gold, 0.4);
    
    &::after {
      content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      width: 16rpx; height: 16rpx; background: $gold; border-radius: 50%;
    }
  }

  @keyframes iconPulse {
    0%, 100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.3); opacity: 1; }
  }

  .header-title-wrap {
    display: flex; align-items: center; gap: 20rpx;
  }

  .header-title { font-size: 64rpx; font-weight: 700; color: #fff; letter-spacing: 3rpx; }

  .header-count {
    font-size: 36rpx; color: rgba(255,255,255,0.5); padding: 6rpx 20rpx;
    background: rgba(255,255,255,0.06); border-radius: 32rpx; border: 2rpx solid rgba(255,255,255,0.1);
  }

  .header-right {
    display: flex; align-items: center; gap: 24rpx; flex-shrink: 0;
  }

  .status-tag {
    display: flex; align-items: center; padding: 16rpx 32rpx; border-radius: 40rpx; font-size: 36rpx; font-weight: 500;

    &.empty { background: rgba(255,255,255,0.08); border: 2rpx solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); }
    &.active { background: linear-gradient(135deg, rgba($gold,0.25), rgba($gold,0.1)); border: 2rpx solid rgba($gold,0.45); color: $gold; box-shadow: 0 8rpx 24rpx rgba($gold,0.25), 0 0 30rpx rgba($gold,0.1); }
    &:active { transform: scale(0.96); }
  }
}

.filter-scroll { margin-bottom: 8rpx; }

/* 搜索按钮和搜索栏 */
.search-btn {
  width: 112rpx; height: 112rpx;
  background: linear-gradient(145deg, rgba(45,45,80,0.8), rgba(35,35,65,0.9));
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 3rpx solid rgba($gold, 0.25);
  box-shadow: 0 10rpx 32rpx rgba(0,0,0,0.35), inset 0 2rpx 0 rgba(255,255,255,0.08);

  &:active { transform: scale(0.94); background: linear-gradient(145deg, rgba($gold,0.3), rgba($gold,0.15)); }
  text { font-size: 48rpx; }
}

.search-bar {
  padding: 0 0 28rpx;
  .search-box {
    display: flex; align-items: center; gap: 20rpx;
    background: rgba(255, 255, 255, 0.06); border-radius: 48rpx; padding: 20rpx 40rpx;
    border: 3rpx solid rgba($gold, 0.15);
    min-height: 96rpx;
    .search-icon { font-size: 52rpx; }
    .search-input { flex: 1; font-size: 48rpx; color: #fff; background: transparent; min-height: 80rpx; }
    .clear-btn { width: 64rpx; height: 64rpx; border-radius: 50%; background: rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; font-size: 36rpx; color: rgba(255, 255, 255, 0.5); }
  }
}
.filter-row { display: flex; gap: 28rpx; padding: 12rpx 0; white-space: nowrap; }
.filter-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 96rpx; padding: 24rpx 56rpx; border-radius: 48rpx; font-size: 48rpx; font-weight: 700; letter-spacing: 2rpx;
  background: rgba(35,35,60,.6); color: rgba(255,255,255,.55); border: 3rpx solid rgba($gold,.15);
  box-shadow: 0 8rpx 28rpx rgba(0,0,0,.25); transition: all .35s cubic-bezier(.4,0,.2,1); flex-shrink: 0;
  position: relative; overflow: hidden;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba($gold,.25), rgba($gold,.08)); opacity: 0; transform: scaleX(0); transform-origin: left; transition: all .35s cubic-bezier(.4,0,.2,1); }
  &::after { content: ''; position: absolute; top: -2rpx; left: 50%; transform: translateX(-50%); width: 70%; height: 6rpx; background: linear-gradient(90deg, transparent, $gold, transparent); border-radius: 3rpx; opacity: 0; transition: all .35s cubic-bezier(.4,0,.2,1); }
  &:active { transform: scale(.96); }
  &.active {
    background: rgba($gold,.2); color: $gold; border-color: rgba($gold,.6);
    box-shadow: 0 8rpx 32rpx rgba($gold,.3), 0 0 60rpx rgba($gold,.15), inset 0 0 24rpx rgba($gold,.05);
    &::before { opacity: 1; transform: scaleX(1); }
    &::after { opacity: 1; animation: categoryPulse 2s ease-in-out infinite; }
    text { color: $gold; text-shadow: 0 0 28rpx rgba($gold,.6); position: relative; z-index: 1; }
  }
  text { position: relative; z-index: 1; }
}

@keyframes categoryPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

/* ══════════════════════════════════════════
   3列图片卡片 — 完全复用 product 页面设计
   ══════════════════════════════════════════ */
.assistant-list { height: calc(100vh - 80rpx); padding: 500rpx 40rpx 200rpx; position: relative; z-index: 1; }

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32rpx;
}

.product-card {
  position: relative;
  border-radius: 48rpx;
  overflow: hidden;
  height: 1200rpx;
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:active {
    transform: scale(0.96);
    box-shadow: 0 6rpx 32rpx rgba(201, 169, 98, 0.25);
  }
}

.product-image-full {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

.product-img-full {
  width: 100%; height: 100%;
  object-fit: cover;
}

.product-emoji-full {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%;
  font-size: 320rpx;
  background: linear-gradient(145deg, rgba(40, 40, 70, 0.5), rgba(32, 32, 58, 0.6));
}

/* 在线指示点 */
.online-dot {
  position: absolute; top: 28rpx; right: 28rpx;
  width: 32rpx; height: 32rpx;
  background: #4ade80;
  border-radius: 50%;
  border: 4rpx solid rgba(0,0,0,.4);
  box-shadow: 0 0 24rpx rgba(74,222,128,.7);
  animation: pulseGreen 2s infinite;
  z-index: 3;
}

/* 忙碌遮罩 */
.busy-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 2;
  backdrop-filter: blur(4rpx);
}
.busy-text {
  font-size: 64rpx; color: rgba(255,255,255,.6); font-weight: 700;
  padding: 24rpx 56rpx; background: rgba(0,0,0,.45);
  border-radius: 36rpx; border: 1px solid rgba(255,255,255,.12);
}

/* 渐变 + 信息叠加层 — 全幅蒙版 */
.product-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2;
  pointer-events: none;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.overlay-gradient {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(0deg, rgba(10,10,20,.95) 0%, rgba(10,10,20,.45) 50%, rgba(10,10,20,.15) 80%, transparent 100%);
  pointer-events: none;
}
.overlay-content {
  position: relative; z-index: 1;
  padding: 0 32rpx 36rpx;
  pointer-events: auto;
}
.product-name {
  display: block;
  font-size: 64rpx;
  font-weight: 800;
  color: #f1f5f9;
  text-shadow: 0 4rpx 16rpx rgba(0,0,0,.8);
  letter-spacing: 2rpx;
  margin-bottom: 20rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.product-price-row {
  display: flex; align-items: center; justify-content: space-between;
}
.price-wrap {
  display: flex; align-items: baseline; gap: 4rpx;
  .price-value {
    font-size: 84rpx; font-weight: 900; color: $gold;
    text-shadow: 0 0 32rpx rgba($gold,.5); font-family: 'Courier New', monospace;
    &::before { content: '¥'; font-size: 48rpx; margin-right: 4rpx; }
  }
  .price-unit {
    font-size: 40rpx; color: rgba(255,255,255,.45); margin-left: 4rpx;
  }
}
.add-btn {
  position: relative;
  width: 100rpx; height: 100rpx;
  background: linear-gradient(135deg, rgba($gold,.25), rgba($gold,.1));
  border-radius: 50%;
  border: 4rpx solid rgba($gold,.4);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6rpx 24rpx rgba($gold,.25), 0 0 32rpx rgba($gold,.1);
  transition: all .25s;

  text { font-size: 72rpx; color: $gold; font-weight: 400; line-height: 1; }

  .add-btn-glow {
    position: absolute; inset: 0; border-radius: 50%;
    opacity: 0; background: radial-gradient(circle, rgba($gold,.6), transparent);
    transition: opacity .25s;
  }

  &:active { transform: scale(1.15);
    .add-btn-glow { opacity: 1; }
  }

  &.busy { opacity: .35; }
}

/* ── 详情弹窗 ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.9); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(16rpx); padding: 40rpx; }
.modal-card { width: 80vw; height: 80vh; background: linear-gradient(180deg, #232340 0%, #1a1a30 100%); border-radius: 64rpx; padding: 56rpx 56rpx 40rpx; border: 4rpx solid rgba($gold,.35); box-shadow: 0 40rpx 100rpx rgba(0,0,0,.6), 0 0 80rpx rgba($gold,.15), inset 0 2rpx 0 rgba(255,255,255,.08); position: relative; overflow: hidden; display: flex; flex-direction: column;
  &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6rpx; background: linear-gradient(90deg, transparent, rgba($gold,.8), rgba($gold,.4), transparent); }
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 36rpx; padding-bottom: 24rpx; border-bottom: 2rpx solid rgba($gold,.2); flex-shrink: 0; }
.modal-title { font-size: 72rpx; font-weight: 800; color: $gold; letter-spacing: 3rpx; text-shadow: 0 0 24rpx rgba($gold,.5); }
.modal-close { width: 64rpx; height: 64rpx; background: linear-gradient(135deg, rgba($gold,.12), rgba($gold,.04)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48rpx; color: $gold; border: 2rpx solid rgba($gold,.25);
  &:active { transform: scale(.92); }
}
.modal-body { flex: 1; overflow-y: auto; margin-bottom: 28rpx; }
.modal-footer { flex-shrink: 0; border-top: 2rpx solid rgba($gold,.2); padding-top: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.footer-summary { display: flex; justify-content: space-between; align-items: baseline;
  .footer-summary-label { font-size: 42rpx; color: rgba(255,255,255,.5); }
  .footer-summary-val { font-size: 72rpx; font-weight: 800; color: #feca57; text-shadow: 0 0 20rpx rgba(254,202,87,.5); }
}
.footer-action { height: 96rpx; border-radius: 28rpx; background: linear-gradient(135deg, $gold, #8a6d3b); display: flex; align-items: center; justify-content: center; font-size: 51rpx; font-weight: 700; color: #1a1a2e; box-shadow: 0 10rpx 36rpx rgba($gold,.35);
  &:active { transform: scale(.97); }
  &.secondary { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); box-shadow: none; border: 2rpx solid rgba(255,255,255,.1); }
  &.loading { opacity: .7; }
}

/* 详情内容 */
/* ── 相册轮播 — 固定高度，图片 aspectFill */
.carousel-wrap {
  width: 100%; height: 1800rpx;
  border-radius: 48rpx; overflow: hidden; margin-bottom: 40rpx; flex-shrink: 0;
  background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6));
  border: 3rpx solid rgba($gold,.2);
  .carousel { width: 100%; height: 100%; }
  .carousel-img { width: 100%; height: 100%; object-fit: cover; }
}
.carousel-placeholder {
  width: 100%; height: 500rpx; border-radius: 48rpx; margin-bottom: 40rpx; flex-shrink: 0;
  background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6));
  border: 3rpx solid rgba($gold,.15);
  display: flex; align-items: center; justify-content: center;
  .placeholder-emoji { font-size: 240rpx; }
}

/* ── 等级/评分/价格 紧凑行 ── */
.detail-meta-bar {
  display: flex; align-items: center; gap: 24rpx; margin-bottom: 36rpx;
  flex-wrap: wrap;
  .meta-level {
    padding: 12rpx 32rpx; background: linear-gradient(135deg, rgba($gold,.15), rgba($gold,.05));
    border-radius: 28rpx; border: 2rpx solid rgba($gold,.25); font-size: 48rpx; color: $gold; font-weight: 700;
  }
  .meta-divider { font-size: 42rpx; color: rgba(255,255,255,.2); }
  .meta-rating { font-size: 48rpx; color: rgba(255,255,255,.6); font-weight: 600; }
  .meta-price { font-size: 48rpx; color: #feca57; font-weight: 700; }
}

.info-block { margin-bottom: 40rpx; }
.info-title { display: block; font-size: 56rpx; font-weight: 700; color: $gold; margin-bottom: 24rpx; letter-spacing: 2rpx; }
.info-body { display: block; font-size: 48rpx; color: rgba(255,255,255,.55); line-height: 1.8; }
.skill-tags { display: flex; gap: 16rpx; flex-wrap: wrap; margin-top: 24rpx; }
.skill-tag { padding: 14rpx 32rpx; background: rgba(139,92,246,.12); color: #a78bfa; border-radius: 24rpx; font-size: 42rpx; font-weight: 600; border: 2rpx solid rgba(139,92,246,.2); }

/* 固定底部预约栏 */
.fixed-book-bar {
  display: flex; align-items: center; justify-content: space-between; gap: 32rpx;
  .fb-price { font-size: 72rpx; font-weight: 800; color: #feca57; text-shadow: 0 0 28rpx rgba(254,202,87,.5); white-space: nowrap; }
  .fb-btn { flex: 1; min-height: 120rpx; border-radius: 36rpx; display: flex; align-items: center; justify-content: center; font-size: 56rpx; font-weight: 700; background: linear-gradient(135deg, $gold, #8a6d3b); color: #1a1a2e; box-shadow: 0 12rpx 48rpx rgba($gold,.45);
    &:active { transform: scale(.97); }
    &.loading { opacity: .7; }
  }
}

.duration-row { display: flex; gap: 24rpx;
  .dur-chip { flex: 1; text-align: center; padding: 32rpx 20rpx; border-radius: 32rpx; background: rgba(255,255,255,.03); border: 3rpx solid rgba(255,255,255,.06); transition: all .3s; min-height: 140rpx; display: flex; flex-direction: column; justify-content: center;
    &.active { background: rgba($gold,.1); border-color: rgba($gold,.35); box-shadow: 0 0 24rpx rgba($gold,.15); }
  }
  .dur-label { display: block; font-size: 52rpx; font-weight: 700; color: #f1f5f9; }
  .dur-price { display: block; font-size: 44rpx; color: $gold; margin-top: 12rpx; font-weight: 600; }
}

/* 服务管理弹窗 */
.service-item { display: flex; align-items: center; gap: 28rpx; padding: 32rpx; margin-bottom: 20rpx; background: rgba(255,255,255,.04); border-radius: 36rpx; border: 2rpx solid rgba(255,255,255,.06); }
.si-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6)); display: flex; align-items: center; justify-content: center;
  image { width: 100%; height: 100%; object-fit: cover; }
  text { font-size: 72rpx; }
}
.si-info { flex: 1; min-width: 0; }
.si-name { font-size: 52rpx; font-weight: 700; color: #f1f5f9; display: block; }
.si-meta { display: flex; align-items: center; gap: 20rpx; margin-top: 10rpx; }
.si-rate { font-size: 44rpx; color: $gold; font-weight: 600; }
.si-status { font-size: 40rpx; padding: 8rpx 20rpx; border-radius: 18rpx; font-weight: 600;
  &.pending { background: rgba(245,158,11,.15); color: #f59e0b; }
  &.processing { background: rgba(59,130,246,.15); color: #3b82f6; }
  &.serving { background: rgba(34,197,94,.15); color: #22c55e; }
  &.completed { background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); }
}
.si-duration { display: block; font-size: 44rpx; color: rgba(255,255,255,.5); margin-top: 8rpx; font-family: 'Courier New', monospace; }
.si-actions { display: flex; gap: 16rpx; flex-shrink: 0; flex-direction: column; }
.si-btn { padding: 20rpx 32rpx; border-radius: 24rpx; font-size: 40rpx; font-weight: 700; transition: all .2s; min-width: 120rpx; text-align: center;
  &:active { transform: scale(.95); }
  &.start { background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; box-shadow: 0 8rpx 28rpx rgba(34,197,94,.3); }
  &.end { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 8rpx 28rpx rgba(239,68,68,.3); }
  &.cancel { background: rgba(255,255,255,.06); color: rgba(255,255,255,.5); border: 2rpx solid rgba(255,255,255,.1); }
}

.modal-empty { text-align: center; padding: 120rpx 0; }
.modal-empty-icon { font-size: 160rpx; display: block; margin-bottom: 32rpx; }
.modal-empty-text { font-size: 52rpx; color: rgba(255,255,255,.4); }

.loading-state { text-align: center; padding: 160rpx 0; }
.loading-icon { font-size: 128rpx; display: block; margin-bottom: 32rpx; }
.loading-text { font-size: 52rpx; color: rgba(255,255,255,.4); }

.call-waiter-btn-wrap {
  position: fixed;
  right: 32rpx;
  bottom: 320rpx;
  z-index: 9999;
}

.call-waiter-btn {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.95), rgba(138, 109, 59, 0.9));
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 24rpx 72rpx rgba(201, 169, 98, 0.5),
    0 0 60rpx rgba(201, 169, 98, 0.3),
    inset 0 4rpx 8rpx rgba(255, 255, 255, 0.3),
    inset 0 -4rpx 8rpx rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.92);
    box-shadow: 
      0 12rpx 36rpx rgba(201, 169, 98, 0.4),
      0 0 30rpx rgba(201, 169, 98, 0.2),
      inset 0 4rpx 8rpx rgba(255, 255, 255, 0.2),
      inset 0 -4rpx 8rpx rgba(0, 0, 0, 0.3);
  }
  
  .call-icon-wrap {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
      border-radius: 50%;
      animation: iconPulse 3s ease-in-out infinite;
    }
    
    .call-icon {
      position: relative;
      z-index: 1;
      font-size: 72rpx;
      filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.3));
    }
  }
  
  &.calling {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.9));
    border-color: rgba(255, 255, 255, 0.4);
    
    .btn-glow-ring {
      position: absolute;
      top: -20rpx; left: -20rpx; right: -20rpx; bottom: -20rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(245, 158, 11, 0.6);
      animation: glowPulse 2s ease-out infinite;
    }
    
    .btn-pulse-ring {
      position: absolute;
      top: -30rpx; left: -30rpx; right: -30rpx; bottom: -30rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(245, 158, 11, 0.4);
      animation: glowPulse 2s ease-out infinite;
      animation-delay: 0.5s;
    }
  }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

@keyframes glowPulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}
</style>
