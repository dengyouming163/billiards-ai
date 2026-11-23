<template>
  <view class="sph-header">
    <view class="sph-back" @click="$emit('back')">
      <text>←</text>
    </view>
    <text class="sph-title">{{ title }}</text>
    <view class="sph-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()

defineEmits<{
  back: []
}>()
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.sph-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 24rpx 40rpx 24rpx;
  background: linear-gradient(180deg, rgba(#0f0f16,.98), rgba(#0f0f16,.95));
  backdrop-filter: blur(30rpx); -webkit-backdrop-filter: blur(30rpx);
  border-bottom: 2rpx solid rgba($gold,.1);
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,.4);
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: 168rpx; box-sizing: border-box;
}

.sph-back {
  width: 144rpx; height: 144rpx;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2rpx solid #374151;
  flex-shrink: 0;

  text { font-size: 72rpx; color: #fff; }

  &:active { transform: scale(.92); border-color: $gold; }
}

.sph-title {
  font-size: 72rpx; font-weight: 700; color: #fff;
  text-shadow: 0 0 30rpx rgba($gold, .3);
  flex: 1; text-align: center;
}

.sph-placeholder { width: 144rpx; flex-shrink: 0; }
</style>
