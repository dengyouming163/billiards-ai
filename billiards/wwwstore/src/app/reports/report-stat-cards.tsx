'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Target,
  Zap,
  ShoppingCart,
  Users,
  Repeat,
  Timer,
  MapPin,
} from 'lucide-react';

interface ReportStatCardsProps {
  totalRevenue: number;
  totalOrders: number;
  totalTableHours: number;
  occupancyRate: number;
  turnoverRate: number;
  avgCustomerSpend: number;
  avgOrderAmount: number;
  productSalesCount: number;
  tableDurationMinutes: number;
  assistantDurationMinutes: number;
  outworkDurationMinutes: number;
  growthRate: number;
  occupiedTables?: number;
  totalTables?: number;
  formatCurrency: (value: number) => string;
}

function fmtDur(m: number): string {
  if (!m || m <= 0) return '0h';
  const h = Math.floor(m / 60);
  const min = Math.round(m % 60);
  return min > 0 ? `${h}h${min}m` : `${h}h`;
}

export function ReportStatCards({
  totalRevenue, totalOrders, totalTableHours,
  occupancyRate, turnoverRate, avgCustomerSpend, avgOrderAmount,
  productSalesCount, tableDurationMinutes, assistantDurationMinutes, outworkDurationMinutes,
  growthRate, occupiedTables, totalTables, formatCurrency,
}: ReportStatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {/* 总营收 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-emerald-100"><DollarSign className="w-4 h-4 text-emerald-600" /></div>
            <span className="text-xs text-slate-500">总营收</span>
          </div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(totalRevenue)}</p>
          <div className="flex items-center gap-1 mt-0.5">
            {Number(growthRate) > 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            <span className={`text-xs ${Number(growthRate) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{Number(growthRate) > 0 ? '+' : ''}{growthRate}%</span>
          </div>
        </CardContent>
      </Card>

      {/* 订单数 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-blue-100"><BarChart3 className="w-4 h-4 text-blue-600" /></div><span className="text-xs text-slate-500">订单数</span></div>
          <p className="text-lg font-bold text-slate-900">{totalOrders}<span className="text-xs font-normal text-slate-500 ml-1">笔</span></p>
        </CardContent>
      </Card>

      {/* 开台率 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-indigo-100"><Target className="w-4 h-4 text-indigo-600" /></div><span className="text-xs text-slate-500">开台率</span></div>
          <p className="text-lg font-bold text-slate-900">{occupancyRate.toFixed(0)}%</p>
          <p className="text-xs text-slate-500 mt-0.5">{occupiedTables}/{totalTables}台</p>
        </CardContent>
      </Card>

      {/* 翻台率 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-teal-100"><Repeat className="w-4 h-4 text-teal-600" /></div><span className="text-xs text-slate-500">翻台率</span></div>
          <p className="text-lg font-bold text-slate-900">{turnoverRate.toFixed(1)}</p>
          <p className="text-xs text-slate-500 mt-0.5">次/台</p>
        </CardContent>
      </Card>

      {/* 客单价 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-rose-100"><Users className="w-4 h-4 text-rose-600" /></div><span className="text-xs text-slate-500">客单价</span></div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(avgCustomerSpend)}</p>
          <p className="text-xs text-slate-500 mt-0.5">元/人</p>
        </CardContent>
      </Card>

      {/* 均单金额 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-orange-100"><Zap className="w-4 h-4 text-orange-600" /></div><span className="text-xs text-slate-500">均单金额</span></div>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(avgOrderAmount)}</p>
          <p className="text-xs text-slate-500 mt-0.5">元/单</p>
        </CardContent>
      </Card>

      {/* 商品销售件数 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-cyan-100"><ShoppingCart className="w-4 h-4 text-cyan-600" /></div><span className="text-xs text-slate-500">商品销量</span></div>
          <p className="text-lg font-bold text-slate-900">{productSalesCount}<span className="text-xs font-normal text-slate-500 ml-1">件</span></p>
        </CardContent>
      </Card>

      {/* 台费时长 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-amber-100"><Clock className="w-4 h-4 text-amber-600" /></div><span className="text-xs text-slate-500">台费时长</span></div>
          <p className="text-lg font-bold text-slate-900">{fmtDur(tableDurationMinutes)}</p>
        </CardContent>
      </Card>

      {/* 助教时长 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-pink-100"><Timer className="w-4 h-4 text-pink-600" /></div><span className="text-xs text-slate-500">助教时长</span></div>
          <p className="text-lg font-bold text-slate-900">{fmtDur(assistantDurationMinutes)}</p>
        </CardContent>
      </Card>

      {/* 外勤时长 */}
      <Card className="bg-white rounded-xl border-slate-200">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-lime-100"><MapPin className="w-4 h-4 text-lime-600" /></div><span className="text-xs text-slate-500">外勤时长</span></div>
          <p className="text-lg font-bold text-slate-900">{fmtDur(outworkDurationMinutes)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
