<template>
  <text :style="{ fontSize: size + 'rpx', opacity: opacity, lineHeight: (size + 4) + 'rpx', color: color || 'inherit' }">{{ displayIcon }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  opacity?: number
  color?: string
}>(), {
  size: 40,
  opacity: 1,
})

const displayIcon = computed(() => {
  const emojiMap: Record<string, string> = {
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
    // TabBar icons
    briefcase: '💼',
    mapPin: '📍',
    barChart: '📊',
    // Profile / Orders additional icons
    help: '❓',
    message: '💬',
    chevronRight: '›',
    chevronDown: '⌄',
    shoppingCart: '🛒',
    clipboardList: '📋',
    tag: '🏷',
    calendar: '📅',
    // Settings icons
    bell: '🔔',
    info: 'ℹ',
    fileText: '📄',
    shield: '🛡',
    // Fallback for SvgIcon direct usage
    logOut: '🚪',
    x: '✕',
  }
  return emojiMap[props.name] || '●'
})
</script>
