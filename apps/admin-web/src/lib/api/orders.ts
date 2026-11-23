import { get, post, download } from './client';
import { ApiResponseType } from './types';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  assistant_id?: string;
  item_type: string;
  item_name: string;
  quantity: number;
  unit?: string;
  unit_price: number;
  total_price: number;
  discount_rate?: number;
  final_price: number;
  description?: string;
  created_at: string;
}

export interface OrderPayment {
  id: string;
  order_id: string;
  store_id?: string;
  order_no?: string;
  payment_method: string;
  amount: number;
  transaction_no?: string;
  status: string;
  paid_at?: string;
  operator_id?: string;
  operator_name?: string;
  description?: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_no: string;
  type: 'table' | 'product' | 'assistant';
  status: 'pending' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  store_id: string;
  member_id?: string;
  member_name?: string;
  member_level?: string;
  table_id?: string;
  table_name?: string;
  assistant_id?: string;
  original_amount: number;
  discount_amount: number;
  final_amount: number;
  balance_paid: number;
  cash_paid: number;
  wechat_paid: number;
  alipay_paid: number;
  card_paid: number;
  points_deduct: number;
  points_gained: number;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  operator_id?: string;
  operator_name?: string;
  remark?: string;
  items: OrderItem[];
  payments: OrderPayment[];
  created_at: string;
}

export interface OrderListResponse {
  data: Order[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export async function fetchOrders(params: {
  page?: number;
  page_size?: number;
  type?: string;
  status?: string;
  keyword?: string;
  date_range?: string;
  start_date?: string;
  end_date?: string;
}): Promise<OrderListResponse> {
  return get('/order.Order/lists', params, ApiResponseType.NORMAL);
}

export async function exportOrders(params: {
  type?: string;
  status?: string;
  keyword?: string;
  start_date?: string;
  end_date?: string;
}): Promise<void> {
  const filename = `订单导出_${new Date().toISOString().split('T')[0]}.csv`;
  return download('/order.Order/export', params as Record<string, unknown>, filename);
}

export async function fetchOrderDetail(id: string): Promise<Order> {
  return get(`/order.Order/detail/${id}`, {}, ApiResponseType.NORMAL);
}

export async function createTableOrder(params: {
  table_id: string;
  member_id?: string;
  member_name?: string;
  operator_id?: string;
  operator_name?: string;
  customer_count?: number;
}): Promise<Order> {
  return post('/order.Order/table', params, ApiResponseType.NORMAL);
}

export async function extendOrder(id: string, params: { minutes: number }): Promise<Order> {
  return post(`/order.Order/extend/${id}`, params, ApiResponseType.NORMAL);
}

export async function pauseOrder(id: string): Promise<Order> {
  return post(`/order.Order/pause/${id}`, {}, ApiResponseType.NORMAL);
}

export async function resumeOrder(id: string): Promise<Order> {
  return post(`/order.Order/resume/${id}`, {}, ApiResponseType.NORMAL);
}

export async function checkoutOrder(id: string, params: {
  balance_paid?: number;
  cash_paid?: number;
  wechat_paid?: number;
  alipay_paid?: number;
  card_paid?: number;
  points_deduct?: number;
  operator_id?: string;
  operator_name?: string;
}): Promise<Order> {
  return post(`/order.Order/checkout/${id}`, params, ApiResponseType.NORMAL);
}

export async function cancelOrder(id: string, params: { reason?: string }): Promise<Order> {
  return post(`/order.Order/cancel/${id}`, params, ApiResponseType.NORMAL);
}

export async function createProductOrder(params: {
  items: Array<{
    product_id?: string;
    item_name: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    total_price: number;
    final_price?: number;
  }>;
  member_id?: string;
  member_name?: string;
  table_id?: string;
  operator_id?: string;
  operator_name?: string;
}): Promise<Order> {
  return post('/order.Order/product', params, ApiResponseType.NORMAL);
}

export async function createAssistantOrder(params: {
  assistant_id: string;
  table_id?: string;
  member_id?: string;
  member_name?: string;
  operator_id?: string;
  operator_name?: string;
}): Promise<Order> {
  return post('/order.Order/assistant', params, ApiResponseType.NORMAL);
}

export async function mergeOrders(params: { order_ids: string[] }): Promise<{
  main_order_id: string;
  merged_order_ids: string[];
  total_amount: number;
  items: OrderItem[];
}> {
  return post('/order.Order/merge', params, ApiResponseType.NORMAL);
}

export async function refundOrder(id: string, params: {
  refund_amount: number;
  refund_method?: string;
  reason?: string;
  operator_id?: string;
  operator_name?: string;
}): Promise<{
  order_id: string;
  refund_amount: number;
  refund_method: string;
  status: string;
}> {
  return post(`/order.Order/refund/${id}`, params, ApiResponseType.NORMAL);
}

export async function getInProgressOrders(): Promise<Order[]> {
  return get('/order.Order/inProgress', {}, ApiResponseType.ARRAY);
}

export async function addOrderRemark(id: string, params: { remark: string }): Promise<Order> {
  return post(`/order.Order/remark/${id}`, params, ApiResponseType.NORMAL);
}

export async function getOrdersByTable(tableId: string): Promise<Order[]> {
  return get('/order.Order/tableOrders', { table_id: tableId }, ApiResponseType.ARRAY);
}

export async function batchCheckoutOrders(params: {
  order_ids: string[];
  balance_paid?: number;
  cash_paid?: number;
  wechat_paid?: number;
  alipay_paid?: number;
  card_paid?: number;
  points_deduct?: number;
  operator_id?: string;
  operator_name?: string;
}): Promise<{
  total_amount: number;
  paid_amount: number;
  order_count: number;
}> {
  return post('/order.Order/batchCheckout', params, ApiResponseType.NORMAL);
}
