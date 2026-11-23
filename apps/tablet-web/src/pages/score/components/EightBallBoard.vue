<template>
  <view class="eight-ball-board">
    <!-- Phase / Target indicator -->
    <view class="ebb-target" v-if="currentPlayerGroup">
      <text class="ebb-target-label">当前目标</text>
      <view class="ebb-target-badge" :class="currentPlayerGroup">
        <text>{{ currentPlayerGroup === 'solids' ? '全色球 1-7' : '花色球 9-15' }}</text>
      </view>
    </view>
    <view class="ebb-target" v-else>
      <text class="ebb-target-label">开球阶段 — 花色未定</text>
    </view>

    <!-- Ball grid -->
    <view class="ebb-grid">
      <view
        v-for="ball in allBalls"
        :key="ball.num"
        :class="[
          'ebb-ball',
          `ebb-ball-${ball.type}`,
          { sunk: ball.sunk }
        ]"
      >
        <view class="ebb-ball-shine"></view>
        <text class="ebb-ball-num">{{ ball.num }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ballsOnTable: number[]
  sunkBalls: number[]
  currentPlayerGroup: 'solids' | 'stripes' | null
}>()

interface BallDisplay {
  num: number
  type: 'solid' | 'stripes' | 'eight'
  sunk: boolean
}

const allBalls = computed<BallDisplay[]>(() => {
  return Array.from({ length: 15 }, (_, i) => {
    const num = i + 1
    let type: BallDisplay['type']
    if (num <= 7) type = 'solid'
    else if (num === 8) type = 'eight'
    else type = 'stripes'

    const isOnTable = props.ballsOnTable.includes(num)
    // A ball is sunk if it's not on the table
    const sunk = !isOnTable

    return { num, type, sunk }
  })
})
</script>

<style lang="scss" scoped>
$gold: #f0c040;

.eight-ball-board {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 36rpx;
}

.ebb-target {
  text-align: center;

  .ebb-target-label {
    display: block;
    font-size: 36rpx;
    color: rgba(255, 255, 255, .5);
    margin-bottom: 16rpx;
  }
}

.ebb-target-badge {
  display: inline-block;
  padding: 16rpx 48rpx;
  border-radius: 32rpx;
  font-size: 36rpx;
  font-weight: 700;

  &.solids {
    background: rgba(249, 202, 36, .15);
    color: #f9ca24;
    border: 2rpx solid rgba(249, 202, 36, .35);
  }

  &.stripes {
    background: rgba(139, 69, 19, .15);
    color: #d4945c;
    border: 2rpx solid rgba(139, 69, 19, .35);
  }
}

.ebb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  justify-content: center;
  max-width: 800rpx;
}

.ebb-ball {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, .4), inset 0 2rpx 0 rgba(255, 255, 255, .2);
  transition: all .3s;

  &.sunk {
    opacity: .4;
    transform: scale(.85);
    box-shadow: none;
    filter: grayscale(.5);
  }
}

.ebb-ball-shine {
  position: absolute;
  width: 40%;
  height: 30%;
  background: rgba(255, 255, 255, .3);
  border-radius: 50%;
  top: 16%;
  left: 30%;
}

.ebb-ball-num {
  position: relative;
  z-index: 1;
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .6);
}

// Ball colors
.ebb-ball-solid {
  background: radial-gradient(circle at 35% 35%, #f9ca24, #d49a00);
}

.ebb-ball-stripes {
  background: radial-gradient(circle at 35% 35%, #d4945c, #8b4513);
}

.ebb-ball-eight {
  background: radial-gradient(circle at 35% 35%, #444, #000);
}
</style>
