# Finance Page Deep Refactor — Design Spec

**Date:** 2026-07-01  
**Scope:** wwwstore `/finance` page full rewrite  
**Design:** 3-tab report system aligned with wwwstoreapp API for data consistency

---

## Problem Summary

The current finance page (`/finance`, 674 lines across 6 files) is a single dashboard mixing stats, charts, and a filtered cash flow table. It uses older/deprecated APIs (`cashflow.CashFlow/stats`, `/report.Report/revenueComposition`) with camelCase parameters, disjoint from the wwwstoreapp admin reports which use newer `ReportService` APIs with snake_case parameters. Key gaps:

- No income-by-channel detail drill-down
- No revenue-by-item-type detail views
- Recharge report API exists but not surfaced in UI
- Date filtering incomplete (dateFilter state exists but no UI controls)
- Export has no date context
- Trend range dropdown broken (no data refetch)
- No pagination on transaction table

---

## Design Goals

1. **Tab-based layout** — 3 main tabs matching employees pattern
2. **API consistency with wwwstoreapp** — Use EXACT same `ReportService` APIs, parameters, and response structures
3. **Full query + export** — Each tab/report has date range filtering and Excel export
4. **Data accuracy guarantee** — wwwstore and wwwstoreapp query same dimensions, return same numbers

---

## API Alignment

All reports use the `ReportService` (snake_case params) unified with wwwstoreapp:

| Report | Summary API | Detail API | Key Param |
|--------|-----------|-----------|-----------|
| Income by Channel | `report.Report/revenueByChannel` | `report.Report/revenueByChannelDetail` | `channel` |
| Revenue by Item Type | `report.Report/revenueByItemType` | `report.Report/revenueByItemTypeDetail` | `item_type` |
| Recharge Report | `report.Report/rechargeReport` | `report.Report/rechargeReportDetail` | `channel` |

All accept: `store_id`, `start_date`, `end_date` (snake_case, matching wwwstoreapp).

---

## Page Structure

```
finance/
├── page.tsx                            ← 3-tab shell (employees pattern)
└── components/
    ├── finance-date-filter.tsx          ← Shared date range picker
    ├── finance-income-tab.tsx           ← Tab 1: Income by payment channel
    ├── finance-revenue-tab.tsx          ← Tab 2: Revenue by item type (4 sub-tabs)
    └── finance-recharge-tab.tsx         ← Tab 3: Recharge details
```

---

## Tab 1: 收入方式明细 (Income by Payment Method)

**API:** `revenueByChannel` + `revenueByChannelDetail`

| Channel | `channel` Value |
|---------|----------------|
| 现金 | `cash` |
| 微信 | `wechat` |
| 美团 | `coupon_meituan` |
| 抖音 | `coupon_douyin` |
| 店内团券 | `coupon_internal` |
| 会员卡扣 | `member_balance` |

**Layout:**
- Summary cards row: 6 cards showing each channel's revenue + percentage of total
- Clicking a channel or selecting from dropdown → loads `revenueByChannelDetail` for that channel
- Detail table columns: 订单号, 描述, 金额, 支付时间
- Date filter bar at top + Export button

---

## Tab 2: 营业额项目统计 (Revenue by Item Type)

**API:** `revenueByItemType` + `revenueByItemTypeDetail`

| Sub-tab | `item_type` Value |
|---------|------------------|
| 台费报表 | `table` |
| 商品消费明细 | `product` |
| 助教消费报表 | `assistant` |
| 充电费用报表 | `charging` |

**Layout:**
- Summary cards row: 4 cards showing each item type revenue
- Sub-tabs (smaller buttons or Tabs) to switch between 4 item types
- Each sub-tab shows `revenueByItemTypeDetail` for that type
- Detail table columns: 订单号, 名称/桌号, 数量, 金额, 时间
- Date filter bar + Export button (per sub-tab)

---

## Tab 3: 充值明细 (Recharge Details)

**API:** `rechargeReport` + `rechargeReportDetail`

| Type | `channel` Value |
|------|----------------|
| 现金充值 | `cash` |
| 微信充值 | `wechat` |
| 余额调整 | `balance` |

**Layout:**
- Summary cards row: 3 cards showing amount + count per type
- Type filter dropdown or tabs to switch
- Detail table columns: 订单号, 会员, 金额, 渠道, 时间
- Date filter bar + Export button

---

## Shared Component: FinanceDateFilter

Reused by all 3 tabs:

```
[今日] [昨日] [本周] [本月]  [start_date picker] ~ [end_date picker]  [查询]  [导出Excel]
```

Props:
- `startDate: string`
- `endDate: string`
- `onStartDateChange: (d: string) => void`
- `onEndDateChange: (d: string) => void`
- `onQuery: () => void`
- `onExport: () => void`
- `loading?: boolean`

---

## File Changes

| Action | File | Purpose |
|--------|------|---------|
| **Rewrite** | `src/app/finance/page.tsx` | 3-tab shell (employees pattern) |
| **Create** | `src/app/finance/components/finance-date-filter.tsx` | Shared date range filter |
| **Create** | `src/app/finance/components/finance-income-tab.tsx` | Income report tab |
| **Create** | `src/app/finance/components/finance-revenue-tab.tsx` | Revenue report tab with 4 sub-tabs |
| **Create** | `src/app/finance/components/finance-recharge-tab.tsx` | Recharge report tab |
| **Update** | `src/lib/api/reports.ts` | Add new ReportService API functions |
| **Delete** | `src/app/finance/finance-stat-cards.tsx` | Replaced |
| **Delete** | `src/app/finance/finance-trend-chart.tsx` | Replaced |
| **Delete** | `src/app/finance/finance-payment-stats.tsx` | Replaced |
| **Delete** | `src/app/finance/finance-flow-table.tsx` | Replaced |
| **Delete** | `src/app/finance/finance-filter-toolbar.tsx` | Replaced |

---

## Tab Style Specification

All 3 main tabs use employees-page Button pattern:

- Tab bar: `flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl`
- Active: `from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl`
- Inactive: `hover:bg-white/80`
- Content: `rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden`

---

## Data Consistency Guarantee

Both wwwstore and wwwstoreapp use identical:
1. **API endpoints** — same `report.Report/*` paths
2. **Parameter format** — snake_case (`start_date`, `end_date`, `store_id`, `channel`, `item_type`)
3. **Store ID injection** — wwwstore via `useApp().currentStore.id`, wwwstoreapp via request interceptor
4. **Response structures** — same `ReportService` backend returns same data

Any discrepancy in totals or detail records between the two frontends is a backend/data issue, not a frontend divergence.
