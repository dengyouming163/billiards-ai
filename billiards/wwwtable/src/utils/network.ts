import { ref } from 'vue'
import { offlineCache } from './offline-cache'
import { offlineQueue } from './offline-queue'

export const isOnline = ref(true)
export const wasOffline = ref(false)

type ReconnectCallback = (result: { done: number; failed: number }) => void
const listeners: ReconnectCallback[] = []

export function onReconnected(cb: ReconnectCallback): void {
  listeners.push(cb)
}

async function handleReconnected(): Promise<void> {
  try {
    await offlineCache.refreshAll()
  } catch { /* cache refresh best-effort */ }

  let result = { done: 0, failed: 0 }
  try {
    result = await offlineQueue.flush()
  } catch { /* flush best-effort */ }

  for (const cb of listeners) {
    try { cb(result) } catch {}
  }

  if (result.done > 0 || result.failed > 0) {
    const pending = offlineQueue.getPendingCount()
    uni.showToast({
      title: pending > 0 ? `已同步${result.done}条，${pending}条待处理` : '数据已同步',
      icon: 'none', duration: 2000,
    })
  }
}

export function initNetwork(): void {
  uni.getNetworkType({
    success: (res) => { isOnline.value = res.networkType !== 'none' },
  })

  uni.onNetworkStatusChange((res) => {
    const wasOff = !isOnline.value
    isOnline.value = res.isConnected

    if (wasOff && res.isConnected) {
      wasOffline.value = true
      handleReconnected()
    }
  })
}
