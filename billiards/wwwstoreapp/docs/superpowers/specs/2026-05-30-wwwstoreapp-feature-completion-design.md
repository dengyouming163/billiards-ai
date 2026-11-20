# wwwstoreapp 移动端整体功能完善优化 — 设计文档

> 日期: 2026-05-30  
> 状态: 已确认  
> 方案: 方案 A — 渐进式分层优化

---

## 一、项目概况

wwwstoreapp（台屏智联）是基于 uni-app Vue3 + TypeScript 的球房管理移动端 APP，支持 H5 / 微信小程序 / Android / iOS 四端。当前已有 31 个注册页面、16 个全局组件、13 个 API 模块、4 个 Store，覆盖 11 个业务域。

本次优化目标：将 APP 从"功能基本可用"提升到"生产级商用水准"，覆盖代码质量、功能完整性、交互体验、性能稳定性四个维度。

---

## 二、L1 基础修复

### 2.1 notificationStore 响应式统一
- **文件**: `src/stores/notification.ts`
- **问题**: 导出 `new NotificationStore()` 未用 `reactive()` 包装，其他 3 个 Store 均已使用
- **修复**: 改为 `reactive(new NotificationStore()) as NotificationStore`

### 2.2 API 统一导出补齐
- **文件**: `src/api/index.ts`
- **问题**: 缺少 `employee`、`table`、`store` 三个模块的导出
- **修复**: 补齐 3 个模块的 re-export

### 2.3 死代码清理
- **文件**: `src/pages/approval/my-list.vue`、`src/pages/approval/pending-list.vue`
- **问题**: 功能已被 `index.vue` 双 Tab 模式替代，未在 pages.json 注册
- **修复**: 删除两个文件

### 2.4 ProfileManagement 显示逻辑修复
- **文件**: `src/pages/profile/index.vue`
- **问题**: `showManagement` 硬编码 `() => false`，管理中心永不可见
- **修复**: 按角色判断 — boss / admin / manager 时展示

### 2.5 TypeScript 类型补充
- 排查并消除残留 `any` 类型
- 补充 `CurrentOrder` 等接口的字段完整性

---

## 三、L2 功能补全

### 3.1 头像上传接入真实 API
- **文件**: `src/components/ProfileHeader.vue`, `src/pages/profile/edit.vue`
- **问题**: `chooseImage()` 成功后仅弹 Toast，未调用上传接口
- **修复**:
  1. 确认/添加 `api/modules/profile.ts` 中的 `uploadAvatar` 方法
  2. 选择图片后调用上传 API，返回的 URL 更新 `profile.avatar`
  3. 上传过程中展示 loading 状态

### 3.2 相册上传接入真实 API
- **文件**: `src/components/ProfileAlbum.vue`, `src/pages/profile/album.vue`
- **问题**: 同头像，仅弹 Toast
- **修复**: 接入 `uploadAlbum` API，支持预览 → 上传 → 刷新相册列表

### 3.3 门店管理功能
- **文件**: `src/components/ProfileManagement.vue`
- **问题**: 点击「门店管理」弹出「门店管理功能开发中」
- **修复**:
  - 如有后端 API → 新建 `pages/store/manage.vue`
  - 如无后端 API → boss 角色点击跳转 PC 端管理链接（H5）或提示「请使用PC端管理」

### 3.4 数据统计详情
- **文件**: `src/components/ProfileStatistics.vue`
- **问题**: 点击弹出「数据统计功能开发中」
- **修复**: 按角色跳转已有页面
  - boss/admin/manager → 数据看板 `OwnerHome.vue`
  - assistant → 业绩页 `pages/performance/index.vue`
  - employee → 不展示此入口

### 3.5 边界场景覆盖
- 网络断开时的全局提示（监听 `uni.onNetworkStatusChange`）
- Token 过期静默刷新（code=2002 先尝试 refreshToken，失败才跳登录）

---

## 四、L3 体验打磨

### 4.1 Emoji → SVG 图标统一
- **文件**: 涉及所有使用 Emoji 的页面和组件（约 15+ 文件）
- **修复**:
  1. 扩展 `src/constants/icons.ts` 图标名称映射表
  2. 新建 `src/components/Icon.vue` 统一 SVG 图标组件
  3. 全局替换 Emoji 为 `<Icon name="xxx" />`

### 4.2 登录页品牌化
- **文件**: `src/pages/login/index.vue`
- **问题**: Logo 为硬编码数字 `8`
- **修复**: SVG 绘制 8 号球 + 球杆品牌 Logo，添加「台屏智联」标题

### 4.3 页面动画一致性
- 统一 popup/modal 底部滑入动画（带缓动曲线）
- Tab 切换内容区渐变过渡
- 列表项入场 staggered fadeIn（可选）

### 4.4 空/错/加载状态统一
- 全量排查，未使用 `StateView` 的页面统一迁移
- 涉及: 订单列表、审批列表、通知列表、员工列表

### 4.5 安全区域适配
- 全量检查底部 padding 与 TabBar 间距
- 统一为 `calc(env(safe-area-inset-bottom) + 120rpx)`

---

## 五、L4 性能与稳定性

### 5.1 图片懒加载
- 列表中的 `<image>` 添加 `lazy-load` 属性
- 涉及: 员工列表头像、审批列表、相册管理

### 5.2 请求缓存策略
- 引入 Map 内存缓存，按请求 key 缓存 30s
- 下拉刷新强制绕过缓存

### 5.3 网络异常全局处理
- `error-handler.ts` 增加 `NETWORK_ERROR` 类型
- 断网时顶部横条提示
- 离线展示缓存数据 + 「暂无网络」标记

### 5.4 Token 静默刷新
- `request.ts` 拦截 2002 → 尝试用 refreshToken 刷新 → 失败才跳登录

---

## 六、文件变更预估

| 层级 | 文件数 | 类型 |
|------|--------|------|
| L1 | ~8 | 修复型 |
| L2 | ~12 | 功能型 |
| L3 | ~20 | 体验型 |
| L4 | ~6 | 优化型 |
| **合计** | **~46** | |

---

## 七、风险与边界

- **后端 API 依赖**: L2 头像/相册上传、门店管理需要确认后端接口是否存在。若不存在，前端做降级处理（H5 跳转 PC 端管理 / 友好的功能预告提示）。
- **SVG 图标兼容性**: uni-app 各端 SVG 渲染有差异，小程序端需使用 `image` + base64 方式，而非内联 SVG。
- **不涉及**: 后端 API 开发、数据库变更、新功能模块从零搭建。
