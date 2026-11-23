import { describe, it, expect } from 'vitest'
import {
  calculateFee,
  getCurrentRate,
  cacheBillingData,
  getCachedBillingData,
  removeBillingData,
  applyDiscount,
  type PricingPeriod,
} from '@/utils/offline-billing'

const BASE_CACHE = {
  tableId: 'table1',
  startTime: '2026-07-02T14:00:00',
  baseRate: 60,
  prepaidHours: 0,
  periods: [] as PricingPeriod[],
}

describe('applyDiscount', () => {
  it('VIP会员 85折', () => {
    expect(applyDiscount(100, 'level_vip')).toBe(85)
  })

  it('金卡会员 9折', () => {
    expect(applyDiscount(100, 'level_gold')).toBe(90)
  })

  it('银卡会员 95折', () => {
    expect(applyDiscount(100, 'level_silver')).toBe(95)
  })

  it('未知等级不打折', () => {
    expect(applyDiscount(100, 'unknown')).toBe(100)
    expect(applyDiscount(100, '')).toBe(100)
  })
})

describe('calculateFee', () => {
  it('刚开台费用为 0', () => {
    const fee = calculateFee(BASE_CACHE, 5) // 5分钟
    expect(fee).toBe(0)
  })

  it('30分钟计费', () => {
    const fee = calculateFee(BASE_CACHE, 30)
    // 30分钟 = 0.5h × 60 = 30
    expect(fee).toBeGreaterThan(0)
  })

  it('1小时计费 = baseRate', () => {
    const fee = calculateFee(BASE_CACHE, 60)
    expect(fee).toBe(60)
  })

  it('2小时计费 = 2 × baseRate', () => {
    const fee = calculateFee(BASE_CACHE, 120)
    expect(fee).toBe(120)
  })

  it('预付时长内不计费', () => {
    const cache = { ...BASE_CACHE, prepaidHours: 2 }
    const fee = calculateFee(cache, 60) // 1小时 < 2小时预付
    expect(fee).toBe(0)
  })

  it('超出预付时长后按小时计费', () => {
    const cache = { ...BASE_CACHE, prepaidHours: 1 }
    // 超出预付部分: (90分钟 - 60分钟) = 30分钟, ceil到1小时
    const fee = calculateFee(cache, 90)
    expect(fee).toBe(60) // 1额外小时
  })
})

describe('getCurrentRate', () => {
  it('返回基准费率', () => {
    const rate = getCurrentRate(BASE_CACHE)
    expect(rate).toBe(60)
  })

  it('会员等级应用折扣后费率', () => {
    const cache = { ...BASE_CACHE, memberLevel: 'level_vip' }
    const rate = getCurrentRate(cache)
    expect(rate).toBe(51) // 60 × 0.85
  })
})

describe('cache/read/remove lifecycle', () => {
  it('缓存后能读取', () => {
    cacheBillingData('test-table', {
      startTime: '2026-07-02T14:00:00',
      baseRate: 50,
      prepaidHours: 1,
      periods: [],
    })
    const data = getCachedBillingData('test-table')
    expect(data).not.toBeNull()
    expect(data!.baseRate).toBe(50)
    expect(data!.prepaidHours).toBe(1)
  })

  it('移除后返回 null', () => {
    removeBillingData('test-table')
    const data = getCachedBillingData('test-table')
    expect(data).toBeNull()
  })

  it('不存在的缓存返回 null', () => {
    const data = getCachedBillingData('non-existent')
    expect(data).toBeNull()
  })
})
