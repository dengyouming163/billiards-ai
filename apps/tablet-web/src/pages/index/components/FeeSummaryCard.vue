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
  background: linear-gradient(145deg, rgba(35, 35, 60, 0.9), rgba(25, 25, 50, 0.85));
  border-radius: 48rpx;
  border: 3rpx solid rgba(201, 169, 98, 0.2);
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.4), inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
  padding: 44rpx;
  margin-bottom: 28rpx;
  flex-shrink: 0;
}

.fee-summary-header {
  display: flex; align-items: center; gap: 28rpx; margin-bottom: 40rpx;
  .fee-summary-icon-wrap {
    width: 96rpx; height: 96rpx;
    background: linear-gradient(135deg, rgba(201, 169, 98, 0.25), rgba(201, 169, 98, 0.08));
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 3rpx solid rgba(201, 169, 98, 0.4);
    .fee-summary-icon { font-size: 56rpx; filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.3)); }
  }
  .fee-summary-title { font-size: 48rpx; color: #c9a962; font-weight: 700; letter-spacing: 6rpx; }
}

.fee-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32rpx; }

.fee-summary-item {
  text-align: center; padding: 36rpx 24rpx; border-radius: 32rpx;
  background: rgba(0, 0, 0, 0.25); border: 3rpx solid rgba(255, 255, 255, 0.08);

  &.total {
    background: linear-gradient(135deg, rgba(201, 169, 98, 0.2), rgba(201, 169, 98, 0.08));
    border-color: rgba(201, 169, 98, 0.35);
    .fee-summary-label { color: #c9a962; }
    .fee-summary-value { text-shadow: 0 4rpx 20rpx rgba(201, 169, 98, 0.5); }
  }
  &.paid {
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(34, 197, 94, 0.08));
    border-color: rgba(52, 211, 153, 0.25);
    .fee-summary-label { color: #34d399; }
  }
  &.payable {
    background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(239, 68, 68, 0.08));
    border-color: rgba(248, 113, 113, 0.25);
    .fee-summary-label { color: #f87171; }
    .fee-summary-value { text-shadow: 0 4rpx 20rpx rgba(248, 113, 113, 0.5); }
  }

  .fee-summary-label { display: block; font-size: 32rpx; color: rgba(255, 255, 255, 0.7); margin-bottom: 20rpx; letter-spacing: 3rpx; }

  .fee-summary-amount {
    display: flex; align-items: baseline; justify-content: center; gap: 12rpx;
    .fee-summary-currency { font-size: 44rpx; font-weight: 700; }
    .fee-summary-value { font-size: 80rpx; font-weight: 900; line-height: 1; letter-spacing: 3rpx; }
  }
}

.fee-summary-action {
  display: flex; align-items: center; justify-content: center; gap: 20rpx;
  margin-top: 36rpx; padding: 36rpx 56rpx;
  background: linear-gradient(135deg, #1a472a 0%, #1e5631 50%, #2d6a4f 100%);
  border: 3rpx solid rgba(52, 211, 153, 0.4); border-radius: 44rpx;
  box-shadow: 0 12rpx 40rpx rgba(34, 197, 94, 0.25), inset 0 2rpx 0 rgba(255, 255, 255, 0.15);
  transition: all 0.3s;

  &:active { transform: scale(0.98); background: linear-gradient(135deg, #153d24 0%, #184d2b 50%, #245a42 100%); }

  .fsa-icon-wrap {
    width: 72rpx; height: 72rpx; background: rgba(52, 211, 153, 0.15);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2rpx solid rgba(52, 211, 153, 0.3);
  }
  .fsa-icon { font-size: 40rpx; }
  .fsa-text { font-size: 42rpx; font-weight: 700; color: #34d399; letter-spacing: 4rpx; }
  .fsa-arrow {
    width: 60rpx; height: 60rpx; background: rgba(52, 211, 153, 0.15);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    border: 2rpx solid rgba(52, 211, 153, 0.3);
  }
  .fsa-arrow-icon { font-size: 40rpx; color: #34d399; font-weight: 700; }
}
</style>
