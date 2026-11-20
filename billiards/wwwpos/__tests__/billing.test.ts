import { describe, it, expect, vi } from 'vitest'
import {
  getTimeCoefficient,
  calculateTableFeeLocal,
  getCurrentCoefficient,
  getTimePeriodLabel,
} from '@/utils/billing'

describe('getTimeCoefficient', () => {
  it('深夜时段 22:00 返回 1.5x', () => {
    const ts = new Date('2026-07-02T22:00:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.5)
  })

  it('深夜时段 23:59 返回 1.5x', () => {
    const ts = new Date('2026-07-02T23:59:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.5)
  })

  it('深夜时段 00:00 返回 1.5x', () => {
    const ts = new Date('2026-07-02T00:00:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.5)
  })

  it('深夜时段 05:59 返回 1.5x', () => {
    const ts = new Date('2026-07-02T05:59:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.5)
  })

  it('早间时段 06:00 返回 0.8x', () => {
    const ts = new Date('2026-07-02T06:00:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(0.8)
  })

  it('早间时段 13:59 返回 0.8x', () => {
    const ts = new Date('2026-07-02T13:59:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(0.8)
  })

  it('正常时段 14:00 返回 1.0x', () => {
    const ts = new Date('2026-07-02T14:00:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.0)
  })

  it('正常时段 21:59 返回 1.0x', () => {
    const ts = new Date('2026-07-02T21:59:00').getTime()
    expect(getTimeCoefficient(ts)).toBe(1.0)
  })
})

describe('calculateTableFeeLocal', () => {
  const hourlyRate = 60 // ¥60/小时

  it('刚开台费用为 0 (不足30分钟)', () => {
    const now = new Date()
    const startTime = new Date(now.getTime() - 10 * 60000).toISOString() // 10分钟前
    expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(0)
  })

  it('30分钟按比例收费', () => {
    const now = new Date()
    const startTime = new Date(now.getTime() - 30 * 60000).toISOString()
    // 30分钟 = 0.5小时 × 60 × 系数
    const fee = calculateTableFeeLocal({ startTime, hourlyRate })
    expect(fee).toBeGreaterThan(0)
  })

  it('1小时收费 = hourlyRate', () => {
    const now = new Date()
    // 使用正常时段 14:00 以确保系数为 1.0
    const startTime = '2026-07-02T14:00:00'
    // Mock Date.now to a fixed time 1 hour later
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T15:00:00').getTime())
    try {
      expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(60)
    } finally {
      Date.now = realNow
    }
  })

  it('2小时收费 = 2 × hourlyRate', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T16:00:00').getTime())
    try {
      expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(120)
    } finally {
      Date.now = realNow
    }
  })

  it('深夜时段 ×1.5 系数', () => {
    const startTime = '2026-07-02T22:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T23:00:00').getTime())
    try {
      // 1h × 60 × 1.5 = 90
      expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(90)
    } finally {
      Date.now = realNow
    }
  })

  it('早间时段 ×0.8 系数', () => {
    const startTime = '2026-07-02T06:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T07:00:00').getTime())
    try {
      // 1h × 60 × 0.8 = 48
      expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(48)
    } finally {
      Date.now = realNow
    }
  })

  it('预付金额优先返回', () => {
    const startTime = '2026-07-02T14:00:00'
    const prepaidAmount = 100
    // 即使实际时长已超过预付，也返回预付金额
    expect(calculateTableFeeLocal({ startTime, hourlyRate, prepaidAmount })).toBe(100)
  })

  it('预付金额为 0 时正常计算', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T15:00:00').getTime())
    try {
      expect(calculateTableFeeLocal({ startTime, hourlyRate, prepaidAmount: 0 })).toBe(60)
    } finally {
      Date.now = realNow
    }
  })

  it('会员85折折扣', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T15:00:00').getTime())
    try {
      // 1h × 60 × 1.0 × 0.85 = 51
      expect(calculateTableFeeLocal({ startTime, hourlyRate, discountRate: 85 })).toBe(51)
    } finally {
      Date.now = realNow
    }
  })

  it('会员9折折扣', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T15:00:00').getTime())
    try {
      expect(calculateTableFeeLocal({ startTime, hourlyRate, discountRate: 90 })).toBe(54)
    } finally {
      Date.now = realNow
    }
  })

  it('折扣率 0 或 100 不参与计算', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T15:00:00').getTime())
    try {
      expect(calculateTableFeeLocal({ startTime, hourlyRate, discountRate: 0 })).toBe(60)
      expect(calculateTableFeeLocal({ startTime, hourlyRate, discountRate: 100 })).toBe(60)
    } finally {
      Date.now = realNow
    }
  })

  it('hourlyRate 为 0 返回 0', () => {
    expect(calculateTableFeeLocal({ startTime: '2026-07-02T14:00:00', hourlyRate: 0 })).toBe(0)
  })

  it('无效 startTime 返回 0', () => {
    expect(calculateTableFeeLocal({ startTime: '', hourlyRate: 60 })).toBe(0)
    expect(calculateTableFeeLocal({ startTime: 'invalid', hourlyRate: 60 })).toBe(0)
  })

  it('32分钟取整为60分钟', () => {
    const startTime = '2026-07-02T14:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T14:32:00').getTime())
    try {
      // ceil(32/30)*30 = 60分钟 = 1小时
      expect(calculateTableFeeLocal({ startTime, hourlyRate })).toBe(60)
    } finally {
      Date.now = realNow
    }
  })

  it('深夜+会员折扣组合', () => {
    const startTime = '2026-07-02T22:00:00'
    const realNow = Date.now
    Date.now = vi.fn(() => new Date('2026-07-02T23:00:00').getTime())
    try {
      // 1h × 60 × 1.5 × 0.85 = 76.5
      expect(calculateTableFeeLocal({ startTime, hourlyRate, discountRate: 85 })).toBe(76.5)
    } finally {
      Date.now = realNow
    }
  })
})

describe('getCurrentCoefficient', () => {
  it('返回当前时段系数', () => {
    const coeff = getCurrentCoefficient()
    expect([0.8, 1.0, 1.5]).toContain(coeff)
  })
})

describe('getTimePeriodLabel', () => {
  it('返回非空字符串', () => {
    expect(getTimePeriodLabel()).toBeTruthy()
    expect(typeof getTimePeriodLabel()).toBe('string')
  })
})
