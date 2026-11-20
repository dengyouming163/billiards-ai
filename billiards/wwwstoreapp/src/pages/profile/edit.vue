<template>
	<view class="page">
		<view class="form-content">
			<view class="form-section">
				<view class="form-item avatar-item">
					<text class="form-label">头像</text>
					<view class="avatar-upload" @click="handleAvatarUpload">
						<Icon v-if="!form.avatar" class="avatar-icon" name="user" size="80" />
						<image v-else :src="form.avatar" class="avatar-img" mode="aspectFill" />
						<view class="upload-mask">
							<Icon name="camera" size="24" />
						</view>
					</view>
				</view>

				<view class="form-item">
					<text class="form-label">昵称</text>
					<input 
						v-model="form.name" 
						class="form-input" 
						placeholder="请输入昵称"
						:maxlength="20"
					/>
				</view>

				<view class="form-item">
					<text class="form-label">手机号</text>
					<input 
						v-model="form.phone" 
						class="form-input" 
						placeholder="请输入手机号"
						type="number"
						:maxlength="11"
					/>
				</view>

			</view>

			<view class="info-section">
				<view class="info-item">
					<text class="info-label">所属门店</text>
					<text class="info-value">{{ originalProfile.store_name || '-' }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">职位</text>
					<text class="info-value">{{ getRoleText(originalProfile.role) }}</text>
				</view>
				<view class="info-item">
					<text class="info-label">入职时间</text>
					<text class="info-value">{{ originalProfile.join_time || '-' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getProfile, updateProfile, uploadAvatar, type ProfileData } from '@/api/modules/profile'
import Icon from '@/components/Icon.vue'
const originalProfile = ref<ProfileData>({
	id: '',
	name: '',
	phone: '',
	role: 'assistant',
	store_name: '',
	join_time: '',
	avatar: '',
	nickname: '',
	signature: '',
	tags: [],
	album: [],
	services: [],
	today_income: 0,
	today_orders: 0,
	today_duration: 0
})

const form = reactive({
	name: '',
	phone: '',
	avatar: ''
})

const saving = ref(false)

const canSave = computed(() => {
	return form.name.trim() !== '' && 
		   form.phone.trim() !== '' && 
		   form.phone.length === 11
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

function goBack() {
	uni.navigateBack()
}

async function loadProfile() {
	try {
		const result = await getProfile()
		if (result) {
			originalProfile.value = result
			form.name = result.name || ''
			form.phone = result.phone || ''
			form.avatar = result.avatar || ''
		}
	} catch {
		console.error('Failed to load profile')
	}
}

function handleAvatarUpload() {
	uni.showActionSheet({
		itemList: ['拍照', '从相册选择'],
		success: (res) => {
			const sourceType = res.tapIndex === 0 ? 'camera' : 'album'
			chooseImage(sourceType)
		}
	})
}

async function chooseImage(sourceType: 'camera' | 'album') {
	try {
		const res = await new Promise<UniApp.ChooseImageSuccessCallbackResult>((resolve, reject) => {
			uni.chooseImage({
				count: 1,
				sourceType: [sourceType],
				success: resolve,
				fail: reject
			})
		})
		const tempFilePath = res.tempFilePaths[0]
		// 先显示本地预览
		form.avatar = tempFilePath
		uni.showLoading({ title: '上传中...', mask: true })
		try {
			const result = await uploadAvatar(tempFilePath)
			form.avatar = result.url
			uni.hideLoading()
			uni.showToast({ title: '头像已更新', icon: 'success' })
		} catch {
			uni.hideLoading()
			uni.showToast({ title: '头像上传失败，请重试', icon: 'none' })
		}
	} catch {
		// 用户取消选择，不处理
	}
}

async function handleSave() {
	if (!canSave.value || saving.value) return

	saving.value = true
	
	try {
		await updateProfile({
				nickname: form.name,
				avatar: form.avatar,
				phone: form.phone
			})

			uni.showToast({ title: '保存成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
	} catch {
		uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
	} finally {
		saving.value = false
	}
}

onMounted(() => {
	loadProfile()
})
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
	border-bottom: 1rpx solid #e5e5e5;
	position: sticky;
	top: 0;
	z-index: 100;
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

.save-btn {
	font-size: 30rpx;
	color: #999999;
	padding: 12rpx 24rpx;
	border-radius: 24rpx;

	&.active {
		color: #07C160;
		font-weight: 600;
	}
}

.form-content {
	padding: 24rpx;
}

.form-section {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.album-section {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.form-item {
	display: flex;
	align-items: center;
	gap: 20rpx;
	padding: 24rpx 0;
	border-bottom: 1rpx solid #e5e5e5;

	&:last-child {
		border-bottom: none;
	}

	&.avatar-item {
		flex-direction: column;
		align-items: flex-start;
	}
}

.form-label {
	font-size: 28rpx;
	color: #999999;
	width: 120rpx;
	flex-shrink: 0;
}

.form-input {
	flex: 1;
	height: 88rpx;
	font-size: 30rpx;
	color: #333333;
	background: #f7f7f7;
	border-radius: 8rpx;
	padding: 0 20rpx;
	box-sizing: border-box;
}

.form-textarea {
	flex: 1;
	width: 100%;
	min-height: 160rpx;
	font-size: 30rpx;
	color: #333333;
	background: #f7f7f7;
	border-radius: 8rpx;
	padding: 20rpx;
	box-sizing: border-box;
	line-height: 1.6;
}

.form-tip {
	font-size: 24rpx;
	color: #999999;
	text-align: right;
	margin-top: 12rpx;
	display: block;
}

.avatar-upload {
	position: relative;
	width: 160rpx;
	height: 160rpx;
	background: #f7f7f7;
	border-radius: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	margin-top: 16rpx;
}

.avatar-icon {
	font-size: 80rpx;
	color: #999999;
}

.avatar-img {
	width: 100%;
	height: 100%;
}

.upload-mask {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 50rpx;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
	color: #ffffff;
}

.info-section {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 24rpx;
}

.info-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #e5e5e5;

	&:last-child {
		border-bottom: none;
	}
}

.info-label {
	font-size: 28rpx;
	color: #999999;
}

.info-value {
	font-size: 28rpx;
	color: #333333;
	font-weight: 500;
}
</style>
