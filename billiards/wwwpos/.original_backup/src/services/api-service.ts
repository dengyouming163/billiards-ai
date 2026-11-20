// ============================================================
// API 服务实现 - 通过 HTTP 调用后端 API
// ============================================================
// 此实现用于后端 API 迁移后的生产环境。
// 将 localAppService 替换为 apiAppService 即可切换到远程后端。
// ============================================================

import type {
  Table,
  Zone,
  Assistant,
  Product,
  ProductCategory,
  Member,
  MemberLevel,
  Order,
  Payment,
  Shift,
  Technician,
  Package,
  Promotion,
  Reservation,
  TimeSlot,
  BillingMode,
  Coupon,
  Session,
  OfflineOperation,
} from '@/types';
import type {
  AppService,
  InitialData,
  TableService,
  AssistantService,
  ProductService,
  OrderService,
  PaymentService,
  MemberService,
  ShiftService,
  ReservationService,
  PromotionService,
  BillingService,
  SyncService,
} from './types';

// ============================================================
// API 基础配置
// ============================================================

const API_BASE = '/api';

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API request failed');
  return json.data as T;
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API request failed');
  return json.data as T;
}

async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API request failed');
  return json.data as T;
}

// ============================================================
// TableService - API 实现
// ============================================================

const apiTableService: TableService = {
  async getTables() {
    return apiGet<Table[]>(`${API_BASE}/tables`);
  },

  async openTable(tableId, session) {
    const data = await apiPost<Table>(`${API_BASE}/tables`, {
      action: 'open',
      tableId,
      customerCount: session.customerCount,
      assistantId: session.assistantId,
      pricingPackageId: session.pricingPackageId,
    });
    return data;
  },

  async closeTable(tableId) {
    const data = await apiPost<Table>(`${API_BASE}/tables`, { action: 'close', tableId });
    return data;
  },

  async updateTable(table) {
    const data = await apiPut<Table>(`${API_BASE}/tables`, table);
    return data;
  },

  async transferTable(fromTableId, toTableId) {
    const data = await apiPost<{ from: Table; to: Table }>(`${API_BASE}/tables`, {
      action: 'transfer',
      fromTableId,
      toTableId,
    });
    return data;
  },

  async mergeTables(sourceTableId, targetTableId) {
    const data = await apiPost<{ source: Table; target: Table }>(`${API_BASE}/tables`, {
      action: 'merge',
      sourceTableId,
      targetTableId,
    });
    return data;
  },

  async assignAssistant(tableId, assistantId, assistantName) {
    const data = await apiPost<Table>(`${API_BASE}/tables`, {
      action: 'assign_assistant',
      tableId,
      assistantId,
      assistantName,
    });
    return data;
  },

  async removeAssistant(tableId) {
    const data = await apiPost<Table>(`${API_BASE}/tables`, { action: 'remove_assistant', tableId });
    return data;
  },
};

// ============================================================
// AssistantService - API 实现
// ============================================================

const apiAssistantService: AssistantService = {
  async getAssistants() {
    // 助教数据包含在 tables API 或有独立端点
    return apiGet<Assistant[]>(`${API_BASE}/tables`).then(() => [] as Assistant[]);
    // TODO: 实现独立的 /api/assistants 端点后替换
  },

  async updateAssistant(assistant) {
    return apiPut<Assistant>(`${API_BASE}/assistants/${assistant.id}`, assistant);
  },
};

// ============================================================
// ProductService - API 实现
// ============================================================

const apiProductService: ProductService = {
  async getProducts() {
    return apiGet<Product[]>(`${API_BASE}/products`);
  },

  async getCategories() {
    return apiGet<ProductCategory[]>(`${API_BASE}/products/categories`);
  },
};

// ============================================================
// OrderService - API 实现
// ============================================================

const apiOrderService: OrderService = {
  async getOrders(filter?) {
    return apiGet<Order[]>(`${API_BASE}/orders`, {
      tableId: filter?.tableId || '',
      sessionId: filter?.sessionId || '',
    });
  },

  async createOrder(orderData) {
    return apiPost<Order>(`${API_BASE}/orders`, orderData);
  },

  async updateOrder(order) {
    return apiPut<Order>(`${API_BASE}/orders/${order.id}`, order);
  },
};

// ============================================================
// PaymentService - API 实现
// ============================================================

const apiPaymentService: PaymentService = {
  async getPayments(filter?) {
    return apiGet<Payment[]>(`${API_BASE}/payments`, { orderId: filter?.orderId || '' });
  },

  async createPayment(paymentData) {
    return apiPost<Payment>(`${API_BASE}/payments`, paymentData);
  },

  async validateCoupon(code) {
    return apiPost<Coupon | null>(`${API_BASE}/payments/validate-coupon`, { code });
  },
};

// ============================================================
// MemberService - API 实现
// ============================================================

const apiMemberService: MemberService = {
  async getMembers() {
    return apiGet<Member[]>(`${API_BASE}/members`);
  },

  async findMemberByPhone(phone) {
    return apiGet<Member | null>(`${API_BASE}/members`, { phone });
  },

  async createMember(data) {
    return apiPost<Member>(`${API_BASE}/members`, data);
  },

  async updateMember(member) {
    return apiPut<Member>(`${API_BASE}/members/${member.id}`, member);
  },

  async rechargeMember(memberId, amount, bonus, points) {
    return apiPost<Member>(`${API_BASE}/members/${memberId}/recharge`, { amount, bonus, points });
  },

  async deductMemberBalance(memberId, amount) {
    return apiPost<Member>(`${API_BASE}/members/${memberId}/deduct-balance`, { amount });
  },

  async deductMemberPoints(memberId, points) {
    return apiPost<Member>(`${API_BASE}/members/${memberId}/deduct-points`, { points });
  },
};

// ============================================================
// ShiftService - API 实现
// ============================================================

const apiShiftService: ShiftService = {
  async getCurrentShift() {
    return apiGet<Shift | null>(`${API_BASE}/shifts`, { status: 'open' });
  },

  async getShifts() {
    return apiGet<Shift[]>(`${API_BASE}/shifts`);
  },

  async startShift(operatorId, operatorName, openingCash) {
    return apiPost<Shift>(`${API_BASE}/shifts`, { action: 'start', operatorId, operatorName, openingCash });
  },

  async endShift(closingCash, shift) {
    return apiPost<Shift>(`${API_BASE}/shifts`, { action: 'end', closingCash, shiftId: shift.id });
  },
};

// ============================================================
// ReservationService - API 实现
// ============================================================

const apiReservationService: ReservationService = {
  async getReservations() {
    return apiGet<Reservation[]>(`${API_BASE}/reservations`);
  },

  async createReservation(data) {
    return apiPost<Reservation>(`${API_BASE}/reservations`, data);
  },

  async updateReservation(reservation) {
    return apiPut<Reservation>(`${API_BASE}/reservations/${reservation.id}`, reservation);
  },

  async cancelReservation(reservationId) {
    await apiPost<void>(`${API_BASE}/reservations/${reservationId}/cancel`);
  },
};

// ============================================================
// PromotionService - API 实现
// ============================================================

const apiPromotionService: PromotionService = {
  async getPromotions() {
    return apiGet<Promotion[]>(`${API_BASE}/promotions`);
  },

  async applyPromotion(promotionId, amount) {
    return apiPost<{ discountedAmount: number; promotion: Promotion }>(`${API_BASE}/promotions/apply`, {
      promotionId,
      amount,
    });
  },
};

// ============================================================
// BillingService - API 实现
// ============================================================

const apiBillingService: BillingService = {
  async getTimeSlots() {
    return apiGet<TimeSlot[]>(`${API_BASE}/billing/time-slots`);
  },

  getTableRate(tableId, _allTables, _allTimeSlots) {
    // API 模式下可以远程调用，这里先用本地计算
    // 后续可替换为 apiGet<number>(`${API_BASE}/billing/rate`, { tableId })
    return 40;
  },

  calculateSessionFee(tableId, startTime, _allTables, _allTimeSlots) {
    // API 模式下可以远程调用
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - start) / (1000 * 60));
    return Math.ceil(minutes / 15) * 10;
  },

  async setBillingMode(mode) {
    await apiPost<void>(`${API_BASE}/billing/mode`, { mode });
  },
};

// ============================================================
// SyncService - API 实现
// ============================================================

const apiSyncService: SyncService = {
  async syncOfflineOperations(operations) {
    return apiPost<{ id: string; success: boolean; error?: string }[]>(`${API_BASE}/sync`, { operations });
  },
};

// ============================================================
// 聚合服务
// ============================================================

export const apiAppService: AppService = {
  async loadInitialData(): Promise<InitialData> {
    // 并行加载所有初始数据
    const [tablesData, membersData] = await Promise.all([
      apiGet<Table[]>(`${API_BASE}/tables`),
      apiGet<Member[]>(`${API_BASE}/members`),
    ]);

    // TODO: 添加更多并行加载端点
    return {
      tables: tablesData,
      zones: [],
      assistants: [],
      products: [],
      categories: [],
      members: membersData,
      technicians: [],
      packages: [],
      promotions: [],
      reservations: [],
      timeSlots: [],
    };
  },

  table: apiTableService,
  assistant: apiAssistantService,
  product: apiProductService,
  order: apiOrderService,
  payment: apiPaymentService,
  member: apiMemberService,
  shift: apiShiftService,
  reservation: apiReservationService,
  promotion: apiPromotionService,
  billing: apiBillingService,
  sync: apiSyncService,
};
