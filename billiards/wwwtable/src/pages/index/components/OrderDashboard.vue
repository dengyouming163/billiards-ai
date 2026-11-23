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
  padding-top: 220rpx; padding-bottom: 16rpx;
}

.order-card {
  position: relative; flex: 1; display: flex; flex-direction: column;
  border-radius: 56rpx; overflow: hidden; margin: 0 20rpx;
  background: linear-gradient(180deg, #1a1a2e 0%, #16162a 100%);
  border: 3rpx solid rgba(201, 169, 98, 0.25);
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, 0.5), 0 0 80rpx rgba(201, 169, 98, 0.1);
  max-height: 90vh;

  .card-glow-bg {
    position: absolute; top: -30%; left: -30%; width: 160%; height: 160%;
    background: radial-gradient(ellipse at 50% 0%, rgba(201, 169, 98, 0.15) 0%, transparent 60%);
    pointer-events: none;
  }
}

.status-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 40rpx 40rpx 32rpx; border-bottom: 2rpx solid rgba(255, 255, 255, 0.08); flex-shrink: 0;

  .table-info {
    display: flex; align-items: center; gap: 32rpx;
    .table-icon-wrap {
      position: relative; width: 120rpx; height: 120rpx;
      background: linear-gradient(135deg, rgba(201, 169, 98, 0.3), rgba(201, 169, 98, 0.1));
      border-radius: 32rpx; display: flex; align-items: center; justify-content: center;
      border: 3rpx solid rgba(201, 169, 98, 0.5);
      box-shadow: 0 12rpx 32rpx rgba(201, 169, 98, 0.25), inset 0 0 20rpx rgba(201, 169, 98, 0.1);
      .icon-glow { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 80rpx; height: 80rpx; background: radial-gradient(circle, rgba(201,169,98,.4) 0%, transparent 70%); border-radius: 50%; animation: breathe 3s ease-in-out infinite; }
      .table-icon { position: relative; z-index: 1; font-size: 64rpx; }
    }
    .table-detail { display: flex; flex-direction: column; gap: 12rpx;
      .table-label { font-size: 28rpx; color: #8a8a9a; letter-spacing: 3rpx; font-weight: 500; }
      .table-number { font-size: 80rpx; font-weight: 800; color: #c9a962; letter-spacing: 8rpx; line-height: 1; text-shadow: 0 4rpx 16rpx rgba(201,169,98,.4); }
      .table-status-line { width: 60rpx; height: 4rpx; background: linear-gradient(90deg, #c9a962, transparent); border-radius: 2rpx; margin-top: 8rpx; }
    }
  }
}

.order-status-tag {
  display: flex; align-items: center; gap: 16rpx; padding: 20rpx 40rpx; border-radius: 48rpx;
  background: linear-gradient(135deg, rgba(46,213,115,.25), rgba(34,197,94,.15));
  border: 3rpx solid rgba(46,213,115,.5);
  box-shadow: 0 8rpx 24rpx rgba(46,213,115,.2), inset 0 0 16rpx rgba(46,213,115,.1);

  .status-dot-wrapper { position: relative; width: 24rpx; height: 24rpx;
    .status-dot-pulse { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 24rpx; height: 24rpx; border-radius: 50%; background: rgba(46,213,115,.4); animation: pulseRing 2s ease-out infinite; }
    .status-dot { position: relative; width: 24rpx; height: 24rpx; border-radius: 50%; background: #2ed573; box-shadow: 0 0 16rpx rgba(46,213,115,1), 0 0 8rpx rgba(46,213,115,.8); }
  }
  text { font-size: 36rpx; color: #2ed573; font-weight: 700; letter-spacing: 3rpx; text-shadow: 0 2rpx 8rpx rgba(46,213,115,.3); }

  &.prepaid {
    background: linear-gradient(135deg, rgba(201,169,98,.25), rgba(138,109,59,.15));
    border-color: rgba(201,169,98,.5);
    box-shadow: 0 8rpx 24rpx rgba(201,169,98,.2), inset 0 0 16rpx rgba(201,169,98,.1);
    .status-dot-wrapper .status-dot-pulse { background: rgba(201,169,98,.4); }
    .status-dot-wrapper .status-dot { background: #c9a962; box-shadow: 0 0 16rpx rgba(201,169,98,1), 0 0 8rpx rgba(201,169,98,.8); }
    text { color: #c9a962; text-shadow: 0 2rpx 8rpx rgba(201,169,98,.3); }
  }
}

.fee-section {
  flex: 0.6; display: flex; flex-direction: column;
  padding: 40rpx 44rpx; border-top: 3rpx solid rgba(255,255,255,.1);
}

.info-section {
  display: flex; justify-content: space-around; align-items: center;
  padding: 64rpx 40rpx;
  background: linear-gradient(135deg, rgba(201,169,98,.08), rgba(201,169,98,.02));
  border-top: 2rpx solid rgba(201,169,98,.15); border-bottom: 2rpx solid rgba(201,169,98,.15);
  flex: 0.18;

  .info-item { display: flex; flex-direction: column; align-items: center; gap: 16rpx; flex: 1;
    .info-icon-wrap { width: 88rpx; height: 88rpx; background: linear-gradient(135deg, rgba(201,169,98,.2), rgba(201,169,98,.05)); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2rpx solid rgba(201,169,98,.3); margin-bottom: 8rpx;
      .info-icon { font-size: 44rpx; }
    }
    .info-label { display: block; font-size: 32rpx; color: #6a6a7a; letter-spacing: 2rpx; }
    .info-value { font-size: 48rpx; color: #fff; font-weight: 700;
      &.info-highlight { color: #c9a962; text-shadow: 0 0 20rpx rgba(201,169,98,.5); }
    }
  }
  .info-divider { width: 2rpx; height: 120rpx; background: linear-gradient(180deg, transparent, rgba(201,169,98,.3), transparent); margin: 0 20rpx; }
}

@keyframes breathe { 0%,100%{transform:scale(1);opacity:.9} 50%{transform:scale(1.02);opacity:1} }
@keyframes pulseRing { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.4);opacity:0} }
</style>
