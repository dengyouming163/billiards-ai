// wwwpos/src/hooks/useNotification.ts

import { useState, useEffect, useMemo, useCallback } from 'react'
import { NotificationService, type AppNotification, type NotificationType } from '@/services/notification-service'
import { notificationSound } from '@/utils/notification-sound'

const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  service_call: '服务',
  table_open: '开台',
  new_order: '订单',
  assistant_apply: '助教',
  table_timeout: '预警',
  checkout_remind: '预警',
  low_stock: '库存',
  system_notice: '系统',
  table_open_confirm_request: '确认',
  table_open_confirmed: '已确认',
  table_open_rejected: '已拒绝',
}

export function useNotification(storeId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState<NotificationType | 'all'>('all')
  const [muted, setMuted] = useState(notificationSound.isMuted())
  const [panelOpen, setPanelOpenState] = useState(false)

  // panelOpen 使用 NotificationService 共享状态（跨多个 useNotification hook 实例）
  const service = NotificationService.getInstance()
  const setPanelOpen = useCallback((v: boolean) => { service.setPanelOpen(v) }, [])
  useEffect(() => {
    setPanelOpenState(service.panelOpen)
    return service.onPanelOpenChange(setPanelOpenState)
  }, [])

  useEffect(() => {
    const service = NotificationService.getInstance()
    if (storeId) {
      service.init(storeId)
    }
    setNotifications([...service.getNotifications()])
    setUnreadCount(service.getUnreadCount())

    const unsub = service.subscribe(() => {
      setNotifications([...service.getNotifications()])
      setUnreadCount(service.getUnreadCount())
    })
    const unsubCount = service.onUnreadCountChange((count) => {
      setUnreadCount(count)
    })

    return () => {
      unsub()
      unsubCount()
    }
  }, [storeId])

  const filtered = useMemo(() => {
    if (activeTab === 'all') return notifications
    return notifications.filter(n => n.type === activeTab)
  }, [notifications, activeTab])

  const markAsRead = useCallback((id: string) => {
    NotificationService.getInstance().markAsRead(id)
    setNotifications([...NotificationService.getInstance().getNotifications()])
  }, [])

  const markAllAsRead = useCallback(() => {
    NotificationService.getInstance().markAllAsRead()
    setNotifications([...NotificationService.getInstance().getNotifications()])
  }, [])

  const removeNotification = useCallback((id: string) => {
    NotificationService.getInstance().removeNotification(id)
    setNotifications([...NotificationService.getInstance().getNotifications()])
  }, [])

  const toggleMute = useCallback(() => {
    const newMuted = !muted
    setMuted(newMuted)
    notificationSound.setMuted(newMuted)
  }, [muted])

  const typeTabs = useMemo(() => {
    const tabs: Array<{ key: NotificationType | 'all'; label: string; count: number }> = [
      { key: 'all', label: '全部', count: notifications.filter(n => !n.isRead).length },
    ]
    const types: NotificationType[] = ['table_open_confirm_request', 'new_order', 'service_call', 'table_open', 'assistant_apply', 'table_timeout', 'low_stock', 'system_notice']
    for (const t of types) {
      const unread = notifications.filter(n => n.type === t && !n.isRead).length
      if (unread > 0) {
        tabs.push({ key: t, label: NOTIFICATION_TYPE_LABELS[t], count: unread })
      }
    }
    return tabs
  }, [notifications])

  return {
    notifications: filtered,
    unreadCount,
    activeTab,
    setActiveTab,
    panelOpen,
    setPanelOpen,
    muted,
    toggleMute,
    markAsRead,
    markAllAsRead,
    removeNotification,
    typeTabs,
  }
}
