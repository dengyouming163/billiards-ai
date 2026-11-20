<template>
	<view class="album-entry" @click="goToAlbum">
		<view class="entry-header">
			<view class="header-left">
				<Icon name="camera" :size="36" />
				<text class="entry-title">个人相册</text>
			</view>
			<view class="header-right">
				<text class="entry-count">{{ album.length }}张照片</text>
				<text class="entry-arrow">›</text>
			</view>
		</view>
		<view class="album-preview">
			<view class="preview-grid">
				<view
					v-for="(item, index) in displayAlbum"
					:key="index"
					class="preview-item-wrap"
				>
					<image
						:src="item"
						class="preview-item"
						mode="aspectFill"
						lazy-load
					/>
				</view>
				<view v-if="album.length === 0" class="empty-album">
					<view class="empty-icon"><Icon name="album" :size="48" /></view>
					<text class="empty-text">暂无照片</text>
				</view>
				<view v-if="album.length > 3" class="more-count">
					<text>+{{ album.length - 3 }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
	album: string[]
}>()

const displayAlbum = computed(() => {
	return props.album.slice(0, 3)
})

function goToAlbum() {
	uni.navigateTo({ url: '/pages/profile/album' })
}
</script>

<style lang="scss" scoped>
.album-entry {
	background: rgba(30, 41, 59, 0.7);
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	border: 1rpx solid rgba(71, 85, 105, 0.3);
	box-shadow: 0 4rpx 20rpx rgba(0,0,0,.2);
}

.entry-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20rpx;
}

.header-left {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.entry-icon {
	font-size: 32rpx;
}

.entry-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #f8fafc;
}

.header-right {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.entry-count {
	font-size: 26rpx;
	color: #64748b;
}

.entry-arrow {
	font-size: 32rpx;
	color: #64748b;
}

.album-preview {
	padding-top: 8rpx;
}

.preview-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12rpx;
}

.preview-item {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
}

.preview-item-wrap {
	position: relative;
	width: 100%;
	padding-bottom: 177.78%;
	overflow: hidden;
	border-radius: 12rpx;
	background: rgba(71, 85, 105, 0.3);
}

.empty-album {
	grid-column: span 3;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40rpx 0;
	background: rgba(71, 85, 105, 0.3);
	border-radius: 12rpx;
}

.empty-icon {
	font-size: 48rpx;
	margin-bottom: 12rpx;
}

.empty-text {
	font-size: 26rpx;
	color: #64748b;
}

.more-count {
	grid-column: span 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.4);
	border-radius: 12rpx;
	color: #ffffff;
	font-size: 28rpx;
	font-weight: 600;
}
</style>
