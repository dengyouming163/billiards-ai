/**
 * 套餐管理 API 服务
 * 前后端分离项目
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { ListParams } from './types';
import type { Package } from '@/lib/types';

/**
 * 获取套餐列表
 */
export async function fetchPackages(params?: ListParams & { type?: Package['type'] }) {
  return get<Package[]>(API_ENDPOINTS.packages, params as Record<string, string | number | boolean>);
}

/**
 * 获取单个套餐详情
 */
export async function fetchPackage(id: string) {
  return get<Package>(`${API_ENDPOINTS.packages}/${id}`);
}

/**
 * 创建套餐
 */
export async function createPackage(data: Omit<Package, 'id'>) {
  return post<Package>(API_ENDPOINTS.packages, data);
}

/**
 * 更新套餐
 */
export async function updatePackage(id: string, data: Partial<Package>) {
  return put<Package>(`${API_ENDPOINTS.packages}/${id}`, data);
}

/**
 * 删除套餐
 */
export async function deletePackage(id: string) {
  return del<void>(`${API_ENDPOINTS.packages}/${id}`);
}

/**
 * 启用/禁用套餐
 */
export async function togglePackageStatus(id: string, status: Package['status']) {
  return put<void>(`${API_ENDPOINTS.packages}/${id}/status`, { status });
}
