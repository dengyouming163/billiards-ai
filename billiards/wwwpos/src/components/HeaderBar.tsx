'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/lib/auth-context';
import {
  Clock,
  WifiOff,
  RefreshCw,
  User,
  LogOut,
  Play,
} from 'lucide-react';
import { NotificationBadge } from '@/components/NotificationBadge'
import { useNotification } from '@/hooks/useNotification'

interface HeaderBarProps {
  onShiftClick: () => void;
}

export function HeaderBar({ onShiftClick }: HeaderBarProps) {
  const { state } = useApp();
  const { user } = useAuth();
  const { currentShift, currentOperator, networkStatus } = state;

  const { unreadCount, panelOpen, setPanelOpen, muted, toggleMute } = useNotification(user?.storeId)

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  return (
    <header className="h-20 bg-gradient-to-r from-white via-white to-[#f7f7f7] px-7 flex items-center justify-between shadow-[0_2px_20px_rgba(0,0,0,0.06)] border-b border-[#e5e5e5]/50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-[#07C160]/5 to-transparent pointer-events-none" />
      {/* Left - Logo & Title */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-lg shadow-emerald-200/30">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <circle cx="12" cy="12" r="10" fillOpacity="0.3" />
              <circle cx="12" cy="12" r="6" fillOpacity="0.5" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#333333]">客稻云</h1>
            <p className="text-sm text-[#999999]">台球厅收银系统</p>
          </div>
        </div>

        <div className="h-10 w-px bg-[#e5e5e5] mx-2" />

        <div className="text-right" suppressHydrationWarning>
          <p className="text-sm font-medium text-[#999999]" suppressHydrationWarning>{formatDate(currentTime)}</p>
          <p className="text-xl font-bold font-mono text-[#333333]" suppressHydrationWarning>{formatTime(currentTime)}</p>
        </div>
      </div>

      {/* Right - Notification + Network + User + Shift */}
      <div className="flex items-center gap-5">
        <NotificationBadge
          count={unreadCount}
          onClick={() => setPanelOpen(true)}
          muted={muted}
          onToggleMute={toggleMute}
        />

        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
          networkStatus === 'online'
            ? 'bg-[#D1FAE5] text-[#07C160]'
            : networkStatus === 'offline'
            ? 'bg-[#FEF3C7] text-[#F59E0B]'
            : 'bg-[#DBEAFE] text-[#3B82F6]'
        }`}>
          {networkStatus === 'online' ? (
            <><span className="w-2.5 h-2.5 rounded-full bg-[#07C160]" />在线</>
          ) : networkStatus === 'offline' ? (
            <><WifiOff className="w-4 h-4" />离线模式</>
          ) : (
            <><RefreshCw className="w-4 h-4 animate-spin" />同步中</>
          )}
        </div>

        {(currentOperator || user) ? (
          <div className="flex items-center gap-4 pl-5 border-l border-[#e5e5e5]">
            {!currentShift && (
              <button
                onClick={onShiftClick}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D1FAE5] text-[#07C160] text-sm font-medium hover:bg-[#A7F3D0] transition-colors"
              >
                <Play className="w-4 h-4" />
                上班
              </button>
            )}
            {/* 点击可切换员工 / 交接班 */}
            <button
              onClick={onShiftClick}
              className="flex items-center gap-3 hover:bg-[#f7f7f7] rounded-xl px-3 py-2 transition-colors"
              title={currentShift ? '点击交接班或切换员工' : '点击上班打卡'}
            >
              <div className="flex items-center gap-1.5">
                {currentShift && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-base font-medium text-[#333333]">
                  {currentOperator?.name || user?.name || ''}
                </p>
                <p className="text-sm text-[#999999]">
                  {currentShift ? '当班中' : '未上班'}
                </p>
              </div>
            </button>
          </div>
        ) : (
          <button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-[#999999] hover:text-[#07C160] transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="text-base">登录</span>
          </button>
        )}
      </div>
    </header>
  );
}
