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
    className={`bg-white border border-[#e5e5e5]/60 rounded-2xl flex items-center gap-4 p-4 hover:border-[#07C160]/40 active:scale-[0.98] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(7,193,96,0.12)] relative overflow-hidden group`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-[#07C160]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#f7f7f7] to-[#e8f5ef] flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
      {icon}
    </div>
    <div className="relative flex flex-col justify-center">
      <span className="text-base font-bold text-[#333333] whitespace-nowrap">
        {label}
      </span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className="relative z-10 absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 text-white text-xs flex items-center justify-center font-bold shadow-lg shadow-rose-500/30">
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
    <div className="w-full max-w-[320px] bg-white p-4 flex flex-col h-full border-r border-[#e5e5e5] overflow-hidden">
      {/* Header with Network Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#333333]">快捷操作</h2>
        <div className="flex items-center gap-2">
          {networkStatus === 'online' ? (
            <span className="flex items-center gap-1.5 text-sm text-[#07C160] bg-[#D1FAE5] px-3 py-1.5 rounded-full font-medium">
              <span className="w-2 h-2 rounded-full bg-[#07C160] animate-pulse" />
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
          icon={<Bell className="w-6 h-6 text-[#FF976A]" />}
          label="点单提醒"
          gradient=""
          onClick={onOrderReminder}
          badge={0}
        />
        <ActionCard
          icon={<UserCheck className="w-6 h-6 text-[#999999]" />}
          label="上桌提醒"
          gradient=""
          onClick={onAssistantReminder}
          badge={0}
        />
        <ActionCard
          icon={<Bell className="w-6 h-6 text-[#FF976A]" />}
          label="开台申请"
          gradient=""
          onClick={onOpenTableRequests}
          badge={pendingOpenRequests}
        />
        <ActionCard
          icon={<ShoppingCart className="w-6 h-6 text-[#07C160]" />}
          label="点单"
          gradient=""
          onClick={onQuickOrder}
        />
        <ActionCard
          icon={<CalendarClock className="w-6 h-6 text-[#999999]" />}
          label="预约"
          gradient=""
          onClick={onReservation}
          badge={getReservationCount()}
        />
        <ActionCard
          icon={<UserPlus className="w-6 h-6 text-[#999999]" />}
          label="会员"
          gradient=""
          onClick={onMember}
        />
        <ActionCard
          icon={<Receipt className="w-6 h-6 text-[#999999]" />}
          label="订单"
          gradient=""
          onClick={onHistoryOrders}
        />
        <ActionCard
          icon={<Ticket className="w-6 h-6 text-[#07C160]" />}
          label="验券"
          gradient=""
          onClick={onCouponVerify}
        />
      </div>

      {/* Shift Stats */}
      {currentShift ? (
        <div className="bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] rounded-2xl p-5 border border-[#86EFAC]/60 mb-4 shadow-[0_4px_16px_rgba(7,193,96,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#07C160]/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-[#065f46] text-sm font-medium mb-2">本班收入 · {(shiftSummary as any)?.workHours || 0}h · {getOnlineTablesCount()}桌</p>
            <p className="text-4xl font-bold bg-gradient-to-r from-[#07C160] to-[#06AD56] bg-clip-text text-transparent mb-1">¥{((shiftSummary as any)?.totalRevenue || 0).toFixed(0)}</p>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#86EFAC]/60">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <p className="font-bold text-[#333333] text-base">{(shiftSummary as any)?.cashPaid || 0}</p>
                <p className="text-[#999999] text-sm">现金</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <p className="font-bold text-[#333333] text-base">{(shiftSummary as any)?.wechatPaid || 0}</p>
                <p className="text-[#999999] text-sm">微信</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <p className="font-bold text-[#333333] text-base">{(shiftSummary as any)?.balancePaid || 0}</p>
                <p className="text-[#999999] text-sm">余额</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                <p className="font-bold text-[#333333] text-base">{(shiftSummary as any)?.orderCount || currentShift.totalOrders}</p>
                <p className="text-[#999999] text-sm">单数</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-[#e5e5e5]/60 mb-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-[#999999] text-sm mb-3">尚未当班</p>
          <button onClick={onShift}
            className="w-full py-3 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-bold text-sm shadow-lg shadow-[#07C160]/30 hover:shadow-xl hover:shadow-[#07C160]/40 transition-all">
            开始班次
          </button>
        </div>
      )}

    </div>
  );
};
