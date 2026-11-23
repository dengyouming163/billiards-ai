<template>
	<view class="page">

		<StateView
			:loading="loading"
			:error="hasError"
			error-msg="加载失败"
			@retry="loadEmployeeDetail"
		>
			<scroll-view v-if="!loading" scroll-y class="form-scroll" :style="{ height: scrollHeight }">
				<view class="form-container">

					<view class="section-card">
						<view class="section-header">
							<text class="section-title">基本信息</text>
						</view>

						<view class="status-badge-row">
							<view class="status-badge" :class="form.status === 'active' ? 'active' : 'inactive'">
								<text>{{ form.status === 'active' ? '在职' : '离职' }}</text>
							</view>
						</view>

						<view class="form-item">
							<text class="form-label required">姓名</text>
							<input
								v-model="form.name"
								class="form-input"
								placeholder="请输入员工姓名"
								maxlength="20"
							/>
						</view>

						<view class="form-item">
							<text class="form-label required">手机号</text>
							<input
								v-model="form.phone"
								class="form-input"
								type="number"
								placeholder="请输入手机号"
								maxlength="11"
							/>
						</view>

						<view class="form-item">
							<text class="form-label required">角色</text>
							<picker mode="selector" :range="roleLabels" @change="onRoleChange" :value="roleIndex">
								<view class="picker-display" :class="{ active: form.role }">
									<text v-if="form.role" class="picker-chip">{{ roleLabel }}</text>
									<text v-else class="picker-placeholder">请选择角色</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>

						<view class="form-item">
							<text class="form-label">性别</text>
							<picker mode="selector" :range="genderOptions" @change="onGenderChange" :value="genderIndex">
								<view class="picker-display" :class="{ active: form.gender !== '' }">
									<text v-if="form.gender !== ''" class="picker-chip">{{ genderLabel }}</text>
									<text v-else class="picker-placeholder">请选择性别</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>
					</view>

					<view class="section-card">
						<view class="section-header">
							<text class="section-title">工作信息</text>
						</view>

						<view class="form-item">
							<text class="form-label">身份证号</text>
							<input
								v-model="form.id_card"
								class="form-input"
								placeholder="请输入身份证号（选填）"
								maxlength="18"
							/>
						</view>

						<view class="form-item">
							<text class="form-label">职位</text>
							<input
								v-model="form.position"
								class="form-input"
								placeholder="请输入职位（选填）"
								maxlength="30"
							/>
						</view>

						<view class="form-item">
							<text class="form-label">月薪</text>
							<view class="input-with-suffix">
								<input
									v-model="form.salary"
									class="form-input suffix-input"
									type="digit"
									placeholder="请输入月薪（选填）"
									maxlength="10"
								/>
								<text class="input-suffix">元</text>
							</view>
						</view>

						<view class="form-item">
							<text class="form-label">入职日期</text>
							<picker mode="date" @change="onHireDateChange" :value="form.hire_date" :start="'2000-01-01'" :end="todayStr">
								<view class="picker-display" :class="{ active: form.hire_date }">
									<text v-if="form.hire_date" class="picker-chip">{{ form.hire_date }}</text>
									<text v-else class="picker-placeholder">请选择入职日期</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>
					</view>

					<view class="section-card">
						<view class="section-header">
							<text class="section-title">备注</text>
						</view>

						<view class="form-item textarea-item">
							<textarea
								v-model="form.description"
								class="form-textarea"
								placeholder="请输入备注信息（选填）"
								maxlength="200"
								auto-height
								:maxlength="200"
							/>
							<text class="textarea-count">{{ (form.description || '').length }}/200</text>
						</view>
					</view>

					<view class="submit-area">
						<button class="btn-submit" :loading="submitting" @click="handleSubmit">
							保存修改
						</button>
					</view>

				</view>
			</scroll-view>
		</StateView>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getEmployeeDetail, updateEmployee } from '@/api/modules/employee'
import StateView from '@/components/StateView.vue'

const loading = ref(true)
const submitting = ref(false)
const hasError = ref(false)
const employeeId = ref('')
const scrollHeight = ref('auto')

const todayStr = new Date().toISOString().split('T')[0]

const form = reactive({
	name: '',
	phone: '',
	role: '',
	status: '',
	gender: '',
	id_card: '',
	position: '',
	salary: '',
	hire_date: '',
	description: ''
})

const roleOptions = [
	{ value: 'boss', label: '老板' },
	{ value: 'manager', label: '经理' },
	{ value: 'finance', label: '财务' },
	{ value: 'coach', label: '教练' },
	{ value: 'cashier', label: '收银员' },
	{ value: 'assistant', label: '助教' },
	{ value: 'waiter', label: '服务员' }
]

const genderOptions = ['未知', '男', '女']

const roleLabels = computed(() => roleOptions.map(item => item.label))
const roleIndex = computed(() => {
	const idx = roleOptions.findIndex(item => item.value === form.role)
	return idx >= 0 ? idx : 0
})
const roleLabel = computed(() => {
	const found = roleOptions.find(item => item.value === form.role)
	return found ? found.label : ''
})

const genderIndex = computed(() => {
	if (form.gender === '0') return 0
	if (form.gender === '1') return 1
	if (form.gender === '2') return 2
	return 0
})
const genderLabel = computed(() => genderOptions[genderIndex.value])

function onRoleChange(e: any) {
	const index = e.detail.value
	form.role = roleOptions[index].value
}

function onGenderChange(e: any) {
	const index = e.detail.value
	form.gender = String(index)
}

function onHireDateChange(e: any) {
	form.hire_date = e.detail.value
}

function handleBack() {
	uni.navigateBack()
}

onMounted(() => {
	const sysInfo = uni.getSystemInfoSync()
	scrollHeight.value = `${sysInfo.windowHeight}px`

	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1] as any
	const options = currentPage?.options || {}

	if (options.id) {
		employeeId.value = options.id
		loadEmployeeDetail()
	} else {
		uni.showToast({ title: '参数错误', icon: 'none' })
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	}
})

async function loadEmployeeDetail() {
	loading.value = true
	hasError.value = false
	try {
		const result = await getEmployeeDetail(employeeId.value)
		form.name = result.name || ''
		form.phone = result.phone || ''
		form.role = result.role || ''
		form.status = result.status === 1 ? 'active' : 'inactive'
		form.gender = String(result.gender ?? '')
		form.id_card = result.id_card || ''
		form.position = result.position || ''
		form.salary = result.salary != null ? String(result.salary) : ''
		form.hire_date = result.hire_date || ''
		form.description = result.description || ''
	} catch (e: any) {
		console.error('加载员工详情失败', e)
		hasError.value = true
	} finally {
		loading.value = false
	}
}

async function handleSubmit() {
	if (!form.name.trim()) {
		uni.showToast({ title: '请输入员工姓名', icon: 'none' })
		return
	}

	if (!form.phone.trim()) {
		uni.showToast({ title: '请输入手机号', icon: 'none' })
		return
	}

	if (!/^1[3-9]\d{9}$/.test(form.phone)) {
		uni.showToast({ title: '手机号格式不正确', icon: 'none' })
		return
	}

	if (!form.role) {
		uni.showToast({ title: '请选择角色', icon: 'none' })
		return
	}

	submitting.value = true

	try {
		const params: Record<string, any> = {
			name: form.name.trim(),
			phone: form.phone.trim(),
			role: form.role,
			gender: form.gender,
			id_card: form.id_card.trim(),
			position: form.position.trim(),
			salary: form.salary.trim(),
			hire_date: form.hire_date,
			description: form.description.trim()
		}

		await updateEmployee(employeeId.value, params)
		uni.showToast({ title: '更新成功', icon: 'success' })
		setTimeout(() => {
			uni.navigateBack()
		}, 1500)
	} catch (error: any) {
		uni.showToast({ title: error.msg || error.message || '更新失败', icon: 'none' })
	} finally {
		submitting.value = false
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	max-width: 100vw;
	overflow-x: hidden;
	background: $color-bg-page;
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	width: 100%;
}

.nav-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	padding: 0 $space-md;
	background: $color-bg-card;
	border-bottom: 1rpx solid $color-border-light;
	position: relative;
	z-index: 10;
	flex-shrink: 0;
}

.nav-back {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.nav-back-icon {
	font-size: 48rpx;
	color: $color-primary;
	font-weight: 500;
	line-height: 1;
}

.nav-title {
	font-size: $font-subtitle;
	font-weight: $font-weight-semibold;
	color: $color-text-primary;
}

.nav-placeholder {
	width: 64rpx;
}

.form-scroll {
	flex: 1;
}

.form-container {
	padding: $space-md $space-lg $space-xl;
}

.section-card {
	background: $color-bg-card;
	border-radius: $radius-lg;
	box-shadow: $shadow-card;
	padding: $space-md;
	margin-bottom: $space-sm;
}

.section-header {
	margin-bottom: $space-md;
	padding-bottom: $space-sm;
	border-bottom: 2rpx solid $color-border-light;
}

.section-title {
	font-size: 30rpx;
	font-weight: $font-weight-semibold;
	color: $color-text-primary;
	position: relative;
	padding-left: 20rpx;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 6rpx;
		height: 28rpx;
		background: $color-primary;
		border-radius: 3rpx;
	}
}

.status-badge-row {
	display: flex;
	justify-content: flex-end;
	margin-bottom: $space-xs;
}

.status-badge {
	padding: 8rpx 28rpx;
	border-radius: 24rpx;
	font-size: 24rpx;
	font-weight: 600;

	&.active {
		background: rgba($color-primary, 0.1);
		color: $color-primary;
	}

	&.inactive {
		background: #f5f5f5;
		color: #9e9e9e;
	}
}

.form-item {
	margin-bottom: $space-md;

	&:last-child {
		margin-bottom: 0;
	}
}

.textarea-item {
	position: relative;
}

.form-label {
	display: block;
	font-size: 28rpx;
	color: $color-text-secondary;
	margin-bottom: $space-xs;
	font-weight: $font-weight-medium;

	&.required::before {
		content: '*';
		color: $color-danger;
		margin-right: 6rpx;
		font-weight: $font-weight-bold;
	}
}

.form-input {
	width: 100%;
	height: 88rpx;
	background: $color-bg-page;
	border: 2rpx solid $color-border-light;
	border-radius: 20rpx;
	padding: 0 $space-md;
	font-size: 30rpx;
	color: $color-text-primary;
	box-sizing: border-box;
	transition: border-color 0.2s ease;

	&::placeholder {
		color: $color-text-muted;
	}

	&:focus {
		border-color: $color-primary;
	}
}

.input-with-suffix {
	position: relative;
	display: flex;
	align-items: center;
}

.suffix-input {
	padding-right: 60rpx;
}

.input-suffix {
	position: absolute;
	right: $space-md;
	font-size: 28rpx;
	color: $color-text-secondary;
	pointer-events: none;
}

.picker-display {
	min-height: 88rpx;
	background: $color-bg-page;
	border: 2rpx solid $color-border-light;
	border-radius: 20rpx;
	padding: 0 $space-md;
	display: flex;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	transition: border-color 0.2s ease;

	&.active {
		border-color: $color-primary-light;
	}

	&:active {
		border-color: $color-primary;
	}
}

.picker-chip {
	font-size: 30rpx;
	color: $color-text-primary;
	font-weight: $font-weight-medium;
	background: $color-primary-light;
	padding: 8rpx 24rpx;
	border-radius: $radius-sm;
}

.picker-placeholder {
	font-size: 30rpx;
	color: $color-text-muted;
}

.picker-arrow {
	font-size: 32rpx;
	color: $color-text-muted;
	transform: rotate(90deg);
	font-weight: 300;
}

.form-textarea {
	width: 100%;
	min-height: 160rpx;
	background: $color-bg-page;
	border: 2rpx solid $color-border-light;
	border-radius: 20rpx;
	padding: $space-md;
	font-size: 30rpx;
	color: $color-text-primary;
	box-sizing: border-box;
	transition: border-color 0.2s ease;

	&::placeholder {
		color: $color-text-muted;
	}

	&:focus {
		border-color: $color-primary;
	}
}

.textarea-count {
	position: absolute;
	right: $space-md;
	bottom: $space-sm;
	font-size: 24rpx;
	color: $color-text-muted;
}

.submit-area {
	padding-top: $space-md;
	padding-bottom: env(safe-area-inset-bottom);
}

.btn-submit {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, $color-primary, $color-primary-dark);
	border-radius: 20rpx;
	font-size: 32rpx;
	font-weight: $font-weight-semibold;
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	box-shadow: 0 8rpx 24rpx rgba($color-primary, 0.35);

	&::after {
		border: none;
	}

	&:active {
		opacity: 0.9;
		transform: scale(0.98);
	}
}
</style>
