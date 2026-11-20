/**
 * 计费规则 API 服务
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import type { PricingRule } from '@/lib/types';

export type PricingRuleForm = Omit<PricingRule, 'id' | 'created_at' | 'updated_at'>;

export interface ListParams {
  page?: number;
  page_size?: number;
  store_id?: string;
  keyword?: string;
  type?: string;
  status?: number;
}

export async function fetchPricingRules(params?: ListParams) {
  return get<PricingRule[]>(
    API_ENDPOINTS.pricingRules,
    params as Record<string, string | number | boolean>
  );
}

export async function fetchPricingRule(id: string) {
  return get<PricingRule>(API_ENDPOINTS.pricingRuleDetail, { id });
}

export async function createPricingRule(data: PricingRuleForm & { store_id: string }) {
  return post<PricingRule>(API_ENDPOINTS.pricingRuleCreate, data as Record<string, unknown>);
}

export async function updatePricingRule(id: string, data: Partial<PricingRuleForm>) {
  return post<PricingRule>(API_ENDPOINTS.pricingRuleUpdate, { id, ...data } as Record<string, unknown>);
}

export async function deletePricingRule(id: string) {
  return post<void>(API_ENDPOINTS.pricingRuleDelete, { id });
}

export async function togglePricingRule(id: string) {
  return post<{ status: number }>(API_ENDPOINTS.pricingRuleToggle, { id });
}

export interface CalculateParams {
  start_time: string;
  end_time: string;
  member_level?: string;
}

export async function calculateByPricing(pricingId: string, params: CalculateParams) {
  return post<CalculateResult>(API_ENDPOINTS.pricingRuleCalculate, {
    pricing_id: pricingId,
    ...params,
  } as Record<string, unknown>);
}

export async function calculateByTable(tableId: string, params: CalculateParams) {
  return post<CalculateResult>(API_ENDPOINTS.pricingRuleCalculateByTable, {
    table_id: tableId,
    ...params,
  } as Record<string, unknown>);
}

export interface CalculateResult {
  total_amount: number;
  duration_minutes: number;
  details: Array<{
    period_id?: string;
    period_name?: string;
    package_id?: string;
    package_name?: string;
    type?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes: number;
    billed_minutes?: number;
    price_per_hour?: number;
    coefficient?: number;
    price?: number;
    amount?: number;
  }>;
  discount_amount: number;
  original_amount: number;
  member_level?: string;
  discount_rate: number;
}

export const PRICING_TYPES = [
  { value: 'time', label: '按时段计费', description: '根据不同时段设置不同费率' },
  { value: 'hourly', label: '按小时计费', description: '统一单价，简单明了' },
  { value: 'period', label: '包时段预付', description: '预付购时，享受折扣' },
] as const;

export const BOUNDARY_STRATEGIES = [
  { value: 'per_minute', label: '逐分钟精确计算', description: '跨越时段时按分钟分段计算' },
  { value: 'start_time', label: '按开始时间归属', description: '整个订单按开始时间所在时段统一计费' },
] as const;

export const ROUNDING_MODES = [
  { value: 'exact', label: '精确到分钟', description: '按实际使用分钟数计算' },
  { value: 'min_30', label: '不足30分钟按30分钟', description: '最低消费30分钟' },
  { value: 'per_hour', label: '不足1小时按1小时', description: '按整小时计算' },
] as const;

export type { PricingRule } from '@/lib/types';
