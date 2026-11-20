/**
 * API 配置
 * 前后端分离项目 - API 基础配置
 */

// API 基础地址，通过环境变量配置
// 开发: .env.development 中设置 NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:10002/storeapi
// 生产: .env 中设置 NEXT_PUBLIC_API_BASE_URL=http://poolapi.kyyp.cn/storeapi
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/storeapi';

// API 端点配置
export const API_ENDPOINTS = {
  // 认证
  login: '/auth.Auth/login',
  smsLogin: '/auth.Auth/smsLogin',
  sendSms: '/auth.Auth/sendSms',
  
  // 门店
  stores: '/store.Store/lists',
  storeDetail: '/store.Store/detail',
  storeCreate: '/store.Store/create',
  storeUpdate: '/store.Store/update',
  storeDelete: '/store.Store/delete',
  storeSwitch: '/auth.Auth/switchStore',
  
  // 台桌
  tables: '/table.Table/lists',
  tableQrcode: '/table.Table/qrcode',
  
  // 计费规则
  pricingRules: '/pricing.Pricing/lists',
  pricingRuleDetail: '/pricing.Pricing/detail',
  pricingRuleCreate: '/pricing.Pricing/create',
  pricingRuleUpdate: '/pricing.Pricing/update',
  pricingRuleDelete: '/pricing.Pricing/delete',
  pricingRuleToggle: '/pricing.Pricing/toggle',
  pricingRuleCalculate: '/pricing.Pricing/calculate',
  pricingRuleCalculateByTable: '/pricing.Pricing/calculateByTable',
  
  // 时段配置
  timePeriods: '/pricing.TimePeriod/lists',
  timePeriodDetail: '/pricing.TimePeriod/detail',
  timePeriodCreate: '/pricing.TimePeriod/create',
  timePeriodUpdate: '/pricing.TimePeriod/update',
  timePeriodDelete: '/pricing.TimePeriod/delete',
  timePeriodToggle: '/pricing.TimePeriod/toggle',
  timePeriodValidate: '/pricing.TimePeriod/validateOverlap',
  
  // 会员折扣
  memberDiscounts: '/pricing.MemberDiscount/lists',
  memberDiscountUpdate: '/pricing.MemberDiscount/update',

  // 套餐
  packages: '/package.Package/lists',
  
  // 订单
  orders: '/order.Order/lists',
  orderExport: '/order.Order/export',
  orderMerge: '/order.Order/merge',
  orderSplit: '/order.Order/split',
  
  // 会员
  members: '/member.Member/lists',
  memberRecharge: '/member.Member/recharge',
  
  // 员工
  employees: '/employee.Employee/lists',
  employeeDetail: '/employee.Employee/detail',
  employeeCreate: '/employee.Employee/create',
  employeeUpdate: '/employee.Employee/update',
  employeeDelete: '/employee.Employee/delete',
  employeeStores: '/employee.Employee/stores',
  employeePermissions: '/employee.Employee/permissions',
  employeeResetPassword: '/employee.Employee/resetPassword',
  employeeSchedule: '/employee.Employee/schedule',
  
  // 助教
  assistants: '/assistant.Assistant/lists',
  assistantDetail: '/assistant.Assistant/getDetail',
  assistantCreate: '/assistant.Assistant/create',
  assistantUpdate: '/assistant.Assistant/update',
  assistantDelete: '/assistant.Assistant/delete',
  assistantLevels: '/assistant.Assistant/getLevels',
  assistantLevelCreate: '/assistant.Assistant/createLevel',
  assistantLevelUpdate: '/assistant.Assistant/updateLevel',
  assistantLevelDelete: '/assistant.Assistant/deleteLevel',
  assistantSchedules: '/assistant.Assistant/getSchedules',
  assistantSetSchedule: '/assistant.Assistant/setSchedule',
  assistantShiftConfigs: '/assistant.Assistant/getShiftConfigs',
  assistantShiftConfigCreate: '/assistant.Assistant/createShiftConfig',
  assistantShiftConfigUpdate: '/assistant.Assistant/updateShiftConfig',
  assistantShiftConfigDelete: '/assistant.Assistant/deleteShiftConfig',
  assistantInitShiftConfigs: '/assistant.Assistant/initShiftConfigs',
  assistantInitLevels: '/assistant.Assistant/initLevels',
  assistantOrders: '/assistant.Assistant/getOrders',
  assistantOrderCreate: '/assistant.Assistant/createOrder',
  assistantOrderUpdateStatus: '/assistant.Assistant/updateOrderStatus',
  assistantSubmitReview: '/assistant.Assistant/submitReview',
  assistantStats: '/assistant.Assistant/getStats',
  assistantUpdateSchedule: '/assistant.Assistant/updateSchedule',
  assistantDeleteSchedule: '/assistant.Assistant/deleteSchedule',
  assistantCommissionConfig: '/assistant.Assistant/getCommissionConfig',
  assistantAllCommissionConfigs: '/assistant.Assistant/getAllCommissionConfigs',
  assistantSaveCommissionConfig: '/assistant.Assistant/saveCommissionConfig',
  assistantDeleteCommissionConfig: '/assistant.Assistant/deleteCommissionConfig',
  assistantCommissionRecords: '/assistant.Assistant/getCommissionRecords',
  assistantMarkCommissionPaid: '/assistant.Assistant/markCommissionPaid',
  assistantCommissionStats: '/assistant.Assistant/getCommissionStats',
  assistantBatchSettleCommission: '/assistant.Assistant/batchSettleCommission',
  assistantServices: '/assistant.Assistant/getServices',
  assistantServiceCreate: '/assistant.Assistant/createService',
  assistantServiceUpdate: '/assistant.Assistant/updateService',
  assistantServiceDelete: '/assistant.Assistant/deleteService',
  
  // 商品
  products: '/product.Product/lists',
  productAll: '/product.Product/all',
  productDetail: '/product.Product/detail',
  productCreate: '/product.Product/create',
  productUpdate: '/product.Product/update',
  productDelete: '/product.Product/delete',
  productToggle: '/product.Product/toggle',
  productStats: '/product.Product/stats',
  productCategories: '/product.Product/categories',
  productCategoryLists: '/product.ProductCategory/lists',
  productCategoryDetail: '/product.ProductCategory/detail',
  productCategoryCreate: '/product.ProductCategory/create',
  productCategoryUpdate: '/product.ProductCategory/update',
  productCategoryDelete: '/product.ProductCategory/delete',
  
  // 库存
  inventoryRecords: '/inventory.Inventory/records',
  inventoryInbound: '/inventory.Inventory/inbound',
  inventoryOutbound: '/inventory.Inventory/outbound',
  inventoryProduct: '/inventory.Inventory/product',
  inventoryAdjust: '/inventory.Inventory/adjust',
  inventoryStats: '/inventory.Inventory/stats',
  
  // 财务
  cashFlows: '/cashflow.CashFlow/lists',
  cashFlowsStats: '/cashflow.CashFlow/stats',
  cashFlowsExport: '/cashflow.CashFlow/export',
  
  // 报表
  reports: '/report.Report/overview',
  reportsRevenue: '/report.Report/revenueTrend',
  reportsTables: '/report.Report/tableUsage',
  reportsProducts: '/report.Report/productRank',
  reportsMemberStats: '/report.Report/memberStats',
  reportsMemberRank: '/report.Report/memberRank',
  reportsAssistantRank: '/report.Report/assistantRank',
  reportsComposition: '/report.Report/revenueComposition',
  reportsTimeAnalysis: '/report.Report/timeAnalysis',
  reportsRevenueSummary: '/report.Report/revenueSummary',
  reportsOperation: '/report.Report/operationOverview',
  reportsByChannel: '/report.Report/revenueByChannel',
  reportsByItemType: '/report.Report/revenueByItemType',
  reportsRecharge: '/report.Report/rechargeReport',

  // Report detail endpoints (aligned with wwwstoreapp)
  reportsByChannelDetail: '/report.Report/revenueByChannelDetail',
  reportsByItemTypeDetail: '/report.Report/revenueByItemTypeDetail',
  reportsRechargeDetail: '/report.Report/rechargeReportDetail',

  reportsAttendance: '/report.Report/attendanceReport',
  reportsAssistantSalary: '/report.Report/assistantSalary',
  
  // 设置
  zones: '/zone.Zone/lists',
  zonesAll: '/zone.Zone/all',
  zoneDetail: '/zone.Zone/detail/{id}',
  zoneCreate: '/zone.Zone/create',
  zoneUpdate: '/zone.Zone/update/{id}',
  zoneDelete: '/zone.Zone/delete/{id}',
  zoneToggle: '/zone.Zone/toggle',
  storeSettings: '/setting.Setting/store',
  paymentSettings: '/setting.Setting/payment',
  
  // 台型
  tableTypes: '/table.TableType/lists',
  tableTypeAll: '/table.TableType/all',
  tableTypeDetail: '/table.TableType/detail/{id}',
  tableTypeCreate: '/table.TableType/create',
  tableTypeUpdate: '/table.TableType/update/{id}',
  tableTypeDelete: '/table.TableType/delete/{id}',
  tableTypeToggle: '/table.TableType/toggle',
  
  // 角色
  roles: '/role.Role/lists',
  roleDetail: '/role.Role/detail',
  roleCreate: '/role.Role/create',
  roleUpdate: '/role.Role/update',
  roleDelete: '/role.Role/delete',
  rolePermissions: '/role.Role/permissions',
  roleSavePermissions: '/role.Role/savePermissions',
  
  // 权限
  permissions: '/permission.Permission/lists',
  permissionTree: '/permission.Permission/tree',
  permissionDetail: '/permission.Permission/detail/{id}',
  permissionCreate: '/permission.Permission/create',
  permissionUpdate: '/permission.Permission/update/{id}',
  permissionDelete: '/permission.Permission/delete/{id}',

  // 审批配置
  approvalConfigs: '/approval.ApprovalConfig/list',
  approvalConfigSave: '/approval.ApprovalConfig/save',
  approvalConfigEmployees: '/approval.ApprovalConfig/employees',

  // Discount 折扣配置
  discountList: '/setting.Setting/getDiscountList',
  discountSave: '/setting.Setting/saveDiscount',
  discountDelete: '/setting.Setting/deleteDiscount',

  // Coupon 第三方验券
  couponPlatformSave: '/coupon.Platform/saveConfig',
  couponPlatformGet: '/coupon.Platform/getConfig',
  couponPlatformCheck: '/coupon.Platform/checkStatus',
  couponPackageSync: '/coupon.Package/sync',
  couponPackageList: '/coupon.Package/list',
  couponPackageSave: '/coupon.Package/saveInternal',
  couponPackageDelete: '/coupon.Package/deleteInternal',
  couponVerifyRecords: '/coupon.Verify/records',
  couponReportSummary: '/coupon.Report/summary',
  couponReportDaily: '/coupon.Report/daily',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;