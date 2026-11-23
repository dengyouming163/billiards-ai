# 订单结算 — 后端为单一计算源 重构设计

> 日期: 2026-06-13 | 状态: 已实现

## 问题陈述

结算流程中，前端同时维护了两套金额计算逻辑：
1. `displayFee` — 展示用（各子项累加）
2. `confirmCheckout` — 发送用（取 billing.final_amount）

两者取值路径不同，导致显示金额与实扣金额可能不一致。

## 设计原则

**前端永远不计算钱。前端只展示后端算好的金额，只负责收钱。**

## 架构变更

### 接口契约

```
POST /mobile.Order/checkout
入参：{ order_id, payment_method, paid_amount? }
出参：{ final_amount, change_amount, payment_id }

后端职责：
1. 根据当前 billing 快照确定 final_amount（后端自己算）
2. 将 billing 各子项回填到 order_items 的 final_price
3. 记录 payment
4. 返回结算结果（含找零）
```

### 前端变更

| 文件 | 变更 |
|------|------|
| `api/modules/table.ts` | `checkout()` 移除 `amount`/`remark` 参数，新增 `CheckoutResult` 返回类型 |
| `table/detail.vue` | `confirmCheckout` 不再计算金额，直接发送 `{order_id, method, paid_amount}`，用后端返回的 `final_amount`/`change_amount` 展示结果 |
| `table/detail.vue` | `displayFee` 简化为读取 `billing.final_amount`，不再手动累加子项 |

### 找零逻辑

- **确认前**：客户端 `changeAmount` 实时预览（辅助用户体验）
- **确认后**：以服务端返回的 `change_amount` 为准，弹窗展示："实收 ¥X，找零 ¥Y"

## 影响范围

- 需后端同步更新 `/mobile.Order/checkout` 接口，移除对前端传 `amount` 参数的依赖
- 前端不传 `amount` → 后端自行根据 billing 快照结算
