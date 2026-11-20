'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X, Search, Clock, ChevronDown, ChevronUp, RefreshCw,
  Loader2, Receipt, CreditCard, User, Tag, Hash, ShoppingBag,
  Gamepad2, DollarSign, Printer,
} from 'lucide-react';
import { ModalShell } from '@/components/ModalShell';
import { get } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiResponseType } from '@/lib/api/types';
import { printReceipt, type ReceiptData } from '@/utils/printer';

interface HistoryOrdersModalProps {
  onClose: () => void;
}

interface OrderItemBrief {
  id: string;
  itemType: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  finalPrice: number;
}

interface OrderListItem {
  id: string;
  orderNo: string;
  type: string;
  tableName: string;
  status: string;
  paymentStatus: string;
  finalAmount: number;
  originalAmount: number;
  discountAmount: number;
  durationMinutes: number;
  tableFee: number;
  productFee: number;
  assistantFee: number;
  totalFee: number;
  wechatPaid: number;
  alipayPaid: number;
  cashPaid: number;
  cardPaid: number;
  balancePaid: number;
  operatorName: string;
  memberName: string;
  customerCount: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  cancelTime: string | null;
  remark: string;
  items: OrderItemBrief[];
  has_merged?: boolean;
}

const STATUS_OPTIONS = [
  { key: 'all', label: '全部状态' },
  { key: 'pending', label: '待支付' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];


const DATE_OPTIONS = [
  { key: 'today', label: '今天' },
  { key: 'yesterday', label: '昨天' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'custom', label: '自定义' },
  { key: 'all', label: '全部' },
];

const ITEM_TYPE_LABELS: Record<string, string> = {
  product: '商品',
  table: '台费',
  assistant: '助教',
  charging: '充电',
  merge_fee: '并入台费',
  prepaid: '预存',
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  table: '开台',
  quick_order: '快速点单',
  product: '商品',
  assistant: '助教',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: '未支付',
  paid: '已支付',
  refunded: '已退款',
};

function getPaymentLabel(order: OrderListItem): string {
  const methods: { key: keyof OrderListItem; label: string }[] = [
    { key: 'balancePaid', label: '余额' },
    { key: 'wechatPaid', label: '微信' },
    { key: 'alipayPaid', label: '支付宝' },
    { key: 'cashPaid', label: '现金' },
    { key: 'cardPaid', label: '银行卡' },
  ];
  return methods
    .filter((m) => (order[m.key] as number) > 0)
    .map((m) => m.label)
    .join('+') || '-';
}

function getPaymentMethods(order: OrderListItem): { label: string; amount: number }[] {
  return [
    { label: '微信', amount: Number(order.wechatPaid) },
    { label: '支付宝', amount: Number(order.alipayPaid) },
    { label: '现金', amount: Number(order.cashPaid) },
    { label: '银行卡', amount: Number(order.cardPaid) },
    { label: '余额', amount: Number(order.balancePaid) },
  ].filter((m) => m.amount > 0);
}

function handlePrintOrder(order: OrderListItem): void {
  const methods = getPaymentMethods(order)
  const paymentLabel = methods.map(m => m.label).join('+') || '未知'
  const storeName = (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userInfo') || '{}')?.storeName || '' : '')
  const data: ReceiptData = {
    storeName: storeName || '台球俱乐部',
    orderNo: order.orderNo || order.id?.slice(-12) || '',
    tableName: order.tableName || '',
    startTime: order.startTime || '',
    endTime: order.endTime || new Date().toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    durationMinutes: order.durationMinutes || 0,
    items: (order.items || []).map((item: any) => ({
      name: item.itemName || '',
      quantity: item.quantity || 1,
      price: item.unitPrice || item.unit_price || 0,
    })),
    tableFee: order.tableFee || 0,
    productFee: order.productFee || 0,
    assistantFee: order.assistantFee || 0,
    chargingFee: order.chargingFee || order.charging_fee || 0,
    total: order.finalAmount || order.totalFee || 0,
    paymentMethod: paymentLabel,
    cashier: order.operatorName || '',
    memberInfo: order.memberName ? { name: order.memberName, level: '' } : undefined,
  }
  printReceipt(data)
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '¥0.00';
  return '¥' + num.toFixed(2);
}

function formatDuration(minutes: number): string {
  if (!minutes) return '-';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m > 0 ? m + 'm' : ''}` : `${m}m`;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return '-';
  const d = new Date(timeStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? timeStr : d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function formatFullTime(timeStr: string): string {
  if (!timeStr) return '-';
  const d = new Date(timeStr.replace(' ', 'T'));
  return isNaN(d.getTime()) ? timeStr : d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function HistoryOrdersModal({ onClose }: HistoryOrdersModalProps) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { status: statusFilter, page, pageSize };
      if (dateRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      } else {
        params.dateRange = dateRange;
      }
      if (keyword.trim()) params.keyword = keyword.trim();
      const res = await get<Record<string, unknown>>(API_ENDPOINTS.orderLists, params, ApiResponseType.NORMAL);
      setOrders((res.lists as OrderListItem[]) ?? []);
      setTotal((res.count as number) ?? 0);
      setPageNo((res.pageNo as number) ?? 1);
    } catch {
      setError('数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, dateRange, startDate, endDate, keyword, pageSize]);

  useEffect(() => { fetchOrders(1); }, [statusFilter, dateRange]);

  const handleSearch = () => fetchOrders(1);
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <ModalShell onClose={onClose} title="历史订单" icon={<Receipt className="w-5 h-5" />}
      headerRight={
        <button onClick={() => fetchOrders(pageNo)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="刷新">
          <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >

        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex flex-col gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">状态:</span>
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.key} onClick={() => { setStatusFilter(opt.key); setExpandedId(null); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === opt.key ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={dateRange} onChange={(e) => { setDateRange(e.target.value); setExpandedId(null); }}
              className="bg-white text-gray-700 text-xs rounded-lg px-2.5 py-1.5 border border-gray-300 focus:outline-none focus:border-emerald-500">
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key} className="bg-white">{opt.label}</option>
              ))}
            </select>
            {dateRange === 'custom' && (
              <>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="bg-white text-gray-700 text-xs rounded-lg px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-emerald-500" />
                <span className="text-xs text-gray-400">至</span>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="bg-white text-gray-700 text-xs rounded-lg px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-emerald-500" />
              </>
            )}
            <div className="flex-1 min-w-[160px] max-w-xs flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="搜索桌台名/单号..." className="w-full bg-white text-gray-900 text-xs rounded-lg pl-8 pr-2.5 py-1.5 border border-gray-300 focus:outline-none focus:border-emerald-500 placeholder-gray-400" />
              </div>
              <button onClick={handleSearch} className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 transition-colors">搜索</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-gray-700">{error}</p>
              <button onClick={() => fetchOrders(pageNo)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors">重新加载</button>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">暂无历史订单</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                const isTableOrder = order.type === 'table';
                const isQuickOrder = order.type === 'quick_order';
                const displayName = isQuickOrder ? '快速点单' : (order.tableName || '未知桌台');
                const itemCount = (order.items ?? []).length;

                return (
                  <div key={order.id} className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all hover:border-gray-300 shadow-sm">
                    <button onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'}`}>
                          {isQuickOrder ? <ShoppingBag className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-900 truncate max-w-[200px]">{displayName}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium ${
                              isTableOrder ? 'bg-blue-100 text-blue-700' :
                              isQuickOrder ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'}`}>
                              {ORDER_TYPE_LABELS[order.type] || order.type}
                            </span>
                            {order.paymentStatus === 'paid' && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium shrink-0">已付</span>
                            )}
                            {order.paymentStatus === 'unpaid' && order.status === 'completed' && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium shrink-0">未付</span>
                            )}
                            {order.has_merged && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-medium shrink-0">含并台</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 mt-0.5">
                            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{order.orderNo ? order.orderNo.slice(-12) : '-'}</span>
                            <span>{formatTime(order.createdAt)}</span>
                            {order.customerCount > 0 && <span className="flex items-center gap-1"><User className="w-3 h-3" />{order.customerCount}人</span>}
                            {itemCount > 0 && <span>{itemCount}项</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div className="text-right">
                          <div className={`font-bold text-base ${
                            order.status === 'completed' ? 'text-emerald-700' :
                            order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-amber-700'}`}>
                            {formatCurrency(order.finalAmount)}
                          </div>
                          <div className={`text-xs px-1.5 py-0.5 rounded text-center font-medium ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
                            order.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'}`}>
                            {order.status === 'completed' ? '已完成' : order.status === 'cancelled' ? '已取消' : order.status === 'in_progress' ? '进行中' : '待处理'}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                          <div className="text-gray-500">单号：<span className="text-gray-900 ml-1">{order.orderNo || '-'}</span></div>
                          <div className="text-gray-500">操作员：<span className="text-gray-900 ml-1">{order.operatorName || '-'}</span></div>
                          <div className="text-gray-500">类型：<span className="text-gray-900 ml-1">{ORDER_TYPE_LABELS[order.type] || order.type}</span></div>
                          {order.startTime && <div className="text-gray-500">开台：<span className="text-gray-900 ml-1">{formatFullTime(order.startTime)}</span></div>}
                          {order.endTime && <div className="text-gray-500">结账：<span className="text-gray-900 ml-1">{formatFullTime(order.endTime)}</span></div>}
                          {order.durationMinutes > 0 && <div className="text-gray-500">时长：<span className="text-gray-900 ml-1">{formatDuration(order.durationMinutes)}</span></div>}
                          {order.customerCount > 0 && <div className="text-gray-500">人数：<span className="text-gray-900 ml-1">{order.customerCount}人</span></div>}
                          {order.memberName && <div className="text-gray-500">会员：<span className="text-gray-900 ml-1">{order.memberName}</span></div>}
                          {order.cancelTime && <div className="text-gray-500">取消：<span className="text-gray-900 ml-1">{formatTime(order.cancelTime)}</span></div>}
                          {order.paymentStatus && (
                            <div className="text-gray-500">支付状态：<span className={`ml-1 font-medium ${order.paymentStatus === 'paid' ? 'text-emerald-700' : order.paymentStatus === 'unpaid' ? 'text-amber-700' : 'text-gray-500'}`}>
                              {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
                            </span></div>
                          )}
                        </div>

                        {(order.items ?? []).length > 0 && (
                          <div>
                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                              <Tag className="w-3 h-3" />
                              商品明细（共{itemCount}项）
                            </div>
                            <div className="space-y-1">
                              {order.items.filter((item: any) => (item.itemType || item.item_type) !== 'merge_fee').map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-2.5">
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 font-medium ${
                                      item.itemType === 'product' ? 'bg-amber-100 text-amber-700' :
                                      item.itemType === 'table' ? 'bg-blue-100 text-blue-700' :
                                      item.itemType === 'assistant' ? 'bg-purple-100 text-purple-700' :
                                      item.itemType === 'merge_fee' ? 'bg-rose-100 text-rose-700' :
                                      'bg-gray-100 text-gray-600'}`}>
                                      {ITEM_TYPE_LABELS[item.itemType] || item.itemType}
                                    </span>
                                    <span className="text-gray-900 truncate">{item.itemName}</span>
                                    {Number(item.quantity) > 0 && <span className="text-gray-500 shrink-0">x{item.quantity}</span>}
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0 ml-3">
                                    {Number(item.unitPrice) > 0 && <span className="text-gray-500 text-xs">{formatCurrency(item.unitPrice)}/份</span>}
                                    <span className="text-gray-900 font-medium w-20 text-right">{formatCurrency(item.finalPrice || item.totalPrice || item.unitPrice || 0)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                          <div className="text-gray-500">台费：<span className="text-gray-900 ml-1">{formatCurrency(order.tableFee || 0)}</span></div>
                          <div className="text-gray-500">商品费：<span className="text-gray-900 ml-1">{formatCurrency(order.productFee || 0)}</span></div>
                          <div className="text-gray-500">助教费：<span className="text-gray-900 ml-1">{formatCurrency(order.assistantFee || 0)}</span></div>
                          <div className="text-gray-500">合计：<span className="text-gray-900 ml-1 font-medium">{formatCurrency(order.totalFee || 0)}</span></div>
                        </div>

                        {order.status === 'completed' && (() => {
                          const methods = getPaymentMethods(order);
                          return methods.length > 0 ? (
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                <CreditCard className="w-3 h-3" />
                                支付明细
                              </div>
                              <div className="space-y-1.5">
                                {methods.map((m) => (
                                  <div key={m.label} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">{m.label}</span>
                                    <span className="text-gray-900">{formatCurrency(m.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}

                        {/* 打印小票 — 仅已完成订单 */}
                        {order.status === 'completed' && (
                          <div className="pt-2 border-t border-gray-100">
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrintOrder(order); }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                            >
                              <Printer className="w-4 h-4" /> 打印小票
                            </button>
                          </div>
                        )}

                        {order.remark && (
                          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4">
                            备注：<span className="text-gray-900 ml-1">{order.remark}</span>
                          </div>
                        )}

                        {Number(order.originalAmount) > 0 && (
                          <div className="flex items-center justify-between text-sm bg-gradient-to-r from-emerald-50 to-transparent rounded-xl p-4 border border-emerald-100">
                            <div className="text-gray-500">
                              原价 <span className="text-gray-400 line-through">{formatCurrency(order.originalAmount)}</span>
                              {Number(order.discountAmount) > 0 && <span className="ml-3 text-emerald-700 font-medium">优惠 {formatCurrency(order.discountAmount)}</span>}
                            </div>
                            <div className="font-bold text-emerald-700 text-base">实收 {formatCurrency(order.finalAmount)}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {total > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-sm text-gray-500">共 {total} 条记录</span>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchOrders(pageNo - 1)} disabled={pageNo <= 1}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">上一页</button>
              <span className="text-sm text-gray-700">{pageNo} / {totalPages}</span>
              <button onClick={() => fetchOrders(pageNo + 1)} disabled={pageNo >= totalPages}
                className="px-3 py-1 text-sm rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">下一页</button>
            </div>
          </div>
        )}
    </ModalShell>
  );
}
