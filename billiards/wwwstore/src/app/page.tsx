'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useRouter } from 'next/navigation';
import {
  formatCurrency,
  formatDuration,
  calculateDuration,
  tableTypeLabels,
} from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  LayoutGrid,
  ShoppingBag,
  Clock,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Zap,
  Timer,
  CreditCard,
  Receipt,
  UserCog,
  Package2,
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchRevenueTrend,
  type DashboardStats,
  type RevenueTrendItem,
} from '@/lib/api/dashboard';

export default function DashboardPage() {
  // v1.2.7-deploy-verify
  const { state } = useApp();
  const { currentStore, tables, activeOrders, user } = state;
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<RevenueTrendItem[]>([]);
  const [trendRange, setTrendRange] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
  }, [currentStore, trendRange]);

  const loadData = async () => {
    if (!currentStore) return;
    
    try {
      const [statsData, trendData] = await Promise.all([
        fetchDashboardStats(),
        fetchRevenueTrend(),
      ]);
      setStats(statsData);
      setRevenueTrend(trendData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const revenueChange = stats?.revenue_change ?? 0;
  const isPositive = revenueChange >= 0;

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'open-table':
        router.push('/tables');
        break;
      case 'checkout':
        router.push('/orders');
        break;
      case 'product':
        router.push('/products');
        break;
      case 'member-recharge':
        router.push('/members');
        break;
      case 'assistant':
        router.push('/assistants');
        break;
      default:
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#07C160] via-[#06AD56] to-[#07C160] p-6 text-white">
        <div className="absolute inset-0 bg-black/5" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">欢迎回来，{user?.name}</h1>
            <p className="text-white/80 text-sm mt-1">
              当前门店：{currentStore?.name || '未选择门店'}
            </p>
          </div>
          
          <Button 
            onClick={() => loadData()}
            variant="secondary" 
            size="sm" 
            className="bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm whitespace-nowrap rounded-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* Stats Grid - Large Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="今日营收"
          value={formatCurrency(stats?.today_revenue ?? 0)}
          change={isPositive ? `+${revenueChange}` : revenueChange.toString()}
          icon={DollarSign}
          gradient="from-[#07C160] to-[#06AD56]"
          isPositive={isPositive}
          onClick={() => router.push('/finance')}
        />
        <StatCard
          title="台桌使用"
          value={`${stats?.tables_in_use ?? 0}`}
          subtitle={`/ ${stats?.total_tables ?? 0} 张`}
          icon={LayoutGrid}
          gradient="from-[#06B6D4] to-[#0891B2]"
          onClick={() => router.push('/tables')}
        />
        <StatCard
          title="会员总数"
          value={(stats?.total_members ?? 0).toString()}
          icon={Users}
          gradient="from-[#8B5CF6] to-[#7C3AED]"
          onClick={() => router.push('/members')}
        />
        <StatCard
          title="进行中订单"
          value={(stats?.active_orders ?? 0).toString()}
          icon={Clock}
          gradient="from-[#FF976A] to-[#FF7A45]"
          onClick={() => router.push('/orders')}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-lg shadow-[#07C160]/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-black">快捷操作</h2>
            <p className="text-sm text-[#999999]">常用功能快速入口</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickActionButton
            icon={LayoutGrid}
            label="台桌管理"
            gradient="from-[#07C160] to-[#06AD56]"
            onClick={() => router.push('/tables')}
          />
          <QuickActionButton
            icon={UserCog}
            label="助教管理"
            gradient="from-[#06B6D4] to-[#0891B2]"
            onClick={() => router.push('/assistants')}
          />
          <QuickActionButton
            icon={Receipt}
            label="计费规则"
            gradient="from-[#FF976A] to-[#FF7A45]"
            onClick={() => router.push('/pricing')}
          />
          <QuickActionButton
            icon={ShoppingBag}
            label="商品订单"
            gradient="from-[#8B5CF6] to-[#7C3AED]"
            onClick={() => handleQuickAction('product')}
          />
          <QuickActionButton
            icon={CreditCard}
            label="会员充值"
            gradient="from-[#FF5252] to-[#FF3B3B]"
            onClick={() => handleQuickAction('member-recharge')}
          />
          <QuickActionButton
            icon={RefreshCw}
            label="刷新状态"
            gradient="from-[#999999] to-[#666666]"
            onClick={() => loadData()}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Status */}
        <div className="lg:col-span-2 bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-lg shadow-[#07C160]/25">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-black">台桌实时状态</h2>
                <p className="text-sm text-[#999999]">{tables.length} 张台桌 · {stats?.tables_in_use ?? 0} 张使用中</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#07C160] hover:text-[#06AD56] hover:bg-[#07C160]/10 rounded-full"
              onClick={() => router.push('/tables')}
            >
              查看全部
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {tables.slice(0, 8).map((table) => {
              const duration = table.startTime ? calculateDuration(table.startTime) : 0;
              const isActive = table.status === 'occupied';
              const isReserved = table.status === 'reserved';
              const isMaintenance = table.status === 'maintenance';

              return (
                <div
                  key={table.id}
                  className={`
                    relative p-4 rounded-[20px] border-2 transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'bg-gradient-to-br from-[#07C160]/5 to-[#07C160]/10 border-[#07C160]/30 hover:border-[#07C160] hover:shadow-lg hover:shadow-[#07C160]/10' 
                      : isReserved
                        ? 'bg-gradient-to-br from-[#FF976A]/5 to-[#FF976A]/10 border-[#FF976A]/30 hover:border-[#FF976A] hover:shadow-lg hover:shadow-[#FF976A]/10'
                        : isMaintenance
                          ? 'bg-gradient-to-br from-[#f7f7f7] to-white border-[#cccccc] hover:border-[#999999] hover:shadow-lg'
                          : 'bg-white border-[#e5e5e5] hover:border-[#cccccc] hover:shadow-md'
                    }
                  `}
                  onClick={() => router.push('/tables')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        isActive ? 'bg-[#07C160] animate-pulse' : 
                        isReserved ? 'bg-[#FF976A]' :
                        isMaintenance ? 'bg-[#CCCCCC]' : 'bg-[#999999]'
                      }`} />
                      <span className="text-base font-bold text-black">{table.number}</span>
                    </div>
                    <Badge
                      className={`
                        text-[10px] px-2 py-0.5 rounded-full border-0
                        ${isActive ? 'bg-[#07C160]/10 text-[#07C160]' : 
                          isReserved ? 'bg-[#FF976A]/10 text-[#FF976A]' :
                          isMaintenance ? 'bg-[#CCCCCC]/10 text-[#999999]' : 'bg-[#999999]/10 text-[#999999]'}
                      `}
                    >
                      {isActive ? '使用中' : isReserved ? '已预约' : isMaintenance ? '维护中' : '空闲'}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#999999] mb-3">{table.table_type_name || ''}</p>

                  {isActive && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[#333333]">
                        <Timer className="w-4 h-4 text-[#07C160]" />
                        <span className="font-medium">{formatDuration(duration)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 py-1.5 text-xs bg-[#FF976A]/10 text-[#FF976A] rounded-lg hover:bg-[#FF976A]/20 transition-colors font-medium">
                          暂停
                        </button>
                        <button className="flex-1 py-1.5 text-xs bg-[#FF5252]/10 text-[#FF5252] rounded-lg hover:bg-[#FF5252]/20 transition-colors font-medium">
                          结账
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF976A] to-[#FF7A45] flex items-center justify-center shadow-lg shadow-[#FF976A]/25">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">进行中订单</h2>
              <p className="text-sm text-[#999999]">{activeOrders.length} 个活跃订单</p>
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {activeOrders.length > 0 ? (
              activeOrders.slice(0, 5).map((order: any) => {
                const duration = order.start_time ? calculateDuration(order.start_time) : 0;

                return (
                  <div
                    key={order.id}
                    className="p-4 bg-gradient-to-br from-[#f7f7f7] to-white rounded-xl border border-[#e5e5e5]/50 hover:border-[#e5e5e5] hover:shadow-md transition-all cursor-pointer"
                    onClick={() => router.push('/orders')}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-black">
                        {order.table_name || order.tableNumber || '未指定台桌'}
                      </span>
                      <Badge className="bg-[#07C160]/10 text-[#07C160] border-0 rounded-full px-2 text-xs">
                        {formatDuration(duration)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#999999]">订单号: {(order.order_no || order.orderNumber || '').slice(-6)}</span>
                      <span className="text-[#07C160] font-semibold">
                        {formatCurrency(order.final_amount || order.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#f7f7f7] flex items-center justify-center">
                  <Clock className="w-7 h-7 text-[#999999]" />
                </div>
                <p className="text-[#999999] text-sm">暂无进行中订单</p>
              </div>
            )}
          </div>

          {activeOrders.length > 0 && (
            <Button 
              variant="outline" 
              className="w-full mt-4 rounded-xl border-[#e5e5e5] hover:border-[#07C160] hover:bg-[#07C160]/10"
              onClick={() => router.push('/orders')}
            >
              查看全部订单
            </Button>
          )}
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-lg shadow-[#07C160]/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-black">营收趋势</h2>
              <p className="text-sm text-[#999999]">近7天营收数据</p>
            </div>
          </div>
          <div className="flex gap-1 bg-[#f7f7f7] p-1 rounded-xl">
            <button
              className={`px-4 py-1.5 text-xs font-medium rounded-lg shadow-sm ${trendRange === 'week' ? 'bg-white text-black' : 'text-[#999999] hover:text-[#333333]'}`}
              onClick={() => setTrendRange('week')}
            >本周</button>
            <button
              className={`px-4 py-1.5 text-xs font-medium rounded-lg shadow-sm ${trendRange === 'month' ? 'bg-white text-black' : 'text-[#999999] hover:text-[#333333]'}`}
              onClick={() => setTrendRange('month')}
            >本月</button>
          </div>
        </div>
        
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueTrend.length > 0 ? revenueTrend : [{ date: '暂无数据', revenue: 0, orders: 0 }]}>
              <defs>
                <linearGradient id="colorRevenueNew" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#07C160" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#07C160" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis 
                dataKey="date" 
                stroke="#999999" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#999999" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `¥${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e5e5',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
                labelStyle={{ color: '#000000', fontWeight: 600 }}
                formatter={(value: number) => [formatCurrency(value), '营收']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#07C160"
                strokeWidth={3}
                fill="url(#colorRevenueNew)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  gradient,
  isPositive,
  onClick,
}: {
  title: string;
  value: string;
  subtitle?: string;
  change?: string;
  icon: React.ElementType;
  gradient: string;
  isPositive?: boolean;
  onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-white border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group ${onClick ? 'hover:-translate-y-1' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          {value}
          {subtitle && <span className="text-sm text-slate-400 ml-1">{subtitle}</span>}
        </p>
        <p className="text-sm text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  );
}

// Quick Action Button
function QuickActionButton({
  icon: Icon,
  label,
  gradient,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-5 rounded-xl border-2 border-slate-100
        hover:border-transparent bg-white hover:shadow-xl transition-all duration-200 hover:-translate-y-1
        bg-gradient-to-br ${gradient} hover:shadow-lg
      `}
    >
      <Icon className="w-6 h-6 mb-2 text-white" />
      <span className="text-sm font-semibold text-white">{label}</span>
    </button>
  );
}