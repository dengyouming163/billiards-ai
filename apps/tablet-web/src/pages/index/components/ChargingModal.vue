<template>
  <view class="charging-overlay" v-if="visible" @click="$emit('close')">
    <view class="charging-modal" @click.stop>
      <view class="charging-top-line"></view>
      <view class="charging-header">
        <text class="charging-title">充电服务</text>
        <view class="charging-close" @click="$emit('close')"><text>✕</text></view>
      </view>

      <view class="charging-body">
        <view class="charging-rule">{{ billingDesc }}</view>

        <view class="charging-cards">
          <view class="ch-card" v-for="p in ['left','right']" :key="p" :class="{ active: getPortStatus(p) === 'active' }">
            <view class="ch-card-icon">🔌</view>
            <text class="ch-card-name">{{ p === 'left' ? '左充电口' : '右充电口' }}</text>
            <view class="ch-card-status" :class="getPortStatus(p)">
              <view class="ch-status-dot" :class="getPortStatus(p)"></view>
              <text>{{ getPortStatusText(p) }}</text>
            </view>
            <text class="ch-card-timer" v-if="getPortStatus(p) === 'active'">{{ getPortElapsed(p) }}</text>
            <view class="ch-card-btn start" v-if="getPortStatus(p) === 'idle'" @click.stop="$emit('start', p)">
              <text>⚡ 启动充电</text>
            </view>
            <view class="ch-card-btn stop" v-if="getPortStatus(p) === 'active'" @click.stop="$emit('stop', p)">
              <text>⏹ 停止充电</text>
            </view>
          </view>
        </view>
      </view>

      <view class="charging-session-list" v-if="sessions && sessions.length > 0">
        <text class="ch-section-title">充电子订单</text>
        <view class="ch-session-item" v-for="s in sessions" :key="s.id">
          <view class="ch-session-left">
            <text class="ch-session-port">{{ s.port === 'left' ? '左口' : '右口' }}</text>
            <text class="ch-session-status" :class="s.status">{{ s.status === 'active' ? '充电中' : '已完成' }}</text>
          </view>
          <view class="ch-session-right">
            <text class="ch-session-fee" v-if="s.status === 'active'">≈¥{{ formatPrice(s.estimated_fee || 0) }}</text>
            <text class="ch-session-fee" v-else>¥{{ formatPrice(s.total_fee || 0) }}</text>
          </view>
        </view>
      </view>

      <view class="charging-footer">
        <view class="charging-fee-row">
          <text class="charging-fee-label">充电费用</text>
          <text class="charging-fee-value">¥{{ formatPrice(fee) }}</text>
        </view>
        <view class="charging-close-btn" @click="$emit('close')"><text>关闭</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatPrice } from '@/utils/format'

defineProps<{
  visible: boolean
  billingDesc: string
  fee: number
  sessions: any[]
  getPortStatus: (p: string) => string
  getPortStatusText: (p: string) => string
  getPortElapsed: (p: string) => string
}>()

defineEmits<{
  close: []
  start: [port: string]
  stop: [port: string]
}>()
</script>

<style lang="scss" scoped>
.charging-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.7); z-index: 100; display: flex; align-items: center; justify-content: center; }
.charging-modal { width: 90vw; max-width: 1200rpx; max-height: 85vh; background: #fff; border-radius: 32rpx; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20rpx 60rpx rgba(0,0,0,.3); }

.charging-top-line { height: 4rpx; background: linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b); }
.charging-header { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 32rpx; border-bottom: 1rpx solid #f1f5f9; }
.charging-title { font-size: 36rpx; font-weight: 700; color: #1e293b; }
.charging-close { width: 56rpx; height: 56rpx; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; text { font-size: 28rpx; color: #94a3b8; } }
.charging-body { padding: 24rpx 32rpx; flex: 1; overflow-y: auto; }
.charging-rule { padding: 16rpx 20rpx; background: #fef3c7; border-radius: 16rpx; font-size: 24rpx; color: #92400e; margin-bottom: 24rpx; line-height: 1.6; }

.charging-cards { display: flex; gap: 20rpx; }
.ch-card { flex: 1; background: #f8fafc; border: 2rpx solid #e2e8f0; border-radius: 24rpx; padding: 32rpx 20rpx; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16rpx; transition: all .2s; }
.ch-card.active { background: #fffbeb; border-color: #fbbf24; box-shadow: 0 4rpx 20rpx rgba(245,158,11,.15); }
.ch-card-icon { font-size: 56rpx; }
.ch-card-name { font-size: 30rpx; font-weight: 700; color: #334155; }
.ch-card-status { display: flex; align-items: center; gap: 8rpx; font-size: 24rpx; color: #64748b; }
.ch-status-dot { width: 12rpx; height: 12rpx; border-radius: 50%; }
.ch-status-dot.idle { background: #94a3b8; }
.ch-status-dot.active { background: #10b981; animation: pulseDot 1.5s infinite; }
.ch-card-timer { font-size: 36rpx; font-weight: 800; color: #f59e0b; font-family: monospace; }
.ch-card-btn { width: 100%; height: 72rpx; border-radius: 36rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; font-weight: 600; margin-top: 8rpx; }
.ch-card-btn.start { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #fff; box-shadow: 0 4rpx 16rpx rgba(245,158,11,.3); }
.ch-card-btn.stop { background: #fee2e2; color: #ef4444; border: 2rpx solid #fecaca; }

.charging-session-list { padding: 16rpx 32rpx 0; }
.ch-section-title { font-size: 28rpx; font-weight: 700; color: #334155; margin-bottom: 12rpx; display: block; }
.ch-session-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f1f5f9; }
.ch-session-left { display: flex; align-items: center; gap: 12rpx; }
.ch-session-port { font-size: 26rpx; font-weight: 600; color: #334155; }
.ch-session-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 12rpx; background: #f1f5f9; color: #64748b;
  &.active { background: #ecfdf5; color: #059669; }
}
.ch-session-fee { font-size: 28rpx; font-weight: 700; color: #f59e0b; }

.charging-footer { padding: 24rpx 32rpx; border-top: 1rpx solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
.charging-fee-row { display: flex; align-items: baseline; gap: 12rpx; }
.charging-fee-label { font-size: 28rpx; color: #64748b; }
.charging-fee-value { font-size: 48rpx; font-weight: 800; color: #f59e0b; }
.charging-close-btn { height: 72rpx; padding: 0 48rpx; border-radius: 36rpx; background: #f1f5f9; display: flex; align-items: center; justify-content: center; text { font-size: 30rpx; font-weight: 600; color: #64748b; } }

@keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:.4} }
</style>
