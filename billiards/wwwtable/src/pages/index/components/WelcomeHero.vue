<template>
  <view class="main-content">
    <view class="hero-section">
      <view class="hero-bg"></view>
      <view class="hero-decoration"></view>
      <view class="hero-content">
        <view class="hero-greeting">
          <text class="greeting-text">欢迎光临</text>
          <text class="greeting-sub">桌台已就绪，随时可以开始</text>
        </view>

        <view class="hero-icon-container">
          <view class="hero-icon-ring"></view>
          <view class="hero-icon-inner">
            <text class="hero-emoji">🎱</text>
          </view>
          <view class="hero-icon-particles">
            <view class="particle p1"></view>
            <view class="particle p2"></view>
            <view class="particle p3"></view>
            <view class="particle p4"></view>
          </view>
        </view>

        <!-- 桌台信息卡片 -->
        <view class="table-info-card">
          <view class="table-info-item">
            <text class="table-info-icon">🏷️</text>
            <text class="table-info-label">桌台</text>
            <text class="table-info-value">{{ tableNumber }}</text>
          </view>
          <view class="table-info-divider"></view>
          <view class="table-info-item">
            <text class="table-info-icon">💰</text>
            <text class="table-info-label">台费</text>
            <text class="table-info-value">¥{{ tableHourlyRate }}/时</text>
          </view>
          <view class="table-info-divider"></view>
          <view class="table-info-item status-item">
            <view class="status-indicator">
              <view class="status-dot"></view>
            </view>
            <text class="table-info-label">状态</text>
            <text class="table-info-value status-text">空闲</text>
          </view>
        </view>

        <!-- 快捷入口网格 -->
        <view class="quick-grid">
          <view class="quick-card" @click="$emit('product')">
            <view class="quick-card-bg bg-product"></view>
            <view class="quick-card-content">
              <view class="quick-icon-wrap">
                <text class="quick-icon">🍷</text>
              </view>
              <text class="quick-title">点单</text>
              <text class="quick-desc">酒水饮料</text>
            </view>
          </view>
          <view class="quick-card" @click="$emit('assistant')">
            <view class="quick-card-bg bg-assistant"></view>
            <view class="quick-card-content">
              <view class="quick-icon-wrap">
                <text class="quick-icon">👨‍🏫</text>
              </view>
              <text class="quick-title">助教</text>
              <text class="quick-desc">专业指导</text>
            </view>
          </view>
          <view class="quick-card" @click="$emit('score')">
            <view class="quick-card-bg bg-score"></view>
            <view class="quick-card-content">
              <view class="quick-icon-wrap">
                <text class="quick-icon">📊</text>
              </view>
              <text class="quick-title">计分</text>
              <text class="quick-desc">比赛记录</text>
            </view>
          </view>
          <view class="quick-card" @click="$emit('service')">
            <view class="quick-card-bg bg-service"></view>
            <view class="quick-card-content">
              <view class="quick-icon-wrap">
                <text class="quick-icon">🛎️</text>
              </view>
              <text class="quick-title">服务</text>
              <text class="quick-desc">呼叫服务员</text>
            </view>
          </view>
        </view>

        <!-- 一键开台按钮 -->
        <view class="quick-start-btn" @click="$emit('quick-create')">
          <view class="btn-wave wave-1"></view>
          <view class="btn-wave wave-2"></view>
          <view class="btn-content">
            <text class="btn-icon">⚡</text>
            <view class="btn-text">
              <text class="btn-title">一键开台</text>
              <text class="btn-subtitle">立即开始计时计费</text>
            </view>
            <text class="btn-arrow">›</text>
          </view>
        </view>
      </view>
    </view>

    <view class="tips-card">
      <view class="tips-header">
        <view class="tips-badge">
          <text class="tips-icon">💡</text>
        </view>
        <text class="tips-title">温馨提示</text>
      </view>
      <view class="tips-content">
        <text class="tip-text">开台后将自动开始计时计费</text>
        <text class="tip-text">可随时点单商品或预约助教服务</text>
        <text class="tip-text">如需帮助请点击左侧服务按钮</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  tableNumber: string
  tableHourlyRate: number
}>()

defineEmits<{
  'product': []
  'assistant': []
  'score': []
  'service': []
  'quick-create': []
}>()
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1; display: flex; flex-direction: column; overflow-y: auto;
  padding-top: 200rpx; padding-bottom: 20rpx;
}

.hero-section {
  position: relative; flex: 1; display: flex; flex-direction: column;
  border-radius: 56rpx; overflow: hidden; margin: 0 24rpx 24rpx;
  background: rgba(255,255,255,0.85);
  border: 2rpx solid rgba(7,193,96,0.06);
  box-shadow: 0 16rpx 60rpx rgba(0,0,0,0.05), 0 0 40rpx rgba(7,193,96,0.05);
  backdrop-filter: blur(30rpx);

  .hero-bg { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7,193,96,0.02) 0%, rgba(7,193,96,0.01) 100%); }
  .hero-decoration {
    position: absolute; inset: 0; overflow: hidden;
    &::before { content: ''; position: absolute; top: -300rpx; left: -300rpx; width: 800rpx; height: 800rpx; background: radial-gradient(circle, rgba(7,193,96,0.06) 0%, transparent 70%); animation: floatGlow 10s ease-in-out infinite; }
    &::after { content: ''; position: absolute; bottom: -200rpx; right: -200rpx; width: 600rpx; height: 600rpx; background: radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%); animation: floatGlow 10s ease-in-out infinite 3s; }
  }

  .hero-content {
    position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column;
    align-items: center; padding: 60rpx 32rpx 48rpx;

    .hero-greeting { text-align: center; margin-bottom: 32rpx;
      .greeting-text { display: block; font-size: 96rpx; font-weight: 900; color: #333333; letter-spacing: 12rpx; margin-bottom: 16rpx; }
      .greeting-sub { font-size: 40rpx; color: #999999; letter-spacing: 4rpx; }
    }

    .hero-icon-container { position: relative; width: 320rpx; height: 320rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 40rpx;
      .hero-icon-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, rgba(7,193,96,0.15), rgba(7,193,96,0.04)); animation: iconRingPulse 4s ease-in-out infinite; }
      .hero-icon-inner { position: relative; width: 220rpx; height: 220rpx; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.06), inset 0 0 20rpx rgba(7,193,96,0.04); border: 3rpx solid rgba(7,193,96,0.1);
        .hero-emoji { font-size: 140rpx; animation: floatEmoji 4s ease-in-out infinite; }
      }
      .hero-icon-particles { position: absolute; width: 100%; height: 100%;
        .particle { position: absolute; width: 16rpx; height: 16rpx; border-radius: 50%; background: rgba(7,193,96,0.3);
          &.p1 { top: 10%; left: 50%; transform: translateX(-50%); animation: particleMove 3s ease-in-out infinite; }
          &.p2 { top: 50%; right: 10%; transform: translateY(-50%); animation: particleMove 3s ease-in-out infinite 0.75s; }
          &.p3 { bottom: 10%; left: 50%; transform: translateX(-50%); animation: particleMove 3s ease-in-out infinite 1.5s; }
          &.p4 { top: 50%; left: 10%; transform: translateY(-50%); animation: particleMove 3s ease-in-out infinite 2.25s; }
        }
      }
    }
  }
}

@keyframes floatGlow { 0%,100%{transform:translate(0,0) scale(1);} 33%{transform:translate(40rpx,40rpx) scale(1.1);} 66%{transform:translate(-20rpx,-20rpx) scale(0.9);} }
@keyframes iconRingPulse { 0%,100%{transform:scale(1);opacity:0.5;box-shadow:0 0 30rpx rgba(7,193,96,0.15);} 50%{transform:scale(1.08);opacity:0.8;box-shadow:0 0 50rpx rgba(7,193,96,0.25);} }
@keyframes floatEmoji { 0%,100%{transform:translateY(0) rotate(0deg);} 25%{transform:translateY(-10rpx) rotate(2deg);} 75%{transform:translateY(10rpx) rotate(-2deg);} }
@keyframes particleMove { 0%,100%{transform:translate(0,0) scale(1);opacity:0.4;} 50%{transform:translate(20rpx,20rpx) scale(1.2);opacity:0.8;} }

// 桌台信息卡片
.table-info-card {
  display: flex; align-items: center; justify-content: space-around;
  background: rgba(255,255,255,0.9);
  border-radius: 32rpx; padding: 32rpx 24rpx;
  margin: 0 24rpx 32rpx;
  border: 2rpx solid rgba(7,193,96,0.08);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.04);

  .table-info-item { display: flex; flex-direction: column; align-items: center; gap: 8rpx; flex: 1;
    .table-info-icon { font-size: 48rpx; margin-bottom: 8rpx; }
    .table-info-label { font-size: 26rpx; color: #999999; font-weight: 500; }
    .table-info-value { font-size: 48rpx; font-weight: 800; color: #333333; }
    &.status-item {
      .status-indicator { width: 48rpx; height: 48rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 8rpx;
        .status-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #07C160; box-shadow: 0 0 16rpx rgba(7,193,96,0.6); animation: statusPulse 2s infinite; }
      }
      .status-text { color: #07C160; }
    }
  }
  .table-info-divider { width: 2rpx; height: 100rpx; background: rgba(7,193,96,0.08); }
}

@keyframes statusPulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.5;transform:scale(1.2);} }

// 快捷入口网格
.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20rpx; margin: 0 24rpx 32rpx; }
.quick-card {
  position: relative; border-radius: 36rpx; overflow: hidden;
  background: #ffffff; border: 2rpx solid rgba(7,193,96,0.06);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.04);
  transition: all 0.3s ease;
  &:active { transform: scale(0.96); border-color: #07C160; box-shadow: 0 12rpx 40rpx rgba(7,193,96,0.15); }

  .quick-card-bg { position: absolute; inset: 0; opacity: 0.04;
    &.bg-product { background: linear-gradient(135deg, #FF976A, #F97316); }
    &.bg-assistant { background: linear-gradient(135deg, #07C160, #06AD56); }
    &.bg-score { background: linear-gradient(135deg, #3B82F6, #6366F1); }
    &.bg-service { background: linear-gradient(135deg, #F97316, #EA580C); }
  }

  .quick-card-content { position: relative; z-index: 1; padding: 36rpx 24rpx; display: flex; flex-direction: column; align-items: center; gap: 12rpx;
    .quick-icon-wrap { width: 100rpx; height: 100rpx; background: rgba(7,193,96,0.04); border-radius: 28rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(7,193,96,0.08); margin-bottom: 8rpx;
      .quick-icon { font-size: 56rpx; }
    }
    .quick-title { font-size: 40rpx; font-weight: 800; color: #333333; letter-spacing: 2rpx; }
    .quick-desc { font-size: 26rpx; color: #999999; }
  }
}

// 一键开台按钮
.quick-start-btn {
  position: relative; margin: 0 24rpx 24rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 44rpx; padding: 40rpx 48rpx;
  border: 3rpx solid rgba(255,255,255,0.3);
  box-shadow: 0 16rpx 48rpx rgba(7,193,96,0.35), 0 0 30rpx rgba(7,193,96,0.15);
  overflow: hidden;
  transition: all 0.3s ease;
  &:active { transform: scale(0.96); box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3); }

  .btn-wave { position: absolute; top: 50%; left: 50%; width: 200%; height: 200%; border-radius: 50%; border: 3rpx solid rgba(255,255,255,0.1); animation: waveExpand 3s ease-out infinite;
    &.wave-1 { animation-delay: 0s; }
    &.wave-2 { animation-delay: 1.5s; }
  }

  .btn-content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between;
    .btn-icon { font-size: 80rpx; color: rgba(255,255,255,0.9); }
    .btn-text { flex: 1; text-align: center; margin: 0 24rpx;
      .btn-title { display: block; font-size: 56rpx; font-weight: 900; color: #ffffff; letter-spacing: 4rpx; margin-bottom: 8rpx; }
      .btn-subtitle { font-size: 32rpx; color: rgba(255,255,255,0.8); }
    }
    .btn-arrow { font-size: 64rpx; color: rgba(255,255,255,0.9); font-weight: 300; }
  }
}

@keyframes waveExpand { 0%{transform:translate(-50%,-50%) scale(0.5);opacity:0.6;} 100%{transform:translate(-50%,-50%) scale(1.5);opacity:0;} }

// 提示卡片
.tips-card {
  background: rgba(255,255,255,0.9);
  border-radius: 32rpx; padding: 32rpx;
  margin: 0 24rpx;
  border: 2rpx solid rgba(7,193,96,0.06);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.04);
  flex-shrink: 0;

  .tips-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 24rpx;
    .tips-badge { width: 56rpx; height: 56rpx; background: rgba(7,193,96,0.08); border-radius: 16rpx; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(7,193,96,0.1);
      .tips-icon { font-size: 32rpx; }
    }
    .tips-title { font-size: 36rpx; color: #333333; font-weight: 700; }
  }

  .tips-content { display: flex; flex-direction: column; gap: 16rpx;
    .tip-text { font-size: 30rpx; color: #666666; line-height: 1.6; padding-left: 24rpx; position: relative;
      &::before { content: '·'; position: absolute; left: 0; color: #07C160; font-weight: 700; }
    }
  }
}
</style>
