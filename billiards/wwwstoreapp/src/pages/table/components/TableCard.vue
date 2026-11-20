<template>
  <view
    class="table-card"
    :class="'status-' + table.status"
    @click="handleClick" @longpress="handleLongPress"
  >
    <view class="card-accent" />

    <view class="card-header">
      <text class="table-number">{{ table.number || table.name }}</text>
    </view>

    <view class="card-body">
      <template v-if="table.status === 'occupied' && table.current_order">
        <view class="info-row">
          <text class="info-value">{{ displayTime }}</text>
        </view>
        <view class="info-row">
          <text class="info-value">{{ table.current_order.player_count || 0 }}人</text>
        </view>
        <view v-if="assistantNames" class="info-row">
          <text class="info-value assistant-name-ellipsis">{{ assistantNames }}</text>
        </view>
        <view v-if="orderCount > 0" class="info-row">
          <text class="info-value order-highlight">{{ orderCount }}件</text>
        </view>
        <view class="fee-display">
          <text class="fee-amount">¥{{ displayTotal }}</text>
          <text class="fee-label">当前消费</text>
        </view>
      </template>

      <template v-else>
        <view class="info-row">
          <text class="info-value muted">¥{{ table.hourly_rate || 0 }}/时</text>
        </view>
        <view class="info-row">
          <text class="info-value muted">{{ table.table_type_name || '标准台' }}</text>
        </view>
      </template>

      <!-- 状态标识放最后一行 -->
      <view class="status-row">
        <view class="status-dot" :class="{ pulse: table.status === 'occupied' }" />
        <text class="status-text">{{ statusLabel }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Table } from '@/api/modules/table'

const props = defineProps<{
  table: Table
}>()

const emit = defineEmits<{
  (e: 'click', table: Table): void
  (e: 'longpress', table: Table): void
}>()

const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const statusLabelMap: Record<string, string> = {
  idle: '空闲',
  occupied: '使用中',
  reserved: '已预约',
  maintenance: '维护中',
}

const statusLabel = computed(() => statusLabelMap[props.table.status] || '未知')

const assistantNames = computed(() => {
  const assistants = props.table.current_order?.assistants
  if (!assistants || !assistants.length) return ''
  return assistants.map((a: any) => a.assistant_name || a.name || '').filter(Boolean).join('、')
})

const orderCount = computed(() => {
  const products = props.table.current_order?.products
  if (!products || !products.length) return 0
  return products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)
})

const orderProductTotal = computed(() => {
  const products = props.table.current_order?.products
  if (!products || !products.length) return 0
  return products.reduce((sum: number, p) => sum + ((p as any).price || 0) * ((p as any).quantity || 1), 0)
})

function computeElapsed(): number {
  if (!props.table.current_order?.start_time) return 0
  const startTime = new Date(props.table.current_order.start_time).getTime()
  const now = Date.now()
  const diff = Math.floor((now - startTime) / 1000)
  return diff > 0 ? diff : 0
}

function padZero(n: number): string {
  return n < 10 ? '0' + n : String(n)
}

const displayTime = computed(() => {
  const total = elapsedSeconds.value
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return padZero(h) + ':' + padZero(m) + ':' + padZero(s)
})

const displayFee = computed(() => {
  // 优先使用后端返回的实际计费金额
  const orderAmount = props.table.current_order?.total_amount
  if (orderAmount != null && orderAmount > 0) {
    return orderAmount.toFixed(2)
  }
  // 后端未返回时，用费率 × 时长做近似估算
  const rate = props.table.current_order?.hourly_rate || props.table.hourly_rate || 0
  const hours = elapsedSeconds.value / 3600
  return (rate * hours).toFixed(2)
})

const displayTotal = computed(() => {
  // 直接用后端金额（已包含所有费用）
  const orderAmount = props.table.current_order?.total_amount
  if (orderAmount != null && orderAmount > 0) {
    return orderAmount.toFixed(2)
  }
  // fallback: 本地估算
  const fee = parseFloat(displayFee.value) || 0
  const products = orderProductTotal.value
  return (fee + products).toFixed(2)
})

function handleClick() {
  if (props.table.status === 'maintenance') return
  emit('click', props.table)
}

function handleLongPress() {
  if (props.table.status === 'idle') {
    emit('longpress', props.table)
  }
}

onMounted(() => {
  if (props.table.status === 'occupied' && props.table.current_order) {
    elapsedSeconds.value = computeElapsed()
    timer = setInterval(() => {
      elapsedSeconds.value = computeElapsed()
    }, 1000)
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
.table-card {
  position: relative;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s ease;
  background: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);

  &:active {
    transform: scale(0.96);
  }
}

.card-accent {
  height: 6rpx;
  flex-shrink: 0;
}

.card-header {
  padding: 20rpx 18rpx 6rpx;
}

.table-number {
  font-size: 30rpx;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-top: 8rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid #f0f0f0;
}

.status-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &.pulse {
    animation: dot-pulse 1.5s ease-in-out infinite;
  }
}

.status-text {
  font-size: 20rpx;
  font-weight: 600;
}

.card-body {
  padding: 2rpx 18rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
}

.info-value {
  font-size: 22rpx;
  font-weight: 500;
  color: #333333;

  &.muted {
    color: #999999;
  }

  &.order-highlight {
    color: #FF976A;
  }
}

.assistant-name-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #07C160;
}

.fee-display {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  padding-top: 10rpx;
  margin-top: 6rpx;
  border-top: 1rpx solid #f0f0f0;
}

.fee-amount {
  font-size: 30rpx;
  font-weight: 700;
  color: #FF976A;
}

.fee-label {
  font-size: 18rpx;
  color: #999999;
}

.status-idle {
  border: 1rpx solid #e5e5e5;

  .card-accent {
    background: #007AFF;
  }

  .table-number {
    color: #000000;
  }

  .status-dot {
    background: #007AFF;
  }

  .status-text {
    color: #007AFF;
  }
}

.status-occupied {
  border: 1rpx solid rgba(7, 193, 96, 0.3);

  .card-accent {
    background: #07C160;
  }

  .table-number {
    color: #000000;
  }

  .status-dot {
    background: #07C160;
  }

  .status-text {
    color: #07C160;
  }
}

.status-reserved {
  border: 1rpx solid rgba(255, 151, 106, 0.3);

  .card-accent {
    background: #FF976A;
  }

  .table-number {
    color: #000000;
  }

  .status-dot {
    background: #FF976A;
  }

  .status-text {
    color: #FF976A;
  }
}

.status-maintenance {
  opacity: 0.6;
  border: 1rpx solid #e5e5e5;

  .card-accent {
    background: #cccccc;
  }

  .table-number {
    color: #999999;
  }

  .status-dot {
    background: #cccccc;
  }

  .status-text {
    color: #999999;
  }
}

@keyframes dot-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
}
</style>
