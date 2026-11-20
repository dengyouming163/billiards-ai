<template>
  <view class="main-content">
    <view class="order-card">
      <view class="card-glow-bg"></view>

      <!-- 状态头部 -->
      <view class="status-header">
        <view class="table-info">
          <view class="table-icon-wrap">
            <view class="icon-glow"></view>
            <text class="table-icon">🎱</text>
          </view>
          <view class="table-detail">
            <text class="table-label">桌台</text>
            <text class="table-number">{{ tableNumber }}</text>
            <view class="table-status-line"></view>
          </view>
        </view>
        <view class="order-status-tag" :class="{ prepaid: isPrepaid }">
          <view class="status-dot-wrapper">
            <view class="status-dot-pulse"></view>
            <view class="status-dot"></view>
          </view>
          <text>{{ isPrepaid ? '预付订单' : '进行中' }}</text>
        </view>
      </view>

      <!-- 计时器 -->
      <TimerSection
        :is-prepaid="isPrepaid"
        :formatted-duration="formattedDuration"
        :formatted-remaining="formattedRemaining"
        :progress="timerProgress"
        :prepaid-hours="prepaidHours"
      />

      <!-- 费用区域 -->
      <view class="fee-section">
        <FeeSummaryCard
          :total-fee="totalFee"
          :paid-amount="paidAmount"
          :payable-amount="payableAmount"
          @checkout="$emit('checkout')"
        />
        <FeeGrid
          :display-table-fee="displayTableFee"
          :table-hourly-rate="tableHourlyRate"
          :current-rate="currentRate"
          :product-fee="productFee"
          :product-count="productCount"
          :assistant-fee="assistantFee"
          :has-assistant-items="hasAssistantItems"
          :assistant-count="assistantCount"
          :charging-enabled="chargingEnabled"
          :charging-fee="chargingFee"
          :charging-active-ports="chargingActivePorts"
          @product-click="$emit('product-click')"
          @assistant-click="$emit('assistant-click')"
          @charging-click="$emit('charging-click')"
        />
      </view>

      <!-- 会员板块 -->
      <MemberBlock
        :member-info="memberInfo"
        :show-q-r="showMemberQR"
        :qr-url="memberQrUrl"
        @show-qr="$emit('show-member-qr')"
        @hide-qr="$emit('hide-member-qr')"
      />

      <!-- 底部信息 -->
      <view class="info-section">
        <view class="info-item">
          <view class="info-icon-wrap"><text class="info-icon">🕐</text></view>
          <text class="info-label">开始时间</text>
          <text class="info-value">{{ startTime || '--:--' }}</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-item">
          <view class="info-icon-wrap"><text class="info-icon">👥</text></view>
          <text class="info-label">玩家人数</text>
          <text class="info-value">{{ customerCount }}人</text>
        </view>
        <view class="info-divider"></view>
        <view class="info-item">
          <view class="info-icon-wrap"><text class="info-icon">⏱️</text></view>
          <text class="info-label">{{ isPrepaid ? '剩余时长' : '已用时长' }}</text>
          <text class="info-value info-highlight">{{ isPrepaid ? formattedRemaining : formattedDuration }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import TimerSection from './TimerSection.vue'
import FeeSummaryCard from './FeeSummaryCard.vue'
import FeeGrid from './FeeGrid.vue'
import MemberBlock from './MemberBlock.vue'

defineProps<{
  tableNumber: string
  isPrepaid: boolean
  formattedDuration: string
  formattedRemaining: string
  timerProgress: number
  prepaidHours: number
  totalFee: number
  paidAmount: number
  payableAmount: number
  displayTableFee: string
  tableHourlyRate: number
  currentRate: number
  productFee: number
  productCount: number
  assistantFee: number
  hasAssistantItems: boolean
  assistantCount: number
  chargingEnabled: boolean
  chargingFee: number
  chargingActivePorts: number
  memberInfo: Record<string, any> | null
  showMemberQR: boolean
  memberQrUrl: string
  startTime: string
  customerCount: number
}>()

defineEmits<{
  checkout: []
  'product-click': []
  'assistant-click': []
  'charging-click': []
  'show-member-qr': []
  'hide-member-qr': []
}>()
</script>

<style lang="scss" scoped>
.main-content {
  flex: 1; display: flex; flex-direction: column; overflow-y: auto;
  padding-top: 200rpx; padding-bottom: 16rpx;
}

.order-card {
  position: relative; flex: 1; display: flex; flex-direction: column;
  border-radius: 48rpx; overflow: hidden; margin: 0 24rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f0f9f4 100%);
  border: 2rpx solid rgba(7, 193, 96, 0.08);
  box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.06), 0 0 40rpx rgba(7,193,96,.08);
  max-height: 90vh;

  .card-glow-bg {
    position: absolute; top: -30%; left: -30%; width: 160%; height: 160%;
    background: radial-gradient(ellipse at 50% 0%, rgba(7,193,96,.08) 0%, transparent 60%);
    pointer-events: none;
  }
}

.status-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 36rpx 36rpx 28rpx; border-bottom: 2rpx solid rgba(7,193,96,.06); flex-shrink: 0;

  .table-info {
    display: flex; align-items: center; gap: 28rpx;
    .table-icon-wrap {
      position: relative; width: 100rpx; height: 100rpx;
      background: linear-gradient(135deg, rgba(7,193,96,.1), rgba(7,193,96,.04));
      border-radius: 28rpx; display: flex; align-items: center; justify-content: center;
      border: 2rpx solid rgba(7,193,96,.2);
      box-shadow: 0 8rpx 24rpx rgba(7,193,96,.1), inset 0 0 16rpx rgba(7,193,96,.06);
      .icon-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 64rpx; height: 64rpx; background: radial-gradient(circle, rgba(7,193,96,.15) 0%, transparent 70%); border-radius: 50%; animation: breathe 3s ease-in-out infinite; }
      .table-icon { position: relative; z-index: 1; font-size: 56rpx; }
    }
    .table-detail { display: flex; flex-direction: column; gap: 8rpx;
      .table-label { font-size: 26rpx; color: #999999; letter-spacing: 2rpx; font-weight: 500; }
      .table-number { font-size: 68rpx; font-weight: 900; color: #333333; letter-spacing: 6rpx; line-height: 1; }
      .table-status-line { width: 48rpx; height: 4rpx; background: linear-gradient(90deg, #07C160, transparent); border-radius: 2rpx; margin-top: 6rpx; }
    }
  }
}

.order-status-tag {
  display: flex; align-items: center; gap: 12rpx; padding: 16rpx 32rpx; border-radius: 40rpx;
  background: linear-gradient(135deg, rgba(7,193,96,.08), rgba(7,193,96,.04));
  border: 2rpx solid rgba(7,193,96,.2);
  box-shadow: 0 4rpx 16rpx rgba(7,193,96,.08);

  .status-dot-wrapper { position: relative; width: 20rpx; height: 20rpx;
    .status-dot-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 20rpx; height: 20rpx; border-radius: 50%; background: rgba(7,193,96,.3); animation: pulseRing 2s ease-out infinite; }
    .status-dot { position: relative; width: 20rpx; height: 20rpx; border-radius: 50%; background: #07C160; box-shadow: 0 0 12rpx rgba(7,193,96,.6); }
  }
  text { font-size: 32rpx; color: #07C160; font-weight: 700; letter-spacing: 2rpx; }

  &.prepaid {
    background: linear-gradient(135deg, rgba(255,151,106,.08), rgba(255,151,106,.04));
    border-color: rgba(255,151,106,.2);
    box-shadow: 0 4rpx 16rpx rgba(255,151,106,.08);
    .status-dot-wrapper .status-dot-pulse { background: rgba(255,151,106,.3); }
    .status-dot-wrapper .status-dot { background: #FF976A; box-shadow: 0 0 12rpx rgba(255,151,106,.6); }
    text { color: #FF976A; }
  }
}

.fee-section {
  flex: 0.6; display: flex; flex-direction: column;
  padding: 36rpx 40rpx; border-top: 2rpx solid rgba(7,193,96,.06);
}

.info-section {
  display: flex; justify-content: space-around; align-items: center;
  padding: 48rpx 32rpx;
  background: linear-gradient(135deg, rgba(7,193,96,.04), rgba(7,193,96,.01));
  border-top: 2rpx solid rgba(7,193,96,.06); border-bottom: 2rpx solid rgba(7,193,96,.06);
  flex: 0.18;

  .info-item { display: flex; flex-direction: column; align-items: center; gap: 12rpx; flex: 1;
    .info-icon-wrap { width: 72rpx; height: 72rpx; background: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(7,193,96,.1); margin-bottom: 4rpx;
      .info-icon { font-size: 36rpx; }
    }
    .info-label { display: block; font-size: 28rpx; color: #999999; letter-spacing: 2rpx; }
    .info-value { font-size: 44rpx; color: #333333; font-weight: 700;
      &.info-highlight { color: #07C160; }
    }
  }
  .info-divider { width: 2rpx; height: 100rpx; background: linear-gradient(180deg, transparent, rgba(7,193,96,.15), transparent); margin: 0 16rpx; }
}

@keyframes breathe { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.02);opacity:.8} }
@keyframes pulseRing { 0%{transform:scale(1);opacity:.5} 100%{transform:scale(1.3);opacity:0} }
</style>
