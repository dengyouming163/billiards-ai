/**
 * 台桌管理 API 服务
 * 前后端分离项目
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType, type ListParams } from './types';
import type { Table } from '@/lib/types';

/**
 * 获取台桌列表
 */
export async function fetchTables(params?: ListParams & { zoneId?: string }) {
  const result = await get<Table[] | { data: Table[]; lists: Table[] }>(
    API_ENDPOINTS.tables, 
    params as Record<string, string | number | boolean>,
    ApiResponseType.LIST
  );
  if (Array.isArray(result)) {
    return result;
  }
  if (result && 'data' in result && Array.isArray(result.data)) {
    return result.data;
  }
  if (result && 'lists' in result && Array.isArray(result.lists)) {
    return result.lists;
  }
  return [];
}

/**
 * 获取单个台桌详情
 */
export async function fetchTable(id: string) {
  return get<Table>(`${API_ENDPOINTS.tables}/${id}`);
}

/**
 * 创建台桌
 */
export async function createTable(data: Omit<Table, 'id'>) {
  return post<Table>(API_ENDPOINTS.tables, data);
}

/**
 * 更新台桌
 */
export async function updateTable(id: string, data: Partial<Table>) {
  return put<Table>(`${API_ENDPOINTS.tables}/${id}`, data);
}

/**
 * 删除台桌
 */
export async function deleteTable(id: string) {
  return del<void>(`${API_ENDPOINTS.tables}/${id}`);
}

/**
 * 生成台桌二维码
 */
export async function generateTableQrcode(id: string) {
  return get<string>(`${API_ENDPOINTS.tableQrcode}/${id}`);
}

/**
 * 批量更新台桌状态
 */
export async function batchUpdateTables(ids: string[], status: Table['status']) {
  return put<void>(`${API_ENDPOINTS.tables}/batch-status`, { ids, status });
}

/**
 * 绑定台桌计费规则
 */
export async function bindTablePricingRule(tableId: string, pricingRuleId: string) {
  return put<void>(`${API_ENDPOINTS.tables}/${tableId}/pricing-rule`, { pricingRuleId });
}
