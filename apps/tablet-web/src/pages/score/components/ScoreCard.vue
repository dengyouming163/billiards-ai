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
$gold: #c9a962;

.score-card {
  position: relative;
  background: linear-gradient(145deg, rgba(35, 35, 80, 0.98), rgba(25, 25, 55, 0.99));
  border-radius: 56rpx;
  padding: 48rpx;
  min-height: 400rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 4rpx solid rgba($gold, 0.15);
  box-shadow: 
    0 16rpx 64rpx rgba(0, 0, 0, 0.4),
    0 0 40rpx rgba($gold, 0.08),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  &:active {
    border-color: rgba($gold, 0.3);
    box-shadow: 
      0 8rpx 32rpx rgba(0, 0, 0, 0.3),
      0 0 20rpx rgba($gold, 0.15),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
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
    background: radial-gradient(ellipse at 50% 50%, rgba($gold, 0.15) 0%, transparent 60%);
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
    width: 88rpx;
    height: 88rpx;
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
    
    .icon-text {
      font-size: 48rpx;
    }
  }
  
  .card-label {
    flex: 1;
    font-size: 44rpx;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 2rpx;
  }
  
  .edit-btn {
    width: 72rpx;
    height: 72rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2rpx solid rgba(255, 255, 255, 0.12);
    
    &:active {
      background: rgba($gold, 0.2);
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
    text-shadow: 0 0 60rpx currentColor;
    font-family: 'Courier New', monospace;
    letter-spacing: 8rpx;
  }
  
  .value-unit {
    font-size: 36rpx;
    color: rgba(255, 255, 255, 0.5);
    font-weight: 600;
  }
}

.card-actions {
  display: flex;
  gap: 24rpx;
  
  .action-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 32rpx 24rpx;
    border-radius: 36rpx;
    transition: all 0.2s;
    
    &:active {
      transform: scale(0.98);
      opacity: 0.85;
    }
    
    &.minus {
      background: linear-gradient(145deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.08));
      border: 3rpx solid rgba(239, 68, 68, 0.3);
      
      .action-label {
        color: #ef4444;
      }
    }
    
    &.edit {
      background: linear-gradient(145deg, rgba(107, 114, 128, 0.2), rgba(107, 114, 128, 0.08));
      border: 3rpx solid rgba(255, 255, 255, 0.15);
      
      .action-label {
        color: rgba(255, 255, 255, 0.8);
      }
    }
    
    &.plus {
      background: linear-gradient(145deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08));
      border: 3rpx solid rgba(34, 197, 94, 0.3);
      
      .action-label {
        color: #22c55e;
      }
    }
    
    .action-icon {
      font-size: 52rpx;
      font-weight: 700;
    }
    
    .action-label {
      font-size: 40rpx;
      font-weight: 700;
    }
    .action-label-num {
      font-size: 70rpx;
      font-weight: 700;
    }
  }
}

@keyframes cardGlow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>