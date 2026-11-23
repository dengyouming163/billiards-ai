<template>
	<view class="employee-home">
		<StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadAllData">
		<view class="hero-card">
			<view class="hero-copy">
				<text class="hero-eyebrow">工作总览</text>
				<text class="hero-title">日常办公一屏处理</text>
				<text class="hero-desc">签到统计、请假外勤与审批进度集中展示，页面更清晰也更易操作。</text>
			</view>
		</view>

		<view class="stats-section">
			<view class="section-header">
				<view>
					<text class="section-title">本月统计</text>
					<text class="section-subtitle">当前考勤概览</text>
				</view>
			</view>
			<view class="stats-row">
				<view class="stat-item">
					<text class="stat-value">{{ monthStats.checkedDays }}</text>
					<text class="stat-label">已签到/天</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ monthStats.lateCount }}</text>
					<text class="stat-label">迟到/次</text>
				</view>
				<view class="stat-item">
					<text class="stat-value">{{ monthStats.absentCount }}</text>
					<text class="stat-label">缺勤/天</text>
				</view>
			</view>
		</view>

		<view class="action-cards">
			<view class="action-card" @click="goToApply('leave')">
				<view class="action-card-icon leave"><text>🏖️</text></view>
				<view class="action-card-content">
					<view class="action-main">
						<text class="action-card-title">请假申请</text>
						<text class="action-card-desc">提交休假审批</text>
					</view>
					<text class="action-arrow">›</text>
				</view>
			</view>
			<view class="action-card" @click="goToApply('outwork')">
				<view class="action-card-icon outwork"><text>🌐</text></view>
				<view class="action-card-content">
					<view class="action-main">
						<text class="action-card-title">外勤申请</text>
						<text class="action-card-desc">登记外出工作</text>
					</view>
					<text class="action-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="approval-section">
			<view class="section-header">
				<view>
					<text class="section-title">我的审批</text>
					<text class="section-subtitle">最近发起的审批记录</text>
				</view>
				<text class="section-more" @click="goToApproval">查看全部 ›</text>
			</view>
			<view class="approval-list" v-if="myApprovals.length > 0">
				<view class="approval-item" v-for="item in myApprovals" :key="item.id" @click="goToApprovalDetail(item.id)">
					<view class="approval-item-header">
						<text class="approval-type">{{ item.type_name || item.type }}</text>
						<view class="approval-status" :class="item.status">
							<text>{{ item.status_text }}</text>
						</view>
					</view>
					<text class="approval-reason">{{ item.reason }}</text>
					<view class="approval-item-footer">
						<text class="approval-time">{{ item.create_time_text || item.created_at }}</text>
					</view>
				</view>
			</view>
			<view class="empty-approvals" v-else>
				<text class="empty-icon">📋</text>
				<text class="empty-text">暂无审批记录</text>
			</view>
		</view>
		</StateView>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCheckinRecords } from '@/api/modules/checkin'
import { getMyApprovalList } from '@/api/modules/approval'
import StateView from '@/components/StateView.vue'

const monthStats = ref({ checkedDays: 0, lateCount: 0, absentCount: 0 })
const myApprovals = ref<any[]>([])
const loading = ref(false)
const hasError = ref(false)

onMounted(() => { loadAllData() })

function loadAllData() {
	loading.value = true; hasError.value = false
	Promise.all([loadMonthStats(), loadMyApprovals()])
		.catch(() => { hasError.value = true })
		.finally(() => { loading.value = false })
}

async function loadMonthStats() {
	try {
		const result = await getCheckinRecords(1, 30)
		const records = result.lists || []
		const days = records.filter((r: any) => r.check_in_time).length
		const workDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
		monthStats.value = { checkedDays: days, lateCount: records.filter((r: any) => r.is_late).length, absentCount: Math.max(0, workDays - days) }
	} catch { monthStats.value = { checkedDays: 0, lateCount: 0, absentCount: 0 } }
}

async function loadMyApprovals() {
	try {
		const result = await getMyApprovalList({ page: 1, page_size: 5 })
		myApprovals.value = result.list || []
	} catch { myApprovals.value = [] }
}

function goToApply(type: string) { uni.navigateTo({ url: `/pages/approval/create?type=${type}` }) }
function goToApproval() { uni.navigateTo({ url: '/pages/approval/index' }) }
function goToApprovalDetail(id: string) { uni.navigateTo({ url: `/pages/approval/detail?id=${id}&type=my` }) }
</script>

<style lang="scss" scoped>
.employee-home { min-height: 100vh; padding: 30rpx 24rpx 0; display: flex; flex-direction: column; gap: 22rpx; }
.employee-home :deep(.state-content) { display: flex; flex-direction: column; gap: 22rpx; }

.hero-card {
	margin-top: 12rpx;
	padding: 34rpx 30rpx;
	border-radius: 34rpx;
	background: linear-gradient(180deg, rgba(255,255,255,.95) 0%, rgba(255,255,255,.86) 100%);
	box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	border: 1rpx solid rgba(255,255,255,.76);
}
.hero-copy { display: flex; flex-direction: column; gap: 10rpx; }
.hero-eyebrow { font-size: 22rpx; color: #059669; font-weight: 700; letter-spacing: 2rpx; }
.hero-title { font-size: 42rpx; line-height: 1.25; color: #0f172a; font-weight: 800; }
.hero-desc { font-size: 24rpx; line-height: 1.7; color: #64748b; }

.stats-section, .approval-section {
	background: rgba(255,255,255,.95);
	border-radius: 34rpx;
	padding: 34rpx 30rpx;
	box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}
.section-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16rpx; margin-bottom: 28rpx; }
.section-title { display: block; font-size: 32rpx; font-weight: 800; color: #0f172a; }
.section-subtitle { display: block; margin-top: 8rpx; font-size: 22rpx; color: #94a3b8; }
.section-more { font-size: 24rpx; color: #059669; font-weight: 700; padding-top: 6rpx; }
.stats-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18rpx; }
.stat-item { display: flex; flex-direction: column; align-items: flex-start; padding: 28rpx 24rpx; border-radius: 26rpx; background: linear-gradient(180deg, #f8fafc 0%, #f4f8f7 100%); }
.stat-value { font-size: 50rpx; font-weight: 800; color: #059669; }
.stat-label { font-size: 24rpx; color: #64748b; margin-top: 10rpx; }
.action-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18rpx; }
.action-card {
	background: rgba(255,255,255,.95);
	border-radius: 34rpx;
	padding: 30rpx 26rpx;
	display: flex;
	align-items: center;
	gap: 18rpx;
	box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}
.action-card-icon {
	width: 84rpx;
	height: 84rpx;
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
}
.action-card-icon.leave { background: linear-gradient(135deg, #dbeafe, #bfdbfe); }
.action-card-icon.outwork { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.action-card-content { flex: 1; display: flex; justify-content: space-between; align-items: center; gap: 16rpx; }
.action-main { display: flex; flex-direction: column; gap: 8rpx; }
.action-card-title { font-size: 30rpx; font-weight: 700; color: #0f172a; }
.action-card-desc { font-size: 22rpx; color: #94a3b8; }
.action-arrow { font-size: 38rpx; color: #94a3b8; line-height: 1; }
.approval-list { display: flex; flex-direction: column; }
.approval-item { padding: 26rpx 0; border-bottom: 1rpx solid #eef2f7; display: flex; flex-direction: column; gap: 14rpx; }
.approval-item:last-child { border-bottom: none; }
.approval-item-header { display: flex; justify-content: space-between; align-items: center; }
.approval-type { font-size: 30rpx; font-weight: 700; color: #0f172a; }
.approval-status { font-size: 22rpx; padding: 8rpx 18rpx; border-radius: 999rpx; font-weight: 700; }
.approval-status.pending { background: rgba(255,149,0,.08); color: #e67c00; }
.approval-status.approved { background: rgba(52,199,89,.08); color: #2d9e4e; }
.approval-status.rejected { background: rgba(255,59,48,.08); color: #d93026; }
.approval-reason { font-size: 28rpx; color: #475569; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.approval-item-footer { display: flex; justify-content: flex-end; }
.approval-time { font-size: 24rpx; color: #94a3b8; }
.empty-approvals { display: flex; flex-direction: column; align-items: center; padding: 54rpx 0 26rpx; }
.empty-icon { font-size: 72rpx; margin-bottom: 20rpx; opacity: .5; }
.empty-text { font-size: 28rpx; color: #94a3b8; }
</style>
