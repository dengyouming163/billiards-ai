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
$gold: #c9a962; $bg: #0f0f16;

.ph-sticky {
  position: relative;  // for ::after absolute positioning
  padding: 28rpx 40rpx;
  background: linear-gradient(180deg, rgba($bg, .98), rgba($bg, .95));
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($gold, .1);
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, .4);

  &::after {
    content: ''; position: absolute; bottom: -2rpx; left: 0; right: 0;
    height: 2rpx; background: linear-gradient(90deg, transparent, rgba($gold, .3), transparent);
  }
}

.ph-header { display: flex; justify-content: space-between; align-items: center; }
.ph-left   { display: flex; align-items: center; gap: 30rpx; }
.ph-icon   { font-size: 96rpx; filter: drop-shadow(0 4rpx 12rpx rgba($gold, .3)); }
.ph-text   { display: flex; flex-direction: column; }
.ph-title  { font-size: 72rpx; font-weight: 800; color: #fff; letter-spacing: 2rpx; }
.ph-subtitle { font-size: 40rpx; color: #6b7280; margin-top: 6rpx; }
.ph-right  { display: flex; align-items: center; gap: 24rpx; }
</style>
