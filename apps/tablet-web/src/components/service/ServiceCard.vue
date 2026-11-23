<template>
  <view 
    class="service-card"
    :class="[`card-${service.code}`, { active: isActive }]"
    @click="handleClick"
  >
    <view 
      class="card-icon" 
      :style="{ background: `linear-gradient(135deg, ${service.color}, ${adjustColor(service.color, -20)})` }"
    >
      <text class="icon-text">{{ service.icon }}</text>
    </view>
    <text class="card-name">{{ service.name }}</text>
  </view>
</template>

<script setup lang="ts">
import type { ServiceItem } from '@/types'

interface Props {
  service: ServiceItem
  isActive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false
})

const emit = defineEmits<{
  click: [service: ServiceItem]
}>()

function handleClick() {
  uni.vibrateShort({ type: 'light' } as any)
  emit('click', props.service)
}

function adjustColor(color: string, amount: number): string {
  if (!color || !color.startsWith('#')) return color
  const hex = color.replace('#', '')
  const r = Math.max(0, parseInt(hex.substring(0, 2), 16) + amount)
  const g = Math.max(0, parseInt(hex.substring(2, 4), 16) + amount)
  const b = Math.max(0, parseInt(hex.substring(4, 6), 16) + amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.service-card {
  width: 200rpx;
  height: 200rpx;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(201, 169, 98, 0.15);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
    border-color: rgba(201, 169, 98, 0.3);
    box-shadow: 0 0 40rpx rgba(201, 169, 98, 0.2);
  }
  
  &.active {
    border-color: rgba(201, 169, 98, 0.4);
    box-shadow: 0 0 30rpx rgba(201, 169, 98, 0.25);
  }
  
  .card-icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16rpx;
    
    .icon-text {
      font-size: 40rpx;
    }
  }
  
  .card-name {
    font-size: 28rpx;
    color: #fff;
    font-weight: 600;
  }
}
</style>
