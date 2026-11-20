'use client';

import { useApp } from '@/context/AppContext';
import {
  WifiOff,
  RefreshCw,
  Check,
  AlertTriangle,
} from 'lucide-react';

export function StatusBar() {
  const { state, syncOfflineData } = useApp();
  const { networkStatus, offlineQueue } = state;

  return (
    <footer className="h-12 bg-slate-900 border-t border-slate-700 px-6 flex items-center justify-between">
      {/* Left - Status */}
      <div className="flex items-center gap-4 text-xs">
        {networkStatus === 'offline' && (
          <div className="flex items-center gap-2 text-amber-400">
            <WifiOff className="w-3.5 h-3.5" />
            <span>离线模式 - 操作已本地保存</span>
            <span className="text-slate-400">
              ({offlineQueue.length}条待同步)
            </span>
          </div>
        )}
        {networkStatus === 'syncing' && (
          <div className="flex items-center gap-2 text-blue-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>数据同步中...</span>
          </div>
        )}
        {networkStatus === 'online' && offlineQueue.length === 0 && (
          <div className="flex items-center gap-2 text-emerald-400">
            <Check className="w-3.5 h-3.5" />
            <span>所有数据已同步</span>
          </div>
        )}
        {networkStatus === 'online' && offlineQueue.length > 0 && (
          <div className="flex items-center gap-2 text-blue-400">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>正在同步离线数据...</span>
          </div>
        )}
      </div>

      {/* Right - Info */}
      <div className="flex items-center gap-6 text-xs text-slate-400">
        <span>台球厅收银系统 v1.0.0</span>
        <span>|</span>
        <span>技术支持</span>
      </div>
    </footer>
  );
}

// Network status banner (shows when offline)
export function NetworkBanner() {
  const { state, syncOfflineData } = useApp();
  const { networkStatus, offlineQueue } = state;

  if (networkStatus === 'online') return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 py-2 text-sm font-medium ${
        networkStatus === 'offline'
          ? 'bg-amber-600 text-white'
          : 'bg-blue-600 text-white'
      }`}
    >
      {networkStatus === 'offline' ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>网络连接已断开，系统将在离线模式下运行</span>
          {offlineQueue.length > 0 && (
            <span className="px-2 py-0.5 rounded bg-white/20">
              {offlineQueue.length}条待同步
            </span>
          )}
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>正在同步离线数据...</span>
        </>
      )}
    </div>
  );
}
