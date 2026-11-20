'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface ReportTrendPanelProps {
  revenueTrend: { date: string; revenue: number }[];
  revenueComposition: { name: string; value: number; color: string; percent: string }[];
  formatCurrency: (value: number) => string;
}

export function ReportTrendPanel({
  revenueTrend,
  revenueComposition,
  formatCurrency,
}: ReportTrendPanelProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">营收趋势</h2>
            <div className="flex gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                className={chartType === 'line' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                onClick={() => setChartType('line')}
              >
                折线
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                className={chartType === 'bar' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                onClick={() => setChartType('bar')}
              >
                柱状
              </Button>
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={revenueTrend.length > 0 ? revenueTrend : [{ date: '周一', revenue: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `¥${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '营收']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{ fill: '#F59E0B', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#F59E0B' }}
                  />
                </LineChart>
              ) : (
                <BarChart data={revenueTrend.length > 0 ? revenueTrend : [{ date: '周一', revenue: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `¥${v}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [formatCurrency(value), '营收']}
                  />
                  <Bar dataKey="revenue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">营收构成</h2>
          {revenueComposition.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueComposition}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {revenueComposition.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {revenueComposition.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-slate-700">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">{formatCurrency(item.value)}</p>
                      <p className="text-xs text-slate-500">{item.percent}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <PieChartIcon className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">暂无营收构成数据</p>
              <p className="text-slate-400 text-xs mt-1">后端暂不返回分类明细</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
