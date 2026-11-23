// ============================================================
// 商业台球系统 - 类型定义
// ============================================================

// 台球桌类型
export type TableType = 'standard' | 'vip';
export type TableStatus = 'idle' | 'occupied' | 'reserved' | 'maintenance';

// 台球桌
export interface Table {
  id: string;
  name: string;
  type: TableType;
  status: TableStatus;
  capacity: number;
  hourlyRate: number;
  currentSession?: Session;
  zoneId?: string; // 所属分区ID
}

// 分区
export interface Zone {
  id: string;
  name: string; // 如：一区、二区、A区、B区
  color: string; // 区域标识颜色
}

// 台球桌分组（用于列表显示）
export interface TableGroup {
  id: string;
  name: string;
  tables: Table[];
}

// 时段套餐
export type PricingType = 'hourly' | 'session' | 'day' | 'fixed' | 'perGame';

export interface PricingPackage {
  id: string;
  name: string;
  type: PricingType;
  duration: number; // 分钟
  price: number;
  description?: string;
  products?: string[]; // 包含的商品ID列表
  services?: string[]; // 包含的服务项目
}

// 消费时段
export interface Session {
  id: string;
  tableId: string;
  orderId?: string;         // 后端 Order.id，用于关联后端订单
  orderNo?: string;         // 后端 Order.order_no，如 TB20260616...
  startTime: string; // ISO date string
  endTime?: string;
  customerCount: number;
  assistantId?: string;
  assistantName?: string;
  pricingPackageId?: string;
  pricingType: PricingType;
  status: 'active' | 'closed';
  tableFee: number;
  tableFeePaused?: boolean;
  createdAt: string;
  notes?: string;  // 备注
}

// 助教
export interface Assistant {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  status: string;  // 'available' | 'busy' | 'rest'
  hourlyRate: number;
  level?: string;  // 等级ID
  level_name?: string;  // 等级显示名称（API 返回）
  is_busy?: boolean;
  totalServices?: number;  // 累计服务次数
}

// 商品分类
export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
  sort: number;
}

// 商品
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  unit?: string;
  image?: string;
  description?: string;
  barcode?: string;
  available: boolean;
}

// 订单项
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: 'pending' | 'delivering' | 'delivered' | 'completed' | 'cancelled';
  remarks?: string;
  type?: string;
  assistantId?: string;
  assistantName?: string;
}

// 订单状态
export type OrderStatus = 'pending' | 'completed' | 'cancelled';

// 订单
export interface Order {
  id: string;
  order_no?: string;        // POS 后端订单号
  table_name?: string;       // POS 后端桌名
  tableId: string;
  tableNumber?: string;
  tableName?: string;
  zone_name?: string;        // POS 后端分区名
  store_id?: string;         // POS 后端门店ID
  customer_count?: number;   // POS 后端人数
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
  productAmount?: number;
  tableAmount?: number;
  assistantAmount?: number;
  discount_amount?: number;  // POS 后端优惠金额
  payAmount?: number;
  payType?: string;
  pay_status?: string;       // POS 后端支付状态
  payTime?: string;
  startTime?: string;
  endTime?: string;
  duration_minutes?: number; // POS 后端时长
  duration?: number;
  type?: string;               // 订单类型: table, temp_cleaning, temp_free_trial
  status: OrderStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced';
}

// 支付方式
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'member' | 'bankcard' | 'meituan' | 'douyin';

// 支付状态
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// 支付记录
export interface Payment {
  id: string;
  orderId: string;
  sessionId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  couponCode?: string;
  couponDiscount?: number;
  createdAt: string;
  operatorId: string;
}

// 优惠券
export interface Coupon {
  id: string;
  code: string;
  name: string;
  platform: 'meituan' | 'douyin' | 'internal';
  originalPrice: number;
  actualPrice: number;
  validFrom: string;
  validTo: string;
  status: 'unused' | 'used' | 'expired' | 'active';
}

// 会员等级
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';

// 会员
export interface Member {
  id: string;
  phone: string;
  name: string;
  level: MemberLevel;
  level_id?: string;    // POS 后端原始字段
  level_name?: string;  // POS 后端原始字段
  balance: number;
  points: number;
  totalConsume: number;
  totalRecharge: number;
  status: 'active' | 'inactive';
  password?: string;
  createdAt: string;
  updatedAt: string;
}

// 会员充值档位
export interface RechargeTier {
  id: string;
  amount: number;
  bonus: number;
  points: number;
}

// 积分规则
export interface PointsRule {
  id: string;
  name: string;
  pointsPerYuan: number;
  redeemPointsPerYuan: number;
}

// 班次状态
export type ShiftStatus = 'open' | 'closed';

// 班次
export interface Shift {
  id: string;
  operatorId: string;
  operatorName: string;
  status: ShiftStatus;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  cashDifference?: number;
  totalSales: number;
  totalOrders: number;
  totalAmount: number;
  cashSales: number;
  electronicSales: number;
  memberRecharge: number;
  couponCount: number;
  openTables: number;
  closeTables: number;
  payments: Payment[];
}

// 操作员
export interface Operator {
  id: string;
  name: string;
  role: 'cashier' | 'manager' | 'admin';
  pin?: string;
}

// 消费记录（用于关台时的消费明细）
export interface ConsumptionRecord {
  type: 'table' | 'product' | 'assistant' | 'discount' | 'coupon';
  name: string;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
}

// 收银记录（用于关台时的完整支付信息）
export interface CheckoutRecord {
  tableId: string;
  tableName: string;
  session: Session;
  order?: Order;
  consumptions: ConsumptionRecord[];
  subtotal: number;
  discount: number;
  total: number;
  payments: Payment[];
  member?: Member;
  pointsDeducted?: number;
}

// 离线操作队列项
export type OfflineOpType =
  | 'open_table' | 'close_table' | 'create_order' | 'payment' | 'member_recharge'
  | 'add_product' | 'remove_product' | 'book_assistant' | 'cancel_assistant'
  | 'checkout' | 'extend_time';

export interface OfflineOperation {
  id: string;
  type: OfflineOpType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  timestamp: string;
  retryCount: number;
}

// 网络状态
export type NetworkStatus = 'online' | 'offline' | 'syncing';

// AppState 定义已移至 context/AppContext.tsx（更丰富的字段）
// 此处的简化版本仅为历史遗留，保留 NetworkStatus/OfflineOperation 等公共类型引用

// 操作员上下文
export interface OperatorContext {
  id: string;
  name: string;
  role: 'cashier' | 'manager' | 'admin';
}

// 当班营业汇总
export interface ShiftSummary {
  totalSales: number;
  totalOrders: number;
  openTables: number;
  cashSales: number;
  electronicSales: number;
  memberRecharge: number;
  couponCount: number;
  pendingSync: number;
}

// 快捷操作类型
export type QuickAction = 'open' | 'order' | 'payment' | 'member';

// 待处理事项
export interface PendingItem {
  type: 'checkout' | 'reservation' | 'cleaning' | 'sync';
  count: number;
  description: string;
}

// ============================================================
// 增强功能类型定义
// ============================================================

// 计费模式类型
export type BillingMode = 'hourly' | 'per_game' | 'fixed_period' | 'package';

// 时段配置
export interface TimeSlot {
  id: string;
  name: string; // 如"工作日白天"、"周末"、"节假日"
  startHour: number; // 0-23
  endHour: number; // 0-23
  rates: {
    standard: number; // 标准桌单价
    vip: number; // VIP桌单价
  };
  isWeekend: boolean; // 是否周末
  isHoliday: boolean; // 是否节假日
}

// 桌台时段价格配置
export interface TableRateConfig {
  tableId: string;
  rates: {
    hourly?: number; // 按时长：元/小时
    perGame?: number; // 按局数：元/局
    fixedPeriod?: number; // 包段时间价格
    fixedPeriodMinutes?: number; // 包段时间（分钟）
  };
  minimumCharge?: number; // 最低消费
  peakHours?: { start: number; end: number; multiplier: number }[]; // 高峰时段倍率
}

// 套餐类型
export type PackageType = 'time' | 'product' | 'mixed' | 'membership' | 'membership_card';

// 套餐
export interface Package {
  id: string;
  name: string;
  type: PackageType;
  originalPrice: number;
  actualPrice: number;
  description: string;
  image?: string;
  products?: string[];
  members?: number;
  // 时长套餐
  duration?: number; // 分钟
  includeAssistant?: boolean; // 是否包含助教
  // 商品套餐
  productItems?: { productId: string; quantity: number }[];
  // 混合套餐
  timeDuration?: number;
  includedProducts?: { productId: string; quantity: number }[];
  // 会员专属
  memberLevel?: MemberLevel;
  // 有效期
  validDays?: number; // 购买后有效天数
  // 状态
  available: boolean;
  sort: number;
}

// 预约状态
export type ReservationStatus = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';

// 预约来源
export type ReservationSource = 'phone' | 'wechat' | 'app' | 'walk_in';

// 预约
export interface Reservation {
  id: string;
  tableId?: string; // 可选，指定桌台
  customerName: string;
  customerPhone: string;
  reservationTime: string; // ISO date string
  duration: number; // 预计时长（分钟）
  customerCount: number;
  status: ReservationStatus;
  source: ReservationSource;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  operatorId: string;
  notifySent: boolean; // 是否已发送通知
}

// 助教等级
export type TechnicianLevel = 'junior' | 'senior' | 'master' | 'champion';

// 助教提成方式
export type CommissionType = 'percentage' | 'fixed' | 'mixed';

// 助教
export interface Technician {
  id: string;
  name: string;
  avatar?: string;
  phone: string;
  level: TechnicianLevel;
  status: 'available' | 'busy' | 'off' | 'on_break';
  // 排班
  schedule: {
    [dayOfWeek: number]: { start: string; end: string } | null; // 0-6，null表示休息
  };
  // 提成配置
  commissionType: CommissionType;
  commissionRate: number; // 百分比
  baseSalary?: number;
  // 服务项目及价格
  services: {
    serviceId: string;
    name: string;
    price: number;
    duration: number; // 分钟
    commissionRate?: number; // 单独设置提成比例
  }[];
  // 统计数据
  totalServices: number;
  totalCommission: number;
  rating: number; // 评分
  createdAt: string;
}

// 促销类型
export type PromotionType = 'discount' | 'coupon' | 'points_multiplier' | 'bundle' | 'flash_sale';

// 促销状态
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'paused';

// 促销规则
export interface PromotionRule {
  type: 'full_reduction' | 'discount' | 'threshold';
  // 满减
  minAmount?: number;
  discountAmount?: number;
  discountRate?: number; // 折扣率，如 0.8 表示8折
  // 每人限用次数
  limitPerPerson?: number;
}

// 促销
export interface Promotion {
  id: string;
  name: string;
  type: PromotionType;
  description: string;
  // 优惠内容
  discountValue: number; // 折扣金额或折扣率
  discountType: 'amount' | 'rate'; // 减免金额还是打折
  // 使用条件
  rules: PromotionRule[];
  conditions?: { minConsumption: number };
  benefits?: { pointsMultiplier: number };
  minOrderAmount?: number; // 最低消费
  maxDiscount?: number; // 最高优惠
  // 适用范围
  scope: 'all' | 'table' | 'product' | 'package';
  scopeIds?: string[]; // 指定范围的ID
  // 时间限制
  startTime: string;
  endTime: string;
  // 限制
  totalLimit?: number; // 总发放数量
  usedCount: number;
  perPersonLimit?: number;
  // 状态
  status: PromotionStatus;
  // 会员等级限制
  memberLevels?: MemberLevel[];
  createdAt: string;
}

// 优惠劵类型
export type CouponType = 'discount' | 'cash' | 'gift' | 'percentage';

// 优惠券
export interface CouponTemplate {
  id: string;
  name: string;
  type: CouponType;
  value: number; // 优惠金额或折扣率
  minAmount: number; // 最低消费金额
  maxDiscount?: number; // 最高优惠
  validDays: number; // 领取后有效天数
  totalCount: number;
  remainingCount: number;
  // 发放对象
  targetLevel?: MemberLevel;
  // 状态
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
}

// 小票打印配置
export interface PrintConfig {
  enabled: boolean;
  printerName?: string;
  template: 'simple' | 'detailed' | 'qrcode';
  printLogo: boolean;
  printQRCode: boolean;
  merchantName?: string;
  merchantPhone?: string;
  merchantAddress?: string;
}

// 营业日报
export interface DailyReport {
  date: string;
  // 时段数据
  timeSlots: {
    name: string;
    openTables: number;
    tableRevenue: number;
    productRevenue: number;
    assistantRevenue: number;
    totalRevenue: number;
  }[];
  // 汇总数据
  summary: {
    totalRevenue: number;
    tableRevenue: number;
    productRevenue: number;
    assistantRevenue: number;
    discountAmount: number;
    couponAmount: number;
    memberRecharge: number;
    newMembers: number;
    totalCustomers: number;
    avgTableDuration: number; // 平均台时（分钟）
  };
  // 支付方式统计
  paymentMethods: {
    method: PaymentMethod;
    count: number;
    amount: number;
  }[];
  // 桌台数据
  tables: {
    tableId: string;
    tableName: string;
    openCount: number;
    totalDuration: number;
    revenue: number;
  }[];
  // 助教数据
  technicians: {
    technicianId: string;
    name: string;
    serviceCount: number;
    revenue: number;
    commission: number;
  }[];
  // 商品销量
  topProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

// 操作日志
export interface OperationLog {
  id: string;
  operatorId: string;
  operatorName: string;
  action: string;
  target: string;
  details?: string;
  amount?: number;
  createdAt: string;
}
