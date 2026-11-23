'use client';

import { useState } from 'react';
import { X, Calendar, Clock, Users, Phone, MessageSquare, Plus, Check, XCircle, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Reservation, ReservationSource } from '@/types';

interface ReservationModalProps {
  isOpen?: boolean;
  onClose: () => void;
}

export default function ReservationModal({ isOpen = true, onClose }: ReservationModalProps) {
  const { state, addReservation, cancelReservation, checkInReservation } = useApp();
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    reservationTime: '',
    duration: 120,
    customerCount: 2,
    tableId: '',
    source: 'phone' as ReservationSource,
    remarks: '',
  });

  if (!isOpen) return null;

  const { reservations } = state;
  const now = new Date();
  
  // 按状态分组
  const todayReservations = reservations
    .filter((r) => {
      const resDate = new Date(r.reservationTime).toDateString();
      return resDate === now.toDateString() && r.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());

  const upcomingReservations = reservations
    .filter((r) => {
      const resDate = new Date(r.reservationTime);
      return resDate > now && r.status !== 'cancelled';
    })
    .sort((a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime());

  const statusConfig: Record<Reservation['status'], { label: string; color: string; bg: string }> = {
    pending: { label: '待确认', color: 'text-amber-600', bg: 'bg-amber-50' },
    confirmed: { label: '已确认', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    checked_in: { label: '已到店', color: 'text-blue-600', bg: 'bg-blue-50' },
    cancelled: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-100' },
    no_show: { label: '未到店', color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  const sourceLabels: Record<ReservationSource, string> = {
    phone: '电话预约',
    wechat: '微信预约',
    app: 'APP预约',
    walk_in: '现场预约',
  };

  const handleSubmit = () => {
    if (!formData.customerName || !formData.customerPhone || !formData.reservationTime) {
      return;
    }

    addReservation({
      ...formData,
      status: 'pending',
      operatorId: state.currentOperator?.id || 'system',
      notifySent: false,
    });

    // Reset form
    setFormData({
      customerName: '',
      customerPhone: '',
      reservationTime: '',
      duration: 120,
      customerCount: 2,
      tableId: '',
      source: 'phone',
      remarks: '',
    });
    setActiveTab('list');
  };

  const formatTime = (time: string) => {
    const date = new Date(time);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (time: string) => {
    const date = new Date(time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `今天 ${formatTime(time)}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `明天 ${formatTime(time)}`;
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const ReservationCard = ({ reservation }: { reservation: Reservation }) => {
    const status = statusConfig[reservation.status];
    const table = reservation.tableId ? state.tables.find((t) => t.id === reservation.tableId) : null;
    const isToday = new Date(reservation.reservationTime).toDateString() === now.toDateString();
    const isPast = new Date(reservation.reservationTime) < now;

    return (
      <div className={`p-4 rounded-2xl border ${isToday ? 'border-amber-200 bg-amber-50/50' : 'border-slate-100 bg-white'}`}>
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
          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            {formatDate(reservation.reservationTime)}
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

        {table && (
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600">
              桌台：{table.name}
            </span>
          </div>
        )}

        {reservation.remarks && (
          <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg mb-3">
            <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
            <p className="text-sm text-slate-500">{reservation.remarks}</p>
          </div>
        )}

        {reservation.status === 'pending' || reservation.status === 'confirmed' ? (
          <div className="flex gap-2">
            {isToday && !isPast && (
              <button
                onClick={() => {
                  const idleTable = reservation.tableId
                    ? state.tables.find((t) => t.id === reservation.tableId && t.status === 'idle')
                    : state.tables.find((t) => t.status === 'idle');
                  if (idleTable) {
                    checkInReservation(reservation.id, idleTable.id);
                  }
                }}
                className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
              >
                <Check className="w-4 h-4 inline mr-1" />
                开台
              </button>
            )}
            <button
              onClick={() => cancelReservation(reservation.id)}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              取消
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">预约管理</h2>
              <p className="text-white/80 text-sm">
                今日预约 {todayReservations.length} | 待到店 {upcomingReservations.length}
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

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex gap-4">
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

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>
          {activeTab === 'list' ? (
            <div className="space-y-6">
              {/* Today's Reservations */}
              {todayReservations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">今日预约</h3>
                  <div className="space-y-3">
                    {todayReservations.map((res) => (
                      <ReservationCard key={res.id} reservation={res} />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Reservations */}
              {upcomingReservations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">即将到来</h3>
                  <div className="space-y-3">
                    {upcomingReservations.slice(0, 5).map((res) => (
                      <ReservationCard key={res.id} reservation={res} />
                    ))}
                  </div>
                </div>
              )}

              {todayReservations.length === 0 && upcomingReservations.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无预约记录</p>
                </div>
              )}
            </div>
          ) : (
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
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
                    <option value={60}>1小时</option>
                    <option value={120}>2小时</option>
                    <option value={180}>3小时</option>
                    <option value={240}>4小时</option>
                    <option value={360}>6小时</option>
                    <option value={480}>8小时</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">预约来源</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as ReservationSource })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  >
                    <option value="phone">电话预约</option>
                    <option value="wechat">微信预约</option>
                    <option value="app">APP预约</option>
                    <option value="walk_in">现场预约</option>
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
                  {state.tables.filter((t) => t.status === 'idle').map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.type === 'vip' ? 'VIP' : '普通'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="特殊要求..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!formData.customerName || !formData.customerPhone || !formData.reservationTime}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认预约
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
