'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { Table, TableStatus, Zone } from '@/types';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  Users,
  UserCog,
  Sparkles,
} from 'lucide-react';

const STATUS_CONFIG: Record<TableStatus, { label: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }> = {
  idle: { 
    label: '空闲', 
    bgClass: 'from-slate-100 to-slate-200', 
    borderClass: 'border-slate-300',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-500'
  },
  inuse: { 
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
  cleaning: { 
    label: '清洁中', 
    bgClass: 'from-blue-200 to-indigo-200', 
    borderClass: 'border-blue-400',
    textClass: 'text-blue-800',
    dotClass: 'bg-blue-600'
  },
};

function formatDuration(startTime: string): string {
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

// ============================================================
// Grid Mode
// ============================================================

interface TableCardProps {
  table: Table;
  isSelected: boolean;
  onClick: () => void;
}

function TableCard({ table, isSelected, onClick }: TableCardProps) {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分钟');
  const [currentFee, setCurrentFee] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    if (table.status !== 'inuse' || !table.currentSession) {
      setElapsedTime('0分钟');
      setCurrentFee(0);
      return;
    }

    const updateTime = () => {
      const start = new Date(table.currentSession!.startTime).getTime();
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      setElapsedTime(hours > 0 ? `${hours}小时${minutes}分` : `${minutes}分钟`);
      setCurrentFee(Math.floor(minutes / 15) * 10);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Get order info
    const tableOrders = state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
    const items = tableOrders.flatMap((o) => o.items);
    setOrderCount(items.length);
    setOrderTotal(items.reduce((sum, item) => sum + item.subtotal, 0));

    return () => clearInterval(interval);
  }, [table.status, table.currentSession, state.orders, table.id]);

  const statusConfig = STATUS_CONFIG[table.status];

  return (
    <button
      onClick={onClick}
      className={`table-card group relative overflow-hidden flex flex-col justify-start min-h-[180px] ${
        isSelected 
          ? 'ring-2 ring-emerald-400 shadow-xl scale-[1.02]' 
          : 'hover:shadow-lg hover:scale-[1.01]'
      } w-full text-left`}
    >
      {/* 背景渐变 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${statusConfig.bgClass} opacity-80`} />
      
      {/* 顶部装饰条 */}
      <div className={`h-1.5 bg-gradient-to-r ${statusConfig.borderClass.replace('border', 'from')}`} />
      
      {/* 内容区域 - 固定高度，顶部对齐 */}
      <div className="relative p-4 flex flex-col justify-start flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.bgClass} border ${statusConfig.borderClass} flex items-center justify-center shadow-sm`}>
              <span className={`text-lg font-bold ${statusConfig.textClass}`}>{table.name}</span>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 backdrop-blur-sm border ${statusConfig.borderClass} ${statusConfig.textClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${table.status === 'inuse' ? 'animate-pulse' : ''}`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Content */}
        {table.status === 'inuse' && table.currentSession ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                <Clock className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-medium">{elapsedTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <span>{table.currentSession.customerCount}人</span>
            </div>
            {table.currentSession.assistantName && (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
                </div>
                <span className="font-medium">{table.currentSession.assistantName}</span>
              </div>
            )}
            {orderCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>商品{orderCount}件 ¥{orderTotal}</span>
              </div>
            )}
            <div className="pt-3 mt-2 border-t border-slate-200/50">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  ¥{currentFee + orderTotal}
                </span>
                <span className="text-xs text-slate-500">当前消费</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <span>可容纳{table.capacity}人</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>¥{table.hourlyRate}/小时</span>
            </div>
            {table.status === 'idle' && (
              <div className="pt-2">
                <span className="text-emerald-600 font-medium text-sm">✓ 立即可用</span>
              </div>
            )}
          </div>
        )}
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
}

function TableRow({ table, isSelected, onClick }: TableRowProps) {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分钟');
  const [currentFee, setCurrentFee] = useState(0);
  const [orderTotal, setOrderTotal] = useState(0);

  useEffect(() => {
    if (table.status !== 'inuse' || !table.currentSession) {
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
      setCurrentFee(Math.floor(minutes / 15) * 10);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Get order info
    const tableOrders = state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
    const items = tableOrders.flatMap((o) => o.items);
    setOrderTotal(items.reduce((sum, item) => sum + item.subtotal, 0));

    return () => clearInterval(interval);
  }, [table.status, table.currentSession, state.orders, table.id]);

  const statusConfig = STATUS_CONFIG[table.status];

  return (
    <button
      onClick={onClick}
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
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${table.status === 'inuse' ? 'animate-pulse' : ''}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Time / Duration */}
      <div className="w-28 text-sm text-slate-700">
        {table.status === 'inuse' && table.currentSession ? (
          <span className="font-medium">{elapsedTime}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>

      {/* Customer count */}
      <div className="w-20 text-sm text-slate-600">
        {table.status === 'inuse' && table.currentSession ? (
          <span>{table.currentSession.customerCount}人</span>
        ) : (
          <span>{table.capacity}人</span>
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
        {table.status === 'inuse' && orderTotal > 0 ? (
          <span className="text-orange-600 font-medium">¥{orderTotal}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </div>

      {/* Fee */}
      <div className="flex-1 text-right">
        {table.status === 'inuse' ? (
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

export function TableBoard() {
  const { state, dispatch, filteredTables, selectedTable } = useApp();
  const { viewMode, filterStatus, searchQuery, zones } = state;
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleTableClick = (tableId: string) => {
    dispatch({ type: 'SET_SELECTED_TABLE', payload: tableId });
  };

  const handleSearch = (value: string) => {
    setLocalSearch(value);
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
  };

  const statusOptions: Array<{ value: TableStatus | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'idle', label: '空闲' },
    { value: 'inuse', label: '使用中' },
    { value: 'reserved', label: '预约' },
    { value: 'cleaning', label: '清洁中' },
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
          <input
            type="text"
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
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
            <span className="text-sm text-slate-600">
              空闲 <span className="font-bold text-emerald-600">{state.tables.filter((t) => t.status === 'idle').length}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-lg shadow-emerald-200" />
            <span className="text-sm text-emerald-700">
              使用中 <span className="font-bold">{state.tables.filter((t) => t.status === 'inuse').length}</span>
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
                        style={{ backgroundColor: zone.color }}
                      >
                        {zone.name}
                      </span>
                    )}
                    <span className="text-slate-500">({tables.length})</span>
                  </h3>
                  <div className="grid grid-cols-5 gap-4">
                    {tables.map((table) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        isSelected={selectedTable?.id === table.id}
                        onClick={() => handleTableClick(table.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Search className="w-12 h-12 mb-4" />
                <p>没有找到匹配的桌台</p>
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
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredTables.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Search className="w-12 h-12 mb-4" />
                <p>没有找到匹配的桌台</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
