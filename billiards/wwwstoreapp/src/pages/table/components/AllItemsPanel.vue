<template>
  <view class="panel">
    <view class="panel-head" @click="expanded = !expanded">
      <view class="head-left">
        <text class="head-title">消费明细</text>
        <text class="head-count" v-if="items.length">{{ items.length }}项</text>
      </view>
      <view class="head-chevron" :class="{ rotated: expanded }">
        <text>‹</text>
      </view>
    </view>

    <view class="panel-content" v-show="expanded">
      <!-- Fee Summary -->
      <view class="fee-summary">
        <view class="summary-row" v-if="tableFee > 0">
          <text class="summary-label">🎱 台费</text>
          <text class="summary-value">¥{{ tableFee.toFixed(2) }}</text>
        </view>
        <view class="summary-row" v-if="productFee > 0">
          <text class="summary-label">🛒 商品费</text>
          <text class="summary-value">¥{{ productFee.toFixed(2) }}</text>
        </view>
        <view class="summary-row" v-if="assistantFee > 0">
          <text class="summary-label">👤 助教费</text>
          <text class="summary-value">¥{{ assistantFee.toFixed(2) }}</text>
        </view>
        <view class="summary-row" v-if="mergeFee > 0">
          <text class="summary-label">🔀 并台转入</text>
          <text class="summary-value">¥{{ mergeFee.toFixed(2) }}</text>
        </view>
        <view class="summary-total">
          <text class="total-label">合计</text>
          <text class="total-value">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
      </view>

      <!-- Item List -->
      <view class="item-card" v-for="item in items" :key="item.id">
        <view class="item-left">
          <view class="item-icon" :class="'icon-' + item.item_type">
            <text>{{ typeIcon(item.item_type) }}</text>
          </view>
          <view class="item-info">
            <text class="item-name">{{ item.item_name }}</text>
            <text class="item-meta">
              <text v-if="item.quantity > 0">{{ item.quantity }} × ¥{{ $n(item.unit_price).toFixed(2) }}</text>
              <text v-else>¥{{ $n(item.unit_price).toFixed(2) }}/{{ item.unit || '小时' }}</text>
            </text>
          </view>
        </view>
        <view class="item-right">
          <text class="item-price">¥{{ $n(item.final_price || item.total_price).toFixed(2) }}</text>
          <view class="item-status" :class="'s-' + (item.status || '')">
            {{ statusText(item.status, item.delivered_at) }}
          </view>
        </view>
      </view>

      <view class="empty-hint" v-if="items.length === 0">
        <text>暂无消费明细</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { OrderItem } from '@/api/modules/table'

const props = defineProps<{
  items: OrderItem[]
  tableFee?: number
  productFee?: number
  assistantFee?: number
  mergeFee?: number
}>()

const expanded = ref(true)

function $n(v: any): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

const totalAmount = computed(() => {
  return (props.tableFee || 0) + (props.productFee || 0) + (props.assistantFee || 0) + (props.mergeFee || 0)
})

function typeIcon(type: string): string {
  const icons: Record<string, string> = {
    table: '🎱',
    product: '🛒',
    assistant: '👤',
    merge_fee: '🔀',
  }
  return icons[type] || '📋'
}

function statusText(status: string, deliveredAt?: string): string {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    delivered: '已送达',
    serving: '服务中',
    completed: '已完成',
    cancelled: '已取消',
  }
  if (status === 'delivered' && deliveredAt) return '已送达'
  return map[status] || status || '-'
}
</script>

<style lang="scss" scoped>
.panel {
  background: #ffffff;
  margin: 12rpx 24rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.06);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx;
}
.head-left { display: flex; align-items: center; gap: 16rpx; }
.head-title { font-size: 28rpx; font-weight: 700; color: #000000; }
.head-count { font-size: 22rpx; color: #07C160; background: rgba(7, 193, 96, 0.1); padding: 4rpx 16rpx; border-radius: 20rpx; font-weight: 600; }
.head-chevron { width: 44rpx; height: 44rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #999999; transform: rotate(-90deg); transition: transform .25s; }
.head-chevron.rotated { transform: rotate(90deg); }

.panel-content { padding: 0 28rpx 28rpx; }

/* Fee Summary */
.fee-summary {
  background: #f7f7f7;
  border-radius: 14rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
}
.summary-label { font-size: 26rpx; color: #999999; }
.summary-value { font-size: 26rpx; color: #333333; font-weight: 500; }
.summary-total {
  display: flex;
  justify-content: space-between;
  padding-top: 14rpx;
  margin-top: 10rpx;
  border-top: 2rpx dashed #e5e5e5;
}
.total-label { font-size: 28rpx; font-weight: 700; color: #000000; }
.total-value { font-size: 36rpx; font-weight: 700; color: #07C160; }

/* Item Cards */
.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #f7f7f7;
  border-radius: 14rpx;
  margin-bottom: 8rpx;
}
.item-left { display: flex; align-items: center; gap: 14rpx; flex: 1; min-width: 0; }
.item-icon {
  width: 52rpx; height: 52rpx;
  border-radius: 12rpx;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.icon-table { background: rgba(7, 193, 96, 0.1); }
.icon-product { background: rgba(7, 193, 96, 0.08); }
.icon-assistant { background: rgba(7, 193, 96, 0.1); }
.icon-merge_fee { background: #e5e5e5; }
.item-info { display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.item-name { font-size: 26rpx; font-weight: 600; color: #333333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-meta { font-size: 22rpx; color: #999999; }
.item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6rpx; flex-shrink: 0; }
.item-price { font-size: 28rpx; font-weight: 700; color: #333333; }
.item-status { font-size: 20rpx; padding: 2rpx 10rpx; border-radius: 12rpx; }
.s-pending { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.s-processing { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.s-delivered { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.s-serving { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.s-completed { background: #e5e5e5; color: #999999; }
.s-cancelled { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

.empty-hint { text-align: center; padding: 32rpx; color: #999999; font-size: 24rpx; }
</style>
