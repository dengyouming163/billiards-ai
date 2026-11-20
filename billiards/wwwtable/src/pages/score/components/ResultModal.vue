<template>
  <view v-if="visible" class="modal-overlay" @click="handleCancel">
    <view class="modal-content" @click.stop>
      <view class="modal-glow-bg"></view>
      <view class="modal-header">
        <text class="modal-title">本局结果</text>
      </view>
      <view class="result-area">
        <view class="player-box blue" :class="{ winner: player1Score > player2Score }">
          <view class="player-icon-wrap">
            <text class="player-icon">🔵</text>
            <view v-if="player1Score > player2Score" class="winner-ring"></view>
          </view>
          <text class="player-name">玩家1号</text>
          <text class="player-score">{{ player1Score }}</text>
          <text v-if="player1Score > player2Score" class="winner-badge">👑 获胜</text>
        </view>
        <view class="center-area">
          <view class="center-trophy">
            <text class="trophy">🏆</text>
            <view class="trophy-glow"></view>
          </view>
          <text class="round-text">第{{ matchNumber }}局</text>
          <view v-if="player1Score === player2Score" class="draw-badge">平局</view>
        </view>
        <view class="player-box red" :class="{ winner: player2Score > player1Score }">
          <view class="player-icon-wrap">
            <text class="player-icon">🔴</text>
            <view v-if="player2Score > player1Score" class="winner-ring"></view>
          </view>
          <text class="player-name">玩家2号</text>
          <text class="player-score">{{ player2Score }}</text>
          <text v-if="player2Score > player1Score" class="winner-badge">👑 获胜</text>
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
defineProps<{
  visible: boolean
  player1Score: number
  player2Score: number
  matchNumber: number
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(10rpx);
}

.modal-content {
  position: relative;
  width: 50vw;
  background: #ffffff;
  border-radius: 48rpx;
  padding: 64rpx;
  border: 2rpx solid rgba(7,193,96,0.08);
  box-shadow: 
    0 24rpx 80rpx rgba(0, 0, 0, 0.1),
    0 0 30rpx rgba(7,193,96,0.05);
  overflow: hidden;
  animation: modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .modal-glow-bg {
    position: absolute;
    top: -100rpx;
    left: -100rpx;
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(7,193,96,0.06) 0%, transparent 70%);
    pointer-events: none;
    animation: modalGlow 4s ease-in-out infinite;
  }
  
  .modal-header {
    text-align: center;
    margin-bottom: 48rpx;
    position: relative;
    z-index: 1;
    
    .modal-title {
      font-size: 56rpx;
      font-weight: 700;
      color: #333333;
      letter-spacing: 4rpx;
    }
  }
  
  .result-area {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 48rpx;
    position: relative;
    z-index: 1;
    
    .player-box {
      flex: 1;
      padding: 40rpx 32rpx;
      border-radius: 32rpx;
      text-align: center;
      transition: all 0.3s;
      
      &.blue {
        background: rgba(59, 130, 246, 0.06);
        border: 2rpx solid rgba(59, 130, 246, 0.15);
        
        .player-score {
          color: #3b82f6;
        }
        
        &.winner {
          border-color: #3b82f6;
          box-shadow: 0 0 30rpx rgba(59, 130, 246, 0.2);
        }
      }
      
      &.red {
        background: rgba(239, 68, 68, 0.06);
        border: 2rpx solid rgba(239, 68, 68, 0.15);
        
        .player-score {
          color: #ef4444;
        }
        
        &.winner {
          border-color: #ef4444;
          box-shadow: 0 0 30rpx rgba(239, 68, 68, 0.2);
        }
      }
      
      .player-icon-wrap {
        position: relative;
        margin-bottom: 16rpx;
        
        .player-icon {
          font-size: 56rpx;
        }
        
        .winner-ring {
          position: absolute;
          top: -8rpx; left: -8rpx; right: -8rpx; bottom: -8rpx;
          border-radius: 50%;
          border: 4rpx solid #07C160;
          animation: winnerPulse 1.5s ease-in-out infinite;
        }
      }
      
      .player-name {
        font-size: 40rpx;
        color: #999999;
        display: block;
        margin-bottom: 20rpx;
        font-weight: 600;
      }
      
      .player-score {
        font-size: 100rpx;
        font-weight: 900;
        display: block;
        font-family: 'Courier New', monospace;
        letter-spacing: 4rpx;
      }
      
      .winner-badge {
        font-size: 36rpx;
        color: #07C160;
        display: block;
        margin-top: 20rpx;
        font-weight: 700;
      }
    }
    
    .center-area {
      padding: 0 32rpx;
      text-align: center;
      
      .center-trophy {
        position: relative;
        margin-bottom: 16rpx;
        
        .trophy {
          font-size: 80rpx;
        }
        
        .trophy-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120rpx;
          height: 120rpx;
          background: radial-gradient(circle, rgba(7,193,96,0.15) 0%, transparent 70%);
          animation: trophyGlow 2s ease-in-out infinite;
        }
      }
      
      .round-text {
        font-size: 40rpx;
        color: #999999;
        font-weight: 600;
        display: block;
        margin-bottom: 16rpx;
      }
      
      .draw-badge {
        display: inline-block;
        padding: 12rpx 32rpx;
        background: rgba(0,0,0,0.04);
        border-radius: 32rpx;
        font-size: 32rpx;
        color: #666666;
        font-weight: 600;
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
      border-radius: 36rpx;
      font-size: 48rpx;
      font-weight: 700;
      border: none;
      transition: all 0.2s;
      
      &:active {
        transform: scale(0.98);
        opacity: 0.85;
      }
      
      &.cancel {
        background: rgba(0,0,0,0.04);
        color: #666666;
        border: 2rpx solid rgba(0,0,0,0.06);
        
        .btn-icon {
          color: #999999;
        }
      }
      
      &.confirm {
        background: linear-gradient(135deg, #07C160, #06AD56);
        color: #ffffff;
        box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3);
        
        .btn-icon {
          color: #ffffff;
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

@keyframes winnerPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
}

@keyframes trophyGlow {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
}
</style>