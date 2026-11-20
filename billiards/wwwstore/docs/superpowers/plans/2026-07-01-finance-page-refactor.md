# Finance Page Deep Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full rewrite of `/finance` page into a 3-tab report system aligned with wwwstoreapp APIs for data consistency.

**Architecture:** 3-tab shell (employees Button pattern) + shared date filter component. Each tab uses `ReportService` APIs (snake_case params) identical to wwwstoreapp `OwnerHome.vue`. Summary cards + detail table pattern repeated across all tabs.

**Tech Stack:** Next.js 16, React 19, shadcn/ui, TypeScript, Tailwind CSS

**Design Spec:** `docs/superpowers/specs/2026-07-01-finance-page-refactor-design.md`

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| **Create** | `src/app/finance/components/finance-date-filter.tsx` | Shared date range filter |
| **Create** | `src/app/finance/components/finance-income-tab.tsx` | Income by payment channel |
| **Create** | `src/app/finance/components/finance-revenue-tab.tsx` | Revenue by item type (4 sub-tabs) |
| **Create** | `src/app/finance/components/finance-recharge-tab.tsx` | Recharge details |
| **Update** | `src/lib/api/config.ts` | Add 3 detail endpoints |
| **Update** | `src/lib/api/reports.ts` | Add 3 detail API functions |
| **Rewrite** | `src/app/finance/page.tsx` | 3-tab shell |
| **Delete** | `src/app/finance/finance-*.tsx` | 5 old sub-components |

---

### Task 1: Add missing API endpoints and functions

**Files:**
- Update: `src/lib/api/config.ts`
- Update: `src/lib/api/reports.ts`

- [ ] **Step 1: Add 3 detail endpoints to config.ts**

Read `src/lib/api/config.ts` and add after line 158 (`reportsRecharge`):

```ts
  // Report detail endpoints (aligned with wwwstoreapp)
  reportsByChannelDetail: '/report.Report/revenueByChannelDetail',
  reportsByItemTypeDetail: '/report.Report/revenueByItemTypeDetail',
  reportsRechargeDetail: '/report.Report/rechargeReportDetail',
```

- [ ] **Step 2: Add 3 detail API functions to reports.ts**

Read `src/lib/api/reports.ts` and add after the existing `fetchRechargeReport` function (line ~252):

```ts
/** 支付渠道营收明细 */
export interface RevenueByChannelDetail {
  id: number;
  order_id: number;
  order_no: string;
  amount: number;
  paid_at: string;
  description: string;
}

export async function fetchRevenueByChannelDetail(
  storeId: string,
  start: string,
  end: string,
  channel: string,
) {
  return get<RevenueByChannelDetail[]>(API_ENDPOINTS.reportsByChannelDetail, {
    store_id: storeId,
    start_date: start,
    end_date: end,
    channel,
  })
}

/** 按项目类型营收明细 */
export interface RevenueByItemTypeDetail {
  id: number;
  order_id: number;
  order_no: string;
  name: string;
  amount: number;
  quantity: number;
  paid_at: string;
}

export async function fetchRevenueByItemTypeDetail(
  storeId: string,
  start: string,
  end: string,
  itemType: string,
) {
  return get<RevenueByItemTypeDetail[]>(API_ENDPOINTS.reportsByItemTypeDetail, {
    store_id: storeId,
    start_date: start,
    end_date: end,
    item_type: itemType,
  })
}

/** 充值明细 */
export interface RechargeDetail {
  id: number;
  member_id: string;
  order_no: string;
  channel: string;
  amount: number;
  paid_at: string;
  description: string;
}

export async function fetchRechargeDetail(
  storeId: string,
  start: string,
  end: string,
  channel: string,
) {
  return get<RechargeDetail[]>(API_ENDPOINTS.reportsRechargeDetail, {
    store_id: storeId,
    start_date: start,
    end_date: end,
    channel,
  })
}
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/api/config.ts src/lib/api/reports.ts
git commit -m "feat(finance): add report detail API functions aligned with wwwstoreapp"
```

---

### Task 2: Create shared FinanceDateFilter component

**Files:**
- Create: `src/app/finance/components/finance-date-filter.tsx`

- [ ] **Step 1: Create the component**

```bash
mkdir -p src/app/finance/components
```

Write `src/app/finance/components/finance-date-filter.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search } from 'lucide-react';

interface FinanceDateFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onQuery: () => void;
  onExport: () => void;
  loading?: boolean;
  exporting?: boolean;
}

const presets = [
  { label: '今日', getValue: () => {
    const d = new Date();
    return { start: d.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '昨日', getValue: () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return { start: d.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '本周', getValue: () => {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 0 ? 6 : day - 1;
    const mon = new Date(d);
    mon.setDate(d.getDate() - diff);
    return { start: mon.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
  { label: '本月', getValue: () => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return { start: start.toISOString().slice(0, 10), end: d.toISOString().slice(0, 10) };
  }},
];

export function FinanceDateFilter({
  startDate, endDate,
  onStartDateChange, onEndDateChange,
  onQuery, onExport,
  loading, exporting,
}: FinanceDateFilterProps) {
  const handlePreset = (preset: typeof presets[0]) => {
    const { start, end } = preset.getValue();
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <Button
          key={p.label}
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => handlePreset(p)}
        >
          {p.label}
        </Button>
      ))}
      <div className="w-px h-6 bg-slate-200 mx-1" />
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="w-[150px] rounded-xl h-9 text-sm"
      />
      <span className="text-slate-400 text-sm">~</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="w-[150px] rounded-xl h-9 text-sm"
      />
      <Button
        size="sm"
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
        onClick={onQuery}
        disabled={loading}
      >
        <Search className="w-4 h-4 mr-1" />
        查询
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="rounded-xl"
        onClick={onExport}
        disabled={exporting}
      >
        <Download className="w-4 h-4 mr-1" />
        导出Excel
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add src/app/finance/components/finance-date-filter.tsx
git commit -m "feat(finance): add shared date filter component with presets and export"
```

---

### Task 3: Create finance-income-tab (收入方式明细)

**Files:**
- Create: `src/app/finance/components/finance-income-tab.tsx`

This tab shows revenue summary by 6 payment channels, with click-to-drill-down detail.

Write the complete component:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRevenueByChannel, fetchRevenueByChannelDetail, type RevenueByChannel, type RevenueByChannelDetail } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils';
import { Banknote, Smartphone, Ticket, QrCode, CreditCard, Users } from 'lucide-react';

const CHANNELS: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'cash', label: '现金', icon: Banknote, color: 'bg-amber-100 text-amber-700' },
  { key: 'wechat', label: '微信', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  { key: 'coupon_meituan', label: '美团', icon: Ticket, color: 'bg-orange-100 text-orange-700' },
  { key: 'coupon_douyin', label: '抖音', icon: QrCode, color: 'bg-pink-100 text-pink-700' },
  { key: 'coupon_internal', label: '店内团券', icon: Ticket, color: 'bg-blue-100 text-blue-700' },
  { key: 'member_balance', label: '会员卡扣', icon: CreditCard, color: 'bg-purple-100 text-purple-700' },
];

const today = new Date().toISOString().slice(0, 10);

export function FinanceIncomeTab() {
  const { state } = useApp();
  const storeId = state.currentStore?.id || '';

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [channels, setChannels] = useState<RevenueByChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [details, setDetails] = useState<RevenueByChannelDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSummary = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRevenueByChannel(storeId, startDate, endDate);
      setChannels(data || []);
    } catch { setChannels([]); }
    finally { setLoading(false); }
  };

  const loadDetail = async (channel: string) => {
    if (!storeId) return;
    setSelectedChannel(channel);
    setDetailLoading(true);
    try {
      const data = await fetchRevenueByChannelDetail(storeId, startDate, endDate, channel);
      setDetails(data || []);
    } catch { setDetails([]); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadSummary(); }, [storeId]);

  const totalRevenue = channels.reduce((s, c) => s + (c.revenue || 0), 0);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">收入方式明细</h2>
          <p className="text-sm text-slate-500">按支付方式查看收入来源和明细</p>
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
          {/* Summary cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CHANNELS.map((ch) => {
              const data = channels.find((c) => c.channel === ch.key);
              const revenue = data?.revenue || 0;
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

          {/* Detail table */}
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
                          <th className="pb-2 font-medium text-right">金额</th>
                          <th className="pb-2 font-medium">支付时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details.map((d) => (
                          <tr key={d.id} className="border-b border-slate-50">
                            <td className="py-2 font-mono text-xs">{d.order_no}</td>
                            <td className="py-2">{d.description || '-'}</td>
                            <td className="py-2 text-right font-medium">{formatCurrency(d.amount)}</td>
                            <td className="py-2 text-slate-500">{d.paid_at || '-'}</td>
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
    </div>
  );
}
```

- [ ] **Step 1: Commit**
```bash
git add src/app/finance/components/finance-income-tab.tsx
git commit -m "feat(finance): add income by payment channel tab"
```

---

### Task 4: Create finance-revenue-tab (营业额项目统计)

**Files:**
- Create: `src/app/finance/components/finance-revenue-tab.tsx`

4 sub-tabs: 台费(table) / 商品(product) / 助教(assistant) / 充电(charging). Same pattern as income tab with summary cards + detail table + sub-tab switching.

The sub-tabs use smaller buttons (matching the schedule sub-tab pattern in assistants page):

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRevenueByItemType, fetchRevenueByItemTypeDetail, type RevenueByItemType, type RevenueByItemTypeDetail } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils';
import { Gamepad2, Package, GraduationCap, Zap } from 'lucide-react';

const ITEM_TYPES = [
  { key: 'table', label: '台费', icon: Gamepad2 },
  { key: 'product', label: '商品', icon: Package },
  { key: 'assistant', label: '助教', icon: GraduationCap },
  { key: 'charging', label: '充电', icon: Zap },
];

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

  const loadSummary = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRevenueByItemType(storeId, startDate, endDate);
      setItems(data || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const loadDetail = async (itemType: string) => {
    if (!storeId) return;
    setActiveSubTab(itemType);
    setDetailLoading(true);
    try {
      const data = await fetchRevenueByItemTypeDetail(storeId, startDate, endDate, itemType);
      setDetails(data || []);
    } catch { setDetails([]); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadSummary(); }, [storeId]);
  useEffect(() => { loadDetail(activeSubTab); }, [activeSubTab, startDate, endDate, storeId]);

  const totalRevenue = items.reduce((s, i) => s + (i.revenue || 0), 0);

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
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ITEM_TYPES.map((it) => {
              const data = items.find((i) => 
                i.type === it.key || (i as any).item_type === it.key
              );
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

          {/* Sub-tab buttons */}
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

          {/* Detail table */}
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
                        <th className="pb-2 font-medium text-right">金额</th>
                        <th className="pb-2 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d) => (
                        <tr key={d.id} className="border-b border-slate-50">
                          <td className="py-2 font-mono text-xs">{d.order_no}</td>
                          <td className="py-2">{d.name || '-'}</td>
                          <td className="py-2 text-right">{d.quantity || 1}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(d.amount)}</td>
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
```

- [ ] **Step 1: Commit**
```bash
git add src/app/finance/components/finance-revenue-tab.tsx
git commit -m "feat(finance): add revenue by item type tab with 4 sub-tabs"
```

---

### Task 5: Create finance-recharge-tab (充值明细)

**Files:**
- Create: `src/app/finance/components/finance-recharge-tab.tsx`

Same pattern: summary cards for 3 recharge types + detail table.

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { FinanceDateFilter } from './finance-date-filter';
import { fetchRechargeReport, fetchRechargeDetail, type RechargeReportItem, type RechargeDetail } from '@/lib/api/reports';
import { formatCurrency } from '@/lib/utils';
import { Banknote, Smartphone, ArrowLeftRight } from 'lucide-react';

const RECHARGE_TYPES = [
  { key: 'cash', label: '现金充值', icon: Banknote, color: 'bg-amber-100 text-amber-700' },
  { key: 'wechat', label: '微信充值', icon: Smartphone, color: 'bg-green-100 text-green-700' },
  { key: 'balance', label: '余额调整', icon: ArrowLeftRight, color: 'bg-blue-100 text-blue-700' },
];

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

  const loadSummary = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await fetchRechargeReport(storeId, startDate, endDate);
      setRechargeData(Array.isArray(data) ? data : []);
    } catch { setRechargeData([]); }
    finally { setLoading(false); }
  };

  const loadDetail = async (channel: string) => {
    if (!storeId) return;
    setActiveType(channel);
    setDetailLoading(true);
    try {
      const data = await fetchRechargeDetail(storeId, startDate, endDate, channel);
      setDetails(data || []);
    } catch { setDetails([]); }
    finally { setDetailLoading(false); }
  };

  useEffect(() => { loadSummary(); }, [storeId]);
  useEffect(() => { loadDetail(activeType); }, [activeType, startDate, endDate, storeId]);

  // Note: RechargeReportItem structure has 'date'/'total' (old) or per-channel fields
  // For the new ReportService, rechargeReport returns [{channel, amount, count}]
  const getChannelAmount = (channel: string): number => {
    const item = (rechargeData as any[]).find((r: any) => r.channel === channel);
    return item?.amount || 0;
  };
  const getChannelCount = (channel: string): number => {
    const item = (rechargeData as any[]).find((r: any) => r.channel === channel);
    return item?.count || 0;
  };
  const totalAmount = (rechargeData as any[]).reduce((s: number, r: any) => s + (r.amount || 0), 0);

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
          {/* Summary cards */}
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

          {/* Type filter + detail table */}
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
                        <th className="pb-2 font-medium text-right">金额</th>
                        <th className="pb-2 font-medium">渠道</th>
                        <th className="pb-2 font-medium">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.map((d) => (
                        <tr key={d.id} className="border-b border-slate-50">
                          <td className="py-2 font-mono text-xs">{d.order_no || '-'}</td>
                          <td className="py-2">{d.member_id || '-'}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(d.amount)}</td>
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
```

- [ ] **Step 1: Commit**
```bash
git add src/app/finance/components/finance-recharge-tab.tsx
git commit -m "feat(finance): add recharge details tab"
```

---

### Task 6: Rewrite finance/page.tsx as 3-tab shell

**Files:**
- Rewrite: `src/app/finance/page.tsx`

Write the tab shell:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Wallet, Banknote, BarChart3, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { FinanceIncomeTab } from './components/finance-income-tab';
import { FinanceRevenueTab } from './components/finance-revenue-tab';
import { FinanceRechargeTab } from './components/finance-recharge-tab';

type TabKey = 'income' | 'revenue' | 'recharge';

export default function FinancePage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('finance:cashflow')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('income');

  return (
    <div className="space-y-6">
      <PageHeader
        title="财务对账"
        description="查看收入方式、营业额项目和充值明细报表"
        icon={Wallet}
      />

      <div className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'income' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'income'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('income')}
        >
          <Banknote className="w-4 h-4 mr-2" />
          收入方式明细
        </Button>
        <Button
          variant={activeTab === 'revenue' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'revenue'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('revenue')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          营业额项目统计
        </Button>
        <Button
          variant={activeTab === 'recharge' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'recharge'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('recharge')}
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          充值明细报表
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
        {activeTab === 'income' && <FinanceIncomeTab />}
        {activeTab === 'revenue' && <FinanceRevenueTab />}
        {activeTab === 'recharge' && <FinanceRechargeTab />}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Commit**
```bash
git add src/app/finance/page.tsx
git commit -m "feat(finance): rewrite page as 3-tab report shell"
```

---

### Task 7: Delete old finance sub-components

**Files:**
- Delete: `src/app/finance/finance-stat-cards.tsx`
- Delete: `src/app/finance/finance-trend-chart.tsx`
- Delete: `src/app/finance/finance-payment-stats.tsx`
- Delete: `src/app/finance/finance-flow-table.tsx`
- Delete: `src/app/finance/finance-filter-toolbar.tsx`

- [ ] **Step 1: Verify no imports reference these files**
```bash
grep -r "finance-stat-cards\|finance-trend-chart\|finance-payment-stats\|finance-flow-table\|finance-filter-toolbar" src/ --include="*.ts" --include="*.tsx"
```
Expected: No matches (only the deleted files themselves).

- [ ] **Step 2: Delete**
```bash
git rm src/app/finance/finance-stat-cards.tsx
git rm src/app/finance/finance-trend-chart.tsx
git rm src/app/finance/finance-payment-stats.tsx
git rm src/app/finance/finance-flow-table.tsx
git rm src/app/finance/finance-filter-toolbar.tsx
```

- [ ] **Step 3: Commit**
```bash
git commit -m "refactor(finance): remove old sub-components replaced by new tab system"
```

---

### Task 8: Build verification

- [ ] **Step 1: Verify file structure**
```bash
ls src/app/finance/
ls src/app/finance/components/
```
Expected: page.tsx + components/ (4 files). Old 5 files gone.

- [ ] **Step 2: Git log**
```bash
git log --oneline master~8..master
```

- [ ] **Step 3: Verify no old references**
```bash
grep -r "FinanceStatCards\|FinanceTrendChart\|FinancePaymentStats\|FinanceFlowTable\|FinanceFilterToolbar" src/ --include="*.ts" --include="*.tsx"
```
Expected: No matches.
