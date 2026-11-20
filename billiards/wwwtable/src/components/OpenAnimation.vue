<template>
  <view v-if="visible" class="open-animation" :class="type" @click="handleClose">
    <view class="animation-bg"></view>
    
    <view class="animation-content">
      <!-- 成功图标 -->
      <view class="success-icon">
        <view class="icon-circle">
          <view class="icon-inner">
            <text class="icon-text">{{ type === 'quick' ? '⚡' : '💰' }}</text>
          </view>
        </view>
        <view class="icon-ring"></view>
        <view class="icon-ring delay-1"></view>
        <view class="icon-ring delay-2"></view>
      </view>
      
      <!-- 成功文字 -->
      <view class="success-text">
        <text class="text-main">{{ title }}</text>
        <text class="text-sub">{{ subtitle }}</text>
      </view>
      
      <!-- 装饰光效 -->
      <view class="light-effects">
        <view class="light light-1"></view>
        <view class="light light-2"></view>
        <view class="light light-3"></view>
        <view class="light light-4"></view>
      </view>
      
      <!-- 粒子效果 -->
      <view class="particles">
        <view v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  visible: boolean
  type: 'quick' | 'prepaid'  // 一键开台 or 预付开台
  message?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  type: 'quick',
  message: ''
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const title = ref('')
const subtitle = ref('')

watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 设置动画文字
    if (props.type === 'quick') {
      title.value = '开台成功'
      subtitle.value = '开始计时计费'
    } else {
      title.value = '预付成功'
      subtitle.value = props.message || '开始计时'
    }
    
    // 3秒后自动关闭
    setTimeout(() => {
      handleClose()
    }, 3000)
  }
})

function handleClose() {
  emit('close')
}

function getParticleStyle(index: number) {
  const angle = (index / 20) * 360
  const delay = (index / 20) * 0.5
  const size = Math.random() * 8 + 4
  
  return {
    '--angle': `${angle}deg`,
    '--delay': `${delay}s`,
    '--size': `${size}px`,
    '--x': `${Math.cos((angle * Math.PI) / 180) * 150}px`,
    '--y': `${Math.sin((angle * Math.PI) / 180) * 150}px`
  }
}
</script>

<style lang="scss" scoped>
.open-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .animation-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 15, 22, 0.95);
    animation: fadeIn 0.3s ease-out;
  }

  .animation-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 60rpx;
    z-index: 1;
    width: 1000rpx;
    padding: 80rpx 40rpx;
    background: rgba(26, 26, 46, 0.95);
    border-radius: 40rpx;
    border: 2rpx solid rgba(201, 169, 98, 0.3);
    box-shadow: 0 20rpx 80rpx rgba(0,0,0,.5);
  }
  
  .success-icon {
    position: relative;
    width: 200rpx;
    height: 200rpx;
    
    .icon-circle {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 160rpx;
      height: 160rpx;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 0 60rpx rgba(201, 169, 98, 0.5);
      
      .icon-inner {
        width: 120rpx;
        height: 120rpx;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .icon-text {
          font-size: 90rpx;
        }
      }
    }
    
    .icon-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 160rpx;
      height: 160rpx;
      border: 4rpx solid var(--primary-color);
      border-radius: 50%;
      animation: ringExpand 1.5s ease-out infinite;
      opacity: 0;
      
      &.delay-1 {
        animation-delay: 0.3s;
      }
      
      &.delay-2 {
        animation-delay: 0.6s;
      }
    }
  }
  
  .success-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    animation: slideUp 0.6s ease-out 0.3s both;
    
    .text-main {
      font-size: 84rpx;
      font-weight: bold;
      color: var(--text-primary);
      text-shadow: 0 0 30rpx rgba(201, 169, 98, 0.5);
    }
    
    .text-sub {
      font-size: 48rpx;
      color: var(--text-secondary);
      animation: fadeIn 0.5s ease-out 0.6s both;
    }
  }
  
  .light-effects {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600rpx;
    height: 600rpx;
    pointer-events: none;
    
    .light {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 300rpx;
      height: 4rpx;
      background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
      transform-origin: left center;
      animation: lightRotate 3s linear infinite;
      opacity: 0.3;
      
      &.light-1 { transform: rotate(0deg); }
      &.light-2 { transform: rotate(90deg); animation-delay: 0.75s; }
      &.light-3 { transform: rotate(180deg); animation-delay: 1.5s; }
      &.light-4 { transform: rotate(270deg); animation-delay: 2.25s; }
    }
  }
  
  .particles {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    pointer-events: none;
    
    .particle {
      position: absolute;
      width: var(--size);
      height: var(--size);
      background: var(--primary-color);
      border-radius: 50%;
      animation: particleFly 1s ease-out var(--delay) both;
      box-shadow: 0 0 10rpx var(--primary-color);
    }
  }
}

// 动画关键帧
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

@keyframes ringExpand {
  from {
    width: 160rpx;
    height: 160rpx;
    opacity: 0.8;
  }
  to {
    width: 400rpx;
    height: 400rpx;
    opacity: 0;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes lightRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes particleFly {
  from {
    transform: translate(0, 0) scale(1);
    opacity: 1;
  }
  to {
    transform: translate(var(--x), var(--y)) scale(0);
    opacity: 0;
  }
}
</style>
