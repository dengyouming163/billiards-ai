# wwwstoreapp 前端产品化重构设计方案

## 1. 项目概述

### 1.1 项目背景
本项目是一个基于 UniApp 框架开发的台球厅商家管理 App（wwwstoreapp）。当前版本采用绿色主色调的传统移动端风格，需要进行产品化重构，打造现代简约、高端商务的视觉体验。

### 1.2 重构目标
- **颠覆性视觉重构**：修改后看起来与原版本完全不同
- **不改业务逻辑**：仅涉及前端风格和布局的修改
- **建立设计标准**：制定一套完整的 UI 风格方案，作为其他端前端重构的基线

### 1.3 技术栈
- 框架：UniApp + Vue 3 + TypeScript
- 样式：SCSS
- 图标：Lucide SVG 图标

---

## 2. 设计原则

| 原则 | 描述 |
|------|------|
| **深色主题** | 采用深色背景配合金色主色调，打造高端商务感，减少视觉疲劳 |
| **大圆角设计** | 统一使用 20-32rpx 大圆角，现代感十足，柔和亲切 |
| **精致动效** | 按钮点击缩放、弹窗动画、卡片悬浮效果，提升交互体验 |
| **触控友好** | 按钮最小点击区域 88rpx，卡片间距舒适，适合移动端操作 |

---

## 3. 设计Tokens

### 3.1 颜色系统

#### 主色调
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$primary` | #f59e0b | 主色，用于按钮、链接、高亮文字 |
| `$primary-dark` | #d97706 | 主色深，用于按钮hover/active状态 |
| `$primary-light` | rgba(245, 158, 11, 0.1) | 主色浅，用于背景点缀、选中状态 |

#### 背景色
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$bg-main` | #0f172a | 页面主背景 |
| `$bg-card` | rgba(30, 41, 59, 0.7) | 卡片背景 |
| `$bg-card-hover` | rgba(51, 65, 85, 0.8) | 卡片hover背景 |

#### 文字色
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$text-primary` | #f8fafc | 主要文字 |
| `$text-secondary` | #e2e8f0 | 次要文字 |
| `$text-muted` | #94a3b8 | 辅助文字 |
| `$text-dim` | #64748b | 禁用/占位文字 |

#### 边框色
| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$border-color` | rgba(71, 85, 105, 0.4) | 默认边框 |
| `$border-light` | rgba(100, 116, 139, 0.2) | 轻边框 |

### 3.2 圆角系统

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$radius-lg` | 32rpx | 大卡片、弹窗、hero区域 |
| `$radius-md` | 24rpx | 按钮、输入框、小卡片 |
| `$radius-sm` | 16rpx | 标签、头像、小元素 |

### 3.3 间距系统

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$spacing-xs` | 8rpx | 元素内部小间距 |
| `$spacing-sm` | 16rpx | 元素内部间距 |
| `$spacing-md` | 24rpx | 卡片内边距、元素间间距 |
| `$spacing-lg` | 32rpx | 页面区块间距 |
| `$spacing-xl` | 48rpx | 大区块间距 |

### 3.4 字体系统

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$font-size-xs` | 22rpx | 辅助文字 |
| `$font-size-sm` | 24rpx | 标签、说明文字 |
| `$font-size-base` | 28rpx | 正文 |
| `$font-size-lg` | 32rpx | 小标题 |
| `$font-size-xl` | 36rpx | 大标题 |
| `$font-size-2xl` | 44rpx | Hero标题 |
| `$font-size-3xl` | 56rpx | 数字展示 |

### 3.5 阴影系统

| 变量名 | 值 | 用途 |
|--------|-----|------|
| `$shadow-sm` | 0 4px 12px rgba(0,0,0,0.1) | 小卡片 |
| `$shadow-md` | 0 8px 24px rgba(0,0,0,0.2) | 中等卡片 |
| `$shadow-lg` | 0 12px 40px rgba(0,0,0,0.3) | 大卡片、弹窗 |
| `$shadow-glow` | 0 0 30px rgba(245, 158, 11, 0.2) | 金色发光效果 |

---

## 4. 组件样式规范

### 4.1 按钮组件

#### 主按钮
```scss
.btn-primary {
  background: linear-gradient(135deg, $primary, $primary-dark);
  color: #1e293b;
  border-radius: $radius-md;
  padding: 24rpx 48rpx;
  font-size: $font-size-base;
  font-weight: 700;
  box-shadow: $shadow-lg, 0 10px 30px rgba(245, 158, 11, 0.35);
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.4s;
  }
  
  &:hover::before {
    left: 100%;
  }
}
```

#### 次要按钮
```scss
.btn-secondary {
  background: rgba(71, 85, 105, 0.5);
  color: $text-secondary;
  border: 1px solid rgba(100, 116, 139, 0.4);
  border-radius: $radius-md;
  padding: 24rpx 48rpx;
  font-size: $font-size-base;
  font-weight: 600;
  
  &:active {
    background: rgba(71, 85, 105, 0.7);
  }
}
```

### 4.2 输入框组件

```scss
.input {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid $border-color;
  border-radius: $radius-md;
  padding: 24rpx 32rpx;
  font-size: $font-size-base;
  color: $text-primary;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 8rpx rgba(245, 158, 11, 0.1);
  }
  
  &::placeholder {
    color: $text-dim;
  }
}
```

### 4.3 卡片组件

```scss
.card {
  background: $bg-card;
  backdrop-filter: blur(20px);
  border: 1px solid $border-color;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:active {
    transform: scale(0.99);
    border-color: rgba(245, 158, 11, 0.3);
    &::before {
      opacity: 1;
    }
  }
}
```

### 4.4 Tabbar组件

```scss
.tabbar {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid $border-color;
  padding: 24rpx 0 env(safe-area-inset-bottom);
  display: flex;
  justify-content: space-around;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
  }
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 0;
  transition: all 0.2s;
  position: relative;
  
  &.active {
    background: rgba(245, 158, 11, 0.06);
    
    &::before {
      content: '';
      position: absolute;
      bottom: 0;
      width: 48rpx; height: 6rpx;
      background: $primary;
      border-radius: 3rpx;
      box-shadow: 0 0 16rpx rgba(245, 158, 11, 0.5);
    }
    
    .tab-icon {
      color: $primary;
    }
    
    .tab-text {
      color: $primary;
      font-weight: 600;
    }
  }
}

.tab-icon {
  width: 56rpx;
  height: 56rpx;
  color: $text-dim;
  transition: color 0.2s;
}

.tab-text {
  font-size: $font-size-xs;
  color: $text-dim;
  transition: color 0.2s;
}
```

### 4.5 头部组件

```scss
.header {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  padding: 88rpx 32rpx 32rpx;
  border-bottom: 1px solid $border-color;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
  }
}
```

---

## 5. 页面布局规范

### 5.1 登录页

```
┌─────────────────────────────────┐
│       [Logo + 品牌名]           │
│           客稻云               │
│        PREMIUM BILLIARDS       │
├─────────────────────────────────┤
│                                 │
│       ┌─────────────────┐       │
│       │   登录表单      │       │
│       │  [手机号输入框]  │       │
│       │  [密码输入框]   │       │
│       │  [登录按钮]     │       │
│       └─────────────────┘       │
│                                 │
└─────────────────────────────────┘
```

**设计要点**：
- 背景：深色渐变 + 金色径向渐变装饰
- Logo：金色渐变圆角矩形，内嵌数字"8"
- 表单卡片：毛玻璃效果 + 金色边框光晕 + 顶部金色渐变线

### 5.2 首页

```
┌─────────────────────────────────┐
│      [门店选择器]               │
│   🏪 星耀台球俱乐部 ▼          │
├─────────────────────────────────┤
│                                 │
│   ┌─────────────────────────┐   │
│   │      Hero 区域          │   │
│   │  门店总览               │   │
│   │  经营数据一目了然       │   │
│   │      ¥12,840.00        │   │
│   │  ┌──┬──┬──┬──┐         │   │
│   │  │台费│商品│助教│充电│  │   │
│   │  └──┴──┴──┴──┘         │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │      运营指标           │   │
│   │  ┌──┬──┬──┬──┐         │   │
│   │  │开台│翻台│客单│订单│  │   │
│   │  │率  │率  │价  │数  │  │   │
│   │  └──┴──┴──┴──┘         │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │      收入渠道           │   │
│   │  ┌──┬──┬──┬──┐         │   │
│   │  │微信│现金│会员│美团│  │   │
│   │  └──┴──┴──┴──┘         │   │
│   └─────────────────────────┘   │
│                                 │
├─────────────────────────────────┤
│   ┌──┬──┬──┬──┐                │
│   │首页│台桌│业绩│我│          │
│   └──┴──┴──┴──┘                │
└─────────────────────────────────┘
```

**设计要点**：
- Hero区域：金色渐变背景 + 金色顶部装饰线 + 金色文字阴影
- 卡片：毛玻璃效果 + 顶部金色渐变线 + 金色圆点标题前缀
- KPI项：深色背景 + 边框 + 点击缩放效果

---

## 6. 图标规范

### 6.1 图标类型
- 使用 Lucide SVG 图标
- 统一 stroke 宽度：2
- 统一圆角风格：round

### 6.2 图标列表

| 图标名 | SVG Path | 用途 |
|--------|----------|------|
| Home | `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>` | 首页 |
| Layout | `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>` | 台桌 |
| BarChart | `<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>` | 业绩 |
| User | `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>` | 我的 |
| Store | `<path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>` | 门店 |
| ChevronDown | `<polyline points="6 9 12 15 18 9"></polyline>` | 下拉箭头 |

---

## 7. 动效规范

### 7.1 页面切换
- 进入：从右向左滑入
- 退出：从左向右滑出
- 时长：300ms

### 7.2 卡片交互
- 点击：缩放至 0.99
- 释放：恢复原始大小
- 时长：150ms

### 7.3 按钮交互
- 点击：缩放至 0.98 + 闪光扫过效果
- 释放：恢复原始大小
- 时长：150ms

### 7.4 弹窗动画
- 进入：从底部向上滑入 + 渐显
- 退出：向下滑出 + 渐隐
- 时长：300ms

---

## 8. 实现策略

### 8.1 文件修改范围

| 文件类型 | 修改方式 | 说明 |
|----------|----------|------|
| `src/styles/variables.scss` | 新增 | 定义全局 CSS 变量 |
| `src/styles/common.scss` | 修改 | 替换全局样式 |
| `src/components/` | 修改 | 更新组件样式 |
| `src/pages/` | 修改 | 更新页面布局样式 |
| `src/static/icons/` | 新增 | 添加 SVG 图标文件 |

### 8.2 实施步骤

1. **Step 1**：创建全局变量文件 `variables.scss`
2. **Step 2**：更新全局样式 `common.scss`
3. **Step 3**：创建 SVG 图标组件库
4. **Step 4**：逐个更新页面组件样式
5. **Step 5**：验证功能完整性

---

## 9. 验证标准

### 9.1 视觉验证
- [ ] 颜色系统正确应用（金色主色调 + 深色背景）
- [ ] 圆角尺寸统一（20-32rpx）
- [ ] 图标统一为 SVG 风格
- [ ] Tabbar 为传统平铺布局，选中项底部金色指示条
- [ ] 品牌名称显示为"客稻云"

### 9.2 功能验证
- [ ] 所有页面可正常打开
- [ ] 所有按钮可正常点击
- [ ] 所有表单可正常提交
- [ ] 导航跳转正常
- [ ] 数据展示正常

### 9.3 性能验证
- [ ] 页面加载时间 < 2s
- [ ] 动画流畅无卡顿
- [ ] 内存使用正常

---

## 10. 风险与应对

| 风险 | 影响 | 应对方案 |
|------|------|----------|
| CSS 变量冲突 | 样式异常 | 备份原文件，逐步替换 |
| 图标显示问题 | 图标不显示 | 使用内联 SVG 确保兼容性 |
| 动效影响性能 | 页面卡顿 | 限制动效复杂度，使用 requestAnimationFrame |
| 业务逻辑影响 | 功能异常 | 逐页面测试，确保无逻辑改动 |

---

## 11. 参考资源

- 设计预览：http://localhost:8888/preview-redesign.html
- 原项目代码：`/www/wwwstoreapp/`
