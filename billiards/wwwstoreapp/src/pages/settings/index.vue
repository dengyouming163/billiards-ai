<template>
	<view class="page">
		<view class="section-card">
			<view class="section-title">账号安全</view>
			<view class="menu-list">
				<view class="menu-item" @click="goToChangePassword">
					<view class="menu-icon-wrap">
						<Icon name="lock" :size="24" class="menu-icon" />
					</view>
					<text class="menu-text">修改密码</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>

		

		<view class="section-card">
			<view class="section-title">系统设置</view>
			<view class="menu-list">
				<view class="menu-item" @click="handleItemClick('notification')">
					<view class="menu-icon-wrap">
						<Icon name="bell" :size="24" class="menu-icon" />
					</view>
					<text class="menu-text">通知设置</text>
					<view class="menu-switch">
						<switch :checked="notificationEnabled" @change="toggleNotification" color="#07C160" />
					</view>
				</view>
				<view class="menu-item" @click="handleItemClick('about')">
					<view class="menu-icon-wrap">
						<Icon name="info" :size="24" class="menu-icon" />
					</view>
					<text class="menu-text">关于我们</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="section-card">
			<view class="section-title">协议与隐私</view>
			<view class="menu-list">
				<view class="menu-item" @click="handleItemClick('service-agreement')">
					<view class="menu-icon-wrap">
						<Icon name="fileText" :size="24" class="menu-icon" />
					</view>
					<text class="menu-text">服务协议</text>
					<text class="menu-arrow">›</text>
				</view>
				<view class="menu-item" @click="handleItemClick('privacy-policy')">
					<view class="menu-icon-wrap">
						<Icon name="shield" :size="24" class="menu-icon" />
					</view>
					<text class="menu-text">隐私政策</text>
					<text class="menu-arrow">›</text>
				</view>
			</view>
		</view>

		<view class="logout-btn-wrap">
			<button class="logout-btn" @click="handleLogout">退出登录</button>
		</view>

		<view class="modal-overlay" v-if="showChangePassword" @click="showChangePassword = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">修改密码</text>
					<view class="modal-close" @click="showChangePassword = false"><Icon name="x" :size="24" /></view>
				</view>
				<view class="modal-body">
					<input v-model="passwordForm.oldPassword" class="modal-input" type="password" placeholder="请输入原密码" />
					<input v-model="passwordForm.newPassword" class="modal-input" type="password" placeholder="请输入新密码（至少6位）" />
					<input v-model="passwordForm.confirmPassword" class="modal-input" type="password" placeholder="请再次输入新密码" />
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="showChangePassword = false">取消</button>
					<button class="modal-btn confirm" @click="handleChangePassword" :disabled="changingPassword">
						{{ changingPassword ? '修改中...' : '确认修改' }}
					</button>
				</view>
			</view>
		</view>

	</view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authStore } from '@/stores/auth'
import { changePassword } from '@/api/modules/auth'
import Icon from '@/components/Icon.vue'

const notificationEnabled = ref(uni.getStorageSync('notificationEnabled') !== false)

const showChangePassword = ref(false)
const passwordForm = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})
const changingPassword = ref(false)

function goBack() {
	uni.navigateBack()
}

function goToChangePassword() {
	showChangePassword.value = true
	passwordForm.oldPassword = ''
	passwordForm.newPassword = ''
	passwordForm.confirmPassword = ''
}

async function handleChangePassword() {
	if (!passwordForm.oldPassword || !passwordForm.newPassword) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	if (passwordForm.newPassword.length < 6) {
		uni.showToast({ title: '新密码至少6位', icon: 'none' })
		return
	}
	if (passwordForm.newPassword !== passwordForm.confirmPassword) {
		uni.showToast({ title: '两次密码不一致', icon: 'none' })
		return
	}
	changingPassword.value = true
	try {
		await changePassword(passwordForm.oldPassword, passwordForm.newPassword)
		uni.showToast({ title: '密码修改成功', icon: 'success' })
		showChangePassword.value = false
	} catch {
		uni.showToast({ title: '修改失败，请检查原密码', icon: 'none' })
	} finally {
		changingPassword.value = false
	}
}

function goToApplyRecord() {
	uni.navigateTo({ url: '/pages/approval/my-records' })
}

function goToCheckinRecord() {
	uni.navigateTo({ url: '/pages/checkin/record' })
}

function handleItemClick(type: string) {
	if (type === 'about') {
		uni.navigateTo({ url: '/pages/settings/about' })
	} else if (type === 'service-agreement') {
		uni.navigateTo({ url: '/pages/legal/service-agreement' })
	} else if (type === 'privacy-policy') {
		uni.navigateTo({ url: '/pages/legal/privacy-policy' })
	} else if (type === 'notification') {
		// toggle handled by @change on switch only
	}
}

function toggleNotification(e: any) {
	notificationEnabled.value = e.detail.value
	uni.setStorageSync('notificationEnabled', notificationEnabled.value)
	uni.showToast({
		title: notificationEnabled.value ? '已开启通知' : '已关闭通知',
		icon: 'success'
	})
}

function handleLogout() {
	uni.showModal({
		title: '提示',
		content: '确定要退出登录吗？',
		success: async (res) => {
			if (res.confirm) {
				await authStore.logout()
				uni.reLaunch({ url: '/pages/login/index' })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f7f7f7;
}

.page-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx;
	background: #ffffff;
	position: sticky;
	top: 0;
	z-index: 100;
	border-bottom: 1rpx solid #e5e5e5;
}

.back-btn {
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 48rpx;
	color: #333333;
}

.page-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #000000;
}

.placeholder {
	width: 64rpx;
}

.section-card {
	background: #ffffff;
	margin: 20rpx 24rpx 24rpx;
	border-radius: 20rpx;
	overflow: hidden;
	border: 1rpx solid #e5e5e5;
}

.section-title {
	font-size: 26rpx;
	font-weight: 600;
	color: #999999;
	padding: 20rpx 24rpx 12rpx;
}

.menu-list {
	padding: 0 24rpx;
}

.menu-item {
	display: flex;
	align-items: center;
	height: 96rpx;
	border-bottom: 1rpx solid #e5e5e5;
	transition: all 0.22s ease;

	&:active {
		background: #f5f5f5;
	}
}

.menu-item:last-child {
	border-bottom: none;
}

.menu-icon-wrap {
	width: 56rpx;
	height: 56rpx;
	margin-right: 20rpx;
	border-radius: 16rpx;
	background: rgba(7, 193, 96, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.menu-icon {
	color: #07C160;
}

.menu-text {
	flex: 1;
	font-size: 30rpx;
	color: #333333;
}

.menu-arrow {
	color: #999999;
}

.menu-switch {
	margin-left: auto;
}

.logout-btn-wrap {
	padding: 48rpx 24rpx;
}

.logout-btn {
	width: 100%;
	height: 88rpx;
	background: #ffffff;
	color: #999999;
	font-size: 32rpx;
	font-weight: 600;
	border-radius: 44rpx;
	border: 2rpx solid #e5e5e5;
	transition: all 0.22s ease;

	&:active {
		transform: scale(0.98);
		background: #f5f5f5;
	}
}

.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	padding: 48rpx;
}

.modal-content {
	background: #ffffff;
	border-radius: 20rpx;
	width: 100%;
	max-width: 600rpx;
	overflow: hidden;
	border: 1rpx solid #e5e5e5;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.modal-title {
	font-size: 34rpx;
	font-weight: 700;
	color: #000000;
}

.modal-close {
	font-size: 36rpx;
	color: #999999;
	padding: 8rpx;
}

.modal-body {
	padding: 32rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.modal-input {
	width: 100%;
	height: 88rpx;
	border: 2rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 0 20rpx;
	font-size: 28rpx;
	color: #333333;
	background: #ffffff;
	box-sizing: border-box;

	&::placeholder {
		color: #999999;
	}
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 24rpx 32rpx 32rpx;
}

.modal-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	transition: all 0.22s ease;

	&:active {
		transform: scale(0.98);
	}

	&.cancel {
		background: #f5f5f5;
		color: #333333;
	}
	&.confirm {
		background: #07C160;
		color: #ffffff;
	}
}
</style>
