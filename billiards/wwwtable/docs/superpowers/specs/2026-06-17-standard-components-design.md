# 公共组件标准化设计

**日期:** 2026-06-17 | **范围:** wwwtable 前端 | **类型:** UI 标准化

---

## 1. 目标

将散落在 8 个页面的弹窗和头部内联样式统一为 4 个标准组件，消除重复代码，固化设计语言。

---

## 2. 标准弹窗模板

### 2.1 ContentModal.vue — 内容弹窗

**用途:** 详情展示、表单填写、列表管理、图片浏览等需要承载丰富内容的场景。

**尺寸:** `70vw × 75vh`，`max-height: 85vh`

**结构:**
```
┌──────────────────────────┐
│ 金色渐变装饰线 (6rpx)      │  ← 顶部
│ ✕  标题            关 闭  │  ← header: 48rpx gold 标题, 64rpx 圆关闭
│──────────────────────────│  ← border-bottom: gold
│                          │
│   <slot /> 内容区         │  ← flex:1, overflow-y:auto
│   (scroll-view 包裹)      │
│                          │
│──────────────────────────│  ← border-top: gold
│   <slot name="footer" />  │  ← 底部操作区
└──────────────────────────┘
```

**Props:**
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | boolean | false | 控制显隐 |
| `title` | string | '' | 标题文字 |
| `showFooter` | boolean | true | 是否显示底部区域 |

**Slots:**
| Slot | 说明 |
|------|------|
| `default` | 内容区域 |
| `footer` | 底部操作区，默认空 |

**Events:** `@close`

**风格:**
- 背景 `linear-gradient(180deg, #232340 0%, #1a1a30 100%)`
- 圆角 `64rpx`，边框 `4rpx solid rgba(#c9a962, .35)`
- overlay: `rgba(0,0,0,.9)` + `backdrop-filter: blur(16rpx)`
- 点击 overlay 自动 emit close

**承载页:**
- 商品详情、助教详情、活动详情
- 计分规则弹窗、游戏结果弹窗
- 充电管理弹窗、已点商品列表
- 助教服务管理弹窗、并台确认弹窗

### 2.2 AlertModal.vue — 提示弹窗

**用途:** 确认操作、成功/失败提示、简短信息通知。

**尺寸:** `56vw`（宽度固定），高度由内容自动撑开

**结构:**
```
┌────────────────────────┐
│       [icon]           │  ← 可选 emoji/图标
│                        │
│       title            │  ← 主文案 36rpx bold
│                        │
│      message           │  ← 副文案 28rpx，可选
│  (灰色辅助文字)         │
│                        │
│  [取消]     [确认]      │  ← 水平排列，可调主次
└────────────────────────┘
```

**Props:**
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `visible` | boolean | false | 控制显隐 |
| `title` | string | '' | 主文案 |
| `message` | string | '' | 副文案，可选 |
| `icon` | string | '' | emoji 图标，可选 |
| `confirmText` | string | '确定' | 确认按钮文字 |
| `cancelText` | string | '' | 取消按钮文字，空则不显示 |
| `confirmDanger` | boolean | false | 确认按钮是否为危险样式(红色) |

**Events:**
| Event | 说明 |
|-------|------|
| `@confirm` | 用户点击确认 |
| `@cancel` | 用户点击取消或点击 overlay |

**风格:**
- 与 ContentModal 相同基底色，圆角 `48rpx`
- 确认按钮默认金色渐变 `linear-gradient(135deg, #c9a962, #8a6d3b)`
- 危险确认按钮红色 `linear-gradient(135deg, #ef4444, #dc2626)`
- 取消按钮灰色 `rgba(255,255,255,.08)` + 白色文字

**承载页:**
- 呼叫服务员确认/取消
- 支付成功/失败
- 操作成功提示
- 扫码引导

---

## 3. 标准头部组件

### 3.1 PageHeader.vue — 一级页面头部

**用途:** TabBar 四个页面（首页、点单、助教、计分）统一的 sticky 顶部。

**结构:**
```
┌──────────────────────────────┐
│ 🎱 标题           <右侧slot>  │
│    副标题                     │
└──────────────────────────────┘
  ──── sticky, z-index 100 ────
```

**Props:**
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `icon` | string | '' | 左侧 emoji 图标 |
| `title` | string | '' | 标题文字 |
| `subtitle` | string | '' | 副标题，可选 |

**Slots:**
| Slot | 说明 |
|------|------|
| `right` | 右侧功能按钮区，放搜索/时间/WS状态 |

**风格:**
- `position: fixed; top:0; left:0; right:0`
- `padding: 28rpx 40rpx`
- 背景 `linear-gradient(180deg, rgba(#0f0f16,.98), rgba(#0f0f16,.95))`
- `backdrop-filter: blur(30rpx)`
- 底部分隔: `2rpx solid rgba(#c9a962,.1)` + 金色渐变线

**使用页:** `index/index.vue`, `product/index.vue`, `assistant/index.vue`, `score/index.vue`

### 3.2 SubPageHeader.vue — 二级页面头部

**用途:** 子页面统一的顶部导航，含返回按钮。

**结构:**
```
┌──────────────────────────────┐
│  ← 返回    居中标题    占位   │
└──────────────────────────────┘
```

**Props:**
| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | string | '' | 居中标题 |

**Events:**
| Event | 说明 |
|-------|------|
| `@back` | 点击返回，默认 `uni.navigateBack()` |

**风格:**
- 三栏 flex 布局，左右对称占位 (各 `96rpx`)
- 高度统一 `112rpx`
- 样式基底与 PageHeader 一致
- 返回按钮: `96rpx` 圆形，暗色卡片风格

**使用页:** `order/index.vue`, `bill/index.vue`, `activity/index.vue`

---

## 4. 实施方案：逐页替换（方案 A）

```
Step 1: 建 4 个标准组件                  (30min)
Step 2: 替换 index.vue 弹窗+头部         (45min)
Step 3: 替换 product.vue 弹窗+头部       (30min)
Step 4: 替换 assistant.vue 弹窗+头部     (30min)
Step 5: 替换 score.vue 弹窗+头部         (30min)
Step 6: 替换 order.vue 弹窗+头部         (30min)
Step 7: 替换 bill.vue 提示弹窗+头部      (20min)
Step 8: 替换 activity.vue 弹窗           (15min)
Step 9: 清理各页面旧的内联 modal/header 样式 (30min)
Step 10: 全量验证 (TS + tests + visual)  (30min)
```

每步独立验证，git 逐 commit 可回滚。

---

## 5. 文件清单

```
新增:
  src/components/standard/ContentModal.vue
  src/components/standard/AlertModal.vue
  src/components/standard/PageHeader.vue
  src/components/standard/SubPageHeader.vue

修改 (8个):
  src/pages/index/index.vue
  src/pages/product/index.vue
  src/pages/assistant/index.vue
  src/pages/score/index.vue
  src/pages/order/index.vue
  src/pages/bill/index.vue
  src/pages/activity/index.vue
  src/pages/login/index.vue (不涉及)
```

---

## 6. 不变内容

- 所有业务逻辑、API 调用、状态管理不变
- 弹窗内部的内容排版不变（只替换外壳）
- 现有的防重入、离线、轮询逻辑不变
- 颜色体系全部沿用现有 CSS 变量

---

## 7. 验收标准

- TypeScript `strict:true` 零错误
- 133 个已有测试全部通过
- 8 个页面弹窗/头部视觉风格一致
- 所有弹窗 overlay 点击可关闭
