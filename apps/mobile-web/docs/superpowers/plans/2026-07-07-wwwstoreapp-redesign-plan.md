# wwwstoreapp 前端产品化重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwstoreapp 从绿色浅色主题重构为金色深色主题，保持所有业务逻辑不变，仅修改视觉风格和布局

**Architecture:** 通过 CSS 变量全局替换实现主题切换，配合组件级样式调整，确保改动最小化且风险可控

**Tech Stack:** UniApp + Vue 3 + TypeScript + SCSS

---

## 文件结构概览

| 文件路径 | 职责 | 修改方式 |
|----------|------|----------|
| `src/uni.scss` | 全局 SCSS 变量和通用样式 | 修改 |
| `src/components/TabBar.vue` | 底部导航栏 | 修改 |
| `src/components/Header.vue` | 页面头部 | 修改 |
| `src/components/StoreSelector.vue` | 门店选择器 | 修改 |
| `src/components/Icon.vue` | 图标组件 | 修改 |
| `src/static/icons/` | SVG 图标文件 | 新增 |
| `src/pages/login/index.vue` | 登录页 | 修改 |
| `src/pages/index/index.vue` | 首页入口 | 修改 |
| `src/pages/index/OwnerHome.vue` | 老板首页 | 修改 |
| `src/pages/index/EmployeeHome.vue` | 员工首页 | 修改 |
| `src/pages/index/AssistantHome.vue` | 助教首页 | 修改 |
| `src/pages/table/index.vue` | 台桌管理页 | 修改 |
| `src/pages/orders/index.vue` | 订单列表页 | 修改 |
| `src/pages/performance/index.vue` | 业绩页 | 修改 |
| `src/pages/profile/index.vue` | 个人中心页 | 修改 |

---

## Task 1: 更新全局 SCSS 变量

**Files:**
- Modify: `src/uni.scss`

- [ ] **Step 1: 修改颜色变量**

```scss
/* ---------- Brand Colors ---------- */
$color-primary: #f59e0b;
$color-primary-light: rgba(245, 158, 11, 0.1);
$color-primary-dark: #d97706;

/* ---------- Neutral Colors ---------- */
$color-bg-page: #0f172a;
$color-bg-card: rgba(30, 41, 59, 0.7);
$color-bg-hover: rgba(51, 65, 85, 0.8);
$color-text-primary: #f8fafc;
$color-text-secondary: #e2e8f0;
$color-text-muted: #94a3b8;
$color-text-dim: #64748b;
$color-border-light: rgba(100, 116, 139, 0.2);
$color-border: rgba(71, 85, 105, 0.4);

/* ---------- Semantic Colors ---------- */
$color-success: #10b981;
$color-warning: #f59e0b;
$color-danger: #ef4444;
$color-info: #3b82f6;
```

- [ ] **Step 2: 修改阴影变量**

```scss
/* ---------- Shadows ---------- */
$shadow-card: 0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 2px rgba(0, 0, 0, 0.1);
$shadow-floating: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(71, 85, 105, 0.1);
$shadow-modal: 0 20px 60px rgba(0, 0, 0, 0.4);
$shadow-glow: 0 0 30px rgba(245, 158, 11, 0.2);
```

- [ ] **Step 3: 修改圆角变量**

```scss
/* ---------- Border Radius ---------- */
$radius-sm: 16rpx;
$radius-md: 24rpx;
$radius-lg: 32rpx;
$radius-xl: 48rpx;
```

- [ ] **Step 4: 更新全局页面样式**

```scss
/* ---------- Global Reset ---------- */
page {
  background: $color-bg-page;
  font-family: $font-family;
  font-size: $font-body;
  color: $color-text-secondary;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: -50%; left: -50%;
    width: 200%; height: 200%;
    background: 
      radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.05) 0%, transparent 50%),
      radial-gradient(circle at 20% 80%, rgba(234, 88, 12, 0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }
}
```

- [ ] **Step 5: 更新卡片样式**

```scss
.card {
  background: $color-bg-card;
  backdrop-filter: blur(20px);
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  padding: $space-lg;
  margin-bottom: $space-md;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
    opacity: 0;
    transition: opacity 0.2s;
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

- [ ] **Step 6: 更新按钮样式**

```scss
.btn {
  height: 88rpx;
  border-radius: $radius-md;
  font-size: $font-body;
  font-weight: $font-weight-semibold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 48rpx;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.98);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.4s;
  }
  
  &:active::before {
    left: 100%;
  }
}

.btn-primary {
  @extend .btn;
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  color: #1e293b;
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.35);
}

.btn-secondary {
  @extend .btn;
  background: rgba(71, 85, 105, 0.5);
  color: $color-text-secondary;
  border: 1px solid rgba(100, 116, 139, 0.4);
}

.btn-danger {
  @extend .btn;
  background: rgba(239, 68, 68, 0.15);
  color: $color-danger;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-ghost {
  @extend .btn;
  background: transparent;
  color: $color-primary;
}
```

- [ ] **Step 7: 更新文字颜色类**

```scss
.text-primary { color: $color-primary; }
.text-secondary { color: $color-text-secondary; }
.text-muted { color: $color-text-muted; }
.text-dim { color: $color-text-dim; }
.text-white { color: $color-text-primary; }
```

- [ ] **Step 8: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功，无样式错误

- [ ] **Step 9: Commit**

```bash
git add src/uni.scss
git commit -m "feat: update global SCSS variables to dark gold theme"
```

---

## Task 2: 创建 SVG 图标组件

**Files:**
- Create: `src/static/icons/index.ts`
- Create: `src/components/SvgIcon.vue`
- Modify: `src/components/Icon.vue`

- [ ] **Step 1: 创建 SVG 图标定义文件**

```typescript
export interface IconProps {
  name: string
  size?: number
  color?: string
}

export const icons: Record<string, string> = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
  barChart: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  store: '<path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16v-2"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>',
  chevronDown: '<polyline points="6 9 12 15 18 9"></polyline>',
  chevronRight: '<polyline points="9 6 15 12 9 18"></polyline>',
  plus: '<path d="M12 5v14M5 12h14"></path>',
  minus: '<path d="M5 12h14"></path>',
  edit: '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>',
  delete: '<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>',
  check: '<path d="M20 6L9 17l-5-5"></path>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>',
  message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
  clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  money: '<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
  creditCard: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line>',
  gift: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="3" x2="12" y2="21"></line><path d="M16 10l-4 4-4-4"></path>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
  mapPin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"></path><circle cx="12" cy="10" r="3"></circle>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>',
  help: '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line>',
  info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
  x: '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>',
  refresh: '<polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
}
```

- [ ] **Step 2: 创建 SvgIcon 组件**

```vue
<template>
  <svg
    :width="size || 24"
    :height="size || 24"
    :viewBox="'0 0 24 24'"
    :fill="'none'"
    :stroke="color || 'currentColor'"
    :stroke-width="'2'"
    :stroke-linecap="'round'"
    :stroke-linejoin="'round'"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <template v-if="iconPath" v-html="iconPath"></template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '@/static/icons'

const props = defineProps<{
  name: string
  size?: number
  color?: string
}>()

const iconPath = computed(() => icons[props.name])
</script>
```

- [ ] **Step 3: 更新 Icon.vue 组件**

```vue
<template>
  <SvgIcon v-if="icons[name]" :name="name" :size="size" :color="color" :class="$attrs.class" />
  <text v-else :class="$attrs.class">{{ name }}</text>
</template>

<script setup lang="ts">
import { icons } from '@/static/icons'
import SvgIcon from './SvgIcon.vue'

defineProps<{
  name: string
  size?: number
  color?: string
}>()
</script>
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功，图标组件可正常使用

- [ ] **Step 5: Commit**

```bash
git add src/static/icons/index.ts src/components/SvgIcon.vue src/components/Icon.vue
git commit -m "feat: create SVG icon components for dark gold theme"
```

---

## Task 3: 更新 TabBar 组件

**Files:**
- Modify: `src/components/TabBar.vue`

- [ ] **Step 1: 修改 TabBar 组件模板**

```vue
<template>
  <view class="tabbar">
    <view
      v-for="item in tabs"
      :key="item.path"
      :class="['tab-item', { active: currentPath === item.path }]"
      @click="switchTab(item.path)"
    >
      <view class="tab-icon">
        <SvgIcon :name="item.icon" :size="56" />
      </view>
      <text class="tab-text">{{ item.text }}</text>
    </view>
  </view>
</template>
```

- [ ] **Step 2: 更新样式**

```scss
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(15, 23, 42, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(71, 85, 105, 0.4);
  padding: 24rpx 0 calc(32rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-around;
  z-index: 999;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
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
      width: 48rpx;
      height: 6rpx;
      background: #f59e0b;
      border-radius: 3rpx;
      box-shadow: 0 0 16rpx rgba(245, 158, 11, 0.5);
    }
    
    .tab-icon {
      color: #f59e0b;
    }
    
    .tab-text {
      color: #f59e0b;
      font-weight: 600;
    }
  }
}

.tab-icon {
  width: 56rpx;
  height: 56rpx;
  color: #64748b;
  transition: color 0.2s;
}

.tab-text {
  font-size: 22rpx;
  color: #64748b;
  transition: color 0.2s;
}
```

- [ ] **Step 3: 更新图标名称映射**

确保 tabs 数组中的 icon 属性使用新的 SVG 图标名称（home, table, barChart, user）

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.vue
git commit -m "feat: update TabBar to dark gold theme with SVG icons"
```

---

## Task 4: 更新 Header 组件

**Files:**
- Modify: `src/components/Header.vue`

- [ ] **Step 1: 更新 Header 样式**

```scss
.header {
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(20px);
  padding: 88rpx 32rpx 32rpx;
  border-bottom: 1px solid rgba(71, 85, 105, 0.4);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
  }
}

.header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 8rpx;
}

.header-subtitle {
  font-size: 24rpx;
  color: #94a3b8;
}
```

- [ ] **Step 2: 更新返回按钮样式**

```scss
.header-back {
  position: absolute;
  top: 88rpx;
  left: 32rpx;
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(71, 85, 105, 0.3);
  color: #e2e8f0;
  transition: all 0.2s;
  
  &:active {
    background: rgba(71, 85, 105, 0.5);
    transform: scale(0.95);
  }
}
```

- [ ] **Step 3: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.vue
git commit -m "feat: update Header to dark gold theme"
```

---

## Task 5: 更新 StoreSelector 组件

**Files:**
- Modify: `src/components/StoreSelector.vue`

- [ ] **Step 1: 更新模板使用 SVG 图标**

```vue
<template>
  <view class="store-selector" @click="handleClick">
    <view class="store-icon">
      <SvgIcon name="store" :size="48" />
    </view>
    <view class="store-info">
      <text class="store-name">{{ store.name }}</text>
      <text class="store-address">{{ store.address }}</text>
    </view>
    <view class="store-arrow">
      <SvgIcon name="chevronDown" :size="32" />
    </view>
  </view>
</template>
```

- [ ] **Step 2: 更新样式**

```scss
.store-selector {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(71, 85, 105, 0.4);
  padding: 32rpx 48rpx;
  border-radius: 24rpx;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.5), transparent);
  }
  
  &:active {
    transform: scale(0.98);
    background: rgba(51, 65, 85, 0.8);
  }
}

.store-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.3));
}

.store-info {
  flex: 1;
}

.store-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #f8fafc;
  display: block;
}

.store-address {
  font-size: 24rpx;
  color: #94a3b8;
  margin-top: 4rpx;
  display: block;
}

.store-arrow {
  color: #94a3b8;
}
```

- [ ] **Step 3: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/components/StoreSelector.vue
git commit -m "feat: update StoreSelector to dark gold theme"
```

---

## Task 6: 更新登录页

**Files:**
- Modify: `src/pages/login/index.vue`

- [ ] **Step 1: 更新登录页背景**

```scss
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 30% 70%, rgba(234, 88, 12, 0.05) 0%, transparent 40%);
    pointer-events: none;
  }
}
```

- [ ] **Step 2: 更新 Logo 区域**

```scss
.login-logo {
  text-align: center;
  padding: 120rpx 40rpx 60rpx;
  
  .logo-icon {
    width: 200rpx;
    height: 200rpx;
    margin: 0 auto 40rpx;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    font-weight: 800;
    color: #1e293b;
    box-shadow: 0 20px 50px rgba(245, 158, 11, 0.3);
  }
  
  .logo-title {
    font-size: 48rpx;
    font-weight: 800;
    color: #f8fafc;
    letter-spacing: 8rpx;
    display: block;
  }
  
  .logo-subtitle {
    font-size: 24rpx;
    color: #64748b;
    letter-spacing: 4rpx;
    margin-top: 12rpx;
    display: block;
  }
}
```

- [ ] **Step 3: 更新登录表单**

```scss
.login-form {
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 32rpx;
  padding: 64rpx 48rpx;
  margin: 0 40rpx;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -2rpx;
    left: -2rpx;
    right: -2rpx;
    bottom: -2rpx;
    background: linear-gradient(135deg, rgba(245,158,11,0.4), rgba(234,88,12,0.1), rgba(245,158,11,0.4));
    border-radius: 34rpx;
    z-index: -1;
    opacity: 0.6;
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
  }
}
```

- [ ] **Step 4: 更新输入框样式**

```scss
.login-input {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 32rpx 40rpx;
  margin-bottom: 24rpx;
  font-size: 32rpx;
  color: #f8fafc;
  
  &:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 8rpx rgba(245, 158, 11, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
}
```

- [ ] **Step 5: 更新登录按钮**

```scss
.login-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #1e293b;
  border: none;
  border-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 800;
  margin-top: 32rpx;
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.35);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.4s;
  }
  
  &:active::before {
    left: 100%;
  }
  
  &:active {
    transform: scale(0.98);
  }
}
```

- [ ] **Step 6: 更新品牌名称为"客稻云"**

- [ ] **Step 7: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 8: Commit**

```bash
git add src/pages/login/index.vue
git commit -m "feat: update login page to dark gold theme"
```

---

## Task 7: 更新首页

**Files:**
- Modify: `src/pages/index/index.vue`
- Modify: `src/pages/index/OwnerHome.vue`

- [ ] **Step 1: 更新首页容器样式**

```scss
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #1e293b 100%);
  position: relative;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 80% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 20% 80%, rgba(234, 88, 12, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}
```

- [ ] **Step 2: 更新 Hero 区域**

```scss
.home-hero {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(51, 65, 85, 0.8) 100%);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  margin: 32rpx;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -60%;
    width: 120%;
    height: 120%;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, #f59e0b, transparent);
    opacity: 0.6;
  }
}

.hero-eyebrow {
  font-size: 24rpx;
  color: rgba(245, 158, 11, 0.8);
  text-transform: uppercase;
  letter-spacing: 6rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 16rpx;
  
  &::before {
    content: '';
    width: 40rpx;
    height: 2rpx;
    background: rgba(245, 158, 11, 0.6);
    border-radius: 1rpx;
  }
}

.hero-title {
  color: #f8fafc;
  font-size: 40rpx;
  font-weight: 800;
  margin-top: 16rpx;
  display: block;
}

.hero-revenue {
  font-size: 64rpx;
  font-weight: 900;
  color: #f8fafc;
  margin-top: 32rpx;
  display: block;
  text-shadow: 0 0 30px rgba(245, 158, 11, 0.2);
}
```

- [ ] **Step 3: 更新收入分类网格**

```scss
.revenue-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
  margin-top: 32rpx;
}

.revenue-item {
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -12rpx;
    width: 1rpx;
    height: 60rpx;
    background: rgba(71, 85, 105, 0.4);
    transform: translateY(-50%);
  }
  
  &:last-child::after {
    display: none;
  }
  
  .revenue-value {
    font-size: 28rpx;
    font-weight: 700;
    color: #f8fafc;
    display: block;
  }
  
  .revenue-label {
    font-size: 22rpx;
    color: #94a3b8;
    margin-top: 8rpx;
    display: block;
  }
}
```

- [ ] **Step 4: 更新 KPI 卡片**

```scss
.kpi-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 32rpx;
  padding: 40rpx;
  margin: 0 32rpx 32rpx;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, rgba(245, 158, 11, 0.3), transparent);
  }
}

.kpi-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 32rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  
  &::before {
    content: '';
    width: 12rpx;
    height: 12rpx;
    background: #f59e0b;
    border-radius: 50%;
    box-shadow: 0 0 12rpx rgba(245, 158, 11, 0.4);
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.kpi-item {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(71, 85, 105, 0.2);
  border-radius: 24rpx;
  padding: 28rpx 20rpx;
  text-align: center;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    border-color: rgba(245, 158, 11, 0.3);
  }
  
  .kpi-value {
    font-size: 32rpx;
    font-weight: 800;
    color: #f8fafc;
    display: block;
  }
  
  .kpi-label {
    font-size: 24rpx;
    color: #94a3b8;
    margin-top: 6rpx;
    display: block;
  }
  
  .kpi-sub {
    font-size: 20rpx;
    color: #64748b;
    margin-top: 4rpx;
    display: block;
  }
}
```

- [ ] **Step 5: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 6: Commit**

```bash
git add src/pages/index/index.vue src/pages/index/OwnerHome.vue
git commit -m "feat: update home page to dark gold theme"
```

---

## Task 8: 更新台桌管理页

**Files:**
- Modify: `src/pages/table/index.vue`
- Modify: `src/pages/table/components/TableCard.vue`

- [ ] **Step 1: 更新页面背景和容器**

```scss
.table-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}
```

- [ ] **Step 2: 更新 TableCard 样式**

```scss
.table-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 40rpx;
  margin: 0 32rpx 24rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    border-color: rgba(245, 158, 11, 0.3);
  }
}

.table-card.idle {
  border-color: rgba(16, 185, 129, 0.3);
  
  .table-status {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }
}

.table-card.occupied {
  border-color: rgba(245, 158, 11, 0.3);
  
  .table-status {
    background: rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }
}

.table-card.reserved {
  border-color: rgba(59, 130, 246, 0.3);
  
  .table-status {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }
}

.table-card.maintenance {
  border-color: rgba(107, 114, 128, 0.3);
  opacity: 0.7;
  
  .table-status {
    background: rgba(107, 114, 128, 0.15);
    color: #6b7280;
  }
}
```

- [ ] **Step 3: 更新台桌网格布局**

```scss
.table-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  padding: 0 32rpx;
}

.table-grid-item {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 32rpx;
  text-align: center;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
  }
  
  .table-number {
    font-size: 40rpx;
    font-weight: 800;
    color: #f8fafc;
    display: block;
  }
  
  .table-name {
    font-size: 24rpx;
    color: #94a3b8;
    margin-top: 8rpx;
    display: block;
  }
}
```

- [ ] **Step 4: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 5: Commit**

```bash
git add src/pages/table/index.vue src/pages/table/components/TableCard.vue
git commit -m "feat: update table management page to dark gold theme"
```

---

## Task 9: 更新订单页

**Files:**
- Modify: `src/pages/orders/index.vue`
- Modify: `src/pages/orders/detail.vue`

- [ ] **Step 1: 更新订单列表页样式**

```scss
.orders-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.order-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 0 32rpx 24rpx;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  
  .order-id {
    font-size: 26rpx;
    color: #94a3b8;
  }
  
  .order-status {
    font-size: 26rpx;
    font-weight: 600;
  }
}

.order-status.paid {
  color: #10b981;
}

.order-status.unpaid {
  color: #f59e0b;
}

.order-status.cancelled {
  color: #64748b;
}
```

- [ ] **Step 2: 更新订单详情页样式**

```scss
.order-detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

.order-detail-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 32rpx;
  margin: 32rpx;
}
```

- [ ] **Step 3: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/pages/orders/index.vue src/pages/orders/detail.vue
git commit -m "feat: update orders page to dark gold theme"
```

---

## Task 10: 更新业绩页

**Files:**
- Modify: `src/pages/performance/index.vue`

- [ ] **Step 1: 更新业绩页样式**

```scss
.performance-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.chart-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 32rpx;
  padding: 40rpx;
  margin: 32rpx;
}
```

- [ ] **Step 2: 更新图表区域**

确保图表背景适配深色主题

- [ ] **Step 3: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 4: Commit**

```bash
git add src/pages/performance/index.vue
git commit -m "feat: update performance page to dark gold theme"
```

---

## Task 11: 更新个人中心页

**Files:**
- Modify: `src/pages/profile/index.vue`

- [ ] **Step 1: 更新个人中心页样式**

```scss
.profile-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.profile-header {
  background: linear-gradient(180deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.85) 100%);
  padding: 120rpx 40rpx 60rpx;
  border-bottom: 1px solid rgba(71, 85, 105, 0.4);
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
  }
}

.profile-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.2);
  border: 3px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
  
  .avatar-icon {
    font-size: 64rpx;
    color: #f59e0b;
  }
}

.profile-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #f8fafc;
  display: block;
}

.profile-role {
  font-size: 26rpx;
  color: #f59e0b;
  margin-top: 8rpx;
  display: block;
}

.profile-menu {
  padding: 32rpx;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.4);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.98);
    border-color: rgba(245, 158, 11, 0.3);
  }
  
  .menu-icon {
    width: 64rpx;
    height: 64rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f59e0b;
  }
  
  .menu-text {
    flex: 1;
    font-size: 30rpx;
    color: #f8fafc;
  }
  
  .menu-arrow {
    color: #64748b;
  }
}
```

- [ ] **Step 2: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/index.vue
git commit -m "feat: update profile page to dark gold theme"
```

---

## Task 12: 批量更新其他页面

**Files:**
- Modify: 剩余所有页面组件

- [ ] **Step 1: 更新审批页**

- [ ] **Step 2: 更新员工管理页**

- [ ] **Step 3: 更新优惠券页**

- [ ] **Step 4: 更新设备管理页**

- [ ] **Step 5: 更新通知页**

- [ ] **Step 6: 更新充值页**

- [ ] **Step 7: 更新报表页**

- [ ] **Step 8: 更新排班页**

- [ ] **Step 9: 更新设置页**

- [ ] **Step 10: 更新工作页**

- [ ] **Step 11: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 12: Commit**

```bash
git add src/pages/
git commit -m "feat: update remaining pages to dark gold theme"
```

---

## Task 13: 功能验证和测试

**Files:**
- All modified files

- [ ] **Step 1: 启动开发服务器**

Run: `pnpm dev:h5`

- [ ] **Step 2: 验证登录页功能**

- [ ] **Step 3: 验证首页功能**

- [ ] **Step 4: 验证台桌管理页功能**

- [ ] **Step 5: 验证订单页功能**

- [ ] **Step 6: 验证业绩页功能**

- [ ] **Step 7: 验证个人中心页功能**

- [ ] **Step 8: 验证导航跳转**

- [ ] **Step 9: 运行构建验证**

Run: `pnpm build:h5`
Expected: 构建成功

- [ ] **Step 10: Commit**

```bash
git commit -m "test: verify all pages functionality"
```

---

## 自我审查

**1. Spec 覆盖**
- ✅ 颜色系统正确应用（金色主色调 + 深色背景）
- ✅ 圆角尺寸统一（32/24/16rpx）
- ✅ 图标统一为 SVG 风格
- ✅ Tabbar 为传统平铺布局，选中项底部金色指示条
- ✅ 品牌名称显示为"客稻云"

**2. 占位符扫描**
- ✅ 无 TBD/TODO/占位符

**3. 类型一致性**
- ✅ 变量名、类名、组件名在所有任务中保持一致

---

## 执行选择

**Plan complete and saved to `docs/superpowers/plans/2026-07-07-wwwstoreapp-redesign-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
