<template>
  <view class="quick-buttons">
    <view class="qb-header">
      <view class="qb-icon" :style="{ background: iconBg, borderColor: iconBorder }">
        <text class="icon-text">{{ playerIcon }}</text>
      </view>
      <text class="qb-title" :style="{ color: textColor }">{{ title }}</text>
    </view>
    <view class="qb-grid">
      <view 
        v-for="num in [1, 2, 3, 4, 5, 6, 7]" 
        :key="num"
        class="qb-btn plus"
        :style="{ background: btnColor }"
        @click="handlePlus(num)"
      >
        <text class="btn-icon">+</text>
        <text class="btn-num">{{ num }}</text>
      </view>
      <view 
        class="qb-btn minus"
        :style="{ background: minusColor }"
        @click="handleMinus"
      >
        <text class="btn-icon">-</text>
        <text class="btn-num">1</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  bgColor: string
  textColor: string
  btnColor: string
  minusColor: string
}>()

const emit = defineEmits<{
  (e: 'plus', value: number): void
  (e: 'minus'): void
}>()

const playerIcon = computed(() => {
  return props.title.includes('玩家1') ? '🔵' : '🔴'
})

const iconBg = computed(() => {
  return props.title.includes('玩家1') 
    ? 'rgba(59, 130, 246, 0.2)' 
    : 'rgba(239, 68, 68, 0.2)'
})

const iconBorder = computed(() => {
  return props.title.includes('玩家1') 
    ? 'rgba(59, 130, 246, 0.4)' 
    : 'rgba(239, 68, 68, 0.4)'
})

function handlePlus(value: number) {
  emit('plus', value)
}

function handleMinus() {
  emit('minus')
}
</script>

<style lang="scss" scoped>
.quick-buttons {
  background: #ffffff;
  border-radius: 40rpx;
  padding: 40rpx;
  border: 2rpx solid rgba(7,193,96,0.06);
  box-shadow: 
    0 8rpx 24rpx rgba(0, 0, 0, 0.05),
    0 0 20rpx rgba(7,193,96,0.03);
  
  .qb-header {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 32rpx;
    
    .qb-icon {
      width: 88rpx;
      height: 88rpx;
      border-radius: 28rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid rgba(7,193,96,0.08);
      
      .icon-text {
        font-size: 48rpx;
      }
    }
    
    .qb-title {
      font-size: 44rpx;
      font-weight: 700;
      letter-spacing: 2rpx;
    }
  }
  
  .qb-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
    
    .qb-btn {
      aspect-ratio: 1;
      border-radius: 28rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      transition: all 0.2s;
      
      &:active {
        transform: scale(0.94);
        opacity: 0.85;
      }
      
      .btn-icon {
        font-size: 48rpx;
        font-weight: 800;
        color: #ffffff;
      }
      
      .btn-num {
        font-size: 56rpx;
        font-weight: 900;
        color: #ffffff;
        font-family: 'Courier New', monospace;
      }
    }
  }
}
</style>