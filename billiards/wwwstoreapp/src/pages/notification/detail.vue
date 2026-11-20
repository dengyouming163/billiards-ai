<template>
	<view class="page">
		<view class="page-content" v-if="notification">
			<view class="notification-card">
				<view class="notification-header">
					<view class="notification-icon-wrapper">
						<Icon class="notification-icon" :name="getIcon(notification.type)" size="48" />
					</view>
					<view class="notification-info">
						<text class="notification-title">{{ notification.title }}</text>
						<view class="notification-tag" v-if="!notification.is_read">未读</view>
					</view>
				</view>
				<text class="notification-time">{{ formatTime(notification.created_at) }}</text>
				<view class="notification-content">
					<text>{{ notification.content }}</text>
				</view>
				<view class="notification-meta" v-if="notification.link">
					<view class="meta-item">
						<text class="meta-label">相关链接</text>
						<text class="meta-value">{{ notification.link }}</text>
					</view>
				</view>
			</view>
		</view>

		<view class="empty-state" v-else>
			<Icon class="empty-icon" name="bell" size="140" />
			<text class="empty-text">通知不存在</text>
			<view class="back-btn" @click="goBack">
				<text>返回列表</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getNotificationDetail, markRead } from '@/api/modules/notification'
import Header from '@/components/Header.vue'
import Icon from '@/components/Icon.vue'

const notification = ref<any>(null)

onMounted(() => {
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	const options = (currentPage as any).$page?.options || {}
	
	loadNotification(options.id)
})

async function loadNotification(id: string) {
	if (!id) return
	
	try {
		const result = await getNotificationDetail(id)
			notification.value = result
		
		await markRead(id)
	} catch {
		notification.value = null
	}
}

function getIcon(type: string): string {
	const icons: Record<string, string> = {
		order: 'fileText',
		checkin: 'mapPin',
		approval: 'check',
		approval_result: 'edit',
		system: 'bell'
	}
	return icons[type] || 'bell'
}

function formatTime(timeStr: string): string {
	if (!timeStr) return ''
	return new Date(timeStr.replace('T', ' ')).toLocaleString('zh-CN')
}

function goBack() {
	uni.navigateBack()
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: #f7f7f7;
}

.page-content {
	padding: 24rpx;
}

.notification-card {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 32rpx;
}

.notification-header {
	display: flex;
	align-items: flex-start;
	gap: 20rpx;
	margin-bottom: 24rpx;
}

.notification-icon-wrapper {
	width: 96rpx;
	height: 96rpx;
	background: rgba(7, 193, 96, 0.1);
	border-radius: 24rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.notification-icon {
	font-size: 48rpx;
	color: #07C160;
}

.notification-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.notification-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #000000;
}

.notification-tag {
	font-size: 24rpx;
	padding: 6rpx 16rpx;
	background: rgba(7, 193, 96, 0.1);
	color: #07C160;
	border-radius: 20rpx;
	display: inline-block;
	width: fit-content;
}

.notification-time {
	font-size: 26rpx;
	color: #999999;
	display: block;
	margin-bottom: 24rpx;
}

.notification-content {
	font-size: 30rpx;
	color: #333333;
	line-height: 1.8;
	padding: 24rpx;
	background: #f7f7f7;
	border-radius: 16rpx;
	margin-bottom: 24rpx;
	white-space: pre-wrap;
}

.notification-meta {
	padding-top: 24rpx;
	border-top: 1rpx solid #e5e5e5;
}

.meta-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.meta-label {
	font-size: 28rpx;
	color: #999999;
}

.meta-value {
	font-size: 28rpx;
	color: #07C160;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 160rpx 48rpx;
}

.empty-icon {
	font-size: 140rpx;
	margin-bottom: 32rpx;
	opacity: 0.4;
	color: #999999;
}

.empty-text {
	font-size: 32rpx;
	color: #999999;
	margin-bottom: 40rpx;
}

.back-btn {
	width: 320rpx;
	height: 88rpx;
	background: #07C160;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	
	text {
		font-size: 30rpx;
		color: #ffffff;
		font-weight: 600;
	}
}
</style>
