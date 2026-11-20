/**
 * useOrderDashboard — 首页仪表盘核心数据
 *
 * 职责: 桌台状态加载 / 订单数据管理 / 计时器 / 费用计算 / 活动列表
 */
import { ref, computed, onUnmounted } from 'vue'
import { authStore } from '@/stores/auth'
import { orderStore } from '@/stores/order'
import { cartStore } from '@/stores/cart'
import { tabletApi } from '@/api'
import { TABLE_STATUS } from '@/constants/tableStatus'

export function useOrderDashboard() {
  // ---- 基础状态 ----
  const tableNumber = ref('01')
  const tableStatus = ref('idle')
  const tableHourlyRate = ref(38)
  const activities = ref<any[]>([])
  const isLoading = ref(true)
  const durationMinutes = ref(0)

  // ---- 开台动画 ----
  const showOpenAnimation = ref(false)
  const openAnimationType = ref<'quick' | 'prepaid'>('quick')
  const openAnimationMessage = ref('')

  // ---- 计算属性 ----
  const hasActiveOrder = computed(() => orderStore.isOrderActive)
  const currentOrder = computed(() => orderStore.order.value)
  const isPrepaid = computed(() => orderStore.isPrepaid)

  const displayTotalFee = computed(() => orderStore.totalFee.toFixed(2))
  const displayTableFee = computed(() => (orderStore.tableFee + Number(orderStore.order.value?.merge_fee || 0)).toFixed(2))

  const formattedDuration = computed(() => {
    const hours = Math.floor(durationMinutes.value / 60)
    const mins = durationMinutes.value % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  })

  const formattedRemaining = computed(() => orderStore.formattedRemaining)

  const timerProgress = computed(() => {
    if (isPrepaid.value && orderStore.order.value?.prepaid_hours) {
      const totalMinutes = orderStore.order.value.prepaid_hours * 60
      return Math.min(100, (durationMinutes.value / totalMinutes) * 100)
    }
    return Math.min(100, (durationMinutes.value / (24 * 60)) * 100)
  })

  const cartCount = computed(() => cartStore.cartCount)

  // ---- 状态文本 ----
  const statusText = computed(() => {
    const s = tableStatus.value?.toString().toLowerCase().trim()
    const map: Record<string, string> = {
      idle: '空闲', normal: '空闲', available: '空闲', free: '空闲', '0': '空闲',
      occupied: '使用中', using: '使用中', busy: '使用中', in_use: '使用中', '1': '使用中',
      reserved: '已预订', booked: '已预订', '2': '已预订',
      maintenance: '维护中', repair: '维护中', broken: '维护中', '3': '维护中',
    }
    return map[s] || '未知'
  })

  // ---- 数据加载 ----
  async function loadTableStatus() {
    try {
      const tableInfo = authStore.tableInfo
      if (tableInfo) {
        tableNumber.value = tableInfo.name || '01'
        tableStatus.value = tableInfo.status || TABLE_STATUS.IDLE
        tableHourlyRate.value = Number(tableInfo.hourly_rate) || 0
        orderStore.setTableInfo({
          status: tableInfo.status as string,
          name: tableInfo.name,
          hourly_rate: tableInfo.hourly_rate,
        })
      }
      const res = await tabletApi.getHomeData()
      if (res) {
        if (res.status) tableStatus.value = res.status
        if (res.table?.status) tableStatus.value = res.table.status
        if (res.has_active_order && res.order) {
          orderStore.order.value = res.order
          orderStore.orderItems.value = res.order.items || []
          if (res.order.start_time) {
            const startTime = new Date(res.order.start_time).getTime()
            durationMinutes.value = Math.floor((Date.now() - startTime) / 60000)
          }
          if (res.order.remaining_minutes) {
            orderStore.remainingMinutes.value = res.order.remaining_minutes
          }
        }
      }
    } catch (e) {
      console.error('加载桌台状态失败', e)
    }
  }

  async function loadCurrentOrder(showLoading = true) {
    try {
      await orderStore.getTableOrder(showLoading)
      if (orderStore.order.value?.start_time) {
        const startTime = new Date(orderStore.order.value.start_time).getTime()
        durationMinutes.value = Math.floor((Date.now() - startTime) / 60000)
      }
      updateTableStatus()
    } catch (e) {
      console.error('加载订单失败', e)
    }
  }

  function updateTableStatus() {
    if (orderStore.isOrderActive) {
      tableStatus.value = TABLE_STATUS.OCCUPIED
      orderStore.tableStatus.value = 'occupied'
    } else {
      const info = authStore.tableInfo
      tableStatus.value = info?.status || TABLE_STATUS.IDLE
      orderStore.tableStatus.value = (info?.status as any) || 'idle'
    }
  }

  async function loadActivities() {
    try {
      const data = await tabletApi.getActivities()
      if (data && data.list) {
        activities.value = data.list.slice(0, 5)
      } else if (Array.isArray(data)) {
        activities.value = data.slice(0, 5)
      }
    } catch (e) {
      console.error('加载活动失败', e)
      activities.value = []
    }
  }

  // ---- 开台 ----
  async function handleQuickCreate() {
    const result = await orderStore.quickCreateOrder()
    if (result?.need_confirm) {
      return { need_confirm: true as const, token: result.token, expires_at: result.expires_at, timeout: result.timeout as number }
    }
    if (result) {
      openAnimationType.value = 'quick'
      openAnimationMessage.value = ''
      showOpenAnimation.value = true
      await loadCurrentOrder()
      startDurationTimer()
      return null
    }
    uni.showToast({ title: '开台失败，请重试或联系前台', icon: 'none', duration: 3000 })
    return null
  }

  function closeOpenAnimation() {
    showOpenAnimation.value = false
  }

  // ---- 计时器 ----
  let durationTimer: ReturnType<typeof setInterval> | null = null
  const feeTick = ref(0)

  function startDurationTimer() {
    if (durationTimer) clearInterval(durationTimer)
    durationTimer = setInterval(async () => {
      feeTick.value++
      if (orderStore.isOrderActive) {
        await orderStore.getTableOrder(false)
        if (orderStore.order.value?.start_time) {
          const startTime = new Date(orderStore.order.value.start_time).getTime()
          durationMinutes.value = Math.floor((Date.now() - startTime) / 60000)
        }
      }
    }, 60000)
  }

  // ---- 全量初始化 ----
  async function initData() {
    try {
      await Promise.all([loadTableStatus(), loadCurrentOrder(false), loadActivities()])
    } catch (e) {
      console.error('初始化数据失败', e)
    } finally {
      isLoading.value = false
    }
  }

  // ---- 导航快捷函数 ----
  function goToProduct() { uni.reLaunch({ url: '/pages/product/index' }) }
  function goToAssistant() { uni.reLaunch({ url: '/pages/assistant/index' }) }
  function goToScore() { uni.reLaunch({ url: '/pages/score/index' }) }
  function goToService() { uni.reLaunch({ url: '/pages/service/index' }) }
  function goToBill() { uni.navigateTo({ url: '/pages/bill/index' }) }
  function goToCheckout() { uni.navigateTo({ url: '/pages/bill/index' }) }
  function goToActivity() { uni.navigateTo({ url: '/pages/activity/index' }) }

  // ---- 清理 ----
  function dispose() {
    if (durationTimer) {
      clearInterval(durationTimer)
      durationTimer = null
    }
  }

  return {
    // 状态
    tableNumber, tableStatus, tableHourlyRate, activities, isLoading,
    durationMinutes, feeTick,
    showOpenAnimation, openAnimationType, openAnimationMessage,
    // 计算
    hasActiveOrder, currentOrder, isPrepaid,
    displayTotalFee, displayTableFee, formattedDuration, formattedRemaining,
    timerProgress, cartCount, statusText,
    // 方法
    loadTableStatus, loadCurrentOrder, loadActivities,
    handleQuickCreate, closeOpenAnimation,
    initData, startDurationTimer, dispose,
    // 导航
    goToProduct, goToAssistant, goToScore, goToService, goToBill, goToCheckout, goToActivity,
  }
}
