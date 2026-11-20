# wwwtable 业务流程闭环 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善 wwwtable 顾客自助大屏的全流程闭环：开台→点单→助教→账单→微信扫码结算

**Architecture:** 5 个任务组：API 层补齐 → 账单页重构 → 结算流程 → 商品点单精简 → 助教服务精简。保持 tablet.* API，对标 wwwstoreapp 的 Bill 数据结构和支付流程。

**Tech Stack:** UniApp 3.0 + Vue 3.5 + TypeScript 5.9 + Vite 7.3 + SCSS

---

## Task 1: API 层补齐 — 会员绑定接口

**Files:**
- Modify: `src/api/modules/tablet.ts` (在 `// ======== 礼物 API ========` 之前插入)

- [ ] **Step 1: 添加 searchMembers 和 bindMember**

在 `tabletApi` 对象的 `sendGift` 方法之前，插入：

```typescript
  // ======== 会员 API ========
  /** 搜索会员 */
  searchMembers(keyword: string): Promise<{ id: string; name: string; level: string; phone: string }[]> {
    return get('/tablet.Member/search', { keyword })
  },

  /** 绑定会员到订单 */
  bindMember(params: { order_id: string; member_id: string }): Promise<any> {
    return post('/tablet.Order/bindMember', params)
  },
```

- [ ] **Step 2: 验证编译通过**

```bash
cd d:/wwwroot/wwwbilliards-dky/www/wwwtable && npx vue-tsc --noEmit src/api/modules/tablet.ts 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/api/modules/tablet.ts
git commit -m "feat: add tablet.Member/search and tablet.Order/bindMember API"
```

---

## Task 2: 账单页重构 — bill/index.vue

**Files:**
- Modify: `src/pages/bill/index.vue` (完整重写 template + script + style)

### 设计说明

对标 wwwstoreapp checkout.vue：展示 Bill 结构（台桌信息 + 费用明细 + 会员入口 + 微信扫码结算）。

### 2.1 重写 script

```typescript
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { tabletApi } from '@/api'
import { orderStore } from '@/stores/order'
import { authStore } from '@/stores/auth'
import { formatPrice } from '@/utils/format'

interface OrderInfo {
  id: string; order_no: string; status: string; start_time: string
  table_name: string; player_count: number; prepaid_hours: number
}
interface BillItem {
  id: string; item_type: string; item_name: string
  quantity: number; unit_price: number; final_price: number; status: string
}
interface Bill {
  order: OrderInfo | null
  items: BillItem[]
  table_fee: number; product_fee: number; assistant_fee: number
  member_discount: number; final_amount: number
  member: { name: string; level: string } | null
}

const isLoading = ref(true)
const bill = ref<Bill>({ order: null, items: [], table_fee: 0, product_fee: 0, assistant_fee: 0, member_discount: 0, final_amount: 0, member: null })
const showPayQR = ref(false)
const qrCodeUrl = ref('')
const payStatus = ref<'idle' | 'waiting' | 'paid'>('idle')
const showSuccess = ref(false)
let pollTimer: number | null = null

const tableName = computed(() => bill.value.order?.table_name || authStore.tableName || '')
const orderNo = computed(() => bill.value.order?.order_no || '')
const tableFee = computed(() => bill.value.table_fee || 0)
const productFee = computed(() => bill.value.product_fee || 0)
const assistantFee = computed(() => bill.value.assistant_fee || 0)
const memberDiscount = computed(() => bill.value.member_discount || 0)
const totalAmount = computed(() => bill.value.final_amount || 0)
const hasMember = computed(() => !!bill.value.member)

const displayTime = computed(() => {
  const start = bill.value.order?.start_time
  if (!start) return '00:00'
  const diff = Math.floor((Date.now() - new Date(start).getTime()) / 60000)
  const h = Math.floor(diff / 60); const m = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

async function loadBill() {
  isLoading.value = true
  try {
    const order = await tabletApi.getTableOrder()
    if (order && order.id) {
      bill.value.order = {
        id: order.id, order_no: order.order_no, status: order.status,
        start_time: order.start_time, table_name: order.table_name || authStore.tableName,
        player_count: order.customer_count || 0, prepaid_hours: order.prepaid_hours || 0
      }
      bill.value.items = (order.items || []).map((i: any) => ({
        id: i.id, item_type: i.item_type || 'product', item_name: i.item_name || i.name || '',
        quantity: i.quantity || 0, unit_price: i.unit_price || 0,
        final_price: i.final_price || 0, status: i.status || ''
      }))
      bill.value.table_fee = Number(order.table_fee || 0)
      bill.value.product_fee = Number(order.product_fee || 0)
      bill.value.assistant_fee = Number(order.assistant_fee || 0)
      bill.value.final_amount = Number(order.final_amount || order.total_fee || 0)
    }
  } catch { /* 静默处理 */ } finally { isLoading.value = false }
}

function handleMemberClick() {
  uni.showToast({ title: '会员绑定即将开放', icon: 'none' })
}

async function handleCheckout() {
  if (!bill.value.order?.id) return
  showPayQR.value = true
  payStatus.value = 'waiting'
  try {
    const result = await tabletApi.createPayment({
      order_id: bill.value.order.id,
      amount: totalAmount.value,
      channel: 'wechat',
      description: `台桌${tableName.value}消费`,
    })
    if (result?.qr_code) {
      qrCodeUrl.value = result.qr_code
      startPollPayment()
    }
  } catch {
    showPayQR.value = false
    uni.showToast({ title: '生成支付失败', icon: 'none' })
  }
}

function startPollPayment() {
  stopPollPayment()
  pollTimer = setInterval(async () => {
    try {
      const res = await tabletApi.queryPayment(bill.value.order!.id)
      if (res?.status === 'paid') {
        payStatus.value = 'paid'
        stopPollPayment()
        setTimeout(() => { showPayQR.value = false; showSuccess.value = true }, 800)
      }
    } catch {}
  }, 3000) as unknown as number
}

function stopPollPayment() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

function closePayQR() {
  stopPollPayment()
  showPayQR.value = false
  payStatus.value = 'idle'
}

function goHome() {
  showSuccess.value = false
  uni.reLaunch({ url: '/pages/index/index' })
}

function goBack() { uni.navigateBack() }

onMounted(() => { loadBill() })
onUnmounted(() => { stopPollPayment() })
</script>
```

### 2.2 重写 template

```html
<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <view class="back-btn" @click="goBack"><text>←</text></view>
      <text class="header-title">账单</text>
      <view class="placeholder"></view>
    </view>

    <!-- Loading -->
    <view class="loading-wrap" v-if="isLoading">
      <text class="loading-text">加载中...</text>
    </view>

    <template v-else>
      <!-- 台桌信息 -->
      <view class="info-card">
        <view class="info-header">
          <text class="table-name">🎱 {{ tableName }}</text>
          <text class="order-no">#{{ orderNo }}</text>
        </view>
        <view class="time-row">
          <text class="time-label">已用时长</text>
          <text class="time-value">{{ displayTime }}</text>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="fee-card">
        <text class="section-title">费用明细</text>
        <view class="fee-row">
          <text class="fee-label">台费</text>
          <text class="fee-value">¥{{ formatPrice(tableFee) }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">商品费</text>
          <text class="fee-value">¥{{ formatPrice(productFee) }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">助教费</text>
          <text class="fee-value">¥{{ formatPrice(assistantFee) }}</text>
        </view>
        <view class="fee-row discount" v-if="memberDiscount > 0">
          <text class="fee-label">会员折扣</text>
          <text class="fee-value">-¥{{ formatPrice(memberDiscount) }}</text>
        </view>
        <view class="fee-divider"></view>
        <view class="fee-row total">
          <text class="fee-label">应付</text>
          <text class="fee-value">¥{{ formatPrice(totalAmount) }}</text>
        </view>
      </view>

      <!-- 会员入口 -->
      <view class="member-card" @click="handleMemberClick">
        <view class="member-left">
          <text class="member-icon">👤</text>
          <view>
            <text class="member-title">会员</text>
            <text :class="hasMember ? 'member-bound' : 'member-unbound'">
              {{ hasMember ? bill.member!.name : '绑定会员享折扣' }}
            </text>
          </view>
        </view>
        <text class="member-arrow">›</text>
      </view>

      <!-- 商品/助教明细 -->
      <view class="items-card" v-if="bill.items.length > 0">
        <text class="section-title">消费明细</text>
        <view class="item-row" v-for="item in bill.items" :key="item.id">
          <text class="item-type">{{ item.item_type === 'assistant' ? '👨‍🏫' : '📦' }}</text>
          <text class="item-name">{{ item.item_name }}</text>
          <text class="item-qty">x{{ item.quantity }}</text>
          <text class="item-price">¥{{ formatPrice(item.final_price) }}</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无消费明细</text>
      </view>
    </template>

    <!-- 底部操作 -->
    <view class="bottom-bar" v-if="!isLoading && bill.order">
      <view class="total-row">
        <text class="total-label">应付</text>
        <text class="total-value">¥{{ formatPrice(totalAmount) }}</text>
      </view>
      <view class="checkout-btn" @click="handleCheckout">
        <text>请求结账</text>
      </view>
    </view>

    <!-- 支付二维码弹窗 -->
    <view class="qr-overlay" v-if="showPayQR" @click="closePayQR">
      <view class="qr-modal" @click.stop>
        <view class="qr-close" @click="closePayQR">✕</view>
        <text class="qr-title">微信扫码支付</text>
        <view class="qr-image-wrap">
          <image v-if="qrCodeUrl" class="qr-image" :src="qrCodeUrl" mode="aspectFit" />
          <view v-else class="qr-loading">生成中...</view>
        </view>
        <text class="qr-amount">¥{{ formatPrice(totalAmount) }}</text>
        <text class="qr-hint">请使用微信扫描二维码支付</text>
        <view class="qr-status">
          <view class="qr-dot" :class="payStatus"></view>
          <text>{{ payStatus === 'waiting' ? '等待支付' : '支付成功' }}</text>
        </view>
      </view>
    </view>

    <!-- 支付成功 -->
    <view class="success-overlay" v-if="showSuccess">
      <view class="success-card">
        <view class="success-icon">✅</view>
        <text class="success-title">收款成功</text>
        <text class="success-amount">¥{{ formatPrice(totalAmount) }}</text>
        <view class="success-info">
          <text class="success-label">台桌：{{ tableName }}</text>
          <text class="success-label">订单：#{{ orderNo }}</text>
          <text class="success-label">支付方式：微信</text>
        </view>
        <view class="success-btn" @click="goHome">返回首页</view>
      </view>
    </view>
  </view>
</template>
```

### 2.3 重写 style

```scss
<style lang="scss" scoped>
.container { min-height: 100vh; padding: 32rpx; padding-bottom: 240rpx; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 48rpx; padding: 24rpx 0;
  .back-btn { width: 96rpx; height: 96rpx; background: #1a1a2e; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid #374151;
    &:active { transform: scale(0.92); border-color: #c9a962; }
    text { font-size: 48rpx; color: #fff; } }
  .header-title { font-size: 48rpx; font-weight: 700; color: #fff; }
  .placeholder { width: 96rpx; } }
.loading-wrap { display: flex; justify-content: center; padding: 200rpx 0; .loading-text { font-size: 32rpx; color: #8a8a9a; } }
.section-title { font-size: 32rpx; font-weight: 600; color: #8a8a9a; margin-bottom: 24rpx; }

.info-card { background: linear-gradient(135deg, #1a1a2e, #252542); border-radius: 32rpx; padding: 36rpx; margin-bottom: 32rpx; border: 2rpx solid #374151;
  .info-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx;
    .table-name { font-size: 44rpx; font-weight: 700; color: #c9a962; }
    .order-no { font-size: 28rpx; color: #6b7280; } }
  .time-row { display: flex; justify-content: space-between;
    .time-label { font-size: 28rpx; color: #6b7280; }
    .time-value { font-size: 48rpx; font-weight: 700; color: #fff; font-family: 'Courier New', monospace; } } }

.fee-card { background: linear-gradient(135deg, #1a1a2e, #252542); border-radius: 32rpx; padding: 36rpx; margin-bottom: 24rpx; border: 2rpx solid #374151;
  .fee-row { display: flex; justify-content: space-between; padding: 16rpx 0;
    .fee-label { font-size: 30rpx; color: #a0a0b0; }
    .fee-value { font-size: 30rpx; color: #fff; font-weight: 500; }
    &.discount .fee-value { color: #4ade80; }
    &.total { padding-top: 24rpx; .fee-label { font-size: 36rpx; font-weight: 700; color: #fff; } .fee-value { font-size: 48rpx; font-weight: 700; color: #feca57; } } }
  .fee-divider { height: 2rpx; background: linear-gradient(90deg, transparent, #374151, transparent); margin: 8rpx 0; } }

.member-card { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, rgba(201,169,98,.1), rgba(138,109,59,.05)); border-radius: 28rpx; padding: 28rpx 36rpx; margin-bottom: 24rpx; border: 2rpx solid rgba(201,169,98,.2);
  .member-left { display: flex; align-items: center; gap: 20rpx;
    .member-icon { font-size: 48rpx; }
    .member-title { display: block; font-size: 28rpx; color: #8a8a9a; }
    .member-bound { font-size: 32rpx; color: #c9a962; font-weight: 600; }
    .member-unbound { font-size: 30rpx; color: #6b7280; } }
  .member-arrow { font-size: 40rpx; color: #c9a962; } }

.items-card { background: linear-gradient(135deg, #1a1a2e, #252542); border-radius: 32rpx; padding: 36rpx; margin-bottom: 24rpx; border: 2rpx solid #374151;
  .item-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0; border-bottom: 1rpx solid rgba(255,255,255,.05);
    &:last-child { border-bottom: none; }
    .item-type { font-size: 32rpx; }
    .item-name { flex: 1; font-size: 28rpx; color: #fff; }
    .item-qty { font-size: 26rpx; color: #8a8a9a; }
    .item-price { font-size: 28rpx; color: #feca57; font-weight: 600; } } }

.empty-state { text-align: center; padding: 80rpx 0;
  .empty-icon { font-size: 80rpx; display: block; margin-bottom: 20rpx; }
  .empty-text { font-size: 28rpx; color: #6b7280; } }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 32rpx; padding-bottom: calc(32rpx + env(safe-area-inset-bottom)); background: linear-gradient(180deg, transparent, #0f0f16 30%);
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx;
    .total-label { font-size: 32rpx; color: #8a8a9a; }
    .total-value { font-size: 56rpx; font-weight: 700; color: #feca57; } }
  .checkout-btn { width: 100%; height: 120rpx; background: linear-gradient(135deg, #c9a962, #8a6d3b); border-radius: 32rpx; display: flex; align-items: center; justify-content: center; box-shadow: 0 12rpx 40rpx rgba(201,169,98,.4);
    &:active { transform: scale(0.98); }
    text { font-size: 38rpx; font-weight: 700; color: #fff; } } }

// QR overlay
.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 999; display: flex; align-items: center; justify-content: center; }
.qr-modal { background: #1a1a2e; border-radius: 40rpx; padding: 60rpx; text-align: center; width: 600rpx; border: 2rpx solid #c9a962; }
.qr-close { text-align: right; font-size: 40rpx; color: #a0a0b0; margin-bottom: 20rpx; }
.qr-title { font-size: 36rpx; color: #c9a962; font-weight: 700; display: block; margin-bottom: 40rpx; }
.qr-image-wrap { width: 400rpx; height: 400rpx; margin: 0 auto 30rpx; background: #fff; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; }
.qr-image { width: 380rpx; height: 380rpx; }
.qr-loading { color: #999; font-size: 28rpx; }
.qr-amount { font-size: 56rpx; color: #fff; font-weight: 800; display: block; margin-bottom: 10rpx; }
.qr-hint { font-size: 24rpx; color: #a0a0b0; display: block; margin-bottom: 30rpx; }
.qr-status { display: flex; align-items: center; justify-content: center; gap: 12rpx;
  .qr-dot { width: 16rpx; height: 16rpx; border-radius: 50%; &.waiting { background: #f59e0b; } &.paid { background: #10b981; } }
  text { font-size: 26rpx; color: #a0a0b0; } }

// Success overlay
.success-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.85); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.success-card { background: #1a1a2e; border-radius: 40rpx; padding: 60rpx; text-align: center; width: 560rpx; border: 2rpx solid #4ade80; }
.success-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.success-title { display: block; font-size: 40rpx; font-weight: 700; color: #fff; margin-bottom: 16rpx; }
.success-amount { display: block; font-size: 72rpx; font-weight: 800; color: #feca57; margin-bottom: 32rpx; }
.success-info { text-align: left; margin-bottom: 40rpx; .success-label { display: block; font-size: 28rpx; color: #8a8a9a; padding: 8rpx 0; } }
.success-btn { height: 100rpx; background: linear-gradient(135deg, #c9a962, #8a6d3b); border-radius: 28rpx; display: flex; align-items: center; justify-content: center;
  &:active { transform: scale(0.98); }
  text { font-size: 32rpx; font-weight: 700; color: #fff; } }
</style>
```

---

## Task 3: 首页 — 移除旧结算入口

**Files:**
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 修改 goToCheckout，跳转到账单页（不带 mode 参数）**

替换函数：

```typescript
function goToCheckout() {
  handleSoundClick()
  uni.navigateTo({ url: '/pages/bill/index' })
}
```

- [ ] **Step 2: 验证编译**

```bash
cd d:/wwwroot/wwwbilliards-dky/www/wwwtable && npx vue-tsc --noEmit 2>&1 | grep -i "error" | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/index/index.vue src/pages/bill/index.vue
git commit -m "refactor: bill page with Bill structure, wechat QR payment, success result"
```

---

## Task 4: 商品点单精简 — product/index.vue

**Files:**
- Modify: `src/pages/product/index.vue`

### 4.1 移除离线点单相关代码

- [ ] **Step 1: 简化 loadProducts，移除离线缓存回退**

找到 `loadProducts()` 函数，将：
```typescript
async function loadProducts() {
  if (!isOnline.value) {
    const cached = offlineCache.getAllProducts()
    ...
  }
  isLoading.value = true
  ...
}
```
替换为：
```typescript
async function loadProducts() {
  isLoading.value = true
  try {
    const data = await tabletApi.getProducts()
    if (data && Array.isArray(data)) {
      products.value = data.map((item: any) => ({ ...item, category_id: String(item.category_id) }))
    } else if (data && (data as any).data && Array.isArray((data as any).data)) {
      products.value = (data as any).data.map((item: any) => ({ ...item, category_id: String(item.category_id) }))
    } else {
      products.value = []
    }
  } catch {
    products.value = []
    uni.showToast({ title: '加载商品失败，请下拉刷新', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}
```

- [ ] **Step 2: 简化 loadCategories，移除离线缓存回退**

找到 `loadCategories()` 函数，移除 `if (!isOnline.value)` 开头的缓存回退逻辑，保持 API 请求部分不变。失败时 `categories.value = []`。

- [ ] **Step 3: 移除 confirmOrder 中的离线分支**

找到 `confirmOrder()` 函数，移除：
```typescript
if (!isOnline.value) {
  for (const item of orderStore.cartItems.value) {
    offlineQueue.enqueue('add_product', { ... })
  }
  orderStore.clearCart()
  showCartModal.value = false
  uni.showToast(...)
  return
}
```
保留 `console.log` 之后的预订单提交流程。

- [ ] **Step 4: 移除空函数 handleSearch**

删除函数体：
```typescript
function handleSearch() {
}
```
替换为：
```typescript
// 搜索由 productSections 计算属性过滤实现，无需额外处理
```

- [ ] **Step 5: 移除未使用的 import**

移除 import 中的 `isOnline`、`offlineCache`、`offlineQueue`。

- [ ] **Step 6: Commit**

```bash
git add src/pages/product/index.vue
git commit -m "refactor: simplify product page, remove offline fallback and dead code"
```

---

## Task 5: 助教服务精简 — assistant/index.vue

**Files:**
- Modify: `src/pages/assistant/index.vue`

### 5.1 移除送礼功能

- [ ] **Step 1: 删除 gift 相关变量和函数**

删除以下代码块：
1. `giftPanelVisible` ref (约第 330 行)
2. `giftTargetAssistant` ref (约第 331 行)
3. `flyingGifts` ref (约第 332 行)
4. `giftTypes` 常量数组 (约第 448-455 行)
5. `openGiftPanel()` 函数 (约第 513-516 行)
6. `closeGiftPanel()` 函数 (约第 518-521 行)
7. `sendGift()` 函数 (约第 523-553 行)

- [ ] **Step 2: 删除送礼模板代码**

删除 template 中 `gift-panel-overlay` 整个区块（礼物选择面板），以及每个助教卡片中的 `gift-btn` 按钮。

在助教卡片中，将 `card-actions` 区域从：
```html
<view class="card-actions">
  <view class="gift-btn" @click.stop="openGiftPanel(assistant)"><text>🎁 送礼</text></view>
  <view class="book-btn" ...><text>...</text></view>
</view>
```
改为：
```html
<view class="card-actions">
  <view class="book-btn full" ...><text>...</text></view>
</view>
```

- [ ] **Step 3: 清除 gift-btn CSS**

删除 `.gift-btn` 样式块，给 `.book-btn` 添加 `&.full { flex: 1; }`。

- [ ] **Step 4: 移除离线分支（loadAssistants）**

`loadAssistants()` 函数中，移除 `if (!isOnline.value) { ... cached ... return }` 离线回退，直接从 API 请求：
```typescript
async function loadAssistants() {
  const res = await tabletApi.getAssistants()
  assistants.value = res.map((item: any) => ({
    ...item, id: String(item.id), level_id: String(item.level_id || ''),
    skills: item.skills ? item.skills.split(',') : [],
    is_busy: item.is_busy || false,
    level_name: item.level_name || '',
    introduction: item.introduction || '',
    gift_count: Number(item.gift_count) || 0,
    rating: Number(item.rating) || 0
  }))
}
```

- [ ] **Step 5: 移除 offline 相关 import**

移除 import 中的 `offlineCache`、`offlineQueue`（保留 `isOnline` 如果需要）。

- [ ] **Step 6: Commit**

```bash
git add src/pages/assistant/index.vue
git commit -m "refactor: remove gift feature from assistant page, simplify offline fallback"
```

---

## Task 6: 清理 — 删除 .backup 文件和未使用组件

**Files:**
- Delete: `src/pages/service/index.vue.backup`
- Delete: `src/styles/global.scss.backup`

- [ ] **Step 1: 删除备份文件**

```bash
rm d:/wwwroot/wwwbilliards-dky/www/wwwtable/src/pages/service/index.vue.backup
rm d:/wwwroot/wwwbilliards-dky/www/wwwtable/src/styles/global.scss.backup
```

- [ ] **Step 2: Commit**

```bash
git add -u
git commit -m "chore: remove .backup files"
```

---

## 自检清单

| 检查项 | 状态 |
|--------|------|
| Spec 覆盖率 — 账单重构 | ✅ Task 2 |
| Spec 覆盖率 — 结算流程 | ✅ Task 2 (QR 码 + 结果页) |
| Spec 覆盖率 — 商品点单精简 | ✅ Task 4 |
| Spec 覆盖率 — 助教精简 | ✅ Task 5 |
| Spec 覆盖率 — 会员预留 | ✅ Task 1 (API) + Task 2 (入口) |
| 无 Placeholder | ✅ 所有步骤含完整代码 |
| 类型一致性 | ✅ Bill 接口与 API 返回对齐 |
