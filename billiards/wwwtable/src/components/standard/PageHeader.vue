<template>
  <view class="ph-sticky">
    <view class="ph-header">
      <view class="ph-left">
        <text class="ph-icon" v-if="icon">{{ icon }}</text>
        <view class="ph-text">
          <text class="ph-title">{{ title }}</text>
          <text class="ph-subtitle" v-if="subtitle">{{ subtitle }}</text>
        </view>
      </view>
      <view class="ph-right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  subtitle?: string
}>()
</script>

<style lang="scss" scoped>
$primary: #07C160;
$bg: #f7f7f7;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.ph-sticky {
  position: relative;
  padding: 28rpx 40rpx;
  background: $card-bg;
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($primary, .08);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .04);

  &::after {
    content: ''; position: absolute; bottom: -2rpx; left: 0; right: 0;
    height: 2rpx; background: linear-gradient(90deg, transparent, rgba($primary, .2), transparent);
  }
}

.ph-header { display: flex; justify-content: space-between; align-items: center; }
.ph-left   { display: flex; align-items: center; gap: 30rpx; }
.ph-icon   { font-size: 96rpx; }
.ph-text   { display: flex; flex-direction: column; }
.ph-title  { font-size: 72rpx; font-weight: 800; color: $text-primary; letter-spacing: 2rpx; }
.ph-subtitle { font-size: 40rpx; color: $text-secondary; margin-top: 6rpx; }
.ph-right  { display: flex; align-items: center; gap: 24rpx; }
</style>
