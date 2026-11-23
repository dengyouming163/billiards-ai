// ---- 类型 ----
export interface PricingPeriod {
  start_time: string
  end_time: string
  weekdays?: string
  price?: number
  coefficient?: number
}

export interface BillingCache {
  start_time: string
  base_rate: number
  prepaid_hours: number
  periods: PricingPeriod[]
  member_level?: string
}

const DISCOUNT_MAP: Record<string, number> = {
  level_vip: 0.85, level_gold: 0.90, level_silver: 0.95,
}

// ---- 核心：获取指定时刻的费率 ----
function getRateAt(cache: BillingCache, timestampSec: number): number {
  const d = new Date(timestampSec * 1000)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  const timeStr = `${h}:${m}:${s}`
  const weekday = String(d.getDay())

  for (const p of cache.periods) {
    if (p.weekdays) {
      const days = p.weekdays.split(',').map(s => s.trim())
      if (!days.includes(weekday)) continue
    }
    const start = p.start_time
    const end = p.end_time
    let inRange = false
    if (start <= end) {
      inRange = timeStr >= start && timeStr < end
    } else {
      inRange = timeStr >= start || timeStr < end
    }
    if (inRange) {
      let rate = p.price ?? cache.base_rate
      if (p.coefficient && p.coefficient !== 1) rate *= p.coefficient
      return rate
    }
  }

  return cache.base_rate
}

// ---- 折扣应用 ----
function applyDiscount(rate: number, memberLevel?: string): number {
  const mult = DISCOUNT_MAP[memberLevel || ''] || 1.0
  return rate * mult
}

// ---- 核心：计算费用 ----
export function calculateFee(cache: BillingCache, durationMinutes: number): number {
  if (durationMinutes <= 0 || !cache.start_time) return 0

  // 预付模式
  if (cache.prepaid_hours > 0) {
    const prepaidMin = cache.prepaid_hours * 60
    if (durationMinutes <= prepaidMin) return 0
    const extraH = Math.ceil((durationMinutes - prepaidMin) / 60)
    const rate = getRateAt(cache, Date.now() / 1000)
    return Math.round(applyDiscount(rate, cache.member_level) * extraH * 100) / 100
  }

  // 标准模式：逐分钟累加
  const startTs = new Date(cache.start_time.replace('T', ' ')).getTime() / 1000
  if (isNaN(startTs)) return 0

  let total = 0
  for (let m = 0; m < durationMinutes; m++) {
    const ts = startTs + m * 60
    const rate = getRateAt(cache, ts)
    total += applyDiscount(rate, cache.member_level) / 60
  }

  return Math.round(total * 100) / 100
}

// ---- 获取当前费率（用于展示） ----
export function getCurrentRate(cache: BillingCache): number {
  const rate = getRateAt(cache, Date.now() / 1000)
  return applyDiscount(rate, cache.member_level)
}

// ---- localStorage 持久化 ----
const BILLING_KEY = 'offline_billing'

export function cacheBillingData(data: BillingCache): void {
  try { uni.setStorageSync(BILLING_KEY, JSON.stringify(data)) } catch {}
}

export function getCachedBillingData(): BillingCache | null {
  try {
    const raw = uni.getStorageSync(BILLING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
