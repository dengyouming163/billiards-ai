<template>
  <view class="panel">
    <view class="panel-header" @click="expanded = !expanded">
      <text class="panel-title">台费明细</text>
      <text class="arrow">{{ expanded ? '▲' : '▼' }}</text>
    </view>
    <view class="panel-body" v-if="expanded">
      <view class="row">
        <text class="label">开台时间</text>
        <text class="value">{{ bill?.order?.start_time || '-' }}</text>
      </view>
      <view class="row">
        <text class="label">顾客人数</text>
        <text class="value">{{ bill?.order?.player_count || '-' }}人</text>
      </view>
      <view class="row">
        <text class="label">已用时长</text>
        <text class="value">{{ elapsedText }}</text>
      </view>
      <view class="bill-row" v-if="bill?.time_factor && bill.time_factor !== 1.0">
        <text class="bill-label">时段系数</text>
        <text class="bill-value" :class="bill.time_factor > 1 ? 'text-amber' : 'text-blue'">×{{ bill.time_factor }}</text>
      </view>
      <view class="row total">
        <text class="label">台费</text>
        <text class="value price">¥{{ bill?.billing?.table_fee || bill?.table_fee || '0.00' }}</text>
      </view>
      <view class="bill-row" v-if="(bill?.billing?.merge_fee || bill?.merge_fee || 0) > 0">
        <text class="bill-label">并台转入台费</text>
        <text class="bill-value text-amber">+¥{{ bill?.billing?.merge_fee || bill?.merge_fee || 0 }}</text>
      </view>
      <view class="bill-row" v-if="(bill?.billing?.member_discount || bill?.member_discount || 0) > 0">
        <text class="bill-label">会员折扣</text>
        <text class="bill-value text-rose">-¥{{ bill?.billing?.member_discount || bill?.member_discount || 0 }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Bill } from '@/api/modules/table'

const props = defineProps<{
  bill: Bill | null
}>()

const expanded = ref(true)

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const elapsedText = computed(() => {
  const startTime = props.bill?.order?.start_time
  if (!startTime) return '-'
  const diff = Math.max(0, Math.floor((now.value - new Date(startTime).getTime()) / 1000))
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  return hours + '小时' + minutes + '分'
})

onMounted(() => {
  if (props.bill?.order?.start_time) {
    timer = setInterval(() => {
      now.value = Date.now()
    }, 60000)
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="scss" scoped>
.panel {
  background: #fff;
  margin: 12rpx 24rpx;
  border-radius: 14rpx;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  padding: 24rpx;
}

.panel-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2937;
}

.arrow {
  font-size: 20rpx;
  color: #9ca3af;
}

.panel-body {
  padding: 0 24rpx 24rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.label {
  font-size: 26rpx;
  color: #6b7280;
}

.value {
  font-size: 26rpx;
  color: #374151;
  font-weight: 500;
  font-variant-numeric: tabular-nums;

  &.price {
    color: #ef4444;
    font-weight: 700;
    font-size: 28rpx;
  }
}

.total {
  border-top: 1rpx dashed #e5e7eb;
  padding-top: 16rpx;
  margin-top: 8rpx;
}

.bill-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
  font-size: 26rpx;
}

.bill-label {
  color: #9ca3af;
}

.bill-value {
  color: #374151;
  font-weight: 500;
}

.text-amber {
  color: #d97706;
}

.text-blue {
  color: #2563eb;
}

.text-rose {
  color: #e11d48;
}
</style>
