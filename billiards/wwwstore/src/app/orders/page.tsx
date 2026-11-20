'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
} from '@/lib/utils';
import {
  fetchOrders,
  exportOrders,
  type Order,
} from '@/lib/api/orders';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Download,
  Eye,
  Receipt,
  Clock,
  DollarSign,
  Users,
  ShoppingBag,
  GraduationCap,
  RefreshCw,
  CheckCircle,
  XCircle,
  TrendingUp,
  Zap,
  FileText,
  ChevronDown,
  ChevronRight,
  Gamepad2,
  CreditCard,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const orderTypeConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  table: {
    label: '台费',
    icon: Gamepad2,
    color: '#07C160',
    bgColor: 'bg-[#07C160]/10 text-[#07C160]',
  },
  product: {
    label: '商品',
    icon: ShoppingBag,
    color: '#06B6D4',
    bgColor: 'bg-[#06B6D4]/10 text-[#06B6D4]',
  },
  assistant: {
    label: '助教',
    icon: GraduationCap,
    color: '#FF976A',
    bgColor: 'bg-[#FF976A]/10 text-[#FF976A]',
  },
  quick_order: {
    label: '快速下单',
    icon: Zap,
    color: '#8B5CF6',
    bgColor: 'bg-[#8B5CF6]/10 text-[#8B5CF6]',
  },
};

const statusConfig: Record<string, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: '待支付',
    color: 'text-[#FF976A]',
    bgColor: 'bg-[#FF976A]/10 border-[#FF976A]/30 text-[#FF976A]',
  },
  in_progress: {
    label: '进行中',
    color: 'text-[#07C160]',
    bgColor: 'bg-[#07C160]/10 border-[#07C160]/30 text-[#07C160]',
  },
  paused: {
    label: '已暂停',
    color: 'text-[#FF976A]',
    bgColor: 'bg-[#FF976A]/10 border-[#FF976A]/30 text-[#FF976A]',
  },
  completed: {
    label: '已完成',
    color: 'text-[#07C160]',
    bgColor: 'bg-[#07C160]/10 border-[#07C160]/30 text-[#07C160]',
  },
  cancelled: {
    label: '已取消',
    color: 'text-[#999999]',
    bgColor: 'bg-[#f7f7f7] border-[#e5e5e5] text-[#999999]',
  },
  merged: {
    label: '已合并',
    color: 'text-[#8B5CF6]',
    bgColor: 'bg-[#8B5CF6]/10 border-[#8B5CF6]/30 text-[#8B5CF6]',
  },
};

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color = 'slate',
  trend,
  trendValue,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: 'green' | 'red' | 'amber' | 'gray' | 'slate' | 'cyan' | 'blue';
  trend?: 'up' | 'down';
  trendValue?: string;
}) {
  const colorMap = {
    green: { bg: 'from-[#07C160] to-[#06AD56]', text: 'text-[#07C160]', light: 'bg-[#07C160]/5' },
    red: { bg: 'from-[#FF5252] to-[#FF3B3B]', text: 'text-[#FF5252]', light: 'bg-[#FF5252]/5' },
    amber: { bg: 'from-[#FF976A] to-[#FF7A45]', text: 'text-[#FF976A]', light: 'bg-[#FF976A]/5' },
    gray: { bg: 'from-[#999999] to-[#666666]', text: 'text-[#999999]', light: 'bg-[#f7f7f7]' },
    slate: { bg: 'from-[#999999] to-[#666666]', text: 'text-black', light: 'bg-white' },
    cyan: { bg: 'from-[#06B6D4] to-[#0891B2]', text: 'text-[#06B6D4]', light: 'bg-[#06B6D4]/5' },
    blue: { bg: 'from-[#06B6D4] to-[#0891B2]', text: 'text-[#06B6D4]', light: 'bg-[#06B6D4]/5' },
  };

  return (
    <div className={`rounded-[20px] border border-[#e5e5e5] p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${colorMap[color].light}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#999999] mb-1">{title}</p>
          <p className={`text-2xl font-bold ${colorMap[color].text}`}>{value}</p>
          {subValue && (
            <p className="text-sm text-[#333333] mt-1">{subValue}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-[#07C160]' : 'text-[#FF5252]'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function TypeStatCard({
  type,
  count,
  amount,
}: {
  type: string;
  count: number;
  amount: number;
}) {
  const config = orderTypeConfig[type] || {
    label: type,
    icon: DollarSign,
    bgColor: 'bg-[#f7f7f7] text-[#999999]',
    color: '#999999',
  };
  const Icon = config.icon;

  return (
    <div className="bg-white rounded-[20px] border border-[#e5e5e5] p-5 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#999999]">{config.label}订单</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-black">{count}</span>
            <span className="text-sm text-[#333333]">{formatCurrency(amount)}</span>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${type === 'table' ? 'bg-[#07C160]' : type === 'product' ? 'bg-[#06B6D4]' : 'bg-[#FF976A]'}`} />
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('order:list')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const { state } = useApp();
  const { currentStore } = state;
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportForm, setExportForm] = useState({
    type: 'all',
    status: 'all',
    start_date: '',
    end_date: '',
  });
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadOrders();
  }, [page, typeFilter, statusFilter, dateFilter, searchQuery, refreshKey]);

  useEffect(() => {
    if (exportDialogOpen) {
      const dateRange = getDateRange(dateFilter);
      setExportForm({
        type: typeFilter,
        status: statusFilter,
        start_date: dateRange.start_date || '',
        end_date: dateRange.end_date || '',
      });
    }
  }, [exportDialogOpen]);

  const getDateRange = (filter: string): { start_date?: string; end_date?: string; date_range?: string } => {
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (filter) {
      case 'today': {
        const today = formatDate(now);
        return { start_date: today, end_date: today };
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return { start_date: formatDate(monday), end_date: formatDate(sunday) };
      }
      case 'month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start_date: formatDate(firstDay), end_date: formatDate(lastDay) };
      }
      default:
        return {};
    }
  };

  const loadOrders = async () => {
    try {
      const params: Record<string, string | number> = {
        page,
        page_size: 20,
      };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.keyword = searchQuery;

      Object.assign(params, getDateRange(dateFilter));

      const result = await fetchOrders(params);
      setOrders(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  const stats = useMemo(() => {
    const tableOrders = orders.filter(o => o.type === 'table');
    const productOrders = orders.filter(o => o.type === 'product');
    const assistantOrders = orders.filter(o => o.type === 'assistant');
    const completedOrders = orders.filter(o => o.status === 'completed');

    return {
      total: total || orders.length,
      tableCount: tableOrders.length,
      tableAmount: tableOrders.reduce((sum, o) => sum + o.final_amount, 0),
      productCount: productOrders.length,
      productAmount: productOrders.reduce((sum, o) => sum + o.final_amount, 0),
      assistantCount: assistantOrders.length,
      assistantAmount: assistantOrders.reduce((sum, o) => sum + o.final_amount, 0),
      totalAmount: orders.reduce((sum, o) => sum + o.final_amount, 0),
      pending: orders.filter(o => o.status === 'pending').length,
      pendingAmount: orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + o.final_amount, 0),
      inProgress: orders.filter(o => o.status === 'in_progress').length,
      completed: completedOrders.length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      avgAmount: completedOrders.length > 0 ? completedOrders.reduce((sum, o) => sum + o.final_amount, 0) / completedOrders.length : 0,
    };
  }, [orders, total]);

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || {
      label: status,
      bgColor: 'bg-slate-100 border-slate-200 text-slate-600',
    };
    return (
      <Badge className={`${config.bgColor} border font-medium`}>
        {status === 'in_progress' && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse" />
        )}
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const config = orderTypeConfig[type] || {
      label: type,
      icon: DollarSign,
      bgColor: 'bg-slate-100 text-slate-700',
    };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${config.bgColor}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const handleExportConfirm = async () => {
    try {
      const params: Record<string, string> = {};
      if (exportForm.type !== 'all') params.type = exportForm.type;
      if (exportForm.status !== 'all') params.status = exportForm.status;
      if (searchQuery) params.keyword = searchQuery;
      if (exportForm.start_date) params.start_date = exportForm.start_date;
      if (exportForm.end_date) params.end_date = exportForm.end_date;

      toast({ title: '导出中', description: '正在生成导出文件...', variant: 'info' });
      await exportOrders(params);
      toast({ title: '导出成功', description: '订单数据已导出为CSV文件', variant: 'success' });
      setExportDialogOpen(false);
    } catch (error) {
      console.error('Failed to export orders:', error);
      toast({ title: '导出失败', description: '请稍后重试', variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="订单管理" 
        description="台费·商品·助教 统一账单查询与管理" 
        icon={Receipt}
      >
        <Button className="bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#06AD56] hover:to-[#07C160] text-white shadow-lg shadow-[#07C160]/25 rounded-full" onClick={() => setExportDialogOpen(true)}>
          <Download className="w-4 h-4 mr-2" />
          导出订单
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="订单总数"
          value={stats.total}
          subValue={formatCurrency(stats.totalAmount)}
          icon={Receipt}
          color="slate"
        />
        <StatCard
          title="待收款"
          value={stats.pending}
          subValue={formatCurrency(stats.pendingAmount)}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="进行中"
          value={stats.inProgress}
          icon={Zap}
          color="blue"
        />
        <StatCard
          title="已完成"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="已取消"
          value={stats.cancelled}
          icon={XCircle}
          color="gray"
        />
        <StatCard
          title="客单价"
          value={formatCurrency(stats.avgAmount)}
          icon={TrendingUp}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TypeStatCard
          type="table"
          count={stats.tableCount}
          amount={stats.tableAmount}
        />
        <TypeStatCard
          type="product"
          count={stats.productCount}
          amount={stats.productAmount}
        />
        <TypeStatCard
          type="assistant"
          count={stats.assistantCount}
          amount={stats.assistantAmount}
        />
      </div>

      <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
            <Input
              placeholder="搜索订单号、会员、台桌..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9 rounded-xl border-[#e5e5e5] focus:border-[#07C160] focus:ring-[#07C160]/20"
            />
          </div>

          <Select value={typeFilter} onValueChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[140px] rounded-xl border-[#e5e5e5]">
              <SelectValue placeholder="订单类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="table">台费订单</SelectItem>
              <SelectItem value="product">商品订单</SelectItem>
              <SelectItem value="assistant">助教订单</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[140px] rounded-xl border-[#e5e5e5]">
              <SelectValue placeholder="订单状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待支付</SelectItem>
              <SelectItem value="in_progress">进行中</SelectItem>
              <SelectItem value="paused">已暂停</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={(value) => {
            setDateFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-[120px] rounded-xl border-[#e5e5e5]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="all">全部</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="rounded-xl border-[#e5e5e5] hover:border-[#07C160] hover:bg-[#07C160]/10" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Card className="rounded-[24px] border border-[#e5e5e5] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#e5e5e5] bg-gradient-to-r from-[#f7f7f7] to-white py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-black flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#07C160]" />
              订单列表
              <span className="ml-2 text-sm font-normal text-[#999999]">
                ({total} 笔订单)
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f7f7f7] hover:bg-transparent border-b-2 border-[#e5e5e5]">
                    <TableHead className="w-10 text-[#999999] font-medium"></TableHead>
                    <TableHead className="text-[#333333] font-semibold">订单号</TableHead>
                    <TableHead className="text-[#333333] font-semibold">类型</TableHead>
                    <TableHead className="text-[#333333] font-semibold">台桌</TableHead>
                    <TableHead className="text-[#333333] font-semibold">会员/散客</TableHead>
                    <TableHead className="text-[#333333] font-semibold text-right">金额</TableHead>
                    <TableHead className="text-[#333333] font-semibold">状态</TableHead>
                    <TableHead className="text-[#333333] font-semibold">收银员</TableHead>
                    <TableHead className="text-[#333333] font-semibold">时间</TableHead>
                    <TableHead className="text-right text-[#333333] font-semibold">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <Fragment key={order.id}>
                      <TableRow 
                        className="hover:bg-[#f7f7f7] transition-colors cursor-pointer"
                        onClick={() => toggleExpand(order.id)}
                      >
                        <TableCell className="w-10">
                          {expandedOrder === order.id ? (
                            <ChevronDown className="w-4 h-4 text-[#999999]" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-[#999999]" />
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-black font-medium">
                            {order.order_no}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(order.type)}
                        </TableCell>
                        <TableCell className="text-[#333333]">
                          {order.table_name || order.table_id || '-'}
                        </TableCell>
                        <TableCell>
                          {order.member_name ? (
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#07C160]" />
                              <span className="text-[#07C160] font-medium">{order.member_name}</span>
                            </div>
                          ) : (
                            <span className="text-[#999999]">散客</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <span className="font-mono font-bold text-black">
                              {formatCurrency(order.final_amount)}
                            </span>
                            {order.discount_amount > 0 && (
                              <span className="block text-xs text-[#07C160]">
                                优惠 {formatCurrency(order.discount_amount)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-[#999999] text-sm">
                          {order.operator_name || '-'}
                        </TableCell>
                        <TableCell className="text-[#999999] text-sm">
                          <div>{new Date(order.created_at).toLocaleDateString('zh-CN')}</div>
                          <div className="text-xs">{new Date(order.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(order)}
                            className="text-[#07C160] hover:text-[#06AD56] hover:bg-[#07C160]/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            详情
                          </Button>
                        </TableCell>
                      </TableRow>

                      {expandedOrder === order.id && (
                        <TableRow className="bg-[#f7f7f7] hover:bg-[#f7f7f7]">
                          <TableCell colSpan={10} className="p-4">
                            <div className="bg-white rounded-[20px] border border-[#e5e5e5] p-4">
                              <h4 className="text-sm font-semibold text-black mb-3">订单明细</h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                  <div className="space-y-2">
                                    {order.items.map((item) => (
                                      <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                                        <div className="flex items-center gap-3">
                                          {item.item_type === 'table' && <Gamepad2 className="w-4 h-4 text-[#07C160]" />}
                                          {item.item_type === 'product' && <ShoppingBag className="w-4 h-4 text-[#06B6D4]" />}
                                          {item.item_type === 'assistant' && <GraduationCap className="w-4 h-4 text-[#FF976A]" />}
                                          <div>
                                            <span className="text-slate-700">{item.item_name}</span>
                                            {item.quantity > 1 && (
                                              <span className="ml-2 text-xs text-slate-500">x{item.quantity}</span>
                                            )}
                                          </div>
                                        </div>
                                        <span className="font-mono text-slate-700">
                                          {formatCurrency(item.final_price)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-4">
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-slate-500">订单总额</span>
                                      <span className="font-mono text-slate-700">
                                        {formatCurrency(order.original_amount)}
                                      </span>
                                    </div>
                                    {order.discount_amount > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">优惠</span>
                                        <span className="font-mono text-[#07C160]">
                                          -{formatCurrency(order.discount_amount)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between pt-2 border-t border-slate-200">
                                      <span className="font-semibold text-slate-900">实付</span>
                                      <span className="font-mono font-bold text-lg text-[#07C160]">
                                        {formatCurrency(order.final_amount)}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="mt-4 pt-4 border-t border-slate-200 space-y-2 text-xs">
                                    {order.wechat_paid > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">微信支付</span>
                                        <span className="text-slate-700 font-mono">
                                          {formatCurrency(order.wechat_paid)}
                                        </span>
                                      </div>
                                    )}
                                    {order.alipay_paid > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">支付宝</span>
                                        <span className="text-slate-700 font-mono">
                                          {formatCurrency(order.alipay_paid)}
                                        </span>
                                      </div>
                                    )}
                                    {order.cash_paid > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">现金</span>
                                        <span className="text-slate-700 font-mono">
                                          {formatCurrency(order.cash_paid)}
                                        </span>
                                      </div>
                                    )}
                                    {order.balance_paid > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">余额支付</span>
                                        <span className="text-slate-700 font-mono">
                                          {formatCurrency(order.balance_paid)}
                                        </span>
                                      </div>
                                    )}
                                    {(order as any).card_paid > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">刷卡支付</span>
                                        <span className="text-slate-700 font-mono">
                                          {formatCurrency((order as any).card_paid)}
                                        </span>
                                      </div>
                                    )}
                                    {order.duration_minutes && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">服务时长</span>
                                        <span className="text-slate-700">
                                          {formatDuration(order.duration_minutes)}
                                        </span>
                                      </div>
                                    )}
                                    {order.start_time && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">开始时间</span>
                                        <span className="text-slate-700">
                                          {formatDateTime(order.start_time)}
                                        </span>
                                      </div>
                                    )}
                                    {order.end_time && (
                                      <div className="flex justify-between">
                                        <span className="text-slate-500">结束时间</span>
                                        <span className="text-slate-700">
                                          {formatDateTime(order.end_time)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>

            {total > 20 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <span className="text-sm text-slate-500">共 {total} 条，第 {page} / {Math.ceil(total / 20)} 页</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>上一页</Button>
                  <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>下一页</Button>
                </div>
              </div>
            )}

              {orders.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f7f7f7] flex items-center justify-center">
                    <Receipt className="w-8 h-8 text-[#999999]" />
                  </div>
                  <p className="text-[#999999] text-base">暂无订单数据</p>
                  <p className="text-[#cccccc] text-sm mt-1">尝试调整筛选条件或创建新订单</p>
                </div>
              )}
        </CardContent>
      </Card>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-semibold">订单详情</DialogTitle>
                <DialogDescription className="font-mono text-slate-600 mt-1">
                  {selectedOrder?.order_no}
                </DialogDescription>
              </div>
              {selectedOrder && getStatusBadge(selectedOrder.status)}
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">订单类型</p>
                  <div className="flex items-center gap-2">
                    {getTypeBadge(selectedOrder.type)}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">台桌</p>
                  <p className="font-medium text-slate-900">
                    {selectedOrder.table_name || selectedOrder.table_id || '-'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">会员</p>
                  <p className="font-medium text-slate-900">
                    {selectedOrder.member_name || '散客'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">收银员</p>
                  <p className="font-medium text-slate-900">
                    {selectedOrder.operator_name || '-'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  消费明细
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-slate-600">项目</TableHead>
                        <TableHead className="text-slate-600 text-center">数量</TableHead>
                        <TableHead className="text-slate-600 text-right">单价</TableHead>
                        <TableHead className="text-slate-600 text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {item.item_type === 'table' && <Gamepad2 className="w-4 h-4 text-[#07C160]" />}
                              {item.item_type === 'product' && <ShoppingBag className="w-4 h-4 text-[#06B6D4]" />}
                              {item.item_type === 'assistant' && <GraduationCap className="w-4 h-4 text-[#FF976A]" />}
                              <span>{item.item_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(item.final_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">订单总额</span>
                    <span className="font-mono text-slate-700">
                      {formatCurrency(selectedOrder.original_amount)}
                    </span>
                  </div>
                  {selectedOrder.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">优惠金额</span>
                      <span className="font-mono text-[#07C160]">
                        -{formatCurrency(selectedOrder.discount_amount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-200">
                    <span className="text-slate-900">实付金额</span>
                    <span className="font-mono text-[#07C160]">
                      {formatCurrency(selectedOrder.final_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">创建时间</p>
                  <p className="text-slate-900 mt-1">
                    {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>
                {selectedOrder.end_time && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">完成时间</p>
                    <p className="text-slate-900 mt-1">
                      {formatDateTime(selectedOrder.end_time)}
                    </p>
                  </div>
                )}
                {selectedOrder.duration_minutes && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">服务时长</p>
                    <p className="text-slate-900 mt-1">
                      {formatDuration(selectedOrder.duration_minutes)}
                    </p>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">支付方式</p>
                  <div className="text-slate-900 mt-1 space-y-0.5">
                    {[
                      { label: '微信', amount: selectedOrder.wechat_paid },
                      { label: '支付宝', amount: selectedOrder.alipay_paid },
                      { label: '现金', amount: selectedOrder.cash_paid },
                      { label: '余额', amount: selectedOrder.balance_paid },
                      { label: '刷卡', amount: (selectedOrder as any).card_paid },
                    ].filter(p => Number(p.amount) > 0).map(p => (
                      <p key={p.label}>{p.label}：¥{Number(p.amount).toFixed(2)}</p>
                    ))}
                    {![selectedOrder.wechat_paid, selectedOrder.alipay_paid, selectedOrder.cash_paid, selectedOrder.balance_paid, (selectedOrder as any).card_paid].some(v => Number(v) > 0) && <p>-</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => toast({ title: '打印功能开发中', variant: 'info' })}>
              <Download className="w-4 h-4" />
              打印小票
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">导出订单</DialogTitle>
            <DialogDescription>
              按筛选条件导出订单数据为CSV文件
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700">订单类型</Label>
              <Select value={exportForm.type} onValueChange={(v) => setExportForm({ ...exportForm, type: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="table">台费</SelectItem>
                  <SelectItem value="product">商品</SelectItem>
                  <SelectItem value="assistant">助教</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">订单状态</Label>
              <Select value={exportForm.status} onValueChange={(v) => setExportForm({ ...exportForm, status: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待支付</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="paused">已暂停</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">开始日期</Label>
                <Input
                  type="date"
                  value={exportForm.start_date}
                  onChange={(e) => setExportForm({ ...exportForm, start_date: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">结束日期</Label>
                <Input
                  type="date"
                  value={exportForm.end_date}
                  onChange={(e) => setExportForm({ ...exportForm, end_date: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-500">
              将按上述条件导出全部符合条件的订单数据，不限于当前页。
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="border-[#e5e5e5]" onClick={() => setExportDialogOpen(false)}>
              取消
            </Button>
            <Button className="bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#06AD56] hover:to-[#07C160] rounded-full" onClick={handleExportConfirm}>
              <Download className="w-4 h-4 mr-2" />
              确认导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}