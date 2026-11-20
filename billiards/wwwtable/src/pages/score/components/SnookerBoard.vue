<template>
  <view class="snooker-board">
    <!-- Red counter -->
    <view class="sb-section">
      <view class="sb-red-counter">
        <view class="sb-red-dot"></view>
        <text class="sb-red-label">红球剩余</text>
        <text class="sb-red-count">{{ redsRemaining }} / 15</text>
      </view>
    </view>

    <!-- Color balls -->
    <view class="sb-section">
      <text class="sb-section-label">彩球</text>
      <view class="sb-colors-row">
        <view
          v-for="color in colorBalls"
          :key="color.code"
          :class="['sb-color-ball', { missing: !color.onTable }]"
          :style="{ backgroundColor: color.bg }"
        >
          <text class="sb-color-name">{{ color.label }}</text>
          <text class="sb-color-pts">{{ color.points }}分</text>
        </view>
      </view>
    </view>

    <!-- Phase indicator -->
    <view class="sb-section">
      <view class="sb-phase-badge" :class="phase">
        <text>{{ phase === 'reds' ? '红球阶段 — 红→彩交替' : '彩球阶段 — 按分值顺序收球' }}</text>
      </view>
    </view>

    <!-- Break score -->
    <view class="sb-section">
      <view class="sb-break-box">
        <text class="sb-break-label">当前单杆</text>
        <text class="sb-break-score">{{ breakScore }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  redsRemaining: number
  colorsOnTable: string[]
  phase: 'reds' | 'colors'
  breakScore: number
}>()

interface ColorBall {
  code: string
  label: string
  points: number
  bg: string
  onTable: boolean
}

const colorBalls = computed<ColorBall[]>(() => {
  const colors: Omit<ColorBall, 'onTable'>[] = [
    { code: 'Y', label: '黄', points: 2, bg: '#f0c040' },
    { code: 'G', label: '绿', points: 3, bg: '#22c55e' },
    { code: 'Br', label: '棕', points: 4, bg: '#8b4513' },
    { code: 'Bl', label: '蓝', points: 5, bg: '#3b82f6' },
    { code: 'P', label: '粉', points: 6, bg: '#ec4899' },
    { code: 'Bk', label: '黑', points: 7, bg: '#1a1a1a' },
  ]
  return colors.map(c => ({
    ...c,
    onTable: props.colorsOnTable.includes(c.code),
  }))
})
</script>

<style lang="scss" scoped>
$gold: #f0c040;

.snooker-board {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 40rpx;
  align-items: center;
}

.sb-section {
  width: 100%;
}

.sb-section-label {
  display: block;
  font-size: 36rpx;
  color: rgba(255, 255, 255, .5);
  margin-bottom: 20rpx;
  text-align: center;
}

// Red counter
.sb-red-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 36rpx 48rpx;
  background: rgba(239, 68, 68, .08);
  border-radius: 28rpx;
  border: 2rpx solid rgba(239, 68, 68, .2);
}

.sb-red-dot {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff4444, #cc0000);
  box-shadow: 0 0 20rpx rgba(255, 0, 0, .5);
}

.sb-red-label {
  font-size: 40rpx;
  color: rgba(255, 255, 255, .6);
}

.sb-red-count {
  font-size: 56rpx;
  font-weight: 900;
  color: #ef4444;
}

// Color balls grid
.sb-colors-row {
  display: flex;
  gap: 16rpx;
  justify-content: center;
  flex-wrap: wrap;
}

.sb-color-ball {
  width: 160rpx;
  height: 128rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, .4), inset 0 2rpx 0 rgba(255, 255, 255, .15);
  transition: all .3s;

  &.missing {
    opacity: .3;
    filter: grayscale(.7);
    transform: scale(.9);
  }
}

.sb-color-name {
  font-size: 32rpx;
  font-weight: 700;
  color: rgba(255, 255, 255, .9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .5);
}

.sb-color-pts {
  font-size: 28rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, .7);
  text-shadow: 0 1px 2px rgba(0, 0, 0, .5);
}

// Phase badge
.sb-phase-badge {
  text-align: center;
  padding: 28rpx 40rpx;
  border-radius: 28rpx;
  font-size: 38rpx;
  font-weight: 600;

  &.reds {
    background: rgba(34, 197, 94, .12);
    color: #22c55e;
    border: 2rpx solid rgba(34, 197, 94, .25);
  }

  &.colors {
    background: rgba(59, 130, 246, .12);
    color: #60a5fa;
    border: 2rpx solid rgba(59, 130, 246, .25);
  }
}

// Break score
.sb-break-box {
  text-align: center;
  padding: 32rpx;
  background: rgba(255, 255, 255, .03);
  border-radius: 28rpx;
  border: 2rpx solid rgba($gold, .2);
}

.sb-break-label {
  display: block;
  font-size: 36rpx;
  color: rgba(255, 255, 255, .5);
  margin-bottom: 12rpx;
}

.sb-break-score {
  display: block;
  font-size: 80rpx;
  font-weight: 900;
  color: $gold;
}
</style>
