<template>
	<view class="profile-footer">
		<view class="section-card">
			<view class="section-header">
				<Icon name="settings" :size="36" />
				<text class="section-title">系统设置</text>
			</view>
			<view class="menu-list">
				<view class="menu-item" @click="goToHelp">
					<text class="menu-icon">❓</text>
					<text class="menu-text">使用帮助</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="goToFeedback">
					<view class="menu-icon"><Icon name="edit" :size="36" /></view>
					<text class="menu-text">意见反馈</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="goToSettings">
					<text class="menu-icon">🔧</text>
					<text class="menu-text">设置</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'

function goToSettings() {
	uni.navigateTo({ url: '/pages/settings/index' })
}

function goToHelp() {
	uni.navigateTo({ url: '/pages/profile/help' })
}

function goToFeedback() {
	uni.navigateTo({ url: '/pages/profile/feedback' })
}
</script>

<style lang="scss" scoped>
.profile-footer {
	padding-bottom: 60rpx;
}

.section-card {
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.91) 100%);
	border-radius: 34rpx;
	padding: 28rpx;
	margin-bottom: 22rpx;
	box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 22rpx;
}

.section-icon {
	font-size: 32rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #0f172a;
	flex: 1;
}

.menu-list {
	display: flex;
	flex-direction: column;
	gap: 14rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	height: 108rpx;
	padding: 0 20rpx;
	border-radius: 28rpx;
	background: #f7faf9;
	border: 1rpx solid #edf2ef;
}

.menu-icon {
	width: 56rpx;
	height: 56rpx;
	margin-right: 20rpx;
	border-radius: 18rpx;
	background: #ebf7f2;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	color: #059669;
	flex-shrink: 0;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	font-weight: 600;
	color: #1f2937;
}

.menu-arrow {
	font-size: 32rpx;
	color: #9ca3af;
}
</style>
