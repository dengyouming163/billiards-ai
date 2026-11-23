# wwwstoreapp 台桌板块升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwstoreapp 台桌板块升级至与 wwwpos 收银端一致的业务逻辑，包含快捷操作区、计费账单、换台并台、现金结算。

**Architecture:** 参考 wwwpos 的组件结构和 API 调用模式，在 uni-app Vue 3 框架下重新实现。每个弹窗组件负责自己的轮询和状态管理，主页面 index.vue 负责组装和数据分发。

**Tech Stack:** uni-app 3 (Vue 3.4 + Composition API) + TypeScript + uni.request HTTP client + SCSS

---

## 文件结构总览

```
src/pages/table/
├── index.vue                          # [修改] 集成 QuickActions，移除独立弹窗
├── detail.vue                         # [重写] 对齐 TableDrawer 账单结构
├── checkout.vue                       # [保留但不再独立使用]
├── log.vue                            # [保留]
├── pending-products.vue               # [保留但不再独立使用]
├── pending-assistants.vue             # [保留但不再独立使用]
└── components/
    ├── QuickActions.vue               # [新建] 四个快捷入口 + 轮询计数
    ├── OpenTableRequestsModal.vue     # [新建] 开台申请弹窗
    ├── OrderReminderModal.vue         # [新建] 点单提醒弹窗（完善版）
    ├── AssistantReminderModal.vue     # [新建] 上桌提醒弹窗（完善版）
    ├── CouponOpenModal.vue            # [新建] 套餐验券开台弹窗
    ├── CheckoutModal.vue              # [新建] 结账弹窗（现金一键支付）
    ├── ShortcutBar.vue                # [删除] 由 QuickActions 替代
    ├── BillPanel.vue                  # [修改] 扩展为完整费用明细
    ├── ProductPanel.vue               # [修改] 对齐状态工作流
    ├── AssistantPanel.vue             # [修改] 对齐状态工作流 + 实时计时
    ├── TableCard.vue                  # [保留]
    ├── TableGrid.vue                  # [保留]
    ├── ZoneFilter.vue                 # [保留]
    ├── ActionBar.vue                  # [保留]
    ├── TableSelector.vue              # [保留]
    ├── ProductSelector.vue            # [修改] 对齐 wwwpos 产品选择器
    ├── AssistantSelector.vue          # [保留]
    └── MemberSelector.vue             # [保留]

src/api/modules/
├── table.ts                           # [修改] 补充 API 函数，对齐 wwwpos endpoints
└── coupon.ts                          # [新建] 套餐券 API

src/utils/
└── billing.ts                         # [新建] 时段系数显示工具
```

---

### Task 1: 补充 API 层 — table.ts + coupon.ts + billing.ts

**文件:**
- 修改: `src/api/modules/table.ts`
- 新建: `src/api/modules/coupon.ts`
- 新建: `src/utils/billing.ts`

- [ ] **Step 1: 在 table.ts 补充 POS 端 API 函数**

在 `src/api/modules/table.ts` 末尾追加以下 API 函数（当前文件已有 193 行，保留全部现有代码，仅追加）：

```typescript
// === 开台申请 ===
export interface OpenTableRequest {
  token: string
  tableName: string
  tableId: string
  playerCount: number
  expiresAt: number
  timeout: number
}

export function getPendingConfirmRequests(): Promise<OpenTableRequest[]> {
  return get('/pos.Order/pendingConfirmRequests')
}

export function confirmOpenRequest(data: { token: string; action: 'confirm' | 'reject' }): Promise<Record<string, unknown>> {
  return post('/pos.Order/confirmOpen', data)
}

// === 点单提醒（使用 wwwpos 端点） ===
export interface PendingDeliveryGroup {
  tableId: string
  tableName: string
  zoneName: string
  orderId: string
  items: PendingDeliveryItem[]
}

export interface PendingDeliveryItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  finalPrice: number
  status: string
  createdAt: string
  expiresAt?: string
}

export function getPendingDeliveriesV2(): Promise<PendingDeliveryGroup[]> {
  return get('/pos.Order/pendingDeliveries')
}

export function deliverItem(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/deliverItem', data)
}

export function cancelOrderItem(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/cancelItem', data)
}

// === 助教上桌提醒（使用 wwwpos 端点） ===
export interface PendingAssistantBooking {
  itemId: string
  orderId: string
  tableId: string
  tableName: string
  zoneName: string
  assistantId: string
  assistantName: string
  hourlyRate: number
  status: string
  createdAt: string
  expiresAt?: string
}

export function getPendingAssistantBookingsV2(): Promise<PendingAssistantBooking[]> {
  return get('/pos.Order/pendingAssistantBookings')
}

export function acceptAssistantBooking(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/acceptAssistant', data)
}

// === 结账（对齐 wwwpos checkout 参数） ===
export function checkoutOrder(data: {
  order_id: string
  cash_paid: number
  wechat_paid?: number
  alipay_paid?: number
  balance_paid?: number
  card_paid?: number
  discount?: number
  pay_type: string
  pay_amount: number
  remark?: string
}): Promise<Record<string, unknown>> {
  return post('/pos.Order/checkout', data)
}
```

- [ ] **Step 2: 新建 coupon.ts**

创建 `src/api/modules/coupon.ts`：

```typescript
import { get, post } from '../request'

export interface CouponPackage {
  id: string
  name: string
  duration_hours: number
  price: number
  original_price: number
  status?: string
}

export function getCouponPackageList(): Promise<{ lists?: CouponPackage[]; data?: CouponPackage[] }> {
  return get('/coupon.Package/list', { platform: 'internal' })
}

export function confirmInternalCoupon(data: {
  package_id: string
  table_id: string
  player_count: number
}): Promise<Record<string, unknown>> {
  return post('/pos.Coupon/confirmInternal', data)
}
```

- [ ] **Step 3: 新建 billing.ts 工具函数**

创建 `src/utils/billing.ts`（直接复用 wwwpos `utils/billing.ts` 逻辑，适配 uni-app 环境）：

```typescript
/** 获取时段系数 */
export function getTimeCoefficient(timestamp: number): number {
  const hour = new Date(timestamp).getHours()
  if (hour >= 22 || hour < 6) return 1.5
  if (hour >= 6 && hour < 14) return 0.8
  return 1.0
}

/** 获取当前时段系数 */
export function getCurrentCoefficient(): number {
  return getTimeCoefficient(Date.now())
}

/** 获取时段标签 */
export function getTimePeriodLabel(): string {
  const coeff = getCurrentCoefficient()
  if (coeff === 1.5) return '深夜时段 ×1.5'
  if (coeff === 0.8) return '早间时段 ×0.8'
  return '正常时段 ×1.0'
}
```

- [ ] **Step 4: 在 api/index.ts 添加 coupon 导出**

在 `src/api/index.ts` 末尾追加：
```typescript
export * from './modules/coupon'
```

- [ ] **Step 5: Commit**

```bash
git add src/api/modules/table.ts src/api/modules/coupon.ts src/utils/billing.ts src/api/index.ts
git commit -m "feat(table): add POS-aligned API functions + coupon module + billing utils"
```

---

### Task 2: QuickActions 组件 — 四个快捷入口 + 轮询

**文件:** 新建 `src/pages/table/components/QuickActions.vue`

- [ ] **Step 1: 创建 QuickActions.vue**

```vue
<template>
  <view class="quick-actions">
    <view class="qa-card qa-card--amber" @click="$emit('openTableRequests')">
      <view class="qa-icon">🛎</view>
      <view class="qa-label">开台申请</view>
      <view v-if="openRequestCount > 0" class="qa-badge">{{ openRequestCount > 99 ? '99+' : openRequestCount }}</view>
    </view>
    <view class="qa-card qa-card--orange" @click="$emit('orderReminder')">
      <view class="qa-icon">📦</view>
      <view class="qa-label">点单提醒</view>
      <view v-if="deliveryCount > 0" class="qa-badge">{{ deliveryCount > 99 ? '99+' : deliveryCount }}</view>
    </view>
    <view class="qa-card qa-card--rose" @click="$emit('assistantReminder')">
      <view class="qa-icon">👤</view>
      <view class="qa-label">上桌提醒</view>
      <view v-if="bookingCount > 0" class="qa-badge">{{ bookingCount > 99 ? '99+' : bookingCount }}</view>
    </view>
    <view class="qa-card qa-card--teal" @click="$emit('couponOpen')">
      <view class="qa-icon">🎫</view>
      <view class="qa-label">套餐验券</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingConfirmRequests, getPendingDeliveriesV2, getPendingAssistantBookingsV2 } from '@/api/modules/table'
import { storeStore } from '@/stores/store'

const emit = defineEmits(['openTableRequests', 'orderReminder', 'assistantReminder', 'couponOpen'])

const openRequestCount = ref(0)
const deliveryCount = ref(0)
const bookingCount = ref(0)

let openRequestTimer: ReturnType<typeof setInterval> | null = null
let deliveryTimer: ReturnType<typeof setInterval> | null = null
let bookingTimer: ReturnType<typeof setInterval> | null = null

// 开台申请 — 5秒轮询
async function pollOpenRequests() {
  try {
    const result = await getPendingConfirmRequests()
    openRequestCount.value = (result || []).length
  } catch { /* silent */ }
}

// 点单提醒 — 10秒轮询
async function pollDeliveries() {
  try {
    const result = await getPendingDeliveriesV2()
    deliveryCount.value = (result || []).reduce((sum, g) => sum + (g.items?.length || 0), 0)
  } catch { /* silent */ }
}

// 上桌提醒 — 10秒轮询
async function pollBookings() {
  try {
    const result = await getPendingAssistantBookingsV2()
    bookingCount.value = (result || []).length
  } catch { /* silent */ }
}

onMounted(() => {
  pollOpenRequests()
  pollDeliveries()
  pollBookings()
  openRequestTimer = setInterval(pollOpenRequests, 5000)
  deliveryTimer = setInterval(pollDeliveries, 10000)
  bookingTimer = setInterval(pollBookings, 10000)
})

onUnmounted(() => {
  if (openRequestTimer) clearInterval(openRequestTimer)
  if (deliveryTimer) clearInterval(deliveryTimer)
  if (bookingTimer) clearInterval(bookingTimer)
})
</script>

<style lang="scss" scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  padding: 0 24rpx 16rpx;
}

.qa-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 8rpx;
  border-radius: 16rpx;
  gap: 8rpx;
  transition: all 0.15s;

  &:active { transform: scale(0.95); }
}

.qa-card--amber { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1rpx solid #fcd34d; }
.qa-card--orange { background: linear-gradient(135deg, #fff7ed, #fed7aa); border: 1rpx solid #fb923c; }
.qa-card--rose { background: linear-gradient(135deg, #fff1f2, #fecdd3); border: 1rpx solid #fb7185; }
.qa-card--teal { background: linear-gradient(135deg, #f0fdfa, #99f6e4); border: 1rpx solid #2dd4bf; }

.qa-icon { font-size: 36rpx; }
.qa-label { font-size: 22rpx; font-weight: 600; color: #374151; }

.qa-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  background: #ef4444;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/QuickActions.vue
git commit -m "feat(table): add QuickActions with polling badges for 4 entry points"
```

---

### Task 3: OpenTableRequestsModal — 开台申请弹窗

**文件:** 新建 `src/pages/table/components/OpenTableRequestsModal.vue`

- [ ] **Step 1: 创建 OpenTableRequestsModal.vue**

```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">开台申请</text>
        <view v-if="requests.length > 0" class="count-badge">{{ requests.length }}条待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="loading && requests.length === 0" class="center-hint">
          <text>加载中...</text>
        </view>
        <view v-else-if="requests.length === 0" class="center-hint">
          <text class="hint-icon">📋</text>
          <text class="hint-text">暂无开台申请</text>
        </view>
        <view v-else v-for="req in requests" :key="req.token"
          class="request-item" :class="{ expired: isExpired(req) }">
          <view class="req-top">
            <view class="req-table">
              <text class="req-icon">🎱</text>
              <text class="req-name">{{ req.tableName || req.tableId }}</text>
            </view>
            <text class="req-timer" :class="timerClass(req)">⏱ {{ formatRemaining(req) }}</text>
          </view>
          <view class="req-meta">
            <text>👥 {{ req.playerCount }}人</text>
            <text>处理时限 {{ req.timeout || 1 }}分钟</text>
          </view>
          <view class="req-actions">
            <button :disabled="isExpired(req) || processing === req.token"
              class="btn-confirm" @click="handleAction(req.token, 'confirm')">
              {{ processing === req.token ? '处理中...' : '✅ 确认开台' }}
            </button>
            <button :disabled="isExpired(req) || processing === req.token"
              class="btn-reject" @click="handleAction(req.token, 'reject')">
              拒绝
            </button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingConfirmRequests, confirmOpenRequest } from '@/api/modules/table'
import type { OpenTableRequest } from '@/api/modules/table'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'resolved'])

const requests = ref<OpenTableRequest[]>([])
const loading = ref(false)
const processing = ref<string | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

async function loadData() {
  loading.value = true
  try {
    const result = await getPendingConfirmRequests()
    requests.value = result || []
  } catch { requests.value = [] }
  finally { loading.value = false }
}

function isExpired(req: OpenTableRequest): boolean {
  return req.expiresAt - now.value <= 0
}

function timerClass(req: OpenTableRequest): string {
  const remaining = req.expiresAt - now.value
  if (remaining <= 0) return 'timer-expired'
  if (remaining <= 15) return 'timer-warn'
  return 'timer-ok'
}

function formatRemaining(req: OpenTableRequest): string {
  const remaining = req.expiresAt - now.value
  if (remaining <= 0) return '已超时'
  if (remaining >= 60) return `${Math.floor(remaining / 60)}分${remaining % 60}秒`
  return `${remaining}秒`
}

async function handleAction(token: string, action: 'confirm' | 'reject') {
  processing.value = token
  try {
    await confirmOpenRequest({ token, action })
    uni.showToast({ title: action === 'confirm' ? '已确认开台' : '已拒绝', icon: 'success' })
    requests.value = requests.value.filter(r => r.token !== token)
    emit('resolved')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '操作失败', icon: 'none' })
  } finally {
    processing.value = null
  }
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadData, 5000)
  tickTimer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})

defineExpose({ loadData })
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; background: #fef3c7; color: #92400e; font-size: 22rpx; font-weight: 700; border-radius: 20rpx; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.request-item { padding: 24rpx; margin-bottom: 16rpx; border-radius: 16rpx; background: #f9fafb; }
.request-item.expired { opacity: 0.5; background: #f3f4f6; }
.req-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.req-table { display: flex; align-items: center; gap: 8rpx; }
.req-icon { font-size: 32rpx; }
.req-name { font-size: 28rpx; font-weight: 700; color: #1f2937; }
.req-timer { font-size: 24rpx; font-weight: 700; font-variant-numeric: tabular-nums; }
.timer-ok { color: #059669; }
.timer-warn { color: #d97706; }
.timer-expired { color: #ef4444; }
.req-meta { display: flex; gap: 24rpx; font-size: 22rpx; color: #9ca3af; margin-bottom: 16rpx; }
.req-actions { display: flex; gap: 16rpx; }
.btn-confirm { flex: 1; padding: 18rpx; background: #059669; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
.btn-confirm[disabled] { background: #d1d5db; color: #9ca3af; }
.btn-reject { flex: 1; padding: 18rpx; background: #ef4444; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
.btn-reject[disabled] { background: #d1d5db; color: #9ca3af; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/OpenTableRequestsModal.vue
git commit -m "feat(table): add OpenTableRequestsModal with 5s polling and confirm/reject"
```

---

### Task 4: OrderReminderModal — 点单提醒弹窗

**文件:** 新建 `src/pages/table/components/OrderReminderModal.vue`

- [ ] **Step 1: 创建 OrderReminderModal.vue**

```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">点单提醒</text>
        <view v-if="totalPending > 0" class="count-badge orange">{{ totalPending }}件待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="allItems.length === 0" class="center-hint">
          <text class="hint-icon">✅</text>
          <text class="hint-text">暂无待处理点单</text>
        </view>
        <view v-else v-for="item in allItems" :key="item.itemId" class="item-row">
          <view class="item-icon-box">📦</view>
          <view class="item-info">
            <view class="item-head">
              <text class="item-table">{{ item._table.tableName }}</text>
              <text class="item-name">{{ item.itemName }}</text>
              <text v-if="isExpired(item)" class="expired-tag">已超时</text>
            </view>
            <view class="item-sub">
              <text>¥{{ item.unitPrice }} × {{ item.quantity }} = ¥{{ (item.unitPrice * item.quantity).toFixed(2) }}</text>
              <text v-if="item.expiresAt" class="item-countdown">剩余 {{ formatRemaining(item) }}</text>
            </view>
          </view>
          <view class="item-actions">
            <button class="btn-deliver" :disabled="!!processingItem"
              @click="handleDeliverClick(item)">送达</button>
            <button class="btn-skip" :disabled="!!processingItem"
              @click="handleIgnore(item.itemId)">忽略</button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>

  <!-- 送达确认弹窗 -->
  <view v-if="confirmTarget" class="modal-overlay" style="z-index:1101" @click="confirmTarget = null">
    <view class="confirm-dialog" @click.stop>
      <view class="confirm-icon">✅</view>
      <text class="confirm-title">确认送达</text>
      <text class="confirm-desc">{{ confirmTarget._table.tableName }} · {{ confirmTarget.itemName }} × {{ confirmTarget.quantity }}</text>
      <view class="confirm-actions">
        <button class="btn-cancel" @click="confirmTarget = null">取消</button>
        <button class="btn-ok" @click="handleDeliver(confirmTarget)">确认送达</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getPendingDeliveriesV2, deliverItem, cancelOrderItem } from '@/api/modules/table'
import type { PendingDeliveryGroup, PendingDeliveryItem } from '@/api/modules/table'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const groups = ref<PendingDeliveryGroup[]>([])
const processingItem = ref<string | null>(null)
const confirmTarget = ref<(PendingDeliveryItem & { _table: PendingDeliveryGroup }) | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

const allItems = computed(() =>
  groups.value.flatMap(g => g.items.map(i => ({ ...i, _table: g })))
)
const totalPending = computed(() => allItems.value.length)

function isExpired(item: PendingDeliveryItem): boolean {
  if (!item.expiresAt) return false
  return new Date(item.expiresAt).getTime() / 1000 - now.value <= 0
}

function formatRemaining(item: PendingDeliveryItem): string {
  if (!item.expiresAt) return ''
  const r = Math.floor(new Date(item.expiresAt).getTime() / 1000 - now.value)
  if (r <= 0) return '0秒'
  if (r >= 60) return `${Math.floor(r / 60)}分${r % 60}秒`
  return `${r}秒`
}

async function loadData() {
  try {
    const result = await getPendingDeliveriesV2()
    groups.value = result || []
  } catch { groups.value = [] }
}

function handleDeliverClick(item: PendingDeliveryItem & { _table: PendingDeliveryGroup }) {
  confirmTarget.value = item
}

async function handleDeliver(item: PendingDeliveryItem) {
  confirmTarget.value = null
  processingItem.value = item.itemId
  try {
    await deliverItem({ item_id: item.itemId })
    uni.showToast({ title: '已送达', icon: 'success' })
    emit('updated')
    await loadData()
  } catch (e: any) {
    uni.showToast({ title: e?.msg || '操作失败', icon: 'none' })
  } finally {
    processingItem.value = null
  }
}

async function handleIgnore(itemId: string) {
  groups.value = groups.value.map(g => ({
    ...g,
    items: g.items.filter(i => i.itemId !== itemId)
  })).filter(g => g.items.length > 0)
  try { await cancelOrderItem({ item_id: itemId }) } catch {}
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadData, 10000)
  tickTimer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; background: #fff7ed; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; font-weight: 700; }
.count-badge.orange { background: #fed7aa; color: #9a3412; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.item-row { display: flex; align-items: flex-start; gap: 16rpx; padding: 20rpx; margin-bottom: 12rpx; border-radius: 12rpx; background: #fff; border: 1rpx solid #f3f4f6; }
.item-icon-box { width: 64rpx; height: 64rpx; border-radius: 16rpx; background: #fff7ed; display: flex; align-items: center; justify-content: center; font-size: 28rpx; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-head { display: flex; align-items: center; gap: 8rpx; flex-wrap: wrap; margin-bottom: 6rpx; }
.item-table { font-size: 22rpx; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 2rpx 10rpx; border-radius: 6rpx; }
.item-name { font-size: 26rpx; font-weight: 500; color: #374151; }
.expired-tag { font-size: 20rpx; color: #ef4444; font-weight: 600; }
.item-sub { display: flex; align-items: center; gap: 16rpx; font-size: 22rpx; color: #9ca3af; }
.item-countdown { color: #d97706; font-weight: 600; font-variant-numeric: tabular-nums; }
.item-actions { display: flex; gap: 8rpx; flex-shrink: 0; align-self: center; }
.btn-deliver { padding: 12rpx 24rpx; background: #ea580c; color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
.btn-deliver[disabled] { opacity: 0.5; }
.btn-skip { padding: 12rpx 24rpx; background: #f3f4f6; color: #6b7280; border-radius: 10rpx; font-size: 24rpx; border: none; }
.btn-skip[disabled] { opacity: 0.3; }
/* confirm dialog */
.confirm-dialog { position: fixed; inset: 0; margin: auto; width: 560rpx; height: fit-content; background: #fff; border-radius: 32rpx; padding: 48rpx 32rpx; text-align: center; z-index: 1102; box-shadow: 0 20rpx 60rpx rgba(0,0,0,.3); }
.confirm-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.confirm-title { display: block; font-size: 32rpx; font-weight: 700; color: #111827; margin-bottom: 12rpx; }
.confirm-desc { display: block; font-size: 26rpx; color: #6b7280; margin-bottom: 32rpx; }
.confirm-actions { display: flex; gap: 16rpx; }
.btn-cancel { flex: 1; padding: 22rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-ok { flex: 1; padding: 22rpx; background: #ea580c; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/OrderReminderModal.vue
git commit -m "feat(table): add OrderReminderModal with deliver/ignore + confirmation dialog"
```

---

### Task 5: AssistantReminderModal — 上桌提醒弹窗

**文件:** 新建 `src/pages/table/components/AssistantReminderModal.vue`

- [ ] **Step 1: 创建 AssistantReminderModal.vue**

```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">上桌提醒</text>
        <view v-if="bookings.length > 0" class="count-badge rose">{{ bookings.length }}条待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="bookings.length === 0" class="center-hint">
          <text class="hint-icon">✅</text>
          <text class="hint-text">暂无待安排上桌</text>
        </view>
        <view v-else v-for="b in bookings" :key="b.itemId" class="booking-item">
          <view class="booking-top">
            <view class="booking-table">
              <text class="booking-icon">📍</text>
              <text class="booking-name">{{ b.zoneName ? b.zoneName + ' · ' : '' }}{{ b.tableName }}</text>
            </view>
            <view class="booking-actions">
              <text v-if="b.expiresAt" class="booking-countdown">{{ formatRemaining(b) }}</text>
              <button class="btn-accept" :disabled="processingItem === b.itemId"
                @click="handleAcceptClick(b)">处理</button>
              <button class="btn-skip" :disabled="!!processingItem"
                @click="handleIgnore(b.itemId)">忽略</button>
            </view>
          </view>
          <view class="booking-sub">
            <text>👤 {{ b.assistantName }}</text>
            <text>¥{{ b.hourlyRate }}/时</text>
            <text v-if="b.createdAt">{{ formatTime(b.createdAt) }} 预约</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>

  <view v-if="confirmTarget" class="modal-overlay" style="z-index:1101" @click="confirmTarget = null">
    <view class="confirm-dialog" @click.stop>
      <view class="confirm-icon">✅</view>
      <text class="confirm-title">确认处理</text>
      <text class="confirm-desc">{{ confirmTarget.tableName }} · {{ confirmTarget.assistantName }}</text>
      <text class="confirm-hint">处理后请到台桌点击「开始服务」</text>
      <view class="confirm-actions">
        <button class="btn-cancel" @click="confirmTarget = null">取消</button>
        <button class="btn-ok" @click="handleAccept(confirmTarget)">确认处理</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingAssistantBookingsV2, acceptAssistantBooking, cancelOrderItem } from '@/api/modules/table'
import type { PendingAssistantBooking } from '@/api/modules/table'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const bookings = ref<PendingAssistantBooking[]>([])
const processingItem = ref<string | null>(null)
const confirmTarget = ref<PendingAssistantBooking | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

function formatRemaining(b: PendingAssistantBooking): string {
  if (!b.expiresAt) return ''
  const r = Math.floor(new Date(b.expiresAt).getTime() / 1000 - now.value)
  if (r <= 0) return '已超时'
  if (r >= 60) return `${Math.floor(r / 60)}分${r % 60}秒`
  return `${r}秒`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  try {
    const result = await getPendingAssistantBookingsV2()
    bookings.value = result || []
  } catch { bookings.value = [] }
}

function handleAcceptClick(b: PendingAssistantBooking) {
  confirmTarget.value = b
}

async function handleAccept(b: PendingAssistantBooking) {
  confirmTarget.value = null
  processingItem.value = b.itemId
  try {
    await acceptAssistantBooking({ item_id: b.itemId })
    bookings.value = bookings.value.filter(x => x.itemId !== b.itemId)
    uni.showToast({ title: '已处理', icon: 'success' })
    emit('updated')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || '操作失败', icon: 'none' })
  } finally {
    processingItem.value = null
  }
}

async function handleIgnore(itemId: string) {
  bookings.value = bookings.value.filter(x => x.itemId !== itemId)
  try { await cancelOrderItem({ item_id: itemId }) } catch {}
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadData, 10000)
  tickTimer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; background: #fff1f2; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; font-weight: 700; }
.count-badge.rose { background: #fecdd3; color: #9f1239; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.booking-item { padding: 24rpx; margin-bottom: 12rpx; border-radius: 12rpx; background: #fff; border: 1rpx solid #f3f4f6; }
.booking-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.booking-table { display: flex; align-items: center; gap: 6rpx; }
.booking-icon { font-size: 24rpx; }
.booking-name { font-size: 28rpx; font-weight: 700; color: #1f2937; }
.booking-actions { display: flex; align-items: center; gap: 8rpx; }
.booking-countdown { font-size: 22rpx; color: #d97706; font-weight: 600; font-variant-numeric: tabular-nums; }
.btn-accept { padding: 10rpx 22rpx; background: #e11d48; color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
.btn-accept[disabled] { opacity: 0.5; }
.btn-skip { padding: 10rpx 22rpx; background: #e5e7eb; color: #6b7280; border-radius: 10rpx; font-size: 24rpx; border: none; }
.btn-skip[disabled] { opacity: 0.3; }
.booking-sub { display: flex; gap: 16rpx; font-size: 24rpx; color: #6b7280; padding-left: 30rpx; }
.confirm-dialog { position: fixed; inset: 0; margin: auto; width: 560rpx; height: fit-content; background: #fff; border-radius: 32rpx; padding: 48rpx 32rpx; text-align: center; z-index: 1102; box-shadow: 0 20rpx 60rpx rgba(0,0,0,.3); }
.confirm-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.confirm-title { display: block; font-size: 32rpx; font-weight: 700; color: #111827; margin-bottom: 12rpx; }
.confirm-desc { display: block; font-size: 26rpx; color: #6b7280; margin-bottom: 8rpx; }
.confirm-hint { display: block; font-size: 22rpx; color: #d97706; margin-bottom: 32rpx; }
.confirm-actions { display: flex; gap: 16rpx; }
.btn-cancel { flex: 1; padding: 22rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-ok { flex: 1; padding: 22rpx; background: #e11d48; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/AssistantReminderModal.vue
git commit -m "feat(table): add AssistantReminderModal with accept/ignore + confirmation dialog"
```

---

### Task 6: CouponOpenModal — 套餐验券开台

**文件:** 新建 `src/pages/table/components/CouponOpenModal.vue`

- [ ] **Step 1: 创建 CouponOpenModal.vue**

```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">套餐验券开台</text>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <!-- 成功页面 -->
        <view v-if="done" class="success-section">
          <view class="success-icon">✅</view>
          <text class="success-title">开台成功</text>
          <view class="success-info">
            <view class="info-row"><text>订单号</text><text>{{ done.order_no || '' }}</text></view>
            <view class="info-row"><text>套餐</text><text>{{ selectedPkg?.name }}</text></view>
            <view class="info-row"><text>时长</text><text class="emerald">{{ selectedPkg?.duration_hours }}小时</text></view>
          </view>
          <view class="success-actions">
            <button class="btn-outline" @click="reset">继续验券</button>
            <button class="btn-done" @click="$emit('close')">完成</button>
          </view>
        </view>

        <!-- 加载中 -->
        <view v-else-if="loading" class="center-hint"><text>加载中...</text></view>

        <!-- 无可选套餐 -->
        <view v-else-if="packages.length === 0" class="center-hint">
          <text class="hint-icon">🎫</text>
          <text class="hint-text">暂无可用的套餐券</text>
        </view>

        <!-- 选择流程 -->
        <template v-else>
          <!-- Step 1: 选择套餐券 -->
          <view class="step-label">选择套餐券</view>
          <view v-for="pkg in packages" :key="pkg.id" class="pkg-item"
            :class="{ selected: selectedPkg?.id === pkg.id }"
            @click="selectPkg(pkg)">
            <text class="pkg-name">{{ pkg.name }}</text>
            <view class="pkg-meta">
              <text>⏱ {{ pkg.duration_hours }}小时</text>
              <text>💰 ¥{{ pkg.price }}</text>
              <text v-if="pkg.original_price > 0" class="pkg-original">¥{{ pkg.original_price }}</text>
            </view>
          </view>

          <!-- Step 2: 选择空闲台桌 + 人数 -->
          <template v-if="selectedPkg">
            <view class="step-label">选择空闲台桌</view>
            <view v-if="idleTables.length === 0" class="empty-tip">暂无可用的空闲台桌</view>
            <view v-else class="table-grid">
              <view v-for="t in idleTables" :key="t.id" class="table-chip"
                :class="{ selected: selectedTableId === t.id }"
                @click="selectedTableId = t.id">
                {{ t.name || t.number || t.id }}
              </view>
            </view>

            <view class="step-label">选择人数</view>
            <view class="player-row">
              <view v-for="n in 6" :key="n" class="player-chip"
                :class="{ selected: playerCount === n }"
                @click="playerCount = n">{{ n }}人</view>
            </view>

            <view v-if="error" class="error-msg">{{ error }}</view>

            <button class="btn-submit" :disabled="submitting || !selectedTableId"
              @click="handleConfirm">
              {{ submitting ? '开台中...' : `确认开台 · ¥${selectedPkg.price}` }}
            </button>
          </template>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getCouponPackageList, confirmInternalCoupon, type CouponPackage } from '@/api/modules/coupon'
import { getTableList } from '@/api/modules/table'
import type { Table } from '@/api/modules/table'

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'opened'])

interface CouponPackageWithId extends CouponPackage { id: string }

const packages = ref<CouponPackageWithId[]>([])
const selectedPkg = ref<CouponPackageWithId | null>(null)
const idleTables = ref<Table[]>([])
const selectedTableId = ref('')
const playerCount = ref(2)
const loading = ref(true)
const submitting = ref(false)
const done = ref<Record<string, unknown> | null>(null)
const error = ref('')

async function loadPackages() {
  loading.value = true
  try {
    const result = await getCouponPackageList()
    const list = (result?.lists || result?.data || []) as CouponPackageWithId[]
    packages.value = list
  } catch { packages.value = [] }
  finally { loading.value = false }
}

async function selectPkg(pkg: CouponPackageWithId) {
  selectedPkg.value = pkg
  selectedTableId.value = ''
  error.value = ''
  // 加载空闲台桌
  try {
    const result = await getTableList({ status: 'idle', page_size: 100 })
    idleTables.value = (result?.data || []).filter((t: Table) => t.status === 'idle')
  } catch { idleTables.value = [] }
}

async function handleConfirm() {
  if (!selectedPkg.value || !selectedTableId.value) return
  submitting.value = true
  error.value = ''
  try {
    const result = await confirmInternalCoupon({
      package_id: selectedPkg.value.id,
      table_id: selectedTableId.value,
      player_count: playerCount.value,
    })
    done.value = result
    emit('opened')
  } catch (e: any) {
    error.value = e?.msg || e?.message || '开台失败'
  } finally {
    submitting.value = false
  }
}

function reset() {
  selectedPkg.value = null
  selectedTableId.value = ''
  done.value = null
  error.value = ''
}

defineExpose({ loadPackages })
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.step-label { font-size: 26rpx; color: #6b7280; margin: 20rpx 0 12rpx; }
.pkg-item { padding: 24rpx; margin-bottom: 12rpx; border-radius: 16rpx; border: 2rpx solid #e5e7eb; background: #f9fafb; }
.pkg-item.selected { border-color: #059669; background: #ecfdf5; }
.pkg-name { display: block; font-size: 28rpx; font-weight: 600; color: #111827; margin-bottom: 8rpx; }
.pkg-meta { display: flex; gap: 16rpx; font-size: 24rpx; color: #6b7280; }
.pkg-original { text-decoration: line-through; color: #d1d5db; }
.table-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.table-chip { padding: 18rpx; border-radius: 12rpx; border: 2rpx solid #e5e7eb; text-align: center; font-size: 26rpx; font-weight: 500; color: #374151; background: #f9fafb; }
.table-chip.selected { border-color: #059669; background: #ecfdf5; color: #059669; font-weight: 700; }
.player-row { display: flex; gap: 12rpx; }
.player-chip { width: 80rpx; height: 80rpx; border-radius: 50%; border: 2rpx solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 500; color: #374151; background: #f9fafb; }
.player-chip.selected { border-color: #059669; background: #059669; color: #fff; font-weight: 700; }
.empty-tip { color: #d97706; font-size: 26rpx; }
.error-msg { color: #ef4444; font-size: 24rpx; margin-top: 16rpx; }
.btn-submit { width: 100%; margin-top: 28rpx; padding: 30rpx; background: #059669; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
.btn-submit[disabled] { background: #d1d5db; }
/* success */
.success-section { text-align: center; padding: 48rpx 0; }
.success-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.success-title { display: block; font-size: 36rpx; font-weight: 700; color: #059669; margin-bottom: 32rpx; }
.success-info { background: #f9fafb; border-radius: 16rpx; padding: 24rpx; text-align: left; margin-bottom: 32rpx; }
.info-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #6b7280; }
.info-row .emerald { color: #059669; font-weight: 600; }
.success-actions { display: flex; gap: 16rpx; }
.btn-outline { flex: 1; padding: 24rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-done { flex: 1; padding: 24rpx; background: #059669; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 600; border: none; }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/CouponOpenModal.vue
git commit -m "feat(table): add CouponOpenModal with 3-step package→table→player flow"
```

---

### Task 7: CheckoutModal — 现金一键结算

**文件:** 新建 `src/pages/table/components/CheckoutModal.vue`

- [ ] **Step 1: 创建 CheckoutModal.vue**

```vue
<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">结账 · {{ tableName }}</text>
        <text v-if="durationStr" class="modal-sub">已用 {{ durationStr }}</text>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="billLoading" class="center-hint"><text>加载中...</text></view>
        <template v-else>
          <!-- 应收总额 -->
          <view class="total-card">
            <text class="total-label">应收总额</text>
            <text class="total-amount">¥{{ total.toFixed(2) }}</text>
          </view>

          <!-- 套餐券信息 -->
          <view v-if="hasPrepaid" class="coupon-card">
            <text class="coupon-title">🎫 套餐券: {{ billData.couponPackageName || '套餐' }} ¥{{ billData.couponPrice || 0 }}</text>
            <text class="coupon-detail">预付{{ billData.prepaidHours || 0 }}小时 · 剩余{{ Math.max(0, billData.remainingMinutes || 0) }}分钟 · 台费 ¥0</text>
          </view>

          <!-- 费用明细 -->
          <view class="fee-breakdown">
            <view class="fee-row"><text>台费</text><text>¥{{ tableFee.toFixed(2) }}</text></view>
            <view v-if="mergeFee > 0" class="fee-row"><text>并入台费</text><text>¥{{ mergeFee.toFixed(2) }}</text></view>
            <view class="fee-row"><text>商品费</text><text>¥{{ productFee.toFixed(2) }}</text></view>
            <view v-if="assistantFee > 0" class="fee-row"><text>助教费(已完成)</text><text>¥{{ assistantFee.toFixed(2) }}</text></view>
            <view v-if="chargingFee > 0" class="fee-row"><text>充电费</text><text>¥{{ chargingFee.toFixed(2) }}</text></view>
          </view>

          <!-- 会员信息 -->
          <view v-if="memberInfo" class="member-card">
            <text>👤 {{ memberInfo.name }} · 余额 ¥{{ memberInfo.balance || 0 }}</text>
          </view>

          <!-- 现金结算按钮 -->
          <button class="btn-cash" :disabled="processing || total <= 0" @click="handleCashCheckout">
            {{ processing ? '结算中...' : `现金结算 ¥${total.toFixed(2)}` }}
          </button>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getCurrentOrder, checkoutOrder } from '@/api/modules/table'
import type { Bill } from '@/api/modules/table'

const props = defineProps<{ visible: boolean; tableId: string; tableName: string }>()
const emit = defineEmits(['close', 'completed'])

interface BillData {
  id?: string
  startTime?: string; start_time?: string
  durationMinutes?: number; duration_minutes?: number
  tableFee?: number; table_fee?: number
  mergeFee?: number; merge_fee?: number
  productFee?: number; product_fee?: number
  assistantFee?: number; assistant_fee?: number
  chargingFee?: number; charging_fee?: number
  prepaidHours?: number; prepaid_hours?: number
  couponPrice?: number; coupon_price?: number
  couponPackageName?: string; coupon_package_name?: string
  remainingMinutes?: number; remaining_minutes?: number
  memberInfo?: { name?: string; phone?: string; balance?: number; points?: number; levelName?: string }
  member_info?: { name?: string; phone?: string; balance?: number; points?: number }
  items?: any[]
}

const billData = ref<BillData | null>(null)
const billLoading = ref(true)
const processing = ref(false)

const tableFee = computed(() => billData.value?.tableFee || billData.value?.table_fee || 0)
const productFee = computed(() => billData.value?.productFee || billData.value?.product_fee || 0)
const assistantFee = computed(() => billData.value?.assistantFee || billData.value?.assistant_fee || 0)
const chargingFee = computed(() => billData.value?.chargingFee || billData.value?.charging_fee || 0)
const mergeFee = computed(() => billData.value?.mergeFee || billData.value?.merge_fee || 0)
const total = computed(() => tableFee.value + productFee.value + assistantFee.value + chargingFee.value + mergeFee.value)
const hasPrepaid = computed(() => (billData.value?.prepaidHours || billData.value?.prepaid_hours || 0) > 0)
const memberInfo = computed(() => billData.value?.memberInfo || billData.value?.member_info || null)
const durationStr = computed(() => {
  const d = billData.value?.durationMinutes || billData.value?.duration_minutes || 0
  if (!d) return ''
  return `${Math.floor(d / 60)}小时${d % 60}分`
})

async function loadBill() {
  if (!props.tableId) return
  billLoading.value = true
  try {
    const data = await getCurrentOrder(props.tableId) as unknown as BillData
    billData.value = data
  } catch { billData.value = null }
  finally { billLoading.value = false }
}

watch(() => props.visible, (v) => { if (v) loadBill() })

async function handleCashCheckout() {
  if (processing.value || total.value <= 0) return
  const oid = billData.value?.id || ''
  if (!oid) {
    uni.showToast({ title: '获取订单信息失败', icon: 'none' })
    return
  }
  processing.value = true
  try {
    await checkoutOrder({
      order_id: oid,
      cash_paid: total.value,
      pay_type: 'cash',
      pay_amount: total.value,
    })
    uni.showToast({ title: '结账成功', icon: 'success' })
    emit('completed')
    emit('close')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '结账失败', icon: 'none' })
  } finally {
    processing.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; background: linear-gradient(135deg, #059669, #10b981); }
.modal-title { display: block; font-size: 32rpx; font-weight: 700; color: #fff; }
.modal-sub { display: block; font-size: 22rpx; color: rgba(255,255,255,.7); margin-top: 4rpx; }
.modal-close { position: absolute; top: 28rpx; right: 28rpx; font-size: 32rpx; color: rgba(255,255,255,.8); }
.modal-body { flex: 1; overflow-y: auto; padding: 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { text-align: center; padding: 80rpx 0; color: #9ca3af; }
.total-card { text-align: center; padding: 40rpx; background: #ecfdf5; border-radius: 24rpx; margin-bottom: 16rpx; }
.total-label { display: block; font-size: 26rpx; color: #059669; margin-bottom: 12rpx; }
.total-amount { font-size: 64rpx; font-weight: 700; color: #059669; }
.coupon-card { background: #fef3c7; border: 2rpx solid #fcd34d; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; }
.coupon-title { display: block; font-size: 26rpx; font-weight: 700; color: #92400e; }
.coupon-detail { display: block; font-size: 22rpx; color: #a16207; margin-top: 4rpx; }
.fee-breakdown { background: #f9fafb; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; }
.fee-row { display: flex; justify-content: space-between; padding: 12rpx 0; font-size: 26rpx; color: #6b7280; border-bottom: 1rpx solid #f3f4f6; }
.fee-row:last-child { border-bottom: none; }
.member-card { background: #eff6ff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 16rpx; font-size: 26rpx; color: #1e40af; }
.btn-cash { width: 100%; padding: 32rpx; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border-radius: 16rpx; font-size: 32rpx; font-weight: 700; border: none; }
.btn-cash[disabled] { opacity: 0.5; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/CheckoutModal.vue
git commit -m "feat(table): add CheckoutModal with cash one-click payment flow"
```

---

### Task 8: 改造 index.vue — 集成 QuickActions + 弹窗

**文件:** 修改 `src/pages/table/index.vue`

- [ ] **Step 1: 替换 ShortcutBar 为 QuickActions，添加弹窗组件**

将 `index.vue` template 中的：
```html
<ShortcutBar @pending-products="handlePendingProducts" @pending-assistants="handlePendingAssistants" @stats="handleShortcutStats" />
```
替换为：
```html
<QuickActions
  @open-table-requests="showOpenTableRequests = true"
  @order-reminder="showOrderReminder = true"
  @assistant-reminder="showAssistantReminder = true"
  @coupon-open="handleCouponOpen"
/>
```

在 `</view>` (TabBar之前) 之前添加弹窗组件：
```html
<OpenTableRequestsModal :visible="showOpenTableRequests" @close="showOpenTableRequests = false" @resolved="onRefresh" />
<OrderReminderModal :visible="showOrderReminder" @close="showOrderReminder = false" @updated="onRefresh" />
<AssistantReminderModal :visible="showAssistantReminder" @close="showAssistantReminder = false" @updated="onRefresh" />
<CouponOpenModal ref="couponOpenRef" :visible="showCouponModal" @close="showCouponModal = false" @opened="onRefresh" />
```

- [ ] **Step 2: 更新 script 导入和状态**

在 imports 中：
```typescript
// 移除: import ShortcutBar from './components/ShortcutBar.vue'
// 添加:
import QuickActions from './components/QuickActions.vue'
import OpenTableRequestsModal from './components/OpenTableRequestsModal.vue'
import OrderReminderModal from './components/OrderReminderModal.vue'
import AssistantReminderModal from './components/AssistantReminderModal.vue'
import CouponOpenModal from './components/CouponOpenModal.vue'
```

更新状态：
```typescript
// 移除: showStatsPopup, 与 ShortcutBar 相关的 handler
// 添加:
const showOpenTableRequests = ref(false)
const showOrderReminder = ref(false)
const showAssistantReminder = ref(false)
const couponOpenRef = ref<InstanceType<typeof CouponOpenModal> | null>(null)

// 删除 handlePendingProducts, handlePendingAssistants, handleShortcutStats 函数
// 删除 handleCouponOpen 中的 loadCouponPackages 调用（改为在 CouponOpenModal 的 expose 中调用）
```

添加新的 handler：
```typescript
function handleCouponOpen() {
  showCouponModal.value = true
  // 触发 CouponOpenModal 加载数据
  setTimeout(() => { couponOpenRef.value?.loadPackages() }, 100)
}
```

- [ ] **Step 3: 更新 onShow — 移除每次都重新加载**

`onShow` 中的 `loadTables(true)` + `loadStats()` 保持不变，但确保不重复创建轮询定时器。

- [ ] **Step 4: Commit**

```bash
git add src/pages/table/index.vue
git commit -m "feat(table): integrate QuickActions + 4 modals into table index page"
```

---

### Task 9: 重写 detail.vue 账单结构 — 对齐 TableDrawer

**文件:** 重写 `src/pages/table/detail.vue`

- [ ] **Step 1: 重写 detail.vue**

关键改动：
1. **10秒轮询 `getCurrentOrder`**（而非 30 秒）
2. **重写费用卡片**：显示 total = tableFee + mergeFee + productFee + assistantFee + chargingFee，副标题含时段系数/会员折扣/预付标签
3. **台费明细区域**：开台时间、已用时长、预付时长、时段系数、并台转入台费、会员折扣
4. **商品明细**：pending/processing/delivered 状态 + 确认接单/送达/取消按钮
5. **助教明细**：pending/processing/serving/completed 状态 + 实时计时 + 按钮
6. **充电费用**：条件显示
7. **结账按钮**：弹出 CheckoutModal 而非导航到 checkout 页面

完整代码参见规格文档的 2.2 节页面结构。由于代码较长（~500 行），实际实现时请直接参考规格文档和 wwwpos TableDrawer.tsx。

- [ ] **Step 2: 修改结账逻辑**

删除 `handleCheckout` 中的 `uni.navigateTo`，改为：
```typescript
const showCheckoutModal = ref(false)

function handleCheckout() {
  showCheckoutModal.value = true
}
```

在 template 最底部添加：
```html
<CheckoutModal :visible="showCheckoutModal" :table-id="tableId" :table-name="tableName"
  @close="showCheckoutModal = false"
  @completed="handleCheckoutCompleted" />
```

```typescript
function handleCheckoutCompleted() {
  uni.showModal({
    title: '结账成功',
    content: '台桌已关闭',
    showCancel: false,
    success: () => { uni.navigateBack() }
  })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/table/detail.vue
git commit -m "feat(table): rewrite detail.vue billing structure to match POS TableDrawer"
```

---

### Task 10: 修改 ProductPanel + AssistantPanel — 对齐状态工作流

**文件:**
- 修改: `src/pages/table/components/ProductPanel.vue`
- 修改: `src/pages/table/components/AssistantPanel.vue`

- [ ] **Step 1: 修改 ProductPanel — 添加确认接单按钮**

当前 ProductPanel 只有 deliver/remove 两个按钮。需要为 `pending` 状态添加"确认接单"按钮：

```typescript
// 在 ProductPanel 的 item 操作中添加状态判断
// pending → 显示 [确认接单] [取消]
// processing → 显示 [送达]
// delivered → 无按钮（已完成）
```

具体代码：在 item 渲染模板中按 status 条件渲染按钮。

- [ ] **Step 2: 修改 AssistantPanel — 添加实时计时**

为 `serving` 状态的助教添加实时计时显示（HH:MM:SS 格式）：

```typescript
const now = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => { tickTimer = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => { if (tickTimer) clearInterval(tickTimer) })

function getServingDuration(startedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/table/components/ProductPanel.vue src/pages/table/components/AssistantPanel.vue
git commit -m "fix(table): align ProductPanel and AssistantPanel status workflow with POS"
```

---

### Task 11: 修改 BillPanel — 扩展费用明细

**文件:** 修改 `src/pages/table/components/BillPanel.vue`

- [ ] **Step 1: 扩展 BillPanel 显示字段**

添加：
- 台费明细行：开台时间、已用时长、时段系数、预付时长
- 并台转入台费（mergeFee > 0 时显示）
- 会员折扣标签

具体参考规格文档 2.2 节"台费明细"结构。

- [ ] **Step 2: Commit**

```bash
git add src/pages/table/components/BillPanel.vue
git commit -m "feat(table): expand BillPanel with time period coefficient and prepaid display"
```

---

### Task 12: 最终验证 + 清理

- [ ] **Step 1: 验证构建通过**

```bash
cd d:/wwwroot/wwwbilliards/www/wwwstoreapp
pnpm build:h5
```
确认无编译错误。

- [ ] **Step 2: 清理未使用的旧文件**

移除或标记为 deprecated：
- `src/pages/table/components/ShortcutBar.vue`
- `src/pages/table/checkout.vue`（由 CheckoutModal 替代）
- `src/pages/table/pending-products.vue`（由 OrderReminderModal 替代）
- `src/pages/table/pending-assistants.vue`（由 AssistantReminderModal 替代）

```bash
git rm src/pages/table/components/ShortcutBar.vue
git rm src/pages/table/checkout.vue
git rm src/pages/table/pending-products.vue
git rm src/pages/table/pending-assistants.vue
```

- [ ] **Step 3: 更新 pages.json 移除已删除页面的路由**

从 `pages.json` 中移除以下条目：
```json
{ "path": "pages/table/checkout", ... },
{ "path": "pages/table/pending-products", ... },
{ "path": "pages/table/pending-assistants", ... }
```

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "chore(table): remove deprecated pages (checkout, pending-products, pending-assistants replaced by modals)"
```

---

## 验证清单

1. `pnpm build:h5` 构建成功无错误
2. 台桌列表页：QuickActions 四个入口显示 + 轮询计数正常
3. 开台申请弹窗：5 秒轮询、确认/拒绝操作正常
4. 点单提醒弹窗：10 秒轮询、送达确认对话框、忽略操作正常
5. 上桌提醒弹窗：10 秒轮询、处理确认对话框、忽略操作正常
6. 套餐验券弹窗：三步流程完整可走通
7. 台桌账单页：10 秒轮询 getCurrentOrder、费用与服务端一致、状态工作流正确
8. 换台：选 idle 桌 → 确认 → 成功
9. 并台：选 occupied 桌 → 确认 → 成功
10. 结账：弹窗显示费用明细 → 现金结算按钮 → 结账成功关台
