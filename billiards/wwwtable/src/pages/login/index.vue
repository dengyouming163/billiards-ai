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
          <view class="tips-card scan-card" @click="handleScanCode">
            <text class="tip-icon">📷</text>
            <text class="tip-text">扫描台桌二维码</text>
            <text class="scan-arrow">›</text>
          </view>
          <view class="tips-card">
            <text class="tip-icon">💡</text>
            <text class="tip-text">或输入台桌上的6位编码</text>
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

function handleScanCode() {
  uni.scanCode({
    scanType: ['qrCode'],
    success: (res) => {
      const result = res.result || ''
      // 尝试提取6位数字编码（支持纯数字或URL中包含code参数）
      const match = result.match(/(\d{6})/)
      if (match) {
        inputCode.value = match[1]
        handleLogin()
      } else {
        uni.showToast({ title: '未识别到台桌编码', icon: 'none' })
      }
    },
    fail: (err) => {
      console.log('扫码取消或失败', err)
    }
  })
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

.login-container {
  height: 100vh;
  width: 100vw;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #16162a 70%, #0f0f1f 100%);
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
      opacity: 0.25;
      animation: float 10s ease-in-out infinite;
      
      &.bg-circle-1 {
        width: 1000rpx;
        height: 1000rpx;
        background: radial-gradient(circle, #c9a962 0%, transparent 70%);
        top: -400rpx;
        right: -200rpx;
        animation-delay: 0s;
      }
      
      &.bg-circle-2 {
        width: 800rpx;
        height: 800rpx;
        background: radial-gradient(circle, #a55eea 0%, transparent 70%);
        bottom: 300rpx;
        left: -250rpx;
        animation-delay: -4s;
      }
      
      &.bg-circle-3 {
        width: 600rpx;
        height: 600rpx;
        background: radial-gradient(circle, #2ed573 0%, transparent 70%);
        top: 50%;
        right: 10%;
        animation-delay: -6s;
      }
    }
    
    .bg-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        linear-gradient(rgba(201, 169, 98, 0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(201, 169, 98, 0.04) 1px, transparent 1px);
      background-size: 80rpx 80rpx;
    }
    
    .particles {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
      
      .particle {
        position: absolute;
        width: 16rpx;
        height: 16rpx;
        background: #c9a962;
        border-radius: 50%;
        opacity: 0.5;
        animation: particleFloat 12s linear infinite;
        
        &:nth-child(odd) {
          background: #00d4ff;
          width: 12rpx;
          height: 12rpx;
        }
        
        &:nth-child(3n) {
          background: #ff6b9d;
          width: 20rpx;
          height: 20rpx;
        }
        
        &:nth-child(1) { left: 10%; animation-duration: 14s; }
        &:nth-child(2) { left: 20%; animation-duration: 11s; animation-delay: -2s; }
        &:nth-child(3) { left: 30%; animation-duration: 16s; animation-delay: -4s; }
        &:nth-child(4) { left: 40%; animation-duration: 13s; animation-delay: -6s; }
        &:nth-child(5) { left: 50%; animation-duration: 15s; animation-delay: -8s; }
        &:nth-child(6) { left: 60%; animation-duration: 12s; animation-delay: -1s; }
        &:nth-child(7) { left: 70%; animation-duration: 17s; animation-delay: -3s; }
        &:nth-child(8) { left: 80%; animation-duration: 14s; animation-delay: -5s; }
        &:nth-child(9) { left: 90%; animation-duration: 13s; animation-delay: -7s; }
        &:nth-child(10) { left: 15%; animation-duration: 18s; animation-delay: -9s; }
        &:nth-child(11) { left: 45%; animation-duration: 16s; animation-delay: -11s; }
        &:nth-child(12) { left: 75%; animation-duration: 15s; animation-delay: -10s; }
      }
    }
  }
  
  .login-content {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 100rpx 60rpx;
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
    padding-top: 80rpx;
    
    .logo-wrapper {
      position: relative;
      width: 400rpx;
      height: 400rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 60rpx;
      
      .logo-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 420rpx;
        height: 420rpx;
        transform: translate(-50%, -50%);
        border: 6rpx solid transparent;
        border-radius: 50%;
        background: linear-gradient(#1a1a2e, #1a1a2e) padding-box,
                    linear-gradient(135deg, #c9a962, #8a6d3b, #c9a962, #8a6d3b) border-box;
        animation: ringRotate 8s linear infinite;
        box-shadow: 0 0 80rpx rgba(201, 169, 98, 0.4);
        
        &::before {
          content: '';
          position: absolute;
          top: -12rpx;
          left: 50%;
          width: 24rpx;
          height: 24rpx;
          background: #c9a962;
          border-radius: 50%;
          box-shadow: 0 0 40rpx #c9a962, 0 0 80rpx #c9a962;
        }
      }
      
      .logo-icon {
        font-size: 360rpx;
        animation: bounce 2s ease-in-out infinite;
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 0 60rpx rgba(201, 169, 98, 0.6));
      }
    }
    
    .logo-title {
      display: block;
      font-size: 120rpx;
      font-weight: 800;
      color: #fff;
      margin-bottom: 24rpx;
      text-shadow: 0 0 80rpx rgba(0, 212, 255, 0.8);
      letter-spacing: 12rpx;
    }
    
    .logo-subtitle {
      font-size: 64rpx;
      color: #a0a0b0;
      letter-spacing: 6rpx;
    }
  }
  
  .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 40rpx 0;
    
    .code-input-box {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.03));
        border-radius: 80rpx;
        padding: 80rpx 60rpx;
        border: 6rpx solid rgba(0, 212, 255, 0.35);
        backdrop-filter: blur(20rpx);
        box-shadow: 
          0 0 100rpx rgba(0, 212, 255, 0.2),
          inset 0 0 60rpx rgba(0, 212, 255, 0.08);
        
        .code-input-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 40rpx;
          margin-bottom: 80rpx;
          
          .header-line {
            width: 200rpx;
            height: 4rpx;
            background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.6));
          }
          
          .code-input-title {
            font-size: 80rpx;
            color: #b0b0c0;
            font-weight: 600;
            letter-spacing: 6rpx;
          }
        }
        
        .code-input-group {
          display: flex;
          justify-content: center;
          gap: 40rpx;
          margin-bottom: 60rpx;
          
          .code-input-item {
            width: 180rpx;
            height: 220rpx;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 48rpx;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 6rpx solid #374151;
            transition: all 0.3s;
            position: relative;
            
            &.active {
              border-color: #c9a962;
              background: rgba(201, 169, 98, 0.18);
              box-shadow: 0 0 60rpx rgba(201, 169, 98, 0.5);
            }
            
            &.filled {
              border-color: #c9a962;
              box-shadow: 0 0 70rpx rgba(201, 169, 98, 0.6);
              background: rgba(201, 169, 98, 0.15);
            }
            
            .digit-ring {
              position: absolute;
              top: -12rpx;
              left: -12rpx;
              right: -12rpx;
              bottom: -12rpx;
              border: 6rpx solid #c9a962;
              border-radius: 56rpx;
              animation: digitPulse 1s ease-in-out infinite;
            }
            
            .code-digit {
              font-size: 140rpx;
              font-weight: 800;
              color: #fff;
              font-family: 'Courier New', monospace;
              text-shadow: 0 0 40rpx rgba(201, 169, 98, 0.7);
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
          font-size: 56rpx;
          color: #8a8a9a;
          margin-top: 20rpx;
        }
      }
    
    .login-btn {
      margin-top: 80rpx;
      height: 200rpx;
      border-radius: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      transition: all 0.3s;
      background: linear-gradient(135deg, #c9a962, #8a6d3b);
      
      &.ready {
        animation: readyPulse 2s ease-in-out infinite;
        box-shadow: 0 0 80rpx rgba(201, 169, 98, 0.6), 0 16rpx 48rpx rgba(0, 0, 0, 0.3);
      }
      
      &:active:not(.disabled):not(.loading) {
        transform: scale(0.97);
      }
      
      &.disabled {
        background: linear-gradient(135deg, #444, #333);
        
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
        font-size: 96rpx;
        font-weight: 700;
        color: #fff;
        letter-spacing: 8rpx;
      }
      
      .btn-glow-left {
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        animation: btnGlow 3s ease-in-out infinite;
      }
      
      .btn-glow-right {
        position: absolute;
        top: 0;
        right: 0;
        width: 50%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
        filter: blur(30rpx);
      }
      
      .btn-ready-glow {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 120%;
        height: 200%;
        transform: translate(-50%, -50%);
        background: radial-gradient(ellipse, rgba(201, 169, 98, 0.4) 0%, transparent 70%);
        animation: readyGlow 2s ease-in-out infinite;
      }
    }
    
    .tips-section {
      margin-top: 60rpx;
      display: flex;
      flex-direction: column;
      gap: 24rpx;
      
      .tips-card {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 24rpx;
        padding: 40rpx 60rpx;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
        border-radius: 48rpx;
        border: 4rpx solid rgba(255, 255, 255, 0.12);
        
        .tip-icon {
          font-size: 80rpx;
        }
        
        .tip-text {
          font-size: 64rpx;
          color: #a0a0b0;
        }

        .scan-arrow {
          font-size: 80rpx;
          color: #c9a962;
          margin-left: auto;
        }

        &.scan-card {
          border-color: rgba(201, 169, 98, 0.35);
          background: linear-gradient(135deg, rgba(201, 169, 98, 0.12), rgba(201, 169, 98, 0.04));

          .tip-text { color: #c9a962; }
        }
      }
    }
  }

  .keyboard-section {
    flex: 0 0 auto;
    padding: 40rpx 40rpx;
    padding-bottom: calc(env(safe-area-inset-bottom) + 40rpx);
    
    .keyboard-container {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
      border-radius: 60rpx;
      padding: 40rpx;
      border: 4rpx solid rgba(0, 212, 255, 0.25);
    }
    
    .keyboard-row {
      display: flex;
      justify-content: center;
      gap: 32rpx;
      margin-bottom: 32rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .keyboard-key {
        flex: 1;
        height: 200rpx;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
        border-radius: 48rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 6rpx solid #374151;
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
          background: rgba(255, 255, 255, 0.2);
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
          background: rgba(201, 169, 98, 0.28);
          border-color: #c9a962;
          box-shadow: 0 0 60rpx rgba(201, 169, 98, 0.6), inset 0 0 40rpx rgba(201, 169, 98, 0.25);
        }
        
        &.special {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(239, 68, 68, 0.35);
          
          &:active {
            background: rgba(239, 68, 68, 0.35);
            border-color: #ef4444;
            box-shadow: 0 0 50rpx rgba(239, 68, 68, 0.5);
          }
          
          .key-text {
            color: #ff6b6b;
          }
        }
        
        .key-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 80%;
          height: 80%;
          transform: translate(-50%, -50%);
          background: radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%);
        }
        
        .key-text {
          font-size: 120rpx;
          font-weight: 700;
          color: #fff;
          position: relative;
          z-index: 1;
          font-family: 'Courier New', monospace;
        }
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-45rpx) rotate(2deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(45rpx) rotate(-2deg);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30rpx);
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
    transform: scale(1.02);
  }
}

@keyframes readyGlow {
  0%, 100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) rotate(360deg);
    opacity: 0;
  }
}
</style>