import config from '@/config'

interface WebSocketMessage {
  type: string
  channel?: string
  data?: any
  timestamp?: number
}

interface OrderItemStatusData {
  order_id: string | number
  item_id: string | number
  status: string
  timestamp?: number
}

interface ServiceCallResponseData {
  call_id: string | number
  status: 'pending' | 'processing' | 'completed'
  handler?: string
  message?: string
  timestamp?: number
}

type OrderItemStatusCallback = (data: OrderItemStatusData) => void
type ServiceCallResponseCallback = (data: ServiceCallResponseData) => void
type EventHandler = (data: any, message: WebSocketMessage) => void

interface ConnectionState {
  connected: boolean
  connecting: boolean
  reconnectAttempts: number
  tableId: string | number | null
  storeId: string | number | null
  wsUrl: string
}

const WS_CONFIG = {
  PING_INTERVAL: 25000,
  MAX_RECONNECT_ATTEMPTS: 5,
  BASE_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000
}

class TableWebSocket {
  private ws: UniApp.SocketTask | null = null
  private state: ConnectionState = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
    tableId: null,
    storeId: null,
    wsUrl: ''
  }
  private pingTimer: number | null = null
  private reconnectTimer: number | null = null
  private refCount: number = 0
  private missedPongs = 0

  private handlers: Map<string, Set<EventHandler>> = new Map()
  private onOrderItemStatusChange: OrderItemStatusCallback | null = null
  private onServiceCallResponse: ServiceCallResponseCallback | null = null
  private _legacyOrderHandler: EventHandler | null = null
  private _legacyServiceHandler: EventHandler | null = null

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  private emit(event: string, data: any, message: WebSocketMessage): void {
    this.handlers.get(event)?.forEach(handler => {
      try { handler(data, message) } catch (e) {
        console.error(`[TableWS] Handler error for ${event}:`, e)
      }
    })
  }

  setOnOrderItemStatusChange(callback: OrderItemStatusCallback): void {
    if (this._legacyOrderHandler) {
      this.off('order_item_status', this._legacyOrderHandler)
    }
    this._legacyOrderHandler = (data) => callback(data as OrderItemStatusData)
    this.on('order_item_status', this._legacyOrderHandler)
  }

  setOnServiceCallResponse(callback: ServiceCallResponseCallback): void {
    if (this._legacyServiceHandler) {
      this.off('service_call_response', this._legacyServiceHandler)
    }
    this._legacyServiceHandler = (data) => callback(data as ServiceCallResponseData)
    this.on('service_call_response', this._legacyServiceHandler)
  }

  connect(tableId: string | number, storeId?: string | number, wsUrl?: string): Promise<boolean> {
    this.refCount++
    console.log(`[TableWS] connect called, refCount: ${this.refCount}`)

    if (this.state.connected || this.state.connecting) {
      console.log('[TableWS] Already connected or connecting')
      return Promise.resolve(true)
    }

    return new Promise((resolve, reject) => {
      this.state.connecting = true
      this.state.tableId = tableId
      this.state.storeId = storeId || null
      this.state.wsUrl = wsUrl || this.getDefaultWsUrl()

      console.log(`[TableWS] Connecting to ${this.state.wsUrl} for table ${tableId}`)

      try {
        this.ws = uni.connectSocket({
          url: this.state.wsUrl,
          success: () => {
            console.log('[TableWS] Socket connection initiated')
          },
          fail: (err) => {
            console.error('[TableWS] Socket connection failed:', err)
            this.state.connecting = false
            this.handleReconnect()
            reject(err)
          }
        })

        this.setupEventHandlers(resolve, reject)
      } catch (error) {
        console.error('[TableWS] Error creating socket:', error)
        this.state.connecting = false
        this.handleReconnect()
        reject(error)
      }
    })
  }

  private getDefaultWsUrl(): string {
    return config.WS_URL || 'wss://api.tpzl88.com:8282'
  }

  private setupEventHandlers(
    resolve: (value: boolean) => void,
    reject: (reason: any) => void
  ): void {
    if (!this.ws) return

    this.ws.onOpen(() => {
      console.log('[TableWS] Connection opened')
      this.state.connected = true
      this.state.connecting = false
      this.state.reconnectAttempts = 0

      this.subscribeToChannel()
      this.startPingInterval()

      resolve(true)
    })

    this.ws.onMessage((res) => {
      this.handleMessage(res.data)
    })

    this.ws.onClose((res) => {
      console.log('[TableWS] Connection closed:', res.code, res.reason)
      this.handleDisconnect()
    })

    this.ws.onError((err) => {
      console.error('[TableWS] Connection error:', err)
      this.state.connecting = false
      reject(err)
    })
  }

  private subscribeToChannel(): void {
    if (!this.state.connected) return

    const channels: string[] = []
    if (this.state.tableId) {
      channels.push(`table_${this.state.tableId}`)
    }
    if (this.state.storeId) {
      channels.push(`store_${this.state.storeId}`)
    }

    if (channels.length === 0) return

    const message: WebSocketMessage = {
      type: 'subscribe',
      data: {
        store_id: this.state.storeId || '',
        table_id: this.state.tableId || '',
        channels,
      }
    }

    this.send(message)
    console.log(`[TableWS] Subscribed to channels:`, channels)
  }

  disconnect(): void {
    this.refCount = Math.max(0, this.refCount - 1)
    console.log(`[TableWS] disconnect called, refCount: ${this.refCount}`)

    if (this.refCount > 0) {
      console.log('[TableWS] Still referenced, keeping connection')
      return
    }

    console.log('[TableWS] No more references, disconnecting')
    this.stopPingInterval()
    this.stopReconnectTimer()

    if (this.ws) {
      this.ws.close({
        code: 1000,
        reason: 'Client disconnect'
      })
      this.ws = null
    }

    this.state.connected = false
    this.state.connecting = false
    this.state.tableId = null
  }

  sendServiceCall(data: {
    service_type: string
    message?: string
    table_id?: string | number
    store_id?: string | number
  }): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.state.connected) {
        console.error('[TableWS] Cannot send service call: not connected')
        reject(new Error('Not connected'))
        return
      }

      const message: WebSocketMessage = {
        type: 'service_call',
        data: {
          ...data,
          table_id: data.table_id || this.state.tableId
        }
      }

      this.send(message)
      console.log('[TableWS] Service call sent:', data.service_type)
      resolve(true)
    })
  }

  private send(message: WebSocketMessage): void {
    if (!this.ws || !this.state.connected) {
      console.warn('[TableWS] Cannot send: not connected')
      return
    }

    try {
      this.ws.send({
        data: JSON.stringify(message)
      })
    } catch (error) {
      console.error('[TableWS] Error sending message:', error)
    }
  }

  private handleMessage(data: any): void {
    try {
      const message: WebSocketMessage = typeof data === 'string'
        ? JSON.parse(data)
        : data

      const { type, data: payload } = message

      switch (type) {
        case 'pong':
          this.missedPongs = 0
          break

        case 'order_item_status':
          this.emit('order_item_status', payload, message)
          break

        case 'service_call_ack':
          this.emit('service_call_ack', payload, message)
          break

        case 'service_call_response':
          this.emit('service_call_response', payload, message)
          break

        case 'order_update':
          this.emit('order_update', payload, message)
          break

        case 'table_status':
          this.emit('table_status', payload, message)
          break

        case 'notification':
          this.emit('notification', payload, message)
          break

        case 'subscribe_ack':
          this.emit('subscribe_ack', payload, message)
          break

        case 'table_open_confirmed':
          this.emit('table_open_confirmed', payload, message)
          break

        case 'table_open_rejected':
          this.emit('table_open_rejected', payload, message)
          break

        case 'table_open_timeout':
          this.emit('table_open_timeout', payload, message)
          break

        case 'table_released':
          this.emit('table_released', payload, message)
          break

        case 'payment_success':
          this.emit('payment_success', payload, message)
          break

        case 'service_call':
          this.emit('service_call', payload, message)
          break

        case 'new_order_item':
          this.emit('new_order_item', payload, message)
          break

        case 'preorder_confirmed':
          this.emit('preorder_confirmed', payload, message)
          break

        case 'preorder_rejected':
          this.emit('preorder_rejected', payload, message)
          break

        default:
          console.log('[TableWS] Unknown message type:', type, payload)
          this.emit(type, payload, message)
      }
    } catch (error) {
      console.error('[TableWS] Error parsing message:', error)
    }
  }

  private startPingInterval(): void {
    this.stopPingInterval()
    this.pingTimer = setInterval(() => {
      if (this.state.connected) {
        this.send({ type: 'ping' })
        this.missedPongs++
        if (this.missedPongs >= 3) {
          console.warn('[TableWS] 3 missed pongs, reconnecting...')
          this.disconnect()
          setTimeout(() => this.connect(
            this.state.tableId!,
            this.state.storeId ?? undefined,
            this.state.wsUrl
          ), 1000)
        }
      }
    }, WS_CONFIG.PING_INTERVAL) as unknown as number
  }

  private stopPingInterval(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
  }

  private handleDisconnect(): void {
    this.state.connected = false
    this.state.connecting = false
    this.stopPingInterval()
    this.handleReconnect()
  }

  private handleReconnect(): void {
    if (this.state.reconnectAttempts >= WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('[TableWS] Max reconnect attempts reached')
      return
    }

    if (!this.state.tableId) {
      console.log('[TableWS] No tableId, skipping reconnect')
      return
    }

    const delay = Math.min(
      WS_CONFIG.BASE_RECONNECT_DELAY * Math.pow(2, this.state.reconnectAttempts),
      WS_CONFIG.MAX_RECONNECT_DELAY
    )

    this.state.reconnectAttempts++
    console.log(`[TableWS] Reconnecting in ${delay}ms (attempt ${this.state.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      const tableId = this.state.tableId
      if (tableId) {
        this.connect(tableId, this.state.storeId ?? undefined, this.state.wsUrl)
          .catch((err) => console.error('[TableWS] Reconnect failed:', err))
      }
    }, delay) as unknown as number
  }

  private stopReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.state.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.state.connected
  }

  getState(): ConnectionState {
    return { ...this.state }
  }
}

export const tableWs = new TableWebSocket()

export type {
  WebSocketMessage,
  OrderItemStatusData,
  ServiceCallResponseData,
  OrderItemStatusCallback,
  ServiceCallResponseCallback
}
