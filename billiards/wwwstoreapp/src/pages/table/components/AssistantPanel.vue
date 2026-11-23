<template>
  <view class="panel" v-if="can('mobile:table:assistant')">
    <view class="panel-head" @click="expanded = !expanded">
      <view class="head-left">
        <text class="head-title">助教服务</text>
        <text class="head-count" v-if="items.length">{{ items.length }}人</text>
      </view>
      <view class="head-chevron" :class="{ rotated: expanded }">
        <text>‹</text>
      </view>
    </view>

    <view class="panel-content" v-show="expanded">
      <template v-for="item in items" :key="item.id">
        <view class="item-card" v-if="item && item.status !== 'cancelled'">
        <view class="item-top">
          <view class="item-info">
            <text class="item-name">{{ item.assistant_name || item.name }}</text>
            <text class="item-meta" v-if="(item as any).billing_mode !== 'flat_rate'">¥{{ item.hourly_rate }}/小时</text>
            <text class="item-meta buyout" v-else>固定{{ item.quantity || 0 }}h · ¥{{ item.price }}</text>
            <text class="item-timer" v-if="item.status === 'serving' && item.started_at && (item as any).billing_mode !== 'flat_rate'">
              ⏱ {{ getServingDuration(item) }}
            </text>
          </view>
          <view class="item-cost">
            <text class="item-price">¥{{ item.price }}</text>
            <view class="status-pill" :class="statusClass(item.status)">
              <view class="pill-dot"></view>
              <text>{{ statusLabel(item.status) }}</text>
            </view>
          </view>
        </view>
        <view class="item-acts">
          <!-- 待确认 → 确认接单 -->
          <text
            v-if="item.status === 'pending'"
            class="act-btn confirm"
            @click.stop="$emit('confirm', item)"
          >确认接单</text>
          <!-- 已确认 → 开始服务 -->
          <text
            v-if="item.status === 'processing'"
            class="act-btn start"
            @click.stop="$emit('start', item)"
          >开始服务</text>
          <!-- 服务中 → 暂停/恢复 -->
          <text
            v-if="item.status === 'serving' && (item as any).billing_mode !== 'flat_rate'"
            class="act-btn pause"
            :class="{ resumed: (item as any).is_paused }"
            @click.stop="$emit('toggle-pause', item)"
          >{{ (item as any).is_paused ? '▶恢复' : '⏸暂停' }}</text>
          <!-- 服务中 → 结束 -->
          <text
            v-if="item.status === 'serving' && (item as any).billing_mode !== 'flat_rate'"
            class="act-btn end"
            @click.stop="$emit('end', item)"
          >结束服务</text>
          <!-- 活跃助教（非加钟记录）→ 加钟 -->
          <text
            v-if="item.status !== 'completed' && item.status !== 'cancelled' && (item as any).item_type !== 'assistant_overtime'"
            class="act-btn gift"
            @click.stop="$emit('gift', item)"
          >加钟</text>
          <!-- 未完成 → 取消（买断/固定时长不显示取消，后端不支持） -->
          <text
            v-if="item.status !== 'completed' && item.status !== 'cancelled' && (item as any).billing_mode !== 'flat_rate'"
            class="act-btn cancel"
            @click.stop="$emit('cancel', item)"
          >取消</text>
        </view>
      </view>
      </template>

      <view class="empty-state" v-if="!items || items.length === 0">
        <text class="empty-icon">👤</text>
        <text class="empty-title">暂无助教</text>
        <text class="empty-desc">点击下方为当前台桌添加助教服务</text>
      </view>

      <view
        class="add-btn"
        v-if="orderStatus === 'in_progress'"
        @click="$emit('add-assistant')"
      >
        <text class="add-plus">＋</text>
        <text>添加助教</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import type { OrderItem } from '@/api/modules/table'

const { canAccessModule: can } = usePermission()

defineProps<{
  items?: OrderItem[]
  orderStatus: string
}>()

defineEmits<{
  (e: 'add-assistant'): void
  (e: 'confirm', item: OrderItem): void
  (e: 'start', item: OrderItem): void
  (e: 'end', item: OrderItem): void
  (e: 'cancel', item: OrderItem): void
  (e: 'gift', item: OrderItem): void
  (e: 'toggle-pause', item: OrderItem): void
}>()

const expanded = ref(true)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) { clearInterval(timer); timer = null }
})

const statusMap: Record<string, string> = {
  pending: '待确认',
  processing: '可开始服务',
  serving: '服务中',
  delivered: '已下单',
  completed: '已完成',
  cancelled: '已取消',
}

function statusLabel(status: string): string {
  return statusMap[status] || status
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    processing: 'processing',
    serving: 'serving',
    delivered: 'completed',
    completed: 'completed',
    cancelled: 'cancelled',
  }
  return map[status] || ''
}

function serviceDuration(item: OrderItem): number {
  const startTime = item.started_at ? new Date(item.started_at).getTime() : null
  if (!startTime) return 0
  const endTime = item.ended_at ? new Date(item.ended_at).getTime() : now.value
  return Math.max(0, Math.floor((endTime - startTime) / 60000))
}

function runningFee(item: OrderItem): string {
  const minutes = serviceDuration(item)
  if (!minutes || !item.unit_price) return '0.00'
  const rule = (item as any).billing_rule || 'half_hour'
  if (rule === 'minute') {
    return ((minutes / 60) * Number(item.unit_price)).toFixed(2)
  }
  const units = Math.ceil(minutes / 30)
  const hours = units * 0.5
  return (hours * Number(item.unit_price)).toFixed(2)
}

function getServingDuration(item: OrderItem): string {
  if (!item.started_at) return '00:00:00'
  let diff = Math.floor((now.value - new Date(item.started_at).getTime()) / 1000)
  if (diff < 0) return '00:00:00'
  // 扣除助教暂停时长
  if ((item as any).is_paused) return '暂停中'
  const pausedSec = Number((item as any).total_paused_seconds || 0)
  diff = Math.max(0, diff - pausedSec)
  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.panel {
  background: #fff;
  margin: 0 24rpx 18rpx;
  border-radius: 34rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.05);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 30rpx;
  user-select: none;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.head-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.head-count {
  font-size: 22rpx;
  color: #059669;
  background: #ecfdf5;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-weight: 600;
}

.head-chevron {
  width: 44rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #9ca3af;
  transition: transform 0.25s ease;
  transform: rotate(-90deg);

  &.rotated {
    transform: rotate(90deg);
  }
}

.panel-content {
  padding: 0 30rpx 30rpx;
}

.item-card {
  background: linear-gradient(180deg, #fafcff 0%, #f8fafc 100%);
  border-radius: 24rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 14rpx;

  &:last-of-type {
    margin-bottom: 0;
  }
}

.item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 24rpx;
  color: #9ca3af;
}

.item-duration {
  font-size: 22rpx;
  color: #6b7280;
  margin-top: 2rpx;
}

.item-timer {
  font-size: 24rpx;
  color: #059669;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin-top: 4rpx;
}

.item-cost {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.item-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #dc2626;
  font-variant-numeric: tabular-nums;
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 500;

  &.pending {
    background: #fffbeb;
    color: #d97706;

    .pill-dot { background: #f59e0b; }
  }

  &.processing {
    background: #eff6ff;
    color: #2563eb;

    .pill-dot { background: #3b82f6; }
  }

  &.serving {
    background: #ecfdf5;
    color: #059669;

    .pill-dot { background: #22c55e; }
  }

  &.completed {
    background: #f3f4f6;
    color: #6b7280;

    .pill-dot { background: #9ca3af; }
  }

  &.cancelled {
    background: #fef2f2;
    color: #dc2626;

    .pill-dot { background: #ef4444; }
  }
}

.pill-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-acts {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e5e7eb;
}

.act-btn {
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  font-weight: 500;
  transition: all 0.15s ease;

  &.confirm {
    background: #eff6ff;
    color: #2563eb;
    border: 1rpx solid #bfdbfe;
  }

  &.start {
    background: #ecfdf5;
    color: #059669;
    border: 1rpx solid #a7f3d0;
  }

  &.end {
    background: #fffbeb;
    color: #d97706;
    border: 1rpx solid #fde68a;
  }

  &.gift {
    background: #fffbeb;
    color: #d97706;
    border: 1rpx solid #fde68a;
  }
  &.cancel {
    background: #fef2f2;
    color: #dc2626;
    border: 1rpx solid #fecaca;
  }
n	  &.pause {
	    background: #fffbeb;
	    color: #d97706;
	    border: 1rpx solid #fde68a;

	    &.resumed {
	      background: #ecfdf5;
	      color: #059669;
	      border: 1rpx solid #a7f3d0;
	    }
	  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 24rpx 40rpx;
}

.empty-icon {
  font-size: 48rpx;
  margin-bottom: 16rpx;
}

.empty-title {
  font-size: 26rpx;
  color: #9ca3af;
  font-weight: 500;
  margin-bottom: 6rpx;
}

.empty-desc {
  font-size: 22rpx;
  color: #d1d5db;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  border: 2rpx dashed #d1d5db;
  border-radius: 22rpx;
  color: #6b7280;
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.15s ease;

  &:active {
    border-color: #059669;
    color: #059669;
    background: #f0fdf4;
  }
}

.add-plus {
  font-size: 28rpx;
  font-weight: 400;
  color: #9ca3af;
  line-height: 1;
}
</style>
