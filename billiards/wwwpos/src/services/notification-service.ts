'use client';
// wwwpos/src/services/notification-service.ts

import { notificationSound } from '@/utils/notification-sound'
import { PosWebSocket, type WSMessage } from '@/utils/ws-notification'
import { notificationApi } from '@/lib/api/pos'

function generateId(): string {
  try { return crypto.randomUUID() } catch {}
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

// ---- Types ----
export type NotificationType =
  | 'service_call' | 'table_open' | 'new_order'
  | 'assistant_apply' | 'table_timeout' | 'checkout_remind'
  | 'low_stock' | 'system_notice'
  | 'table_open_confirm_request'
  | 'table_open_confirmed'
  | 'table_open_rejected'
  | 'payment_success'
  | 'checkout_completed'
  | 'table_status_change'

type NotificationPriority = 'urgent' | 'normal' | 'silent'

interface NotificationConfig {
  priority: NotificationPriority
  sound: 'alert' | 'ding' | 'subtle'
  tts: boolean
  label: string
  ttsTemplate?: string
}

export interface AppNotification {
  id: string
  type: NotificationType
  typeLabel: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  priority: NotificationPriority
  data?: { tableId?: string; tableName?: string; orderId?: string; assistantId?: string; token?: string; player_count?: number; [key: string]: unknown }
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  service_call:    { priority: 'urgent',  sound: 'alert',  tts: true,  label: '服务呼叫',   ttsTemplate: '{table} 呼叫服务 - {type}' },
  table_timeout:   { priority: 'urgent',  sound: 'alert',  tts: true,  label: '超时预警',   ttsTemplate: '注意，{table} 预付时间即将用完' },
  checkout_remind: { priority: 'urgent',  sound: 'alert',  tts: true,  label: '结账提醒',   ttsTemplate: '{table} 已超时，请提醒结账' },
  table_open:      { priority: 'normal',  sound: 'ding',   tts: true,  label: '台桌开台',   ttsTemplate: '{table} 开台，{count}人' },
  new_order:       { priority: 'normal',  sound: 'ding',   tts: true,  label: '新点单',     ttsTemplate: '{table} 新点单，{count}件' },
  assistant_apply: { priority: 'normal',  sound: 'ding',   tts: true,  label: '助教申请',   ttsTemplate: '{table} 申请助教 {assistant}' },
  low_stock:       { priority: 'silent',  sound: 'subtle', tts: false, label: '库存预警' },
  system_notice:   { priority: 'silent',  sound: 'subtle', tts: false, label: '系统公告' },
  table_open_confirm_request: { priority: 'urgent', sound: 'alert',  tts: true,  label: '开台确认', ttsTemplate: '{table} 请求开台，{count}人，请确认' },
  table_open_confirmed: { priority: 'silent', sound: 'subtle', tts: false, label: '已确认' },
  table_open_rejected:  { priority: 'silent', sound: 'subtle', tts: false, label: '已拒绝' },
  payment_success: { priority: 'normal', sound: 'ding', tts: true, label: '支付成功', ttsTemplate: '{table} 支付成功 {amount}元' },
  checkout_completed: { priority: 'normal', sound: 'ding', tts: false, label: '关台结算', ttsTemplate: '' },
  table_status_change: { priority: 'silent', sound: 'subtle', tts: false, label: '台桌变更', ttsTemplate: '' },
}

const MAX_STORED = 200 // 与内存上限对齐，避免刷新后大量丢失
const STORAGE_KEY = 'pos_notifications'
const DEDUP_WINDOW_MS = 5000 // 5s 去重窗口，防止 WS+HTTP 同一通知重复触发声音

export class NotificationService {
  private static instance: NotificationService
  private notifications: AppNotification[] = []
  private ws: PosWebSocket | null = null
  private pollingTimer: ReturnType<typeof setInterval> | null = null
  private lastFetchTime = 0
  private storeId = ''
  private subscribers: Array<(n: AppNotification) => void> = []
  private unreadCountSubscribers: Array<(count: number) => void> = []
  private recentKeys: Map<string, number> = new Map()
  // 共享状态 — 跨多个 useNotification() hook 实例
  private _panelOpen = false
  private panelSubscribers: Array<(v: boolean) => void> = []

  get panelOpen() { return this._panelOpen }
  setPanelOpen(v: boolean) {
    this._panelOpen = v
    this.panelSubscribers.forEach(fn => fn(v))
  }
  onPanelOpenChange(fn: (v: boolean) => void) {
    this.panelSubscribers.push(fn)
    return () => { const idx = this.panelSubscribers.indexOf(fn); if (idx >= 0) this.panelSubscribers.splice(idx, 1) }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  init(storeId: string): void {
    if (this.storeId === storeId && this.ws) return
    this.destroy()
    this.storeId = storeId
    this.restore()
    this.startWebSocket()
    this.startPolling()
  }

  destroy(): void {
    this.ws?.disconnect()
    this.ws = null
    if (this.pollingTimer) { clearInterval(this.pollingTimer); this.pollingTimer = null }
  }

  // ---- WebSocket ----
  private startWebSocket(): void {
    this.ws?.disconnect()
    this.ws = new PosWebSocket(this.storeId)
    this.ws.onMessage((msg) => this.onWsMessage(msg))
    this.ws.connect()
  }

  onWsMessage(msg: WSMessage): void {
    const notification = this.wsMsgToNotification(msg)
    if (notification) {
      this.enqueue(notification)
    }
  }

  private wsMsgToNotification(msg: WSMessage): AppNotification | null {
    const data = msg.data || {}
    const typeMap: Record<string, NotificationType> = {
      table_open: 'table_open',
      new_order_item: 'new_order',
      assistant_apply: 'assistant_apply',
      service_call: 'service_call',
      table_timeout: 'table_timeout',
      table_open_confirm_request: 'table_open_confirm_request',
      table_open_confirmed: 'table_open_confirmed',
      table_open_rejected: 'table_open_rejected',
      payment_success: 'payment_success',
      checkout_remind: 'checkout_remind',
      checkout_completed: 'checkout_completed',
      table_status_change: 'table_status_change',
    }
    const type = typeMap[msg.type]
    if (!type) return null

    const config = NOTIFICATION_CONFIG[type]
    const tableName = (data.table_name as string) || (data.table_number as string) || ''
    return {
      id: `ws_${generateId()}_${type}`,
      type,
      typeLabel: config.label,
      title: this.buildTitle(type, data),
      content: JSON.stringify(data),
      isRead: false,
      createdAt: (typeof msg.timestamp === 'number' ? new Date(msg.timestamp * 1000).toISOString() : msg.timestamp) || new Date().toISOString(),
      priority: config.priority,
      data: {
        tableId: data.table_id as string,
        tableName,
        orderId: data.order_id as string,
        assistantId: data.assistant_id as string,
        ...data,
      },
    }
  }

  private buildTitle(type: NotificationType, data: Record<string, unknown>): string {
    const table = (data.table_name as string) || (data.table_number as string) || '?'
    switch (type) {
      case 'table_open': return `${table} 开台，${data.player_count || '?'}人`
      case 'new_order': return `${table} 新点单`
      case 'assistant_apply': return `${table} 申请助教 ${data.assistant_name || ''}`
      case 'service_call': return `${table} 呼叫服务`
      case 'table_timeout': return `${table} 超时预警`
      case 'checkout_remind': return `${table} 预付时间已用完，请提醒结账`
      case 'table_open_confirm_request': return `${table} 请求开台，${data.player_count || '?'}人`
      case 'table_open_confirmed': return `${table} 开台已确认`
      case 'table_open_rejected': return `${table} 开台已拒绝`
      case 'payment_success': {
        const amt = data.amount || data.total_amount || data.pay_amount
        return `${table} 支付成功 ${amt ? '¥' + amt : ''}`
      }
      default: return `新通知`
    }
  }

  // ---- HTTP Polling ----
  private startPolling(): void {
    const interval = this.ws?.isConnected() ? 30000 : 10000
    this.pollingTimer = setInterval(() => this.poll(), interval)
  }

  private async poll(): Promise<void> {
    try {
      const params: Record<string, unknown> = { page_size: 20 }
      if (this.lastFetchTime > 0) {
        params.since = new Date(this.lastFetchTime).toISOString()
      }
      const result = await notificationApi.lists(params) as any
      const list = result?.lists || result?.data || result || []
      if (Array.isArray(list) && list.length > 0) {
        this.onHttpFetch(list)
      }
      this.lastFetchTime = Date.now()
    } catch (e) {
      console.warn('[NotificationService] HTTP poll failed:', e)
    }
  }

  onHttpFetch(list: any[]): void {
    for (const raw of list) {
      const id = String(raw.id || '')
      // 双重去重：检查后端 ID + 去重 key（type+tableId 在窗口内）
      const rawType = this.mapBackendType(raw.type as string)
      const tableId = raw.table_id || raw.data?.table_id || ''
      const dedupKey = `${rawType}_${tableId}`
      const lastTime = this.recentKeys.get(dedupKey)
      if (this.notifications.some(n => n.id === id)) continue
      if (lastTime && (Date.now() - lastTime) < DEDUP_WINDOW_MS) continue
      const type = this.mapBackendType(raw.type as string)
      const config = NOTIFICATION_CONFIG[type]
      const notification: AppNotification = {
        id,
        type,
        typeLabel: config.label,
        title: raw.title || '',
        content: raw.content || '',
        isRead: !!(raw.isRead || raw.is_read),
        createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
        priority: config.priority,
        data: this.extractData(raw),
      }
      this.enqueue(notification)
    }
  }

  private mapBackendType(raw: string): NotificationType {
    const map: Record<string, NotificationType> = {
      order: 'new_order',
      system: 'system_notice',
      alert: 'table_timeout',
      finance: 'low_stock',
      service_call: 'service_call',
      table_open: 'table_open',
      assistant_apply: 'assistant_apply',
      table_open_confirm_request: 'table_open_confirm_request',
      table_open_confirmed: 'table_open_confirmed',
      table_open_rejected: 'table_open_rejected',
      payment_success: 'payment_success',
      checkout_completed: 'checkout_completed',
    }
    return map[raw] || 'system_notice'
  }

  private extractData(raw: any): Record<string, unknown> | undefined {
    try {
      const data = raw.data ? (typeof raw.data === 'string' ? JSON.parse(raw.data) : raw.data) : null
      if (!data && !raw.table_id) return undefined
      return {
        tableId: data?.table_id || raw.table_id,
        tableName: data?.table_name || raw.table_name,
        orderId: data?.order_id || raw.order_id,
        ...(data || {}),
      }
    } catch {
      return raw.table_id ? { tableId: raw.table_id, tableName: raw.table_name } : undefined
    }
  }

  // ---- Core: Enqueue with dedup ----
  private enqueue(notification: AppNotification): void {
    const key = `${notification.type}_${notification.data?.tableId || ''}`
    const lastTime = this.recentKeys.get(key)
    const now = Date.now()
    if (lastTime && (now - lastTime) < DEDUP_WINDOW_MS) {
      console.log('[NotifSvc] dedup skipped:', notification.type, notification.data?.tableId)
      return
    }
    this.recentKeys.set(key, now)
    if (this.recentKeys.size > 100) {
      for (const [k, t] of this.recentKeys) {
        if (now - t > DEDUP_WINDOW_MS * 2) this.recentKeys.delete(k)
      }
    }

    this.notifications.unshift(notification)
    if (this.notifications.length > 200) {
      this.notifications = this.notifications.slice(0, 200)
    }

    this.route(notification)
    this.persist()
    // 触发收银端刷新台桌卡片状态
    const refreshTypes: NotificationType[] = [
      'table_open', 'payment_success', 'checkout_remind',
      'table_open_confirmed', 'table_open_rejected',
      'checkout_completed', 'table_status_change',
    ]
    if (refreshTypes.includes(notification.type)) {
      window.dispatchEvent(new CustomEvent('pos:refresh-tables', {
        detail: { type: notification.type, orderId: notification.data?.orderId, tableId: notification.data?.tableId }
      }))
    }
    for (const cb of this.subscribers) { cb(notification) }
    for (const cb of this.unreadCountSubscribers) { cb(this.getUnreadCount()) }
  }

  private route(notification: AppNotification): void {
    // 使用预录制 MP3 播报，根据通知类型自动匹配语音文件
    notificationSound.playNotification(notification.type)
  }

  private fillTemplate(template: string, n: AppNotification): string {
    const table = n.data?.tableName || (n.data?.table_name as string) || ''
    const amount = n.data?.amount || n.data?.total_amount || n.data?.pay_amount
    return template
      .replace('{table}', table)
      .replace('{count}', String(n.data?.player_count || n.data?.count || n.data?.quantity || '?'))
      .replace('{type}', String(n.data?.service_type || n.data?.type || ''))
      .replace('{assistant}', String(n.data?.assistant_name || n.data?.assistantName || ''))
      .replace('{amount}', amount ? String(amount) : '?')
  }

  // ---- State ----
  getNotifications(): AppNotification[] { return this.notifications }
  getUnreadCount(): number { return this.notifications.filter(n => !n.isRead).length }
  getNotificationsByType(type: NotificationType): AppNotification[] {
    return this.notifications.filter(n => n.type === type)
  }

  // ---- Actions ----
  async markAsRead(id: string): Promise<void> {
    const n = this.notifications.find(x => x.id === id)
    if (n) n.isRead = true
    this.persist()
    for (const cb of this.unreadCountSubscribers) { cb(this.getUnreadCount()) }
    try {
      await notificationApi.read(id)
    } catch (e) { console.warn('Notification sync failed:', e) }
  }

  async markAllAsRead(): Promise<void> {
    for (const n of this.notifications) { n.isRead = true }
    this.persist()
    for (const cb of this.unreadCountSubscribers) { cb(0) }
    try {
      await notificationApi.readAll()
    } catch (e) { console.warn('Notification sync failed:', e) }
  }

  async removeNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.persist()
    for (const cb of this.unreadCountSubscribers) { cb(this.getUnreadCount()) }
    // WS 通知无需调用服务端删除接口
    if (!id.startsWith('ws_')) {
      try {
        await notificationApi.delete(id)
      } catch { /* 服务端不存在时静默忽略 */ }
    }
  }

  // ---- Subscribe ----
  subscribe(cb: (n: AppNotification) => void): () => void {
    this.subscribers.push(cb)
    return () => { this.subscribers = this.subscribers.filter(x => x !== cb) }
  }
  onUnreadCountChange(cb: (count: number) => void): () => void {
    this.unreadCountSubscribers.push(cb)
    return () => { this.unreadCountSubscribers = this.unreadCountSubscribers.filter(x => x !== cb) }
  }

  // ---- Persist ----
  private persist(): void {
    try {
      const toSave = this.notifications.slice(0, MAX_STORED).map(n => ({
        id: n.id, type: n.type, title: n.title, content: n.content,
        isRead: n.isRead, createdAt: n.createdAt, data: n.data,
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch (e) { console.warn('[NotificationService] Failed to persist notifications:', e) }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as any[]
        this.notifications = parsed.map((p: any) => ({
          ...p,
          typeLabel: NOTIFICATION_CONFIG[p.type as NotificationType]?.label || '',
          priority: NOTIFICATION_CONFIG[p.type as NotificationType]?.priority || 'silent',
        }))
        for (const cb of this.unreadCountSubscribers) { cb(this.getUnreadCount()) }
      }
    } catch (e) { console.warn('[NotificationService] Failed to restore notifications:', e) }
  }
}
