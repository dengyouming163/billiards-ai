<template>
  <view class="qr-overlay" v-if="visible" @click="$emit('close')">
    <view class="qr-modal" @click.stop>
      <view class="qr-close" @click="$emit('close')">✕</view>
      <text class="qr-title">微信扫码支付</text>
      <view class="qr-image-wrap">
        <image v-if="qrCodeUrl" class="qr-image" :src="qrCodeUrl" mode="aspectFit" />
        <view v-else class="qr-loading"><view class="qr-spinner"></view><text>生成中...</text></view>
      </view>
      <text class="qr-amount">¥{{ formatPrice(amount) }}</text>
      <text class="qr-hint">请使用微信扫描二维码完成支付</text>
      <view class="qr-status-row">
        <view class="qr-status-dot" :class="payStatus"></view>
        <text class="qr-status-text">{{ statusText }}</text>
      </view>
      <view class="qr-actions">
        <view class="qr-btn cancel" @click="$emit('close')"><text>取消</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  visible: boolean
  qrCodeUrl: string
  amount: number
  payStatus: string
  statusText: string
}>()

defineEmits<{ close: [] }>()
</script>

<style lang="scss" scoped>
.qr-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85);
  display: flex; align-items: center; justify-content: center; z-index: 999;
}

.qr-modal {
  background: linear-gradient(145deg, #1a1a2e, #252542);
  border-radius: 48rpx; padding: 80rpx; text-align: center;
  width: 1500rpx; border: 3rpx solid rgba(201, 169, 98, 0.3);
  box-shadow: 0 24rpx 100rpx rgba(0, 0, 0, 0.6), 0 0 80rpx rgba(201, 169, 98, 0.15);
}

.qr-close { text-align: right; font-size: 72rpx; color: #a0a0b0; margin-bottom: 24rpx; }

.qr-title {
  font-size: 68rpx; color: #c9a962; font-weight: 700;
  display: block; margin-bottom: 48rpx;
}

.qr-image-wrap {
  width: 1000rpx; height: 1000rpx; margin: 0 auto 40rpx;
  background: #fff; border-radius: 28rpx;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

.qr-image { width: 980rpx; height: 980rpx; }

.qr-loading {
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
  text { color: #999; font-size: 52rpx; }
}

.qr-spinner {
  width: 80rpx; height: 80rpx; border: 8rpx solid #e0e0e0;
  border-top-color: #c9a962; border-radius: 50%; animation: spin 1s linear infinite;
}

.qr-amount {
  font-size: 110rpx; color: #fff; font-weight: 800;
  display: block; margin-bottom: 16rpx;
}

.qr-hint { font-size: 48rpx; color: #a0a0b0; display: block; margin-bottom: 40rpx; }

.qr-status-row {
  display: flex; align-items: center; justify-content: center;
  gap: 20rpx; margin-bottom: 40rpx;
}

.qr-status-dot {
  width: 24rpx; height: 24rpx; border-radius: 50%;
  &.idle { background: #6b7280; }
  &.waiting { background: #f59e0b; animation: pulse 1.5s infinite; }
  &.paid { background: #10b981; }
}

.qr-status-text { font-size: 50rpx; color: #a0a0b0; }

.qr-actions { display: flex; gap: 32rpx; justify-content: center; }

.qr-btn {
  padding: 28rpx 80rpx; border-radius: 40rpx; font-size: 52rpx; border: none;
  &.cancel { background: #374151; text { color: #fff; } }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
</style>
