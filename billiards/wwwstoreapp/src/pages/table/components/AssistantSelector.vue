<template>
  <view class="as-overlay" v-if="visible" @click.self="close">
    <view class="as-panel">
      <!-- 顶部拖拽条 -->
      <view class="as-drag-bar"><view class="as-drag-indicator" /></view>

      <!-- Header -->
      <view class="as-header">
        <view class="as-header-left">
          <text class="as-header-icon">💆</text>
          <text class="as-title">{{ selectedAssistant ? '服务配置' : '选择助教' }}</text>
        </view>
        <view class="as-close" @click="close" v-html="Icons.x" />
      </view>

      <!-- ==================== 阶段1：助教列表 ==================== -->
      <template v-if="!selectedAssistant">
        <!-- 搜索框 -->
        <view class="as-search">
          <text class="as-search-icon">🔍</text>
          <input v-model="searchQuery" placeholder="搜索助教姓名或编号..." class="as-search-input" />
          <text v-if="searchQuery" class="as-search-clear" @click="searchQuery = ''">✕</text>
        </view>

        <!-- 列表 -->
        <scroll-view scroll-y class="as-list">
          <view v-for="a in filteredList" :key="a.id" class="as-item" :class="{ 'as-item--busy': a.is_busy }" @click="select(a)">
            <view class="as-item-avatar">
              <text class="as-item-avatar-text">{{ (a.name || '?')[0] }}</text>
            </view>
            <view class="as-item-body">
              <text class="as-item-name">{{ a.name }}</text>
              <text class="as-item-meta">{{ a.level_name || '助教' }}{{ a.phone ? ' · ' + a.phone : '' }}</text>
            </view>
            <view class="as-item-end">
              <text class="as-item-rate" v-if="a.hourly_rate">¥{{ a.hourly_rate }}/时</text>
              <view class="as-item-status" :class="a.is_busy ? 'busy' : 'free'">
                <view class="as-item-status-dot" />
                <text>{{ a.is_busy ? '忙碌' : '空闲' }}</text>
              </view>
            </view>
          </view>
          <view class="as-empty" v-if="!filteredList.length && loaded">
            <text class="as-empty-icon">📋</text>
            <text class="as-empty-text">暂无可用助教</text>
          </view>
          <view class="as-empty" v-if="!loaded">
            <text class="as-empty-text">加载中...</text>
          </view>
        </scroll-view>
      </template>

      <!-- ==================== 阶段2：服务配置 ==================== -->
      <scroll-view v-else scroll-y class="as-config">
        <!-- 已选助教 -->
        <view class="as-selected">
          <view class="as-selected-avatar">
            <text class="as-selected-avatar-text">{{ (selectedAssistant.name || '?')[0] }}</text>
          </view>
          <view class="as-selected-info">
            <text class="as-selected-name">{{ selectedAssistant.name }}</text>
            <text class="as-selected-rate">¥{{ selectedAssistant.hourly_rate || 0 }}/小时</text>
          </view>
          <text class="as-selected-change" @click="selectedAssistant = null; showConfig = false">更换</text>
        </view>

        <!-- 服务方式 -->
        <view class="as-section">
          <text class="as-section-title">服务方式</text>
          <view class="as-mode-row">
            <view class="as-mode-card" :class="{ active: billingMode === 'realtime' }" @click="billingMode = 'realtime'">
              <text class="as-mode-card-icon">⏱</text>
              <text class="as-mode-card-label">实时计费</text>
              <text class="as-mode-card-desc">按实际上桌时间收费</text>
            </view>
            <view class="as-mode-card" :class="{ active: billingMode === 'flat_rate' }" @click="billingMode = 'flat_rate'">
              <text class="as-mode-card-icon">📦</text>
              <text class="as-mode-card-label">固定时长</text>
              <text class="as-mode-card-desc">预付固定小时数</text>
            </view>
          </view>
        </view>

        <!-- 固定时长配置 -->
        <template v-if="billingMode === 'flat_rate'">
          <view class="as-section">
            <text class="as-section-title">时长</text>
            <view class="as-duration-row">
              <view v-for="h in [0.5, 1, 2, 3]" :key="h" class="as-dur-chip"
                :class="{ active: buyoutHours === h && !customHoursInput }"
                @click="buyoutHours = h; customHoursInput = ''">
                <text class="as-dur-chip-h">{{ h }}h</text>
                <text class="as-dur-chip-price">¥{{ ((selectedAssistant.hourly_rate || 0) * h).toFixed(0) }}</text>
              </view>
              <input type="digit" v-model="customHoursInput" placeholder="自定义" class="as-dur-input" @input="onCustomInput" />
            </view>
          </view>

          <!-- 价格预览 -->
          <view class="as-price-card">
            <view class="as-price-row">
              <text class="as-price-label">时长</text>
              <text class="as-price-val">{{ buyoutHours }}h</text>
            </view>
            <view class="as-price-row">
              <text class="as-price-label">单价</text>
              <text class="as-price-val">¥{{ selectedAssistant.hourly_rate || 0 }}/h</text>
            </view>
            <view class="as-price-divider" />
            <view class="as-price-row as-price-total">
              <text class="as-price-label">合计</text>
              <text class="as-price-val">¥{{ buyoutPrice }}</text>
            </view>
          </view>

          <!-- 支付方式 -->
          <view class="as-section">
            <text class="as-section-title">支付方式</text>
            <view class="as-mode-row">
              <view class="as-mode-card" :class="{ active: payMode === 'prepaid' }" @click="payMode = 'prepaid'">
                <text class="as-mode-card-icon">💵</text>
                <text class="as-mode-card-label">先付</text>
                <text class="as-mode-card-desc">上桌前现金支付</text>
              </view>
              <view class="as-mode-card" :class="{ active: payMode === 'postpaid' }" @click="payMode = 'postpaid'">
                <text class="as-mode-card-icon">🧾</text>
                <text class="as-mode-card-label">后付</text>
                <text class="as-mode-card-desc">结账时统一支付</text>
              </view>
            </view>
          </view>
        </template>

        <!-- 底部按钮 -->
        <view class="as-confirm">
          <button class="as-btn-cancel" @click="selectedAssistant = null; showConfig = false">取消</button>
          <button class="as-btn-confirm" @click="confirmBooking">
            {{ billingMode === 'flat_rate' ? `确认预付 · ¥${buyoutPrice}` : '确认上桌' }}
          </button>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAssistantList } from '@/api/modules/table'
import { Icons } from '@/utils/icons'

interface AssistantOption {
  id: string; name: string; phone?: string; level_name?: string; level_id?: string
  hourly_rate?: number; is_busy?: boolean; status?: string
}
interface AssistantBooking extends AssistantOption {
  billing_mode: string; buyout_hours: number; pay_mode: string
}

const emit = defineEmits<{ (e: 'select', assistant: AssistantBooking): void }>()

const visible = ref(false)
const assistants = ref<AssistantOption[]>([])
const loaded = ref(false)
const searchQuery = ref('')

const selectedAssistant = ref<AssistantOption | null>(null)
const showConfig = ref(false)
const billingMode = ref<'realtime' | 'flat_rate'>('realtime')
const buyoutHours = ref(1)
const customHoursInput = ref('')
const payMode = ref<'prepaid' | 'postpaid'>('prepaid')
const payChannel = ref<'cash'>('cash')

const buyoutPrice = computed(() => ((selectedAssistant.value?.hourly_rate || 0) * buyoutHours.value).toFixed(2))

const filteredList = computed(() => {
  if (!searchQuery.value) return assistants.value
  const q = searchQuery.value.toLowerCase()
  return assistants.value.filter(a => a.name.toLowerCase().includes(q))
})

function open() {
  loaded.value = false; visible.value = true; showConfig.value = false
  selectedAssistant.value = null; searchQuery.value = ''
  getAssistantList().then((res: any) => {
    const data = res?.list || res
    assistants.value = Array.isArray(data) ? data : []
  }).catch(() => { assistants.value = [] }).finally(() => { loaded.value = true })
}

function close() { visible.value = false; showConfig.value = false }

function select(a: AssistantOption) {
  if (a.is_busy) return
  selectedAssistant.value = a; showConfig.value = true
  billingMode.value = 'realtime'; buyoutHours.value = 1; customHoursInput.value = ''
  payMode.value = 'prepaid'; payChannel.value = 'cash'
}

function confirmBooking() {
  if (!selectedAssistant.value) return
  emit('select', {
    ...selectedAssistant.value,
    billing_mode: billingMode.value,
    buyout_hours: billingMode.value === 'flat_rate' ? buyoutHours.value : 0,
    pay_mode: payMode.value,
    pay_channel: payChannel.value,
  } as AssistantBooking)
  close()
}

function onCustomInput(e: any) {
  customHoursInput.value = e.detail?.value || e.target?.value || ''
  const v = parseFloat(customHoursInput.value)
  if (v > 0) buyoutHours.value = v
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
// ===== 底色 =====
.as-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); z-index: 300;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.as-panel {
  background: #fff; border-radius: 36rpx 36rpx 0 0;
  display: flex; flex-direction: column; max-height: 85vh; overflow: hidden;
}

// ===== 拖拽条 =====
.as-drag-bar {
  display: flex; justify-content: center; padding: 14rpx 0 6rpx; flex-shrink: 0;
}
.as-drag-indicator {
  width: 64rpx; height: 6rpx; border-radius: 3rpx; background: #e2e8f0;
}

// ===== Header =====
.as-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 32rpx 24rpx; flex-shrink: 0;
}
.as-header-left { display: flex; align-items: center; gap: 14rpx; }
.as-header-icon { font-size: 36rpx; }
.as-title { font-size: 36rpx; font-weight: 800; color: #0f172a; }
.as-close {
  width: 56rpx; height: 56rpx; display: flex; align-items: center;
  justify-content: center; border-radius: 50%; background: #f1f5f9;
  color: #64748b; font-size: 28rpx; flex-shrink: 0;
}

// ===== 搜索 =====
.as-search {
  display: flex; align-items: center; margin: 0 32rpx 20rpx;
  padding: 6rpx 6rpx 6rpx 20rpx; background: #f8fafc;
  border: 2rpx solid #e2e8f0; border-radius: 20rpx; flex-shrink: 0;
}
.as-search-icon { font-size: 28rpx; flex-shrink: 0; }
.as-search-input {
  flex: 1; height: 68rpx; padding: 0 16rpx; background: transparent;
  font-size: 28rpx; color: #1e293b;
}
.as-search-clear {
  width: 52rpx; height: 52rpx; display: flex; align-items: center;
  justify-content: center; border-radius: 50%; background: #e2e8f0;
  font-size: 22rpx; color: #64748b; flex-shrink: 0;
}

// ===== 列表 =====
.as-list { flex: 1; padding: 0 32rpx; }
.as-item {
  display: flex; align-items: center; gap: 18rpx;
  padding: 22rpx 0; border-bottom: 1rpx solid #f4f4f5;
  &--busy { opacity: 0.5; pointer-events: none; }
}
.as-item-avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.as-item-avatar-text { font-size: 34rpx; font-weight: 700; color: #059669; }
.as-item-body { flex: 1; min-width: 0; }
.as-item-name { font-size: 30rpx; font-weight: 600; color: #1e293b; display: block; }
.as-item-meta {
  font-size: 24rpx; color: #94a3b8; margin-top: 4rpx;
  display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.as-item-end { text-align: right; flex-shrink: 0; }
.as-item-rate { font-size: 28rpx; color: #ef4444; font-weight: 700; display: block; }
.as-item-status {
  display: inline-flex; align-items: center; gap: 6rpx;
  font-size: 22rpx; padding: 4rpx 18rpx; border-radius: 20rpx; margin-top: 8rpx;
}
.as-item-status-dot { width: 8rpx; height: 8rpx; border-radius: 50%; }
.as-item-status.free { background: #d1fae5; color: #065f46; .as-item-status-dot { background: #059669; } }
.as-item-status.busy { background: #fee2e2; color: #991b1b; .as-item-status-dot { background: #ef4444; } }

.as-empty { padding: 100rpx 0; text-align: center; }
.as-empty-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; }
.as-empty-text { color: #94a3b8; font-size: 28rpx; }

// ===== 配置区 =====
.as-config { flex: 1; padding: 0 32rpx 48rpx; }

// 已选助教
.as-selected {
  display: flex; align-items: center; gap: 18rpx;
  background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
  border: 2rpx solid #a7f3d0; border-radius: 24rpx; padding: 24rpx; margin-top: 8rpx;
}
.as-selected-avatar {
  width: 72rpx; height: 72rpx; border-radius: 50%;
  background: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.as-selected-avatar-text { font-size: 32rpx; font-weight: 700; color: #fff; }
.as-selected-info { flex: 1; min-width: 0; }
.as-selected-name { font-size: 30rpx; font-weight: 700; color: #065f46; display: block; }
.as-selected-rate { font-size: 24rpx; color: #059669; margin-top: 4rpx; display: block; }
.as-selected-change {
  font-size: 24rpx; color: #3b82f6; padding: 10rpx 24rpx;
  background: rgba(59,130,246,.1); border-radius: 16rpx; flex-shrink: 0;
}

// 分组
.as-section { margin-top: 28rpx; }
.as-section-title {
  font-size: 28rpx; font-weight: 700; color: #334155; margin-bottom: 16rpx; display: block;
}

// 服务方式 / 支付方式 — 大卡片
.as-mode-row { display: flex; gap: 16rpx; }
.as-mode-card {
  flex: 1; padding: 24rpx 16rpx; border-radius: 20rpx;
  border: 2rpx solid #e5e7eb; background: #fff; text-align: center;
  &.active { border-color: #059669; background: #ecfdf5; }
}
.as-mode-card-icon { font-size: 36rpx; display: block; margin-bottom: 8rpx; }
.as-mode-card-label { font-size: 28rpx; font-weight: 600; color: #1e293b; display: block; }
.as-mode-card-desc { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; display: block; }

// 时长芯片
.as-duration-row { display: flex; gap: 14rpx; align-items: center; }
.as-dur-chip {
  padding: 18rpx 28rpx; border-radius: 18rpx; border: 2rpx solid #e5e7eb;
  background: #fff; text-align: center; flex: 1;
  &.active { border-color: #059669; background: #ecfdf5; }
}
.as-dur-chip-h { font-size: 28rpx; font-weight: 700; color: #1e293b; display: block; }
.as-dur-chip-price { font-size: 22rpx; color: #059669; margin-top: 2rpx; display: block; }
.as-dur-input {
  width: 150rpx; padding: 24rpx 16rpx; border-radius: 18rpx;
  border: 2rpx solid #e5e7eb; font-size: 26rpx; text-align: center; color: #64748b;
}

// 价格卡片
.as-price-card {
  margin-top: 20rpx; padding: 24rpx 28rpx;
  background: #f8fafc; border-radius: 20rpx; border: 1rpx solid #e2e8f0;
}
.as-price-row { display: flex; justify-content: space-between; align-items: center; padding: 6rpx 0; }
.as-price-label { font-size: 26rpx; color: #64748b; }
.as-price-val { font-size: 26rpx; font-weight: 600; color: #1e293b; }
.as-price-divider { height: 1rpx; background: #e2e8f0; margin: 12rpx 0; }
.as-price-total { .as-price-label { font-size: 28rpx; font-weight: 700; color: #1e293b; } .as-price-val { font-size: 32rpx; font-weight: 800; color: #059669; } }

// ===== 底部按钮 =====
.as-confirm { display: flex; gap: 20rpx; margin-top: 36rpx; padding-bottom: env(safe-area-inset-bottom); }
.as-btn-cancel {
  flex: 1; padding: 28rpx; border-radius: 36rpx; background: #f1f5f9;
  color: #64748b; font-size: 28rpx; font-weight: 600; text-align: center; border: none;
}
.as-btn-confirm {
  flex: 2; padding: 28rpx; border-radius: 36rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; font-size: 30rpx; font-weight: 700; text-align: center; border: none;
  box-shadow: 0 8rpx 24rpx rgba(5,150,105,.25);
}
</style>
