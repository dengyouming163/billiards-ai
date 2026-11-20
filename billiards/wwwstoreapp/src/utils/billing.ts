/** 获取时段系数 */
export function getTimeCoefficient(timestamp: number): number {
  const hour = new Date(timestamp).getHours()
  if (hour >= 22 || hour < 6) return 1.5
  if (hour >= 6 && hour < 14) return 0.8
  return 1.0
}

/** 获取当前时段系数 */
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
