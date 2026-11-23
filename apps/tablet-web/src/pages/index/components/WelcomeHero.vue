<template>
  <view class="main-content">
    <view class="hero-section">
      <view class="hero-bg"></view>
      <view class="hero-bg-glow-1"></view>
      <view class="hero-bg-glow-2"></view>
      <view class="hero-grid"></view>
      <view class="hero-content">
        <view class="hero-icon">
          <view class="icon-ring"></view>
          <view class="icon-ring-outer"></view>
          <text class="icon-text">🎱</text>
        </view>
        <text class="hero-title">欢迎光临</text>
        <text class="hero-subtitle">桌台已就绪，随时可以开始</text>

        <!-- 3列信息网格 -->
        <view class="info-grid">
          <view class="info-card">
            <text class="info-icon">🏷️</text>
            <text class="info-label">桌台</text>
            <text class="info-value">{{ tableNumber }}</text>
          </view>
          <view class="info-card">
            <text class="info-icon">💰</text>
            <text class="info-label">台费</text>
            <text class="info-value">¥{{ tableHourlyRate }}/时</text>
          </view>
          <view class="info-card">
            <view class="status-badge-idle">
              <view class="status-dot"></view>
              <text class="status-text">空闲</text>
            </view>
          </view>
        </view>

        <!-- 2x2快捷入口网格 -->
        <view class="quick-grid">
          <view class="quick-item" @click="$emit('product')">
            <view class="quick-icon">🍷</view>
            <view class="quick-info">
              <text class="quick-title">点单</text>
              <text class="quick-desc">酒水饮料</text>
            </view>
          </view>
          <view class="quick-item" @click="$emit('assistant')">
            <view class="quick-icon">👨‍🏫</view>
            <view class="quick-info">
              <text class="quick-title">助教</text>
              <text class="quick-desc">专业指导</text>
            </view>
          </view>
          <view class="quick-item" @click="$emit('score')">
            <view class="quick-icon">📊</view>
            <view class="quick-info">
              <text class="quick-title">计分</text>
              <text class="quick-desc">比赛记录</text>
            </view>
          </view>
          <view class="quick-item" @click="$emit('service')">
            <view class="quick-icon">🛎️</view>
            <view class="quick-info">
              <text class="quick-title">服务</text>
              <text class="quick-desc">呼叫服务员</text>
            </view>
          </view>
        </view>

        <view class="action-btn quick" @click="$emit('quick-create')">
          <view class="btn-bg"></view>
          <view class="btn-glow"></view>
          <view class="btn-shine"></view>
          <view class="btn-inner">
            <view class="action-icon-wrap">
              <view class="icon-pulse-ring"></view>
              <text class="action-icon">⚡</text>
            </view>
            <view class="action-info">
              <text class="action-title">一键开台</text>
              <text class="action-desc">立即开始计时计费</text>
            </view>
            <view class="action-arrow">
              <text class="arrow-icon">›</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="idle-tips-card">
      <view class="tips-header">
        <text class="tips-icon">💡</text>
        <text class="tips-title">温馨提示</text>
      </view>
      <view class="tips-list">
        <view class="tip-item"><text class="tip-dot">·</text><text class="tip-text">开台后将自动开始计时计费</text></view>
        <view class="tip-item"><text class="tip-dot">·</text><text class="tip-text">可随时点单商品或预约助教服务</text></view>
        <view class="tip-item"><text class="tip-dot">·</text><text class="tip-text">如需帮助请点击右侧"服务"按钮</text></view>
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
  padding-top: 220rpx; padding-bottom: 16rpx;
}

.hero-section {
  position: relative; flex: 1; display: flex; flex-direction: column;
  border-radius: 56rpx; overflow: hidden; margin: 0 20rpx; backdrop-filter: blur(40rpx);
  background: linear-gradient(145deg, rgba(26, 26, 46, 0.95), rgba(22, 22, 42, 0.98));
  border: 3rpx solid rgba(201, 169, 98, 0.2);
  box-shadow: 0 16rpx 64rpx rgba(0, 0, 0, 0.5), 0 0 100rpx rgba(201, 169, 98, 0.08);
  max-height: 90vh;

  .hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(201,169,98,.15), rgba(138,109,59,.08), rgba(201,169,98,.03)); backdrop-filter: blur(80rpx); }
  .hero-bg-glow-1 { position: absolute; top: -200rpx; left: -200rpx; width: 600rpx; height: 600rpx; background: radial-gradient(circle, rgba(0,212,255,.3) 0%, rgba(0,212,255,.08) 40%, transparent 70%); animation: glowPulse 5s ease-in-out infinite; }
  .hero-bg-glow-2 { position: absolute; bottom: -150rpx; right: -150rpx; width: 500rpx; height: 500rpx; background: radial-gradient(circle, rgba(201,169,98,.25) 0%, rgba(201,169,98,.08) 40%, transparent 70%); animation: glowPulse 5s ease-in-out infinite 2.5s; }
  .hero-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,212,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,.03) 1px, transparent 1px); background-size: 80rpx 80rpx; animation: gridPulse 4s ease-in-out infinite; }

  .hero-content {
    position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 32rpx 32rpx 24rpx;

    .hero-icon { position: relative; width: 320rpx; height: 320rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 32rpx;
      .icon-ring { position: absolute; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, rgba(0,212,255,.25), rgba(201,169,98,.15)); animation: ringPulse 3s ease-in-out infinite;
        &::before { content: ''; position: absolute; top: -10rpx; left: -10rpx; right: -10rpx; bottom: -10rpx; border-radius: 50%; border: 3rpx solid rgba(0,212,255,.3); animation: ringExpand 3s ease-out infinite; }
      }
      .icon-ring-outer { position: absolute; width: 120%; height: 120%; border-radius: 50%; border: 2rpx solid rgba(201,169,98,.2); animation: ringRotate 8s linear infinite;
        &::before { content: ''; position: absolute; top: 0; left: 50%; width: 16rpx; height: 16rpx; border-radius: 50%; background: rgba(201,169,98,.6); transform: translateX(-50%); box-shadow: 0 0 20rpx rgba(201,169,98,.8); }
      }
      .icon-text { position: relative; z-index: 1; font-size: 180rpx; animation: float 4s ease-in-out infinite; }
    }

    .hero-title { display: block; font-size: 120rpx; font-weight: 800; color: #fff; margin-bottom: 24rpx; background: linear-gradient(135deg, #c9a962, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: 16rpx; animation: textGlow 3s ease-in-out infinite; }
    .hero-subtitle { font-size: 56rpx; color: #b0b0c0; letter-spacing: 8rpx; animation: fadeIn 1s ease-out; margin-bottom: 32rpx; }
  }
}

// 3列信息网格
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24rpx; margin: 0 16rpx 40rpx; width: calc(100% - 32rpx); }
.info-card { background: rgba(0,0,0,.3); border-radius: 40rpx; padding: 40rpx 24rpx; border: 2rpx solid rgba(201,169,98,.15); text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 160rpx;
  .info-icon { font-size: 64rpx; margin-bottom: 20rpx; }
  .info-label { font-size: 28rpx; color: rgba(255,255,255,.5); margin-bottom: 12rpx; }
  .info-value { font-size: 48rpx; font-weight: 700; color: #c9a962; }
  .status-badge-idle { display: flex; align-items: center; gap: 16rpx; padding: 24rpx 40rpx; border-radius: 56rpx; background: linear-gradient(135deg, rgba(46,213,115,.2), rgba(34,197,94,.1)); border: 2rpx solid rgba(46,213,115,.4);
    .status-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #2ed573; box-shadow: 0 0 12rpx rgba(46,213,115,1); animation: pulse 2s infinite; }
    .status-text { font-size: 26rpx; color: #2ed573; font-weight: 600; }
  }
}

// 2x2快捷入口
.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24rpx; margin: 0 16rpx 40rpx; width: calc(100% - 32rpx); }
.quick-item { background: linear-gradient(145deg, rgba(201,169,98,.15), rgba(201,169,98,.05)); border-radius: 48rpx; padding: 48rpx 32rpx; border: 2rpx solid rgba(201,169,98,.2); display: flex; align-items: center; gap: 24rpx; transition: all .3s; min-height: 140rpx;
  &:active { transform: scale(.98); background: linear-gradient(145deg, rgba(201,169,98,.25), rgba(201,169,98,.1)); }
  .quick-icon { width: 100rpx; height: 100rpx; background: rgba(255,255,255,.1); border-radius: 32rpx; display: flex; align-items: center; justify-content: center; font-size: 52rpx; border: 2rpx solid rgba(255,255,255,.15); flex-shrink: 0; }
  .quick-info { flex: 1; .quick-title { font-size: 40rpx; font-weight: 600; color: #fff; margin-bottom: 10rpx; } .quick-desc { font-size: 28rpx; color: rgba(255,255,255,.4); } }
}

// 一键开台按钮
.action-btn { position: relative; height: 320rpx; min-height: 320rpx; border-radius: 56rpx; display: flex; align-items: center; justify-content: center; overflow: hidden; transition: all .4s ease; margin: 32rpx 16rpx 0; flex-shrink: 0;
  .btn-bg { background: linear-gradient(135deg, rgba(201,169,98,.35), rgba(138,109,59,.2)); position: absolute; inset: 0; border-radius: 64rpx; border: 4rpx solid rgba(255,255,255,.3); box-shadow: 0 12rpx 48rpx rgba(201,169,98,.3); }
  .btn-glow { background: rgba(201,169,98,.5); position: absolute; top: 50%; left: 50%; width: 80%; height: 80%; transform: translate(-50%,-50%); border-radius: 64rpx; filter: blur(80rpx); opacity: 0; transition: opacity .4s; }
  .btn-shine { position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent); animation: shine 3s ease-in-out infinite; }
  &:active { transform: scale(.95); .btn-glow { opacity: 1; } }
  .btn-inner { position: relative; z-index: 1; display: flex; align-items: center; gap: 56rpx; width: 100%; padding: 0 80rpx; }
  .action-icon-wrap { position: relative; width: 160rpx; height: 160rpx; border-radius: 48rpx; background: rgba(255,255,255,.15); display: flex; align-items: center; justify-content: center; border: 3rpx solid rgba(255,255,255,.2); box-shadow: 0 12rpx 40rpx rgba(0,0,0,.3); flex-shrink: 0;
    .icon-pulse-ring { position: absolute; width: 100%; height: 100%; border-radius: 48rpx; border: 3rpx solid rgba(201,169,98,.5); animation: ringPulse 2s ease-out infinite; }
    .action-icon { font-size: 96rpx; filter: drop-shadow(0 6rpx 16rpx rgba(0,0,0,.4)); }
  }
  .action-info { flex: 1; text-align: left; .action-title { display: block; font-size: 80rpx; font-weight: 800; color: #fff; margin-bottom: 16rpx; letter-spacing: 6rpx; text-shadow: 0 6rpx 20rpx rgba(0,0,0,.4); } .action-desc { font-size: 44rpx; color: #e0e0e0; letter-spacing: 3rpx; } }
  .action-arrow { flex-shrink: 0; .arrow-icon { font-size: 80rpx; color: #fff; font-weight: 300; } }
}

// 提示卡片
.idle-tips-card { background: linear-gradient(145deg, rgba(26,26,46,.95), rgba(22,22,42,.98)); border-radius: 40rpx; padding: 32rpx 40rpx; margin: 32rpx 20rpx; border: 2rpx solid rgba(201,169,98,.15); box-shadow: 0 12rpx 48rpx rgba(0,0,0,.4); flex-shrink: 0;
  .tips-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 28rpx; .tips-icon { font-size: 40rpx; } .tips-title { font-size: 36rpx; color: #c9a962; font-weight: 700; letter-spacing: 2rpx; } }
  .tips-list { display: flex; flex-direction: column; gap: 20rpx; .tip-item { display: flex; align-items: flex-start; gap: 16rpx; .tip-dot { font-size: 32rpx; color: #c9a962; font-weight: 700; line-height: 1.4; } .tip-text { font-size: 30rpx; color: #b0b0c0; line-height: 1.5; flex: 1; } } }
}

@keyframes glowPulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.4);opacity:.8} }
@keyframes gridPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
@keyframes ringPulse { 0%,100%{transform:scale(1);opacity:.6;box-shadow:0 0 40rpx rgba(0,212,255,.3)} 50%{transform:scale(1.1);opacity:.8;box-shadow:0 0 80rpx rgba(0,212,255,.5)} }
@keyframes ringExpand { 0%{transform:scale(.9);opacity:.8} 100%{transform:scale(1.4);opacity:0} }
@keyframes ringRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20rpx)} }
@keyframes textGlow { 0%,100%{text-shadow:0 0 30rpx rgba(201,169,98,.5)} 50%{text-shadow:0 0 60rpx rgba(201,169,98,.8)} }
@keyframes fadeIn { from{opacity:0;transform:translateY(20rpx)} to{opacity:1;transform:translateY(0)} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
@keyframes shine { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(200%) skewX(-15deg)} }
</style>
