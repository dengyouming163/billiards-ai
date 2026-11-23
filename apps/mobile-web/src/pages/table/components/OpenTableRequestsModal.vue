<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">开台申请</text>
        <view v-if="requests.length > 0" class="count-badge">{{ requests.length }}条待处理</view>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <view v-if="loading && requests.length === 0" class="center-hint">
          <text>加载中...</text>
        </view>
        <view v-else-if="requests.length === 0" class="center-hint">
          <text class="hint-icon">📋</text>
          <text class="hint-text">暂无开台申请</text>
        </view>
        <view v-else v-for="req in requests" :key="req.token"
          class="request-item" :class="{ expired: isExpired(req) }">
          <view class="req-top">
            <view class="req-table">
              <text class="req-icon">🎱</text>
              <text class="req-name">{{ req.table_name || req.table_id }}</text>
            </view>
            <text class="req-timer" :class="timerClass(req)">⏱ {{ formatRemaining(req) }}</text>
          </view>
          <view class="req-meta">
            <text>👥 {{ req.player_count }}人</text>
            <text>处理时限 {{ req.timeout || 1 }}分钟</text>
          </view>
          <view class="req-actions">
            <button :disabled="isExpired(req) || processing === req.token"
              class="btn-confirm" @click="handleAction(req.token, 'confirm')">
              {{ processing === req.token ? '处理中...' : '✅ 确认开台' }}
            </button>
            <button :disabled="isExpired(req) || processing === req.token"
              class="btn-reject" @click="handleAction(req.token, 'reject')">
              拒绝
            </button>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getPendingConfirmRequests, confirmOpenRequest } from '@/api/modules/table'
// Backend returns snake_case
interface ConfirmRequest {
  token: string; table_id: string; table_name: string
  player_count: number; expires_at: number; timeout: number
}

defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'resolved'])

const requests = ref<ConfirmRequest[]>([])
const loading = ref(false)
const processing = ref<string | null>(null)
const now = ref(Math.floor(Date.now() / 1000))

let pollTimer: ReturnType<typeof setInterval> | null = null
let tickTimer: ReturnType<typeof setInterval> | null = null

async function loadData() {
  loading.value = true
  try {
    const result = await getPendingConfirmRequests({ showLoading: false })
    requests.value = result || []
  } catch { requests.value = [] }
  finally { loading.value = false }
}

function isExpired(req: ConfirmRequest): boolean {
  return req.expires_at - now.value <= 0
}

function timerClass(req: ConfirmRequest): string {
  const remaining = req.expires_at - now.value
  if (remaining <= 0) return 'timer-expired'
  if (remaining <= 15) return 'timer-warn'
  return 'timer-ok'
}

function formatRemaining(req: ConfirmRequest): string {
  const remaining = req.expires_at - now.value
  if (remaining <= 0) return '已超时'
  if (remaining >= 60) return `${Math.floor(remaining / 60)}分${remaining % 60}秒`
  return `${remaining}秒`
}

async function handleAction(token: string, action: 'confirm' | 'reject') {
  processing.value = token
  try {
    await confirmOpenRequest({ token, action })
    uni.showToast({ title: action === 'confirm' ? '已确认开台' : '已拒绝', icon: 'success' })
    requests.value = requests.value.filter(r => r.token !== token)
    emit('resolved')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '操作失败', icon: 'none' })
  } finally {
    processing.value = null
  }
}

onMounted(() => {
  loadData()
  pollTimer = setInterval(loadData, 5000)
  tickTimer = setInterval(() => { now.value = Math.floor(Date.now() / 1000) }, 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
})

defineExpose({ loadData })
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 75vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; background: #fffbeb; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.count-badge { margin-left: 16rpx; padding: 4rpx 16rpx; background: #fef3c7; color: #92400e; font-size: 22rpx; font-weight: 700; border-radius: 20rpx; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 16rpx 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.request-item { padding: 24rpx; margin-bottom: 16rpx; border-radius: 16rpx; background: #f9fafb; }
.request-item.expired { opacity: 0.5; background: #f3f4f6; }
.req-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.req-table { display: flex; align-items: center; gap: 8rpx; }
.req-icon { font-size: 32rpx; }
.req-name { font-size: 28rpx; font-weight: 700; color: #1f2937; }
.req-timer { font-size: 24rpx; font-weight: 700; font-variant-numeric: tabular-nums; }
.timer-ok { color: #059669; }
.timer-warn { color: #d97706; }
.timer-expired { color: #ef4444; }
.req-meta { display: flex; gap: 24rpx; font-size: 22rpx; color: #9ca3af; margin-bottom: 16rpx; }
.req-actions { display: flex; gap: 16rpx; }
.btn-confirm { flex: 1; padding: 18rpx; background: #059669; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
.btn-confirm[disabled] { background: #d1d5db; color: #9ca3af; }
.btn-reject { flex: 1; padding: 18rpx; background: #ef4444; color: #fff; border-radius: 12rpx; font-size: 26rpx; font-weight: 600; border: none; }
.btn-reject[disabled] { background: #d1d5db; color: #9ca3af; }
</style>
