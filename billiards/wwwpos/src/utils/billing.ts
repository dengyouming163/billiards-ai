/**
 * 计费工具函数 — 对齐后端 CheckoutLogic 算法
 *
 * 后端核心逻辑：
 * - 时长按 30 分钟取整（ceil）
 * - 时段系数：22:00-06:00 → 1.5x / 06:00-14:00 → 0.8x / 默认 1.0x
 * - 预付金额优先
 * - 会员折扣通过 discount_rate 参与计算
 */

/** 获取时段系数 — 对齐后端 getTimeCoefficient() */
export function getTimeCoefficient(timestamp: number): number {
  const hour = new Date(timestamp).getHours()

  // 深夜 22:00 ~ 次日 06:00 → 1.5 倍
  if (hour >= 22 || hour < 6) {
    return 1.5
  }

  // 早间 06:00 ~ 14:00 → 0.8 倍
  if (hour >= 6 && hour < 14) {
    return 0.8
  }

  // 正常时段 14:00 ~ 22:00 → 1.0 倍
  return 1.0
}

/** 计算台费 — 对齐后端 calculateTableFee() */
export function calculateTableFeeLocal(params: {
  startTime: string
  hourlyRate: number
  prepaidAmount?: number
  discountRate?: number // 0-100, 100 = 无折扣
}): number {
  const { startTime, hourlyRate, prepaidAmount, discountRate } = params

  // 预付金额优先
  if (prepaidAmount && prepaidAmount > 0) {
    return prepaidAmount
  }

  if (!startTime || hourlyRate <= 0) return 0

  const startTs = new Date(startTime).getTime()
  const now = Date.now()
  if (isNaN(startTs)) return 0

  const durationMinutes = Math.max(0, Math.floor((now - startTs) / 60000))

  // 按 30 分钟取整
  const roundedMinutes = Math.ceil(durationMinutes / 30) * 30
  const durationHours = roundedMinutes / 60

  // 时段系数（基于开台时间）
  const coefficient = getTimeCoefficient(startTs)

  let tableFee = durationHours * hourlyRate * coefficient

  // 会员折扣
  if (discountRate && discountRate > 0 && discountRate < 100) {
    tableFee = tableFee * (discountRate / 100)
  }

  return Math.round(tableFee * 100) / 100
}

/** 获取当前时段系数（用于显示） */
export function getCurrentCoefficient(): number {
  return getTimeCoefficient(Date.now())
}

/** 获取时段标签 */
export function getTimePeriodLabel(): string {
  const coeff = getCurrentCoefficient()
  if (coeff === 1.5) return '深夜时段 ×1.5'
  if (coeff === 0.8) return '早间时段 ×0.8'
  return '正常时段 ×1.0'
}
