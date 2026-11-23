# wwwpos 全功能阻塞性问题修复 — 设计方案

> 审计日期：2026-06-19 | 状态：已确认

---

## 一、Phase 1：核心闭环打通（P0）

### #3: ProductOrderModal — orderId 缺失导致新增台桌无法点单

**根因**：Modal 内部通过 `orderApi.getCurrentOrder(tableId)` 获取 orderId，新开台可能尚未有活跃订单，`orderId` 为空，提交按钮被 `!orderId` 禁用。

**修复**：
- `ProductOrderModal` 新增 `prop: orderId?: string`
- 优先使用 prop 传入的 orderId，fallback 到 API 查询
- `TableDrawer` 开台成功后从 `result.data.order_id` 获取 orderId，传给 Modal

### #4: AssistantModal — orderId 为空时静默无响应

**根因**：确认按钮 onClick 第一行 `if (!orderId) return` 静默返回，无视觉反馈。

**修复**：
- `AssistantModal` 新增 `prop: orderId?: string`
- orderId 为空时按钮显示 "请先开台" 并 `disabled`
- 移除静默 return，改为 UI 层面阻止操作

### #5: TransferMergeModal — orderId 为空时静默无响应

**根因**：同 #4，换台/并台按钮 onClick 中 `if (!orderId) return`。

**修复**：
- `TransferMergeModal` 新增 `prop: orderId?: string`
- orderId 为空时换台/并台按钮 disabled + tooltip "暂无进行中的订单"

### #6: OpenTableModal — 失败无提示

**根因**：`page.tsx` 中 `handleOpenTable` 先 `setActiveModal('none')` 再调 `openTable()`，失败时 modal 已关闭。

**修复**：
- `page.tsx` 改调用顺序：先 `await openTable()`，成功后再 `closeModal()`
- 失败时保持 modal 打开，用 `toast.error` 提示原因

---

## 二、Phase 2：通知+周边完善（P1）

### #10-12: 通知 API 硬编码

**根因**：`notification-service.ts` 中 WS URL 和 HTTP fetch URL 硬编码，不读取环境变量。

**修复**：
- WS URL 从 `process.env.NEXT_PUBLIC_WS_URL` 读取，fallback `wss://api.tpzl88.com:8282`
- HTTP fetch 统一使用 API client 的 `API_BASE_URL` 拼接路径
- 使用 `client.ts` 中的 `getStoreId()` + token header

### #13: 结账后会员折扣不刷新

**根因**：`MemberModal.bindMember` 成功后不通知 CheckoutModal 重新拉取 `getBill()`。

**修复**：
- `MemberModal` onSuccess 后触发 `refreshBill` 回调
- `CheckoutModal` 监听该回调，自动重新调用 `getBill()`

### #14: 交班整页刷新

**根因**：`ShiftModal.tsx` 在 handover 成功后 `window.location.reload()`。

**修复**：
- 改用 `window.location.href = '/'`（带路由重定向，保持 SPA 行为）
- 或者使用 `router.refresh()` / `router.push('/')` 清理状态

### #15: 统计双重 API 调用

**根因**：`handleDateChange` 既直接调 `fetchData(range)`，又触发 `useEffect` 再次调。

**修复**：
- 移除 `useEffect` 中的 fetchData，仅由 `handleDateChange` 触发
- 初始加载在 `useEffect([], [])` 中单独处理

### #16: 会员搜索 tab 串污染

**根因**：`MemberModal` 搜索和充值 tab 共用 `searchResults` 和 `hasSearched` 状态。

**修复**：
- 为搜索 tab 和充值 tab 分别维护独立的 `searchResults` / `hasSearched`

### #17: 通知服务路由切换泄漏

**根因**：`NotificationService` 单例在路由切换时未调用 `destroy()`。

**修复**：
- `NotificationOverlay` 添加 `useEffect` 返回 cleanup：`NotificationService.getInstance().destroy()`

---

## 三、Phase 3：清理（P2）

### #1-2: 移除死代码

- 删除 `PromotionBanner.tsx` 的 import（保留文件供后续使用）
- `PackageModal` 保留但暂时不暴露入口（后续加套餐功能时启用）

### #7-9: 标注 TODO

- `TechnicianModal` 状态变更：保留但不影响核心流程
- `CheckoutModal` 优惠券/会员搜索：保留桩代码，标注 TODO

---

## 四、修改文件清单

| Phase | 文件 | 变更类型 |
|-------|------|----------|
| P0 | `page.tsx` | 修改：开台调用顺序 + orderId 传递链 |
| P0 | `ProductOrderModal.tsx` | 修改：新增 orderId prop |
| P0 | `AssistantModal.tsx` | 修改：新增 orderId prop + 空值禁用 |
| P0 | `TransferMergeModal.tsx` | 修改：新增 orderId prop + 空值禁用 |
| P0 | `TableDrawer.tsx` | 修改：传递 orderId 给子 Modal |
| P1 | `notification-service.ts` | 修改：WS URL 环境变量 + HTTP API 统一 |
| P1 | `MemberModal.tsx` | 修改：onSuccess 回调 + tab 状态隔离 |
| P1 | `CheckoutModal.tsx` | 修改：监听会员绑定自动刷新账单 |
| P1 | `ShiftModal.tsx` | 修改：router.push 替代 location.reload |
| P1 | `StatisticsModal.tsx` | 修改：移除重复 fetch |
| P1 | `NotificationOverlay.tsx` | 修改：cleanup 调用 destroy() |
| P1 | `ws-notification.ts` | 修改：WS URL 环境变量 |
| P2 | `PromotionBanner.tsx` | 移除 import（保留文件） |
