import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';
import type { Permission } from '../types';

export const fetchPermissions = async (params?: Record<string, string | number | boolean>): Promise<Permission[]> => {
  return get<Permission[]>(API_ENDPOINTS.permissions, params as Record<string, string | number | boolean>, ApiResponseType.ARRAY);
};

export const getPermissionTree = async (): Promise<Permission[]> => {
  return get<Permission[]>(API_ENDPOINTS.permissionTree, undefined, ApiResponseType.ARRAY);
};

export const getPermissionDetail = async (id: string): Promise<Permission> => {
  return get<Permission>(API_ENDPOINTS.permissionDetail.replace('{id}', id));
};

export const createPermission = async (data: {
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  sortOrder?: number;
}): Promise<Permission> => {
  return post<Permission>(API_ENDPOINTS.permissionCreate, data);
};

export const updatePermission = async (id: string, data: {
  name?: string;
  code?: string;
  parentId?: string;
  description?: string;
  sortOrder?: number;
}): Promise<Permission> => {
  return post<Permission>(API_ENDPOINTS.permissionUpdate.replace('{id}', id), data);
};

export const deletePermission = async (id: string): Promise<void> => {
  return post<void>(API_ENDPOINTS.permissionDelete.replace('{id}', id), {});
};