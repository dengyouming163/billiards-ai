<template>
	<view class="date-modal" v-if="visible" @click="handleClose">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">{{ title }}</text>
				<text class="modal-close" @click="handleClose">×</text>
			</view>
			
			<view class="modal-body" v-if="mode === 'date' || mode === 'datetime'">
				<view class="picker-row">
					<picker mode="date" :value="currentDate" @change="onDateChange">
						<view class="picker-trigger">
							<text>{{ currentDate || '选择日期' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
			
			<view class="modal-body" v-if="mode === 'time' || mode === 'datetime'">
				<view class="picker-row">
					<picker mode="time" :value="currentTime" @change="onTimeChange">
						<view class="picker-trigger">
							<text>{{ currentTime || '选择时间' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</picker>
				</view>
			</view>
			
			<view class="modal-footer">
				<view class="btn-cancel" @click="handleClose">
					<text>取消</text>
				</view>
				<view class="btn-confirm" @click="handleConfirm">
					<text>确定</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
	visible: boolean
	title?: string
	mode?: 'date' | 'time' | 'datetime'
	defaultValue?: string
}

const props = withDefaults(defineProps<Props>(), {
	title: '选择日期时间',
	mode: 'datetime',
	defaultValue: ''
})

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'confirm', value: string): void
}>()

const currentDate = ref('')
const currentTime = ref('')

watch(() => props.defaultValue, (val) => {
	if (val) {
		if (val.includes(' ')) {
			const [date, time] = val.split(' ')
			currentDate.value = date
			currentTime.value = time
		} else if (props.mode === 'date') {
			currentDate.value = val
		} else if (props.mode === 'time') {
			currentTime.value = val
		}
	}
}, { immediate: true })

function onDateChange(e: any) {
	currentDate.value = e.detail.value
}

function onTimeChange(e: any) {
	currentTime.value = e.detail.value
}

function handleClose() {
	emit('close')
}

function handleConfirm() {
	let result = ''
	if (props.mode === 'date') {
		result = currentDate.value
	} else if (props.mode === 'time') {
		result = currentTime.value
	} else {
		result = `${currentDate.value} ${currentTime.value}`
	}
	emit('confirm', result)
}
</script>

<style lang="scss" scoped>
.date-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-content {
	width: 80%;
	max-width: 600rpx;
	background: rgba(30, 41, 59, 0.7);
	border-radius: 24rpx;
	overflow: hidden;
	border: 1rpx solid rgba(71, 85, 105, 0.3);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid rgba(71, 85, 105, 0.3);
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #f8fafc;
}

.modal-close {
	font-size: 48rpx;
	color: #94a3b8;
	line-height: 1;
}

.modal-body {
	padding: 32rpx;
}

.picker-row {
	margin-bottom: 24rpx;
	
	&:last-child {
		margin-bottom: 0;
	}
}

.picker-trigger {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	background: rgba(71, 85, 105, 0.3);
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #f8fafc;
}

.picker-arrow {
	font-size: 32rpx;
	color: #94a3b8;
}

.modal-footer {
	display: flex;
	border-top: 1rpx solid rgba(71, 85, 105, 0.3);
	
	.btn-cancel, .btn-confirm {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
	}
	
	.btn-cancel {
		color: #94a3b8;
		border-right: 1rpx solid rgba(71, 85, 105, 0.3);
	}
	
	.btn-confirm {
		color: #f59e0b;
	}
}
</style>