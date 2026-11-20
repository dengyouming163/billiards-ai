import { get, post, put, del } from '@/api/request'
import type { Product, Category, Order, Assistant, AssistantLevel, Activity, ServiceCall, ScoreBoard, OrderItem, GameConfig } from '@/types'

const tabletApi = {
  getHomeData(): Promise<any> {
    return get('/tablet.Index/index')
  },

  getCategories(storeId?: string | number): Promise<Category[]> {
    const params: Record<string, string> = {}
    if (storeId) params.store_id = String(storeId)
    return get('/tablet.Product/categories', params)
  },

  getProducts(storeId?: string | number, categoryId?: string, keyword?: string): Promise<Product[]> {
    const params: Record<string, string> = {}
    if (storeId) params.store_id = String(storeId)
    if (categoryId) params.category_id = categoryId
    if (keyword) params.keyword = keyword
    return get('/tablet.Product/list', params)
  },

  getProductDetail(productId: string): Promise<Product> {
    return get('/tablet.Product/detail', { product_id: productId })
  },

  getActivities(): Promise<{ featured: Activity; list: Activity[] }> {
    return get('/tablet.Index/getActivities')
  },

  getTableStatus(): Promise<{ tables: any[] }> {
    return get('/tablet.Index/getTableStatus')
  },

  quickCreateOrder(params: { table_id: string; player_count?: number }): Promise<Order> {
    return post('/tablet.Order/quickCreate', params)
  },

  prepaidCreateOrder(params: { table_id: string; prepaid_hours: number; player_count?: number }): Promise<Order> {
    return post('/tablet.Order/prepaidCreate', params)
  },

  createOrder(params: { table_id: string; prepaid_hours?: number; player_count?: number }): Promise<Order> {
    return post('/tablet.Order/create', params)
  },

  getOrder(orderId: string): Promise<Order> {
    return get('/tablet.Order/getOrder', { order_id: orderId })
  },

  getTableOrder(tableId?: string, options?: any): Promise<Order> {
    const params = tableId ? { table_id: tableId } : {}
    return get('/tablet.Order/getTableOrder', params, options)
  },

  getTableOrders(tableId?: string): Promise<Order[]> {
    const params = tableId ? { table_id: tableId } : {}
    return get('/tablet.Order/getTableOrders', params)
  },

  tickOrder(orderId: string): Promise<{ duration_minutes: number; duration_formatted: string; remaining_minutes: number }> {
    return post('/tablet.Order/tick', { order_id: orderId })
  },

  addOrderItem(params: { order_id: string; product_id: string; quantity: number; remark?: string }): Promise<any> {
    return post('/tablet.Order/addProductItem', params)
  },

  getPendingItems(): Promise<{ list: any[]; total: number }> {
    return get('/tablet.Order/pendingItems')
  },

  acceptItem(params: { item_id: string; employee_id: string }): Promise<any> {
    return post('/tablet.Order/acceptItem', params)
  },

  deliverItem(params: { item_id: string }): Promise<any> {
    return post('/tablet.Order/deliverItem', params)
  },

  createPreOrder(params: { order_id: string; items: Array<{ product_id: string; quantity: number; remark?: string }> }): Promise<any> {
    return post('/tablet.Order/createPreOrder', params)
  },

  confirmPreOrder(params: { preorder_group_id: string; employee_id?: string }): Promise<any> {
    return post('/tablet.Order/confirmPreOrder', params)
  },

  rejectPreOrder(params: { preorder_group_id: string }): Promise<any> {
    return post('/tablet.Order/rejectPreOrder', params)
  },

  getPreOrders(orderId: string): Promise<{ groups: any[] }> {
    return get('/tablet.Order/getPreOrders', { order_id: orderId })
  },

  getNotifications(lastTime?: string): Promise<{ has_new: boolean; notifications: any[] }> {
    const params = lastTime ? { last_time: lastTime } : {}
    return get('/tablet.Order/notifications', params)
  },

  updateOrderItem(params: { item_id: string; quantity: number }): Promise<void> {
    return put('/tablet.Order/updateItem', params)
  },

  removeOrderItem(itemId: string): Promise<void> {
    return del('/tablet.Order/removeItem', { item_id: itemId })
  },

  checkout(params: { order_id: string; pay_type?: string }): Promise<void> {
    return post('/tablet.Order/checkout', params)
  },

  mergeCheckout(params: { order_ids: string[]; pay_type?: string }): Promise<void> {
    return post('/tablet.Order/mergeCheckout', params)
  },

  closeOrder(orderId: string): Promise<void> {
    return post('/tablet.Order/close', { order_id: orderId })
  },

  getAssistants(): Promise<Assistant[]> {
    return get('/tablet.Assistant/list')
  },

  getAssistantLevels(): Promise<AssistantLevel[]> {
    return get('/tablet.Assistant/levels')
  },

  createAssistantOrder(params: { assistant_id: string; service_type: string; duration: number; student_name?: string; student_phone?: string }): Promise<any> {
    return post('/tablet.Assistant/createOrder', params)
  },

  getAssistantOrderStatus(params: { order_id: string }): Promise<any> {
    return get('/tablet.Assistant/getOrderStatus', params)
  },

  cancelAssistantOrder(params: { order_id: string }): Promise<void> {
    return post('/tablet.Assistant/cancelOrder', params)
  },

  getAssistantOrder(assistantOrderId: string): Promise<any> {
    return get('/tablet.Assistant/getOrder', { assistant_order_id: assistantOrderId })
  },

  getGameConfigs(): Promise<GameConfig[]> {
    return get('/tablet.Score/gameConfigs')
  },

  getGameRules(gameType: string): Promise<{ config: any; rules: any; balls: any[] }> {
    return get('/tablet.Score/rules', { game_type: gameType })
  },

  createScoreBoard(params: { 
    game_type: string; 
    player1_name: string; 
    player2_name: string; 
    player_count?: number 
  }): Promise<ScoreBoard> {
    return post('/tablet.Score/create', params)
  },

  getScoreBoard(): Promise<ScoreBoard | null> {
    return get('/tablet.Score/get')
  },

  sinkBall(params: { score_board_id: string; ball_id: string | number }): Promise<{ 
    score_board: ScoreBoard; 
    is_game_over: boolean; 
    winner: number | null;
    points: number;
  }> {
    return post('/tablet.Score/sinkBall', params)
  },

  foul(params: { score_board_id: string }): Promise<ScoreBoard> {
    return post('/tablet.Score/foul', params)
  },

  switchPlayer(params: { score_board_id: string }): Promise<ScoreBoard> {
    return post('/tablet.Score/switchPlayer', params)
  },

  endGame(params?: { score_board_id?: string }): Promise<ScoreBoard> {
    return post('/tablet.Score/endGame', params || {})
  },

  resetScoreBoard(tableId?: string): Promise<void> {
    return post('/tablet.Score/reset', tableId ? { table_id: tableId } : {})
  },

  updateScore(params: { score_id: string; player: number; points: number }): Promise<ScoreBoard> {
    return post('/tablet.ScoreBoard/updateScore', params)
  },

  callService(params: { service_type: string; remark?: string }): Promise<ServiceCall> {
    return post('/tablet.ServiceCall/create', params)
  },

  getServiceCalls(): Promise<ServiceCall[]> {
    return get('/tablet.ServiceCall/lists')
  },

  getServiceTypes(): Promise<any[]> {
    return get('/tablet.ServiceType/lists')
  },

  getCallStatus(callId: string): Promise<ServiceCall> {
    return get('/tablet.ServiceCall/getCallStatus', { call_id: callId })
  },

  cancelCall(callId: string): Promise<void> {
    return post('/tablet.ServiceCall/cancelCall', { call_id: callId })
  },

  evaluateService(params: {
    call_id: string
    service_attitude: number
    service_speed: number
    service_professional: number
    feedback?: string
  }): Promise<any> {
    return post('/tablet.ServiceEvaluate/create', params)
  },

  getBill(orderId: string): Promise<any> {
    return get('/tablet.Bill/getBill', { order_id: orderId })
  },

  payBill(params: { order_id: string; pay_type: string }): Promise<void> {
    return post('/tablet.Bill/pay', params)
  },

  getOrderBill(orderId: string): Promise<any> {
    return get('/tablet.Order/getBill', { order_id: orderId })
  },

  getOrderFee(orderId: string): Promise<{ 
    order_id: string; 
    fee: number; 
    duration_minutes: number; 
    pricing_info: any; 
    current_rate: number; 
  }> {
    return get('/tablet.Order/getOrderFee', { order_id: orderId })
  },

  getTableRate(tableId: string): Promise<{ table_id: string; current_rate: number }> {
    return get('/tablet.Order/getOrderFee', { table_id: tableId })
  },

  getMergeableOrders(): Promise<any[]> {
    return get('/tablet.Order/getMergeableOrders')
  },

  mergeOrders(orderIds: string[]): Promise<any> {
    return post('/tablet.Order/merge', { order_ids: orderIds })
  },

  getAvailableTables(): Promise<any[]> {
    return get('/tablet.Order/getAvailableTables')
  },

  changeTable(orderId: string, newTableId: string): Promise<any> {
    return post('/tablet.Order/changeTable', { order_id: orderId, new_table_id: newTableId })
  },

  cancelOrder(orderId: string, params?: { reason?: string }): Promise<any> {
    return post('/tablet.Order/cancel', { order_id: orderId, ...params })
  },

  bookAssistant(params: { order_id: string; assistant_id: string; duration?: number }): Promise<any> {
    return post('/tablet.Order/bookAssistant', params)
  },

  acceptAssistant(params: { item_id: string; employee_id?: string }): Promise<any> {
    return post('/tablet.Order/acceptAssistant', params)
  },

  startAssistantService(item_id: string): Promise<any> {
    return post('/tablet.Order/startAssistantService', { item_id })
  },

  endAssistantService(item_id: string): Promise<any> {
    return post('/tablet.Order/endAssistantService', { item_id })
  },

  cancelAssistant(item_id: string): Promise<any> {
    return post('/tablet.Order/cancelAssistant', { item_id })
  },

  getAssistantOrders(order_id: string): Promise<any> {
    return get('/tablet.Order/getAssistantOrders', { order_id }, { showLoading: false })
  },

  // ======== 支付相关 API (走根路径，不在 /storeapi 组内) ========
  /** 准备结算 — 获取锁价 token */
  preparePayment(orderId: string): Promise<{ token: string; amount: number; breakdown: any; expires_at: string }> {
    return post('/payment/prepare', { order_id: orderId }, { baseURL: PAYMENT_BASE, skipTableId: true })
  },

  /** 创建支付（NATIVE扫码付） */
  createPayment(params: Record<string, unknown>): Promise<{
    payment_id: string; pay_url: string; qr_code: string; record_id: string;
  }> {
    return post('/payment/create', params, { baseURL: PAYMENT_BASE, skipTableId: true })
  },

  /** 被扫支付（扫码枪） */
  barcodePay(params: { auth_code: string; amount: number; order_id: string; description: string }): Promise<{
    success: boolean; payment_id: string;
  }> {
    return post('/payment/barcodePay', params, { baseURL: PAYMENT_BASE, skipTableId: true })
  },

  /** 查询支付状态 */
  queryPayment(order_id: string): Promise<{
    status: string; paid_amount: number; payment_id: string;
  }> {
    return get('/payment/query', { order_id }, { baseURL: PAYMENT_BASE, skipTableId: true })
  },

  /** 创建退款 */
  createRefund(params: { order_id: string; amount: number; reason: string }): Promise<{
    success: boolean; refund_id: string; payment_id: string;
  }> {
    return post('/payment/refund', params, { baseURL: PAYMENT_BASE, skipTableId: true })
  },

  /** 获取礼物类型列表 */
  getGiftTypes(): Promise<any[]> {
    return get('/gift.Gift/types')
  },

  // ======== 会员 API ========
  /** 搜索会员 */
  searchMembers(keyword: string): Promise<{ id: string; name: string; level: string; phone: string }[]> {
    return get('/tablet.Member/search', { keyword })
  },

  /** 绑定会员到订单 (by member_id) */
  bindMember(params: { order_id: string; member_id: string }): Promise<any> {
    return post('/tablet.Order/bindMember', params)
  },

  /** 绑定会员到订单 (by phone) */
  bindMemberByPhone(params: { order_id: string; phone: string }): Promise<any> {
    return post('/tablet.Order/bindMember', params)
  },

  /** 送礼物 */
  sendGift(params: { assistant_id: string; gift_name: string; gift_icon: string; quantity: number; order_id?: string }): Promise<any> {
    return post('/tablet.Assistant/sendGift', params)
  },

  // ======== 充电 API ========
  getChargingConfig(): Promise<{ enabled: boolean; rate_per_hour: number; billing_unit: string; free_minutes: number; auto_start: boolean }> {
    return get('/tablet.Charging/config')
  },
  startCharging(params: { order_id: string; table_id: string; port: string }): Promise<any> {
    return post('/tablet.Charging/start', params)
  },
  stopCharging(params: { order_id: string; port: string }): Promise<any> {
    return post('/tablet.Charging/stop', params)
  },
  getChargingStatus(orderId: string): Promise<{ sessions: any[]; total_fee: number }> {
    return get('/tablet.Charging/status', { order_id: orderId })
  },
}

// 支付接口走根路径 https://poolapi.kyyp.cn（不在 /storeapi 组内，LoginMiddleware 免检）
const PAYMENT_BASE = 'https://poolapi.kyyp.cn'

export { tabletApi }