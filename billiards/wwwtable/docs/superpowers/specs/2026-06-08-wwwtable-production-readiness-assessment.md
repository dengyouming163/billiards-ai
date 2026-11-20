# wwwtable 生产就绪度评估报告

> 日期: 2026-06-08 | 综合评分: 2.7/5 | 目标平台: H5 (平板横屏)

---

## 一、项目概况

wwwtable 是台球厅顾客自助大屏端，基于 UniApp Vue3 + TypeScript。顾客扫码绑定台桌后，可自助浏览商品下单、呼叫助教、查看账单、比赛计分。

| 属性 | 值 |
|------|-----|
| 框架 | UniApp 3.0 + Vue 3.5 + TypeScript 5.9 |
| 构建 | Vite 7.3 |
| 页面数 | 9 个 |
| 组件数 | 11 个（含 6 个服务子组件） |
| API 模块 | 2 个（auth + tablet，56 个接口） |
| Store | 2 个（auth + order） |
| 主题 | 暗黑轻奢金 (`#0f0f16` + `#c9a962`) |
| 用户 | 顾客（自助操作） |

---

## 二、逐模块评估

### 2.1 登录页 `/pages/login/index` — 评分: 5/5 ⭐

**完整实现**。虚拟数字键盘输入 6 位台桌码 → 自动提交 → `tablet.Auth/login` → 跳转首页。
- 数字键盘 + 隐藏 input 双通道输入
- LED 风格发光按钮，加载态完善
- 动画背景（3 个径向渐变圆 + 网格叠加 + 漂浮动画）
- 错误 Toast 提示

### 2.2 首页 `/pages/index/index` — 评分: 4/5 ⭐

双模式（空闲/有订单），核心功能完整：
- **空闲模式**: Hero + 快捷开台 + 预付开台 + 4 快捷入口
- **订单模式**: 订单卡片（计时器、费用、操作按钮）、并台/转台/取消
- 30 秒轮询 + WebSocket 实时同步
- Skeleton 加载骨架屏

**问题**:
- 🔴 `loadActivities()` API 失败时硬编码 5 条活动回退数据
- 🟡 音效系统全链路已搭建但被注释掉（TODO）
- 🟡 `getTagLabel`、`goToActivity`、`items-section` CSS 已定义但未使用
- 🟡 `statusText` 计算逻辑过多 fallback，暗示后端状态值不一致

### 2.3 商品点单 `/pages/product/index` — 评分: 4/5 ⭐

完整的预下单流程（顾客选品→提交预订单→服务员确认/拒绝）：
- 分类横滑 + 搜索 + 2 列商品网格 + 详情弹窗
- 购物车（加减数量、总价）+ 预订单状态跟踪
- WebSocket 监听 `order_item_status`、`preorder_confirmed`、`preorder_rejected`
- 30 秒轮询

**问题**:
- 🟡 `handleSearch()` 函数体为空（搜索靠计算属性实现）
- 🟡 分类加载失败静默忽略，无错误提示
- 🟡 `getStatusIcon` 定义但模板未使用

### 2.4 开台页 `/pages/order/index` — 评分: 2/5 ⚠️

单桌/并台开台，UI 完整但回退严重：
- 🔴 **严重回退**: `loadTables()` 失败时硬编码 8 张台桌数据
- 🔴 **无加载状态**: 无骨架屏/loading，API 响应前页面空白
- 🟡 并台用 `Promise.all` 逐个创建再合并，无原子性保证
- 🟡 页面名"开台"但路由 `/pages/order/index` 易混淆

### 2.5 账单页 `/pages/bill/index` — 评分: 3/5 ⚠️

- 🔴 **严重回退**: `loadOrder()` 失败时硬编码 3 项商品+完整账单
- 🔴 **0 值判断 Bug**: `table_fee || hourlyRate * hoursUsed` — 当 `table_fee=0` 时走上半段
- 🟡 初始 `orderData` 用占位日期 `2024-01-01`，API 不返回的字段保留默认值
- 🟡 无 loading 状态展示

### 2.6 助教页 `/pages/assistant/index` — 评分: 3/5 ⚠️

- 🔴 **礼物无 API**: 发送礼物仅本地 `gift_count++`，无服务端记录
- 🔴 **画廊占位**: 4 张图全部用同一张 `avatar` 循环渲染
- 🔴 **预约不传时长**: `handleBook` 提交时未传递用户选择的 1/2/3 小时
- 🟡 `level_id` 字段不在本地 `Assistant` interface 中
- 🟡 5 秒轮询频繁

### 2.7 服务呼叫 `/pages/service/index` — 评分: 3/5 ⚠️

- 🔴 **"查看全部"已停滞**: `handleViewAllRecords` 弹出 Toast "功能开发中"
- 🔴 **EvaluateModal 未使用**: 组件存在但从未导入
- 🟡 `getServiceTypes` 失败时回退到 `loadDefaultServices()` 硬编码数据
- 🟡 无空状态处理
- 🟡 记录列表限制 5 条，无分页

### 2.8 计分板 `/pages/score/index` — 评分: 3/5 ⚠️

10 款游戏类型，2832 行代码，最复杂的页面：

- 🔴 **斯诺克红球数量错误**: 硬编码 6 个红球（应为 15 个）
- 🔴 **斯诺克颜色缺失**: 缺少棕色 `'Br'`，`'B'`/`'BK'` 与标准命名不一致
- 🔴 **斯诺克回合永不切换**: `handleSnookerSink` 无条件 `snookerContinues=true`
- 🔴 **Chasing 模式评分未实现**: `chasingWinType` 设置后从未用于计分
- 🟡 无 3+ 玩家支持（UI 和逻辑均硬编码 2 人）
- 🟡 无撤销/重做
- 🟡 `selectGame` 定义但从未调用（setup 视图被跳过）

### 2.9 活动页 `/pages/activity/index` — 评分: 1/5 🔴

- 🔴 **全量硬编码**: `loadMockData()` 是唯一数据源
- 🔴 **参与功能空壳**: `participateActivity()` 只弹 Toast，无 API 调用
- 🔴 **接口类型不匹配**: 页面 `Activity` interface (13 字段) ≠ API `Activity` type (9 字段)

---

## 三、基础设施评估

### 3.1 API 层 — 评分: 4/5

| 项目 | 状态 |
|------|------|
| HTTP 客户端 | ✅ Token 注入、store_id/table_id 自动附加、code=2002 拦截 |
| Auth 模块 | ✅ login/logout/info 完整 |
| Tablet 模块 | ✅ 56 个方法，覆盖全部业务 |
| 错误处理 | ✅ 业务/网络/认证三类分类 |

### 3.2 Store 层 — 评分: 3/5

| Store | 评估 |
|-------|------|
| authStore | ✅ 登录/登出/token 管理。🟡 `checkTokenExpiry` 读取 `tokenExpiry` 但永不被写入→死代码 |
| orderStore | ✅ 完整订单生命周期。🔴 `tableHourlyRate` 默认值 `38` 硬编码。🟡 `cartTotal` 价格字段回退链过长 |

### 3.3 WebSocket — 评分: 3/5

- ✅ 自动重连（指数退避，最多 5 次）
- ✅ Ping/Pong 25 秒心跳
- ✅ 引用计数多页面共享连接
- 🔴 **硬编码回退 IP**: `ws://132.232.166.40:8282`
- 🔴 **无 wss://**: 仅 `ws://`，生产环境不安全
- 🔴 **`require('@/config')`**: ES 模块中使用 CJS require

### 3.4 配置 — 评分: 2/5

- 🔴 **生产 URL 指向开发机**: `BASE_URL=http://192.168.1.70:10002/storeapi`
- 🔴 **WS_URL 硬编码**: `ws://132.232.166.40:8282` 开发/生产相同

---

## 四、后端 API 覆盖分析

### 前端 56 个 API 调用 × 后端 8 个 Tablet Controller

| 控制器 | 方法数 | 前端调用 | 覆盖率 |
|--------|--------|----------|--------|
| OrderController | 33 | 33 | 100% |
| ScoreController | 9 | 10 | 90% |
| AssistantController | 11 | 6 | 100% |
| ServiceCallController | 5 | 5 | 100% |
| IndexController | 7 | 3 | 100% |
| ProductController | 3 | 3 | 100% |
| AuthController | 3 | 3 | 100% |

### 缺失的后端接口（6 个）

| # | 前端调用 | 说明 |
|---|---------|------|
| 1 | `GET /tablet.Order/getAvailableTables` | OrderController 无此方法 |
| 2 | `GET /tablet.Order/getMergeableOrders` | OrderController 无此方法 |
| 3 | `POST /tablet.ScoreBoard/updateScore` | 无 ScoreBoardController |
| 4 | `POST /tablet.ServiceEvaluate/create` | 无 ServiceEvaluateController |
| 5 | `GET /tablet.Bill/getBill` | OrderController::getBill 在 `/tablet.Order/getBill`，路径不匹配 |
| 6 | `POST /tablet.Bill/pay` | 无此方法（checkout 在 OrderController） |

---

## 五、Bug 清单

### P0 阻断（9 项）

| # | 位置 | 问题 |
|---|------|------|
| 1 | `pages/order/index.vue` | 台桌列表 API 失败时硬编码回退数据 |
| 2 | `pages/bill/index.vue` | 账单 API 失败时回退完整硬编码订单 |
| 3 | `pages/bill/index.vue` | `tableFee \|\| hourlyRate * hoursUsed` 0 值判断错误 |
| 4 | `pages/activity/index.vue` | 活动数据全量硬编码，参与按钮无 API |
| 5 | `pages/activity/index.vue` | Activity interface 与 API type 字段不匹配 |
| 6 | `config/env.ts` | 生产 URL 指向开发机 192.168.1.70 |
| 7 | `utils/websocket.ts` | 硬编码回退 IP + 仅 ws:// 无 wss:// |
| 8 | `utils/websocket.ts` | `require('@/config')` 在 ES 模块中无效 |
| 9 | `pages/score/index.vue` | 斯诺克红球 6 个非 15、颜色缺失、回合永不切换 |

### P1 高优（8 项）

| # | 位置 | 问题 |
|---|------|------|
| 10 | `pages/assistant/index.vue` | 礼物发送无 API、画廊 4 图同源、预约不传时长 |
| 11 | `pages/service/index.vue` | "查看全部"已停滞、EvaluateModal 未使用 |
| 12 | `stores/auth.ts` | `checkTokenExpiry` 读取不存在字段→死代码 |
| 13 | `stores/order.ts` | `tableHourlyRate` 默认值 38 硬编码 |
| 14 | `pages/score/index.vue` | Chasing 计分未实现、无 3+玩家、无撤销 |
| 15 | `components/service/` | `adjustColor` 空壳函数（ServiceCard+VipCard 各一份） |
| 16 | `pages/index/index.vue` | 音效系统全链路搭建但被注释 |
| 17 | `types/index.ts` | `ServiceCall` 重复定义两次（字段名不同） |

### P2 低优（6 项）

| # | 位置 | 问题 |
|---|------|------|
| 18 | `pages/order/index.vue` | 无加载骨架屏 |
| 19 | `pages/bill/index.vue` | 无 loading 状态展示 |
| 20 | `stores/index.ts` | `orderStore` 未从 barrel 导出 |
| 21 | `pages/index/index.vue` | `getTagLabel`、`goToActivity` 死代码 |
| 22 | `pages/product/index.vue` | `handleSearch` 空函数、`getStatusIcon` 未使用 |
| 23 | `pages/score/index.vue` | `selectGame` 死代码、setup 视图永远不可达 |

---

## 六、亮点

1. **暗黑轻奢金主题** — 统一的 `#0f0f16` + `#c9a962` 设计语言，动画精美
2. **预下单系统** — 顾客选品→预订单→服务员确认/拒绝，闭环完整
3. **10 款计分游戏** — 从美式八球到斯诺克到追分，覆盖面广
4. **WebSocket 实时通信** — 自动重连、心跳保活、事件分发
5. **组件化架构** — ServiceCard/VipCard/ServiceModal/EvaluateModal/SuccessModal 职责清晰
6. **完整的订单状态机** — 开台→消费→结账→并台→转台→取消

---

## 七、生产就绪度

```
当前: ██████████░░░░░░░░░░  ~60%

Week 1: P0 修复（硬编码数据、生产配置、斯诺克逻辑）
Week 2: P1 修复（缺失 API、礼物/评价/活动功能）
Week 3: 后端补齐 6 个缺失接口 + 联调
Week 4: H5 横屏适配验证 + 性能优化

预计距离正式上线: 3-4 周
```

### 与 wwwstoreapp 对比

| 维度 | wwwstoreapp | wwwtable |
|------|-------------|----------|
| 页面数 | 33 | 9 |
| API 覆盖 | 100% | 89% (50/56) |
| 硬编码回退 | 极少 | 3 页面严重 |
| 代码质量 | 较高 | 中等（死代码较多） |
| 主题风格 | 清爽白绿 | 暗黑轻奢金 |
| 核心流程 | 完整 | 完整但有 Bug |
