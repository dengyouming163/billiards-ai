'use client';

import { useState, useEffect, useCallback } from 'react';
import { reservationApi, tableApi } from '@/lib/api/pos';
import { X, Calendar, Clock, Users, Phone, MessageSquare, Plus, Check, XCircle, User, Loader2 } from 'lucide-react';
import type { Table } from '@/types';

interface ReservationItem {
  id: string;
  tableId: string;
  tableName: string;
  customerName: string;
  customerPhone: string;
  customerCount: number;
  reservationTime: string;
  duration: number;
  source: string;
  status: string;
  remark: string;
  createdAt: string;
}

interface ReservationModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  reservationTime: string;
  duration: number;
  customerCount: number;
  tableId: string;
  source: string;
  remark: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待确认', color: 'text-amber-600', bg: 'bg-amber-50' },
  confirmed: { label: '已确认', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  checked_in: { label: '已到店', color: 'text-blue-600', bg: 'bg-blue-50' },
  cancelled: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-100' },
  no_show: { label: '未到店', color: 'text-rose-600', bg: 'bg-rose-50' },
};

const SOURCE_LABELS: Record<string, string> = {
  phone: '电话',
  wechat: '微信',
  app: 'APP',
  walk_in: '现场',
};

const DURATION_OPTIONS = [
  { value: 60, label: '1小时' },
  { value: 120, label: '2小时' },
  { value: 180, label: '3小时' },
  { value: 240, label: '4小时' },
  { value: 360, label: '6小时' },
  { value: 480, label: '8小时' },
];

const SOURCE_OPTIONS = [
  { value: 'phone', label: '电话预约' },
  { value: 'wechat', label: '微信预约' },
  { value: 'app', label: 'APP预约' },
  { value: 'walk_in', label: '现场预约' },
];

const COUNT_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function getDefaultDatetime(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function createInitialForm(): FormData {
  return {
    customerName: '',
    customerPhone: '',
    reservationTime: getDefaultDatetime(),
    duration: 120,
    customerCount: 2,
    tableId: '',
    source: 'phone',
    remark: '',
  };
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const normalized = dateStr.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function formatTime(time: string) {
  const date = parseDate(time);
  if (!date) return time;
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(time: string) {
  const date = parseDate(time);
  if (!date) return time;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return `今天 ${formatTime(time)}`;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return `明天 ${formatTime(time)}`;
  }
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ReservationModal({ onClose, onSuccess }: ReservationModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<FormData>(createInitialForm());
  const [tables, setTables] = useState<Table[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await reservationApi.lists();
      setReservations((result as unknown as ReservationItem[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载预约列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTables = useCallback(async () => {
    try {
      const result = await tableApi.lists();
      setTables(result || []);
    } catch {
      // table list is optional for the form
    }
  }, []);

  useEffect(() => {
    loadReservations();
    loadTables();
  }, [loadReservations, loadTables]);

  const now = new Date();
  const activeStatuses = (r: ReservationItem) => r.status !== 'cancelled' && r.status !== 'no_show';

  const todayReservations = reservations
    .filter((r) => {
      if (!activeStatuses(r)) return false;
      const d = parseDate(r.reservationTime);
      return d && d.toDateString() === now.toDateString();
    })
    .sort((a, b) => {
      const da = parseDate(a.reservationTime);
      const db = parseDate(b.reservationTime);
      return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
    });

  const upcomingReservations = reservations
    .filter((r) => {
      if (!activeStatuses(r)) return false;
      const d = parseDate(r.reservationTime);
      if (!d) return false;
      return d.toDateString() !== now.toDateString() && d > now;
    })
    .sort((a, b) => {
      const da = parseDate(a.reservationTime);
      const db = parseDate(b.reservationTime);
      return (da?.getTime() ?? 0) - (db?.getTime() ?? 0);
    });

  const pastReservations = reservations
    .filter((r) => {
      if (!activeStatuses(r)) return false;
      if (todayReservations.some((t) => t.id === r.id) || upcomingReservations.some((u) => u.id === r.id)) return false;
      return true;
    });

  const hasTodayReservation = todayReservations.length > 0;
  const hasUpcomingReservation = upcomingReservations.length > 0;
  const hasPastReservation = pastReservations.length > 0;
  const isEmpty = reservations.filter(activeStatuses).length === 0;

  const handleAction = async (id: string, action: string, apiCall: () => Promise<unknown>) => {
    setActionLoading((prev) => ({ ...prev, [id]: action }));
    try {
      await apiCall();
      await loadReservations();
      onSuccess?.();
    } catch {
      // error handled by API client
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.customerName.trim() || !formData.customerPhone.trim() || !formData.reservationTime) {
      return;
    }

    setSubmitting(true);
    try {
      await reservationApi.create({
        customer_name: formData.customerName.trim(),
        customer_phone: formData.customerPhone.trim(),
        reservation_time: formData.reservationTime,
        duration: formData.duration,
        customer_count: formData.customerCount,
        table_id: formData.tableId || undefined,
        source: formData.source,
        remark: formData.remark.trim(),
      });

      setFormData(createInitialForm());
      setActiveTab('list');
      await loadReservations();
      onSuccess?.();
    } catch {
      // error handled by API client
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = formData.customerName.trim() && formData.customerPhone.trim() && formData.reservationTime;

  const renderSpinner = () => (
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
  );

  const renderActionButtons = (reservation: ReservationItem) => {
    const resTime = parseDate(reservation.reservationTime);
    const isToday = resTime && resTime.toDateString() === now.toDateString();
    const isPast = resTime ? resTime < now : true;
    const loadingAction = actionLoading[reservation.id];

    if (reservation.status === 'pending') {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction(reservation.id, 'confirm', () => reservationApi.confirm(reservation.id))}
            disabled={!!loadingAction}
            className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loadingAction === 'confirm' ? renderSpinner() : <Check className="w-4 h-4" />}
            确认
          </button>
          <button
            onClick={() => handleAction(reservation.id, 'cancel', () => reservationApi.cancel(reservation.id))}
            disabled={!!loadingAction}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loadingAction === 'cancel' ? renderSpinner() : <XCircle className="w-4 h-4" />}
            取消
          </button>
        </div>
      );
    }

    if (reservation.status === 'confirmed') {
      return (
        <div className="flex gap-2">
          {isToday && !isPast && (
            <button
              onClick={() => handleAction(reservation.id, 'checkin', () => reservationApi.checkIn(reservation.id))}
              disabled={!!loadingAction}
              className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
            >
              {loadingAction === 'checkin' ? renderSpinner() : <Check className="w-4 h-4" />}
              开台
            </button>
          )}
          <button
            onClick={() => handleAction(reservation.id, 'cancel', () => reservationApi.cancel(reservation.id))}
            disabled={!!loadingAction}
            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {loadingAction === 'cancel' ? renderSpinner() : <XCircle className="w-4 h-4" />}
            取消
          </button>
        </div>
      );
    }

    return null;
  };

  const renderCard = (reservation: ReservationItem) => {
    const status = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending;
    const d = parseDate(reservation.reservationTime);
    const isToday = d && d.toDateString() === now.toDateString();

    return (
      <div
        key={reservation.id}
        className={`p-4 rounded-2xl border ${isToday ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg}`}>
              <User className={`w-5 h-5 ${status.color}`} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{reservation.customerName}</h4>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="w-3 h-3" />
                {reservation.customerPhone}
              </div>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color} shrink-0`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formatDateLabel(reservation.reservationTime)}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            {reservation.duration}分钟
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-slate-400" />
            {reservation.customerCount}人
          </div>
        </div>

        {reservation.source && (
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
              {SOURCE_LABELS[reservation.source] || reservation.source}
            </span>
            {reservation.tableName && (
              <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
                桌台：{reservation.tableName}
              </span>
            )}
          </div>
        )}

        {reservation.remark && (
          <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg mb-3">
            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-500">{reservation.remark}</p>
          </div>
        )}

        {renderActionButtons(reservation)}
      </div>
    );
  };

  const renderListTab = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={loadReservations}
            className="px-5 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Calendar className="w-14 h-14 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium mb-1">暂无预约记录</p>
          <p className="text-sm text-slate-400">当前没有待处理的预约</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {hasTodayReservation && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">今日预约</h3>
            <div className="space-y-3">
              {todayReservations.map(renderCard)}
            </div>
          </div>
        )}

        {hasUpcomingReservation && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">即将到来</h3>
            <div className="space-y-3">
              {upcomingReservations.slice(0, 10).map(renderCard)}
            </div>
          </div>
        )}

        {hasPastReservation && (
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-3">过去的预约</h3>
            <div className="space-y-3">
              {pastReservations.map(renderCard)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAddTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">客户姓名</label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            placeholder="请输入姓名"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">联系电话</label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
            placeholder="请输入电话"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">预约时间</label>
          <input
            type="datetime-local"
            value={formData.reservationTime}
            onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">预约人数</label>
          <select
            value={formData.customerCount}
            onChange={(e) => setFormData({ ...formData, customerCount: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          >
            {COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}人</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">预约时长</label>
          <select
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          >
            {DURATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">预约来源</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
          >
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">指定桌台（可选）</label>
        <select
          value={formData.tableId}
          onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
        >
          <option value="">不指定</option>
          {tables.filter((t) => t.status === 'idle').map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.type === 'vip' ? 'VIP' : '普通'})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
        <textarea
          value={formData.remark}
          onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
          rows={3}
          placeholder="特殊要求..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isFormValid || submitting}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting ? renderSpinner() : '确认预约'}
      </button>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl animate-scale-in" style={{ width: '50vw', height: '80vh' }}>
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">预约管理</h2>
              <p className="text-white/80 text-sm">
                今日 {todayReservations.length} | 即将到来 {upcomingReservations.length} | 共 {reservations.filter(activeStatuses).length} 条
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'list'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            预约列表
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'add'
                ? 'bg-emerald-500 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            新增预约
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'list' ? renderListTab() : renderAddTab()}
        </div>
      </div>
    </>
  );
}
