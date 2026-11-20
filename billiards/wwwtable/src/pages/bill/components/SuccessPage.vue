<template>
  <view class="success-overlay">
    <view class="success-card">
      <view class="success-icon">✅</view>
      <text class="success-title">收款成功</text>
      <text class="success-amount">¥{{ formatPrice(paidAmount) }}</text>
      <view class="success-detail">
        <view class="detail-row"><text class="detail-label">台桌</text><text class="detail-value">🎱 {{ tableName }}</text></view>
        <view class="detail-row"><text class="detail-label">订单号</text><text class="detail-value">#{{ orderNo }}</text></view>
        <view class="detail-row"><text class="detail-label">支付方式</text><text class="detail-value">微信</text></view>
      </view>
      <view class="success-btn" @click="$emit('go-home')"><text>返回首页</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  paidAmount: number
  tableName: string
  orderNo: string
}>()

defineEmits<{ 'go-home': [] }>()
</script>

<style lang="scss" scoped>
.success-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 64rpx;
}

.success-card {
  width: 100%; max-width: 1200rpx;
  background: linear-gradient(145deg, #1a1a2e, #252542);
  border-radius: 48rpx; padding: 80rpx 64rpx; text-align: center;
  border: 3rpx solid rgba(46, 213, 115, 0.4);
  box-shadow: 0 24rpx 100rpx rgba(0, 0, 0, 0.6);
}

.success-icon { font-size: 220rpx; margin-bottom: 32rpx; }

.success-title {
  display: block; font-size: 80rpx; font-weight: 700;
  color: #2ed573; margin-bottom: 20rpx;
}

.success-amount {
  display: block; font-size: 160rpx; font-weight: 800; color: #c9a962;
  margin-bottom: 64rpx; text-shadow: 0 0 60rpx rgba(201, 169, 98, 0.6);
}

.success-detail {
  background: rgba(255, 255, 255, 0.04); border-radius: 32rpx;
  padding: 40rpx 48rpx; margin-bottom: 56rpx;
  .detail-row {
    display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0;
    &:not(:last-child) { border-bottom: 2rpx solid rgba(255, 255, 255, 0.06); }
    .detail-label { font-size: 52rpx; color: #6b7280; }
    .detail-value { font-size: 52rpx; color: #fff; font-weight: 600; }
  }
}

.success-btn {
  width: 100%; height: 140rpx;
  background: linear-gradient(135deg, #c9a962, #8a6d3b);
  border-radius: 56rpx; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 12rpx 48rpx rgba(201, 169, 98, 0.45);
  &:active { transform: scale(0.97); }
  text { font-size: 60rpx; font-weight: 700; color: #fff; }
}
</style>
