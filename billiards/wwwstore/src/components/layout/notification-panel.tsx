'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  type Notification,
} from '@/lib/api/header';
import { formatDistanceToNow } from '@/lib/utils';

interface NotificationPanelProps {
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
}

export function NotificationPanel({ onClose, onUnreadChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const result = await fetchNotifications({ page: 1, page_size: 20 });
      setNotifications(result.list);
      setTotal(result.total);
      const unreadCount = result.list.filter(n => !n.isRead).length;
      onUnreadChange?.(unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      onUnreadChange?.(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
      setTotal(prev => prev - 1);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-[#06B6D4]/10 text-[#0891B2]';
      case 'order': return 'bg-[#07C160]/10 text-[#06AD56]';
      case 'finance': return 'bg-[#FF976A]/10 text-[#FF7A45]';
      case 'alert': return 'bg-[#FF5252]/10 text-[#FF3B3B]';
      default: return 'bg-[#f7f7f7] text-[#999999]';
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#07C160] to-[#06AD56]">
        <div className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" />
          <span className="font-semibold">通知中心</span>
          {total > 0 && (
            <Badge className="bg-white/20 text-white text-xs">{total}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
            title="全部已读"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#07C160] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  !notification.isRead ? 'bg-[#07C160]/5' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(notification.type)}`}>
                        {notification.typeText}
                      </span>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-[#07C160] rounded-full" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {notification.content}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatDistanceToNow(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkRead(notification.id)}
                        className="p-1.5 rounded-lg hover:bg-[#07C160]/10 text-slate-400 hover:text-[#07C160] transition-colors"
                        title="标记已读"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}