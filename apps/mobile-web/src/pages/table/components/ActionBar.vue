<template>
  <view class="action-bar" v-if="orderStatus === 'in_progress' || orderStatus === 'paused'">
    <view v-if="orderStatus === 'paused'" class="action-btn primary" @click="$emit('resume')">
      <view class="btn-icon" v-html="Icons.play" />
      <text class="btn-text">恢复</text>
    </view>
    <view v-else class="action-btn" @click="$emit('pause')">
      <view class="btn-icon" v-html="Icons.pause" />
      <text class="btn-text">暂停</text>
    </view>
    <view class="action-btn" @click="$emit('transfer')">
      <view class="btn-icon" v-html="Icons.arrowLeft" />
      <text class="btn-text">换台</text>
    </view>
    <view class="action-btn" @click="$emit('merge')">
      <view class="btn-icon" v-html="Icons.plusCircle" />
      <text class="btn-text">并台</text>
    </view>
    <view class="action-btn" @click="$emit('member')">
      <view class="btn-icon" v-html="Icons.user" />
      <text class="btn-text">会员</text>
    </view>
    <view class="action-btn primary" @click="$emit('checkout')">
      <view class="btn-icon" v-html="Icons.check" />
      <text class="btn-text">结算</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { usePermission } from '@/composables/usePermission'
import { Icons } from '@/utils/icons'

const { canAccessModule: can } = usePermission()

defineProps<{
  orderStatus: string
}>()

defineEmits<{
  (e: 'transfer'): void
  (e: 'merge'): void
  (e: 'member'): void
  (e: 'checkout'): void
  (e: 'pause'): void
  (e: 'resume'): void
}>()
</script>

<style lang="scss" scoped>
.action-bar {
  position: fixed;
  bottom: 0;
  left: 20rpx;
  right: 20rpx;
  background: rgba(255,255,255,.94);
  border-radius: 32rpx;
  box-shadow: 0 12rpx 32rpx rgba(15,23,42,.1), 0 0 0 1rpx rgba(255,255,255,.7);
  padding: 14rpx 10rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 14rpx);
  display: flex;
  justify-content: space-around;
  z-index: 200;
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
}

.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 0;
  gap: 6rpx;
  font-size: 22rpx;
  color: #71717a;
  transition: all 0.15s ease;

  &:active {
    transform: scale(0.97);
  }
}

.action-btn .btn-icon {
  font-size: 30rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;
}

.action-btn.primary {
  color: #059669;
  font-weight: 700;

  .btn-icon {
    background: #ecfdf5;
    color: #059669;
  }
}
</style>
