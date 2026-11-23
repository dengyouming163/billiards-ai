import React, { useState, useEffect, memo } from 'react';
import {
  ShoppingCart,
  CalendarClock,
  Users,
  UserPlus,
  Receipt,
  WifiOff,
  RefreshCw,
  Bell,
  UserCheck,
  Ticket,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { posApi, shiftApi } from '@/lib/api/pos';

interface QuickPanelProps {
  onQuickOrder: () => void;
  onReservation: () => void;
  onTechnician: () => void;
  onMember: () => void;
  onHistoryOrders: () => void;
  onShift: () => void;
  onOrderReminder: () => void;
  onAssistantReminder: () => void;
  onCouponVerify: () => void;
  onOpenTableRequests: () => void;
}

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
  badge?: number;
}

const ActionCard = memo(({
  icon,
  label,
  gradient,
  onClick,
  badge,
}: ActionCardProps) => (
  <button
    onClick={onClick}
    className={`${gradient} rounded-xl flex items-center gap-4 p-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden group`}
  >
    <div className="w-12 h-12 rounded-lg bg-white/90 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
      {icon}
    </div>
    <div className="flex flex-col justify-center">
      <span className="text-base font-bold text-slate-800 whitespace-nowrap">
        {label}
      </span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
));

export const QuickPanel: React.FC<QuickPanelProps> = ({
  onQuickOrder,
  onReservation,
  onTechnician,
  onMember,
  onShift,
  onHistoryOrders,
  onOrderReminder,
  onAssistantReminder,
  onCouponVerify,
  onOpenTableRequests,
}) => {
  const { state, dispatch } = useApp();
  const { tables, networkStatus, currentShift } = state;

  // 班次统计
  const [shiftSummary, setShiftSummary] = useState<any>(null);
  useEffect(() => {
    if (!currentShift) { setShiftSummary(null); return; }
    const fetch = () => {
      shiftApi.summary().then(r => {
        if (r && (r as any).isOnShift === false) {
          // 后端返回无进行中班次，清理过期客户端状态
          localStorage.removeItem('currentShift');
          localStorage.removeItem('currentOperator');
          dispatch({ type: 'SET_CURRENT_SHIFT', payload: undefined });
          dispatch({ type: 'SET_CURRENT_OPERATOR', payload: undefined });
          setShiftSummary(null);
          return;
        }
        setShiftSummary(r || null);
      }).catch(() => {});
    };
    fetch();
    const t = setInterval(fetch, 30000);
    return () => clearInterval(t);
  }, [currentShift, dispatch]);

  const [pendingOpenRequests, setPendingOpenRequests] = useState(0);

  // 开台申请轮询
  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const storeId = JSON.parse(localStorage.getItem('userInfo') || '{}').storeId || ''
        const result = await posApi.pendingConfirmRequests(storeId)
        setPendingOpenRequests((result || []).length)
      } catch { /* ignore */ }
    }
    fetchPendingRequests()
    const poll = setInterval(fetchPendingRequests, 5000)
    return () => clearInterval(poll)
  }, []);

  const getOnlineTablesCount = () => tables.filter((t) => t.status === 'occupied').length;
  const getReservationCount = () => tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="w-full max-w-[320px] bg-gradient-to-b from-slate-50 to-white p-4 flex flex-col h-full border-l border-slate-100 overflow-hidden">
      {/* Header with Network Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">快捷操作</h2>
        <div className="flex items-center gap-2">
          {networkStatus === 'online' ? (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              在线
            </span>
          ) : networkStatus === 'offline' ? (
            <span className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium">
              <WifiOff className="w-4 h-4" />
              离线
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              同步
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <ActionCard
          icon={<Bell className="w-6 h-6 text-orange-500" />}
          label="点单提醒"
          gradient="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200"
          onClick={onOrderReminder}
          badge={0}
        />
        <ActionCard
          icon={<UserCheck className="w-6 h-6 text-rose-500" />}
          label="上桌提醒"
          gradient="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200"
          onClick={onAssistantReminder}
          badge={0}
        />
        <ActionCard
          icon={<Bell className="w-6 h-6 text-amber-500" />}
          label="开台申请"
          gradient="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200"
          onClick={onOpenTableRequests}
          badge={pendingOpenRequests}
        />
        <ActionCard
          icon={<ShoppingCart className="w-6 h-6 text-teal-500" />}
          label="点单"
          gradient="bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200"
          onClick={onQuickOrder}
        />
        <ActionCard
          icon={<CalendarClock className="w-6 h-6 text-blue-500" />}
          label="预约"
          gradient="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
          onClick={onReservation}
          badge={getReservationCount()}
        />
        <ActionCard
          icon={<UserPlus className="w-6 h-6 text-indigo-500" />}
          label="会员"
          gradient="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100"
          onClick={onMember}
        />
        <ActionCard
          icon={<Receipt className="w-6 h-6 text-slate-500" />}
          label="订单"
          gradient="bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200"
          onClick={onHistoryOrders}
        />
        <ActionCard
          icon={<Ticket className="w-6 h-6 text-cyan-500" />}
          label="验券"
          gradient="bg-gradient-to-r from-cyan-100 to-teal-100 border border-cyan-200"
          onClick={onCouponVerify}
        />
      </div>

      {/* Shift Stats */}
      {currentShift ? (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 mb-4">
          <p className="text-emerald-600 text-sm font-medium mb-2">本班收入 · {(shiftSummary as any)?.workHours || 0}h · {getOnlineTablesCount()}桌</p>
          <p className="text-4xl font-bold text-emerald-600 mb-1">¥{((shiftSummary as any)?.totalRevenue || 0).toFixed(0)}</p>
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-emerald-100">
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-bold text-slate-700 text-base">{(shiftSummary as any)?.cashPaid || 0}</p>
              <p className="text-slate-400 text-sm">现金</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-bold text-slate-700 text-base">{(shiftSummary as any)?.wechatPaid || 0}</p>
              <p className="text-slate-400 text-sm">微信</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-bold text-slate-700 text-base">{(shiftSummary as any)?.balancePaid || 0}</p>
              <p className="text-slate-400 text-sm">余额</p>
            </div>
            <div className="bg-white/60 rounded-lg p-3">
              <p className="font-bold text-slate-700 text-base">{(shiftSummary as any)?.orderCount || currentShift.totalOrders}</p>
              <p className="text-slate-400 text-sm">单数</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-4 border border-slate-100 mb-4 text-center">
          <p className="text-slate-400 text-sm mb-2">尚未当班</p>
          <button onClick={onShift}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm">
            开始班次
          </button>
        </div>
      )}

    </div>
  );
};
