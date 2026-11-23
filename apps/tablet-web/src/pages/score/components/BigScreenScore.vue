<template>
  <view class="big-screen-container">
    <!-- Header -->
    <view class="bs-header">
      <text class="bs-exit-btn" @tap="$emit('exit')">✕ 退出</text>
      <text class="bs-game-name">{{ gameName }}</text>
      <text class="bs-round">局 {{ currentRound }}</text>
    </view>

    <!-- Main score display -->
    <view class="bs-score-area">
      <view
        v-for="(player, idx) in players"
        :key="idx"
        :class="['bs-player', { active: idx === currentPlayer }]"
      >
        <text class="bs-player-name">{{ player.name }}</text>
        <text class="bs-player-score">{{ player.score }}</text>
      </view>
    </view>

    <!-- Game-specific content via slot -->
    <view class="bs-board-area">
      <slot />
    </view>

    <!-- Action buttons -->
    <view class="bs-actions">
      <view class="bs-btn bs-btn-pocket" @tap="$emit('pocket')">
        <text>进球</text>
      </view>
      <view class="bs-btn bs-btn-foul" @tap="$emit('foul')">
        <text>犯规</text>
      </view>
      <view class="bs-btn bs-btn-switch" @tap="$emit('switch')">
        <text>换人</text>
      </view>
      <view class="bs-btn bs-btn-end" @tap="$emit('endGame')">
        <text>结束</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface BigPlayer {
  name: string
  score: string | number
}

defineProps<{
  gameName: string
  currentRound: number
  players: BigPlayer[]
  currentPlayer: number
}>()

defineEmits<{
  exit: []
  pocket: []
  foul: []
  switch: []
  endGame: []
}>()
</script>

<style lang="scss" scoped>
$gold: #f0c040;

.big-screen-container {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #0a0a0f;
  display: flex;
  flex-direction: column;
  padding: 0;
}

// === Header ===
.bs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 40rpx;
  background: rgba(255, 255, 255, .03);
  border-bottom: 2rpx solid rgba($gold, .15);
  flex-shrink: 0;
}

.bs-exit-btn {
  font-size: 36rpx;
  color: rgba(255, 255, 255, .4);
  padding: 12rpx 24rpx;

  &:active {
    color: #ef4444;
  }
}

.bs-game-name {
  font-size: 48rpx;
  font-weight: 800;
  color: $gold;
  letter-spacing: 4rpx;
}

.bs-round {
  font-size: 40rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, .35);
}

// === Score Area ===
.bs-score-area {
  display: flex;
  justify-content: center;
  gap: 48rpx;
  padding: 48rpx 40rpx 32rpx;
  flex-shrink: 0;
}

.bs-player {
  flex: 1;
  max-width: 400rpx;
  text-align: center;
  padding: 40rpx 24rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, .03);
  border: 3rpx solid rgba(255, 255, 255, .06);
  transition: all .3s;

  &.active {
    border-color: rgba($gold, .6);
    background: rgba($gold, .08);
    box-shadow: 0 0 48rpx rgba($gold, .25), 0 0 96rpx rgba($gold, .08);
    transform: scale(1.03);
  }
}

.bs-player-name {
  display: block;
  font-size: 36rpx;
  color: #ffffff;
  margin-bottom: 16rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bs-player-score {
  display: block;
  font-size: 96rpx;
  font-weight: 900;
  color: $gold;
  line-height: 1.1;
  text-shadow: 0 0 40rpx rgba($gold, .5);
}

// === Board Area ===
.bs-board-area {
  flex: 1;
  overflow-y: auto;
  padding: 24rpx 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

// === Action Buttons ===
.bs-actions {
  display: flex;
  gap: 24rpx;
  padding: 32rpx 40rpx 56rpx;
  background: rgba(255, 255, 255, .02);
  border-top: 2rpx solid rgba(255, 255, 255, .05);
  flex-shrink: 0;
}

.bs-btn {
  flex: 1;
  min-height: 160rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  font-weight: 700;

  text {
    pointer-events: none;
  }

  &:active {
    transform: scale(.95);
    opacity: .85;
  }
}

.bs-btn-pocket {
  background: rgba(34, 197, 94, .18);
  color: #22c55e;
  border: 3rpx solid rgba(34, 197, 94, .35);
}

.bs-btn-foul {
  background: rgba(239, 68, 68, .18);
  color: #ef4444;
  border: 3rpx solid rgba(239, 68, 68, .35);
}

.bs-btn-switch {
  background: rgba(245, 158, 11, .18);
  color: #f59e0b;
  border: 3rpx solid rgba(245, 158, 11, .35);
}

.bs-btn-end {
  background: rgba(255, 255, 255, .06);
  color: rgba(255, 255, 255, .5);
  border: 3rpx solid rgba(255, 255, 255, .12);
}
</style>
