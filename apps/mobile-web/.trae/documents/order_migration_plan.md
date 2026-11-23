# 接单中心功能迁移到首页计划

## 任务目标
将 `pages/index.vue` 首页中助教权限展示的内容（第158-209行）直接替换为 `pages/orders/index.vue` 的完整订单接单功能。

## 涉及文件
- `pages/orders/index.vue` - 接单中心页面（将被迁移）
- `pages/index/index.vue` - 首页（接收接单功能）
- `pages/orders/active.vue` - 进行中订单页面（保留不变）

## 实施步骤

### 1. 修改首页 `pages/index/index.vue`
将第158-209行的助教部分：
```vue
<view v-else-if="authStore.isAssistant" class="assistant-home">
  <!-- 当前简单的订单卡片和业绩摘要 -->
</view>
```

替换为完整的接单中心功能（来自 orders/index.vue）

### 2. 清空 orders/index.vue 页面
将订单页面内容清空，保留页面框架用于后续可能的跳转

### 3. 添加订单页面跳转处理
在首页的 goToOrders 函数中，如果需要跳转可以使用独立页面

## 迁移的完整功能包括

### 模板部分
- 页面标题栏（接单中心 + 刷新按钮）
- 空状态提示（无订单时）
- 订单列表展示
- 订单卡片（订单号、客户信息、桌台、服务类型、价格、下单时间）
- 操作按钮（拒绝/接单）

### 脚本部分
- `loadOrders()` - 加载订单列表
- `getStatusText()` - 状态文本映射
- `formatTime()` - 时间格式化
- `showOrderDetail()` - 显示订单详情
- `handleAccept()` - 接单处理
- `handleReject()` - 拒绝处理

### 样式部分
- 页面样式
- 标题栏样式
- 空状态样式
- 订单卡片样式
- 订单信息样式
- 操作按钮样式
- 加载状态样式

## 关键代码片段

### 需要替换的助教部分代码
```vue
<view v-else-if="authStore.isAssistant" class="assistant-home">
  <!-- 现有的简单订单卡片和业绩摘要 -->
</view>
```

### 替换为完整接单中心
```vue
<view v-else-if="authStore.isAssistant" class="orders-page">
  <!-- 完整的订单列表页面内容 -->
</view>
```

## 风险评估
- 风险等级：低
- 主要工作是代码迁移和样式复制
- 需要确保订单Store正确引用
