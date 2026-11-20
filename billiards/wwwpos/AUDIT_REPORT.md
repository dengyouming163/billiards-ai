# wwwpos 全量代码审计报告

> 审计日期：2026-07-04 | 审计范围：~/www/wwwpos/src 全部 124 源文件 | ~22,000 行代码

---

## 一、项目概览

| 维度 | 数据 |
|---|---|
| 技术栈 | Next.js 16 (Turbopack) + React 19 + TypeScript + Electron |
| 源文件数 | 124 个（35 组件 + 50 UI组件 + 12 API层 + 13 工具/服务 + 14 其他） |
| 核心组件 | TableBoard(982行), TableDrawer(1033行), CheckoutModal(617行), MemberModal(917行), CouponVerifyModal(640行) |
| 状态管理 | React Context + useReducer (AppContext 1358行) |
| 离线能力 | 离线队列、离线缓存、离线计费、WebSocket+心跳 |
| 部署方式 | Electron 桌面打包 + Next.js 服务端 (PM2) |

---

## 二、严重问题 (P0 — 必须立即修复)

### 2.1 离线同步端点完全是空壳
**文件:** `src/app/api/sync/route.ts` (65行)
**问题:** 所有 `case` 分支只有注释没有实现代码，队列的任何操作（开台/关台/支付/充值）推送到这个端点后全部被丢弃，但返回 `success: true`。操作类型字符串也与 `offline-queue.ts` 不匹配。
**影响:** 离线模式下所有操作在上线后被静默丢弃，数据永久丢失。
**修复:** 对齐操作类型枚举，实现每个 case 的实际处理逻辑。

### 2.2 离线队列重放时先清空再执行
**文件:** `src/utils/offline-queue.ts` (57-59行)
**问题:** `replayAll()` 先把整个队列复制→清空→存 localStorage→再逐条重放。如果在重放中途浏览器崩溃或用户关闭标签页，未重放的队列项永久丢失。
**修复:** 单条确认成功后逐条删除，不要事前清空。

### 2.3 `slice(0,0)` 导致离线缓存永远返回空台桌
**文件:** `src/context/AppContext.tsx` (610行)
**问题:** `cached.zones.map(...).slice(0, 0)` — `slice(0,0)` 返回空数组。离线回退时用户看到空台桌列表。
**修复:** 移除 `.slice(0,0)`。

### 2.4 缓存中的 `openTable` callback 过期闭包
**文件:** `src/context/AppContext.tsx` (787行)
**问题:** `openTable` 的 `useCallback` 依赖数组缺少 `state.currentOperator` 和 `state.networkStatus`，导致每次调用使用的都是旧值。`closeTable`、`assignAssistant`、`removeAssistant` 也有同样问题。
**修复:** 补全依赖数组或改用 ref。

---

## 三、高风险问题 (P1 — 本迭代修复)

### 3.1 类型安全全面坍塌

| 文件 | 问题 |
|---|---|
| 几乎所有组件 | `as any` 和 `as Record<string, unknown>` 被广泛使用 |
| `types/index.ts` | `OfflineOperation.data: any` — 离线队列核心数据类型未定义 |
| `lib/api/pos.ts` | API 参数都定义为 `Record<string, unknown>` 而非具体接口 |
| `CheckoutModal` | 整个 checkout payload 以 `} as any` 结尾 |
| `QuickPanel` | `shiftSummary` 用 `useState<any>(null)` 无类型 |
| `SettingApi` | `getDiscountList` 返回 `any[]` |
| `TableBoard` | `item.status !== 'preorder_pending' as any` |

**影响:** TypeScript 完全失效，运行时错误只能在生产环境暴露。
**修复:** 定义 `ShiftSummary`、`NormalizedBillData`、`OpenOrderParams` 等接口，逐步消除 `as any`。

### 3.2 双字段命名（snake_case + camelCase）同时存在
**文件:** `TableDrawer.tsx` (30+处), `CheckoutModal.tsx` (15+处)
**模式:** `(billData?.tableFee || billData?.table_fee)`、`(billData?.tablePausedAt || billData?.table_paused_at)` 等
**影响:** 每个字段读两次，API 响应格式变化时极易漏改。
**修复:** 在 API 响应入口处做一次 `normalizeBillData()` 归一化。

### 3.3 `window.location.replace/href` 硬导航
**文件:** `ShiftModal.tsx` (2处), `login/page.tsx` (1处), `select-store/page.tsx` (1处), `HeaderBar.tsx` (1处)
**问题:** 用浏览器硬导航代替 Next.js router，销毁所有内存状态、WebSocket 连接。
**修复:** 改用 `next/navigation` 的 `useRouter()`。

### 3.4 API 路由无认证保护
**文件:** `proxy.ts` (31行) + 全部 6 个 API route 文件
**问题:** 中间件显式排除 `/api` 路由，所有 mock API 无认证检查。
**修复:** 添加认证中间件或确认后端独立处理认证。

### 3.5 WebSocket 无 pong 超时检测
**文件:** `ws-notification.ts` (62-66行)
**问题:** 客户端发 ping 但从不检查 pong 响应。TCP 连接假活（服务器进程挂起但 socket 未断开）时永远不会触发重连。
**修复:** 记录上次 pong 时间，10秒超时强制重连。

### 3.6 离线乐观更新的回滚缺失
**文件:** `AppContext.tsx` (923-961行)
**问题:** `rechargeMember`/`deductMemberBalance` 先更新本地状态再调 API，API 失败时本地状态不回滚。
**修复:** API 失败时 dispatch 回滚 action，或先调 API 成功后再更新本地。

---

## 四、中等问题 (P2 — 下迭代修复)

### 4.1 巨型组件

| 组件 | 行数 | 症状 |
|---|---|---|
| TableDrawer | 1,033 | 包含计费、点单、助教、加钟、暂停全部混在一起 |
| TableBoard | 982 | TableCard + TableRow + 右键菜单全部内联 |
| MemberModal | 917 | 搜索/注册/充值/记录四合一体 |
| CheckoutModal | 617 | 计费/折扣/抹零/微信支付/打印全部混杂 |
| CouponVerifyModal | 640 | 套餐选择/微信支付/美团验券/抖音验券混在一起 |

**建议:** 每个至少拆分为 3-5 个子组件。

### 4.2 重复代码模式

| 模式 | 文件 |
|---|---|
| 计费 timer useEffect (~40行) | TableBoard.tsx 的 TableCard 和 TableRow 各一份 |
| 提醒面板架构 | OrderReminderModal 和 AssistantReminderModal 几乎完全相同 |
| `formatRelativeTime` | NotificationPanel 和 NotificationToast 各一份 |
| WeChat 扫码支付流程 | MemberModal、CouponVerifyModal、QuickOrderModal 各一份 |
| 快捷充值按钮组 | MemberModal 的现金和微信 tab 各一份 |

### 4.3 静默错误吞咽（20+处）
**文件:** MemberModal, AssistantModal, OrderReminderModal, TransferMergeModal, BuyoutPaymentModal 等
**模式:** `.catch(() => {})`、`catch { /* ignore */ }`、`catch { console.error(...) }`（不展示给用户）
**影响:** 用户无任何操作失败反馈。

### 4.4 `alert()`/`prompt()`/`confirm()` 原生弹窗
**文件:** TableBoard, CheckoutModal, TableDrawer, NotificationPanel
**问题:** 阻塞主线程、无法定制样式、在 Electron 中体验差。
**修复:** 统一用 sonner toast 或自定义 Modal。

### 4.5 异步操作缺少 mounted 守卫
**文件:** TableDrawer (`refreshBill`), CheckoutModal (`handleCheckout`, `doPrint` setTimeouts), QuickPanel (轮询 effects)
**问题:** 组件卸载后仍调用 `setState`，React 18 strict mode 下报 warning。
**修复:** 使用 `useRef` 标记 mounted 状态。

### 4.6 缺少 `useMemo`/`React.memo`
**文件:** AppContext (9个计算属性), TableBoard (TableCard/TableRow)
**问题:** 每次渲染重新计算 filteredTables、cartTotal 等，TableCard 组件每次重渲染都重新执行 useEffect timer。
**修复:** 关键计算属性用 `useMemo`，TableCard/TableRow 用 `React.memo`。

---

## 五、低优先级改进 (P3)

### 5.1 ModalShell 可访问性缺失
- 无 `role="dialog"`、`aria-modal`、`aria-labelledby`
- 无 Escape 键关闭
- 无 body scroll lock
- 固定 `width: 50vw; height: 80vh` 不能覆盖

### 5.2 全局样式问题
- 字体从 `fonts.googleapis.cn` CDN 加载，无 fallback
- 主题色 token `--color-primary: #10E0A2` 但 primary 按钮是 amber 渐变
- 无暗色模式支持
- 滚动条样式仅 WebKit 浏览器生效

### 5.3 时间处理不一致
- `billing.ts` 用客户端 `Date.now()` / `new Date().getHours()`（本地时区）
- 服务端可能用 UTC 或其他时区
- 时段系数可能因客户端时钟错误而算错

### 5.4 localStorage 无版本化/迁移机制
- `currentOperator`、`currentShift`、`token`、`userInfo` 格式变化时静默失败
- 无 schema 校验

### 5.5 无数据缓存层
- 所有数据获取用 `useEffect` + 手动调用
- 无 stale-while-revalidate、无请求去重
- 台桌刷新靠自定义 `pos:refresh-tables` DOM 事件传递

### 5.6 打印机 iframe 清理硬编码
- 固定 3000ms 后删除 iframe，用户打印对话框点慢了就被打断
- `window.close()` 在 iframe 内无效
- 商品过滤用硬编码中文 `['台费', '助教费', '充电费']`

### 5.7 Mock 数据问题
- 促销日期全在 2024 年（已过期）
- Mock API `route.ts` 的 shallow copy 会污染 mock 数据源
- 离线计费 `DISCOUNT_MAP` key 可能与后端不一致

---

## 六、架构评分

| 维度 | 评分 | 说明 |
|---|---|---|
| 代码组织 | ★★★☆☆ | 目录结构合理，但巨型组件过多 |
| 类型安全 | ★★☆☆☆ | `as any` 泛滥，核心类型未定义 |
| 状态管理 | ★★★☆☆ | useReducer 方案可用，但缺少 memo 优化 + 过期闭包 bug |
| 错误处理 | ★★☆☆☆ | 20+处静默吞咽，无统一错误边界 |
| 离线能力 | ★★☆☆☆ | 框架搭建完整但 sync 端点是空壳、回滚缺失 |
| 可测试性 | ★☆☆☆☆ | 零单元测试，业务逻辑与 UI 强耦合 |
| 可维护性 | ★★☆☆☆ | 大量重复代码、不一致的 API 参数风格 |
| 可访问性 | ★☆☆☆☆ | Modal 无 a11y 属性，无键盘导航 |
| 安全性 | ★★☆☆☆ | API 路由无认证、token 双存 localStorage+cookie |
| 性能 | ★★★☆☆ | 缺少 memo 优化但有 WebSocket 实时推送 |

**综合评分: 2.2/5.0 — 功能可用但技术债务严重**

---

## 七、优先级排序的修复路线图

### 第一阶段（立即，2-3天）
1. 修复 `slice(0,0)` 导致离线缓存空白
2. 修复离线队列重放的事前清空逻辑（改为事后逐条确认）
3. 实现 `api/sync/route.ts` 的实际同步逻辑
4. WebSocket 添加 pong 超时检测

### 第二阶段（本周，3-5天）
5. 定义核心 API 响应类型（ShiftSummary、NormalizedBillData）
6. TableDrawer + CheckoutModal 统一 snake/camel 归一化
7. 补全 `openTable` 等 callback 的依赖数组
8. 硬导航改为 Next.js router
9. 添加 mounted 守卫到异步 handler

### 第三阶段（下迭代，1-2周）
10. 拆分 TableDrawer/TableBoard/MemberModal 巨型组件
11. 提取重复的 WeChat 支付、提醒面板、快捷充值组件
12. 离线乐观更新添加回滚
13. `useMemo`/`React.memo` 性能优化
14. ModalShell a11y 改造

### 第四阶段（持续改进）
15. 引入 React Query / SWR 数据缓存层
16. 添加单元测试（计费、离线队列、通知去重）
17. 暗色模式支持
18. 消除所有 `as any`
