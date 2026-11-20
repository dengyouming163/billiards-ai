# wwwstoreapp 生产就绪修复 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复评估报告中发现的 5 个阻断性 Bug、6 个高优 Bug、5 个功能缺口，将 wwwstoreapp 从 75% 提升到 95%+ 生产就绪度。

**Architecture:** 三轮迭代 — Round 1 (P0 阻断 → 可运行) → Round 2 (P1 高优 → 可靠) → Round 3 (P2 功能补充 → 完整)。每轮独立可交付，可随时停止。

**Tech Stack:** uni-app Vue3 + TypeScript + SCSS，不引入新依赖。

**关联设计文档:** `docs/superpowers/specs/2026-06-08-wwwstoreapp-production-readiness-assessment.md`

---

## 文件结构映射

```
src/
├── config/
│   └── env.ts                    # P0-5: 修复生产环境 BASE_URL
├── pages/
│   ├── profile/
│   │   ├── edit.vue              # P0-1: 修复头像上传
│   │   └── feedback.vue          # P0-2: 接入真实 API
│   ├── table/
│   │   ├── pending-products.vue  # P0-3: 修复 Vue2 语法 + P0-4: 添加返回按钮
│   │   └── pending-assistants.vue# P0-4: 添加返回按钮
│   ├── checkin/
│   │   ├── index.vue             # P1-9: 清理 setInterval
│   │   └── record.vue            # P1-6: 修复缺勤统计 + P1-7: 分页修复
│   └── index/
│       └── AssistantHome.vue     # P1-8: 订单详情页导航
├── components/
│   ├── Header.vue                # P1-10: 修复事件监听泄漏
│   └── TabBar.vue                # P1-11: 修复导航方式
└── api/modules/
    ├── employee.ts               # P2: 补充类型标注
    └── schedule.ts               # P2: 补充类型标注
```

---

## Round 1: P0 阻断性 Bug（预计 2-3 小时）

### Task R1-1: 修复头像上传 — `profile/edit.vue`

**Files:** Modify `src/pages/profile/edit.vue`

**问题:** `chooseImage` 仅将本地临时路径存入 `form.avatar`，从未调用 `uploadAvatar` API 上传到服务器。保存时把 `blob:...` 路径提交给后端。

- [ ] **Step 1: 修改 `chooseImage` 函数，选图后立即上传到服务器**

定位到第 150-159 行的 `chooseImage` 函数。用以下代码替换：

```typescript
async function chooseImage(sourceType: 'camera' | 'album') {
	try {
		const res = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
			uni.chooseImage({
				count: 1,
				sourceType: [sourceType],
				success: resolve,
				fail: reject
			})
		})
		const tempFilePath = res.tempFilePaths[0]
		// 先显示本地预览
		form.avatar = tempFilePath
		uni.showLoading({ title: '上传中...', mask: true })
		try {
			const result = await uploadAvatar(tempFilePath)
			form.avatar = result.url
			uni.hideLoading()
			uni.showToast({ title: '头像已更新', icon: 'success' })
		} catch {
			uni.hideLoading()
			uni.showToast({ title: '头像上传失败，请重试', icon: 'none' })
		}
	} catch {
		// 用户取消选择，不处理
	}
}
```

- [ ] **Step 2: 在 script 顶部添加 `uploadAvatar` 导入**

定位到第 79 行的 import 语句，将其修改为：

```typescript
import { getProfile, updateProfile, uploadAvatar, type ProfileData } from '@/api/modules/profile'
```

- [ ] **Step 3: 验证 `ProfileData` 类型包含 `nickname` 和 `signature` 字段**

确认 `src/api/modules/profile.ts` 中 `ProfileData` 接口（第 12-28 行）已包含 `nickname: string` 和 `signature: string`。如果没有，需要补充。

- [ ] **Step 4: 同步更新 `handleSave` 以包含签名**

定位到第 162-186 行的 `handleSave` 函数，修改 `updateProfile` 调用：

```typescript
const result = await updateProfile({
	name: form.name,
	avatar: form.avatar,
	signature: form.signature
})
```

- [ ] **Step 5: 提交**

```bash
git add src/pages/profile/edit.vue
git commit -m "fix(wwwstoreapp): fix avatar upload in profile edit page

Previously chooseImage stored local temp path without uploading to server.
Now uploads via uploadAvatar API immediately after image selection.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R1-2: 修复意见反馈接入真实 API — `profile/feedback.vue`

**Files:** Modify `src/pages/profile/feedback.vue`

**问题:** `handleSubmit` 用 `setTimeout(1000)` 模拟提交，从未真正发送到后端。

- [ ] **Step 1: 添加 API 导入**

在 `<script setup>` 顶部（第 84 行之前）添加：

```typescript
import { post } from '@/api/request'
```

- [ ] **Step 2: 修改 `handleSubmit` 为真实 API 调用**

定位到第 102-120 行的 `handleSubmit` 函数，用以下代码替换：

```typescript
async function handleSubmit() {
	if (!canSubmit.value || submitting.value) return

	submitting.value = true
	
	try {
		await post('/mobile.Apply/feedback', {
			type: form.value.type,
			content: form.value.content,
			contact: form.value.contact || ''
		})
		
		uni.showToast({ title: '反馈提交成功，感谢！', icon: 'success' })
		
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	} catch {
		uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
	} finally {
		submitting.value = false
	}
}
```

- [ ] **Step 3: 提交**

```bash
git add src/pages/profile/feedback.vue
git commit -m "fix(wwwstoreapp): connect feedback form to real API

Replaces fake setTimeout mock with actual POST to /mobile.Apply/feedback.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R1-3: 修复 `pending-products.vue` Vue 2 过滤器语法

**Files:** Modify `src/pages/table/pending-products.vue`

**问题:** 第 29 行模板中使用 `| toFixed2` Vue 2 管道语法，Vue 3 不支持，运行时崩溃。

- [ ] **Step 1: 在 script 中添加 `formatPrice` 函数**

在 `<script setup>` 中，`formatTime` 函数后面（第 125 行之后）添加：

```typescript
function formatPrice(item: PendingProduct): string {
	const price = item.price || item.unit_price || 0
	const qty = item.quantity || 1
	return (price * qty).toFixed(2)
}
```

- [ ] **Step 2: 修改模板中的价格显示**

将第 29 行的：
```html
<text class="item-price">¥{{ (item.price || item.unit_price || 0) * (item.quantity || 1) | toFixed2 }}</text>
```
替换为：
```html
<text class="item-price">¥{{ formatPrice(item) }}</text>
```

- [ ] **Step 3: 提交**

```bash
git add src/pages/table/pending-products.vue
git commit -m "fix(wwwstoreapp): replace Vue 2 filter syntax with Vue 3 method

The | toFixed2 pipe syntax is not supported in Vue 3 and causes runtime error.
Replaced with formatPrice() function call.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R1-4: 修复 pending 页面缺失返回导航

**Files:** Modify `src/pages/table/pending-products.vue`, `src/pages/table/pending-assistants.vue`

**问题:** CSS 中定义了 `.page-header` `.back-btn` 样式，但模板中未渲染。用户没有返回按钮。

- [ ] **Step 1: 在 `pending-products.vue` 模板最顶部添加页头**

在 `<view class="page">` 之后、`<scroll-view>` 之前（第 2-3 行之间）插入：

```html
		<view class="page-header">
			<view class="back-btn" @click="goBack">
				<text class="back-arrow">‹</text>
			</view>
			<text class="page-title">点单提醒</text>
			<view class="header-right"></view>
		</view>
```

- [ ] **Step 2: 在 `pending-assistants.vue` 模板最顶部添加页头**

同样在 `<view class="page">` 之后、`<scroll-view>` 之前（第 2-3 行之间）插入：

```html
		<view class="page-header">
			<view class="back-btn" @click="goBack">
				<text class="back-arrow">‹</text>
			</view>
			<text class="page-title">上桌提醒</text>
			<view class="header-right"></view>
		</view>
```

- [ ] **Step 3: 提交**

```bash
git add src/pages/table/pending-products.vue src/pages/table/pending-assistants.vue
git commit -m "fix(wwwstoreapp): add back navigation header to pending pages

Page header CSS existed but no template markup was rendered.
Users previously had no way to navigate back from these pages.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R1-5: 修复生产环境 BASE_URL 配置

**Files:** Modify `src/config/env.ts`

**问题:** 生产环境 `BASE_URL` 硬编码为 `http://127.0.0.1:10002/storeapi`。

- [ ] **Step 1: 修改生产环境配置**

将第 7-11 行修改为使用生产域名：

```typescript
  production: {
    BASE_URL: 'https://poolapi.kyyp.cn/storeapi',
    APP_VERSION: '1.0.0',
    DEBUG: false
  }
```

- [ ] **Step 2: 提交**

```bash
git add src/config/env.ts
git commit -m "fix(wwwstoreapp): set production BASE_URL to poolapi.kyyp.cn

Was hardcoded to 127.0.0.1:10002 which would fail in production builds.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Round 2: P1 高优先级 Bug（预计 3-4 小时）

### Task R2-1: 修复打卡记录缺勤统计逻辑死锁 — `checkin/record.vue`

**Files:** Modify `src/pages/checkin/record.vue`

**问题:** `filteredRecords` 过滤掉了无 `checkin_time` 的记录，然后 `summary.absent` 从同一集合计数，永远为 0。

- [ ] **Step 1: 在过滤之前从原始记录计算 summary**

修改 `loadRecords` 函数中的数据加载逻辑。需要调整两个计算：

1. 在过滤之前先统计 absent
2. 同时修复 page_size=31 不够的问题

找到 `loadRecords` 函数。将 page_size 从 31 改为 100，并在过滤前计算 summary：

```typescript
async function loadRecords() {
	loading.value = true
	try {
		const result = await getCheckinRecords(1, 100)  // 从 31 改为 100
		if (result.code === 1 || result) {
			const allRecords = (result.data?.list || result.data || result.list || result || []) as CheckInRecord[]
			
			// 在过滤之前从全量数据计算 summary
			const monthStart = new Date(currentYear.value, currentMonthNum.value - 1, 1)
			const monthEnd = new Date(currentYear.value, currentMonthNum.value, 0)
			const monthRecords = allRecords.filter((r: any) => {
				const d = new Date(r.checkin_time || r.create_time)
				return d >= monthStart && d <= monthEnd
			})
			
			const checkedDays = new Set(monthRecords.map((r: any) => r.checkin_time?.slice(0, 10) || r.create_time?.slice(0, 10))).size
			const lateDays = monthRecords.filter((r: any) => r.is_late).length
			const absentDays = monthRecords.filter((r: any) => !r.checkin_time && !r.checkout_time).length
			const totalHours = monthRecords.reduce((sum: number, r: any) => {
				if (r.checkin_time && r.checkout_time) {
					return sum + (new Date(r.checkout_time).getTime() - new Date(r.checkin_time).getTime()) / 3600000
				}
				return sum
			}, 0)
			
			summary.value = {
				checkedDays,
				lateDays,
				absentDays,
				avgHours: checkedDays > 0 ? +(totalHours / checkedDays).toFixed(1) : 0
			}

			// 页面显示的过滤后记录（仅保留有 checkin_time 的）
			records.value = monthRecords.filter((r: any) => r.checkin_time)
		}
	} catch {
		// error handling stays the same
	} finally {
		loading.value = false
		refreshing.value = false
	}
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/checkin/record.vue
git commit -m "fix(wwwstoreapp): fix absent count logic and pagination in checkin records

- Compute summary.absent from unfiltered data before filtering out absent records
- Increase page_size from 31 to 100 to avoid pagination data loss

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R2-2: 助教订单详情页导航 — `AssistantHome.vue`

**Files:** Modify `src/pages/index/AssistantHome.vue`

**问题:** 已完成订单点击弹出 `showModal` 纯文本，应该跳转到订单详情页。

- [ ] **Step 1: 修改 `handleAssistantDetail` 函数**

定位到 `handleAssistantDetail` 函数（约第 223 行），将 `showModal` 替换为页面导航：

```typescript
function handleAssistantDetail(order: any) {
	uni.navigateTo({
		url: `/pages/orders/detail?order_id=${order.id || order.order_id}`
	})
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/index/AssistantHome.vue
git commit -m "fix(wwwstoreapp): navigate to order detail instead of text modal

Clicking completed assistant orders now navigates to /pages/orders/detail
instead of showing a plain-text summary modal.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R2-3: 清理 `checkin/index.vue` 定时器泄漏

**Files:** Modify `src/pages/checkin/index.vue`

**问题:** `setInterval` 每秒更新时钟，`onUnmounted` 未 `clearInterval`。

- [ ] **Step 1: 添加 `onUnmounted` 生命周期并清理定时器**

在 `<script setup>` 中，找到 `onMounted` 调用。在其后添加：

```typescript
import { ref, computed, onMounted, onUnmounted } from 'vue'

// 在 setup 中定义 timer 变量
const clockTimer = ref<ReturnType<typeof setInterval> | null>(null)

// 在 onMounted 中存储 timer 引用（修改现有的 setInterval 调用）
onMounted(() => {
	updateClock()
	clockTimer.value = setInterval(updateClock, 1000)
	loadCheckinStatus()
	loadMonthStats()
})

// 新增清理
onUnmounted(() => {
	if (clockTimer.value) {
		clearInterval(clockTimer.value)
		clockTimer.value = null
	}
})
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/checkin/index.vue
git commit -m "fix(wwwstoreapp): clear interval timer on checkin page unmount

Prevents memory leak from setInterval running after page navigation.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R2-4: 修复 `Header.vue` 事件监听泄漏

**Files:** Modify `src/components/Header.vue`

**问题:** `uni.$on('storeChange', ...)` 在模块作用域注册，永不清除。

- [ ] **Step 1: 将事件监听移入 `onMounted`/`onUnmounted` 生命周期**

修改 `<script setup>` 底部（第 62-68 行），将模块级 `uni.$on` 移入生命周期：

```typescript
onMounted(() => {
	loadStoreName()
	uni.$on('storeChange', loadStoreName)
})

onUnmounted(() => {
	uni.$off('storeChange', loadStoreName)
})
```

同时需要在 import 中添加 `onUnmounted`：

```typescript
import { ref, onMounted, onUnmounted } from 'vue'
```

并删除模块级的 `uni.$on` 调用（第 66-68 行）。

- [ ] **Step 2: 提交**

```bash
git add src/components/Header.vue
git commit -m "fix(wwwstoreapp): fix event listener leak in Header component

Move uni.$on('storeChange') from module scope to onMounted/onUnmounted
to properly clean up the event listener when component is destroyed.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R2-5: 修复 `TabBar.vue` 导航方式

**Files:** Modify `src/components/TabBar.vue`

**问题:** 使用 `uni.redirectTo` 导致无法正常返回。

- [ ] **Step 1: 将 `redirectTo` 改为 `switchTab`**

定位到第 52 行的 `handleTabClick` 函数：

```typescript
function handleTabClick(path: string) {
	if (currentPath.value === path) return
	uni.switchTab({ url: path })
}
```

如果 `switchTab` 不可用（页面未在 tabBar 中注册），改用 `reLaunch`：

```typescript
function handleTabClick(path: string) {
	if (currentPath.value === path) return
	// 使用 reLaunch 确保 tab 页面不会被压栈
	uni.reLaunch({ url: path })
}
```

- [ ] **Step 2: 提交**

```bash
git add src/components/TabBar.vue
git commit -m "fix(wwwstoreapp): replace redirectTo with reLaunch in TabBar

redirectTo prevents back navigation and accumulates page stack.
reLaunch clears the stack for proper tab switching behavior.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R2-6: 补全 `employee.ts` 和 `schedule.ts` API 类型标注

**Files:** Modify `src/api/modules/employee.ts`, `src/api/modules/schedule.ts`

**问题:** 全部函数返回 `Promise<any>`。

- [ ] **Step 1: 为 `employee.ts` 补全类型**

```typescript
import { get, post, del } from '@/api/request'

export interface EmployeeRecord {
	id: string
	name: string
	phone: string
	gender?: number
	avatar?: string
	id_card?: string
	role: string
	position?: string
	salary?: number
	status: number
	hire_date?: string
	leave_date?: string
	description?: string
	store_id?: string
	created_at?: string
	updated_at?: string
}

export interface EmployeeListResponse {
	list: EmployeeRecord[]
	total: number
	page: number
	page_size: number
}

export function getEmployeeList(params?: Record<string, unknown>): Promise<EmployeeListResponse> {
	return get('/employee.Employee/lists', params)
}

export function getEmployeeDetail(id: string): Promise<EmployeeRecord> {
	return get('/employee.Employee/detail', { id })
}

export function createEmployee(params: Record<string, unknown>): Promise<{ id: string }> {
	return post('/employee.Employee/create', params)
}

export function updateEmployee(id: string, params: Record<string, unknown>): Promise<{ msg: string }> {
	return post('/employee.Employee/update', { ...params, id })
}

export function deleteEmployee(id: string): Promise<{ msg: string }> {
	return del('/employee.Employee/delete', { id })
}
```

- [ ] **Step 2: 为 `schedule.ts` 补全类型**

```typescript
import { get, post, del } from '@/api/request'
import type { ScheduleRecord } from '@/types'

export interface ScheduleListResponse {
	list: ScheduleRecord[]
	total: number
}

export function getMySchedule(week?: number): Promise<{ list: ScheduleRecord[] }> {
	return get('/mobile.Schedule/mySchedule', { week: week ?? 0 })
}

export function getScheduleList(params?: Record<string, unknown>): Promise<ScheduleListResponse> {
	return get('/employee.Employee/schedules', params)
}

export function createSchedule(params: Record<string, unknown>): Promise<{ id: string }> {
	return post('/employee.Employee/createSchedule', params)
}

export function updateSchedule(id: string, params: Record<string, unknown>): Promise<{ msg: string }> {
	return post('/employee.Employee/updateSchedule', { ...params, id })
}

export function deleteSchedule(id: string): Promise<{ msg: string }> {
	return del('/employee.Employee/deleteSchedule', { id })
}
```

- [ ] **Step 3: 提交**

```bash
git add src/api/modules/employee.ts src/api/modules/schedule.ts
git commit -m "fix(wwwstoreapp): add TypeScript types to employee and schedule API modules

Replaces Promise<any> return types with proper typed interfaces.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Round 3: P2 功能缺口补充（预计 4-6 小时）

### Task R3-1: 实现忘记密码流程

**Files:** Modify `src/pages/login/index.vue`

**问题:** "忘记密码"仅弹 Toast 提示联系管理员。

- [ ] **Step 1: 添加密码重置表单状态**

在 `<script setup>` 中添加：

```typescript
const showResetPassword = ref(false)
const resetForm = reactive({
	phone: '',
	code: '',
	newPassword: ''
})
const resetting = ref(false)
```

- [ ] **Step 2: 添加发送短信和重置密码的处理函数**

```typescript
import { sendSmsCode, resetPassword } from '@/api/modules/auth'

async function handleSendResetCode() {
	if (!/^1[3-9]\d{9}$/.test(resetForm.phone)) {
		uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
		return
	}
	try {
		await sendSmsCode(resetForm.phone)
		uni.showToast({ title: '验证码已发送', icon: 'success' })
	} catch {
		uni.showToast({ title: '发送失败，请稍后重试', icon: 'none' })
	}
}

async function handleResetPassword() {
	if (!resetForm.code || resetForm.newPassword.length < 6) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	resetting.value = true
	try {
		await resetPassword({
			phone: resetForm.phone,
			code: resetForm.code,
			password: resetForm.newPassword
		})
		uni.showToast({ title: '密码重置成功，请登录', icon: 'success' })
		showResetPassword.value = false
	} catch {
		uni.showToast({ title: '重置失败，请稍后重试', icon: 'none' })
	} finally {
		resetting.value = false
	}
}
```

- [ ] **Step 3: 修改 `handleForgotPassword` 函数**

将原来的 Toast 替换为显示重置密码表单：

```typescript
function handleForgotPassword() {
	showResetPassword.value = true
	resetForm.phone = form.phone  // 预填当前输入的手机号
}
```

- [ ] **Step 4: 在模板中添加密码重置弹窗**

在登录表单之后添加重置密码的弹出层（类似现有的登录卡片布局）。

- [ ] **Step 5: 确认后端 `/auth.Auth/resetPassword` 接口存在**

验证 `wwwapi/app/storeapi/controller/auth/AuthController::resetPassword()` 方法已实现。

- [ ] **Step 6: 提交**

```bash
git add src/pages/login/index.vue
git commit -m "feat(wwwstoreapp): implement forgot password reset flow

Adds SMS verification code + new password form for password reset,
replacing the previous stub that just showed a toast.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R3-2: 实现修改密码功能

**Files:** Modify `src/pages/settings/index.vue`

**问题:** "修改密码"弹 Toast "功能开发中"。

- [ ] **Step 1: 添加修改密码弹窗**

在 `<script setup>` 中添加：

```typescript
import { changePassword } from '@/api/modules/auth'

const showChangePassword = ref(false)
const passwordForm = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})
const changingPassword = ref(false)

async function handleChangePassword() {
	if (!passwordForm.oldPassword || !passwordForm.newPassword) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	if (passwordForm.newPassword.length < 6) {
		uni.showToast({ title: '新密码至少6位', icon: 'none' })
		return
	}
	if (passwordForm.newPassword !== passwordForm.confirmPassword) {
		uni.showToast({ title: '两次密码不一致', icon: 'none' })
		return
	}
	changingPassword.value = true
	try {
		await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
		uni.showToast({ title: '密码修改成功', icon: 'success' })
		showChangePassword.value = false
		passwordForm.oldPassword = ''
		passwordForm.newPassword = ''
		passwordForm.confirmPassword = ''
	} catch {
		uni.showToast({ title: '修改失败，请检查原密码', icon: 'none' })
	} finally {
		changingPassword.value = false
	}
}
```

- [ ] **Step 2: 将 `goToChangePassword` 改为打开弹窗**

```typescript
function goToChangePassword() {
	showChangePassword.value = true
}
```

- [ ] **Step 3: 在模板中添加密码修改弹窗**

在现有设置页面中添加一个底部弹出层，包含旧密码、新密码、确认密码三个输入框和提交按钮。

- [ ] **Step 4: 提交**

```bash
git add src/pages/settings/index.vue
git commit -m "feat(wwwstoreapp): implement change password functionality

Replaces the 'under development' stub with a working password change
modal with old/new/confirm password fields and validation.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R3-3: 修复帮助页硬编码联系方式

**Files:** Modify `src/pages/profile/help.vue`

- [ ] **Step 1: 将硬编码联系信息改为从门店数据获取**

在 `<script setup>` 中添加：

```typescript
import { storeStore } from '@/stores/store'
import { computed } from 'vue'

const storePhone = computed(() => storeStore.currentStore?.phone || '请查看门店信息')
const storeAddress = computed(() => storeStore.currentStore?.address || '')
```

- [ ] **Step 2: 替换模板中的硬编码内容**

将 `138-xxxx-xxxx` 替换为 `{{ storePhone }}`，将 `admin@example.com` 替换为门店实际数据。

- [ ] **Step 3: 提交**

```bash
git add src/pages/profile/help.vue
git commit -m "fix(wwwstoreapp): use real store contact info in help page

Replaces hardcoded demo phone/email with actual store data from storeStore.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R3-4: 实现排行榜查看全部

**Files:** Modify `src/pages/performance/index.vue`

**问题:** `viewAllRanking()` 弹出 Toast "暂无更多排行"。

- [ ] **Step 1: 修改 `viewAllRanking` 函数，加载更多排行榜数据**

```typescript
const showAllRanking = ref(false)
const allRankings = ref<RankingItem[]>([])

async function viewAllRanking() {
	if (allRankings.value.length > 0) {
		showAllRanking.value = true
		return
	}
	try {
		const result = await getRanking()
		allRankings.value = result.list || result.rankings || []
	} catch {
		allRankings.value = []
	}
	showAllRanking.value = true
}
```

- [ ] **Step 2: 添加全部排行榜弹窗**

在模板中添加一个底部弹出层展示完整排行榜列表。

- [ ] **Step 3: 提交**

```bash
git add src/pages/performance/index.vue
git commit -m "feat(wwwstoreapp): implement full ranking view in performance page

Replaces the stub toast with a modal showing the complete ranking list.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task R3-5: 通知开关持久化

**Files:** Modify `src/pages/settings/index.vue`

**问题:** 通知开关仅内存状态，刷新后丢失。

- [ ] **Step 1: 修改 toggle handler 持久化到本地存储**

```typescript
const notificationEnabled = ref(uni.getStorageSync('notificationEnabled') !== false)

function toggleNotification() {
	notificationEnabled.value = !notificationEnabled.value
	uni.setStorageSync('notificationEnabled', notificationEnabled.value)
	uni.showToast({ 
		title: notificationEnabled.value ? '通知已开启' : '通知已关闭', 
		icon: 'success' 
	})
}
```

- [ ] **Step 2: 提交**

```bash
git add src/pages/settings/index.vue
git commit -m "fix(wwwstoreapp): persist notification toggle to local storage

Toggle state now survives page refresh by reading/writing uni storage.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## 验证清单

每轮完成后运行以下验证：

### Round 1 验证
- [ ] `profile/edit.vue`: 选择头像 → 显示 loading → toast "头像已更新" → 保存成功
- [ ] `profile/feedback.vue`: 填写反馈 → 提交 → API 调用 → 成功 toast
- [ ] `table/pending-products.vue`: 页面正常渲染，价格正确显示 2 位小数，有返回按钮
- [ ] `table/pending-assistants.vue`: 页面有返回按钮可返回上一页
- [ ] 生产构建 `BASE_URL` 指向 `poolapi.kyyp.cn`

### Round 2 验证
- [ ] `checkin/record.vue`: 缺勤天数正确显示非零值
- [ ] `AssistantHome.vue`: 点击已完成订单跳转到 `/pages/orders/detail`
- [ ] `checkin/index.vue`: 多次进入/退出页面无内存增长
- [ ] `Header.vue`: 切换门店后 storeName 更新且无重复监听
- [ ] `TabBar.vue`: Tab 切换使用 reLaunch 正常跳转
- [ ] TypeScript: employee.ts 和 schedule.ts 无 `any` 返回类型

### Round 3 验证
- [ ] 登录页可进入忘记密码流程，发送验证码，重置密码
- [ ] 设置页可修改密码，旧密码/新密码/确认密码完整校验
- [ ] 帮助页显示真实门店电话而非 `138-xxxx-xxxx`
- [ ] 业绩页可查看完整排行榜
- [ ] 通知开关关闭后再打开 APP 状态保持不变

---

## 变更统计

| 轮次 | 任务数 | 修改文件 | 新增代码行（估） |
|------|--------|----------|-----------------|
| Round 1 (P0) | 5 | 5 | ~80 |
| Round 2 (P1) | 6 | 6 | ~120 |
| Round 3 (P2) | 5 | 4 | ~200 |
| **合计** | **16** | **~12** | **~400** |
