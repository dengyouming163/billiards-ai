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
.member-block { margin: 16rpx 20rpx; flex-shrink: 0; }

.member-login-card {
  position: relative; display: flex; align-items: center; padding: 36rpx 36rpx;
  background: rgba(7,193,96,.04);
  border: 2rpx solid rgba(7,193,96,.15); border-radius: 28rpx; overflow: hidden; transition: all 0.3s;
  &:active { transform: scale(0.98); border-color: rgba(7,193,96,.3); }

  .mlc-glow-bg {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at left, rgba(7,193,96,.1) 0%, transparent 60%);
    opacity: 0.4; animation: memberGlow 4s ease-in-out infinite;
  }
  .mlc-ring {
    position: absolute; top: -48rpx; left: -48rpx; width: 120rpx; height: 120rpx;
    border-radius: 50%; border: 2rpx solid rgba(7,193,96,.2);
    animation: memberRingRotate 8s linear infinite;
    &::before {
      content: ''; position: absolute; top: 0; left: 50%;
      width: 14rpx; height: 14rpx; border-radius: 50%;
      background: rgba(7,193,96,.5); transform: translateX(-50%);
      box-shadow: 0 0 12rpx rgba(7,193,96,.6);
    }
  }
  .mlc-icon { font-size: 40rpx; margin-right: 20rpx; position: relative; z-index: 1; }
  .mlc-text { font-size: 32rpx; color: #333333; font-weight: 600; flex: 1; position: relative; z-index: 1; }
  .mlc-arrow { font-size: 28rpx; color: #07C160; font-weight: 500; position: relative; z-index: 1; }
}

.member-info-card {
  position: relative; background: rgba(7,193,96,.04);
  border: 2rpx solid rgba(7,193,96,.15); border-radius: 28rpx; padding: 32rpx 36rpx;
  overflow: hidden;

  .mic-glow-bg {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at center, rgba(7,193,96,.08) 0%, rgba(7,193,96,.02) 40%, transparent 70%);
    opacity: 0.5; animation: memberGlow 4s ease-in-out infinite; pointer-events: none;
  }
  .mic-ring {
    position: absolute; top: 50%; left: -60rpx; transform: translateY(-50%);
    width: 120rpx; height: 120rpx; border-radius: 50%; border: 2rpx solid rgba(7,193,96,.2);
    animation: memberRingRotate 6s linear infinite;
    &::before { content: ''; position: absolute; top: 0; left: 50%; width: 14rpx; height: 14rpx; border-radius: 50%; background: rgba(7,193,96,.6); transform: translateX(-50%); box-shadow: 0 0 16rpx rgba(7,193,96,.7); }
  }
  .mic-ring-outer {
    position: absolute; top: 50%; right: -80rpx; transform: translateY(-50%);
    width: 160rpx; height: 160rpx; border-radius: 50%; border: 2rpx dashed rgba(7,193,96,.1);
    animation: memberRingRotate 10s linear infinite reverse;
  }
  .mic-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
  .mic-name { font-size: 32rpx; font-weight: 700; color: #333333; }
  .mic-balance { font-size: 28rpx; font-weight: 700; color: #07C160; }
  .mic-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 2rpx solid rgba(7,193,96,.08); position: relative; z-index: 1; }
  .mic-level { font-size: 26rpx; color: #999999; }
  .mic-switch { font-size: 26rpx; color: #07C160; font-weight: 600; padding: 6rpx 20rpx; background: rgba(7,193,96,.06); border-radius: 16rpx; border: 1rpx solid rgba(7,193,96,.2); }
}

// QR Modal
.member-qr-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20rpx); }
.member-qr-modal {
  position: relative; width: 680rpx;
  background: #ffffff;
  border-radius: 40rpx; border: 2rpx solid rgba(7,193,96,.08);
  box-shadow: 0 24rpx 80rpx rgba(0,0,0,.12);
  overflow: hidden;

  .mqm-glow-bg { display: none; }
  .mqm-ring { display: none; }

  .mqm-header { display: flex; justify-content: space-between; align-items: center; padding: 36rpx 36rpx 24rpx; border-bottom: 2rpx solid rgba(0,0,0,.04); position: relative; z-index: 1;
    .mqm-header-left { display: flex; align-items: center; gap: 20rpx;
      .mqm-icon-wrap { width: 64rpx; height: 64rpx; background: rgba(7,193,96,.06); border-radius: 20rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(7,193,96,.15);
        .mqm-icon { font-size: 36rpx; }
      }
      .mqm-title { font-size: 36rpx; font-weight: 700; color: #333333; letter-spacing: 2rpx; }
    }
    .mqm-close { width: 60rpx; height: 60rpx; background: rgba(0,0,0,.04); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(0,0,0,.06);
      &:active { transform: scale(0.9); background: rgba(0,0,0,.08); }
      .mqm-close-icon { font-size: 28rpx; color: #999999; font-weight: 500; }
    }
  }
  .mqm-body { padding: 36rpx 36rpx 24rpx; position: relative; z-index: 1;
    .mqm-qr-container { display: flex; justify-content: center; margin-bottom: 24rpx;
      .mqm-qr-frame { position: relative; width: 400rpx; height: 400rpx; background: #ffffff; border-radius: 32rpx; padding: 20rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06); border: 2rpx solid rgba(0,0,0,.04);
        .mqm-qr-img { width: 100%; height: 100%; border-radius: 20rpx; }
        .mqm-qr-corner { position: absolute; width: 40rpx; height: 40rpx; border: 4rpx solid #07C160; border-radius: 8rpx;
          &.tl { top: 12rpx; left: 12rpx; border-right: none; border-bottom: none; }
          &.tr { top: 12rpx; right: 12rpx; border-left: none; border-bottom: none; }
          &.bl { bottom: 12rpx; left: 12rpx; border-right: none; border-top: none; }
          &.br { bottom: 12rpx; right: 12rpx; border-left: none; border-top: none; }
        }
      }
    }
    .mqm-loading { display: flex; flex-direction: column; align-items: center; padding: 60rpx 0;
      .mqm-loader { position: relative; width: 100rpx; height: 100rpx; margin-bottom: 24rpx;
        .mqm-loader-ring { position: absolute; inset: 0; border-radius: 50%; border: 4rpx solid transparent; border-top-color: rgba(7,193,96,.6); border-right-color: rgba(7,193,96,.3); animation: spin 1.5s linear infinite;
          &.delay-1 { animation-delay: 0.3s; border-top-color: rgba(7,193,96,.4); border-right-color: rgba(7,193,96,.2); }
          &.delay-2 { animation-delay: 0.6s; border-top-color: rgba(7,193,96,.3); border-right-color: rgba(7,193,96,.1); }
        }
      }
      .mqm-loading-text { font-size: 28rpx; color: #999999; letter-spacing: 2rpx; }
    }
    .mqm-hint { display: flex; align-items: center; justify-content: center; gap: 12rpx; padding: 20rpx 24rpx; background: rgba(7,193,96,.04); border-radius: 16rpx; border: 2rpx solid rgba(7,193,96,.1);
      .mqm-hint-icon { font-size: 32rpx; }
      .mqm-hint-text { font-size: 28rpx; color: #07C160; font-weight: 500; letter-spacing: 2rpx; }
    }
  }
  .mqm-footer { padding: 20rpx 36rpx 36rpx; border-top: 2rpx solid rgba(0,0,0,.04); position: relative; z-index: 1;
    .mqm-sub { display: block; font-size: 24rpx; color: #999999; text-align: center; letter-spacing: 2rpx; }
  }
}

@keyframes memberGlow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.03); } }
@keyframes memberRingRotate { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
@keyframes rotateQRRing { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
