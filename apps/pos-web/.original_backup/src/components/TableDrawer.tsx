'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Table } from '@/types';
import {
  X,
  Clock,
  Users,
  UserCog,
  ShoppingCart,
  CreditCard,
  UserPlus,
  ArrowRightLeft,
  Merge,
  CheckCircle,
  Sparkles,
  Timer,
  Receipt,
  AlertCircle,
  PlayCircle,
} from 'lucide-react';

// Format duration helper
function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  if (hours > 0) {
    return `${hours}小时${minutes}分${seconds}秒`;
  }
  return `${minutes}分${seconds}秒`;
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TableDrawerProps {
  table: Table | null;
  onClose: () => void;
  onOpenTable: () => void;
  onOrder: () => void;
  onCheckout: () => void;
  onAssignAssistant: () => void;
  onMember: () => void;
  onTransfer: () => void;
  onMerge: () => void;
}

export function TableDrawer({
  table,
  onClose,
  onOpenTable,
  onOrder,
  onCheckout,
  onAssignAssistant,
  onMember,
  onTransfer,
  onMerge,
}: TableDrawerProps) {
  const { state } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分0秒');
  const [currentFee, setCurrentFee] = useState(0);
  const [estimateFee, setEstimateFee] = useState(0);

  // Get zone name
  const zoneName = table?.zoneId
    ? state.zones.find(z => z.id === table.zoneId)?.name
    : undefined;

  useEffect(() => {
    if (!table || table.status !== 'inuse' || !table.currentSession) {
      setElapsedTime('0分0秒');
      setCurrentFee(0);
      setEstimateFee(0);
      return;
    }

    const session = table.currentSession;

    const updateTime = () => {
      setElapsedTime(formatDuration(session.startTime));

      // Calculate fee based on pricing type
      const minutes = Math.floor(
        (Date.now() - new Date(session.startTime).getTime()) / (60 * 1000)
      );

      let fee = 0;
      switch (session.pricingType) {
        case 'hourly':
          fee = Math.floor(minutes / 15) * 10; // 每15分钟10元
          break;
        case 'session':
          fee = Math.floor(minutes / 45) * session.tableFee; // 每45分钟1局
          break;
        case 'perGame':
          fee = session.tableFee; // 按局固定费用
          break;
        case 'day':
          fee = session.tableFee; // 全日包
          break;
        default:
          fee = Math.floor(minutes / 15) * 10;
      }
      setCurrentFee(fee);

      // 预计费用（1小时）
      const hourlyRate = table.hourlyRate || 40;
      setEstimateFee(hourlyRate);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [table]);

  if (!table) return null;

  const isIdle = table.status === 'idle';
  const isInUse = table.status === 'inuse';

  // Get all orders for this table
  const tableOrders = state.orders.filter(
    (o) => o.tableId === table.id && o.status !== 'cancelled'
  );
  const allOrderItems = tableOrders.flatMap((o) => o.items);
  const orderTotal = allOrderItems.reduce((sum, item) => sum + item.subtotal, 0) || 0;

  // Calculate total
  const totalFee = currentFee + orderTotal;

  // Available assistants
  const availableAssistants = state.assistants.filter((a) => a.status === 'available');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[60%] max-w-2xl bg-white z-50 animate-slide-in-right flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">台球桌 {table.name}</h2>
            <span
              className={`px-2 py-1 rounded-lg text-xs font-medium ${
                table.status === 'idle'
                  ? 'bg-slate-500 text-white'
                  : table.status === 'inuse'
                  ? 'bg-emerald-500 text-white'
                  : table.status === 'reserved'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {table.status === 'idle'
                ? '空闲'
                : table.status === 'inuse'
                ? '使用中'
                : table.status === 'reserved'
                ? '预约'
                : '清洁中'}
            </span>
            {zoneName && (
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300">
                {zoneName}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-slate-50">
          {/* In Use - Real-time Info */}
          {isInUse && table.currentSession && (
            <>
              {/* Real-time Fee Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-emerald-100 text-sm">实时费用</span>
                  <div className="flex items-center gap-2 text-emerald-100">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm">{elapsedTime}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">¥{totalFee}</span>
                  <span className="text-emerald-100 text-sm">（台费¥{currentFee} + 商品¥{orderTotal}）</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-100">
                  <span>预计1小时：¥{estimateFee}</span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">顾客人数</p>
                      <p className="text-lg font-bold text-slate-900">{table.currentSession.customerCount}人</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">开台时间</p>
                      <p className="text-lg font-bold text-slate-900">{formatTime(table.currentSession.startTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Details */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-medium text-slate-900 mb-3">台球桌信息</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">计费方式</p>
                    <p className="font-medium text-slate-900">
                      {table.currentSession.pricingType === 'hourly' ? '按时长' : 
                       table.currentSession.pricingType === 'perGame' ? '按局' : '包段'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">台费单价</p>
                    <p className="font-medium text-slate-900">¥{table.hourlyRate}/小时</p>
                  </div>
                  <div>
                    <p className="text-slate-500">容纳人数</p>
                    <p className="font-medium text-slate-900">{table.capacity}人</p>
                  </div>
                </div>
                {table.currentSession.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-slate-500 text-sm">备注</p>
                    <p className="font-medium text-slate-900">{table.currentSession.notes}</p>
                  </div>
                )}
              </div>

              {/* Assistant Section */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                    <UserCog className="w-4 h-4 text-purple-500" />
                    助教服务
                  </h3>
                </div>
                {table.currentSession.assistantName ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <UserCog className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{table.currentSession.assistantName}</p>
                        <p className="text-xs text-emerald-600 flex items-center gap-1">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          服务中
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onAssignAssistant}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      更换
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    {availableAssistants.length > 0 ? (
                      <button onClick={onAssignAssistant} className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg shadow-purple-200 hover:shadow-xl transition-shadow">
                        <UserPlus className="w-4 h-4 inline mr-2" />
                        选择助教上桌
                      </button>
                    ) : (
                      <p className="text-slate-400 text-sm">暂无可用助教</p>
                    )}
                  </div>
                )}
              </div>

              {/* Product Orders */}
              {allOrderItems.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-500" />
                      商品消费 ({allOrderItems.length}件)
                    </h3>
                    <button 
                      onClick={onOrder}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + 添加
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {allOrderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm py-2 border-b border-slate-50 last:border-0">
                        <span className="text-slate-600">{item.productName} x{item.quantity}</span>
                        <span className="text-slate-900 font-medium">¥{item.subtotal}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between">
                    <span className="text-slate-700 font-medium">商品小计</span>
                    <span className="text-emerald-600 font-bold">¥{orderTotal}</span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {allOrderItems.length === 0 && (
                <button
                  onClick={onOrder}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-lg shadow-blue-200 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  添加商品
                </button>
              )}
            </>
          )}

          {/* Idle Status */}
          {isIdle && (
            <>
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm">台球桌空闲中</p>
                    <p className="text-2xl font-bold">¥{table.hourlyRate}/小时</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <h3 className="text-sm font-medium text-slate-900 mb-3">台球桌信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">容纳人数</p>
                    <p className="font-medium text-slate-900">{table.capacity}人</p>
                  </div>
                  <div>
                    <p className="text-slate-500">台球桌区域</p>
                    <p className="font-medium text-slate-900">{zoneName || '默认区域'}</p>
                  </div>
                </div>
              </div>

              {/* Open Table */}
              <button
                onClick={onOpenTable}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-200 hover:shadow-xl transition-shadow flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                <span>普通开台</span>
                <span className="text-xs opacity-75 ml-1">选择人数/助教</span>
              </button>
            </>
          )}

          {/* Other Status */}
          {!isIdle && !isInUse && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500">
                {table.status === 'reserved' ? '该台球桌已被预约' : '该台球桌正在清洁中'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-slate-200 bg-white space-y-3">
          {isIdle && (
            <button onClick={onOpenTable} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-200 hover:shadow-xl transition-all">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              开台
            </button>
          )}

          {isInUse && (
            <>
              {/* Total Display */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">合计费用</span>
                  <span className="text-3xl font-bold">¥{totalFee}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={onOrder} 
                  className="py-3 rounded-xl bg-blue-500 text-white font-medium shadow-lg shadow-blue-200 hover:shadow-xl transition-all flex flex-col items-center"
                >
                  <ShoppingCart className="w-5 h-5 mb-1" />
                  <span className="text-sm">点单</span>
                </button>
                <button 
                  onClick={onAssignAssistant} 
                  className="py-3 rounded-xl bg-purple-500 text-white font-medium shadow-lg shadow-purple-200 hover:shadow-xl transition-all flex flex-col items-center"
                >
                  <UserCog className="w-5 h-5 mb-1" />
                  <span className="text-sm">助教</span>
                </button>
                <button 
                  onClick={onMember} 
                  className="py-3 rounded-xl bg-amber-500 text-white font-medium shadow-lg shadow-amber-200 hover:shadow-xl transition-all flex flex-col items-center"
                >
                  <UserPlus className="w-5 h-5 mb-1" />
                  <span className="text-sm">会员</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={onTransfer} 
                  className="py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  换台
                </button>
                <button 
                  onClick={onMerge} 
                  className="py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Merge className="w-4 h-4" />
                  并台
                </button>
              </div>

              <button 
                onClick={onCheckout} 
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                结账 ¥{totalFee}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
