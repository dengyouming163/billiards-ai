<template>
  <view class="chase-board">
    <!-- Scoring rules reference -->
    <view class="cb-rules-bar">
      <view class="cb-rule-chip big-gold">
        <text class="cb-rule-name">大金</text>
        <text class="cb-rule-pts">+6</text>
      </view>
      <view class="cb-rule-chip small-gold">
        <text class="cb-rule-name">小金</text>
        <text class="cb-rule-pts">+4</text>
      </view>
      <view class="cb-rule-chip normal">
        <text class="cb-rule-name">普胜</text>
        <text class="cb-rule-pts">+2</text>
      </view>
    </view>

    <!-- Balls remaining -->
    <view class="cb-ball-bar">
      <text class="cb-ball-label">剩余球</text>
      <view class="cb-ball-row">
        <view
          v-for="ball in 9"
          :key="ball"
          :class="['cb-mini-ball', { sunk: !ballsOnTable.includes(ball) }]"
        >
          <text>{{ ball }}</text>
        </view>
      </view>
    </view>

    <!-- First shot indicator -->
    <view class="cb-shot-indicator" v-if="isFirstShot">
      <text>⚡ 当前为第一杆 — 打进9号即为大金/小金</text>
    </view>

    <!-- Phase indicator for recent win -->
    <view class="cb-win-banner" v-if="winType">
      <text v-if="winType === 'big_gold'" class="cb-win-text big-gold">🏆 大金！+6分</text>
      <text v-else-if="winType === 'small_gold'" class="cb-win-text small-gold">🥈 小金！+4分</text>
      <text v-else class="cb-win-text normal">✅ 普胜！+2分</text>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  ballsOnTable: number[]
  isFirstShot: boolean
  winType: 'big_gold' | 'small_gold' | 'normal' | null
}>()
</script>

<style lang="scss" scoped>
$gold: #f0c040;

.chase-board {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  align-items: center;
}

// Rules bar
.cb-rules-bar {
  display: flex;
  gap: 24rpx;
  justify-content: center;
}

.cb-rule-chip {
  padding: 16rpx 36rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 36rpx;
  font-weight: 700;

  &.big-gold {
    background: rgba(245, 158, 11, .15);
    border: 2rpx solid rgba(245, 158, 11, .35);
  }

  &.small-gold {
    background: rgba(168, 162, 158, .15);
    border: 2rpx solid rgba(168, 162, 158, .35);
  }

  &.normal {
    background: rgba(34, 197, 94, .12);
    border: 2rpx solid rgba(34, 197, 94, .25);
  }
}

.cb-rule-name {
  color: rgba(255, 255, 255, .6);
}

.cb-rule-pts {
  font-weight: 900;

  .big-gold & { color: #f59e0b; }
  .small-gold & { color: #a8a29e; }
  .normal & { color: #22c55e; }
}

// Ball bar
.cb-ball-bar {
  width: 100%;
  text-align: center;
}

.cb-ball-label {
  display: block;
  font-size: 32rpx;
  color: rgba(255, 255, 255, .4);
  margin-bottom: 16rpx;
}

.cb-ball-row {
  display: flex;
  gap: 12rpx;
  justify-content: center;
  flex-wrap: wrap;
}

.cb-mini-ball {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 35% 35%, #f9ca24, #d49a00);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, .3), inset 0 1px 0 rgba(255, 255, 255, .2);
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  transition: all .3s;

  &.sunk {
    opacity: .25;
    transform: scale(.8);
    filter: grayscale(.5);
  }
}

// Shot indicator
.cb-shot-indicator {
  padding: 20rpx 32rpx;
  background: rgba($gold, .1);
  border-radius: 20rpx;
  border: 2rpx solid rgba($gold, .25);
  font-size: 32rpx;
  color: $gold;
  text-align: center;
}

// Win banner
.cb-win-banner {
  width: 100%;
  text-align: center;
  padding: 32rpx;
  border-radius: 28rpx;
}

.cb-win-text {
  font-size: 44rpx;
  font-weight: 800;

  &.big-gold {
    color: #f59e0b;
  }

  &.small-gold {
    color: #a8a29e;
  }

  &.normal {
    color: #22c55e;
  }
}
</style>
