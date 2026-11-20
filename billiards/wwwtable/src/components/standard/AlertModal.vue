<template>
  <view class="am-overlay" v-if="visible" @tap="$emit('cancel')">
    <view class="am-card" @tap.stop>
      <text class="am-icon" v-if="icon">{{ icon }}</text>
      <text class="am-title">{{ title }}</text>
      <text class="am-message" v-if="message">{{ message }}</text>

      <view class="am-actions">
        <view class="am-btn secondary" v-if="cancelText" @tap="$emit('cancel')">
          <text>{{ cancelText }}</text>
        </view>
        <view
          class="am-btn"
          :class="{ danger: confirmDanger }"
          @tap="$emit('confirm')"
        >
          <text>{{ confirmText }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  message?: string
  icon?: string
  confirmText?: string
  cancelText?: string
  confirmDanger?: boolean
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style lang="scss" scoped>
$primary: #07C160;
$primary-dark: #06AD56;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.am-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1001; backdrop-filter: blur(16rpx); padding: 40rpx;
}

.am-card {
  width: 56vw;
  background: $card-bg;
  border-radius: 48rpx; padding: 48rpx 48rpx 36rpx;
  border: 2rpx solid rgba($primary, .1);
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, .15);
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
}

.am-icon   { font-size: 120rpx; display: block; }
.am-title  { font-size: 54rpx; font-weight: 700; color: $text-primary; }

.am-message {
  font-size: 42rpx; color: $text-secondary; line-height: 1.5;
}

.am-actions {
  display: flex; gap: 36rpx; margin-top: 24rpx; width: 100%;

  .am-btn {
    flex: 1; height: 132rpx; border-radius: 42rpx;
    display: flex; align-items: center; justify-content: center;
    font-size: 48rpx; font-weight: 700;
    background: linear-gradient(135deg, $primary, $primary-dark); color: #fff;
    box-shadow: 0 8rpx 28rpx rgba($primary, .3);
    &:active { transform: scale(.97); }

    &.secondary {
      background: rgba($text-secondary, .06); color: $text-secondary;
      box-shadow: none; border: 2rpx solid rgba($primary, .1);
    }

    &.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 8rpx 28rpx rgba(239, 68, 68, .3);
    }
  }
}
</style>
