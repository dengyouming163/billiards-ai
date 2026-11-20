'use client'

import { memo } from 'react'
import { Bell, Volume2, VolumeX } from 'lucide-react'

interface NotificationBadgeProps {
  count: number
  onClick: () => void
  muted: boolean
  onToggleMute: () => void
}

export const NotificationBadge = memo(function NotificationBadge({ count, onClick, muted, onToggleMute }: NotificationBadgeProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onToggleMute() }}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        title={muted ? '取消静音' : '静音'}
      >
        {muted ? (
          <VolumeX className="w-5 h-5 text-slate-400" />
        ) : (
          <Volume2 className="w-5 h-5 text-slate-500" />
        )}
      </button>

      <button
        onClick={onClick}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
        title={`通知 (${count}条未读)`}
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center
                       bg-red-500 text-white text-[11px] font-bold rounded-full px-1
                       animate-badge-pop shadow-lg shadow-red-200"
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
    </div>
  )
})
