# 移动端订单管理功能设计文档

> **日期**: 2026-05-31
> **状态**: 设计中
> **作者**: AI Assistant

---

## 1. 概述

### 1.1 背景

- `busi_assistant_order` 助教预约表已废弃，助教订单全流程已融入 `busi_order` + `busi_order_item` 主订单体系
- 助教接单功能后续将在首页按角色展示，不在此次范围
- `/pages/orders/index` 当前是助教接单中心，需改造为全门店历史订单管理页
- `mobile/OrderController` 缺少 `lists()`（订单列表）和 `detail()`（订单详情）方法

### 1.2 目标

1. 重写 `/pages/orders/index` — 全门店历史订单列表，带多维度筛选
2. 新建 `/pages/orders/detail` — 订单详情页，含基本信息、消费明细、支付信息
3. 新增后端 `mobile.Order/lists` 和 `mobile.Order/detail` 接口

### 1.3 非目标

- 不包含接单/服务操作（后续放首页）
- 不包含结账/取消等写操作（详情页仅提供跳转台桌页的入口）

---

## 2. 方案选择

| | 方案 A（选中）| 方案 B |
|---|---|---|
| **后端** | mobile/OrderController 新增 lists() + detail() | 复用 /pos.Order/lists + detail |
| **优势** | 独立移动端语义、权限可控、参数一致 | 后端零开发 |
| **劣势** | 需写少量后端代码 | POS 权限体系不一致、返回格式冗余 |
| **委托** | storeapi\logic\order\OrderLogic::getList() / getDetail() | — |

---

## 3. 页面设计

### 3.1 路由

```
/pages/orders/index   — 全店订单列表（重写）
/pages/orders/detail  — 订单详情（新建）
```

原 `active.vue` 移除，由新详情页替代。

### 3.2 订单列表页 `index.vue`

#### 筛选条件

| 维度 | 选项 | 默认 |
|------|------|------|
| 状态 | 全部 / 进行中 / 已结账 / 已取消 | 全部 |
| 日期 | 今天 / 昨天 / 近7天 / 本月 / 自定义 | 近7天 |
| 类型 | 全部 / 台桌 / 助教 / 商品 | 全部 |
| 搜索 | 台桌名称 / 订单号模糊匹配 | 空 |

#### 列表卡片

每张卡片展示：

- 订单编号 + 状态标签（颜色区分：进行中=绿、已完成=灰、已取消=红）
- 台桌名称 + 订单类型文案（台桌开台 / 助教服务 / 商品销售）
- 时间：开始时间 → 结束时间（进行中显示 "进行中"）
- 金额 ¥xx.xx + 绑定会员名（如有）
- 点击整张卡片 → 跳转详情页

#### 分页

上拉加载更多，每页 20 条。

#### UI 组件

复用现有项目组件：`Header`、`TabBar`、`StateView`（加载/空/错误状态）

### 3.3 订单详情页 `detail.vue`

#### 信息分区

| 区域 | 内容 |
|------|------|
| 顶部 Hero | 订单编号 + 状态标签 + 实付金额 |
| 基本信息 | 台桌名称、会员（如有：头像+姓名+卡号）、操作员、开始/结束时间 |
| 消费明细 | 订单项列表：item_type 图标 + item_name + 数量 × 单价 = 金额 |
| 支付信息 | 支付方式（现金/微信/支付宝/余额）+ 实付金额（已结账时显示） |
| 操作按钮 | 进行中订单：跳转台桌详情页继续操作；已结账/已取消：无操作按钮 |

#### 数据来源

调用 `mobile.Order/detail` 接口，返回结构：

```json
{
  "id": "o_xxx",
  "order_no": "TO202605310001",
  "type": "table",
  "status": "completed",
  "table_id": "table_xxx",
  "table_name": "A01",
  "member_id": "m_xxx",
  "member_name": "张三",
  "member_phone": "138xxxx",
  "member_card_number": "M001",
  "operator_id": "e_xxx",
  "operator_name": "李四",
  "start_time": "2026-05-31 10:00:00",
  "end_time": "2026-05-31 12:30:00",
  "duration_minutes": 150,
  "original_amount": 200.00,
  "discount_amount": 20.00,
  "final_amount": 180.00,
  "payment_status": "paid",
  "cash_paid": 180.00,
  "wechat_paid": 0,
  "alipay_paid": 0,
  "balance_paid": 0,
  "remark": "",
  "items": [
    {
      "id": "oi_xxx",
      "item_type": "table",
      "item_name": "台费",
      "quantity": 1,
      "unit": "次",
      "unit_price": 100.00,
      "total_price": 100.00,
      "final_price": 100.00,
      "status": "delivered"
    }
  ],
  "payments": []
}
```

#### UI 组件

复用现有：`Header`、`StateView`。详情卡片使用项目统一的大圆角卡片风格。

---

## 4. 后端 API 设计

### 4.1 `mobile.Order/lists`

**请求**: `GET /storeapi/mobile.Order/lists`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| store_id | string | 是 | 自动注入 |
| status | string | 否 | all / in_progress / completed / cancelled |
| dateRange | string | 否 | today / yesterday / week / month / all |
| type | string | 否 | all / table / assistant / product |
| keyword | string | 否 | 台桌名称或订单号模糊搜索 |
| page | int | 否 | 页码，默认 1 |
| pageSize | int | 否 | 每页条数，默认 20 |

**响应**:
```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "lists": [...],
    "count": 100,
    "page_no": 1,
    "page_size": 20
  }
}
```

列表中每条记录包含：id, order_no, type, status, table_id, table_name, member_id, member_name, start_time, end_time, duration_minutes, original_amount, discount_amount, final_amount, payment_status, created_at, items (简化: id, item_type, item_name, quantity, unit_price, total_price).

### 4.2 `mobile.Order/detail`

**请求**: `GET /storeapi/mobile.Order/detail?order_id=xxx`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| order_id | string | 是 | 订单 ID |
| store_id | string | 是 | 自动注入 |

**响应**: 返回完整订单对象，含 items、payments、table_name、member 信息。

### 4.3 实现方式

- `lists()` → 委托 `\app\storeapi\logic\order\OrderLogic::getList()`（PC 后台已有的成熟实现）
- `detail()` → 委托 `\app\storeapi\logic\order\OrderLogic::getDetail()`（同上）
- 权限：`#[Permission('mobile:order', '订单管理', 'mobile', '订单', ['boss', 'manager', 'employee', 'cashier'])]`

---

## 5. 前端实现要点

### 5.1 文件变更

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/orders/index.vue` | 重写 | 全店订单列表 |
| `src/pages/orders/detail.vue` | 新建 | 订单详情 |
| `src/pages/orders/active.vue` | 删除 | 原助教进行中订单详情 |
| `src/api/modules/order.ts` | 修改 | 新增 getOrderList / getOrderDetail |
| `src/types/index.ts` | 修改 | 新增 Order / OrderItem 类型（通用主订单类型） |
| `src/pages.json` | 修改 | 新增 detail 路由 |
| `src/stores/order.ts` | 修改 | 移除助教相关 store 方法（如不再需要）|

### 5.2 数据流

```
筛选栏状态 (reactive) → loadData() → getOrderList(params) → 后端分页查询 → 渲染列表
点击卡片 → navigateTo('/pages/orders/detail?order_id=xxx') → getOrderDetail(id) → 渲染详情
```

### 5.3 状态处理

- **加载中**: `StateView` 的 loading 状态
- **空列表**: "暂无订单记录" + 默认描述文案
- **加载失败**: 显示错误信息 + 重试按钮
- **详情加载中**: 骨架屏或 loading
- **订单不存在**: "订单不存在或已被删除"

---

## 6. 风险与注意事项

1. **类型系统**: `table.ts` 中已有 `Bill`/`OrderItem` 类型定义，新增的 `Order` 类型应与之协调，避免重复
2. **权限**: Controller 权限需覆盖 boss / manager / employee / cashier
3. **分页兼容**: 后端 `OrderLogic::getList()` 的返回格式需确认 key 名（lists vs list, count vs total）与前端匹配
4. **旧代码清理**: `active.vue` 删除后需确认无其他引用；`stores/order.ts` 的助教方法可能需要保留（后续首页使用）
