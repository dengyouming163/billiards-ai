'use client';

import { useState, useEffect, memo } from 'react';
import {
  X, TrendingUp, DollarSign, Clock, BarChart3, Coffee, UserCheck,
  Hash, Users, Loader2, RefreshCw, PieChart,
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Payload } from 'recharts/types/component/DefaultTooltipContent';
import { statisticsApi } from '@/lib/api/pos';

interface StatisticsModalProps {
  onClose: () => void;
}

const tabs = [
  { key: 'summary' as const,    label: '营收概览', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'tables' as const,     label: '桌台明细', icon: <BarChart3 className="w-4 h-4" /> },
  { key: 'products' as const,   label: '商品销量', icon: <Coffee className="w-4 h-4" /> },
  { key: 'technicians' as const, label: '助教业绩', icon: <UserCheck className="w-4 h-4" /> },
  { key: 'channels' as const,   label: '收入渠道', icon: <PieChart className="w-4 h-4" /> },
];

type TabKey = (typeof tabs)[number]['key'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 0 }).format(amount);
}

const channelLabelMap: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  meituan: '美团',
  douyin: '抖音',
  coupon: '团券',
  member_balance: '会员卡扣',
};

const channelColorMap: Record<string, string> = {
  cash: '#10b981',
  wechat: '#07c160',
  meituan: '#ffc300',
  douyin: '#fe2c55',
  coupon: '#6366f1',
  member_balance: '#8b5cf6',
};

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-xl ${color}`}>{icon}</div>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

const StatCardMemo = memo(StatCard);

export default function StatisticsModal({ onClose }: StatisticsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [tables, setTables] = useState<Record<string, unknown>[]>([]);
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [technicians, setTechnicians] = useState<Record<string, unknown>[]>([]);
  const [channelRevenue, setChannelRevenue] = useState<Record<string, unknown>[]>([]);
  const [dateRange, setDateRange] = useState('today');

  const fetchData = async (range: string) => {
    setLoading(true);
    setError(null);
    try {
      const [ov, tbl, prod, tech, chRev] = await Promise.all([
        statisticsApi.overview({ dateRange: range }),
        statisticsApi.tableUsage({ dateRange: range }),
        statisticsApi.productRank({ dateRange: range, limit: 20 }),
        statisticsApi.assistantRank({ dateRange: range, limit: 20 }),
        statisticsApi.channelRevenue({ dateRange: range }),
      ]);
      setOverview(ov as Record<string, unknown>);
      setTables((tbl ?? []) as Record<string, unknown>[]);
      setProducts((prod ?? []) as Record<string, unknown>[]);
      setTechnicians((tech ?? []) as Record<string, unknown>[]);
      setChannelRevenue((chRev ?? []) as Record<string, unknown>[]);
    } catch {
      setError('数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('today');
  }, []);

  const handleDateChange = (range: string) => {
    setDateRange(range);
    fetchData(range);
  };

  const dateOptions = [
    { value: 'today', label: '今日' },
    { value: 'yesterday', label: '昨日' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
  ];

  const todayStr = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose}>
      <div
        className="fixed inset-4 z-50 flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">经营统计</h2>
              <p className="text-white/80 text-sm">{todayStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(dateRange)}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="刷新"
            >
              <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-white/10 flex gap-2 shrink-0 items-center justify-between">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          </div>
          <div className="flex gap-1 bg-white/5 rounded-xl p-0.5">
            {dateOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleDateChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === opt.value
                    ? 'bg-emerald-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <p className="text-slate-400">{error}</p>
              <button
                onClick={() => fetchData(dateRange)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                重新加载
              </button>
            </div>
          ) : activeTab === 'summary' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCardMemo icon={<DollarSign className="w-5 h-5 text-emerald-600" />} label="总营收" value={formatCurrency(Number(overview?.totalRevenue ?? 0))} color="bg-emerald-50" />
                <StatCardMemo icon={<Clock className="w-5 h-5 text-blue-600" />} label="台费收入" value={formatCurrency(Number(overview?.tableRevenue ?? 0))} color="bg-blue-50" />
                <StatCardMemo icon={<Coffee className="w-5 h-5 text-amber-600" />} label="商品收入" value={formatCurrency(Number(overview?.productRevenue ?? 0))} color="bg-amber-50" />
                <StatCardMemo icon={<UserCheck className="w-5 h-5 text-purple-600" />} label="助教收入" value={formatCurrency(Number(overview?.assistantRevenue ?? 0))} color="bg-purple-50" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCardMemo icon={<Hash className="w-5 h-5 text-teal-600" />} label="订单总数" value={`${overview?.totalOrders ?? 0} 单`} color="bg-teal-50" />
                <StatCardMemo icon={<Users className="w-5 h-5 text-rose-600" />} label="在用桌台" value={`${overview?.activeTables ?? 0} 桌`} color="bg-rose-50" />
                <StatCardMemo icon={<Clock className="w-5 h-5 text-indigo-600" />} label="总台时" value={`${overview?.totalHours ?? 0} 小时`} color="bg-indigo-50" />
                <StatCardMemo icon={<TrendingUp className="w-5 h-5 text-orange-600" />} label="平均客单" value={formatCurrency(Number(overview?.avgOrderAmount ?? 0))} color="bg-orange-50" />
              </div>
            </div>
          ) : activeTab === 'tables' ? (
            tables.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-500">暂无桌台数据</div>
            ) : (
              <div className="space-y-3">
                {tables.map((t, i) => (
                  <div key={`tbl-${i}`} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{t.tableNumber as string || t.tableName as string || `桌台 ${i + 1}`}</div>
                        <div className="text-xs text-slate-400">
                          开台 {(t.orderCount as number) ?? 0} 次 | 时长 {(t.hours as number) ?? 0} 小时
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-400">{formatCurrency(Number(t.revenue ?? 0))}</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'products' ? (
            products.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-slate-500">暂无商品数据</div>
            ) : (
              <div className="space-y-3">
                {products.map((p, i) => (
                  <div key={`prod-${i}`} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        i === 0 ? 'bg-amber-100 text-amber-600' :
                        i === 1 ? 'bg-slate-200 text-slate-600' :
                        i === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{p.productName as string}</div>
                        <div className="text-xs text-slate-400">销量 {(p.salesCount as number) ?? (p.quantity as number) ?? 0} 份</div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">{formatCurrency(Number(p.salesAmount ?? p.revenue ?? 0))}</div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'technicians' ? (
            <div className="space-y-3">
              {technicians.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-500">暂无助教数据</div>
              ) : (
                technicians.map((t, i) => (
                  <div key={`tech-${i}`} className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                        {(t.name as string || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{t.name as string}</div>
                        <div className="text-xs text-slate-400">
                          服务 {(t.orders as number) ?? (t.serviceCount as number) ?? 0} 次 | 时长 {(t.hours as number) ?? 0} 小时
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-purple-400">{formatCurrency(Number(t.revenue ?? 0))}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {channelRevenue.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-slate-500">暂无渠道收入数据</div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <Pie
                          data={channelRevenue.map((item) => ({
                            name: channelLabelMap[item.channel as string] || (item.channel as string),
                            value: Number(item.revenue ?? 0),
                            channel: item.channel as string,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {channelRevenue.map((item) => (
                            <Cell
                              key={item.channel as string}
                              fill={channelColorMap[item.channel as string] || '#6b7280'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(_value: number, _name: string, item: Payload<number, string>) => {
                            const ch = (item?.payload as { channel?: string })?.channel || '';
                            const label = channelLabelMap[ch] || ch;
                            return [formatCurrency(_value), label];
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {channelRevenue.map((item) => (
                      <div key={item.channel as string} className="bg-white/5 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: channelColorMap[item.channel as string] || '#6b7280' }}
                          />
                          <span className="text-sm text-slate-300">
                            {channelLabelMap[item.channel as string] || (item.channel as string)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400 text-sm">
                            {formatCurrency(Number(item.revenue ?? 0))}
                          </div>
                          <div className="text-xs text-slate-500">
                            {(item.orderCount as number) ?? 0} 单
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
