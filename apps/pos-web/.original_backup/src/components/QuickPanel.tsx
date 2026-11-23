import React from 'react';
import {
  ShoppingCart,
  CalendarClock,
  Users,
  UserPlus,
  BarChart3,
  Receipt,
  Clock,
  WifiOff,
  RefreshCw,
  Package,
  LogOut,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface QuickPanelProps {
  onQuickOrder: () => void;
  onPackage: () => void;
  onReservation: () => void;
  onTechnician: () => void;
  onMember: () => void;
  onStatistics: () => void;
  onShift: () => void;
  onHistoryOrders: () => void;
}

// 翡翠绿主色调：lab(75.0771% -60.7313 19.4147)
const THEME = {
  primary: 'emerald',
  primaryBg: 'bg-emerald-50',
  primaryBorder: 'border-emerald-100',
  primaryText: 'text-emerald-600',
  primaryLight: 'bg-emerald-500',
};

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  onClick: () => void;
  badge?: number;
  size?: 'default' | 'large';
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon,
  label,
  gradient,
  onClick,
  badge,
  size = 'default',
}) => (
  <button
    onClick={onClick}
    className={`${gradient} rounded-xl flex items-center gap-3 p-3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden group`}
  >
    <div className={`${size === 'large' ? 'w-12 h-12' : 'w-10 h-10'} rounded-lg bg-white/90 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
      {icon}
    </div>
    <span className={`${size === 'large' ? 'text-base' : 'text-sm'} font-semibold text-slate-800 whitespace-nowrap`}>
      {label}
    </span>
    {badge !== undefined && badge > 0 && (
      <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold shadow-sm">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
  </button>
);

export const QuickPanel: React.FC<QuickPanelProps> = ({
  onQuickOrder,
  onPackage,
  onReservation,
  onTechnician,
  onMember,
  onStatistics,
  onShift,
  onHistoryOrders,
}) => {
  const { state } = useApp();
  const { tables, orders, networkStatus, currentShift } = state;

  const getOnlineTablesCount = () => tables.filter((t) => t.status === 'inuse').length;
  const getPendingCheckoutCount = () => {
    return tables.filter((t) => {
      if (!t.currentSession) return false;
      return orders.some((o) => o.tableId === t.id && o.status === 'pending');
    }).length;
  };
  const getReservationCount = () => tables.filter((t) => t.status === 'reserved').length;

  return (
    <div className="w-[300px] bg-gradient-to-b from-slate-50 to-white p-3 flex flex-col h-full border-l border-slate-100 overflow-hidden">
      {/* Header with Network Status */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800">快捷操作</h2>
        <div className="flex items-center gap-2">
          {networkStatus === 'online' ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              在线
            </span>
          ) : networkStatus === 'offline' ? (
            <span className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" />
              离线
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <RefreshCw className="w-3 h-3 animate-spin" />
              同步
            </span>
          )}
        </div>
      </div>

      {/* Quick Order - in grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <ActionCard
          icon={<ShoppingCart className="w-5 h-5 text-teal-500" />}
          label="点单"
          gradient="bg-gradient-to-r from-teal-100 to-cyan-100 border border-teal-200"
          onClick={onQuickOrder}
        />
        <ActionCard
          icon={<Package className="w-5 h-5 text-purple-500" />}
          label="套餐"
          gradient="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100"
          onClick={onPackage}
        />
        <ActionCard
          icon={<CalendarClock className="w-5 h-5 text-blue-500" />}
          label="预约"
          gradient="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100"
          onClick={onReservation}
          badge={getReservationCount()}
        />
        <ActionCard
          icon={<Users className="w-5 h-5 text-rose-500" />}
          label="助教"
          gradient="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100"
          onClick={onTechnician}
        />
        <ActionCard
          icon={<UserPlus className="w-5 h-5 text-indigo-500" />}
          label="会员"
          gradient="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100"
          onClick={onMember}
        />
        <ActionCard
          icon={<BarChart3 className="w-5 h-5 text-emerald-500" />}
          label="统计"
          gradient="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"
          onClick={onStatistics}
        />
        <ActionCard
          icon={<Receipt className="w-5 h-5 text-slate-500" />}
          label="订单"
          gradient="bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200"
          onClick={onHistoryOrders}
        />
      </div>

      {/* Shift Info Card */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-xs font-medium text-slate-600">当班信息</span>
            {currentShift && (
              <p className="text-xs text-slate-400">{currentShift.operatorName}</p>
            )}
          </div>
        </div>

        {currentShift ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">本班收入</span>
              <span className="text-lg font-bold text-emerald-600">
                ¥{currentShift.totalSales.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {getOnlineTablesCount()}桌
              </span>
              <span className="text-slate-300">|</span>
              <span>{currentShift.totalOrders}单</span>
            </div>
            <button
              onClick={onShift}
              className="w-full py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              交接班
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-slate-400 mb-2">尚未开始当班</p>
            <button
              onClick={onShift}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm"
            >
              开始班次
            </button>
          </div>
        )}
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-emerald-50 text-center">
            <div className="text-xl font-bold text-emerald-600">{getOnlineTablesCount()}</div>
            <div className="text-xs text-slate-500">在用</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-center">
            <div className="text-xl font-bold text-amber-600">{getPendingCheckoutCount()}</div>
            <div className="text-xs text-slate-500">待结</div>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-center">
            <div className="text-xl font-bold text-blue-600">{getReservationCount()}</div>
            <div className="text-xs text-slate-500">预约</div>
          </div>
        </div>
      </div>

      {/* Pending Tasks */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex-1">
        <h3 className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-2">
          <span>待处理</span>
          {getPendingCheckoutCount() + getReservationCount() > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">
              {getPendingCheckoutCount() + getReservationCount()}
            </span>
          )}
        </h3>
        <div className="space-y-2">
          {getPendingCheckoutCount() > 0 && (
            <div className="flex items-center justify-between py-2 px-2 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-xs text-amber-700 font-medium">待结账订单</span>
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {getPendingCheckoutCount()}
              </span>
            </div>
          )}
          {getReservationCount() > 0 && (
            <div className="flex items-center justify-between py-2 px-2 rounded-lg bg-blue-50 border border-blue-100">
              <span className="text-xs text-blue-700 font-medium">预约待确认</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {getReservationCount()}
              </span>
            </div>
          )}
          {getOnlineTablesCount() === 0 && getPendingCheckoutCount() === 0 && getReservationCount() === 0 && (
            <div className="text-center py-4 text-slate-400">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-1">
                <Clock className="w-4 h-4 text-slate-300" />
              </div>
              <p className="text-xs">暂无待处理事项</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
