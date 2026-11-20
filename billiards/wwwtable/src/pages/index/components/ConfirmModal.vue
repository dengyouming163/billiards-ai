<template>
  <view v-if="visible" class="confirm-overlay">
    <view class="confirm-modal">
      <view class="confirm-icon">
        {{ state === 'waiting' ? '⏳' : state === 'confirmed' ? '✅' : '⏰' }}
      </view>
      <text class="confirm-title">
        {{ state === 'waiting' ? '请稍候' : state === 'confirmed' ? '开台成功' : '等待超时' }}
      </text>
      <text class="confirm-desc">
        {{ state === 'waiting' ? '正在通知收银端确认开台' : state === 'confirmed' ? '祝您玩得愉快！🎱' : '请重新开台或联系前台咨询' }}
      </text>
      <view v-if="state === 'waiting'" class="confirm-countdown">
        <text class="countdown-num">{{ countdown }}</text>
        <text class="countdown-unit">秒</text>
      </view>
      <text v-if="state === 'waiting'" class="confirm-hint">
        收银员确认后将自动开台 · 处理时限{{ timeoutMinutes }}分钟
      </text>
      <view v-if="state === 'waiting'" class="confirm-cancel" @click="$emit('cancel')">
        <text>取消等待</text>
      </view>
      <view v-if="state !== 'waiting'" class="confirm-close" @click="$emit('close')">
        <text>{{ state === 'confirmed' ? '开始使用' : '重新开台' }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  state: 'waiting' | 'confirmed' | 'timeout'
  countdown: number
  timeoutMinutes: number
}>()

defineEmits<{
  cancel: []
  close: []
}>()
</script>

<style lang="scss" scoped>
.confirm-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}

.confirm-modal {
  width: 1000rpx;
  background: #1a1a2e;
  border-radius: 40rpx;
  padding: 60rpx 48rpx;
  text-align: center;
  border: 2rpx solid rgba(201, 169, 98, 0.4);
}

.confirm-icon { font-size: 100rpx; margin-bottom: 24rpx; }

.confirm-title {
  display: block;
  font-size: 52rpx; font-weight: 700; color: #c9a962;
  margin-bottom: 16rpx;
}

.confirm-desc {
  display: block;
  font-size: 36rpx; color: #a0a0b0;
  margin-bottom: 40rpx;
}

.confirm-countdown { margin-bottom: 24rpx; }

.countdown-num { font-size: 120rpx; font-weight: 800; color: #c9a962; }
.countdown-unit { font-size: 40rpx; color: #a0a0b0; }

.confirm-hint {
  display: block;
  font-size: 28rpx; color: #6b7280;
  margin-bottom: 40rpx;
}

.confirm-cancel, .confirm-close {
  width: 100%; height: 88rpx; border-radius: 44rpx;
  display: flex; align-items: center; justify-content: center;
  margin-top: 24rpx;
}

.confirm-cancel {
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.15);
  text { color: #a0a0b0; }
}

.confirm-close {
  background: linear-gradient(135deg, #c9a962, #8a6d3b);
  text { color: #fff; }
}
</style>
