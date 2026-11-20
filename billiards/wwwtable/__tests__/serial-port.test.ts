/**
 * serial-port.test.ts — 串口帧解析纯函数测试
 *
 * 协议: AA LL LR CL CR HL HR BB (16字符 hex)
 *   LL=左在位  LR=右在位  CL=左充电  CR=右充电  HL=左心跳  HR=右心跳
 *   '01' = true, 其他 = false
 */
import { describe, it, expect } from 'vitest'
import { parseSerialFrame, buildChargingCommand, type PortStatus } from '../src/utils/serial-protocol'

function frame(hex: string): PortStatus | null {
  return parseSerialFrame(hex)
}

describe('parseSerialFrame — 串口帧解析', () => {
  // ========== 正常帧解析 ==========

  it('完整帧: 双机在位, 左口充电中, 右口空闲, 双心跳正常', () => {
    const result = frame('AA010001000101BB')
    expect(result).toEqual({
      leftPhone: true, rightPhone: false,
      leftCharging: true, rightCharging: false,
      leftHeartbeat: true, rightHeartbeat: true,
    })
  })

  it('完整帧: 只有右机在位且充电, 双心跳', () => {
    const result = frame('AA000100010101BB')
    expect(result).toEqual({
      leftPhone: false, rightPhone: true,
      leftCharging: false, rightCharging: true,
      leftHeartbeat: true, rightHeartbeat: true,
    })
  })

  it('全部状态 false 帧', () => {
    const result = frame('AA000000000000BB')
    expect(result).toEqual({
      leftPhone: false, rightPhone: false,
      leftCharging: false, rightCharging: false,
      leftHeartbeat: false, rightHeartbeat: false,
    })
  })

  it('全部状态 true 帧', () => {
    const result = frame('AA010101010101BB')
    expect(result).toEqual({
      leftPhone: true, rightPhone: true,
      leftCharging: true, rightCharging: true,
      leftHeartbeat: true, rightHeartbeat: true,
    })
  })

  // ========== 容错 ==========

  it('小写 hex 正常解析', () => {
    const result = frame('aa010001000101bb')
    expect(result).not.toBeNull()
    expect(result!.leftPhone).toBe(true)
  })

  it('含空格 hex 正常解析', () => {
    const result = frame('AA 01 00 01 00 01 01 BB')
    expect(result).not.toBeNull()
    expect(result!.leftPhone).toBe(true)
  })

  it('帧长度不足 16 返回 null', () => {
    expect(frame('AA01000100')).toBeNull()
  })

  it('帧长度超过 16 返回 null', () => {
    expect(frame('AA010001000101BBFF')).toBeNull()
  })

  it('不以 AA 开头返回 null', () => {
    expect(frame('FF010001000101BB')).toBeNull()
  })

  it('不以 BB 结尾返回 null', () => {
    expect(frame('AA010001000101FF')).toBeNull()
  })

  it('空字符串返回 null', () => {
    expect(frame('')).toBeNull()
  })

  // ========== 非 '01' 值解析为 false ==========

  it('value=00 解析为 false', () => {
    const result = frame('AA000000000000BB')!
    expect(result.leftPhone).toBe(false)
  })

  it('value=02 解析为 false (非标准值)', () => {
    // 左在位=02 → 不是 '01'，所以 false
    const result = frame('AA020000000000BB')!
    expect(result.leftPhone).toBe(false)
  })

  it('value=FF 解析为 false', () => {
    const result = frame('AAFF0000000000BB')!
    expect(result.leftPhone).toBe(false)
  })

  // ========== 混合场景 ==========

  it('左机在位但未充电, 右机不在位但充电异常', () => {
    const result = frame('AA010001000000BB')
    expect(result).toEqual({
      leftPhone: true, rightPhone: false,
      leftCharging: true, rightCharging: false,
      leftHeartbeat: false, rightHeartbeat: false,
    })
  })

  it('充电口: 双在位, 左不充电, 右充电', () => {
    const result = frame('AA010100010000BB')
    expect(result).toEqual({
      leftPhone: true, rightPhone: true,
      leftCharging: false, rightCharging: true,
      leftHeartbeat: false, rightHeartbeat: false,
    })
  })
})

describe('buildChargingCommand — 控制命令构建', () => {
  it('双口开充电 → 88010199', () => {
    expect(buildChargingCommand(true, true)).toBe('88010199')
  })

  it('双口关充电 → 88000099', () => {
    expect(buildChargingCommand(false, false)).toBe('88000099')
  })

  it('左开右关 → 88010099', () => {
    expect(buildChargingCommand(true, false)).toBe('88010099')
  })

  it('左关右开 → 88000199', () => {
    expect(buildChargingCommand(false, true)).toBe('88000199')
  })
})
