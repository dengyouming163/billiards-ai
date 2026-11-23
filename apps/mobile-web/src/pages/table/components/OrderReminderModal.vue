<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">点单提醒</text>
        <view v-if="totalPending > 0" class="count-badge orange">{{ totalPending }}件待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="allItems.length === 0" class="center-hint">
          <text class="hint-icon">✅</text>
          <text class="hint-text">暂无待处理点单</text>
        </view>
        <view v-else v-for="item in allItems" :key="item.item_id" class="item-row">
          <view class="item-icon-box">📦</view>
          <view class="item-info">
            <view class="item-head">
              <text class="item-table">{{ item._table.table_name }}</text>
              <text class="item-name">{{ item.item_name }}</text>
              <text v-if="isExpired(item)" class="expired-tag">已超时</text>
            </view>
            <view class="item-sub">
              <text>¥{{ item.unit_price }} × {{ item.quantity }} = ¥{{ (item.unit_price * item.quantity).toFixed(2) }}</text>
              <text v-if="item.expires_at" class="item-countdown">剩余 {{ formatRemaining(item) }}</text>
            </view>
          </view>
          <view class="item-actions">
            <button class="btn-deliver" :disabled="!!processingItem"
              @click="handleDeliverClick(item)">送达</button>
            <button class="btn-skip" :disabled="!!processingItem"
              @click="handleIgnore(item.item_id)">忽略</button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>

  <!-- 送达确认弹窗 -->
  <view v-if="confirmTarget" class="modal-overlay" style="z-index:1101" @click="confirmTarget = null">
    <view class="confirm-dialog" @click.stop>
      <view class="confirm-icon">✅</view>
      <text class="confirm-title">确认送达</text>
      <text class="confirm-desc">{{ confirmTarget._table.table_name }} · {{ confirmTarget.item_name }} × {{ confirmTarget.quantity }}</text>
      <view class="confirm-actions">
        <button class="btn-cancel" @click="confirmTarget = null">取消</button>
        <button class="btn-ok" @click="handleDeliver(confirmTarget)">确认送达</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getPendingDeliveriesV2, deliverItem, cancelOrderItem } from '@/api/modules/table'
// Backend returns snake_case — use raw Record type
interface DeliveryItem {
  item_id: string; item_name: string; quantity: number
  unit_price: number; total_price: number; final_price: number
  status: string; created_at: string; expires_at?: string | null
  _table: DeliveryGroup
}
interface DeliveryGroup {
  table_id: string; table_name: string; zone_name: string; order_id: string
  items: DeliveryItem[]
}

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'updated'])

const groups = ref<DeliveryGroup[]>([])
const processingItem = ref<string | null>(null)
const confirmTarget = ref<DeliveryItem | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

const allItems = computed(() =>
  groups.value.flatMap(g => g.items.map(i => ({ ...i, _table: g })))
)
const totalPending = computed(() => allItems.value.length)

function isExpired(item: DeliveryItem): boolean {
  if (!item.expires_at) return false
  return new Date(item.expires_at).getTime() / 1000 - now.value <= 0
}

function formatRemaining(item: DeliveryItem): string {
  if (!item.expires_at) return ''
  const r = Math.floor(new Date(item.expires_at).getTime() / 1000 - now.value)
  if (r <= 0) return '0秒'
  if (r >= 60) return `${Math.floor(r / 60)}分${r % 60}秒`
  return `${r}秒`
}

async function loadData() {
  try {
    const result = await getPendingDeliveriesV2({ showLoading: false })
    groups.value = result || []
  } catch { groups.value = [] }
}

function handleDeliverClick(item: DeliveryItem) {
  confirmTarget.value = item
}

async function handleDeliver(item: DeliveryItem) {
  confirmTarget.value = null
  processingItem.value = item.item_id
  try {
    await deliverItem({ item_id: item.item_id })
    uni.showToast({ title: '已送达', icon: 'success' })
    emit('updated')
    await loadData()
  } catch (e: any) {
    uni.showToast({ title: e?.msg || '操作失败', icon: 'none' })
  } finally {
    processingItem.value = null
  }
}

async function handleIgnore(itemId: string) {
  groups.value = groups.value.map(g => ({
    ...g,
    items: g.items.filter(i => i.item_id !== itemId)
  })).filter(g => g.items.length > 0)
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
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; background: #fff7ed; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-size: 22rpx; font-weight: 700; }
.count-badge.orange { background: #fed7aa; color: #9a3412; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.item-row { display: flex; align-items: flex-start; gap: 16rpx; padding: 20rpx; margin-bottom: 12rpx; border-radius: 12rpx; background: #fff; border: 1rpx solid #f3f4f6; }
.item-icon-box { width: 64rpx; height: 64rpx; border-radius: 16rpx; background: #fff7ed; display: flex; align-items: center; justify-content: center; font-size: 28rpx; flex-shrink: 0; }
.item-info { flex: 1; min-width: 0; }
.item-head { display: flex; align-items: center; gap: 8rpx; flex-wrap: wrap; margin-bottom: 6rpx; }
.item-table { font-size: 22rpx; font-weight: 700; color: #ea580c; background: #fff7ed; padding: 2rpx 10rpx; border-radius: 6rpx; }
.item-name { font-size: 26rpx; font-weight: 500; color: #374151; }
.expired-tag { font-size: 20rpx; color: #ef4444; font-weight: 600; }
.item-sub { display: flex; align-items: center; gap: 16rpx; font-size: 22rpx; color: #9ca3af; }
.item-countdown { color: #d97706; font-weight: 600; font-variant-numeric: tabular-nums; }
.item-actions { display: flex; gap: 8rpx; flex-shrink: 0; align-self: center; }
.btn-deliver { padding: 12rpx 24rpx; background: #ea580c; color: #fff; border-radius: 10rpx; font-size: 24rpx; font-weight: 600; border: none; }
.btn-deliver[disabled] { opacity: 0.5; }
.btn-skip { padding: 12rpx 24rpx; background: #f3f4f6; color: #6b7280; border-radius: 10rpx; font-size: 24rpx; border: none; }
.btn-skip[disabled] { opacity: 0.3; }
/* confirm dialog */
.confirm-dialog { position: fixed; inset: 0; margin: auto; width: 560rpx; height: fit-content; background: #fff; border-radius: 32rpx; padding: 48rpx 32rpx; text-align: center; z-index: 1102; box-shadow: 0 20rpx 60rpx rgba(0,0,0,.3); }
.confirm-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.confirm-title { display: block; font-size: 32rpx; font-weight: 700; color: #111827; margin-bottom: 12rpx; }
.confirm-desc { display: block; font-size: 26rpx; color: #6b7280; margin-bottom: 32rpx; }
.confirm-actions { display: flex; gap: 16rpx; }
.btn-cancel { flex: 1; padding: 22rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-ok { flex: 1; padding: 22rpx; background: #ea580c; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
</style>
