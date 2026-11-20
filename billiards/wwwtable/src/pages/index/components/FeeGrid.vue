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
  min-height: 20vh;

  .fee-item {
    position: relative;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 28rpx 16rpx;
    text-align: center;
    border: 2rpx solid rgba(7,193,96,.06);
    box-shadow: 0 4rpx 16rpx rgba(0,0,0,.04);
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
      background: linear-gradient(90deg, transparent, rgba(7,193,96,.4), transparent);
    }

    .fee-icon-wrap {
      width: 72rpx; height: 72rpx; margin: 0 auto 14rpx;
      background: rgba(7,193,96,.06);
      border-radius: 20rpx; display: flex; align-items: center; justify-content: center;
      border: 2rpx solid rgba(7,193,96,.15);
      .fee-icon { font-size: 40rpx; }
    }

    .fee-item-label { display: block; font-size: 26rpx; color: #999999; margin-bottom: 10rpx; letter-spacing: 2rpx; }

    .fee-amount-row {
      display: flex; align-items: baseline; justify-content: center; gap: 4rpx; margin-bottom: 8rpx;
      .fee-currency { font-size: 28rpx; color: #07C160; font-weight: 600; }
      .fee-item-value { font-size: 44rpx; color: #333333; font-weight: 700; line-height: 1; }
    }

    .fee-item-rate { font-size: 24rpx; color: #999999; margin-top: 6rpx; }
    .fee-item-sub { font-size: 24rpx; color: #999999; margin-top: 4rpx; }

    .fee-item-arrow {
      position: absolute; top: 50%; right: 16rpx; transform: translateY(-50%);
      width: 40rpx; height: 40rpx; background: rgba(7,193,96,.06);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      .arrow-text { font-size: 28rpx; color: #07C160; font-weight: 600; }
    }

    .fee-add-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 8rpx; margin-top: 12rpx;
      .fee-add-icon {
        width: 56rpx; height: 56rpx; line-height: 56rpx;
        background: rgba(7,193,96,.06);
        border-radius: 50%; font-size: 40rpx; color: #07C160; font-weight: 300;
        border: 2rpx dashed rgba(7,193,96,.2);
      }
      .fee-add-text { font-size: 24rpx; color: #07C160; font-weight: 500; }
    }

    &.clickable:active { transform: scale(0.96); border-color: #07C160; box-shadow: 0 8rpx 24rpx rgba(7,193,96,.12); }

    &.fee-table .fee-icon-wrap { background: rgba(59,130,246,.06); border-color: rgba(59,130,246,.15); }
    &.fee-product .fee-icon-wrap { background: rgba(255,151,106,.06); border-color: rgba(255,151,106,.15); }
    &.fee-assistant .fee-icon-wrap { background: rgba(7,193,96,.08); border-color: rgba(7,193,96,.2); }
    &.fee-charging .fee-icon-wrap { background: rgba(251,191,36,.06); border-color: rgba(251,191,36,.15); }
  }
}
</style>
