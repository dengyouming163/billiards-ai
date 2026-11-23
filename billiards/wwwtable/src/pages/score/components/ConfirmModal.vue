<template>
  <view v-if="visible" class="modal-overlay" @click="handleCancel">
    <view class="modal-content" @click.stop>
      <view class="modal-glow-bg"></view>
      <view class="modal-icon-wrap">
        <view class="icon-glow"></view>
        <text class="modal-icon">{{ icon }}</text>
      </view>
      <view class="modal-body">
        <text class="modal-title">{{ title }}</text>
        <text class="modal-message">{{ message }}</text>
      </view>
      <view class="modal-actions">
        <button class="modal-btn cancel" @click="handleCancel">
          <text class="btn-text">取消</text>
        </button>
        <button class="modal-btn confirm" :class="{ danger: danger }" @click="handleConfirm">
          <text class="btn-text">{{ confirmText }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  title: string
  message: string
  icon?: string
  confirmText?: string
  danger?: boolean
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm'): void
}>()

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  emit('confirm')
}
</script>

<style lang="scss" scoped>
$gold: #c9a962;
$danger: #ef4444;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(20rpx);
}

.modal-content {
  position: relative;
  width: 50vw;
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.98), rgba(20, 20, 40, 0.99));
  border-radius: 64rpx;
  padding: 64rpx;
  border: 4rpx solid rgba($gold, 0.25);
  box-shadow: 
    0 32rpx 96rpx rgba(0, 0, 0, 0.6),
    0 0 60rpx rgba($gold, 0.15),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .modal-glow-bg {
    position: absolute;
    top: -100rpx;
    right: -100rpx;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba($gold, 0.2) 0%, transparent 70%);
    pointer-events: none;
    animation: modalGlow 4s ease-in-out infinite;
  }
  
  .modal-icon-wrap {
    position: relative;
    z-index: 1;
    width: 160rpx;
    height: 160rpx;
    margin: 0 auto 48rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba($gold, 0.2), rgba($gold, 0.05));
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4rpx solid rgba($gold, 0.3);
    
    .icon-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120rpx;
      height: 120rpx;
      background: radial-gradient(circle, rgba($gold, 0.3) 0%, transparent 70%);
      animation: iconGlow 2s ease-in-out infinite;
    }
    
    .modal-icon {
      position: relative;
      z-index: 1;
      font-size: 80rpx;
    }
  }
  
  .modal-body {
    position: relative;
    z-index: 1;
    text-align: center;
    margin-bottom: 56rpx;
    
    .modal-title {
      display: block;
      font-size: 56rpx;
      font-weight: 700;
      color: #f1f5f9;
      margin-bottom: 28rpx;
      letter-spacing: 4rpx;
    }
    
    .modal-message {
      font-size: 40rpx;
      color: rgba(255, 255, 255, 0.6);
      line-height: 1.6;
    }
  }
  
  .modal-actions {
    display: flex;
    gap: 28rpx;
    position: relative;
    z-index: 1;
    
    .modal-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 36rpx;
      border-radius: 40rpx;
      font-size: 48rpx;
      font-weight: 700;
      border: none;
      transition: all 0.2s;
      
      &:active {
        transform: scale(0.98);
        opacity: 0.85;
      }
      
      &.cancel {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
        border: 3rpx solid rgba(255, 255, 255, 0.12);
      }
      
      &.confirm {
        background: linear-gradient(135deg, $gold, #8a6d3b);
        color: #1a1a2e;
        box-shadow: 
          0 8rpx 32rpx rgba($gold, 0.4),
          inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
        
        &.danger {
          background: linear-gradient(135deg, $danger, #b91c1c);
          box-shadow: 
            0 8rpx 32rpx rgba($danger, 0.4),
            inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
        }
      }
      
      .btn-text {
        font-size: 44rpx;
      }
    }
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes modalGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes iconGlow {
  0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
}
</style>