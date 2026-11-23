<template>
  <view class="detail-page">
    <view class="status-card">
      <view class="status-header">
        <view class="status-badge" :class="orderStatus">
          <view class="status-dot"></view>
          <text class="status-label">{{ statusLabel }}</text>
        </view>
        <view class="log-entry" @click="goLog">
          <text class="log-text">操作日志</text>
          <text class="log-arrow">→</text>
        </view>
      </view>

      <!-- 实时费用卡片（绿色渐变） -->
      <view class="fee-card">
        <view class="fee-card-header">
          <text class="fee-card-label">实时费用</text>
          <text class="fee-card-timer">⏱ {{ orderStatus === 'paused' ? '已暂停' : displayTime }}</text>
        </view>
        <text class="fee-card-amount">¥{{ displayFee }}</text>
        <text class="fee-card-breakdown">
          台费¥{{ tableFee.toFixed(2) }} + 商品¥{{ productFee.toFixed(2) }} + 助教¥{{ assistantFee.toFixed(2) }}{{ chargingFee > 0 ? ' + 充电¥' + chargingFee.toFixed(2) : '' }}
        </text>
        <view class="fee-card-tags">
          <text v-if="orderStatus === 'paused'" class="fee-tag tag-paused">⏸ 暂停 · {{ pausedMinutes }}分钟</text>
          <text v-if="coefficient !== 1.0" class="fee-tag" :class="coefficient > 1 ? 'tag-warn' : 'tag-cool'">{{ periodLabel }}</text>
          <text v-if="hasDiscount" class="fee-tag tag-discount">会员{{ (discountRate / 10).toFixed(1) }}折</text>
          <text v-if="hasPrepaid" class="fee-tag tag-prepaid">预付{{ prepaidHours }}h</text>
        </view>
        <view v-if="Number(bill?.paid_amount || 0) > 0" class="fee-paid-row">
          <text class="fee-paid-label">已付</text>
          <text class="fee-paid-val">-¥{{ Number(bill.paid_amount || 0).toFixed(2) }}</text>
        </view>
        <view class="fee-payable-row">
          <text class="fee-payable-label">待支付</text>
          <text class="fee-payable-val">¥{{ (Number(bill?.payable_amount ?? displayFee)).toFixed(2) }}</text>
        </view>
      </view>

      <view class="meta-row">
        <view class="meta-chip">
          <text class="meta-label">开台时间</text>
          <text class="meta-value">{{ formatDateTime(bill?.start_time) }}</text>
        </view>
        <view class="meta-divider"></view>
        <view class="meta-chip">
          <text class="meta-label">台桌</text>
          <text class="meta-value">{{ bill?.table_name || '-' }}</text>
        </view>
      </view>
    </view>

    <view class="detail-body">
      <!-- 台费明细 -->
      <view class="section-card">
        <view class="section-title">台费明细</view>
        <view class="fee-detail-list">
          <view class="fd-row">
            <text class="fd-label">开台时间</text>
            <text class="fd-value">{{ formatDateTime(bill?.start_time) }}</text>
          </view>
          <view class="fd-row">
            <text class="fd-label">已用时长</text>
            <text class="fd-value">{{ formatDuration(bill?.duration_minutes || elapsedSeconds / 60) }}</text>
          </view>
          <view v-if="hasPrepaid" class="fd-row">
            <text class="fd-label">预付时长</text>
            <text class="fd-value emerald">{{ prepaidHours }}小时 ¥{{ prepaidAmount }}</text>
          </view>
          <view v-if="coefficient !== 1.0" class="fd-row">
            <text class="fd-label">时段系数</text>
            <text class="fd-value" :class="coefficient > 1 ? 'amber' : 'blue'">{{ periodLabel }}</text>
          </view>
          <view v-if="hasDiscount" class="fd-row">
            <text class="fd-label">会员折扣</text>
            <text class="fd-value rose">-¥{{ discountAmount }}</text>
          </view>
          <view class="fd-row fd-row--total">
            <text class="fd-label">台费合计</text>
            <text class="fd-value emerald fw-bold">¥{{ tableFee.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <ProductPanel
        :items="productItems"
        :order-status="billStatus"
        @add-product="handleAddProduct"
        @deliver="handleDeliver"
        @remove="handleRemoveProduct"
      />

      <AssistantPanel
        :items="assistantItems"
        :order-status="billStatus"
        @add-assistant="handleAddAssistant"
        @confirm="handleConfirmAssistant"
        @start="handleStartAssistant"
        @end="handleEndAssistant"
        @cancel="handleCancelAssistant"
        @gift="handleGiftAssistant"
        @toggle-pause="handleTogglePauseAssistant"
      />

      <view v-if="chargingFee > 0" class="section-card">
        <view class="section-title">⚡ 充电费用明细</view>
        <view class="fd-row fd-row--total">
          <text class="fd-label">充电小计</text>
          <text class="fd-value emerald fw-bold">¥{{ chargingFee.toFixed(2) }}</text>
        </view>
      </view>

      <view class="member-card" @click="handleMemberClick">
        <view class="member-left">
          <view class="member-icon">
            <text>👤</text>
          </view>
          <view class="member-info">
            <text class="member-title">会员</text>
            <text :class="bill?.member_info ? 'member-bound' : 'member-unbound'">
              {{ bill?.member_info ? (bill.member_info.name || '已绑定') : '未绑定' }}
            </text>
          </view>
        </view>
        <view class="member-right">
          <text class="member-action">{{ bill?.member_info ? '更换' : '绑定' }}</text>
          <text class="action-arrow">→</text>
        </view>
      </view>
    </view>

    <ActionBar
      :order-status="orderStatus"
      @transfer="handleTransfer"
      @merge="handleMerge"
      @member="handleMemberClick"
      @checkout="handleCheckout"
      @pause="handlePause"
      @resume="handleResume"
    />

    <MemberSelector ref="memberSelector" @select="handleBindMember" />
    <TransferMergeModal
      :visible="showTransferMergeModal"
      :table-id="tableId"
      :table-name="tableNameForCheckout"
      :order-id="orderId"
      :mode="transferMergeMode"
      :source-stats="transferSourceStats"
      @close="showTransferMergeModal = false"
      @success="handleTransferMergeSuccess"
    />
    <ProductSelector ref="productSelector" @select="handleAddProducts" />
    <AssistantSelector ref="assistantSelector" @select="handleAddAssistantItem" />
    <CheckoutModal :visible="showCheckoutModal" :table-id="tableId" :table-name="tableNameForCheckout"
      @close="showCheckoutModal = false"
      @completed="handleCheckoutCompleted" />

    <!-- 固定预付支付弹窗 -->
    <view v-if="showBuyoutPay" class="buyout-pay-overlay" @click="showBuyoutPay = false">
      <view class="buyout-pay-modal" @click.stop>
        <view class="bpm-header">
          <text class="bpm-title">确认支付</text>
          <text class="bpm-close" @click="showBuyoutPay = false">✕</text>
        </view>
        <view class="bpm-body">
          <view class="bpm-info">
            <text class="bpm-name">{{ buyoutPending?.name || '助教' }}</text>
            <text class="bpm-detail">{{ buyoutPending?.hours || 0 }}小时 · ¥{{ buyoutPending?.price || 0 }}/时</text>
          </view>
          <view class="bpm-amount">¥{{ buyoutAmount }}</view>
          <view class="bpm-pay-label">现金收款</view>
        </view>
        <view class="bpm-footer">
          <button class="bpm-btn-cancel" @click="showBuyoutPay = false">取消</button>
          <button class="bpm-btn-pay" :disabled="buyoutPaying" @click="confirmBuyoutPay">
            {{ buyoutPaying ? '支付中...' : `确认收款 ¥${buyoutAmount}` }}
          </button>
        </view>
      </view>
    </view>

    <!-- 加钟弹窗 -->
    <AssistantOvertimeModal
      :visible="showOvertimeModal"
      :item="overtimeItem"
      :order-id="orderId"
      @close="showOvertimeModal = false"
      @success="onOvertimeSuccess"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import ProductPanel from './components/ProductPanel.vue'
import AssistantPanel from './components/AssistantPanel.vue'
import ActionBar from './components/ActionBar.vue'
import MemberSelector from './components/MemberSelector.vue'
import ProductSelector from './components/ProductSelector.vue'
import AssistantSelector from './components/AssistantSelector.vue'
import AssistantOvertimeModal from './components/AssistantOvertimeModal.vue'
import CheckoutModal from './components/CheckoutModal.vue'
import TransferMergeModal from './components/TransferMergeModal.vue'
import { getTimePeriodLabel, getCurrentCoefficient } from '@/utils/billing'
import { formatDateTimeFixed, parseDateLike } from '@/utils/date'
import {
  getCurrentOrder,
  getTableDetail,
  deliverProduct,
  removeProduct,
  confirmAssistant,
  startAssistant,
  endAssistant,
  cancelAssistant,
  bindMember,
  addProduct,
  addAssistant,
  prepayAssistant,
  pauseTableFee,
  resumeTableFee,
  pauseAssistantFee,
  resumeAssistantFee,
} from '@/api/modules/table'
import type { Bill, OrderItem } from '@/api/modules/table'

const tableId = ref('')
const orderId = ref('')
const bill = ref<Bill | null>(null)
const elapsedSeconds = ref(0)
const showCheckoutModal = ref(false)
const tableNameForCheckout = computed(() => bill.value?.table_name || '')

const showTransferMergeModal = ref(false)
const transferMergeMode = ref<'transfer' | 'merge'>('transfer')

const memberSelector = ref<InstanceType<typeof MemberSelector> | null>(null)
const productSelector = ref<InstanceType<typeof ProductSelector> | null>(null)
const assistantSelector = ref<InstanceType<typeof AssistantSelector> | null>(null)

// 固定预付支付
const showBuyoutPay = ref(false)
const buyoutPaying = ref(false)
const buyoutPayChannel = ref<'cash'>('cash')
const buyoutPending = ref<{ id: string; name: string; hours: number; price: number } | null>(null)
const buyoutAmount = computed(() => {
  if (!buyoutPending.value) return 0
  return buyoutPending.value.hours * buyoutPending.value.price
})

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 台费暂停状态 — 后端返回 table_fee_paused (bool) + table_fee_paused_duration (秒)
const tableFeePaused = ref(false)
const pausedAt = ref<string | null>(null)
const pausedMinutes = computed(() => {
  if (!pausedAt.value) {
    // 若后端未返回 paused_at，用累计暂停秒数估算
    const sec = Number((bill.value as any)?.table_fee_paused_duration || 0)
    return sec > 0 ? Math.floor(sec / 60) : 0
  }
  const diff = Math.floor((Date.now() - new Date(pausedAt.value.replace('T', ' ')).getTime()) / 60000)
  return diff > 0 ? diff : 0
})

const statusLabelMap: Record<string, string> = {
  in_progress: '使用中',
  paused: '已暂停',
  pending: '待结算',
  settled: '已结账',
  cancelled: '已取消',
}

const statusLabel = computed(() => {
  if (pausedAt.value) return '已暂停计费'
  const status = bill.value?.status || ''
  return statusLabelMap[status] || status || '未知'
})

const orderStatus = computed(() => {
  if (pausedAt.value) return 'paused'
  return bill.value?.status || ''
})

// 真实账单状态，不受台费暂停影响 → 商品/助教面板用
const billStatus = computed(() => (bill.value as any)?.status || '')

const displayTime = computed(() => {
  const h = Math.floor(elapsedSeconds.value / 3600)
  const m = Math.floor((elapsedSeconds.value % 3600) / 60)
  const s = elapsedSeconds.value % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
})

// 纯服务端权威值，不做任何本地计算（与 POS 同款数据源）
const displayFee = computed(() => {
  return (tableFee.value + mergeFee.value + productFee.value + assistantFee.value + chargingFee.value).toFixed(2)
})

// POS 格式：所有费用字段扁平，直接读取
const tableFee = computed(() => {
  const prepaidHours = bill.value?.prepaid_hours || 0
  const remainingMin = bill.value?.remaining_minutes || 0
  if (prepaidHours > 0 && remainingMin > 0) return 0
  return Number(bill.value?.table_fee || 0)
})
const productFee = computed(() => Number(bill.value?.product_fee || 0))
const assistantFee = computed(() => Number(bill.value?.assistant_fee || 0))
const mergeFee = computed(() => Number(bill.value?.merge_fee || 0))
const chargingFee = computed(() => Number(bill.value?.charging_fee || 0))

const periodLabel = computed(() => getTimePeriodLabel())
const coefficient = computed(() => getCurrentCoefficient())

const hasPrepaid = computed(() => (bill.value?.prepaid_hours || 0) > 0)
const prepaidHours = computed(() => bill.value?.prepaid_hours || 0)
const prepaidAmount = computed(() => bill.value?.coupon_price || 0)

const hasDiscount = computed(() => {
  const rate = bill.value?.member_info?.discount_rate || 100
  return rate > 0 && rate < 100
})
const discountRate = computed(() => bill.value?.member_info?.discount_rate || 100)

const discountAmount = computed(() => {
  const original = tableFee.value
  const rate = discountRate.value
  if (rate >= 100) return 0
  return Math.round((original * (100 - rate) / 100) * 100) / 100
})

const transferSourceStats = computed(() => {
  const startTime = bill.value?.start_time
  if (!startTime) return null
  const durationMin = bill.value?.duration_minutes || elapsedSeconds.value / 60
  const h = Math.floor(durationMin / 60)
  const m = Math.floor(durationMin % 60)
  return {
    durationText: `${h}小时${m}分`,
    playerCount: bill.value?.customer_count || 0,
    tableFee: tableFee.value.toFixed(2),
    total: (tableFee.value + productFee.value + assistantFee.value).toFixed(2),
  }
})

// POS 格式 items：[{name, price, item_type, status, quantity, ...}]
const productItems = computed(() => {
  return (bill.value?.items || []).filter((i: any) => i.item_type === 'product')
})

// 对齐 wwwpos: assistant + assistant_overtime 都算助教服务
const assistantItems = computed(() => {
  return (bill.value?.items || []).filter((i: any) =>
    (i.item_type === 'assistant' || i.item_type === 'assistant_overtime') && i.status !== 'cancelled'
  )
})

function formatDateTime(dateStr?: string): string {
  return formatDateTimeFixed(dateStr)
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.floor(minutes % 60)
  return h > 0 ? `${h}小时${m}分` : `${m}分`
}

function updateElapsed() {
  const startTime = bill.value?.start_time
  if (!startTime) {
    elapsedSeconds.value = 0
    return
  }
  const parsed = parseDateLike(startTime)
  if (!parsed) {
    elapsedSeconds.value = 0
    return
  }
  const diff = Math.floor((Date.now() - parsed.getTime()) / 1000)
  elapsedSeconds.value = diff > 0 ? diff : 0
}

function updateNavTitle(name: string) {
  if (name) {
    uni.setNavigationBarTitle({ title: name })
  }
}

async function loadOrder() {
  if (!tableId.value) return
  try {
    const data = await getCurrentOrder(tableId.value)
    bill.value = data
    if (data?.id) {
      orderId.value = data.id
    }
    updateElapsed()

    // 同步暂停状态 — 读取后端返回的字段 (data 已脱壳，字段为 snake_case)
    const raw = data as Record<string, any>
    const feePaused = raw?.table_fee_paused ?? raw?.tableFeePaused ?? raw?.tablePaused
    tableFeePaused.value = feePaused === 1 || feePaused === true || feePaused === '1'
    if (raw?.table_paused_at || raw?.paused_at) {
      pausedAt.value = raw.table_paused_at || raw.paused_at
    } else if (!tableFeePaused.value) {
      pausedAt.value = null
    }

    const tableName = data?.table_name || ''
    if (tableName) {
      updateNavTitle(tableName)
    }
  } catch (e: any) {
    console.error('加载订单失败', e)
  }
}

async function loadTableName() {
  if (!tableId.value) return
  try {
    const data = await getTableDetail(tableId.value)
    const name = data?.name || ''
    if (name) {
      updateNavTitle(name)
    }
  } catch (e: any) {
    console.error('加载台桌信息失败', e)
  }
}

function startTimers() {
  if (timer) clearInterval(timer)
  if (refreshTimer) clearInterval(refreshTimer)
  timer = setInterval(() => {
    now.value = Date.now()
    updateElapsed()
  }, 1000)
  refreshTimer = setInterval(() => {
    loadOrder()
  }, 10000)
}

function clearTimers() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

async function handleDeliver(item: OrderItem) {
  try {
    await deliverProduct(item.id)
    uni.showToast({ title: '已送达', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

async function handleRemoveProduct(item: OrderItem) {
  uni.showModal({
    title: '确认移除',
    content: `确定要移除「${item.item_name}」吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        await removeProduct(item.id)
        uni.showToast({ title: '已移除', icon: 'success' })
        await loadOrder()
      } catch (e: any) {
        uni.showToast({ title: e.message || '操作失败', icon: 'none' })
      }
    },
  })
}

function handleAddProduct() {
  productSelector.value?.open()
}

async function handleAddProducts(items: { product_id: string; name: string; quantity: number }[]) {
  if (!orderId.value) return
  let successCount = 0
  let failCount = 0
  const results = await Promise.allSettled(items.map(item =>
    addProduct({ order_id: orderId.value, product_id: item.product_id, quantity: item.quantity })
  ))
  successCount = results.filter(r => r.status === 'fulfilled').length
  failCount = results.filter(r => r.status === 'rejected').length
  // Auto-deliver: reload order then deliver all pending products
  await loadOrder()
  const pendingItems = productItems.value.filter(i => !i.delivered_at)
  if (pendingItems.length > 0) {
    await Promise.allSettled(pendingItems.map(i => deliverProduct(i.id).catch(() => {})))
    await loadOrder()
  }
  if (failCount === 0) {
    uni.showToast({ title: `已添加${successCount}件商品`, icon: 'success' })
  } else {
    uni.showToast({ title: `成功${successCount}件，失败${failCount}件`, icon: 'none' })
  }
}

function handleAddAssistant() {
  assistantSelector.value?.open()
}

async function handleAddAssistantItem(assistant: any) {
  if (!orderId.value) return
  try {
    const isFlatRate = (assistant.billing_mode || 'realtime') === 'flat_rate'
    const isPrepaid = (assistant.pay_mode || 'postpaid') === 'prepaid'

    if (isFlatRate && isPrepaid) {
      // 先付固定：显示支付弹窗，用户确认后再调API
      buyoutPending.value = {
        id: assistant.id,
        name: assistant.name || '',
        hours: assistant.buyout_hours || 1,
        price: assistant.hourly_rate || 0,
      }
      buyoutPayChannel.value = 'cash'
      showBuyoutPay.value = true
      return // 等用户在弹窗中确认
    }
      const billingMode = assistant.billing_mode || 'realtime'
      // 对齐 wwwpos: 实时计费 auto_start=true 由后端直接确认+开始，无需再调用 confirm/start
      await addAssistant({
        order_id: orderId.value,
        assistant_id: assistant.id,
        billing_mode: billingMode,
        buyout_hours: assistant.buyout_hours || undefined,
        pay_mode: assistant.pay_mode || 'postpaid',
        auto_start: billingMode === 'realtime',
        pay_channel: assistant.pay_channel || 'cash',
      })
      uni.showToast({ title: isFlatRate ? '固定已下单' : '助教已上桌', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    const msg = e?.message || '添加失败'
    uni.showToast({ title: msg.includes('忙') ? '该助教已被抢占' : msg, icon: 'none' })
  }
}

async function confirmBuyoutPay() {
  if (!buyoutPending.value || !orderId.value) return
  buyoutPaying.value = true
  try {
    const res = await prepayAssistant({
      order_id: orderId.value,
      assistant_id: buyoutPending.value.id,
      buyout_hours: buyoutPending.value.hours,
      pay_channel: buyoutPayChannel.value,
      auto_start: true,
    }) as Record<string, unknown>
    const status = (res as any)?.status
    if (status === 'paid') {
      showBuyoutPay.value = false
      buyoutPending.value = null
      uni.showToast({ title: '固定支付成功', icon: 'success' })
      await loadOrder()
    } else {
      uni.showToast({ title: '支付失败，请重试', icon: 'none' })
    }
  } catch (e: any) {
    uni.showToast({ title: e?.message || '支付失败', icon: 'none' })
  } finally {
    buyoutPaying.value = false
  }
}

async function handleConfirmAssistant(item: OrderItem) {
  try {
    await confirmAssistant(item.id)
    uni.showToast({ title: '已接单', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

async function handleStartAssistant(item: OrderItem) {
  try {
    await startAssistant(item.id)
    uni.showToast({ title: '服务已开始', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

// 按条助教暂停/恢复 — 对齐 wwwpos TableDrawer handleTogglePauseAssistant
async function handleTogglePauseAssistant(item: OrderItem) {
  const oid = orderId.value
  if (!oid || !item.id) return
  try {
    if ((item as any).is_paused) {
      await resumeAssistantFee(oid, item.id)
    } else {
      await pauseAssistantFee(oid, item.id)
    }
    await loadOrder()
  } catch { /* no toast — same as wwwpos silent catch */ }
}

async function handleEndAssistant(item: OrderItem) {
  try {
    await endAssistant(item.id)
    uni.showToast({ title: '服务已结束', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

async function handleCancelAssistant(item: OrderItem) {
  // 买断/先付情况弹二次确认
  const isBuyout = (item as any).billing_mode === 'flat_rate' || (item as any).is_paid === 1
  if (isBuyout) {
    const res = await new Promise<boolean>(resolve => {
      uni.showModal({
        title: '确认取消',
        content: '取消已支付的助教服务将无法恢复，确定要取消吗？',
        success: (r) => resolve(!!r.confirm),
      })
    })
    if (!res) return
  }
  try {
    await cancelAssistant(item.id)
    uni.showToast({ title: '已取消', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

// 加钟
const showOvertimeModal = ref(false)
const overtimeItem = ref<OrderItem | null>(null)

function handleGiftAssistant(item: OrderItem) {
  overtimeItem.value = item
  showOvertimeModal.value = true
}

function onOvertimeSuccess() {
  loadOrder()
}

function handleTransfer() {
  transferMergeMode.value = 'transfer'
  showTransferMergeModal.value = true
}

function handleMerge() {
  transferMergeMode.value = 'merge'
  showTransferMergeModal.value = true
}

function handleTransferMergeSuccess() {
  // Reload order data after transfer/merge
  loadOrder()
}

function handleMemberClick() {
  memberSelector.value?.open()
}

async function handleBindMember(member: any) {
  try {
    await bindMember({ order_id: orderId.value, member_id: member.id || member.member_id })
    uni.showToast({ title: '会员绑定成功', icon: 'success' })
    await loadOrder()
  } catch (e: any) {
    uni.showToast({ title: e.message || '绑定失败', icon: 'none' })
  }
}

function handleCheckout() {
  showCheckoutModal.value = true
}

function handleCheckoutCompleted() {
  uni.showModal({
    title: '结账成功',
    content: '台桌已关闭',
    showCancel: false,
    success: () => { uni.navigateBack() }
  })
}

// 台费暂停/恢复 — 对齐 wwwpos TableDrawer handlePauseTable
// 台费暂停/恢复 — 对齐 wwwpos TableDrawer handlePauseTable
// 用 pausedAt (同步自 bill.table_paused_at) 作为方向判断
async function handlePause() {
  if (!orderId.value || !tableId.value) return
  try {
    if (pausedAt.value) {
      // 当前暂停中 → 恢复
      await resumeTableFee({ table_id: tableId.value, order_id: orderId.value })
      pausedAt.value = null
    } else {
      // 当前计费中 → 暂停
      await pauseTableFee({ table_id: tableId.value, order_id: orderId.value })
      pausedAt.value = new Date().toISOString()
    }
    await loadOrder()
  } catch { /* silent — same as wwwpos */ }
}

function handleResume() { handlePause() }

function goLog() {
  uni.navigateTo({ url: `/pages/table/log?table_id=${tableId.value}` })
}

onLoad((options: any) => {
  if (options?.table_id) {
    tableId.value = options.table_id
  }
  if (options?.order_id) {
    orderId.value = options.order_id
  }
})

onMounted(() => {
  loadTableName()
  loadOrder()
  startTimers()
})

onUnmounted(() => {
  clearTimers()
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
}

.status-card {
  margin: 28rpx 24rpx 0;
  padding: 34rpx 30rpx;
  background: linear-gradient(180deg, rgba(255,255,255,.95) 0%, rgba(255,255,255,.88) 100%);
  border-radius: 34rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
  border: 1rpx solid rgba(255,255,255,.78);
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 10rpx;

  .status-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #d1d5db;
  }

  &.in_progress .status-dot {
    background: #22c55e;
    box-shadow: 0 0 8rpx rgba(34, 197, 94, 0.4);
  }

  &.paused .status-dot {
    background: #f59e0b;
    box-shadow: 0 0 8rpx rgba(245, 158, 11, 0.4);
  }

  &.pending .status-dot {
    background: #f59e0b;
    box-shadow: 0 0 8rpx rgba(245, 158, 11, 0.4);
  }

  &.cancelled .status-dot {
    background: #ef4444;
  }
}

.status-label {
  font-size: 26rpx;
  font-weight: 700;
  color: #374151;
}

/* 暂停横幅 */
.pause-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 20rpx;
  margin-bottom: 18rpx;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-radius: 20rpx;
  border: 2rpx solid #fcd34d;
}

.pause-banner-icon {
  font-size: 32rpx;
}

.pause-banner-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #92400e;
}

.log-entry {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: #f3f6f5;
}

.log-text {
  font-size: 24rpx;
  color: #6b7280;
}

.log-arrow {
  font-size: 24rpx;
  color: #9ca3af;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36rpx;
  padding-top: 20rpx;
  margin-top: 8rpx;
  border-top: 1rpx solid #edf2f7;
}

.meta-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.meta-label {
  font-size: 22rpx;
  color: #94a3b8;
}

.meta-value {
  font-size: 26rpx;
  color: #334155;
  font-weight: 700;
}

.meta-divider {
  width: 1rpx;
  height: 40rpx;
  background: #e5e7eb;
}

.detail-body {
  flex: 1;
  padding: 22rpx 0 calc(env(safe-area-inset-bottom) + 192rpx);
}

.member-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx 30rpx;
  margin: 0 24rpx;
  background: rgba(255,255,255,.95);
  border-radius: 34rpx;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.05);
}

.member-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.member-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.member-title {
  font-size: 24rpx;
  color: #94a3b8;
}

.member-bound {
  font-size: 28rpx;
  color: #059669;
  font-weight: 600;
}

.member-unbound {
  font-size: 28rpx;
  color: #d1d5db;
}

.member-right {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.member-action {
  font-size: 26rpx;
  color: #059669;
  font-weight: 700;
}

.action-arrow {
  font-size: 26rpx;
  color: #9ca3af;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  backdrop-filter: blur(4rpx);
}

.checkout-popup {
  background: #fff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 32rpx 28rpx;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.popup-close {
  font-size: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkout-body {
  padding-bottom: env(safe-area-inset-bottom);
}

.checkout-total {
  font-size: 30rpx;
  text-align: center;
  margin-bottom: 28rpx;
  color: #374151;

  .price {
    color: #dc2626;
    font-weight: 700;
    font-size: 44rpx;
  }
}

.pay-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 28rpx;
}

.pay-input-row { display: flex; align-items: center; gap: 16rpx; margin-bottom: 16rpx; }
.pay-input-label { font-size: 26rpx; color: #6b7280; flex-shrink: 0; }
.pay-input { flex: 1; height: 80rpx; border: 2rpx solid #e5e7eb; border-radius: 18rpx; padding: 0 20rpx; font-size: 28rpx; background: #fff; }
.change-row { display: flex; justify-content: space-between; padding: 20rpx; background: #f0fdf4; border-radius: 18rpx; margin-bottom: 16rpx; }
.change-label { font-size: 26rpx; color: #059669; }
.change-value { font-size: 32rpx; font-weight: 700; color: #059669; }
.pay-method {
  flex: 1;
  min-width: 42%;
  padding: 28rpx 16rpx;
  text-align: center;
  background: #f3f4f6;
  border-radius: 20rpx;
  font-size: 26rpx;
  color: #374151;
  transition: all 0.15s ease;

  &.active {
    background: #ecfdf5;
    color: #059669;
    font-weight: 600;
    box-shadow: 0 0 0 2rpx #059669 inset;
  }
}

.btn-primary {
  width: 100%;
  padding: 30rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  border-radius: 22rpx;
  font-size: 30rpx;
  font-weight: 700;
  border: none;

  &[disabled] {
    opacity: 0.5;
  }
}

.fee-tag { font-size: 20rpx; padding: 4rpx 16rpx; border-radius: 20rpx; font-weight: 600; }
.tag-warn { background: #fef3c7; color: #92400e; }
.tag-cool { background: #dbeafe; color: #1e40af; }
.tag-discount { background: #fce7f3; color: #9d174d; }
.tag-prepaid { background: #e0e7ff; color: #3730a3; }
.tag-paused { background: #fef3c7; color: #92400e; }

/* 实时费用卡片 */
.fee-card {
  background: linear-gradient(135deg, #059669, #10b981);
  border-radius: 30rpx;
  padding: 36rpx 32rpx;
  margin: 18rpx 0;
  box-shadow: 0 16rpx 34rpx rgba(5,150,105,.22);
  transition: all 0.3s ease;
}
.fee-card--paused {
  background: linear-gradient(135deg, #92400e, #b45309);
  box-shadow: 0 16rpx 34rpx rgba(146,64,14,.25);
}

.fee-card-paused-badge {
  text-align: center;
  margin-bottom: 18rpx;
  padding: 10rpx 0;
  background: rgba(255,255,255,.15);
  border-radius: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #ffedd5;
}

.fee-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.fee-card-label { font-size: 24rpx; color: rgba(255,255,255,.8); }
.fee-card-timer { font-size: 24rpx; color: rgba(255,255,255,.9); }

.fee-card-amount {
  display: block;
  font-size: 68rpx;
  font-weight: 800;
  color: #fff;
  margin-bottom: 12rpx;
}

.fee-card-breakdown {
  display: block;
  font-size: 22rpx;
  color: rgba(255,255,255,.75);
  margin-bottom: 16rpx;
}

.fee-card-tags { display: flex; gap: 12rpx; flex-wrap: wrap; }

/* 账单汇总 */
.fee-paid-row { display: flex; justify-content: space-between; align-items: center; padding: 14rpx 0; margin-top: 12rpx; border-top: 1rpx solid rgba(0,0,0,.06); }
.fee-paid-label { font-size: 24rpx; color: #059669; }
.fee-paid-val { font-size: 28rpx; font-weight: 700; color: #059669; }
.fee-payable-row { display: flex; justify-content: space-between; align-items: center; margin-top: 6rpx; padding: 18rpx 20rpx; background: linear-gradient(135deg, #059669, #10b981); border-radius: 16rpx; }
.fee-payable-label { font-size: 26rpx; color: rgba(255,255,255,.85); font-weight: 600; }
.fee-payable-val { font-size: 36rpx; font-weight: 800; color: #fff; }

/* 台费明细 */
.section-card {
  margin: 0 24rpx 18rpx;
  padding: 34rpx 30rpx;
  background: rgba(255,255,255,.95);
  border-radius: 34rpx;
  box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}

.section-title { font-size: 32rpx; font-weight: 800; color: #111827; margin-bottom: 24rpx; }

.fee-detail-list { }

.fd-row { display: flex; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid #f3f4f6; }
.fd-row:last-child { border-bottom: none; }
.fd-row--total { border-top: 1rpx solid #e5e7eb; margin-top: 10rpx; padding-top: 20rpx; }

.fd-label { font-size: 26rpx; color: #6b7280; }
.fd-value { font-size: 26rpx; color: #374151; font-weight: 600; }

.emerald { color: #059669; }
.amber { color: #d97706; }
.blue { color: #2563eb; }
.rose { color: #e11d48; }
.fw-bold { font-weight: 700; }

/* 固定预付支付弹窗 */
.buyout-pay-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 999; display: flex; align-items: flex-end; }
.buyout-pay-modal { width: 100%; background: #fff; border-radius: 32rpx 32rpx 0 0; padding: 40rpx 32rpx 48rpx; }
.bpm-header { display: flex; justify-content: center; align-items: center; margin-bottom: 32rpx; position: relative; }
.bpm-title { font-size: 34rpx; font-weight: 700; color: #1e293b; }
.bpm-close { position: absolute; right: 0; font-size: 36rpx; color: #94a3b8; padding: 8rpx; }
.bpm-body { text-align: center; margin-bottom: 32rpx; }
.bpm-info { margin-bottom: 16rpx; }
.bpm-name { font-size: 30rpx; font-weight: 600; color: #1e293b; display: block; }
.bpm-detail { font-size: 24rpx; color: #94a3b8; margin-top: 8rpx; display: block; }
.bpm-amount { font-size: 64rpx; font-weight: 800; color: #059669; margin-bottom: 24rpx; }
.bpm-pay-label { display: inline-block; font-size: 24rpx; color: #64748b; background: #f8fafc; padding: 12rpx 32rpx; border-radius: 24rpx; }
.bpm-footer { display: flex; gap: 20rpx; }
.bpm-btn-cancel { flex: 1; padding: 28rpx; border-radius: 36rpx; background: #f1f5f9; color: #64748b; font-size: 28rpx; text-align: center; border: none; }
.bpm-btn-pay { flex: 2; padding: 28rpx; border-radius: 36rpx; background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-size: 30rpx; font-weight: 700; text-align: center; border: none; }
.bpm-btn-pay[disabled] { opacity: .5; }
</style>
