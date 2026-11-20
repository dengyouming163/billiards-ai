'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Wallet } from 'lucide-react';

const RECHARGE_COLORS: Record<string, string> = {
  wechat: '#07C160',
  alipay: '#1677FF',
  cash: '#F59E0B',
  card: '#EC4899',
  total: '#8B5CF6',
};

interface RechargeDataPoint {
  date: string;
  total: number;
  wechat?: number;
  alipay?: number;
  cash?: number;
  card?: number;
}

interface ReportRechargePanelProps {
  rechargeData: RechargeDataPoint[];
  formatCurrency: (value: number) => string;
}

export function ReportRechargePanel({ rechargeData, formatCurrency }: ReportRechargePanelProps) {
  const totalRecharge = rechargeData.reduce((sum, d) => sum + (d.total || 0), 0);

  const channels = ['wechat', 'alipay', 'cash', 'card'].filter((ch) =>
    rechargeData.some((d) => (d as any)[ch] !== undefined && (d as any)[ch] > 0)
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-500">充值总额</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalRecharge)}</p>
          </CardContent>
        </Card>
        {channels.map((ch) => {
          const sum = rechargeData.reduce((s, d) => s + ((d as any)[ch] || 0), 0);
          return (
            <Card key={ch} className="bg-white rounded-xl border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: RECHARGE_COLORS[ch] || '#94A3B8' }}
                  />
                  <span className="text-sm text-slate-500">
                    {ch === 'wechat' ? '微信' : ch === 'alipay' ? '支付宝' : ch === 'cash' ? '现金' : '刷卡'}
                  </span>
                </div>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(sum)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-xl border-slate-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">充值趋势</h2>
            {rechargeData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rechargeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
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
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="总计"
                      stroke={RECHARGE_COLORS.total}
                      strokeWidth={2}
                      dot={{ fill: RECHARGE_COLORS.total, strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    {channels.map((ch) => (
                      <Line
                        key={ch}
                        type="monotone"
                        dataKey={ch}
                        name={
                          ch === 'wechat' ? '微信' : ch === 'alipay' ? '支付宝' : ch === 'cash' ? '现金' : '刷卡'
                        }
                        stroke={RECHARGE_COLORS[ch]}
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Wallet className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">暂无充值数据</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border-slate-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">按渠道充值分布</h2>
            {rechargeData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rechargeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
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
                      formatter={(value: number) => [formatCurrency(value)]}
                    />
                    <Legend />
                    {channels.map((ch) => (
                      <Bar
                        key={ch}
                        dataKey={ch}
                        name={
                          ch === 'wechat' ? '微信' : ch === 'alipay' ? '支付宝' : ch === 'cash' ? '现金' : '刷卡'
                        }
                        stackId="a"
                        fill={RECHARGE_COLORS[ch]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <p className="text-sm">暂无渠道分布数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
