<template>
  <view class="quick-actions">
    <view class="qa-card qa-card--amber" @click="$emit('openTableRequests')">
      <view class="qa-icon">🛎</view>
      <view class="qa-label">开台申请</view>
      <view v-if="openRequestCount > 0" class="qa-badge">{{ openRequestCount > 99 ? '99+' : openRequestCount }}</view>
    </view>
    <view class="qa-card qa-card--orange" @click="$emit('orderReminder')">
      <view class="qa-icon">📦</view>
      <view class="qa-label">点单提醒</view>
      <view v-if="deliveryCount > 0" class="qa-badge">{{ deliveryCount > 99 ? '99+' : deliveryCount }}</view>
    </view>
    <view class="qa-card qa-card--rose" @click="$emit('assistantReminder')">
      <view class="qa-icon">👤</view>
      <view class="qa-label">上桌提醒</view>
      <view v-if="bookingCount > 0" class="qa-badge">{{ bookingCount > 99 ? '99+' : bookingCount }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingConfirmRequests, getPendingDeliveriesV2, getPendingAssistantBookingsV2 } from '@/api/modules/table'

const emit = defineEmits(['openTableRequests', 'orderReminder', 'assistantReminder'])

const openRequestCount = ref(0)
const deliveryCount = ref(0)
const bookingCount = ref(0)

let openRequestTimer: ReturnType<typeof setInterval> | null = null
let deliveryTimer: ReturnType<typeof setInterval> | null = null
let bookingTimer: ReturnType<typeof setInterval> | null = null

// 统一 10 秒轮询，不显示加载动画
async function pollOpenRequests() {
  try {
    const result = await getPendingConfirmRequests({ showLoading: false })
    openRequestCount.value = (result || []).length
  } catch { /* silent */ }
}

async function pollDeliveries() {
  try {
    const result = await getPendingDeliveriesV2({ showLoading: false })
    deliveryCount.value = (result || []).reduce((sum, g) => sum + (g.items?.length || 0), 0)
  } catch { /* silent */ }
}

async function pollBookings() {
  try {
    const result = await getPendingAssistantBookingsV2({ showLoading: false })
    bookingCount.value = (result || []).length
  } catch { /* silent */ }
}

onMounted(() => {
  pollOpenRequests()
  pollDeliveries()
  pollBookings()
  openRequestTimer = setInterval(pollOpenRequests, 10000)
  deliveryTimer = setInterval(pollDeliveries, 10000)
  bookingTimer = setInterval(pollBookings, 10000)
})

onUnmounted(() => {
  if (openRequestTimer) clearInterval(openRequestTimer)
  if (deliveryTimer) clearInterval(deliveryTimer)
  if (bookingTimer) clearInterval(bookingTimer)
})
</script>

<style lang="scss" scoped>
.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
  padding: 0 0 2rpx;
}

.qa-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 26rpx 12rpx;
  border-radius: 28rpx;
  gap: 10rpx;
  box-shadow: 0 12rpx 28rpx rgba(15,23,42,.05);
  transition: all 0.15s;

  &:active { transform: scale(0.95); }
}

.qa-card--amber { background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1rpx solid #fcd34d; }
.qa-card--orange { background: linear-gradient(135deg, #fff7ed, #fed7aa); border: 1rpx solid #fb923c; }
.qa-card--rose { background: linear-gradient(135deg, #fff1f2, #fecdd3); border: 1rpx solid #fb7185; }
.qa-card--teal { background: linear-gradient(135deg, #f0fdfa, #99f6e4); border: 1rpx solid #2dd4bf; }

.qa-icon { font-size: 40rpx; }
.qa-label { font-size: 24rpx; font-weight: 700; color: #334155; }

.qa-badge {
  position: absolute;
  top: -8rpx;
  right: -4rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  background: #ef4444;
  color: #fff;
  font-size: 20rpx;
  font-weight: 700;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
