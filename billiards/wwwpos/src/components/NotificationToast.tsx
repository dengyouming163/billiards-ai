'use client'

import { useEffect, useState } from 'react'
import type { AppNotification } from '@/services/notification-service'
import { formatRelativeTime } from '@/lib/utils'

interface NotificationToastProps {
  activeToast: AppNotification | null
  onDismiss: () => void
  onToastClick: (n: AppNotification) => void
  /** 自动消失时间（毫秒），默认 4000；服务呼叫等紧急通知建议更长时间 */
  duration?: number
}

const BORDER_COLORS: Record<string, string> = {
  service_call: 'border-l-red-500',
  table_timeout: 'border-l-amber-500',
  checkout_remind: 'border-l-amber-500',
}

export function NotificationToast({ activeToast, onDismiss, onToastClick, duration = 4000 }: NotificationToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!activeToast) {
      setExiting(false)
      return
    }
    setExiting(false)
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onDismiss, 200)
    }, duration)
    return () => clearTimeout(timer)
  }, [activeToast, onDismiss, duration])

  if (!activeToast) return null

  const borderColor = BORDER_COLORS[activeToast.type] || 'border-l-emerald-500'

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div
        onClick={() => onToastClick(activeToast)}
        className={`pointer-events-auto w-[360px] bg-white rounded-xl shadow-2xl border border-slate-200
                    border-l-4 ${borderColor}
                    ${exiting ? 'animate-slide-out-right' : 'animate-slide-in-right'}
                    cursor-pointer hover:shadow-xl transition-shadow`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  activeToast.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {activeToast.typeLabel}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">{activeToast.title}</p>
              <p className="text-xs text-slate-400 mt-1">
                {formatRelativeTime(activeToast.createdAt)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss() }}
              className="text-slate-300 hover:text-slate-500 flex-shrink-0"
            >
              ✕
            </button>
          </div>
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-slate-300 rounded-full animate-shrink-width" />
          </div>
        </div>
      </div>
    </div>
  )
}

