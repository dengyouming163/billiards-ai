<template>
  <view class="container">
    <view class="sticky-header">
      <view class="header-card">
        <view class="header-row">
          <view class="header-left">
          <view class="header-icon-wrap">
            <view class="icon-glow"></view>
            <view class="icon-ring"></view>
          </view>
          <view class="header-title-wrap">
            <text class="header-title">商品点单</text>
            <text class="header-count">{{ products.length }}件</text>
          </view>
        </view>
          
          <view class="header-right">
            <view v-if="!orderStatus" class="status-tag empty" @click="goToHome">
              <text>还未开台</text>
            </view>
            <view v-else class="status-tag active" @click="showOrderDetailModal = true">
              <text>{{ orderStatus.tableNumber }}台 · {{ orderStatus.duration }}</text>
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
          <input
            class="search-input"
            v-model="searchKeyword"
            placeholder="搜索商品..."
          />
          <view class="clear-btn" v-if="searchKeyword" @click="clearSearch">✕</view>
        </view>
      </view>

      <scroll-view class="category-scroll" scroll-x enhanced :show-scrollbar="false">
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
    </view>

    

  <view class="loading-overlay" v-if="isLoading">
    <Skeleton :card-count="4" :show-list="true" />
  </view>
  
  <scroll-view class="product-list" scroll-y>
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
              <view class="image-glow-full" :class="product.tag"></view>
              <view class="product-badge-full" :class="product.tag" v-if="product.tag">{{ getTagLabel(product.tag) }}</view>
            </view>
            <view class="product-overlay">
              <view class="overlay-gradient"></view>
              <view class="overlay-content">
                <text class="product-name">{{ product.name }}</text>
                <view class="product-price-row">
                  <view class="price-wrap">
                    <text class="price-symbol">¥</text>
                    <text class="price-value">{{ product.price }}</text>
                    <text class="price-unit">/{{ product.unit }}</text>
                  </view>
                  <view class="add-btn" @click.stop="addToCart(product)">
                    <view class="add-btn-glow"></view>
                    <text>+</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
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
      <view class="cart-detail-btn" @click.stop="showCartModal = true" >
        <text>查看详情</text>
      </view>
    </view>

    <!-- 购物车弹窗 — 内容可滚动 + 操作栏固定底部 -->
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

    <!-- 商品详情弹窗 — 图片/信息可滚动 + 操作栏固定底部 -->
    <ContentModal
      :visible="!!selectedProduct"
      :title="selectedProduct?.name || '商品详情'"
      :show-footer="false"
      @close="closeProductDetail"
    >

        <view class="detail-wrap" v-if="selectedProduct">
          <scroll-view class="detail-scroll" scroll-y>
            <!-- 商品大图 -->
            <view class="detail-image-wrap">
              <image v-if="selectedProduct.image" class="detail-img" :src="selectedProduct.image" mode="aspectFill" />
              <text v-else class="detail-emoji-big">{{ selectedProduct.emoji || '📦' }}</text>
              <view class="detail-tag" :class="selectedProduct.tag" v-if="selectedProduct.tag">{{ getTagLabel(selectedProduct.tag) }}</view>
            </view>

            <!-- 信息区 -->
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

          <!-- 固定底部操作栏 — 不随滚动，始终可见 -->
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

const tab = useTabState('product')

const {
  isCallingWaiter, showCancelWaiterModal,
  callWaiter, cancelWaiterCall, dispose: disposeServiceCall,
} = useServiceCall()

const cartItems = computed(() => cartStore.cartItems.value)
const cartCount = computed(() => cartStore.cartCount)
const cartTotal = computed(() => cartStore.cartTotal)
const isOrderActive = computed(() => orderStore.isOrderActive)

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
const preorderTotalItems = computed(() => {
  return preOrderGroups.value.reduce((sum: number, g: any) => sum + (g.item_count || 0), 0)
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

// 标准化 API 返回值：request.ts 已将 {code,data} 解包为 data，
// 但后端可能还有一层 {code,data:{list:[...]}} 的嵌套，这里统一处理。
function normalizeArrayResponse(raw: any): any[] | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw
  // 兼容嵌套结构：{ data: [...] } 或 { list: [...] } 或 { data: { list: [...] } }
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

// handleSearch removed — search is handled reactively by productSections computed

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

function showCart() {
  showCartModal.value = true
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

async function handleRejectPreOrder(preorderGroupId: string) {
  try {
    await tabletApi.rejectPreOrder({ preorder_group_id: preorderGroupId })
    uni.showToast({ title: '已取消预订单' })
    loadPreOrders()
  } catch (e) {
    console.error('[商品页] 取消预订单失败:', e)
    uni.showToast({ title: '取消失败', icon: 'none' })
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
  // 第一步：加载商品和分类（互不依赖，可并行）
  const [catOk, prodOk] = await Promise.all([
    loadCategories().then(() => true).catch(() => false),
    loadProducts().then(() => true).catch(() => false),
  ])
  if (!catOk || !prodOk) {
    console.warn('[商品页] 分类或商品加载失败', { catOk, prodOk })
  }

  // 第二步：加载订单状态（后续步骤依赖 orderId）
  await loadOrderStatus()

  // 第三步：加载预订单（依赖 orderStore.orderId，必须在 loadOrderStatus 之后）
  await loadPreOrders()

  // WebSocket 连接（不阻塞 UI）
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

  timer = setInterval(() => {
    try { loadOrderStatus() } catch (e) { console.error('[商品页] 轮询loadOrderStatus失败:', e) }
    try { loadPreOrders() } catch (e) { console.error('[商品页] 轮询loadPreOrders失败:', e) }
  }, 30000)
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
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
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
@use '@/styles/layout-system.scss';

/* 背景动画效果 */
.container {
  padding: 0;
  min-height: 100vh;
  padding-bottom: 200rpx;
  background: linear-gradient(180deg, #0f0f16 0%, #12121a 30%, #1a1a2e 70%, #0f0f16 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 20% 20%, rgba(201, 169, 98, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%);
    pointer-events: none;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background: rgba(15, 15, 22, 0.95);
  padding: 48rpx;
}

.sticky-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 28rpx 40rpx;
  background: linear-gradient(180deg, rgba(15, 15, 22, 0.98) 0%, rgba(15, 15, 22, 0.95) 100%);
  backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba(201, 169, 98, 0.1);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.4);
  animation: slideDown 0.5s ease-out;

  &::after {
    content: '';
    position: absolute;
    bottom: -2rpx;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(201, 169, 98, 0.3), transparent);
  }

  .header-card {
    background: linear-gradient(145deg, rgba(26, 26, 46, 0.9), rgba(20, 20, 40, 0.95));
    border-radius: 48rpx;
    padding: 40rpx 48rpx;
    margin-bottom: 32rpx;
    border: 3rpx solid rgba(201, 169, 98, 0.15);
    box-shadow: 
      0 12rpx 48rpx rgba(0, 0, 0, 0.35),
      0 0 40rpx rgba(201, 169, 98, 0.08),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20rpx);
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
    background: radial-gradient(circle, rgba(201, 169, 98, 0.4) 0%, transparent 70%);
    border-radius: 50%;
    animation: iconPulse 3s ease-in-out infinite;
  }

  .icon-ring {
    position: relative;
    width: 40rpx;
    height: 40rpx;
    border: 4rpx solid #c9a962;
    border-radius: 50%;
    box-shadow: 
      0 0 20rpx rgba(201, 169, 98, 0.8),
      inset 0 0 10rpx rgba(201, 169, 98, 0.4);
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
    color: rgba(255, 255, 255, 0.5);
    padding: 6rpx 20rpx;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 32rpx;
    border: 2rpx solid rgba(255, 255, 255, 0.1);
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
      background: rgba(255, 255, 255, 0.08);
      border: 2rpx solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.5);
    }

    &.active {
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.25), rgba(201, 169, 98, 0.1));
      border: 2rpx solid rgba(201, 169, 98, 0.45);
      color: #c9a962;
      box-shadow: 
        0 8rpx 24rpx rgba(201, 169, 98, 0.25),
        0 0 30rpx rgba(201, 169, 98, 0.1);
    }

    &:active {
      transform: scale(0.96);
    }
  }

  .search-btn {
    width: 112rpx;
    height: 112rpx;
    background: linear-gradient(145deg, rgba(45, 45, 80, 0.8), rgba(35, 35, 65, 0.9));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3rpx solid rgba(201, 169, 98, 0.25);
    box-shadow: 
      0 10rpx 32rpx rgba(0, 0, 0, 0.35),
      inset 0 2rpx 0 rgba(255, 255, 255, 0.08);
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.94);
      background: linear-gradient(145deg, rgba(201, 169, 98, 0.3), rgba(201, 169, 98, 0.15));
    }

    text {
      font-size: 48rpx;
    }
  }
}

.search-bar {
  margin-bottom: 32rpx;

  .search-box {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 96rpx;
    background: linear-gradient(145deg, rgba(35, 35, 60, 0.9), rgba(25, 25, 50, 0.95));
    border-radius: 48rpx;
    padding: 0 36rpx;
    border: 2rpx solid rgba(201, 169, 98, 0.15);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.25);

    .search-icon {
      font-size: 56rpx;
      margin-right: 24rpx;
      filter: drop-shadow(0 4rpx 12rpx rgba(201, 169, 98, 0.3));
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      height: 100%;
      min-height: 80rpx;
      font-size: 48rpx;
      color: #f1f5f9;
      background: transparent;
      letter-spacing: 1rpx;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .clear-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42rpx;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      border: 2rpx solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
      &:active {
        background: rgba(255, 255, 255, 0.15);
      }
    }
  }
}

.category-scroll {
  white-space: nowrap;
  padding: 28rpx 0;

  .category-item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 96rpx;
    padding: 20rpx 56rpx;
    margin-right: 32rpx;
    background: rgba(35, 35, 60, 0.6);
    border-radius: 48rpx;
    border: 3rpx solid rgba(201, 169, 98, 0.15);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.25), rgba(201, 169, 98, 0.08));
      opacity: 0;
      transform: scaleX(0);
      transform-origin: left;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &::after {
      content: '';
      position: absolute;
      top: -2rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      height: 6rpx;
      background: linear-gradient(90deg, transparent, #c9a962, transparent);
      border-radius: 3rpx;
      opacity: 0;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &.active {
      border-color: rgba(201, 169, 98, 0.6);
      background: rgba(201, 169, 98, 0.2);
      box-shadow: 
        0 8rpx 32rpx rgba(201, 169, 98, 0.3),
        0 0 60rpx rgba(201, 169, 98, 0.15),
        inset 0 0 20rpx rgba(201, 169, 98, 0.05);

      &::before {
        opacity: 1;
        transform: scaleX(1);
      }

      &::after {
        opacity: 1;
        animation: categoryPulse 2s ease-in-out infinite;
      }

      .category-name {
        color: #c9a962;
        text-shadow: 0 0 24rpx rgba(201, 169, 98, 0.6);
      }
    }

    &:active {
      transform: scale(0.96);
    }

    .category-name {
      position: relative;
      z-index: 1;
      font-size: 48rpx;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 700;
      letter-spacing: 2rpx;
      transition: all 0.3s ease;
    }
  }
}

@keyframes categoryPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.product-list {
  min-height: calc(100vh - 500rpx);
  padding-top: 500rpx;
  padding-left: 32rpx;
  padding-right: 32rpx;
  padding-bottom: 400rpx;
}

.product-section {
  margin-bottom: 64rpx;
  padding: 40rpx;
  background: linear-gradient(145deg, rgba(26, 26, 46, 0.6), rgba(22, 22, 42, 0.7));
  border-radius: 48rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.04);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.15);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40rpx;
    
    .section-title-wrap {
      display: flex;
      align-items: center;
      gap: 24rpx;
      
      .section-line {
        width: 16rpx;
        height: 48rpx;
        background: linear-gradient(180deg, #c9a962, #8a6d3b);
        border-radius: 8rpx;
      }
      
      .section-title {
        font-size: 60rpx;
        font-weight: 700;
        color: #fff;
      }
    }
    
    .section-count {
      font-size: 42rpx;
      color: #6b7280;
      padding: 12rpx 28rpx;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 24rpx;
    }
  }
  
  .product-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28rpx;

    .product-card {
      position: relative;
      border-radius: 40rpx;
      overflow: hidden;
      height: 720rpx;
      box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      &:active {
        transform: scale(0.96);
        box-shadow: 0 4rpx 24rpx rgba(201, 169, 98, 0.2);
      }

      .product-image-full {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

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
          font-size: 160rpx;
          background: linear-gradient(145deg, rgba(40, 40, 70, 0.5), rgba(32, 32, 58, 0.6));
        }

        .image-glow-full {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 0.35s;

          &.hot {
            background: radial-gradient(circle at top right, rgba(255, 107, 107, 0.25) 0%, transparent 60%);
          }
          &.recommend {
            background: radial-gradient(circle at top right, rgba(46, 213, 115, 0.25) 0%, transparent 60%);
          }
          &.new {
            background: radial-gradient(circle at top right, rgba(165, 94, 234, 0.25) 0%, transparent 60%);
          }
        }

        .product-badge-full {
          position: absolute;
          top: 24rpx;
          right: 24rpx;
          padding: 12rpx 28rpx;
          border-radius: 24rpx;
          font-size: 36rpx;
          color: #fff;
          font-weight: 700;
          letter-spacing: 2rpx;
          backdrop-filter: blur(10rpx);

          &.hot {
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(238, 90, 90, 0.8));
            box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.4);
          }
          &.recommend {
            background: linear-gradient(135deg, rgba(46, 213, 115, 0.9), rgba(29, 209, 161, 0.8));
            box-shadow: 0 4rpx 16rpx rgba(46, 213, 115, 0.4);
          }
          &.new {
            background: linear-gradient(135deg, rgba(165, 94, 234, 0.9), rgba(136, 84, 208, 0.8));
            box-shadow: 0 4rpx 16rpx rgba(165, 94, 234, 0.4);
          }
        }

        &:active .image-glow-full {
          opacity: 1;
        }
      }

      .product-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        padding: 32rpx;
        z-index: 10;
        display: flex; flex-direction: column; justify-content: flex-end;

        .overlay-gradient {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(0deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,.45) 50%, transparent 100%);
          pointer-events: none;
        }

        .overlay-content {
          position: relative;
          z-index: 1;

          .product-name {
            display: block;
            font-size: 40rpx;
            font-weight: 700;
            color: #fff;
            margin-bottom: 16rpx;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.5);
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
                font-size: 32rpx;
                color: #c9a962;
                font-weight: 600;
              }

              .price-value {
                font-size: 52rpx;
                font-weight: 800;
                color: #c9a962;
                line-height: 1;
                text-shadow: 0 0 20rpx rgba(201, 169, 98, 0.4);
              }

              .price-unit {
                font-size: 28rpx;
                color: #8a8a9a;
              }
            }

            .add-btn {
              position: relative;
              width: 76rpx;
              height: 76rpx;
              background: linear-gradient(135deg, #c9a962, #8a6d3b);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 6rpx 24rpx rgba(201, 169, 98, 0.5);
              transition: all 0.35s;
              flex-shrink: 0;

              .add-btn-glow {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                transform: translate(-50%, -50%);
                background: rgba(201, 169, 98, 0.6);
                border-radius: 50%;
                filter: blur(15rpx);
                opacity: 0;
                transition: opacity 0.3s;
              }

              &:active {
                transform: scale(0.85);

                .add-btn-glow {
                  opacity: 1;
                }
              }

              text {
                position: relative;
                z-index: 1;
                font-size: 64rpx;
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
}


/* ========== 统一弹窗（购物车 / 商品详情 / 预订单） ========== */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(16rpx);
  padding: 40rpx;
}
.modal-card {
  width: 80vw; height: 80vh;
  background: linear-gradient(180deg, #232340 0%, #1a1a30 100%);
  border-radius: 64rpx; padding: 56rpx 56rpx 40rpx;
  border: 4rpx solid rgba(201,169,98,.35);
  box-shadow: 0 40rpx 100rpx rgba(0,0,0,.6), 0 0 80rpx rgba(201,169,98,.15), inset 0 2rpx 0 rgba(255,255,255,.08);
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
  &::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6rpx;
    background: linear-gradient(90deg, transparent, rgba(201,169,98,.8), rgba(201,169,98,.4), transparent);
  }
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 40rpx; padding-bottom: 28rpx;
  border-bottom: 2rpx solid rgba(201,169,98,.2);
  flex-shrink: 0;
}
.modal-title {
  font-size: 78rpx; font-weight: 800; color: #c9a962;
  letter-spacing: 3rpx; text-shadow: 0 0 30rpx rgba(201,169,98,.5);
}
.modal-close {
  width: 72rpx; height: 72rpx;
  background: linear-gradient(135deg, rgba(201,169,98,.15), rgba(201,169,98,.05));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 54rpx; color: #c9a962;
  border: 3rpx solid rgba(201,169,98,.3);
  box-shadow: 0 4rpx 20rpx rgba(201,169,98,.2);
  &:active { transform: scale(.92); }
}
.modal-body {
  flex: 1; overflow-y: auto; margin-bottom: 32rpx;
}
.modal-footer {
  flex-shrink: 0;
  border-top: 2rpx solid rgba(201,169,98,.2);
  padding-top: 28rpx;
  display: flex; flex-direction: column; gap: 20rpx;
}
.footer-summary {
  display: flex; justify-content: space-between; align-items: baseline;
  .footer-summary-label { font-size: 48rpx; color: rgba(255,255,255,.5); }
  .footer-summary-val { font-size: 78rpx; font-weight: 800; color: #feca57; text-shadow: 0 0 20rpx rgba(254,202,87,.5); }
}
.footer-action {
  height: 100rpx; border-radius: 32rpx;
  background: linear-gradient(135deg, #c9a962, #8a6d3b);
  display: flex; align-items: center; justify-content: center;
  font-size: 54rpx; font-weight: 700; color: #1a1a2e;
  box-shadow: 0 12rpx 40rpx rgba(201,169,98,.4);
  &:active { transform: scale(.97); }
  &.secondary { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); box-shadow: none; border: 2rpx solid rgba(255,255,255,.1); }
}

/* ===== 购物车列表项 ===== */
.cart-item {
  display: flex; align-items: center; padding: 36rpx 0;
  border-bottom: 2rpx solid rgba(255,255,255,.06);
  &:last-child { border-bottom: none; }
  .cart-item-image { position: relative; width: 140rpx; height: 140rpx; border-radius: 28rpx; display: flex; align-items: center; justify-content: center; margin-right: 32rpx; overflow: hidden; flex-shrink: 0; }
  .cart-item-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .item-image-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(201,169,98,.2), rgba(138,109,59,.1)); border-radius: 28rpx; }
  .cart-item-emoji { position: relative; z-index: 1; font-size: 96rpx; }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name { display: block; font-size: 48rpx; color: #fff; margin-bottom: 10rpx; font-weight: 600; }
  .cart-item-price { font-size: 42rpx; color: #6b7280; }
  .cart-item-quantity { display: flex; align-items: center; gap: 24rpx; margin-right: 32rpx; flex-shrink: 0;
    .qty-btn { width: 72rpx; height: 72rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .3s;
      &.minus { background: #252542; text { font-size: 56rpx; color: #fff; line-height: 1; } }
      &.plus { background: linear-gradient(135deg, #c9a962, #8a6d3b); text { font-size: 48rpx; color: #fff; line-height: 1; } }
      &:active { transform: scale(0.9); }
    }
    .qty-num { font-size: 56rpx; color: #fff; min-width: 72rpx; text-align: center; font-weight: 600; }
  }
  .cart-item-total { flex-shrink: 0; }
  .cart-item-total text { font-size: 54rpx; font-weight: 700; color: #feca57; }
}

/* ===== 商品详情弹窗 ===== */
.detail-wrap {
  display: flex; flex-direction: column; height: 100%; overflow: hidden;
}
.detail-scroll {
  flex: 1; overflow-y: auto; padding: 0 8rpx 16rpx;
}
.detail-image-wrap {
  position: relative;
  width: 100%; height: 900rpx; border-radius: 40rpx; overflow: hidden; margin-bottom: 36rpx;
  background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6));
  border: 2rpx solid rgba(#c9a962,.2);
  .detail-img { width: 100%; height: 100%; object-fit: cover; }
  .detail-emoji-big { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 240rpx; }
  .detail-tag { position: absolute; top: 28rpx; right: 28rpx; padding: 14rpx 32rpx; border-radius: 28rpx; font-size: 40rpx; font-weight: 700; color: #fff; backdrop-filter: blur(10rpx); z-index: 3;
    &.hot { background: linear-gradient(135deg, rgba(255,107,107,.9), rgba(238,90,90,.8)); box-shadow: 0 4rpx 16rpx rgba(255,107,107,.4); }
    &.recommend { background: linear-gradient(135deg, rgba(46,213,115,.9), rgba(34,197,94,.8)); box-shadow: 0 4rpx 16rpx rgba(46,213,115,.4); }
    &.new { background: linear-gradient(135deg, rgba(165,94,234,.9), rgba(147,51,234,.8)); box-shadow: 0 4rpx 16rpx rgba(165,94,234,.4); }
  }
}
.detail-meta-bar { display: flex; align-items: center; justify-content: center; gap: 16rpx; margin-bottom: 28rpx;
  .meta-price { font-size: 72rpx; font-weight: 800; color: #feca57; text-shadow: 0 0 24rpx rgba(254,202,87,.5); }
  .meta-unit { font-size: 42rpx; color: rgba(255,255,255,.45); }
  .meta-divider { font-size: 36rpx; color: rgba(255,255,255,.2); margin: 0 8rpx; }
  .meta-stock { font-size: 42rpx; color: rgba(74,222,128,.7); font-weight: 600;
    &.soldout { color: #ef4444; }
  }
}
.detail-desc { display: block; text-align: center; font-size: 54rpx; color: #f1f5f9; margin-bottom: 16rpx; line-height: 1.6; padding: 0 16rpx; font-weight: 600; }
.detail-body { display: block; text-align: center; font-size: 45rpx; color: rgba(255,255,255,.5); margin-bottom: 20rpx; line-height: 1.7; padding: 0 16rpx; }

/* 固定底部操作栏 — 不随内容滚动，始终可见 */
.fixed-book-bar {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 28rpx;
  padding: 36rpx 0 0;
  border-top: 2rpx solid rgba(#c9a962,.15);
  .fb-price { font-size: 64rpx; font-weight: 800; color: #feca57; text-shadow: 0 0 24rpx rgba(254,202,87,.5); white-space: nowrap; flex-shrink: 0; }
  .fb-btn { flex: 1; min-height: 120rpx; border-radius: 32rpx; display: flex; align-items: center; justify-content: center; font-size: 56rpx; font-weight: 700; background: linear-gradient(135deg, #c9a962, #8a6d3b); color: #1a1a2e; box-shadow: 0 8rpx 32rpx rgba(#c9a962,.35);
    &:active { transform: scale(.97); }
    &.secondary { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); box-shadow: none; border: 2rpx solid rgba(255,255,255,.1); }
  }
}
.footer-qty { display: flex; align-items: center; gap: 20rpx; flex-shrink: 0;
  .qty-btn { width: 88rpx; height: 88rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all .3s;
    &.minus { background: rgba(255,255,255,.08); text { font-size: 60rpx; color: #fff; line-height: 1; } }
    &.plus { background: linear-gradient(135deg, #c9a962, #8a6d3b); text { font-size: 52rpx; color: #fff; line-height: 1; } }
    &:active { transform: scale(0.9); }
  }
  .qty-num { font-size: 64rpx; color: #fff; min-width: 88rpx; text-align: center; font-weight: 700; }
}

/* ===== 预订单列表 ===== */
.preorder-list { display: flex; flex-direction: column; gap: 28rpx; }
.preorder-group { background: rgba(255,255,255,.04); border-radius: 28rpx; padding: 28rpx; border: 2rpx solid rgba(255,255,255,.06); }
.preorder-group-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx;
  .preorder-group-label { font-size: 45rpx; color: #c9a962; font-weight: 700; }
}
.preorder-item { display: flex; align-items: center; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid rgba(255,255,255,.04);
  &:last-child { border-bottom: none; }
  .preorder-item-thumb { width: 96rpx; height: 96rpx; border-radius: 20rpx; overflow: hidden; flex-shrink: 0; background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6)); display: flex; align-items: center; justify-content: center; }
  .preorder-thumb-img { width: 100%; height: 100%; object-fit: cover; }
  .preorder-item-emoji { font-size: 56rpx; }
  .preorder-item-info { flex: 1; min-width: 0;
    .preorder-item-name { display: block; font-size: 45rpx; color: #fff; font-weight: 600; margin-bottom: 6rpx; }
    .preorder-item-price { font-size: 39rpx; color: rgba(255,255,255,.4); }
  }
  .preorder-item-qty { font-size: 42rpx; color: rgba(255,255,255,.5); }
  .preorder-item-total { font-size: 48rpx; color: #feca57; font-weight: 600; white-space: nowrap; }
  .preorder-item-cancel { padding: 12rpx 24rpx; border-radius: 16rpx; font-size: 36rpx; font-weight: 600; color: #ef4444; background: rgba(239,68,68,.1); border: 2rpx solid rgba(239,68,68,.2); flex-shrink: 0; min-height: 64rpx; display: flex; align-items: center; justify-content: center; &:active { background: rgba(239,68,68,.2); } }
}
.preorder-group-total { text-align: right; font-size: 45rpx; color: #feca57; font-weight: 600; padding-top: 16rpx; margin-top: 12rpx; border-top: 1rpx solid rgba(201,169,98,.1); }

.modal-empty { text-align: center; padding: 80rpx 0;
  .modal-empty-icon { font-size: 140rpx; display: block; margin-bottom: 24rpx; }
  .modal-empty-text { font-size: 48rpx; color: rgba(255,255,255,.4); }
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
  min-height: 160rpx;
  background: linear-gradient(145deg, rgba(30, 30, 52, 0.95), rgba(24, 24, 44, 0.98));
  border-radius: 48rpx;
  padding: 32rpx 48rpx;
  border: 3rpx solid rgba(201, 169, 98, 0.2);
  box-shadow:
    0 16rpx 60rpx rgba(0, 0, 0, 0.5),
    0 0 60rpx rgba(201, 169, 98, 0.1),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20rpx);

  .cart-info {
    display: flex;
    align-items: center;
    gap: 36rpx;

    .cart-icon-wrap {
      position: relative;

      .cart-icon {
        font-size: 112rpx;
        filter: drop-shadow(0 4rpx 16rpx rgba(201, 169, 98, 0.4));
      }

      .cart-count {
        position: absolute;
        top: -12rpx;
        right: -20rpx;
        min-width: 60rpx;
        height: 60rpx;
        background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
        border-radius: 30rpx;
        font-size: 42rpx;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 16rpx;
        box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.5);
        font-weight: 700;
      }
    }

    .cart-summary {
      .cart-total {
        display: block;
        font-size: 72rpx;
        font-weight: 800;
        color: #c9a962;
        text-shadow: 0 0 28rpx rgba(201, 169, 98, 0.5);
        line-height: 1.2;
      }

      .cart-count-text {
        font-size: 39rpx;
        color: #6b7280;
        margin-top: 6rpx;
      }
    }
  }

  .cart-detail-btn {
    min-height: 96rpx;
    padding: 0 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(139, 92, 246, 0.1));
    border-radius: 32rpx;
    border: 3rpx solid rgba(139, 92, 246, 0.35);
    transition: all 0.3s;

    &:active {
      transform: scale(0.94);
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(139, 92, 246, 0.2));
    }

    text {
      font-size: 48rpx;
      font-weight: 600;
      color: #a78bfa;
    }
  }
}
.order-status-stats {
  display: flex;
  gap: 12rpx;
  
  .status-tag {
    padding: 8rpx 16rpx;
    border-radius: 12rpx;
    font-size: 33rpx;
    
    &.pending {
      background: rgba(245, 158, 11, 0.2);
      color: #f59e0b;
    }
    
    &.processing {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }
    
    &.delivered {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
    }
  }
}

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

</style>