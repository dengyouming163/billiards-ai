<template>
  <view class="member-block">
    <!-- 未绑定会员 -->
    <view class="member-login-card" v-if="!memberInfo" @click="$emit('show-qr')">
      <view class="mlc-glow-bg"></view>
      <view class="mlc-ring"></view>
      <text class="mlc-icon">👤</text>
      <text class="mlc-text">会员登录</text>
      <text class="mlc-arrow">扫码绑定 →</text>
    </view>

    <!-- 已绑定会员 -->
    <view class="member-info-card" v-else>
      <view class="mic-glow-bg"></view>
      <view class="mic-ring"></view>
      <view class="mic-ring-outer"></view>
      <view class="mic-top">
        <text class="mic-name">{{ memberInfo.name || memberInfo.phone }}</text>
        <text class="mic-balance">余额 ¥{{ formatPrice(memberInfo.balance || 0) }}</text>
      </view>
      <view class="mic-bottom">
        <text class="mic-level">{{ memberInfo.level_name || '普通会员' }}</text>
        <text class="mic-switch" @click="$emit('show-qr')">切换</text>
      </view>
    </view>

    <!-- 会员扫码弹窗 -->
    <view class="member-qr-overlay" v-if="showQR" @click="$emit('hide-qr')">
      <view class="member-qr-modal" @click.stop>
        <view class="mqm-glow-bg"></view>
        <view class="mqm-ring"></view>

        <view class="mqm-header">
          <view class="mqm-header-left">
            <view class="mqm-icon-wrap"><text class="mqm-icon">👤</text></view>
            <text class="mqm-title">会员扫码登录</text>
          </view>
          <view class="mqm-close" @click="$emit('hide-qr')">
            <view class="mqm-close-icon">✕</view>
          </view>
        </view>

        <view class="mqm-body">
          <view class="mqm-qr-container" v-if="qrUrl">
            <view class="mqm-qr-frame">
              <image class="mqm-qr-img" :src="qrUrl" mode="aspectFit" />
              <view class="mqm-qr-corner tl"></view>
              <view class="mqm-qr-corner tr"></view>
              <view class="mqm-qr-corner bl"></view>
              <view class="mqm-qr-corner br"></view>
            </view>
          </view>
          <view class="mqm-loading" v-else>
            <view class="mqm-loader">
              <view class="mqm-loader-ring"></view>
              <view class="mqm-loader-ring delay-1"></view>
              <view class="mqm-loader-ring delay-2"></view>
            </view>
            <text class="mqm-loading-text">生成二维码中...</text>
          </view>
          <view class="mqm-hint">
            <text class="mqm-hint-icon">📱</text>
            <text class="mqm-hint-text">请使用微信扫描二维码</text>
          </view>
        </view>

        <view class="mqm-footer">
          <text class="mqm-sub">扫码后自动绑定会员信息，享受专属优惠</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  memberInfo: Record<string, any> | null
  showQR: boolean
  qrUrl: string
}>()

defineEmits<{
  'show-qr': []
  'hide-qr': []
}>()
</script>

<style lang="scss" scoped>
.member-block { margin: 20rpx; flex-shrink: 0; }

.member-login-card {
  position: relative; display: flex; align-items: center; padding: 48rpx 44rpx;
  background: linear-gradient(145deg, rgba(201, 169, 98, 0.15), rgba(201, 169, 98, 0.05));
  border: 2rpx solid rgba(201, 169, 98, 0.3); border-radius: 40rpx; overflow: hidden; transition: all 0.3s;
  &:active { transform: scale(0.98); border-color: rgba(201, 169, 98, 0.5); }

  .mlc-glow-bg {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at left, rgba(201, 169, 98, 0.3) 0%, transparent 60%);
    opacity: 0.5; animation: memberGlow 4s ease-in-out infinite;
  }
  .mlc-ring {
    position: absolute; top: -60rpx; left: -60rpx; width: 160rpx; height: 160rpx;
    border-radius: 50%; border: 3rpx solid rgba(201, 169, 98, 0.4);
    animation: memberRingRotate 8s linear infinite;
    &::before {
      content: ''; position: absolute; top: 0; left: 50%;
      width: 16rpx; height: 16rpx; border-radius: 50%;
      background: rgba(201, 169, 98, 0.8); transform: translateX(-50%);
      box-shadow: 0 0 20rpx rgba(201, 169, 98, 1);
    }
  }
  .mlc-icon { font-size: 48rpx; margin-right: 24rpx; position: relative; z-index: 1; }
  .mlc-text { font-size: 36rpx; color: #fff; font-weight: 600; flex: 1; position: relative; z-index: 1; }
  .mlc-arrow { font-size: 32rpx; color: #c9a962; font-weight: 500; position: relative; z-index: 1; }
}

.member-info-card {
  position: relative; background: linear-gradient(145deg, rgba(201, 169, 98, 0.18), rgba(138, 109, 59, 0.08));
  border: 3rpx solid rgba(201, 169, 98, 0.4); border-radius: 40rpx; padding: 40rpx 44rpx;
  overflow: hidden; box-shadow: 0 8rpx 32rpx rgba(201, 169, 98, 0.15);

  .mic-glow-bg {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at center, rgba(201, 169, 98, 0.4) 0%, rgba(201, 169, 98, 0.1) 40%, transparent 70%);
    opacity: 0.6; animation: memberGlow 4s ease-in-out infinite; pointer-events: none;
  }
  .mic-ring {
    position: absolute; top: 50%; left: -80rpx; transform: translateY(-50%);
    width: 160rpx; height: 160rpx; border-radius: 50%; border: 3rpx solid rgba(201, 169, 98, 0.5);
    animation: memberRingRotate 6s linear infinite;
    &::before { content: ''; position: absolute; top: 0; left: 50%; width: 16rpx; height: 16rpx; border-radius: 50%; background: rgba(201, 169, 98, 0.9); transform: translateX(-50%); box-shadow: 0 0 24rpx rgba(201, 169, 98, 1); }
  }
  .mic-ring-outer {
    position: absolute; top: 50%; right: -100rpx; transform: translateY(-50%);
    width: 200rpx; height: 200rpx; border-radius: 50%; border: 2rpx dashed rgba(201, 169, 98, 0.3);
    animation: memberRingRotate 10s linear infinite reverse;
  }
  .mic-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
  .mic-name { font-size: 36rpx; font-weight: 700; color: #fff; text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3); }
  .mic-balance { font-size: 32rpx; font-weight: 700; color: #34d399; text-shadow: 0 0 16rpx rgba(52, 211, 153, 0.5); }
  .mic-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 20rpx; padding-top: 20rpx; border-top: 2rpx solid rgba(255, 255, 255, 0.1); position: relative; z-index: 1; }
  .mic-level { font-size: 28rpx; color: rgba(255, 255, 255, 0.7); }
  .mic-switch { font-size: 28rpx; color: #c9a962; font-weight: 600; padding: 8rpx 24rpx; background: rgba(201, 169, 98, 0.15); border-radius: 20rpx; border: 1rpx solid rgba(201, 169, 98, 0.3); }
}

// QR Modal
.member-qr-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.85); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20rpx); }
.member-qr-modal {
  position: relative; width: 720rpx;
  background: linear-gradient(180deg, rgba(26, 26, 46, 0.98), rgba(20, 20, 40, 0.98));
  border-radius: 56rpx; border: 3rpx solid rgba(201, 169, 98, 0.3);
  box-shadow: 0 32rpx 96rpx rgba(0, 0, 0, 0.6), 0 0 60rpx rgba(201, 169, 98, 0.15), inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;

  .mqm-glow-bg { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(ellipse at 50% 0%, rgba(201, 169, 98, 0.2) 0%, rgba(201, 169, 98, 0.05) 40%, transparent 70%); pointer-events: none; }
  .mqm-ring { position: absolute; top: -100rpx; right: -100rpx; width: 300rpx; height: 300rpx; border-radius: 50%; border: 2rpx solid rgba(201, 169, 98, 0.2); animation: rotateQRRing 12s linear infinite;
    &::before { content: ''; position: absolute; top: 0; left: 50%; width: 20rpx; height: 20rpx; border-radius: 50%; background: rgba(201, 169, 98, 0.6); transform: translateX(-50%); box-shadow: 0 0 24rpx rgba(201, 169, 98, 0.8); }
  }

  .mqm-header { display: flex; justify-content: space-between; align-items: center; padding: 48rpx 48rpx 32rpx; border-bottom: 2rpx solid rgba(255, 255, 255, 0.08); position: relative; z-index: 1;
    .mqm-header-left { display: flex; align-items: center; gap: 24rpx;
      .mqm-icon-wrap { width: 80rpx; height: 80rpx; background: linear-gradient(135deg, rgba(201, 169, 98, 0.25), rgba(201, 169, 98, 0.1)); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(201, 169, 98, 0.4);
        .mqm-icon { font-size: 44rpx; }
      }
      .mqm-title { font-size: 44rpx; font-weight: 700; color: #fff; letter-spacing: 4rpx; }
    }
    .mqm-close { width: 72rpx; height: 72rpx; background: rgba(255, 255, 255, 0.08); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(255, 255, 255, 0.1);
      &:active { transform: scale(0.9); background: rgba(201, 169, 98, 0.2); }
      .mqm-close-icon { font-size: 32rpx; color: #8a8a9a; font-weight: 500; }
    }
  }
  .mqm-body { padding: 48rpx 48rpx 32rpx; position: relative; z-index: 1;
    .mqm-qr-container { display: flex; justify-content: center; margin-bottom: 32rpx;
      .mqm-qr-frame { position: relative; width: 440rpx; height: 440rpx; background: rgba(255, 255, 255, 0.95); border-radius: 40rpx; padding: 24rpx; box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.4);
        .mqm-qr-img { width: 100%; height: 100%; border-radius: 24rpx; }
        .mqm-qr-corner { position: absolute; width: 48rpx; height: 48rpx; border: 6rpx solid #1a1a2e; border-radius: 12rpx;
          &.tl { top: 16rpx; left: 16rpx; border-right: none; border-bottom: none; }
          &.tr { top: 16rpx; right: 16rpx; border-left: none; border-bottom: none; }
          &.bl { bottom: 16rpx; left: 16rpx; border-right: none; border-top: none; }
          &.br { bottom: 16rpx; right: 16rpx; border-left: none; border-top: none; }
        }
      }
    }
    .mqm-loading { display: flex; flex-direction: column; align-items: center; padding: 80rpx 0;
      .mqm-loader { position: relative; width: 120rpx; height: 120rpx; margin-bottom: 32rpx;
        .mqm-loader-ring { position: absolute; inset: 0; border-radius: 50%; border: 4rpx solid transparent; border-top-color: rgba(201, 169, 98, 0.8); border-right-color: rgba(201, 169, 98, 0.4); animation: spin 1.5s linear infinite;
          &.delay-1 { animation-delay: 0.3s; border-top-color: rgba(0, 212, 255, 0.8); border-right-color: rgba(0, 212, 255, 0.4); }
          &.delay-2 { animation-delay: 0.6s; border-top-color: rgba(52, 211, 153, 0.8); border-right-color: rgba(52, 211, 153, 0.4); }
        }
      }
      .mqm-loading-text { font-size: 32rpx; color: #8a8a9a; letter-spacing: 4rpx; }
    }
    .mqm-hint { display: flex; align-items: center; justify-content: center; gap: 16rpx; padding: 28rpx 32rpx; background: linear-gradient(135deg, rgba(201, 169, 98, 0.15), rgba(201, 169, 98, 0.05)); border-radius: 24rpx; border: 2rpx solid rgba(201, 169, 98, 0.2);
      .mqm-hint-icon { font-size: 40rpx; }
      .mqm-hint-text { font-size: 32rpx; color: #c9a962; font-weight: 500; letter-spacing: 2rpx; }
    }
  }
  .mqm-footer { padding: 28rpx 48rpx 48rpx; border-top: 2rpx solid rgba(255, 255, 255, 0.06); position: relative; z-index: 1;
    .mqm-sub { display: block; font-size: 26rpx; color: rgba(255, 255, 255, 0.4); text-align: center; letter-spacing: 2rpx; }
  }
}

@keyframes memberGlow { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
@keyframes memberRingRotate { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
@keyframes rotateQRRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
