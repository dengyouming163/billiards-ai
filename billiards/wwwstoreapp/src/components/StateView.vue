<template>
  <view class="state-view">
    <view v-if="loading" class="state-loading">
      <slot name="loading">
        <SkeletonBox :lines="4" />
      </slot>
    </view>
    <view v-else-if="error" class="state-error">
      <slot name="error">
        <EmptyState type="error" :message="errorMsg || '加载失败'" @retry="$emit('retry')" />
      </slot>
    </view>
    <view v-else-if="empty" class="state-empty">
      <slot name="empty">
        <EmptyState :type="emptyType" :message="emptyMsg || '暂无数据'" />
      </slot>
    </view>
    <view v-else class="state-content">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import SkeletonBox from './SkeletonBox.vue'
import EmptyState from './EmptyState.vue'

defineProps<{
  loading?: boolean
  empty?: boolean
  error?: boolean
  errorMsg?: string
  emptyType?: string
  emptyMsg?: string
}>()

defineEmits<{
  retry: []
}>()
</script>

<style lang="scss" scoped>
.state-view {
  min-height: 200rpx;
  background: #f7f7f7;
}
.state-loading,
.state-error,
.state-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400rpx;
  background: #f7f7f7;
}

.state-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
</style>
