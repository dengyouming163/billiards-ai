<template>
	<view class="section-card stats-card">
		<view class="section-header">
			<Icon name="chart" :size="36" />
			<text class="section-title">今日战绩</text>
			<text class="section-link" @click="goToPerformance">查看详情 ›</text>
		</view>
		<view class="stats-grid">
			<view class="stat-item">
				<text class="stat-value">¥{{ formatNumber(stats.today_income || 0) }}</text>
				<text class="stat-label">收入</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.today_orders || 0 }}</text>
				<text class="stat-label">订单</text>
			</view>
			<view class="stat-divider"></view>
			<view class="stat-item">
				<text class="stat-value">{{ stats.today_duration || 0 }}</text>
				<text class="stat-label">时长(分)</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'

defineProps<{
	stats: {
		today_income?: number
		today_orders?: number
		today_duration?: number
	}
}>()

function formatNumber(num: number): string {
	return num.toLocaleString('zh-CN')
}

function goToPerformance() {
	uni.switchTab({ url: '/pages/performance/index' })
}
</script>

<style lang="scss" scoped>
.section-card {
	background: rgba(30, 41, 59, 0.7);
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.2);
	border: 1rpx solid rgba(71, 85, 105, 0.3);
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
	color: #1f2937;
}

.stat-label {
	font-size: 24rpx;
	color: #6b7280;
	margin-top: 8rpx;
}

.stat-divider {
	width: 1rpx;
	height: 60rpx;
	background: #e5e7eb;
}
</style>
