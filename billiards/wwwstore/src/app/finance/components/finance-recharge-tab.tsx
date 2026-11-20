'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRechargeReport, fetchRechargeDetail, type RechargeReportItem, type RechargeDetail } from '@/lib/api/reports';
import { Banknote, Smartphone, ArrowLeftRight } from 'lucide-react';

const RECHARGE_TYPES = [
  { key: 'cash', label: '现金充值', icon: Banknote, color: 'bg-amber-100 text-amber-700' },
  { key: 'wechat', label: '微信充值', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  { key: 'balance', label: '余额调整', icon: ArrowLeftRight, color: 'bg-blue-100 text-blue-700' },
];

function formatCurrency(v: number) {
  return '¥' + (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

const today = new Date().toISOString().slice(0, 10);

export function FinanceRechargeTab() {
  const { state } = useApp();
  const storeId = state.currentStore?.id || '';

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [rechargeData, setRechargeData] = useState<RechargeReportItem[]>([]);
  const [activeType, setActiveType] = useState('cash');
  const [details, setDetails] = useState<RechargeDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async (sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRechargeReport(storeId, s, e);
      setRechargeData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('加载充值汇总失败:', e);
      setRechargeData([]);
    }
    finally { setLoading(false); }
  };

  const loadDetail = async (channel: string, sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setActiveType(channel);
    setDetailLoading(true);
    try {
      const data = await fetchRechargeDetail(storeId, s, e, channel);
      setDetails(data || []);
    } catch (e) {
      console.error('加载充值明细失败:', e);
      setDetails([]);
    }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadSummary(); }, [storeId]);
  useEffect(() => { loadDetail(activeType); }, [activeType, startDate, endDate, storeId]);

  const getChannelAmount = (channel: string): number => {
    const item = rechargeData.find((r) => r.channel === channel);
    return item?.amount || 0;
  };
  const getChannelCount = (channel: string): number => {
    const item = rechargeData.find((r) => r.channel === channel);
    return item?.count || 0;
  };
  const totalAmount = rechargeData.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">充值明细</h2>
          <p className="text-sm text-slate-500">查看会员充值和余额调整记录</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RECHARGE_TYPES.map((rt) => {
              const amount = getChannelAmount(rt.key);
              const count = getChannelCount(rt.key);
              return (
                <Card
                  key={rt.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    activeType === rt.key ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                  }`}
                  onClick={() => loadDetail(rt.key)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${rt.color}`}>
                        <rt.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{rt.label}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(amount)}</p>
                    <p className="text-xs text-slate-400">{count} 笔</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-white rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-2">
                  {RECHARGE_TYPES.map((rt) => (
                    <Button
                      key={rt.key}
                      variant={activeType === rt.key ? 'default' : 'outline'}
                      size="sm"
                      className={activeType === rt.key ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      onClick={() => loadDetail(rt.key)}
                    >
                      {rt.label}
                    </Button>
                  ))}
                </div>
                <Badge variant="secondary">{details.length} 笔</Badge>
              </div>
              {detailLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : details.length === 0 ? (
                <p className="text-center text-slate-400 py-8">暂无充值记录</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-slate-500">
                        <th className="pb-2 font-medium">订单号</th>
                        <th className="pb-2 font-medium">会员</th>
                        <th className="pb-2 font-medium text-center">金额</th>
                        <th className="pb-2 font-medium">渠道</th>
                        <th className="pb-2 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d) => (
                        <tr key={d.id} className="border-b border-slate-50">
                          <td className="py-2 font-mono text-xs">{d.order_no || '-'}</td>
                          <td className="py-2">{d.member_id || '-'}</td>
                          <td className="py-2 text-center font-medium">{formatCurrency(d.amount)}</td>
                          <td className="py-2">{d.channel || '-'}</td>
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
