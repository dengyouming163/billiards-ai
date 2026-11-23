# 移动端订单管理功能 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将助教接单中心页重写为全门店历史台桌主订单管理页，新增订单详情页。

**Architecture:** 后端在 `mobile/OrderController` 新增 `lists()` 和 `detail()` 方法，委托 `\app\storeapi\logic\order\OrderLogic`（不是 common 那个）；前端重写 `pages/orders/index.vue`、新建 `pages/orders/detail.vue`、删除 `active.vue`。

**Tech Stack:** UniApp Vue3 + TypeScript, ThinkPHP 8, ThinkORM

**Key Data Format Note:** `OrderLogic::getList()` 返回 `{ data: [...], pagination: { page, page_size, total, total_pages } }`，其中 `data` 是 key 名，不是 `list/lists`。`getDetail()` 返回 `formatOrder()` 结果：order 所有字段 + table_name + items[] + payments[] 扁平对象。

---

## Task 1: 后端 — mobile/OrderController 新增 lists() 和 detail()

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\OrderController.php`

### Step 1: 添加 storeapi OrderLogic 的 import

在 [OrderController.php:L8](file:///d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\OrderController.php#L8) 的 use 块中新增一行：

```
use app\storeapi\logic\order\OrderLogic as StoreOrderLogic;
```

当前第 8 行 `use app\common\logic\OrderLogic;` 保持不变（供现有台桌操作使用）。

### Step 2: 在 `pendingAssistants()` 方法之后、`uuid()` 方法之前插入两个新方法

在 [OrderController.php:L553](file:///d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\OrderController.php#L553)（`pendingAssistants()` 的 `}` 之后）和 [L555](file:///d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\OrderController.php#L555)（`protected function uuid()` 之前）之间插入：

```php
    #[Permission('mobile:order', '订单管理', 'mobile', '订单', ['boss', 'manager', 'employee', 'cashier'])]
    public function lists()
    {
        $params = $this->request->get();
        $params['store_id'] = $this->storeId;

        $dateRange = $params['dateRange'] ?? '';
        if (!empty($dateRange) && $dateRange !== 'all') {
            $dateMap = [
                'today'     => [date('Y-m-d') . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'yesterday' => [date('Y-m-d', strtotime('-1 day')) . ' 00:00:00', date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'],
                'week'      => [date('Y-m-d', strtotime('-6 day')) . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'month'     => [date('Y-m-01') . ' 00:00:00', date('Y-m-t') . ' 23:59:59'],
            ];
            if (isset($dateMap[$dateRange])) {
                $params['start_date'] = $dateMap[$dateRange][0];
                $params['end_date'] = $dateMap[$dateRange][1];
            }
        }

        $result = \app\storeapi\logic\order\OrderLogic::getList($params, $this->storeId);

        if ($result === false) {
            return JsonService::fail(\app\storeapi\logic\order\OrderLogic::getError());
        }

        return JsonService::data($result);
    }

    #[Permission('mobile:order', '订单管理', 'mobile', '订单', ['boss', 'manager', 'employee', 'cashier'])]
    public function detail()
    {
        $orderId = $this->request->get('order_id', '');

        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }

        $result = \app\storeapi\logic\order\OrderLogic::getDetail($orderId, $this->storeId);

        if ($result === false) {
            return JsonService::fail(\app\storeapi\logic\order\OrderLogic::getError());
        }

        return JsonService::data($result);
    }
```

### Step 3: 验证后端接口

启动后端服务（如果尚未运行），用 curl 或浏览器测试：

```
GET /storeapi/mobile.Order/lists?store_id=store-001&status=all&dateRange=all&page=1&page_size=20
GET /storeapi/mobile.Order/detail?store_id=store-001&order_id=<一个真实订单ID>
```

预期 lists 返回：
```json
{
  "code": 1,
  "show": 0,
  "msg": "",
  "data": {
    "data": [...],
    "pagination": { "page": 1, "page_size": 20, "total": N, "total_pages": N }
  }
}
```

---

## Task 2: 前端 — 新增类型定义

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\types\index.ts`

### Step 1: 在 `ApiResponse` 之后、`ApiError` 之前添加主订单类型

在 [types/index.ts](file:///d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\types\index.ts#L7-L8) 中，`PaginatedData` 接口之后插入：

```typescript
export interface OrderItemRecord {
  id: string
  order_id: string
  item_type: 'table' | 'product' | 'assistant' | 'merge_fee'
  item_name: string
  product_id?: string
  assistant_id?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  discount_rate: number
  final_price: number
  status: string
  delivered_at?: string
  created_at?: string
}

export interface OrderPaymentRecord {
  id: string
  order_id: string
  store_id: string
  order_no: string
  payment_method: string
  amount: number
  status: string
  paid_at: string
  operator_id: string
  operator_name: string
}

export interface MainOrder {
  id: string
  order_no: string
  store_id: string
  type: string
  status: string
  table_id: string
  table_name: string
  member_id: string
  member_name: string
  assistant_id: string
  original_amount: number
  discount_amount: number
  final_amount: number
  balance_paid: number
  cash_paid: number
  wechat_paid: number
  alipay_paid: number
  card_paid: number
  points_deduct: number
  points_gained: number
  payment_status: string
  start_time: string
  end_time: string
  duration_minutes: number
  prepaid_hours: number
  remaining_minutes: number
  operator_id: string
  operator_name: string
  remark: string
  cancel_time: string
  cancel_reason: string
  refund_amount: number
  created_at: string
  updated_at: string
  items: OrderItemRecord[]
  payments: OrderPaymentRecord[]
}

export interface OrderListResponse {
  data: MainOrder[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}
```

---

## Task 3: 前端 — 新增 API 函数

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\order.ts`

### Step 1: 添加 import 和两个新函数

在 [order.ts](file:///d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\order.ts) 文件开头的 import 中增加类型：

```diff
- import type { ApiResponse, AssistantOrder } from '@/types'
+ import type { ApiResponse, AssistantOrder, MainOrder, OrderListResponse } from '@/types'
```

在文件末尾（[L61](file:///d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\order.ts#L61) 之后）添加：

```typescript
export function getOrderList(params: {
  status?: string
  dateRange?: string
  type?: string
  keyword?: string
  page?: number
  page_size?: number
}): Promise<OrderListResponse> {
  return get('/mobile.Order/lists', params)
}

export function getOrderDetail(orderId: string): Promise<MainOrder> {
  return get('/mobile.Order/detail', { order_id: orderId })
}
```

---

## Task 4: 前端 — 重写订单列表页 index.vue

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\orders\index.vue`

完整重写。将当前助教接单中心内容全部替换为全店台桌主订单列表页。

### Step 1: 替换 template 内容

```vue
<template>
  <view class="page">
    <Header />

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
            <text>{{ currentDateLabel }}</text>
            <text class="chip-arrow">▼</text>
          </view>
        </picker>
        <picker mode="selector" :range="typeOptions" range-key="label" @change="onTypeChange">
          <view class="filter-chip">
            <text>{{ currentTypeLabel }}</text>
            <text class="chip-arrow">▼</text>
          </view>
        </picker>
      </view>
      <view class="search-row">
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索台桌名称或订单号"
          confirm-type="search"
          @confirm="onSearch"
        />
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
        :loading="loading"
        :empty="list.length === 0 && !loading"
        :error="hasError"
        empty-msg="暂无订单记录"
        error-msg="加载失败"
        @retry="loadData(true)"
      >
        <view class="card-list">
          <view
            class="order-card"
            v-for="item in list"
            :key="item.id"
            @click="goDetail(item.id)"
          >
            <view class="card-head">
              <text class="card-no">#{{ item.order_no }}</text>
              <view class="card-status" :class="statusClass(item.status, item.payment_status)">
                {{ item.status === 'in_progress' ? '进行中' : item.status === 'completed' ? '已结账' : item.status === 'cancelled' ? '已取消' : item.status }}
              </view>
            </view>
            <view class="card-body">
              <view class="card-info">
                <text class="info-row">
                  <text class="info-label">台桌</text>
                  <text class="info-value">{{ item.table_name || '-' }}</text>
                </text>
                <text class="info-row">
                  <text class="info-label">类型</text>
                  <text class="info-value">{{ typeLabel(item.type) }}</text>
                </text>
                <text class="info-row">
                  <text class="info-label">时间</text>
                  <text class="info-value">{{ formatTime(item.start_time) }} → {{ item.end_time ? formatTime(item.end_time) : '进行中' }}</text>
                </text>
              </view>
              <view class="card-amount">
                <text class="amount-value">¥{{ (item.final_amount || 0).toFixed(2) }}</text>
                <text class="amount-label" v-if="item.member_name">{{ item.member_name }}</text>
              </view>
            </view>
          </view>
        </view>
      </StateView>

      <view class="load-more" v-if="loading && list.length > 0">
        <text class="load-text">加载中...</text>
      </view>
      <view class="load-end" v-if="!hasMore && list.length > 0">
        <text class="load-text">没有更多了</text>
      </view>
    </scroll-view>

    <TabBar />
  </view>
</template>
```

### Step 2: 替换 script 内容

```typescript
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getOrderList } from '@/api/modules/order'
import type { MainOrder } from '@/types'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'

const list = ref<MainOrder[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)
const searchKeyword = ref('')

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

function statusClass(status: string, paymentStatus: string): string {
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return ''
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    table: '台桌开台',
    assistant: '助教服务',
    product: '商品销售',
  }
  return map[type] || type
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '-'
  const d = new Date(timeStr.replace('T', ' '))
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
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
  page.value++
  await loadData(false)
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
```

### Step 3: 替换 style 内容

```scss
<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.filter-bar {
  background: #fff;
  padding: 0 24rpx 16rpx;
  position: sticky;
  top: 0;
  z-index: 10;
}

.status-tabs {
  display: flex;
  gap: 10rpx;
  padding: 16rpx 0 12rpx;
}

.status-tab {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  font-size: 24rpx;
  font-weight: 500;
  color: #6b7280;
  background: #f3f4f6;
  transition: all 0.2s;

  &.active {
    background: #059669;
    color: #fff;
    font-weight: 600;
  }
}

.filter-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 20rpx;
  border-radius: 32rpx;
  background: #f3f4f6;
  font-size: 24rpx;
  color: #374151;
  font-weight: 500;
}

.chip-arrow {
  font-size: 16rpx;
  color: #9ca3af;
}

.search-row {
  margin-bottom: 0;
}

.search-input {
  background: #f3f4f6;
  border-radius: 32rpx;
  height: 68rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #374151;
  width: 100%;
  box-sizing: border-box;
}

.content-scroll {
  flex: 1;
  padding: 16rpx 24rpx;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.order-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 1rpx 8rpx rgba(0, 0, 0, 0.03);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f3f4f6;
}

.card-no {
  font-size: 26rpx;
  color: #374151;
  font-weight: 600;
}

.card-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 500;

  &.in_progress {
    background: #ecfdf5;
    color: #059669;
  }

  &.completed {
    background: #f3f4f6;
    color: #6b7280;
  }

  &.cancelled {
    background: #fef2f2;
    color: #dc2626;
  }
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
  gap: 10rpx;
}

.info-row {
  font-size: 24rpx;
  color: #6b7280;
  display: flex;
  gap: 8rpx;
}

.info-label {
  color: #9ca3af;
  flex-shrink: 0;
  min-width: 60rpx;
}

.info-value {
  color: #374151;
  font-weight: 500;
}

.card-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
  flex-shrink: 0;
}

.amount-value {
  font-size: 32rpx;
  font-weight: 700;
  color: #dc2626;
}

.amount-label {
  font-size: 22rpx;
  color: #9ca3af;
}

.load-more,
.load-end {
  display: flex;
  justify-content: center;
  padding: 24rpx 0;
}

.load-text {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
```

---

## Task 5: 前端 — 新建订单详情页 detail.vue

**Files:**
- Create: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\orders\detail.vue`

### Step 1: 写入完整文件

```vue
<template>
  <view class="page">
    <view class="header-bar">
      <view class="back-btn" @click="goBack">
        <text>← 返回</text>
      </view>
      <text class="header-title">订单详情</text>
      <view class="header-placeholder" />
    </view>

    <StateView :loading="loading" :error="hasError" :empty="!order && !loading && !hasError" empty-msg="订单不存在或已被删除" error-msg="加载失败" @retry="loadDetail">
      <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false" v-if="order">
        <view class="hero-card">
          <view class="hero-status" :class="statusClass(order.status)">
            {{ statusText(order.status) }}
          </view>
          <text class="hero-no">#{{ order.order_no }}</text>
          <text class="hero-amount">¥{{ (order.final_amount || 0).toFixed(2) }}</text>
        </view>

        <view class="section-card">
          <text class="section-title">基本信息</text>
          <view class="info-grid">
            <view class="info-item">
              <text class="info-label">台桌</text>
              <text class="info-value">{{ order.table_name || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">类型</text>
              <text class="info-value">{{ typeLabel(order.type) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">操作员</text>
              <text class="info-value">{{ order.operator_name || '-' }}</text>
            </view>
            <view class="info-item" v-if="order.member_name">
              <text class="info-label">会员</text>
              <text class="info-value">{{ order.member_name }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">开始时间</text>
              <text class="info-value">{{ formatDateTime(order.start_time) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">结束时间</text>
              <text class="info-value">{{ order.end_time ? formatDateTime(order.end_time) : '进行中' }}</text>
            </view>
            <view class="info-item" v-if="order.duration_minutes > 0">
              <text class="info-label">时长</text>
              <text class="info-value">{{ durationText }}</text>
            </view>
            <view class="info-item" v-if="order.remark">
              <text class="info-label">备注</text>
              <text class="info-value">{{ order.remark }}</text>
            </view>
          </view>
        </view>

        <view class="section-card" v-if="order.items && order.items.length > 0">
          <text class="section-title">消费明细</text>
          <view class="item-list">
            <view class="item-row" v-for="item in order.items" :key="item.id">
              <view class="item-left">
                <view class="item-icon" :class="'icon-' + item.item_type">
                  {{ itemIcon(item.item_type) }}
                </view>
                <view class="item-info">
                  <text class="item-name">{{ item.item_name }}</text>
                  <text class="item-meta">{{ item.quantity }} × ¥{{ (item.unit_price || 0).toFixed(2) }}</text>
                </view>
              </view>
              <text class="item-price">¥{{ (item.final_price || item.total_price || 0).toFixed(2) }}</text>
            </view>
          </view>
        </view>

        <view class="section-card" v-if="order.status === 'completed'">
          <text class="section-title">支付信息</text>
          <view class="payment-list">
            <view class="payment-row" v-if="order.cash_paid > 0">
              <text class="payment-method">现金</text>
              <text class="payment-amount">¥{{ Number(order.cash_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.wechat_paid > 0">
              <text class="payment-method">微信</text>
              <text class="payment-amount">¥{{ Number(order.wechat_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.alipay_paid > 0">
              <text class="payment-method">支付宝</text>
              <text class="payment-amount">¥{{ Number(order.alipay_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.balance_paid > 0">
              <text class="payment-method">余额</text>
              <text class="payment-amount">¥{{ Number(order.balance_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.card_paid > 0">
              <text class="payment-method">刷卡</text>
              <text class="payment-amount">¥{{ Number(order.card_paid).toFixed(2) }}</text>
            </view>
            <view class="payment-row total-row" v-if="order.final_amount > 0">
              <text class="payment-method">实付合计</text>
              <text class="payment-amount total">¥{{ (order.final_amount || 0).toFixed(2) }}</text>
            </view>
          </view>
        </view>

        <view class="section-card" v-if="order.status === 'in_progress'">
          <view class="action-btn" @click="goTable">
            <text>前往台桌继续操作 →</text>
          </view>
        </view>

        <view class="section-card">
          <text class="section-title">费用明细</text>
          <view class="payment-list">
            <view class="payment-row">
              <text class="payment-method">原价</text>
              <text class="payment-amount">¥{{ (order.original_amount || 0).toFixed(2) }}</text>
            </view>
            <view class="payment-row" v-if="order.discount_amount > 0">
              <text class="payment-method">优惠</text>
              <text class="payment-amount discount">-¥{{ (order.discount_amount || 0).toFixed(2) }}</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getOrderDetail } from '@/api/modules/order'
import type { MainOrder } from '@/types'
import StateView from '@/components/StateView.vue'

const orderId = ref('')
const order = ref<MainOrder | null>(null)
const loading = ref(true)
const hasError = ref(false)

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  orderId.value = currentPage.options?.order_id || ''
  loadDetail()
})

function loadDetail() {
  if (!orderId.value) return
  loading.value = true
  hasError.value = false

  getOrderDetail(orderId.value)
    .then((res: any) => {
      order.value = res
    })
    .catch((e: any) => {
      console.error('加载订单详情失败', e)
      hasError.value = true
    })
    .finally(() => {
      loading.value = false
    })
}

const durationText = computed(() => {
  if (!order.value || !order.value.duration_minutes) return ''
  const totalMin = Number(order.value.duration_minutes)
  const hours = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (hours > 0 && mins > 0) return `${hours}小时${mins}分钟`
  if (hours > 0) return `${hours}小时`
  return `${mins}分钟`
})

function statusClass(status: string): string {
  if (status === 'in_progress') return 'in_progress'
  if (status === 'completed') return 'completed'
  return 'cancelled'
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

function itemIcon(itemType: string): string {
  const icons: Record<string, string> = {
    table: '🎱',
    product: '🛒',
    assistant: '👤',
    merge_fee: '🔗',
  }
  return icons[itemType] || '📋'
}

function formatDateTime(timeStr: string): string {
  if (!timeStr) return '-'
  const d = new Date(timeStr.replace('T', ' '))
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${mins}`
}

function goTable() {
  if (!order.value || !order.value.table_id) return
  uni.navigateTo({ url: `/pages/table/detail?table_id=${order.value.table_id}` })
}

function goBack() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #fff;
}

.back-btn {
  font-size: 28rpx;
  color: #059669;
  font-weight: 500;
}

.header-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.header-placeholder {
  width: 100rpx;
}

.content-scroll {
  flex: 1;
  padding: 16rpx 24rpx;
}

.hero-card {
  background: linear-gradient(135deg, #059669, #047857);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 16rpx;
  text-align: center;
}

.hero-status {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 20rpx;
  border-radius: 20rpx;
  font-weight: 500;
  margin-bottom: 16rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;

  &.completed {
    background: rgba(255, 255, 255, 0.15);
  }
  &.cancelled {
    background: rgba(239, 68, 68, 0.3);
  }
}

.hero-no {
  display: block;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 8rpx;
}

.hero-amount {
  display: block;
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
}

.section-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20rpx;
  display: block;
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0 32rpx;
}

.info-item {
  width: calc(50% - 16rpx);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #f9fafb;
}

.info-label {
  font-size: 22rpx;
  color: #9ca3af;
}

.info-value {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f9fafb;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.item-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;

  &.icon-table {
    background: #ecfdf5;
  }
  &.icon-product {
    background: #fef3c7;
  }
  &.icon-assistant {
    background: #dbeafe;
  }
  &.icon-merge_fee {
    background: #f3e8ff;
  }
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.item-name {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
}

.item-meta {
  font-size: 22rpx;
  color: #9ca3af;
}

.item-price {
  font-size: 28rpx;
  color: #1f2937;
  font-weight: 600;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;

  &.total-row {
    border-top: 1rpx dashed #e5e7eb;
    padding-top: 16rpx;
    margin-top: 6rpx;
  }
}

.payment-method {
  font-size: 26rpx;
  color: #6b7280;
}

.payment-amount {
  font-size: 26rpx;
  color: #374151;
  font-weight: 600;

  &.total {
    font-size: 32rpx;
    color: #dc2626;
    font-weight: 700;
  }

  &.discount {
    color: #059669;
  }
}

.action-btn {
  display: flex;
  justify-content: center;
  padding: 12rpx 0;
  font-size: 28rpx;
  color: #059669;
  font-weight: 600;
}
</style>
```

---

## Task 6: 前端 — 更新路由配置

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages.json`

### Step 1: 修改 orders/index 路由标题

将 [pages.json:L62-L65](file:///d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages.json#L62-L65) 的：

```json
{
  "path": "pages/orders/index",
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "接单中心"
  }
},
```

改为：

```json
{
  "path": "pages/orders/index",
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "订单管理"
  }
},
```

### Step 2: 替换 orders/active 路由为 detail

将 [pages.json:L67-L72](file:///d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages.json#L67-L72) 的：

```json
{
  "path": "pages/orders/active",
  "style": {
    "navigationStyle": "custom",
    "navigationBarTitleText": "进行中订单"
  }
},
```

改为：

```json
{
  "path": "pages/orders/detail",
  "style": {
    "navigationBarTitleText": "订单详情"
  }
},
```

---

## Task 7: 清理 — 删除废弃文件

**Files:**
- Delete: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\orders\active.vue`

直接删除该文件。

---

## Task 8: 清理 — stores/order.ts 保留不变

`stores/order.ts` 中的助教接单方法（`loadPendingOrders`、`loadActiveOrder`、`accept`、`reject`、`start`、`complete` 等）后续首页按角色展示助教功能时仍会使用，本次不做修改。

---

## Task 9: 端到端验证

### Step 1: 验证列表页

1. 打开 `/pages/orders/index` 页面
2. 确认四个状态 Tab 切换正常（全部/进行中/已结账/已取消）
3. 确认日期筛选下拉正常（今天/昨天/近7天/本月/全部时间）
4. 确认类型筛选下拉正常（全部/台桌/助教/商品）
5. 确认搜索功能正常
6. 确认上拉加载更多正常
7. 确认下拉刷新正常
8. 确认金额显示正确

### Step 2: 验证详情页

1. 从列表页点击任一订单卡片
2. 确认 Hero 区域显示订单号、状态、金额
3. 确认基本信息区域显示完整（台桌、类型、操作员、会员、时间）
4. 确认消费明细列表正确显示
5. 确认已结账订单显示支付信息
6. 确认进行中订单显示"前往台桌"按钮
7. 确认返回按钮正常
