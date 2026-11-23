<template>
	<view class="page">
		<Header @storeSelect="showStoreSelector = true">
			<template #right>
				<text class="mark-all-btn" @click="handleMarkAllRead" v-if="unreadCount > 0">
					全部已读
				</text>
			</template>
		</Header>
		<StoreSelector 
			:visible="showStoreSelector" 
			:currentStoreId="authStore.storeId"
			@close="showStoreSelector = false"
			@select="handleStoreSelect"
		/>
		<StateView :loading="loading" :empty="notifications.length === 0 && !loading" :error="hasError" empty-msg="暂无通知" error-msg="加载失败" @retry="loadData(true)">
			<scroll-view class="content-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="onLoadMore">
				<view class="page-content">
					<view class="notification-list">
						<view 
							class="notification-item" 
							:class="{ unread: !item.is_read }"
							v-for="item in notifications" 
							:key="item.id"
							@click="goToDetail(item)"
						>
							<view class="notification-icon-wrapper">
								<text class="notification-icon">{{ getIcon(item.type) }}</text>
							</view>
							<view class="notification-content">
								<view class="notification-header">
									<text class="notification-title">{{ item.title }}</text>
									<view class="notification-badge" v-if="!item.is_read"></view>
								</view>
								<text class="notification-desc">{{ item.content }}</text>
								<text class="notification-time">{{ formatTime(item.created_at) }}</text>
							</view>
						</view>
					</view>
					<view class="load-more" v-if="loadingMore && notifications.length > 0">加载中...</view>
					<view class="load-end" v-if="noMore && notifications.length > 0">没有更多了</view>
				</view>
			</scroll-view>
		</StateView>
		<TabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getNotifications, markAllRead, getUnreadCount } from '@/api/modules/notification'
import { notificationStore, authStore } from '@/stores'
import TabBar from '@/components/TabBar.vue'
import Header from '@/components/Header.vue'
import StoreSelector from '@/components/StoreSelector.vue'
import StateView from '@/components/StateView.vue'

const notifications = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const hasError = ref(false)
const pageNo = ref(1)
const noMore = ref(false)
const showStoreSelector = ref(false)
const unreadCount = ref(0)

onMounted(() => {
	loadData(true)
	loadUnreadCount()
})

async function loadData(reset = false) {
	if (reset) {
		pageNo.value = 1
		noMore.value = false
	}
	hasError.value = false
	if (reset) {
		loading.value = true
	} else {
		loadingMore.value = true
	}
	try {
		const result = await getNotifications({ page_no: reset ? 1 : pageNo.value, page_size: 20 })
		const dataList = result.list || []
		if (reset) {
			notifications.value = dataList
		} else {
			notifications.value = [...notifications.value, ...dataList]
		}
		noMore.value = dataList.length < 20
		if (!noMore.value) pageNo.value++
	} catch {
		if (reset) notifications.value = []
		hasError.value = true
	} finally {
		loading.value = false
		refreshing.value = false
		loadingMore.value = false
	}
}

function onRefresh() {
	refreshing.value = true
	loadData(true)
}

function onLoadMore() {
	if (loadingMore.value || noMore.value) return
	loadData(false)
}

async function loadUnreadCount() {
	try {
		const result = await getUnreadCount()
		unreadCount.value = result.count || 0
		notificationStore.unreadCount = result.count || 0
	} catch {
		unreadCount.value = 0
	}
}

function getIcon(type: string): string {
	const icons: Record<string, string> = {
		order: '📋',
		checkin: '📍',
		approval: '✅',
		approval_result: '📝',
		system: '🔔'
	}
	return icons[type] || '🔔'
}

function formatTime(timeStr: string): string {
	if (!timeStr) return ''
	const date = new Date(timeStr.replace('T', ' '))
	const now = new Date()
	const diff = now.getTime() - date.getTime()
	const hours = Math.floor(diff / (1000 * 60 * 60))
	
	if (hours < 1) return '刚刚'
	if (hours < 24) return `${hours}小时前`
	const days = Math.floor(hours / 24)
	if (days < 7) return `${days}天前`
	return date.toLocaleDateString()
}

function handleStoreSelect(store: any) {
	authStore.setStore(store.id, store.name)
	showStoreSelector.value = false
	uni.showToast({
		title: `已切换到 ${store.name}`,
		icon: 'success'
	})
}

function goToDetail(item: any) {
	uni.navigateTo({ url: `/pages/notification/detail?id=${item.id}` })
}

async function handleMarkAllRead() {
	try {
		await markAllRead()
		notifications.value.forEach(item => item.is_read = 1)
		unreadCount.value = 0
		notificationStore.unreadCount = 0
		uni.showToast({ title: '已全部标记为已读', icon: 'success' })
	} catch {
		uni.showToast({ title: '操作失败', icon: 'none' })
	}
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f0fdf4 0%, #fafafa 100%);
	padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.content-scroll {
	flex: 1;
}

.page-content {
	padding: 24rpx;
}

.load-more,
.load-end {
	display: flex;
	justify-content: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #9ca3af;
}

.mark-all-btn {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	background: rgba(255, 255, 255, 0.2);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
}

.notification-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.notification-item {
	display: flex;
	align-items: flex-start;
	background: #ffffff;
	border-radius: 32rpx;
	padding: 24rpx;
	position: relative;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	transition: all 0.2s ease;

	&:active {
		transform: scale(0.98);
		background: #f9fafb;
	}

	&.unread {
		background: rgba(16, 185, 129, 0.06);
		border-left: 6rpx solid #059669;
	}
}

.notification-icon-wrapper {
	width: 80rpx;
	height: 80rpx;
	background: linear-gradient(135deg, #f0fdf4, #dcfce7);
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.notification-icon {
	font-size: 40rpx;
}

.notification-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	min-width: 0;
}

.notification-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.notification-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #09090b;
	flex: 1;
}

.notification-badge {
	width: 12rpx;
	height: 12rpx;
	background: #dc2626;
	border-radius: 6rpx;
	flex-shrink: 0;
}

.notification-desc {
	font-size: 26rpx;
	color: #71717a;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	line-height: 1.5;
}

.notification-time {
	font-size: 22rpx;
	color: #a1a1aa;
	margin-top: 4rpx;
}
</style>
