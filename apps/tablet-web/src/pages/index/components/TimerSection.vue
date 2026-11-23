<template>
  <view class="timer-section">
    <view class="timer-bg-glow"></view>
    <view class="timer-bg-glow-secondary"></view>
    <view class="timer-content">
      <view class="timer-label-row">
        <view class="timer-label-dot" :class="{ prepaid: isPrepaid }">
          <view class="dot-inner"></view>
        </view>
        <text class="timer-label">{{ isPrepaid ? '剩余时间' : '已用时间' }}</text>
        <view class="timer-label-dot" :class="{ prepaid: isPrepaid }">
          <view class="dot-inner"></view>
        </view>
      </view>
      <view class="timer-display">
        <view class="timer-glow"></view>
        <text class="timer-value">{{ isPrepaid ? formattedRemaining : formattedDuration }}</text>
      </view>
      <view class="timer-progress">
        <view class="progress-bar">
          <view class="progress-fill" :class="{ prepaid: isPrepaid }" :style="{ width: progress + '%' }">
            <view class="progress-shine"></view>
          </view>
        </view>
        <view class="progress-labels">
          <text class="progress-label">{{ isPrepaid ? '0h' : '开始' }}</text>
          <text class="progress-label">{{ isPrepaid ? prepaidHours + 'h' : '24h' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  isPrepaid: boolean
  formattedDuration: string
  formattedRemaining: string
  progress: number
  prepaidHours: number
}>()
</script>

<style lang="scss" scoped>
.timer-section {
  position: relative; padding: 72rpx 40rpx 56rpx; text-align: center;
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.08) 0%, rgba(0, 212, 255, 0.02) 100%);
  overflow: hidden; flex: 0.28;

  .timer-bg-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 500rpx; height: 500rpx;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%);
    pointer-events: none; animation: breathe 4s ease-in-out infinite;
  }
  .timer-bg-glow-secondary {
    position: absolute; top: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.05), transparent);
    animation: shimmer 8s linear infinite; pointer-events: none;
  }

  .timer-content {
    position: relative; z-index: 1;
    .timer-label-row {
      display: flex; align-items: center; justify-content: center; gap: 16rpx; margin-bottom: 32rpx;
      .timer-label-dot {
        width: 16rpx; height: 16rpx; border-radius: 50%;
        background: rgba(0, 212, 255, 0.3); display: flex; align-items: center; justify-content: center;
        .dot-inner { width: 8rpx; height: 8rpx; border-radius: 50%; background: #00d4ff; box-shadow: 0 0 12rpx rgba(0, 212, 255, 1); }
        &.prepaid { background: rgba(201, 169, 98, 0.3);
          .dot-inner { background: #c9a962; box-shadow: 0 0 12rpx rgba(201, 169, 98, 1); }
        }
      }
      .timer-label { font-size: 32rpx; color: #b0b0c0; letter-spacing: 4rpx; font-weight: 500; }
    }

    .timer-display {
      position: relative; margin-bottom: 40rpx;
      .timer-glow {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 80%; height: 120rpx;
        background: radial-gradient(ellipse, rgba(0, 212, 255, 0.3) 0%, transparent 70%);
        filter: blur(20rpx); pointer-events: none;
      }
      .timer-value {
        position: relative; z-index: 1; font-size: 180rpx; font-weight: 800; color: #fff;
        font-family: 'Courier New', monospace; letter-spacing: 20rpx;
        text-shadow: 0 0 80rpx rgba(0, 212, 255, 0.8), 0 8rpx 32rpx rgba(0, 0, 0, 0.6); line-height: 1;
      }
    }

    .timer-progress {
      .progress-bar {
        width: 100%; height: 16rpx; background: rgba(255, 255, 255, 0.1);
        border-radius: 8rpx; overflow: hidden; box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
        .progress-fill {
          position: relative; height: 100%;
          background: linear-gradient(90deg, #00d4ff, #00a8ff, #00d4ff);
          background-size: 200% 100%; border-radius: 8rpx;
          box-shadow: 0 0 20rpx rgba(0, 212, 255, 0.8), 0 4rpx 12rpx rgba(0, 212, 255, 0.5);
          transition: width 0.5s ease; animation: shimmer 3s linear infinite;
          .progress-shine { position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(180deg, rgba(255,255,255,0.4), transparent); border-radius: 8rpx 8rpx 0 0; }
          &.prepaid { background: linear-gradient(90deg, #c9a962, #8a6d3b, #c9a962); background-size: 200% 100%; box-shadow: 0 0 20rpx rgba(201, 169, 98, 0.8), 0 4rpx 12rpx rgba(201, 169, 98, 0.5); }
        }
      }
      .progress-labels { display: flex; justify-content: space-between; margin-top: 12rpx; .progress-label { font-size: 24rpx; color: #8a8a9a; font-weight: 500; } }
    }
  }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.02); opacity: 1; }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
