/**
 * 折扣配置 API 服务
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';

export interface DiscountConfig {
  id: string;
  store_id: string;
  discount_name: string;
  discount_type: 'rate' | 'amount';
  discount_value: number;
  rounding_mode: 'none' | 'yuan' | 'jiao' | 'half_yuan';
  status: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type DiscountForm = Omit<DiscountConfig, 'id' | 'store_id' | 'created_at' | 'updated_at'>;

export async function fetchDiscountList() {
  return get<DiscountConfig[]>(API_ENDPOINTS.discountList);
}

export async function saveDiscount(data: Partial<DiscountConfig> & { discount_name: string; discount_type: DiscountConfig['discount_type']; discount_value: number }) {
  return post<DiscountConfig>(API_ENDPOINTS.discountSave, data);
}

export async function deleteDiscount(id: string) {
  return post<void>(API_ENDPOINTS.discountDelete, { id });
}
