<template>
	<view class="section-card tags-card">
		<view class="section-header">
			<text class="section-icon">🏷️</text>
			<text class="section-title">个人标签</text>
		</view>
		<view class="tags-container">
			<view 
				class="tag-item" 
				v-for="(tag, index) in displayTags" 
				:key="index"
			>
				<text>{{ tag }}</text>
			</view>
			<view class="tag-item add-tag" @click="handleAddTag">
				<text>+ 添加标签</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
	tags?: string[]
}>()

const displayTags = computed(() => props.tags?.slice(0, 5) || [])

function handleAddTag() {
	uni.showModal({
		title: '添加标签',
		editable: true,
		placeholderText: '请输入标签',
		success: (res) => {
			if (res.confirm && res.content) {
				uni.showToast({ title: '标签添加成功', icon: 'success' })
			}
		}
	})
}
</script>

<style lang="scss" scoped>
.section-card {
	background: #ffffff;
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
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
	color: #1f2937;
	flex: 1;
}

.tags-container {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.tag-item {
	font-size: 26rpx;
	color: #374151;
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
	padding: 12rpx 24rpx;
	border-radius: 32rpx;
	border: 1rpx solid rgba(16, 185, 129, 0.2);
}

.add-tag {
	color: #10B981;
	border-style: dashed;
}
</style>
