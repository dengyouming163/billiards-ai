<template>
  <view class="tabbar">
    <view class="edge-line"></view>
    <view class="hex-bg"></view>
    <view class="scan-line"></view>

    <view class="tabbar-inner">
      <view
        class="tab-item"
        v-for="(item, index) in tabs"
        :key="item.path"
        :class="{ active: current === index }"
        @click="switchTab(index, item.path)"
      >
        <view class="active-glow" v-if="current === index">
          <view class="glow-core"></view>
          <view class="glow-spread"></view>
        </view>

        <view class="tab-icon" :class="'icon-' + index"></view>

        <view class="icon-halo" v-if="current === index"></view>

        <text class="tab-label">{{ item.text }}</text>
      </view>
    </view>

    <view class="safe-bottom"></view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{ current: number }>()

const tabs = [
  { path: '/pages/assistant/index', text: '教练' },
  { path: '/pages/product/index', text: '商品' },
  { path: '/pages/index/index', text: '账单' },
  { path: '/pages/score/index', text: '计分' },
]

function switchTab(index: number, path: string) {
  if (props.current === index) return
  uni.switchTab({ url: path })
}
</script>

<style lang="scss" scoped>
$gold: #c9a962;
$gold-light: #e2cf8a;
$bg-deep: #0a0a14;
$dim: rgba(255, 255, 255, 0.38);

.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(300rpx + env(safe-area-inset-bottom));
  z-index: 99999;
  background: #0a0a14;

  .edge-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba($gold, 0.15) 10%,
      rgba($gold, 0.5) 30%,
      rgba($gold-light, 0.7) 50%,
      rgba($gold, 0.5) 70%,
      rgba($gold, 0.15) 90%,
      transparent 100%
    );
  }

  .hex-bg {
    position: absolute;
    inset: 0;
    opacity: 0.04;
    background-image:
      repeating-linear-gradient(60deg, rgba($gold-light, 1) 0, rgba($gold-light, 1) 1rpx, transparent 1rpx, transparent 40rpx),
      repeating-linear-gradient(-60deg, rgba($gold-light, 1) 0, rgba($gold-light, 1) 1rpx, transparent 1rpx, transparent 40rpx),
      repeating-linear-gradient(0deg, rgba($gold-light, 1) 0, rgba($gold-light, 1) 1rpx, transparent 1rpx, transparent 40rpx);
    pointer-events: none;
  }

  .scan-line {
    position: absolute;
    top: 0;
    left: 5%;
    right: 5%;
    height: 1rpx;
    background: linear-gradient(90deg, transparent, rgba($gold, 0.4) 20%, rgba($gold-light, 0.6) 50%, rgba($gold, 0.4) 80%, transparent);
    animation: scanDown 6s linear infinite;
    pointer-events: none;
  }

  .tabbar-inner {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300rpx;
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    padding: 24rpx 12rpx 0;
    background: linear-gradient(180deg, rgba($bg-deep, 0.97) 0%, rgba(#000, 0.99) 100%);
    backdrop-filter: saturate(200%) blur(40rpx);
    -webkit-backdrop-filter: saturate(200%) blur(40rpx);
  }

  .tab-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 16rpx;
    position: relative;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    min-width: 0;

    &:active {
      transform: scale(0.93);
      .tab-icon { transform: scale(0.9); }
    }

    .tab-icon {
      width: 120rpx;
      height: 120rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 2;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &::before, &::after {
        content: '';
        position: absolute;
        box-sizing: border-box;
        transition: all 0.3s ease;
      }
    }

    // ====== 教练 ======
    .icon-0::before {
      width: 30rpx; height: 30rpx;
      border: 5rpx solid $dim;
      border-radius: 50%;
      top: 22rpx;
    }
    .icon-0::after {
      width: 58rpx; height: 38rpx;
      border: 5rpx solid $dim;
      border-radius: 30rpx 30rpx 0 0;
      border-bottom: none;
      top: 58rpx;
    }

    // ====== 商品 ======
    .icon-1::before {
      width: 50rpx; height: 50rpx;
      border: 5rpx solid $dim;
      border-radius: 50%;
    }
    .icon-1::after {
      width: 20rpx; height: 20rpx;
      background: $dim;
      border-radius: 50%;
      top: 34rpx;
    }

    // ====== 账单 ======
    .icon-2::before {
      width: 30rpx; height: 30rpx;
      border: 5rpx solid $dim;
      border-radius: 50%;
      top: 22rpx;
    }
    .icon-2::after {
      width: 58rpx; height: 38rpx;
      border: 5rpx solid $dim;
      border-radius: 30rpx 30rpx 0 0;
      border-bottom: none;
      top: 58rpx;
    }

    // ====== 计分 ======
    .icon-3::before {
      width: 56rpx; height: 56rpx;
      border: 5rpx solid $dim;
      border-radius: 50%;
    }
    .icon-3::after {
      width: 8rpx; height: 8rpx;
      background: $dim;
      border-radius: 50%;
      box-shadow: 18rpx 0 0 $dim, -18rpx 0 0 $dim, 0 18rpx 0 $dim, 0 -18rpx 0 $dim;
    }

    .icon-halo {
      position: absolute;
      top: 12rpx;
      left: 50%;
      transform: translateX(-50%);
      width: 130rpx;
      height: 130rpx;
      border-radius: 50%;
      background: radial-gradient(circle, rgba($gold, 0.2) 0%, rgba($gold, 0.08) 40%, transparent 70%);
      filter: blur(4rpx);
      animation: haloBreathe 2.5s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes haloBreathe {
      0%, 100% { transform: translateX(-50%) scale(0.9); opacity: 0.4; }
      50%      { transform: translateX(-50%) scale(1.2); opacity: 0.9; }
    }

    .tab-label {
      position: relative;
      z-index: 2;
      margin-top: 5rpx;
      font-size: 48rpx;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.38);
      letter-spacing: 3rpx;
      transition: all 0.3s ease;
    }

    .active-glow {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 140rpx;
      height: 140rpx;
      pointer-events: none;

      .glow-core {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background: radial-gradient(ellipse at 50% 100%, rgba($gold, 0.25) 0%, rgba($gold, 0.1) 40%, transparent 70%);
        animation: corePulse 2.5s ease-in-out infinite;
      }

      .glow-spread {
        position: absolute;
        bottom: -10rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 140rpx;
        height: 60rpx;
        background: radial-gradient(ellipse at 50% 80%, rgba($gold, 0.18) 0%, rgba($gold, 0.05) 50%, transparent 100%);
        filter: blur(8rpx);
      }
    }

    @keyframes corePulse {
      0%, 100% { opacity: 0.5; transform: translateX(-50%) scale(0.8); }
      50%      { opacity: 1; transform: translateX(-50%) scale(1.15); }
    }

    // === 激活态 ===
    &.active {
      .tab-icon {
        transform: translateY(-6rpx);
        filter: drop-shadow(0 0 18rpx rgba($gold, 0.7)) drop-shadow(0 0 36rpx rgba($gold, 0.35));
      }

      .icon-0::before, .icon-0::after { border-color: $gold; }
      .icon-1::before { border-color: $gold; }
      .icon-1::after { background: $gold; }
      .icon-2::before, .icon-2::after { border-color: $gold; }
      .icon-3::before { border-color: $gold; }
      .icon-3::after {
        background: $gold;
        box-shadow: 18rpx 0 0 $gold, -18rpx 0 0 $gold, 0 18rpx 0 $gold, 0 -18rpx 0 $gold;
      }

      .tab-label {
        color: $gold;
        font-weight: 700;
        text-shadow: 0 0 20rpx rgba($gold, 0.5);
        transform: translateY(-2rpx);
      }
    }
  }

  .safe-bottom {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-bottom);
    background: #0a0a14;
  }
}

@keyframes scanDown {
  0%   { top: 0; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
</style>
