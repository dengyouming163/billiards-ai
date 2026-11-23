<template>
  <view class="overlay" v-if="visible" @click.self="close">
    <view class="selector-popup">
      <view class="popup-header">
        <text class="popup-title">选择商品</text>
        <view class="popup-close" @click="close" v-html="Icons.x" />
      </view>
      <view class="search-box">
        <input class="search-input" v-model="keyword" placeholder="搜索商品名称" @confirm="doSearch" />
        <text class="search-btn" @click="doSearch">搜索</text>
      </view>
      <scroll-view scroll-y class="product-list">
        <view v-for="p in filteredList" :key="p.id" class="product-item" @click="select(p)">
          <view class="product-left">
            <text class="product-name">{{ p.name || p.item_name }}</text>
            <text class="product-meta">库存 {{ p.stock ?? '-' }}</text>
          </view>
          <view class="product-right">
            <text class="product-price">¥{{ p.price || p.sale_price || p.unit_price }}</text>
            <view class="qty-ctrl" @click.stop>
              <text class="qty-btn" @click="changeQty(p, -1)">−</text>
              <text class="qty-val">{{ getQty(p) }}</text>
              <text class="qty-btn" @click="changeQty(p, 1)">+</text>
            </view>
          </view>
        </view>
        <view class="empty" v-if="!filteredList.length && loaded">
          <text>{{ keyword ? '暂无匹配商品' : '暂无商品' }}</text>
        </view>
        <view class="empty" v-if="!loaded">
          <text>加载中...</text>
        </view>
      </scroll-view>
      <view class="confirm-bar" v-if="selectedCount > 0">
        <text class="confirm-info">已选 {{ selectedCount }} 件</text>
        <text class="confirm-btn" @click="confirmSelection">确认添加</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getProductList } from '@/api/modules/table'
import { Icons } from '@/utils/icons'

interface ProductOption {
  id: string
  name?: string
  item_name?: string
  price?: number
  sale_price?: number
  unit_price?: number
  stock?: number
}

interface SelectedItem {
  product_id: string
  name: string
  quantity: number
}

const emit = defineEmits<{
  (e: 'select', items: SelectedItem[]): void
}>()

const visible = ref(false)
const keyword = ref('')
const products = ref<ProductOption[]>([])
const loaded = ref(false)
const cart = ref<Record<string, number>>({})

const filteredList = computed(() => {
  if (!keyword.value.trim()) return products.value
  const kw = keyword.value.toLowerCase()
  return products.value.filter((p) =>
    (p.name || p.item_name || '').toLowerCase().includes(kw)
  )
})

const selectedCount = computed(() =>
  Object.values(cart.value).reduce((a, b) => a + b, 0)
)

function getQty(p: ProductOption): number {
  return cart.value[p.id] || 0
}

function changeQty(p: ProductOption, delta: number) {
  const cur = cart.value[p.id] || 0
  const next = Math.max(0, cur + delta)
  if (next === 0) {
    delete cart.value[p.id]
  } else {
    cart.value[p.id] = next
  }
}

function doSearch() {
  loaded.value = false
  getProductList(keyword.value.trim() ? { keyword: keyword.value.trim() } : {})
    .then((res) => {
      const data = (res as unknown as { data?: ProductOption[] })?.data
        || (res as unknown as ProductOption[])
      products.value = Array.isArray(data) ? data : []
    })
    .catch(() => {
      products.value = []
    })
    .finally(() => {
      loaded.value = true
    })
}

function open() {
  keyword.value = ''
  cart.value = {}
  loaded.value = false
  visible.value = true
  doSearch()
}

function close() {
  visible.value = false
}

function select(p: ProductOption) {
  changeQty(p, 1)
}

function confirmSelection() {
  const items: SelectedItem[] = Object.entries(cart.value)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const p = products.value.find((x) => x.id === id)
      return {
        product_id: id,
        name: p?.name || p?.item_name || '',
        quantity: qty,
      }
    })
  if (items.length > 0) {
    emit('select', items)
  }
  close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .4);
  z-index: 300;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.selector-popup {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.popup-close {
  width: 32rpx;
  height: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
}

.search-box {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.search-input {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.search-btn {
  padding: 16rpx 24rpx;
  background: #059669;
  color: #fff;
  border-radius: 12rpx;
  font-size: 24rpx;
}

.product-list {
  flex: 1;
  overflow: hidden;
  max-height: 50vh;
}

.product-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f4f4f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  flex: 1;
}

.product-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2937;
}

.product-meta {
  font-size: 22rpx;
  color: #9ca3af;
}

.product-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.product-price {
  font-size: 28rpx;
  font-weight: 700;
  color: #ef4444;
}

.qty-ctrl {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.qty-btn {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 8rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #374151;
}

.qty-val {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2937;
  min-width: 40rpx;
  text-align: center;
}

.confirm-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f3f4f6;
  margin-top: 16rpx;
}

.confirm-info {
  font-size: 26rpx;
  color: #6b7280;
}

.confirm-btn {
  padding: 0 40rpx;
  background: #059669;
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
  height: 48rpx;
  line-height: 48rpx;
}

.empty {
  padding: 40rpx;
  text-align: center;
  color: #9ca3af;
  font-size: 26rpx;
}
</style>
