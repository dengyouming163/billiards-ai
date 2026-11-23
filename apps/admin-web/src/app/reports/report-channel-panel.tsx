'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CreditCard } from 'lucide-react';

const CHANNEL_COLORS: Record<string, string> = {
  cash: '#F59E0B',
  wechat: '#07C160',
  member_balance: '#8B5CF6',
  meituan: '#EF4444',
  douyin: '#EC4899',
  coupon: '#8B5CF6',
  other: '#94A3B8',
};

const CHANNEL_LABELS: Record<string, string> = {
  cash: '现金',
  wechat: '微信',
  member_balance: '会员余额',
  meituan: '美团',
  douyin: '抖音',
  coupon: '团券',
};

interface ChannelData {
  channel: string;
  revenue: number;
  order_count: number;
}

interface ReportChannelPanelProps {
  channelData: ChannelData[];
  formatCurrency: (value: number) => string;
}

export function ReportChannelPanel({ channelData, formatCurrency }: ReportChannelPanelProps) {
  const totalRevenue = channelData.reduce((sum, d) => sum + (d.revenue || 0), 0);

  const pieData = channelData.map((d) => ({
    ...d,
    label: CHANNEL_LABELS[d.channel] || d.channel,
    percent: totalRevenue > 0 ? ((d.revenue / totalRevenue) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">支付渠道占比</h2>
          </div>
          {pieData.length > 0 ? (
            <>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="revenue"
                      nameKey="label"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHANNEL_COLORS[entry.channel] || CHANNEL_COLORS.other}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), '营收']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.channel} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHANNEL_COLORS[item.channel] || CHANNEL_COLORS.other }}
                      />
                      <span className="text-sm text-slate-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{formatCurrency(item.revenue)}</p>
                      <p className="text-xs text-slate-500">{item.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <CreditCard className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">暂无支付渠道数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">各渠道营收对比</h2>
          {channelData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="label"
                    stroke="#94A3B8"
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={(v) => formatCurrency(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '营收']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="营收金额" radius={[4, 4, 0, 0]}>
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHANNEL_COLORS[entry.channel] || CHANNEL_COLORS.other}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">暂无渠道对比数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
