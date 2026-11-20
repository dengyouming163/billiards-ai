'use client';
// wwwpos/src/utils/ws-notification.ts

export interface WSMessage {
  type: string
  channel: string
  data: Record<string, unknown>
  timestamp: string
}

export type WSMessageHandler = (msg: WSMessage) => void
export type ConnectionStatus = 'connecting' | 'connected' | 'degraded' | 'disconnected'

const MAX_RECONNECT = 5
const PING_INTERVAL = 25000
export class PosWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private storeId: string
  private reconnectAttempts = 0
  private pingTimer: ReturnType<typeof setInterval> | null = null
  private pongCheckTimer: ReturnType<typeof setInterval> | null = null
  private lastPongTime = 0
  private handlers: Set<WSMessageHandler> = new Set()
  private status: ConnectionStatus = 'disconnected'
  private retryConnectTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(storeId: string, wsUrl?: string) {
    this.storeId = storeId
    this.url = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'wss://poolapi.kyyp.cn/wss'
  }

  connect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    this.status = 'connecting'
    console.log(`[PosWS] 正在连接到 ${this.url}`)
    try {
      this.ws = new WebSocket(this.url)
    } catch(e) {
      console.error('[PosWS] 连接失败:', e)
      this.handleDisconnect()
      return
    }

    this.ws.onopen = () => {
      console.log(`[PosWS] ✅ 已连接，订阅 store_${this.storeId}`)
      this.status = 'connected'
      this.reconnectAttempts = 0
      this.ws!.send(JSON.stringify({
        type: 'subscribe',
        data: {
          store_id: this.storeId,
          channels: [`store_${this.storeId}`],
        }
      }))
      this.lastPongTime = Date.now()
      this.pingTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'ping' }))
          // 发 ping 时顺延超时时间，防止 ping 还没回来就被误判超时
          this.lastPongTime = Date.now()
        }
      }, PING_INTERVAL)
      // pong超时检测：PING_INTERVAL + 10s 内未收到pong视为死连接
      this.pongCheckTimer = setInterval(() => {
        if (Date.now() - this.lastPongTime > PING_INTERVAL + 10000) {
          console.warn('[PosWS] ⏰ Pong超时，强制重连')
          this.ws?.close()
        }
      }, 5000)
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data)
        if (msg.type === 'pong') { this.lastPongTime = Date.now(); return }
        if (msg.type === 'subscribe_ack') return
        console.log(`[PosWS] 📩 收到消息: type=${msg.type}`, msg.data)
        for (const handler of this.handlers) {
          handler(msg)
        }
      } catch {
        // non-JSON messages silently ignored (binary/heartbeat frames)
      }
    }

    this.ws.onclose = (e) => {
      console.warn(`[PosWS] ❌ 断开: code=${e.code} reason="${e.reason}" wasClean=${e.wasClean}`)
      this.clearPing()
      this.handleDisconnect()
    }

    this.ws.onerror = () => {
      // 不主动 close — 让浏览器自然处理。若连接真断了 onclose 会触发重连；
      // 若是瞬时错误（单帧损坏），保活比强制重连更优
      const stateLabel = ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][this.ws?.readyState ?? 3]
      console.error(`[PosWS] ⚠️ 错误: url=${this.url} readyState=${stateLabel}`)
    }
  }

  private handleDisconnect(): void {
    this.reconnectAttempts++
    if (this.reconnectAttempts <= MAX_RECONNECT) {
      // 指数退避 + 随机抖动(0-500ms)，防止惊群
      const jitter = Math.floor(Math.random() * 500)
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 16000) + jitter
      this.reconnectTimer = setTimeout(() => this.connect(), delay)
    } else {
      this.status = 'degraded'
      if (!this.retryConnectTimer) {
        this.retryConnectTimer = setInterval(() => {
          this.reconnectAttempts = 0
          // 清除可能还在跑的指数退避 timer，防止双路重连竞态
          if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
          }
          this.connect()
          if (this.status === 'connected' && this.retryConnectTimer) {
            clearInterval(this.retryConnectTimer)
            this.retryConnectTimer = null
          }
        }, 60000)
      }
    }
  }

  private clearPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.pongCheckTimer) {
      clearInterval(this.pongCheckTimer)
      this.pongCheckTimer = null
    }
  }

  disconnect(): void {
    this.clearPing()
    if (this.retryConnectTimer) {
      clearInterval(this.retryConnectTimer)
      this.retryConnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null
      this.ws.onerror = null
      this.ws.close(1000)
      this.ws = null
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.status = 'disconnected'
    this.handlers.clear()
  }

  onMessage(handler: WSMessageHandler): void {
    this.handlers.add(handler)
  }

  removeMessageHandler(handler: WSMessageHandler): void {
    this.handlers.delete(handler)
  }

  getStatus(): ConnectionStatus { return this.status }
  isConnected(): boolean { return this.status === 'connected' }
  isDegraded(): boolean { return this.status === 'degraded' }
}
