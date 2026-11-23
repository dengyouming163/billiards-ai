'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNotification } from '@/hooks/useNotification'
import { NotificationToast } from '@/components/NotificationToast'
import { NotificationPanel } from '@/components/NotificationPanel'
import type { AppNotification } from '@/services/notification-service'
import { NotificationService } from '@/services/notification-service'

export function NotificationOverlay() {
  const { notifications, panelOpen, setPanelOpen } = useNotification()
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null)
  // 已消除的 toast ID 集合，防止消除后立即重现
  const dismissedIds = useRef<Set<string>>(new Set())
  // 服务呼叫重复提醒定时器

  // 组件卸载时销毁 NotificationService（停止 WS、轮询、TTS 等）
  useEffect(() => {
    return () => {
      NotificationService.getInstance().destroy()
    }
  }, [])

  // Show the most recent urgent unread notification as toast （排除刚消除的）
  useEffect(() => {
    const urgent = notifications.find(
      n => n.priority === 'urgent' && !n.isRead && !dismissedIds.current.has(n.id)
    )
    setActiveToast(urgent || null)
  }, [notifications])

  const handleToastDismiss = useCallback(() => {
    if (activeToast) {
      dismissedIds.current.add(activeToast.id)
      // 30秒后允许同一条通知再次弹出（如果仍未读）
      setTimeout(() => {
        dismissedIds.current.delete(activeToast.id)
      }, 30000)
    }
    setActiveToast(null)
  }, [activeToast])

  const handleToastClick = useCallback((_n: AppNotification) => {
    setPanelOpen(true)
  }, [setPanelOpen])

  const handlePanelNotificationClick = useCallback((n: AppNotification) => {
    setPanelOpen(false)
    if (n.data?.tableId) {
      // 通过自定义事件通知 HeaderBar 选中台桌（避免 require() hack）
      window.dispatchEvent(new CustomEvent('pos:select-table', { detail: { tableId: n.data.tableId } }))
    }
  }, [setPanelOpen])

  return (
    <>
      <NotificationToast
        activeToast={activeToast}
        onDismiss={handleToastDismiss}
        onToastClick={handleToastClick}
        duration={activeToast?.type === 'service_call' ? 8000 : activeToast?.priority === 'urgent' ? 6000 : 4000}
      />
      <NotificationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNotificationClick={handlePanelNotificationClick}
      />
    </>
  )
}
