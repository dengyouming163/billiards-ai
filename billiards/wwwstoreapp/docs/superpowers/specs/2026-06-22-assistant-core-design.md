# 助教端核心功能设计规格

**日期:** 2026-06-22 | **目标:** wwwstoreapp 助教端

---

## 一、助教状态管理

### 状态定义

| 状态码 | 名称 | 说明 | 能接新单 | 触发方式 |
|--------|------|------|----------|----------|
| 0 | 休息 | 未上线/已下线 | ❌ | 手动下线 / 默认 |
| 1 | 空闲 | 在线待接单 | ✅ | 手动上线 |
| 2 | 服务中 | 有进行中的服务 | ✅ | 系统自动(开始服务时) |

### 状态流转

```
状态0(休息) ──[点击上线]──→ 状态1(空闲)
状态1(空闲) ──[点击下线]──→ 状态0(休息)
状态1(空闲) ──[开始服务]──→ 状态2(服务中)
状态2(服务中) ──[结束服务]──→ 状态1(空闲)
```

下线不阻止进行中的服务正常完成。下线后仅阻止新单分配。

### 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/mobile.Assistant/goOnline` | 更新 busi_assistant.status = 1 |
| POST | `/mobile.Assistant/goOffline` | 更新 busi_assistant.status = 0 |
| GET | `/mobile.Assistant/status` | 返回 `{ status: 0|1|2 }` |

`goOnline` 逻辑：更新 status=1。
`goOffline` 逻辑：更新 status=0（不影响进行中服务）。
`ProfileController::index` 返回加入 `status` 字段。

---

## 二、接单流程

### 订单状态（助教视角）

| 状态 | 说明 | 显示位置 | 可操作 |
|------|------|----------|--------|
| `pending` | 台桌预约助教，待收银确认 | 接单列表 | 仅查看，无操作按钮 |
| `accepted` | 收银/管理员已处理同意上桌 | 接单列表 | [开始服务] |
| `in_progress` | 助教正在服务中 | 接单列表 | [结束服务] |
| `completed` | 服务已结束 | 接单列表 | [查看详情] |

说明：
- pending 订单是由台桌大屏发起、仍需收银端确认的。助教端不可操作，等待收银处理即可。
- 收银端点击"处理"后，订单状态从 pending → accepted，此时助教可以点"开始服务"。

### 数据API

复用现有 `mobile.AssistantOrder` 接口：
- `pending` → `/mobile.AssistantOrder/pending`
- `all` → `/mobile.AssistantOrder/all?status=X`
- `list` → `/mobile.AssistantOrder/list?status=X`
- `start` → `/mobile.AssistantOrder/start`
- `complete` → `/mobile.AssistantOrder/complete`
- `history` → `/mobile.AssistantOrder/history`
- `records` → `/mobile.AssistantOrder/records`
- `stats` → `/mobile.AssistantOrder/stats`

---

## 三、首页 (AssistantHome) — 组件化

### 页面结构

```
AssistantHome.vue
├── StatusBar（状态卡片）
│   - 头像/姓名
│   - 今日收入（从 stats API）
│   - 当前状态显示（🟢在线接单中 / ⚪未上线 / 🔵服务中）
│   - [上线接单] / [下线休息] 按钮
│   - 状态2时按钮不可操作
├── OrderTabs（筛选栏）
│   - [全部] [待确认] [已确认] [进行中] [已完成]
├── OrderList（接单列表）
│   - pending → 仅查看（灰色，无操作按钮）
│   - accepted → [开始服务]
│   - in_progress → 实时计时 [结束服务]
│   - completed → [查看详情]
└── MyOrdersEntry（[我的订单] 入口）
```

### 刷新策略
- 每 15 秒轮询接单列表（后台静默刷新，无加载动画）
- 上线/下线/开始服务/结束服务后即时刷新

---

## 四、我的订单页（新建）

### 路径
`pages/assistant-orders/index.vue`

### 页面结构

```
assistant-orders/index.vue
├── 日期筛选（本月/上月/近三月）
├── 统计卡片
│   - 总订单数 | 总服务时长 | 总收入
├── 订单列表
│   - 订单号 | 日期 | 桌台 | 时长 | 助教费 | 商品费 | 台费 | 总金额
│   - 支持分页加载
```

### 数据 API
- `mobile.AssistantOrder/records` — 历史服务记录
- `mobile.AssistantOrder/stats` — 统计数据

---

## 五、涉及文件

| 类型 | 文件 | 操作 |
|------|------|------|
| 后端 | `mobile/AssistantController.php` | 改 — 新增 goOnline/goOffline/status |
| 后端 | `mobile/ProfileController.php` | 改 — 返回 status 字段 |
| 前端 | `pages/index/AssistantHome.vue` | 重写 — 状态卡片 + 接单列表 |
| 前端 | `pages/assistant-orders/index.vue` | 新建 — 我的订单历史页 |
| 前端 | `api/modules/profile.ts` | 改 — 新增 goOnline/goOffline/getStatus |
| 前端 | `api/modules/order.ts` | 确认 records/stats 兼容性 |
| 路由 | `pages.json` | 改 — 新增 assistant-orders 路由 |
