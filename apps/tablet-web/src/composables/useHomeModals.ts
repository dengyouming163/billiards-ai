/**
 * useHomeModals — 首页弹窗状态管理
 *
 * 职责: 商品详情弹窗 / 助教服务弹窗 / 充电弹窗状态 / 辅助计算
 */
import { ref, computed } from 'vue'
import { orderStore } from '@/stores/order'
import { tabletApi } from '@/api'
import { formatPrice } from '@/utils/format'

export function useHomeModals() {
  // ---- 弹窗状态 ----
  const showProductItemsModal = ref(false)
  const showAssistantServicesModal = ref(false)
  const assistantOrdersDetail = ref<any[]>([])

  // ---- 商品/助教筛选 ----
  const productOnlyItems = computed(() =>
    (orderStore.orderItems.value || []).filter((i: any) => i.item_type !== 'assistant')
  )

  const assistantOnlyItems = computed(() =>
    (orderStore.orderItems.value || []).filter(
      (i: any) => i.item_type === 'assistant' && i.status !== 'cancelled'
    )
  )

  const productItemsCount = computed(() =>
    productOnlyItems.value.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)
  )

  const assistantServicesCount = computed(() =>
    assistantOnlyItems.value.filter((i: any) => i.status === 'serving').length
  )

  // ---- 助教订单详情加载 ----
  async function loadAssistantOrdersDetail() {
    try {
      const data = await tabletApi.getAssistantOrders(orderStore.orderId)
      assistantOrdersDetail.value = Array.isArray(data)
        ? data.filter((i: any) => i.status !== 'cancelled')
        : []
    } catch {
      assistantOrdersDetail.value = []
    }
  }

  // ---- 点击处理 (在页面层组合) ----
  function handleProductClick() {
    if (orderStore.productFee > 0) {
      showProductItemsModal.value = true
    } else {
      uni.reLaunch({ url: '/pages/product/index' })
    }
  }

  async function handleAssistantClick() {
    if (orderStore.hasAssistantItems) {
      showAssistantServicesModal.value = true
      await loadAssistantOrdersDetail()
    } else {
      uni.reLaunch({ url: '/pages/assistant/index' })
    }
  }

  const endingAssistantId = ref<string | null>(null)
  const startingAssistantId = ref<string | null>(null)

  async function startAssistantService(itemId: string) {
    startingAssistantId.value = itemId
    try {
      await tabletApi.startAssistantService(itemId)
      uni.showToast({ title: '已开始服务', icon: 'success' })
      await loadAssistantOrdersDetail()
    } catch {
      uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      startingAssistantId.value = null
    }
  }

  async function endAssistantService(itemId: string) {
    endingAssistantId.value = itemId
    try {
      await tabletApi.endAssistantService(itemId)
      uni.showToast({ title: '已结束服务', icon: 'success' })
      await loadAssistantOrdersDetail()
    } catch {
      uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      endingAssistantId.value = null
    }
  }

  // ---- 格式化工具 ----
  function formatStartTime(dateStr: string): string {
    const d = new Date(dateStr)
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  function calcServingDuration(startedAt: string): string {
    const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    const h = Math.floor(diff / 3600)
    const m = Math.floor((diff % 3600) / 60)
    return `${h}h${m}m`
  }

  function asStatusLabel(s: string) {
    const m: Record<string, string> = {
      pending: '待确认', processing: '已确认', serving: '服务中', completed: '已完成',
    }
    return m[s] || s
  }

  return {
    // 状态
    showProductItemsModal, showAssistantServicesModal, assistantOrdersDetail,
    // 计算
    productOnlyItems, assistantOnlyItems,
    productItemsCount, assistantServicesCount,
    // 方法
    handleProductClick, handleAssistantClick, endAssistantService, endingAssistantId, startAssistantService, startingAssistantId,
    loadAssistantOrdersDetail,
    // 格式化
    formatStartTime, calcServingDuration, asStatusLabel,
    formatPrice,
  }
}
