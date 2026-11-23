<template>
	<view class="page">
		<view class="detail-container" v-if="detail">
			<view class="header-card">
				<view class="type-name">{{ detail.type_name }}</view>
				<view class="status-badge" :class="detail.status">
					<text>{{ detail.status_text }}</text>
				</view>
			</view>

			<view class="info-card">
				<view class="info-item">
					<text class="label">申请人</text>
					<text class="value">{{ detail.employee_name }}</text>
				</view>
				<view class="info-item">
					<text class="label">申请时间</text>
					<text class="value">{{ detail.create_time }}</text>
				</view>
			</view>

			<view class="reason-card">
				<view class="section-title">申请理由</view>
				<text class="reason-text">{{ detail.reason }}</text>
			</view>

			<view class="extra-card" v-if="detail.extra_data && Object.keys(detail.extra_data).length > 0">
				<view class="section-title">详细信息</view>
				<view class="extra-item" v-for="(value, key) in detail.extra_data" :key="key">
					<text class="extra-label">{{ formatKey(key) }}</text>
					<text class="extra-value">{{ value }}</text>
				</view>
			</view>

			<view class="approve-card" v-if="detail.status !== 'pending'">
				<view class="section-title">审批结果</view>
				<view class="info-item">
					<text class="label">审批人</text>
					<text class="value">{{ detail.approver_name || '无' }}</text>
				</view>
				<view class="info-item">
					<text class="label">审批时间</text>
					<text class="value">{{ detail.approve_time || '无' }}</text>
				</view>
				<view class="info-item" v-if="detail.approve_remark">
					<text class="label">审批意见</text>
					<text class="value">{{ detail.approve_remark }}</text>
				</view>
			</view>

			<view class="action-card" v-if="pageType === 'pending' && detail.status === 'pending'">
				<view class="section-title">审批意见（可选）</view>
				<textarea 
					v-model="remark"
					placeholder="请输入审批意见..."
					class="remark-textarea"
					maxlength="200"
				></textarea>
				
				<view class="action-buttons">
					<view class="btn approve" @click="handleApprove">
						<text>✓ 通过</text>
					</view>
					<view class="btn reject" @click="handleReject">
						<text>✗ 拒绝</text>
					</view>
				</view>
			</view>
		</view>

		<view class="loading-state" v-if="loading">
			<text>加载中...</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getApprovalDetail, approveApplication, rejectApplication } from '@/api/modules/approval'

const detail = ref<any>(null)
const loading = ref(false)
const pageType = ref('my')
const remark = ref('')

async function loadDetail(id: string) {
	loading.value = true
	try {
		const result = await getApprovalDetail({ id })
		detail.value = result
	} catch {
		uni.showToast({ title: '加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

function formatKey(key: string): string {
	const map: Record<string, string> = {
		start_date: '开始日期',
		end_date: '结束日期',
		check_date: '补卡日期',
		duration: '时长',
		leave_type: '请假类型',
		source_date: '原排班日期',
		target_date: '目标日期',
		target_employee_id: '换班同事ID',
		target_employee_name: '换班同事',
		leaveType: '请假类型',
		startTime: '开始时间',
		endTime: '结束时间',
		workAddress: '外勤地点',
		workContent: '外勤内容',
		scheduleDate: '排班日期'
	}
	return map[key] || key
}

async function handleApprove() {
	uni.showModal({
		title: '确认通过',
		content: '确定要通过此申请吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await approveApplication({
						id: detail.value.id,
						remark: remark.value
					})
					uni.showToast({ title: '审批通过', icon: 'success' })
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (error: any) {
					uni.showToast({ title: error.msg || '操作失败', icon: 'none' })
				}
			}
		}
	})
}

async function handleReject() {
	uni.showModal({
		title: '确认拒绝',
		content: '确定要拒绝此申请吗？',
		success: async (res) => {
			if (res.confirm) {
				try {
					await rejectApplication({
						id: detail.value.id,
						remark: remark.value
					})
					uni.showToast({ title: '已拒绝', icon: 'success' })
					setTimeout(() => {
						uni.navigateBack()
					}, 1500)
				} catch (error: any) {
					uni.showToast({ title: error.msg || '操作失败', icon: 'none' })
				}
			}
		}
	})
}

onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = (currentPage as any)?.options || {}
	
	if (options?.id) {
		loadDetail(options.id)
		pageType.value = options?.type || 'my'
	}
})
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f5f5f5;
}

.detail-container {
	padding: 24rpx;
}

.header-card {
	background: #fff;
	border-radius: 24rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.type-name {
	font-size: 36rpx;
	font-weight: 600;
	color: #333;
}

.status-badge {
	padding: 8rpx 20rpx;
	border-radius: 8rpx;
	font-size: 24rpx;
	
	&.pending {
		background: rgba(255, 149, 0, 0.1);
		color: #ff9500;
	}
	
	&.approved {
		background: rgba(52, 199, 89, 0.1);
		color: #34c759;
	}
	
	&.rejected {
		background: rgba(255, 59, 48, 0.1);
		color: #ff3b30;
	}
}

.info-card, .reason-card, .extra-card, .approve-card, .action-card {
	background: #fff;
	border-radius: 16rpx;
	padding: 32rpx;
	margin-bottom: 24rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333;
	margin-bottom: 24rpx;
}

.info-item {
	display: flex;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
}

.label {
	font-size: 28rpx;
	color: #666;
}

.value {
	font-size: 28rpx;
	color: #333;
}

.reason-text {
	font-size: 28rpx;
	color: #333;
	line-height: 1.6;
}

.extra-item {
	display: flex;
	justify-content: space-between;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #f0f0f0;
	
	&:last-child {
		border-bottom: none;
	}
}

.extra-label {
	font-size: 28rpx;
	color: #666;
}

.extra-value {
	font-size: 28rpx;
	color: #333;
}

.remark-textarea {
	width: 100%;
	min-height: 150rpx;
	font-size: 28rpx;
	color: #333;
	margin-bottom: 24rpx;
}

.action-buttons {
	display: flex;
	gap: 24rpx;
}

.btn {
	flex: 1;
	padding: 32rpx;
	border-radius: 16rpx;
	text-align: center;
	font-size: 32rpx;
	width: 160rpx;
	font-weight: 600;
	
	&.approve {
		background: #34c759;
		color: #fff;
	}
	
	&.reject {
		background: #ff3b30;
		color: #fff;
	}
}

.loading-state {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 300rpx;
	color: #999;
}
</style>