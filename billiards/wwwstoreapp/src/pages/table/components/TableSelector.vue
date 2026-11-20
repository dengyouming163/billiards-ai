<template>
  <view class="overlay" v-if="visible" @click.self="close">
    <view class="selector-popup">
      <view class="popup-header">
        <text class="popup-title">{{ title }}</text>
        <view class="popup-close" @click="close" v-html="Icons.x" />
      </view>
      <scroll-view scroll-y class="table-list">
        <view v-for="t in tables" :key="t.id" class="table-item" @click="select(t)">
          <view class="table-left">
            <text class="table-no">{{ t.number || t.name }}</text>
            <text class="table-zone">{{ t.zone_name || '' }} {{ t.table_type_name || '' }}</text>
          </view>
          <text class="table-status-badge" :class="t.status">{{ statusLabel(t.status) }}</text>
        </view>
        <view class="empty" v-if="!tables.length">
          <text>暂无可选台桌</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Table } from '@/api/modules/table'
import { Icons } from '@/utils/icons'

const emit = defineEmits<{
  (e: 'select', table: Table): void
}>()

const visible = ref(false)
const tables = ref<Table[]>([])
const title = ref('选择台桌')

const statusMap: Record<string, string> = {
  idle: '空闲',
  occupied: '使用中',
  reserved: '已预约',
}

function statusLabel(status: string): string {
  return statusMap[status] || status
}

function open(list: Table[], label: string) {
  tables.value = list
  title.value = label
  visible.value = true
}

function close() {
  visible.value = false
}

function select(t: Table) {
  emit('select', t)
  close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .4);
  z-index: 300;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.selector-popup {
  background: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  border-top: 1rpx solid #e5e5e5;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.popup-close {
  width: 32rpx;
  height: 32rpx;
  color: #999999;
  padding: 8rpx;
}

.table-list {
  flex: 1;
  overflow: hidden;
}

.table-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.table-no {
  font-size: 28rpx;
  font-weight: 500;
  color: #333333;
}

.table-zone {
  font-size: 22rpx;
  color: #999999;
}

.table-status-badge {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;

  &.idle {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
  }

  &.occupied {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }

  &.reserved {
    background: rgba(7, 193, 96, 0.08);
    color: #07C160;
  }
}

.empty {
  padding: 40rpx;
  text-align: center;
  color: #999999;
}
</style>
