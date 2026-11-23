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
  color: #64748b;
  background: #f3f6f5;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff;
    box-shadow: 0 10rpx 24rpx rgba(5,150,105,.22);
  }
}
</style>
