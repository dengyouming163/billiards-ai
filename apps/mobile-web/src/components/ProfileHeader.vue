<template>
	<view class="profile-header" :style="{ paddingTop: (statusBarHeight || 20) + 30 + 'px' }">
		<view class="header-bg"></view>
		<view class="header-content">
			<view class="avatar-box" @click="handleAvatarUpload">
				<Icon v-if="!user.avatar" name="user" :size="70" />
				<image v-else :src="user.avatar" class="avatar-image" mode="aspectFill" />
				<view class="avatar-edit">
					<Icon name="camera" :size="22" />
				</view>
			</view>
			<view class="user-info">
				<text class="user-name">{{ user.name || '未设置' }}</text>
				<view class="user-meta">
					<text class="user-role">{{ getRoleText(user.role) }}</text>
					<text class="user-store">{{ user.store_name || '-' }}</text>
				</view>
			</view>
			<view class="edit-btn" @click="goToEdit">
				<Icon name="edit" :size="24" /> <text>编辑</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadAvatar } from '@/api/modules/profile'
import Icon from '@/components/Icon.vue'

defineProps<{
	user: {
		name?: string
		role?: string
		store_name?: string
		avatar?: string
	}
}>()

const emit = defineEmits<{ (e: 'avatar-updated', url: string): void }>()

const statusBarHeight = ref(0)
const uploading = ref(false)

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
			uploading.value = true
			try {
				const url = await uploadAvatar(filePath)
				uni.showToast({ title: '头像上传成功', icon: 'success' })
				emit('avatar-updated', url)
			} catch (e: any) {
				uni.showToast({ title: e.message || '上传失败', icon: 'none' })
			} finally {
				uploading.value = false
			}
		}
	})
}

function goToEdit() {
	uni.navigateTo({ url: '/pages/profile/edit' })
}
</script>

<style lang="scss" scoped>
.profile-header {
	position: relative;
	padding: 0 24rpx 92rpx;
	overflow: hidden;
}

.header-bg {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background:
		radial-gradient(circle at top right, rgba(255, 255, 255, 0.18) 0, rgba(255, 255, 255, 0) 34%),
		radial-gradient(circle at left bottom, rgba(255, 255, 255, 0.14) 0, rgba(255, 255, 255, 0) 28%),
		linear-gradient(135deg, #0f766e 0%, #059669 52%, #047857 100%);
	border-bottom-left-radius: 48rpx;
	border-bottom-right-radius: 48rpx;
}

.header-content {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding: 34rpx 28rpx;
	border-radius: 40rpx;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(18rpx);
	-webkit-backdrop-filter: blur(18rpx);
	border: 1rpx solid rgba(255, 255, 255, 0.22);
	box-shadow: 0 18rpx 36rpx rgba(4, 120, 87, 0.18);
}

.avatar-box {
	position: relative;
	width: 148rpx;
	height: 148rpx;
	background: rgba(255, 255, 255, 0.22);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	border: 4rpx solid rgba(255, 255, 255, 0.34);
	box-shadow: 0 14rpx 28rpx rgba(15, 23, 42, 0.12);
}

.avatar-icon {
	font-size: 70rpx;
}

.avatar-image {
	width: 100%;
	height: 100%;
}

.avatar-edit {
	position: absolute;
	bottom: 10rpx;
	right: 10rpx;
	width: 48rpx;
	height: 48rpx;
	background: #ffffff;
	border-radius: 18rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
	color: #0f766e;
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.user-name {
	font-size: 42rpx;
	font-weight: 800;
	color: #ffffff;
}

.user-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.user-role {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.9);
	background: rgba(255, 255, 255, 0.18);
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	font-weight: 600;
}

.user-store {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.85);
	line-height: 1.5;
}

.edit-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
	background: rgba(255, 255, 255, 0.16);
	padding: 14rpx 24rpx;
	border-radius: 999rpx;
	border: 2rpx solid rgba(255, 255, 255, 0.3);
	flex-shrink: 0;
}
</style>
