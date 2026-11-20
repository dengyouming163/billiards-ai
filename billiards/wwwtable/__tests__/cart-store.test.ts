/**
 * cart-store.test.ts — CartStore 单元测试
 *
 * 测试：购物车 CRUD + computed + 去重合并
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock 模块级有副作用的依赖 (offline-queue 在 import 时调用了 uni.getStorageSync)
vi.mock('@/utils/network', () => ({ isOnline: { value: true } }))
vi.mock('@/utils/offline-queue', () => ({
  offlineQueue: { enqueue: vi.fn(), getPendingCount: vi.fn(() => 0) },
}))
vi.mock('@/api/modules/tablet', () => ({ tabletApi: { addOrderItem: vi.fn() } }))

import { cartStore } from '../src/stores/cart'
import type { OrderItem } from '../src/types'

function item(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 6)}`,
    product_id: 'prod-001',
    product_name: 'Test Product',
    item_name: 'Test Item',
    name: 'Test',
    quantity: 1,
    unit_price: 10,
    total_price: 10,
    final_price: 10,
    image: '',
    emoji: '📦',
    unit: '份',
    description: '',
    status: 'pending',
    ...overrides,
  }
}

describe('CartStore', () => {
  beforeEach(() => {
    cartStore.clearCart()
  })

  // ========== 基本 CRUD ==========

  describe('addToCart', () => {
    it('添加一个商品', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 1 }))
      expect(cartStore.cartItems.value).toHaveLength(1)
      expect(cartStore.cartItems.value[0].product_id).toBe('p1')
    })

    it('相同 product_id 自动合并数量', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 2 }))
      cartStore.addToCart(item({ product_id: 'p1', quantity: 3 }))
      expect(cartStore.cartItems.value).toHaveLength(1)
      expect(cartStore.cartItems.value[0].quantity).toBe(5)
    })

    it('不同 product_id 分开', () => {
      cartStore.addToCart(item({ product_id: 'p1' }))
      cartStore.addToCart(item({ product_id: 'p2' }))
      expect(cartStore.cartItems.value).toHaveLength(2)
    })
  })

  describe('removeFromCart', () => {
    it('移除存在的商品', () => {
      cartStore.addToCart(item({ product_id: 'p1' }))
      cartStore.addToCart(item({ product_id: 'p2' }))
      cartStore.removeFromCart('p1')
      expect(cartStore.cartItems.value).toHaveLength(1)
      expect(cartStore.cartItems.value[0].product_id).toBe('p2')
    })

    it('移除不存在的商品 — 无操作', () => {
      cartStore.addToCart(item({ product_id: 'p1' }))
      cartStore.removeFromCart('p999')
      expect(cartStore.cartItems.value).toHaveLength(1)
    })
  })

  describe('updateCartItem', () => {
    it('修改商品数量', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 3 }))
      cartStore.updateCartItem('p1', 5)
      expect(cartStore.cartItems.value[0].quantity).toBe(5)
    })

    it('数量 <= 0 时移除', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 3 }))
      cartStore.updateCartItem('p1', 0)
      expect(cartStore.cartItems.value).toHaveLength(0)
    })

    it('数量 < 0 时移除', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 3 }))
      cartStore.updateCartItem('p1', -1)
      expect(cartStore.cartItems.value).toHaveLength(0)
    })
  })

  describe('clearCart', () => {
    it('清空全部商品', () => {
      cartStore.addToCart(item({ product_id: 'p1' }))
      cartStore.addToCart(item({ product_id: 'p2' }))
      cartStore.addToCart(item({ product_id: 'p3' }))
      cartStore.clearCart()
      expect(cartStore.cartItems.value).toHaveLength(0)
    })
  })

  // ========== 计算属性 ==========

  describe('cartCount', () => {
    it('空购物车 → 0', () => {
      expect(cartStore.cartCount).toBe(0)
    })

    it('多件商品 → 累加数量', () => {
      cartStore.addToCart(item({ product_id: 'p1', quantity: 2 }))
      cartStore.addToCart(item({ product_id: 'p2', quantity: 3 }))
      expect(cartStore.cartCount).toBe(5)
    })
  })

  describe('cartTotal', () => {
    it('空购物车 → 0', () => {
      expect(cartStore.cartTotal).toBe(0)
    })

    it('计算总价', () => {
      cartStore.addToCart(item({ product_id: 'p1', unit_price: 10, quantity: 2 }))
      cartStore.addToCart(item({ product_id: 'p2', unit_price: 15, quantity: 1 }))
      expect(cartStore.cartTotal).toBe(35)
    })

    it('使用 final_price 作为单价', () => {
      cartStore.addToCart(item({ product_id: 'p1', unit_price: 0, final_price: 20, quantity: 2 }))
      expect(cartStore.cartTotal).toBe(40)
    })

    it('使用 total_price 作为 fallback', () => {
      cartStore.addToCart(item({
        product_id: 'p1', unit_price: 0, final_price: 0, total_price: 30, quantity: 2,
      }))
      expect(cartStore.cartTotal).toBe(60)
    })
  })
})
