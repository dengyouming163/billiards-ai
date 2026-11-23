<template>
	<view class="page">
		<view class="about-content">
			<view class="logo-section">
				<view class="app-logo">🎱</view>
				<text class="app-name">球房管理</text>
				<text class="app-version">版本 1.0.0</text>
			</view>
			<view class="desc-section">
				<text class="desc-text">让球房管理更简单、更高效</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #f5f5f5;
	padding: 24rpx;
}

.about-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 100rpx;
}

.logo-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 60rpx;
}

.app-logo {
	font-size: 160rpx;
	margin-bottom: 24rpx;
}

.app-name {
	font-size: 44rpx;
	font-weight: 700;
	color: #333333;
	margin-bottom: 12rpx;
}

.app-version {
	font-size: 26rpx;
	color: #999999;
}

.desc-section {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 32rpx;
	width: 100%;
}

.desc-text {
	font-size: 28rpx;
	color: #666666;
	line-height: 1.6;
}
</style>
