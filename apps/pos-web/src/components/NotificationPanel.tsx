'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { NotificationService } from '@/services/notification-service'
import { useNotification } from '@/hooks/useNotification'
import { formatRelativeTime } from '@/lib/utils'
import type { AppNotification } from '@/services/notification-service'
import { X, CheckCheck } from 'lucide-react'
import { posApi } from '@/lib/api/pos'
import { toast } from 'sonner'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
  onNotificationClick: (n: AppNotification) => void
}

export function NotificationPanel({ open, onClose, onNotificationClick }: NotificationPanelProps) {
  const {
    notifications,
    unreadCount,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    removeNotification,
    typeTabs,
  } = useNotification()

  // 每次打开面板时强制刷新通知列表
  const [localNotifications, setLocalNotifications] = useState<typeof notifications>([])
  useEffect(() => {
    if (open) {
      setLocalNotifications([...NotificationService.getInstance().getNotifications()])
    }
  }, [open])
  const displayNotifications = localNotifications.length > 0 ? localNotifications : notifications

  const handleConfirmOpen = async (notificationId: string, token: string, action: 'confirm' | 'reject') => {
    if (!token) return
    try {
      await posApi.confirmOpen({ token, action })
      toast.success(action === 'confirm' ? '已确认开台' : '已拒绝')
      removeNotification(notificationId)
      // 通知 OpenTableRequestsModal 同步移除
      window.dispatchEvent(new CustomEvent('pos:open-request-resolved', { detail: { token } }))
    } catch (e: any) {
      toast.error(e?.msg || e?.message || '操作失败')
    }
  }

  // 监听来自 OpenTableRequestsModal 的确认/拒绝操作，同步移除通知面板条目
  useEffect(() => {
    const handler = (e: CustomEvent<{ token: string }>) => {
      // 查找包含该 token 的 table_open_confirm_request 通知并移除
      const target = notifications.find(
        n => n.type === 'table_open_confirm_request' && n.data?.token === e.detail.token
      )
      if (target) {
        removeNotification(target.id)
      }
    }
    window.addEventListener('pos:open-request-resolved', handler as EventListener)
    return () => window.removeEventListener('pos:open-request-resolved', handler as EventListener)
  }, [notifications, removeNotification])

  const handleDelete = useCallback((id: string, title: string) => {
    if (window.confirm(`确定删除通知「${title}」吗？`)) {
      removeNotification(id)
    }
  }, [removeNotification])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[400px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">消息中心</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                {unreadCount}条未读
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              全部已读
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="flex px-4 py-3 gap-2 border-b border-slate-100 overflow-x-auto">
          {typeTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && <span className="ml-1 opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="text-4xl mb-3">🔔</span>
              <p className="text-sm">暂无新消息</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {displayNotifications.map(n => {
                // 过期的开台确认请求直接隐藏
                if (n.type === 'table_open_confirm_request') {
                  const expiresAt = (n.data?.expires_at as number) || 0
                  if (expiresAt && Date.now() / 1000 > expiresAt) return null
                }
                return (
                n.type === 'table_open_confirm_request' ? (
                  <div key={n.id} className="mx-4 mb-3 bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔔</span>
                      <p className="text-sm font-semibold text-amber-800">开台确认请求</p>
                    </div>
                    <div className="space-y-1 text-sm text-amber-700">
                      <p>🎱 台桌：{String(n.data?.table_name ?? '')}</p>
                      <p>👥 人数：{String(n.data?.player_count ?? '')} 人</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
                        onClick={() => handleConfirmOpen(n.id, n.data?.token as string, 'confirm')}
                      >✅ 确认开台</button>
                      <button
                        className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                        onClick={() => handleConfirmOpen(n.id, n.data?.token as string, 'reject')}
                      >❌ 拒绝</button>
                    </div>
                  </div>
                ) : (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={() => {
                      markAsRead(n.id)
                      onNotificationClick(n)
                    }}
                    onDelete={() => handleDelete(n.id, n.title)}
                  />
                )
              )})}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function NotificationItem({
  notification,
  onClick,
  onDelete,
}: {
  notification: AppNotification
  onClick: () => void
  onDelete: () => void
}) {
  // 解析 content JSON，提取可读摘要
  const contentText = parseContent(notification.content)

  return (
    <div className="group relative">
      <div
        onClick={onClick}
        className={`px-5 py-3.5 cursor-pointer transition-colors
          ${!notification.isRead ? 'bg-emerald-50/50' : 'bg-white'}
          hover:bg-slate-50`}
      >
        <div className="flex items-start gap-3">
          {!notification.isRead && (
            <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                notification.priority === 'urgent'
                  ? 'bg-red-100 text-red-600'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {notification.typeLabel}
              </span>
              <span className="text-xs text-slate-400 flex-shrink-0">
                {formatRelativeTime(notification.createdAt)}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 mt-1 truncate">
              {notification.title}
            </p>
            {contentText && (
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {contentText}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* 删除按钮 — hover 时显示 */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
                   px-2 py-1 rounded text-xs text-red-500 hover:bg-red-50 transition-all"
      >
        删除
      </button>
    </div>
  )
}

/** 解析 content 字段：JSON → 可读文本，纯文本 → 直接返回 */
function parseContent(content: string): string {
  if (!content) return ''
  try {
    const obj = JSON.parse(content)
    // 提取关键字段组成可读摘要
    const parts: string[] = []
    if (obj.table_name) parts.push(obj.table_name)
    if (obj.player_count) parts.push(`${obj.player_count}人`)
    if (obj.assistant_name) parts.push(obj.assistant_name)
    if (obj.quantity) parts.push(`${obj.quantity}件`)
    if (obj.service_type) parts.push(obj.service_type)
    if (obj.amount) parts.push(`¥${obj.amount}`)
    return parts.join(' · ') || content
  } catch {
    return content
  }
}
