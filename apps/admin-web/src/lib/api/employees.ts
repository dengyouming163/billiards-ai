/**
 * 员工管理 API 服务
 * 前后端分离项目
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { ListParams } from './types';
import { ApiResponseType } from './types';
import type { Employee, Role, Permission, Store } from '@/lib/types';

interface EmployeeSchedule {
  id: string;
  employeeId: string;
  date: string;
  shift: string;
  createdAt: string;
}

/**
 * 获取员工列表
 */
export async function fetchEmployees(params?: ListParams) {
  return get<Employee[]>(API_ENDPOINTS.employees, params as Record<string, string | number | boolean>, ApiResponseType.ARRAY);
}

/**
 * 获取单个员工详情
 */
export async function fetchEmployee(id: string) {
  return get<Employee>(API_ENDPOINTS.employeeDetail, { id });
}

/**
 * 创建员工
 */
export async function createEmployee(data: Omit<Employee, 'id'>) {
  return post<Employee>(API_ENDPOINTS.employeeCreate, data);
}

/**
 * 更新员工
 */
export async function updateEmployee(id: string, data: Partial<Employee>) {
  return put<Employee>(API_ENDPOINTS.employeeUpdate, { id, ...data });
}

/**
 * 删除员工
 */
export async function deleteEmployee(id: string) {
  return del<void>(API_ENDPOINTS.employeeDelete, { id });
}

/**
 * 获取员工排班
 */
export async function fetchEmployeeSchedule(
  employeeId: string,
  startDate: string,
  endDate: string
) {
  return get<EmployeeSchedule[]>(API_ENDPOINTS.employeeSchedule, {
    employeeId,
    startDate,
    endDate,
  });
}

/**
 * 设置员工排班
 */
export async function setEmployeeSchedule(
  employeeId: string,
  schedules: { date: string; shift: string }[]
) {
  return post<EmployeeSchedule[]>(API_ENDPOINTS.employeeSchedule, {
    employeeId,
    schedules,
  });
}

/**
 * 重置员工密码
 */
export async function resetEmployeePassword(employeeId: string) {
  return post<{ password: string }>(API_ENDPOINTS.employeeResetPassword, { id: employeeId });
}

/**
 * 获取当前员工的可管理门店列表
 */
export async function fetchEmployeeStores(storeId?: string) {
  const params: Record<string, string | number | boolean> = {};
  if (storeId) params.store_id = storeId;
  return get<Store[]>(API_ENDPOINTS.employeeStores, params);
}

/**
 * 获取当前员工的权限码列表
 */
export async function fetchEmployeePermissions(storeId?: string) {
  const params: Record<string, string | number | boolean> = {};
  if (storeId) params.store_id = storeId;
  params.module = 'pc';
  return get<string[]>(API_ENDPOINTS.employeePermissions, params, ApiResponseType.ARRAY);
}

/**
 * 获取角色列表
 */
export async function fetchRoles() {
  return get<Role[]>(API_ENDPOINTS.roles);
}

/**
 * 获取角色详情
 */
export async function fetchRoleDetail(id: string) {
  return get<Role>(API_ENDPOINTS.roleDetail, { id });
}

/**
 * 创建角色
 */
export async function createRole(data: Partial<Role>) {
  return post<Role>(API_ENDPOINTS.roleCreate, data);
}

/**
 * 更新角色
 */
export async function updateRole(id: string, data: Partial<Role>) {
  return put<Role>(API_ENDPOINTS.roleUpdate, { id, ...data });
}

/**
 * 删除角色
 */
export async function deleteRole(id: string) {
  return del<void>(API_ENDPOINTS.roleDelete, { id });
}

/**
 * 获取全部权限树
 */
export async function fetchAllPermissions(module?: string) {
  const params: Record<string, string | number | boolean> = {};
  if (module) params.module = module;
  return get<Permission[]>(API_ENDPOINTS.permissions, params);
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
  return post<void>(API_ENDPOINTS.roleSavePermissions, { roleId, permissionIds });
}
