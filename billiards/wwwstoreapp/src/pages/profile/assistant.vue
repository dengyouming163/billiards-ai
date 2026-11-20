<template>
	<view class="page">
		<view class="page-header">
			<view class="back-btn" @click="goBack">
				<text>‹</text>
			</view>
			<text class="page-title">我的宣传页</text>
			<view class="save-btn" @click="handleSave" :class="{ active: hasChanges }">
				<text>保存</text>
			</view>
		</view>

		<view class="edit-section">
			<view class="section-title-row">
				<Icon class="section-icon" name="user" size="32" />
				<text class="section-title">基本信息</text>
			</view>

			<view class="form-row">
				<text class="form-label">头像</text>
				<view class="avatar-upload" @click="handleAvatarUpload">
					<Icon v-if="!profile.avatar" class="avatar-icon" name="user" size="70" />
					<image v-else :src="profile.avatar" class="avatar-img" mode="aspectFill" />
					<view class="upload-badge"><Icon name="camera" size="22" /></view>
				</view>
			</view>

			<view class="form-row">
				<text class="form-label">昵称</text>
				<input 
					v-model="profile.nickname" 
					class="form-input" 
					placeholder="请输入昵称"
					:maxlength="20"
					@input="markChanged"
				/>
			</view>

			<view class="form-row">
				<text class="form-label">个人签名</text>
				<textarea 
					v-model="profile.signature" 
					class="form-textarea" 
					placeholder="输入个人签名，展示你的风采..."
					:maxlength="100"
					@input="markChanged"
				></textarea>
			</view>
		</view>

		<view class="edit-section">
			<view class="section-title-row">
				<Icon class="section-icon" name="tag" size="32" />
				<text class="section-title">个人标签</text>
				<view class="tag-count" :class="{ 'warning': !canSaveTags }">
					<text>{{ tagCountText }}</text>
				</view>
			</view>

			<view class="tags-hint" v-if="!canSaveTags">
				<text>请选择{{ MIN_TAGS }}-{{ MAX_TAGS }}个标签</text>
			</view>

			<view class="tags-container">
				<view 
					v-for="tag in tagOptions" 
					:key="tag.id" 
					class="tag-chip"
					:class="{ 'selected': isTagSelected(tag.id) }"
					@tap="toggleTag(tag.id)"
				>
					<text class="tag-text">{{ tag.name }}</text>
					<Icon v-if="isTagSelected(tag.id)" class="tag-check" name="check" size="24" />
				</view>
				<view v-if="tagOptions.length === 0" class="empty-state">
					<text>暂无标签可选择</text>
				</view>
			</view>
		</view>

		<view class="edit-section">
			<view class="section-title-row">
				<Icon class="section-icon" name="camera" size="32" />
				<text class="section-title">个人相册</text>
				<text class="add-btn" @click="goToAlbum">管理相册</text>
			</view>

			<view class="album-preview">
				<view class="photo-grid">
					<view 
						v-for="(item, index) in displayAlbum" 
						:key="index" 
						class="photo-wrap"
					>
						<image :src="item" class="photo-item" mode="aspectFill" lazy-load />
					</view>
					<view v-if="profile.album.length === 0" class="add-photo" @click="goToAlbum">
						<text class="add-icon">+</text>
						<text class="add-text">添加照片</text>
					</view>
				</view>
				<text v-if="profile.album.length > 4" class="album-count">共{{ profile.album.length }}张照片</text>
			</view>
		</view>

		<view class="edit-section">
			<view class="section-title-row">
				<Icon class="section-icon" name="briefcase" size="32" />
				<text class="section-title">服务项目</text>
				<text class="add-btn" @click="showAddService">+ 添加</text>
			</view>

			<view class="services-list">
				<view 
					v-for="(service, index) in services" 
					:key="service.id || index" 
					class="service-item"
				>
					<view class="service-left">
						<view class="service-icon-wrap">
							<text class="service-icon">{{ service.icon }}</text>
						</view>
						<view class="service-info">
							<input 
								v-model="service.name" 
								class="service-name-input" 
								placeholder="服务名称"
								@input="markChanged"
							/>
							<input 
								v-model="service.description" 
								class="service-desc-input" 
								placeholder="服务描述"
								@input="markChanged"
							/>
						</view>
					</view>
					<view class="service-right">
						<view class="price-input-wrap">
							<text class="price-symbol">¥</text>
							<input 
								v-model="service.price" 
								class="price-input" 
								type="number"
								placeholder="0"
								@input="markChanged"
							/>
							<input 
								v-model="service.unit" 
								class="unit-input" 
								placeholder="小时"
								@input="markChanged"
							/>
						</view>
						<text class="service-remove" @click="removeService(service, index)">删除</text>
					</view>
				</view>
				<view v-if="services.length === 0" class="empty-state">
					<text>暂无服务项目，点击"+添加"添加</text>
				</view>
			</view>
		</view>

		<view class="bottom-space"></view>

		<view v-if="showServiceModal" class="modal-overlay" @click="closeServiceModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">新增服务项目</text>
					<text class="modal-close" @click="closeServiceModal">×</text>
				</view>
				<view class="modal-body">
					<view class="modal-form-item">
						<text class="modal-label">服务图标</text>
						<view class="icon-picker">
							<view 
								v-for="(icon, index) in iconOptions" 
								:key="index"
								class="icon-option"
								:class="{ selected: newService.icon === icon }"
								@click="newService.icon = icon"
							>
								<text>{{ icon }}</text>
							</view>
						</view>
					</view>
					<view class="modal-form-item">
						<text class="modal-label">服务名称</text>
						<input 
							v-model="newService.name" 
							class="modal-input" 
							placeholder="例如：一对一教学"
						/>
					</view>
					<view class="modal-form-item">
						<text class="modal-label">服务描述</text>
						<input 
							v-model="newService.description" 
							class="modal-input" 
							placeholder="简短描述服务内容"
						/>
					</view>
					<view class="modal-form-item">
						<text class="modal-label">服务价格</text>
						<view class="price-input-group">
							<text class="price-symbol">¥</text>
							<input 
								v-model="newService.price" 
								class="modal-input price" 
								type="number"
								placeholder="0"
							/>
							<input 
								v-model="newService.unit" 
								class="modal-input unit" 
								placeholder="小时"
							/>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="modal-btn cancel" @click="closeServiceModal">取消</button>
					<button class="modal-btn confirm" @click="addService">确认添加</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { getProfile, updateProfile, saveService, deleteService as apiDeleteService, getTags } from '@/api/modules/profile'
import type { ProfileData, ServiceItem, TagItem } from '@/api/modules/profile'
import config from '@/config/index'
import Icon from '@/components/Icon.vue'

const profile = ref<ProfileData>({
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
	today_duration: 0,
})

const services = ref<ServiceItem[]>([])
const newServiceIds = ref<Set<string>>(new Set())
const tagOptions = ref<TagItem[]>([])
const selectedTagIds = ref<string[]>([])

const hasChanges = ref(false)
const showServiceModal = ref(false)

const MIN_TAGS = 3
const MAX_TAGS = 5

const tagCountText = computed(() => {
	return `${selectedTagIds.value.length}/${MAX_TAGS}`
})

const canSaveTags = computed(() => {
	return selectedTagIds.value.length >= MIN_TAGS && selectedTagIds.value.length <= MAX_TAGS
})

const newService = reactive<ServiceItem>({
	icon: '👨‍🏫',
	name: '',
	description: '',
	price: '',
	unit: '小时'
})

const iconOptions = ['👨‍🏫', '🎯', '📝', '⚡', '🏆', '💪', '🎱', '✨']

const displayAlbum = computed(() => profile.value.album.slice(0, 4))

async function loadProfile() {
	try {
		const [profileResult, tagsResult] = await Promise.all([
			getProfile(),
			getTags()
		])
		
		if (profileResult) {
			profile.value = { ...profileResult }
			services.value = [...(profileResult.services || [])]
			newServiceIds.value.clear()
			
			if (profileResult.tags && profileResult.tags.length > 0) {
				selectedTagIds.value = [...profileResult.tags]
			}
		}
		
		if (tagsResult) {
			tagOptions.value = tagsResult
		}
	} catch {
		console.error('Failed to load profile')
	}
}

function goBack() {
	if (hasChanges.value) {
		uni.showModal({
			title: '提示',
			content: '有未保存的更改，确定要离开吗？',
			success: (res) => {
				if (res.confirm) {
					uni.navigateBack()
				}
			}
		})
	} else {
		uni.navigateBack()
	}
}

function markChanged() {
	hasChanges.value = true
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

function chooseImage(sourceType: 'camera' | 'album') {
	uni.chooseImage({
		count: 1,
		sourceType: [sourceType],
		success: (res) => {
			const tempFilePath = res.tempFilePaths[0]
			const token = uni.getStorageSync('token')
			uni.uploadFile({
				url: (config as any).BASE_URL + '/upload.Upload/image',
				filePath: tempFilePath,
				name: 'file',
				header: {
					'Authorization': token ? 'Bearer ' + token : ''
				},
				success: (uploadRes) => {
					try {
						const data = JSON.parse(uploadRes.data)
						if (data.code === 1) {
							profile.value.avatar = data.data.url
							hasChanges.value = true
							uni.showToast({ title: '头像已更新', icon: 'success' })
						} else {
							uni.showToast({ title: '上传失败', icon: 'none' })
						}
					} catch {
						uni.showToast({ title: '上传失败', icon: 'none' })
					}
				},
				fail: () => {
					uni.showToast({ title: '上传失败', icon: 'none' })
				}
			})
		}
	})
}

function toggleTag(tagId: string) {
	const index = selectedTagIds.value.indexOf(tagId)
	
	if (index > -1) {
		selectedTagIds.value.splice(index, 1)
		hasChanges.value = true
	} else {
		if (selectedTagIds.value.length >= MAX_TAGS) {
			uni.showToast({ title: `最多选择${MAX_TAGS}个标签`, icon: 'none' })
			return
		}
		selectedTagIds.value.push(tagId)
		hasChanges.value = true
	}
}

function isTagSelected(tagId: string): boolean {
	return selectedTagIds.value.includes(tagId)
}

function getSelectedTagNames(): string[] {
	return selectedTagIds.value.map(id => {
		const tag = tagOptions.value.find(t => t.id === id)
		return tag ? tag.name : ''
	}).filter(Boolean)
}

function goToAlbum() {
	uni.navigateTo({ url: '/pages/profile/album' })
}

function showAddService() {
	newService.icon = '👨‍🏫'
	newService.name = ''
	newService.description = ''
	newService.price = ''
	newService.unit = '小时'
	showServiceModal.value = true
}

function closeServiceModal() {
	showServiceModal.value = false
}

async function addService() {
	if (!newService.name || !newService.price) {
		uni.showToast({ title: '请填写完整信息', icon: 'none' })
		return
	}
	try {
		const savedService = await saveService({ ...newService })
		services.value.push(savedService)
		if (savedService.id) {
			newServiceIds.value.add(savedService.id)
		}
		hasChanges.value = true
		closeServiceModal()
		uni.showToast({ title: '添加成功', icon: 'success' })
	} catch {
		uni.showToast({ title: '添加失败', icon: 'none' })
	}
}

async function removeService(service: ServiceItem, index: number) {
	uni.showModal({
		title: '提示',
		content: '确定要删除这个服务吗？',
		success: async (res) => {
			if (res.confirm) {
				if (service.id) {
					try {
						await apiDeleteService(service.id)
					} catch {
						uni.showToast({ title: '删除失败', icon: 'none' })
						return
					}
				}
				services.value.splice(index, 1)
				hasChanges.value = true
				uni.showToast({ title: '已删除', icon: 'success' })
			}
		}
	})
}

async function handleSave() {
	if (!hasChanges.value) return

	if (!canSaveTags.value) {
		uni.showToast({ title: `请选择${MIN_TAGS}-${MAX_TAGS}个标签`, icon: 'none' })
		return
	}

	try {
		await updateProfile({
			nickname: profile.value.nickname,
			avatar: profile.value.avatar,
			signature: profile.value.signature,
			tags: selectedTagIds.value
		})
		
		for (const service of services.value) {
			if (!service.id) {
				await saveService(service)
			} else if (!newServiceIds.value.has(service.id) && hasChanges.value) {
				await saveService(service)
			}
		}
		
		hasChanges.value = false
		uni.showToast({ title: '保存成功', icon: 'success' })
		await loadProfile()
	} catch {
		uni.showToast({ title: '保存失败', icon: 'none' })
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
	font-size: 28rpx;
	color: #999999;
	padding: 12rpx 24rpx;
	border-radius: 24rpx;

	&.active {
		color: #07C160;
		font-weight: 600;
	}
}

.edit-section {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	margin: 20rpx;
	border-radius: 16rpx;
	padding: 24rpx;
}

.section-title-row {
	display: flex;
	align-items: center;
	margin-bottom: 24rpx;
}

.section-icon {
	font-size: 32rpx;
	margin-right: 12rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #000000;
	flex: 1;
}

.add-btn {
	font-size: 26rpx;
	color: #07C160;
}

.form-row {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
	padding: 20rpx 0;
	border-bottom: 1rpx solid #e5e5e5;

	&:last-child {
		border-bottom: none;
	}
}

.form-label {
	font-size: 28rpx;
	color: #999999;
}

.form-input {
	height: 88rpx;
	font-size: 30rpx;
	color: #000000;
	background: #f7f7f7;
	border-radius: 8rpx;
	padding: 0 24rpx;
	box-sizing: border-box;
}

.form-textarea {
	min-height: 120rpx;
	font-size: 30rpx;
	color: #000000;
	background: #f7f7f7;
	width: 100%;
	border-radius: 8rpx;
	padding: 20rpx 24rpx;
	box-sizing: border-box;
	line-height: 1.6;
}

.avatar-upload {
	position: relative;
	width: 140rpx;
	height: 140rpx;
	background: #f7f7f7;
	border-radius: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-icon {
	font-size: 70rpx;
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 70rpx;
}

.upload-badge {
	position: absolute;
	bottom: 0;
	right: 0;
	width: 44rpx;
	height: 44rpx;
	background: #07C160;
	border-radius: 22rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 22rpx;
}

.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
	padding: 10rpx 0;
}

.tag-count {
	font-size: 24rpx;
	color: #07C160;
	padding: 6rpx 16rpx;
	background: rgba(7, 193, 96, 0.1);
	border-radius: 20rpx;
	
	&.warning {
		color: #ff9500;
		background: rgba(255, 149, 0, 0.1);
	}
}

.tags-hint {
	font-size: 24rpx;
	color: #ff9500;
	padding: 10rpx 0;
}

.tag-chip {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 14rpx 28rpx;
	background: #f7f7f7;
	color: #333333;
	border-radius: 28rpx;
	font-size: 26rpx;
	border: 2rpx solid transparent;
	transition: all 0.2s;
	
	&.selected {
		background: rgba(7, 193, 96, 0.1);
		color: #07C160;
		border-color: #07C160;
	}
	
	&:active {
		opacity: 0.7;
	}
}

.tag-check {
	font-size: 24rpx;
	font-weight: 600;
}

.empty-state {
	font-size: 26rpx;
	color: #999999;
	padding: 30rpx 0;
	text-align: center;
}

.album-preview {
	padding: 10rpx 0;
}

.photo-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12rpx;
}

.photo-wrap {
	width: 100%;
	padding-bottom: 100%;
	border-radius: 8rpx;
	overflow: hidden;
	background: #f7f7f7;
	position: relative;
}

.photo-item {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.add-photo {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #f7f7f7;
	border-radius: 8rpx;
	border: 2rpx dashed #e5e5e5;
	padding: 20rpx 0;
}

.add-icon {
	font-size: 48rpx;
	color: #999999;
	margin-bottom: 8rpx;
}

.add-text {
	font-size: 22rpx;
	color: #999999;
}

.album-count {
	font-size: 24rpx;
	color: #999999;
	text-align: right;
	margin-top: 12rpx;
	display: block;
}

.services-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.service-item {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	padding: 20rpx;
	background: #f7f7f7;
	border-radius: 12rpx;
	gap: 20rpx;
}

.service-left {
	display: flex;
	align-items: flex-start;
	gap: 16rpx;
	flex: 1;
}

.service-icon-wrap {
	width: 72rpx;
	height: 72rpx;
	background: rgba(7, 193, 96, 0.1);
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.service-icon {
	font-size: 36rpx;
}

.service-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.service-name-input {
	font-size: 30rpx;
	font-weight: 600;
	color: #000000;
	background: transparent;
	border: none;
}

.service-desc-input {
	font-size: 24rpx;
	color: #999999;
	background: transparent;
	border: none;
}

.service-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 12rpx;
}

.price-input-wrap {
	display: flex;
	align-items: center;
	gap: 6rpx;
}

.price-symbol {
	font-size: 28rpx;
	font-weight: 600;
	color: #07C160;
}

.price-input {
	width: 100rpx;
	font-size: 32rpx;
	font-weight: 600;
	color: #07C160;
	background: transparent;
	border: none;
	text-align: right;
}

.unit-input {
	width: 80rpx;
	font-size: 24rpx;
	color: #999999;
	background: transparent;
	border: none;
	text-align: right;
}

.service-remove {
	font-size: 24rpx;
	color: #dc2626;
}

.bottom-space {
	height: 40rpx;
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
	padding: 40rpx;
}

.modal-content {
	width: 100%;
	background: #ffffff;
	border-radius: 24rpx;
	overflow: hidden;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.modal-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #000000;
}

.modal-close {
	font-size: 48rpx;
	color: #999999;
	line-height: 1;
}

.modal-body {
	padding: 30rpx;
}

.modal-form-item {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

.modal-label {
	font-size: 28rpx;
	color: #999999;
}

.icon-picker {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.icon-option {
	width: 80rpx;
	height: 80rpx;
	background: #f7f7f7;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	border: 2rpx solid transparent;

	&.selected {
		background: rgba(7, 193, 96, 0.1);
		border-color: #07C160;
	}
}

.modal-input {
	height: 88rpx;
	font-size: 30rpx;
	color: #000000;
	background: #f7f7f7;
	border-radius: 8rpx;
	padding: 0 24rpx;
	box-sizing: border-box;

	&.price {
		width: 150rpx;
		text-align: center;
	}

	&.unit {
		width: 120rpx;
		text-align: center;
	}
}

.price-input-group {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.modal-footer {
	display: flex;
	gap: 20rpx;
	padding: 24rpx 30rpx;
	border-top: 1rpx solid #e5e5e5;
}

.modal-btn {
	flex: 1;
	height: 88rpx;
	border-radius: 44rpx;
	font-size: 32rpx;
	font-weight: 600;
	border: none;

	&.cancel {
		background: #f7f7f7;
		color: #999999;
	}

	&.confirm {
		background: #07C160;
		color: #ffffff;
	}
}
</style>
