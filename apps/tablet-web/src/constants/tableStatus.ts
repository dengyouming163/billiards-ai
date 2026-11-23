/**
 * 台桌状态常量定义
 * 文档规范：https://docs/xxx
 */

export const TABLE_STATUS = {
  IDLE: 'idle',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
} as const

export type TableStatus = typeof TABLE_STATUS[keyof typeof TABLE_STATUS]

export const TABLE_STATUS_TEXT: Record<TableStatus, string> = {
  [TABLE_STATUS.IDLE]: '空闲',
  [TABLE_STATUS.OCCUPIED]: '使用中',
  [TABLE_STATUS.RESERVED]: '已预订',
  [TABLE_STATUS.MAINTENANCE]: '维护中'
}

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  [TABLE_STATUS.IDLE]: '#2ed573',
  [TABLE_STATUS.OCCUPIED]: '#feca57',
  [TABLE_STATUS.RESERVED]: '#5352ed',
  [TABLE_STATUS.MAINTENANCE]: '#ff4757'
}

export function isTableAvailable(status: string): boolean {
  return status === TABLE_STATUS.IDLE
}

export function isTableOccupied(status: string): boolean {
  return status === TABLE_STATUS.OCCUPIED
}

export function isTableReserved(status: string): boolean {
  return status === TABLE_STATUS.RESERVED
}

export function isTableUnderMaintenance(status: string): boolean {
  return status === TABLE_STATUS.MAINTENANCE
}
