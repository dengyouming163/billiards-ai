# AssistantHome 助教角色首页重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构助教角色首页，采用大组件、大圆角布局，提高信息密度，保持项目统一风格，不改动功能逻辑

**Architecture:** 将原有松散的 hero-card + 列表结构重构为综合顶部大卡片（融合头像、状态、收入、统计）+ 订单流布局，移除无效描述文字，优化卡片间距和内边距，加大操作按钮尺寸

**Tech Stack:** UniApp, Vue3, TypeScript, SCSS

---

## 文件结构

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/pages/index/AssistantHome.vue` | 修改 | 重构模板结构和样式，保持 script 逻辑不变 |

---

## 任务分解

### Task 1: 重构模板结构 - 综合顶部大卡片

**Files:**
- Modify: `src/pages/index/AssistantHome.vue`

- [ ] **Step 1: 替换模板结构**

将原有的 `hero-card` 替换为综合大卡片，包含：
- 用户头像和基本信息
- 今日收入
- 统计数据（接单量、服务时长）
- 在线状态和开关按钮

```vue
<template>
  <view class="assistant-home page-content">
    <view class="hero-card">
      <view class="hero-user">
        <view class="hero-avatar">{{ (profile.name || '助')[0] }}</view>
        <view class="hero-info">
          <text class="hero-name">{{ profile.name || '助教' }}</text>
          <text class="hero-store">{{ profile.store_name || '-' }}</text>
        </view>
        <view class="hero-income-wrap">
          <text class="hero-income-label">今日收入</text>
          <text class="hero-income">¥{{ todayIncome }}</text>
        </view>
      </view>

      <view class="hero-stats">
        <view class="hero-stat-card">
          <text class="hero-stat-icon">📋</text>
          <text class="hero-stat-value">{{ profile.today_orders || 0 }}</text>
          <text class="hero-stat-label">接单量</text>
        </view>
        <view class="hero-stat-card">
          <text class="hero-stat-icon">⏱</text>
          <text class="hero-stat-value">{{ formatDuration(profile.today_duration || 0) }}</text>
          <text class="hero-stat-label">服务时长</text>
        </view>
      </view>

      <view class="hero-status-bar">
        <view class="hero-status-left">
          <view class="hero-status-dot" :class="status === 1 || status === 2 ? 'active' : ''"></view>
          <text class="hero-status-text">{{ statusLabel }}</text>
        </view>
        <view class="hero-status-right">
          <view v-if="status === 0" class="hero-switch-btn on" @click="handleGoOnline">上线接单</view>
          <view v-else-if="status === 1" class="hero-switch-btn off" @click="handleGoOffline">停止接单</view>
          <view v-else class="hero-switch-btn busy">服务中</view>
        </view>
      </view>
    </view>

    <view class="section-bar">
      <text class="section-title">接单列表</text>
      <text class="section-link" @click="goMyOrders">📋 我的订单</text>
    </view>

    <scroll-view class="status-tabs" scroll-x :show-scrollbar="false">
      <view class="tabs-inner">
        <view v-for="tab in statusTabs" :key="tab.key" class="tab-item"
          :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <text>{{ tab.label }}{{ tab.key === 'all' ? ' ' + orders.length : '' }}</text>
        </view>
      </view>
    </scroll-view>

    <StateView :loading="loading" :empty="!loading && orders.length === 0" empty-msg="暂无订单"
      :error="hasError" error-msg="加载失败" @retry="loadOrders">
      <view v-for="order in orders" :key="order.id" class="order-card">
        <view class="oc-head">
          <view class="oc-head-left">
            <text class="oc-table">桌 {{ order.table_no || order.table_name }}</text>
            <text class="oc-no">#{{ order.order_no }}</text>
          </view>
          <view class="oc-status" :class="'st-'+order.status">{{ order.status_name || statusText(order.status) }}</view>
        </view>

        <view class="oc-body">
          <view class="oc-grid">
            <view class="oc-grid-item">
              <text class="oc-grid-label">客户</text>
              <text class="oc-grid-value">{{ order.student_name || '-' }}</text>
            </view>
            <view class="oc-grid-item">
              <text class="oc-grid-label">金额</text>
              <text class="oc-grid-price">¥{{ order.price || order.total_amount || order.amount || 0 }}</text>
            </view>
            <view class="oc-grid-item" v-if="order.status === 'in_progress' && order.start_time">
              <text class="oc-grid-label">计时</text>
              <text class="oc-grid-timer">{{ getElapsed(order.start_time) }}</text>
            </view>
          </view>
        </view>

        <view class="oc-foot">
          <text v-if="order.status === 'pending'" class="oc-hint">等待收银确认</text>
          <button v-if="order.status === 'accepted'" class="btn-action btn-start" @click="handleStart(order)">开始服务</button>
          <button v-if="order.status === 'in_progress'" class="btn-action btn-end" @click="handleComplete(order)">结束服务</button>
          <text v-if="order.status === 'completed'" class="oc-done">已完成</text>
        </view>
      </view>
    </StateView>
  </view>
</template>
```

- [ ] **Step 2: 添加 formatDuration 辅助函数**

在 script 中添加：

```typescript
function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0分钟'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}
```

- [ ] **Step 3: 验证模板语法正确**

运行：`npx uni build`
预期：无编译错误

---

### Task 2: 重构样式 - 综合顶部大卡片

**Files:**
- Modify: `src/pages/index/AssistantHome.vue`

- [ ] **Step 1: 替换 hero-card 样式**

```scss
.hero-card {
  margin-top: 12rpx;
  padding: 36rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  box-shadow: 0 16rpx 48rpx rgba(5, 150, 105, 0.25);
}

.hero-user {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding-bottom: 28rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.15);
}

.hero-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #fff;
  font-weight: 700;
}

.hero-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.hero-name {
  font-size: 34rpx;
  font-weight: 700;
  color: #fff;
}

.hero-store {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-income-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.hero-income-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.6);
}

.hero-income {
  font-size: 44rpx;
  font-weight: 800;
  color: #fff;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.15);
}

.hero-stat-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.hero-stat-icon {
  font-size: 36rpx;
}

.hero-stat-value {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
}

.hero-stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

.hero-status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24rpx;
}

.hero-status-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.hero-status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.hero-status-dot.active {
  background: #fff;
  box-shadow: 0 0 12rpx rgba(255, 255, 255, 0.6);
}

.hero-status-text {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.hero-status-right {
  flex-shrink: 0;
}

.hero-switch-btn {
  padding: 18rpx 40rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.hero-switch-btn.on {
  background: #fff;
  color: #059669;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
}

.hero-switch-btn.off {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
}

.hero-switch-btn.busy {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.6);
}
```

- [ ] **Step 2: 更新订单卡片样式**

```scss
.order-card {
  background: #fff;
  border-radius: 36rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
}

.oc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.oc-head-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.oc-table {
  font-size: 32rpx;
  font-weight: 700;
  color: #1f2937;
}

.oc-no {
  font-size: 24rpx;
  color: #9ca3af;
}

.oc-status {
  font-size: 24rpx;
  font-weight: 600;
  padding: 10rpx 22rpx;
  border-radius: 24rpx;
}

.st-pending { background: rgba(255, 149, 0, 0.1); color: #e67c00; }
.st-accepted, .st-in_progress { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
.st-completed { background: rgba(52, 199, 89, 0.1); color: #22c55e; }

.oc-body {
  margin-bottom: 20rpx;
}

.oc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.oc-grid-item {
  background: #f8fafc;
  border-radius: 16rpx;
  padding: 20rpx;
}

.oc-grid-label {
  font-size: 22rpx;
  color: #9ca3af;
  display: block;
  margin-bottom: 8rpx;
}

.oc-grid-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #374151;
}

.oc-grid-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #059669;
}

.oc-grid-timer {
  font-size: 28rpx;
  font-weight: 600;
  color: #3b82f6;
  font-variant-numeric: tabular-nums;
}

.oc-foot {
  text-align: center;
  padding-top: 16rpx;
}

.oc-hint {
  font-size: 26rpx;
  color: #9ca3af;
}

.oc-done {
  font-size: 26rpx;
  color: #059669;
  font-weight: 600;
}

.btn-action {
  height: 88rpx;
  padding: 0 64rpx;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;
  transition: transform 0.15s ease;
}

.btn-action:active {
  transform: scale(0.97);
}

.btn-start {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(5, 150, 105, 0.25);
}

.btn-end {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  box-shadow: 0 8rpx 20rpx rgba(245, 158, 11, 0.25);
}
```

- [ ] **Step 3: 更新页面基础样式**

```scss
.assistant-home {
  min-height: 100vh;
  padding: 30rpx 24rpx 0;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.page-content {
  padding-bottom: calc(env(safe-area-inset-bottom) + 132rpx);
}

.section-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rpx 4rpx 0;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1f2937;
}

.section-link {
  font-size: 26rpx;
  color: #059669;
  font-weight: 700;
}

.status-tabs {
  width: 100%;
  white-space: nowrap;
  padding: 4rpx 0;
}

.tabs-inner {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  min-width: 100%;
}

.assistant-home :deep(.state-content) {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tab-item {
  padding: 16rpx 34rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  background: #fff;
  border-radius: 36rpx;
  flex-shrink: 0;
  transition: all 0.2s;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.tab-item.active {
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 8rpx 18rpx rgba(5, 150, 105, 0.22);
}

.oc-foot button::after {
  border: none;
}
```

- [ ] **Step 4: 验证样式编译正确**

运行：`npx uni build`
预期：无编译错误

---

### Task 3: 验证功能逻辑完整性

**Files:**
- Verify: `src/pages/index/AssistantHome.vue`

- [ ] **Step 1: 检查所有功能函数是否完整**

确认以下函数都存在且逻辑不变：
- `handleGoOnline()` - 上线
- `handleGoOffline()` - 下线  
- `handleStart(order)` - 开始服务
- `handleComplete(order)` - 结束服务
- `loadOrders()` - 加载订单
- `switchTab(key)` - 切换 Tab
- `goMyOrders()` - 跳转订单列表
- `statusText(s)` - 状态文字转换
- `getElapsed(startTime)` - 计算时长
- `initStatus()` - 初始化状态
- `loadProfile()` - 加载用户信息

- [ ] **Step 2: 检查响应式数据是否完整**

确认以下数据都存在：
- `profile` - 用户信息
- `status` - 在线状态
- `loading` - 加载状态
- `hasError` - 错误状态
- `activeTab` - 当前 Tab
- `orders` - 订单列表
- `now` - 当前时间（用于计时）

- [ ] **Step 3: 检查生命周期钩子**

确认 `onMounted` 和 `onUnmounted` 中：
- 初始化数据加载
- 轮询定时器设置和清理
- 计时定时器设置和清理

---

### Task 4: 构建验证

**Files:**
- Build: `src/pages/index/AssistantHome.vue`

- [ ] **Step 1: 执行构建**

运行：`npx uni build`
预期：构建成功，无错误

- [ ] **Step 2: 启动开发服务器预览**

运行：`npx uni dev`
预期：开发服务器正常启动，页面可访问

---

## 自审查

**1. Spec 覆盖:**
- ✅ 综合顶部大卡片（渐变背景，大圆角）
- ✅ 用户头像和基本信息
- ✅ 今日收入展示
- ✅ 统计数据（接单量、服务时长）
- ✅ 在线状态和开关按钮
- ✅ 订单卡片网格布局
- ✅ 操作按钮加大尺寸
- ✅ 状态标签颜色区分
- ✅ 服务计时等宽字体
- ✅ 移除无效描述文字
- ✅ 功能逻辑保持不变

**2. 占位符扫描:**
- ✅ 无 TBD、TODO
- ✅ 无 "类似 Task N"
- ✅ 无未定义的类型或函数

**3. 类型一致性:**
- ✅ profile 数据字段一致
- ✅ order 数据字段一致
- ✅ 函数命名一致