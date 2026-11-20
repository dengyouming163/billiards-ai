# wwwstoreapp 生产级质量优化 — 设计方案

> 将 wwwstoreapp 商家管理APP从"初步可用"提升到"生产级商用水准"，覆盖全平台（Android/iOS/H5/微信小程序）。

## 项目概况

- **项目**: wwwstoreapp — UniApp Vue3 商家管理移动端
- **目标平台**: Android App + iOS App + H5 + 微信小程序
- **后端**: PHP ThinkPHP REST API（已就绪）
- **页面数**: 33 个页面
- **角色**: 老板/管理员、助教、服务员（三套首页 + 差异化权限）

## 架构说明

采用 **分层渐进式优化** 策略，四层递进：

```
L1 基础稳固 → L2 交互完整 → L3 功能闭环 → L4 体验打磨
```

每层有独立的验收标准，前一层是后一层的前提。每层产出可独立审阅。

---

## L1 基础稳固层

### 目标

消除所有代码层面的隐患，建立稳固的类型和错误处理基础。0 TypeScript 错误，统一错误处理模式。

### 1.1 TypeScript 类型安全

| 问题 | 文件 | 修复 |
|------|------|------|
| `RequestOptions` 使用 `any` 类型 | `src/api/request.ts` | 增加泛型约束 `<T = Record<string, unknown>>` |
| `_permissions` 命名不规范 | `src/stores/auth.ts` | 重命名为 `permissionCodes` |
| `storeId` 返回类型不一致 | `src/stores/auth.ts` | 统一为 `number` |
| API 函数返回 `Promise<any>` | `src/api/modules/*.ts` | 每个函数补充完整返回类型标注 |
| 缺少统一请求类型 | 新增 | `src/types/request.ts` — `ApiResponse<T>`, `PaginatedData<T>`, `RequestOptions<T>` |

### 1.2 空值防御体系

- 建立全局空值处理策略：区分 `undefined`（未加载）、`null`（无数据）、`[]`（空列表）
- 所有 `catch {}` 改为 `catch (e) { console.error('[ModuleName]', e); /* 设置 error 状态 */ }`
- `computed` 属性增加防御性检查：`item?.revenue ?? 0`
- 模板中 `v-if="data"` 区分 `v-if="data !== undefined"`（避免 `0` 被当作 falsy）

### 1.3 统一错误处理

- **新增** `src/api/error-handler.ts` — 三种错误类型分类：
  - `AUTH_ERROR`（code=2002）→ 清除 token → 跳转登录
  - `BUSINESS_ERROR`（code=0）→ 展示 message
  - `NETWORK_ERROR`→ 提示网络异常 + 重试按钮
- 重构 `request.ts` 消除 `get/post/put/del` 四个函数的重复逻辑
- 增加 `showError` / `showLoading` 细粒度控制

### 1.4 代码规范整理

- 所有 `.vue` 文件 `<style>` 块格式化（统一缩进 2 空格）
- 移除全局 `console.log`（保留条件编译的 dev 日志）
- `constants/permissions.ts` 标注本地默认值 vs 后端返回值
- 修复已知 ESLint 问题

### L1 验收标准

- 0 个 TypeScript 编译错误
- 0 个 ESLint 警告
- 无 `console.log` 残留
- 无 `any` 类型在核心 API 路径中
- 所有 `catch` 块有日志输出

---

## L2 交互完整层

### 目标

每个数据驱动页面覆盖四种交互状态（Loading / Empty / Error / Content），杜绝白屏和死界面。

### 2.1 四态统一规范

**新增组件：**

| 组件 | 文件 | 职责 |
|------|------|------|
| `StateView` | `src/components/StateView.vue` | 接收 `loading`/`empty`/`error`/`errorMsg` props，自动切换四态 |
| `SkeletonBox` | `src/components/SkeletonBox.vue` | 骨架屏原子组件（宽高/圆角/动画） |
| `EmptyState` | `src/components/EmptyState.vue` | 空状态组件（预设场景：无数据/无订单/无通知/网络异常） |

**页面接入计划：** 25+ 个数据驱动页面逐一接入 `StateView`，替换现有裸 `v-if` 加载逻辑。

### 2.2 下拉刷新 & 触底加载

- 所有列表页（8个）增加 `refresher-enabled` + `scrolltolower` 触底加载
- 分页 API 统一返回格式 `{ lists: T[], count: number, page_no: number }`

### 2.3 Toast 反馈闭环

操作反馈规范：
- **创建/更新/删除** → `uni.showToast({ icon: 'success' })` + 自动刷新列表
- **失败** → `uni.showToast({ icon: 'error' })` + 保留当前页数据
- **文件上传** → `uni.showLoading({ title: '上传中...' })` → 完成 toast
- **长时间操作** → 进度提示

### 2.4 安全区适配

- 全部页面审查 `padding-top: env(safe-area-inset-top)` / `padding-bottom: env(safe-area-inset-bottom)`
- TabBar 高度包含底部安全区
- Header 组件增加 status-bar 高度适配

### L2 验收标准

- 所有数据驱动页面四态完整（Loading → Empty/Error/Content）
- 所有列表页支持下拉刷新
- 所有操作有即时反馈（toast/haptic）
- 全面屏机型底部无遮挡

---

## L3 功能闭环层

### 目标

逐页端到端验证，确保每个功能链路完整可用，与后端 API 真实对接。

### 3.1 按角色验证矩阵

**老板/管理员：** 数据看板 → 员工CRUD → 审批处理 → 台桌管理全流程 → 门店设置 → 个人中心

**助教：** 接单中心 → 进行中订单 → 我的业绩 → 打卡签到 → 排班查询 → 个人中心

**服务员：** 工作台 → 台桌管理 → 打卡签到 → 申请中心 → 排班查询

### 3.2 33 页逐页验收清单

| # | 页面路径 | 验证要点 |
|---|---------|---------|
| 1 | `login/index` | 短信登录、密码登录、Token 持久化 |
| 2 | `index/index` | 角色分发（Owner/Assistant/Employee）|
| 3 | `index/OwnerHome` | 营收看板、趋势图、TOP商品、待办事项、日期切换 |
| 4 | `index/AssistantHome` | 接单中心入口、业绩概览、今日排班 |
| 5 | `index/EmployeeHome` | 工作台快捷入口、今日统计 |
| 6 | `notification/index` | 通知列表、未读标记、全部已读 |
| 7 | `notification/detail` | 详情展示、自动标记已读 |
| 8 | `approval/index` | 审批列表、状态筛选（待审批/已处理）|
| 9 | `approval/detail` | 审批详情、同意/拒绝操作 |
| 10 | `approval/create` | 申请表单、类型选择、提交 |
| 11 | `approval/my-records` | 我的申请记录列表 |
| 12 | `checkin/index` | 签到/签退、GPS 定位、打卡按钮状态 |
| 13 | `checkin/record` | 打卡记录列表、日期筛选 |
| 14 | `orders/index` | 待接单列表、接单/拒绝操作 |
| 15 | `orders/active` | 进行中订单、开始服务/结束服务/确认完成 |
| 16 | `performance/index` | 业绩数据卡片、收入趋势图、日期筛选 |
| 17 | `schedule/index` | 本周排班日历视图 |
| 18 | `employee/list` | 员工列表、搜索、角色筛选、分页 |
| 19 | `employee/detail` | 员工详情、联系信息、角色标签 |
| 20 | `employee/add` | 新增表单、角色选择、手机号校验 |
| 21 | `employee/edit` | 编辑表单、数据回填、保存 |
| 22 | `table/index` | 台桌列表、区域筛选、状态筛选 |
| 23 | `table/detail` | 台桌详情、当前订单、操作菜单 |
| 24 | `table/order` | 开台/点单、商品选择、套餐选择 |
| 25 | `table/assistant` | 添加/更换助教 |
| 26 | `table/merge` | 并台操作 |
| 27 | `table/log` | 操作日志列表 |
| 28 | `work/index` | 工作台快捷入口（按权限显示）|
| 29 | `profile/index` | 个人资料展示 |
| 30 | `profile/edit` | 资料编辑、头像上传 |
| 31 | `profile/album` | 相册管理、图片上传/删除 |
| 32 | `profile/assistant` | 助教宣传页编辑 |
| 33 | `settings/index` | 门店设置、关于页面、退出登录 |

### 3.3 关键问题修复

| 问题 | 文件 | 修复 |
|------|------|------|
| `goToApproval` 使用 `redirectTo` | `OwnerHome.vue` | 改为 `navigateTo` |
| `mobile:report` 路径为空 | `usePermission.ts` | 确认功能需求后处理 |
| Token 过期处理 | `request.ts` | 确保 code=2002 全局拦截生效 |
| 门店切换数据刷新 | `authStore` | 切换门店后清空缓存 + 触发首页重载 |
| 权限缓存时长 | `authStore` | 从 5 分钟改为 **1 小时** |

### L3 验收标准

- 33 页全部功能链路可走通
- 每个角色完整操作流无阻断
- 门店切换后数据正确刷新
- Token 过期全局拦截生效
- 跨页面数据一致

---

## L4 体验打磨层

### 目标

从"能用"提升到"好用"，多端一致的流畅体验。

### 4.1 图标体系升级

- 建立 `src/constants/icons.ts` 图标映射表
- 全局替换 emoji icon → `<uni-icons>`
- 业务特有图标使用 iconfont 或 SVG 方案

### 4.2 动画与过渡

- `pages.json` 增加页面路由动画（`slide-in-right`）
- 操作按钮增加 `:active` 缩放反馈
- 列表操作（删除/状态变更）增加过渡动画
- TabBar 选中态增加弹性动效

### 4.3 多端适配

- 新增 `src/utils/platform.ts` — 平台检测工具
- 审查所有条件编译指令（`#ifdef APP-PLUS` / `#ifdef MP-WEIXIN`）
- H5 端登录方式适配（微信网页授权）
- 小程序端订阅消息模板配置

### 4.4 性能优化

- 首页按角色条件编译，减少包体积
- `<image>` 增加 `lazy-load` 属性
- 首页数据 30 秒内不重复请求（本地缓存）
- 长列表分页加载

### 4.5 最终验收标准

| 维度 | 标准 |
|------|------|
| 功能 | 33 页全部功能链路走通，0 阻塞性 Bug |
| 交互 | 四态完整，操作有反馈，刷新有动效 |
| 多端 | 四端显示一致 |
| 性能 | 首页 < 2s 可交互 |
| 代码 | 0 TS 错误，0 ESLint 警告 |
| 异常 | 断网/弱网有提示，Token 过期自动重登 |
