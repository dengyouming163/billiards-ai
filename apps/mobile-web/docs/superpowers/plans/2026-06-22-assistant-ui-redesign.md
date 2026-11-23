# 助教接单页 UI 重设计实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AssistantHome.vue 的 template + style 替换为风格A（极简渐变），script 逻辑保持不变

**Architecture:** 单文件重写，仅替换 `<template>` 和 `<style scoped>` 块。配色：翠绿渐变主色调，白底卡片，灰底 Tab，状态徽标黄/蓝/绿色

**Tech Stack:** uni-app 3 (Vue 3.4 Composition API) + SCSS

---

### Task 1: 重写 AssistantHome.vue 的 template + style

**文件:** 修改 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\index\AssistantHome.vue`

**关键约束:** 只替换 `<template>` 和 `<style scoped>` 块，**`<script setup>` 块完全不动**。

- [ ] **Step 1: 读取当前文件确认 script 块边界**

读取 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\index\AssistantHome.vue`，找到 `<script setup>` 的起止行号。确保只替换它之前和之后的内容。

- [ ] **Step 2: 替换整个 `<template>` 块为风格A模板**

```vue
<template>
  <view class="assistant-home page-content">
    <!-- 状态卡片 -->
    <view class="status-card" :class="statusClass">
      <view class="sc-top">
        <image v-if="profile.avatar" :src="profile.avatar" class="sc-avatar" mode="aspectFill" />
        <view v-else class="sc-avatar-placeholder">👤</view>
        <view class="sc-info">
          <text class="sc-name">{{ profile.name || '助教' }}</text>
          <text class="sc-income">今日收入 ¥{{ todayIncome }}</text>
        </view>
        <view class="sc-status-badge">{{ statusLabel }}</view>
      </view>
      <view class="sc-action">
        <button v-if="status === 0" class="btn-online" @click="handleGoOnline">上线接单</button>
        <button v-else-if="status === 1" class="btn-offline" @click="handleGoOffline">下线休息</button>
        <button v-else class="btn-busy" disabled>服务中，暂不可下线</button>
      </view>
    </view>

    <!-- 接单标题栏 -->
    <view class="section-bar">
      <text class="section-title">接单列表</text>
      <text class="section-link" @click="goMyOrders">📋 我的订单</text>
    </view>

    <!-- 筛选Tab -->
    <scroll-view class="status-tabs" scroll-x :show-scrollbar="false">
      <view v-for="tab in statusTabs" :key="tab.key" class="tab-item"
        :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
        <text>{{ tab.label }}</text>
      </view>
    </scroll-view>

    <!-- 订单列表 -->
    <StateView :loading="loading" :empty="!loading && orders.length === 0" empty-msg="暂无订单"
      :error="hasError" error-msg="加载失败" @retry="loadOrders">
      <view v-for="order in orders" :key="order.id" class="order-card">
        <!-- 卡片头部 -->
        <view class="oc-head">
          <view class="oc-head-left">
            <text class="oc-table">桌 {{ order.table_no || order.table_name }}</text>
            <text class="oc-no">#{{ order.order_no }}</text>
          </view>
          <view class="oc-status" :class="'st-'+order.status">{{ order.status_name || statusText(order.status) }}</view>
        </view>

        <!-- 卡片内容 -->
        <view class="oc-body">
          <view class="oc-row">
            <text class="oc-label">客户</text>
            <text class="oc-value">{{ order.student_name || '-' }}</text>
          </view>
          <view class="oc-row">
            <text class="oc-label">金额</text>
            <text class="oc-price">¥{{ order.price || order.total_amount || order.amount || 0 }}</text>
          </view>
          <view class="oc-row" v-if="order.status === 'in_progress' && order.start_time">
            <text class="oc-label">计时</text>
            <text class="oc-timer">⏱ {{ getElapsed(order.start_time) }}</text>
          </view>
        </view>

        <!-- 操作区 -->
        <view class="oc-foot">
          <text v-if="order.status === 'pending'" class="oc-hint">等待收银确认</text>
          <button v-if="order.status === 'accepted'" class="btn-start" @click="handleStart(order)">开始服务</button>
          <button v-if="order.status === 'in_progress'" class="btn-end" @click="handleComplete(order)">结束服务</button>
          <text v-if="order.status === 'completed'" class="oc-done">✅ 已完成</text>
        </view>
      </view>
    </StateView>
  </view>
</template>
```

- [ ] **Step 3: 替换整个 `<style scoped>` 块**

```scss
<style lang="scss" scoped>
.assistant-home { padding: 24rpx; display: flex; flex-direction: column; gap: 16rpx; }
.page-content { padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx); }

/* === 状态卡片 === */
.status-card { border-radius: 20rpx; padding: 32rpx; color: #fff; }
.status-card.online { background: linear-gradient(135deg, #059669, #10b981); }
.status-card.offline { background: linear-gradient(135deg, #64748b, #94a3b8); }
.status-card.busy { background: linear-gradient(135deg, #2563eb, #3b82f6); }

.sc-top { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.sc-avatar { width: 88rpx; height: 88rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,.35); }
.sc-avatar-placeholder {
  width: 88rpx; height: 88rpx; border-radius: 50%;
  background: rgba(255,255,255,.18); display: flex; align-items: center; justify-content: center; font-size: 44rpx;
}
.sc-info { flex: 1; }
.sc-name { display: block; font-size: 34rpx; font-weight: 700; }
.sc-income { display: block; font-size: 24rpx; opacity: .8; margin-top: 4rpx; }
.sc-status-badge { padding: 6rpx 18rpx; border-radius: 16rpx; background: rgba(255,255,255,.22); font-size: 22rpx; font-weight: 600; }

.sc-action { text-align: center; }
.btn-online {
  width: 80%; padding: 20rpx; background: #fff; color: #059669; border-radius: 14rpx; font-size: 28rpx; font-weight: 700; border: none;
}
.btn-offline {
  width: 80%; padding: 20rpx; background: rgba(255,255,255,.15); color: #fff; border-radius: 14rpx; font-size: 28rpx; font-weight: 600;
  border: 1.5px solid rgba(255,255,255,.35);
}
.btn-busy {
  width: 80%; padding: 20rpx; background: rgba(255,255,255,.08); color: rgba(255,255,255,.5); border-radius: 14rpx;
  font-size: 28rpx; font-weight: 600; border: none;
}

/* === 标题栏 === */
.section-bar { display: flex; justify-content: space-between; align-items: center; padding: 8rpx 0; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1f2937; }
.section-link { font-size: 24rpx; color: #059669; font-weight: 500; }

/* === Tab === */
.status-tabs { display: flex; white-space: nowrap; padding: 4rpx 0; }
.tab-item {
  padding: 12rpx 26rpx; font-size: 24rpx; font-weight: 500; color: #6b7280;
  background: #f3f4f6; border-radius: 20rpx; margin-right: 10rpx; flex-shrink: 0; transition: all 0.2s;
}
.tab-item.active { background: #059669; color: #fff; font-weight: 600; }

/* === 订单卡片 === */
.order-card { background: #fff; border-radius: 16rpx; padding: 22rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); }
.oc-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.oc-head-left { display: flex; align-items: center; gap: 10rpx; }
.oc-table { font-size: 28rpx; font-weight: 700; color: #1f2937; }
.oc-no { font-size: 22rpx; color: #9ca3af; }
.oc-status { font-size: 20rpx; font-weight: 600; padding: 5rpx 14rpx; border-radius: 10rpx; }
.st-pending { background: #fef3c7; color: #d97706; }
.st-accepted, .st-in_progress { background: #dbeafe; color: #2563eb; }
.st-completed { background: #d1fae5; color: #059669; }

.oc-body { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 14rpx; }
.oc-row { display: flex; justify-content: space-between; align-items: center; font-size: 26rpx; }
.oc-label { color: #9ca3af; }
.oc-value { color: #374151; font-weight: 500; }
.oc-price { color: #059669; font-weight: 700; font-size: 30rpx; }
.oc-timer { color: #2563eb; font-weight: 600; font-size: 26rpx; font-variant-numeric: tabular-nums; }

.oc-foot { text-align: right; padding-top: 8rpx; border-top: 1rpx solid #f3f4f6; }
.oc-hint { font-size: 22rpx; color: #9ca3af; }
.oc-done { font-size: 22rpx; color: #059669; }
.btn-start { padding: 12rpx 36rpx; background: #059669; color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
.btn-end { padding: 12rpx 36rpx; background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
</style>
```

- [ ] **Step 4: 确认 `<script setup>` 块未被修改**

验证 `import`、`const`、`function`、`onMounted`、`onUnmounted`、`defineExpose` 全部保持原样。

- [ ] **Step 5: Commit**

```bash
git add wwwstoreapp/src/pages/index/AssistantHome.vue
git commit -m "style(assistant): redesign AssistantHome UI — Style A minimalist gradient"
```
