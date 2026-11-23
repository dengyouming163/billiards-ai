import { get, post, del } from './client';
import { API_ENDPOINTS } from './config';

export interface TableType {
  id: string;
  store_id: string;
  name: string;
  code: string;
  description: string;
  icon: string;
  sort_order: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface TableTypeForm {
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  status?: number;
}

export async function fetchTableTypes(params?: { store_id: string }) {
  return get<TableType[]>(API_ENDPOINTS.tableTypes, params as Record<string, string>);
}

export async function fetchTableType(id: string) {
  return get<TableType>(API_ENDPOINTS.tableTypeDetail, { id });
}

export async function createTableType(data: { store_id: string } & TableTypeForm) {
  return post<TableType>(API_ENDPOINTS.tableTypeCreate, data as unknown as Record<string, unknown>);
}

export async function updateTableType(id: string, data: Partial<TableTypeForm>) {
  return post<TableType>(API_ENDPOINTS.tableTypeUpdate.replace('{id}', id), data as Record<string, unknown>);
}

export async function deleteTableType(id: string) {
  return del<void>(API_ENDPOINTS.tableTypeDelete.replace('{id}', id));
}

export async function toggleTableType(id: string) {
  return post<TableType>(API_ENDPOINTS.tableTypeToggle, { id });
}
