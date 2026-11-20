<template>
	<view class="section-card album-card">
		<view class="section-header">
			<text class="section-icon">📸</text>
			<text class="section-title">个人相册</text>
			<text class="section-count">{{ album?.length || 0 }}/9</text>
		</view>
		<view class="album-grid">
			<view 
				class="album-item" 
				v-for="(item, index) in displayAlbum" 
				:key="index"
				@click="previewAlbum(index)"
			>
				<image :src="item" class="album-image" mode="aspectFill" lazy-load />
			</view>
			<view class="album-item add-btn" v-if="canAddAlbum" @click="handleAddAlbum">
				<text class="add-icon">+</text>
			</view>
		</view>
	</view>

	<view class="album-preview" v-if="previewVisible" @click="previewVisible = false">
		<image :src="currentPreviewImage" class="preview-image" mode="aspectFit" lazy-load />
		<text class="preview-close">✕</text>
	</view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadAlbum } from '@/api/modules/profile'
import { uploadFile } from '@/api/request'

const props = defineProps<{
	album?: string[]
}>()

const emit = defineEmits<{ (e: 'album-updated', url: string): void }>()

const previewVisible = ref(false)
const currentPreviewIndex = ref(0)
const uploading = ref(false)

const displayAlbum = computed(() => props.album?.slice(0, 8) || [])
const canAddAlbum = computed(() => !props.album || props.album.length < 9)
const currentPreviewImage = computed(() => props.album?.[currentPreviewIndex.value] || '')

function previewAlbum(index: number) {
	currentPreviewIndex.value = index
	previewVisible.value = true
}

function handleAddAlbum() {
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
		sourceType: ['album', 'camera'],
		success: async (res) => {
			const filePath = res.tempFilePaths[0]
			if (!filePath) return
			uploading.value = true
			uni.showLoading({ title: '上传中...' })
			try {
				// Step 1: 上传文件到服务器，获取 URL
				const serverUrl = await uploadFile('/upload.Upload/image', filePath, 'file')
				// Step 2: 将 URL 保存到 profile 相册
				await uploadAlbum(serverUrl)
				uni.hideLoading()
				emit('album-updated', serverUrl)
				uni.showToast({ title: '上传成功', icon: 'success' })
			} catch (e: any) {
				uni.hideLoading()
				uni.showToast({ title: e.message || '上传失败', icon: 'none' })
			} finally {
				uploading.value = false
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.section-card {
	background: rgba(30, 41, 59, 0.7);
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border: 1rpx solid rgba(71, 85, 105, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,.2);
}

.section-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin-bottom: 20rpx;
}

.section-icon {
	font-size: 32rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #f8fafc;
	flex: 1;
}

.section-count {
	font-size: 24rpx;
	color: #64748b;
}

.album-grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16rpx;
}

.album-item {
	aspect-ratio: 1;
	border-radius: 16rpx;
	overflow: hidden;
	background: rgba(71, 85, 105, 0.3);
	position: relative;
}

.album-image {
	width: 100%;
	height: 100%;
}

.add-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
	border: 2rpx dashed rgba(245, 158, 11, 0.3);
}

.add-icon {
	font-size: 48rpx;
	color: #f59e0b;
	font-weight: 300;
}

.album-preview {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.preview-image {
	max-width: 100%;
	max-height: 100%;
}

.preview-close {
	position: absolute;
	top: 60rpx;
	right: 30rpx;
	font-size: 48rpx;
	color: #ffffff;
}
</style>
