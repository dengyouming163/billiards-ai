<template>
  <view class="empty-state" @tap="handleRetry">
    <view class="empty-icon">
      <text class="empty-emoji">{{ iconEmoji }}</text>
    </view>
    <text class="empty-message">{{ message }}</text>
    <text v-if="type === 'error'" class="empty-retry">点击重试</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  type?: string
  message?: string
}>()

const emit = defineEmits<{
  retry: []
}>()

const iconEmoji = '📭'

function handleRetry() {
  emit('retry')
}
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-icon {
  margin-bottom: 24rpx;
}

.empty-emoji {
  font-size: 80rpx;
}

.empty-message {
  font-size: 28rpx;
  color: #999;
  text-align: center;
}

.empty-retry {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: #07C160;
}
</style>
