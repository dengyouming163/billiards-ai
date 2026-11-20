/**
 * format.test.ts — 格式化工具函数测试
 */
import { describe, it, expect } from 'vitest'
import { formatPrice, formatDuration } from '../src/utils/format'

describe('formatPrice', () => {
  it('整数 → 2位小数', () => {
    expect(formatPrice(38)).toBe('38.00')
  })

  it('小数 → 2位小数', () => {
    expect(formatPrice(38.5)).toBe('38.50')
  })

  it('超精细小数 → 2位小数截断', () => {
    expect(formatPrice(38.456)).toBe('38.46')
  })

  it('0 → 0.00', () => {
    expect(formatPrice(0)).toBe('0.00')
  })

  it('null → 0.00', () => {
    expect(formatPrice(null)).toBe('0.00')
  })

  it('undefined → 0.00', () => {
    expect(formatPrice(undefined)).toBe('0.00')
  })

  it('字符串数字正常转换', () => {
    expect(formatPrice('38.5')).toBe('38.50')
  })

  it('无效字符串 → 0.00', () => {
    expect(formatPrice('abc')).toBe('0.00')
  })

  it('负数', () => {
    expect(formatPrice(-10)).toBe('-10.00')
  })
})

describe('formatDuration', () => {
  it('0分钟 → 00:00', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('60分钟 → 01:00', () => {
    expect(formatDuration(60)).toBe('01:00')
  })

  it('90分钟 → 01:30', () => {
    expect(formatDuration(90)).toBe('01:30')
  })

  it('24小时 → 24:00', () => {
    expect(formatDuration(24 * 60)).toBe('24:00')
  })

  it('超过24小时 (1500分钟) → 25:00', () => {
    expect(formatDuration(1500)).toBe('25:00')
  })

  it('单数分钟补零 → 00:05', () => {
    expect(formatDuration(5)).toBe('00:05')
  })
})
