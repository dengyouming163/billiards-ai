<template>
  <view v-if="visible" class="modal-overlay">
    <view class="modal-content">
      <view class="modal-glow-bg"></view>
      <view class="modal-header">
        <text class="modal-title">设置局数</text>
        <view class="modal-close" @click="handleCancel">
          <text class="close-icon">✕</text>
        </view>
      </view>
      <view class="input-area">
        <input 
          class="rounds-input"
          type="number"
          v-model="inputValue"
          placeholder="请输入局数"
          :maxlength="3"
        />
        <view class="input-tip">当前局数：{{ currentRounds }}</view>
      </view>
      <view class="quick-select">
        <text class="select-label">快捷选择</text>
        <view class="select-grid">
          <view 
            v-for="num in [3, 5, 7, 9]" 
            :key="num"
            class="select-item"
            :class="{ active: inputValue === num.toString() }"
            @click="inputValue = num.toString()"
          >
            <text class="select-num">{{ num }}</text>
            <text class="select-unit">局</text>
          </view>
        </view>
      </view>
      <view class="modal-actions">
        <button class="modal-btn cancel" @click="handleCancel">
          <text class="btn-icon">✕</text>
          <text class="btn-text">取消</text>
        </button>
        <button class="modal-btn confirm" @click="handleConfirm">
          <text class="btn-icon">✓</text>
          <text class="btn-text">确定</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
  currentRounds: number
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', value: number): void
}>()

const inputValue = ref(props.currentRounds.toString())

watch(() => props.visible, (val) => {
  if (val) {
    inputValue.value = props.currentRounds.toString()
  }
})

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  const value = parseInt(inputValue.value) || 5
  emit('confirm', value)
}
</script>

<style lang="scss" scoped>
$gold: #c9a962;

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
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 48rpx;
    position: relative;
    z-index: 1;
    
    .modal-title {
      font-size: 56rpx;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: 4rpx;
    }
    
    .modal-close {
      width: 72rpx;
      height: 72rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid rgba(255, 255, 255, 0.12);
      
      &:active {
        background: rgba(239, 68, 68, 0.2);
      }
      
      .close-icon {
        font-size: 36rpx;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
  
  .input-area {
    position: relative;
    z-index: 1;
    margin-bottom: 40rpx;
    
    .rounds-input {
      width: 100%;
      padding: 48rpx;
      font-size: 72rpx;
      font-weight: 900;
      text-align: center;
      border: 3rpx solid rgba($gold, 0.2);
      border-radius: 36rpx;
      box-sizing: border-box;
      background: rgba(40, 40, 70, 0.95);
      color: #f1f5f9;
      font-family: 'Courier New', monospace;
      letter-spacing: 8rpx;
      transition: all 0.3s;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.25);
      }
      
      &:focus {
        border-color: $gold;
      }
    }
    
    .input-tip {
      text-align: center;
      font-size: 32rpx;
      color: rgba(255, 255, 255, 0.4);
      margin-top: 20rpx;
    }
  }
  
  .quick-select {
    position: relative;
    z-index: 1;
    margin-bottom: 48rpx;
    
    .select-label {
      font-size: 36rpx;
      color: rgba(255, 255, 255, 0.6);
      display: block;
      margin-bottom: 24rpx;
      font-weight: 600;
    }
    
    .select-grid {
      display: flex;
      gap: 20rpx;
      
      .select-item {
        flex: 1;
        aspect-ratio: 1;
        border-radius: 32rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.06);
        border: 2rpx solid rgba(255, 255, 255, 0.08);
        transition: all 0.2s;
        
        &:active {
          transform: scale(0.95);
        }
        
        &.active {
          background: rgba($gold, 0.2);
          border-color: $gold;
          
          .select-num, .select-unit {
            color: $gold;
          }
        }
        
        .select-num {
          font-size: 56rpx;
          font-weight: 900;
          color: rgba(255, 255, 255, 0.85);
          font-family: 'Courier New', monospace;
        }
        
        .select-unit {
          font-size: 28rpx;
          color: rgba(255, 255, 255, 0.4);
        }
      }
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
      gap: 16rpx;
      padding: 32rpx;
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
        
        .btn-icon {
          color: rgba(255, 255, 255, 0.5);
        }
      }
      
      &.confirm {
        background: linear-gradient(135deg, $gold, #8a6d3b);
        color: #1a1a2e;
        box-shadow: 
          0 8rpx 32rpx rgba($gold, 0.4),
          inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
        
        .btn-icon {
          color: #1a1a2e;
        }
      }
      
      .btn-icon {
        font-size: 44rpx;
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
</style>