<template>
	<view v-if="visible" class="store-selector-mask" @click="handleClose">
		<view class="store-selector-popup" @click.stop>
			<view class="popup-header">
				<text class="popup-title">选择门店</text>
				<view class="close-btn" @click="handleClose">
					<text class="close-text">✕</text>
				</view>
			</view>
			<scroll-view class="popup-body" scroll-y>
				<view
					v-for="store in storeList"
					:key="store.id"
					class="store-item"
					:class="{ active: String(store.id) === String(currentStoreId) }"
					@click="handleSelect(store)"
				>
					<view class="store-info">
						<text class="store-name">{{ store.name }}</text>
						<text class="store-address">{{ store.address || '暂无地址' }}</text>
					</view>
					<view v-if="String(store.id) === String(currentStoreId)" class="check-mark">✓</view>
				</view>
				<view v-if="storeList.length === 0" class="empty-state">
					<text class="empty-icon">🏪</text>
					<text class="empty-text">暂无门店数据</text>
				</view>
			</scroll-view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStoreList, type Store } from '@/api/modules/store'

interface Props {
	visible: boolean
	currentStoreId?: number | string
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'select'])

const storeList = ref<Store[]>([])

async function loadStores() {
	try {
		const result = await getStoreList()
		storeList.value = Array.isArray(result) ? result : (result.data || [])
		} catch {
	}
}

function handleClose() {
	emit('close')
}

function handleSelect(store: Store) {
	emit('select', store)
}

onMounted(() => {
	loadStores()
})
</script>

<style lang="scss" scoped>
.store-selector-mask {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	z-index: 1000;
	display: flex;
	align-items: flex-end;
	animation: fadeIn .2s ease;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.store-selector-popup {
	width: 100%;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: slideUp .3s ease;
}

@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	height: 96rpx;
	padding: 0 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
	flex-shrink: 0;
}

.popup-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #1a1a1a;
}

.close-btn {
	position: absolute;
	right: 16rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.close-text {
	font-size: 32rpx;
	color: #999;
}

.popup-body {
	flex: 1;
	min-height: 0;
	width: auto;
	padding: 24rpx 32rpx;
	padding-bottom: calc(24rpx + env(safe-area-inset-bottom) + 80rpx);
}

.store-item {
	display: flex;
	align-items: center;
	padding: 28rpx 24rpx;
	margin-bottom: 16rpx;
	background: #f8f8f8;
	border-radius: 20rpx;
	border: 2rpx solid transparent;
	transition: background .2s;

	&:active {
		background: #eef7f2;
	}

	&.active {
		background: #eef7f2;
		border-color: #059669;
	}
}

.store-info {
	flex: 1;
	min-width: 0;
	margin-right: 16rpx;
}

.store-name {
	display: block;
	font-size: 30rpx;
	font-weight: 600;
	color: #1a1a1a;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.store-address {
	display: block;
	font-size: 24rpx;
	color: #999;
	margin-top: 6rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.check-mark {
	flex-shrink: 0;
	width: 44rpx;
	height: 44rpx;
	border-radius: 50%;
	background: #059669;
	color: #fff;
	font-size: 26rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-icon {
	font-size: 72rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}
</style>
