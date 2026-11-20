/**
 * 门店管理 API 服务
 * 前后端分离项目
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { Store } from '@/lib/types';
import { ApiResponseType } from './types';

export async function fetchStores() {
  return get<Store[]>(API_ENDPOINTS.stores, undefined, ApiResponseType.ARRAY);
}

export async function fetchStore(id: string) {
  return get<Store>(API_ENDPOINTS.storeDetail, { id });
}

export async function createStore(data: Record<string, unknown>) {
  return post<Store>(API_ENDPOINTS.storeCreate, data);
}

export async function updateStore(id: string, data: Record<string, unknown>) {
  return put<Store>(API_ENDPOINTS.storeUpdate, { id, ...data });
}

export async function deleteStore(id: string) {
  return del<void>(API_ENDPOINTS.storeDelete, { id });
}

export interface SwitchStoreResult {
  token: string;
  store: { id: string; name: string };
  user: {
    id: string;
    store_id: string;
    store_name: string;
    [key: string]: unknown;
  };
}

export async function switchStore(id: string) {
  return post<SwitchStoreResult>(API_ENDPOINTS.storeSwitch, { store_id: id });
}
