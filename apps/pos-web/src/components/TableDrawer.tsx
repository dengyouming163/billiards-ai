'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import type { Table } from '@/types';
import { orderApi } from '@/lib/api/pos';
import { getTimePeriodLabel, getCurrentCoefficient } from '@/utils/billing';
import { AssistantOvertimeModal } from '@/components/AssistantOvertimeModal';
import { SkeletonBlock } from '@/components/SkeletonBlock';
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

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}小时${m}分` : `${m}分`;
}

function formatDurationBetween(start: string, end: string): string {
  const diff = Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${h}小时${m}分${s}秒`;
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
  const { state, dispatch } = useApp();
  const [elapsedTime, setElapsedTime] = useState('0分0秒');
  const [billData, setBillData] = useState<Record<string, unknown> | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productExpanded, setProductExpanded] = useState(false);
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [tablePaused, setTablePaused] = useState(false);
  const [assistantPaused, setAssistantPaused] = useState(false);
  const [pauseMinutes, setPauseMinutes] = useState({ table: 0, assistant: 0 });

  // Get zone name
  const zoneName = table?.zoneId
    ? state.zones.find(z => z.id === table.zoneId)?.name
    : undefined;

  // 实时计时器 — 暂停时冻结，恢复后扣除暂停时长
  useEffect(() => {
    const startTime = (billData?.startTime as string) || (billData?.start_time as string) || table?.currentSession?.startTime;

    if (!table || table.status !== 'occupied' || !startTime) {
      setElapsedTime('0分0秒');
      return;
    }

    const pausedAt = (billData?.tablePausedAt || billData?.table_paused_at) as string | undefined;
    const pausedDuration = (billData?.tableFeePausedDuration || billData?.table_fee_paused_duration || 0) as number;

    const updateElapsed = () => {
      if (pausedAt) {
        // 暂停中: 冻结在暂停时刻
        setElapsedTime(formatDurationBetween(startTime, pausedAt));
      } else {
        // 计费中: 扣除累计暂停秒数
        const elapsed = Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) - pausedDuration);
        const h = Math.floor(elapsed / 3600);
        const m = Math.floor((elapsed % 3600) / 60);
        const s = elapsed % 60;
        setElapsedTime(`${h}小时${m}分${s}秒`);
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [table, billData]);

  // 获取账单数据（与平板同款格式：getCurrentOrder API）
  useEffect(() => {
    if (!table || table.status !== 'occupied') {
      setBillData(null);
      return;
    }

    let mounted = true;
    setIsLoading(true);

    const fetchBill = async () => {
      try {
        const result = await orderApi.getCurrentOrder(table.id) as Record<string, unknown>;
        if (!mounted) return;
        setBillData(result);
      } catch {
        // API 失败时保持现有数据
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchBill();
    const interval = setInterval(fetchBill, 10000);
    return () => { mounted = false; clearInterval(interval); };
  }, [table]);

  // Refresh bill data after action
  const refreshBill = async () => {
    if (!table || table.status !== 'occupied') return;
    try {
      const result = await orderApi.getCurrentOrder(table.id) as Record<string, unknown>;
      setBillData(result);
    } catch {
      // ignore
    }
  };

  // Sync pause state from billData (snakeToCamel 转换后字段名变化)
  useEffect(() => {
    const tp = (billData?.tablePausedAt || billData?.table_paused_at) as string | undefined;
    const ap = (billData?.assistantPausedAt || billData?.assistant_paused_at) as string | undefined;
    setTablePaused(!!tp);
    setAssistantPaused(!!ap);
  }, [billData?.tablePausedAt, billData?.table_paused_at, billData?.assistantPausedAt, billData?.assistant_paused_at]);

  // Update elapsed pause time every 10 seconds
  useEffect(() => {
    if (!tablePaused && !assistantPaused) return;
    const timer = setInterval(() => {
      const now = Date.now();
      const tp = (billData?.tablePausedAt || billData?.table_paused_at) as string | undefined;
      const ap = (billData?.assistantPausedAt || billData?.assistant_paused_at) as string | undefined;
      setPauseMinutes({
        table: tablePaused && tp
          ? Math.floor((now - new Date(tp).getTime()) / 60000)
          : 0,
        assistant: assistantPaused && ap
          ? Math.floor((now - new Date(ap).getTime()) / 60000)
          : 0,
      });
    }, 10000);
    return () => clearInterval(timer);
  }, [tablePaused, assistantPaused, billData?.table_paused_at, billData?.assistant_paused_at]);

  // Handle product actions (accept/deliver)
  const handleProductAction = async (item: Record<string, unknown>) => {
    const itemId = item.id as string;
    const status = item.status as string;
    setLoadingItemId(itemId);
    try {
      if (status === 'pending' || status === 'preorder_pending') {
        await orderApi.acceptItem({ item_id: itemId, employee_id: state.currentOperator?.id || '' });
      } else if (status === 'processing') {
        await orderApi.deliverItem({ item_id: itemId });
      }
      await refreshBill();
    } catch {
      // ignore
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle assistant actions (accept/start/end)
  const handleAssistantAction = async (item: Record<string, unknown>) => {
    const itemId = item.id as string;
    const status = item.status as string;
    setLoadingItemId(itemId);
    try {
      if (status === 'pending') {
        await orderApi.acceptAssistant({ item_id: itemId });
      } else if (status === 'processing') {
        await orderApi.startAssistantService({ item_id: itemId });
      } else if (status === 'serving') {
        await orderApi.endAssistantService({ item_id: itemId });
      }
      await refreshBill();
    } catch {
      // ignore
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle cancel product item (preorder_pending / pending)
  const handleCancelItem = async (item: Record<string, unknown>) => {
    const itemId = item.id as string;
    setLoadingItemId(itemId);
    try {
      await orderApi.removeItem({ item_id: itemId });
      await refreshBill();
    } catch {
      // ignore
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle cancel assistant (pending only)
  const handleCancelAssistant = async (item: Record<string, unknown>) => {
    const itemId = item.id as string;
    setLoadingItemId(itemId);
    try {
      await orderApi.cancelAssistant({ item_id: itemId });
      await refreshBill();
    } catch {
      // ignore
    } finally {
      setLoadingItemId(null);
    }
  };

  // Handle per-item assistant pause/resume
  const handleToggleAssistantPause = async (item: Record<string, unknown>) => {
    const orderId = billData?.id as string;
    if (!orderId) { alert('未找到订单ID，请刷新后重试'); return; }
    if (!item.id) { alert('服务记录异常'); return; }
    try {
      if (item.isPaused || item.is_paused) {
        await orderApi.resumeAssistantFee(orderId, item.id as string);
      } else {
        await orderApi.pauseAssistantFee(orderId, item.id as string);
      }
      await refreshBill();
    } catch (e: any) { alert(e?.message || '操作失败'); }
  };

  // 加钟 Modal 状态
  const [overtimeItem, setOvertimeItem] = useState<Record<string, unknown> | null>(null);

  // Handle pause/resume table fee
  const handlePauseTable = async () => {
    const orderId = billData?.id as string;
    if (!orderId || !table) return;
    try {
      if (tablePaused) {
        await orderApi.resumeTableFee(orderId);
        setTablePaused(false);
        dispatch({ type: 'RESUME_TABLE_FEE', payload: table.id });
      } else {
        await orderApi.pauseTableFee(orderId);
        setTablePaused(true);
        dispatch({ type: 'PAUSE_TABLE_FEE', payload: table.id });
      }
      await refreshBill();
    } catch {
      // ignore
    }
  };

  // Handle pause/resume assistant fee
  const handlePauseAssistant = async () => {
    const orderId = billData?.id as string;
    if (!orderId) return;
    try {
      if (assistantPaused) {
        await orderApi.resumeAssistantFee(orderId);
        setAssistantPaused(false);
      } else {
        await orderApi.pauseAssistantFee(orderId);
        setAssistantPaused(true);
      }
      await refreshBill();
    } catch {
      // ignore
    }
  };

  if (!table) return null;

  const isIdle = table.status === 'idle';
  const isInUse = table.status === 'occupied';

  // 账单数据（getCurrentOrder 平板同款格式，字段扁平化）
  const detailItems = (billData?.items as Record<string, unknown>[]) || [];
  const billTableFee = (billData?.tableFee as number) || (billData?.table_fee as number) || 0;
  const billMergeFee = (billData?.mergeFee as number) || (billData?.merge_fee as number) || 0;
  const billProductFee = (billData?.productFee as number) || (billData?.product_fee as number) || 0;
  const billAssistantFee = (billData?.assistantFee as number) || (billData?.assistant_fee as number) || 0;
  const billChargingFee = (billData?.chargingFee as number) || (billData?.charging_fee as number) || 0;
  const billPrepaidHours = (billData?.prepaidHours as number) || (billData?.prepaid_hours as number) || 0;
  const billPrepaidAmount = (billData?.couponPrice as number) || (billData?.coupon_price as number) || 0;

  // 会员信息（client.ts 转换 member_info → memberInfo）
  const memberInfo = (billData?.memberInfo as Record<string, unknown>) || (billData?.member_info as Record<string, unknown>) || null;
  const billDiscountRate = (memberInfo?.discountRate as number) || (memberInfo?.discount_rate as number) || 100;
  const billDiscountAmount = 0;

  // 总金额 — 四项之和，API 已含实时计费（与平板一致）
  const displayTotalFee = billTableFee + billMergeFee + billProductFee + billAssistantFee + billChargingFee;

  // 时段系数提示
  const coefficient = getCurrentCoefficient();
  const periodLabel = getTimePeriodLabel();

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
      <div className="fixed right-0 top-0 h-full w-[65%] max-w-2xl bg-white z-50 animate-slide-in-right flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">台球桌 {table.name}</h2>
              {zoneName && (
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-700 text-slate-300">
                  {zoneName}
                </span>
              )}
            </div>
          </div>
          {memberInfo && (
            <div className="mt-3 flex items-center gap-4 bg-white/10 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm truncate">{memberInfo.name as string}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${memberInfo.levelColor as string}20`,
                        color: memberInfo.levelColor as string,
                      }}
                    >
                      {memberInfo.levelName as string}
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs mt-0.5">
                    {memberInfo.phone as string}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-slate-400 text-xs">余额</div>
                  <div className="text-amber-400 font-bold text-sm">¥{(memberInfo.balance as number) || 0}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-xs">积分</div>
                  <div className="text-white font-bold text-sm">{(memberInfo.points as number) || 0}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-slate-50">
          {/* Skeleton Loading */}
          {isLoading && isInUse && !billData && (
            <>
              <SkeletonBlock className="h-[132px]" />
              <SkeletonBlock className="h-[136px]" />
              <SkeletonBlock className="h-[180px]" />
              <SkeletonBlock className="h-[180px]" />
            </>
          )}

          {/* In Use - Real-time Info */}
          {isInUse && (table.currentSession || billData) && (
            <>
              {/* Real-time Fee Card — 使用服务端权威账单 */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-7 text-white shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-emerald-100 text-sm">实时费用（服务端计费）</span>
                  <div className="flex items-center gap-2 text-emerald-100">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm">{elapsedTime}</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold">¥{displayTotalFee.toFixed(2)}</span>
                  <span className="text-emerald-100 text-sm">
                    （台费¥{billTableFee.toFixed(2)}{billMergeFee > 0 ? ` + 并入台费¥${billMergeFee.toFixed(2)}` : ''} + 商品¥{billProductFee.toFixed(2)} + 助教¥{billAssistantFee.toFixed(2)}{billChargingFee > 0 ? ` + 充电¥${billChargingFee.toFixed(2)}` : ''}）
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-emerald-100">
                  {coefficient !== 1.0 && (
                    <span className={`px-2 py-1 rounded ${coefficient > 1 ? 'bg-amber-400/20' : 'bg-blue-400/20'}`}>
                      {periodLabel}
                    </span>
                  )}
                  {billDiscountRate < 100 && (
                    <span className="px-2 py-1 rounded bg-rose-400/20">会员{(billDiscountRate / 10).toFixed(1)}折</span>
                  )}
                  {billPrepaidHours > 0 && (
                    <span className="px-2 py-1 rounded bg-white/20">预付{billPrepaidHours}h</span>
                  )}
                </div>
              </div>

              {/* Pause Controls — 仅台费暂停，助教暂停在下方助教服务列表中逐条操作 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full ${tablePaused ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <p className="text-sm text-slate-500 font-medium">
                    台费状态: {tablePaused ? <span className="text-amber-600 font-bold">⏸ 已暂停</span> : <span className="text-emerald-600 font-bold">▶ 计费中</span>}
                  </p>
                </div>
                <button
                  onClick={handlePauseTable}
                  className={`w-full py-4 px-5 rounded-2xl text-base font-medium transition-colors ${
                    tablePaused ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {tablePaused ? `▶ 恢复台费（已暂停${pauseMinutes.table}分钟）` : '⏸ 暂停台费'}
                </button>
              </div>

              {/* 台费明细 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  台费明细
                </h3>
                <div className="space-y-3 text-base">
                  <div className="flex justify-between">
                    <span className="text-slate-500">开台时间</span>
                    <span className="font-medium text-slate-900">{((billData?.startTime as string) || (billData?.start_time as string)) ? formatDateTime((billData?.startTime as string) || (billData?.start_time as string) || '') : table.currentSession?.startTime ? formatDateTime(table.currentSession.startTime) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">已用时长</span>
                    <span className="font-medium text-slate-900">{((billData?.durationMinutes as number) || (billData?.duration_minutes as number)) ? formatMinutes((billData?.durationMinutes as number) || (billData?.duration_minutes as number) || 0) : elapsedTime}</span>
                  </div>
                  {billPrepaidHours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">预付时长</span>
                      <span className="font-medium text-emerald-600">{billPrepaidHours}小时 ¥{billPrepaidAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {coefficient !== 1.0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">时段系数</span>
                      <span className={`font-medium ${coefficient > 1 ? 'text-amber-600' : 'text-blue-600'}`}>{periodLabel}</span>
                    </div>
                  )}
                  {billMergeFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">并台转入台费</span>
                      <span className="font-medium text-amber-600">+¥{billMergeFee.toFixed(2)}</span>
                    </div>
                  )}
                  {billDiscountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">会员折扣</span>
                      <span className="font-medium text-rose-500">-¥{billDiscountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-700 font-medium">台费合计</span>
                    <span className="text-emerald-600 font-bold">¥{(billTableFee + billMergeFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 商品点单明细 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-3">
                    <Receipt className="w-5 h-5 text-blue-500" />
                    商品点单明细
                  </h3>
                  <button
                    onClick={onOrder}
                    className="text-base text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + 商品点单
                  </button>
                </div>
                {detailItems.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      const productItems = detailItems.filter((item: Record<string, unknown>) =>
                        (item.itemType as string) !== 'assistant' &&
                        (item.itemType as string) !== 'assistant_overtime' &&
                        (item.itemType as string) !== 'table' &&
                        (item.itemType as string) !== 'charging' &&
                        (item.itemType as string) !== 'merge_fee' &&
                        (item.status as string) !== 'preorder_pending' &&
                        (item.status as string) !== 'cancelled'
                      );
                      const displayItems = productExpanded ? productItems : productItems.slice(0, 3);
                      const hasMore = productItems.length > 3;
                      return (
                        <>
                          {displayItems.map((item: Record<string, unknown>, index: number) => {
                            const status = item.status as string;
                            return (
                        <div key={item.id as string || index} className="flex items-center justify-between text-base py-3 border-b border-slate-50 last:border-0">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-slate-600 truncate">
                              {(item.itemName as string) || (item.name as string) || (item.productName as string)}
                              <span className="text-slate-400 ml-2">x{item.quantity as number}</span>
                            </span>
                            {status === 'preorder_pending' && <span className="text-sm text-slate-400 shrink-0">⏳待确认</span>}
                            {status === 'pending' && <span className="text-sm text-blue-600 shrink-0">待接单</span>}
                            {status === 'processing' && <span className="text-sm text-amber-600 shrink-0">处理中</span>}
                            {status === 'delivered' && <span className="text-sm text-emerald-600 shrink-0">✅已送达</span>}
                            {status === 'cancelled' && <span className="text-sm text-slate-400 shrink-0">已取消</span>}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-slate-900 font-medium text-lg">¥{(item.finalPrice as number) || (item.price as number) || 0}</span>
                            {(status === 'pending' || status === 'preorder_pending') && (
                              <>
                                <button
                                  onClick={() => handleProductAction(item)}
                                  disabled={loadingItemId === (item.id as string)}
                                  className="text-sm px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium disabled:opacity-50 transition-colors"
                                >
                                  {loadingItemId === (item.id as string) ? '...' : '确认接单'}
                                </button>
                                <button
                                  onClick={() => handleCancelItem(item)}
                                  disabled={loadingItemId === (item.id as string)}
                                  className="text-sm px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-medium disabled:opacity-50 transition-colors"
                                >
                                  {loadingItemId === (item.id as string) ? '...' : '取消'}
                                </button>
                              </>
                            )}
                            {status === 'processing' && (
                              <button
                                onClick={() => handleProductAction(item)}
                                disabled={loadingItemId === (item.id as string)}
                                className="text-sm px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium disabled:opacity-50 transition-colors"
                              >
                                {loadingItemId === (item.id as string) ? '...' : '送达'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                          {hasMore && (
                            <button
                              onClick={() => setProductExpanded(!productExpanded)}
                              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-3 transition-colors"
                            >
                              {productExpanded ? '收起 ▲' : `展开全部 ${productItems.length} 项 ▼`}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 text-base mb-4">暂未点单</p>
                    <button
                      onClick={onOrder}
                      className="px-6 py-3 rounded-xl bg-blue-500 text-white text-base font-medium hover:bg-blue-600 transition-colors"
                    >
                      去点单
                    </button>
                  </div>
                )}
                {detailItems.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                    <span className="text-slate-700 font-medium text-lg">商品小计</span>
                    <span className="text-emerald-600 font-bold text-xl">¥{billProductFee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* 充电费用明细 */}
              {billChargingFee > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-3 mb-4">
                    <span className="text-xl">⚡</span>
                    充电费用明细
                  </h3>
                  <div className="flex justify-between pt-3 border-t border-slate-100">
                    <span className="text-slate-700 font-medium text-lg">充电小计</span>
                    <span className="text-emerald-600 font-bold text-xl">¥{billChargingFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 助教服务明细 */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-slate-900 flex items-center gap-3">
                    <UserCog className="w-5 h-5 text-purple-500" />
                    助教服务明细
                  </h3>
                  <button
                    onClick={onAssignAssistant}
                    className="text-base text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + 助教服务
                  </button>
                </div>
                {detailItems.filter((item: Record<string, unknown>) => ((item.itemType as string) === 'assistant' || (item.itemType as string) === 'assistant_overtime')).length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {(() => {
                        const assistantItems = detailItems.filter((item: Record<string, unknown>) => ((item.itemType as string) === 'assistant' || (item.itemType as string) === 'assistant_overtime'));
                        const displayItems = assistantExpanded ? assistantItems : assistantItems.slice(0, 3);
                        const hasMore = assistantItems.length > 3;
                        return (
                          <>
                            {displayItems.map((item: Record<string, unknown>) => {
                        const status = item.status as string;
                        const itemType = item.itemType as string;

                        // 买断记录: 一口价，无计时/暂停/结束，但可加钟
                        if ((item.billingMode || item.billing_mode) === 'flat_rate' && itemType === 'assistant') {
                          return (
                            <div key={item.id as string} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-slate-600 truncate text-base">{(item.assistantName as string) || (item.itemName as string) || (item.name as string)}</span>
                                <span className="text-sm text-purple-600 shrink-0">买断{(item.quantity as number) || 0}h</span>
                                {(item.isPaid || item.is_paid) ? (
                                  <span className="text-sm text-emerald-600 shrink-0">✅已支付</span>
                                ) : (
                                  <span className="text-sm text-slate-400 shrink-0">已生效</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-900 font-medium text-lg">¥{((item.price as number) || 0).toFixed(2)}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOvertimeItem(item); }}
                                  className="px-2 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 text-xs font-medium cursor-pointer transition-colors"
                                >+加钟</button>
                              </div>
                            </div>
                          );
                        }

                        // 加钟记录: 已完成状态, 无操作按钮
                        if (itemType === 'assistant_overtime') {
                          return (
                            <div key={item.id as string} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-slate-600 truncate text-base">{(item.assistantName as string) || (item.itemName as string)}</span>
                                <span className="text-sm text-amber-600 shrink-0">+加钟{(item.quantity as number) || 0}h</span>
                                <span className="text-sm text-emerald-600 shrink-0">已生效</span>
                              </div>
                              <span className="text-slate-900 font-medium text-lg">¥{((item.price as number) || 0).toFixed(2)}</span>
                            </div>
                          );
                        }

                        const startedAt = item.startedAt as string;
                        const parseTime = (v: string) => new Date(v?.replace?.(' ', 'T') || '').getTime();
                        const diff = (() => {
                          const startMs = parseTime(startedAt);
                          if (!startMs) return 0;
                          const isItemPaused = !!(item.isPaused || item.is_paused);
                          const pausedAt = (item.pausedAt || item.paused_at) as string;
                          const totalPausedSec = Number(item.totalPausedSeconds || item.total_paused_seconds || 0);
                          if (isItemPaused && pausedAt) {
                            return Math.max(0, Math.floor((parseTime(pausedAt) - startMs) / 1000));
                          }
                          return Math.max(0, Math.floor((Date.now() - startMs) / 1000) - totalPausedSec);
                        })();
                        const h = Math.floor(diff / 3600);
                        const m = Math.floor((diff % 3600) / 60);
                        const s = diff % 60;
                        const servingDuration = startedAt ? `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : '00:00:00';
                        return (
                          <div key={item.id as string} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-slate-600 truncate text-base">{(item.assistantName as string) || (item.itemName as string) || (item.name as string)}</span>
                              {(status === 'serving' && (item.isPaused || item.is_paused)) && <span className="text-sm text-amber-600 shrink-0">⏸已暂停 {servingDuration}</span>}
                              {status === 'serving' && !(item.isPaused || item.is_paused) && <span className="text-sm text-emerald-600 shrink-0">⏱{servingDuration}</span>}
                              {status === 'pending' && <span className="text-sm text-blue-600 shrink-0">待确认</span>}
                              {status === 'processing' && <span className="text-sm text-emerald-600 shrink-0">已确认</span>}
                              {status === 'completed' && <span className="text-sm text-emerald-600 shrink-0">✅已完成 ¥{((item.finalPrice as number) || (item.price as number) || 0).toFixed(2)}</span>}
                              {status === 'cancelled' && <span className="text-sm text-slate-400 shrink-0">已取消</span>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-slate-900 font-medium text-lg">¥{((item.price as number) || (item.finalPrice as number) || 0).toFixed(2)}</span>
                              {status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleAssistantAction(item)}
                                    disabled={loadingItemId === (item.id as string)}
                                    className="text-sm px-3 py-2 rounded-xl bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium disabled:opacity-50 transition-colors"
                                  >
                                    {loadingItemId === (item.id as string) ? '...' : '确认接单'}
                                  </button>
                                  <button
                                    onClick={() => handleCancelAssistant(item)}
                                    disabled={loadingItemId === (item.id as string)}
                                    className="text-sm px-3 py-2 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 font-medium disabled:opacity-50 transition-colors"
                                  >
                                    {loadingItemId === (item.id as string) ? '...' : '取消'}
                                  </button>
                                </>
                              )}
                              {status === 'processing' && (
                                <button
                                  onClick={() => handleAssistantAction(item)}
                                  disabled={loadingItemId === (item.id as string)}
                                  className="text-sm px-3 py-2 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium disabled:opacity-50 transition-colors"
                                >
                                  {loadingItemId === (item.id as string) ? '...' : '开始服务'}
                                </button>
                              )}
                              {status === 'serving' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleAssistantPause(item); }}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                                      (item.isPaused || item.is_paused)
                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                                    }`}
                                  >
                                    {(item.isPaused || item.is_paused) ? '▶恢复' : '⏸暂停'}
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setOvertimeItem(item); }}
                                    className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-medium cursor-pointer transition-colors"
                                  >+加钟</button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAssistantAction(item); }}
                                    disabled={loadingItemId === (item.id as string)}
                                    className="px-3 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 text-xs font-medium disabled:opacity-50 cursor-pointer transition-colors"
                                  >
                                    {loadingItemId === (item.id as string) ? '...' : '结束'}
                                  </button>
                                </div>
                              )}
                              {status === 'completed' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOvertimeItem(item); }}
                                  className="px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-medium cursor-pointer transition-colors"
                                >+加钟</button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                            {hasMore && (
                              <button
                                onClick={() => setAssistantExpanded(!assistantExpanded)}
                                className="w-full text-sm text-purple-600 hover:text-purple-700 font-medium py-3 transition-colors"
                              >
                                {assistantExpanded ? '收起 ▲' : `展开全部 ${assistantItems.length} 项 ▼`}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                      <span className="text-slate-700 font-medium text-lg">助教小计</span>
                      <span className="text-emerald-600 font-bold text-xl">¥{billAssistantFee.toFixed(2)}</span>
                    </div>
                  </>
                ) : table.currentSession?.assistantName ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCog className="w-5 h-5 text-purple-500" />
                      <span className="text-slate-600 text-base">{table.currentSession.assistantName}</span>
                      <span className="text-sm text-emerald-600">服务中</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    {availableAssistants.length > 0 ? (
                      <button onClick={onAssignAssistant} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium text-lg shadow-lg shadow-purple-200 hover:shadow-xl transition-shadow">
                        <UserPlus className="w-5 h-5 inline mr-2" />
                        选择助教上桌
                      </button>
                    ) : (
                      <p className="text-slate-400 text-base">暂无助教服务</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Idle Status */}
          {isIdle && (
            <>
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl p-7 text-white">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-white/10 flex items-center justify-center">
                    <Sparkles className="w-10 h-10" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-base">台球桌空闲中</p>
                    <p className="text-3xl font-bold">¥{table.hourlyRate}/小时</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-medium text-slate-900 mb-4">台球桌信息</h3>
                <div className="grid grid-cols-2 gap-6 text-base">
                  
                  <div>
                    <p className="text-slate-500">台球桌区域</p>
                    <p className="font-medium text-slate-900 text-lg">{zoneName || '默认区域'}</p>
                  </div>
                </div>
              </div>

            </>
          )}

          {/* Other Status */}
          {!isIdle && !isInUse && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 text-lg">
                {table.status === 'reserved' ? '该台球桌已被预约' : '该台球桌正在维护中'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-7 border-t border-slate-200 bg-white space-y-4">
          {isIdle && (
            <button onClick={onOpenTable} className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xl shadow-lg shadow-emerald-200 hover:shadow-xl transition-all">
              <CheckCircle className="w-6 h-6 inline mr-3" />
              开台
            </button>
          )}

          {isInUse && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={onTransfer} 
                  className="py-4 rounded-2xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-3"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                  换台
                </button>
                <button 
                  onClick={onMerge} 
                  className="py-4 rounded-2xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-3"
                >
                  <Merge className="w-5 h-5" />
                  并台
                </button>
                <button 
                  onClick={onMember} 
                  className="py-4 rounded-2xl bg-amber-100 text-amber-700 font-medium hover:bg-amber-200 transition-colors flex items-center justify-center gap-3"
                >
                  <UserPlus className="w-5 h-5" />
                  会员
                </button>
              </div>

              <button 
                onClick={onCheckout} 
                className="w-full py-5 rounded-3xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xl shadow-lg shadow-rose-200 hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <CreditCard className="w-6 h-6" />
                {(() => {
                  const paid = Number(billData?.paid_amount || billData?.paidAmount || 0);
                  const unpaid = Math.max(0, displayTotalFee - paid);
                  return `结账 ¥${unpaid.toFixed(2)}`;
                })()}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 加钟弹窗 */}
      {overtimeItem && (
        <AssistantOvertimeModal
          item={overtimeItem}
          orderId={billData?.id as string}
          onClose={() => setOvertimeItem(null)}
          onSuccess={refreshBill}
        />
      )}
    </>
  );
}
