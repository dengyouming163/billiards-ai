/**
 * 角色管理 API 服务
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { ListParams } from './types';
import { ApiResponseType } from './types';

export interface Role {
  id: string;
  store_id: string;
  name: string;
  code: string;
  description?: string;
  sort_order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  store_id: string;
  merchant_id: string;
  parent_id: string;
  name: string;
  code: string;
  uri: string;
  icon: string;
  sort_order: number;
  type: string;
  status: number;
  created_at: string;
  updated_at: string;
  children?: Permission[];
}

/**
 * 获取角色列表
 */
export async function fetchRoles(params?: ListParams) {
  return get<Role[]>(API_ENDPOINTS.roles, params as Record<string, string | number | boolean>, ApiResponseType.ARRAY);
}

/**
 * 获取角色详情
 */
export async function fetchRole(id: string) {
  return get<Role>(`${API_ENDPOINTS.roleDetail}/${id}`);
}

/**
 * 创建角色
 */
export async function createRole(data: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at'>> & { name: string }) {
  return post<Role>(API_ENDPOINTS.roleCreate, data);
}

/**
 * 更新角色
 */
export async function updateRole(id: string, data: Partial<Role>) {
  return put<Role>(`${API_ENDPOINTS.roleUpdate}/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRole(id: string) {
  return del<void>(`${API_ENDPOINTS.roleDelete}/${id}`);
}

/**
 * 获取角色权限
 */
export async function fetchRolePermissions(roleId: string) {
  return get<string[]>(API_ENDPOINTS.rolePermissions, { id: roleId });
}

/**
 * 保存角色权限
 */
export async function saveRolePermissions(roleId: string, permissionIds: string[]) {
  return post<void>(API_ENDPOINTS.roleSavePermissions, { id: roleId, permission_ids: permissionIds });
}

/**
 * 获取权限列表
 */
export async function fetchPermissions(params?: ListParams) {
  return get<Permission[]>(API_ENDPOINTS.permissions, params as Record<string, string | number | boolean>, ApiResponseType.ARRAY);
}

/**
 * 获取权限树
 */
export async function fetchPermissionTree() {
  return get<Permission[]>(API_ENDPOINTS.permissionTree, undefined, ApiResponseType.ARRAY);
}

/**
 * 获取权限详情
 */
export async function fetchPermission(id: string) {
  return get<Permission>(`${API_ENDPOINTS.permissionDetail}/${id}`);
}

/**
 * 创建权限
 */
export async function createPermission(data: Omit<Permission, 'id' | 'created_at' | 'updated_at'>) {
  return post<Permission>(API_ENDPOINTS.permissionCreate, data);
}

/**
 * 更新权限
 */
export async function updatePermission(id: string, data: Partial<Permission>) {
  return put<Permission>(`${API_ENDPOINTS.permissionUpdate}/${id}`, data);
}

/**
 * 删除权限
 */
export async function deletePermission(id: string) {
  return del<void>(`${API_ENDPOINTS.permissionDelete}/${id}`);
}