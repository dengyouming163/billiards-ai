# wwwstoreapp 台桌板块升级设计规格

**日期:** 2026-06-22 | **参考实现:** wwwpos (收银端) | **目标:** wwwstoreapp (商家管理后台App端)

---

## 一、快捷操作区 — 四个入口改造

### 目标布局

在台桌列表页 (`pages/table/index.vue`) 头部区域，将现有 `ShortcutBar` 改造为四个快捷入口卡片，位于 `ZoneFilter` 下方、`TableGrid` 上方：

```
┌──────────────────────────────────────────┐
│ [Header] 台桌管理    [StoreSelector]      │
├──────────────────────────────────────────┤
│ [ZoneFilter] 全部 | A区 | B区 | C区 ...  │
├──────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 🛎 开台申请│ │ 📦 点单提醒│ │ 👤 上桌提醒│ │ 🎫 套餐验券│ │
│ │    3     │ │    5     │ │    2     │ │   验券   │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
├──────────────────────────────────────────┤
│ [TableGrid] 台桌卡片列表                  │
└──────────────────────────────────────────┘
```

### 1.1 开台申请（新增）

**数据源:** `GET /pos.Order/pendingConfirmRequests`（每 5 秒轮询）
**返回格式:** `{ token, tableName, tableId, playerCount, expiresAt, timeout }[]`

**弹窗组件（新建 `QuickActionModal` 系列或独立页面）:**
- 列表展示每条申请：台桌名、人数、剩余时间倒计时
- 超时项置灰不可操作
- 操作按钮：✅ 确认开台 / ❌ 拒绝
- API: `POST /pos.Order/confirmOpen { token, action: 'confirm' | 'reject' }`

### 1.2 点单提醒（完善）

**数据源:** `GET /pos.Order/pendingDeliveries`（每 10 秒轮询）
**返回格式:** `{ tableId, tableName, zoneName, orderId, items: [{ itemId, itemName, quantity, unitPrice, status, createdAt, expiresAt }] }[]`

**弹窗完善:**
- 每个商品项显示：台桌名、商品名、数量×单价=小计、状态、剩余时间
- 操作：✅ 送达（先确认弹窗）/ ❌ 忽略
- API: `POST /pos.Order/deliverItem { item_id }` / `POST /pos.Order/cancelItem { item_id }`

### 1.3 上桌提醒（完善）

**数据源:** `GET /pos.Order/pendingAssistantBookings`（每 10 秒轮询）
**返回格式:** `{ itemId, orderId, tableId, tableName, zoneName, assistantId, assistantName, hourlyRate, status, createdAt, expiresAt }[]`

**弹窗完善:**
- 每条显示：台桌名、助教名、时薪、创建时间、剩余时间
- 操作：✅ 处理（先确认弹窗，提示"处理后请到台桌点击开始服务"）/ ❌ 忽略
- API: `POST /pos.Order/acceptAssistant { item_id }` / `POST /pos.Order/cancelItem { item_id }`

### 1.4 套餐验券开台（新增）

**数据源:** `GET /coupon.Package/list`（打开弹窗时加载一次）
**返回格式:** `{ id, name, duration_hours, price, original_price }[]`

**弹窗流程（三步）：**
1. **选择套餐券** — 列表展示套餐名/时长/价格
2. **选择空闲台桌** — 网格展示空闲台桌 + 选择人数（1-6）
3. **确认开台** — 调用 `POST /pos.Coupon/confirmInternal { package_id, table_id, player_count }`
4. **成功页** — 显示订单号、套餐名、时长，可"继续验券"或"完成"

### 轮询与计数

- 在 `index.vue` 的 `onShow` 中启动四个轮询（开台申请5s、点单提醒10s、上桌提醒10s、验券不轮询）
- 计数作为徽标显示在快捷入口卡片右上角
- `onHide` 时清除所有轮询定时器

---

## 二、台桌计费账单 — 对齐 wwwpos TableDrawer

### 2.1 账单数据源统一

**核心改动:** `detail.vue` 使用 `GET /pos.Order/getCurrentOrder?table_id=X` 作为权威数据源，每 10 秒轮询。

**返回数据结构（与平板同款格式）:**
```typescript
{
  id: string           // order_id
  startTime: string    // 开台时间
  durationMinutes: number
  tableFee: number     // 台费（服务端实时计算）
  mergeFee: number     // 并台转入台费
  productFee: number   // 商品小计
  assistantFee: number // 助教小计
  chargingFee: number  // 充电费
  prepaidHours: number // 预付时长
  couponPrice: number  // 预付金额
  memberInfo: {        // 绑定的会员
    name, phone, levelName, levelColor, balance, points, discountRate
  }
  items: [{            // 明细列表
    id, itemType, itemName, productName, assistantName,
    quantity, price, finalPrice, status, startedAt
  }]
}
```

### 2.2 账单页面结构

```
┌─ 状态卡片（台桌名 + 状态标签 + 操作日志入口）
├─ 实时费用卡片（绿色渐变）
│   ¥total = tableFee + mergeFee + productFee + assistantFee + chargingFee
│   副标题：台费¥X + 商品¥X + 助教¥X （+ 充电¥X）
│   标签：时段系数 ×1.5 / 会员X折 / 预付Xh
├─ 台费明细
│   开台时间 | 已用时长 | 预付时长 | 时段系数 | 并台转入台费 | 会员折扣
│   合计：¥(tableFee + mergeFee)
├─ 商品点单明细（可折叠，默认3项展开）
│   每项：商品名 x数量 | pending/processing/delivered 状态
│   操作：确认接单(pending) / 送达(processing) / 取消
│   小计：¥productFee
├─ 充电费用明细（条件显示，billChargingFee > 0 时出现）
├─ 助教服务明细（可折叠，默认3项展开）
│   每项：助教名 | pending/processing/serving/completed 状态
│   服务中显示实时计时 HH:MM:SS
│   操作：确认接单 / 开始服务 / 结束服务 / 取消
│   小计：¥assistantFee
├─ 会员区域（如有绑定）
└─ 底部操作栏
    [换台] [并台] [会员]    [结账 ¥total]
```

### 2.3 状态工作流

**商品状态流转:** `pending` →(确认接单)→ `processing` →(送达)→ `delivered`

**助教状态流转:** `pending` →(确认接单)→ `processing` →(开始服务)→ `serving` →(结束服务)→ `completed`

**各状态对应按钮:**

| 状态 | 商品按钮 | 助教按钮 |
|------|---------|---------|
| `pending` | 确认接单 + 取消 | 确认接单 + 取消 |
| `processing` | 送达 | 开始服务 |
| `serving` | - | 结束服务 |
| `delivered` / `completed` | 无（已完成） | 无（已完成） |
| `cancelled` | 无（灰色） | 无（灰色） |

### 2.4 时段系数显示

参考 wwwpos `utils/billing.ts`，在 wwwstoreapp 中复用相同逻辑：
- 22:00-06:00 → 深夜时段 ×1.5
- 06:00-14:00 → 早间时段 ×0.8
- 14:00-22:00 → 正常时段 ×1.0

**优先使用服务端返回的系数**（`getCurrentOrder` 返回的费用已含时段系数），本地计算仅用于显示标签。

---

## 三、换台并台 — 对齐 wwwpos TransferMergeModal

### 3.1 换台

**流程:**
1. 显示源桌台信息（时长、人数、台费、合计）
2. 从台桌列表中筛选 `status === 'idle'` 的桌台（排除自己）
3. 用户点击选择目标桌台
4. 显示警告："换台后计时将转移到新桌台，原桌台变为空闲。"
5. 确认 → `POST /pos.Order/changeTable { order_id, target_table_id }`
6. 成功提示 → 返回台桌列表

### 3.2 并台

**流程:**
1. 显示源桌台信息
2. 从台桌列表中筛选 `status === 'occupied'` 的桌台（排除自己）
3. 用户点击选择目标桌台，显示该桌台当前费用
4. 先获取目标桌台的 `orderId`：调用 `getCurrentOrder(targetTableId)`
5. 显示警告："并台后两桌消费将合并，源桌台自动关闭，所有订单转移。"
6. 确认 → `POST /pos.Order/merge { source_order_id, target_order_id }`
7. 成功提示 → 返回台桌列表

### 3.3 改动点

- 当前 `detail.vue` 已有基本换台/并台逻辑，需要：
  - 统一使用 `getCurrentOrder` 获取 `orderId`（而非从 store 推断）
  - 并台时需先获取目标的 `orderId` 再调用 merge API
  - 添加成功/失败的状态反馈

---

## 四、现金结算 — 简化一键支付

### 4.1 流程

```
结账按钮 → CheckoutModal 弹出
  ├─ 显示费用总览（台费 + 商品 + 助教 + 充电 + 并台）
  ├─ 显示套餐信息（如有）
  ├─ 显示会员信息（如有绑定）
  └─ [现金结算 ¥total] 按钮 → 一键支付
       → POST /pos.Order/checkout/{orderId}
         { cash_paid: total, pay_type: 'cash', pay_amount: total, ... }
       → 成功 → 关台 → 返回台桌列表
```

### 4.2 不需要的功能
- ❌ 不需要收款金额输入框
- ❌ 不需要找零计算
- ❌ 不需要微信/支付宝/会员卡支付

### 4.3 CheckoutModal 页面结构

```
┌─ 标题：结账 · 桌XX
├─ 应收总额（大字突出显示）
├─ 费用明细
│   台费 ¥X
│   商品费 ¥X
│   助教费 ¥X
│   充电费 ¥X（如有）
│   并台转入台费 ¥X（如有）
├─ 套餐信息（如有 prepaid_hours > 0）
│   套餐名 | 预付X小时 | 剩余X分钟 | 台费¥0
├─ 会员信息（如有绑定）
└─ [现金结算 ¥total] ← 一键支付按钮
```

---

## 五、涉及文件清单

### 新建文件
- `src/pages/table/components/QuickActions.vue` — 四个快捷入口卡片 + 轮询 + 计数
- `src/pages/table/components/OpenTableRequestsModal.vue` — 开台申请弹窗
- `src/pages/table/components/OrderReminderModal.vue` — 点单提醒弹窗（完善版）
- `src/pages/table/components/AssistantReminderModal.vue` — 上桌提醒弹窗（完善版）
- `src/pages/table/components/CouponOpenModal.vue` — 套餐验券开台弹窗
- `src/pages/table/components/CheckoutModal.vue` — 结账弹窗（现金一键支付）

### 修改文件
- `src/pages/table/index.vue` — 集成 QuickActions 替换 ShortcutBar
- `src/pages/table/detail.vue` — 重写账单展示，对齐 TableDrawer 结构，10秒权威轮询
- `src/pages/table/components/ShortcutBar.vue` — 删除或重构为 QuickActions
- `src/pages/table/components/ProductPanel.vue` — 对齐状态工作流
- `src/pages/table/components/AssistantPanel.vue` — 对齐状态工作流、添加实时计时
- `src/pages/table/components/BillPanel.vue` — 扩展为完整费用明细
- `src/api/modules/table.ts` — 补充缺失的 API 函数
- `src/api/modules/coupon.ts` — 补充套餐券 API

### 可删除文件
- `src/pages/table/checkout.vue` — 由 CheckoutModal 替代（取消独立结算页面）
- `src/pages/table/pending-products.vue` — 由 OrderReminderModal 替代
- `src/pages/table/pending-assistants.vue` — 由 AssistantReminderModal 替代

---

## 六、验证要点

1. **费用一致性:** 台球桌计费明细中的每一项费用（台费、商品、助教、并台转入）必须与服务端 `getCurrentOrder` 返回的值完全一致
2. **状态工作流:** 商品/助教各状态按钮正确显示且 API 调用正确
3. **换台并台:** 选桌逻辑正确（换台选 idle，并台选 occupied），API 参数正确
4. **套餐验券:** 套餐选择→空闲台桌→人数→开台全流程可走通
5. **轮询清理:** 离开页面时所有定时器停止
6. **现金结算:** 一键结算 → 关台 → 列表刷新
