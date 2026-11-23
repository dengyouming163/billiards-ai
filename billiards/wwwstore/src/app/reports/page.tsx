'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Download,
  RefreshCw,
  CreditCard,
  Layers,
  Wallet,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  fetchReportOverview,
  fetchRevenueTrend,
  fetchTableUsageStats,
  fetchProductSalesRank,
  fetchMemberStats,
  fetchMemberRank,
  fetchAssistantPerformance,
  fetchReportComposition,
  fetchReportTimeAnalysis,
  fetchFinanceStats,
  fetchRevenueSummary,
  fetchOperationOverview,
  fetchRevenueByChannel,
  fetchRevenueByItemType,
  fetchRechargeReport,
  type RevenueSummary,
  type OperationOverview,
  type RevenueByChannel,
  type RevenueByItemType,
  type RechargeReportItem,
} from '@/lib/api/reports';
import { ReportStatCards } from './report-stat-cards';
import { ReportTrendPanel } from './report-trend-panel';
import { ReportTimePaymentPanel } from './report-time-payment-panel';
import { ReportTableRank } from './report-table-rank';
import { ReportTop5Ranks } from './report-top5-ranks';
import { ReportChannelPanel } from './report-channel-panel';
import { ReportItemTypePanel } from './report-item-type-panel';
import { ReportRechargePanel } from './report-recharge-panel';

const formatCurrency = (value: number) => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }
  return `¥${value.toLocaleString()}`;
};

const getDateByOffset = (format: string, daysAgo = 0) => {
  const d = new Date();
  if (format === 'Y-m-01') {
    d.setDate(1); // 当月第一天
  } else if (format === 'Y-01-01') {
    d.setMonth(0, 1); // 当年第一天
  } else if (daysAgo !== 0) {
    d.setDate(d.getDate() + daysAgo);
  }
  return d.toISOString().split('T')[0];
};

export default function ReportsPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('report:list')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const { state } = useApp();
  const { currentStore } = state;

  const [dateRange, setDateRange] = useState<string>('today');
  const [customStart, setCustomStart] = useState<string>(getDateByOffset('Y-m-d', -6));
  const [customEnd, setCustomEnd] = useState<string>(getDateByOffset('Y-m-d'));
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    totalRevenue: number; totalOrders: number; totalHours: number;
    avgUtilization: number; avgOrderAmount: number; totalProductSales: number; growthRate: number;
  } | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<{ date: string; dateValue: string; revenue: number; orders: number; tableHours: number; productSales: number }[]>([]);
  const [tableUsage, setTableUsage] = useState<{ tableId: string; tableNumber: string; utilization: number; hours: number; revenue: number; orderCount: number }[]>([]);
  const [productRank, setProductRank] = useState<{ productId: string; productName: string; salesCount: number; salesAmount: number; trend: string }[]>([]);
  const [memberRank, setMemberRank] = useState<{ name: string; level: string; consume: number; orders: number; lastVisit: string }[]>([]);
  const [assistantRank, setAssistantRank] = useState<{ name: string; level: string; hours: number; revenue: number; rating: number; orders: number }[]>([]);
  const [revenueComposition, setRevenueComposition] = useState<{ name: string; value: number; color: string; percent: string }[]>([]);
  const [timeAnalysis, setTimeAnalysis] = useState<{ time: string; label: string; revenue: number; orders: number }[]>([]);
  const [paymentStats, setPaymentStats] = useState<{ method: string; count: number; amount: number; percent: string }[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary | null>(null);
  const [operationOverview, setOperationOverview] = useState<OperationOverview | null>(null);
  const [channelData, setChannelData] = useState<RevenueByChannel[]>([]);
  const [itemTypeData, setItemTypeData] = useState<RevenueByItemType[]>([]);
  const [rechargeData, setRechargeData] = useState<RechargeReportItem[]>([]);

  useEffect(() => {
    loadData();
  }, [dateRange, state.currentStore]);

  const getRange = () => {
    switch (dateRange) {
      case 'today': return { start: getDateByOffset('Y-m-d'), end: getDateByOffset('Y-m-d') };
      case 'yesterday': return { start: getDateByOffset('Y-m-d', -1), end: getDateByOffset('Y-m-d', -1) };
      case 'week': return { start: getDateByOffset('Y-m-d', -6), end: getDateByOffset('Y-m-d') };
      case 'month': return { start: getDateByOffset('Y-m-01'), end: getDateByOffset('Y-m-d') };
      case 'year': return { start: getDateByOffset('Y-01-01'), end: getDateByOffset('Y-m-d') };
      case 'custom': return { start: customStart, end: customEnd };
      default: return { start: getDateByOffset('Y-m-d'), end: getDateByOffset('Y-m-d') };
    }
  };

  useEffect(() => {
    if (!currentStore?.id) return;
    const { start, end } = getRange();

    fetchRevenueByChannel(currentStore.id, start, end)
      .then(setChannelData)
      .catch(() => setChannelData([]));
    fetchRevenueByItemType(currentStore.id, start, end)
      .then(setItemTypeData)
      .catch(() => setItemTypeData([]));
    fetchRechargeReport(currentStore.id, start, end)
      .then(setRechargeData)
      .catch(() => setRechargeData([]));
  }, [currentStore?.id, dateRange]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { start, end } = getRange();
      const dateParams = { start_date: start, end_date: end };

      const [
        overviewData,
        trendData,
        tableData,
        productData,
        memberData,
        assistantData,
        compositionData,
        timeData,
        financeData,
        revenueSummaryData,
        operationOverviewData,
      ] = await Promise.all([
        fetchReportOverview(),
        fetchRevenueTrend({
          startDate: dateRange === 'week' ? getDateByOffset('Y-m-d', -6) : dateRange === 'month' ? getDateByOffset('Y-m-01') : getDateByOffset('Y-01-01'),
          endDate: getDateByOffset('Y-m-d'),
        }),
        fetchTableUsageStats(),
        fetchProductSalesRank({ limit: 5 }),
        fetchMemberRank({ limit: 5 }),
        fetchAssistantPerformance({ limit: 5 }),
        fetchReportComposition(),
        fetchReportTimeAnalysis(),
        fetchFinanceStats(),
        fetchRevenueSummary(dateParams).catch((e) => {
          console.warn('fetchRevenueSummary failed, falling back to overview:', e);
          return null;
        }),
        fetchOperationOverview(dateParams).catch((e) => {
          console.warn('fetchOperationOverview failed, falling back to overview:', e);
          return null;
        }),
      ]);

      setOverview(overviewData);
      setRevenueSummary(revenueSummaryData);
      setOperationOverview(operationOverviewData);
      setRevenueTrend(trendData as unknown as typeof revenueTrend);
      setTableUsage(tableData as unknown as typeof tableUsage);
      setProductRank(productData as unknown as typeof productRank);
      setMemberRank(memberData as unknown as typeof memberRank);
      setAssistantRank(assistantData as unknown as typeof assistantRank);
      const compArr = compositionData as unknown as { name: string; value: number; amount: number; color: string }[];
      setRevenueComposition(
        Array.isArray(compArr)
          ? compArr.map((item) => ({
              name: item.name,
              value: item.amount,
              color: item.color,
              percent: String(item.value ?? 0),
            }))
          : []
      );
      setTimeAnalysis(timeData as unknown as typeof timeAnalysis);

      type FinanceStats = {
        paymentStats?: {
          wechat: { amount: number; count: number };
          cash: { amount: number; count: number };
        };
      };
      const fin = financeData as unknown as FinanceStats;
      if (fin?.paymentStats) {
        const ps = fin.paymentStats;
        const totalPayment = (ps.wechat?.amount || 0) + (ps.cash?.amount || 0);
        setPaymentStats([
          { method: '微信支付', amount: ps.wechat?.amount || 0, count: ps.wechat?.count || 0, percent: totalPayment > 0 ? ((ps.wechat?.amount || 0) / totalPayment * 100).toFixed(1) : '0' },
          { method: '现金', amount: ps.cash?.amount || 0, count: ps.cash?.count || 0, percent: totalPayment > 0 ? ((ps.cash?.amount || 0) / totalPayment * 100).toFixed(1) : '0' },
        ]);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
      setError(err instanceof Error ? err.message : '加载报表数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const defaults = {
      totalRevenue: 0,
      totalOrders: 0,
      totalHours: 0,
      avgUtilization: 0,
      avgOrderAmount: 0,
      totalProductSales: 0,
      growthRate: 0,
      occupiedTables: 0,
      totalTables: 0,
    };
    // Use new ReportService APIs when available, falling back to old overview
    return {
      totalRevenue: revenueSummary?.total_revenue ?? overview?.totalRevenue ?? defaults.totalRevenue,
      totalOrders: revenueSummary?.order_count ?? overview?.totalOrders ?? defaults.totalOrders,
      totalTableHours: operationOverview
        ? +(operationOverview.total_duration_minutes / 60).toFixed(1)
        : overview?.totalHours ?? defaults.totalHours,
      occupancyRate: operationOverview?.occupancy_rate ?? overview?.avgUtilization ?? defaults.avgUtilization,
      turnoverRate: operationOverview?.turnover_rate ?? 0,
      avgCustomerSpend: operationOverview?.avg_customer_spend ?? overview?.avgOrderAmount ?? defaults.avgOrderAmount,
      avgOrderAmount: operationOverview?.avg_order_amount ?? overview?.avgOrderAmount ?? defaults.avgOrderAmount,
      productSalesCount: operationOverview?.product_sales_count ?? 0,
      tableDurationMinutes: operationOverview?.table_duration_minutes ?? 0,
      assistantDurationMinutes: operationOverview?.assistant_duration_minutes ?? 0,
      outworkDurationMinutes: operationOverview?.outwork_duration_minutes ?? 0,
      totalProductSales: overview?.totalProductSales ?? defaults.totalProductSales,
      growthRate: revenueSummary?.revenue_change ?? overview?.growthRate ?? defaults.growthRate,
      occupiedTables: operationOverview?.occupied_tables ?? defaults.occupiedTables,
      totalTables: operationOverview?.total_tables ?? defaults.totalTables,
    };
  }, [overview, revenueSummary, operationOverview]);

  const rechargeChartData = rechargeData.length > 0
    ? [{
        ...Object.fromEntries(rechargeData.map((item) => [item.channel, item.amount])),
        date: getRange().end,
        total: rechargeData.reduce((sum, item) => sum + item.amount, 0),
      }]
    : [];

  const handleExport = () => {
    if (!revenueTrend || revenueTrend.length === 0) {
      return;
    }
    const headers = ['日期', '营收', '订单数', '台桌时长(h)', '商品销售额'];
    const rows = revenueTrend.map((item) =>
      [item.date, item.revenue.toString(), item.orders.toString(), item.tableHours.toString(), item.productSales.toString()].join(',')
    );
    const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `经营报表_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="经营报表" 
        description="多维度数据分析，洞察经营趋势" 
        icon={BarChart3}
      >
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px] rounded-xl bg-white/10 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">今日</SelectItem>
            <SelectItem value="yesterday">昨日</SelectItem>
            <SelectItem value="week">近7天</SelectItem>
            <SelectItem value="month">本月</SelectItem>
            <SelectItem value="year">本年</SelectItem>
            <SelectItem value="custom">自定义</SelectItem>
          </SelectContent>
        </Select>
        {dateRange === 'custom' && (
          <div className="flex items-center gap-1">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs" />
            <span className="text-white/60 text-xs">至</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs" />
          </div>
        )}
        <Button
          variant="outline"
          className="rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20"
          onClick={handleExport}
        >
          <Download className="w-4 h-4 mr-2" />
          导出CSV
        </Button>
      </PageHeader>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <Spinner className="w-8 h-8 text-orange-500" />
        </div>
      )}

      {!loading && error && (
        <Card className="bg-white rounded-xl border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 mb-4">{error}</p>
            <Button variant="outline" onClick={() => loadData()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && !overview && (
        <Card className="bg-white rounded-xl border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg font-medium">暂无报表数据</p>
            <p className="text-slate-400 text-sm mt-1">当前时间范围内没有经营数据</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && overview && (
        <>
          <ReportStatCards
            totalRevenue={stats.totalRevenue}
            totalOrders={stats.totalOrders}
            totalTableHours={stats.totalTableHours}
            occupancyRate={stats.occupancyRate}
            turnoverRate={stats.turnoverRate}
            avgCustomerSpend={stats.avgCustomerSpend}
            avgOrderAmount={stats.avgOrderAmount}
            productSalesCount={stats.productSalesCount}
            tableDurationMinutes={stats.tableDurationMinutes}
            assistantDurationMinutes={stats.assistantDurationMinutes}
            outworkDurationMinutes={stats.outworkDurationMinutes}
            growthRate={stats.growthRate}
            occupiedTables={stats.occupiedTables}
            totalTables={stats.totalTables}
            formatCurrency={formatCurrency}
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white rounded-xl p-1 shadow-sm">
              <TabsTrigger
                value="overview"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                经营概览
              </TabsTrigger>
              <TabsTrigger
                value="channel"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                渠道分析
              </TabsTrigger>
              <TabsTrigger
                value="itemType"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
              >
                <Layers className="w-4 h-4 mr-2" />
                项目分类
              </TabsTrigger>
              <TabsTrigger
                value="recharge"
                className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
              >
                <Wallet className="w-4 h-4 mr-2" />
                充值分析
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ReportTrendPanel
                revenueTrend={revenueTrend}
                revenueComposition={revenueComposition}
                formatCurrency={formatCurrency}
              />

              <ReportTimePaymentPanel
                timeAnalysis={timeAnalysis}
                paymentStats={paymentStats}
                formatCurrency={formatCurrency}
              />

              <ReportTableRank
                tableUsage={tableUsage}
                formatCurrency={formatCurrency}
              />

              <ReportTop5Ranks
                productRank={productRank}
                memberRank={memberRank}
                assistantRank={assistantRank}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="channel" className="space-y-6">
              <ReportChannelPanel
                channelData={channelData}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="itemType" className="space-y-6">
              <ReportItemTypePanel
                itemTypeData={itemTypeData.map((item) => ({
                  type: item.item_type,
                  revenue: item.revenue,
                  orders: item.order_count,
                }))}
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="recharge" className="space-y-6">
              <ReportRechargePanel
                rechargeData={rechargeChartData}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
