/**
 * 财务与报表 API 服务
 * 前后端分离项目
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import { download } from './client';
import type { ListParams } from './types';
import type { CashFlow } from '@/lib/types';
import { ApiResponseType } from './types';

/**
 * ==================== 财务对账 ====================
 */

/**
 * 获取资金流水列表
 */
export async function fetchCashFlows(params?: ListParams & { startDate?: string; endDate?: string; type?: string }) {
  return get<CashFlow[]>(API_ENDPOINTS.cashFlows, params as Record<string, string | number | boolean>, ApiResponseType.ARRAY);
}

/**
 * 导出资金流水
 */
export async function exportCashFlows(params?: { startDate?: string; endDate?: string }) {
  return download(`${API_ENDPOINTS.cashFlowsExport}`, params, '资金流水.xlsx');
}

/**
 * 获取财务统计
 */
export async function fetchFinanceStats(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return get<{
    todayIncome: number;
    todayExpense: number;
    todayNet: number;
    todayOrders: number;
    monthIncome: number;
    monthExpense: number;
    monthNet: number;
    yesterdayIncome: number;
    paymentStats: {
      wechat: { amount: number; count: number };
      cash: { amount: number; count: number };
    };
    revenueTrend: { date: string; income: number; expense: number }[];
  }>(API_ENDPOINTS.cashFlowsStats, params);
}

/**
 * ==================== 经营报表 ====================
 */

/**
 * 获取经营概览
 */
export async function fetchReportOverview(): Promise<{
  totalRevenue: number;
  totalOrders: number;
  totalHours: number;
  avgUtilization: number;
  avgOrderAmount: number;
  totalProductSales: number;
  growthRate: number;
}> {
  return get(API_ENDPOINTS.reports, undefined, ApiResponseType.NORMAL) as Promise<any>;
}

/**
 * 获取营收趋势
 */
export async function fetchRevenueTrend(params: { startDate: string; endDate: string }) {
  return get<{ date: string; income: number; expense: number; profit: number }[]>(
    API_ENDPOINTS.reportsRevenue,
    params as Record<string, string | number | boolean>,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取台桌使用统计
 */
export async function fetchTableUsageStats(startDate?: string, endDate?: string) {
  const params: Record<string, string> = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  return get<{ tableId: string; tableNumber: string; utilization: number; hours: number; revenue: number; orderCount: number }[]>(
    API_ENDPOINTS.reportsTables,
    params,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取商品销售排行
 */
export async function fetchProductSalesRank(params?: { startDate?: string; endDate?: string; limit?: number }) {
  return get<{ productId: string; productName: string; salesCount: number; salesAmount: number }[]>(
    API_ENDPOINTS.reportsProducts,
    params as Record<string, string | number | boolean> | undefined,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取会员统计
 */
export async function fetchMemberStats() {
  return get<{ totalMembers: number; newMembers: number; totalRecharge: number; totalConsume: number }>(
    API_ENDPOINTS.reportsMemberStats,
    undefined,
    ApiResponseType.NORMAL
  );
}

/**
 * 获取会员消费排行
 */
export async function fetchMemberRank(params?: { startDate?: string; endDate?: string; limit?: number }) {
  return get<{ memberId: string; name: string; level: string; consume: number; orders: number; lastVisit: string }[]>(
    API_ENDPOINTS.reportsMemberRank,
    params as Record<string, string | number | boolean> | undefined,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取助教业绩排行
 */
export async function fetchAssistantPerformance(params?: { startDate?: string; endDate?: string; limit?: number }) {
  return get<{ assistantId: string; name: string; level: string; hours: number; revenue: number; orders: number; rating: number }[]>(
    API_ENDPOINTS.reportsAssistantRank,
    params as Record<string, string | number | boolean> | undefined,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取营收构成
 */
export async function fetchReportComposition(params?: { startDate?: string; endDate?: string }) {
  return get<{ name: string; value: number; amount: number; color: string }[]>(
    API_ENDPOINTS.reportsComposition,
    params as Record<string, string | number | boolean> | undefined,
    ApiResponseType.ARRAY
  );
}

/**
 * 获取时段分析
 */
export async function fetchReportTimeAnalysis(params?: { startDate?: string; endDate?: string }) {
  return get<{ time: string; label: string; revenue: number; orders: number }[]>(
    API_ENDPOINTS.reportsTimeAnalysis,
    params as Record<string, string | number | boolean> | undefined,
    ApiResponseType.ARRAY
  );
}

/**
 * ==================== 营收汇总 & 运营概览 (P0) ====================
 */

export interface RevenueSummary {
  table_revenue: number
  assistant_revenue: number
  product_revenue: number
  charging_revenue: number
  package_revenue: number
  total_revenue: number
  order_count: number
  last_period_revenue: number
  revenue_change: number
}

export interface OperationOverview {
  order_count: number
  total_duration_minutes: number
  avg_order_amount: number
  avg_customer_spend: number
  total_customers: number
  total_tables: number
  occupied_tables: number
  occupancy_rate: number
  turnover_rate: number
  table_utilization: number
}

export async function fetchRevenueSummary(params: { start_date: string; end_date: string }) {
  return get<RevenueSummary>(API_ENDPOINTS.reportsRevenueSummary, params)
}

export async function fetchOperationOverview(params: { start_date: string; end_date: string }) {
  return get<OperationOverview>(API_ENDPOINTS.reportsOperation, params)
}

/**
 * ==================== v1.0 扩展报表 ====================
 */

/** 支付渠道营收 */
export interface RevenueByChannel {
  channel: string;
  revenue: number;
  order_count: number;
}

export async function fetchRevenueByChannel(storeId: string, start: string, end: string) {
  return get<RevenueByChannel[]>(API_ENDPOINTS.reportsByChannel, {
    store_id: storeId,
    start_date: start,
    end_date: end,
  })
}

/** 按项目类型营收 */
export interface RevenueByItemType {
  item_type: string;   // table / product / assistant / charging
  revenue: number;
  order_count: number;
}

export async function fetchRevenueByItemType(storeId: string, start: string, end: string) {
  return get<RevenueByItemType[]>(API_ENDPOINTS.reportsByItemType, {
    store_id: storeId,
    start_date: start,
    end_date: end,
  })
}

/** 充值报表（按渠道返回多行） */
export interface RechargeReportItem {
  channel: string;     // cash / wechat / balance
  amount: number;
  count: number;
}

export async function fetchRechargeReport(storeId: string, start: string, end: string) {
  return get<RechargeReportItem[]>(API_ENDPOINTS.reportsRecharge, {
    store_id: storeId,
    start_date: start,
    end_date: end,
  })
}

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

/** 考勤报表 */
export interface AttendanceReportItem {
  employee_id: string;
  employee_name: string;
  work_days: number;
  late_days: number;
  absent_days: number;
  leave_days: number;
  total_hours: number;
  overtime_hours: number;
}

export async function fetchAttendanceReport(storeId: string, month: string, employeeType?: string) {
  return get<AttendanceReportItem[]>(API_ENDPOINTS.reportsAttendance, {
    store_id: storeId,
    month,
    employee_type: employeeType || '',
  })
}

/** 助教工资报表 */
export interface AssistantSalaryItem {
  id: string;
  assistant_id: string;
  assistant_name: string;
  commission_mode: 'no_guarantee' | 'with_guarantee' | 'base_salary';
  commission_mode_label: string;
  table_hours: number;
  overtime_hours: number;
  outwork_hours: number;
  commission_total: number;
  base_or_guarantee: number;
  salary_total: number;
  guarantee_triggered: boolean;
  notes: string;
  status: 'pending' | 'paid';
  paid_at?: string;
}

export async function fetchAssistantSalary(storeId: string, month: string) {
  return get<AssistantSalaryItem[]>(API_ENDPOINTS.reportsAssistantSalary, {
    store_id: storeId,
    month,
  })
}
