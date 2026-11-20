/**
 * 会员折扣 API 服务
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';

export interface MemberDiscount {
  id: string;
  store_id: string;
  level: string;
  discount_rate: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MemberDiscountForm {
  level: string;
  discount_rate: number;
  enabled: boolean;
}

export interface ListParams {
  page?: number;
  page_size?: number;
  store_id?: string;
}

export async function fetchMemberDiscounts(params?: { store_id?: string; page?: number; page_size?: number }) {
  return get<{ data: MemberDiscount[]; pagination?: { page: number; page_size: number; total: number; total_pages: number } }>(
    API_ENDPOINTS.memberDiscounts,
    params as Record<string, string | number | boolean>
  );
}

export async function updateMemberDiscounts(
  storeId: string,
  discounts: MemberDiscountForm[]
) {
  return post<{ data: MemberDiscount[] }>(API_ENDPOINTS.memberDiscountUpdate, {
    store_id: storeId,
    discounts,
  } as Record<string, unknown>);
}

export const MEMBER_LEVELS = [
  { value: 'normal', label: '普通会员', defaultRate: 1.0 },
  { value: 'silver', label: '银牌会员', defaultRate: 0.95 },
  { value: 'gold', label: '金牌会员', defaultRate: 0.9 },
  { value: 'diamond', label: '钻石会员', defaultRate: 0.85 },
] as const;
