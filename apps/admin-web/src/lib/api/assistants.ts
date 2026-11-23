/**
 * 助教管理 API 服务
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import type { Assistant, OrderStatus } from '@/lib/types';

export interface ListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  level_id?: string;
  status?: number;
}

export interface AssistantLevel {
  id: string;
  name: string;
  code: string;
  color: string;
  hourly_rate: number;
  billing_rule?: 'minute' | 'half_hour';
  description: string;
  sort_order: number;
  status: number;
}

export interface AssistantSchedule {
  id: string;
  assistant_id: string;
  date: string;
  shift: string;
  start_time: string;
  end_time: string;
  status: string;
}

export interface ShiftConfig {
  id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  color: string;
  sort_order: number;
  status: number;
  description?: string;
}

export interface AssistantOrder {
  id: string;
  order_no: string;
  assistant_id: string;
  member_id?: string;
  student_name?: string;
  student_phone?: string;
  service_type: string;
  duration: number;
  unit_price: number;
  total_amount: number;
  status: string;
  rating?: number;
  review?: string;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface AssistantStats {
  total_assistants: number;
  today_orders: number;
  month_revenue: number;
  total_revenue: number;
}

export interface AssistantService {
  id: string;
  employee_id: string;
  store_id: string;
  icon: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  sort_order: number;
  status: number;
}

export async function fetchAssistants(params?: ListParams) {
  return get<{ data: Assistant[]; pagination: { page: number; page_size: number; total: number; total_pages: number } }>(
    API_ENDPOINTS.assistants,
    params as Record<string, string | number | boolean>
  );
}

export async function fetchAssistant(id: string) {
  return get<Assistant>(API_ENDPOINTS.assistantDetail, { id });
}

export async function createAssistant(data: Omit<Assistant, 'id'>) {
  return post<Assistant>(API_ENDPOINTS.assistantCreate, {
    ...data,
    store_id: data.store_id,
    level_id: data.level_id || '',
  });
}

export async function updateAssistant(id: string, data: Partial<Assistant>) {
  return post<Assistant>(API_ENDPOINTS.assistantUpdate, { id, ...data });
}

export async function deleteAssistant(id: string) {
  return post<void>(API_ENDPOINTS.assistantDelete, { id });
}

export async function fetchAssistantLevels() {
  return get<AssistantLevel[]>(API_ENDPOINTS.assistantLevels);
}

export async function createAssistantLevel(data: {
  name: string;
  code?: string;
  color?: string;
  hourly_rate?: number;
  description?: string;
  sort_order?: number;
}) {
  return post<AssistantLevel>(API_ENDPOINTS.assistantLevelCreate, data);
}

export async function updateAssistantLevel(
  id: string,
  data: {
    name?: string;
    color?: string;
    hourly_rate?: number;
    description?: string;
    sort_order?: number;
    status?: number;
  }
) {
  return post<AssistantLevel>(API_ENDPOINTS.assistantLevelUpdate, { id, ...data });
}

export async function deleteAssistantLevel(id: string) {
  return post<void>(API_ENDPOINTS.assistantLevelDelete, { id });
}

export async function fetchAssistantSchedules(
  assistantId: string,
  startDate: string,
  endDate: string
) {
  return get<AssistantSchedule[]>(API_ENDPOINTS.assistantSchedules, {
    assistant_id: assistantId,
    start_date: startDate,
    end_date: endDate,
  });
}

export async function setAssistantSchedule(
  assistantId: string,
  schedules: { date: string; shift: string; start_time: string; end_time: string; remark?: string }[]
) {
  return post<void>(API_ENDPOINTS.assistantSetSchedule, {
    assistant_id: assistantId,
    schedules,
  });
}

export async function fetchShiftConfigs() {
  return get<ShiftConfig[]>(API_ENDPOINTS.assistantShiftConfigs);
}

export async function createShiftConfig(data: {
  name: string;
  code?: string;
  start_time: string;
  end_time: string;
  color?: string;
  sort_order?: number;
  status?: number;
  description?: string;
}) {
  return post<ShiftConfig>(API_ENDPOINTS.assistantShiftConfigCreate, data);
}

export async function updateShiftConfig(
  id: string,
  data: {
    name?: string;
    code?: string;
    start_time?: string;
    end_time?: string;
    color?: string;
    sort_order?: number;
    status?: number;
    description?: string;
  }
) {
  return post<ShiftConfig>(API_ENDPOINTS.assistantShiftConfigUpdate, { id, ...data });
}

export async function deleteShiftConfig(id: string) {
  return post<void>(API_ENDPOINTS.assistantShiftConfigDelete, { id });
}

export async function initShiftConfigs() {
  return post<void>(API_ENDPOINTS.assistantInitShiftConfigs);
}

export async function initLevels() {
  return post<AssistantLevel[]>(API_ENDPOINTS.assistantInitLevels);
}

export async function fetchOrders(params?: {
  page?: number;
  page_size?: number;
  assistant_id?: string;
  store_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return get<{ data: AssistantOrder[]; pagination: { page: number; page_size: number; total: number; total_pages: number } }>(
    API_ENDPOINTS.assistantOrders,
    params as Record<string, string | number | boolean>
  );
}

export async function updateSchedule(
  id: string,
  data: {
    date?: string;
    shift?: string;
    start_time?: string;
    end_time?: string;
    remark?: string;
  }
) {
  return post<AssistantSchedule>(API_ENDPOINTS.assistantUpdateSchedule, { id, ...data });
}

export async function deleteSchedule(id: string) {
  return post<void>(API_ENDPOINTS.assistantDeleteSchedule, { id });
}

export async function createAssistantOrder(data: {
  assistant_id: string;
  member_id?: string;
  student_name?: string;
  student_phone?: string;
  service_type?: string;
  duration: number;
  unit_price: number;
  total_amount: number;
  start_time?: string;
  end_time?: string;
  remark?: string;
}) {
  return post<AssistantOrder>(API_ENDPOINTS.assistantOrderCreate, data);
}

export async function updateAssistantOrderStatus(orderId: string, status: OrderStatus) {
  return post<AssistantOrder>(API_ENDPOINTS.assistantOrderUpdateStatus, {
    order_id: orderId,
    status,
  });
}

export async function submitReview(orderId: string, rating: number, review: string) {
  return post<void>(API_ENDPOINTS.assistantSubmitReview, {
    order_id: orderId,
    rating,
    review,
  });
}

export async function fetchAssistantStats() {
  return get<AssistantStats>(API_ENDPOINTS.assistantStats);
}

export async function fetchCommissionConfig(assistantId: string) {
  return get<Record<string, unknown> | null>(API_ENDPOINTS.assistantCommissionConfig, {
    assistant_id: assistantId,
  });
}

export async function fetchAllCommissionConfigs() {
  return get<Record<string, unknown>[]>(API_ENDPOINTS.assistantAllCommissionConfigs);
}

export interface CommissionConfig {
  id: string;
  store_id: string;
  assistant_id: string;
  commission_mode: 'no_guarantee' | 'with_guarantee' | 'base_salary';
  commission_type: 'percentage' | 'fixed';
  commission_rate: number;
  base_salary?: number;
  guarantee_hours?: number;
  guarantee_amount?: number;
  settlement_period: string;
  effective_date?: string;
  status: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export async function saveCommissionConfig(data: {
  assistant_id?: string;
  assistant_ids?: string[];
  commission_mode?: string;
  commission_type: string;
  commission_rate: number;
  base_salary?: number;
  guarantee_hours?: number;
  guarantee_amount?: number;
  settlement_period?: string;
  effective_date?: string;
  status?: number;
  remark?: string;
}) {
  return post<Record<string, unknown>>(API_ENDPOINTS.assistantSaveCommissionConfig, data);
}

export async function deleteCommissionConfig(id: string) {
  return post<void>(API_ENDPOINTS.assistantDeleteCommissionConfig, { id });
}

export async function fetchCommissionRecords(params?: {
  page?: number;
  page_size?: number;
  assistant_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}) {
  return get<{
    data: Record<string, unknown>[];
    pagination: { page: number; page_size: number; total: number; total_pages: number };
  }>(API_ENDPOINTS.assistantCommissionRecords, params as Record<string, string | number | boolean>);
}

export async function markCommissionPaid(ids: string[]) {
  return post<void>(API_ENDPOINTS.assistantMarkCommissionPaid, { ids });
}

export async function batchSettleCommission(storeId: string) {
  return post<{ total: number; processed: number; skipped: number; errors: number; message: string }>(
    API_ENDPOINTS.assistantBatchSettleCommission,
    { store_id: storeId }
  );
}

export async function fetchCommissionStats(params?: {
  assistant_id?: string;
  start_date?: string;
  end_date?: string;
}) {
  return get<{
    total_commission: number;
    paid_commission: number;
    pending_commission: number;
  }>(API_ENDPOINTS.assistantCommissionStats, params as Record<string, string | number | boolean>);
}

export async function fetchServices() {
  return get<AssistantService[]>(API_ENDPOINTS.assistantServices);
}

export async function createService(data: {
  employee_id?: string;
  icon?: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  sort_order?: number;
  status?: number;
}) {
  return post<AssistantService>(API_ENDPOINTS.assistantServiceCreate, data);
}

export async function updateService(
  id: string,
  data: {
    employee_id?: string;
    icon?: string;
    name?: string;
    description?: string;
    price?: number;
    unit?: string;
    sort_order?: number;
    status?: number;
  }
) {
  return post<AssistantService>(API_ENDPOINTS.assistantServiceUpdate, { id, ...data });
}

export async function deleteService(id: string) {
  return post<void>(API_ENDPOINTS.assistantServiceDelete, { id });
}

/** Album */
export interface AssistantAlbumResponse {
  album: string[];
}

export async function fetchAssistantAlbum(assistantId: string) {
  return get<AssistantAlbumResponse>('/tablet.Assistant/getAlbums', { assistant_id: assistantId });
}

export async function uploadAssistantAlbum(assistantId: string, url: string) {
  return post<void>('/tablet.Assistant/uploadAlbum', { assistant_id: assistantId, url });
}

export async function deleteAssistantAlbum(assistantId: string, url: string) {
  return post<void>('/tablet.Assistant/deleteAlbum', { assistant_id: assistantId, url });
}

export type { Assistant } from '@/lib/types';