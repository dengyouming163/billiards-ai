<template>
	<view class="page">
		<ProfileHeader :user="profile" @avatar-updated="onAvatarUpdated" />
		
		<view class="page-content">
			<view class="main-card">
				<view class="card-section">
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
		</view>

		<TabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getProfile } from '@/api/modules/profile'
import { ProfileData } from '@/api/modules/profile'
import { authStore } from '@/stores/auth'
import { usePermission } from '@/composables/usePermission'
import ProfileHeader from '@/components/ProfileHeader.vue'
import Icon from '@/components/Icon.vue'
import TabBar from '@/components/TabBar.vue'

const { canAccessModule: can } = usePermission()

function goToEmployeeList() { uni.navigateTo({ url: '/pages/employee/list' }) }
function goToScheduleManagement() { uni.navigateTo({ url: '/pages/schedule/index' }) }
function goToDeviceManagement() { uni.navigateTo({ url: '/pages/device/bind' }) }
function goToSettings() { uni.navigateTo({ url: '/pages/settings/index' }) }
function goToHelp() { uni.navigateTo({ url: '/pages/profile/help' }) }
function goToFeedback() { uni.navigateTo({ url: '/pages/profile/feedback' }) }

const profile = ref<ProfileData>({
	id: '',
	name: '',
	phone: '',
	role: '',
	store_name: '',
	join_time: '',
	avatar: '',
	tags: [],
	album: [],
	today_income: 0,
	today_orders: 0,
	today_duration: 0
})

const showManagement = computed(() => {
  const role = authStore.userInfo?.role
  if (role === 'assistant' || role === '6' || Number(role) === 6) return false
  return authStore.canManageEmployee || authStore.canViewSchedule
})

onMounted(() => {
	loadProfile()
})

async function loadProfile() {
	try {
		const result = await getProfile()
		profile.value = result || {}
	} catch {
		console.error('Failed to load profile')
	}
}

function onAvatarUpdated(url: string) {
	profile.value = {
		...profile.value,
		avatar: url,
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f2f3f5;
}

.page-content {
	padding: 0 24rpx;
	margin-top: -52rpx;
	position: relative;
	z-index: 2;
	padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.main-card {
	background: linear-gradient(180deg, rgba(255, 255, 255, 0.97) 0%, rgba(255, 255, 255, 0.91) 100%);
	border-radius: 48rpx;
	padding: 36rpx;
	box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
	border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.card-section {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.card-divider {
	height: 20rpx;
	margin: 8rpx 0;
	background: #f2f3f5;
	border-radius: 10rpx;
}

.section-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 14rpx;
}

.section-title {
	font-size: 30rpx;
	font-weight: 700;
	color: #0f172a;
	flex: 1;
}

.menu-list {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	height: 88rpx;
	padding: 0 24rpx;
	border-radius: 20rpx;
	background: #f7faf9;
	border: 1rpx solid #edf2ef;
}

.menu-icon {
	width: 56rpx;
	height: 56rpx;
	margin-right: 20rpx;
	border-radius: 16rpx;
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
	font-size: 28rpx;
	font-weight: 600;
	color: #1f2937;
}

.menu-arrow {
	font-size: 30rpx;
	color: #9ca3af;
}
</style>
