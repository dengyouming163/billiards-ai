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
$gold: #c9a962;

.am-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, .9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1001; backdrop-filter: blur(16rpx); padding: 40rpx;
}

.am-card {
  width: 56vw;
  background: linear-gradient(180deg, #232340 0%, #1a1a30 100%);
  border-radius: 48rpx; padding: 48rpx 48rpx 36rpx;
  border: 3rpx solid rgba($gold, .3);
  box-shadow: 0 30rpx 80rpx rgba(0, 0, 0, .6), 0 0 60rpx rgba($gold, .12);
  text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 24rpx;
}

.am-icon   { font-size: 120rpx; display: block; }
.am-title  { font-size: 54rpx; font-weight: 700; color: #f1f5f9; }

.am-message {
  font-size: 42rpx; color: rgba(255, 255, 255, .4); line-height: 1.5;
}

.am-actions {
  display: flex; gap: 36rpx; margin-top: 24rpx; width: 100%;

  .am-btn {
    flex: 1; height: 132rpx; border-radius: 42rpx;
    display: flex; align-items: center; justify-content: center;
    font-size: 48rpx; font-weight: 700;
    background: linear-gradient(135deg, $gold, #8a6d3b); color: #1a1a2e;
    box-shadow: 0 8rpx 28rpx rgba($gold, .35);
    &:active { transform: scale(.97); }

    &.secondary {
      background: rgba(255, 255, 255, .08); color: rgba(255, 255, 255, .7);
      box-shadow: none; border: 2rpx solid rgba(255, 255, 255, .1);
    }

    &.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 8rpx 28rpx rgba(239, 68, 68, .35);
    }
  }
}
</style>
