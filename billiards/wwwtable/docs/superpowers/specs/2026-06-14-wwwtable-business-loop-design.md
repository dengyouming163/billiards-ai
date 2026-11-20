# wwwtable 业务流程闭环 — 设计文档

> 日期: 2026-06-14 | 参考: wwwstoreapp table/detail.vue + checkout.vue | 目标: 顾客自助大屏完整闭环

---

## 一、整体流程

```
登录(6位码) → 一键开台 → 商品点单(预下单) → 助教预约(book→confirm→start→end)
                        → 绑定会员(预留入口) → 查看实时账单 → 微信扫码结算 → 完成
```

| 模块 | 当前 | 目标 | 需改 API |
|------|------|------|----------|
| 开台 | 一键开台 | 不变 | - |
| 商品点单 | 预订单模型 | 精简、去重、在线 only | - |
| 助教服务 | 状态不完整 | 对齐 store app 状态机 | - |
| 会员绑定 | 缺失 | 预留入口 + API | `tablet.Member/search` `tablet.Order/bindMember` |
| 账单 | 费用拆分不全 | 对齐 store app Bill 结构 | - |
| 结算 | 仅有微信 | 微信扫码 + 结果展示 | - |
| 送礼 | 仅本地计数 | 移除无效功能 | - |

---

## 二、账单页重构 — bill/index.vue

对标 `wwwstoreapp/src/pages/table/checkout.vue`。

### 数据结构

后端 `tablet.Order/getBill` 返回的 Bill：
```
Bill {
  order: { id, order_no, status, start_time, table_name, player_count }
  items: [{ item_type, item_name, quantity, unit_price, final_price, status }]
  table_fee, product_fee, assistant_fee
  member_discount, final_amount
  member: { name, level } | null
  billing: { original_amount, discount_amount, discount_rate, final_amount }
}
```

### 页面布局

1. 台桌信息 + 已用时长
2. 费用明细卡片（台费 / 商品费 / 助教费 / 折扣 / 应付合计）
3. 会员区（预留入口："绑定会员享折扣"）
4. 商品 + 助教明细列表
5. 底部按钮：「请求结账」

### 修改要点

- 移除当前 `bill/index.vue` 中的 mock 数据和 0 值判断陷阱
- 费用计算完全依赖后端 Bill 数据
- 添加加载状态和空状态

---

## 三、结算流程

### 微信扫码支付

1. 账单页点击「请求结账」
2. 调用 `tablet.Order/checkout` 获取支付信息
3. 调用 `payment.Payment/create` 生成微信 NATIVE 扫码二维码
4. 轮询 `payment.Payment/query` 每 3 秒查支付状态
5. 支付成功 → 展示结果页 → 返回首页

### 支付结果展示（新增）

对标 wwwstoreapp checkout.vue 成功页：
- ✅ 收款成功
- 金额
- 台桌号 + 订单号
- 支付方式：微信
- 「返回首页」按钮

---

## 四、商品点单 — product/index.vue

### 保持预下单模型

顾客提交 → 收银员确认/拒绝，权限清晰。

### 改进点

1. 离线模式不作为本次目标（在线 only）
2. 简化冗余的 `preOrderGroups` 展示逻辑
3. 移除空函数 `handleSearch()`
4. 商品加载失败 → 空状态 + 重试按钮（不用 mock）
5. 分类加载失败 → 空列表 + Toast

---

## 五、助教服务 — assistant/index.vue

### 状态机对齐

```
pending → confirmed → serving → completed
   ↓         ↓           ↓
rejected  cancelled  cancelled
```

API 已有：`bookAssistant` / `acceptAssistant` / `startAssistantService` / `endAssistantService` / `cancelAssistant` / `getAssistantOrders`

### 改进点

1. 状态展示完善：pending(等待确认) → processing(已确认) → serving(服务中) → completed(已完成)
2. 移除送礼功能（`sendGift` / `giftPanelVisible` / `flyingGifts` 等）
3. 轮询间隔保持 5 秒

---

## 六、会员绑定 — 预留入口

### API

```typescript
// tablet.ts 新增
searchMembers(keyword: string) → GET /tablet.Member/search
bindMember(params: { order_id, member_id }) → POST /tablet.Order/bindMember
```

### UI

- 账单页会员区显示"绑定会员享折扣 >"
- 点击预留入口 → 弹出搜索选择器（本次先做入口 + alert 提示"即将开放"，后续补齐完整流程）

---

## 七、不纳入本次范围

- 离线商品点单（保留 `offline-cache.ts` / `offline-queue.ts` 但不改动）
- 换台 / 并台功能
- 预付开台（已移除）

---

## 八、文件变更清单

| 文件 | 操作 |
|------|------|
| `src/pages/bill/index.vue` | 重构：Bill 结构 + 费用明细 + 微信扫码结算 |
| `src/pages/product/index.vue` | 精简：移除 mock + 简化预订单展示 + 在线 only |
| `src/pages/assistant/index.vue` | 精简：移除送礼 + 对齐状态机 |
| `src/api/modules/tablet.ts` | 新增：`searchMembers`、`bindMember` |
| `src/pages/index/index.vue` | 已处理（移除预付开台） |
