/**
 * 时段配置 API 服务
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { TimePeriod } from '@/lib/types';

export interface ListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  status?: number;
}

export async function fetchTimePeriods(params?: { store_id?: string; page?: number; page_size?: number; keyword?: string; status?: number }) {
  return get<{ data: TimePeriod[]; pagination?: { page: number; page_size: number; total: number; total_pages: number } }>(
    API_ENDPOINTS.timePeriods,
    params as Record<string, string | number | boolean>
  );
}

export async function fetchTimePeriod(id: string) {
  return get<{ data: TimePeriod }>(API_ENDPOINTS.timePeriodDetail, { id });
}

export async function createTimePeriod(data: {
  store_id: string;
  name: string;
  start_time: string;
  end_time: string;
  coefficient: number;
  description?: string;
  sort_order?: number;
}) {
  return post<{ data: TimePeriod }>(API_ENDPOINTS.timePeriodCreate, data as Record<string, unknown>);
}

export async function updateTimePeriod(id: string, data: Partial<{
  name: string;
  start_time: string;
  end_time: string;
  coefficient: number;
  description?: string;
  sort_order?: number;
  status?: number;
}>) {
  return post<{ data: TimePeriod }>(API_ENDPOINTS.timePeriodUpdate, { id, ...data } as Record<string, unknown>);
}

export async function deleteTimePeriod(id: string) {
  return post<void>(API_ENDPOINTS.timePeriodDelete, { id });
}

export async function toggleTimePeriod(id: string) {
  return post<{ data: { status: number } }>(API_ENDPOINTS.timePeriodToggle, { id });
}

export async function validateTimePeriodOverlap(
  storeId: string,
  data: {
    exclude_id?: string;
    name: string;
    start_time: string;
    end_time: string;
  }
) {
  return post<{ data: { valid: boolean; errors: string[] } }>(
    API_ENDPOINTS.timePeriodValidate,
    { store_id: storeId, ...data } as Record<string, unknown>
  );
}

export type { TimePeriod } from '@/lib/types';