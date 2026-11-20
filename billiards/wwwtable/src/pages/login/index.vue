<template>
  <view class="login-container">
    <view class="login-bg">
      <view class="bg-circle bg-circle-1"></view>
      <view class="bg-circle bg-circle-2"></view>
      <view class="bg-circle bg-circle-3"></view>
      <view class="bg-grid"></view>
      <view class="particles">
        <view class="particle" v-for="n in 12" :key="n" :style="{ animationDelay: `${n * 0.4}s` }"></view>
      </view>
    </view>
    
    <scroll-view class="login-content" scroll-y :scroll-with-animation="true">
      <view class="logo-section">
        <view class="logo-wrapper">
          <view class="logo-ring"></view>
          <view class="logo-icon">🎱</view>
        </view>
        <text class="logo-title">台球俱乐部</text>
        <text class="logo-subtitle">台桌大屏系统</text>
      </view>
      
      <view class="form-section">
        <view class="code-input-box">
          <view class="code-input-header">
            <view class="header-line"></view>
            <view class="code-input-title">请输入台桌编码</view>
            <view class="header-line"></view>
          </view>
          <view class="code-input-group">
            <view 
              class="code-input-item" 
              v-for="(digit, index) in codeDigits" 
              :key="index"
              :class="{ active: activeIndex >= index, filled: codeDigits[index] }"
            >
              <view class="digit-ring" v-if="activeIndex === index"></view>
              <text class="code-digit">{{ codeDigits[index] || '' }}</text>
            </view>
          </view>
          <view class="code-hint">请输入6位台桌编码</view>
          <input 
            class="hidden-input" 
            v-model="inputCode"
            type="number"
            maxlength="6"
            @input="handleInput"
            @focus="handleFocus"
            :focus="inputFocused"
          />
        </view>
        
        <view class="login-btn" :class="{ disabled: code.length !== 6, loading: isLoading, ready: code.length === 6 && !isLoading }" @click="handleLogin">
          <view class="btn-inner">
            <text class="btn-text">{{ isLoading ? '登录中...' : '确认登录' }}</text>
          </view>
          <view class="btn-glow-left"></view>
          <view class="btn-glow-right"></view>
          <view class="btn-ready-glow"></view>
        </view>
        
        <view class="tips-section">
          <view class="tips-card">
            <text class="tip-icon">💡</text>
            <text class="tip-text">请输入台桌上的6位编码</text>
          </view>
        </view>
      </view>
      
      <view class="keyboard-section">
        <view class="keyboard-container">
          <view class="keyboard-row" v-for="(row, rowIndex) in keyboard" :key="rowIndex">
            <view 
              class="keyboard-key" 
              v-for="(key, keyIndex) in row" 
              :key="keyIndex"
              :class="{ special: key === 'del' || key === 'clear', numpad: key !== 'del' && key !== 'clear' }"
              @click="handleKeyPress(key)"
            >
              <view class="key-glow" v-if="key !== 'del' && key !== 'clear'"></view>
              <text class="key-text">{{ key === 'del' ? '⌫' : (key === 'clear' ? 'C' : key) }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { authStore } from '@/stores/auth'

const CODE_LENGTH = 6

const inputCode = ref('')
const inputFocused = ref(false)
const isLoading = ref(false)

const code = computed(() => inputCode.value)
const codeDigits = computed(() => {
  const digits = []
  for (let i = 0; i < CODE_LENGTH; i++) {
    digits.push(code.value[i] || '')
  }
  return digits
})
const activeIndex = computed(() => Math.min(code.value.length, CODE_LENGTH))

const keyboard = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'del']
]

function handleInput() {
  inputCode.value = inputCode.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
  
  if (inputCode.value.length === CODE_LENGTH) {
    setTimeout(() => {
      handleLogin()
    }, 300)
  }
}

function handleFocus() {
  inputFocused.value = true
}



function handleKeyPress(key: string) {
  if (key === 'del') {
    inputCode.value = inputCode.value.slice(0, -1)
  } else if (key === 'clear') {
    inputCode.value = ''
  } else if (inputCode.value.length < CODE_LENGTH) {
    inputCode.value += key
    
    if (inputCode.value.length === CODE_LENGTH) {
      setTimeout(() => {
        handleLogin()
      }, 300)
    }
  }
}

async function handleLogin() {
  if (code.value.length !== CODE_LENGTH) {
    uni.showToast({ title: `请输入${CODE_LENGTH}位台桌编码`, icon: 'none' })
    return
  }
  
  if (isLoading.value) return
  
  isLoading.value = true
  
  try {
    const result = await authStore.login(code.value)
    if (result) {
      uni.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' })
      }, 1500)
    } else {
      uni.showToast({ title: '登录失败，请检查编码', icon: 'none' })
    }
  } catch (error) {
    console.error('登录失败:', error)
    uni.showToast({ title: '登录失败，请检查编码', icon: 'none' })
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss">
@use '@/styles/layout-system.scss';

$primary: #07C160;
$primary-dark: #06AD56;
$bg: #f7f7f7;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.login-container {
  height: 100vh;
  width: 100vw;
  background: $bg;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .login-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 0;
    
    .bg-circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.4;
      
      &.bg-circle-1 {
        width: 1200rpx;
        height: 1200rpx;
        background: radial-gradient(circle, rgba($primary, 0.1) 0%, transparent 70%);
        top: -500rpx;
        right: -300rpx;
      }
      
      &.bg-circle-2 {
        width: 1000rpx;
        height: 1000rpx;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%);
        bottom: -400rpx;
        left: -350rpx;
      }
      
      &.bg-circle-3 {
        width: 800rpx;
        height: 800rpx;
        background: radial-gradient(circle, rgba($primary, 0.06) 0%, transparent 70%);
        top: 60%;
        right: 20%;
      }
    }
    
    .bg-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba($primary, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba($primary, 0.03) 1px, transparent 1px);
      background-size: 80rpx 80rpx;
    }
  }
  
  .login-content {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 80rpx 60rpx;
    box-sizing: border-box;
    overflow: hidden;
  }
  
  .logo-section {
    flex: 0 0 auto;
    text-align: center;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 60rpx;
    
    .logo-wrapper {
      position: relative;
      width: 360rpx;
      height: 360rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 50rpx;
      
      .logo-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 380rpx;
        height: 380rpx;
        transform: translate(-50%, -50%);
        border: 6rpx solid rgba($primary, 0.3);
        border-radius: 50%;
        animation: ringRotate 12s linear infinite;
      }
      
      .logo-icon {
        font-size: 280rpx;
        animation: bounce 2s ease-in-out infinite;
        position: relative;
        z-index: 1;
      }
    }
    
    .logo-title {
      display: block;
      font-size: 96rpx;
      font-weight: 800;
      color: $text-primary;
      margin-bottom: 20rpx;
      letter-spacing: 8rpx;
    }
    
    .logo-subtitle {
      font-size: 56rpx;
      color: $text-secondary;
      letter-spacing: 4rpx;
    }
  }
  
  .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 30rpx 0;
    
    .code-input-box {
        background: $card-bg;
        border-radius: 48rpx;
        padding: 60rpx 48rpx;
        border: 4rpx solid rgba($primary, 0.1);
        box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
        
        .code-input-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32rpx;
          margin-bottom: 60rpx;
          
          .header-line {
            width: 150rpx;
            height: 4rpx;
            background: linear-gradient(90deg, transparent, rgba($primary, 0.4));
          }
          
          .code-input-title {
            font-size: 64rpx;
            color: $text-secondary;
            font-weight: 600;
            letter-spacing: 4rpx;
          }
        }
        
        .code-input-group {
          display: flex;
          justify-content: center;
          gap: 32rpx;
          margin-bottom: 48rpx;
          
          .code-input-item {
            width: 150rpx;
            height: 180rpx;
            background: rgba($primary, 0.04);
            border-radius: 36rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 4rpx solid rgba($primary, 0.1);
            transition: all 0.3s;
            position: relative;
            
            &.active {
              border-color: $primary;
              background: rgba($primary, 0.08);
              box-shadow: 0 0 40rpx rgba($primary, 0.2);
            }
            
            &.filled {
              border-color: $primary;
              box-shadow: 0 0 48rpx rgba($primary, 0.25);
              background: rgba($primary, 0.06);
            }
            
            .digit-ring {
              position: absolute;
              top: -8rpx;
              left: -8rpx;
              right: -8rpx;
              bottom: -8rpx;
              border: 4rpx solid $primary;
              border-radius: 44rpx;
              animation: digitPulse 1s ease-in-out infinite;
            }
            
            .code-digit {
              font-size: 120rpx;
              font-weight: 800;
              color: $text-primary;
              font-family: 'Courier New', monospace;
            }
          }
        }
        
        .hidden-input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .code-hint {
          text-align: center;
          font-size: 48rpx;
          color: $text-secondary;
          margin-top: 16rpx;
        }
      }
    
    .login-btn {
      margin-top: 60rpx;
      height: 160rpx;
      border-radius: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      background: linear-gradient(135deg, $primary, $primary-dark);
      
      &.ready {
        animation: readyPulse 2s ease-in-out infinite;
        box-shadow: 0 0 60rpx rgba($primary, 0.35), 0 12rpx 36rpx rgba($primary, 0.2);
      }
      
      &:active:not(.disabled):not(.loading) {
        transform: scale(0.97);
      }
      
      &.disabled {
        background: #e5e5e5;
        
        .btn-glow-left,
        .btn-glow-right,
        .btn-ready-glow {
          display: none;
        }
      }
      
      &.loading {
        pointer-events: none;
      }
      
      .btn-inner {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .btn-text {
        font-size: 80rpx;
        font-weight: 700;
        color: #fff;
        letter-spacing: 6rpx;
      }
      
      .btn-glow-left {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: btnGlow 3s ease-in-out infinite;
      }
      
      .btn-glow-right {
        position: absolute;
        top: 0;
        right: 0;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2));
        filter: blur(20rpx);
      }
    }
    
    .tips-section {
      margin-top: 48rpx;
      display: flex;
      flex-direction: column;
      gap: 20rpx;
      
      .tips-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 20rpx;
        padding: 32rpx 48rpx;
        background: $card-bg;
        border-radius: 36rpx;
        border: 2rpx solid rgba($primary, 0.08);
        box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
        
        .tip-icon {
          font-size: 64rpx;
        }
        
        .tip-text {
          font-size: 56rpx;
          color: $text-secondary;
        }

      }
    }
  }

  .keyboard-section {
    flex: 0 0 auto;
    padding: 32rpx 32rpx;
    padding-bottom: calc(env(safe-area-inset-bottom) + 32rpx);
    
    .keyboard-container {
      background: $card-bg;
      border-radius: 48rpx;
      padding: 32rpx;
      border: 2rpx solid rgba($primary, 0.08);
      box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.04);
    }
    
    .keyboard-row {
      display: flex;
      justify-content: center;
      gap: 24rpx;
      margin-bottom: 24rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .keyboard-key {
        flex: 1;
        height: 160rpx;
        background: rgba($primary, 0.04);
        border-radius: 36rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2rpx solid rgba($primary, 0.1);
        transition: all 0.2s;
        position: relative;
        overflow: hidden;
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: rgba($primary, 0.1);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.4s, height 0.4s;
        }
        
        &:active {
          transform: scale(0.94);
          
          &::after {
            width: 200%;
            height: 200%;
          }
        }
        
        &.numpad:active {
          background: rgba($primary, 0.15);
          border-color: $primary;
          box-shadow: 0 0 40rpx rgba($primary, 0.15);
        }
        
        &.special {
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.15);
          
          &:active {
            background: rgba(239, 68, 68, 0.15);
            border-color: #ef4444;
            box-shadow: 0 0 40rpx rgba(239, 68, 68, 0.2);
          }
          
          .key-text {
            color: #ef4444;
          }
        }
        
        .key-text {
          font-size: 100rpx;
          font-weight: 700;
          color: $text-primary;
          position: relative;
          z-index: 1;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes ringRotate {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

@keyframes digitPulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes btnGlow {
  0% {
    left: -100%;
  }
  50%, 100% {
    left: 100%;
  }
}

@keyframes readyPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.01);
  }
}
</style>