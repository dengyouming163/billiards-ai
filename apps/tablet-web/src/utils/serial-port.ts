/**
 * 充电宝串口通信服务
 * 插件: android-serialport (uni_modules, id=android-serialport)
 *
 * 协议: 发送 88 XX XX 99 / 接收 AA XX XX XX XX XX XX BB
 * 路径: /dev/ttyS3 / 波特率: 9600
 */

// #ifdef APP-PLUS
// @ts-ignore uni_modules 插件仅在 APP 编译环境存在
import { SerialPortHelper } from '@/uni_modules/android-serialport'
// #endif

import { parseSerialFrame, type PortStatus } from './serial-protocol'

export type { PortStatus } from './serial-protocol'

type StatusCallback = (status: PortStatus) => void
type SerialHelper = any

const DEVICE_PATH = '/dev/ttyS3'
const BAUD_RATE = 9600
const READ_INTERVAL = 200
const POWER_KEEPALIVE_INTERVAL = 30000
const VENDOR_USB_GPIO_CANDIDATES = [25, 26, 27]

let helper: SerialHelper | null = null
let statusCallback: StatusCallback | null = null
let readBuffer = ''
let readTimer: number | null = null
let powerKeepaliveTimer: number | null = null
let portOpened = false
let lastReceiveAt = 0
let lastLoggedFrame = ''
let desiredPortState = {
  leftCharging: false,
  rightCharging: false,
}
let lastPortStatus: PortStatus = {
  leftPhone: false,
  rightPhone: false,
  leftCharging: false,
  rightCharging: false,
  leftHeartbeat: false,
  rightHeartbeat: false,
}

export function initSerialPort(callback: StatusCallback): boolean {
  statusCallback = callback
  console.log('[充电串口] initSerialPort start', { path: DEVICE_PATH, baudRate: BAUD_RATE })

  try {
    // #ifdef APP-PLUS
    helper = createHelper()
    if (!helper) {
      console.error('[充电串口] 插件未加载')
      return false
    }

    const opened = openPort()
    console.log('[充电串口] open result:', opened)
    if (!opened) {
      console.error('[充电串口] 打开失败:', DEVICE_PATH)
      return false
    }

    console.log('[充电串口] 打开成功:', DEVICE_PATH)
    startReadLoop()

    return true
    // #endif
  } catch (e) {
    console.error('[充电串口] 初始化异常:', e)
    return false
  }

  // #ifndef APP-PLUS
  return false
  // #endif
}

function createHelper(): SerialHelper | null {
  try {
    // #ifdef APP-PLUS
    const instance = new SerialPortHelper()
    console.log('[充电串口] createHelper success')
    return instance
    // #endif
  } catch (e) {
    console.error('[充电串口] createHelper error:', e)
    return null
  }

  return null
}

function configurePort(path: string) {
  if (!helper) return
  helper.setPath(path)
  helper.setBaudrate(BAUD_RATE)
  helper.dataBits(8)
  helper.parity(0)
  helper.stopBits(1)
  helper.flags(0)
  console.log('[充电串口] 参数设置完成:', path)
}

function logVendorDiagnostics() {
  if (!helper) return

  try {
    if (typeof helper.getVendorApiVersion === 'function') {
      console.log('[充电串口] YNHAPI version:', Number(helper.getVendorApiVersion()))
    }

    if (typeof helper.isVendorRootEnabled === 'function') {
      const rooted = !!helper.isVendorRootEnabled()
      console.log('[充电串口] YNHAPI root before open:', rooted)
      if (!rooted && typeof helper.enableVendorRoot === 'function') {
        const enabled = !!helper.enableVendorRoot(true)
        console.log('[充电串口] YNHAPI enableRoot(true):', enabled)
        console.log('[充电串口] YNHAPI root after enable:', !!helper.isVendorRootEnabled())
      }
    }

    if (typeof helper.getVendorGpioState === 'function') {
      for (const index of VENDOR_USB_GPIO_CANDIDATES) {
        console.log(`[充电串口] YNHAPI gpio ${index} state:`, Number(helper.getVendorGpioState(index)))
      }
    }
  } catch (e) {
    console.error('[充电串口] YNHAPI diagnostics error:', e)
  }
}

function getAvailableDevices(): string[] {
  if (!helper || typeof helper.getAllDevices !== 'function') return []

  try {
    const devices = helper.getAllDevices()
    const result = Array.isArray(devices) ? devices.filter((item: unknown) => typeof item === 'string') as string[] : []
    console.log('[充电串口] available devices:', result)
    return result
  } catch (e) {
    console.error('[充电串口] getAllDevices error:', e)
    return []
  }
}

function openPort(): boolean {
  if (!helper) {
    helper = createHelper()
    if (!helper) return false
  }

  try {
    getAvailableDevices()
    logVendorDiagnostics()
    configurePort(DEVICE_PATH)
    const opened = !!helper.open()
    console.log('[充电串口] openPort result:', { path: DEVICE_PATH, opened })
    portOpened = opened
    if (opened) {
      lastReceiveAt = 0
    }
    return opened
  } catch (e) {
    portOpened = false
    console.error('[充电串口] openPort error:', e)
    return false
  }
}

function ensurePortOpen(): boolean {
  if (!helper) {
    console.warn('[充电串口] ensurePortOpen helper missing, recreate')
    helper = createHelper()
  }
  if (!helper) return false

  if (portOpened) {
    return true
  }

  console.warn('[充电串口] ensurePortOpen reopen start')
  const reopened = openPort()
  if (reopened) {
    startReadLoop()
  }
  return reopened
}

function startReadLoop() {
  stopReadLoop()
  console.log('[充电串口] startReadLoop')

  readTimer = setInterval(() => {
    if (!helper || !helper.isOpen()) return

    try {
      const len = Number(helper.available?.())
      if (!Number.isFinite(len) || len <= 0) return

      helper.onReadData(len, 0, len, function(res: any) {
        const hex = typeof helper!.uint8ArrayToHexString === 'function'
          ? helper!.uint8ArrayToHexString(res)
          : helper!.byte2HexString(res)
        parseResponse(hex)
      })
    } catch (e) {
      console.error('[充电串口] 读取异常:', e)
    }
  }, READ_INTERVAL) as unknown as number
}

function stopReadLoop() {
  if (readTimer) {
    console.log('[充电串口] stopReadLoop')
    clearInterval(readTimer)
    readTimer = null
  }
}

function startPowerKeepalive() {
  stopPowerKeepalive()
  console.log('[充电串口] startPowerKeepalive interval:', POWER_KEEPALIVE_INTERVAL)
  powerKeepaliveTimer = setInterval(() => {
    sendKeepalive()
  }, POWER_KEEPALIVE_INTERVAL) as unknown as number
}

function stopPowerKeepalive() {
  if (powerKeepaliveTimer) {
    console.log('[充电串口] stopPowerKeepalive')
    clearInterval(powerKeepaliveTimer)
    powerKeepaliveTimer = null
  }
}

function parseResponse(hex: string) {
  lastReceiveAt = Date.now()
  readBuffer += hex.replace(/\s/g, '').toUpperCase()

  while (readBuffer.length >= 16) {
    const aaIdx = readBuffer.indexOf('AA')
    const bbIdx = readBuffer.indexOf('BB', aaIdx + 14)

    if (aaIdx === -1 || bbIdx === -1) break
    if (bbIdx - aaIdx < 14) { readBuffer = readBuffer.substring(aaIdx); break }

    const frame = readBuffer.substring(aaIdx, bbIdx + 2)
    readBuffer = readBuffer.substring(bbIdx + 2)

    const parsed = parseSerialFrame(frame)
    if (parsed && statusCallback) {
      lastPortStatus = parsed
      if (frame !== lastLoggedFrame) {
        lastLoggedFrame = frame
        console.log('[充电串口] status changed:', {
          frame,
          status: lastPortStatus,
        })
      }
      statusCallback(lastPortStatus)
    }
  }
}

function sendCommand(second: string, third: string) {
  const command = `88${second}${third}99`
  if (!helper) {
    console.warn('[充电串口] sendCommand helper missing, try reopen:', command)
  }
  if (!ensurePortOpen()) {
    console.warn('[充电串口] sendCommand failed, port not open:', command)
    return false
  }
  console.log('[充电串口] sendCommand:', command)

  try {
    if (typeof helper.sendDataString === 'function') {
      console.log('[充电串口] sendDataString direct:', command)
      helper.sendDataString(command)
      return true
    }

    if (typeof helper.parseHexStr2Byte === 'function' && typeof helper.sendData === 'function') {
      const bytes = helper.parseHexStr2Byte(command)
      console.log('[充电串口] sendData ByteArray:', command)
      helper.sendData(bytes)
      return true
    }

    if (typeof helper.sendDataUnit8Array === 'function') {
      const bytes = hexToNumberArray(command)
      console.log('[充电串口] sendDataUnit8Array bytes:', bytes)
      helper.sendDataUnit8Array(bytes)
      return true
    }

    console.error('[充电串口] no supported send method')
    return false
  } catch (e) {
    console.error('[充电串口] sendCommand exception:', e)
    portOpened = false
    return false
  }
}

function hexToNumberArray(hex: string): number[] {
  const normalized = hex.replace(/\s/g, '')
  const result: number[] = []
  for (let i = 0; i < normalized.length; i += 2) {
    result.push(parseInt(normalized.substring(i, i + 2), 16))
  }
  return result
}

function setChargingState(left: boolean, right: boolean) {
  console.log('[充电串口] setChargingState:', {
    left,
    right,
    desiredState: desiredPortState,
    currentStatus: lastPortStatus,
  })
  const sent = sendCommand(left ? '01' : '00', right ? '01' : '00')
  if (sent) {
    desiredPortState = {
      leftCharging: left,
      rightCharging: right,
    }
  }
  return sent
}

export function startLeftCharging()   { return setChargingState(true, desiredPortState.rightCharging) }
export function startRightCharging()  { return setChargingState(desiredPortState.leftCharging, true) }
export function startBothCharging()   { return setChargingState(true, true) }
export function stopLeftCharging()    { return setChargingState(false, desiredPortState.rightCharging) }
export function stopRightCharging()   { return setChargingState(desiredPortState.leftCharging, false) }
export function stopAllCharging()     { return setChargingState(false, false) }
export function disableAutoPowerOff() { return sendCommand('02', '02') }
export function startHeartbeat()      { return sendCommand('03', '03') }
export function sendKeepalive()       { return sendCommand('04', '04') }
export function prepareChargingRuntime() {
  console.log('[充电串口] prepareChargingRuntime begin')
  const disabled = disableAutoPowerOff()
  const keepaliveSent = sendKeepalive()
  startPowerKeepalive()
  return disabled && keepaliveSent
}
export function stopChargingRuntime() {
  console.log('[充电串口] stopChargingRuntime')
  stopPowerKeepalive()
}

export function closeSerialPort() {
  console.log('[充电串口] closeSerialPort')
  stopReadLoop()
  stopPowerKeepalive()
  if (helper) {
    if (typeof helper.stopReadPortData === 'function') {
      helper.stopReadPortData()
    }
    helper.close()
    helper = null
  }
  portOpened = false
  desiredPortState = {
    leftCharging: false,
    rightCharging: false,
  }
  lastPortStatus = {
    leftPhone: false,
    rightPhone: false,
    leftCharging: false,
    rightCharging: false,
    leftHeartbeat: false,
    rightHeartbeat: false,
  }
  statusCallback = null
}
