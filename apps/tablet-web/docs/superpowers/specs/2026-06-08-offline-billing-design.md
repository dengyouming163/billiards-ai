# wwwtable 离线计费系统 — 设计文档

> 日期: 2026-06-08 | 状态: 设计中 | 目标: 全离线 + 静默队列 + 精确计费

---

## 一、概述

### 1.1 目标

断网情况下，wwwtable 继续正常运行：
- **台费**：本地计时器不中断，精确按分钟计算费用（与后端逻辑一致）
- **商品费**：本地缓存商品数据，下单操作暂存队列，网络恢复自动提交
- **助教费**：本地缓存助教数据，预约操作暂存队列，已开始的助教服务继续计时
- **结账**：仅在线可用（支付必须服务端确认）

### 1.2 数据规模评估

大型台球厅（200 商品 / 30 台桌 / 30 助教）全部缓存 ≈ 100KB，`localStorage`（10MB 上限）完全够用。

---

## 二、架构设计

### 2.1 四层结构

```
┌──────────────────────────────────────────────────────┐
│  第一层: 网络状态监听 (utils/network.ts)              │
│  uni.onNetworkStatusChange → online/offline 事件      │
├──────────────────────────────────────────────────────┤
│  第二层: 操作调度层 (stores/order.ts 改造)            │
│  在线 → API 直通   离线 → 队列暂存 + 本地计费        │
│  恢复 → flush 队列 → tickOrder → 刷新 displayFee     │
├──────────────────────────────────────────────────────┤
│  第三层: 离线计算引擎 (utils/offline-billing.ts)      │
│  逐分钟遍历 × 时段匹配 × 会员折扣 × 预付判断          │
├──────────────────────────────────────────────────────┤
│  第四层: 本地数据缓存 (utils/offline-cache.ts)        │
│  商品 Map + 助教 Map + 台桌 Map + 计费规则 + 操作队列 │
│  内存 → localStorage 双写                             │
└──────────────────────────────────────────────────────┘
```

### 2.2 核心数据流

```
             ┌──────────┐
             │ 顾客操作  │
             └────┬─────┘
                  │
          ┌───────▼────────┐
          │   isOnline?    │
          └───┬────────┬───┘
              │YES     │NO
              ▼        ▼
        ┌─────────┐ ┌──────────┐
        │ API 直通 │ │ 离线路径  │
        └────┬────┘ └────┬─────┘
             │           │
             │    ┌──────▼──────┐
             │    │ 取本地缓存   │
             │    │ (商品名/价格) │
             │    └──────┬──────┘
             │           │
             │    ┌──────▼──────┐
             │    │ 队列暂存操作 │
             │    │ + 本地计费   │
             │    └──────┬──────┘
             │           │
             │    ┌──────▼──────┐
             │    │ 网络恢复?   │
             │    └──┬──────┬──┘
             │       │YES  │NO
             │       ▼     │
             │  ┌─────────┐│
             │  │flush队列││
             │  └────┬────┘│
             │       │     │
             └───────┴─────┘
                     │
              ┌──────▼──────┐
              │  刷新 UI     │
              └─────────────┘
```

---

## 三、模块设计

### 3.1 本地计费引擎 `utils/offline-billing.ts`

#### 接口

```typescript
// 计费规则缓存（开台时缓存）
interface BillingCache {
  start_time: string
  base_rate: number            // table.hourly_rate
  pricing_type: 'hourly' | 'period' | 'member' | 'prepaid'
  periods: PricingPeriod[]     // 时段规则
  member_level?: string        // 'level_vip' | 'level_gold' | 'level_silver'
  prepaid_hours: number
}

interface PricingPeriod {
  start_time: string           // "09:00:00"
  end_time: string             // "17:00:00"
  weekdays?: string            // "1,2,3,4,5"
  price?: number               // 时段单价
  coefficient?: number         // 价格系数
}

// 计算当前分钟费率
function getCurrentRate(cache: BillingCache, time?: number): number

// 计算指定分钟数费用（核心方法）
function calculateFee(cache: BillingCache, durationMinutes: number): number

// 缓存/恢复计费规则
function cacheBillingData(data: BillingCache): void
function getCachedBillingData(): BillingCache | null
```

#### 计算逻辑（与后端 TableFeeCalculatorLogic 一致）

```
calculateFee(durationMinutes):
  1. 如果 prepaid_hours > 0 → 预付模式
     预付分钟 = prepaid_hours × 60
     if durationMinutes <= 预付分钟 → return 0
     超出小时 = ceil((durationMinutes - 预付分钟) / 60)
     return 当前费率 × 超出小时

  2. 标准模式 → 逐分钟累加
     start = new Date(start_time).getTime() / 1000
     total = 0
     for m in 0..durationMinutes:
       time = start + m × 60
       rate = getPeriodRate(time)  // 时段匹配
       total += rate / 60
     return round(total, 2)

getPeriodRate(time):
  遍历 periods:
    检查 weekday 匹配
    检查 start_time <= time < end_time
    匹配 → return (price || base_rate) × (coefficient || 1)
  无匹配 → return base_rate
  如有 member_level → × discountMultiplier
```

#### 折扣映射

```
level_vip   → 0.85
level_gold  → 0.90
level_silver → 0.95
其他        → 1.0（不打折）
```

### 3.2 本地数据缓存 `utils/offline-cache.ts`

#### 数据结构

```typescript
interface OfflineCache {
  version: number              // 缓存版本号，结构变化时递增
  updatedAt: number            // 最后更新时间戳
  products: Map<string, ProductCache>
  categories: CategoryCache[]
  assistants: Map<string, AssistantCache>
  assistantLevels: AssistantLevelCache[]
  tables: Map<string, TableCache>
  billing: BillingCache | null
  member: MemberCache | null
}

interface ProductCache {
  id: string; name: string; price: number
  image?: string; category_id: string; unit: string
  stock?: number; emoji?: string
}

interface AssistantCache {
  id: string; name: string; avatar?: string
  level_id: string; level_name: string
  hourly_rate: number; is_online: boolean
}

interface TableCache {
  id: string; number: string; name: string
  type_name: string; hourly_rate: number
  zone_id?: string; status: string
}
```

#### 核心方法

```typescript
// 初始化：从 localStorage 恢复
function initCache(): OfflineCache

// 全量更新（在线时定时同步）
function refreshAll(): Promise<void>
  → 并发请求 products/categories/assistants/levels
  → 写 localStorage + 内存

// 单品更新
function getProduct(id: string): ProductCache | undefined
function getAssistant(id: string): AssistantCache | undefined
function getTable(id: string): TableCache | undefined

// 计费数据
function setBillingData(data: BillingCache): void
function getBillingData(): BillingCache | null

// 会员绑定
function setMemberInfo(member: MemberCache): void
function getMemberDiscount(): number  // 返回折扣乘数

// 持久化
function persist(): void  // 内存 → localStorage
```

#### 刷新策略

| 触发时机 | 刷新范围 | 说明 |
|----------|----------|------|
| 首次打开 | 全量 | `refreshAll()` |
| 在线超过 5 分钟 | 全量 | 确保数据不过期 |
| 网络恢复后 | 全量 | 同步最新数据 |
| 开台时 | 计费规则 | 从 API 返回的 pricing_info 缓存 |
| 绑会员时 | 会员信息 | 从 API 返回的 member 缓存 |

### 3.3 离线操作队列 `utils/offline-queue.ts`

#### 操作类型

```typescript
type OfflineOpType =
  | 'add_product'        // { order_id, product_id, quantity }
  | 'remove_product'     // { order_id, item_id }
  | 'book_assistant'     // { order_id, assistant_id, duration }
  | 'cancel_assistant'   // { order_id, item_id }
  | 'tick_order'         // { order_id, duration_minutes }

interface OfflineOperation {
  id: string              // 唯一ID
  type: OfflineOpType
  payload: Record<string, any>
  createdAt: number
  retries: number         // 重试次数
}
```

#### 核心方法

```typescript
// 加入队列（自动去重合并）
function enqueue(op: OfflineOperation): void

// 按序重放所有待处理操作
async function flush(): Promise<FlushResult>

// 去重规则
function mergeProducts(ops: OfflineOperation[]): OfflineOperation[]
  // 同一 product_id: 合并加减数量
  // 先 add 3个 + 后 add 2个 → add 5个
  // 先 add 3个 + 后 remove(同product) → 抵消
  // 完全抵消 → 删掉该操作

// 持久化
function persist(): void
function restore(): OfflineOperation[]
```

#### 重放策略

```
flush():
  ops = restore()
  for op in sorted(ops, by: createdAt):
    try:
      result = await callAPI(op.type, op.payload)
      op.retries++
      if result.code === 1: 标记 op 为 done
      else: 标记 failed, 继续下一个
    catch networkError:
      停止重放（网络还没恢复）
    catch otherError:
      op.retries++, 标记 failed
  persist()
  返回 { done: N, failed: M }
```

#### 去重示例

```
入队顺序:
  1. add_product(product_id=1, qty=2)
  2. add_product(product_id=1, qty=3)  → 合并为 add_product(product_id=1, qty=5)
  3. remove_product(product_id=2)       → 保留
  4. add_product(product_id=1, qty=-2)  → 合并为 add_product(product_id=1, qty=3)

最终队列:
  1. add_product(product_id=1, qty=3)
  2. remove_product(product_id=2)
```

### 3.4 网络状态监听 `utils/network.ts`

```typescript
const isOnline = ref(true)
const offlineSince = ref<number | null>(null)

// 初始化
function init(): void {
  uni.onNetworkStatusChange((res) => {
    const wasOffline = !isOnline.value
    isOnline.value = res.isConnected

    if (wasOffline && res.isConnected) {
      onReconnected()  // 触发同步
    }
    if (!res.isConnected) {
      offlineSince.value = Date.now()
    }
  })

  // 启动时检测
  uni.getNetworkType().then(res => {
    isOnline.value = res.networkType !== 'none'
  })
}

async function onReconnected(): Promise<void> {
  // 1. 刷新本地缓存（商品/助教/价格）
  await offlineCache.refreshAll()
  // 2. 重放离线操作队列
  const result = await offlineQueue.flush()
  // 3. 调用 tickOrder 同步台费
  await orderStore.tick()
  // 4. 通知监听者
  notifyListeners('reconnected', result)
}
```

---

## 四、关键边界决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 结账(支付) | **禁用**离线 | 钱相关操作必须服务端确认，防重复扣款 |
| 离线费用展示 | 本地引擎实时计算 | 网络恢复后以后端为准自动修正 |
| 商品价格变更 | 容忍 5 分钟延迟 | 在线时每 5 分钟刷新缓存 |
| 操作队列上限 | 200 条 | 超过上限提示"请检查网络连接" |
| 队列重放失败 | 静默跳过 | 不阻塞后续操作，失败项丢弃 |
| 缓存过期 | 24 小时 | 超时后清除，需重新在线加载 |
| App 重启后 | localStorage 恢复 | 离线操作不丢，费用继续计算 |

---

## 五、文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `utils/offline-billing.ts` | **新建** | 本地计费引擎（~150行） |
| `utils/offline-cache.ts` | **新建** | 本地数据缓存 + Map管理（~120行） |
| `utils/offline-queue.ts` | **新建** | 离线操作队列 + 去重 + 重放（~100行） |
| `utils/network.ts` | **新建** | 网络状态监听 + 恢复回调（~60行） |
| `stores/order.ts` | 修改 | 接入离线调度层 + 离线计费（+50行） |
| `pages/index/index.vue` | 修改 | 网络恢复时触发同步（+15行） |
| `pages/product/index.vue` | 修改 | 离线时本地取商品+走队列（+25行） |
| `pages/bill/index.vue` | 修改 | 离线时用本地引擎计费+禁用支付（+20行） |
| `pages/assistant/index.vue` | 修改 | 离线时本地取助教+走队列（+15行） |
| **合计** | **5新+4改** | **~555行** |

---

## 六、兼容性保证

| 保证项 | 措施 |
|--------|------|
| 不改变竖屏 | 不修改任何布局相关样式 |
| 不改变暗黑金主题 | 不修改 global.scss 和页面色值 |
| 不改变现有 API 调用 | 仅在调用前加 `isOnline` 判断，路由到本地或 API |
| 不改变现有页面结构 | 仅在 `<script>` 中添加离线逻辑 |
| 不影响在线体验 | `isOnline === true` 时 100% 走原路径 |
