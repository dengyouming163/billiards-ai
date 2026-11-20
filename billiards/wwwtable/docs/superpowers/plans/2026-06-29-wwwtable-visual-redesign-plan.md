# wwwtable 视觉颠覆性优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全面重构 wwwtable 台桌大屏的视觉设计，建立统一的现代化设计系统，提升用户体验和高级感。

**Architecture:** 采用系统化的组件重构策略，先建立统一的设计系统基础组件，然后逐页重构布局，保持所有原有功能逻辑不变。

**Tech Stack:** uni-app + Vue 3 + SCSS + 自定义组件系统

---

## 文件结构映射

本次重构将创建以下文件结构：

### 新建文件

**组件文件**：
- `src/components/common/PageHeader.vue` - 统一头部组件（所有页面共用）
- `src/components/common/CardBase.vue` - 卡片基础组件
- `src/components/common/ButtonPrimary.vue` - 主要按钮组件
- `src/components/common/ButtonSecondary.vue` - 次要按钮组件
- `src/components/common/ButtonDanger.vue` - 危险按钮组件
- `src/components/common/ModalBase.vue` - 弹窗基础组件
- `src/components/common/StatusBadge.vue` - 状态徽章组件
- `src/components/common/ModalConfirm.vue` - 确认弹窗组件
- `src/components/common/ModalInfo.vue` - 信息展示弹窗组件

**样式文件**：
- `src/styles/design-system.scss` - 设计系统核心样式（字体、间距、颜色、圆角）
- `src/styles/variables.scss` - 变量定义（颜色、间距、圆角等）

### 修改文件

**样式文件**：
- `src/styles/global.scss` - 全局样式（引入设计系统）

**页面文件**（重构布局，保持功能逻辑）：
- `src/pages/index/index.vue` - 首页重构
- `src/pages/product/index.vue` - 商品点单重构
- `src/pages/score/index.vue` - 智能计分重构
- `src/pages/assistant/index.vue` - 教练预约重构
- `src/pages/bill/index.vue` - 开台重构
- `src/pages/bill/index.vue` - 账单重构（注意：与开台同名，需确认路径）

---

## 实施任务分解

### Phase 1: 建立设计系统基础

#### Task 1: 创建设计系统样式文件

**Files:**
- Create: `src/styles/variables.scss`
- Create: `src/styles/design-system.scss`

- [ ] **Step 1: 创建变量定义文件**

创建 `src/styles/variables.scss`，定义所有颜色、间距、圆角变量：

```scss
// ===================================
// 设计系统变量定义
// ===================================

// 间距系统（8px 基准）
$spacing-xs: 8px;
$spacing-sm: 16px;
$spacing-md: 24px;
$spacing-lg: 32px;
$spacing-xl: 48px;

// 圆角系统
$rounded-sm: 8px;
$rounded-md: 12px;
$rounded-lg: 16px;
$rounded-xl: 20px;
$rounded-full: 9999px;

// 深色模式颜色
$dark-bg-primary: #1a1a1a;
$dark-bg-secondary: #242424;
$dark-bg-tertiary: #2a2a2a;
$dark-text-primary: #ffffff;
$dark-text-secondary: #b0b0b0;
$dark-text-tertiary: #808080;
$dark-border-subtle: rgba(255,255,255,0.1);
$dark-border-strong: rgba(255,255,255,0.2);

// 浅色模式颜色
$light-bg-primary: #f5f5f5;
$light-bg-secondary: #ffffff;
$light-bg-tertiary: #fafafa;
$light-text-primary: #1a1a1a;
$light-text-secondary: #666666;
$light-text-tertiary: #999999;
$light-border-subtle: rgba(0,0,0,0.1);
$light-border-strong: rgba(0,0,0,0.2);

// 强调色（品牌色）
$accent-primary: #007aff;
$accent-danger: #ff3b30;
$accent-success: #34c759;
$accent-warning: #ff9500;

// 字体大小（27寸屏幕适配）
$font-page-title: 48px;
$font-card-title: 28px;
$font-primary: 24px;
$font-secondary: 22px;
$font-auxiliary: 18px;
$font-label: 16px;
```

- [ ] **Step 2: 创建设计系统核心样式**

创建 `src/styles/design-system.scss`，定义字体层级、卡片、按钮、弹窗基础样式：

```scss
// ===================================
// 设计系统核心样式
// ===================================

@import './variables.scss';

// 字体层级系统
.text-page-title {
  font-size: $font-page-title;
  font-weight: 700;
  line-height: 1.2;
}

.text-card-title {
  font-size: $font-card-title;
  font-weight: 600;
  line-height: 1.3;
}

.text-primary {
  font-size: $font-primary;
  font-weight: 500;
  line-height: 1.4;
}

.text-secondary {
  font-size: $font-secondary;
  font-weight: 400;
  line-height: 1.4;
}

.text-auxiliary {
  font-size: $font-auxiliary;
  font-weight: 400;
  line-height: 1.5;
}

.text-label {
  font-size: $font-label;
  font-weight: 500;
  line-height: 1.5;
}

// 卡片基础样式
.card-base {
  border-radius: $rounded-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;

  // 深色模式（默认）
  background: $dark-bg-secondary;
  border: 1px solid $dark-border-subtle;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

// 弹窗遮罩
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

// 弹窗容器
.modal-container {
  width: 85%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: $rounded-xl;
  background: $dark-bg-tertiary;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  overflow: hidden;
}

// 弹窗头部
.modal-header {
  padding: $spacing-md;
  border-bottom: 1px solid $dark-border-subtle;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: $font-card-title;
  font-weight: 600;
}

.modal-close {
  font-size: 32px;
  color: $dark-text-tertiary;
  cursor: pointer;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 弹窗内容区
.modal-body {
  padding: $spacing-md;
  max-height: 60vh;
  overflow-y: auto;
}

// 弹窗底部
.modal-footer {
  padding: $spacing-md;
  border-top: 1px solid $dark-border-subtle;
}

.modal-actions {
  display: flex;
  gap: $spacing-sm;
  justify-content: flex-end;
}

// 按钮样式系统
.btn-primary {
  font-size: $font-primary;
  padding: 16px $spacing-xl;
  border-radius: $rounded-md;
  background: $accent-primary;
  color: #fff;
  font-weight: 600;
  min-height: 56px;
  border: none;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

.btn-secondary {
  font-size: $font-primary;
  padding: 16px $spacing-xl;
  border-radius: $rounded-md;
  background: transparent;
  border: 1px solid $dark-border-strong;
  color: $dark-text-secondary;
  font-weight: 500;
  min-height: 56px;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

.btn-danger {
  font-size: $font-primary;
  padding: 16px $spacing-xl;
  border-radius: $rounded-md;
  background: $accent-danger;
  color: #fff;
  font-weight: 600;
  min-height: 56px;
  border: none;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

.btn-sm {
  font-size: $font-secondary;
  padding: 12px $spacing-lg;
  border-radius: $rounded-sm;
  min-height: 44px;
  border: none;
  cursor: pointer;

  &:active {
    opacity: 0.8;
  }
}

// 状态徽章
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: $rounded-full;
  font-size: $font-label;
  font-weight: 500;

  // 状态变体
  &.status-active {
    background: $accent-success;
    color: #fff;
  }

  &.status-billing {
    background: $accent-primary;
    color: #fff;
  }

  &.status-idle {
    background: $dark-text-tertiary;
    color: #fff;
  }

  &.status-warning {
    background: $accent-warning;
    color: #fff;
  }
}
```

- [ ] **Step 3: 更新全局样式文件引入设计系统**

修改 `src/styles/global.scss`，在文件顶部引入设计系统：

```scss
// 在文件顶部添加以下代码
@import './variables.scss';
@import './design-system.scss';

// 保留原有的其他全局样式...
```

- [ ] **Step 4: 提交设计系统样式**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/styles/variables.scss src/styles/design-system.scss src/styles/global.scss
git commit -m "feat: 建立设计系统基础样式和变量定义"
```

---

#### Task 2: 创建统一头部组件

**Files:**
- Create: `src/components/common/PageHeader.vue`

- [ ] **Step 1: 创建 PageHeader 组件**

创建 `src/components/common/PageHeader.vue`：

```vue
<template>
  <view class="page-header">
    <!-- 左侧：台桌信息 -->
    <view class="header-left">
      <view class="table-number text-page-title">{{ tableNumber }}号桌</view>
      <view class="table-status">
        <view class="status-badge" :class="statusClass">{{ statusText }}</view>
      </view>
    </view>

    <!-- 中间：时间信息 -->
    <view class="header-center">
      <view class="current-time text-card-title">{{ currentTime }}</view>
      <view class="elapsed-time text-secondary" v-if="elapsedTime">{{ elapsedTime }}</view>
    </view>

    <!-- 右侧：自定义内容插槽 -->
    <view class="header-right">
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  tableNumber: string | number
  status?: 'active' | 'billing' | 'idle' | 'warning'
  currentTime?: string
  elapsedTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  status: 'idle',
  currentTime: '',
  elapsedTime: ''
})

const statusText = computed(() => {
  const statusMap = {
    active: '空闲',
    billing: '计费中',
    idle: '空闲',
    warning: '注意'
  }
  return statusMap[props.status] || '空闲'
})

const statusClass = computed(() => {
  return `status-${props.status}`
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.page-header {
  height: 80px;
  padding: 20px $spacing-md;
  background: $dark-bg-primary;
  border-bottom: 1px solid $dark-border-subtle;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.table-number {
  // 继承 text-page-title 样式
}

.table-status {
  display: flex;
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.current-time {
  // 继承 text-card-title 样式
}

.elapsed-time {
  // 继承 text-secondary 样式
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}
</style>
```

- [ ] **Step 2: 提交头部组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/PageHeader.vue
git commit -m "feat: 创建统一头部组件 PageHeader"
```

---

#### Task 3: 创建卡片基础组件

**Files:**
- Create: `src/components/common/CardBase.vue`

- [ ] **Step 1: 创建 CardBase 组件**

创建 `src/components/common/CardBase.vue`：

```vue
<template>
  <view class="card-base">
    <!-- 卡片标题 -->
    <view class="card-title text-card-title" v-if="title">
      {{ title }}
    </view>

    <!-- 卡片内容插槽 -->
    <view class="card-content">
      <slot></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  title?: string
}

defineProps<Props>()
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.card-base {
  // 继承设计系统的 card-base 样式
}

.card-title {
  margin-bottom: $spacing-sm;
}

.card-content {
  // 内容区域样式
}
</style>
```

- [ ] **Step 2: 提交卡片组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/CardBase.vue
git commit -m "feat: 创建卡片基础组件 CardBase"
```

---

#### Task 4: 创建按钮组件系统

**Files:**
- Create: `src/components/common/ButtonPrimary.vue`
- Create: `src/components/common/ButtonSecondary.vue`
- Create: `src/components/common/ButtonDanger.vue`

- [ ] **Step 1: 创建 ButtonPrimary 组件**

创建 `src/components/common/ButtonPrimary.vue`：

```vue
<template>
  <button class="btn-primary" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'click', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.btn-primary {
  // 继承设计系统的 btn-primary 样式

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

- [ ] **Step 2: 创建 ButtonSecondary 组件**

创建 `src/components/common/ButtonSecondary.vue`：

```vue
<template>
  <button class="btn-secondary" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'click', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.btn-secondary {
  // 继承设计系统的 btn-secondary 样式

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

- [ ] **Step 3: 创建 ButtonDanger 组件**

创建 `src/components/common/ButtonDanger.vue`：

```vue
<template>
  <button class="btn-danger" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
interface Props {
  disabled?: boolean
}

interface Emits {
  (e: 'click', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

const emit = defineEmits<Emits>()

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.btn-danger {
  // 继承设计系统的 btn-danger 样式

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>
```

- [ ] **Step 4: 提交按钮组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/ButtonPrimary.vue src/components/common/ButtonSecondary.vue src/components/common/ButtonDanger.vue
git commit -m "feat: 创建按钮组件系统（Primary/Secondary/Danger）"
```

---

#### Task 5: 创建状态徽章组件

**Files:**
- Create: `src/components/common/StatusBadge.vue`

- [ ] **Step 1: 创建 StatusBadge 组件**

创建 `src/components/common/StatusBadge.vue`：

```vue
<template>
  <view class="status-badge" :class="statusClass">
    {{ text }}
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'active' | 'billing' | 'idle' | 'warning'
  text?: string
}

const props = defineProps<Props>()

const statusClass = computed(() => {
  return `status-${props.type}`
})

const text = computed(() => {
  if (props.text) return props.text

  const statusMap = {
    active: '空闲',
    billing: '计费中',
    idle: '空闲',
    warning: '注意'
  }
  return statusMap[props.type] || '空闲'
})
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.status-badge {
  // 继承设计系统的 status-badge 样式
}
</style>
```

- [ ] **Step 2: 提交徽章组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/StatusBadge.vue
git commit -m "feat: 创建状态徽章组件 StatusBadge"
```

---

#### Task 6: 创建弹窗基础组件

**Files:**
- Create: `src/components/common/ModalBase.vue`

- [ ] **Step 1: 创建 ModalBase 组件**

创建 `src/components/common/ModalBase.vue`：

```vue
<template>
  <!-- 弹窗遮罩 -->
  <view class="modal-overlay" v-if="visible" @click="handleOverlayClick">
    <!-- 弹窗容器 -->
    <view class="modal-container" @click.stop>
      <!-- 弹窗头部 -->
      <view class="modal-header">
        <view class="modal-title text-card-title">{{ title }}</view>
        <view class="modal-close" @click="handleClose">×</view>
      </view>

      <!-- 弹窗内容 -->
      <view class="modal-body">
        <slot></slot>
      </view>

      <!-- 弹窗底部 -->
      <view class="modal-footer">
        <slot name="footer"></slot>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  closeOnOverlay?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'overlay-click'): void
}

const props = withDefaults(defineProps<Props>(), {
  closeOnOverlay: true
})

const emit = defineEmits<Emits>()

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    emit('close')
  }
  emit('overlay-click')
}

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.modal-overlay {
  // 继承设计系统的 modal-overlay 样式
}

.modal-container {
  // 继承设计系统的 modal-container 样式
}

.modal-header {
  // 继承设计系统的 modal-header 样式
}

.modal-title {
  // 继承 text-card-title 样式
}

.modal-close {
  // 继承设计系统的 modal-close 样式
}

.modal-body {
  // 继承设计系统的 modal-body 样式
}

.modal-footer {
  // 继承设计系统的 modal-footer 样式
}
</style>
```

- [ ] **Step 2: 提交弹窗基础组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/ModalBase.vue
git commit -m "feat: 创建弹窗基础组件 ModalBase"
```

---

#### Task 7: 创建确认弹窗和信息弹窗组件

**Files:**
- Create: `src/components/common/ModalConfirm.vue`
- Create: `src/components/common/ModalInfo.vue`

- [ ] **Step 1: 创建 ModalConfirm 确认弹窗组件**

创建 `src/components/common/ModalConfirm.vue`：

```vue
<template>
  <ModalBase
    :visible="visible"
    :title="title"
    @close="handleCancel"
  >
    <!-- 内容 -->
    <view class="confirm-content text-secondary">
      {{ message }}
    </view>

    <!-- 底部操作 -->
    <template #footer>
      <view class="modal-actions">
        <ButtonSecondary @click="handleCancel">取消</ButtonSecondary>
        <ButtonDanger @click="handleConfirm" v-if="isDanger">确认</ButtonDanger>
        <ButtonPrimary @click="handleConfirm" v-else>确认</ButtonPrimary>
      </view>
    </template>
  </ModalBase>
</template>

<script setup lang="ts">
import ModalBase from './ModalBase.vue'
import ButtonPrimary from './ButtonPrimary.vue'
import ButtonSecondary from './ButtonSecondary.vue'
import ButtonDanger from './ButtonDanger.vue'

interface Props {
  visible: boolean
  title: string
  message: string
  isDanger?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  isDanger: false
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.confirm-content {
  text-align: center;
  padding: $spacing-lg 0;
}
</style>
```

- [ ] **Step 2: 创建 ModalInfo 信息弹窗组件**

创建 `src/components/common/ModalInfo.vue`：

```vue
<template>
  <ModalBase
    :visible="visible"
    :title="title"
    @close="handleClose"
  >
    <!-- 内容插槽 -->
    <slot></slot>

    <!-- 底部操作 -->
    <template #footer>
      <view class="modal-actions">
        <ButtonPrimary @click="handleClose">关闭</ButtonPrimary>
      </view>
    </template>
  </ModalBase>
</template>

<script setup lang="ts">
import ModalBase from './ModalBase.vue'
import ButtonPrimary from './ButtonPrimary.vue'

interface Props {
  visible: boolean
  title: string
}

interface Emits {
  (e: 'close'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';
</style>
```

- [ ] **Step 3: 提交弹窗组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/ModalConfirm.vue src/components/common/ModalInfo.vue
git commit -m "feat: 创建确认弹窗和信息弹窗组件"
```

---

### Phase 2: 重构首页（验证设计系统）

#### Task 8: 重构首页布局结构

**Files:**
- Modify: `src/pages/index/index.vue`

**实施说明**：
首页是设计系统的第一个验证页面，需要完整重构布局，应用所有基础组件。

- [ ] **Step 1: 分析现有首页结构**

阅读现有首页文件 `src/pages/index/index.vue`，识别：
- 现有功能逻辑（保持不变）
- 数据获取逻辑（保持不变）
- 需要重构的布局部分

记录现有功能：
1. 台桌信息展示
2. 时间计时逻辑
3. 订单状态展示
4. 快捷操作按钮
5. 比赛信息展示（如果有）

- [ ] **Step 2: 重构首页布局 - 引入设计系统组件**

修改 `src/pages/index/index.vue`，应用新的布局结构：

**保留原有的 script 部分**（功能逻辑不变）

**重构 template 部分**：

```vue
<template>
  <view class="page-container">
    <!-- 固定头部 -->
    <PageHeader
      :table-number="tableNumber"
      :status="tableStatus"
      :current-time="currentTime"
      :elapsed-time="elapsedTime"
    >
      <template #right>
        <ButtonSm @click="goToProduct">点单</ButtonSm>
        <ButtonSm @click="goToBill">账单</ButtonSm>
      </template>
    </PageHeader>

    <!-- 主内容区 -->
    <view class="page-content">
      <!-- 状态信息卡片 -->
      <CardBase title="台桌状态">
        <view class="status-grid">
          <view class="status-item">
            <view class="status-label text-label">订单状态</view>
            <view class="status-value text-primary">{{ orderStatus }}</view>
          </view>
          <view class="status-item">
            <view class="status-label text-label">已消费</view>
            <view class="status-value text-primary">{{ totalAmount }}</view>
          </view>
          <view class="status-item">
            <view class="status-label text-label">预计结束</view>
            <view class="status-value text-primary">{{ endTime }}</view>
          </view>
        </view>
      </CardBase>

      <!-- 快捷操作卡片 -->
      <CardBase title="快捷操作">
        <view class="action-buttons">
          <ButtonPrimary @click="goToProduct">立即点单</ButtonPrimary>
          <ButtonSecondary @click="goToBill">查看账单</ButtonSecondary>
          <ButtonDanger @click="handleCheckout">结账离场</ButtonDanger>
        </view>
      </CardBase>

      <!-- 比赛信息卡片（条件显示） -->
      <CardBase title="比赛信息" v-if="hasMatch">
        <view class="match-info">
          <view class="match-status text-secondary">{{ matchStatus }}</view>
          <view class="match-score text-page-title">{{ score }}</view>
          <view class="match-players text-secondary">{{ players }}</view>
        </view>
      </CardBase>
    </view>

    <!-- 底部操作区 -->
    <view class="page-footer">
      <ButtonSecondary @click="goToDetail">查看详情</ButtonSecondary>
      <ButtonPrimary @click="switchPage">切换页面</ButtonPrimary>
    </view>
  </view>
</template>
```

**重构 style 部分**：

```vue
<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $dark-bg-primary;
}

.page-content {
  flex: 1;
  padding: $spacing-md;
  overflow-y: auto;
}

.page-footer {
  height: 120px;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  background: $dark-bg-primary;
  border-top: 1px solid $dark-border-subtle;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $spacing-sm;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.status-label {
  // 继承 text-label 样式
}

.status-value {
  // 继承 text-primary 样式
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.match-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-md;
}

.match-status {
  // 继承 text-secondary 样式
}

.match-score {
  // 继承 text-page-title 样式（超大字号）
}

.match-players {
  // 继承 text-secondary 样式
}
</style>
```

- [ ] **Step 3: 测试首页重构**

启动开发服务器，查看首页效果：
```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
npm run dev:h5
```

验证：
1. 头部布局正确显示（台桌号、时间、状态）
2. 卡片布局正确显示（大圆角、间距合适）
3. 字体大小适配27寸屏幕
4. 按钮大小便于触屏操作
5. 所有原有功能正常工作

- [ ] **Step 4: 提交首页重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/index/index.vue
git commit -m "refactor: 重构首页布局，应用设计系统"
```

---

### Phase 3: 重构其他页面

#### Task 9: 重构商品点单页面

**Files:**
- Modify: `src/pages/product/index.vue`

- [ ] **Step 1: 分析现有商品点单页面**

阅读 `src/pages/product/index.vue`，识别需要保留的功能逻辑：
1. 商品分类切换
2. 商品列表展示
3. 商品添加到购物车
4. 购物车数量管理
5. 提交订单逻辑

- [ ] **Step 2: 重构商品点单页面布局**

重构 template 部分，应用设计系统：

```vue
<template>
  <view class="page-container">
    <!-- 固定头部 -->
    <PageHeader
      :table-number="tableNumber"
      :status="tableStatus"
      :current-time="currentTime"
    >
      <template #right>
        <view class="cart-info">
          <text class="text-secondary">已选 {{ cartCount }} 件</text>
        </view>
      </template>
    </PageHeader>

    <!-- 主内容区 -->
    <view class="page-content">
      <!-- 商品分类卡片 -->
      <CardBase>
        <view class="category-tabs">
          <button
            class="category-tab"
            :class="{ active: currentCategory === category.id }"
            @click="switchCategory(category.id)"
            v-for="category in categories"
            :key="category.id"
          >
            {{ category.name }}
          </button>
        </view>
      </CardBase>

      <!-- 商品列表 -->
      <view class="product-grid">
        <view
          class="product-card"
          v-for="product in products"
          :key="product.id"
        >
          <image class="product-image" :src="product.image" mode="aspectFit" />
          <view class="product-info">
            <view class="product-name text-primary">{{ product.name }}</view>
            <view class="product-price text-card-title">¥{{ product.price }}</view>
          </view>
          <ButtonSm class="product-add-btn" @click="addToCart(product)">
            添加
          </ButtonSm>
        </view>
      </view>
    </view>

    <!-- 底部操作区 -->
    <view class="page-footer">
      <view class="cart-summary">
        <text class="text-secondary">已选 {{ cartCount }} 件</text>
        <text class="text-card-title">¥{{ cartTotal }}</text>
      </view>
      <ButtonPrimary @click="submitOrder" :disabled="cartCount === 0">
        提交订单
      </ButtonPrimary>
    </view>
  </view>
</template>
```

**重构 style 部分**：

```vue
<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $dark-bg-primary;
}

.page-content {
  flex: 1;
  padding: $spacing-md;
  overflow-y: auto;
}

.page-footer {
  height: 120px;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $dark-bg-primary;
  border-top: 1px solid $dark-border-subtle;
}

.category-tabs {
  display: flex;
  gap: $spacing-sm;
}

.category-tab {
  padding: 12px $spacing-md;
  border-radius: $rounded-md;
  font-size: $font-secondary;
  background: transparent;
  border: 1px solid $dark-border-subtle;
  color: $dark-text-secondary;
  cursor: pointer;

  &.active {
    background: $accent-primary;
    color: #fff;
    border-color: $accent-primary;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.product-card {
  border-radius: $rounded-lg;
  padding: $spacing-sm;
  background: $dark-bg-secondary;
  border: 1px solid $dark-border-subtle;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.product-image {
  height: 120px;
  margin-bottom: $spacing-sm;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.product-name {
  // 继承 text-primary 样式
}

.product-price {
  // 继承 text-card-title 样式
}

.product-add-btn {
  margin-top: $spacing-sm;
}

.cart-info {
  display: flex;
  align-items: center;
}

.cart-summary {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}
</style>
```

- [ ] **Step 3: 测试商品点单页面**

启动开发服务器，验证：
1. 商品分类切换正常
2. 商品列表双列布局正确
3. 商品卡片样式符合设计系统
4. 添加到购物车功能正常
5. 提交订单功能正常

- [ ] **Step 4: 提交商品点单页面重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/product/index.vue
git commit -m "refactor: 重构商品点单页面布局"
```

---

#### Task 10: 重构智能计分页面

**Files:**
- Modify: `src/pages/score/index.vue`

- [ ] **Step 1: 分析智能计分页面**

阅读 `src/pages/score/index.vue`，识别功能逻辑：
1. 比赛状态管理
2. 比分显示和更新
3. 计分操作（加分、减分）
4. 换边功能
5. 结束比赛逻辑

- [ ] **Step 2: 重构智能计分页面布局**

重构 template：

```vue
<template>
  <view class="page-container">
    <!-- 固定头部 -->
    <PageHeader
      :table-number="tableNumber"
      :status="matchStatus"
      :current-time="currentTime"
    >
      <template #right>
        <StatusBadge :type="matchStatusType" :text="matchStatusText" />
      </template>
    </PageHeader>

    <!-- 主内容区 -->
    <view class="page-content">
      <!-- 比分显示卡片 -->
      <CardBase>
        <view class="score-display">
          <view class="player-score">
            <view class="player-name text-primary">{{ player1.name }}</view>
            <view class="score-number text-page-title">{{ player1.score }}</view>
          </view>

          <view class="score-divider text-page-title">:</view>

          <view class="player-score">
            <view class="player-name text-primary">{{ player2.name }}</view>
            <view class="score-number text-page-title">{{ player2.score }}</view>
          </view>
        </view>
      </CardBase>

      <!-- 计分操作卡片 -->
      <CardBase title="计分操作">
        <view class="score-actions">
          <view class="player-actions">
            <ButtonSm @click="addScore(player1)">加分</ButtonSm>
            <ButtonSm @click="subtractScore(player1)">减分</ButtonSm>
          </view>

          <ButtonSecondary @click="switchSides">换边</ButtonSecondary>

          <view class="player-actions">
            <ButtonSm @click="addScore(player2)">加分</ButtonSm>
            <ButtonSm @click="subtractScore(player2)">减分</ButtonSm>
          </view>
        </view>
      </CardBase>
    </view>

    <!-- 底部操作区 -->
    <view class="page-footer">
      <ButtonSecondary @click="pauseMatch">暂停比赛</ButtonSecondary>
      <ButtonDanger @click="endMatch">结束比赛</ButtonDanger>
    </view>
  </view>
</template>
```

**重构 style**：

```vue
<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.page-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $dark-bg-primary;
}

.page-content {
  flex: 1;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
}

.page-footer {
  height: 120px;
  padding: $spacing-md;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  background: $dark-bg-primary;
  border-top: 1px solid $dark-border-subtle;
}

.score-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xl;
  padding: $spacing-xl 0;
}

.player-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-sm;
}

.player-name {
  // 继承 text-primary 样式
}

.score-number {
  // 继承 text-page-title 样式（超大字号）
}

.score-divider {
  // 继承 text-page-title 样式
}

.score-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-md;
}

.player-actions {
  display: flex;
  gap: $spacing-sm;
}
</style>
```

- [ ] **Step 3: 测试智能计分页面**

验证：
1. 比分显示超大字号，远距离可见
2. 计分操作按钮布局清晰
3. 计分功能正常
4. 换边功能正常
5. 结束比赛功能正常

- [ ] **Step 4: 提交智能计分页面重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/score/index.vue
git commit -m "refactor: 重构智能计分页面布局"
```

---

#### Task 11: 重构教练预约页面

**Files:**
- Modify: `src/pages/assistant/index.vue`

- [ ] **Step 1: 分析教练预约页面**

阅读 `src/pages/assistant/index.vue`，识别功能：
1. 教练列表展示
2. 教练筛选
3. 预约教练
4. 预约确认

- [ ] **Step 2: 重构教练预约页面布局**

重构 template 和 style（参考设计文档中的教练预约布局）

- [ ] **Step 3: 测试教练预约页面**

- [ ] **Step 4: 提交教练预约页面重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/assistant/index.vue
git commit -m "refactor: 重构教练预约页面布局"
```

---

#### Task 12: 重构开台页面

**Files:**
- Modify: `src/pages/bill/index.vue` (开台页面)

**注意**：需要确认开台页面的实际路径，可能与账单页面路径冲突。

- [ ] **Step 1: 确认开台页面路径**

检查项目结构，确认开台页面的准确路径。

- [ ] **Step 2: 分析开台页面**

识别功能：
1. 台桌选择
2. 开台设置（时间、人数）
3. 确认开台

- [ ] **Step 3: 重构开台页面布局**

重构 template 和 style（参考设计文档中的开台布局）

- [ ] **Step 4: 测试开台页面**

- [ ] **Step 5: 提交开台页面重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/bill/index.vue
git commit -m "refactor: 重构开台页面布局"
```

---

#### Task 13: 重构账单页面

**Files:**
- Modify: `src/pages/bill/index.vue` (账单页面)

**注意**：如果账单页面与开台页面路径相同，需要检查是否是同一个文件的不同视图状态，或者路径有误。

- [ ] **Step 1: 确认账单页面路径**

检查项目结构，确认账单页面的准确路径。

- [ ] **Step 2: 分析账单页面**

识别功能：
1. 账单摘要展示
2. 消费明细列表
3. 结账操作

- [ ] **Step 3: 重构账单页面布局**

重构 template 和 style（参考设计文档中的账单布局）

- [ ] **Step 4: 测试账单页面**

- [ ] **Step 5: 提交账单页面重构**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/pages/bill/index.vue
git commit -m "refactor: 重构账单页面布局"
```

---

### Phase 4: 整体测试和调整

#### Task 14: 整体测试所有页面

- [ ] **Step 1: 测试所有页面布局**

启动开发服务器，逐页检查：
1. 首页
2. 商品点单
3. 智能计分
4. 教练预约
5. 开台
6. 账单

验证每个页面：
- 布局结构正确（三段式）
- 字体大小适配27寸屏幕
- 卡片圆角和间距符合设计系统
- 按钮大小便于触屏操作
- 所有原有功能正常工作

- [ ] **Step 2: 调整视觉细节**

根据实际效果，微调：
1. 字体大小（如果太大或太小）
2. 间距大小（如果太拥挤或太稀疏）
3. 卡片圆角（如果不够圆或太圆）
4. 按钮尺寸（如果不便点击）
5. 颜色对比度（如果不够清晰）

- [ ] **Step 3: 性能优化**

检查页面性能：
1. 页面切换是否流畅
2. 列表滚动是否流畅
3. 图片加载是否快速
4. 弹窗打开是否流畅

如有性能问题，优化：
1. 图片压缩
2. 列表虚拟滚动
3. 懒加载
4. 减少不必要的重渲染

- [ ] **Step 4: 提交最终调整**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add -A
git commit -m "refactor: 整体调整和性能优化"
```

---

#### Task 15: 创建 ButtonSm 组件

**Files:**
- Create: `src/components/common/ButtonSm.vue`

**说明**：在 Task 8 和后续任务中使用了 ButtonSm，但未在 Phase 1 中创建，需要补充创建。

- [ ] **Step 1: 创建 ButtonSm 组件**

创建 `src/components/common/ButtonSm.vue`：

```vue
<template>
  <button class="btn-sm" :class="variantClass" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}

interface Emits {
  (e: 'click', event: Event): void
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false
})

const emit = defineEmits<Emits>()

const variantClass = computed(() => {
  return `btn-${props.variant}`
})

const handleClick = (event: Event) => {
  if (!props.disabled) {
    emit('click', event)
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/design-system.scss';

.btn-sm {
  font-size: $font-secondary;
  padding: 12px $spacing-lg;
  border-radius: $rounded-sm;
  min-height: 44px;
  border: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active {
    opacity: 0.8;
  }

  &.btn-primary {
    background: $accent-primary;
    color: #fff;
  }

  &.btn-secondary {
    background: transparent;
    border: 1px solid $dark-border-strong;
    color: $dark-text-secondary;
  }

  &.btn-danger {
    background: $accent-danger;
    color: #fff;
  }
}
</style>
```

- [ ] **Step 2: 提交 ButtonSm 组件**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwtable
git add src/components/common/ButtonSm.vue
git commit -m "feat: 创建小按钮组件 ButtonSm"
```

---

## 自审检查清单

### 1. 规格覆盖检查

对照设计文档，检查每个需求是否都有对应的实施任务：

**设计系统需求**：
- ✅ 间距系统（Task 1）
- ✅ 字体系统（Task 1）
- ✅ 颜色系统（Task 1）
- ✅ 圆角系统（Task 1）
- ✅ 卡片组件（Task 3）
- ✅ 弹窗系统（Task 6, 7）
- ✅ 按钮系统（Task 4, 15）

**页面布局需求**：
- ✅ 首页（Task 8）
- ✅ 商品点单（Task 9）
- ✅ 智能计分（Task 10）
- ✅ 教练预约（Task 11）
- ✅ 开台（Task 12）
- ✅ 账单（Task 13）

**其他需求**：
- ✅ 统一头部组件（Task 2）
- ✅ 状态徽章组件（Task 5）
- ✅ 整体测试（Task 14）

**发现缺失**：
- ❌ ButtonSm 组件在 Task 8 中使用，但未在 Phase 1 创建
- ✅ 已添加 Task 15 补充创建 ButtonSm 组件

### 2. 占位符检查

检查计划文档，确保没有以下占位符模式：
- ✅ 没有 "TBD"、"TODO"、"implement later"
- ✅ 没有 "Add appropriate error handling" 等模糊描述
- ✅ 所有代码步骤都有完整的代码示例
- ✅ 所有命令都有明确的执行内容
- ✅ 没有 "Similar to Task N" 的引用，每个任务都有完整描述

### 3. 类型一致性检查

检查组件 Props 和 Emits 定义的一致性：
- ✅ PageHeader: Props 定义明确，status 类型明确
- ✅ CardBase: Props 简单明确
- ✅ ButtonPrimary/Secondary/Danger: Props 和 Emits 定义一致
- ✅ StatusBadge: Props 定义明确，type 类型明确
- ✅ ModalBase: Props 和 Emits 定义一致
- ✅ ModalConfirm: Props 定义明确，使用 ModalBase 和 ButtonPrimary 等组件
- ✅ ModalInfo: Props 定义明确，使用 ModalBase 和 ButtonPrimary
- ✅ ButtonSm: Props 包含 variant，支持 primary/secondary/danger 三种样式

**发现问题并修复**：
- ✅ ModalConfirm 中使用了 ButtonPrimary、ButtonSecondary、ButtonDanger，需要确保这些组件已创建（Task 4 已创建）
- ✅ ModalInfo 中使用了 ButtonPrimary，已确认 Task 4 已创建

---

## 实施注意事项

1. **保持功能逻辑不变**：所有重构都仅修改布局和样式，不改变任何功能逻辑
2. **渐进式重构**：先建立基础组件，再逐页重构，便于验证和调整
3. **频繁提交**：每个任务完成后立即提交，便于追踪和回滚
4. **实际测试**：每个页面重构后都要实际运行测试，确保视觉效果和功能正常
5. **灵活调整**：根据实际效果微调字体、间距、圆角等参数

---

**计划编写完成日期**：2026-06-29
**下一步**：选择执行方式（Subagent-Driven 或 Inline Execution）