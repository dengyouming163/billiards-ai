/**
 * useServiceCall — 呼叫服务员
 *
 * 职责: 180s 倒计时 / 取消确认弹窗 / API 调用
 */
import { ref, onUnmounted } from 'vue'
import { tabletApi } from '@/api'

export function useServiceCall() {
  const isCallingWaiter = ref(false)
  const showCancelWaiterModal = ref(false)
  const waiterCountdown = ref(180)
  let waiterTimer: ReturnType<typeof setInterval> | null = null

  function callWaiter() {
    if (isCallingWaiter.value) {
      showCancelWaiterModal.value = true
      return
    }
    isCallingWaiter.value = true
    waiterCountdown.value = 180
    uni.showToast({ title: '已呼叫服务员', icon: 'success', duration: 2000 })
    tabletApi.callService({ service_type: 'help' }).catch(() => {})

    waiterTimer = setInterval(() => {
      waiterCountdown.value--
      if (waiterCountdown.value <= 0) {
        cancelWaiterCall()
        uni.showToast({ title: '服务员正在赶来，请稍候', icon: 'none', duration: 2000 })
      }
    }, 1000) as unknown as number
  }

  function cancelWaiterCall() {
    isCallingWaiter.value = false
    waiterCountdown.value = 180
    showCancelWaiterModal.value = false
    if (waiterTimer) {
      clearInterval(waiterTimer)
      waiterTimer = null
    }
  }

  function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  function dispose() {
    if (waiterTimer) clearInterval(waiterTimer)
  }

  return {
    isCallingWaiter, showCancelWaiterModal, waiterCountdown,
    callWaiter, cancelWaiterCall, formatCountdown, dispose,
  }
}
