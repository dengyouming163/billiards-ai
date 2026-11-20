'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRevenueByItemType, fetchRevenueByItemTypeDetail, type RevenueByItemType, type RevenueByItemTypeDetail } from '@/lib/api/reports';
import { Gamepad2, Package, GraduationCap, Zap } from 'lucide-react';

const ITEM_TYPES = [
  { key: 'table', label: '台费', icon: Gamepad2 },
  { key: 'product', label: '商品', icon: Package },
  { key: 'assistant', label: '助教', icon: GraduationCap },
  { key: 'charging', label: '充电', icon: Zap },
];

function formatCurrency(v: number) {
  return '¥' + (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

const today = new Date().toISOString().slice(0, 10);

export function FinanceRevenueTab() {
  const { state } = useApp();
  const storeId = state.currentStore?.id || '';

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [items, setItems] = useState<RevenueByItemType[]>([]);
  const [activeSubTab, setActiveSubTab] = useState('table');
  const [details, setDetails] = useState<RevenueByItemTypeDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async (sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRevenueByItemType(storeId, s, e);
      setItems(data || []);
      // Refresh detail for current sub-tab with new date range
      loadDetail(activeSubTab, s, e);
    } catch (e) {
      console.error('加载营业额汇总失败:', e);
      setItems([]);
    }
    finally { setLoading(false); }
  };

  const loadDetail = async (itemType: string, sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setActiveSubTab(itemType);
    setDetailLoading(true);
    try {
      const data = await fetchRevenueByItemTypeDetail(storeId, s, e, itemType);
      setDetails(data || []);
    } catch (e) {
      console.error('加载营业额明细失败:', e);
      setDetails([]);
    }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadSummary(); }, [storeId]);
  useEffect(() => { loadDetail(activeSubTab); }, [activeSubTab, startDate, endDate, storeId]);

  const totalRevenue = items.reduce((s, i) => s + (Number(i.revenue) || 0), 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">营业额项目统计</h2>
          <p className="text-sm text-slate-500">按消费项目查看营业额和明细</p>
        </div>
      </div>

      <FinanceDateFilter
        startDate={startDate} endDate={endDate}
        onStartDateChange={setStartDate} onEndDateChange={setEndDate}
        onQuery={loadSummary} onExport={() => {}}
        loading={loading} exporting={exporting}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ITEM_TYPES.map((it) => {
              const data = items.find((i) => i.item_type === it.key);
              const revenue = data?.revenue || 0;
              const pct = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0';
              return (
                <Card
                  key={it.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeSubTab === it.key ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                  }`}
                  onClick={() => loadDetail(it.key)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <it.icon className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{it.label}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(revenue)}</p>
                    <p className="text-xs text-slate-400">{pct}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2">
            {ITEM_TYPES.map((it) => (
              <Button
                key={it.key}
                variant={activeSubTab === it.key ? 'default' : 'outline'}
                size="sm"
                className={activeSubTab === it.key ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                onClick={() => loadDetail(it.key)}
              >
                <it.icon className="w-4 h-4 mr-1" />
                {it.label}报表
              </Button>
            ))}
          </div>

          <Card className="bg-white rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">
                  {ITEM_TYPES.find((t) => t.key === activeSubTab)?.label}消费明细
                </h3>
                <Badge variant="secondary">{details.length} 笔</Badge>
              </div>
              {detailLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : details.length === 0 ? (
                <p className="text-center text-slate-400 py-8">暂无明细数据</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 font-medium">订单号</th>
                        <th className="pb-2 font-medium">名称</th>
                        <th className="pb-2 font-medium text-right">数量</th>
                        <th className="pb-2 font-medium text-center">金额</th>
                        <th className="pb-2 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d) => (
                        <tr key={d.id} className="border-b border-slate-50">
                          <td className="py-2 font-mono text-xs">{d.order_no}</td>
                          <td className="py-2">{d.name || '-'}</td>
                          <td className="py-2 text-right">{d.quantity || 1}</td>
                          <td className="py-2 text-center font-medium">{formatCurrency(d.amount)}</td>
                          <td className="py-2 text-slate-500">{d.paid_at || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
