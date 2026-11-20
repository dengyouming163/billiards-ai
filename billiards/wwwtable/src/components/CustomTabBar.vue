<template>
  <view class="tabbar">
    <view class="tabbar-inner">
      <view
        class="tab-item"
        v-for="(item, index) in tabs"
        :key="item.path"
        :class="{ active: current === index }"
        @click="switchTab(index, item.path)"
      >
        <view class="tab-icon-wrap">
          <view class="tab-icon" :class="'icon-' + index"></view>
          <view class="icon-glow" v-if="current === index"></view>
        </view>
        <text class="tab-label">{{ item.text }}</text>
      </view>
    </view>
    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{ current: number }>()

const tabs = [
  { path: '/pages/product/index', text: '点单' },
  { path: '/pages/index/index', text: '账单' },
  { path: '/pages/score/index', text: '计分' },
]

function switchTab(index: number, path: string) {
  if (props.current === index) return
  uni.switchTab({ url: path })
}
</script>

<style lang="scss" scoped>
$primary: #07C160;
$primary-dark: #06AD56;
$bg-white: #ffffff;
$text-normal: #666666;
$text-active: #07C160;

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(140rpx + env(safe-area-inset-bottom));
  z-index: 99999;
  background: $bg-white;
  border-top: 1rpx solid rgba(0, 0, 0, 0.08);

  .tabbar-inner {
    display: flex;
    justify-content: space-around;
    align-items: center;
    height: 140rpx;
    padding: 0 20rpx;
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 16rpx 0;
    position: relative;
    transition: all 0.25s ease;

    &:active {
      transform: scale(0.95);
    }

    .tab-icon-wrap {
      position: relative;
      width: 80rpx;
      height: 80rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12rpx;

      .tab-icon {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        z-index: 2;
        transition: all 0.25s ease;

        &::before, &::after {
          content: '';
          position: absolute;
          box-sizing: border-box;
          transition: all 0.25s ease;
        }
      }

      .icon-glow {
        position: absolute;
        inset: -8rpx;
        border-radius: 50%;
        background: radial-gradient(circle, rgba($primary, 0.15) 0%, transparent 70%);
        animation: glowPulse 2s ease-in-out infinite;
      }
    }

    .icon-0::before {
      width: 64rpx; height: 64rpx;
      border: 5rpx solid $text-normal;
      border-radius: 14rpx;
    }
    .icon-0::after {
      width: 20rpx; height: 20rpx;
      background: $text-normal;
      border-radius: 5rpx;
      top: 40rpx;
    }

    .icon-1::before {
      width: 70rpx; height: 70rpx;
      border: 5rpx solid $text-normal;
      border-radius: 16rpx;
    }
    .icon-1::after {
      width: 44rpx; height: 8rpx;
      background: $text-normal;
      border-radius: 4rpx;
      top: 28rpx;
      box-shadow: 0 14rpx 0 $text-normal, 0 28rpx 0 $text-normal;
    }

    .icon-2::before {
      width: 70rpx; height: 70rpx;
      border: 5rpx solid $text-normal;
      border-radius: 50%;
    }
    .icon-2::after {
      width: 10rpx; height: 10rpx;
      background: $text-normal;
      border-radius: 50%;
      box-shadow: 22rpx 0 0 $text-normal, -22rpx 0 0 $text-normal, 0 22rpx 0 $text-normal, 0 -22rpx 0 $text-normal;
    }

    .tab-label {
      font-size: 36rpx;
      font-weight: 500;
      color: $text-normal;
      transition: all 0.25s ease;
      line-height: 1;
    }

    &.active {
      .tab-icon {
        transform: scale(1.15);
      }

      .icon-0::before, .icon-0::after { border-color: $primary; background: $primary; }
      .icon-1::before { border-color: $primary; }
      .icon-1::after { background: $primary; box-shadow: 0 14rpx 0 $primary, 0 28rpx 0 $primary; }
      .icon-2::before { border-color: $primary; }
      .icon-2::after {
        background: $primary;
        box-shadow: 22rpx 0 0 $primary, -22rpx 0 0 $primary, 0 22rpx 0 $primary, 0 -22rpx 0 $primary;
      }

      .tab-label {
        color: $text-active;
        font-weight: 700;
      }
    }
  }

  .safe-bottom {
    height: env(safe-area-inset-bottom);
    background: $bg-white;
  }
}

@keyframes glowPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50%      { transform: scale(1.2); opacity: 0.8; }
}
</style>