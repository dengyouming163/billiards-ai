<template>
	<view class="page">
		<view class="album-content">
			<view v-if="albumList.length === 0" class="empty-state">
				<view class="empty-illustration">
					<text class="empty-icon">📷</text>
				</view>
				<text class="empty-title">还没有照片</text>
				<text class="empty-desc">点击下方按钮上传您的第一张照片</text>
			</view>

			<view v-else class="album-grid">
				<view
					v-for="(item, index) in albumList"
					:key="index"
					class="album-item"
					@click="previewImage(index)"
					@longpress="showDeleteMenu(index)"
				>
					<image :src="item" class="album-image" mode="aspectFill" lazy-load />
					<view class="item-check">
						<text class="check-mark">✓</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 底部悬浮上传按钮 -->
		<view class="fab-upload" @click="handleUpload">
			<text class="fab-icon">+</text>
		</view>

		<view v-if="showPreview" class="preview-modal" @click="closePreview">
			<image
				:src="currentImage"
				class="preview-image"
				mode="aspectFit"
				@click.stop
			/>
			<view class="preview-close" @click="closePreview">
				<text>✕</text>
			</view>
			<view class="preview-indicator">
				<text>{{ currentIndex + 1 }}/{{ albumList.length }}</text>
			</view>
			<view class="preview-arrow preview-prev" @click="prevImage">‹</view>
			<view class="preview-arrow preview-next" @click="nextImage">›</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProfile, uploadAlbum, deleteAlbum } from '@/api/modules/profile'
import { uploadFile } from '@/api/request'

const albumList = ref<string[]>([])
const showPreview = ref(false)
const currentIndex = ref(0)
const currentImage = ref('')
const uploading = ref(false)

async function loadAlbum() {
	try {
		const result = await getProfile()
		if (result && result.album) {
			albumList.value = result.album
		}
	} catch {
		console.error('Failed to load album')
	}
}

function handleUpload() {
	if (uploading.value) {
		uni.showToast({ title: '正在上传中...', icon: 'none' })
		return
	}
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
		count: 9,
		sourceType: [sourceType],
		success: async (res) => {
			if (uploading.value) return
			uploading.value = true
			uni.showLoading({ title: '上传中...' })

			let successCount = 0
			for (const filePath of res.tempFilePaths) {
				try {
					const url = await uploadFile('/upload.Upload/image', filePath, 'file')
					if (url) {
						await uploadAlbum(url)
						albumList.value.push(url)
						successCount++
					}
				} catch {
					console.error('Upload failed')
				}
			}

			uni.hideLoading()
			uploading.value = false
			uni.showToast({ title: `成功上传${successCount}张照片`, icon: 'success' })
		}
	})
}

function previewImage(index: number) {
	currentIndex.value = index
	currentImage.value = albumList.value[index]
	showPreview.value = true
}

function closePreview() {
	showPreview.value = false
}

function prevImage() {
	if (currentIndex.value > 0) {
		currentIndex.value--
		currentImage.value = albumList.value[currentIndex.value]
	}
}

function nextImage() {
	if (currentIndex.value < albumList.value.length - 1) {
		currentIndex.value++
		currentImage.value = albumList.value[currentIndex.value]
	}
}

function showDeleteMenu(index: number) {
	uni.showModal({
		title: '提示',
		content: '确定要删除这张照片吗？',
		success: async (res) => {
			if (res.confirm) {
				const url = albumList.value[index]
				try {
					await deleteAlbum(url)
					albumList.value.splice(index, 1)
					uni.showToast({ title: '删除成功', icon: 'success' })
				} catch {
					uni.showToast({ title: '删除失败', icon: 'none' })
				}
			}
		}
	})
}

onMounted(() => {
	loadAlbum()
})
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: #f5f5f5;
	padding-bottom: 160rpx;
}

.album-content {
	padding: 24rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 120rpx 0;
}

.empty-illustration {
	width: 160rpx;
	height: 160rpx;
	background: #f0fdf4;
	border-radius: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 40rpx;
}

.empty-icon {
	font-size: 80rpx;
}

.empty-title {
	font-size: 32rpx;
	color: #333;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.empty-desc {
	font-size: 26rpx;
	color: #999;
}

.album-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.album-item {
	width: calc(33.33% - 10rpx);
	margin-bottom: 15rpx;
	position: relative;
	aspect-ratio: 1;
	border-radius: 12rpx;
	overflow: hidden;
	background: #f3f4f6;
}

.album-image {
	width: 100%;
	height: 100%;
}

.item-check {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 40rpx;
	height: 40rpx;
	background: rgba(5, 150, 105, 0.85);
	border-radius: 20rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.check-mark {
	font-size: 22rpx;
	color: #fff;
	font-weight: 700;
}

// 悬浮上传按钮
.fab-upload {
	position: fixed;
	bottom: calc(env(safe-area-inset-bottom) + 60rpx);
	right: 40rpx;
	width: 112rpx;
	height: 112rpx;
	background: linear-gradient(135deg, #10b981, #059669);
	border-radius: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(5, 150, 105, 0.35);
	z-index: 100;
	transition: transform 0.2s;

	&:active {
		transform: scale(0.92);
	}
}

.fab-icon {
	font-size: 56rpx;
	color: #fff;
	font-weight: 300;
	line-height: 1;
	margin-top: -4rpx;
}

// 图片预览
.preview-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.95);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.preview-image {
	max-width: 100%;
	max-height: 100%;
}

.preview-close {
	position: absolute;
	top: 60rpx;
	right: 40rpx;
	width: 64rpx;
	height: 64rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.15);
	border-radius: 50%;
	color: #fff;
	font-size: 32rpx;
}

.preview-indicator {
	position: absolute;
	bottom: 60rpx;
	left: 50%;
	transform: translateX(-50%);
	background-color: rgba(0, 0, 0, 0.6);
	padding: 10rpx 20rpx;
	border-radius: 20rpx;
	color: #fff;
	font-size: 24rpx;
}

.preview-arrow {
	position: absolute;
	top: 50%;
	transform: translateY(-50%);
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: rgba(255, 255, 255, 0.15);
	border-radius: 50%;
	color: #fff;
	font-size: 48rpx;
}

.preview-prev {
	left: 30rpx;
}

.preview-next {
	right: 30rpx;
}
</style>
