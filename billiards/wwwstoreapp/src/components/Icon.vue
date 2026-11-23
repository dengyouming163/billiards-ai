<template>
  <text :style="{ fontSize: size + 'rpx', opacity: opacity, lineHeight: (size + 4) + 'rpx' }">{{ displayIcon }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  opacity?: number
}>(), {
  size: 40,
  opacity: 1,
})

const iconMap: Record<string, string> = {
  home: '🏠',
  dashboard: '📊',
  table: '🎱',
  orders: '📋',
  employee: '👥',
  approval: '✅',
  checkin: '📍',
  schedule: '📅',
  performance: '📈',
  notification: '🔔',
  profile: '👤',
  settings: '⚙️',
  work: '💼',
  logout: '🚪',
  add: '➕',
  search: '🔍',
  close: '✕',
  back: '⬅',
  edit: '✏️',
  delete: '🗑',
  phone: '📱',
  location: '📍',
  clock: '⏱',
  member: '👑',
  product: '🛒',
  assistant: '💁',
  money: '💰',
  chart: '📊',
  camera: '📷',
  album: '🖼',
  star: '⭐',
  check: '✓',
  time: '⏱',
  user: '👤',
  lock: '🔒',
  eye: '👁',
  arrow_right: '→',
  refresh: '🔄',
  filter: '🔽',
  report: '📋',
  device: '📟',
  apply: '📝',
  recharge: '💳',
  finance: '💵',
  sales: '🛍',
}

const displayIcon = computed(() => iconMap[props.name] || '●')
</script>
