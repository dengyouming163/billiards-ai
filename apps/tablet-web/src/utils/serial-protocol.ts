/**
 * serial-protocol.ts — 充电串口协议帧解析 (零依赖纯函数)
 *
 * 帧格式: AA LL LR CL CR HL HR BB (16字符 hex = 8字节)
 *   LL=左在位  LR=右在位  CL=左充电  CR=右充电
 *   HL=左心跳  HR=右心跳
 *   '01' = true, 其他 = false
 */
export interface PortStatus {
  leftPhone: boolean
  rightPhone: boolean
  leftCharging: boolean
  rightCharging: boolean
  leftHeartbeat: boolean
  rightHeartbeat: boolean
}

/**
 * 解析一帧完整的 hex 串口数据为 PortStatus
 * @returns PortStatus 或 null (帧格式错误)
 */
export function parseSerialFrame(frame: string): PortStatus | null {
  const hex = frame.replace(/\s/g, '').toUpperCase()
  if (hex.length !== 16 || !hex.startsWith('AA') || !hex.endsWith('BB')) return null

  const b = (i: number) => hex.substring(i, i + 2)
  return {
    leftPhone:      b(2) === '01',
    rightPhone:     b(4) === '01',
    leftCharging:   b(6) === '01',
    rightCharging:  b(8) === '01',
    leftHeartbeat:  b(10) === '01',
    rightHeartbeat: b(12) === '01',
  }
}

/**
 * 构建控制命令 hex 字符串
 * 格式: 88 XX YY 99
 */
export function buildChargingCommand(leftOn: boolean, rightOn: boolean): string {
  const l = leftOn ? '01' : '00'
  const r = rightOn ? '01' : '00'
  return `88${l}${r}99`
}

/** 禁自动关机命令 */
export const CMD_DISABLE_AUTO_POWER_OFF = '88020299'
/** 心跳模式命令 */
export const CMD_START_HEARTBEAT = '88030399'
/** 保活命令 */
export const CMD_KEEPALIVE = '88040499'
