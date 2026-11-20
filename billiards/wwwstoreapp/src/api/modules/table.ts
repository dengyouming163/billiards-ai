import { get, post } from '../request'
import type { CurrentOrder, MemberInfo, TableStats, TableLog, PendingProduct, PendingAssistant, ProductItem, AssistantItem } from '@/types'

export interface Table {
  id: string
  store_id: string
  zone_id: string
  table_type_id: string
  number: string
  code: string
  name: string
  status: 'idle' | 'occupied' | 'reserved' | 'maintenance'
  pricing_id: string
  hourly_rate: number
  description: string
  sort_order: number
  zone_name?: string
  table_type_name?: string
  current_order?: CurrentOrder
}

export interface OrderItem {
  id: string
  order_id: string
  item_type: 'table' | 'product' | 'assistant' | 'merge_fee'
  item_name: string
  product_id?: string
  assistant_id?: string
  quantity: number
  unit: string
  unit_price: number
  total_price: number
  final_price: number
  status: string
  assistant_name?: string
  started_at?: string
  ended_at?: string
  delivered_at?: string
  hourly_rate?: number
  service_minutes?: number
}

export interface Bill {
  order: CurrentOrder
  items: OrderItem[]
  table_fee: number
  table_fee_paused?: number
  table_paused_at?: string
  table_fee_paused_duration?: number
  product_fee: number
  assistant_fee: number
  merge_fee: number
  total_amount: number
  member_discount?: number
  final_amount: number
  member?: MemberInfo
  time_factor?: number
  billing?: {
    table_fee: number
    merge_fee: number
    product_fee: number
    assistant_fee: number
    original_amount: number
    discount_amount: number
    discount_rate: number
    final_amount: number
    prepaid_hours: number
    prepaid_amount: string
    remaining_minutes: number
  }
  table?: {
    id: string
    name: string
    code: string
    type: string
    hourly_rate: string
    pricing_id: string
  }
}

export interface TableListResponse {
  data: Table[]
  pagination: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

export function getTableList(params: Record<string, any> = {}): Promise<TableListResponse> {
  return get('/mobile.Table/lists', params)
}

export function getTableDetail(tableId: string): Promise<Table> {
  return get('/mobile.Table/detail', { table_id: tableId })
}

export function getTableStats(): Promise<TableStats> {
  return get('/mobile.Table/stats')
}

export function openTable(data: { table_id: string; player_count?: number; operator_id?: string; operator_name?: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/open', data)
}

export function getCurrentOrder(tableId: string): Promise<Bill> {
  return get('/mobile.Order/current', { table_id: tableId })
}

export function getBill(orderId: string): Promise<Bill> {
  return get('/mobile.Order/bill', { order_id: orderId })
}

export function addProduct(data: { order_id: string; product_id: string; quantity?: number; remark?: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/addProduct', data)
}

export function removeProduct(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/removeProduct', { item_id: itemId })
}

export function deliverProduct(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/deliverProduct', { item_id: itemId })
}

export function addAssistant(data: { order_id: string; assistant_id: string; billing_mode?: string; buyout_hours?: number; pay_mode?: string; auto_start?: boolean; pay_channel?: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/addAssistant', data)
}

export function prepayAssistant(data: { order_id: string; assistant_id: string; buyout_hours: number; pay_channel: string; auto_start?: boolean }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/prepayAssistant', data)
}

export function confirmAssistant(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/confirmAssistant', { item_id: itemId })
}

export function startAssistant(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/startAssistant', { item_id: itemId })
}

export function endAssistant(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/endAssistant', { item_id: itemId })
}

export function cancelAssistant(itemId: string): Promise<Record<string, unknown>> {
  return post('/mobile.Order/cancelAssistant', { item_id: itemId })
}

export function changeTable(data: { order_id: string; target_table_id: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/changeTable', data)
}

export function mergeTable(data: { source_order_id: string; target_order_id: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/merge', data)
}

export function bindMember(data: { order_id: string; member_id: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/bindMember', data)
}

export interface CheckoutResult {
  final_amount: number
  change_amount: number
  payment_id?: string
}

export function checkout(data: { order_id: string; payment_method: string; final_amount: number }): Promise<CheckoutResult> {
  // Map to backend's per-method payment fields
  const params: Record<string, any> = { order_id: data.order_id }
  if (data.payment_method === 'cash') params.cash_paid = data.final_amount
  else if (data.payment_method === 'wechat') params.wechat_paid = data.final_amount
  return post('/mobile.Order/checkout', params)
}

export function getTableLog(params: { table_id?: string; order_id?: string }): Promise<TableLog[]> {
  return get('/mobile.Order/tableLog', params)
}

export function getPendingProducts(): Promise<PendingProduct[]> {
  return get('/mobile.Order/pendingItems')
}

export function getPendingAssistants(): Promise<PendingAssistant[]> {
  return get('/mobile.Order/pendingAssistants')
}

export function getProductList(params: Record<string, any> = {}): Promise<ProductItem[]> {
  return get('/mobile.Product/list', params)
}

export function getAssistantList(): Promise<AssistantItem[]> {
  return get('/mobile.Assistant/list')
}

export function searchMembers(keyword: string): Promise<MemberInfo[]> {
  return get('/pos.Member/search', { keyword })
}

// === 开台申请 ===
export interface OpenTableRequest {
  token: string
  tableName: string
  tableId: string
  playerCount: number
  expiresAt: number
  timeout: number
}

export function getPendingConfirmRequests(opts?: { showLoading?: boolean }): Promise<OpenTableRequest[]> {
  return get('/pos.Order/pendingConfirmRequests', undefined, opts)
}

export function confirmOpenRequest(data: { token: string; action: 'confirm' | 'reject' }): Promise<Record<string, unknown>> {
  return post('/pos.Order/confirmOpen', data)
}

// === 点单提醒（使用 wwwpos 端点） ===
export interface PendingDeliveryGroup {
  tableId: string
  tableName: string
  zoneName: string
  orderId: string
  items: PendingDeliveryItem[]
}

export interface PendingDeliveryItem {
  itemId: string
  itemName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  finalPrice: number
  status: string
  createdAt: string
  expiresAt?: string
}

export function getPendingDeliveriesV2(opts?: { showLoading?: boolean }): Promise<PendingDeliveryGroup[]> {
  return get('/pos.Order/pendingDeliveries', undefined, opts)
}

export function deliverItem(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/deliverItem', data)
}

export function cancelOrderItem(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/cancelItem', data)
}

// === 助教上桌提醒（使用 wwwpos 端点） ===
export interface PendingAssistantBooking {
  itemId: string
  orderId: string
  tableId: string
  tableName: string
  zoneName: string
  assistantId: string
  assistantName: string
  hourlyRate: number
  status: string
  createdAt: string
  expiresAt?: string
}

export function getPendingAssistantBookingsV2(opts?: { showLoading?: boolean }): Promise<PendingAssistantBooking[]> {
  return get('/pos.Order/pendingAssistantBookings', undefined, opts)
}

export function acceptAssistantBooking(data: { item_id: string }): Promise<Record<string, unknown>> {
  return post('/pos.Order/acceptAssistant', data)
}

// === 暂停/恢复计费 ===
export function pauseTableFee(data: { table_id: string; order_id: string }): Promise<{ paused_at: string; elapsed_minutes: number }> {
  return post('/mobile.Order/pauseTableFee', data)
}

export function resumeTableFee(data: { table_id: string; order_id: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/resumeTableFee', data)
}

export function pauseAssistantFee(orderId: string, itemId?: string): Promise<Record<string, unknown>> {
  const data: Record<string, string> = { order_id: orderId }
  if (itemId) data.item_id = itemId
  return post('/mobile.Order/pauseAssistantFee', data)
}

export function resumeAssistantFee(orderId: string, itemId?: string): Promise<Record<string, unknown>> {
  const data: Record<string, string> = { order_id: orderId }
  if (itemId) data.item_id = itemId
  return post('/mobile.Order/resumeAssistantFee', data)
}

// === 临时开台 ===
export function tempOpenTable(data: { table_id: string }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/tempOpen', data)
}

// === 结账（对齐 wwwpos checkout 参数） ===
export function checkoutOrder(data: {
  order_id: string
  cash_paid: number
  wechat_paid?: number
  alipay_paid?: number
  balance_paid?: number
  card_paid?: number
  discount?: number
  discount_type?: string
  discount_value?: number
  rounding_mode?: string
  channel?: string
  verify_code?: string
  pay_type: string
  pay_amount: number
  remark?: string
}): Promise<Record<string, unknown>> {
  return post('/pos.Order/checkout', data)
}

// === 折扣列表 ===
export interface DiscountItem {
  id: string
  discount_name: string
  discount_type: string
  discount_value: number
  rounding_mode?: string
  status?: number
}

export function getDiscountList(): Promise<DiscountItem[]> {
  return get('/mobile.Order/discountList')
}

export function addGiftHours(data: { item_id: string; gift_hours: number; overtime_hours?: number; hourly_rate?: number }): Promise<Record<string, unknown>> {
  return post('/mobile.Order/addGiftHours', data)
}
