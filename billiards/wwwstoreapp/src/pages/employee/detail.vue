<template>
	<view class="page">
		<StateView
			:loading="loading"
			:error="hasError"
			:empty="!employee && !loading && !hasError"
			empty-msg="员工不存在或已被删除"
			error-msg="加载失败"
			@retry="loadDetail"
		>
			<scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false" v-if="employee">
				<view class="hero-card">
					<view class="hero-glow" />
					<view class="hero-pattern" />
					<view class="hero-status-pill" :class="employee.status === 1 ? 'active' : 'inactive'">
						<text class="hero-status-dot" />
						<text class="hero-status-text">{{ employee.status === 1 ? '在职' : '离职' }}</text>
					</view>
					<text class="hero-name">{{ employee.name || '未设置' }}</text>
					<view class="hero-role-pill">
						<text class="hero-role-text">{{ getRoleLabel(employee.role) }}</text>
					</view>
					<text class="hero-phone">{{ employee.phone || '-' }}</text>
				</view>

				<view class="section-card">
					<view class="section-title-row">
						<view class="section-accent" />
						<text class="section-title">基本信息</text>
					</view>
					<view class="info-grid">
						<view class="info-item">
							<text class="info-label">姓名</text>
							<text class="info-value">{{ employee.name || '-' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">手机号</text>
							<text class="info-value">{{ employee.phone || '-' }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">角色</text>
							<text class="info-value">{{ getRoleLabel(employee.role) }}</text>
						</view>
						<view class="info-item">
							<text class="info-label">性别</text>
							<text class="info-value">{{ getGenderText(employee.gender) }}</text>
						</view>
						<view class="info-item" v-if="employee.id_card">
							<text class="info-label">身份证号</text>
							<text class="info-value">{{ employee.id_card }}</text>
						</view>
						<view class="info-item" v-if="employee.position">
							<text class="info-label">职位</text>
							<text class="info-value">{{ employee.position }}</text>
						</view>
						<view class="info-item" v-if="employee.salary != null && employee.salary !== ''">
							<text class="info-label">薪资</text>
							<text class="info-value">¥{{ $num(employee.salary).toFixed(2) }}</text>
						</view>
						<view class="info-item" v-if="employee.hire_date">
							<text class="info-label">入职日期</text>
							<text class="info-value">{{ formatDate(employee.hire_date) }}</text>
						</view>
						<view class="info-item" v-if="employee.leave_date">
							<text class="info-label">离职日期</text>
							<text class="info-value">{{ formatDate(employee.leave_date) }}</text>
						</view>
						<view class="info-item full-width" v-if="employee.description">
							<text class="info-label">备注</text>
							<text class="info-value">{{ employee.description }}</text>
						</view>
					</view>
				</view>

				<view class="section-card action-card">
					<view class="section-title-row">
						<view class="section-accent" />
						<text class="section-title">操作按钮</text>
					</view>
					<view class="action-btns">
						<view class="btn-edit" @click="goEdit">
							<text class="btn-icon">✏️</text>
							<text class="btn-text">编辑信息</text>
						</view>
						<view class="btn-delete" @click="handleDelete">
							<text class="btn-icon">🗑</text>
							<text class="btn-text">删除员工</text>
						</view>
					</view>
				</view>

				<view class="bottom-safe" />
			</scroll-view>
		</StateView>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getEmployeeDetail, deleteEmployee } from '@/api/modules/employee'
import type { Employee } from '@/types'
import StateView from '@/components/StateView.vue'
''

const id = ref('')
const employee = ref<Employee | null>(null)
const loading = ref(true)
const hasError = ref(false)

function $num(v: any): number {
	const n = Number(v)
	return isNaN(n) ? 0 : n
}

onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1] as any
	id.value = currentPage.options?.id || ''
	loadDetail()
})

function loadDetail() {
	if (!id.value) return
	loading.value = true
	hasError.value = false

	getEmployeeDetail(id.value)
		.then((res: any) => {
			employee.value = res
		})
		.catch((e: any) => {
			console.error('加载员工详情失败', e)
			hasError.value = true
		})
		.finally(() => {
			loading.value = false
		})
}

const ROLE_LABEL_MAP: Record<string, string> = {
	boss: '老板',
	manager: '经理',
	finance: '财务',
	coach: '教练',
	cashier: '收银员',
	assistant: '助教',
	waiter: '服务员'
}

function getRoleLabel(role: string): string {
	return ROLE_LABEL_MAP[role] || role || '未知'
}

function getGenderText(gender?: number): string {
	if (gender === undefined || gender === null) return '-'
	const map: Record<number, string> = {
		0: '未知',
		1: '男',
		2: '女'
	}
	return map[gender] || '未知'
}

function formatDate(dateStr: string): string {
	if (!dateStr) return '-'
	const d = new Date(dateStr.replace('T', ' '))
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function goEdit() {
	if (!employee.value?.id) return
	uni.navigateTo({ url: `/pages/employee/edit?id=${employee.value.id}` })
}

function handleDelete() {
	if (!employee.value?.id) return

	uni.showModal({
		title: '确认删除',
		content: '确定要删除该员工吗？删除后数据无法恢复。',
		confirmColor: '#dc2626',
		success: async (res) => {
			if (res.confirm) {
				try {
					await deleteEmployee(employee.value!.id)
					uni.showToast({ title: '删除成功', icon: 'success' })
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (e: any) {
					uni.showToast({ title: e.msg || '删除失败', icon: 'none' })
				}
			}
		}
	})
}

function goBack() {
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	max-width: 100vw;
	overflow-x: hidden;
	background: #f7f7f7;
	display: flex;
	flex-direction: column;
	padding: 0 24rpx;
	box-sizing: border-box;
	width: 100%;
}

.header-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 32rpx;
	padding-top: calc(20rpx + env(safe-area-inset-top));
	background: #ffffff;
	position: relative;
	z-index: 10;

	&::after {
		content: '';
		position: absolute;
		left: 32rpx;
		right: 32rpx;
		bottom: 0;
		height: 1rpx;
		background: #e5e5e5;
		transform: scaleY(0.5);
	}
}

.back-btn {
	display: flex;
	align-items: center;
	gap: 6rpx;
	font-size: 26rpx;
	color: #07C160;
	font-weight: 500;
	padding: 8rpx 4rpx;
	transition: opacity 200ms ease-out;

	&:active {
		opacity: 0.6;
	}
}

.back-icon {
	font-size: 40rpx;
	font-weight: 600;
	line-height: 1;
}

.header-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #333333;
	letter-spacing: 1rpx;
}

.header-placeholder {
	width: 100rpx;
}

.content-scroll {
	flex: 1;
	overflow-x: hidden;
	padding: 20rpx 0;
	width: 100%;
	box-sizing: border-box;
}

.hero-card {
	position: relative;
	overflow: hidden;
	background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
	border-radius: 16rpx;
	padding: 52rpx 36rpx 48rpx;
	margin-bottom: 16rpx;
	text-align: center;
	box-shadow:
		0 8rpx 32rpx rgba(7, 193, 96, 0.2),
		0 2rpx 8rpx rgba(7, 193, 96, 0.1);
}

.hero-glow {
	position: absolute;
	width: 280rpx;
	height: 280rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
	top: -80rpx;
	right: -60rpx;
	pointer-events: none;
}

.hero-pattern {
	position: absolute;
	inset: 0;
	background-image:
		radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.06) 0%, transparent 50%),
		radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
	pointer-events: none;
}

.hero-status-pill {
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10rpx;
	padding: 10rpx 28rpx;
	border-radius: 40rpx;
	margin-bottom: 24rpx;
	backdrop-filter: blur(12px);
	-webkit-backdrop-filter: blur(12px);
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	background: rgba(255, 255, 255, 0.2);
	z-index: 1;

	&.active {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.25);
	}

	&.inactive {
		background: rgba(239, 68, 68, 0.25);
		border-color: rgba(239, 68, 68, 0.35);
	}
}

.hero-status-dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: #fff;
	flex-shrink: 0;

	.inactive & {
		background: #ffd1d1;
	}
}

.hero-status-text {
	font-size: 24rpx;
	font-weight: 600;
	color: #fff;
	letter-spacing: 2rpx;
}

.hero-name {
	display: block;
	font-size: 44rpx;
	font-weight: 800;
	color: #fff;
	margin-bottom: 16rpx;
	letter-spacing: 1rpx;
	position: relative;
	z-index: 1;
	text-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.1);
}

.hero-role-pill {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 8rpx 28rpx;
	border-radius: 40rpx;
	background: rgba(255, 255, 255, 0.2);
	border: 1rpx solid rgba(255, 255, 255, 0.3);
	margin-bottom: 16rpx;
	position: relative;
	z-index: 1;
	backdrop-filter: blur(6px);
	-webkit-backdrop-filter: blur(6px);
}

.hero-role-text {
	font-size: 24rpx;
	font-weight: 600;
	color: #fff;
	letter-spacing: 1rpx;
}

.hero-phone {
	display: block;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.8);
	position: relative;
	z-index: 1;
	letter-spacing: 1rpx;
}

.section-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 30rpx 28rpx;
	margin-bottom: 16rpx;
	box-shadow:
		0 2rpx 12rpx rgba(0, 0, 0, 0.05);
	border: 1rpx solid #e5e5e5;
	transition: transform 200ms ease-out, box-shadow 200ms ease-out;

	&:active {
		transform: scale(0.99);
	}
}

.action-card {
	padding: 20rpx 28rpx;
}

.section-title-row {
	display: flex;
	align-items: center;
	gap: 14rpx;
	margin-bottom: 24rpx;
}

.section-accent {
	width: 6rpx;
	height: 28rpx;
	border-radius: 3rpx;
	background: #07C160;
	flex-shrink: 0;
}

.section-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #333333;
	letter-spacing: 1rpx;
}

.info-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0 32rpx;
}

.info-item {
	width: calc(50% - 16rpx);
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	padding: 18rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	transition: background 200ms ease-out;

	&:active {
		background: #f7f7f7;
		border-radius: 12rpx;
		padding-left: 12rpx;
		padding-right: 12rpx;
	}

	&:nth-last-child(-n+2) {
		border-bottom: none;
	}

	&.full-width {
		width: 100%;

		&:nth-last-child(-n+1) {
			border-bottom: none;
		}
	}

	&:only-child {
		width: 100%;
		border-bottom: none;
	}
}

.info-label {
	font-size: 22rpx;
	color: #999999;
	font-weight: 400;
}

.info-value {
	font-size: 26rpx;
	color: #333333;
	font-weight: 500;
	word-break: break-all;
}

.action-btns {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.btn-edit,
.btn-delete {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	padding: 24rpx 0;
	border-radius: 20rpx;
	transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.btn-edit {
	background: linear-gradient(135deg, rgba(7, 193, 96, 0.1), rgba(6, 173, 86, 0.1));
	border: 2rpx solid rgba(7, 193, 96, 0.3);
	box-shadow:
		0 4rpx 16rpx rgba(7, 193, 96, 0.1),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.8);

	&:active {
		transform: scale(0.97);
		box-shadow:
			0 2rpx 8rpx rgba(7, 193, 96, 0.08),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	}
}

.btn-delete {
	background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.15));
	border: 2rpx solid rgba($color-danger, 0.3);
	box-shadow:
		0 4rpx 16rpx rgba(220, 38, 38, 0.08),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.6);

	&:active {
		transform: scale(0.97);
		box-shadow:
			0 2rpx 8rpx rgba(220, 38, 38, 0.05),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.6);
	}
}

.btn-icon {
	font-size: 28rpx;
	line-height: 1;
}

.btn-text {
	font-size: 29rpx;
	font-weight: 700;
	letter-spacing: 1rpx;
}

.btn-edit .btn-text {
	color: #07C160;
}

.btn-delete .btn-text {
	color: #dc2626;
}

.bottom-safe {
	height: calc(60rpx + env(safe-area-inset-bottom));
}
</style>
