<template>
  <view class="game-selector">
    <view class="selector-btn" @click="showSelector = true">
      <view class="btn-icon">
        <text class="icon-text">🎱</text>
      </view>
      <text class="game-name">{{ currentGameName }}</text>
      <view class="btn-arrow">
        <text class="arrow-text">{{ showSelector ? '▲' : '▼' }}</text>
      </view>
    </view>
    <view v-if="showSelector" class="selector-overlay" @click="showSelector = false">
      <view class="selector-panel" @click.stop>
        <view class="panel-glow-bg"></view>
        <view class="panel-header">
          <text class="panel-title">选择玩法</text>
          <view class="panel-close" @click="showSelector = false">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="selector-list">
          <view 
            v-for="(mode, index) in gameModes" 
            :key="mode.value"
            class="selector-item"
            :class="{ active: currentMode === mode.value }"
            :style="{ animationDelay: `${index * 0.08}s` }"
            @click="selectMode(mode.value)"
          >
            <view class="item-icon" :style="{ background: getItemBg(mode.value) }">
              <text class="icon-emoji">{{ getItemIcon(mode.value) }}</text>
            </view>
            <view class="item-info">
              <text class="item-label">{{ mode.label }}</text>
              <text class="item-desc">{{ getItemDesc(mode.value) }}</text>
            </view>
            <view v-if="currentMode === mode.value" class="item-check">
              <text class="check-icon">✓</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { GameMode } from '../../../types/score'

const props = defineProps<{
  currentMode: GameMode
}>()

const emit = defineEmits<{
  (e: 'change', mode: GameMode): void
}>()

const showSelector = ref(false)

const gameModes = [
  { value: 'eight_ball' as GameMode, label: '中八玩法' },
  { value: 'chasing_2' as GameMode, label: '两人追分' },
  { value: 'chasing_3' as GameMode, label: '三人追分' },
  { value: 'chasing_4' as GameMode, label: '四人追分' },
  { value: 'snooker' as GameMode, label: '斯诺克' }
]

const currentGameName = computed(() => {
  const mode = gameModes.find(m => m.value === props.currentMode)
  return mode ? mode.label : ''
})

function getItemIcon(mode: GameMode): string {
  const icons: Record<GameMode, string> = {
    eight_ball: '🎱',
    chasing_2: '👥',
    chasing_3: '👨‍👩‍👧',
    chasing_4: '👨‍👩‍👧‍👦',
    snooker: '🟢'
  }
  return icons[mode]
}

function getItemBg(mode: GameMode): string {
  const colors: Record<GameMode, string> = {
    eight_ball: 'rgba(201, 169, 98, 0.2)',
    chasing_2: 'rgba(59, 130, 246, 0.2)',
    chasing_3: 'rgba(239, 68, 68, 0.2)',
    chasing_4: 'rgba(34, 197, 94, 0.2)',
    snooker: 'rgba(139, 92, 246, 0.2)'
  }
  return colors[mode]
}

function getItemDesc(mode: GameMode): string {
  const descs: Record<GameMode, string> = {
    eight_ball: '美式八球标准规则',
    chasing_2: '2人对战追分模式',
    chasing_3: '3人轮流追分模式',
    chasing_4: '4人轮流追分模式',
    snooker: '英式斯诺克计分'
  }
  return descs[mode]
}

function selectMode(mode: GameMode) {
  emit('change', mode)
  showSelector.value = false
}
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.game-selector {
  position: relative;
  
  .selector-btn {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding: 28rpx 36rpx;
    background: linear-gradient(145deg, rgba(35, 35, 80, 0.95), rgba(25, 25, 55, 0.98));
    border-radius: 40rpx;
    border: 4rpx solid rgba($gold, 0.2);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
    transition: all 0.3s;
    
    &:active {
      transform: scale(0.98);
      border-color: rgba($gold, 0.4);
    }
    
    .btn-icon {
      width: 80rpx;
      height: 80rpx;
      border-radius: 24rpx;
      background: rgba($gold, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2rpx solid rgba($gold, 0.3);
      
      .icon-text {
        font-size: 44rpx;
      }
    }
    
    .game-name {
      flex: 1;
      font-size: 44rpx;
      font-weight: 700;
      color: #fff;
      letter-spacing: 2rpx;
    }
    
    .btn-arrow {
      width: 64rpx;
      height: 64rpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      
      .arrow-text {
        font-size: 32rpx;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 700;
      }
    }
  }
  
  .selector-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 280rpx;
    backdrop-filter: blur(20rpx);
  }
  
  .selector-panel {
    position: relative;
    width: 50vw;
    background: linear-gradient(180deg, rgba(26, 26, 46, 0.98), rgba(20, 20, 40, 0.99));
    border-radius: 56rpx;
    border: 4rpx solid rgba($gold, 0.25);
    box-shadow: 
      0 32rpx 96rpx rgba(0, 0, 0, 0.6),
      0 0 60rpx rgba($gold, 0.15),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
    overflow: hidden;
    
    .panel-glow-bg {
      position: absolute;
      top: -100rpx;
      left: -100rpx;
      width: 300rpx;
      height: 300rpx;
      background: radial-gradient(circle, rgba($gold, 0.3) 0%, transparent 70%);
      pointer-events: none;
      animation: panelGlow 4s ease-in-out infinite;
    }
    
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 44rpx 48rpx 32rpx;
      border-bottom: 2rpx solid rgba(255, 255, 255, 0.08);
      position: relative;
      z-index: 1;
      
      .panel-title {
        font-size: 52rpx;
        font-weight: 700;
        color: #fff;
        letter-spacing: 4rpx;
      }
      
      .panel-close {
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
    
    .selector-list {
      padding: 24rpx;
      position: relative;
      z-index: 1;
      
      .selector-item {
        display: flex;
        align-items: center;
        gap: 28rpx;
        padding: 36rpx;
        border-radius: 40rpx;
        margin-bottom: 20rpx;
        transition: all 0.3s;
        animation: slideIn 0.4s ease-out forwards;
        opacity: 0;
        transform: translateY(20rpx);
        
        &:last-child {
          margin-bottom: 0;
        }
        
        &:active {
          background: rgba(255, 255, 255, 0.06);
        }
        
        &.active {
          background: linear-gradient(145deg, rgba($gold, 0.18), rgba($gold, 0.08));
          border: 2rpx solid rgba($gold, 0.3);
        }
        
        .item-icon {
          width: 96rpx;
          height: 96rpx;
          border-radius: 32rpx;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2rpx solid rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
          
          .icon-emoji {
            font-size: 52rpx;
          }
        }
        
        .item-info {
          flex: 1;
          
          .item-label {
            display: block;
            font-size: 44rpx;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8rpx;
          }
          
          .item-desc {
            font-size: 30rpx;
            color: rgba(255, 255, 255, 0.5);
          }
        }
        
        .item-check {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
          background: rgba($gold, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2rpx solid rgba($gold, 0.5);
          
          .check-icon {
            font-size: 36rpx;
            color: $gold;
            font-weight: 700;
          }
        }
      }
    }
  }
}

@keyframes panelGlow {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.1); }
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>