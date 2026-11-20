<template>
	<view class="page">
		<view class="page-header" :style="{ paddingTop: (statusBarHeight || 20) + 'px' }">
			<view class="header-gradient"></view>
			<view class="header-main">
				<view class="user-card">
					<view class="avatar-wrapper" @click="handleAvatarUpload">
						<Icon v-if="!profile.avatar" name="user" :size="56" color="#07C160" class="avatar-fallback" />
						<image v-else :src="profile.avatar" class="avatar-img" mode="aspectFill" />
						<view class="avatar-badge">
							<Icon name="camera" :size="18" color="#ffffff" />
						</view>
					</view>
					<view class="user-details">
						<text class="user-title">{{ profile.name || '未设置' }}</text>
						<view class="user-tags">
							<view class="tag role-tag">{{ getRoleText(profile.role) }}</view>
							<view class="tag store-tag">{{ profile.store_name || authStore.storeName || '暂无门店' }}</view>
						</view>
					</view>
					<view class="action-btn edit-btn" @click="goToEdit">
						<Icon name="edit" :size="24" />
					</view>
				</view>
			</view>
		</view>

		<view class="page-body">
			<view class="menu-section">
				<view class="section-title-row">
					<Icon name="settings" :size="26" class="section-icon" />
					<text class="section-title">系统设置</text>
				</view>
				<view class="menu-card">
					<view class="menu-row" @click="goToHelp">
						<view class="menu-left">
							<view class="menu-icon-box help-box">
								<Icon name="help" :size="26" />
							</view>
							<text class="menu-name">使用帮助</text>
						</view>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-row" @click="goToFeedback">
						<view class="menu-left">
							<view class="menu-icon-box feedback-box">
								<Icon name="message" :size="26" />
							</view>
							<text class="menu-name">反馈</text>
						</view>
						<text class="menu-arrow">›</text>
					</view>
					<view class="menu-row" @click="goToSettings">
						<view class="menu-left">
							<view class="menu-icon-box settings-box">
								<Icon name="settings" :size="26" />
							</view>
							<text class="menu-name">设置</text>
						</view>
						<text class="menu-arrow">›</text>
					</view>
				</view>
			</view>

			<view class="logout-section">
				<view class="logout-btn" @click="handleLogout">
					<Icon name="logOut" :size="26" class="logout-icon" />
					<text class="logout-text">退出登录</text>
				</view>
			</view>
		</view>

		<TabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProfile } from '@/api/modules/profile'
import { ProfileData } from '@/api/modules/profile'
import { authStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'
import TabBar from '@/components/TabBar.vue'

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

const statusBarHeight = ref(0)

uni.getSystemInfo({
	success: (res) => {
		statusBarHeight.value = res.statusBarHeight || 20
	}
})

function getRoleText(role: string): string {
	const roles: Record<string, string> = {
		owner: '老板',
		admin: '管理员',
		manager: '店长',
		assistant: '助教',
		employee: '员工'
	}
	return roles[role] || '未知'
}

function handleAvatarUpload() {
	uni.showActionSheet({
		itemList: ['拍照', '从相册选择'],
		success: (res) => {
			if (res.tapIndex === 0) {
				chooseImage('camera')
			} else {
				chooseImage('album')
			}
		}
	})
}

function chooseImage(sourceType: 'camera' | 'album') {
	uni.chooseImage({
		count: 1,
		sourceType: [sourceType],
		success: async (res) => {
			const filePath = res.tempFilePaths[0]
			if (!filePath) return
			try {
				const { uploadAvatar } = await import('@/api/modules/profile')
				const url = await uploadAvatar(filePath)
				uni.showToast({ title: '头像上传成功', icon: 'success' })
				profile.value.avatar = url
			} catch (e: any) {
				uni.showToast({ title: e.message || '上传失败', icon: 'none' })
			}
		}
	})
}

function goToEdit() {
	uni.navigateTo({ url: '/pages/profile/edit' })
}

function handleLogout() {
	uni.showModal({
		title: '确认退出',
		content: '确定要退出当前账号吗？',
		success: (res) => {
			if (res.confirm) {
				authStore.logout()
				uni.reLaunch({ url: '/pages/login/index' })
			}
		}
	})
}

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
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f7f7f7;
	display: flex;
	flex-direction: column;
}

.page-header {
	position: relative;
	padding-bottom: 60rpx;
	overflow: hidden;
}

.header-gradient {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(180deg, #07C160 0%, #f7f7f7 100%);
}

.header-main {
	position: relative;
	z-index: 1;
	padding: 40rpx 32rpx;
}

.user-card {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 28rpx;
	display: flex;
	gap: 24rpx;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.avatar-wrapper {
	position: relative;
	width: 120rpx;
	height: 120rpx;
	flex-shrink: 0;
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	border: 3rpx solid rgba(7, 193, 96, 0.3);
}

.avatar-fallback {
	width: 100%;
	height: 100%;
	border-radius: 50%;
	background: rgba(7, 193, 96, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	color: #07C160;
	border: 3rpx solid rgba(7, 193, 96, 0.3);
}

.avatar-badge {
	position: absolute;
	bottom: 2rpx;
	right: 2rpx;
	width: 40rpx;
	height: 40rpx;
	background: #07C160;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #ffffff;
	border: 2rpx solid #ffffff;
}

.user-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.user-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #333333;
}

.user-tags {
	display: flex;
	gap: 12rpx;
	flex-wrap: wrap;
}

.tag {
	font-size: 22rpx;
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	font-weight: 500;
}

.role-tag {
	background: rgba(7, 193, 96, 0.1);
	color: #07C160;
}

.store-tag {
	background: rgba(0, 122, 255, 0.1);
	color: #007AFF;
}

.action-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	transition: all 0.22s;
}

.edit-btn {
	background: rgba(7, 193, 96, 0.1);
	color: #07C160;
	border: 2rpx solid rgba(7, 193, 96, 0.3);

	&:active {
		transform: scale(0.94);
		background: rgba(7, 193, 96, 0.2);
	}
}

.page-body {
	flex: 1;
	padding: 0 24rpx;
	padding-bottom: calc(env(safe-area-inset-bottom) + 140rpx);
	margin-top: -30rpx;
	position: relative;
	z-index: 2;
}

.menu-section {
	margin-bottom: 32rpx;
}

.section-title-row {
	display: flex;
	align-items: center;
	gap: 16rpx;
	margin-bottom: 20rpx;
	padding: 0 8rpx;
}

.section-icon {
	color: #07C160;
}

.section-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #000000;
}

.menu-card {
	background: #ffffff;
	border-radius: 20rpx;
	overflow: hidden;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.menu-row {
	display: flex;
	align-items: center;
	padding: 24rpx 24rpx;
	border-bottom: 1rpx solid #f5f5f5;
	transition: all 0.22s;

	&:last-child {
		border-bottom: none;
	}

	&:active {
		background: #f7f7f7;
	}
}

.menu-left {
	display: flex;
	align-items: center;
	gap: 20rpx;
	flex: 1;
}

.menu-icon-box {
	width: 56rpx;
	height: 56rpx;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.help-box {
	background: rgba(0, 122, 255, 0.1);
	color: #007AFF;
}

.feedback-box {
	background: rgba(7, 193, 96, 0.1);
	color: #07C160;
}

.settings-box {
	background: rgba(255, 151, 106, 0.1);
	color: #FF976A;
}

.menu-name {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}

.menu-arrow {
	color: #cccccc;
}

.logout-section {
	padding-top: 32rpx;
}

.logout-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 80rpx;
	background: rgba(255, 82, 82, 0.06);
	border-radius: 16rpx;
	border: 1rpx solid rgba(255, 82, 82, 0.2);
	transition: all 0.22s;

	&:active {
		background: rgba(255, 82, 82, 0.1);
		transform: scale(0.98);
	}
}

.logout-icon {
	color: #FF5252;
}

.logout-text {
	font-size: 28rpx;
	color: #FF5252;
	font-weight: 500;
}
</style>
