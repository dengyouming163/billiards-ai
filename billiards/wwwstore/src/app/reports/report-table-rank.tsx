'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ReportTableRankProps {
  tableUsage: { tableId: string; tableNumber: string; utilization: number; hours: number; revenue: number; orderCount: number }[];
  formatCurrency: (value: number) => string;
}

export function ReportTableRank({
  tableUsage,
  formatCurrency,
}: ReportTableRankProps) {
  return (
    <Card className="bg-white rounded-xl border-slate-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">台桌利用率排行</h2>
          <Badge variant="outline" className="text-orange-500 border-orange-200 bg-orange-50">
            共 {tableUsage.length || 8} 张台桌
          </Badge>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tableUsage.length > 0 ? tableUsage : [{ name: '1号台', utilization: 0 }]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <YAxis dataKey="tableNumber" type="category" stroke="#94A3B8" fontSize={12} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'utilization') return [`${value}%`, '利用率'];
                  return [value, name === 'hours' ? '时长' : '营收'];
                }}
              />
              <Bar dataKey="utilization" fill="#10B981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          {(tableUsage.length > 0 ? tableUsage.slice(0, 4) : Array.from({ length: 4 }, (_, i) => ({ tableNumber: `暂无数据-${i + 1}`, hours: 0, revenue: 0 }))).map((table, index) => (
            <div key={table.tableNumber} className="flex items-center gap-2 p-3 rounded-xl bg-slate-50">
              {index === 0 && <Trophy className="w-4 h-4 text-amber-500" />}
              {index === 1 && <Medal className="w-4 h-4 text-slate-400" />}
              {index === 2 && <Medal className="w-4 h-4 text-amber-700" />}
              {index > 2 && <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">{index + 1}</div>}
              <div>
                <p className="text-sm font-medium text-slate-900">{table.tableNumber || '暂无'}</p>
                <p className="text-xs text-slate-500">{table.hours || 0}h · {formatCurrency(table.revenue || 0)}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
