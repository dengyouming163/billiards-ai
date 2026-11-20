<template>
  <scroll-view class="zone-filter" scroll-x :show-scrollbar="false">
    <view class="filter-inner">
      <view
        v-for="item in items"
        :key="item.key"
        class="filter-chip"
        :class="{ active: selected === item.key }"
        @click="handleSelect(item.key)"
      >
        {{ item.label }}
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
defineProps<{
  items: { key: string; label: string }[]
  selected: string
}>()

const emit = defineEmits<{
  (e: 'select', key: string): void
}>()

function handleSelect(key: string) {
  emit('select', key)
}
</script>

<style lang="scss" scoped>
.zone-filter {
  padding: 0;
}

.filter-inner {
  display: flex;
  gap: 14rpx;
  padding: 0 2rpx;
  white-space: nowrap;
}

.filter-chip {
  padding: 16rpx 30rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #999999;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  transition: all 0.2s;

  &.active {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    border-color: #07C160;
  }
}
</style>
