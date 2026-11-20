<template>
  <view class="container">
    <view class="sticky-header">
      <view class="header-card">
        <view class="header-row">
          <view class="header-left">
            <view class="header-icon-wrap">
              <text class="header-icon">🏠</text>
            </view>
            <view class="header-title-wrap">
              <text class="header-title">{{ activeTab === 'product' ? '商品服务' : '教练服务' }}</text>
              <text class="header-count">{{ activeTab === 'product' ? products.length + '件商品' : assistants.length + '位教练' }}</text>
            </view>
          </view>
          
          <view class="header-right">
            <view v-if="!orderStatus" class="status-tag empty" @click="goToHome">
              <text>还未开台</text>
            </view>
            <view v-else class="status-tag active" @click="activeTab === 'product' ? (showOrderDetailModal = true) : (showAssistantOrdersModal = true)">
              <text>{{ orderStatus.tableNumber }}台 · {{ orderStatus.duration }}</text>
            </view>
            <view class="search-btn" @click="toggleSearch">
              <text>🔍</text>
            </view>
          </view>
        </view>
      </view>

      <view class="tab-bar">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'product' }"
          @click="activeTab = 'product'"
        >
          <text class="tab-label">商品</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'assistant' }"
          @click="activeTab = 'assistant'"
        >
          <text class="tab-label">教练</text>
        </view>
      </view>

      <view class="search-bar" v-if="showSearch">
        <view class="search-box">
          <text class="search-icon">🔍</text>
          <input
            class="search-input"
            v-model="searchKeyword"
            :placeholder="activeTab === 'product' ? '搜索商品...' : '搜索教练...'"
          />
          <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">✕</view>
        </view>
      </view>

      <scroll-view class="category-scroll" scroll-x enhanced :show-scrollbar="false" v-if="activeTab === 'product'">
        <view 
          class="category-item" 
          :class="{ active: currentCategory === item.id }"
          v-for="item in categories" 
          :key="item.id"
          @click="selectCategory(item.id)"
        >
          <text class="category-name">{{ item.name }}</text>
        </view>
      </scroll-view>

      <scroll-view class="category-scroll" scroll-x enhanced :show-scrollbar="false" v-if="activeTab === 'assistant'">
        <view 
          class="category-item" 
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >
          <text class="category-name">全部</text>
        </view>
        <view 
          class="category-item" 
          :class="{ active: filterType === 'available' }"
          @click="filterType = 'available'"
        >
          <text class="category-name">可预约</text>
        </view>
        <view 
          class="category-item" 
          v-for="level in assistantLevels" 
          :key="level.id"
          :class="{ active: filterType === level.id || filterType === level.code }"
          @click="filterType = level.id"
        >
          <text class="category-name">{{ level.name }}</text>
        </view>
      </scroll-view>
    </view>

    <view class="loading-overlay" v-if="isLoading">
      <Skeleton :card-count="4" :show-list="true" />
    </view>
    
    <scroll-view class="product-list" scroll-y v-if="activeTab === 'product'">
      <view class="product-section" v-for="section in productSections" :key="section.name">
        <view class="section-header">
          <view class="section-title-wrap">
            <view class="section-line"></view>
            <text class="section-title">{{ section.name }}</text>
          </view>
          <text class="section-count">{{ section.products.length }}件</text>
        </view>
        <view class="product-grid">
          <view 
            class="product-card" 
            v-for="product in section.products" 
            :key="product.id"
            @click="showProductDetail(product)"
          >
            <view class="product-image-full">
              <image v-if="product.image" class="product-img-full" :src="product.image" mode="aspectFill" />
              <text v-else class="product-emoji-full">{{ product.emoji || '📦' }}</text>
              <view class="product-badge-full" :class="product.tag" v-if="product.tag">{{ getTagLabel(product.tag) }}</view>
            </view>
            <view class="product-info">
              <text class="product-name">{{ product.name }}</text>
              <view class="product-price-row">
                <view class="price-wrap">
                  <text class="price-symbol">¥</text>
                  <text class="price-value">{{ product.price }}</text>
                  <text class="price-unit">/{{ product.unit }}</text>
                </view>
                <view class="add-btn" @click.stop="addToCart(product)">
                  <text>+</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <scroll-view class="assistant-list" scroll-y v-if="activeTab === 'assistant'">
      <view class="assistant-grid">
        <view class="assistant-card" v-for="a in filteredAssistants" :key="a.id" @click="selectAssistant(a)">
          <view class="assistant-image-wrap">
            <image v-if="getAssistantImage(a)" class="assistant-img" :src="getAssistantImage(a)" mode="aspectFill" />
            <text v-else class="assistant-emoji">👨‍🏫</text>
            <view class="online-dot" v-if="a.is_online === 1 && !a.is_busy"></view>
            <view class="busy-overlay" v-if="a.is_busy || a.status === 0">
              <text class="busy-text">{{ a.is_busy ? '服务中' : '休息' }}</text>
            </view>
          </view>
          <view class="assistant-info">
            <text class="assistant-name">{{ a.name }}</text>
            <text class="assistant-level">{{ a.level_name }}</text>
            <view class="assistant-price-row">
              <view class="price-wrap">
                <text class="price-symbol">¥</text>
                <text class="price-value">{{ calcMinuteRate(a.hourly_rate) }}</text>
                <text class="price-unit">/分钟</text>
              </view>
              <view class="add-btn" :class="{ busy: a.is_busy }" @click.stop="selectAssistant(a)">
                <text>{{ a.is_busy ? '忙' : '+' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!assistantsLoaded" class="loading-state">
        <text class="loading-icon">⏳</text>
        <text class="loading-text">加载中...</text>
      </view>
    </scroll-view>

    <view class="cart-bar" v-if="cartCount > 0">
      <view class="cart-info" @click="showCartModal = true">
        <view class="cart-icon-wrap">
          <text class="cart-icon">🛒</text>
          <view class="cart-count">{{ cartCount }}</view>
        </view>
        <view class="cart-summary">
          <text class="cart-total">¥{{ formatPrice(cartTotal) }}</text>
          <text class="cart-count-text">{{ cartCount }}件商品</text>
        </view>
      </view>
      <view class="cart-detail-btn" @click.stop="showCartModal = true">
        <text>查看详情</text>
      </view>
    </view>

    <ContentModal :visible="showCartModal" title="购物车" :show-footer="false" @close="closeCart">
      <view class="detail-wrap">
        <scroll-view class="detail-scroll" scroll-y>
          <view class="cart-item" v-for="item in cartItems" :key="item.product_id || item.id">
            <view class="cart-item-image">
              <image v-if="item.image" class="cart-item-img" :src="item.image" mode="aspectFill" />
              <view v-else class="item-image-bg"></view>
              <text v-if="!item.image" class="cart-item-emoji">{{ item.emoji || '📦' }}</text>
            </view>
            <view class="cart-item-info">
              <text class="cart-item-name">{{ item.item_name || item.name || '未知商品' }}</text>
              <text class="cart-item-price">¥{{ item.unit_price || 0 }}/{{ item.unit || '份' }}</text>
            </view>
            <view class="cart-item-quantity">
              <view class="qty-btn minus" @tap="decreaseQty(item)">-</view>
              <text class="qty-num">{{ item.quantity || 0 }}</text>
              <view class="qty-btn plus" @tap="increaseQty(item)">+</view>
            </view>
            <view class="cart-item-total">
              <text>¥{{ formatPrice((item.unit_price || 0) * (item.quantity || 0)) }}</text>
            </view>
          </view>
        </scroll-view>
        <view class="fixed-book-bar">
          <text class="fb-price">¥{{ formatPrice(cartTotal) }}</text>
          <view
            v-if="isOrderActive"
            class="fb-btn"
            :class="{ loading: submitting }"
            :disabled="submitting"
            @tap="confirmOrder"
          >{{ submitting ? '提交中...' : '确认下单' }}</view>
          <view
            v-else
            class="fb-btn secondary"
            @tap="goToHome"
          >去开台</view>
        </view>
      </view>
    </ContentModal>

    <ContentModal
      :visible="!!selectedProduct"
      :title="selectedProduct?.name || '商品详情'"
      :show-footer="false"
      @close="closeProductDetail"
    >
      <view class="detail-wrap" v-if="selectedProduct">
        <scroll-view class="detail-scroll" scroll-y>
          <view class="detail-image-wrap">
            <image v-if="selectedProduct.image" class="detail-img" :src="selectedProduct.image" mode="aspectFill" />
            <text v-else class="detail-emoji-big">{{ selectedProduct.emoji || '📦' }}</text>
            <view class="detail-tag" :class="selectedProduct.tag" v-if="selectedProduct.tag">{{ getTagLabel(selectedProduct.tag) }}</view>
          </view>
          <view class="detail-meta-bar">
            <text class="meta-price">¥{{ selectedProduct.price }}</text>
            <text class="meta-unit">/{{ selectedProduct.unit }}</text>
            <text class="meta-divider" v-if="selectedProduct.stock !== undefined">·</text>
            <text class="meta-stock" v-if="selectedProduct.stock !== undefined" :class="{ soldout: selectedProduct.stock <= 0 }">
              {{ selectedProduct.stock > 0 ? '库存 '+selectedProduct.stock : '已售罄' }}
            </text>
          </view>
          <text class="detail-desc" v-if="selectedProduct.desc">{{ selectedProduct.desc }}</text>
          <text class="detail-body" v-if="selectedProduct.detail && selectedProduct.detail !== selectedProduct.desc">{{ selectedProduct.detail }}</text>
        </scroll-view>
        <view class="fixed-book-bar">
          <text class="fb-price">¥{{ (selectedProduct?.price || 0) * detailQuantity }}</text>
          <view class="footer-qty">
            <view class="qty-btn minus" @tap="decreaseDetailQty">-</view>
            <text class="qty-num">{{ detailQuantity }}</text>
            <view class="qty-btn plus" @tap="increaseDetailQty">+</view>
          </view>
          <view class="fb-btn" @tap="addToCartWithQty">加入购物车</view>
        </view>
      </view>
    </ContentModal>

    <ContentModal :visible="showOrderDetailModal" title="待确认商品" @close="showOrderDetailModal = false">
      <scroll-view class="modal-body" scroll-y>
        <view v-if="preOrderGroups.length > 0" class="preorder-list">
          <view v-for="(group, gi) in preOrderGroups" :key="group.preorder_group_id" class="preorder-group">
            <view class="preorder-group-head">
              <text class="preorder-group-label">订单 {{ gi + 1 }}</text>
            </view>
            <view class="preorder-item" v-for="item in group.items" :key="item.product_id || item.id">
              <view class="preorder-item-thumb">
                <image v-if="item.image" class="preorder-thumb-img" :src="item.image" mode="aspectFill" />
                <text v-else class="preorder-item-emoji">{{ item.emoji || '📦' }}</text>
              </view>
              <view class="preorder-item-info">
                <text class="preorder-item-name">{{ item.item_name }}</text>
                <text class="preorder-item-price">¥{{ item.unit_price }}/{{ item.unit || '份' }}</text>
              </view>
              <text class="preorder-item-qty">x{{ item.quantity }}</text>
              <text class="preorder-item-total">¥{{ formatPrice(item.unit_price * item.quantity) }}</text>
              <view class="preorder-item-cancel" @click.stop="handleRejectPreOrderItem(item.id, group.preorder_group_id)">取消</view>
            </view>
            <view class="preorder-group-total">小计 ¥{{ formatPrice(group.total_amount) }}</view>
          </view>
        </view>
        <view v-else class="modal-empty">
          <text class="modal-empty-icon">📋</text>
          <text class="modal-empty-text">暂无待确认商品</text>
        </view>
      </scroll-view>
      <template #footer>
        <view class="footer-summary" v-if="preOrderGroups.length > 0">
          <text class="footer-summary-label">合计</text>
          <text class="footer-summary-val">¥{{ formatPrice(preorderTotalAmount) }}</text>
        </view>
        <view class="footer-action" @click="showOrderDetailModal = false">关闭</view>
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
          <text class="call-icon">{{ isCallingWaiter ? '⏳' : '🛎️' }}</text>
        </view>
      </view>
    </view>

    <ContentModal
      :visible="!!selectedAssistant"
      :title="selectedAssistant?.name || '教练详情'"
      :show-footer="true"
      height="75vh"
      @close="closeAssistantModal"
    >
      <scroll-view class="modal-body" scroll-y v-if="selectedAssistant">
        <view class="carousel-wrap" v-if="hasAlbum">
          <swiper class="carousel" :current="carouselIdx" @change="onCarouselChange" circular indicator-dots indicator-color="rgba(255,255,255,.3)" indicator-active-color="#07C160">
            <swiper-item v-for="(url, ai) in selectedAssistant.album" :key="ai">
              <image class="carousel-img" :src="url" mode="aspectFill" />
            </swiper-item>
          </swiper>
        </view>
        <view class="carousel-placeholder" v-else>
          <text class="placeholder-emoji">👨‍🏫</text>
        </view>

        <view class="detail-meta-bar">
          <text class="meta-level">{{ selectedAssistant.level_name }}</text>
          <text class="meta-divider">·</text>
          <text class="meta-rating">★ {{ selectedAssistant.rating }}</text>
          <text class="meta-divider">·</text>
          <text class="meta-price">¥{{ calcMinuteRate(selectedAssistant.hourly_rate) }}/分钟</text>
        </view>

        <view class="info-block" v-if="selectedAssistant.introduction || (selectedAssistant.skills && selectedAssistant.skills.length)">
          <text class="info-body" v-if="selectedAssistant.introduction">{{ selectedAssistant.introduction }}</text>
          <view class="skill-tags" v-if="selectedAssistant.skills && selectedAssistant.skills.length">
            <text class="skill-tag" v-for="tag in selectedAssistant.skills" :key="tag">{{ tag }}</text>
          </view>
        </view>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { tabletApi } from '@/api'
import { orderStore } from '@/stores/order'
import { cartStore } from '@/stores/cart'
import { authStore } from '@/stores/auth'
import Skeleton from '@/components/Skeleton.vue'
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'
import { formatPrice, formatDuration } from '@/utils/format'
import { useServiceCall } from '@/composables/useServiceCall'
import { tableWs } from '@/utils/websocket'
import { useTabState } from '@/stores/tabState'
import { isOnline } from '@/utils/network'
import { offlineCache } from '@/utils/offline-cache'
import { offlineQueue } from '@/utils/offline-queue'

const tab = useTabState('product')

const activeTab = ref<'product' | 'assistant'>('product')

const {
  isCallingWaiter, showCancelWaiterModal,
  callWaiter, cancelWaiterCall, dispose: disposeServiceCall,
} = useServiceCall()

const cartItems = computed(() => cartStore.cartItems.value)
const cartCount = computed(() => cartStore.cartCount)
const cartTotal = computed(() => cartStore.cartTotal)
const isOrderActive = computed(() => orderStore.isOrderActive)

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
  status?: number
}

interface AssistantLevel {
  id: string
  name: string
  code: string
  color?: string
  hourly_rate?: number
}

const assistants = ref<Assistant[]>([])
const assistantLevels = ref<AssistantLevel[]>([])
const filterType = ref('all')
const selectedAssistant = ref<Assistant | null>(null)
const selectedDuration = ref(1)
const durations = [1, 2, 3]
const booking = ref(false)
const assistantsLoaded = ref(false)
const showAssistantOrdersModal = ref(false)
const assistantOrders = ref<any[]>([])
const timerTick = ref(0)
let assistantPollTimer: ReturnType<typeof setInterval> | null = null
let assistantClockTimer: ReturnType<typeof setInterval> | null = null

const carouselIdx = ref(0)
const hasAlbum = computed(() => selectedAssistant.value?.album && selectedAssistant.value.album.length > 0)

const servingCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'serving').length)
const assistantPendingCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'pending').length)
const readyCount = computed(() => assistantOrders.value.filter((i: any) => i.status === 'processing').length)
const activeAssistantOrders = computed(() => assistantOrders.value.filter((i: any) => i.status !== 'cancelled'))

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

function calcAssistantTimer(item: any): string {
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
  } catch {}
}

function startAssistantClock() {
  if (assistantClockTimer) clearInterval(assistantClockTimer)
  assistantClockTimer = setInterval(() => { timerTick.value++ }, 1000) as unknown as number
}

function stopAssistantClock() {
  if (assistantClockTimer) { clearInterval(assistantClockTimer); assistantClockTimer = null }
}

function startAssistantPoll() {
  if (assistantPollTimer) clearInterval(assistantPollTimer)
  loadAssistantOrders()
  assistantPollTimer = setInterval(() => loadAssistantOrders(), 30000) as unknown as number
}

function stopAssistantPoll() {
  if (assistantPollTimer) { clearInterval(assistantPollTimer); assistantPollTimer = null }
}

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
  if (searchKeyword.value.trim() && activeTab.value === 'assistant') {
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
      assistantsLoaded.value = true
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
    assistantsLoaded.value = true
  } catch {
    uni.showToast({ title: '加载教练失败', icon: 'none' })
    assistantsLoaded.value = true
  }
}

function selectAssistant(assistant: Assistant) {
  if (assistant.is_busy) {
    uni.showToast({ title: '该教练当前忙碌中', icon: 'none' })
    return
  }
  selectedAssistant.value = assistant
  selectedDuration.value = 1
}

function closeAssistantModal() {
  selectedAssistant.value = null
}

function onCarouselChange(e: any) {
  carouselIdx.value = e.detail.current
}

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
    closeAssistantModal()
    return
  }

  try {
    await tabletApi.bookAssistant({
      order_id: orderStore.orderId,
      assistant_id: selectedAssistant.value.id,
      duration: selectedDuration.value,
    })
    uni.showToast({ title: `预约成功(${selectedDuration.value}小时)，等待教练确认`, duration: 2000 })
    closeAssistantModal()
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

interface Product {
  id: string
  name: string
  desc: string
  detail: string
  price: number
  unit: string
  emoji: string
  tag?: string
  category_id: string
  stock?: number
  image?: string
}

interface Category {
  id: string
  name: string
  icon: string
}

interface OrderStatus {
  tableNumber: string
  duration: string
  orderId: string
  totalAmount: number
}

const showSearch = ref(false)
const searchKeyword = ref('')
const currentCategory = ref('all')
const categories = ref<Category[]>([])
const products = ref<Product[]>([])
const showCartModal = ref(false)
const selectedProduct = ref<Product | null>(null)
const detailQuantity = ref(1)
const orderStatus = ref<OrderStatus | null>(null)
const isLoading = ref(!tab.loaded)
const showOrderDetailModal = ref(false)
const preOrderGroups = ref<any[]>([])
const submitting = ref(false)

let timer: ReturnType<typeof setInterval> | null = null

const preorderTotalAmount = computed(() => {
  return preOrderGroups.value.reduce((sum: number, g: any) => sum + (g.total_amount || 0), 0)
})

const pendingCount = computed(() => {
  const items = orderStore.orderItems.value || []
  return items.filter((i: any) => i.status === 'pending').length
})

const processingCount = computed(() => {
  const items = orderStore.orderItems.value || []
  return items.filter((i: any) => i.status === 'processing').length
})

const productSections = computed(() => {
  let filteredProducts = products.value
  
  if (currentCategory.value !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category_id === currentCategory.value)
  }
  
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(keyword) || p.desc.toLowerCase().includes(keyword)
    )
  }
  
  const grouped: any = {}
  filteredProducts.forEach(product => {
    const category = categories.value.find(c => c.id === product.category_id)
    const categoryName = category?.name || '其他'
    if (!grouped[categoryName]) {
      grouped[categoryName] = []
    }
    grouped[categoryName].push(product)
  })
  
  return Object.keys(grouped).map(name => ({
    name,
    products: grouped[name]
  }))
})

function getTagLabel(tag: string) {
  const labels: Record<string, string> = {
    hot: '热销',
    recommend: '推荐',
    new: '新品'
  }
  return labels[tag] || tag
}

function normalizeArrayResponse(raw: any): any[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw
  for (const key of ['data', 'list']) {
    const inner = raw[key]
    if (Array.isArray(inner)) return inner
    if (inner && typeof inner === 'object') {
      const nextKey = findNextArrayKey(inner)
      const deeper = nextKey ? inner[nextKey] : null
      if (Array.isArray(deeper)) return deeper
    }
  }
  return null
}

function findNextArrayKey(obj: any): string {
  for (const k of ['data', 'list']) {
    if (Array.isArray(obj[k])) return k
  }
  return ''
}

async function loadCategories() {
  try {
    const raw = await tabletApi.getCategories(authStore.storeId)
    const list = normalizeArrayResponse(raw)
    if (list) {
      categories.value = [
        { id: 'all', name: '全部', icon: '📦' },
        ...list.map((item: any) => ({ ...item, id: String(item.id) })),
      ]
    } else {
      console.warn('[商品页] getCategories 返回格式异常:', JSON.stringify(raw).slice(0, 200))
      categories.value = []
    }
  } catch (e) {
    console.error('[商品页] loadCategories 失败:', e)
    categories.value = []
  }
}

async function loadProducts() {
  if (!tab.loaded) isLoading.value = true
  try {
    const raw = await tabletApi.getProducts(authStore.storeId)
    const list = normalizeArrayResponse(raw)
    if (list) {
      products.value = list.map((item: any) => ({
        ...item,
        category_id: String(item.category_id || ''),
      }))
    } else {
      console.warn('[商品页] getProducts 返回格式异常:', JSON.stringify(raw).slice(0, 200))
      products.value = []
    }
    tab.markLoaded()
  } catch (e) {
    console.error('[商品页] loadProducts 失败:', e)
    products.value = []
    uni.showToast({ title: '加载商品失败，请下拉刷新', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}

async function loadOrderStatus() {
  try {
    const result = await tabletApi.getTableOrder(String(authStore.tableId), { showLoading: false })
    const orderData = result as any

    if (orderData && orderData.id) {
      orderStatus.value = {
        tableNumber: orderData.table_name || orderData.table_number || authStore.tableName || '未知',
        duration: orderData.duration_formatted || formatDuration(orderData.duration_minutes || 0),
        orderId: orderData.id,
        totalAmount: Number(orderData.product_fee) || 0,
      }
      orderStore.order.value = orderData
      orderStore.orderItems.value = orderData.items || []
    } else {
      orderStatus.value = null
    }
  } catch (e) {
    console.error('[商品页] loadOrderStatus 失败:', e)
    orderStatus.value = null
  }
}

function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchKeyword.value = ''
  }
}

function clearSearch() {
  searchKeyword.value = ''
}

function selectCategory(categoryId: string) {
  currentCategory.value = categoryId
}

function showProductDetail(product: Product) {
  selectedProduct.value = product
  detailQuantity.value = 1
}

function closeProductDetail() {
  selectedProduct.value = null
}

function addToCart(product: Product) {
  if (product.stock !== undefined && product.stock <= 0) {
    uni.showToast({ title: '该商品已售罄', icon: 'none' })
    return
  }

  const cartItem = {
    id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    product_id: product.id,
    item_name: product.name,
    unit_price: product.price,
    quantity: 1,
    final_price: product.price,
    emoji: product.emoji,
    unit: product.unit,
    description: '',
  }

  cartStore.addToCart(cartItem as any)
  uni.showToast({ title: '已添加', icon: 'success', duration: 1000 })
}

function addToCartWithQty() {
  if (!selectedProduct.value) return

  const p = selectedProduct.value
  if (p.stock !== undefined && p.stock <= 0) {
    uni.showToast({ title: '该商品已售罄', icon: 'none' })
    return
  }

  const cartItem = {
    id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    product_id: p.id,
    item_name: p.name,
    unit_price: p.price,
    quantity: detailQuantity.value,
    final_price: p.price * detailQuantity.value,
    emoji: p.emoji,
    unit: p.unit,
    description: '',
  }

  cartStore.addToCart(cartItem as any)
  uni.showToast({ title: '已添加', icon: 'success', duration: 1000 })
  closeProductDetail()
}

function decreaseQty(item: any) {
  cartStore.updateCartItem(item.product_id || item.id, item.quantity - 1)
}

function increaseQty(item: any) {
  cartStore.updateCartItem(item.product_id || item.id, item.quantity + 1)
}

function decreaseDetailQty() {
  if (detailQuantity.value > 1) {
    detailQuantity.value--
  }
}

function increaseDetailQty() {
  detailQuantity.value++
}

function closeCart() {
  showCartModal.value = false
}

async function confirmOrder() {
  if (submitting.value) return
  if (!orderStore.isOrderActive) {
    uni.showModal({ title: '提示', content: '当前无活跃订单，是否先去开台？' })
    return
  }

  if (cartStore.cartCount === 0) {
    uni.showToast({ title: '购物车为空', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await tabletApi.createPreOrder({
      order_id: orderStore.orderId,
      items: cartStore.cartItems.value.map(item => ({
        product_id: String(item.product_id),
        quantity: item.quantity,
        remark: item.description || ''
      }))
    })

    cartStore.clearCart()
    showCartModal.value = false
    uni.showToast({ title: '预订单已提交，等待收银确认', duration: 2000 })

    await loadPreOrders()
  } catch (e: any) {
    uni.showToast({ title: e.errMsg || e.msg || e.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function loadPreOrders() {
  if (!orderStore.orderId) return
  try {
    const data = await tabletApi.getPreOrders(orderStore.orderId)
    const groups: any[] = Array.isArray(data) ? data : ((data as any)?.groups || (data as any)?.data || [])
    preOrderGroups.value = groups
      .map((g: any) => ({
        ...g,
        items: (g.items || []).filter((i: any) => i.item_type === 'product'),
        total_amount: (g.items || []).filter((i: any) => i.item_type === 'product')
          .reduce((sum: number, i: any) => sum + Number(i.unit_price || 0) * Number(i.quantity || 0), 0),
        item_count: (g.items || []).filter((i: any) => i.item_type === 'product')
          .reduce((sum: number, i: any) => sum + Number(i.quantity || 0), 0)
      }))
      .filter((g: any) => g.items.length > 0)
  } catch {
    // 接口暂不可用，静默处理
  }
}

async function handleRejectPreOrderItem(itemId: string, preorderGroupId: string) {
  const confirmed = await new Promise<boolean>(resolve => {
    uni.showModal({
      title: '提示',
      content: '确定要取消该预订单吗？',
      success: (res: any) => resolve(res.confirm),
      fail: () => resolve(false)
    })
  })
  if (!confirmed) return
  try {
    await tabletApi.removeOrderItem(itemId)
    const group = preOrderGroups.value.find(g => g.preorder_group_id === preorderGroupId)
    if (group) {
      group.items = group.items.filter((item: any) => (item.id || item.product_id) !== itemId)
      group.total_amount = group.items.reduce((sum: number, item: any) => sum + (item.unit_price || 0) * item.quantity, 0)
      group.item_count = group.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
      if (group.items.length === 0) {
        preOrderGroups.value = preOrderGroups.value.filter(g => g.preorder_group_id !== preorderGroupId)
      }
    }
    uni.showToast({ title: '已取消' })
    loadPreOrders()
  } catch (e) {
    console.error('[商品页] 取消商品失败:', e)
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

function goToHome() {
  uni.switchTab({ url: '/pages/index/index' }).catch(() => {})
}

function goToAssistant() {
  uni.navigateTo({ url: '/pages/assistant/index' })
}

function handleSocketOrderUpdate(data: any) {
  if (data && data.status === 'delivered') {
    uni.showToast({
      title: '商品已送达！',
      icon: 'success',
      duration: 2000
    })
  }
  loadOrderStatus()
}

onMounted(async () => {
  const [catOk, prodOk] = await Promise.all([
    loadCategories().then(() => true).catch(() => false),
    loadProducts().then(() => true).catch(() => false),
    loadAssistants().then(() => true).catch(() => false),
    loadAssistantLevels().then(() => true).catch(() => false),
  ])
  if (!catOk || !prodOk) {
    console.warn('[商品页] 分类或商品加载失败', { catOk, prodOk })
  }
  await loadOrderStatus()
  await loadPreOrders()
  await loadAssistantOrders()
  const tableId = authStore.tableId
  if (tableId) {
    tableWs.connect(tableId).catch(() => {})
  }
  tableWs.on('order_item_status', handleSocketOrderUpdate)
  tableWs.on('order_update', handleSocketOrderUpdate)
  tableWs.on('preorder_confirmed', (data: any) => {
    uni.showToast({ title: '预订单已确认，商品正在准备', icon: 'success', duration: 2000 })
    preOrderGroups.value = []
    loadOrderStatus()
  })
  tableWs.on('preorder_rejected', (data: any) => {
    uni.showModal({
      title: '预订单已被拒绝',
      content: data.reason || '请重新下单',
      showCancel: false
    })
    loadPreOrders()
  })
  tableWs.on('new_order_item', (data: any) => {
    uni.showToast({ title: '有新商品加入订单', icon: 'none', duration: 2000 })
    loadOrderStatus()
  })
  tableWs.on('order_item_status', (data: any) => {
    if (data && data.item_type === 'assistant') {
      loadAssistantOrders()
    }
  })
  timer = setInterval(() => {
    try { loadOrderStatus() } catch (e) { console.error('[商品页] 轮询loadOrderStatus失败:', e) }
    try { loadPreOrders() } catch (e) { console.error('[商品页] 轮询loadPreOrders失败:', e) }
    try { loadAssistantOrders() } catch (e) { console.error('[商品页] 轮询loadAssistantOrders失败:', e) }
  }, 30000)
  startAssistantPoll()
})

onShow(() => {
  if (!timer) {
    timer = setInterval(() => {
      try { loadOrderStatus() } catch (e) { console.error('[商品页] 轮询loadOrderStatus失败:', e) }
      try { loadPreOrders() } catch (e) { console.error('[商品页] 轮询loadPreOrders失败:', e) }
    }, 60000)
  }
})

onHide(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  stopAssistantPoll()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  stopAssistantClock()
  stopAssistantPoll()
  disposeServiceCall()
  tableWs.off('order_item_status', handleSocketOrderUpdate)
  tableWs.off('order_update', handleSocketOrderUpdate)
  tableWs.off('preorder_confirmed', () => {})
  tableWs.off('preorder_rejected', () => {})
  tableWs.off('new_order_item', () => {})
  tableWs.disconnect()
})
</script>

<style lang="scss" scoped>
$primary: #07C160;
$primary-dark: #06AD56;
$bg-light: #f7f7f7;
$bg-white: #ffffff;
$text-main: #333333;
$text-secondary: #999999;
$text-placeholder: #cccccc;

.container {
  padding: 0;
  min-height: 100vh;
  padding-bottom: 200rpx;
  background: $bg-light;
  position: relative;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: $bg-white;
  padding: 48rpx;
}

.sticky-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 28rpx 40rpx;
  background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%);
  backdrop-filter: blur(30rpx);
  border-bottom: 1rpx solid rgba(0,0,0,0.06);
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);

  .header-card {
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 32rpx;
    padding: 40rpx 48rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 32rpx rgba(7,193,96,0.2);
  }

  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32rpx;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 28rpx;
    flex-shrink: 0;
  }

  .header-icon-wrap {
    position: relative;
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-glow {
    position: absolute;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    border-radius: 50%;
  }

  .icon-ring {
    position: relative;
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid rgba(255,255,255,0.8);
    border-radius: 50%;
  }

  .header-title-wrap {
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .header-title {
    font-size: 64rpx;
    font-weight: 700;
    color: #fff;
    letter-spacing: 3rpx;
  }

  .header-count {
    font-size: 36rpx;
    color: rgba(255,255,255,0.8);
    padding: 6rpx 20rpx;
    background: rgba(255,255,255,0.2);
    border-radius: 32rpx;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 24rpx;
    flex-shrink: 0;
  }

  .status-tag {
    display: flex;
    align-items: center;
    padding: 16rpx 32rpx;
    border-radius: 40rpx;
    font-size: 36rpx;
    font-weight: 500;
    transition: all 0.3s ease;

    &.empty {
      background: rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.8);
    }

    &.active {
      background: rgba(255,255,255,0.3);
      color: #fff;
      box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.1);
    }

    &:active {
      transform: scale(0.96);
    }
  }

  .search-btn {
    width: 112rpx;
    height: 112rpx;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.94);
      background: rgba(255,255,255,0.3);
    }

    text {
      font-size: 48rpx;
    }
  }
}

.tab-bar {
  display: flex;
  background: rgba(255,255,255,0.95);
  border-radius: 32rpx;
  padding: 8rpx;
  margin-bottom: 28rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);

  .tab-item {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 24rpx 0;
    position: relative;
    transition: all 0.3s ease;
    border-radius: 24rpx;

    .tab-label {
      font-size: 52rpx;
      font-weight: 600;
      color: $text-secondary;
      transition: all 0.3s ease;
    }

    &.active {
      background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.05));
      box-shadow: 0 4rpx 16rpx rgba($primary, 0.2);

      .tab-label {
        color: $primary;
        font-weight: 700;
        font-size: 56rpx;
      }
    }

    &:active {
      transform: scale(0.96);
    }
  }
}

.search-bar {
  margin-bottom: 24rpx;

  .search-box {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 96rpx;
    background: $bg-white;
    border-radius: 48rpx;
    padding: 0 36rpx;
    box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);

    .search-icon {
      font-size: 48rpx;
      margin-right: 24rpx;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      height: 100%;
      min-height: 80rpx;
      font-size: 48rpx;
      color: $text-main;
      background: transparent;
      
      &::placeholder {
        color: $text-placeholder;
      }
    }

    .clear-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42rpx;
      color: $text-secondary;
      background: rgba(0,0,0,0.05);
      border-radius: 50%;
      flex-shrink: 0;
      &:active {
        background: rgba(0,0,0,0.1);
      }
    }
  }
}

.category-scroll {
  white-space: nowrap;
  padding: 20rpx 0;

  .category-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 96rpx;
    padding: 20rpx 56rpx;
    margin-right: 24rpx;
    background: $bg-white;
    border-radius: 48rpx;
    border: 2rpx solid rgba(0,0,0,0.06);
    transition: all 0.25s ease;

    &.active {
      background: rgba(7,193,96,0.1);
      border-color: $primary;
      box-shadow: 0 2rpx 12rpx rgba(7,193,96,0.15);

      .category-name {
        color: $primary;
        font-weight: 600;
      }
    }

    &:active {
      transform: scale(0.96);
    }

    .category-name {
      font-size: 44rpx;
      color: $text-secondary;
      font-weight: 500;
      transition: all 0.25s ease;
    }
  }
}

.product-list {
  min-height: calc(100vh - 500rpx);
  padding-top: 660rpx;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 400rpx;
}

.product-section {
  margin-bottom: 48rpx;
  padding: 32rpx;
  background: $bg-white;
  border-radius: 32rpx;
  box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      .section-line {
        width: 12rpx;
        height: 48rpx;
        background: $primary;
        border-radius: 6rpx;
      }
      
      .section-title {
        font-size: 56rpx;
        font-weight: 700;
        color: $text-main;
      }
    }
    
    .section-count {
      font-size: 36rpx;
      color: $text-secondary;
      padding: 8rpx 20rpx;
      background: $bg-light;
      border-radius: 20rpx;
    }
  }
  
  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;

    .product-card {
      position: relative;
      border-radius: 24rpx;
      overflow: hidden;
      background: $bg-light;
      box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
      transition: all 0.25s ease;

      &:active {
        transform: scale(0.96);
        box-shadow: 0 4rpx 20rpx rgba(7,193,96,0.1);
      }

      .product-image-full {
        position: relative;
        width: 100%;
        height: 360rpx;

        .product-img-full {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .product-emoji-full {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          font-size: 120rpx;
          background: $bg-white;
        }

        .product-badge-full {
          position: absolute;
          top: 16rpx;
          right: 16rpx;
          padding: 8rpx 20rpx;
          border-radius: 20rpx;
          font-size: 32rpx;
          color: #fff;
          font-weight: 600;

          &.hot {
            background: linear-gradient(135deg, #FF6B6B, #FF4757);
          }
          &.recommend {
            background: linear-gradient(135deg, $primary, $primary-dark);
          }
          &.new {
            background: linear-gradient(135deg, #8B5CF6, #7C3AED);
          }
        }
      }

      .product-info {
        padding: 20rpx;

        .product-name {
          display: block;
          font-size: 36rpx;
          font-weight: 600;
          color: $text-main;
          margin-bottom: 12rpx;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .product-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .price-wrap {
            display: flex;
            align-items: baseline;
            gap: 4rpx;

            .price-symbol {
              font-size: 28rpx;
              color: $primary;
              font-weight: 600;
            }

            .price-value {
              font-size: 48rpx;
              font-weight: 800;
              color: $primary;
              line-height: 1;
            }

            .price-unit {
              font-size: 26rpx;
              color: $text-secondary;
            }
          }

          .add-btn {
            width: 64rpx;
            height: 64rpx;
            background: linear-gradient(135deg, $primary, $primary-dark);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4rpx 16rpx rgba(7,193,96,0.3);
            transition: all 0.25s;
            flex-shrink: 0;

            &:active {
              transform: scale(0.85);
            }

            text {
              font-size: 56rpx;
              color: #fff;
              font-weight: 600;
              line-height: 1;
            }
          }
        }
      }
    }
  }
}

.detail-wrap {
  display: flex; flex-direction: column; height: 100%; overflow: hidden;
}
.detail-scroll {
  flex: 1; overflow-y: auto; padding: 0 8rpx 16rpx;
}
.detail-image-wrap {
  position: relative;
  width: 100%; height: 800rpx; border-radius: 32rpx; overflow: hidden; margin-bottom: 32rpx;
  background: $bg-light;
  .detail-img { width: 100%; height: 100%; object-fit: cover; }
  .detail-emoji-big { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 200rpx; }
  .detail-tag { position: absolute; top: 24rpx; right: 24rpx; padding: 12rpx 28rpx; border-radius: 24rpx; font-size: 36rpx; font-weight: 600; color: #fff;
    &.hot { background: linear-gradient(135deg, #FF6B6B, #FF4757); }
    &.recommend { background: linear-gradient(135deg, $primary, $primary-dark); }
    &.new { background: linear-gradient(135deg, #8B5CF6, #7C3AED); }
  }
}
.detail-meta-bar { display: flex; align-items: center; justify-content: center; gap: 16rpx; margin-bottom: 24rpx;
  .meta-price { font-size: 64rpx; font-weight: 800; color: $primary; }
  .meta-unit { font-size: 36rpx; color: $text-secondary; }
  .meta-divider { font-size: 32rpx; color: rgba(0,0,0,0.1); margin: 0 8rpx; }
  .meta-stock { font-size: 36rpx; color: $primary; font-weight: 600;
    &.soldout { color: #FF4757; }
  }
}
.detail-desc { display: block; text-align: center; font-size: 48rpx; color: $text-main; margin-bottom: 12rpx; line-height: 1.6; padding: 0 16rpx; font-weight: 600; }
.detail-body { display: block; text-align: center; font-size: 40rpx; color: $text-secondary; margin-bottom: 16rpx; line-height: 1.7; padding: 0 16rpx; }

.fixed-book-bar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 24rpx;
  padding: 28rpx 0 0;
  border-top: 1rpx solid rgba(0,0,0,0.06);
  .fb-price { font-size: 56rpx; font-weight: 800; color: $primary; white-space: nowrap; flex-shrink: 0; }
  .fb-btn { flex: 1; min-height: 110rpx; border-radius: 32rpx; display: flex; align-items: center; justify-content: center; font-size: 52rpx; font-weight: 600; background: linear-gradient(135deg, $primary, $primary-dark); color: #fff; box-shadow: 0 6rpx 24rpx rgba($primary,.3);
    &:active { transform: scale(.97); }
    &.secondary { background: rgba(0,0,0,0.05); color: $text-secondary; box-shadow: none; border: 2rpx solid rgba(0,0,0,0.1); }
  }
}
.footer-qty { display: flex; align-items: center; gap: 16rpx; flex-shrink: 0;
  .qty-btn { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .25s;
    &.minus { background: rgba(0,0,0,0.05); text { font-size: 56rpx; color: $text-main; line-height: 1; } }
    &.plus { background: linear-gradient(135deg, $primary, $primary-dark); text { font-size: 48rpx; color: #fff; line-height: 1; } }
    &:active { transform: scale(0.9); }
  }
  .qty-num { font-size: 56rpx; color: $text-main; min-width: 80rpx; text-align: center; font-weight: 600; }
}

.cart-item {
  display: flex; align-items: center; padding: 28rpx 0;
  border-bottom: 1rpx solid rgba(0,0,0,0.04);
  &:last-child { border-bottom: none; }
  .cart-item-image { position: relative; width: 120rpx; height: 120rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; margin-right: 28rpx; overflow: hidden; flex-shrink: 0; background: $bg-light; }
  .cart-item-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .item-image-bg { position: absolute; inset: 0; background: $bg-light; }
  .cart-item-emoji { position: relative; z-index: 1; font-size: 80rpx; }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name { display: block; font-size: 44rpx; color: $text-main; margin-bottom: 8rpx; font-weight: 600; }
  .cart-item-price { font-size: 36rpx; color: $text-secondary; }
  .cart-item-quantity { display: flex; align-items: center; gap: 20rpx; margin-right: 28rpx; flex-shrink: 0;
    .qty-btn { width: 64rpx; height: 64rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .25s;
      &.minus { background: rgba(0,0,0,0.05); text { font-size: 48rpx; color: $text-main; line-height: 1; } }
      &.plus { background: linear-gradient(135deg, $primary, $primary-dark); text { font-size: 40rpx; color: #fff; line-height: 1; } }
      &:active { transform: scale(0.9); }
    }
    .qty-num { font-size: 48rpx; color: $text-main; min-width: 64rpx; text-align: center; font-weight: 600; }
  }
  .cart-item-total { flex-shrink: 0; }
  .cart-item-total text { font-size: 48rpx; font-weight: 700; color: $primary; }
}

.modal-body {
  flex: 1; overflow-y: auto; margin-bottom: 28rpx;
}

.preorder-list { display: flex; flex-direction: column; gap: 24rpx; }
.preorder-group { background: $bg-light; border-radius: 24rpx; padding: 24rpx; }
.preorder-group-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx;
  .preorder-group-label { font-size: 40rpx; color: $primary; font-weight: 600; }
}
.preorder-item { display: flex; align-items: center; gap: 16rpx; padding: 16rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.04);
  &:last-child { border-bottom: none; }
  .preorder-item-thumb { width: 80rpx; height: 80rpx; border-radius: 16rpx; overflow: hidden; flex-shrink: 0; background: $bg-light; display: flex; align-items: center; justify-content: center; }
  .preorder-thumb-img { width: 100%; height: 100%; object-fit: cover; }
  .preorder-item-emoji { font-size: 48rpx; }
  .preorder-item-info { flex: 1; min-width: 0;
    .preorder-item-name { display: block; font-size: 40rpx; color: $text-main; font-weight: 500; margin-bottom: 4rpx; }
    .preorder-item-price { font-size: 34rpx; color: $text-secondary; }
  }
  .preorder-item-qty { font-size: 36rpx; color: $text-secondary; }
  .preorder-item-total { font-size: 44rpx; color: $primary; font-weight: 600; white-space: nowrap; }
  .preorder-item-cancel { padding: 8rpx 20rpx; border-radius: 12rpx; font-size: 32rpx; font-weight: 500; color: #FF4757; background: rgba(255,71,87,0.1); flex-shrink: 0; min-height: 56rpx; display: flex; align-items: center; justify-content: center; &:active { background: rgba(255,71,87,0.15); } }
}
.preorder-group-total { text-align: right; font-size: 40rpx; color: $primary; font-weight: 600; padding-top: 12rpx; margin-top: 8rpx; border-top: 1rpx solid rgba(0,0,0,0.06); }

.modal-empty { text-align: center; padding: 60rpx 0;
  .modal-empty-icon { font-size: 120rpx; display: block; margin-bottom: 20rpx; }
  .modal-empty-text { font-size: 42rpx; color: $text-secondary; }
}

.cart-bar {
  position: fixed;
  bottom: 80rpx;
  left: 40rpx;
  right: 40rpx;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 140rpx;
  background: $bg-white;
  border-radius: 40rpx;
  padding: 28rpx 40rpx;
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.08);

  .cart-info {
    display: flex;
    align-items: center;
    gap: 32rpx;

    .cart-icon-wrap {
      position: relative;

      .cart-icon {
        font-size: 96rpx;
      }

      .cart-count {
        position: absolute;
        top: -8rpx;
        right: -16rpx;
        min-width: 52rpx;
        height: 52rpx;
        background: linear-gradient(135deg, #FF6B6B, #FF4757);
        border-radius: 26rpx;
        font-size: 36rpx;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 12rpx;
        box-shadow: 0 4rpx 16rpx rgba(255,107,107,0.4);
        font-weight: 600;
      }
    }

    .cart-summary {
      .cart-total {
        display: block;
        font-size: 64rpx;
        font-weight: 800;
        color: $primary;
        line-height: 1.2;
      }

      .cart-count-text {
        font-size: 34rpx;
        color: $text-secondary;
        margin-top: 4rpx;
      }
    }
  }

  .cart-detail-btn {
    min-height: 88rpx;
    padding: 0 36rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(7,193,96,0.1);
    border-radius: 32rpx;
    border: 2rpx solid rgba(7,193,96,0.3);
    transition: all 0.25s;

    &:active {
      transform: scale(0.96);
      background: rgba(7,193,96,0.15);
    }

    text {
      font-size: 44rpx;
      font-weight: 500;
      color: $primary;
    }
  }
}

.footer-summary {
  display: flex; justify-content: space-between; align-items: baseline;
  .footer-summary-label { font-size: 42rpx; color: $text-secondary; }
  .footer-summary-val { font-size: 68rpx; font-weight: 800; color: $primary; }
}
.footer-action {
  height: 96rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, $primary, $primary-dark);
  display: flex; align-items: center; justify-content: center;
  font-size: 50rpx; font-weight: 600; color: #fff;
  box-shadow: 0 8rpx 24rpx rgba($primary,.3);
  &:active { transform: scale(.97); }
  &.secondary { background: rgba(0,0,0,0.05); color: $text-secondary; box-shadow: none; border: 2rpx solid rgba(0,0,0,0.1); }
}

.call-waiter-btn-wrap {
  position: fixed;
  right: 32rpx;
  bottom: 300rpx;
  z-index: 9999;
}

.call-waiter-btn {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, $primary, $primary-dark);
  border-radius: 50%;
  border: 3rpx solid rgba(255,255,255,0.4);
  box-shadow: 0 16rpx 48rpx rgba(7,193,96,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.92);
    box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3);
  }
  
  .call-icon-wrap {
    position: relative;
    width: 100rpx;
    height: 100rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .call-icon {
      position: relative;
      z-index: 1;
      font-size: 64rpx;
    }
  }
  
  &.calling {
    background: linear-gradient(135deg, #FF976A, #F97316);
    border-color: rgba(255,255,255,0.5);
    
    .btn-glow-ring {
      position: absolute;
      top: -16rpx; left: -16rpx; right: -16rpx; bottom: -16rpx;
      border-radius: 50%;
      border: 3rpx solid rgba(249,115,22,0.5);
      animation: glowPulse 2s ease-out infinite;
    }
    
    .btn-pulse-ring {
      position: absolute;
      top: -24rpx; left: -24rpx; right: -24rpx; bottom: -24rpx;
      border-radius: 50%;
      border: 2rpx solid rgba(249,115,22,0.3);
      animation: glowPulse 2s ease-out infinite 0.5s;
    }
  }
}

@keyframes glowPulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}

.assistant-list {
  height: calc(100vh - 80rpx);
  padding: 660rpx 32rpx 200rpx;
  position: relative;
  z-index: 1;
}

.assistant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28rpx;
}

.assistant-card {
  background: $bg-white;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06);
  transition: all 0.25s ease;
  
  &:active {
    transform: scale(0.96);
    box-shadow: 0 6rpx 28rpx rgba(7,193,96,0.15);
  }
  
  .assistant-image-wrap {
    position: relative;
    width: 100%;
    height: 820rpx;
    
    .assistant-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .assistant-emoji {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 140rpx;
      background: $bg-light;
    }
    
    .online-dot {
      position: absolute;
      top: 20rpx;
      right: 20rpx;
      width: 36rpx;
      height: 36rpx;
      background: #4ade80;
      border-radius: 50%;
      border: 4rpx solid rgba(255,255,255,0.8);
      box-shadow: 0 0 20rpx rgba(74,222,128,0.7);
      animation: pulseGreen 2s infinite;
      z-index: 3;
    }
    
    .busy-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      backdrop-filter: blur(4rpx);
      
      .busy-text {
        font-size: 40rpx;
        color: rgba(255,255,255,0.9);
        font-weight: 600;
        padding: 16rpx 36rpx;
        background: rgba(0,0,0,0.6);
        border-radius: 24rpx;
      }
    }
  }
  
  .assistant-info {
    padding: 32rpx;
    
    .assistant-name {
      display: block;
      font-size: 48rpx;
      font-weight: 700;
      color: $text-main;
      margin-bottom: 12rpx;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .assistant-level {
      display: block;
      font-size: 36rpx;
      color: $primary;
      font-weight: 500;
      margin-bottom: 24rpx;
      padding: 8rpx 20rpx;
      background: rgba($primary, 0.08);
      border-radius: 20rpx;
      display: inline-block;
    }
    
    .assistant-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .price-wrap {
        display: flex;
        align-items: baseline;
        gap: 4rpx;
        
        .price-symbol {
          font-size: 36rpx;
          color: $primary;
          font-weight: 700;
        }
        
        .price-value {
          font-size: 64rpx;
          font-weight: 800;
          color: $primary;
          line-height: 1;
        }
        
        .price-unit {
          font-size: 32rpx;
          color: $text-secondary;
        }
      }
      
      .add-btn {
        width: 96rpx;
        height: 96rpx;
        background: linear-gradient(135deg, $primary, $primary-dark);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6rpx 24rpx rgba($primary, 0.4);
        transition: all 0.25s;
        flex-shrink: 0;
        
        &:active {
          transform: scale(0.85);
        }
        
        text {
          font-size: 72rpx;
          color: #fff;
          font-weight: 600;
          line-height: 1;
        }
        
        &.busy {
          opacity: 0.6;
          background: #e5e5e5;
          box-shadow: none;
          
          text { color: $text-secondary; }
        }
      }
    }
  }
}

@keyframes pulseGreen {
  0%, 100% { box-shadow: 0 0 24rpx rgba(74,222,128,0.7); }
  50% { box-shadow: 0 0 40rpx rgba(74,222,128,1); }
}

.carousel-wrap {
  width: 100%; height: 1800rpx;
  border-radius: 48rpx; overflow: hidden; margin-bottom: 40rpx; flex-shrink: 0;
  background: $bg-light;
  
  .carousel { width: 100%; height: 100%; }
  .carousel-img { width: 100%; height: 100%; object-fit: cover; }
}

.carousel-placeholder {
  width: 100%; height: 500rpx; border-radius: 48rpx; margin-bottom: 40rpx; flex-shrink: 0;
  background: $bg-light;
  display: flex; align-items: center; justify-content: center;
  
  .placeholder-emoji { font-size: 240rpx; }
}

.detail-meta-bar {
  display: flex; align-items: center; gap: 24rpx; margin-bottom: 36rpx; flex-wrap: wrap;
  
  .meta-level {
    padding: 12rpx 32rpx; background: rgba(7,193,96,0.1);
    border-radius: 28rpx; font-size: 48rpx; color: $primary; font-weight: 700;
  }
  .meta-divider { font-size: 42rpx; color: rgba(0,0,0,.1); }
  .meta-rating { font-size: 48rpx; color: #feca57; font-weight: 600; }
  .meta-price { font-size: 48rpx; color: $primary; font-weight: 700; }
}

.info-block { margin-bottom: 40rpx; }
.info-title { display: block; font-size: 56rpx; font-weight: 700; color: $text-main; margin-bottom: 24rpx; }
.info-body { display: block; font-size: 48rpx; color: $text-secondary; line-height: 1.8; }
.skill-tags { display: flex; gap: 16rpx; flex-wrap: wrap; margin-top: 24rpx; }
.skill-tag { padding: 14rpx 32rpx; background: rgba(7,193,96,0.08); color: $primary; border-radius: 24rpx; font-size: 42rpx; font-weight: 600; }

.duration-row { display: flex; gap: 24rpx;
  .dur-chip { flex: 1; text-align: center; padding: 32rpx 20rpx; border-radius: 32rpx; background: $bg-light; border: 2rpx solid rgba(0,0,0,.06); transition: all .3s; min-height: 140rpx; display: flex; flex-direction: column; justify-content: center;
    &.active { background: rgba(7,193,96,0.08); border-color: $primary; }
  }
  .dur-label { display: block; font-size: 52rpx; font-weight: 700; color: $text-main; }
  .dur-price { display: block; font-size: 44rpx; color: $primary; margin-top: 12rpx; font-weight: 600; }
}

.service-item { display: flex; align-items: center; gap: 28rpx; padding: 32rpx; margin-bottom: 20rpx; background: $bg-light; border-radius: 36rpx; }
.si-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: $bg-light; display: flex; align-items: center; justify-content: center;
  image { width: 100%; height: 100%; object-fit: cover; }
  text { font-size: 72rpx; }
}
.si-info { flex: 1; min-width: 0; }
.si-name { font-size: 52rpx; font-weight: 700; color: $text-main; display: block; }
.si-meta { display: flex; align-items: center; gap: 20rpx; margin-top: 10rpx; }
.si-rate { font-size: 44rpx; color: $primary; font-weight: 600; }
.si-status { font-size: 40rpx; padding: 8rpx 20rpx; border-radius: 18rpx; font-weight: 600;
  &.pending { background: rgba(245,158,11,.1); color: #f59e0b; }
  &.processing { background: rgba(59,130,246,.1); color: #3b82f6; }
  &.serving { background: rgba(7,193,96,.1); color: $primary; }
  &.completed { background: rgba(0,0,0,.04); color: $text-secondary; }
}
.si-duration { display: block; font-size: 44rpx; color: $text-secondary; margin-top: 8rpx; font-family: 'Courier New', monospace; }
.si-actions { display: flex; gap: 16rpx; flex-shrink: 0; flex-direction: column; }
.si-btn { padding: 20rpx 32rpx; border-radius: 24rpx; font-size: 40rpx; font-weight: 700; transition: all .2s; min-width: 120rpx; text-align: center;
  &:active { transform: scale(.95); }
  &.start { background: linear-gradient(135deg, $primary, $primary-dark); color: #fff; box-shadow: 0 8rpx 28rpx rgba(7,193,96,.3); }
  &.end { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 8rpx 28rpx rgba(239,68,68,.3); }
  &.cancel { background: rgba(0,0,0,.04); color: $text-secondary; }
}

.loading-state { text-align: center; padding: 160rpx 0; }
.loading-icon { font-size: 128rpx; display: block; margin-bottom: 32rpx; }
.loading-text { font-size: 52rpx; color: $text-secondary; }
</style>