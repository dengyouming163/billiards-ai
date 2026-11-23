/**
 * useConfirmFlow — 开台确认流程
 *
 * 职责: 确认弹窗状态 / 倒计时 / 轮询兜底 / WS 事件处理
 * 从 index.vue 内联逻辑提取
 */
import { ref, onUnmounted } from 'vue'
import { orderStore } from '@/stores/order'
import { tableWs } from '@/utils/websocket'

export function useConfirmFlow(onConfirmed: () => void) {
  const showConfirmModal = ref(false)
  const confirmState = ref<'waiting' | 'confirmed' | 'timeout'>('waiting')
  const countdown = ref(60)
  const timeoutMinutes = ref(0)
  let confirmTimer: ReturnType<typeof setInterval> | null = null
  let confirmPollTimer: ReturnType<typeof setInterval> | null = null

  function stopAllTimers() {
    if (confirmTimer) { clearInterval(confirmTimer); confirmTimer = null }
    if (confirmPollTimer) { clearInterval(confirmPollTimer); confirmPollTimer = null }
  }

  /** 轮询检查：收银端是否已确认开台（WS 不稳定时的兜底方案） */
  function startConfirmPolling() {
    confirmPollTimer = setInterval(async () => {
      try {
        await orderStore.getTableOrder(false)
        if (orderStore.isOrderActive) {
          confirmState.value = 'confirmed'
          stopAllTimers()
          setTimeout(() => {
            showConfirmModal.value = false
            onConfirmed()
          }, 500)
        }
      } catch { /* 网络错误继续轮询 */ }
    }, 5000)
  }

  function startConfirmCountdown(expiresAt?: number, timeoutMins?: number) {
    timeoutMinutes.value = timeoutMins || 1
    const nowSec = Math.floor(Date.now() / 1000)
    const expiresSec = expiresAt || (nowSec + timeoutMinutes.value * 60)
    countdown.value = Math.max(1, expiresSec - nowSec)

    confirmTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        stopAllTimers()
        confirmState.value = 'timeout'
        setTimeout(() => {
          if (confirmState.value === 'timeout') showConfirmModal.value = false
        }, 3000)
      }
    }, 1000)

    startConfirmPolling()
  }

  function startConfirm(result: { expires_at?: number; timeout?: number }) {
    confirmState.value = 'waiting'
    showConfirmModal.value = true
    startConfirmCountdown(result?.expires_at, result?.timeout)
  }

  function cancelConfirm() {
    stopAllTimers()
    showConfirmModal.value = false
  }

  function handleConfirmClose() {
    showConfirmModal.value = false
    if (confirmState.value === 'confirmed') {
      onConfirmed()
    }
  }

  // WS 事件注册
  tableWs.on('table_open_confirmed', () => {
    if (showConfirmModal.value) {
      confirmState.value = 'confirmed'
      stopAllTimers()
      showConfirmModal.value = false
      setTimeout(() => onConfirmed(), 500)
    }
  })

  tableWs.on('table_open_rejected', () => {
    showConfirmModal.value = false
    stopAllTimers()
    uni.showToast({ title: '开台未通过，可联系前台咨询', icon: 'none', duration: 3000 })
  })

  tableWs.on('table_open_timeout', () => {
    if (showConfirmModal.value && confirmState.value === 'waiting') {
      stopAllTimers()
      confirmState.value = 'timeout'
      setTimeout(() => {
        if (confirmState.value === 'timeout') showConfirmModal.value = false
      }, 3000)
    }
  })

  onUnmounted(() => {
    stopAllTimers()
    tableWs.off('table_open_confirmed', () => {})
    tableWs.off('table_open_rejected', () => {})
    tableWs.off('table_open_timeout', () => {})
  })

  return {
    showConfirmModal,
    confirmState,
    countdown,
    timeoutMinutes,
    startConfirm,
    cancelConfirm,
    handleConfirmClose,
    stopAllTimers,
  }
}
