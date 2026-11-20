'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import {
  Clock,
  WifiOff,
  RefreshCw,
  User,
  LogOut,
} from 'lucide-react';

interface HeaderBarProps {
  onShiftClick: () => void;
}

export function HeaderBar({ onShiftClick }: HeaderBarProps) {
  const { state } = useApp();
  const { currentShift, currentOperator, networkStatus } = state;

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
    <header className="h-16 bg-gradient-to-r from-slate-800 to-slate-700 px-6 flex items-center justify-between shadow-lg">
      {/* Left - Logo & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/30">
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 text-white"
              fill="currentColor"
            >
              <circle cx="12" cy="12" r="10" fillOpacity="0.3" />
              <circle cx="12" cy="12" r="6" fillOpacity="0.5" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">
              台球厅收银系统
            </h1>
            <p className="text-xs text-slate-300">
              Billiards POS
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-500 mx-2" />

        {/* Date & Time */}
        <div className="flex items-center gap-4">
          <div className="text-right" suppressHydrationWarning>
            <p className="text-sm font-medium text-slate-300" suppressHydrationWarning>{formatDate(currentTime)}</p>
            <p className="text-lg font-bold font-mono text-white" suppressHydrationWarning>
              {formatTime(currentTime)}
            </p>
          </div>
        </div>
      </div>

      {/* Center - Shift Info */}
      <div className="flex items-center gap-6">
        {currentShift ? (
          <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-white">
                班次进行中 - {currentShift.operatorName}
              </p>
              <p className="text-xs text-slate-300">
                开班于{' '}
                {new Date(currentShift.startTime).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <button
              onClick={onShiftClick}
              className="px-4 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:opacity-90 transition-all"
            >
              交接班
            </button>
          </div>
        ) : (
          <button
            onClick={onShiftClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-slate-500 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 transition-all"
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">开始班次</span>
          </button>
        )}
      </div>

      {/* Right - Status & User */}
      <div className="flex items-center gap-4">
        {/* Network Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium ${
            networkStatus === 'online'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : networkStatus === 'offline'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
          }`}
        >
          {networkStatus === 'online' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              在线
            </>
          ) : networkStatus === 'offline' ? (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              离线模式
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              同步中
            </>
          )}
        </div>

        {/* User */}
        {currentOperator ? (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-500">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{currentOperator.name}</p>
              <p className="text-xs text-slate-300">
                {currentOperator.role === 'manager'
                  ? '店长'
                  : currentOperator.role === 'admin'
                  ? '管理员'
                  : '收银员'}
              </p>
            </div>
          </div>
        ) : (
          <button className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">登录</span>
          </button>
        )}
      </div>
    </header>
  );
}
