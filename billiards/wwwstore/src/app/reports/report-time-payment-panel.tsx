'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CreditCard } from 'lucide-react';

interface ReportTimePaymentPanelProps {
  timeAnalysis: { time: string; label: string; revenue: number; orders: number }[];
  paymentStats: { method: string; count: number; amount: number; percent: string }[];
  formatCurrency: (value: number) => string;
}

export function ReportTimePaymentPanel({
  timeAnalysis,
  paymentStats,
  formatCurrency,
}: ReportTimePaymentPanelProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">时段分析</h2>
          {timeAnalysis.length > 0 ? (
            <div className="space-y-3">
              {timeAnalysis.map((item, index) => {
                const maxRevenue = Math.max(...timeAnalysis.map((d) => d.revenue));
                const percent = maxRevenue > 0 ? (item.revenue / maxRevenue * 100).toFixed(0) : '0';
                const colors = ['from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-orange-500 to-red-500', 'from-purple-500 to-pink-500'];
                return (
                  <div key={item.time} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={colors[index]}>{item.label}</Badge>
                        <span className="text-sm text-slate-600">{item.time}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(item.revenue)}</span>
                        <span className="text-xs text-slate-500 ml-2">{item.orders}单</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${colors[index]} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <Clock className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">暂无时段分析数据</p>
              <p className="text-slate-400 text-xs mt-1">后端暂不返回时段分布数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">支付方式</h2>
          {paymentStats.length > 0 ? (
            <div className="space-y-3">
              {paymentStats.map((item) => (
                <div key={item.method} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                      <span className="text-lg">💳</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.method}</p>
                      <p className="text-xs text-slate-500">{item.count}笔</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-slate-500">{item.percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <CreditCard className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">暂无支付方式数据</p>
              <p className="text-slate-400 text-xs mt-1">后端暂不返回支付方式分布</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
