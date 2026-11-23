# 助教端核心功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现助教端上下线状态管理、接单流程、我的订单页，组件化角色首页

**Architecture:** 后端新增 goOnline/goOffline/status 三个 API，Profile 返回增加 status 字段；前端重写 AssistantHome.vue（状态卡片 + 接单列表 + 15s 轮询），新建 assistant-orders 历史订单页，补充前端 API 层

**Tech Stack:** uni-app 3 (Vue 3.4 + Composition API) + PHP ThinkPHP 8 + MySQL

---

## 文件结构

```
wwwapi/
├── app/storeapi/controller/mobile/AssistantController.php  [修改] 新增 goOnline/goOffline/status
├── app/storeapi/controller/mobile/ProfileController.php    [修改] 返回 status 字段

wwwstoreapp/src/
├── api/modules/profile.ts                    [修改] 新增 goOnline/goOffline/getStatus
├── pages/index/AssistantHome.vue             [重写] 状态卡片 + 接单列表
├── pages/assistant-orders/index.vue          [新建] 我的订单历史页
└── pages.json                                [修改] 新增 assistant-orders 路由
```

---

### Task 1: 后端 — 新增 goOnline/goOffline/status API

**文件:** 修改 `d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\AssistantController.php`

- [ ] **Step 1: 重写 AssistantController.php**

将整个文件替换为以下内容：

```php
<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\common\model\merchant\Assistant;
use app\common\service\JsonService;

class AssistantController extends BaseStoreController
{
    /**
     * 助教上岗（开始接单）
     * POST /mobile.Assistant/goOnline
     */
    public function goOnline()
    {
        $assistant = Assistant::where('id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::fail('未找到助教信息');
        }

        $assistant->status = 1;
        $assistant->save();

        return JsonService::success('已上线，开始接单', ['status' => 1]);
    }

    /**
     * 助教下岗（停止接单，不影响进行中的服务）
     * POST /mobile.Assistant/goOffline
     */
    public function goOffline()
    {
        $assistant = Assistant::where('id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::fail('未找到助教信息');
        }

        $assistant->status = 0;
        $assistant->save();

        return JsonService::success('已下线，不再接收新订单', ['status' => 0]);
    }

    /**
     * 获取当前助教状态
     * GET /mobile.Assistant/status
     */
    public function status()
    {
        $assistant = Assistant::where('id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::success('success', ['status' => 0]);
        }

        return JsonService::success('success', ['status' => (int)$assistant->status]);
    }

    /**
     * 助教列表（仅在线助教 status=1 或服务中 status=2）
     */
    public function list()
    {
        $storeId = $this->request->get('store_id', $this->storeId);

        $assistants = Assistant::where('store_id', $storeId)
            ->whereIn('status', [1, 2])
            ->select();

        $result = [];
        foreach ($assistants as $assistant) {
            $result[] = [
                'id' => $assistant['id'],
                'name' => $assistant['name'],
                'phone' => $assistant['phone'],
                'level_id' => $assistant['level_id'],
                'status' => (int)$assistant['status'],
            ];
        }

        return JsonService::success('success', ['list' => $result]);
    }
}
```

- [ ] **Step 2: 修改 ProfileController 返回 status 字段**

在 `d:\wwwroot\wwwbilliards\www\wwwapi\app\storeapi\controller\mobile\ProfileController.php` 的 `index()` 方法中，找到返回数组，加入 `status` 字段。

读取 `ProfileController.php`，在 `getProfile` 返回的数组中添加：
```php
'status' => (int)(\app\common\model\merchant\Assistant::where('id', $this->employeeId)->value('status') ?? 0),
```

- [ ] **Step 3: Commit + Deploy**

```bash
git add wwwapi/
git commit -m "feat(assistant): add goOnline/goOffline/status API + profile status field"
git tag -a wwwapi/v1.4.15 -m "deploy: assistant status management API"
git push server wwwapi/v1.4.15
```

---

### Task 2: 前端 API 层 — 新增 goOnline/goOffline/getStatus

**文件:** 修改 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\profile.ts`

- [ ] **Step 1: 追加 API 函数**

在 `profile.ts` 末尾追加：

```typescript
/** 助教上线 */
export function goOnline(): Promise<{ status: number }> {
  return post('/mobile.Assistant/goOnline')
}

/** 助教下线（不接新单，不影响进行中服务） */
export function goOffline(): Promise<{ status: number }> {
  return post('/mobile.Assistant/goOffline')
}

/** 获取当前助教状态 */
export function getAssistantStatus(): Promise<{ status: number }> {
  return get('/mobile.Assistant/status')
}
```

- [ ] **Step 2: 更新 ProfileData 接口加入 status**

在 `ProfileData` 接口中添加：
```typescript
status: number  // 0=休息 1=空闲 2=服务中
```

- [ ] **Step 3: Commit**

```bash
git add wwwstoreapp/src/api/modules/profile.ts
git commit -m "feat(assistant): add goOnline/goOffline/getStatus API functions"
```

---

### Task 3: 重写 AssistantHome.vue — 状态卡片 + 接单列表

**文件:** 重写 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\index\AssistantHome.vue`

- [ ] **Step 1: 创建新的 AssistantHome.vue**

完整代码：

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

    <!-- 接单列表 -->
    <view class="order-section">
      <view class="section-header">
        <text class="section-title">接单列表</text>
        <text class="section-link" @click="goMyOrders">📋 我的订单</text>
      </view>

      <!-- 筛选Tab -->
      <scroll-view class="status-tabs" scroll-x>
        <view v-for="tab in statusTabs" :key="tab.key" class="tab-item"
          :class="{ active: activeTab === tab.key }" @click="switchTab(tab.key)">
          <text>{{ tab.label }}</text>
          <text v-if="tab.key === 'pending' && pendingCount" class="tab-badge">{{ pendingCount }}</text>
        </view>
      </scroll-view>

      <!-- 订单列表 -->
      <StateView :loading="loading" :empty="!loading && orders.length === 0" empty-msg="暂无订单"
        :error="hasError" error-msg="加载失败" @retry="loadOrders">
        <view v-for="order in orders" :key="order.id" class="order-card">
          <view class="oc-top">
            <view class="oc-info">
              <text class="oc-table">桌 {{ order.table_no || order.table_name }}</text>
              <text class="oc-no">#{{ order.order_no }}</text>
            </view>
            <view class="oc-status" :class="order.status">{{ order.status_name || statusText(order.status) }}</view>
          </view>
          <view class="oc-body">
            <view class="oc-row">
              <text class="oc-label">客户</text>
              <text class="oc-value">{{ order.student_name || '-' }}</text>
            </view>
            <view class="oc-row">
              <text class="oc-label">金额</text>
              <text class="oc-value price">¥{{ order.price || order.total_amount || order.amount || 0 }}</text>
            </view>
            <view class="oc-row" v-if="order.status === 'in_progress' && order.start_time">
              <text class="oc-label">计时</text>
              <text class="oc-value timer">⏱ {{ getElapsed(order.start_time) }}</text>
            </view>
          </view>
          <view class="oc-actions">
            <!-- 待确认：仅查看，无操作 -->
            <text v-if="order.status === 'pending'" class="oc-hint">等待收银确认</text>
            <!-- 已确认：开始服务 -->
            <button v-if="order.status === 'accepted'" class="btn-start" @click="handleStart(order)">开始服务</button>
            <!-- 服务中：结束服务 -->
            <button v-if="order.status === 'in_progress'" class="btn-end" @click="handleComplete(order)">结束服务</button>
            <!-- 已完成：查看详情 -->
            <text v-if="order.status === 'completed'" class="oc-done">✅ 已完成</text>
          </view>
        </view>
      </StateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getProfile, goOnline, goOffline, getAssistantStatus, type ProfileData } from '@/api/modules/profile'
import { getAssistantOrderList } from '@/api/modules/order'
import StateView from '@/components/StateView.vue'

const profile = ref<ProfileData>({ id: '', name: '', phone: '', role: '', store_name: '', join_time: '', avatar: '', nickname: '', signature: '', tags: [], album: [], services: [], today_income: 0, today_orders: 0, today_duration: 0, status: 0 })
const status = ref(0)
const loading = ref(false)
const hasError = ref(false)
const activeTab = ref('all')
const orders = ref<any[]>([])
const now = ref(Date.now())

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'accepted', label: '已确认' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

const statusClass = computed(() => status.value === 0 ? 'offline' : status.value === 1 ? 'online' : 'busy')
const statusLabel = computed(() => status.value === 0 ? '未上线' : status.value === 1 ? '在线接单中' : '服务中')
const todayIncome = computed(() => profile.value.today_income || 0)
const pendingCount = computed(() => orders.value.filter(o => o.status === 'pending').length)

function statusText(s: string): string {
  const map: Record<string, string> = { pending: '待确认', accepted: '已确认', in_progress: '服务中', completed: '已完成' }
  return map[s] || s
}

function getElapsed(startTime: string): string {
  if (!startTime) return ''
  const diff = Math.floor((Date.now() - new Date(startTime.replace('T', ' ')).getTime()) / 1000)
  const h = Math.floor(diff / 3600), m = Math.floor((diff % 3600) / 60), s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function initStatus() {
  try {
    const res = await getAssistantStatus()
    status.value = res.status ?? 0
  } catch { status.value = 0 }
}

async function loadProfile() {
  try {
    const data = await getProfile()
    profile.value = data
    status.value = data.status ?? status.value
  } catch { /* silent */ }
}

async function loadOrders() {
  loading.value = true
  hasError.value = false
  try {
    const params: any = { page_no: 1, page_size: 50 }
    if (activeTab.value !== 'all') params.status = activeTab.value
    const result = await getAssistantOrderList(params)
    orders.value = result.list || []
  } catch { hasError.value = true }
  finally { loading.value = false }
}

function switchTab(key: string) { activeTab.value = key; loadOrders() }

async function handleGoOnline() {
  try { await goOnline(); status.value = 1; uni.showToast({ title: '已上线', icon: 'success' }) }
  catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
}

async function handleGoOffline() {
  uni.showModal({
    title: '确认下线',
    content: '下线后不再接收新订单，但进行中的服务不受影响',
    success: async (res) => {
      if (!res.confirm) return
      try { await goOffline(); status.value = 0; uni.showToast({ title: '已下线', icon: 'success' }) }
      catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function handleStart(order: any) {
  uni.showModal({
    title: '开始服务', content: `确认开始为${order.student_name || ''}服务？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const { orderStore } = await import('@/stores/order')
        await orderStore.start(order.id)
        status.value = 2
        uni.showToast({ title: '服务已开始', icon: 'success' })
        loadOrders()
      } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

async function handleComplete(order: any) {
  uni.showModal({
    title: '结束服务', content: '确认结束当前服务？',
    success: async (res) => {
      if (!res.confirm) return
      try {
        const { orderStore } = await import('@/stores/order')
        await orderStore.complete(order.id)
        status.value = 1
        uni.showToast({ title: '服务已结束', icon: 'success' })
        loadOrders()
      } catch { uni.showToast({ title: '操作失败', icon: 'none' }) }
    }
  })
}

function goMyOrders() { uni.navigateTo({ url: '/pages/assistant-orders/index' }) }

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  initStatus()
  loadProfile()
  loadOrders()
  pollTimer = setInterval(loadOrders, 15000)
  tickTimer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})

defineExpose({ loadOrders })
</script>

<style lang="scss" scoped>
.assistant-home { padding: 24rpx; display: flex; flex-direction: column; gap: 24rpx; }
.page-content { padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx); }

/* 状态卡片 */
.status-card { border-radius: 24rpx; padding: 32rpx; color: #fff; }
.status-card.online { background: linear-gradient(135deg, #059669, #10b981); }
.status-card.offline { background: linear-gradient(135deg, #64748b, #94a3b8); }
.status-card.busy { background: linear-gradient(135deg, #2563eb, #3b82f6); }
.sc-top { display: flex; align-items: center; gap: 20rpx; margin-bottom: 24rpx; }
.sc-avatar { width: 96rpx; height: 96rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,.4); }
.sc-avatar-placeholder { width: 96rpx; height: 96rpx; border-radius: 50%; background: rgba(255,255,255,.2); display: flex; align-items: center; justify-content: center; font-size: 48rpx; }
.sc-name { font-size: 36rpx; font-weight: 700; }
.sc-income { font-size: 26rpx; opacity: .8; }
.sc-status-badge { margin-left: auto; padding: 8rpx 20rpx; border-radius: 20rpx; background: rgba(255,255,255,.25); font-size: 24rpx; font-weight: 600; }
.sc-action { text-align: center; }
.btn-online { width: 80%; padding: 22rpx; background: #fff; color: #059669; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
.btn-offline { width: 80%; padding: 22rpx; background: rgba(255,255,255,.2); color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 600; border: 1rpx solid rgba(255,255,255,.4); }
.btn-busy { width: 80%; padding: 22rpx; background: rgba(255,255,255,.1); color: rgba(255,255,255,.6); border-radius: 16rpx; font-size: 28rpx; font-weight: 600; border: none; }

/* 接单列表 */
.order-section { background: #fff; border-radius: 24rpx; padding: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1f2937; }
.section-link { font-size: 26rpx; color: #059669; font-weight: 500; }
.status-tabs { display: flex; white-space: nowrap; margin-bottom: 20rpx; }
.tab-item { padding: 14rpx 28rpx; font-size: 26rpx; color: #6b7280; background: #f3f4f6; border-radius: 20rpx; margin-right: 12rpx; display: flex; align-items: center; gap: 6rpx; }
.tab-item.active { background: #059669; color: #fff; }
.tab-badge { background: #ef4444; color: #fff; font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 10rpx; }

/* 订单卡片 */
.order-card { background: #f9fafb; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.oc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.oc-info { display: flex; align-items: center; gap: 12rpx; }
.oc-table { font-size: 28rpx; font-weight: 700; color: #1f2937; }
.oc-no { font-size: 24rpx; color: #9ca3af; }
.oc-status { font-size: 22rpx; font-weight: 600; padding: 6rpx 16rpx; border-radius: 12rpx; }
.oc-status.pending { background: #fef3c7; color: #d97706; }
.oc-status.accepted, .oc-status.in_progress { background: #dbeafe; color: #2563eb; }
.oc-status.completed { background: #d1fae5; color: #059669; }
.oc-body { margin-bottom: 16rpx; }
.oc-row { display: flex; justify-content: space-between; padding: 8rpx 0; }
.oc-label { font-size: 26rpx; color: #9ca3af; }
.oc-value { font-size: 26rpx; color: #374151; font-weight: 500; }
.oc-value.price { color: #059669; font-weight: 700; font-size: 30rpx; }
.oc-value.timer { color: #2563eb; font-weight: 600; }
.oc-actions { text-align: right; }
.oc-hint { font-size: 24rpx; color: #9ca3af; }
.oc-done { font-size: 24rpx; color: #059669; }
.btn-start { padding: 14rpx 40rpx; background: #059669; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
.btn-end { padding: 14rpx 40rpx; background: #f59e0b; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add wwwstoreapp/src/pages/index/AssistantHome.vue
git commit -m "feat(assistant): rewrite AssistantHome with status card + order list + 15s polling"
```

---

### Task 4: 新建我的订单页

**文件:** 新建 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\assistant-orders\index.vue`

- [ ] **Step 1: 创建 assistant-orders/index.vue**

```vue
<template>
  <view class="page">
    <view class="stats-row">
      <view class="stat-item"><text class="stat-val">{{ stats.total_orders || 0 }}</text><text class="stat-lbl">总订单</text></view>
      <view class="stat-item"><text class="stat-val">{{ stats.total_hours || 0 }}h</text><text class="stat-lbl">总时长</text></view>
      <view class="stat-item"><text class="stat-val">¥{{ stats.total_revenue || 0 }}</text><text class="stat-lbl">总收入</text></view>
    </view>

    <view class="list-section">
      <StateView :loading="loading" :empty="list.length === 0 && !loading" empty-msg="暂无服务记录" :error="hasError" error-msg="加载失败" @retry="loadRecords">
        <view v-for="item in list" :key="item.id" class="record-card">
          <view class="rc-head">
            <text class="rc-no">#{{ item.order_no }}</text>
            <text class="rc-date">{{ item.start_time || item.created_at }}</text>
          </view>
          <view class="rc-body">
            <view class="rc-row"><text>桌台</text><text>{{ item.table_no || '-' }}</text></view>
            <view class="rc-row"><text>时长</text><text>{{ item.duration_minutes ? Math.floor(item.duration_minutes / 60) + 'h' + (item.duration_minutes % 60) + 'm' : '-' }}</text></view>
            <view class="rc-row"><text>助教费</text><text class="emerald">¥{{ item.assistant_fee || item.total_fee || 0 }}</text></view>
            <view class="rc-row"><text>商品+台费</text><text>¥{{ (item.table_fee || 0) + (item.product_fee || 0) }}</text></view>
            <view class="rc-row total"><text>总金额</text><text class="emerald fw">¥{{ item.total_fee || item.final_amount || 0 }}</text></view>
          </view>
        </view>
      </StateView>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssistantRecords, getAssistantStats } from '@/api/modules/order'
import StateView from '@/components/StateView.vue'

const list = ref<any[]>([])
const stats = ref({ total_orders: 0, total_hours: 0, total_revenue: 0 })
const loading = ref(false)
const hasError = ref(false)

async function loadStats() {
  try {
    const res = await getAssistantStats()
    stats.value = { total_orders: res.total_orders || 0, total_hours: res.total_hours || 0, total_revenue: res.total_revenue || 0 }
  } catch { /* silent */ }
}

async function loadRecords() {
  loading.value = true
  hasError.value = false
  try {
    const res = await getAssistantRecords({ page_no: 1, page_size: 50 })
    list.value = (res as any).list || (res as any).data || []
  } catch { hasError.value = true }
  finally { loading.value = false }
}

onMounted(() => { loadStats(); loadRecords() })
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #fafafa; padding: 24rpx; }
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; margin-bottom: 24rpx; }
.stat-item { background: #fff; border-radius: 16rpx; padding: 28rpx 16rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.stat-val { display: block; font-size: 36rpx; font-weight: 700; color: #059669; margin-bottom: 8rpx; }
.stat-lbl { font-size: 24rpx; color: #9ca3af; }
.list-section { }
.record-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.rc-head { display: flex; justify-content: space-between; margin-bottom: 16rpx; padding-bottom: 12rpx; border-bottom: 1rpx solid #f3f4f6; }
.rc-no { font-size: 28rpx; font-weight: 600; color: #1f2937; }
.rc-date { font-size: 24rpx; color: #9ca3af; }
.rc-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #6b7280; }
.rc-row.total { border-top: 1rpx solid #f3f4f6; margin-top: 8rpx; padding-top: 14rpx; }
.emerald { color: #059669; }
.fw { font-weight: 700; font-size: 30rpx; }
</style>
```

- [ ] **Step 2: 添加路由**

在 `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages.json` 中添加：
```json
{
  "path": "pages/assistant-orders/index",
  "style": { "navigationBarTitleText": "我的订单" }
}
```

- [ ] **Step 3: Commit**

```bash
git add wwwstoreapp/src/pages/assistant-orders/index.vue wwwstoreapp/src/pages.json
git commit -m "feat(assistant): add my orders page with stats + history list"
```

---

### Task 5: 自检验证

- [ ] **Step 1: 构建检查**

```bash
cd wwwstoreapp && pnpm build:h5
```
确认无编译错误。

- [ ] **Step 2: 验证流程**

1. 助教登录 → 首页显示「未上线」状态卡片 + [上线接单] 按钮
2. 点击上线 → 状态变为「在线接单中」+ [下线休息] 按钮
3. 下线时有确认弹窗
4. 接单列表 15s 刷新，Tab 切换正常
5. 待确认订单仅查看无操作
6. 已确认订单可开始服务
7. 服务中显示实时计时 + 可结束服务
8. 我的订单页统计卡片 + 历史列表

---

## 验证清单

1. `pnpm build:h5` 构建成功
2. 上线/下线 API 返回正确的 status
3. profile 接口返回 status 字段
4. 助教首页状态卡片交互正确
5. 接单列表轮询 + Tab 筛选正常
6. 状态流转：休息→上线→空闲→开始→服务中→结束→空闲→下线→休息
7. 我的订单页数据正确
