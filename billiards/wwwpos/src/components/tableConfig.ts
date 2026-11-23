'use client';

import type { TableStatus } from '@/types';

export const STATUS_CONFIG: Record<TableStatus, { label: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }> = {
  idle: {
    label: '空闲',
    bgClass: 'from-slate-100 to-slate-200',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-500'
  },
  occupied: {
    label: '使用中',
    bgClass: 'from-emerald-200 to-teal-200',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-800',
    dotClass: 'bg-emerald-600'
  },
  reserved: {
    label: '预约',
    bgClass: 'from-amber-200 to-orange-200',
    borderClass: 'border-amber-400',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-600'
  },
  maintenance: {
    label: '维护中',
    bgClass: 'from-gray-200 to-slate-300',
    borderClass: 'border-gray-400',
    textClass: 'text-gray-700',
    dotClass: 'bg-gray-500'
  },
};

export const TEMP_ORDER_STATUS = {
  temp_cleaning: {
    label: '打扫中',
    bgClass: 'from-gray-200 to-slate-300',
    borderClass: 'border-gray-400',
    textClass: 'text-gray-700',
    dotClass: 'bg-gray-500',
  },
  temp_free_trial: {
    label: '体验中',
    bgClass: 'from-blue-200 to-sky-200',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
  },
} as const;

export function getTempOrderStatus(orders: import('@/types').Order[], tableId: string) {
  return orders.find(
    (o) => o.tableId === tableId && o.status !== 'cancelled' && o.type && ['temp_cleaning', 'temp_free_trial'].includes(o.type)
  );
}

export function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分`;
  }
  return `${minutes}分钟`;
}
