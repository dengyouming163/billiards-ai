'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Eye,
  RefreshCw,
  ShoppingBag,
  Gamepad2,
  Receipt,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Order, Table } from '@/types';

interface OrderWithDetails {
  id: string;
  tableId: string;
  tableName: string;
  sessionId?: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
    note?: string;
  }>;
  tableFee: number;
  totalAmount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod?: 'cash' | 'wechat' | 'alipay' | 'card' | 'member';
  paidAmount?: number;
  change?: number;
  createdAt: string;
  completedAt?: string;
  customerCount?: number;
  duration?: number;
  memberId?: string;
  memberName?: string;
  assistantId?: string;
  assistantName?: string;
  syncStatus?: 'synced' | 'pending';
}

interface HistoryOrdersModalProps {
  onClose: () => void;
}

export default function HistoryOrdersModal({ onClose }: HistoryOrdersModalProps) {
  const { state } = useApp();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled' | 'pending'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // 构建完整订单数据
  useEffect(() => {
    const buildOrders = () => {
      const completedOrders: OrderWithDetails[] = [];
      
      state.orders.forEach((order: Order) => {
        const table = state.tables.find((t: Table) => t.id === order.tableId);
        const orderAny = order as unknown as Record<string, unknown>;
        const member = state.members.find(m => m.id === orderAny.memberId as string);
        const assistant = state.assistants.find(a => a.id === orderAny.assistantId as string);
        
        completedOrders.push({
          id: order.id,
          tableId: order.tableId,
          tableName: table?.name || '未知',
          sessionId: order.sessionId,
          items: order.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            note: item.remarks,
          })),
          tableFee: (orderAny.tableFee as number) || 0,
          totalAmount: order.totalAmount,
          status: order.status,
          paymentMethod: orderAny.paymentMethod as 'cash' | 'wechat' | 'alipay' | 'card' | 'member' | undefined,
          paidAmount: orderAny.paidAmount as number | undefined,
          change: orderAny.change as number | undefined,
          createdAt: orderAny.createdAt as string || new Date().toISOString(),
          completedAt: orderAny.completedAt as string | undefined,
          customerCount: orderAny.customerCount as number | undefined,
          duration: orderAny.duration as number | undefined,
          memberId: orderAny.memberId as string | undefined,
          memberName: member?.name,
          assistantId: orderAny.assistantId as string | undefined,
          assistantName: assistant?.name,
          syncStatus: orderAny.syncStatus as 'synced' | 'pending' | undefined,
        });
      });
      
      // 按时间倒序
      completedOrders.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(completedOrders);
      setLoading(false);
    };

    buildOrders();
  }, [state.orders, state.tables, state.members, state.assistants]);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders;

    // 日期筛选
    const now = new Date();
    if (dateFilter === 'today') {
      result = result.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(o => new Date(o.createdAt) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(o => new Date(o.createdAt) >= monthAgo);
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(o => o.status === statusFilter);
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(o => 
        o.tableName.toLowerCase().includes(keyword) ||
        o.id.toLowerCase().includes(keyword) ||
        o.items.some(item => item.productName.toLowerCase().includes(keyword)) ||
        o.memberName?.toLowerCase().includes(keyword) ||
        o.assistantName?.toLowerCase().includes(keyword)
      );
    }

    return result;
  }, [orders, dateFilter, statusFilter, searchKeyword]);

  // 统计
  const stats = useMemo(() => {
    const completed = filteredOrders.filter(o => o.status === 'completed');
    return {
      totalCount: filteredOrders.length,
      completedCount: completed.length,
      totalRevenue: completed.reduce((sum, o) => sum + o.totalAmount, 0),
      tableFee: completed.reduce((sum, o) => sum + o.tableFee, 0),
      productFee: completed.reduce((sum, o) => 
        sum + o.items.reduce((s, i) => s + i.subtotal, 0), 0
      ),
    };
  }, [filteredOrders]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}小时${mins}分` : `${mins}分钟`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg">已完成</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-rose-100 text-rose-700 rounded-lg">已取消</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg">待结账</span>;
      default:
        return null;
    }
  };

  const getPaymentBadge = (method?: string) => {
    switch (method) {
      case 'cash':
        return <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">现金</span>;
      case 'wechat':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">微信</span>;
      case 'alipay':
        return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">支付宝</span>;
      case 'card':
        return <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded">银行卡</span>;
      case 'member':
        return <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded">会员</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[calc(100vh-4rem)] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-lg shadow-slate-200">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">历史订单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100">
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">订单总数</div>
              <div className="text-xl font-bold text-slate-900">{stats.totalCount}</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">完成订单</div>
              <div className="text-xl font-bold text-emerald-600">{stats.completedCount}</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">总营收</div>
              <div className="text-xl font-bold text-slate-900">¥{stats.totalRevenue.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">台费收入</div>
              <div className="text-xl font-bold text-blue-600">¥{stats.tableFee.toFixed(2)}</div>
            </div>
            <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">商品收入</div>
              <div className="text-xl font-bold text-amber-600">¥{stats.productFee.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索桌台/订单号/商品/会员..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>

          {/* 日期筛选 */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="all">全部</option>
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="all">全部状态</option>
            <option value="completed">已完成</option>
            <option value="pending">待结账</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>

        {/* 订单列表 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Receipt className="w-12 h-12 mb-3 opacity-50" />
              <p>暂无订单记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* 订单头部 */}
                  <div
                    className="px-4 py-3 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                          {order.sessionId ? (
                            <Gamepad2 className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">
                            桌台 {order.tableName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>

                      {order.customerCount && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <User className="w-4 h-4" />
                          {order.customerCount}人
                        </div>
                      )}

                      {order.duration && (
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          {formatDuration(order.duration)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          ¥{order.totalAmount.toFixed(2)}
                        </div>
                        {order.items.length > 0 && (
                          <div className="text-xs text-slate-500">
                            {order.items.length}件商品
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order.paymentMethod)}
                      </div>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* 订单详情 */}
                  {expandedOrder === order.id && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                      {/* 订单信息 */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-slate-500 mb-1">订单号</div>
                          <div className="text-sm text-slate-900 font-mono">{order.id}</div>
                        </div>
                        {order.memberName && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">会员</div>
                            <div className="text-sm text-slate-900">{order.memberName}</div>
                          </div>
                        )}
                        {order.assistantName && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">助教</div>
                            <div className="text-sm text-slate-900">{order.assistantName}</div>
                          </div>
                        )}
                        {order.paidAmount && (
                          <div>
                            <div className="text-xs text-slate-500 mb-1">实收/找零</div>
                            <div className="text-sm text-slate-900">
                              ¥{order.paidAmount.toFixed(2)} / ¥{(order.change || 0).toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 商品明细 */}
                      {order.items.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs text-slate-500 mb-2">商品明细</div>
                          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs text-slate-500">商品</th>
                                  <th className="px-3 py-2 text-center text-xs text-slate-500">单价</th>
                                  <th className="px-3 py-2 text-center text-xs text-slate-500">数量</th>
                                  <th className="px-3 py-2 text-right text-xs text-slate-500">小计</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {order.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-2 text-slate-900">{item.productName}</td>
                                    <td className="px-3 py-2 text-center text-slate-600">¥{item.price.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-center text-slate-600">x{item.quantity}</td>
                                    <td className="px-3 py-2 text-right text-slate-900 font-medium">¥{item.subtotal.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* 费用汇总 */}
                      <div className="bg-white rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">台费</span>
                          <span className="text-slate-900">¥{order.tableFee.toFixed(2)}</span>
                        </div>
                        {order.items.length > 0 && (
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-slate-600">商品</span>
                            <span className="text-slate-900">
                              ¥{order.items.reduce((s, i) => s + i.subtotal, 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-slate-200">
                          <span className="font-medium text-slate-900">合计</span>
                          <span className="font-bold text-lg text-slate-600">¥{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 同步状态 */}
                      {order.syncStatus === 'pending' && (
                        <div className="mt-3 flex items-center gap-2 text-amber-600 text-xs">
                          <RefreshCw className="w-3 h-3" />
                          待同步
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
