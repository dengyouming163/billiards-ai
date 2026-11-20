<template>
  <view class="fee-summary-card">
    <view class="fee-summary-header">
      <view class="fee-summary-icon-wrap">
        <text class="fee-summary-icon">💰</text>
      </view>
      <text class="fee-summary-title">账单汇总</text>
    </view>
    <view class="fee-summary-grid">
      <view class="fee-summary-item total">
        <text class="fee-summary-label">账单总额</text>
        <view class="fee-summary-amount">
          <text class="fee-summary-currency">¥</text>
          <text class="fee-summary-value">{{ formatPrice(totalFee) }}</text>
        </view>
      </view>
      <view class="fee-summary-item paid" v-if="paidAmount > 0">
        <text class="fee-summary-label">已支付</text>
        <view class="fee-summary-amount">
          <text class="fee-summary-currency">¥</text>
          <text class="fee-summary-value">{{ formatPrice(paidAmount) }}</text>
        </view>
      </view>
      <view class="fee-summary-item payable">
        <text class="fee-summary-label">待支付</text>
        <view class="fee-summary-amount">
          <text class="fee-summary-currency">¥</text>
          <text class="fee-summary-value">{{ formatPrice(payableAmount) }}</text>
        </view>
      </view>
    </view>
    <view class="fee-summary-action" @click="$emit('checkout')">
      <view class="fsa-icon-wrap"><text class="fsa-icon">💳</text></view>
      <text class="fsa-text">去结算</text>
      <view class="fsa-arrow"><text class="fsa-arrow-icon">›</text></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  totalFee: number
  paidAmount: number
  payableAmount: number
}>()

defineEmits<{ checkout: [] }>()
</script>

<style lang="scss" scoped>
.fee-summary-card {
  background: #ffffff;
  border-radius: 36rpx;
  border: 2rpx solid rgba(7,193,96,.08);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,.06);
  padding: 36rpx;
  margin-bottom: 24rpx;
  flex-shrink: 0;
}

.fee-summary-header {
  display: flex; align-items: center; gap: 20rpx; margin-bottom: 32rpx;
  .fee-summary-icon-wrap {
    width: 80rpx; height: 80rpx;
    background: linear-gradient(135deg, rgba(7,193,96,.1), rgba(7,193,96,.04));
    border-radius: 24rpx; display: flex; align-items: center; justify-content: center;
    border: 2rpx solid rgba(7,193,96,.2);
    .fee-summary-icon { font-size: 48rpx; }
  }
  .fee-summary-title { font-size: 40rpx; color: #333333; font-weight: 700; letter-spacing: 4rpx; }
}

.fee-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24rpx; }

.fee-summary-item {
  text-align: center; padding: 28rpx 16rpx; border-radius: 24rpx;
  background: rgba(0,0,0,.02); border: 2rpx solid rgba(0,0,0,.04);

  &.total {
    background: linear-gradient(135deg, rgba(7,193,96,.08), rgba(7,193,96,.04));
    border-color: rgba(7,193,96,.15);
    .fee-summary-label { color: #07C160; }
    .fee-summary-value { color: #07C160; }
  }
  &.paid {
    background: rgba(0,0,0,.02);
    border-color: rgba(0,0,0,.04);
    .fee-summary-label { color: #999999; }
  }
  &.payable {
    background: rgba(239,68,68,.04);
    border-color: rgba(239,68,68,.1);
    .fee-summary-label { color: #EF4444; }
    .fee-summary-value { color: #EF4444; }
  }

  .fee-summary-label { display: block; font-size: 26rpx; color: #999999; margin-bottom: 16rpx; letter-spacing: 2rpx; }

  .fee-summary-amount {
    display: flex; align-items: baseline; justify-content: center; gap: 8rpx;
    .fee-summary-currency { font-size: 36rpx; font-weight: 700; }
    .fee-summary-value { font-size: 64rpx; font-weight: 900; line-height: 1; letter-spacing: 2rpx; color: #333333; }
  }
}

.fee-summary-action {
  display: flex; align-items: center; justify-content: center; gap: 16rpx;
  margin-top: 28rpx; padding: 28rpx 48rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  border: 2rpx solid rgba(255,255,255,.3); border-radius: 36rpx;
  box-shadow: 0 8rpx 24rpx rgba(7,193,96,.3);
  transition: all 0.3s;

  &:active { transform: scale(0.96); }

  .fsa-icon-wrap {
    width: 60rpx; height: 60rpx; background: rgba(255,255,255,.15);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2rpx solid rgba(255,255,255,.2);
  }
  .fsa-icon { font-size: 36rpx; }
  .fsa-text { font-size: 36rpx; font-weight: 700; color: #ffffff; letter-spacing: 3rpx; }
  .fsa-arrow {
    width: 52rpx; height: 52rpx; background: rgba(255,255,255,.15);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2rpx solid rgba(255,255,255,.2);
  }
  .fsa-arrow-icon { font-size: 36rpx; color: #ffffff; font-weight: 700; }
}
</style>
