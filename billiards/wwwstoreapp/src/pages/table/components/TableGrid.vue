<template>
  <view class="table-grid">
    <view v-for="group in groups" :key="group.key" class="table-group">
      <view class="group-header">
        <text class="group-title">{{ group.label }}</text>
        <text class="group-count">{{ group.tables.length }}桌</text>
      </view>
      <view class="group-tables">
        <TableCard v-for="t in group.tables" :key="t.id" :table="t" @click="$emit('table-click', t)" @longpress="$emit('table-longpress', t)" />
      </view>
    </view>
    <view v-if="!groups.length" class="empty">
      <text class="empty-icon">🎱</text>
      <text class="empty-text">暂无台桌</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { Table } from '@/api/modules/table'
import TableCard from './TableCard.vue'

defineProps<{
  groups: { key: string; label: string; tables: Table[] }[]
}>()

defineEmits<{
  (e: 'table-click', table: Table): void
  (e: 'table-longpress', table: Table): void
}>()
</script>

<style lang="scss" scoped>
.table-grid {
  padding: 2rpx 0 0;
}

.table-group {
  margin-bottom: 28rpx;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  padding: 0 6rpx;
}

.group-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
  letter-spacing: 0.5px;
}

.group-count {
  font-size: 22rpx;
  color: #999999;
}

.group-tables {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16rpx;
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  color: #999999;
}

.empty-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 26rpx;
}
</style>
