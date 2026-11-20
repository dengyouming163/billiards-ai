<template>
  <view class="cm-overlay" v-if="visible" @tap="$emit('close')">
    <view class="cm-card" :style="height ? { height } : {}" @tap.stop>
      <view class="cm-top-line"></view>

      <view class="cm-header">
        <text class="cm-title">{{ title }}</text>
        <view class="cm-close" @tap="$emit('close')">
          <text>✕</text>
        </view>
      </view>

      <scroll-view class="cm-body" scroll-y :show-scrollbar="false">
        <slot />
      </scroll-view>

      <view class="cm-footer" v-if="showFooter">
        <slot name="footer" />
      </view>
      <view class="cm-footer" v-else>
        <view class="cm-close-btn" @tap="$emit('close')">关闭</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  title: string
  showFooter?: boolean
  height?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<style lang="scss" scoped>
$primary: #07C160;
$primary-dark: #06AD56;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.cm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; backdrop-filter: blur(16rpx); padding: 40rpx;
}

.cm-card {
  width: 80vw; height: 55vh;
  background: $card-bg;
  border-radius: 48rpx; padding: 0;
  border: 2rpx solid rgba($primary, .1);
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, .15);
  position: relative; overflow: hidden;
  display: flex; flex-direction: column;
}

.cm-top-line {
  position: absolute; top: 0; left: 0; right: 0; height: 6rpx;
  background: linear-gradient(90deg, transparent, $primary, rgba($primary, .6), transparent);
  z-index: 1;
}

.cm-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 36rpx 48rpx;
  border-bottom: 2rpx solid rgba($primary, .08);
  flex-shrink: 0;
}

.cm-title {
  font-size: 48rpx; font-weight: 800; color: $text-primary;
}

.cm-close {
  width: 72rpx; height: 72rpx;
  background: rgba($primary, .06);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: $text-secondary; border: 2rpx solid rgba($primary, .1);
  &:active { transform: scale(.92); background: rgba($primary, .1); }
}

.cm-body {
  flex: 1; overflow-y: auto; padding: 32rpx 48rpx;
}

.cm-footer {
  flex-shrink: 0;
  padding: 24rpx 48rpx 36rpx;
  border-top: 2rpx solid rgba($primary, .08);
  background: rgba($primary, .02);
}

.cm-close-btn {
  height: 88rpx;
  border-radius: 44rpx;
  display: flex; align-items: center; justify-content: center;
  background: rgba($primary, .06);
  color: $text-secondary;
  border: 2rpx solid rgba($primary, .1);
  font-size: 32rpx; font-weight: 700;
  &:active { background: rgba($primary, .1); }
}
</style>
