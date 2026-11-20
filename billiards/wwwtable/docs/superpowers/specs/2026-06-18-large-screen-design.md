# 大屏适配设计 — 27寸 9:16 竖屏优化

**日期:** 2026-06-18 | **范围:** wwwtable 全项目 | **类型:** UI 缩放标准化

---

## 1. 目标

当前设计以手机屏（375px宽）为基准，在 27 寸 1080×1920 竖屏上所有元素偏小。
通过全局 1.5 倍放大，使字体和组件在物理尺寸上匹配商业大屏体验。

---

## 2. 缩放基准

| 层级 | 当前值 | ×1.5 后 |
|------|--------|---------|
| 最小字号 | 24-28rpx | 36-42rpx |
| 正文字号 | 32-36rpx | 48-54rpx |
| 标题字号 | 48rpx | 72rpx |
| 大标题 | 56-72rpx | 84-108rpx |
| 超大标题 | 96-160rpx | 144-240rpx |
| 按钮高度 | 88-100rpx | 132-150rpx |
| 关闭按钮 | 64rpx | 96rpx |
| 弹窗标题 | 48rpx | 72rpx |
| 弹窗关闭字 | 32rpx | 48rpx |
| 弹窗body padding | 40rpx | 60rpx |
| 提示类标题 | 36rpx | 54rpx |
| 提示类副文 | 28rpx | 42rpx |
| 提示类按钮字 | 32rpx | 48rpx |
| 头部图标 | 64rpx | 96rpx |
| 头部标题 | 48rpx | 72rpx |
| 头部副标题 | 26rpx | 40rpx |
| 返回按钮 | 96rpx | 144rpx |
| 返回字 | 48rpx | 72rpx |
| SubPage头高 | 112rpx | 168rpx |
| 计分球 | 180rpx | 270rpx |
| 卡片高度 | 800-860rpx | 1200-1290rpx |

---

## 3. 改动文件清单

### 3.1 全局变量
- `src/styles/global.scss` — :root 字体变量 + 间距变量

### 3.2 标准组件 (4 个)
- `src/components/standard/ContentModal.vue` — 标题、关闭按钮、padding
- `src/components/standard/AlertModal.vue` — 图标、标题、副文、按钮
- `src/components/standard/PageHeader.vue` — 图标、标题、副标题
- `src/components/standard/SubPageHeader.vue` — 返回、标题、高度

### 3.3 页面文件 (8 个)
- `src/pages/index/index.vue`
- `src/pages/product/index.vue`
- `src/pages/assistant/index.vue`
- `src/pages/score/index.vue`
- `src/pages/order/index.vue`
- `src/pages/bill/index.vue`
- `src/pages/activity/index.vue`
- `src/pages/login/index.vue`

### 3.4 组件文件
- `src/components/CustomTabBar.vue`
- `src/components/OpenAnimation.vue`
- `src/components/PendingItems.vue`
- `src/components/Skeleton.vue`

---

## 4. 不变内容

- 所有业务逻辑、API 调用
- 所有页面结构、组件树
- 颜色体系、动画、CSS 变量名
- 布局 grid/flex 结构

---

## 5. 验收标准

- TypeScript strict:true 零错误
- 133 个已有测试全部通过
- 所有弹窗、卡片字体视觉协调一致
- 构建通过（HBuilderX 编译成功）
