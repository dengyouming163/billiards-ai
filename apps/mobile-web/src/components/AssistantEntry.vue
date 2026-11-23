<template>
	<view class="assistant-entry" @click="goToAssistantPage">
		<view class="entry-bg"></view>
		<view class="entry-content">
			<view class="entry-icon-wrap">
				<text class="entry-icon">🏓</text>
			</view>
			<view class="entry-info">
				<text class="entry-title">我的宣传页</text>
				<text class="entry-desc">展示个人风采，吸引更多客户</text>
			</view>
			<view class="entry-arrow">
				<text>›</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
defineProps<{
	user: {
		name?: string
	}
}>()

function goToAssistantPage() {
	uni.navigateTo({ url: '/pages/profile/assistant' })
}
</script>

<style lang="scss" scoped>
.assistant-entry {
	position: relative;
	border-radius: 24rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
	box-shadow: 0 8rpx 32rpx rgba(5, 150, 105, 0.15);
}

.entry-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, #059669 0%, #059669 50%, #047857 100%);
}

.entry-content {
	position: relative;
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 32rpx;
}

.entry-icon-wrap {
	width: 80rpx;
	height: 80rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.entry-icon {
	font-size: 40rpx;
}

.entry-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.entry-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
}

.entry-desc {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.85);
}

.entry-arrow {
	font-size: 40rpx;
	color: rgba(255, 255, 255, 0.8);
}
</style>
