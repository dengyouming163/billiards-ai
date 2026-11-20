import { get } from './client';
import { ApiResponseType } from './types';

export interface DashboardStats {
  today_revenue: number;
  yesterday_revenue: number;
  revenue_change: number;
  tables_in_use: number;
  total_tables: number;
  total_members: number;
  active_orders: number;
}

export interface RevenueTrendItem {
  date: string;
  dateValue: string;
  revenue: number;
  orders: number;
}

export interface RevenueCompositionItem {
  name: string;
  value: number;
  amount: number;
  color: string;
}

export interface DashboardOverview extends DashboardStats {
  revenueTrend: RevenueTrendItem[];
  revenueComposition: RevenueCompositionItem[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return get('/dashboard.Dashboard/stats', {}, ApiResponseType.NORMAL);
}

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  return get('/dashboard.Dashboard/overview', {}, ApiResponseType.NORMAL);
}

export async function fetchRevenueTrend(params?: { startDate?: string; endDate?: string }): Promise<RevenueTrendItem[]> {
  return get('/dashboard.Dashboard/revenueTrend', params, ApiResponseType.ARRAY);
}

export async function fetchRevenueComposition(params?: { startDate?: string; endDate?: string }): Promise<RevenueCompositionItem[]> {
  return get('/dashboard.Dashboard/revenueComposition', params, ApiResponseType.ARRAY);
}