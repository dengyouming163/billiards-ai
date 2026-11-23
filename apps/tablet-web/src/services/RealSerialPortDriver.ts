/**
 * RealSerialPortDriver — 真实串口硬件驱动
 *
 * 将 serial-port.ts 的 8 个导出函数包装为 SerialPortDriver 接口
 */
import type { SerialPortDriver, SerialStatusCallback } from './SerialPortDriver'
import {
  initSerialPort,
  startLeftCharging,
  startRightCharging,
  startBothCharging,
  stopLeftCharging,
  stopRightCharging,
  stopAllCharging,
  prepareChargingRuntime,
  stopChargingRuntime,
  sendKeepalive,
  closeSerialPort,
} from '@/utils/serial-port'

export class RealSerialPortDriver implements SerialPortDriver {
  private _open = false

  init(callback: SerialStatusCallback): boolean {
    const ok = initSerialPort(callback)
    this._open = ok
    return ok
  }

  startCharging(port: 'left' | 'right' | 'both'): boolean {
    if (!this._open) return false
    switch (port) {
      case 'left':  return startLeftCharging()
      case 'right': return startRightCharging()
      case 'both':  return startBothCharging()
    }
  }

  stopCharging(port: 'left' | 'right' | 'both'): boolean {
    if (!this._open) return false
    switch (port) {
      case 'left':  return stopLeftCharging()
      case 'right': return stopRightCharging()
      case 'both':  return stopAllCharging()
    }
  }

  prepareRuntime(): boolean {
    if (!this._open) return false
    return prepareChargingRuntime()
  }

  stopRuntime(): void {
    stopChargingRuntime()
  }

  sendKeepalive(): boolean {
    if (!this._open) return false
    return sendKeepalive()
  }

  isOpen(): boolean {
    return this._open
  }

  isCharging(_port: 'left' | 'right'): boolean {
    return true // 串口协议层暂不支持单端口查询，默认认为与命令一致（有 session 时 controller 已确保发送命令）
  }

  stopAllCharging(): void {
    stopAllCharging()
  }

  close(): void {
    this._open = false
    closeSerialPort()
  }
}
