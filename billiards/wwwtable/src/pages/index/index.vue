<template>
  <view class="container">
    <!-- 背景效果 -->
    <view class="scan-line"></view>
    <view class="particles">
      <view class="particle" v-for="n in 8" :key="n" :style="{ animationDelay: `${n * 0.5}s` }"></view>
    </view>

    <!-- 开台成功动画 -->
    <OpenAnimation
      :visible="showOpenAnimation"
      :type="openAnimationType"
      :message="openAnimationMessage"
      @close="closeOpenAnimation"
    />

    <!-- 开台确认弹窗 -->
    <ConfirmModal
      :visible="confirmFlow.showConfirmModal.value"
      :state="confirmFlow.confirmState.value"
      :countdown="confirmFlow.countdown.value"
      :timeout-minutes="confirmFlow.timeoutMinutes.value"
      @cancel="confirmFlow.cancelConfirm()"
      @close="confirmFlow.handleConfirmClose()"
    />

    <Skeleton v-if="false" :card-count="2" :show-footer="true" />

    <template v-else>
      <!-- Sticky Header -->
      <view class="sticky-header">
        <view class="header-card">
          <view class="header-row">
            <view class="header-left">
              <view class="header-icon-wrap">
                <view class="icon-glow"></view>
                <text class="icon-text">🎱</text>
              </view>
              <view class="header-title-wrap">
                <text class="header-title">台桌大屏</text>
                <text class="header-subtitle">桌台 {{ tableNumber }} · ¥{{ tableHourlyRate }}/时</text>
              </view>
            </view>
            <view class="header-right">
              <view class="ws-indicator" :class="wsState">
                <view class="ws-dot"></view>
                <text class="ws-text">{{ wsState === 'connected' ? '在线' : wsState === 'connecting' ? '连接中' : '离线' }}</text>
              </view>
              <view class="header-time">
                <text class="time-value">{{ currentTime }}</text>
                <text class="time-date">{{ currentDate }}</text>
              </view>
              <view class="settings-btn" @tap="goToSettings"><text>⚙️</text></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 空闲态：欢迎页 -->
      <WelcomeHero
        v-if="!hasActiveOrder"
        :table-number="tableNumber"
        :table-hourly-rate="tableHourlyRate"
        @product="goToProduct()"
        @assistant="goToAssistant()"
        @score="goToScore()"
        @service="callWaiter"
        @quick-create="handleQuickCreate"
      />

      <!-- 活跃态：订单仪表盘 -->
      <OrderDashboard
        v-else
        :table-number="tableNumber"
        :is-prepaid="isPrepaid"
        :formatted-duration="formattedDuration"
        :formatted-remaining="formattedRemaining"
        :timer-progress="timerProgress"
        :prepaid-hours="currentOrder?.prepaid_hours || 0"
        :total-fee="orderStore.totalFee"
        :paid-amount="currentOrder?.paid_amount || 0"
        :payable-amount="currentOrder?.payable_amount || orderStore.totalFee"
        :display-table-fee="displayTableFee"
        :table-hourly-rate="tableHourlyRate"
        :current-rate="orderStore.currentRate"
        :product-fee="orderStore.productFee"
        :product-count="productItemsCount"
        :assistant-fee="orderStore.assistantFee"
        :has-assistant-items="orderStore.hasAssistantItems"
        :assistant-count="assistantServicesCount"
        :charging-enabled="chargingEnabled"
        :charging-fee="Number(currentOrder?.charging_fee || 0)"
        :charging-active-ports="chargingActivePorts"
        :member-info="memberBinding.memberInfo.value"
        :show-member-q-r="memberBinding.showMemberQR.value"
        :member-qr-url="memberBinding.memberQrUrl.value"
        :start-time="formatTime(currentOrder?.start_time)"
        :customer-count="currentOrder?.customer_count || 2"
        @checkout="goToCheckout()"
        @product-click="handleProductClick"
        @assistant-click="handleAssistantClick"
        @charging-click="handleChargingClick"
        @show-member-qr="memberBinding.showMemberQR.value = true"
        @hide-member-qr="memberBinding.showMemberQR.value = false"
      />

      <!-- 商品弹窗 -->
      <ContentModal :visible="showProductItemsModal" title="已点商品" @close="showProductItemsModal = false">
        <view class="modal-item-row" v-for="item in groupedProductItems" :key="item.id">
          <image v-if="item.image" :src="item.image" mode="aspectFill" style="width:128rpx;height:128rpx;border-radius:12rpx;" />
          <text v-else class="modal-item-emoji">📦</text>
          <view class="modal-item-info">
            <text class="modal-item-name">{{ item.name }}</text>
            <text class="modal-item-sub" style="font-size:28rpx;">x{{ item.quantity }} · ¥{{ formatPrice(item.unit_price || 0) }}/件</text>
          </view>
          <text class="modal-item-price">¥{{ formatPrice(item.total_price) }}</text>
        </view>
        <template #footer>
          <view style="display:flex;justify-content:space-between;align-items:center;padding:0 8rpx;">
            <text style="font-size:32rpx;color:#ffd700;font-weight:600;">商品费：¥{{ formatPrice(orderStore.productFee) }}</text>
            <view style="padding:16rpx 40rpx;border-radius:28rpx;background:rgba(255,255,255,.03);border:2rpx solid #4b5563;color:#e0e0f0;font-size:32rpx;font-weight:600;" @click="showProductItemsModal = false">关闭</view>
          </view>
        </template>
      </ContentModal>

      <!-- 助教服务弹窗 -->
      <ContentModal :visible="showAssistantServicesModal" title="助教服务" @close="showAssistantServicesModal = false">
        <view class="as-item" v-for="item in assistantOrdersDetail" :key="item.item_id || item.id" style="padding:24rpx 0;">
          <view class="as-avatar" style="width:80rpx;height:80rpx;border-radius:50%;overflow:hidden;flex-shrink:0;">
            <image v-if="item.assistant_avatar" :src="item.assistant_avatar" mode="aspectFill" style="width:100%;height:100%;" />
            <text v-else style="font-size:48rpx;line-height:80rpx;text-align:center;display:block;">👨‍🏫</text>
          </view>
          <view class="as-info" style="flex:1;">
            <text class="as-name" style="font-size:32rpx;font-weight:700;">{{ item.assistant_name }}</text>
            <view class="as-meta" style="margin-top:6rpx;">
              <text class="as-rate" style="font-size:28rpx;color:#feca57;">¥{{ item.hourly_rate }}/h</text>
              <text class="as-status" :class="item.status" style="font-size:26rpx;margin-left:12rpx;">{{ asStatusLabel(item.status) }}</text>
            </view>
            <text class="as-time" v-if="item.started_at" style="font-size:26rpx;color:rgba(255,255,255,.5);margin-top:4rpx;">
              开始 {{ formatStartTime(item.started_at) }}
              <template v-if="item.status === 'serving'"> · 已服务 {{ calcServingDuration(item.started_at) }}</template>
            </text>
          </view>
          <view class="as-actions" v-if="item.status === 'processing'">
            <button class="as-start-btn" :disabled="startingAssistantId === item.item_id" @click="startAssistantService(item.item_id)" style="padding:12rpx 24rpx;border-radius:16rpx;font-size:28rpx;font-weight:600;">
              {{ startingAssistantId === item.item_id ? '处理中...' : '开始服务' }}
            </button>
          </view>
          <view class="as-actions" v-if="item.status === 'serving'">
            <button class="as-end-btn" :disabled="endingAssistantId === item.item_id" @click="endAssistantService(item.item_id)" style="padding:12rpx 24rpx;border-radius:16rpx;font-size:28rpx;font-weight:600;">
              {{ endingAssistantId === item.item_id ? '处理中...' : '结束服务' }}
            </button>
          </view>
          <text class="as-price" v-if="item.status === 'completed'" style="font-size:36rpx;font-weight:700;color:#feca57;">¥{{ formatPrice(item.final_price || 0) }}</text>
        </view>
        <view v-if="assistantOrdersDetail.length === 0" style="text-align:center;padding:80rpx 0;">
          <text style="font-size:32rpx;color:rgba(255,255,255,.4);">暂无进行中的助教服务</text>
        </view>
        <template #footer>
          <view style="display:flex;justify-content:space-between;align-items:baseline;padding:0 8rpx;">
            <text style="font-size:32rpx;color:rgba(255,255,255,.5);">助教费</text>
            <text style="font-size:56rpx;font-weight:800;color:#feca57;">¥{{ formatPrice(orderStore.assistantFee) }}</text>
          </view>
          <view style="height:96rpx;border-radius:28rpx;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7);border:2rpx solid rgba(255,255,255,.1);font-size:36rpx;font-weight:700;margin-top:12rpx;" @click="showAssistantServicesModal = false">关闭</view>
        </template>
      </ContentModal>

      <!-- 充电弹窗 -->
      <ChargingModal
        :visible="showChargingModal"
        :billing-desc="chargingBillingDesc"
        :fee="chargingFee"
        :sessions="chargingSessions"
        :get-port-status="getPortStatus"
        :get-port-status-text="getPortStatusText"
        :get-port-elapsed="getPortElapsed"
        @close="showChargingModal = false"
        @start="startChargingPort"
        @stop="stopChargingPort"
      />
    </template>

    <!-- 呼叫服务员 -->
    <view class="call-waiter-btn-wrap">
      <view class="call-waiter-btn" :class="{ calling: isCallingWaiter }" @click="callWaiter">
        <view class="btn-glow-ring" v-if="isCallingWaiter"></view>
        <view class="btn-pulse-ring" v-if="isCallingWaiter"></view>
        <view class="call-icon-wrap">
          <view class="icon-glow"></view>
          <text class="call-icon">{{ isCallingWaiter ? '⏳' : '🛎️' }}</text>
        </view>
      </view>
    </view>

    <AlertModal
      :visible="showCancelWaiterModal"
      icon="🛎️"
      title="确定要取消呼叫服务员吗？"
      message="取消后服务员可能仍在赶来途中"
      confirm-text="确定取消"
      cancel-text="继续等待"
      :confirm-danger="true"
      @confirm="showCancelWaiterModal = false; cancelWaiterCall()"
      @cancel="showCancelWaiterModal = false"
    />
  </view>
</template>

<script setup lang="ts">
/**
 * 首页仪表盘 — 球房点单大屏核心页面
 *
 * 结构：组合 6 个子组件 + 3 个 composable + 2 个页面级 composable
 *   WelcomeHero      — 空闲态欢迎页
 *   OrderDashboard   — 活跃订单仪表盘（内含 TimerSection/FeeGrid/FeeSummaryCard/MemberBlock）
 *   ConfirmModal     — 开台确认弹窗
 *   ChargingModal    — 充电管理弹窗
 *   ContentModal     — 商品/助教详情弹窗
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authStore } from '@/stores/auth'
import { orderStore } from '@/stores/order'
import { tabletApi } from '@/api'
import { tableWs } from '@/utils/websocket'
import { initNetwork, onReconnected, isOnline } from '@/utils/network'
import { offlineCache } from '@/utils/offline-cache'
import { useTabState } from '@/stores/tabState'

import Skeleton from '@/components/Skeleton.vue'
import OpenAnimation from '@/components/OpenAnimation.vue'
import ContentModal from '@/components/standard/ContentModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'

import WelcomeHero from './components/WelcomeHero.vue'
import OrderDashboard from './components/OrderDashboard.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import ChargingModal from './components/ChargingModal.vue'

import { useOrderDashboard } from '@/composables/useOrderDashboard'
import { useCharging } from '@/composables/useCharging'
import { useServiceCall } from '@/composables/useServiceCall'
import { useHomeModals } from '@/composables/useHomeModals'
import { useConfirmFlow } from './composables/useConfirmFlow'
import { useMemberBinding } from './composables/useMemberBinding'
import { formatPrice } from '@/utils/format'

// ==================== Composables ====================

const tab = useTabState('index')

const dashboard = useOrderDashboard()
const charging = useCharging()
const serviceCall = useServiceCall()
const modals = useHomeModals()

// Destructure dashboard
const {
  tableNumber, tableHourlyRate, activities, isLoading,
  durationMinutes, feeTick,
  showOpenAnimation, openAnimationType, openAnimationMessage,
  hasActiveOrder, currentOrder, isPrepaid,
  displayTableFee, formattedDuration, formattedRemaining,
  timerProgress,
  goToProduct, goToAssistant, goToScore, goToCheckout,
  closeOpenAnimation,
  loadCurrentOrder, loadTableStatus, loadActivities,
  startDurationTimer, dispose: disposeDashboard,
} = dashboard

// Destructure charging
const {
  showChargingModal, chargingEnabled, chargingFee, chargingActivePorts, chargingSessions,
  getPortStatus, getPortStatusText, getPortElapsed,
  startChargingPort, stopChargingPort, chargingBillingDesc,
  loadChargingStatus,
  init: initCharging, dispose: disposeCharging,
} = charging

// Destructure serviceCall
const {
  isCallingWaiter, showCancelWaiterModal,
  callWaiter, cancelWaiterCall,
  dispose: disposeServiceCall,
} = serviceCall

// Destructure modals
const {
  showProductItemsModal, showAssistantServicesModal,
  assistantOrdersDetail,
  productOnlyItems,
  productItemsCount, assistantServicesCount,
  handleProductClick, handleAssistantClick,
  endAssistantService, endingAssistantId,
  startAssistantService, startingAssistantId,
  loadAssistantOrdersDetail,
  formatStartTime, calcServingDuration, asStatusLabel,
} = modals

// 页面级 composable：开台确认流程
const confirmFlow = useConfirmFlow(() => {
  dashboard.loadCurrentOrder(false)
  dashboard.startDurationTimer()
})

// 页面级 composable：会员扫码绑定
const memberBinding = useMemberBinding()

// 已点商品：按商品名合并同款
const groupedProductItems = computed(() => {
  const map = new Map<string, any>()
  const items = (productOnlyItems as any).value || productOnlyItems || []
  for (const item of items) {
    const key = item.name || item.item_name || item.product_name || item.id
    if (map.has(key)) {
      const m = map.get(key)
      m.quantity += (item.quantity || 0)
      m.total_price += Number(item.price || item.final_price || item.total_price || 0)
    } else {
      map.set(key, {
        id: item.id,
        name: item.name || item.item_name || item.product_name || '商品',
        image: (item as any).image || '',
        quantity: item.quantity || 0,
        unit_price: Number(item.price || item.final_price || 0) / Math.max(1, item.quantity || 1),
        total_price: Number(item.price || item.final_price || item.total_price || 0),
      })
    }
  }
  return [...map.values()]
})

// ==================== 页面级状态 ====================

const wsState = ref<'connected' | 'connecting' | 'disconnected'>('disconnected')
const currentTime = ref('')
const currentDate = ref('')

const updateTime = () => {
  const now = new Date()
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  currentDate.value = `${now.getMonth() + 1}月${now.getDate()}日 周${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`
}
updateTime()
setInterval(updateTime, 30000)

function playSound(type: 'click' | 'success' | 'error' | 'warning') {
  try { uni.vibrateShort({ type: type === 'click' ? 'light' : 'heavy' } as any) } catch {}
}
const goToSettings = () => uni.navigateTo({ url: '/pages/settings/index' })

function formatTime(dateStr?: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// ==================== 一键开台 ====================

const handleQuickCreate = async () => {
  playSound('click')
  const result: any = await dashboard.handleQuickCreate()
  if (result?.need_confirm) {
    confirmFlow.startConfirm(result)
    return
  }
}

// ==================== 充电入口 ====================

const handleChargingClick = async () => {
  playSound('click')
  const ok = await charging.loadChargingConfig(true)
  if (!ok) return
  charging.showChargingModal.value = true
  await charging.loadChargingStatus()
  await charging.syncHardware()
}

// ==================== WebSocket ====================

function onOrderItemStatusChange(data: any) {
  dashboard.loadCurrentOrder(false)
}

function onServiceCallResponse(data: any) {
  const responder = data.responder || '服务员'
  uni.showModal({
    title: '服务回复',
    content: `${responder}: ${data.response_text || '已接单，请稍候'}`,
    showCancel: false,
  })
}

tableWs.on('table_released', async (data: any) => {
  console.log('[index] 收到换台通知', data)
  try {
    const order = await orderStore.getTableOrder(false)
    if (!order) uni.showToast({ title: '订单已转走，返回欢迎页', icon: 'none', duration: 2000 })
  } catch {
    orderStore.releaseTable('transferred')
  }
})

// ==================== 生命周期 ====================

let statusTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // 离线韧性
  initNetwork()
  offlineCache.init()
  onReconnected(() => { if (orderStore.isOrderActive) dashboard.loadCurrentOrder(false) })
  if (isOnline.value) offlineCache.refreshAll()
  setInterval(() => { if (isOnline.value) offlineCache.refreshAll() }, 15 * 60 * 1000)

  // 首页数据
  if (!tab.loaded) dashboard.isLoading.value = true
  await Promise.all([
    dashboard.loadTableStatus(),
    dashboard.loadCurrentOrder(),
    dashboard.loadActivities(),
  ])
  tab.markLoaded()
  dashboard.isLoading.value = false
  dashboard.startDurationTimer()

  // 充电初始化
  charging.init()

  // 10s 定期刷新
  statusTimer = setInterval(() => {
    dashboard.loadTableStatus()
    dashboard.loadCurrentOrder(false)
  }, 10000)

  // WebSocket
  const tableId = authStore.tableId
  if (tableId) {
    tableWs.setOnOrderItemStatusChange(onOrderItemStatusChange)
    tableWs.setOnServiceCallResponse(onServiceCallResponse)
    wsState.value = 'connecting'
    tableWs.connect(tableId).then(() => {
      wsState.value = 'connected'
      tableWs.on('order_update', (data) => {
        if (orderStore.order.value) {
          if (data.table_fee !== undefined) orderStore.order.value.table_fee = data.table_fee
          if (data.product_fee !== undefined) orderStore.order.value.product_fee = data.product_fee
          if (data.duration_minutes !== undefined) orderStore.durationMinutes.value = data.duration_minutes
          if (data.total_amount !== undefined) orderStore.order.value.total_fee = data.total_amount
        }
      })
      tableWs.on('notification', (data) => {
        if (data?.title) uni.showToast({ title: data.title, icon: 'none', duration: 3000 })
      })
      tableWs.on('payment_success', (data) => {
        if (data?.order_id === orderStore.order.value?.id) {
          uni.showToast({ title: '支付成功！', icon: 'success' })
          charging.showChargingModal.value = false
          charging.loadChargingStatus()
        }
      })
      tableWs.on('service_call_ack', () => {
        uni.showToast({ title: '已通知服务员，请稍候', icon: 'success', duration: 2000 })
      })
    }).catch((err) => { console.error('[Index] WebSocket failed:', err) })
  }
})

onUnmounted(() => {
  if (statusTimer) clearInterval(statusTimer)
  disposeDashboard()
  disposeCharging()
  disposeServiceCall()
  tableWs.off('service_call_ack', () => {})
  tableWs.off('table_released', () => {})
  tableWs.disconnect()
})
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

// ======== 背景效果 ========
.scan-line {
  position: fixed; top: 0; left: 0; right: 0; height: 4rpx;
  background: linear-gradient(90deg, transparent, rgba(201, 169, 98, 0.6), transparent);
  animation: scanLine 4s linear infinite; z-index: 9999; pointer-events: none;
}

.particles {
  position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
  .particle {
    position: absolute; width: 8rpx; height: 8rpx; background: rgba(201, 169, 98, 0.4);
    border-radius: 50%; animation: particleFloat 8s ease-in-out infinite;
    &:nth-child(1) { left: 10%; top: 20%; animation-duration: 10s; }
    &:nth-child(2) { left: 20%; top: 60%; animation-duration: 8s; animation-delay: 1s; }
    &:nth-child(3) { left: 35%; top: 30%; animation-duration: 12s; animation-delay: 2s; }
    &:nth-child(4) { left: 50%; top: 70%; animation-duration: 9s; animation-delay: 0.5s; }
    &:nth-child(5) { left: 65%; top: 25%; animation-duration: 11s; animation-delay: 1.5s; }
    &:nth-child(6) { left: 75%; top: 55%; animation-duration: 7s; animation-delay: 2.5s; }
    &:nth-child(7) { left: 85%; top: 40%; animation-duration: 10s; animation-delay: 3s; }
    &:nth-child(8) { left: 90%; top: 80%; animation-duration: 8s; animation-delay: 0.8s; }
  }
}

@keyframes scanLine {
  0% { transform: translateY(-10rpx); opacity: 0; }
  10% { opacity: 1; } 90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}

@keyframes particleFloat {
  0%,100%{transform:translateY(0)translateX(0)scale(1);opacity:.3}
  25%{transform:translateY(-40rpx)translateX(10rpx)scale(1.2);opacity:.8}
  50%{transform:translateY(-20rpx)translateX(-5rpx)scale(.8);opacity:.5}
  75%{transform:translateY(-50rpx)translateX(15rpx)scale(1.1);opacity:.7}
}

// ======== 容器 ========
.container {
  height: 100vh; display: flex; flex-direction: column;
  position: relative; z-index: 1; overflow: hidden;
}

// ======== Sticky Header ========
.sticky-header { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 20rpx 24rpx; }

.header-card {
  background: linear-gradient(145deg, rgba(26,26,46,.9), rgba(20,20,40,.95));
  border-radius: 48rpx; padding: 36rpx 40rpx;
  border: 3rpx solid rgba(201,169,98,.15);
  box-shadow: 0 12rpx 48rpx rgba(0,0,0,.35), 0 0 40rpx rgba(201,169,98,.08), inset 0 1rpx 0 rgba(255,255,255,.05);
  backdrop-filter: blur(20rpx);
}

.header-row { display: flex; align-items: center; justify-content: space-between; gap: 32rpx; }
.header-left { display: flex; align-items: center; gap: 28rpx; flex-shrink: 0; }

.header-icon-wrap { position: relative; width: 80rpx; height: 80rpx; display: flex; align-items: center; justify-content: center; }
.header-icon-wrap .icon-glow { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(201,169,98,.4) 0%, transparent 70%); border-radius: 50%; animation: iconPulse 3s ease-in-out infinite; }
.header-icon-wrap .icon-text { position: relative; z-index: 1; font-size: 56rpx; filter: drop-shadow(0 4rpx 16rpx rgba(201,169,98,.4)); }

.header-title-wrap { display: flex; flex-direction: column; gap: 8rpx; }
.header-title { font-size: 56rpx; font-weight: 700; color: #fff; letter-spacing: 3rpx; }
.header-subtitle { font-size: 32rpx; color: rgba(201,169,98,.7); font-weight: 500; }

.header-right { display: flex; align-items: center; gap: 24rpx; flex-shrink: 0; }

// WS 指示器
.ws-indicator {
  display: flex; align-items: center; gap: 10rpx; padding: 12rpx 24rpx;
  border-radius: 32rpx; background: rgba(0,0,0,.4); backdrop-filter: blur(10rpx);
  border: 2rpx solid rgba(255,255,255,.08);
  .ws-dot { width: 14rpx; height: 14rpx; border-radius: 50%; transition: all .3s; }
  .ws-text { font-size: 26rpx; color: #8a8a9a; font-weight: 500; }
  &.connected { background: rgba(34,197,94,.25); border-color: rgba(34,197,94,.3);
    .ws-dot { background: #2ed573; box-shadow: 0 0 12rpx #2ed573; animation: wsPulse 2s infinite; }
    .ws-text { color: #2ed573; }
  }
  &.connecting { .ws-dot { background: #ffa502; animation: wsPulse 1s infinite; } .ws-text { color: #ffa502; } }
  &.disconnected { .ws-dot { background: #ff4757; } .ws-text { color: #ff4757; } }
}

@keyframes wsPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }

.header-time { display: flex; flex-direction: column; align-items: flex-end; gap: 6rpx;
  .time-value { font-size: 44rpx; font-weight: 700; color: #fff; letter-spacing: 3rpx; font-family: 'Courier New', monospace; text-shadow: 0 2rpx 12rpx rgba(201,169,98,.3); }
  .time-date { font-size: 24rpx; color: #8a8a9a; font-weight: 500; }
}

.settings-btn {
  width: 88rpx; height: 88rpx; background: linear-gradient(145deg, rgba(45,45,80,.8), rgba(35,35,65,.9));
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 3rpx solid rgba(201,169,98,.25); box-shadow: 0 10rpx 32rpx rgba(0,0,0,.35), inset 0 2rpx 0 rgba(255,255,255,.08);
  &:active { transform: scale(.94); background: linear-gradient(145deg, rgba(201,169,98,.3), rgba(201,169,98,.15)); }
  text { font-size: 40rpx; }
}

// ======== 弹窗通用样式 ========
.modal-item-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0; border-bottom: 2rpx solid rgba(255,255,255,.05);
  &:last-child { border-bottom: none; }
}
.modal-item-emoji { font-size: 36rpx; width: 48rpx; text-align: center; }
.modal-item-info { flex: 1; min-width: 0; .modal-item-name { display: block; font-size: 32rpx; color: #fff; } }
.modal-item-price { font-size: 28rpx; color: #ffd700; font-weight: 600; white-space: nowrap; }

// ======== 助教弹窗 ========
.as-item { display: flex; align-items: center; gap: 20rpx; padding: 22rpx 0; border-bottom: 1px solid rgba(255,255,255,.05);
  &:last-child { border-bottom: none; }
}
.as-avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: linear-gradient(145deg, rgba(40,40,70,.5), rgba(32,32,58,.6)); display: flex; align-items: center; justify-content: center; font-size: 36rpx; flex-shrink: 0; }
.as-status {
  font-size: 22rpx; padding: 3rpx 12rpx; border-radius: 10rpx; font-weight: 600;
  &.pending { background: rgba(245,158,11,.15); color: #f59e0b; }
  &.processing { background: rgba(59,130,246,.15); color: #3b82f6; }
  &.serving { background: rgba(34,197,94,.15); color: #22c55e; }
  &.completed { background: rgba(255,255,255,.06); color: rgba(255,255,255,.4); }
}

// ======== 呼叫服务员按钮 ========
.call-waiter-btn-wrap { position: fixed; right: 32rpx; bottom: 320rpx; z-index: 9999; }
.call-waiter-btn {
  position: relative; width: 180rpx; height: 180rpx;
  background: linear-gradient(135deg, rgba(201,169,98,.95), rgba(138,109,59,.9));
  border-radius: 50%; border: 4rpx solid rgba(255,255,255,.3);
  box-shadow: 0 24rpx 72rpx rgba(201,169,98,.5), 0 0 60rpx rgba(201,169,98,.3), inset 0 4rpx 8rpx rgba(255,255,255,.3), inset 0 -4rpx 8rpx rgba(0,0,0,.2);
  display: flex; align-items: center; justify-content: center;
  transition: all .4s cubic-bezier(.4,0,.2,1);
  &:active { transform: scale(.92); box-shadow: 0 12rpx 36rpx rgba(201,169,98,.4), 0 0 30rpx rgba(201,169,98,.2), inset 0 4rpx 8rpx rgba(255,255,255,.2), inset 0 -4rpx 8rpx rgba(0,0,0,.3); }
  .call-icon-wrap { position: relative; width: 120rpx; height: 120rpx; display: flex; align-items: center; justify-content: center;
    .icon-glow { position: absolute; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,.5) 0%, transparent 70%); border-radius: 50%; animation: iconPulse 3s ease-in-out infinite; }
    .call-icon { position: relative; z-index: 1; font-size: 72rpx; filter: drop-shadow(0 4rpx 12rpx rgba(0,0,0,.3)); }
  }
  &.calling {
    background: linear-gradient(135deg, rgba(245,158,11,.95), rgba(217,119,6,.9)); border-color: rgba(255,255,255,.4);
    box-shadow: 0 24rpx 72rpx rgba(245,158,11,.5), 0 0 60rpx rgba(245,158,11,.3), inset 0 4rpx 8rpx rgba(255,255,255,.3), inset 0 -4rpx 8rpx rgba(0,0,0,.2);
    .btn-glow-ring { position: absolute; inset: -16rpx; border-radius: 50%; border: 4rpx solid rgba(245,158,11,.6); animation: ringExpand 1.5s ease-out infinite; }
    .btn-pulse-ring { position: absolute; inset: -10rpx; border-radius: 50%; border: 3rpx solid rgba(245,158,11,.4); animation: ringExpand 1.5s ease-out infinite .5s; }
  }
}

@keyframes iconPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.3);opacity:1} }
@keyframes ringExpand { 0%{transform:scale(1);opacity:.8} 100%{transform:scale(1.3);opacity:0} }
</style>
