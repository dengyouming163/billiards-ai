/**
 * MockSerialPortDriver — 测试用假串口驱动
 *
 * 不依赖任何硬件，所有操作在内存中模拟。
 * 提供状态注入能力方便测试 ChargingController。
 */
import type { SerialPortDriver, SerialStatusCallback } from './SerialPortDriver'
import type { PortStatus } from '@/utils/serial-protocol'

export class MockSerialPortDriver implements SerialPortDriver {
  private callback: SerialStatusCallback | null = null
  private runtimePrepared = false
  private open = false

  /** 当前模拟的硬件状态 */
  mockStatus: PortStatus = {
    leftPhone: false, rightPhone: false,
    leftCharging: false, rightCharging: false,
    leftHeartbeat: false, rightHeartbeat: false,
  }

  /** 记录所有发出的命令，便于测试断言 */
  commands: string[] = []

  // ---- SerialPortDriver impl ----

  init(callback: SerialStatusCallback): boolean {
    this.callback = callback
    this.open = true
    return true
  }

  startCharging(port: 'left' | 'right' | 'both'): boolean {
    if (!this.open) return false
    this.commands.push(`start:${port}`)
    if (port === 'left' || port === 'both') this.mockStatus.leftCharging = true
    if (port === 'right' || port === 'both') this.mockStatus.rightCharging = true
    this.notify()
    return true
  }

  stopCharging(port: 'left' | 'right' | 'both'): boolean {
    if (!this.open) return false
    this.commands.push(`stop:${port}`)
    if (port === 'left' || port === 'both') this.mockStatus.leftCharging = false
    if (port === 'right' || port === 'both') this.mockStatus.rightCharging = false
    this.notify()
    return true
  }

  prepareRuntime(): boolean {
    this.commands.push('prepareRuntime')
    this.runtimePrepared = true
    return true
  }

  stopRuntime(): void {
    this.commands.push('stopRuntime')
    this.runtimePrepared = false
  }

  sendKeepalive(): boolean {
    this.commands.push('keepalive')
    return true
  }

  isOpen(): boolean {
    return this.open
  }

  isCharging(port: 'left' | 'right'): boolean {
    return port === 'left' ? this.mockStatus.leftCharging : this.mockStatus.rightCharging
  }

  stopAllCharging(): void {
    this.commands.push('stopAll')
    this.mockStatus.leftCharging = false
    this.mockStatus.rightCharging = false
  }

  close(): void {
    this.commands.push('close')
    this.open = false
    this.callback = null
    this.runtimePrepared = false
  }

  // ---- 测试辅助 ----

  /** 模拟手机插入/移除 */
  simulatePhoneChange(left: boolean, right: boolean) {
    this.mockStatus.leftPhone = left
    this.mockStatus.rightPhone = right
    this.mockStatus.leftHeartbeat = left
    this.mockStatus.rightHeartbeat = right
    this.notify()
  }

  /** 模拟手机拔出 (触发 auto-stop) */
  simulatePhoneRemoved(port: 'left' | 'right') {
    if (port === 'left') this.mockStatus.leftPhone = false
    else this.mockStatus.rightPhone = false
    this.notify()
  }

  /** 获取运行时状态 */
  get isRuntimePrepared(): boolean { return this.runtimePrepared }
  get commandLog(): readonly string[] { return this.commands }

  /** 清除命令日志 */
  resetCommands() { this.commands = [] }

  private notify() {
    if (this.callback) {
      this.callback({ ...this.mockStatus })
    }
  }
}
