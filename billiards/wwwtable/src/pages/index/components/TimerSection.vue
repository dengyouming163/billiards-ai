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
  position: relative; padding: 56rpx 40rpx 48rpx; text-align: center;
  background: linear-gradient(180deg, rgba(7,193,96,.06) 0%, rgba(7,193,96,.02) 100%);
  overflow: hidden; flex: 0.28;

  .timer-bg-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 500rpx; height: 500rpx;
    background: radial-gradient(circle, rgba(7,193,96,.1) 0%, transparent 70%);
    pointer-events: none; animation: breathe 4s ease-in-out infinite;
  }
  .timer-bg-glow-secondary {
    position: absolute; top: 0; left: 0; right: 0; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(7,193,96,.04), transparent);
    animation: shimmer 8s linear infinite; pointer-events: none;
  }

  .timer-content {
    position: relative; z-index: 1;
    .timer-label-row {
      display: flex; align-items: center; justify-content: center; gap: 12rpx; margin-bottom: 28rpx;
      .timer-label-dot {
        width: 14rpx; height: 14rpx; border-radius: 50%;
        background: rgba(7,193,96,.2); display: flex; align-items: center; justify-content: center;
        .dot-inner { width: 8rpx; height: 8rpx; border-radius: 50%; background: #07C160; box-shadow: 0 0 10rpx rgba(7,193,96,.6); }
        &.prepaid { background: rgba(255,151,106,.2);
          .dot-inner { background: #FF976A; box-shadow: 0 0 10rpx rgba(255,151,106,.6); }
        }
      }
      .timer-label { font-size: 28rpx; color: #999999; letter-spacing: 3rpx; font-weight: 500; }
    }

    .timer-display {
      position: relative; margin-bottom: 32rpx;
      .timer-glow {
        position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: 80%; height: 100rpx;
        background: radial-gradient(ellipse, rgba(7,193,96,.1) 0%, transparent 70%);
        filter: blur(20rpx); pointer-events: none;
      }
      .timer-value {
        position: relative; z-index: 1; font-size: 144rpx; font-weight: 900; color: #333333;
        font-family: 'Courier New', monospace; letter-spacing: 16rpx;
        line-height: 1;
      }
    }

    .timer-progress {
      .progress-bar {
        width: 100%; height: 16rpx; background: rgba(0,0,0,.06);
        border-radius: 8rpx; overflow: hidden;
        .progress-fill {
          position: relative; height: 100%;
          background: linear-gradient(90deg, #07C160, #06AD56);
          background-size: 200% 100%; border-radius: 8rpx;
          box-shadow: 0 0 16rpx rgba(7,193,96,.4);
          transition: width 0.5s ease; animation: shimmer 3s linear infinite;
          .progress-shine { position: absolute; top: 0; left: 0; right: 0; height: 50%; background: linear-gradient(180deg, rgba(255,255,255,.3), transparent); border-radius: 8rpx 8rpx 0 0; }
          &.prepaid { background: linear-gradient(90deg, #FF976A, #F97316); box-shadow: 0 0 16rpx rgba(255,151,106,.4); }
        }
      }
      .progress-labels { display: flex; justify-content: space-between; margin-top: 10rpx; .progress-label { font-size: 24rpx; color: #999999; font-weight: 500; } }
    }
  }
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.02); opacity: 0.7; }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
