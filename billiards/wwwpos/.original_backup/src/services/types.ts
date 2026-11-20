// ============================================================
// 服务层接口定义 - 商业台球系统
// ============================================================
// 所有后端数据操作统一通过此接口抽象，
// 前端组件只依赖接口，不依赖具体实现。
// 迁移后端时只需替换 ServiceProvider 中的实现即可。
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
  ConsumptionRecord,
  CheckoutRecord,
  OfflineOperation,
} from '@/types';

// --------------------------------------------------
// 初始数据（应用启动时加载）
// --------------------------------------------------
export interface InitialData {
  tables: Table[];
  zones: Zone[];
  assistants: Assistant[];
  products: Product[];
  categories: ProductCategory[];
  members: Member[];
  technicians: Technician[];
  packages: Package[];
  promotions: Promotion[];
  reservations: Reservation[];
  timeSlots: TimeSlot[];
}

// --------------------------------------------------
// 台球桌服务
// --------------------------------------------------
export interface TableService {
  /** 获取所有台球桌 */
  getTables(): Promise<Table[]>;
  /** 开台 */
  openTable(tableId: string, session: Session): Promise<Table>;
  /** 关台 */
  closeTable(tableId: string): Promise<Table>;
  /** 更新台球桌状态 */
  updateTable(table: Table): Promise<Table>;
  /** 换台：将 fromTable 的 session 转移到 toTable */
  transferTable(fromTableId: string, toTableId: string): Promise<{ from: Table; to: Table }>;
  /** 并台：将 sourceTable 合并到 targetTable，sourceTable 变为空闲 */
  mergeTables(sourceTableId: string, targetTableId: string): Promise<{ source: Table; target: Table }>;
  /** 助教上桌 */
  assignAssistant(tableId: string, assistantId: string, assistantName: string): Promise<Table>;
  /** 助教下桌 */
  removeAssistant(tableId: string): Promise<Table>;
}

// --------------------------------------------------
// 助教服务
// --------------------------------------------------
export interface AssistantService {
  /** 获取所有助教 */
  getAssistants(): Promise<Assistant[]>;
  /** 更新助教 */
  updateAssistant(assistant: Assistant): Promise<Assistant>;
}

// --------------------------------------------------
// 商品服务
// --------------------------------------------------
export interface ProductService {
  /** 获取所有商品 */
  getProducts(): Promise<Product[]>;
  /** 获取所有分类 */
  getCategories(): Promise<ProductCategory[]>;
}

// --------------------------------------------------
// 订单服务
// --------------------------------------------------
export interface OrderService {
  /** 获取订单列表 */
  getOrders(filter?: { tableId?: string; sessionId?: string }): Promise<Order[]>;
  /** 创建订单 */
  createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Order>;
  /** 更新订单 */
  updateOrder(order: Order): Promise<Order>;
}

// --------------------------------------------------
// 支付服务
// --------------------------------------------------
export interface PaymentService {
  /** 获取支付记录 */
  getPayments(filter?: { orderId?: string }): Promise<Payment[]>;
  /** 创建支付记录 */
  createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>;
  /** 验证优惠券 */
  validateCoupon(code: string): Promise<Coupon | null>;
}

// --------------------------------------------------
// 会员服务
// --------------------------------------------------
export interface MemberService {
  /** 获取所有会员 */
  getMembers(): Promise<Member[]>;
  /** 按手机号查找 */
  findMemberByPhone(phone: string): Promise<Member | null>;
  /** 创建会员 */
  createMember(data: { phone: string; name: string; level: MemberLevel }): Promise<Member>;
  /** 更新会员 */
  updateMember(member: Member): Promise<Member>;
  /** 会员充值 */
  rechargeMember(memberId: string, amount: number, bonus: number, points: number): Promise<Member>;
  /** 扣减余额 */
  deductMemberBalance(memberId: string, amount: number): Promise<Member>;
  /** 扣减积分 */
  deductMemberPoints(memberId: string, points: number): Promise<Member>;
}

// --------------------------------------------------
// 班次服务
// --------------------------------------------------
export interface ShiftService {
  /** 获取当前班次 */
  getCurrentShift(): Promise<Shift | null>;
  /** 获取历史班次 */
  getShifts(): Promise<Shift[]>;
  /** 开始班次 */
  startShift(operatorId: string, operatorName: string, openingCash: number): Promise<Shift>;
  /** 结束班次 */
  endShift(closingCash: number, shift: Shift): Promise<Shift>;
}

// --------------------------------------------------
// 预约服务
// --------------------------------------------------
export interface ReservationService {
  /** 获取所有预约 */
  getReservations(): Promise<Reservation[]>;
  /** 创建预约 */
  createReservation(data: Omit<Reservation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reservation>;
  /** 更新预约 */
  updateReservation(reservation: Reservation): Promise<Reservation>;
  /** 取消预约 */
  cancelReservation(reservationId: string): Promise<void>;
}

// --------------------------------------------------
// 促销服务
// --------------------------------------------------
export interface PromotionService {
  /** 获取所有促销 */
  getPromotions(): Promise<Promotion[]>;
  /** 应用促销 */
  applyPromotion(promotionId: string, amount: number): Promise<{ discountedAmount: number; promotion: Promotion }>;
}

// --------------------------------------------------
// 计费服务
// --------------------------------------------------
export interface BillingService {
  /** 获取时段配置 */
  getTimeSlots(): Promise<TimeSlot[]>;
  /** 获取台桌当前费率 */
  getTableRate(tableId: string, tables: Table[], timeSlots: TimeSlot[]): number;
  /** 计算台费 */
  calculateSessionFee(tableId: string, startTime: string, tables: Table[], timeSlots: TimeSlot[]): number;
  /** 设置计费模式 */
  setBillingMode(mode: BillingMode): Promise<void>;
}

// --------------------------------------------------
// 离线同步服务
// --------------------------------------------------
export interface SyncService {
  /** 同步离线操作 */
  syncOfflineOperations(operations: OfflineOperation[]): Promise<{ id: string; success: boolean; error?: string }[]>;
}

// --------------------------------------------------
// 聚合服务接口（组合所有子服务）
// --------------------------------------------------
export interface AppService {
  /** 加载初始数据 */
  loadInitialData(): Promise<InitialData>;

  table: TableService;
  assistant: AssistantService;
  product: ProductService;
  order: OrderService;
  payment: PaymentService;
  member: MemberService;
  shift: ShiftService;
  reservation: ReservationService;
  promotion: PromotionService;
  billing: BillingService;
  sync: SyncService;
}
