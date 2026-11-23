<template>
  <view v-if="visible" class="modal-overlay" @click="handleCancel">
    <view class="modal-content" @click.stop>
      <view class="modal-glow-bg"></view>
      <view class="modal-header">
        <text class="modal-title">修改分数</text>
      </view>
      <view class="input-area">
        <view class="input-wrap">
          <view class="input-glow"></view>
          <input 
            class="score-input"
            type="number"
            v-model="inputValue"
            placeholder="请输入分数"
            @input="handleInput"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          <view class="input-clear" v-if="inputValue" @click="handleClear">
            <text class="clear-icon">✕</text>
          </view>
        </view>
        <view class="input-tip">当前分数：{{ currentValue }}</view>
      </view>
      <view class="keypad-area">
        <view v-for="row in keypadRows" :key="row" class="keypad-row">
          <view 
            v-for="key in row" 
            :key="key"
            class="keypad-key"
            :class="{ 
              action: key === 'del' || key === 'ok',
              delete: key === 'del',
              confirm: key === 'ok'
            }"
            @click="handleKeypad(key)"
          >
            <text class="key-text">{{ getKeyText(key) }}</text>
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
  currentValue: number
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'confirm', value: number): void
}>()

const inputValue = ref('')
const isFocused = ref(false)

const keypadRows = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['del', '0', 'ok']
]

watch(() => props.visible, (val) => {
  if (val) {
    inputValue.value = props.currentValue.toString()
  }
})

function handleInput(e: any) {
  const value = e.detail.value.replace(/\D/g, '')
  inputValue.value = value
}

function handleFocus() {
  isFocused.value = true
}

function handleBlur() {
  isFocused.value = false
}

function handleClear() {
  inputValue.value = ''
}

function getKeyText(key: string): string {
  const texts: Record<string, string> = {
    del: '⌫',
    ok: '✓'
  }
  return texts[key] || key
}

function handleKeypad(key: string) {
  if (key === 'del') {
    inputValue.value = inputValue.value.slice(0, -1)
  } else if (key === 'ok') {
    handleConfirm()
  } else {
    inputValue.value += key
  }
}

function handleCancel() {
  emit('cancel')
}

function handleConfirm() {
  const value = parseInt(inputValue.value) || 0
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
    text-align: center;
    margin-bottom: 40rpx;
    position: relative;
    z-index: 1;
    
    .modal-title {
      font-size: 56rpx;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: 4rpx;
    }
  }
  
  .input-area {
    position: relative;
    z-index: 1;
    margin-bottom: 40rpx;
    
    .input-wrap {
      position: relative;
      margin-bottom: 20rpx;
      
      .input-glow {
        position: absolute;
        top: -8rpx; left: -8rpx; right: -8rpx; bottom: -8rpx;
        border-radius: 40rpx;
        background: rgba($gold, 0.1);
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      .score-input {
        width: 100%;
        padding: 48rpx 120rpx 48rpx 48rpx;
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
          
          + .input-glow {
            opacity: 1;
          }
        }
      }
      
      .input-clear {
        position: absolute;
        right: 24rpx;
        top: 50%;
        transform: translateY(-50%);
        width: 72rpx;
        height: 72rpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        
        &:active {
          background: rgba(239, 68, 68, 0.2);
          transform: translateY(-50%) scale(0.9);
        }
        
        .clear-icon {
          font-size: 36rpx;
          color: rgba(255, 255, 255, 0.5);
        }
      }
    }
    
    .input-tip {
      text-align: center;
      font-size: 32rpx;
      color: rgba(255, 255, 255, 0.4);
    }
  }
  
  .keypad-area {
    margin-bottom: 40rpx;
    position: relative;
    z-index: 1;
    
    .keypad-row {
      display: flex;
      gap: 20rpx;
      margin-bottom: 20rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .keypad-key {
      flex: 1;
      aspect-ratio: 1;
      border-radius: 32rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      border: 2rpx solid rgba(255, 255, 255, 0.08);
      transition: all 0.2s;
      
      &:active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      
      &.action {
        background: rgba(255, 255, 255, 0.08);
        
        &.delete {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.25);
          
          .key-text {
            color: #ef4444;
          }
        }
        
        &.confirm {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.25);
          
          .key-text {
            color: #22c55e;
          }
        }
      }
      
      .key-text {
        font-size: 56rpx;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.85);
        font-family: 'Courier New', monospace;
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