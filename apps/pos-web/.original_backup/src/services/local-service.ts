// ============================================================
// 本地服务实现 - 使用内存 + 静态数据
// ============================================================
// 此实现完全在客户端运行，使用 mock-data 初始化，
// 所有状态保存在内存中。适合开发和演示使用。
// 迁移后端时，只需创建新的 ApiService 实现并替换 Provider 即可。
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
  OrderItem,
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
import {
  mockTables,
  mockZones,
  mockAssistants,
  mockProducts,
  mockCategories,
  mockMembers,
  mockTechnicians,
  mockPackages,
  mockPromotions,
  mockReservations,
  mockTimeSlots,
} from '@/data/mock-data';
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
// 内存存储
// ============================================================

let tables: Table[] = [...mockTables];
let assistants: Assistant[] = [...mockAssistants];
let products: Product[] = [...mockProducts];
let categories: ProductCategory[] = [...mockCategories];
let members: Member[] = [...mockMembers];
let orders: Order[] = [];
let payments: Payment[] = [];
let technicians: Technician[] = [...mockTechnicians];
let packageList: Package[] = [...mockPackages];
let promotions: Promotion[] = [...mockPromotions];
let reservations: Reservation[] = [...mockReservations];
let timeSlots: TimeSlot[] = [...mockTimeSlots];
let currentShift: Shift | null = null;
let billingMode: BillingMode = 'hourly';

// ============================================================
// 工具函数
// ============================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ============================================================
// TableService 实现
// ============================================================

const localTableService: TableService = {
  async getTables() {
    return [...tables];
  },

  async openTable(tableId: string, session: Session): Promise<Table> {
    const table = tables.find((t) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const updated: Table = { ...table, status: 'inuse', currentSession: session };
    tables = tables.map((t) => (t.id === tableId ? updated : t));
    return updated;
  },

  async closeTable(tableId: string): Promise<Table> {
    const table = tables.find((t) => t.id === tableId);
    if (!table) throw new Error('Table not found');

    const updated: Table = { ...table, status: 'idle', currentSession: undefined };
    tables = tables.map((t) => (t.id === tableId ? updated : t));
    return updated;
  },

  async updateTable(table: Table): Promise<Table> {
    tables = tables.map((t) => (t.id === table.id ? table : t));
    return table;
  },

  async transferTable(fromTableId: string, toTableId: string): Promise<{ from: Table; to: Table }> {
    const fromTable = tables.find((t) => t.id === fromTableId);
    const toTable = tables.find((t) => t.id === toTableId);
    if (!fromTable || !toTable) throw new Error('Table not found');
    if (toTable.status !== 'idle') throw new Error('Target table is not available');

    const updatedFrom: Table = { ...fromTable, status: 'idle', currentSession: undefined };
    const updatedTo: Table = {
      ...toTable,
      status: 'inuse',
      currentSession: fromTable.currentSession
        ? { ...fromTable.currentSession, tableId: toTableId }
        : undefined,
    };

    tables = tables.map((t) => {
      if (t.id === fromTableId) return updatedFrom;
      if (t.id === toTableId) return updatedTo;
      return t;
    });

    return { from: updatedFrom, to: updatedTo };
  },

  async mergeTables(sourceTableId: string, targetTableId: string): Promise<{ source: Table; target: Table }> {
    const sourceTable = tables.find((t) => t.id === sourceTableId);
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!sourceTable?.currentSession || !targetTable?.currentSession) {
      throw new Error('Both tables must have active sessions');
    }

    const updatedSource: Table = { ...sourceTable, status: 'idle', currentSession: undefined };
    const mergedSession = {
      ...targetTable.currentSession,
      customerCount: targetTable.currentSession.customerCount + sourceTable.currentSession.customerCount,
    };
    const updatedTarget: Table = { ...targetTable, currentSession: mergedSession };

    tables = tables.map((t) => {
      if (t.id === sourceTableId) return updatedSource;
      if (t.id === targetTableId) return updatedTarget;
      return t;
    });

    return { source: updatedSource, target: updatedTarget };
  },

  async assignAssistant(tableId: string, assistantId: string, assistantName: string): Promise<Table> {
    const table = tables.find((t) => t.id === tableId);
    if (!table?.currentSession) throw new Error('Table has no active session');

    const updatedSession = { ...table.currentSession, assistantId, assistantName };
    const updated: Table = { ...table, currentSession: updatedSession };
    tables = tables.map((t) => (t.id === tableId ? updated : t));
    return updated;
  },

  async removeAssistant(tableId: string): Promise<Table> {
    const table = tables.find((t) => t.id === tableId);
    if (!table?.currentSession) throw new Error('Table has no active session');

    const updatedSession = { ...table.currentSession, assistantId: undefined, assistantName: undefined };
    const updated: Table = { ...table, currentSession: updatedSession };
    tables = tables.map((t) => (t.id === tableId ? updated : t));
    return updated;
  },
};

// ============================================================
// AssistantService 实现
// ============================================================

const localAssistantService: AssistantService = {
  async getAssistants() {
    return [...assistants];
  },

  async updateAssistant(assistant: Assistant): Promise<Assistant> {
    assistants = assistants.map((a) => (a.id === assistant.id ? assistant : a));
    return assistant;
  },
};

// ============================================================
// ProductService 实现
// ============================================================

const localProductService: ProductService = {
  async getProducts() {
    return [...products];
  },

  async getCategories() {
    return [...categories];
  },
};

// ============================================================
// OrderService 实现
// ============================================================

const localOrderService: OrderService = {
  async getOrders(filter?: { tableId?: string; sessionId?: string }): Promise<Order[]> {
    let filtered = [...orders];
    if (filter?.tableId) {
      filtered = filtered.filter((o) => o.tableId === filter.tableId);
    }
    if (filter?.sessionId) {
      filtered = filtered.filter((o) => o.sessionId === filter.sessionId);
    }
    return filtered;
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Order> {
    const order: Order = {
      ...orderData,
      id: generateId('o'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };
    orders = [...orders, order];
    return order;
  },

  async updateOrder(order: Order): Promise<Order> {
    orders = orders.map((o) => (o.id === order.id ? order : o));
    return order;
  },
};

// ============================================================
// PaymentService 实现
// ============================================================

const mockCoupons: Record<string, Coupon> = {
  MT2024001: {
    id: 'c1',
    code: 'MT2024001',
    name: '美团-台球2小时体验券',
    platform: 'meituan',
    originalPrice: 80,
    actualPrice: 60,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'unused',
  },
  DY2024001: {
    id: 'c2',
    code: 'DY2024001',
    name: '抖音-畅打4小时券',
    platform: 'douyin',
    originalPrice: 120,
    actualPrice: 99,
    validFrom: '2024-01-01',
    validUntil: '2024-12-31',
    status: 'unused',
  },
};

const localPaymentService: PaymentService = {
  async getPayments(filter?: { orderId?: string }): Promise<Payment[]> {
    let filtered = [...payments];
    if (filter?.orderId) {
      filtered = filtered.filter((p) => p.orderId === filter.orderId);
    }
    return filtered;
  },

  async createPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const payment: Payment = {
      ...paymentData,
      id: generateId('p'),
      createdAt: new Date().toISOString(),
    };
    payments = [...payments, payment];
    return payment;
  },

  async validateCoupon(code: string): Promise<Coupon | null> {
    return mockCoupons[code] || null;
  },
};

// ============================================================
// MemberService 实现
// ============================================================

const localMemberService: MemberService = {
  async getMembers(): Promise<Member[]> {
    return [...members];
  },

  async findMemberByPhone(phone: string): Promise<Member | null> {
    return members.find((m) => m.phone.includes(phone.replace(/\*/g, ''))) || null;
  },

  async createMember(data: { phone: string; name: string; level: MemberLevel }): Promise<Member> {
    const member: Member = {
      id: generateId('m'),
      ...data,
      balance: 0,
      points: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    members = [...members, member];
    return member;
  },

  async updateMember(member: Member): Promise<Member> {
    members = members.map((m) => (m.id === member.id ? member : m));
    return member;
  },

  async rechargeMember(memberId: string, amount: number, bonus: number, points: number): Promise<Member> {
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const updated: Member = {
      ...member,
      balance: member.balance + amount + bonus,
      points: member.points + points,
      updatedAt: new Date().toISOString(),
    };
    members = members.map((m) => (m.id === memberId ? updated : m));
    return updated;
  },

  async deductMemberBalance(memberId: string, amount: number): Promise<Member> {
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const updated: Member = {
      ...member,
      balance: member.balance - amount,
      updatedAt: new Date().toISOString(),
    };
    members = members.map((m) => (m.id === memberId ? updated : m));
    return updated;
  },

  async deductMemberPoints(memberId: string, points: number): Promise<Member> {
    const member = members.find((m) => m.id === memberId);
    if (!member) throw new Error('Member not found');

    const updated: Member = {
      ...member,
      points: member.points - points,
      updatedAt: new Date().toISOString(),
    };
    members = members.map((m) => (m.id === memberId ? updated : m));
    return updated;
  },
};

// ============================================================
// ShiftService 实现
// ============================================================

const localShiftService: ShiftService = {
  async getCurrentShift(): Promise<Shift | null> {
    return currentShift;
  },

  async getShifts(): Promise<Shift[]> {
    return currentShift ? [currentShift] : [];
  },

  async startShift(operatorId: string, operatorName: string, openingCash: number): Promise<Shift> {
    if (currentShift) throw new Error('A shift is already in progress');

    currentShift = {
      id: generateId('sh'),
      operatorId,
      operatorName,
      startTime: new Date().toISOString(),
      openingCash,
      totalSales: 0,
      totalOrders: 0,
      cashSales: 0,
      electronicSales: 0,
      memberRecharge: 0,
      couponCount: 0,
      openTables: 0,
      closeTables: 0,
      status: 'open',
    };
    return currentShift;
  },

  async endShift(closingCash: number, shift: Shift): Promise<Shift> {
    const completedShift: Shift = {
      ...shift,
      endTime: new Date().toISOString(),
      closingCash,
      cashDifference: closingCash - shift.openingCash,
      status: 'closed',
    };
    currentShift = null;
    return completedShift;
  },
};

// ============================================================
// ReservationService 实现
// ============================================================

const localReservationService: ReservationService = {
  async getReservations(): Promise<Reservation[]> {
    return [...reservations];
  },

  async createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation> {
    const reservation: Reservation = {
      ...data,
      id: generateId('res'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reservations = [...reservations, reservation];
    return reservation;
  },

  async updateReservation(reservation: Reservation): Promise<Reservation> {
    reservations = reservations.map((r) => (r.id === reservation.id ? reservation : r));
    return reservation;
  },

  async cancelReservation(reservationId: string): Promise<void> {
    reservations = reservations.map((r) =>
      r.id === reservationId ? { ...r, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : r
    );
  },
};

// ============================================================
// PromotionService 实现
// ============================================================

const localPromotionService: PromotionService = {
  async getPromotions(): Promise<Promotion[]> {
    return [...promotions];
  },

  async applyPromotion(promotionId: string, amount: number): Promise<{ discountedAmount: number; promotion: Promotion }> {
    const promotion = promotions.find((p) => p.id === promotionId);
    if (!promotion) return { discountedAmount: amount, promotion: promotions[0] };

    let discountedAmount = amount;
    if (promotion.discountType === 'rate') {
      discountedAmount = amount * promotion.discountValue;
    } else {
      discountedAmount = Math.max(0, amount - promotion.discountValue);
    }

    if (promotion.maxDiscount) {
      discountedAmount = Math.max(amount - promotion.maxDiscount, discountedAmount);
    }

    return { discountedAmount, promotion };
  },
};

// ============================================================
// BillingService 实现
// ============================================================

const localBillingService: BillingService = {
  async getTimeSlots(): Promise<TimeSlot[]> {
    return [...timeSlots];
  },

  getTableRate(tableId: string, allTables: Table[], allTimeSlots: TimeSlot[]): number {
    const table = allTables.find((t) => t.id === tableId);
    if (!table) return 40;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const matchingSlot = allTimeSlots.find((slot) => {
      const isMatch = hour >= slot.startHour && hour < slot.endHour;
      const typeMatch = isWeekend ? slot.isWeekend : !slot.isHoliday && !slot.isWeekend;
      return isMatch && typeMatch;
    });

    if (matchingSlot) {
      return table.type === 'vip' ? matchingSlot.rates.vip : matchingSlot.rates.standard;
    }

    return table.hourlyRate;
  },

  calculateSessionFee(tableId: string, startTime: string, allTables: Table[], allTimeSlots: TimeSlot[]): number {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - start) / (1000 * 60));
    const rate = localBillingService.getTableRate(tableId, allTables, allTimeSlots);
    return Math.ceil(minutes / 15) * Math.round(rate / 4);
  },

  async setBillingMode(mode: BillingMode): Promise<void> {
    billingMode = mode;
  },
};

// ============================================================
// SyncService 实现
// ============================================================

const localSyncService: SyncService = {
  async syncOfflineOperations(operations: OfflineOperation[]): Promise<{ id: string; success: boolean; error?: string }[]> {
    // 本地实现直接返回全部成功
    return operations.map((op) => ({ id: op.id, success: true }));
  },
};

// ============================================================
// 聚合服务
// ============================================================

export const localAppService: AppService = {
  async loadInitialData(): Promise<InitialData> {
    return {
      tables: [...tables],
      zones: [...mockZones],
      assistants: [...assistants],
      products: [...products],
      categories: [...categories],
      members: [...members],
      technicians: [...technicians],
      packages: [...packageList],
      promotions: [...promotions],
      reservations: [...reservations],
      timeSlots: [...timeSlots],
    };
  },

  table: localTableService,
  assistant: localAssistantService,
  product: localProductService,
  order: localOrderService,
  payment: localPaymentService,
  member: localMemberService,
  shift: localShiftService,
  reservation: localReservationService,
  promotion: localPromotionService,
  billing: localBillingService,
  sync: localSyncService,
};
