<template>
  <view class="panel" v-if="can('mobile:table:order')">
    <view class="panel-head" @click="expanded = !expanded">
      <view class="head-left">
        <text class="head-title">商品点单</text>
        <text class="head-count" v-if="items.length">{{ items.length }}件</text>
      </view>
      <view class="head-chevron" :class="{ rotated: expanded }">
        <text>‹</text>
      </view>
    </view>

    <view class="panel-content" v-show="expanded">
      <view class="item-card" v-for="item in items" :key="item.id">
        <view class="item-top">
          <view class="item-info">
            <text class="item-name">{{ item.name }}</text>
            <text class="item-meta">×{{ item.quantity }}</text>
          </view>
          <view class="item-cost">
            <text class="item-price">¥{{ item.price }}</text>
            <view class="status-pill" :class="statusClass(item.status)">
              <view class="pill-dot"></view>
              <text>{{ statusLabel(item.status) }}</text>
            </view>
          </view>
        </view>
        <view class="item-acts" v-if="orderStatus === 'in_progress'">
          <template v-if="item.status === 'pending'">
            <text class="act-btn confirm" @click.stop="$emit('confirm', item)">确认接单</text>
            <text class="act-btn cancel" @click.stop="$emit('remove', item)">取消</text>
          </template>
          <template v-else-if="item.status === 'processing'">
            <text class="act-btn deliver" @click.stop="$emit('deliver', item)">送达</text>
          </template>
          <text v-else-if="item.status === 'delivered'" class="act-done">✓</text>
          <template v-else>
            <text class="act-btn remove" @click.stop="$emit('remove', item)">移除</text>
          </template>
        </view>
      </view>

      <view class="empty-state" v-if="items.length === 0">
        <text class="empty-icon">🛒</text>
        <text class="empty-title">暂无商品</text>
        <text class="empty-desc">点击下方为当前台桌添加商品</text>
      </view>

      <view
        class="add-btn"
        v-if="orderStatus === 'in_progress'"
        @click="$emit('add-product')"
      >
        <text class="add-plus">＋</text>
        <text>添加商品</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePermission } from '@/composables/usePermission'
import type { OrderItem } from '@/api/modules/table'

const { canAccessModule: can } = usePermission()

defineProps<{
  items: OrderItem[]
  orderStatus: string
}>()

defineEmits<{
  (e: 'add-product'): void
  (e: 'confirm', item: OrderItem): void
  (e: 'deliver', item: OrderItem): void
  (e: 'remove', item: OrderItem): void
}>()

const expanded = ref(true)

const statusMap: Record<string, string> = {
  preorder_pending: '预订单待确认',
  pending: '待接单',
  processing: '处理中',
  delivered: '已送达',
  cancelled: '已取消',
}

function statusLabel(status: string): string {
  return statusMap[status] || status || '未知'
}

function statusClass(status: string): string {
  const map: Record<string, string> = {
    preorder_pending: 'preorder',
    pending: 'pending',
    processing: 'processing',
    delivered: 'done',
    cancelled: 'cancelled',
  }
  return map[status] || ''
}
</script>

<style lang="scss" scoped>
.panel {
  background: #ffffff;
  margin: 0 24rpx 18rpx;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,.06);
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  user-select: none;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.head-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.head-count {
  font-size: 22rpx;
  color: #07C160;
  background: rgba(7, 193, 96, 0.1);
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
  color: #999999;
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
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;

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
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 24rpx;
  color: #999999;
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
  font-size: 30rpx;
  font-weight: 700;
  color: #07C160;
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

  &.done {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    .pill-dot { background: #07C160; }
  }

  &.preorder {
    background: rgba(7, 193, 96, 0.08);
    color: #07C160;
    .pill-dot { background: #07C160; }
  }

  &.pending {
    background: rgba(7, 193, 96, 0.08);
    color: #07C160;
    .pill-dot { background: #07C160; }
  }

  &.processing {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    .pill-dot { background: #07C160; }
  }

  &.cancelled {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
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
  border-top: 1rpx solid #e5e5e5;
}

.act-btn {
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  font-weight: 500;
  transition: all 0.15s ease;

  &.confirm {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    border: 1rpx solid rgba(7, 193, 96, 0.3);
  }

  &.deliver {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    border: 1rpx solid rgba(7, 193, 96, 0.3);
  }

  &.cancel {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1rpx solid rgba(239, 68, 68, 0.3);
  }

  &.remove {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 1rpx solid rgba(239, 68, 68, 0.3);
  }
}

.act-done {
  font-size: 36rpx;
  color: #07C160;
  font-weight: 700;
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
  color: #999999;
  font-weight: 500;
  margin-bottom: 6rpx;
}

.empty-desc {
  font-size: 22rpx;
  color: #999999;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  border: 2rpx dashed #e5e5e5;
  border-radius: 12rpx;
  color: #999999;
  font-size: 26rpx;
  font-weight: 600;
  transition: all 0.15s ease;

  &:active {
    border-color: #07C160;
    color: #07C160;
    background: rgba(7, 193, 96, 0.05);
  }
}

.add-plus {
  font-size: 28rpx;
  font-weight: 400;
  color: #999999;
  line-height: 1;
}
</style>
