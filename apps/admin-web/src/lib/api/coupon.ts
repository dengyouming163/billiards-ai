/**
 * Coupon 第三方验券 API 服务
 * 前后端分离项目
 */

import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';

// 平台配置
export async function savePlatformConfig(params: Record<string, unknown>) {
  return post<{ id: string }>(API_ENDPOINTS.couponPlatformSave, params, ApiResponseType.NORMAL);
}

export async function getPlatformConfig(storeId: string, platform: string) {
  return get<{
    id: string; platform: string; app_id: string; app_secret: string;
    status: number; token_expires_at: string;
  } | null>(API_ENDPOINTS.couponPlatformGet, { store_id: storeId, platform }, ApiResponseType.NORMAL);
}

export async function checkPlatformStatus(storeId: string, platform: string) {
  return get<{ configured: boolean; connected: boolean; message: string }>(
    API_ENDPOINTS.couponPlatformCheck, { store_id: storeId, platform }, ApiResponseType.NORMAL
  );
}

// 套餐同步
export async function syncPackages(storeId: string, platform: string) {
  return post<{ new_count: number; update_count: number; total: number }>(
    API_ENDPOINTS.couponPackageSync, { store_id: storeId, platform }, ApiResponseType.NORMAL
  );
}

export async function getPackageList(storeId: string, params: Record<string, unknown>) {
  return get<Record<string, unknown>[]>(API_ENDPOINTS.couponPackageList,
    { store_id: storeId, ...params }, ApiResponseType.LIST);
}

// 核销记录
export async function getVerifyRecords(storeId: string, params: Record<string, unknown>) {
  return get<Record<string, unknown>[]>(API_ENDPOINTS.couponVerifyRecords,
    { store_id: storeId, ...params }, ApiResponseType.LIST);
}

// 统计报表
export async function getCouponReportSummary(storeId: string, params: Record<string, unknown>) {
  return get<{
    total_count: number; total_amount: number;
    platform_summary: Array<{ platform: string; count: number; amount: number }>;
    package_summary: Array<{ package_name: string; platform: string; count: number; amount: number }>;
    date_range: { start: string; end: string };
  }>(API_ENDPOINTS.couponReportSummary, { store_id: storeId, ...params }, ApiResponseType.NORMAL);
}

export async function getCouponReportDaily(storeId: string, params: Record<string, unknown>) {
  return get<Array<{ date: string; count: number; amount: number }>>(
    API_ENDPOINTS.couponReportDaily, { store_id: storeId, ...params }, ApiResponseType.ARRAY
  );
}
