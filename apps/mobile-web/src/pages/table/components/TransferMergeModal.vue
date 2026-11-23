<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ isTransfer ? '换台' : '并台' }}</text>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <!-- 成功页 -->
        <view v-if="successMsg" class="success-section">
          <view class="success-icon">✅</view>
          <text class="success-title">{{ isTransfer ? '换台成功' : '并台成功' }}</text>
          <text class="success-desc">{{ successMsg }}</text>
          <button class="btn-done" @click="$emit('success'); $emit('close')">确定</button>
        </view>

        <template v-else>
          <!-- 源桌台信息 -->
          <view class="source-card">
            <view class="source-header">
              <text class="source-label">{{ isTransfer ? '当前桌台' : '合并桌台' }}</text>
              <text class="source-badge">桌{{ tableName }}</text>
            </view>
            <view class="source-stats" v-if="sourceStats">
              <view class="stat-item">
                <text class="stat-value">{{ sourceStats.durationText }}</text>
                <text class="stat-label">时长</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">{{ sourceStats.playerCount }}人</text>
                <text class="stat-label">人数</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">¥{{ sourceStats.tableFee }}</text>
                <text class="stat-label">台费</text>
              </view>
              <view class="stat-item">
                <text class="stat-value">¥{{ sourceStats.total }}</text>
                <text class="stat-label">合计</text>
              </view>
            </view>
            <view v-else class="source-empty">无进行中的计时</view>
          </view>

          <!-- 目标桌台选择 -->
          <view class="target-section">
            <view class="target-header">
              <text class="target-title">选择{{ isTransfer ? '目标桌台' : '合并到的桌台' }}</text>
              <text class="target-count">{{ availableTables.length }}个可用</text>
            </view>
            <view v-if="availableTables.length === 0" class="target-empty">
              <text>{{ isTransfer ? '暂无可用的空闲桌台' : '没有其他使用中的桌台' }}</text>
            </view>
            <view v-else class="table-grid">
              <view v-for="t in availableTables" :key="t.id" class="table-chip"
                :class="{ selected: selectedTableId === t.id }"
                @click="selectedTableId = t.id">
                <text class="table-chip-name">桌{{ t.name || t.number || t.id }}</text>
                <text v-if="t.status === 'occupied'" class="table-chip-sub">👥 {{ t.current_order?.player_count || '?' }}人</text>
                <text v-else class="table-chip-sub idle">空闲</text>
                <view v-if="selectedTableId === t.id" class="table-chip-check">✓</view>
              </view>
            </view>
          </view>

          <!-- 警告提示 -->
          <view v-if="selectedTableId" class="warning-card" :class="isTransfer ? 'warning-blue' : 'warning-amber'">
            <text>⚠️ {{ isTransfer ? '换台后计时将转移到新桌台，原桌台变为空闲。' : '并台后两桌消费将合并，源桌台自动关闭，所有订单转移。' }}</text>
          </view>
        </template>
      </scroll-view>

      <!-- 底部按钮 -->
      <view v-if="!successMsg" class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-confirm" :class="isTransfer ? 'btn-blue' : 'btn-purple'"
          :disabled="!selectedTableId || processing"
          @click="handleConfirm">
          {{ processing ? '处理中...' : (isTransfer ? '确认换台' : '确认并台') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { getTableList, getCurrentOrder, changeTable, mergeTable } from '@/api/modules/table'
import type { Table, Bill } from '@/api/modules/table'

const props = defineProps<{
  visible: boolean
  tableId: string
  tableName: string
  orderId: string
  mode: 'transfer' | 'merge'
  /** Source table stats from caller */
  sourceStats?: {
    durationText: string
    playerCount: number
    tableFee: string
    total: string
  } | null
}>()

const emit = defineEmits(['close', 'success'])

const isTransfer = computed(() => props.mode === 'transfer')

const availableTables = ref<Table[]>([])
const selectedTableId = ref('')
const processing = ref(false)
const successMsg = ref('')

// Load tables when visible changes
watch(() => props.visible, async (v) => {
  if (!v) {
    selectedTableId.value = ''
    successMsg.value = ''
    return
  }
  // Load tables based on mode
  try {
    const status = isTransfer.value ? 'idle' : 'occupied'
    const result = await getTableList({ status, page_size: 100 })
    const list = (result?.data || []).filter((t: Table) => t.id !== props.tableId)
    availableTables.value = list
  } catch {
    availableTables.value = []
  }
})

onUnmounted(() => { })

async function handleConfirm() {
  if (!selectedTableId.value || !props.orderId) return
  processing.value = true
  try {
    if (isTransfer.value) {
      await changeTable({ order_id: props.orderId, target_table_id: selectedTableId.value })
      successMsg.value = '源桌台已释放，目标桌台已更换'
    } else {
      // wwwpos pattern: fetch target orderId via getCurrentOrder
      const targetOrder = await getCurrentOrder(selectedTableId.value) as unknown as Bill
      const targetOrderId = targetOrder?.order?.id || (targetOrder as any)?.id
      if (!targetOrderId) {
        uni.showToast({ title: '目标台桌无进行中的订单', icon: 'none' })
        return
      }
      await mergeTable({ source_order_id: props.orderId, target_order_id: targetOrderId })
      successMsg.value = '两桌消费已合并，源桌台已关闭，所有订单已转移'
    }
    emit('success')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '操作失败', icon: 'none' })
  } finally {
    processing.value = false
  }
}
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 24rpx; padding-bottom: 48rpx; }

/* source */
.source-card { background: #f9fafb; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.source-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.source-label { font-size: 26rpx; color: #6b7280; }
.source-badge { padding: 4rpx 16rpx; background: #059669; color: #fff; font-size: 22rpx; font-weight: 600; border-radius: 12rpx; }
.source-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; text-align: center; }
.stat-item { }
.stat-value { display: block; font-size: 32rpx; font-weight: 700; color: #059669; }
.stat-label { display: block; font-size: 20rpx; color: #9ca3af; margin-top: 4rpx; }
.source-empty { text-align: center; color: #9ca3af; font-size: 26rpx; padding: 20rpx; }

/* target */
.target-section { margin-bottom: 24rpx; }
.target-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.target-title { font-size: 28rpx; font-weight: 600; color: #111827; }
.target-count { font-size: 22rpx; color: #9ca3af; }
.target-empty { text-align: center; padding: 40rpx; color: #d97706; font-size: 26rpx; }
.table-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.table-chip { position: relative; padding: 20rpx 12rpx; border-radius: 16rpx; border: 2rpx solid #e5e7eb; background: #f9fafb; text-align: center; }
.table-chip.selected { border-color: #059669; background: #ecfdf5; }
.table-chip-name { display: block; font-size: 26rpx; font-weight: 600; color: #1f2937; }
.table-chip-sub { display: block; font-size: 20rpx; color: #9ca3af; margin-top: 4rpx; }
.table-chip-sub.idle { color: #059669; }
.table-chip-check { position: absolute; top: -8rpx; right: -8rpx; width: 36rpx; height: 36rpx; background: #059669; border-radius: 50%; color: #fff; font-size: 20rpx; display: flex; align-items: center; justify-content: center; }

/* warning */
.warning-card { padding: 20rpx; border-radius: 12rpx; font-size: 24rpx; line-height: 1.5; }
.warning-blue { background: #eff6ff; border: 1rpx solid #bfdbfe; color: #1e40af; }
.warning-amber { background: #fef3c7; border: 1rpx solid #fcd34d; color: #92400e; }

/* success */
.success-section { text-align: center; padding: 48rpx 0; }
.success-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.success-title { display: block; font-size: 36rpx; font-weight: 700; color: #059669; margin-bottom: 16rpx; }
.success-desc { display: block; font-size: 26rpx; color: #6b7280; margin-bottom: 32rpx; }
.btn-done { width: 300rpx; padding: 24rpx; background: #059669; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 600; border: none; margin: 0 auto; }

/* footer */
.modal-footer { display: flex; gap: 16rpx; padding: 20rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx); border-top: 1rpx solid #f3f4f6; }
.btn-cancel { flex: 1; padding: 24rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-confirm { flex: 2; padding: 24rpx; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
.btn-confirm[disabled] { background: #d1d5db; color: #9ca3af; }
.btn-blue { background: linear-gradient(135deg, #3b82f6, #6366f1); }
.btn-purple { background: linear-gradient(135deg, #a855f7, #ec4899); }
</style>
