'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import type { Table, TableStatus, Zone } from '@/types';
import { calculateTableFeeLocal, getTimePeriodLabel } from '@/utils/billing';
import { orderApi } from '@/lib/api/pos';
import { STATUS_CONFIG, TEMP_ORDER_STATUS, getTempOrderStatus, formatDuration } from './tableConfig';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  UserCog,
  Sparkles,
  RefreshCw,
  Loader2,
  Wrench,
  Gift,
  XCircle,
  ArrowRightLeft,
} from 'lucide-react';

// ============================================================
// Grid Mode
// ============================================================

interface TableCardProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent, table: Table) => void;
}

function TableCard({ table, isSelected, onClick, onContextMenu }: TableCardProps) {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分钟');
  const [currentFee, setCurrentFee] = useState(0);
  const [coefficient, setCoefficient] = useState(1.0);
  const [orderCount, setOrderCount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    if (table.status !== 'occupied' || !table.currentSession) {
      setElapsedTime('0分钟');
      setCurrentFee(0);
      setCoefficient(1.0);
      return;
    }

    const updateTime = () => {
      const start = new Date(table.currentSession!.startTime).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setElapsedTime(hours > 0 ? `${hours}小时${minutes}分` : `${minutes}分钟`);

      // 使用对齐后端的计费算法（30min取整 + 时段系数）
      const fee = calculateTableFeeLocal({
        startTime: table.currentSession!.startTime,
        hourlyRate: table.hourlyRate || 0,
      });
      setCurrentFee(fee);

      // 当前时段系数
      const nowHour = new Date().getHours();
      if (nowHour >= 22 || nowHour < 6) setCoefficient(1.5);
      else if (nowHour >= 6 && nowHour < 14) setCoefficient(0.8);
      else setCoefficient(1.0);
    };

    updateTime();
    // 10 秒刷新，兼顾实时性与性能
    const interval = setInterval(updateTime, 10000);

    // Get order info — 排除 preorder_pending 未确认商品
    const tableOrders = state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
    const items = tableOrders.flatMap((o) => o.items)
      .filter(item => item.status !== 'preorder_pending' as any);
    setOrderCount(items.length);
    setOrderTotal(items.reduce((sum, item) => sum + item.subtotal, 0));

    return () => clearInterval(interval);
  }, [table.status, table.currentSession, state.orders, table.id]);

  // 检查是否为临时订单桌
  const tempOrder = getTempOrderStatus(state.orders, table.id);
  const effectiveStatusConfig = tempOrder ? TEMP_ORDER_STATUS[tempOrder.type as keyof typeof TEMP_ORDER_STATUS] : STATUS_CONFIG[table.status];
  const statusConfig = effectiveStatusConfig || STATUS_CONFIG[table.status];

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(e, table);
    }
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`table-card group relative overflow-hidden flex flex-col justify-start aspect-square ${
        isSelected 
          ? 'ring-2 ring-emerald-400 shadow-xl scale-[1.02]' 
          : 'hover:shadow-lg hover:scale-[1.01]'
      } w-full text-left`}
    >
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.bgClass} opacity-80`} />
      
      {/* 顶部装饰条 */}
      <div className={`h-[clamp(2px,2%,6px)] bg-gradient-to-r ${statusConfig.borderClass.replace('border', 'from')}`} />

      {/* 内容区域 — 内间距随卡片自适应 */}
      <div className="relative p-[clamp(2px,4%,8px)] flex flex-col justify-start flex-1 overflow-hidden min-h-0">
        {/* 台桌名称 — 单独一行 */}
        <div className="mb-[clamp(1px,1.5%,4px)] flex-shrink-0">
          <span className={`text-[clamp(14px,8.5%,17px)] font-bold ${statusConfig.textClass} truncate block`}>{table.name}</span>
        </div>

        {/* Content */}
        {table.status === 'occupied' && table.currentSession ? (
          <div className="space-y-[clamp(0px,1%,3px)] overflow-hidden min-h-0">
            <div className="flex items-center gap-[clamp(1px,2%,4px)] text-[clamp(10px,6%,14px)] text-slate-700 whitespace-nowrap min-w-0">
              <Clock className="w-[clamp(11px,7%,14px)] h-[clamp(11px,7%,14px)] text-emerald-600 shrink-0" />
              <span className="font-medium truncate">{elapsedTime}</span>
            </div>
            {table.currentSession.assistantName && (
              <div className="flex items-center gap-[clamp(1px,2%,4px)] text-[clamp(10px,6%,14px)] text-emerald-700 whitespace-nowrap min-w-0">
                <UserCog className="w-[clamp(11px,7%,14px)] h-[clamp(11px,7%,14px)] shrink-0" />
                <span className="font-medium truncate">{table.currentSession.assistantName}</span>
              </div>
            )}
            {orderCount > 0 && (
              <div className="flex items-center gap-[clamp(1px,2%,4px)] text-[clamp(10px,6%,14px)] text-orange-600 whitespace-nowrap min-w-0">
                <Sparkles className="w-[clamp(11px,7%,14px)] h-[clamp(11px,7%,14px)] shrink-0" />
                <span className="truncate">商品{orderCount}件 ¥{orderTotal}</span>
              </div>
            )}
            <div className="pt-[clamp(1px,2%,4px)] mt-[clamp(0px,1%,3px)] border-t border-slate-200/30">
              <div className="flex items-baseline gap-[clamp(0px,1%,3px)] whitespace-nowrap">
                <span className="text-[clamp(13px,9%,20px)] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate">
                  ¥{currentFee + orderTotal}
                </span>
                <span className="text-[clamp(8px,4%,10px)] text-slate-400 shrink-0">消费</span>
              </div>
              {coefficient !== 1.0 && (
                <div className="mt-[clamp(0px,1%,3px)]">
                  <span className={`text-[clamp(8px,4%,10px)] px-1 py-0.5 rounded whitespace-nowrap ${coefficient > 1 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {getTimePeriodLabel()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-[clamp(11px,7%,15px)] text-slate-500 whitespace-nowrap">¥{table.hourlyRate}/小时</span>
        )}
      </div>

      {/* 台桌状态 — 放在最后一行 */}
      <div className="relative px-[clamp(2px,4%,8px)] pb-[clamp(2px,3%,6px)] mt-auto pt-[clamp(0px,0.5%,2px)] flex-shrink-0">
        <span className={`inline-flex items-center gap-1 px-[clamp(2px,3%,6px)] py-0.5 rounded-full text-[clamp(8px,4%,10px)] font-medium bg-white/70 backdrop-blur-sm border ${
          table.currentSession?.tableFeePaused
            ? 'border-amber-400 text-amber-700'
            : `${statusConfig.borderClass} ${statusConfig.textClass}`
        }`}>
          <span className={`w-1 h-1 rounded-full ${
            table.currentSession?.tableFeePaused ? 'bg-amber-500' : statusConfig.dotClass
          } ${table.status === 'occupied' && !table.currentSession?.tableFeePaused ? 'animate-pulse' : ''}`} />
          {table.currentSession?.tableFeePaused ? '⏸ 暂停' : statusConfig.label}
        </span>
      </div>

      {/* Hover 效果 */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 to-teal-400/0 group-hover:from-emerald-400/5 group-hover:to-teal-400/5 transition-all duration-300" />
    </button>
  );
}

// ============================================================
// List Mode
// ============================================================

interface TableRowProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent, table: Table) => void;
}

function TableRow({ table, isSelected, onClick, onContextMenu }: TableRowProps) {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分钟');
  const [currentFee, setCurrentFee] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    if (table.status !== 'occupied' || !table.currentSession) {
      setElapsedTime('0分钟');
      setCurrentFee(0);
      setOrderTotal(0);
      return;
    }

    const updateTime = () => {
      const start = new Date(table.currentSession!.startTime).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setElapsedTime(hours > 0 ? `${hours}小时${minutes}分` : `${minutes}分钟`);

      // 使用对齐后端的计费算法
      const fee = calculateTableFeeLocal({
        startTime: table.currentSession!.startTime,
        hourlyRate: table.hourlyRate || 0,
      });
      setCurrentFee(fee);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);

    // Get order info — 排除 preorder_pending
    const tableOrders = state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
    const items = tableOrders.flatMap((o) => o.items)
      .filter(item => item.status !== 'preorder_pending' as any);
    setOrderTotal(items.reduce((sum, item) => sum + item.subtotal, 0));

    return () => clearInterval(interval);
  }, [table.status, table.currentSession, state.orders, table.id]);

  const tempOrder = getTempOrderStatus(state.orders, table.id);
  const effectiveStatusConfig = tempOrder ? TEMP_ORDER_STATUS[tempOrder.type as keyof typeof TEMP_ORDER_STATUS] : STATUS_CONFIG[table.status];
  const statusConfig = effectiveStatusConfig || STATUS_CONFIG[table.status];

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(e, table);
    }
  };

  return (
    <button
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-emerald-400 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50'
          : `bg-gradient-to-r ${statusConfig.bgClass} hover:shadow-md border ${statusConfig.borderClass}`
      }`}
    >
      {/* Table name */}
      <div className="w-16 flex items-center gap-2">
        <div className={`w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center shadow-sm border ${statusConfig.borderClass}`}>
          <span className={`font-bold ${statusConfig.textClass}`}>{table.name}</span>
        </div>
      </div>

      {/* Status */}
      <div className="w-28">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 backdrop-blur-sm border ${statusConfig.borderClass} ${statusConfig.textClass}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${table.status === 'occupied' ? 'animate-pulse' : ''}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Time / Duration */}
      <div className="w-28 text-sm text-slate-700">
        {table.status === 'occupied' && table.currentSession ? (
          <span className="font-medium">{elapsedTime}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>

      {/* Customer count */}
      <div className="w-20 text-sm text-slate-600">
        {table.status === 'occupied' && table.currentSession ? (
          <span>{table.currentSession.customerCount}人</span>
        ) : (
          <span>{Math.max(2, table.capacity)}人</span>
        )}
      </div>

      {/* Assistant */}
      <div className="w-24 text-sm">
        {table.currentSession?.assistantName ? (
          <span className="text-emerald-700 font-medium">
            {table.currentSession.assistantName}
          </span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>

      {/* Products */}
      <div className="w-28 text-sm">
        {table.status === 'occupied' && orderTotal > 0 ? (
          <span className="text-orange-600 font-medium">¥{orderTotal}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>

      {/* Fee */}
      <div className="flex-1 text-right">
        {table.status === 'occupied' ? (
          <span className="font-bold text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            ¥{currentFee + orderTotal}
          </span>
        ) : (
          <span className="text-slate-500">¥{table.hourlyRate}/时</span>
        )}
      </div>
    </button>
  );
}

// ============================================================
// Main Component
// ============================================================

interface TableBoardProps {
  onRefresh?: () => void;
}

export function TableBoard({ onRefresh }: TableBoardProps) {
  const { state, dispatch, filteredTables, selectedTable } = useApp();
  const { viewMode, filterStatus, searchQuery, zones } = state;
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tableId: string; orderId?: string; menuType: 'idle' | 'temp_cleaning' | 'temp_free_trial' } | null>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    setRefreshError(false);
    try {
      await onRefresh();
    } catch {
      setRefreshError(true);
      setTimeout(() => setRefreshError(false), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTableClick = (tableId: string) => {
    dispatch({ type: 'SET_SELECTED_TABLE', payload: tableId });
  };

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
  };

  // ---- Right-click context menu ----

  const handleContextMenu = useCallback((e: React.MouseEvent, table: Table) => {
    e.preventDefault();
    const tempOrder = getTempOrderStatus(state.orders, table.id);

    if (table.status === 'idle' && !tempOrder) {
      setContextMenu({ x: e.clientX, y: e.clientY, tableId: table.id, menuType: 'idle' });
    } else if (tempOrder) {
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        tableId: table.id,
        orderId: tempOrder.id,
        menuType: tempOrder.type as 'temp_cleaning' | 'temp_free_trial',
      });
    }
    // 普通 occupied/reserved/maintenance 不显示菜单
  }, [state.orders]);

  const handleTempOpen = useCallback(async (type: 'cleaning' | 'free_trial') => {
    if (!contextMenu) return;
    const tableId = contextMenu.tableId;
    setContextMenu(null);

    try {
      if (type === 'free_trial') {
        const minutes = prompt('免费体验分钟数(默认15):', '15');
        if (!minutes || isNaN(Number(minutes))) return;
        const result = await orderApi.tempOpen({
          table_id: tableId,
          temp_type: 'free_trial',
          free_minutes: Number(minutes),
        });
        // Add temp order to local state so card shows temp status
        if (result) {
          dispatch({
            type: 'ADD_ORDER',
            payload: {
              id: result.id as string,
              tableId,
              sessionId: '',
              items: [],
              totalAmount: 0,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
              type: 'temp_free_trial',
            },
          });
        }
      } else {
        const confirmed = confirm('确认对这张球桌进行打扫/维护操作？');
        if (!confirmed) return;
        const result = await orderApi.tempOpen({
          table_id: tableId,
          temp_type: 'cleaning',
        });
        // Add temp order to local state so card shows temp status
        if (result) {
          dispatch({
            type: 'ADD_ORDER',
            payload: {
              id: result.id as string,
              tableId,
              sessionId: '',
              items: [],
              totalAmount: 0,
              status: 'pending' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              syncStatus: 'synced' as const,
              type: 'temp_cleaning',
            },
          });
        }
      }

      // Refresh tables after operation
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('临时开台失败:', err);
      alert('操作失败，请重试');
    }
  }, [contextMenu, onRefresh, dispatch]);

  const handleTempClose = useCallback(async (convertToNormal: boolean) => {
    if (!contextMenu || !contextMenu.orderId) return;
    const orderId = contextMenu.orderId;
    setContextMenu(null);

    try {
      await orderApi.tempClose({
        order_id: orderId,
        convert_to_normal: convertToNormal,
      });

      if (!convertToNormal) {
        // Remove temp order from local state so card reverts to idle
        dispatch({
          type: 'UPDATE_ORDER',
          payload: {
            id: orderId,
            tableId: contextMenu.tableId,
            sessionId: '',
            items: [],
            totalAmount: 0,
            status: 'cancelled' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'synced' as const,
          },
        });
      } else {
        // Convert to normal — change type so it no longer shows as temp
        dispatch({
          type: 'UPDATE_ORDER',
          payload: {
            id: orderId,
            tableId: contextMenu.tableId,
            sessionId: '',
            items: [],
            totalAmount: 0,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            syncStatus: 'synced' as const,
            type: 'table',
          },
        });
      }

      // Refresh tables after operation
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error('关闭临时订单失败:', err);
      alert('操作失败，请重试');
    }
  }, [contextMenu, onRefresh, dispatch]);

  // Close context menu on click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    // Use capture phase so we intercept before the event bubbles
    window.addEventListener('click', close, true);
    return () => window.removeEventListener('click', close, true);
  }, [contextMenu]);

  const statusOptions: Array<{ value: TableStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'idle', label: '空闲' },
    { value: 'occupied', label: '使用中' },
    { value: 'reserved', label: '预约' },
    { value: 'maintenance', label: '维护中' },
  ];

  // 按区域分组台球桌
  const tablesByZone = useMemo(() => {
    const grouped: Record<string, { zone: Zone | undefined; tables: Table[] }> = {};
    
    // 初始化所有分区
    (zones || []).forEach(zone => {
      grouped[zone.id] = { zone, tables: [] };
    });
    
    // 添加无分区的台球桌
    grouped['unassigned'] = { zone: undefined, tables: [] };
    
    // 分配台球桌到各分区
    filteredTables.forEach(table => {
      if (table.zoneId && grouped[table.zoneId]) {
        grouped[table.zoneId].tables.push(table);
      } else {
        grouped['unassigned'].tables.push(table);
      }
    });
    
    return grouped;
  }, [filteredTables, zones]);

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 mb-4">
        {/* View mode toggle */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'grid' })}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              viewMode === 'grid'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: 'list' })}
            className={`p-2.5 rounded-lg transition-all duration-150 ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input type="text" name="username" autoComplete="username" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} tabIndex={-1} />
          <input
            type="text"
            autoComplete="nope"
            placeholder="搜索桌号..."
            value={localSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) =>
              dispatch({
                type: 'SET_FILTER_STATUS',
                payload: e.target.value as TableStatus | 'all',
              })
            }
            className="select text-sm pr-8"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-2">
            <button onClick={handleRefresh} disabled={isRefreshing}
            className={`p-2.5 rounded-xl border transition-all disabled:opacity-50 ${
              refreshError
                ? 'bg-rose-50 border-rose-300 text-rose-500'
                : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
            title={refreshError ? '刷新失败，点击重试' : '刷新数据'}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
            <span className="text-sm text-slate-600">
              空闲 <span className="font-bold text-emerald-600">{state.tables.filter((t) => t.status === 'idle').length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
            <span className="text-sm text-emerald-700">
              使用中 <span className="font-bold">{state.tables.filter((t) => t.status === 'occupied').length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-lg shadow-amber-200" />
            <span className="text-sm text-amber-700">
              预约 <span className="font-bold">{state.tables.filter((t) => t.status === 'reserved').length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Table grid/list */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'grid' ? (
          <div className="space-y-6">
            {/* 按区域分组显示 */}
            {Object.entries(tablesByZone).map(([zoneId, { zone, tables }]) => {
              if (tables.length === 0) return null;
              return (
                <div key={zoneId}>
                  <h3 className="flex items-center gap-2 text-sm font-medium text-slate-400 mb-3">
                    {zone && (
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: zone.color || '#6b7280' }}
                      >
                        {zone.name}
                      </span>
                    )}
                    <span className="text-slate-500">({tables.length})</span>
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
                    {tables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        isSelected={selectedTable?.id === table.id}
                        onClick={() => handleTableClick(table.id)}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 mb-3 animate-spin text-emerald-400" />
                    <p>加载台桌数据...</p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mb-4" />
                    <p>没有找到匹配的桌台</p>
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 按区域分组显示 */}
            {Object.entries(tablesByZone).map(([zoneId, { zone, tables }]) => {
              if (tables.length === 0) return null;
              return (
                <div key={zoneId}>
                  {/* 分区标题 */}
                  <div className="flex items-center gap-2 mb-2">
                    {zone && (
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.name}
                      </span>
                    )}
                    <span className="text-sm text-slate-500">({tables.length}张桌)</span>
                  </div>
                  
                  {/* 列表 */}
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="flex items-center gap-4 px-4 py-2.5 text-sm text-slate-600 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200">
                      <div className="w-16 font-semibold">桌号</div>
                      <div className="w-28 font-semibold">状态</div>
                      <div className="w-28 font-semibold">时长</div>
                      <div className="w-20 font-semibold">人数</div>
                      <div className="w-24 font-semibold">助教</div>
                      <div className="w-28 font-semibold">商品</div>
                      <div className="flex-1 text-right font-semibold">费用</div>
                    </div>

                    {/* Tables */}
                    {tables.map((table) => (
                      <TableRow
                        key={table.id}
                        table={table}
                        isSelected={selectedTable?.id === table.id}
                        onClick={() => handleTableClick(table.id)}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                {state.isLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 mb-3 animate-spin text-emerald-400" />
                    <p>加载台桌数据...</p>
                  </>
                ) : (
                  <>
                    <Search className="w-12 h-12 mb-4" />
                    <p>没有找到匹配的桌台</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          {/* Menu */}
          <div
            className="fixed bg-white shadow-xl rounded-xl border border-slate-200 z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.menuType === 'idle' && (
              <>
                <button
                  onClick={() => handleTempOpen('cleaning')}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100 transition-colors"
                >
                  <Wrench className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-medium">打扫/维护</div>
                    <div className="text-xs text-slate-400">标记为维护中，不计费</div>
                  </div>
                </button>
                <button
                  onClick={() => handleTempOpen('free_trial')}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-blue-50 text-sm text-blue-700 transition-colors"
                >
                  <Gift className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">免费体验</div>
                    <div className="text-xs text-blue-400">限时免费，不计台费</div>
                  </div>
                </button>
              </>
            )}
            {contextMenu.menuType === 'temp_cleaning' && (
              <>
                <div className="px-4 py-2.5 text-xs text-slate-400 bg-slate-50 border-b border-slate-100">
                  当前状态：打扫/维护中
                </div>
                <button
                  onClick={() => handleTempClose(false)}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-rose-50 text-sm text-rose-600 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-medium">结束打扫/维护</div>
                    <div className="text-xs text-rose-400">恢复为空闲状态</div>
                  </div>
                </button>
              </>
            )}
            {contextMenu.menuType === 'temp_free_trial' && (
              <>
                <div className="px-4 py-2.5 text-xs text-slate-400 bg-blue-50 border-b border-blue-100">
                  当前状态：免费体验中
                </div>
                <button
                  onClick={() => handleTempClose(false)}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-rose-50 text-sm text-rose-600 border-b border-slate-100 transition-colors"
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-medium">结束免费体验</div>
                    <div className="text-xs text-rose-400">关闭体验，恢复为空闲</div>
                  </div>
                </button>
                <button
                  onClick={() => handleTempClose(true)}
                  className="w-full flex items-center gap-3 text-left px-4 py-3 hover:bg-emerald-50 text-sm text-emerald-700 transition-colors"
                >
                  <ArrowRightLeft className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-medium">转为正式开台</div>
                    <div className="text-xs text-emerald-400">开始正常计费</div>
                  </div>
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
