<template>
  <view class="skeleton-box">
    <view
      v-for="i in lines"
      :key="i"
      class="skeleton-line"
      :style="{
        width: getWidth(i),
        height: height + 'rpx',
        borderRadius: round ? '100rpx' : '8rpx',
      }"
    />
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  lines?: number
  height?: number
  round?: boolean
}>(), {
  lines: 3,
  height: 28,
  round: false,
})

function getWidth(index: number): string {
  const widths = ['100%', '80%', '60%']
  return widths[(index - 1) % widths.length]
}
</script>

<style lang="scss" scoped>
.skeleton-box {
  width: 100%;
  padding: 32rpx;
}

.skeleton-line {
  background: linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
  margin-bottom: 24rpx;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
