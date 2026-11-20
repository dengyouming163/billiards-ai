# 公共组件标准化 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将散落在 8 个页面的弹窗和头部内联样式统一为 4 个标准组件，消除重复 CSS，固化设计语言。

**Architecture:** 创建 `src/components/standard/` 目录，放 4 个组件（ContentModal / AlertModal / PageHeader / SubPageHeader），然后逐页替换旧的内联样式为组件引用。每页独立 commit，风险隔离。

**Tech Stack:** uni-app 3 + Vue 3 + TypeScript + SCSS

**Spec:** `docs/superpowers/specs/2026-06-17-standard-components-design.md`

---

## 文件结构

```
新增:
  src/components/standard/ContentModal.vue    # 内容弹窗 70vw×75vh
  src/components/standard/AlertModal.vue      # 提示弹窗 56vw 自适应
  src/components/standard/PageHeader.vue      # 一级页面头部 sticky
  src/components/standard/SubPageHeader.vue   # 二级页面头部 含返回

修改 (7个 —— login 不涉及):
  src/pages/index/index.vue       # 5种弹窗 → ContentModal+AlertModal, header → PageHeader
  src/pages/product/index.vue     # 3种弹窗 → ContentModal, header → PageHeader
  src/pages/assistant/index.vue   # 2种弹窗 → ContentModal, header → PageHeader
  src/pages/score/index.vue       # 3种弹窗 → ContentModal+AlertModal, header → PageHeader
  src/pages/order/index.vue       # 2种弹窗 → ContentModal+AlertModal, header → SubPageHeader
  src/pages/bill/index.vue        # 内联支付弹窗 → AlertModal, header → SubPageHeader
  src/pages/activity/index.vue    # 1种弹窗 → ContentModal, header保持
```

---

### Task 1: 创建 ContentModal 组件

**Files:**
- Create: `src/components/standard/ContentModal.vue`

- [ ] **Step 1: 编写 ContentModal.vue**

```vue
<template>
  <view class="cm-overlay" v-if="visible" @click="$emit('close')">
    <view class="cm-card" @click.stop>
      <!-- 顶部装饰线 -->
      <view class="cm-top-line"></view>

      <!-- 头部 -->
      <view class="cm-header">
        <text class="cm-title">{{ title }}</text>
        <view class="cm-close" @click="$emit('close')">
          <text>✕</text>
        </view>
      </view>

      <!-- 内容区 -->
      <scroll-view class="cm-body" scroll-y :show-scrollbar="false">
        <slot />
      </scroll-view>

      <!-- 底部操作区 -->
      <view class="cm-footer" v-if="showFooter">
        <slot name="footer" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  showFooter?: boolean
}>()

defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.cm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(16rpx); padding: 40rpx;
}

.cm-card {
  width: 70vw; height: 75vh; max-height: 85vh;
  background: linear-gradient(180deg, #232340 0%, #1a1a30 100%);
  border-radius: 64rpx; padding: 0;
  border: 4rpx solid rgba($gold, .35);
  box-shadow: 0 40rpx 100rpx rgba(0, 0, 0, .6), 0 0 80rpx rgba($gold, .15), inset 0 2rpx 0 rgba(255, 255, 255, .08);
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
}

.cm-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 6rpx;
  background: linear-gradient(90deg, transparent, rgba($gold, .8), rgba($gold, .4), transparent);
  z-index: 1;
}

.cm-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 48rpx 48rpx 28rpx;
  border-bottom: 2rpx solid rgba($gold, .2);
  flex-shrink: 0;
}

.cm-title {
  font-size: 48rpx; font-weight: 800; color: $gold; letter-spacing: 3rpx;
  text-shadow: 0 0 24rpx rgba($gold, .5);
}

.cm-close {
  width: 64rpx; height: 64rpx;
  background: linear-gradient(135deg, rgba($gold, .12), rgba($gold, .04));
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; color: $gold; border: 2rpx solid rgba($gold, .25);
  &:active { transform: scale(.92); }
}

.cm-body {
  flex: 1; overflow-y: auto; padding: 40rpx 48rpx; margin-bottom: 8rpx;
}

.cm-footer {
  flex-shrink: 0;
  padding: 28rpx 48rpx 40rpx;
  border-top: 2rpx solid rgba($gold, .2);
}
</style>
```

- [ ] **Step 2: 验证编译**

Run: `npx vue-tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 3: Commit**

```
git add src/components/standard/ContentModal.vue
git commit -m "feat: add ContentModal standard component (70vw×75vh)"
```


### Task 2: 创建 AlertModal 组件

**Files:**
- Create: `src/components/standard/AlertModal.vue`

- [ ] **Step 1: 编写 AlertModal.vue**

```vue
<template>
  <view class="am-overlay" v-if="visible" @click="$emit('cancel')">
    <view class="am-card" @click.stop>
      <!-- 图标 -->
      <text class="am-icon" v-if="icon">{{ icon }}</text>

      <!-- 标题 -->
      <text class="am-title">{{ title }}</text>

      <!-- 副文案 -->
      <text class="am-message" v-if="message">{{ message }}</text>

      <!-- 按钮区 -->
      <view class="am-actions">
        <view class="am-btn secondary" v-if="cancelText" @click="$emit('cancel')">
          <text>{{ cancelText }}</text>
        </view>
        <view
          class="am-btn"
          :class="{ danger: confirmDanger }"
          @click="$emit('confirm')"
        >
          <text>{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  message?: string
  icon?: string
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.am-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1001; backdrop-filter: blur(16rpx); padding: 40rpx;
}

.am-card {
  width: 56vw;
  background: linear-gradient(180deg, #232340 0%, #1a1a30 100%);
  border-radius: 48rpx; padding: 48rpx 48rpx 36rpx;
  border: 3rpx solid rgba($gold, .3);
  box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, .6), 0 0 60rpx rgba($gold, .12);
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
}

.am-icon   { font-size: 80rpx; display: block; }
.am-title  { font-size: 36rpx; font-weight: 700; color: #f1f5f9; }

.am-message {
  font-size: 28rpx; color: rgba(255, 255, 255, .4); line-height: 1.5;
}

.am-actions {
  display: flex; gap: 24rpx; margin-top: 16rpx; width: 100%;

  .am-btn {
    flex: 1; height: 88rpx; border-radius: 28rpx;
    display: flex; align-items: center; justify-content: center;
    font-size: 32rpx; font-weight: 700;
    background: linear-gradient(135deg, $gold, #8a6d3b); color: #1a1a2e;
    box-shadow: 0 8rpx 28rpx rgba($gold, .35);
    &:active { transform: scale(.97); }

    &.secondary {
      background: rgba(255, 255, 255, .08); color: rgba(255, 255, 255, .7);
      box-shadow: none; border: 2rpx solid rgba(255, 255, 255, .1);
    }

    &.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 8rpx 28rpx rgba(239, 68, 68, .35);
    }
  }
}
</style>
```

- [ ] **Step 2: 验证编译**

Run: `npx vue-tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 3: Commit**

```
git add src/components/standard/AlertModal.vue
git commit -m "feat: add AlertModal standard component (56vw auto-height)"
```


### Task 3: 创建 PageHeader 组件

**Files:**
- Create: `src/components/standard/PageHeader.vue`

- [ ] **Step 1: 编写 PageHeader.vue**

```vue
<template>
  <view class="ph-sticky">
    <view class="ph-header">
      <view class="ph-left">
        <text class="ph-icon" v-if="icon">{{ icon }}</text>
        <view class="ph-text">
          <text class="ph-title">{{ title }}</text>
          <text class="ph-subtitle" v-if="subtitle">{{ subtitle }}</text>
        </view>
      </view>
      <view class="ph-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  subtitle?: string
}>()
</script>

<style lang="scss" scoped>
$gold: #c9a962; $bg: #0f0f16;

.ph-sticky {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  padding: 28rpx 40rpx;
  background: linear-gradient(180deg, rgba($bg, .98), rgba($bg, .95));
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($gold, .1);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, .4);

  &::after {
    content: ''; position: absolute; bottom: -2rpx; left: 0; right: 0;
    height: 2rpx; background: linear-gradient(90deg, transparent, rgba($gold, .3), transparent);
  }
}

.ph-header { display: flex; justify-content: space-between; align-items: center; }
.ph-left   { display: flex; align-items: center; gap: 20rpx; }
.ph-icon   { font-size: 64rpx; filter: drop-shadow(0 4rpx 12rpx rgba($gold, .3)); }
.ph-text   { display: flex; flex-direction: column; }
.ph-title  { font-size: 48rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }
.ph-subtitle { font-size: 26rpx; color: #6b7280; margin-top: 4rpx; }
.ph-right  { display: flex; align-items: center; gap: 16rpx; }
</style>
```

- [ ] **Step 2: 验证编译**

Run: `npx vue-tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 3: Commit**

```
git add src/components/standard/PageHeader.vue
git commit -m "feat: add PageHeader standard component (sticky tabbar header)"
```


### Task 4: 创建 SubPageHeader 组件

**Files:**
- Create: `src/components/standard/SubPageHeader.vue`

- [ ] **Step 1: 编写 SubPageHeader.vue**

```vue
<template>
  <view class="sph-header">
    <view class="sph-back" @click="$emit('back')">
      <text>←</text>
    </view>
    <text class="sph-title">{{ title }}</text>
    <view class="sph-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

defineEmits<{
  back: []
}>()
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.sph-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx 40rpx 24rpx;
  background: linear-gradient(180deg, rgba(#0f0f16,.98), rgba(#0f0f16,.95));
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($gold,.1);
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,.4);
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 112rpx; box-sizing: border-box;
}

.sph-back {
  width: 96rpx; height: 96rpx;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2rpx solid #374151;
  flex-shrink: 0;

  text { font-size: 48rpx; color: #fff; }

  &:active { transform: scale(.92); border-color: $gold; }
}

.sph-title {
  font-size: 48rpx; font-weight: 700; color: #fff;
  text-shadow: 0 0 20rpx rgba($gold, .3);
  flex: 1; text-align: center;
}

.sph-placeholder { width: 96rpx; flex-shrink: 0; }
</style>
```

- [ ] **Step 2: 验证编译**

Run: `npx vue-tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `0`

- [ ] **Step 3: Commit**

```
git add src/components/standard/SubPageHeader.vue
git commit -m "feat: add SubPageHeader standard component (back button header)"
```


### Task 5: 替换 index.vue 弹窗和头部

**Files:**
- Modify: `src/pages/index/index.vue`

将 5 处内联弹窗替换为 ContentModal 和 AlertModal。具体要删除的旧 CSS (`.modal-overlay`, `.modal-content`, `.modal-card-lg`, `.modal-card`, `.modal-card-sm`, `.header`) 待替换完成后清理。

- [ ] **Step 1: 添加 import**

在 script 区块顶部，现有 import 之后添加：

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'
```

- [ ] **Step 2: 替换头部 (lines 22-42 → PageHeader)**

删除原有的 `<view class="header">...</view>` 块，替换为：

```vue
<PageHeader
  icon="🎱"
  title="台桌大屏"
  :subtitle="'桌台 ' + tableNumber + ' · ¥' + tableHourlyRate + '/时'"
>
  <template #right>
    <view class="ws-indicator" :class="wsState">
      <view class="ws-dot"></view>
      <text class="ws-text">{{ wsState === 'connected' ? '在线' : wsState === 'connecting' ? '连接中' : '离线' }}</text>
    </view>
    <view class="header-time">
      <text class="time-value">{{ currentTime }}</text>
      <text class="time-date">{{ currentDate }}</text>
    </view>
  </template>
</PageHeader>
```

- [ ] **Step 3: 替换已点商品弹窗 (lines 468-487 → ContentModal)**

```vue
<ContentModal
  :visible="showProductItemsModal"
  title="已点商品"
  @close="showProductItemsModal = false"
>
  <view class="modal-item-row" v-for="item in productOnlyItems" :key="item.id">
    <text class="modal-item-emoji">{{ item.emoji || '📦' }}</text>
    <text class="modal-item-name">{{ item.name || item.product_name || item.item_name }}</text>
    <text class="modal-item-qty">x{{ item.quantity }}</text>
    <text class="modal-item-price">¥{{ formatPrice(item.final_price || item.total_price || 0) }}</text>
  </view>
  <template #footer>
    <view style="display:flex;justify-content:space-between;align-items:center;padding:0 8rpx;">
      <text style="font-size:28rpx;color:#ffd700;font-weight:600;">商品费：¥{{ formatPrice(orderStore.productFee) }}</text>
      <view class="btn btn-outline" style="padding:16rpx 40rpx;border-radius:28rpx;background:rgba(255,255,255,.03);border:2rpx solid #4b5563;color:#e0e0f0;font-size:28rpx;font-weight:600;" @click="showProductItemsModal = false">关闭</view>
    </view>
  </template>
</ContentModal>
```

- [ ] **Step 4: 替换助教服务弹窗 (lines 489-526 → ContentModal)**

```vue
<ContentModal
  :visible="showAssistantServicesModal"
  title="助教服务"
  @close="showAssistantServicesModal = false"
>
  <view class="as-item" v-for="item in assistantOrdersDetail" :key="item.item_id || item.id">
    <!-- 内容保持不变，只替换外壳 -->
    <view class="as-avatar">
      <image v-if="item.assistant_avatar" :src="item.assistant_avatar" mode="aspectFill" />
      <text v-else>👨‍🏫</text>
    </view>
    <view class="as-info">
      <text class="as-name">{{ item.assistant_name }}</text>
      <view class="as-meta">
        <text class="as-rate">¥{{ item.hourly_rate }}/h</text>
        <text class="as-status" :class="item.status">{{ asStatusLabel(item.status) }}</text>
      </view>
      <text class="as-time" v-if="item.started_at">
        开始 {{ formatStartTime(item.started_at) }}
        <template v-if="item.status === 'serving'"> · 已服务 {{ calcServingDuration(item.started_at) }}</template>
      </text>
    </view>
    <text class="as-price" v-if="item.status === 'completed'">¥{{ formatPrice(item.final_price || 0) }}</text>
  </view>
  <view v-if="assistantOrdersDetail.length === 0" style="text-align:center;padding:80rpx 0;">
    <text style="font-size:30rpx;color:rgba(255,255,255,.4);">暂无进行中的助教服务</text>
  </view>
  <template #footer>
    <view style="display:flex;justify-content:space-between;align-items:baseline;padding:0 8rpx;">
      <text style="font-size:28rpx;color:rgba(255,255,255,.5);">助教费</text>
      <text style="font-size:48rpx;font-weight:800;color:#feca57;">¥{{ formatPrice(computedAssistantFee) }}</text>
    </view>
    <view style="height:96rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:2rpx solid rgba(255,255,255,.1);font-size:34rpx;font-weight:700;margin-top:12rpx;" @click="showAssistantServicesModal = false">关闭</view>
  </template>
</ContentModal>
```

- [ ] **Step 5: 替换充电弹窗 (lines 529-553 → ContentModal)**

```vue
<ContentModal
  :visible="showChargingModal"
  title="充电服务"
  @close="showChargingModal = false"
>
  <view class="ch-port" v-for="p in ['left','right']" :key="p">
    <view class="ch-port-row">
      <text class="ch-port-icon">🔌</text>
      <view class="ch-port-info">
        <text class="ch-port-name">{{ p === 'left' ? '左侧充电口' : '右侧充电口' }}</text>
        <text class="ch-port-status" :class="getPortStatus(p)">{{ getPortStatusText(p) }}</text>
      </view>
      <text class="ch-port-timer" v-if="getPortStatus(p) === 'active'">{{ getPortElapsed(p) }}</text>
    </view>
    <view class="ch-port-actions">
      <view class="si-btn start" v-if="getPortStatus(p) === 'idle'" @click.stop="startChargingPort(p)">启动充电</view>
      <view class="si-btn end" v-if="getPortStatus(p) === 'active'" @click.stop="stopChargingPort(p)">停止充电</view>
    </view>
  </view>
  <template #footer>
    <view style="display:flex;justify-content:space-between;align-items:baseline;padding:0 8rpx;">
      <text style="font-size:28rpx;color:rgba(255,255,255,.5);">充电费用</text>
      <text style="font-size:48rpx;font-weight:800;color:#feca57;">¥{{ formatPrice(chargingFee) }}</text>
    </view>
    <view style="height:96rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:2rpx solid rgba(255,255,255,.1);font-size:34rpx;font-weight:700;margin-top:12rpx;" @click="showChargingModal = false">关闭</view>
  </template>
</ContentModal>
```

- [ ] **Step 6: 替换呼叫服务员弹窗 (lines 573-589 → AlertModal)**

删除原有的 `showCancelWaiterModal` 弹窗块，替换为：

```vue
<AlertModal
  :visible="showCancelWaiterModal"
  icon="🛎️"
  title="确定要取消呼叫服务员吗？"
  message="取消后服务员可能仍在赶来途中"
  confirm-text="确定取消"
  cancel-text="继续等待"
  confirm-danger
  @confirm="showCancelWaiterModal = false; cancelWaiterCall()"
  @cancel="showCancelWaiterModal = false"
/>
```

- [ ] **Step 7: 清理旧 CSS**

删除以下 CSS 区块的定义（仅删除定义，不删除使用这些类名的元素）：
- `.modal-overlay` 和内部 `.modal-content` (lines 2501-2693)
- `.modal-card-lg` (lines 2755-2775)
- `.modal-card` (lines 2776-2796)
- `.modal-card-sm` (lines 2797-2801)
- `.header` 相关行 (lines 889+...)

- [ ] **Step 8: 验证编译 + 测试**

```bash
npx vue-tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0
npx vitest run 2>&1 | grep -E "Test Files|Tests"
# Expected: Test Files 8 passed, Tests 133 passed
```

- [ ] **Step 9: Commit**

```
git add src/pages/index/index.vue
git commit -m "refactor(index): replace 5 inline modals and header with standard components"
```


### Task 6: 替换 product.vue 弹窗和头部

**Files:**
- Modify: `src/pages/product/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'
```

- [ ] **Step 2: 替换头部 (lines 3-12 → PageHeader)**

删除原有的 `<view class="sticky-header"><view class="header">...</view>...</view>` 结构，替换为：

```vue
<view class="sticky-header">
  <PageHeader icon="🍻" title="商品点单" :subtitle="'共 ' + products.length + ' 件商品'">
    <template #right>
      <view class="search-btn" @click="toggleSearch"><text>🔍</text></view>
    </template>
  </PageHeader>

  <!-- 订单状态条、搜索栏、分类滚动 保持原样，紧跟 Header 下方 -->
  <view class="order-status-bar" v-if="orderStatus" @click="showOrderDetailModal = true">
    ...
  </view>
  ...
</view>
```

注意：sticky-header 的 CSS 保留（positon:fixed），但 `.header` CSS 块删除，PageHeader 自带。

- [ ] **Step 3: 替换购物车弹窗 (lines 131-... → ContentModal)**

```vue
<ContentModal
  :visible="showCartModal"
  title="购物车"
  @close="closeCart"
>
  <scroll-view class="cart-body" scroll-y>
    <!-- 购物车内原有模板内容保持不变 -->
    <view class="cart-item" v-for="item in cartItems" :key="item.product_id || item.id">...</view>
  </scroll-view>
  <template #footer>
    <view class="cart-footer">
      <text>合计 ¥{{ formatPrice(cartTotal) }}</text>
      <view class="cart-submit-btn" @click="confirmOrder">确认下单</view>
    </view>
  </template>
</ContentModal>
```

- [ ] **Step 4: 替换商品详情弹窗 (lines 179-... → ContentModal)**

```vue
<ContentModal
  :visible="!!selectedProduct"
  :title="selectedProduct?.name || '商品详情'"
  @close="closeProductDetail"
>
  <!-- 详情内容保持原样 -->
  ...
  <template #footer>
    <view class="detail-footer">...</view>
  </template>
</ContentModal>
```

- [ ] **Step 5: 替换订单详情弹窗 (lines 208-... → ContentModal)**

```vue
<ContentModal
  :visible="showOrderDetailModal"
  title="订单详情"
  @close="showOrderDetailModal = false"
>
  ...
</ContentModal>
```

- [ ] **Step 6: 清理旧 CSS**

删除：`.modal-overlay` CSS 块、`.modal-card` CSS 块、`.header` 相关 CSS (保留 `.sticky-header` 的 position:fixed)

- [ ] **Step 7: 验证编译 + 测试**

```bash
npx vue-tsc --noEmit 2>&1 | grep -c "error TS"
npx vitest run 2>&1 | grep -E "Test Files|Tests"
```

- [ ] **Step 8: Commit**

```
git add src/pages/product/index.vue
git commit -m "refactor(product): replace modals and header with standard components"
```


### Task 7: 替换 assistant.vue 弹窗和头部

**Files:**
- Modify: `src/pages/assistant/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'
```

- [ ] **Step 2: 替换头部**

将 `<view class="sticky-header"><view class="header">...</view>...</view>` 替换为带 PageHeader 的 sticky-header，CSS 只保留 sticky-header 的 position:fixed，删除 `.header` CSS。

- [ ] **Step 3: 替换助教详情弹窗 → ContentModal**

保留原有 modal-body + modal-footer 内容，用 ContentModal 包裹。

- [ ] **Step 4: 替换助教服务管理弹窗 → ContentModal**

同上。

- [ ] **Step 5: 清理旧 CSS**

删除 `.modal-overlay`、`.modal-card`、`.header` CSS 块。

- [ ] **Step 6: 验证 + Commit**

```bash
npx vue-tsc --noEmit 2>&1 | grep -c "error TS"
npx vitest run 2>&1 | grep -E "Test Files|Tests"
git add src/pages/assistant/index.vue
git commit -m "refactor(assistant): replace modals and header with standard components"
```


### Task 8: 替换 score.vue 弹窗和头部

**Files:**
- Modify: `src/pages/score/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import PageHeader from '@/components/standard/PageHeader.vue'
```

- [ ] **Step 2: 替换头部 → PageHeader**

计分页面当前 header 有标题 + 副标题，直接映射到 PageHeader props。

- [ ] **Step 3: 替换确认弹窗 (lines 331-341 → AlertModal)**

计分的 `confirmDialog` 是自定义 confirm 弹窗，直接替换为 AlertModal：

```vue
<AlertModal
  :visible="confirmDialog.visible"
  :title="confirmDialog.title"
  :message="confirmDialog.message"
  :confirm-text="confirmDialog.confirmText || '确定'"
  :cancel-text="confirmDialog.cancelText || '取消'"
  @confirm="confirmDialog.onConfirm?.()"
  @cancel="handleCancel"
/>
```

删除全局的 `confirmDialog` ref 及相关方法（`showConfirmDialog`, `handleCancel` 中的 confirmDialog 重置逻辑），简化为直接使用 AlertModal 的 props。

- [ ] **Step 4: 替换规则弹窗 → ContentModal**

```vue
<ContentModal :visible="showRulesModal" title="游戏规则" @close="closeRulesModal">
  <view class="rules-content">...</view>
</ContentModal>
```

- [ ] **Step 5: 替换结果弹窗 → ContentModal**

```vue
<ContentModal :visible="showResultModal" title="比赛结果" @close="closeResultModal">
  <view class="result-content">...</view>
</ContentModal>
```

- [ ] **Step 6: 清理旧 CSS**

删除 `.modal-overlay`、`.modal-card` CSS 块。

- [ ] **Step 7: 验证 + Commit**

```bash
npx vue-tsc --noEmit 2>&1 | grep -c "error TS"
npx vitest run 2>&1 | grep -E "Test Files|Tests"
git add src/pages/score/index.vue
git commit -m "refactor(score): replace modals and header with standard components"
```


### Task 9: 替换 order.vue 弹窗和头部

**Files:**
- Modify: `src/pages/order/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import SubPageHeader from '@/components/standard/SubPageHeader.vue'
```

- [ ] **Step 2: 替换头部 → SubPageHeader**

将原有的 `<view class="header">` 开台标题替换为：

```vue
<SubPageHeader title="开台" @back="goBack" />
```

- [ ] **Step 3: 替换并台确认弹窗 → ContentModal**

```vue
<ContentModal :visible="showMergeConfirm" title="并台确认" @close="cancelMerge">
  <!-- 并台确认内容保持 -->
  <template #footer>
    <view class="merge-footer-actions">...</view>
  </template>
</ContentModal>
```

- [ ] **Step 4: 替换开台成功弹窗 → AlertModal（或 ContentModal 如果内容复杂）**

当前开台成功弹窗是自定义 success-modal-overlay，替换为：

```vue
<AlertModal
  :visible="showSuccess"
  icon="✅"
  title="开台成功"
  confirm-text="开始体验"
  @confirm="goHome"
/>
```

- [ ] **Step 5: 清理旧 CSS**

删除 `.success-modal-overlay`、`.success-modal-content`、`.merge-modal-overlay`、`.merge-modal-content`、`.header` CSS 块。

- [ ] **Step 6: 验证 + Commit**


### Task 10: 替换 bill.vue 头部

**Files:**
- Modify: `src/pages/bill/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import SubPageHeader from '@/components/standard/SubPageHeader.vue'
```

- [ ] **Step 2: 替换头部 → SubPageHeader**

将原有的两处 `<view class="header">` (lines 20, 26) 替换为一处：

```vue
<SubPageHeader title="账单" @back="goBack" />
```

- [ ] **Step 3: 清理旧 CSS**

删除 `.header` CSS 块。

- [ ] **Step 4: 验证 + Commit**


### Task 11: 替换 activity.vue 弹窗

**Files:**
- Modify: `src/pages/activity/index.vue`

- [ ] **Step 1: 添加 import**

```typescript
import ContentModal from '@/components/standard/ContentModal.vue'
```

- [ ] **Step 2: 替换活动详情弹窗 → ContentModal**

将 modal-overlay + modal-content 替换为 ContentModal，保留活动详情内容。

- [ ] **Step 3: 清理旧 CSS**

删除 `.modal-overlay`、`.modal-content` CSS 块。

- [ ] **Step 4: 验证 + Commit**


### Task 12: 全量回归验证

**Files:** 不修改，仅运行检查

- [ ] **Step 1: TypeScript 编译检查**

```bash
npx vue-tsc --noEmit 2>&1 | grep -c "error TS"
# Expected: 0
```

- [ ] **Step 2: 全量测试**

```bash
npx vitest run
# Expected: 8 passed, 133 passed
```

- [ ] **Step 3: 检查残留内联弹窗**

```bash
grep -rn "modal-overlay\|modal-card-lg\|modal-card-sm" src/pages/ --include="*.vue"
# Expected: no results (all migrated to standard components)
```

- [ ] **Step 4: 检查残留内联 header**

```bash
grep -rn "\.header {" src/pages/*/index.vue
# Expected: no results (all migrated to standard components)
```

- [ ] **Step 5: 提交**

```
git add -A
git commit -m "chore: final cleanup — verify all pages use standard modals and headers"
```
