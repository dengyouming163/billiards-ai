# 员工管理模块全面修复 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复员工管理模块 4 个致命 Bug + 补齐核心功能字段 + 对齐项目设计规范，使移动端员工管理与 PC 后台数据一致、功能完整。

**Architecture:** 前后端联动修复 — 前端修正角色值/字段名/表单字段与后端 DB schema 对齐；后端补充移动端缺失的 API（如有需要）；UI 风格对齐项目统一设计语言。

**Tech Stack:** UniApp Vue3 + TypeScript (前端), ThinkPHP 8 + ThinkORM (后端)

---

## 文件变更总览

| 文件 | 操作 | 涉及 Task |
|------|------|----------|
| `src/types/index.ts` | 修改 | T1 |
| `src/api/modules/employee.ts` | 修改 | T1 |
| `src/pages/employee/list.vue` | 重写 | T2 |
| `src/pages/employee/detail.vue` | 重写 | T3 |
| `src/pages/employee/add.vue` | 重写 | T4 |
| `src/pages/employee/edit.vue` | 重写 | T5 |

---

### Task 1: 类型定义和 API 层修复

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\types\index.ts`
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\employee.ts`

#### Step 1.1: 修复 Employee 接口类型定义

在 `types/index.ts` 中找到现有的 `Employee` 接口（约 L234-L252），替换为：

```typescript
export interface Employee {
  id: string
  name: string
  phone: string
  gender?: number
  avatar?: string
  id_card?: string
  role: string
  position?: string
  salary?: number
  password?: string
  status: number
  hire_date?: string
  leave_date?: string
  description?: string
  store_id?: string
  created_at?: string
  updated_at?: string
}
```

删除不存在的字段：`email`, `address`, `join_time`。
新增 DB 中实际存在但前端缺失的字段：`gender`, `id_card`, `position`, `salary`, `hire_date`, `leave_date`, `description`。

#### Step 1.2: 修复 ROLE_MAP

在同一文件中找到 `ROLE_MAP`（约 L255-L262），替换为：

```typescript
const ROLE_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '老板', color: '#ef4444' },
  2: { label: '经理', color: '#f59e0b' },
  3: { label: '财务', color: '#8b5cf6' },
  4: { label: '教练', color: '#06b6d4' },
  5: { label: '收银员', color: '#10b981' },
  6: { label: '助教', color: '#059669' },
  7: { label: '服务员', color: '#6366f1' },
}
```

注意：后端合法角色值为 `boss=1, manager=2, finance=3, coach=4, cashier=5, assistant=6, waiter=7`（来自 EmployeeLogic.php 的 `$roleMap`）。

#### Step 1.3: 修复 roleOptions

找到 `roleOptions` 数组（如果存在于 types 或其他文件），确保选项与后端一致。如果没有独立定义而是在 add.vue/edit.vue 内联的，则在后续 Task 中统一处理。

#### Step 1.4: 确认 API 函数返回类型

读取 `api/modules/employee.ts` 全文，确认所有函数签名中的参数和返回类型与新 Employee 接口匹配。特别关注：
- `getEmployeeList()` 返回的是数组还是分页对象？
- `getEmployeeDetail(id)` 返回的字段是否包含新加的字段？

---

### Task 2: 重写员工列表页 list.vue

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\employee\list.vue`

#### Step 2.1: 替换 template

```vue
<template>
  <view class="page">
    <Header />

    <view class="page-header">
      <text class="page-title">员工管理</text>
      <view class="header-actions">
        <view class="add-btn" @click="goAdd">
          <text class="add-icon">+</text>
          <text>添加员工</text>
        </view>
      </view>
    </view>

    <scroll-view
      class="content-scroll"
      scroll-y
      enhanced
      show-scrollbar="false"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <StateView :loading="loading" :empty="list.length === 0 && !loading" :error="hasError" empty-msg="暂无员工" error-msg="加载失败" @retry="loadList">
        <view class="card-list">
          <view
            class="emp-card"
            v-for="item in list"
            :key="item.id"
            @click="goDetail(item.id)"
          >
            <view class="card-accent" :class="'accent-' + item.role" />
            <view class="card-body">
              <view class="card-top">
                <view class="avatar-wrap" :style="{ background: getRoleColor(item.role) }">
                  <text class="avatar-text">{{ (item.name || '?').charAt(0) }}</text>
                </view>
                <view class="name-role">
                  <text class="emp-name">{{ item.name }}</text>
                  <view class="role-badge" :style="{ background: getRoleBgColor(item.role), color: getRoleColor(item.role) }">
                    {{ getRoleLabel(item.role) }}
                  </view>
                </view>
                <view class="status-dot" :class="{ active: item.status === 1 }">
                  <text class="status-label">{{ item.status === 1 ? '在职' : '离职' }}</text>
                </view>
              </view>

              <view class="card-info">
                <view class="info-item">
                  <text class="info-icon">📱</text>
                  <text class="info-val">{{ item.phone || '-' }}</text>
                </view>
                <view class="info-item" v-if="item.position">
                  <text class="info-icon">💼</text>
                  <text class="info-val">{{ item.position }}</text>
                </view>
                <view class="info-item" v-if="item.hire_date">
                  <text class="info-icon">📅</text>
                  <text class="info-val">{{ formatDate(item.hire_date) }} 入职</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </StateView>
    </scroll-view>

    <TabBar />
  </view>
</template>
```

#### Step 2.2: 替换 script

```typescript
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getEmployeeList, deleteEmployee } from '@/api/modules/employee'
import type { Employee } from '@/types'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'

const list = ref<Employee[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)

onMounted(() => {
  loadList()
})

async function loadList() {
  loading.value = true
  hasError.value = false
  try {
    const res: any = await getEmployeeList({ page: 1, page_size: 100 })
    // 后端 getList() 直接返回数组（非分页包装）
    const data = Array.isArray(res) ? res : (res?.data?.list || res?.list || [])
    list.value = data
  } catch (e: any) {
    hasError.value = true
    console.error('加载员工列表失败', e)
  } finally {
    loading.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  await loadList()
  refreshing.value = false
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/employee/detail?id=${id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/employee/add' })
}

// 角色映射（与后端 EmployeeLogic::$roleMap 一致）
const ROLE_LABELS: Record<string, string> = {
  boss: '老板',
  manager: '经理',
  finance: '财务',
  coach: '教练',
  cashier: '收银员',
  assistant: '助教',
  waiter: '服务员',
}

const ROLE_COLORS: Record<string, string> = {
  boss: '#ef4444',
  manager: '#f59e0b',
  finance: '#8b5cf6',
  coach: '#06b6d4',
  cashier: '#10b981',
  assistant: '#059669',
  waiter: '#6366f1',
}

function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role || '-'
}

function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || '#9ca3af'
}

function getRoleBgColor(role: string): string {
  const c = getRoleColor(role)
  return c + '18'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return dateStr.split(' ')[0]
}
</script>
```

关键修复点：
- 数据解析兼容多种格式（`Array.isArray` 判断）
- 角色标签使用正确的中文映射（boss→老板, manager→经理 等）
- 使用 Header/TabBar/StateView 项目标准组件
- 卡片展示实际存在的字段（phone, position, hire_date）

#### Step 2.3: 替换 style

使用项目统一的 `$color-primary` / 大圆角 / TableCard 质感风格：

```scss
<style lang="scss" scoped>
@use '@/uni.scss' as *;

.page {
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  background: $color-bg-page;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
}

.page-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #09090b;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 14rpx 28rpx;
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  border-radius: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba($color-primary, 0.25);

  text {
    font-size: 26rpx;
    font-weight: 600;
    color: #fff;
  }
}

.add-icon {
  font-size: 32rpx;
  line-height: 1;
}

.content-scroll {
  flex: 1;
  padding: 20rpx 24rpx;
  overflow-x: hidden;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  width: 100%;
  box-sizing: border-box;
}

.emp-card {
  position: relative;
  border-radius: 28rpx;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  box-shadow:
    0 2rpx 8rpx rgba(0, 0, 0, 0.04),
    0 6rpx 20rpx rgba(0, 0, 0, 0.03);
  transition: transform 0.22s ease;

  &:active {
    transform: scale(0.97);
  }
}

.card-accent {
  height: 5rpx;
  width: 100%;

  &.accent-boss { background: linear-gradient(90deg, #ef4444, #fca5a5); }
  &.accent-manager { background: linear-gradient(90deg, #f59e0b, #fcd34d); }
  &.accent-finance { background: linear-gradient(90deg, #8b5cf6, #c4b5fd); }
  &.accent-coach { background: linear-gradient(90deg, #06b6d4, #67e8f9); }
  &.accent-cashier { background: linear-gradient(90deg, #10b981, #6ee7b7); }
  &.accent-assistant { background: linear-gradient(90deg, $color-primary, #34d399); }
  &.accent-waiter { background: linear-gradient(90deg, #6366f1, #a5b4fc); }

  &:not([class*='accent-']) { background: linear-gradient(90deg, #94a3b8, #cbd5e1); }
}

.card-body {
  padding: 24rpx;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 16rpx;
}

.avatar-wrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.name-role {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.emp-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #09090b;
}

.role-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.status-dot {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 14rpx;
  border-radius: 16rpx;
  background: #ecfdf5;

  &.active {
    background: #fef2f2;
  }
}

.status-label {
  font-size: 20rpx;
  font-weight: 500;
  color: $color-primary;

  .active & {
    color: #dc2626;
  }
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx 24rpx;
  padding-left: 108rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.info-icon {
  font-size: 22rpx;
}

.info-val {
  color: #374151;
  font-weight: 500;
}
</style>
```

---

### Task 3: 重写员工详情页 detail.vue

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\employee\detail.vue`

#### Step 3.1: 核心修复清单

1. **字段映射修正**：
   - `join_time` → `hire_date`（入职时间）
   - 删除 `email` / `address`（DB 不存在）
   - 新增显示：`gender`, `id_card`, `position`, `salary`, `description`

2. **角色显示**：使用正确的 ROLE_LABELS 映射（同 Task 2）

3. **删除按钮**：新增删除操作（调用 `deleteEmployee(id)` API）

4. **移除假数据**：`monthStats` 改为从 API 加载或直接隐藏

5. **StoreSelector**：确认组件是否存在，如不存在则移除引用或改为纯文本显示门店名称

6. **UI 升级**：对齐订单详情页的设计风格（大圆角卡片、分层阴影、渐变 Hero）

#### Step 3.2: template 结构概要

```
Header Bar (自定义导航栏)
├── Hero Card (头像 + 姓名 + 角色 + 状态)
├── Section Card: 基本信息 (手机号、性别、身份证、职位、薪资、入职日期)
├── Section Card: 其他信息 (描述/备注)
├── Action Buttons: 编辑 / 删除
```

#### Step 3.3: script 关键逻辑

- `loadDetail()` → 调用 `getEmployeeDetail(id)` 获取数据
- `goEdit()` → navigateTo edit 页面
- `handleDelete()` → uni.showModal 确认 → 调用 `deleteEmployee(id)` → 成功后 navigateBack
- 角色标签函数复用 Task 2 的映射

---

### Task 4: 重写添加员工页 add.vue

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\employee\add.vue`

#### Step 4.1: 核心修复

1. **角色选项修正**（最关键的 Bug）：
```typescript
// ❌ 错误（旧代码）
const roleOptions = [
  { value: 'admin', label: '管理员' },
  { value: 'manager', label: '店长' },
  ...
]

// ✅ 正确（与后端 EmployeeLogic::$roleMap 一致）
const roleOptions = [
  { value: 'boss', label: '老板' },
  { value: 'manager', label: '经理' },
  { value: 'finance', label: '财务' },
  { value: 'coach', label: '教练' },
  { value: 'cashier', label: '收银员' },
  { value: 'assistant', label: '助教' },
  { value: 'waiter', label: '服务员' },
]
```

2. **表单字段对齐 DB schema**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | text | ✅ | 姓名 |
| phone | number | ✅ | 手机号 |
| role | picker | ✅ | 角色（新选项） |
| gender | picker | 否 | 性别（新增） |
| id_card | text | 否 | 身份证号（新增） |
| position | text | 否 | 职位（新增） |
| salary | digit | 否 | 月薪（新增） |
| hire_date | date | 否 | 入职日期（新增） |
| description | textarea | 否 | 备注（新增） |

3. **删除不存在字段**：`email`, `address`

4. **提交数据格式**：确保 `submitData` 中的 key 与 `EmployeeLogic::create()` 期望的字段完全匹配

#### Step 4.2: UI 升级

- 表单项使用大圆角输入框（`border-radius: 20rpx`）
- 选择器使用 pill 样式
- 提交按钮使用品牌色渐变 + 发光阴影
- 整体风格对齐订单页面的现代感

---

### Task 5: 重写编辑员工页 edit.vue

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\employee\edit.vue`

#### Step 5.1: 与 add.vue 保持一致的修改

1. **角色选项**：同 Task 4 的正确映射
2. **表单字段**：同 Task 4 的完整字段集
3. **加载回显**：确保 `loadDetail()` 正确映射 `hire_date` → 日期选择器，`gender` → 性别选择器等
4. **提交更新**：调用 `updateEmployee(id, data)` 时字段名正确
5. **UI 风格**：与 add.vue 统一

---

## 自检清单

| 检查项 | 结果 |
|--------|------|
| B1 角色值不匹配 | ✅ Task 4+5 修复 roleOptions |
| B2 列表数据解析 | ✅ Task 2 兼容多种格式 |
| B3 字段名 join_time | ✅ Task 3 改为 hire_date |
| B4 不存在的 email/address | ✅ Task 3+4+5 移除 |
| F1 删除功能 | ✅ Task 3 新增删除按钮 |
| F2/F3 筛选 | ⏭️ 本次不做（后续迭代） |
| F4-F8 缺失字段 | ✅ Task 4+5 补齐 |
| U1 假统计数据 | ✅ Task 3 移除/改为真实加载 |
| U3 风格未对齐 | ✅ Task 2-5 全部重写样式 |
