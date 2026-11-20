'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRevenueByChannel, fetchRevenueByChannelDetail, type RevenueByChannel, type RevenueByChannelDetail } from '@/lib/api/reports';
import { get } from '@/lib/api/client';
import { Banknote, Smartphone, Ticket, QrCode, CreditCard, ExternalLink } from 'lucide-react';

const CHANNELS: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'cash', label: '现金', icon: Banknote, color: 'bg-amber-100 text-amber-700' },
  { key: 'wechat', label: '微信', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  { key: 'coupon_meituan', label: '美团', icon: Ticket, color: 'bg-orange-100 text-orange-700' },
  { key: 'coupon_douyin', label: '抖音', icon: QrCode, color: 'bg-pink-100 text-pink-700' },
  { key: 'coupon_internal', label: '店内团券', icon: Ticket, color: 'bg-blue-100 text-blue-700' },
  { key: 'member_balance', label: '会员卡扣', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
];

function formatCurrency(v: number) {
  return '¥' + (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 });
}

function formatDateTime(d: string) {
  if (!d) return '-';
  return new Date(d).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getItemTypeLabel(type: string) {
  const map: Record<string, string> = { table: '台费', product: '商品', assistant: '助教', charging: '充电', package: '套餐' };
  return map[type] || type;
}

const today = new Date().toISOString().slice(0, 10);

export function FinanceIncomeTab() {
  const { state } = useApp();
  const storeId = state.currentStore?.id || '';

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [channels, setChannels] = useState<RevenueByChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('cash');
  const [details, setDetails] = useState<RevenueByChannelDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Order detail dialog
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [orderDetail, setOrderDetail] = useState<Record<string, any> | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

  const loadSummary = async (sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRevenueByChannel(storeId, s, e);
      console.log('[FinanceIncome] 汇总数据:', { storeId, s, e, data, count: data?.length });
      setChannels(data || []);
      if (selectedChannel) {
        loadDetail(selectedChannel, s, e);
      }
    } catch (e) {
      console.error('加载收入汇总失败:', e);
      setChannels([]);
    }
    finally { setLoading(false); }
  };

  const loadDetail = async (channel: string, sd?: string, ed?: string) => {
    const s = sd || startDate;
    const e = ed || endDate;
    if (!storeId) return;
    setSelectedChannel(channel);
    setDetailLoading(true);
    try {
      const data = await fetchRevenueByChannelDetail(storeId, s, e, channel);
      console.log('[FinanceIncome] 明细数据:', { storeId, s, e, channel, data, count: data?.length });
      setDetails(data || []);
    } catch (e) {
      console.error('加载收入明细失败:', e);
      setDetails([]);
    }
    finally { setDetailLoading(false); }
  };

  const handlePresetChange = (preset: string) => {
    setActivePreset(preset);
  };

  useEffect(() => { loadSummary(); }, [storeId]);

  const viewOrderDetail = async (orderId: number, orderNo: string) => {
    setOrderLoading(true);
    setOrderDialogOpen(true);
    try {
      const data = await get<Record<string, any>>(
        '/order.Order/detail',
        { id: String(orderId), store_id: storeId },
      );
      setOrderDetail(data || null);
    } catch (e) {
      console.error('加载订单详情失败:', e);
      setOrderDetail({ order_no: orderNo, _error: true });
    }
    finally { setOrderLoading(false); }
  };

  const totalRevenue = channels.reduce((s, c) => s + (Number(c.revenue) || 0), 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">收入方式明细</h2>
          <p className="text-sm text-slate-500">按支付方式查看收入来源和明细，点击明细可查看订单详情</p>
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CHANNELS.map((ch) => {
              const data = channels.find((c) => c.channel === ch.key);
              const revenue = Number(data?.revenue) || 0;
              const pct = totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0';
              return (
                <Card
                  key={ch.key}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedChannel === ch.key ? 'ring-2 ring-emerald-500 shadow-lg' : ''
                  }`}
                  onClick={() => loadDetail(ch.key)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ch.color}`}>
                        <ch.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{ch.label}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatCurrency(revenue)}</p>
                    <p className="text-xs text-slate-400">{pct}%</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedChannel && (
            <Card className="bg-white rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">
                    {CHANNELS.find((c) => c.key === selectedChannel)?.label} 明细
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
                          <th className="pb-2 font-medium">描述</th>
                          <th className="pb-2 font-medium">支付方式</th>
                          <th className="pb-2 font-medium text-center">金额</th>
                          <th className="pb-2 font-medium">支付时间</th>
                          <th className="pb-2 font-medium w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.map((d) => (
                          <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => viewOrderDetail(d.order_id, d.order_no)}>
                            <td className="py-2 font-mono text-xs text-emerald-700">{d.order_no}</td>
                            <td className="py-2 max-w-[200px] truncate">{d.description || '-'}</td>
                            <td className="py-2">
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                                {CHANNELS.find((c) => c.key === selectedChannel)?.label || selectedChannel}
                              </span>
                            </td>
                            <td className="py-2 text-center font-medium">{formatCurrency(Number(d.amount))}</td>
                            <td className="py-2 text-slate-500 text-xs">{formatDateTime(d.paid_at)}</td>
                            <td className="py-2">
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              订单详情
              {orderDetail && !orderDetail._error && (
                <Badge variant={orderDetail.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                  {orderDetail.status === 'completed' ? '已完成' : orderDetail.status_text || orderDetail.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {orderLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : orderDetail?._error ? (
            <div className="text-center py-8 text-slate-400">
              <p>订单号：{orderDetail.order_no}</p>
              <p className="text-sm mt-2">订单详情加载失败，请稍后重试</p>
            </div>
          ) : orderDetail ? (
            <div className="space-y-4 text-sm">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-slate-50 rounded-xl">
                <div><span className="text-slate-500">订单号</span><p className="font-mono font-medium">{orderDetail.order_no || '-'}</p></div>
                <div><span className="text-slate-500">桌号</span><p className="font-medium">{orderDetail.table_name || orderDetail.table_number || '-'}</p></div>
                <div><span className="text-slate-500">人数</span><p>{orderDetail.player_count || orderDetail.customer_count || '-'} 人</p></div>
                <div><span className="text-slate-500">会员</span><p>{orderDetail.member_name || '散客'}</p></div>
                <div><span className="text-slate-500">开台时间</span><p>{formatDateTime(orderDetail.start_time)}</p></div>
                <div><span className="text-slate-500">结账时间</span><p>{formatDateTime(orderDetail.end_time)}</p></div>
                {(orderDetail.duration_minutes != null || orderDetail.duration != null) && (
                  <div><span className="text-slate-500">消费时长</span><p>{Number(orderDetail.duration_minutes || orderDetail.duration)} 分钟</p></div>
                )}
              </div>

              {/* Items breakdown */}
              {orderDetail.items?.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">消费明细</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="pb-1 text-left font-medium">项目</th>
                        <th className="pb-1 text-left font-medium">名称</th>
                        <th className="pb-1 text-right font-medium">数量</th>
                        <th className="pb-1 text-right font-medium">单价</th>
                        <th className="pb-1 text-right font-medium">金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetail.items.map((item: any, i: number) => (
                        <tr key={item.id || i} className="border-b border-slate-50">
                          <td className="py-1.5">{getItemTypeLabel(item.item_type)}</td>
                          <td className="py-1.5">{item.item_name}</td>
                          <td className="py-1.5 text-right">{item.quantity}</td>
                          <td className="py-1.5 text-right">{formatCurrency(Number(item.unit_price))}</td>
                          <td className="py-1.5 text-right font-medium">{formatCurrency(Number(item.final_price || item.total_price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Payments */}
              {orderDetail.payments?.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-700 mb-2">支付记录</h4>
                  <div className="space-y-1.5">
                    {orderDetail.payments.map((p: any, i: number) => (
                      <div key={p.id || i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{CHANNELS.find(c => c.key === p.channel)?.label || p.channel}</Badge>
                          <span className="text-xs text-slate-500">{formatDateTime(p.paid_at)}</span>
                        </div>
                        <span className="font-medium text-emerald-600">{formatCurrency(Number(p.amount))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amount summary */}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between font-bold text-base">
                  <span>合计金额</span>
                  <span className="text-emerald-600">{formatCurrency(Number(orderDetail.total_fee))}</span>
                </div>
                <div className="flex justify-between text-slate-500"><span>台费</span><span>{formatCurrency(Number(orderDetail.table_fee || 0))}</span></div>
                <div className="flex justify-between text-slate-500"><span>商品</span><span>{formatCurrency(Number(orderDetail.product_fee || 0))}</span></div>
                <div className="flex justify-between text-slate-500"><span>助教</span><span>{formatCurrency(Number(orderDetail.assistant_fee || 0))}</span></div>
                <div className="flex justify-between text-slate-500"><span>充电</span><span>{formatCurrency(Number(orderDetail.charging_fee || 0))}</span></div>
              </div>

              {orderDetail.remark && (
                <div className="border-t pt-2 text-slate-500"><span>备注：</span>{orderDetail.remark}</div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
