<template>
	<view class="section-card">
		<view class="section-header">
			<Icon name="chart" :size="36" />
			<text class="section-title">数据统计</text>
			<text class="section-link" @click="handleStatClick">查看详情 ›</text>
		</view>
		<view class="stats-grid">
			<view class="stat-item">
				<text class="stat-value">¥{{ formatNumber(statistics.total_income || 0) }}</text>
				<text class="stat-label">本月收入</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">{{ statistics.total_orders || 0 }}</text>
				<text class="stat-label">本月订单</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">{{ statistics.employee_count || 0 }}</text>
				<text class="stat-label">员工数</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { authStore } from '@/stores/auth'

defineProps<{
	statistics: {
		total_income?: number
		total_orders?: number
		employee_count?: number
	}
}>()

function formatNumber(num: number): string {
	return num.toLocaleString('zh-CN')
}

function handleStatClick() {
	if (authStore.canViewDashboard) {
		uni.switchTab({ url: '/pages/index/index' })
	} else if (authStore.canViewPerformance) {
		uni.navigateTo({ url: '/pages/performance/index' })
	} else {
		uni.showToast({ title: '暂无数据统计权限', icon: 'none' })
	}
}
</script>

<style lang="scss" scoped>
.section-card {
	background: rgba(30, 41, 59, 0.7);
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border: 1rpx solid rgba(71, 85, 105, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,.2);
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.section-icon {
	font-size: 32rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #f8fafc;
	flex: 1;
}

.section-link {
	font-size: 26rpx;
	color: #f59e0b;
}

.stats-grid {
	display: flex;
	justify-content: space-around;
	align-items: center;
	padding: 16rpx 0;
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex: 1;
}

.stat-value {
	font-size: 40rpx;
	font-weight: 700;
	color: #f8fafc;
}

.stat-label {
	font-size: 24rpx;
	color: #94a3b8;
	margin-top: 8rpx;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: rgba(71, 85, 105, 0.3);
}
</style>
