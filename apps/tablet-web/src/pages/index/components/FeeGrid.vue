<template>
  <view class="fee-grid">
    <!-- 台费 -->
    <view class="fee-item fee-table">
      <view class="fee-icon-wrap"><text class="fee-icon">🎱</text></view>
      <text class="fee-item-label">台费</text>
      <view class="fee-amount-row">
        <text class="fee-currency">¥</text>
        <text class="fee-item-value">{{ displayTableFee }}</text>
      </view>
      <text class="fee-item-rate">¥{{ currentRate || tableHourlyRate }}/时</text>
    </view>

    <!-- 商品 -->
    <view class="fee-item fee-product clickable" @click="$emit('product-click')">
      <view class="fee-icon-wrap"><text class="fee-icon">📦</text></view>
      <template v-if="productFee > 0">
        <text class="fee-item-label">商品</text>
        <view class="fee-amount-row">
          <text class="fee-currency">¥</text>
          <text class="fee-item-value">{{ formatPrice(productFee) }}</text>
        </view>
        <text class="fee-item-sub">{{ productCount }}件商品</text>
        <view class="fee-item-arrow"><text class="arrow-text">›</text></view>
      </template>
      <template v-else>
        <text class="fee-item-label">商品</text>
        <view class="fee-add-wrap">
          <text class="fee-add-icon">+</text>
          <text class="fee-add-text">去点单</text>
        </view>
      </template>
    </view>

    <!-- 助教 -->
    <view class="fee-item fee-assistant clickable" @click="$emit('assistant-click')">
      <view class="fee-icon-wrap"><text class="fee-icon">👨‍🏫</text></view>
      <template v-if="hasAssistantItems">
        <text class="fee-item-label">助教</text>
        <view class="fee-amount-row">
          <text class="fee-currency">¥</text>
          <text class="fee-item-value">{{ formatPrice(assistantFee) }}</text>
        </view>
        <text class="fee-item-sub">{{ assistantCount }}位服务中</text>
        <view class="fee-item-arrow"><text class="arrow-text">›</text></view>
      </template>
      <template v-else>
        <text class="fee-item-label">助教</text>
        <view class="fee-add-wrap">
          <text class="fee-add-icon">+</text>
          <text class="fee-add-text">预约助教</text>
        </view>
      </template>
    </view>

    <!-- 充电 -->
    <view class="fee-item fee-charging clickable" @click="$emit('charging-click')">
      <view class="fee-icon-wrap"><text class="fee-icon">🔋</text></view>
      <template v-if="chargingEnabled && chargingFee > 0">
        <text class="fee-item-label">充电</text>
        <view class="fee-amount-row">
          <text class="fee-currency">¥</text>
          <text class="fee-item-value">{{ formatPrice(chargingFee) }}</text>
        </view>
        <text class="fee-item-sub" v-if="chargingActivePorts > 0">{{ chargingActivePorts }}口充电中</text>
        <view class="fee-item-arrow"><text class="arrow-text">›</text></view>
      </template>
      <template v-else>
        <text class="fee-item-label">充电</text>
        <view class="fee-add-wrap">
          <text class="fee-add-icon">+</text>
          <text class="fee-add-text">{{ chargingEnabled ? '启动充电' : '未启用' }}</text>
        </view>
      </template>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  displayTableFee: string
  tableHourlyRate: number
  currentRate: number
  productFee: number
  productCount: number
  assistantFee: number
  hasAssistantItems: boolean
  assistantCount: number
  chargingEnabled: boolean
  chargingFee: number
  chargingActivePorts: number
}>()

defineEmits<{
  'product-click': []
  'assistant-click': []
  'charging-click': []
}>()
</script>

<style lang="scss" scoped>
.fee-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16rpx;
  flex: 1;
  min-height: 25vh;

  .fee-item {
    position: relative;
    background: linear-gradient(145deg, rgba(30, 30, 50, 0.8), rgba(20, 20, 40, 0.6));
    border-radius: 32rpx;
    padding: 32rpx 20rpx;
    text-align: center;
    border: 2rpx solid rgba(201, 169, 98, 0.15);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
    overflow: hidden;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 4rpx;
      background: linear-gradient(90deg, transparent, rgba(201, 169, 98, 0.6), transparent);
    }

    .fee-icon-wrap {
      width: 80rpx; height: 80rpx; margin: 0 auto 18rpx;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.2), rgba(201, 169, 98, 0.05));
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      border: 2rpx solid rgba(201, 169, 98, 0.3);
      .fee-icon { font-size: 44rpx; }
    }

    .fee-item-label { display: block; font-size: 28rpx; color: #8a8a9a; margin-bottom: 14rpx; letter-spacing: 2rpx; }

    .fee-amount-row {
      display: flex; align-items: baseline; justify-content: center; gap: 4rpx; margin-bottom: 12rpx;
      .fee-currency { font-size: 32rpx; color: #c9a962; font-weight: 600; }
      .fee-item-value { font-size: 52rpx; color: #fff; font-weight: 700; line-height: 1; }
    }

    .fee-item-rate { font-size: 26rpx; color: #6a6a7a; margin-top: 8rpx; }
    .fee-item-sub { font-size: 26rpx; color: #8a8a9a; margin-top: 6rpx; }

    .fee-item-arrow {
      position: absolute; top: 50%; right: 24rpx; transform: translateY(-50%);
      width: 48rpx; height: 48rpx; background: rgba(201, 169, 98, 0.15);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      .arrow-text { font-size: 36rpx; color: #c9a962; font-weight: 600; }
    }

    .fee-add-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 12rpx; margin-top: 16rpx;
      .fee-add-icon {
        width: 64rpx; height: 64rpx; line-height: 64rpx;
        background: linear-gradient(135deg, rgba(201, 169, 98, 0.3), rgba(201, 169, 98, 0.1));
        border-radius: 50%; font-size: 48rpx; color: #c9a962; font-weight: 300;
        border: 2rpx dashed rgba(201, 169, 98, 0.5);
      }
      .fee-add-text { font-size: 28rpx; color: #c9a962; font-weight: 500; }
    }

    &.clickable:active { transform: scale(0.96); border-color: rgba(201, 169, 98, 0.4); box-shadow: 0 4rpx 16rpx rgba(201, 169, 98, 0.2); }

    &.fee-table .fee-icon-wrap { background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.05)); border-color: rgba(99, 102, 241, 0.3); }
    &.fee-product .fee-icon-wrap { background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05)); border-color: rgba(245, 158, 11, 0.3); }
    &.fee-assistant .fee-icon-wrap { background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05)); border-color: rgba(34, 197, 94, 0.3); }
    &.fee-charging .fee-icon-wrap { background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05)); border-color: rgba(251, 191, 36, 0.3); }
  }
}
</style>
