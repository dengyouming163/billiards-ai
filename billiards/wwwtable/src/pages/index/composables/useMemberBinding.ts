/**
 * useMemberBinding — 会员扫码绑定
 *
 * 职责: 会员 QR 弹窗状态 / 二维码生成 / 3s 轮询绑定状态
 * 从 index.vue 内联逻辑提取
 */
import { ref, computed, watch, onUnmounted } from 'vue'
import { orderStore } from '@/stores/order'
import { authStore } from '@/stores/auth'

export function useMemberBinding() {
  const showMemberQR = ref(false)
  const memberQrUrl = ref('')
  let memberPollTimer: ReturnType<typeof setInterval> | null = null

  const memberInfo = computed(() =>
    (orderStore.order.value as any)?.member_info
    || (orderStore.order.value as any)?.memberInfo
    || null
  )

  watch(showMemberQR, (val) => {
    if (val) {
      const oid = orderStore.orderId
      if (!oid) { showMemberQR.value = false; return }
      memberQrUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(`pages/bind/index?order_id=${oid}&store_id=${authStore.storeId}`)}`

      memberPollTimer = setInterval(async () => {
        try {
          await orderStore.loadOrder()
          const info = (orderStore.order.value as any)?.member_info
            || (orderStore.order.value as any)?.memberInfo
          if (info) { showMemberQR.value = false }
        } catch { /* ignore */ }
      }, 3000)
    } else {
      if (memberPollTimer) { clearInterval(memberPollTimer); memberPollTimer = null }
      memberQrUrl.value = ''
    }
  })

  onUnmounted(() => {
    if (memberPollTimer) { clearInterval(memberPollTimer); memberPollTimer = null }
  })

  return {
    showMemberQR,
    memberQrUrl,
    memberInfo,
  }
}
