'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { Layers } from 'lucide-react';

const ITEM_COLORS: Record<string, string> = {
  table: '#F59E0B',
  product: '#3B82F6',
  assistant: '#8B5CF6',
  charging: '#10B981',
  package: '#EC4899',
};

interface ItemTypeData {
  type: string;
  revenue: number;
  orders: number;
}

interface ReportItemTypePanelProps {
  itemTypeData: ItemTypeData[];
  formatCurrency: (value: number) => string;
}

export function ReportItemTypePanel({ itemTypeData, formatCurrency }: ReportItemTypePanelProps) {
  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      table: '台桌',
      product: '商品',
      assistant: '助教',
      charging: '充电',
      package: '套餐',
    };
    return map[type] || type;
  };

  const totalRevenue = itemTypeData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = itemTypeData.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">各项目营收</h2>
          </div>
          {itemTypeData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="type"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={getTypeLabel}
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
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? formatCurrency(value) : value,
                      name === 'revenue' ? '营收' : '订单数',
                    ]}
                    labelFormatter={getTypeLabel}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="营收" radius={[4, 4, 0, 0]}>
                    {itemTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ITEM_COLORS[entry.type] || '#94A3B8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Layers className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">暂无项目营收数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900">各项目订单数</h2>
          </div>
          {itemTypeData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={itemTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="type"
                    stroke="#94A3B8"
                    fontSize={12}
                    tickFormatter={getTypeLabel}
                  />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                    }}
                    formatter={(value: number) => [value, '订单数']}
                    labelFormatter={getTypeLabel}
                  />
                  <Legend />
                  <Bar dataKey="orders" name="订单数" radius={[4, 4, 0, 0]}>
                    {itemTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ITEM_COLORS[entry.type] || '#94A3B8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="text-sm">暂无订单数数据</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <Card className="lg:col-span-2 bg-white rounded-xl border-slate-200">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">营收结构概览</h2>
          {itemTypeData.length > 0 ? (
            <div className="space-y-3">
              {itemTypeData.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: ITEM_COLORS[item.type] || '#94A3B8' }}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      {getTypeLabel(item.type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency(item.revenue)}
                      </p>
                      <p className="text-xs text-slate-500">营收</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{item.orders}</p>
                      <p className="text-xs text-slate-500">订单数</p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p className="text-sm font-semibold text-emerald-600">
                        {totalRevenue > 0
                          ? ((item.revenue / totalRevenue) * 100).toFixed(1) + '%'
                          : '0%'}
                      </p>
                      <p className="text-xs text-slate-500">占比</p>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-sm font-semibold text-amber-700">合计</span>
                <div className="flex items-center gap-6">
                  <p className="text-sm font-bold text-amber-700">{formatCurrency(totalRevenue)}</p>
                  <p className="text-sm font-bold text-amber-700">{totalOrders} 单</p>
                  <div className="min-w-[60px]" />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <p className="text-sm">暂无营收结构数据</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
