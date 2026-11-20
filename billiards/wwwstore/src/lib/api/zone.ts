import { get, post, del } from './client';
import { API_ENDPOINTS } from './config';

export interface Zone {
  id: string;
  store_id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface ZoneForm {
  name: string;
  code?: string;
  color?: string;
  description?: string;
  sort_order?: number;
  status?: number;
}

export async function fetchZones(params?: { store_id: string }) {
  return get<Zone[]>(API_ENDPOINTS.zones, params as Record<string, string>);
}

export async function fetchAllZones(params?: { store_id: string }) {
  return get<Zone[]>(API_ENDPOINTS.zonesAll, params as Record<string, string>);
}

export async function fetchZone(id: string) {
  return get<Zone>(API_ENDPOINTS.zoneDetail.replace('{id}', id));
}

export async function createZone(data: { store_id: string } & ZoneForm) {
  return post<Zone>(API_ENDPOINTS.zoneCreate, data as unknown as Record<string, unknown>);
}

export async function updateZone(id: string, data: Partial<ZoneForm>) {
  return post<Zone>(API_ENDPOINTS.zoneUpdate.replace('{id}', id), data as Record<string, unknown>);
}

export async function deleteZone(id: string) {
  return del<void>(API_ENDPOINTS.zoneDelete.replace('{id}', id));
}

export async function toggleZone(id: string) {
  return post<Zone>(API_ENDPOINTS.zoneToggle, { id });
}
