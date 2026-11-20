<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">上桌提醒</text>
        <view v-if="bookings.length > 0" class="count-badge rose">{{ bookings.length }}条待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="bookings.length === 0" class="center-hint">
          <text class="hint-icon">✅</text>
          <text class="hint-text">暂无待安排上桌</text>
        </view>
        <view v-else v-for="b in bookings" :key="b.item_id" class="booking-item">
          <view class="booking-top">
            <view class="booking-table">
              <text class="booking-icon">📍</text>
              <text class="booking-name">{{ b.zone_name ? b.zone_name + ' · ' : '' }}{{ b.table_name }}</text>
            </view>
            <view class="booking-actions">
              <text v-if="b.expires_at" class="booking-countdown">{{ formatRemaining(b) }}</text>
              <button class="btn-accept" :disabled="processingItem === b.item_id"
                @click="handleAcceptClick(b)">处理</button>
              <button class="btn-skip" :disabled="!!processingItem"
                @click="handleIgnore(b.item_id)">忽略</button>
            </view>
          </view>
          <view class="booking-sub">
            <text>👤 {{ b.assistant_name }}</text>
            <text>¥{{ b.hourly_rate }}/时</text>
            <text v-if="b.created_at">{{ formatTime(b.created_at) }} 预约</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>

  <view v-if="confirmTarget" class="modal-overlay" style="z-index:1101" @click="confirmTarget = null">
    <view class="confirm-dialog" @click.stop>
      <view class="confirm-icon">✅</view>
      <text class="confirm-title">确认处理</text>
      <text class="confirm-desc">{{ confirmTarget.table_name }} · {{ confirmTarget.assistant_name }}</text>
      <text class="confirm-hint">处理后请到台桌点击「开始服务」</text>
      <view class="confirm-actions">
        <button class="btn-cancel" @click="confirmTarget = null">取消</button>
        <button class="btn-ok" @click="handleAccept(confirmTarget)">确认处理</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingAssistantBookingsV2, acceptAssistantBooking, cancelOrderItem } from '@/api/modules/table'

// Backend returns snake_case — use raw Record type
interface BookingItem {
  item_id: string; order_id: string; table_id: string
  table_name: string; zone_name: string
  assistant_id: string; assistant_name: string
  hourly_rate: number; status: string
  created_at: string; expires_at?: string | null
}

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const bookings = ref<BookingItem[]>([])
const processingItem = ref<string | null>(null)
const confirmTarget = ref<BookingItem | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

function formatRemaining(b: BookingItem): string {
  if (!b.expires_at) return ''
  const r = Math.floor(new Date(b.expires_at).getTime() / 1000 - now.value)
  if (r <= 0) return '已超时'
  if (r >= 60) return `${Math.floor(r / 60)}分${r % 60}秒`
  return `${r}秒`
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  try {
    const result = await getPendingAssistantBookingsV2({ showLoading: false })
    bookings.value = (result || []) as unknown as BookingItem[]
  } catch { bookings.value = [] }
}

function handleAcceptClick(b: BookingItem) {
  confirmTarget.value = b
}

async function handleAccept(b: BookingItem) {
  confirmTarget.value = null
  processingItem.value = b.item_id
  try {
    await acceptAssistantBooking({ item_id: b.item_id })
    bookings.value = bookings.value.filter(x => x.item_id !== b.item_id)
    uni.showToast({ title: '已处理', icon: 'success' })
    emit('updated')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || '操作失败', icon: 'none' })
  } finally {
    processingItem.value = null
  }
}

async function handleIgnore(itemId: string) {
  bookings.value = bookings.value.filter(x => x.item_id !== itemId)
  try { await cancelOrderItem({ item_id: itemId }) } catch {}
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadData, 10000)
  tickTimer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #ffffff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; border-top: 1rpx solid #e5e5e5; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #e5e5e5; background: rgba(7, 193, 96, 0.05); }
.modal-title { font-size: 32rpx; font-weight: 700; color: #000000; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; font-weight: 700; }
.count-badge.rose { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #999999; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #999999; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.booking-item { padding: 24rpx; margin-bottom: 12rpx; border-radius: 12rpx; background: #f7f7f7; border: 1rpx solid #e5e5e5; }
.booking-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.booking-table { display: flex; align-items: center; gap: 6rpx; }
.booking-icon { font-size: 24rpx; }
.booking-name { font-size: 28rpx; font-weight: 700; color: #333333; }
.booking-actions { display: flex; align-items: center; gap: 8rpx; }
.booking-countdown { font-size: 22rpx; color: #07C160; font-weight: 600; font-variant-numeric: tabular-nums; }
.btn-accept { padding: 10rpx 22rpx; background: #07C160; color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
.btn-accept[disabled] { opacity: 0.5; }
.btn-skip { padding: 10rpx 22rpx; background: #f7f7f7; color: #999999; border-radius: 10rpx; font-size: 24rpx; border: none; }
.btn-skip[disabled] { opacity: 0.3; }
.booking-sub { display: flex; gap: 16rpx; font-size: 24rpx; color: #999999; padding-left: 30rpx; }
.confirm-dialog { position: fixed; inset: 0; margin: auto; width: 560rpx; height: fit-content; background: #ffffff; border-radius: 32rpx; padding: 48rpx 32rpx; text-align: center; z-index: 1102; box-shadow: 0 20rpx 60rpx rgba(0,0,0,.15); border: 1rpx solid #e5e5e5; }
.confirm-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.confirm-title { display: block; font-size: 32rpx; font-weight: 700; color: #000000; margin-bottom: 12rpx; }
.confirm-desc { display: block; font-size: 26rpx; color: #999999; margin-bottom: 8rpx; }
.confirm-hint { display: block; font-size: 22rpx; color: #07C160; margin-bottom: 32rpx; }
.confirm-actions { display: flex; gap: 16rpx; }
.btn-cancel { flex: 1; padding: 22rpx; background: #f7f7f7; color: #999999; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-ok { flex: 1; padding: 22rpx; background: #07C160; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
</style>
