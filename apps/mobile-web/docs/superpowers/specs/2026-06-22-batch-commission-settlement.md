# 一键结算提成设计规格

**日期:** 2026-06-22 | **目标:** wwwapi 后端 + wwwstore 前端

---

## 后端 API

### POST `/assistant.Assistant/batchSettleCommission`

**请求：**
```json
{ "store_id": "store_xxx", "start_date": "2026-01-01", "end_date": "2026-06-22" }
```

**逻辑：**
1. 查所有已完成/服务中的助教 OrderItem（有 assistant_id + final_price > 0）
2. 排除已有 CommissionRecord 的 item（order_item_id 唯一约束）
3. 逐条调 `AssistantLogic::calculateCommission()`（自带幂等保护）
4. 统计处理/跳过/失败数量

**响应：**
```json
{
  "total": 50, "processed": 45, "skipped": 5, "errors": 0,
  "message": "成功结算 45 笔提成，跳过 5 笔（已有记录）"
}
```

## 前端（wwwstore）

位置：`CommissionConfigPanel.tsx` 统计卡片下方

按钮：`一键结算历史提成` → 日期弹窗 → 确认 → 进度提示 → 结果展示

## 防重复保证

- DB 层：`busi_commission_record.order_item_id` 唯一索引
- 应用层：`calculateCommission()` 先查后插
- 批量层：SQL 过滤已存在的 order_item_id
