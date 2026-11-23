import { get, post, put } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';
import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift, Payment, Coupon,
} from '@/types';

// ---- Store ----
export const storeApi = {
  lists: () => get<Record<string, unknown>[]>(API_ENDPOINTS.storeLists, undefined, ApiResponseType.ARRAY),
};

// ---- Table ----
export const tableApi = {
  lists: () => get<Table[]>(API_ENDPOINTS.tableLists, undefined, ApiResponseType.ARRAY),
  detail: (id: string) => get<Table>(`${API_ENDPOINTS.tableDetail}/${id}`),
  stats: () => get<Record<string, unknown>>(API_ENDPOINTS.tableStats),
  update: (id: string, data: Partial<Table>) =>
    put<Table>(`${API_ENDPOINTS.tableUpdate}/${id}`, data as unknown as Record<string, unknown>),
};

// ---- Order ----
export const orderApi = {
  lists: (params?: Record<string, unknown>) =>
    get<Order[]>(API_ENDPOINTS.orderLists, params, ApiResponseType.LIST),
  detail: (id: string) => get<Order>(`${API_ENDPOINTS.orderDetail}/${id}`),
  open: (params: Record<string, unknown>) =>
    post<Order>(API_ENDPOINTS.orderOpen, params),
  close: (id: string) => post<void>(`${API_ENDPOINTS.orderClose}/${id}`),
  checkout: (id: string, params: Record<string, unknown>) =>
    post<Record<string, unknown>>(`${API_ENDPOINTS.orderCheckout}/${id}`, params),
  extend: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderExtend}/${id}`, params),
  pause: (id: string) => post<void>(`${API_ENDPOINTS.orderPause}/${id}`),
  resume: (id: string) => post<void>(`${API_ENDPOINTS.orderResume}/${id}`),
  pauseTableFee: (orderId: string) =>
    post<void>(API_ENDPOINTS.orderPauseTableFee, { order_id: orderId }),
  resumeTableFee: (orderId: string) =>
    post<void>(API_ENDPOINTS.orderResumeTableFee, { order_id: orderId }),
  pauseAssistantFee: (orderId: string, itemId?: string) =>
    post<void>(API_ENDPOINTS.orderPauseAssistantFee, { order_id: orderId, ...(itemId ? { item_id: itemId } : {}) }),
  resumeAssistantFee: (orderId: string, itemId?: string) =>
    post<void>(API_ENDPOINTS.orderResumeAssistantFee, { order_id: orderId, ...(itemId ? { item_id: itemId } : {}) }),
  cancel: (id: string, params?: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderCancel}/${id}`, params),
  merge: (params: Record<string, unknown>) => post<void>(API_ENDPOINTS.orderMerge, params),
  changeTable: (params: Record<string, unknown>) =>
    post<void>(API_ENDPOINTS.orderChangeTable, params),
  inProgress: () => get<Order[]>(API_ENDPOINTS.orderInProgress, undefined, ApiResponseType.ARRAY),
  tableOrders: (tableId: string) =>
    get<Order[]>(API_ENDPOINTS.orderTableOrders, { table_id: tableId }, ApiResponseType.ARRAY),
  remark: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderRemark}/${id}`, params),
  getCurrentOrder: (tableId: string) =>
    get<Record<string, unknown>>(API_ENDPOINTS.orderGetCurrent, { table_id: tableId }),
  /** 获取订单权威账单（含服务端计费：30min取整 + 时段系数 + 会员折扣） */
  getBill: (orderId: string) =>
    get<Record<string, unknown>>(API_ENDPOINTS.orderBill, { order_id: orderId }),
  addProductItem: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderAddProductItem, params),
  addAssistantItem: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderAddAssistantItem, params),
  prepayAssistant: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderPrepayAssistant, params),
  removeItem: (params: Record<string, unknown>) =>
    post<void>(API_ENDPOINTS.orderRemoveItem, params),
  cancelItem: (params: Record<string, unknown>) =>
    post<void>(API_ENDPOINTS.orderCancelItem, params),
  bindMember: (params: Record<string, unknown>) =>
    post<void>(API_ENDPOINTS.orderBindMember, params),
  addGiftHours: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderAddGiftHours, params),
  acceptItem: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderAcceptItem, params),
  deliverItem: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderDeliverItem, params),
  acceptAssistant: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderAcceptAssistant, params),
  startAssistantService: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderStartAssistantService, params),
  endAssistantService: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderEndAssistantService, params),
  cancelAssistant: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderCancelAssistant, params),
  tableLog: (orderId: string) =>
    get<Record<string, unknown>[]>(`/pos.Order/tableLog`, { order_id: orderId }, ApiResponseType.ARRAY),
  pendingDeliveries: () =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.orderPendingDeliveries, undefined, ApiResponseType.ARRAY),
  pendingAssistantBookings: () =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.orderPendingAssistantBookings, undefined, ApiResponseType.ARRAY),
  quickOrder: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderQuickOrder, params),
  /** 临时开台（打扫/维护 或 免费体验） */
  tempOpen: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderTempOpen, params),
  /** 关闭临时订单 / 转为正式订单 */
  tempClose: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.orderTempClose, params),
};

// ---- Member ----
export const memberApi = {
  lists: (params?: Record<string, unknown>) =>
    get<Member[]>(API_ENDPOINTS.memberLists, params, ApiResponseType.LIST),
  search: (keyword: string) =>
    get<Member[]>(API_ENDPOINTS.memberSearch, { keyword }, ApiResponseType.ARRAY),
  detail: (id: string) =>
    get<Member>(`${API_ENDPOINTS.memberDetail}?id=${encodeURIComponent(id)}`),
  create: (data: Record<string, unknown>) =>
    post<Member>(API_ENDPOINTS.memberCreate, data),
  update: (id: string, data: Record<string, unknown>) =>
    put<Member>(`${API_ENDPOINTS.memberUpdate}?id=${encodeURIComponent(id)}`, data),
  recharge: (id: string, params: Record<string, unknown>) =>
    post<Member>(`${API_ENDPOINTS.memberRecharge}?id=${encodeURIComponent(id)}`, params),
  /** 现金录单充值 */
  cashRecharge: (id: string, params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.memberRechargeCash, { ...params, member_id: id }),
  /** 微信充值 — 锁价 token */
  prepareRecharge: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.memberPrepareRecharge, params),
  /** 微信充值 — 扫码支付 */
  wechatRecharge: (id: string, params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.memberRechargeWechat, { ...params, member_id: id }),
  /** 余额调整 */
  adjustBalance: (id: string, params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.memberAdjustBalance, { ...params, member_id: id }),
  consume: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.memberConsume}?id=${encodeURIComponent(id)}`, params),
  levels: () => get<Record<string, unknown>[]>(API_ENDPOINTS.memberLevels, undefined, ApiResponseType.ARRAY),
  recharges: (id: string, params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(`${API_ENDPOINTS.memberRecharges}?id=${encodeURIComponent(id)}`, params, ApiResponseType.LIST),
  /** 门店充值记录列表（支持手机号搜索） */
  rechargeRecords: (params?: Record<string, unknown>) =>
    get<{ lists: Record<string, unknown>[]; total: number }>(API_ENDPOINTS.memberRechargeRecords, params, ApiResponseType.NORMAL),
  consumes: (id: string, params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(`${API_ENDPOINTS.memberConsumes}?id=${encodeURIComponent(id)}`, params, ApiResponseType.LIST),
};

// ---- Product ----
export const productApi = {
  all: () => get<Product[]>(API_ENDPOINTS.productAll, undefined, ApiResponseType.ARRAY),
  lists: (params?: Record<string, unknown>) =>
    get<Product[]>(API_ENDPOINTS.productLists, params, ApiResponseType.LIST),
  categories: () =>
    get<ProductCategory[]>(API_ENDPOINTS.productCategories, undefined, ApiResponseType.ARRAY),
};

// ---- Assistant ----
export const assistantApi = {
  lists: () => get<Assistant[]>(API_ENDPOINTS.assistantLists, undefined, ApiResponseType.ARRAY),
  services: (orderId?: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.assistantServices, orderId ? { order_id: orderId } : undefined, ApiResponseType.ARRAY),
  levels: () => get<Record<string, unknown>[]>(API_ENDPOINTS.assistantLevels, undefined, ApiResponseType.ARRAY),
};

// ---- Shift ----
export const shiftApi = {
  checkIn: (params: Record<string, unknown>) => post<Shift>(API_ENDPOINTS.shiftCheckIn, params),
  checkOut: (params: Record<string, unknown>) => post<Shift>(API_ENDPOINTS.shiftCheckOut, params),
  current: () => get<Shift | Record<string, never>>(API_ENDPOINTS.shiftCurrent),
  records: (params?: Record<string, unknown>) =>
    get<Shift[]>(API_ENDPOINTS.shiftRecords, params, ApiResponseType.LIST),
  configs: () => get<Record<string, unknown>[]>(API_ENDPOINTS.shiftConfigs, undefined, ApiResponseType.ARRAY),
  summary: () => get<Record<string, unknown>>(API_ENDPOINTS.shiftSummary),
  employees: () => get<Record<string, unknown>>(API_ENDPOINTS.shiftEmployees),
  handover: (params: Record<string, unknown>) => post<Record<string, unknown>>(API_ENDPOINTS.shiftHandover, params),
  startWork: (params: Record<string, unknown>) => post<Record<string, unknown>>(API_ENDPOINTS.shiftStartWork, params),
};

// ---- PreOrder ----
export const preOrderApi = {
  lists: (orderId?: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.preOrderLists, orderId ? { order_id: orderId } : undefined, ApiResponseType.ARRAY),
  byTable: (tableId: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.preOrderByTable, { table_id: tableId }, ApiResponseType.ARRAY),
  confirm: (groupId: string) =>
    post<void>(API_ENDPOINTS.preOrderConfirm, { preorder_group_id: groupId }),
  reject: (groupId: string, reason?: string) =>
    post<void>(API_ENDPOINTS.preOrderReject, { preorder_group_id: groupId, reason }),
};

// ---- Reservation ----
export const reservationApi = {
  lists: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.reservationLists, params, ApiResponseType.ARRAY),
  create: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.reservationCreate, params),
  cancel: (id: string) =>
    post<Record<string, unknown>>(API_ENDPOINTS.reservationCancel, { id }),
  checkIn: (id: string) =>
    post<Record<string, unknown>>(API_ENDPOINTS.reservationCheckIn, { id }),
  confirm: (id: string) =>
    post<Record<string, unknown>>(API_ENDPOINTS.reservationConfirm, { id }),
};

// ---- Statistics ----
export const statisticsApi = {
  overview: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>>(API_ENDPOINTS.statisticsOverview, params),
  tableUsage: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.statisticsTableUsage, params, ApiResponseType.ARRAY),
  productRank: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.statisticsProductRank, params, ApiResponseType.ARRAY),
  assistantRank: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.statisticsAssistantRank, params, ApiResponseType.ARRAY),
  channelRevenue: (params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.statisticsChannelRevenue, params, ApiResponseType.ARRAY),
};

// ---- Settings (折扣配置等) ----
export const settingApi = {
  /** 获取折扣配置列表 — 使用 RAW 响应类型保留字段原名 (discount_name, discount_type 等) */
  getDiscountList: () =>
    get<any[]>(API_ENDPOINTS.settingDiscountList, undefined, ApiResponseType.RAW),
};

// ---- Payment (微信支付) ----
export const paymentApi = {
  /** 准备结算 — 获取锁价 token */
  prepare: (orderId: string) =>
    post<{ token: string; amount: number; breakdown: any; expires_at: string }>(
      '/payment.Payment/prepare', { order_id: orderId }
    ),

  /** 扫码枪 MICROPAY 付款 */
  micropay: (params: { order_id: string; auth_code: string; token: string }) =>
    post<{ success: boolean; payment_id: string }>(
      '/payment.Payment/micropay', params
    ),

  /** 查询支付状态 */
  query: (orderId: string) =>
    get<{ status: string; paid_amount: number; payment_id: string }>(
      '/payment.Payment/query', { order_id: orderId }
    ),
}

// ---- POS ----
export const posApi = {
  confirmOpen: (params: { token: string; action: string }) =>
    post<{ success: boolean }>('/pos.Order/confirmOpen', params),
  pendingConfirmRequests: (storeId: string) =>
    get<{ token: string; tableName: string; tableId: string; playerCount: number; expiresAt: number; timeout: number }[]>(
      '/pos.Order/pendingConfirmRequests', { store_id: storeId }, ApiResponseType.ARRAY
    ),
};

// ---- Notification (通过标准 client) ----
export const notificationApi = {
  lists: (params: Record<string, unknown>) =>
    get<Record<string, unknown>>(API_ENDPOINTS.notificationLists, params, ApiResponseType.NORMAL),
  read: (id: string) =>
    post<void>(API_ENDPOINTS.notificationRead, { id }),
  readAll: () =>
    post<void>(API_ENDPOINTS.notificationReadAll, {}),
  delete: (id: string) =>
    post<void>(API_ENDPOINTS.notificationDelete, { id }),
  unreadCount: () =>
    get<{ count: number }>(API_ENDPOINTS.notificationUnreadCount, undefined, ApiResponseType.NORMAL),
};
