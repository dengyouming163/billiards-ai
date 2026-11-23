/**
 * offline-billing.test.ts — 离线计费引擎测试
 *
 * 核心: calculateFee (逐分钟累加 + 按时段费率 + 会员折扣)
 */
import { describe, it, expect } from 'vitest'
import { calculateFee, getCurrentRate, type BillingCache } from '../src/utils/offline-billing'

const baseTime = new Date('2026-06-17T14:00:00').getTime() / 1000

function makeCache(overrides: Partial<BillingCache> = {}): BillingCache {
  return {
    start_time: '2026-06-17 14:00:00',
    base_rate: 38,
    prepaid_hours: 0,
    periods: [],
    member_level: undefined,
    ...overrides,
  }
}

describe('calculateFee — 费用计算', () => {
  // ========== 标准计费 (逐分钟) ==========

  it('1小时 × 38元/h = 38元', () => {
    const cache = makeCache()
    expect(calculateFee(cache, 60)).toBeCloseTo(38, 1)
  })

  it('30分钟 = 19元', () => {
    const cache = makeCache()
    expect(calculateFee(cache, 30)).toBeCloseTo(19, 1)
  })

  it('0分钟 = 0元', () => {
    expect(calculateFee(makeCache(), 0)).toBe(0)
  })

  it('负数分钟 = 0元', () => {
    expect(calculateFee(makeCache(), -5)).toBe(0)
  })

  // ========== 预付模式 ==========

  it('预付2小时, 使用90分钟 = 0元 (未超时)', () => {
    const cache = makeCache({ prepaid_hours: 2 })
    expect(calculateFee(cache, 90)).toBe(0)
  })

  it('预付2小时, 使用120分钟 = 0元 (刚好用完)', () => {
    const cache = makeCache({ prepaid_hours: 2 })
    expect(calculateFee(cache, 120)).toBe(0)
  })

  it('预付2小时, 使用121分钟 = 超时向上取整1小时 × 38 = 38元', () => {
    const cache = makeCache({ prepaid_hours: 2 })
    expect(calculateFee(cache, 121)).toBeCloseTo(38, 1)
  })

  it('预付2小时, 使用240分钟 = 超时2小时 = 76元', () => {
    const cache = makeCache({ prepaid_hours: 2 })
    expect(calculateFee(cache, 240)).toBeCloseTo(76, 1)
  })

  // ========== 会员折扣 ==========

  it('VIP会员8.5折: 38元 × 0.85 = 32.3', () => {
    const cache = makeCache({ member_level: 'level_vip' })
    expect(calculateFee(cache, 60)).toBeCloseTo(32.3, 1)
  })

  it('金卡会员9折: 38元 × 0.90 = 34.2', () => {
    const cache = makeCache({ member_level: 'level_gold' })
    expect(calculateFee(cache, 60)).toBeCloseTo(34.2, 1)
  })

  it('银卡会员9.5折: 38元 × 0.95 = 36.1', () => {
    const cache = makeCache({ member_level: 'level_silver' })
    expect(calculateFee(cache, 60)).toBeCloseTo(36.1, 1)
  })

  it('未知会员等级不计折扣', () => {
    const cache = makeCache({ member_level: 'unknown_level' })
    expect(calculateFee(cache, 60)).toBeCloseTo(38, 1)
  })

  // ========== 按时段定价 ==========

  it('高峰时段 (18:00-22:00) 系数1.5: 38×1.5×1h = 57', () => {
    const cache = makeCache({
      start_time: '2026-06-17 18:30:00',
      periods: [{ start_time: '18:00:00', end_time: '22:00:00', coefficient: 1.5 }],
    })
    expect(calculateFee(cache, 60)).toBeCloseTo(57, 1)
  })

  it('深夜时段 (00:00-06:00) 固定价20元/h', () => {
    const cache = makeCache({
      start_time: '2026-06-17 02:00:00',
      periods: [{ start_time: '00:00:00', end_time: '06:00:00', price: 20 }],
    })
    expect(calculateFee(cache, 60)).toBeCloseTo(20, 1)
  })

  it('跨时段: 高峰+平峰混合计费', () => {
    // 30min 高峰(58/h) + 30min 平峰(38/h) ≈ 29 + 19 = 48
    const cache = makeCache({
      start_time: '2026-06-17 21:30:00', // 高峰到22:00
      periods: [
        { start_time: '18:00:00', end_time: '22:00:00', coefficient: 1.5 },
      ],
    })
    const fee30 = calculateFee(cache, 30) // 全部在高峰
    expect(fee30).toBeCloseTo(38 * 1.5 * 0.5, 1) // 28.5
    const fee60 = calculateFee(cache, 60) // 30min高峰 + 30min平峰
    expect(fee60).toBeCloseTo(38 * 1.5 * 0.5 + 38 * 0.5, 1) // 28.5 + 19 = 47.5
  })

  // ========== 跨天时段 (如 22:00-02:00 深夜) ==========

  it('跨天深夜时段', () => {
    const cache = makeCache({
      start_time: '2026-06-17 23:30:00',
      periods: [{ start_time: '22:00:00', end_time: '02:00:00', coefficient: 1.3 }],
    })
    const fee = calculateFee(cache, 60)
    expect(fee).toBeCloseTo(38 * 1.3, 1)
  })

  // ========== 边界情况 ==========

  it('无效 start_time 返回 0', () => {
    const cache = makeCache({ start_time: 'invalid-date' })
    expect(calculateFee(cache, 60)).toBe(0)
  })

  it('空 start_time 返回 0', () => {
    const cache = makeCache({ start_time: '' })
    expect(calculateFee(cache, 60)).toBe(0)
  })
})

describe('getCurrentRate — 获取当前费率', () => {
  it('返回基础费率 (无时段无折扣)', () => {
    const cache = makeCache()
    const rate = getCurrentRate(cache)
    expect(rate).toBe(38)
  })

  it('高峰时段返回含系数的费率', () => {
    const cache = makeCache({ periods: [
      { start_time: '00:00:00', end_time: '23:59:59', coefficient: 1.5 },
    ]})
    expect(getCurrentRate(cache)).toBeCloseTo(57, 1)
  })

  it('VIP折扣后的高峰费率', () => {
    const cache = makeCache({
      member_level: 'level_vip',
      periods: [{ start_time: '00:00:00', end_time: '23:59:59', coefficient: 1.5 }],
    })
    expect(getCurrentRate(cache)).toBeCloseTo(38 * 1.5 * 0.85, 1)
  })
})
