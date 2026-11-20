'use client';

import { useState } from 'react';
import { X, Users, Star, Clock, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Technician, TechnicianLevel } from '@/types';

interface TechnicianModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelect?: (technician: Technician) => void;
  selectionMode?: boolean;
}

export default function TechnicianModal({ isOpen = true, onClose, onSelect, selectionMode = false }: TechnicianModalProps) {
  const { state, dispatch } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const { technicians } = state;

  const levelConfig: Record<TechnicianLevel, { label: string; color: string; bg: string }> = {
    junior: { label: '初级助教', color: 'text-slate-600', bg: 'bg-slate-100' },
    senior: { label: '高级助教', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    master: { label: '明星助教', color: 'text-purple-600', bg: 'bg-purple-100' },
    champion: { label: '金牌助教', color: 'text-amber-600', bg: 'bg-amber-100' },
  };

  const statusConfig: Record<Technician['status'], { label: string; color: string; bg: string }> = {
    available: { label: '空闲', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    busy: { label: '服务中', color: 'text-amber-600', bg: 'bg-amber-50' },
    off: { label: '休息', color: 'text-slate-400', bg: 'bg-slate-100' },
    on_break: { label: '请假', color: 'text-rose-400', bg: 'bg-rose-50' },
  };

  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  const formatSchedule = (schedule: Technician['schedule']) => {
    return Object.entries(schedule).map(([day, time]) => {
      if (!time) return null;
      return `${dayNames[Number(day)]}: ${time.start}-${time.end}`;
    }).filter(Boolean).join(' | ');
  };

  const handleStatusChange = (technician: Technician, newStatus: Technician['status']) => {
    dispatch({
      type: 'UPDATE_TECHNICIAN' as any,
      payload: { ...technician, status: newStatus },
    })
    // 后端暂无助教状态变更 API，本地持久化到 localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('technician_statuses') || '{}')
      saved[technician.id] = newStatus
      localStorage.setItem('technician_statuses', JSON.stringify(saved))
    } catch {}
    // TODO: Backend API for technician status — currently localStorage only, lost on refresh
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">助教管理</h2>
              <p className="text-white/80 text-sm">
                在职 {technicians.filter((t) => t.status !== 'off').length} 人 | 空闲 {technicians.filter((t) => t.status === 'available').length} 人
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

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicians.map((tech) => {
              const level = levelConfig[tech.level];
              const status = statusConfig[tech.status];
              const isExpanded = expandedId === tech.id;

              return (
                <div
                  key={tech.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    isExpanded ? 'border-violet-200 shadow-lg shadow-violet-100' : 'border-slate-100'
                  }`}
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          {tech.avatar ? (
                            <img
                              src={tech.avatar}
                              alt={tech.name}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white font-bold text-lg">
                              {tech.name.charAt(0)}
                            </div>
                          )}
                          {tech.status === 'available' && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{tech.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${level.bg} ${level.color}`}>
                              {level.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            {tech.phone}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-slate-500">服务次数</div>
                        <div className="font-bold text-slate-900">{tech.totalServices}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-slate-500">累计提成</div>
                        <div className="font-bold text-emerald-600">¥{tech.totalCommission}</div>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="text-xs text-slate-500">评分</div>
                        <div className="font-bold text-amber-600 flex items-center justify-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {tech.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Commission Info */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span>提成方式：{tech.commissionType === 'percentage' ? '按比例' : tech.commissionType === 'fixed' ? '固定' : '混合'}</span>
                      <span className="text-violet-600 font-medium">{tech.commissionRate}%</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {selectionMode && tech.status === 'available' && (
                        <button
                          onClick={() => onSelect?.(tech)}
                          className="flex-1 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all"
                        >
                          选择助教
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tech.id)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-all flex items-center gap-1"
                      >
                        详情
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-4 bg-slate-50">
                      {/* Services */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">服务项目</h4>
                        <div className="space-y-2">
                          {tech.services.map((service) => (
                            <div key={service.serviceId} className="flex items-center justify-between bg-white rounded-lg p-2">
                              <span className="text-sm text-slate-700">{service.name}</span>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-500">{service.duration}分钟</span>
                                <span className="font-medium text-emerald-600">¥{service.price}</span>
                                <span className="text-slate-400">{service.commissionRate || tech.commissionRate}%提成</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Schedule */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">排班时间</h4>
                        <p className="text-xs text-slate-500">{formatSchedule(tech.schedule)}</p>
                      </div>

                      {/* Status Control */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">状态调整</h4>
                        <div className="flex gap-2">
                          {(['available', 'busy', 'off', 'on_break'] as const).map((s) => {
                            const config = statusConfig[s];
                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(tech, s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                  tech.status === s
                                    ? `${config.bg} ${config.color}`
                                    : 'bg-white text-slate-500 hover:bg-slate-100'
                                }`}
                              >
                                {config.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
