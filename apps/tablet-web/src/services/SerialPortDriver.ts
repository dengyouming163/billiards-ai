/**
 * SerialPortDriver — 充电串口硬件驱动接口
 *
 * 定义硬件通信的抽象边界，使得：
 *  - ChargingController 可脱离具体硬件测试（注入 MockDriver）
 *  - 更换硬件型号时只需实现新 Driver，业务代码零改动
 */
import type { PortStatus } from '@/utils/serial-protocol'

export type SerialStatusCallback = (status: PortStatus) => void

export interface SerialPortDriver {
  /** 初始化串口并注册硬件状态回调。返回 true 表示启动成功。 */
  init(callback: SerialStatusCallback): boolean

  /** 启动指定口充电 ('left' | 'right' | 'both') */
  startCharging(port: 'left' | 'right' | 'both'): boolean

  /** 停止指定口充电 */
  stopCharging(port: 'left' | 'right' | 'both'): boolean

  /** 准备运行时环境：禁自动关机 + 发保活 + 启动保活定时器 */
  prepareRuntime(): boolean

  /** 停止运行时环境：关闭保活定时器 */
  stopRuntime(): void

  /** 发送单次保活命令 */
  sendKeepalive(): boolean

  /** 检查端口是否已打开 */
  isOpen(): boolean

  /** 检查指定口是否正在充电 */
  isCharging(port: 'left' | 'right'): boolean

  /** 停止所有口充电 */
  stopAllCharging(): void

  /** 完全关闭串口资源 */
  close(): void
}
