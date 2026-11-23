# wwwstoreapp 生产就绪度评估报告

> 日期: 2026-06-08 | 状态: 已确认 | 综合评分: 3.1/5

## 一、项目概况

wwwstoreapp（台屏智联）是基于 uni-app Vue3 + TypeScript 的球房管理移动端 APP，支持 H5 / 微信小程序 / Android / iOS。当前 33 个页面、13 个 API 模块、4 个 Store、后端 14 个 Mobile Controller 全部就绪。

## 二、阻断性 Bug（P0 — 5 项）

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| 1 | `src/pages/profile/edit.vue` | 头像上传完全失效 — chooseImage 仅存本地临时路径，从未调用 uploadFile 上传至服务器 | 用户换头像不生效 |
| 2 | `src/pages/profile/feedback.vue` | 意见反馈是假的 — handleSubmit 用 setTimeout(1000) 模拟 API 调用 | 用户反馈永久丢失 |
| 3 | `src/pages/table/pending-products.vue` | Vue 2 语法 `\| toFixed2` 在 Vue 3 中报错 | 页面运行时崩溃 |
| 4 | `src/pages/table/pending-products.vue` / `src/pages/table/pending-assistants.vue` | 模板中无返回按钮渲染 — CSS 已定义但 HTML 缺失 | 用户无法返回 |
| 5 | `src/config/env.ts` | 生产环境 BASE_URL 硬编码为 `http://127.0.0.1:10002/storeapi` | 生产构建无法连接真实 API |

## 三、高优先级 Bug（P1 — 6 项）

| # | 文件 | 问题 |
|---|------|------|
| 6 | `src/pages/checkin/record.vue` | 逻辑死锁 — filter 过滤掉缺勤记录后从同一集合统计 absent，永远为 0 |
| 7 | `src/pages/checkin/record.vue` | 分页不足 — 固定 page_size=31，多员工月份数据可能被截断 |
| 8 | `src/pages/index/AssistantHome.vue` | 订单详情是假的 — 完成订单点击弹出 showModal 纯文本，非真实详情页 |
| 9 | `src/pages/checkin/index.vue` | 内存泄漏 — setInterval 每秒刷新时钟，onUnmounted 未 clearInterval |
| 10 | `src/components/Header.vue` | 事件监听泄漏 — uni.$on('storeChange') 在模块作用域注册且永不清除 |
| 11 | `src/components/TabBar.vue` | 导航方式错误 — 使用 uni.redirectTo 而非 uni.switchTab |

## 四、功能缺口（P2 — 5 项 + 类型安全）

| # | 功能 | 位置 | 当前状态 |
|---|------|------|----------|
| 12 | 忘记密码 | `login/index.vue` | Toast "请联系管理员重置密码" |
| 13 | 修改密码 | `settings/index.vue` | Toast "功能开发中" |
| 14 | 查看全部排行榜 | `performance/index.vue` | Toast "暂无更多排行" |
| 15 | 管理员联系方式 | `profile/help.vue` | 硬编码 `138-xxxx-xxxx` |
| 16 | 通知开关持久化 | `settings/index.vue` | 仅内存状态 |
| — | employee/schedule 类型标注 | `api/modules/` | 全部 `Promise<any>` |
| — | 选择器组件 any 类型 | AssistantSelector, MemberSelector, ProductSelector | 大面积 any |

## 五、后端 API 就绪状态

14 个 Mobile Controller 全部实现：MobileController, CheckinController, ScheduleController, AssistantOrderController, ApprovalController, ApplyController, PerformanceController, ProfileController, NotificationController, TableController, OrderController(14 methods), ProductController, AssistantController, AssistantTagController。

## 六、实施计划

分 3 轮迭代：
- **Round 1 (P0)**: 修复 5 个阻断性 Bug — 预计 2-3 小时
- **Round 2 (P1)**: 修复 6 个高优先级 Bug — 预计 3-4 小时  
- **Round 3 (P2)**: 补齐功能缺口 + 类型安全加固 — 预计 4-6 小时

预计总工时: 10-15 小时，可在 1-2 周内完成。
