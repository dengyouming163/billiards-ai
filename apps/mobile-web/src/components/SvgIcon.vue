<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size || 24"
    :height="size || 24"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color || '#333333'"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="svg-icon"
    :class="$attrs.class"
    :style="$attrs.style"
  >
    <template v-for="(el, i) in iconElements" :key="i">
      <path v-if="el.tag === 'path'" :d="el.attrs.d" />
      <polyline v-else-if="el.tag === 'polyline'" :points="el.attrs.points" />
      <line v-else-if="el.tag === 'line'" :x1="el.attrs.x1" :y1="el.attrs.y1" :x2="el.attrs.x2" :y2="el.attrs.y2" />
      <rect v-else-if="el.tag === 'rect'" :x="el.attrs.x" :y="el.attrs.y" :width="el.attrs.width" :height="el.attrs.height" :rx="el.attrs.rx" :ry="el.attrs.ry" />
      <circle v-else-if="el.tag === 'circle'" :cx="el.attrs.cx" :cy="el.attrs.cy" :r="el.attrs.r" />
      <polygon v-else-if="el.tag === 'polygon'" :points="el.attrs.points" />
    </template>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '@/static/icons'

interface IconElement {
  tag: string
  attrs: Record<string, string>
}

const props = defineProps<{
  name: string
  size?: number
  color?: string
}>()

const iconElements = computed((): IconElement[] => {
  const pathStr = icons[props.name]
  if (!pathStr) return []
  
  const elements: IconElement[] = []
  const regex = /<(\w+)\s+([^>]+)\/?>/g
  let match
  
  while ((match = regex.exec(pathStr)) !== null) {
    const tag = match[1]
    const attrStr = match[2]
    const attrs: Record<string, string> = {}
    
    const attrRegex = /(\w+)\s*=\s*["']([^"']+)["']/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
      attrs[attrMatch[1]] = attrMatch[2]
    }
    
    elements.push({ tag, attrs })
  }
  
  return elements
})
</script>
