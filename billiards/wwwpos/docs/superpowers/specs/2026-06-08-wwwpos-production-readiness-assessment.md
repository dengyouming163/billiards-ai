# wwwpos 生产就绪度评估报告

> 日期: 2026-06-08 | 综合评分: 2.2/5 | 框架: Next.js 16 + React 19 + Electron 42

---

## 一、项目概况

wwwpos 是台球厅 POS 收银终端，20 个业务弹窗组件，支持 Web + Electron 双端。

| 属性 | 值 |
|------|-----|
| 页面 | 3（login, select-store, pos主界面） |
| 弹窗组件 | 18 个 |
| UI 组件 | 6 个 |
| API 端点 | 70+ |
| 状态管理 | React Context + useReducer |
| 离线支持 | 部分（骨架已有，核心逻辑刚补） |

---

## 二、致命问题（P0 — 4 项）

| # | 组件/文件 | 问题 | 影响 |
|---|----------|------|------|
| 1 | **CheckoutModal.tsx** | `handleComplete` 未调用后端结账 API。800ms fake timeout 后仅本地 dispatch。**支付数据永不到达服务器** | 🔴 收银不记账，财务数据丢失 |
| 2 | **AppContext.tsx** | `loadInitialData` 离线回退中 `SET_TABLES: []`，忽略了 `initCache()` 返回的真实缓存数据 | 🔴 断网启动时显示空台桌列表 |
| 3 | **TableBoard + CheckoutModal** | 台费计算三处不一致：TableBoard 15分钟块、CheckoutModal 整小时ceil、TableDrawer 4种模式（含75% session硬编码） | 🔴 同一张台桌在三个地方显示三种费用 |
| 4 | **transferMergeModal** | `currentTableStats` 的 `perGame` 模式硬编码 `5` 元/局 | 🟡 单价错误 |

---

## 三、高优问题（P1 — 12 项）

### 3.1 数据流与状态

| # | 问题 | 位置 |
|---|------|------|
| 5 | `openTable` 离线操作未入队（`closeTable` 有入队但 `openTable` 没有） | AppContext.tsx:700 |
| 6 | `syncOfflineData` 无重试逻辑，failed 操作静默丢弃 | AppContext.tsx:1066 |
| 7 | `TechnicianModal` 修改助教状态**纯本地操作，无 API 同步** | TechnicianModal.tsx |
| 8 | `ShiftModal` `startShift` 的 `openingCash` 硬编码为 `0`，无用户输入机会 | AppContext + ShiftModal |

### 3.2 用户体验

| # | 问题 | 位置 |
|---|------|------|
| 9 | `ProductOrderModal` 提交成功时 `orderRemarks` 从未发送到服务器 | ProductOrderModal.tsx:240 |
| 10 | `MemberModal` 注册表单按钮在内容区可滚动出视口 | MemberModal.tsx:439 |
| 11 | `StatisticsModal` 刷新按钮使用 stale closure 默认参数 | StatisticsModal.tsx:51 |
| 12 | 多个组件错误处理静默：TransferMergeModal、AssistantModal、QuickOrderModal | 6个组件 |

### 3.3 类型与架构

| # | 问题 | 位置 |
|---|------|------|
| 13 | `AppState` 在 `types/index.ts` 和 `AppContext.tsx` 中**重复定义**，形状不同 | types + context |
| 14 | `OfflineOperation.data` 使用 `any` 类型，`syncOfflineData` 依赖运行时强制类型转换 | types/index.ts:291 |
| 15 | `API_TIMEOUT` 定义但从未在 `client.ts` 的 `fetch` 调用中使用 | config.ts |
| 16 | `middleware.ts` 仅检查 token 存在，不验证有效性 | middleware.ts |

---

## 四、低优问题（P2 — 8 项）

| # | 问题 |
|---|------|
| 17 | CSS 变量 `var(--color-cash)` 等未在任何组件中定义，CheckoutModal 依赖不可见 |
| 18 | `PromotionBanner` 仅展示第一条促销，多条不轮播 |
| 19 | `QuickPanel` ActionCard 标签分割逻辑脆弱（中文 2/4 字硬编码） |
| 20 | `HistoryOrdersModal` 无 search debounce |
| 21 | `ShiftModal` tabs 共享 `selectedEmployeeId`/`password` 状态，语义冲突 |
| 22 | `offline-cache.ts` 数组 O(n) 查找，无 Map 索引 |
| 23 | `HeaderBar` 登录按钮无 onClick 处理器 |
| 24 | `ModalContainer` 不支持 Escape 键关闭和背景点击关闭 |

---

## 五、亮点

1. **组件化架构成熟** — 18 个弹窗组件职责清晰，ModalContainer 统一布局
2. **离线骨架前瞻性** — AppContext 在建之初就预留了 `networkStatus`/`offlineQueue`/`SET_NETWORK_STATUS` 等 action
3. **Mock 数据完备** — `mock-data.ts` 覆盖全部实体（12桌/27商品/5助教/6套餐/5促销）
4. **API 层设计不错** — snake→camel 自动转换、storeId 自动注入、token 过期全局拦截
5. **UI 质量高** — 暗黑主题、渐变卡片、动画效果（HeaderBar/网络状态指示器等）

---

## 六、就绪度评估

```
功能完整性:  ████████░░░░░░░░░░░░  40%  ← 结账缺失是关键
代码质量:    ██████████░░░░░░░░░░  50%
离线能力:    ████████████░░░░░░░░  60%  ← 骨架好但实现深度不足
类型安全:    ██████░░░░░░░░░░░░░░  30%  ← any 泛滥 + 重复类型定义
用户体验:    ████████████░░░░░░░░  65%

综合: ~47% 就绪
```

### 与 wwwstoreapp / wwwtable 对比

| 维度 | wwwstoreapp | wwwtable | wwwpos |
|------|:--:|:--:|:--:|
| 初始就绪度 | 75% | 60% | **47%** |
| P0 致命问题 | 5 | 9 | **4** |
| API 覆盖率 | 100% | 89% | ~85% |
| 核心流程 | 完整 | 完整但有 Bug | **结账缺失** |
| UI 质量 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 七、修复优先级

```
Phase 1 (P0): CheckoutModal 接真实 API + 台费统一 + 离线缓存修复     预计 3-4h
Phase 2 (P1): 错误处理补全 + openTable 离线 + TechnicianModal 接 API   预计 4-6h
Phase 3 (P2): CSS 变量定义 + ModalContainer 增强 + 类型清理            预计 3-4h

预计总工时: 12-15h，可分 2-3 天完成
```
