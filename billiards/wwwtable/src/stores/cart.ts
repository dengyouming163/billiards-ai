/**
 * CartStore — 购物车状态管理 + localStorage 持久化
 *
 * 职责：购物车 CRUD + 自动本地持久化（切换页面不丢失）+ 提交到订单
 */
import { ref } from 'vue'
import type { OrderItem } from '@/types'
import { tabletApi } from '@/api/modules/tablet'
import { offlineQueue } from '@/utils/offline-queue'
import { isOnline } from '@/utils/network'

const CART_KEY = 'tt_cart'

function load(): OrderItem[] {
  try {
    const raw = uni.getStorageSync(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persist(items: OrderItem[]): void {
  try { uni.setStorageSync(CART_KEY, JSON.stringify(items)) } catch {}
}

class CartStore {
  cartItems = ref<OrderItem[]>(load())

  // ---- 计算属性 ----

  get cartTotal(): number {
    return this.cartItems.value.reduce((sum, item) => {
      const unitPrice = Number(item.unit_price) || Number(item.final_price) || Number(item.total_price) || 0
      return sum + unitPrice * item.quantity
    }, 0)
  }

  get cartCount(): number {
    return this.cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
  }

  // ---- 持久化辅助 ----
  private save(): void { persist(this.cartItems.value) }

  // ---- 购物车 CRUD ----

  addToCart(item: OrderItem): void {
    const existingIndex = this.cartItems.value.findIndex(c => c.product_id === item.product_id)
    if (existingIndex >= 0) {
      this.cartItems.value[existingIndex].quantity += item.quantity
    } else {
      this.cartItems.value.push({ ...item })
    }
    this.save()
  }

  removeFromCart(productId: string): void {
    this.cartItems.value = this.cartItems.value.filter(c => c.product_id !== productId)
    this.save()
  }

  updateCartItem(productId: string, quantity: number): void {
    const index = this.cartItems.value.findIndex(c => c.product_id === productId)
    if (index >= 0) {
      if (quantity <= 0) {
        this.removeFromCart(productId)
        return
      } else {
        this.cartItems.value[index].quantity = quantity
      }
    }
    this.save()
  }

  clearCart(): void {
    this.cartItems.value = []
    this.save()
  }

  // ---- 提交购物车到订单 ----

  /**
   * 将购物车商品批量提交到指定订单。
   * 在线：逐条调用 addOrderItem API，完成后清空购物车。
   * 离线：创建本地 stub items + 入队到 offlineQueue。
   *
   * @param orderId        目标订单 ID
   * @param onNewItems     离线模式下，将 stub items 注入到 UI 列表的回调
   * @returns true=成功, false=失败
   */
  async submitCart(
    orderId: string,
    onNewItems?: (items: any[]) => void,
  ): Promise<boolean> {
    if (!orderId || this.cartItems.value.length === 0) return false

    // 离线模式
    if (!isOnline.value) {
      const newItems = this.cartItems.value.map(item => ({
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        product_id: item.product_id || item.id || '',
        product_name: item.item_name || item.name || '',
        item_name: item.item_name || item.name || '',
        name: item.item_name || item.name || '',
        quantity: item.quantity || 1,
        unit_price: item.unit_price || (item as any).price || 0,
        final_price: (item.unit_price || (item as any).price || 0) * (item.quantity || 1),
        status: 'pending',
        emoji: (item as any).emoji || '📦',
      }))
      onNewItems?.(newItems)

      for (const item of this.cartItems.value) {
        offlineQueue.enqueue('add_product', {
          order_id: orderId,
          product_id: item.product_id || item.id || '',
          quantity: item.quantity || 1,
        })
      }
      this.clearCart()
      uni.showToast({ title: '已加入离线队列', icon: 'none', duration: 1500 })
      return true
    }

    // 在线模式
    try {
      for (const item of this.cartItems.value) {
        await tabletApi.addOrderItem({
          order_id: orderId,
          product_id: String(item.product_id || ''),
          quantity: item.quantity,
        })
      }
      this.clearCart()
      return true
    } catch {
      return false
    }
  }
}

export const cartStore = new CartStore()
