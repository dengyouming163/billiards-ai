import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';

export interface Store {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status?: string;
}

export async function fetchStores() {
  return get<Store[]>(API_ENDPOINTS.storeLists, undefined, ApiResponseType.ARRAY);
}

export async function switchStore(storeId: string) {
  return post<{ store_id: string; store_name: string }>(API_ENDPOINTS.storeSwitch, { store_id: storeId });
}
