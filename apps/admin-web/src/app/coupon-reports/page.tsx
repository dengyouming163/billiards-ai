'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Ticket, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import * as couponApi from '@/lib/api/coupon';

const COLORS = ['#f97316', '#ec4899', '#06b6d4', '#8b5cf6'];

export default function CouponReportsPage() {
  const { state } = useApp();
  const { currentStore } = state;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [summary, setSummary] = useState<Record<string, any> | null>(null);
  const [dailyData, setDailyData] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    if (currentStore?.id) loadData();
  }, [currentStore, dateRange]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    switch (dateRange) {
      case '7d': start.setDate(end.getDate() - 7); break;
      case '30d': start.setDate(end.getDate() - 30); break;
      case '90d': start.setDate(end.getDate() - 90); break;
      default: start.setDate(end.getDate() - 30);
    }
    return {
      start_date: start.toISOString().substring(0, 10),
      end_date: end.toISOString().substring(0, 10),
    };
  };

  const loadData = async () => {
    if (!currentStore) return;
    setLoading(true);
    try {
      const range = getDateRange();
      const [summaryData, daily] = await Promise.all([
        couponApi.getCouponReportSummary(currentStore.id, range),
        couponApi.getCouponReportDaily(currentStore.id, range),
      ]);
      setSummary(summaryData);
      setDailyData(daily || []);
    } catch (e: any) {
      toast({
        title: '加载报表失败',
        description: e?.message || '加载报表失败',
        variant: 'warning',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="核销报表" description="美团/抖音团购券核销统计" icon={BarChart3} />
        <div className="flex justify-center py-20"><Spinner /></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="核销报表"
        description="美团/抖音团购券核销数据统计与分析"
        icon={BarChart3}
      >
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">近7天</SelectItem>
            <SelectItem value="30d">近30天</SelectItem>
            <SelectItem value="90d">近90天</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总核销数</p>
              <p className="text-2xl font-bold">{summary?.total_count || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">核销总额</p>
              <p className="text-2xl font-bold">¥{summary?.total_amount || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">日期范围</p>
              <p className="text-lg font-medium">
                {summary?.date_range?.start} ~ {summary?.date_range?.end}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>按平台分布</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.platform_summary?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={(summary?.platform_summary || []).map((p: any) => ({
                      name: p.platform === 'meituan' ? '美团' : '抖音',
                      value: p.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {(summary?.platform_summary || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-gray-400">暂无数据</div>
            )}
          </CardContent>
        </Card>

        {/* Package Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>按套餐排行</CardTitle>
          </CardHeader>
          <CardContent>
            {(summary?.package_summary || []).length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={(summary?.package_summary || []).map((p: any) => ({
                    name: p.package_name.length > 8 ? p.package_name.substring(0, 8) + '...' : p.package_name,
                    count: p.count,
                    amount: p.amount,
                  }))}
                  layout="vertical"
                  margin={{ left: 0, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="核销数" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-gray-400">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>每日核销趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#06b6d4" name="核销数" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="amount" stroke="#f97316" name="金额(¥)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-400">暂无数据</div>
          )}
        </CardContent>
      </Card>

      {/* Platform Summary Table */}
      {summary && summary.platform_summary?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>平台汇总</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">平台</th>
                  <th className="pb-3 font-medium text-right">核销数</th>
                  <th className="pb-3 font-medium text-right">核销金额</th>
                  <th className="pb-3 font-medium text-right">占比</th>
                </tr>
              </thead>
              <tbody>
                {summary.platform_summary.map((p: any) => (
                  <tr key={p.platform} className="border-b">
                    <td className="py-3">
                      <Badge variant="outline">
                        {p.platform === 'meituan' ? '🍔 美团' : '🎵 抖音'}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-medium">{p.count}</td>
                    <td className="py-3 text-right text-amber-600 font-medium">¥{p.amount}</td>
                    <td className="py-3 text-right text-sm text-gray-500">
                      {summary.total_count > 0 ? ((p.count / summary.total_count) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
