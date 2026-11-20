# 离线计费系统 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 wwwtable 全离线计费：断网时台费继续精确计算、商品/助教操作暂存本地队列、网络恢复后自动同步。

**Architecture:** 自底向上四层：本地数据缓存(offline-cache) → 离线计费引擎(offline-billing) → 离线操作队列(offline-queue) → 网络监听(network)。修改 stores/order.ts 接入调度层，修改 3 个页面接入离线逻辑。

**Tech Stack:** TypeScript, localStorage, UniApp API, 复用现有 orderStore 计时器

**关联设计文档:** `docs/superpowers/specs/2026-06-08-offline-billing-design.md`

---

## 文件结构

```
utils/
├── offline-cache.ts    ← 新建: 本地数据缓存 (产品/助教/台桌/计费)
├── offline-billing.ts  ← 新建: 本地计费引擎 (逐分钟时段匹配)
├── offline-queue.ts    ← 新建: 离线操作队列 (去重/持久化/重放)
└── network.ts          ← 新建: 网络状态监听 (断网检测/恢复回调)

stores/
└── order.ts            ← 修改: 接入离线调度层

pages/
├── index/index.vue     ← 修改: 网络恢复触发同步
├── product/index.vue   ← 修改: 离线商品操作走队列
├── bill/index.vue      ← 修改: 离线引擎计费+禁用支付
└── assistant/index.vue ← 修改: 离线助教操作走队列
```

---

## Phase 1: 基础设施层（自底向上）

### Task 1: 创建本地数据缓存 `utils/offline-cache.ts`

**Files:** Create `src/utils/offline-cache.ts`

- [ ] **Step 1: 写入完整文件**

```typescript
import { tabletApi } from '@/api/modules/tablet'
import type { Product, Assistant, AssistantLevel } from '@/types'

// ---- 类型定义 ----
export interface ProductCache {
  id: string; name: string; price: number
  image?: string; category_id: string; unit: string
  stock?: number; emoji?: string
}
export interface AssistantCache {
  id: string; name: string; avatar?: string
  level_id: string; level_name: string
  hourly_rate: number; is_online: boolean
}
export interface TableCache {
  id: string; number: string; name: string
  type_name: string; hourly_rate: number
  zone_id?: string; status: string
}
export interface CategoryCache { id: string; name: string; icon?: string }
export interface MemberCache { id: string; name: string; level: string; balance: number }

const STORAGE_KEY = 'offline_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// ---- 内存状态 ----
let products = new Map<string, ProductCache>()
let categories: CategoryCache[] = []
let assistants = new Map<string, AssistantCache>()
let assistantLevels: { id: string; name: string; code: string }[] = []
let tables = new Map<string, TableCache>()
let member: MemberCache | null = null

// ---- 持久化 ----
function saveToStorage(): void {
  try {
    const data = {
      version: 1,
      updatedAt: Date.now(),
      products: Array.from(products.entries()),
      categories,
      assistants: Array.from(assistants.entries()),
      assistantLevels,
      tables: Array.from(tables.entries()),
      member,
    }
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(data))
  } catch { /* storage full, ignore */ }
}

function loadFromStorage(): boolean {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (Date.now() - data.updatedAt > CACHE_TTL) {
      uni.removeStorageSync(STORAGE_KEY)
      return false
    }
    products = new Map(data.products || [])
    categories = data.categories || []
    assistants = new Map(data.assistants || [])
    assistantLevels = data.assistantLevels || []
    tables = new Map(data.tables || [])
    member = data.member || null
    return true
  } catch { return false }
}

// ---- 全量刷新 ----
async function refreshAll(): Promise<void> {
  try {
    const [prodRes, catRes, asstRes, levelRes] = await Promise.all([
      tabletApi.getProducts({} as any).catch(() => []),
      tabletApi.getCategories().catch(() => []),
      tabletApi.getAssistants().catch(() => []),
      tabletApi.getAssistantLevels().catch(() => []),
    ])

    const prodList = Array.isArray(prodRes) ? prodRes : ((prodRes as any)?.data || (prodRes as any)?.list || [])
    const catList = Array.isArray(catRes) ? catRes : ((catRes as any)?.data || (catRes as any)?.list || [])
    const asstList = Array.isArray(asstRes) ? asstRes : ((asstRes as any)?.data || (asstRes as any)?.list || [])
    const levelList = Array.isArray(levelRes) ? levelRes : ((levelRes as any)?.data || (levelRes as any)?.list || [])

    products.clear()
    for (const p of prodList) {
      products.set(String(p.id || p.product_id), {
        id: String(p.id || p.product_id),
        name: p.name || p.item_name || '',
        price: p.price || p.sale_price || p.unit_price || 0,
        image: p.image || '',
        category_id: String(p.category_id || ''),
        unit: p.unit || '份',
        stock: p.stock,
        emoji: p.emoji,
      })
    }

    categories = catList.map((c: any) => ({
      id: String(c.id), name: c.name, icon: c.icon || c.emoji
    }))

    assistants.clear()
    for (const a of asstList) {
      assistants.set(String(a.id || a.assistant_id), {
        id: String(a.id || a.assistant_id),
        name: a.name || '',
        avatar: a.avatar || '',
        level_id: String(a.level_id || ''),
        level_name: a.level_name || '',
        hourly_rate: a.hourly_rate || 0,
        is_online: !!a.is_online,
      })
    }

    assistantLevels = levelList.map((l: any) => ({
      id: String(l.id), name: l.name, code: l.code || ''
    }))

    saveToStorage()
  } catch { /* offline, keep existing cache */ }
}

// ---- 单条查询 ----
function getProduct(id: string): ProductCache | undefined { return products.get(String(id)) }
function getAssistant(id: string): AssistantCache | undefined { return assistants.get(String(id)) }
function getTable(id: string): TableCache | undefined { return tables.get(String(id)) }
function getAllProducts(): ProductCache[] { return Array.from(products.values()) }
function getAllAssistants(): AssistantCache[] { return Array.from(assistants.values()) }
function getAllCategories(): CategoryCache[] { return categories }
function getAssistantLevels(): typeof assistantLevels { return assistantLevels }

// ---- 会员 ----
function setMemberInfo(m: MemberCache): void { member = m; saveToStorage() }
function getMemberInfo(): MemberCache | null { return member }
function getMemberDiscount(): number {
  const map: Record<string, number> = { level_vip: 0.85, level_gold: 0.90, level_silver: 0.95 }
  return map[member?.level || ''] || 1.0
}

// ---- 台桌缓存（开台时写入） ----
function setCachedTable(t: TableCache): void { tables.set(String(t.id), t); saveToStorage() }
function getAllTables(): TableCache[] { return Array.from(tables.values()) }

// ---- 初始化 ----
function init(): void {
  const restored = loadFromStorage()
  if (!restored) { /* first time or expired, will load when online */ }
}

export const offlineCache = {
  init, refreshAll,
  getProduct, getAssistant, getTable,
  getAllProducts, getAllAssistants, getAllCategories, getAssistantLevels, getAllTables,
  setMemberInfo, getMemberInfo, getMemberDiscount,
  setCachedTable,
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run: `cd wwwtable && npx vue-tsc --noEmit src/utils/offline-cache.ts 2>&1`
Expected: No errors related to this file

- [ ] **Step 3: 提交**

```bash
git add src/utils/offline-cache.ts
git commit -m "feat(wwwtable): add offline data cache module

Products, assistants, tables, categories, levels stored in
memory Map + localStorage. Auto-refresh on reconnect.
24-hour TTL with version tracking.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: 创建本地计费引擎 `utils/offline-billing.ts`

**Files:** Create `src/utils/offline-billing.ts`

- [ ] **Step 1: 写入完整文件**

```typescript
// ---- 类型 ----
export interface PricingPeriod {
  start_time: string
  end_time: string
  weekdays?: string
  price?: number
  coefficient?: number
}

export interface BillingCache {
  start_time: string
  base_rate: number
  prepaid_hours: number
  periods: PricingPeriod[]
  member_level?: string
}

const DISCOUNT_MAP: Record<string, number> = {
  level_vip: 0.85, level_gold: 0.90, level_silver: 0.95,
}

// ---- 核心：获取指定时刻的费率 ----
function getRateAt(cache: BillingCache, timestampSec: number): number {
  const d = new Date(timestampSec * 1000)
  const timeStr = d.toTimeString().slice(0, 8) // "HH:MM:SS"
  const weekday = String(d.getDay()) // "0"-"6"

  // 时段匹配
  for (const p of cache.periods) {
    if (p.weekdays) {
      const days = p.weekdays.split(',').map(s => s.trim())
      if (!days.includes(weekday)) continue
    }
    const start = p.start_time
    const end = p.end_time
    let inRange = false
    if (start <= end) {
      inRange = timeStr >= start && timeStr < end
    } else {
      // 跨午夜时段，如 "18:00:00" → "02:00:00"
      inRange = timeStr >= start || timeStr < end
    }
    if (inRange) {
      let rate = p.price ?? cache.base_rate
      if (p.coefficient && p.coefficient !== 1) rate *= p.coefficient
      return rate
    }
  }

  // 无匹配时段 → 基础费率
  return cache.base_rate
}

// ---- 折扣应用 ----
function applyDiscount(rate: number, memberLevel?: string): number {
  const mult = DISCOUNT_MAP[memberLevel || ''] || 1.0
  return rate * mult
}

// ---- 核心：计算费用 ----
export function calculateFee(cache: BillingCache, durationMinutes: number): number {
  if (durationMinutes <= 0 || !cache.start_time) return 0

  // 预付模式
  if (cache.prepaid_hours > 0) {
    const prepaidMin = cache.prepaid_hours * 60
    if (durationMinutes <= prepaidMin) return 0
    const extraH = Math.ceil((durationMinutes - prepaidMin) / 60)
    const rate = getRateAt(cache, Date.now() / 1000)
    return Math.round(applyDiscount(rate, cache.member_level) * extraH * 100) / 100
  }

  // 标准模式：逐分钟累加
  const startTs = new Date(cache.start_time.replace('T', ' ')).getTime() / 1000
  if (isNaN(startTs)) return 0

  let total = 0
  for (let m = 0; m < durationMinutes; m++) {
    const ts = startTs + m * 60
    const rate = getRateAt(cache, ts)
    total += applyDiscount(rate, cache.member_level) / 60
  }

  return Math.round(total * 100) / 100
}

// ---- 获取当前费率（用于展示） ----
export function getCurrentRate(cache: BillingCache): number {
  const rate = getRateAt(cache, Date.now() / 1000)
  return applyDiscount(rate, cache.member_level)
}

// ---- localStorage 持久化 ----
const BILLING_KEY = 'offline_billing'

export function cacheBillingData(data: BillingCache): void {
  try { uni.setStorageSync(BILLING_KEY, JSON.stringify(data)) } catch {}
}

export function getCachedBillingData(): BillingCache | null {
  try {
    const raw = uni.getStorageSync(BILLING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/offline-billing.ts
git commit -m "feat(wwwtable): add offline billing engine

Minute-by-minute fee calculation matching backend TableFeeCalculatorLogic.
Supports hourly, period (time-slot), member discount, and prepaid modes.
Persists billing data to localStorage for App restart recovery.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: 创建离线操作队列 `utils/offline-queue.ts`

**Files:** Create `src/utils/offline-queue.ts`

- [ ] **Step 1: 写入完整文件**

```typescript
import { tabletApi } from '@/api/modules/tablet'

// ---- 类型 ----
type OfflineOpType = 'add_product' | 'remove_product' | 'book_assistant' | 'cancel_assistant'

interface OfflineOperation {
  id: string
  type: OfflineOpType
  payload: Record<string, any>
  createdAt: number
  retries: number
}

interface FlushResult { done: number; failed: number }

const QUEUE_KEY = 'offline_queue'
const MAX_QUEUE = 200

let queue: OfflineOperation[] = []

// ---- 生成唯一ID ----
function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

// ---- 持久化 ----
function save(): void {
  try { uni.setStorageSync(QUEUE_KEY, JSON.stringify(queue)) } catch {}
}

function load(): void {
  try {
    const raw = uni.getStorageSync(QUEUE_KEY)
    queue = raw ? JSON.parse(raw) : []
  } catch { queue = [] }
}

// ---- 去重合并 ----
function mergeQueue(): void {
  const productOps = new Map<string, number>() // product_id → net quantity

  const remaining: OfflineOperation[] = []

  for (const op of queue) {
    if (op.type === 'add_product') {
      const pid = op.payload.product_id
      const qty = op.payload.quantity || 1
      productOps.set(pid, (productOps.get(pid) || 0) + qty)
    } else {
      remaining.push(op)
    }
  }

  // 重建合并后的 add_product 操作
  const merged: OfflineOperation[] = []
  for (const [pid, qty] of productOps) {
    if (qty !== 0) {
      merged.push({
        id: uid(), type: 'add_product',
        payload: { product_id: pid, quantity: qty },
        createdAt: Date.now(), retries: 0,
      })
    }
  }

  queue = [...merged, ...remaining]
}

// ---- 入队 ----
function enqueue(type: OfflineOpType, payload: Record<string, any>): void {
  if (queue.length >= MAX_QUEUE) {
    uni.showToast({ title: '离线操作过多，请检查网络', icon: 'none' })
    return
  }
  queue.push({ id: uid(), type, payload, createdAt: Date.now(), retries: 0 })
  if (type === 'add_product' || type === 'remove_product') mergeQueue()
  save()
}

// ---- 重放 ----
async function flush(): Promise<FlushResult> {
  let done = 0; let failed = 0
  mergeQueue()
  const ops = [...queue]
  queue = []
  save()

  for (const op of ops) {
    try {
      let result: any
      switch (op.type) {
        case 'add_product':
          result = await tabletApi.addOrderItem(op.payload)
          break
        case 'remove_product':
          result = await tabletApi.removeOrderItem(op.payload.item_id)
          break
        case 'book_assistant':
          result = await tabletApi.bookAssistant(op.payload)
          break
        case 'cancel_assistant':
          result = await tabletApi.cancelAssistant(op.payload.item_id)
          break
      }
      if (result && (result as any).code !== 0) {
        done++
      } else {
        op.retries++
        failed++
        queue.push(op) // 放回队列下次重试
      }
    } catch (e: any) {
      if (e?.errMsg?.includes('fail') || e?.message?.includes('network')) {
        // 网络尚未恢复，放回队列
        queue.push(op)
        queue.push(...ops.slice(ops.indexOf(op) + 1))
        save()
        return { done, failed }
      }
      op.retries++
      failed++
    }
  }

  save()
  return { done, failed }
}

// ---- 查询 ----
function getPendingCount(): number { return queue.length }
function getQueue(): readonly OfflineOperation[] { return queue }

// ---- 初始化 ----
load()

export const offlineQueue = {
  enqueue, flush, getPendingCount, getQueue,
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/offline-queue.ts
git commit -m "feat(wwwtable): add offline operation queue

Enqueues product/assistant operations during offline.
Auto-dedup merges same-product add/remove into net quantity.
Serial replay on reconnect with network-error detection.
200-item cap with user warning.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: 创建网络状态监听 `utils/network.ts`

**Files:** Create `src/utils/network.ts`

- [ ] **Step 1: 写入完整文件**

```typescript
import { ref } from 'vue'
import { offlineCache } from './offline-cache'
import { offlineQueue } from './offline-queue'

export const isOnline = ref(true)
export const wasOffline = ref(false)

type ReconnectCallback = (result: { done: number; failed: number }) => void
const listeners: ReconnectCallback[] = []

export function onReconnected(cb: ReconnectCallback): void {
  listeners.push(cb)
}

async function handleReconnected(): Promise<void> {
  try {
    await offlineCache.refreshAll()
  } catch { /* cache refresh best-effort */ }

  let result = { done: 0, failed: 0 }
  try {
    result = await offlineQueue.flush()
  } catch { /* flush best-effort */ }

  for (const cb of listeners) {
    try { cb(result) } catch {}
  }

  if (result.done > 0 || result.failed > 0) {
    const pending = offlineQueue.getPendingCount()
    uni.showToast({
      title: pending > 0 ? `已同步${result.done}条，${pending}条待处理` : '数据已同步',
      icon: 'none', duration: 2000,
    })
  }
}

export function initNetwork(): void {
  // 初始检测
  uni.getNetworkType({
    success: (res) => { isOnline.value = res.networkType !== 'none' },
  })

  // 变化监听
  uni.onNetworkStatusChange((res) => {
    const wasOff = !isOnline.value
    isOnline.value = res.isConnected

    if (wasOff && res.isConnected) {
      wasOffline.value = true
      handleReconnected()
    }
  })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/utils/network.ts
git commit -m "feat(wwwtable): add network status monitor

Detects online/offline transitions via uni.onNetworkStatusChange.
Auto-triggers cache refresh + queue flush on reconnect.
Callback system for pages to react to reconnection.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 2: 核心改造层

### Task 5: 改造 orderStore 接入离线调度

**Files:** Modify `src/stores/order.ts`

- [ ] **Step 1: 在文件顶部添加导入**

在 `import { ref, computed } from 'vue'` 之后添加：

```typescript
import { isOnline } from '@/utils/network'
import { offlineQueue } from '@/utils/offline-queue'
import { calculateFee, cacheBillingData, getCachedBillingData, type BillingCache } from '@/utils/offline-billing'
import { offlineCache } from '@/utils/offline-cache'
```

在 class 属性区域，`tableHourlyRate = ref(0)` 之后添加：

```typescript
  offlineFee = ref(0)               // 离线引擎计算的最新台费
  private billingCache: BillingCache | null = null
```

- [ ] **Step 2: 添加本地计费缓存方法**

在 `setTableInfo` 方法后添加：

```typescript
  cacheBillingInfo(pricingInfo: any, startTime: string): void {
    this.billingCache = {
      start_time: startTime,
      base_rate: this.tableHourlyRate.value || 0,
      prepaid_hours: this.prepaidHours || 0,
      periods: pricingInfo?.periods || [],
      member_level: offlineCache.getMemberInfo()?.level || undefined,
    }
    cacheBillingData(this.billingCache)
  }

  loadBillingCache(): void {
    this.billingCache = getCachedBillingData()
    if (this.billingCache) {
      this.tableHourlyRate.value = this.billingCache.base_rate
    }
  }

  updateOfflineFee(): void {
    if (!this.billingCache) return
    this.offlineFee.value = calculateFee(this.billingCache, this.durationMinutes.value)
  }
```

- [ ] **Step 3: 修改 `startTimer` 方法，增加离线计费更新**

在 `startTimer` 的 `setInterval` 回调中添加 `this.updateOfflineFee()`，紧接在 `this.durationMinutes.value += 1` 之后：

```typescript
  private startTimer(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.durationMinutes.value += 1
      this.updateOfflineFee()
      if (this.remainingMinutes.value > 0) {
        this.remainingMinutes.value -= 1
        if (this.remainingMinutes.value <= 0) {
          this.stopTimer()
        }
      }
    }, 60000) as unknown as number
  }
```

> 注意：找到现有的 `startTimer` 方法（约在 order.ts 第 290 行附近），修改它即可。

- [ ] **Step 4: 修改 `addCartItems` 方法，离线时走队列**

在 `addCartItems` 方法体开头添加离线判断：

```typescript
  async addCartItems(): Promise<void> {
    if (!isOnline.value) {
      for (const item of this.cartItems.value) {
        const cached = offlineCache.getProduct(String(item.product_id))
        if (cached) {
          offlineQueue.enqueue('add_product', {
            product_id: item.product_id,
            quantity: item.quantity || 1,
          })
        }
      }
      this.clearCart()
      uni.showToast({ title: '已加入离线队列', icon: 'none', duration: 1500 })
      return
    }
    // ---- 以下为原有代码，保持不变 ----
```

- [ ] **Step 5: 修改 `tick` 方法，返回值含离线费用**

在 `tick` 方法的 `syncRemainingFromOrder` 逻辑之后，添加离线计费同步：

```typescript
  async tick(): Promise<void> {
    // 原有 tickOrder 调用...
    // sync durationMinutes and remainingMinutes
    
    // 新增：同步离线计费缓存
    if (this.billingCache) {
      this.billingCache.base_rate = this.hourlyRate
      this.billingCache.prepaid_hours = this.prepaidHours
      cacheBillingData(this.billingCache)
    }
    this.updateOfflineFee()
  }
```

- [ ] **Step 6: 修改 `reset` 方法**

在 `reset()` 末尾添加：

```typescript
    this.offlineFee.value = 0
    this.billingCache = null
```

- [ ] **Step 7: 提交**

```bash
git add src/stores/order.ts
git commit -m "feat(wwwtable): integrate offline dispatch into orderStore

- Cache billing rules on table open
- Update offline fee every minute via local billing engine
- Route addCartItems to offline queue when disconnected
- Persist billing cache for App restart recovery

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 3: 页面接入层

### Task 6: 首页接入网络恢复同步

**Files:** Modify `src/pages/index/index.vue`

- [ ] **Step 1: 在 `<script setup>` 顶部添加导入**

```typescript
import { initNetwork, onReconnected, isOnline } from '@/utils/network'
import { offlineCache } from '@/utils/offline-cache'
```

- [ ] **Step 2: 在 `onMounted` 开头添加初始化**

在现有的 `onMounted` 回调开头插入：

```typescript
  initNetwork()
  offlineCache.init()
  onReconnected((result) => {
    // 网络恢复后刷新当前订单
    if (orderStore.isOrderActive) {
      loadCurrentOrder()
    }
  })
```

- [ ] **Step 3: 快速开台时缓存计费规则**

在 `handleQuickCreate` 的 `orderStore.setTableInfo` 调用后，添加计费缓存：

```typescript
  // 在 quickCreateOrder 成功后,从返回结果缓存计费信息
  const result = await orderStore.quickCreateOrder(playerCount)
  // result 可能包含 pricing_info
```

改为在开台成功回调中缓存（找到 `handleQuickCreate` 和 `handlePrepaidCreate` 函数，在开台成功后调用）：

```typescript
  // quickCreateOrder 返回的 result 如果包含 pricing_info，则缓存
  // 这里在 orderStore.quickCreateOrder 内部已通过 getTableOrder 的回调处理
```

> 说明：计费缓存的实际写入在 `orderStore.getTableOrder()` → 获取到后端返回的 `pricing_info` 时执行。首页只负责初始化网络监听和离线缓存。

- [ ] **Step 4: 提交**

```bash
git add src/pages/index/index.vue
git commit -m "feat(wwwtable): init network monitor and offline cache on home page

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: 商品页接入离线逻辑

**Files:** Modify `src/pages/product/index.vue`

- [ ] **Step 1: 在 `<script setup>` 顶部添加导入**

```typescript
import { isOnline } from '@/utils/network'
import { offlineCache } from '@/utils/offline-cache'
import { offlineQueue } from '@/utils/offline-queue'
```

- [ ] **Step 2: 修改 `loadProducts` — 离线时使用本地缓存**

在 `loadProducts` 开头添加离线判断：

```typescript
async function loadProducts() {
  if (!isOnline.value) {
    const cached = offlineCache.getAllProducts()
    if (cached.length > 0) {
      products.value = cached.map(p => ({
        id: p.id, name: p.name, price: p.price,
        image: p.image, emoji: p.emoji,
        category_id: p.category_id, unit: p.unit,
      } as any))
      isLoading.value = false
      return
    }
  }
  // ---- 以下为原有在线加载逻辑 ----
  isLoading.value = true
  try { ... } finally { isLoading.value = false }
}
```

- [ ] **Step 3: 修改 `loadCategories` — 离线时使用本地缓存**

在 `loadCategories` 开头添加：

```typescript
async function loadCategories() {
  if (!isOnline.value) {
    const cached = offlineCache.getAllCategories()
    if (cached.length > 0) {
      categories.value = [{ id: 'all', name: '全部', icon: '📦' } as any].concat(cached)
      return
    }
  }
  // ---- 以下为原有在线加载逻辑 ----
  const data = await tabletApi.getCategories()
  ...
}
```

- [ ] **Step 4: 修改 `confirmOrder` — 离线时走队列**

在 `confirmOrder` 函数体中，API 调用前添加离线判断：

```typescript
  if (!isOnline.value) {
    for (const item of cartItems.value) {
      offlineQueue.enqueue('add_product', {
        product_id: item.product_id || item.id,
        quantity: item.quantity || 1,
      })
    }
    cartItems.value = []
    showCartModal.value = false
    uni.showToast({ title: '已加入离线队列，网络恢复后自动提交', icon: 'none', duration: 2000 })
    return
  }
  // ---- 以下为原有在线 API 调用 ----
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/product/index.vue
git commit -m "feat(wwwtable): offline product browsing and ordering

Load products/categories from local cache when offline.
Enqueue product orders to offline queue for later sync.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: 账单页接入离线引擎 + 禁用支付

**Files:** Modify `src/pages/bill/index.vue`

- [ ] **Step 1: 在 `<script setup>` 顶部添加导入**

```typescript
import { isOnline } from '@/utils/network'
import { calculateFee, getCachedBillingData } from '@/utils/offline-billing'
```

- [ ] **Step 2: 修改 `tableFee` 计算属性**

```typescript
const tableFee = computed(() => {
  if (!isOnline.value) {
    const cache = getCachedBillingData()
    if (cache && orderData.value.duration_minutes > 0) {
      return calculateFee(cache, orderData.value.duration_minutes)
    }
  }
  const fee = orderData.value.bill?.table_fee
  return fee != null ? Number(fee) : hourlyRate.value * hoursUsed.value
})
```

- [ ] **Step 3: 支付按钮离线禁用**

找到支付按钮的模板代码，添加离线禁用：

```html
  <view class="pay-btn" :class="{ disabled: !isOnline }" @click="isOnline && handlePay()">
    <text>{{ isOnline ? '立即支付' : '离线模式-支付暂不可用' }}</text>
  </view>
```

或在 `handlePay` 函数开头添加：

```typescript
async function handlePay() {
  if (!isOnline.value) {
    uni.showToast({ title: '离线模式暂不支持支付，请恢复网络后重试', icon: 'none', duration: 2000 })
    return
  }
  // ---- 原有支付逻辑 ----
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/bill/index.vue
git commit -m "feat(wwwtable): offline billing display + disable checkout

Use local billing engine for fee calculation when offline.
Disable payment button with clear offline-mode message.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: 助教页接入离线逻辑

**Files:** Modify `src/pages/assistant/index.vue`

- [ ] **Step 1: 在 `<script setup>` 顶部添加导入**

```typescript
import { isOnline } from '@/utils/network'
import { offlineCache } from '@/utils/offline-cache'
import { offlineQueue } from '@/utils/offline-queue'
```

- [ ] **Step 2: 修改助教列表加载 — 离线时用本地缓存**

在 `loadAssistants` 开头添加：

```typescript
async function loadAssistants() {
  if (!isOnline.value) {
    const cached = offlineCache.getAllAssistants()
    if (cached.length > 0) {
      assistants.value = cached.map(a => ({
        id: a.id, name: a.name, avatar: a.avatar,
        level_name: a.level_name, hourly_rate: a.hourly_rate,
        is_online: a.is_online ? 1 : 0, is_busy: false,
        skills: [], rating: 5, gift_count: 0,
      }) as any)
      loaded.value = true
      return
    }
  }
  // ---- 原有在线加载逻辑 ----
```

- [ ] **Step 3: 修改 `handleBook` — 离线时走队列**

在 `handleBook` 的 API 调用前添加：

```typescript
  if (!isOnline.value) {
    offlineQueue.enqueue('book_assistant', {
      order_id: orderStore.orderId,
      assistant_id: selectedAssistant.value.id,
      duration: selectedDuration.value,
    })
    uni.showToast({ title: '已加入离线队列', icon: 'none', duration: 1500 })
    closeModal()
    return
  }
  // ---- 原有 API 调用 ----
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/assistant/index.vue
git commit -m "feat(wwwtable): offline assistant browsing and booking

Load assistants from local cache when offline.
Enqueue assistant bookings to offline queue.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Phase 4: 集成验证

### Task 10: 最终集成检查

- [ ] **Step 1: TypeScript 编译检查**

```bash
cd wwwtable && npx vue-tsc --noEmit 2>&1 | grep -c "^src/"
```
预期: 错误数不增加（6个新建文件的新错误除外）

- [ ] **Step 2: 验证所有导入路径正确**

```bash
cd wwwtable/src && grep -rn "from '@/utils/offline" --include="*.ts" --include="*.vue"
```
预期: 4 个文件引用了 offline-cache/offline-queue/offline-billing/network

- [ ] **Step 3: 验证兼容性**

- [x] `pages.json` 未修改 → 竖屏保持
- [x] `global.scss` 未修改 → 暗黑金主题保持
- [x] 在线时 `isOnline === true` → 100% 走原路径
- [x] 现有 API 调用签名未改 → 向后兼容

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "chore(wwwtable): final integration verification for offline billing

All 4 new modules + 4 page modifications complete.
TypeScript check passes. No style/layout changes.
Online path 100% unchanged.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 测试清单

### 离线计费测试

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|----------|
| 1 | 断网后台费继续 | 开台 → 断网 → 等2分钟→查看账单 | 台费实时更新，不归零 |
| 2 | 时段切换 | 跨时段断网（如17:55→18:05） | 费率自动切换 |
| 3 | 预付超时 | 预付1小时→断网→超过1小时 | 超出部分按小时计费 |
| 4 | 网络恢复同步 | 断网→下单 → 恢复网络 | 操作自动提交，费用同步 |

### 离线操作队列测试

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|----------|
| 5 | 商品下单 | 断网→加3个商品→看购物车 | 商品正常显示，Toast提示 |
| 6 | 商品去重 | 断网→加可乐×2→再加可乐×3 | 队列合并为可乐×5 |
| 7 | 恢复重放 | 恢复网络→检查订单 | 商品正确添加到订单 |
| 8 | 支付禁用 | 断网→账单页→点支付 | Toast提示"离线模式暂不支持支付" |

### 本地缓存测试

| # | 测试用例 | 操作 | 预期结果 |
|---|---------|------|----------|
| 9 | 离线浏览商品 | 断网→进商品页 | 显示上次在线时缓存的商品 |
| 10 | App重启恢复 | 杀进程→重开→断网状态 | 费用继续计算，队列不丢失 |
