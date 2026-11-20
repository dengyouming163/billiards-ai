<template>
  <view class="score-card" :class="{ 'span-2': card.span === 2 }">
    <view class="card-glow-bg" :style="{ opacity: card.type === 'penalty' ? 0.8 : 0.6 }"></view>
    <view class="card-content">
      <view class="card-header">
        <view class="header-icon" :style="{ background: getHeaderBg() }">
          <text class="icon-text">{{ getIcon() }}</text>
        </view>
        <text class="card-label">{{ card.label }}</text>
        <view v-if="card.showActions" class="edit-btn" @click="handleEdit">
          <text class="edit-icon">✏️</text>
        </view>
      </view>
      <view class="card-value-wrap">
        <text class="card-value" :style="{ color: getValueColor() }">
          {{ card.value }}
        </text>
        <view v-if="card.type === 'win'" class="value-unit">场</view>
      </view>
      <view v-if="card.showActions" class="card-actions">
        <view class="action-item minus" @click="handleMinus">
          <text class="action-label-num">-1</text>
        </view>
        <view class="action-item edit" @click="handleEdit">
          <text class="action-icon">✏️</text>
          <text class="action-label">修改</text>
        </view>
        <view class="action-item plus" @click="handlePlus">
          <text class="action-label-num">+1</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ScoreCard } from '../../../types/score'

const props = defineProps<{
  card: ScoreCard
}>()

const emit = defineEmits<{
  (e: 'plus', id: string): void
  (e: 'minus', id: string): void
  (e: 'edit', id: string): void
}>()

function getIcon() {
  if (props.card.type === 'penalty') return '⚠️'
  if (props.card.type === 'win') return '🏆'
  return '🎱'
}

function getHeaderBg() {
  if (props.card.type === 'penalty') return 'rgba(239, 68, 68, 0.2)'
  if (props.card.type === 'win') return 'rgba(201, 169, 98, 0.2)'
  return `rgba(${getColorHex(props.card.color)}, 0.2)`
}

function getValueColor() {
  if (props.card.type === 'penalty') return '#ef4444'
  if (props.card.type === 'win') return '#c9a962'
  if (props.card.type === 'player') {
    const colors: Record<string, string> = {
      blue: '#3b82f6',
      red: '#ef4444',
      green: '#22c55e',
      orange: '#f97316'
    }
    return colors[props.card.color] || '#fff'
  }
  return '#f1f5f9'
}

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    blue: '59, 130, 246',
    red: '239, 68, 68',
    green: '34, 197, 94',
    orange: '249, 115, 22'
  }
  return colors[color] || '255, 255, 255'
}

function handlePlus() {
  emit('plus', props.card.id)
}

function handleMinus() {
  emit('minus', props.card.id)
}

function handleEdit() {
  emit('edit', props.card.id)
}
</script>

<style lang="scss" scoped>
.score-card {
  position: relative;
  background: #ffffff;
  border-radius: 48rpx;
  padding: 48rpx;
  min-height: 420rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 2rpx solid rgba(7,193,96,0.08);
  box-shadow: 
    0 8rpx 32rpx rgba(0, 0, 0, 0.05),
    0 0 20rpx rgba(7,193,96,0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &:active {
    transform: scale(0.98);
    border-color: rgba(7,193,96,0.2);
    box-shadow: 
      0 4rpx 16rpx rgba(0, 0, 0, 0.04),
      0 0 30rpx rgba(7,193,96,0.1);
  }
  
  &.span-2 {
    grid-column: span 2;
    min-height: 280rpx;
    flex-direction: row;
    align-items: center;
  }
  
  .card-glow-bg {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at 50% 50%, rgba(7,193,96,0.06) 0%, transparent 60%);
    pointer-events: none;
    animation: cardGlow 4s ease-in-out infinite;
  }
  
  .card-content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  }
  
  &.span-2 .card-content {
    flex-direction: row;
    align-items: center;
    gap: 40rpx;
    width: 100%;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  
  .header-icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba(7,193,96,0.1);
    flex-shrink: 0;
    
    .icon-text {
      font-size: 52rpx;
    }
  }
  
  .card-label {
    flex: 1;
    font-size: 44rpx;
    font-weight: 700;
    color: #333333;
    letter-spacing: 2rpx;
  }
  
  .edit-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: rgba(7,193,96,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba(7,193,96,0.1);
    
    &:active {
      background: rgba(7,193,96,0.15);
    }
    
    .edit-icon {
      font-size: 36rpx;
    }
  }
}

.card-value-wrap {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 16rpx;
  
  .card-value {
    padding: 80rpx 0;
    font-size: 180rpx;
    font-weight: 900;
    line-height: 1;
    font-family: 'Courier New', monospace;
    letter-spacing: 8rpx;
  }
  
  .value-unit {
    font-size: 36rpx;
    color: #999999;
    font-weight: 600;
  }
}

.card-actions {
  display: flex;
  gap: 20rpx;
  
  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 28rpx 24rpx;
    border-radius: 32rpx;
    transition: all 0.2s;
    
    &:active {
      transform: scale(0.98);
      opacity: 0.85;
    }
    
    &.minus {
      background: rgba(239,68,68,0.06);
      border: 2rpx solid rgba(239,68,68,0.15);
      
      .action-label {
        color: #ef4444;
      }
    }
    
    &.edit {
      background: rgba(0,0,0,0.04);
      border: 2rpx solid rgba(0,0,0,0.06);
      
      .action-label {
        color: #666666;
      }
    }
    
    &.plus {
      background: rgba(7,193,96,0.06);
      border: 2rpx solid rgba(7,193,96,0.15);
      
      .action-label {
        color: #07C160;
      }
    }
    
    .action-icon {
      font-size: 48rpx;
      font-weight: 700;
    }
    
    .action-label {
      font-size: 36rpx;
      font-weight: 700;
    }
    .action-label-num {
      font-size: 64rpx;
      font-weight: 900;
    }
  }
}

@keyframes cardGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>