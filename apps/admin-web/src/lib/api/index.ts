/**
 * API 服务统一导出
 * 前后端分离项目
 */

// 基础配置和类型
export * from './config';
export * from './types';
export { get, post, put, del } from './client';

// 各模块 API 服务
export * as tablesApi from './tables';
export * as membersApi from './members';
export * as ordersApi from './orders';
export * as productsApi from './products';
export * as employeesApi from './employees';
export * as assistantsApi from './assistants';
export * as pricingApi from './pricing';
export * as packagesApi from './packages';
export * as storesApi from './stores';
export * as settingsApi from './settings';
export * as reportsApi from './reports';
export * as couponApi from './coupon';
export * as rolesApi from './roles';
export * as permissionsApi from './permissions';
