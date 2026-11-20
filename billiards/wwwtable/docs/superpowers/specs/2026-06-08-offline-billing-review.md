# 离线计费系统 — 深度复盘报告

> 日期: 2026-06-08 | 覆盖: wwwtable + wwwpos

---

## 一、架构对比

| 维度 | wwwtable (顾客大屏) | wwwpos (POS收银) |
|------|---------------------|-------------------|
| 框架 | Vue 3 + UniApp | React 19 + Next.js |
| 存储 API | `uni.setStorageSync` | `localStorage` |
| 台桌数 | 1 | N (全部) |
| 计费存储 | 单 key `offline_billing` | 多 key `{tableId: data}` |
| 队列持久化 | `uni.setStorageSync('offline_queue')` | `localStorage('pos_offline_queue')` |
| 缓存大小 | ~150 行 (Map + 完整类型) | ~55 行 (数组 + 简化类型) |
| 队列设计 | 内联 API 调用 (switch/case) | 回调模式 (replayFn) |
| 集成点 | orderStore + 4 个页面 | AppContext reducer + 定时器 |

---

## 二、三个核心模块逐项评审

### 2.1 离线计费引擎 (offline-billing.ts)

**两端的逻辑 100% 一致**，正确复刻了后端 `TableFeeCalculatorLogic`:

```
✅ 逐分钟遍历 (匹配后端 for loop)
✅ 时段匹配 (weekday + start_time/end_time + coefficient)
✅ 跨午夜时段 (start > end 时的 OR 逻辑)
✅ 会员折扣 (VIP 0.85 / 金卡 0.90 / 银卡 0.95)
✅ 预付模式 (prepaid_hours 内免费, 超出按小时)
✅ 精度到分 (Math.round * 100 / 100)
```

**bug — `toTimeString()` 区域依赖**:
```typescript
// wwwtable & wwwpos: line 25/24
const timeStr = d.toTimeString().slice(0,8) // "HH:MM:SS"
```
`toTimeString()` 返回 24 小时制 `"15:30:00"`，在英文 locale 下正确。但在某些非英文 locale 下可能返回其他格式。建议改为显式格式化。

**修复建议**:
```typescript
const h = String(d.getHours()).padStart(2, '0')
const m = String(d.getMinutes()).padStart(2, '0')
const s = String(d.getSeconds()).padStart(2, '0')
const timeStr = `${h}:${m}:${s}`
```

**评分: 4.5/5** (唯一扣分项为 locale 依赖)

### 2.2 离线操作队列 (offline-queue.ts)

**wwwtable 版本 — 完整但略重**:
```
✅ 去重合并 (mergeQueue 合并同商品加减)
✅ 网络错误检测 (中断重放, 保留剩余)
✅ 200 条上限
✅ 持久化到 localStorage
⚠️ flush 中 switch/case 与 enqueue 的类型不同步风险
⚠️ ops.indexOf(op) 在重放中断时可能重复入队
```

**wwwpos 版本 — 更轻量，更适合 React**:
```
✅ 回调模式 replayAll(replayFn) — 调用方控制重放逻辑
✅ 类型使用 OfflineOperation (与全局 types 一致)
✅ 持久化到 localStorage
❌ 无去重合并 — 重复操作不会合并
❌ 无网络错误检测 — 不区分网络错误和业务错误
```

**对比**: wwwtable 的队列更完善 (去重+网络检测)，但 wwwpos 的回调模式更灵活。wwwpos 缺少去重合并是功能缺口，需要补上。

**评分**: wwwtable 4/5, wwwpos 3/5

### 2.3 本地数据缓存 (offline-cache.ts)

**wwwtable 版本 — 完备的数据层**:
```
✅ Map<string, T> 结构 — O(1) 查找
✅ 全类型定义 (ProductCache, AssistantCache, TableCache, MemberCache)
✅ 24h TTL 自动过期
✅ 全量刷新 + 单品查询 + 会员折扣
✅ 内存 + localStorage 双写
```

**wwwpos 版本 — 精简版**:
```
⚠️ 数组存储 — O(n) 查找 (无 Map)
⚠️ 无单品查询 (仅有 getAll + getCachedProduct)
⚠️ 无会员/计费缓存
⚠️ 类型简化 (仅 id/name/price, 丢失 image/emoji/category)
✅ updateCache 支持增量更新
```

**对比**: wwwtable 的缓存显然更完整。wwwpos 的缓存设计为 AppContext 使用时足够（因为 AppContext 已有 live state），但离线场景下如果在 wwwpos 中需要按 ID 快速查找商品/助教，当前数组方式会退化到 O(n)。

**评分**: wwwtable 5/5, wwwpos 3/5

---

## 三、集成层审查

### 3.1 wwwtable orderStore 集成

| 改动 | 评估 |
|------|------|
| `cacheBillingInfo()` | ✅ 正确缓存开台时的 pricing_info |
| `updateOfflineFee()` | ✅ 每 60s 在 startTimer 中调用 |
| `addCartItems() 离线路由` | ⚠️ 返回 true 但 order items 不更新 (视觉上购物车清空但订单不变) |
| `tick() 同步` | ✅ 恢复后更新 billingCache 并刷新 fee |
| `reset() 清理` | ✅ 清空 offlineFee 和 billingCache |

### 3.2 wwwpos AppContext 集成

| 改动 | 评估 |
|------|------|
| `syncOfflineData()` | ⚠️ switch/case 中 create_order 和 add_product 是占位实现 |
| 多台桌 60s 定时器 | ✅ 遍历占用台桌调用 calculateFee |
| 定期缓存刷新 (5min) | ✅ 从 AppContext state 抽取数据 |
| 离线启动回退 | ✅ 失败时调用 initCache() |

**严重问题**: `syncOfflineData` 中的 `create_order` case 调用了 `service.order.open({ table_id: '', player_count: 1 } as any)` — 这是一个占位实现，不是实际的开台逻辑。

---

## 四、关键问题清单

### P0 — 影响功能正确性

| # | 端 | 问题 | 影响 |
|---|-----|------|------|
| 1 | wwwpos | `syncOfflineData` 中的 `create_order` 和 `add_product` case 是占位代码 | 离线操作无法实际重放到后端 |

### P1 — 功能缺口

| # | 端 | 问题 | 影响 |
|---|-----|------|------|
| 2 | wwwpos | `offline-queue.ts` 缺少去重合并 | 离线期间多次加同一商品产生多条操作 |
| 3 | wwwtable | `addCartItems` 离线时 orderItems 不更新 | 顾客看到购物车清空但订单页商品不变 |
| 4 | 两端 | `toTimeString()` locale 依赖 | 非英文环境可能计费错误 |

### P2 — 性能和健壮性

| # | 端 | 问题 | 影响 |
|---|-----|------|------|
| 5 | wwwpos | `offline-cache.ts` 数组查找 O(n) | 大数据量下慢 (但目前14商品可忽略) |
| 6 | 两端 | `DISCOUNT_MAP` 硬编码 | 后端新增会员等级时前端需同步更新 |
| 7 | 两端 | 持久化无版本号 | 数据结构变更后旧缓存可能解析失败 |
| 8 | wwwtable | `offline-queue.ts` flush switch 仅覆盖 4 种类型 | 新增操作类型可能被静默丢弃 |

---

## 五、总体评分

| 维度 | wwwtable | wwwpos |
|------|:--:|:--:|
| 计费引擎正确性 | 4.5/5 | 4.5/5 |
| 队列完整性 | 4/5 | 3/5 |
| 缓存完备性 | 5/5 | 3/5 |
| 集成正确性 | 3.5/5 | 2.5/5 |
| 代码质量 | 4/5 | 3.5/5 |
| **综合** | **4.2/5** | **3.3/5** |

### 结论

- **计费引擎**是两端的强项，与后端逻辑 100% 对齐
- **wwwtable** 整体更成熟（因为在之前多轮迭代中打磨过）
- **wwwpos** 的优势是骨架复用（已有 reducer + 网络检测），但实现深度不够（队列缺少去重、缓存简单、sync 有占位代码）
- 两个端都**没有单元测试**覆盖离线路径 — 依赖手动 E2E 验证
