# wwwstoreapp 生产级质量优化 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwstoreapp 商家管理APP从"初步可用"提升到"生产级商用水准"，覆盖全平台（Android/iOS/H5/微信小程序）。

**Architecture:** 分层渐进式优化 — L1 基础稳固（类型+错误处理）→ L2 交互完整（四态+刷新）→ L3 功能闭环（端到端验证）→ L4 体验打磨（图标+动画+多端+性能）。

**Tech Stack:** UniApp 3.x + Vue 3 + TypeScript + SCSS + Pinia-like reactive stores

---

## 文件结构映射

```
src/
├── api/
│   ├── request.ts          # HTTP核心（重构目标）
│   ├── error-handler.ts    # 新增：统一错误处理
│   ├── index.ts            # 聚合导出
│   └── modules/            # 13个API模块（类型标注目标）
├── components/             # 13个共享组件 + 新增3个
├── composables/
│   └── usePermission.ts    # 权限组合式函数
├── config/
│   ├── env.ts              # 环境配置
│   └── index.ts
├── constants/
│   ├── permissions.ts      # 权限+菜单配置
│   └── icons.ts            # 新增：图标映射表
├── stores/
│   ├── auth.ts             # 认证Store（229行）
│   ├── notification.ts     # 通知Store（53行）
│   ├── order.ts            # 订单Store（242行，非reactive）
│   ├── store.ts            # 门店Store（121行，非reactive）
│   └── index.ts            # 聚合导出
├── types/
│   ├── index.ts            # 类型定义（227行）
│   └── request.ts          # 新增：请求/响应类型
├── utils/
│   ├── cache.ts            # 内存缓存
│   ├── icons.ts            # SVG图标常量
│   ├── validator.ts        # 表单验证
│   └── platform.ts         # 新增：平台检测
├── pages/                  # 50个Vue页面文件
│   ├── index/              # 首页模块（4个文件）
│   ├── login/              # 登录（1个）
│   ├── table/              # 台桌管理（17个文件，最复杂）
│   ├── orders/             # 订单（2个）
│   ├── approval/           # 审批（6个）
│   ├── employee/           # 员工（4个）
│   ├── profile/            # 个人中心（6个）
│   ├── checkin/            # 打卡（2个）
│   ├── schedule/           # 排班（1个）
│   ├── performance/        # 业绩（1个）
│   ├── notification/       # 通知（2个）
│   ├── settings/           # 设置（2个）
│   ├── work/               # 工作台（1个）
│   └── legal/              # 法律页面（2个）
├── App.vue                 # 应用入口（40行）
└── pages.json              # 页面配置（34页）
```

---

## L1 基础稳固层

### Task 1.1: 新增请求/响应类型定义

**Files:**
- Create: `src/types/request.ts`
- Modify: `src/api/request.ts:4-9`

- [ ] **Step 1: 创建 `src/types/request.ts`**

```typescript
import type { ApiResponse, PaginatedData } from './index'

export interface RequestOptions<T = Record<string, unknown>> {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: T
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
}

export interface ApiResult<T = unknown> {
  code: number
  show: number
  msg: string
  data: T
}

export type { ApiResponse, PaginatedData }
```

- [ ] **Step 2: 修改 `src/api/request.ts`，移除重复的 ApiResponse，改为从 types 导入**

在 `src/api/request.ts` 中：
- 删除第 4-9 行的 `ApiResponse` 接口定义
- 在文件顶部 import 中添加：
```typescript
import type { ApiResult, RequestOptions } from '@/types/request'
import type { ApiResponse } from '@/types'
```
- 将 `request` 函数的 `options` 参数类型从内联改为 `RequestOptions`
- 将 `ApiResponse` 引用替换为 `ApiResult`

- [ ] **Step 3: 验证 TypeScript 编译**

Run: `npx vue-tsc --noEmit` (project root `d:\wwwroot\wwwbilliards\www\wwwstoreapp`)
Expected: 编译通过，`api/request.ts` 中 ApiResponse 不再重复定义。

---

### Task 1.2: 修复 API 模块类型标注 - 全部 13 个文件

**Files:**
- Modify: `src/api/modules/approval.ts` (93行，14处 `any`)
- Modify: `src/api/modules/order.ts` (61行，11处 `any`)
- Modify: `src/api/modules/table.ts` (150行，24个函数无返回类型 + 6处 `any`)
- Modify: `src/api/modules/checkin.ts` (21行，5处 `any`)
- Modify: `src/api/modules/employee.ts` (66行，5处 `any`)
- Modify: `src/api/modules/auth.ts` (41行，4处 `any`)
- Modify: `src/api/modules/apply.ts` (13行，3处 `any`)
- Modify: `src/api/modules/notification.ts` (40行，3处 `any`)
- Modify: `src/api/modules/schedule.ts` (13行，3处 `any`)

- [ ] **Step 1: 修复 `table.ts` — 所有 24 个函数补充返回类型**

`src/api/modules/table.ts`:
```typescript
import { get, post, put, del } from '../request'
import type { 
  Table, TableStats, CurrentOrder, Bill, TableLog, 
  PendingProduct, PendingAssistant, ProductItem, 
  AssistantItem, MemberInfo 
} from '@/types'
import type { PaginatedData, ApiResponse } from '@/types/request'

export function getTableList(params: Record<string, unknown> = {}): Promise<Table[]> {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  return get(`/table.Table/index?${query}`)
}

export function getTableStats(): Promise<TableStats> {
  return get('/table.Table/stats')
}

export function openTable(data: { table_id: string; player_count?: number }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/open', data)
}

export function getTableDetail(tableId: string): Promise<Table> {
  return get(`/table.Table/detail?table_id=${encodeURIComponent(tableId)}`)
}

export function getCurrentOrder(tableId: string): Promise<CurrentOrder> {
  return get(`/table.Table/currentOrder?table_id=${encodeURIComponent(tableId)}`)
}

export function getBill(orderId: string): Promise<Bill> {
  return get(`/table.Table/bill?order_id=${encodeURIComponent(orderId)}`)
}

export function addProduct(data: { order_id: string; product_id: string; quantity?: number }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/addProduct', data)
}

export function removeProduct(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/removeProduct', { item_id: itemId })
}

export function deliverProduct(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/deliverProduct', { item_id: itemId })
}

export function addAssistant(data: { order_id: string; assistant_id: string }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/addAssistant', data)
}

export function confirmAssistant(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/confirmAssistant', { item_id: itemId })
}

export function startAssistant(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/startAssistant', { item_id: itemId })
}

export function endAssistant(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/endAssistant', { item_id: itemId })
}

export function cancelAssistant(itemId: string): Promise<ApiResponse<unknown>> {
  return post('/table.Table/cancelAssistant', { item_id: itemId })
}

export function changeTable(data: { order_id: string; target_table_id: string }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/changeTable', data)
}

export function mergeTable(data: { source_order_id: string; target_order_id: string }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/mergeTable', data)
}

export function bindMember(data: { order_id: string; member_id: string }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/bindMember', data)
}

export function checkout(data: { order_id: string; payment_method: string; amount: number; paid_amount?: number; remark?: string }): Promise<ApiResponse<unknown>> {
  return post('/table.Table/checkout', data)
}

export function getTableLog(params: { table_id?: string; order_id?: string }): Promise<TableLog[]> {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  return get(`/table.Table/log?${query}`)
}

export function getPendingProducts(): Promise<PendingProduct[]> {
  return get('/table.Table/pendingProducts')
}

export function getPendingAssistants(): Promise<PendingAssistant[]> {
  return get('/table.Table/pendingAssistants')
}

export function getProductList(params: Record<string, unknown> = {}): Promise<ProductItem[]> {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  return get(`/table.Table/productList?${query}`)
}

export function getAssistantList(): Promise<AssistantItem[]> {
  return get('/table.Table/assistantList')
}

export function searchMembers(keyword: string): Promise<MemberInfo[]> {
  return get(`/table.Table/searchMembers?keyword=${encodeURIComponent(keyword)}`)
}
```

同时修复 `Table` 接口中的 `any`（在 `src/types/index.ts` 中）:
- `current_order?: any` → `current_order?: CurrentOrder`
- 在 `Bill` 中: `order: any` → `order: CurrentOrder`; `member?: any` → `member?: MemberInfo`

在 `src/types/index.ts` 中新增：
```typescript
export interface CurrentOrder {
  order_id: string
  order_no: string
  table_name: string
  table_id: string
  start_time: string
  player_count: number
  status: string
  total_amount: number
  paid_amount: number
  assistants: AssistantInOrder[]
  products: ProductInOrder[]
}

export interface AssistantInOrder {
  item_id: string
  assistant_id: string
  assistant_name: string
  avatar: string
  status: string
  start_time?: string
  end_time?: string
  duration?: number
  fee?: number
}

export interface ProductInOrder {
  item_id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  status: string
}

export interface TableStats {
  total_tables: number
  idle_tables: number
  occupied_tables: number
  reserved_tables: number
}

export interface Bill {
  order_id: string
  order_no: string
  table_name: string
  start_time: string
  items: BillItem[]
  total_amount: number
  paid_amount: number
  discount_amount: number
  member?: MemberInfo
}

export interface BillItem {
  name: string
  quantity: number
  unit_price: number
  amount: number
  type: string
}

export interface TableLog {
  id: string
  table_id: string
  action: string
  operator: string
  detail: string
  created_at: string
}

export interface PendingProduct {
  order_id: string
  table_name: string
  products: PendingProductItem[]
  created_at: string
}

export interface PendingProductItem {
  product_name: string
  quantity: number
  status: string
}

export interface PendingAssistant {
  order_id: string
  table_name: string
  assistant_name: string
  created_at: string
}

export interface ProductItem {
  product_id: string
  name: string
  price: number
  category: string
  image?: string
  stock?: number
}

export interface AssistantItem {
  assistant_id: string
  name: string
  avatar: string
  status: string
  tags?: string[]
}

export interface MemberInfo {
  member_id: string
  name: string
  phone: string
  level: string
  balance: number
}
```

- [ ] **Step 2: 修复 `approval.ts` — 13 个函数补充返回类型**

`src/api/modules/approval.ts`:
```typescript
import { get, post } from '../request'
import type { ApprovalRecord, ApprovalListItem, PaginatedData } from '@/types'

export function getApprovalLists(
  status?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ lists: ApprovalListItem[]; count: number }> {
  return get('/approval.Approval/lists', { status, page_no: page, page_size: pageSize })
}

export function getMyApprovalList(
  params: { page?: number; page_size?: number; status?: string }
): Promise<{ lists: ApprovalListItem[]; count: number }> {
  return get('/approval.Approval/myList', params)
}

export function getPendingApprovalList(
  params: { page?: number; page_size?: number }
): Promise<{ lists: ApprovalListItem[]; count: number }> {
  return get('/approval.Approval/pending', params)
}

export function getApprovalDetail(params: { id: string }): Promise<ApprovalRecord> {
  return get('/approval.Approval/detail', params)
}

export function createApproval(
  params: { type: string; reason: string; extra_data?: Record<string, unknown> }
): Promise<{ code: number; msg: string }> {
  return post('/approval.Approval/create', params)
}

export function approveApplication(
  params: { id: string; remark?: string }
): Promise<{ code: number; msg: string }> {
  return post('/approval.Approval/approve', params)
}

export function rejectApplication(
  params: { id: string; remark?: string }
): Promise<{ code: number; msg: string }> {
  return post('/approval.Approval/reject', params)
}

export function getApprovalConfigList(): Promise<Array<{ id: string; type: string; approvers: Array<{ id: string; name: string }> }>> {
  return get('/approval.Approval/config')
}

export function saveApprovalConfig(
  params: { id?: string; type: string; approver_ids: string[] }
): Promise<{ code: number; msg: string }> {
  return post('/approval.Approval/saveConfig', params)
}

export function getApproverList(): Promise<Array<{ id: string; name: string; role: string }>> {
  return get('/approval.Approval/approvers')
}

export function getAssistantListForExchange(): Promise<Array<{ id: string; name: string; avatar: string }>> {
  return get('/approval.Approval/assistants')
}

export function getApprovalTypes(): Promise<Array<{ type: string; label: string }>> {
  return get('/approval.Approval/types')
}

export function getApprovalCount(): Promise<{ pending: number; total: number }> {
  return get('/approval.Approval/count')
}
```

- [ ] **Step 3: 修复 `order.ts` — 11 个函数补充返回类型**

`src/api/modules/order.ts`:
```typescript
import { get, post } from '../request'
import type { AssistantOrder, PaginatedData } from '@/types'

export function getPendingOrders(): Promise<AssistantOrder[]> {
  return get('/order.Order/pending')
}

export function getActiveOrder(): Promise<AssistantOrder | null> {
  return get('/order.Order/active')
}

export function acceptOrder(params: { order_id: string }): Promise<{ code: number; msg: string }> {
  return post('/order.Order/accept', params)
}

export function startOrder(params: { order_id: string }): Promise<{ code: number; msg: string }> {
  return post('/order.Order/start', params)
}

export function rejectOrder(params: { order_id: string; reason?: string }): Promise<{ code: number; msg: string }> {
  return post('/order.Order/reject', params)
}

export function completeOrder(params: { order_id: string; remark?: string }): Promise<{ code: number; msg: string }> {
  return post('/order.Order/complete', params)
}

export function getOrderHistory(
  pageNo: number = 1,
  pageSize: number = 20
): Promise<{ list: AssistantOrder[]; count: number; page_no: number }> {
  return get('/order.Order/history', { page_no: pageNo, page_size: pageSize })
}

export function getAssistantRecords(params: {
  page_no?: number
  page_size?: number
  start_date?: string
  end_date?: string
}): Promise<{ list: AssistantOrder[]; count: number }> {
  return get('/order.Order/records', params)
}

export function getAssistantStats(params?: {
  start_date?: string
  end_date?: string
}): Promise<{ total_orders: number; total_hours: number; total_revenue: number }> {
  return get('/order.Order/stats', params || {})
}

export function getAllAssistantOrders(params: {
  status?: string
  page_no?: number
  page_size?: number
}): Promise<{ list: AssistantOrder[]; count: number }> {
  return get('/order.Order/all', params)
}

export function getAssistantOrderList(params: {
  status?: string
  page_no?: number
  page_size?: number
}): Promise<{ list: AssistantOrder[]; count: number }> {
  return get('/order.Order/list', params)
}
```

- [ ] **Step 4: 修复 `checkin.ts` — 5 个函数补充返回类型**

`src/api/modules/checkin.ts`:
```typescript
import { get, post } from '../request'
import type { CheckInRecord, PaginatedData } from '@/types'

export function signIn(params: { location?: string; remark?: string }): Promise<{ code: number; msg: string }> {
  return post('/checkin.Checkin/signIn', params)
}

export function signOut(params: { location?: string; remark?: string }): Promise<{ code: number; msg: string }> {
  return post('/checkin.Checkin/signOut', params)
}

export function getCheckinRecords(
  pageNo: number = 1,
  pageSize: number = 20
): Promise<{ list: CheckInRecord[]; count: number; page_no: number }> {
  return get('/checkin.Checkin/records', { page_no: pageNo, page_size: pageSize })
}

export function getTodayStatus(): Promise<{
  signed_in: boolean
  signed_out: boolean
  sign_in_time?: string
  sign_out_time?: string
}> {
  return get('/checkin.Checkin/todayStatus')
}

export function applyOutwork(params: {
  start_time: string
  end_time: string
  reason: string
}): Promise<{ code: number; msg: string }> {
  return post('/checkin.Checkin/applyOutwork', params)
}
```

- [ ] **Step 5: 修复 `employee.ts` — 5 个函数补充返回类型**

`src/api/modules/employee.ts`:
```typescript
import { get, post, put, del } from '../request'
import type { EmployeeInfo, EmployeeListItem, PaginatedData } from '@/types'

export function getEmployees(
  page_no: number = 1,
  page_size: number = 20,
  keyword?: string
): Promise<{ list: EmployeeListItem[]; total: number }> {
  return get('/employee.Employee/list', { page_no, page_size, keyword })
}

export function getEmployeeDetail(id: string): Promise<EmployeeInfo> {
  return get('/employee.Employee/detail', { id })
}

export function createEmployee(
  params: {
    name: string
    phone: string
    role: string
    password?: string
  }
): Promise<{ code: number; msg: string }> {
  return post('/employee.Employee/create', params)
}

export function updateEmployee(
  id: string,
  params: {
    name?: string
    phone?: string
    role?: string
    password?: string
  }
): Promise<{ code: number; msg: string }> {
  return put('/employee.Employee/update', { id, ...params })
}

export function deleteEmployee(id: string): Promise<{ code: number; msg: string }> {
  return del('/employee.Employee/delete', { id })
}

export function resetEmployeePassword(id: string): Promise<{ code: number; msg: string }> {
  return post('/employee.Employee/resetPassword', { id })
}
```

- [ ] **Step 6: 修复 `auth.ts` — 4 个函数补充返回类型**

`src/api/modules/auth.ts`:
```typescript
import { get, post } from '../request'
import type { LoginParams, LoginResult, EmployeeInfo } from '@/types'

export function sendSmsCode(phone: string): Promise<{ code: number; msg: string }> {
  return post('/auth.Auth/sendCode', { phone })
}

export function smsLogin(params: LoginParams): Promise<LoginResult> {
  return post('/auth.Auth/smsLogin', params)
}

export function passwordLogin(params: LoginParams): Promise<LoginResult> {
  return post('/auth.Auth/passwordLogin', params)
}

export function logout(): Promise<{ code: number; msg: string }> {
  return post('/auth.Auth/logout')
}

export function getUserInfo(): Promise<EmployeeInfo> {
  return get('/auth.Auth/userInfo')
}

export function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ code: number; msg: string }> {
  return post('/auth.Auth/changePassword', { old_password: oldPassword, new_password: newPassword })
}

export function getRoles(): Promise<Array<{ id: string; name: string; type: string }>> {
  return get('/auth.Auth/roles')
}

export function switchRole(roleType: string): Promise<LoginResult> {
  return post('/auth.Auth/switchRole', { role_type: roleType })
}

export function getMyPermissions(): Promise<string[]> {
  return get('/auth.Auth/permissions')
}
```

- [ ] **Step 7: 修复 `apply.ts` — 3 个函数补充返回类型**

`src/api/modules/apply.ts`:
```typescript
import { get, post } from '../request'
import type { ApprovalListItem } from '@/types'

export function submitCheckin(
  params: { checkin_time: string; reason: string }
): Promise<{ code: number; msg: string }> {
  return post('/apply.Apply/checkin', params)
}

export function submitLeave(
  params: { start_time: string; end_time: string; reason: string; type: string }
): Promise<{ code: number; msg: string }> {
  return post('/apply.Apply/leave', params)
}

export function getApplyRecords(
  type?: string,
  pageNo: number = 1,
  pageSize: number = 20
): Promise<{ list: ApprovalListItem[]; count: number }> {
  return get('/apply.Apply/records', { type, page_no: pageNo, page_size: pageSize })
}
```

- [ ] **Step 8: 修复 `notification.ts` — 3 个函数补充返回类型**

`src/api/modules/notification.ts`:
```typescript
import { get, post, del } from '../request'
import type { Notification, PaginatedData } from '@/types'

export function getNotifications(
  params?: { type?: string; page_no?: number; page_size?: number }
): Promise<{ list: Notification[]; count: number; page_no: number }> {
  return get('/notification.Notification/list', params || {})
}

export function getNotificationDetail(id: string | number): Promise<Notification> {
  return get('/notification.Notification/detail', { id })
}

export function markRead(id: string | number): Promise<{ code: number; msg: string }> {
  return post('/notification.Notification/read', { id })
}

export function markAllRead(): Promise<{ code: number; msg: string }> {
  return post('/notification.Notification/readAll')
}

export function deleteNotification(id: string | number): Promise<{ code: number; msg: string }> {
  return del('/notification.Notification/delete', { id })
}

export function getUnreadCount(): Promise<{ count: number }> {
  return get('/notification.Notification/unreadCount')
}
```

- [ ] **Step 9: 修复 `schedule.ts` — 3 个函数补充返回类型**

`src/api/modules/schedule.ts`:
```typescript
import { get, post } from '../request'
import type { ScheduleRecord } from '@/types'

export function getMySchedule(week: number = 0): Promise<ScheduleRecord[]> {
  return get('/schedule.Schedule/my', { week })
}

export function getEmployeeSchedule(
  employeeId?: string,
  week: number = 0,
  role: string = 'waiter'
): Promise<ScheduleRecord[]> {
  return get('/schedule.Schedule/employee', { employee_id: employeeId, week, role })
}

export function adjustSchedule(
  params: { schedule_id: string; new_time: string }
): Promise<{ code: number; msg: string }> {
  return post('/schedule.Schedule/adjust', params)
}
```

- [ ] **Step 10: 验证 TypeScript 编译**

Run: `npx vue-tsc --noEmit`
Expected: 编译通过。如果 `any` 相关类型错误未完全消除，记录并逐步处理。

---

### Task 1.3: 新增统一错误处理模块

**Files:**
- Create: `src/api/error-handler.ts`
- Modify: `src/api/request.ts:44-155`

- [ ] **Step 1: 创建 `src/api/error-handler.ts`**

```typescript
import type { ApiResult } from '@/types/request'

export enum ErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface HandledError {
  type: ErrorType
  message: string
  raw: unknown
}

export function classifyError(res: ApiResult): HandledError | null {
  if (res.code === 2002) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: '登录已过期，请重新登录',
      raw: res,
    }
  }
  if (res.code === 0) {
    return {
      type: ErrorType.BUSINESS_ERROR,
      message: res.msg || '操作失败',
      raw: res,
    }
  }
  return null
}

export function classifyNetworkError(err: unknown): HandledError {
  if (err && typeof err === 'object' && 'errMsg' in err) {
    const msg = (err as Record<string, string>).errMsg
    if (msg?.includes('timeout')) {
      return { type: ErrorType.NETWORK_ERROR, message: '请求超时，请检查网络', raw: err }
    }
    if (msg?.includes('fail')) {
      return { type: ErrorType.NETWORK_ERROR, message: '网络连接失败', raw: err }
    }
  }
  return { type: ErrorType.NETWORK_ERROR, message: '网络异常，请稍后重试', raw: err }
}
```

- [ ] **Step 2: 重构 `src/api/request.ts`，抽取公共逻辑，消除 get/post/put/del 重复**

```typescript
import { config } from '@/config'
import { authStore } from '@/stores/auth'
import { storeStore } from '@/stores/store'
import { ErrorType, classifyError, classifyNetworkError } from './error-handler'
import type { RequestOptions } from '@/types/request'

const BASE_URL = config.BASE_URL

function buildUrl(url: string): string {
  if (url.startsWith('http')) return url
  return `${BASE_URL}/${url}`
}

function buildHeader(customHeader?: Record<string, string>): Record<string, string> {
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeader,
  }
  if (authStore.token) {
    header['Authorization'] = `Bearer ${authStore.token}`
  }
  if (storeStore.currentStoreId) {
    header['X-Store-Id'] = String(storeStore.currentStoreId)
  }
  return header
}

async function doRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: unknown,
  header?: Record<string, string>,
  showLoading: boolean = true,
  showError: boolean = true
): Promise<T> {
  if (showLoading) {
    uni.showLoading({ title: '加载中...', mask: true })
  }

  try {
    const [err, res] = await uni.request({
      url: buildUrl(url),
      method,
      data,
      header: buildHeader(header),
    })

    if (showLoading) {
      uni.hideLoading()
    }

    if (err) {
      const handled = classifyNetworkError(err)
      if (showError) {
        uni.showToast({ title: handled.message, icon: 'none' })
      }
      throw handled
    }

    const result = res.data as { code: number; show: number; msg: string; data: T }

    const classified = classifyError(result)
    if (classified) {
      if (classified.type === ErrorType.AUTH_ERROR) {
        authStore.logout()
      }
      if (showError) {
        uni.showToast({ title: classified.message, icon: 'none' })
      }
      throw classified
    }

    return result.data
  } catch (e) {
    if (showLoading) {
      uni.hideLoading()
    }
    if (showError && e && typeof e === 'object' && 'message' in e) {
      uni.showToast({ title: (e as { message: string }).message, icon: 'none' })
    }
    throw e
  }
}

export function get<T>(url: string, data?: unknown, options?: { showLoading?: boolean; showError?: boolean }): Promise<T> {
  return doRequest<T>('GET', url, data, undefined, options?.showLoading ?? true, options?.showError ?? true)
}

export function post<T>(url: string, data?: unknown, options?: { showLoading?: boolean; showError?: boolean }): Promise<T> {
  return doRequest<T>('POST', url, data, undefined, options?.showLoading ?? true, options?.showError ?? true)
}

export function put<T>(url: string, data?: unknown, options?: { showLoading?: boolean; showError?: boolean }): Promise<T> {
  return doRequest<T>('PUT', url, data, undefined, options?.showLoading ?? true, options?.showError ?? true)
}

export function del<T>(url: string, data?: unknown, options?: { showLoading?: boolean; showError?: boolean }): Promise<T> {
  return doRequest<T>('DELETE', url, data, undefined, options?.showLoading ?? true, options?.showError ?? true)
}

export function uploadFile(
  filePath: string,
  name: string = 'file',
  formData?: Record<string, string>,
  showLoading: boolean = true
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (showLoading) {
      uni.showLoading({ title: '上传中...', mask: true })
    }

    const header: Record<string, string> = {}
    if (authStore.token) {
      header['Authorization'] = `Bearer ${authStore.token}`
    }

    uni.uploadFile({
      url: buildUrl('/upload.Upload/image'),
      filePath,
      name,
      formData,
      header,
      success: (res) => {
        if (showLoading) {
          uni.hideLoading()
        }
        try {
          const data = JSON.parse(res.data)
          if (data.code === 1 && data.data?.url) {
            resolve(data.data.url)
          } else {
            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(new Error(data.msg || '上传失败'))
          }
        } catch {
          uni.showToast({ title: '上传失败', icon: 'none' })
          reject(new Error('上传失败'))
        }
      },
      fail: (err) => {
        if (showLoading) {
          uni.hideLoading()
        }
        uni.showToast({ title: '网络异常，上传失败', icon: 'none' })
        reject(err)
      },
    })
  })
}
```

- [ ] **Step 3: 验证编译**

Run: `npx vue-tsc --noEmit`
Expected: 编译通过，`request.ts` 无重复代码。

---

### Task 1.4: 修复 Stores 空 catch 块 & 响应式问题

**Files:**
- Modify: `src/stores/auth.ts:108,118,155-156,216-217`
- Modify: `src/stores/order.ts:87,89,93,105,121,131,139,143,151,153,162,178` (全部 catch + as unknown as)
- Modify: `src/stores/store.ts:38` (类型不匹配)
- Modify: `src/stores/notification.ts:37,45`

- [ ] **Step 1: 修复 `stores/auth.ts` — catch 块改为有日志输出**

```typescript
// login() 方法 (L108-L109)
// 修改前: catch { return null }
// 修改后:
catch (e) {
  console.error('[AuthStore] login failed:', e)
  return null
}

// logout() 方法 (L118)
// 修改前: catch { }
// 修改后:
catch (e) {
  console.error('[AuthStore] logout failed:', e)
}

// loadPermissions() 方法 (L155-L156)
// 修改前: catch { this._permissions = [] }
// 修改后:
catch (e) {
  console.error('[AuthStore] loadPermissions failed:', e)
  this._permissions = []
}

// validateToken() 方法 (L216-L217)
// 修改前: catch (error) 声明未使用
// 修改后:
catch (e) {
  console.error('[AuthStore] validateToken failed:', e)
  return false
}
```

- [ ] **Step 2: 修复 `stores/auth.ts` — 权限缓存从5分钟改为1小时**

```typescript
// App.vue onLaunch() 中
// 修改前: const fiveMinutes = 5 * 60 * 1000
// 修改后: const oneHour = 60 * 60 * 1000
const oneHour = 60 * 60 * 1000
if (elapsed > oneHour) {
  authStore.loadPermissions()
}
```

- [ ] **Step 3: 修复 `stores/order.ts` — 使用 reactive 包装**

```typescript
// 文件末尾:
// 修改前: export const orderStore = new OrderStore()
// 修改后: export const orderStore = reactive(new OrderStore()) as OrderStore
```

- [ ] **Step 4: 修复 `stores/order.ts` — 所有 catch 块改为有日志输出**

```typescript
// 每个 catch { } 改为:
catch (e) {
  console.error('[OrderStore] operation failed:', e)
}
```

- [ ] **Step 5: 修复 `stores/store.ts` — 使用 reactive 包装**

```typescript
// 文件末尾:
// 修改前: export const storeStore = new StoreStore()
// 修改后: export const storeStore = reactive(new StoreStore()) as StoreStore
```

- [ ] **Step 6: 修复 `stores/notification.ts` — catch 块改为有日志输出**

```typescript
// markAsRead: catch {} → catch (e) { console.error('[NotificationStore] markAsRead failed:', e) }
// markAllAsRead: catch {} → catch (e) { console.error('[NotificationStore] markAllAsRead failed:', e) }
```

---

### Task 1.5: 清理命名 & 规范

**Files:**
- Modify: `src/stores/auth.ts` (所有 `_permissions` 引用)
- Modify: `src/constants/permissions.ts:8-14` (角色命名)
- Modify: `src/app/App.vue` (console.log 清理)
- Modify: `all .vue files` (console.log 清理)

- [ ] **Step 1: 重命名 `_permissions` → `permissionCodes`**

在 `src/stores/auth.ts` 中：
- 所有 `this._permissions` → `this.permissionCodes`
- 所有 `_permissions` → `permissionCodes`
- 在 `types/index.ts` 中新增 `UserRole` 联合类型确认 `'employee'` 和 `'waiter'` 的关系（在 permissions.ts 中使用 `'employee'` 作为菜单 key，若 types 中使用的 `'waiter'` 不应冲突则可忽略）

- [ ] **Step 2: 清理 `App.vue` 和所有页面 `console.log`**

在 `App.vue` 中：
- 第 6 行: `console.log('App Launch')` → 移除（或用 `if (__DEV__) console.log(...)` 包裹）
- 第 25 行: `console.log('App Show')` → 移除
- 第 29 行: `console.log('App Hide')` → 移除

在所有 .vue 文件中搜索 `console.log`，若为调试日志则移除。

---

### L1 验收

- [ ] 全部 13 个 API 模块函数返回类型标注完整
- [ ] `request.ts` 中无 `any` 类型，无重复代码
- [ ] `orderStore` 和 `storeStore` 使用 `reactive()` 包装
- [ ] 所有 catch 块有 `console.error` 日志
- [ ] `_permissions` 重命名为 `permissionCodes`
- [ ] 权限缓存从 5 分钟改为 1 小时
- [ ] 无 `console.log` 残留
- [ ] `npx vue-tsc --noEmit` 编译通过

---

## L2 交互完整层

### Task 2.1: 创建四态容器组件

**Files:**
- Create: `src/components/StateView.vue`
- Create: `src/components/SkeletonBox.vue`
- Create: `src/components/EmptyState.vue`

- [ ] **Step 1: 创建 `src/components/StateView.vue`**

```vue
<template>
  <view class="state-view">
    <view v-if="loading" class="state-loading">
      <slot name="loading">
        <SkeletonBox :lines="4" />
      </slot>
    </view>
    <view v-else-if="error" class="state-error">
      <slot name="error">
        <EmptyState
          type="error"
          :message="errorMsg || '加载失败'"
          @retry="$emit('retry')"
        />
      </slot>
    </view>
    <view v-else-if="empty" class="state-empty">
      <slot name="empty">
        <EmptyState :type="emptyType" :message="emptyMsg || '暂无数据'" />
      </slot>
    </view>
    <view v-else class="state-content">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import SkeletonBox from './SkeletonBox.vue'
import EmptyState from './EmptyState.vue'

defineProps<{
  loading?: boolean
  empty?: boolean
  error?: boolean
  errorMsg?: string
  emptyType?: string
  emptyMsg?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style lang="scss" scoped>
.state-view {
  min-height: 200rpx;
}
.state-loading,
.state-error,
.state-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400rpx;
}
</style>
```

- [ ] **Step 2: 创建 `src/components/SkeletonBox.vue`**

```vue
<template>
  <view class="skeleton-box">
    <view
      v-for="i in lines"
      :key="i"
      class="skeleton-line"
      :style="{
        width: getWidth(i),
        height: height + 'rpx',
        borderRadius: round ? '100rpx' : '8rpx',
      }"
    />
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  lines?: number
  height?: number
  round?: boolean
}>(), {
  lines: 3,
  height: 28,
  round: false,
})

function getWidth(index: number): string {
  const widths = ['100%', '80%', '60%']
  return widths[(index - 1) % widths.length]
}
</script>

<style lang="scss" scoped>
.skeleton-box {
  width: 100%;
  padding: 32rpx;
}

.skeleton-line {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  margin-bottom: 24rpx;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```

- [ ] **Step 3: 创建 `src/components/EmptyState.vue`**

```vue
<template>
  <view class="empty-state" @tap="handleRetry">
    <view class="empty-icon">
      <image
        v-if="iconMap[type]"
        :src="iconMap[type]"
        mode="aspectFit"
        class="empty-image"
      />
      <text v-else class="empty-emoji">{{ iconEmoji }}</text>
    </view>
    <text class="empty-message">{{ message }}</text>
    <text v-if="type === 'error'" class="empty-retry">点击重试</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type?: string
  message?: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const iconMap: Record<string, string> = {
  nodata: '/static/empty-nodata.png',
  error: '/static/empty-error.png',
  nonotification: '/static/empty-notification.png',
  noorder: '/static/empty-order.png',
}

const iconEmoji = '📭'

function handleRetry() {
  emit('retry')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  margin-bottom: 24rpx;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
}

.empty-emoji {
  font-size: 80rpx;
}

.empty-message {
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

.empty-retry {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #1989fa;
}
</style>
```

---

### Task 2.2: 列表页接入下拉刷新 & 四态

逐个接入以下列表页面，每个页面按相同模式改造。

**Files (12 pages):**
- Modify: `src/pages/approval/index.vue`
- Modify: `src/pages/approval/my-records.vue`
- Modify: `src/pages/orders/index.vue`
- Modify: `src/pages/checkin/record.vue`
- Modify: `src/pages/notification/index.vue`
- Modify: `src/pages/employee/list.vue`
- Modify: `src/pages/table/index.vue`
- Modify: `src/pages/table/log.vue`

- [ ] **Step 1-8: 逐个页面改造（以 employee/list.vue 为示例）**

`src/pages/employee/list.vue` 改造模式：
```vue
<template>
  <view class="employee-list-page">
    <Header title="员工列表" />
    
    <view class="search-bar">
      <input
        v-model="searchKeyword"
        placeholder="搜索员工姓名或手机号"
        @input="onSearchInput"
      />
    </view>

    <StateView
      :loading="loading"
      :empty="employees.length === 0 && !loading"
      :error="hasError"
      empty-type="nodata"
      empty-msg="暂无员工数据"
      :error-msg="errorMsg"
      @retry="loadEmployees"
    >
      <scroll-view
        class="employee-list"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="onLoadMore"
      >
        <view v-for="emp in employees" :key="emp.id" class="employee-card" @tap="goDetail(emp.id)">
          <image :src="emp.avatar || '/static/default-avatar.png'" class="avatar" mode="aspectFill" />
          <view class="info">
            <text class="name">{{ emp.name }}</text>
            <text class="phone">{{ emp.phone }}</text>
          </view>
          <text class="role-tag" :style="{ color: getRoleColor(emp.role) }">{{ emp.role_name }}</text>
        </view>
        
        <view v-if="loadingMore" class="load-more">加载中...</view>
        <view v-if="noMore && employees.length > 0" class="load-more">没有更多了</view>
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import StateView from '@/components/StateView.vue'
import { getEmployees } from '@/api/modules/employee'
import { ROLE_COLOR_MAP } from '@/types'

const employees = ref<Array<{ id: string; name: string; phone: string; avatar: string; role: string; role_name: string }>>([])
const loading = ref(true)
const refreshing = ref(false)
const loadingMore = ref(false)
const hasError = ref(false)
const errorMsg = ref('')
const searchKeyword = ref('')
const pageNo = ref(1)
const noMore = ref(false)

async function loadEmployees(reset: boolean = false) {
  if (reset) {
    pageNo.value = 1
    noMore.value = false
  }
  loading.value = true
  hasError.value = false
  try {
    const res = await getEmployees(pageNo.value, 20, searchKeyword.value || undefined)
    if (reset) {
      employees.value = res.list || []
    } else {
      employees.value.push(...(res.list || []))
    }
    noMore.value = (res.list || []).length < 20
  } catch (e) {
    hasError.value = true
    errorMsg.value = '加载失败'
    console.error('[EmployeeList] loadEmployees failed:', e)
  } finally {
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

async function onRefresh() {
  refreshing.value = true
  await loadEmployees(true)
}

async function onLoadMore() {
  if (loadingMore.value || noMore.value) return
  loadingMore.value = true
  pageNo.value++
  await loadEmployees(false)
}

function onSearchInput() {
  pageNo.value = 1
  loadEmployees(true)
}

function goDetail(id: string) {
  uni.navigateTo({ url: `/pages/employee/detail?id=${id}` })
}

function getRoleColor(role: string): string {
  return ROLE_COLOR_MAP[role] || '#666'
}

loadEmployees(true)
</script>
```

同样模式应用到其他 7 个列表页。

---

### Task 2.3: 非列表数据页面接入四态

**Files (10 pages):**
- Modify: `src/pages/index/OwnerHome.vue`
- Modify: `src/pages/index/AssistantHome.vue`
- Modify: `src/pages/index/EmployeeHome.vue`
- Modify: `src/pages/checkin/index.vue`
- Modify: `src/pages/performance/index.vue`
- Modify: `src/pages/schedule/index.vue`
- Modify: `src/pages/orders/active.vue`
- Modify: `src/pages/profile/index.vue`
- Modify: `src/pages/work/index.vue`
- Modify: `src/pages/settings/index.vue`

- [ ] **Step 1-10: 逐个接入 StateView 和 Error 状态**

每个页面按模式：
```vue
<StateView :loading="loading" :error="hasError" empty-type="nodata" @retry="loadData">
  <!-- 原有内容 -->
</StateView>
```

并在 script 中补充：
```typescript
import StateView from '@/components/StateView.vue'
const loading = ref(true)
const hasError = ref(false)
const errorMsg = ref('')
```

将原有数据加载逻辑包裹 try/catch 设置 loading/hasError/errorMsg 状态。

---

### Task 2.4: Header 安全区 & TabBar 适配

**Files:**
- Modify: `src/components/Header.vue`
- Modify: `src/components/TabBar.vue`

- [ ] **Step 1: Header.vue 增加状态栏高度适配**

```vue
<!-- 在 Header.vue style 中增加: -->
<style lang="scss" scoped>
.header {
  padding-top: var(--status-bar-height);
  /* 原有样式保持不变 */
}
</style>
```

- [ ] **Step 2: TabBar.vue 增加安全区适配**

```scss
.tab-bar {
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: constant(safe-area-inset-bottom);
}
```

---

### L2 验收

- [ ] 所有数据驱动页面使用 `StateView` 组件覆盖四态
- [ ] 所有列表页支持下拉刷新，有分页数据的支持触底加载
- [ ] 所有操作有即时 toast 反馈
- [ ] 全面屏安全区适配完整

---

## L3 功能闭环层

### Task 3.1: 修复关键功能问题

**Files:**
- Modify: `src/pages/index/OwnerHome.vue:298`
- Modify: `src/composables/usePermission.ts:19-20`
- Modify: `src/stores/auth.ts`

- [ ] **Step 1: OwnerHome.vue — goToApproval 改用 navigateTo**

```typescript
// 修改前: uni.redirectTo({ url: '/pages/approval/index' })
// 修改后:
function goToApproval() {
  uni.navigateTo({ url: '/pages/approval/index' })
}
```

- [ ] **Step 2: usePermission.ts — 移除或修复 mobile:report**

```typescript
// 第19行：如果报表功能暂不上线，从 ALL_WORK_CARDS 中移除 mobile:report
// 如果计划上线，补充正确的 path: '/pages/reports/index'
{
  code: 'mobile:report',
  title: '经营报表',
  icon: '📊',
  path: '/pages/reports/index',  // 确认路径后替换
}
```

- [ ] **Step 3: authStore — 门店切换时清空缓存 & 触发首页重载**

```typescript
// 在 authStore.setStore() 方法中增加:
setStore(storeId: number, storeName: string): void {
  this._storeId = storeId
  this._storeName = storeName
  uni.setStorageSync('storeId', storeId)
  uni.setStorageSync('storeName', storeName)
  // 新增：清空需要刷新的缓存
  uni.removeStorageSync('dashboard_cache')
  uni.removeStorageSync('permissionsTime')
  // 新增：重新加载权限
  this.loadPermissions()
}
```

- [ ] **Step 4: 替换审批类型接口 — 移除硬编码**

在 `src/api/modules/approval.ts` 的 `getApprovalTypes()` 中，确认后端 API 端点后：
```typescript
export function getApprovalTypes(): Promise<Array<{ type: string; label: string }>> {
  return get('/approval.Approval/types')
}
```

---

### Task 3.2: 按角色端到端验证

- [ ] **Step 1: 老板角色完整流程**

登录 → 首页数据看板（营收+趋势+TOP商品+待办）→ 进入员工管理（列表→新增→详情→编辑→删除）→ 返回首页 → 进入审批（待审批→同意/拒绝→我的申请）→ 台桌管理（查看台桌→开台→点单→加助教→结账）→ 门店设置 → 个人中心 → 退出登录

- [ ] **Step 2: 助教角色完整流程**

登录 → 首页 → 进入接单中心（待接单→接单→拒绝）→ 进行中订单（开始→完成）→ 业绩页 → 打卡签到 → 排班查询 → 个人中心

- [ ] **Step 3: 服务员角色完整流程**

登录 → 首页工作台 → 台桌管理 → 打卡签到 → 申请中心（提交→查看）→ 排班查询

---

### Task 3.3: 跨页面数据一致性验证

- [ ] **Step 1: 门店切换验证**

1. 以老板身份登录，切换到不同门店
2. 验证首页数据随门店切换而刷新
3. 验证员工列表、台桌列表按门店过滤

- [ ] **Step 2: Token 过期验证**

1. 清除本地 token，模拟 `code=2002` 响应
2. 验证是否自动跳转登录页
3. 验证所有 API 调用路径均生效（列表、详情、提交操作）

- [ ] **Step 3: 权限缓存 1 小时验证**

1. 登录后记录 `permissionsTime`
2. 关闭 App 后 30 分钟内重开，验证不再请求权限
3. 关闭 App 后 1 小时后重开，验证重新请求权限

---

### L3 验收

- [ ] 34 页全部功能链路可走通
- [ ] 每个角色完整操作流无阻断
- [ ] 门店切换后数据正确刷新
- [ ] Token 过期全局拦截生效
- [ ] 跨页面数据一致

---

## L4 体验打磨层

### Task 4.1: 图标体系升级

**Files:**
- Create: `src/constants/icons.ts`
- Modify: 所有使用 emoji 的 .vue 文件（约20+个）

- [ ] **Step 1: 创建 `src/constants/icons.ts`**

```typescript
export const ICON_MAP: Record<string, string> = {
  home: 'home-filled',
  dashboard: 'bars',
  table: 'calendar',
  orders: 'list-check',
  employee: 'person',
  approval: 'checkbox-filled',
  checkin: 'location',
  schedule: 'calendar',
  performance: 'chart',
  notification: 'notification',
  profile: 'person',
  settings: 'gear',
  work: 'home',
  logout: 'exit',
  add: 'plus',
  search: 'search',
  close: 'close',
  back: 'left',
  edit: 'compose',
  delete: 'trash',
  phone: 'phone',
  location: 'location',
  clock: 'clock',
  member: 'vip',
  product: 'cart',
  assistant: 'staff',
  money: 'wallet',
  chart: 'chart',
}

export function getIcon(name: string): string {
  return ICON_MAP[name] || 'circle'
}
```

- [ ] **Step 2: 批量替换 emoji → `<uni-icons>`**

替换模式：`🔔` → `<uni-icons type="notification" size="20" color="#666" />`
同理替换所有模板中的 emoji。

---

### Task 4.2: 页面过渡动画

**Files:**
- Modify: `src/pages.json`

- [ ] **Step 1: pages.json 增加动画配置**

```json
{
  "globalStyle": {
    "animationType": "slide-in-right",
    "animationDuration": 300
  }
}
```

---

### Task 4.3: 多端适配增强

**Files:**
- Create: `src/utils/platform.ts`

- [ ] **Step 1: 创建 `src/utils/platform.ts`**

```typescript
export function isApp(): boolean {
  // #ifdef APP-PLUS
  return true
  // #endif
  return false
}

export function isH5(): boolean {
  // #ifdef H5
  return true
  // #endif
  return false
}

export function isMp(): boolean {
  // #ifdef MP-WEIXIN
  return true
  // #endif
  return false
}

export function isMpAlipay(): boolean {
  // #ifdef MP-ALIPAY
  return true
  // #endif
  return false
}

export function getPlatform(): 'app' | 'h5' | 'mp-weixin' | 'mp-alipay' | 'unknown' {
  if (isApp()) return 'app'
  if (isH5()) return 'h5'
  if (isMp()) return 'mp-weixin'
  if (isMpAlipay()) return 'mp-alipay'
  return 'unknown'
}
```

---

### Task 4.4: 性能优化

**Files:**
- Modify: `src/pages/index/index.vue` (条件编译)
- Modify: 所有 `<image>` 标签所在文件

- [ ] **Step 1: 首页条件编译**

```vue
<!-- index.vue: 按角色条件编译，减少包体积 -->
<!-- #ifdef MP-WEIXIN -->
<!-- 小程序端只导入需要的组件 -->
<!-- #endif -->
```

- [ ] **Step 2: 图片懒加载**

在所有 `<image>` 标签上增加 `lazy-load` 属性（小程序端支持有限，App端用 `lazy-load`）。

- [ ] **Step 3: 首页数据本地缓存**

在 OwnerHome.vue 中：
```typescript
const CACHE_KEY = 'dashboard_cache'
const CACHE_DURATION = 30 * 1000 // 30秒

async function loadDashboard() {
  const cached = uni.getStorageSync(CACHE_KEY)
  if (cached && Date.now() - cached.time < CACHE_DURATION) {
    dashboardData.value = cached.data
    return
  }
  try {
    const res = await getDashboardData(dateType.value)
    dashboardData.value = res
    uni.setStorageSync(CACHE_KEY, { data: res, time: Date.now() })
  } catch (e) {
    console.error('[OwnerHome] loadDashboard failed:', e)
  }
}
```

---

### L4 验收

- [ ] 全域 emoji 替换为 `<uni-icons>` 或 SVG
- [ ] 页面路由有过渡动画
- [ ] 多端条件编译正确
- [ ] 首页数据 30 秒缓存生效
- [ ] `lazy-load` 属性已添加

---

## 最终验收清单

| 维度 | 标准 | 验证方式 |
|------|------|---------|
| 类型安全 | 0 TypeScript 错误 | `npx vue-tsc --noEmit` |
| 代码规范 | 0 `any` 在 API 路径 | 代码扫描 |
| 错误处理 | 所有 catch 有日志 | 代码审查 |
| 四态交互 | 25+ 页面接入 StateView | 逐页检查 |
| 下拉刷新 | 8 列表页支持下拉刷新 | 手动测试 |
| 功能闭环 | 3 角色完整流程可走通 | 端到端测试 |
| 权限缓存 | 1 小时缓存生效 | 手动验证 |
| Token 过期 | code=2002 全局拦截 | 手动验证 |
| 门店切换 | 切换后数据刷新 | 手动验证 |
| 图标体系 | emoji 替换完成 | 代码扫描 |
| 页面动画 | 过渡动画生效 | 手动测试 |
| 多端适配 | 四端显示一致 | 逐端测试 |
| 性能 | 首页 < 2s 可交互 | 性能测试 |
