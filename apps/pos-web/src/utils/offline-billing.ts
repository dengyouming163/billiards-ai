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
    const inRange = start <= end
      ? timeStr >= start && timeStr < end
      : timeStr >= start || timeStr < end
    if (inRange) {
      let rate = p.price ?? cache.base_rate
      if (p.coefficient && p.coefficient !== 1) rate *= p.coefficient
      return rate
    }
  }
  return cache.base_rate
}

function applyDiscount(rate: number, memberLevel?: string): number {
  return rate * (DISCOUNT_MAP[memberLevel || ''] || 1.0)
}

export function calculateFee(cache: BillingCache, durationMinutes: number): number {
  if (durationMinutes <= 0 || !cache.start_time) return 0

  if (cache.prepaid_hours > 0) {
    const prepaidMin = cache.prepaid_hours * 60
    if (durationMinutes <= prepaidMin) return 0
    const extraH = Math.ceil((durationMinutes - prepaidMin) / 60)
    const rate = getRateAt(cache, Date.now() / 1000)
    return Math.round(applyDiscount(rate, cache.member_level) * extraH * 100) / 100
  }

  const startTs = new Date(cache.start_time.replace('T', ' ')).getTime() / 1000
  if (isNaN(startTs)) return 0

  let total = 0
  for (let m = 0; m < durationMinutes; m++) {
    total += applyDiscount(getRateAt(cache, startTs + m * 60), cache.member_level) / 60
  }
  return Math.round(total * 100) / 100
}

export function getCurrentRate(cache: BillingCache): number {
  return applyDiscount(getRateAt(cache, Date.now() / 1000), cache.member_level)
}

const BILLING_KEY = 'pos_offline_billing'

export function cacheBillingData(tableId: string, data: BillingCache): void {
  try {
    const all = JSON.parse(localStorage.getItem(BILLING_KEY) || '{}')
    all[tableId] = data
    localStorage.setItem(BILLING_KEY, JSON.stringify(all))
  } catch {}
}

export function getCachedBillingData(tableId: string): BillingCache | null {
  try {
    const all = JSON.parse(localStorage.getItem(BILLING_KEY) || '{}')
    return all[tableId] || null
  } catch { return null }
}

export function removeBillingData(tableId: string): void {
  try {
    const all = JSON.parse(localStorage.getItem(BILLING_KEY) || '{}')
    delete all[tableId]
    localStorage.setItem(BILLING_KEY, JSON.stringify(all))
  } catch {}
}
