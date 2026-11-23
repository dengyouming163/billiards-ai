// 核心类型定义

export type TableStatus = 'idle' | 'occupied' | 'reserved' | 'maintenance';

// 台型（动态配置）
export interface TableType {
  id: string;
  store_id: string;
  name: string;
  code?: string;
  description?: string;
  icon?: string;
  sort_order: number;
  status: number;
  created_at?: string;
  updated_at?: string;
}
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type OrderType = 'table' | 'product' | 'assistant';
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'member' | 'card';
export type EmployeeRole = 'owner' | 'boss' | 'admin' | 'manager' | 'finance' | 'coach' | 'cashier' | 'waiter' | 'assistant';
export type EmployeeStatus = 'active' | 'inactive' | 'vacation';
export type AssistantLevel = 'junior' | 'intermediate' | 'senior' | 'gold';
export type AssistantStatus = 'available' | 'busy' | 'rest';
export type MemberLevel = 'normal' | 'silver' | 'gold' | 'diamond';
export type PricingRuleType = 'time' | 'hourly' | 'period';
export type RuleStatus = 'active' | 'inactive';
export type ProductStatus = 'active' | 'inactive';
export type ShiftType = 'morning' | 'afternoon' | 'evening' | 'full';
export type WeekdayType = 'all' | 'weekday' | 'weekend' | 'holiday';

// 角色常量定义（与后端 RoleConstants 保持一致）
export const ROLE_CONSTANTS = {
  OWNER: 'owner',
  BOSS: 'boss',
  ADMIN: 'admin',
  MANAGER: 'manager',
  FINANCE: 'finance',
  COACH: 'coach',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  ASSISTANT: 'assistant',
} as const;

// 角色配置映射
export const ROLE_CONFIG: Record<EmployeeRole, { label: string; gradient: string; permissions: string[] }> = {
  owner:   { label: '老板',   gradient: 'from-violet-500 to-purple-500',  permissions: ['全部权限'] },
  boss:    { label: '老板',   gradient: 'from-violet-500 to-purple-500',  permissions: ['全部权限'] },
  admin:   { label: '管理员', gradient: 'from-slate-500 to-slate-600',    permissions: ['系统管理', '门店管理', '订单管理', '员工管理', '财务报表'] },
  manager: { label: '店长',   gradient: 'from-emerald-500 to-teal-500',   permissions: ['门店管理', '订单管理', '员工管理', '财务报表'] },
  finance: { label: '财务',   gradient: 'from-indigo-500 to-blue-500',    permissions: ['财务对账', '营收报表', '成本管理'] },
  coach:   { label: '教练',   gradient: 'from-cyan-500 to-teal-500',      permissions: ['培训管理', '教学服务'] },
  cashier: { label: '收银员', gradient: 'from-blue-500 to-cyan-500',      permissions: ['收银结算', '订单管理', '会员查询'] },
  waiter:  { label: '服务员', gradient: 'from-amber-500 to-orange-500',   permissions: ['台桌服务', '商品配送'] },
  assistant: { label: '助教', gradient: 'from-pink-500 to-rose-500',      permissions: ['陪练服务', '教学服务'] },
};

// 门店
export interface BusinessHours {
  start: string;
  end: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo?: string;
  description?: string;
  businessHours: BusinessHours;
  status: 'active' | 'inactive';
  open_table_confirm?: number;
  open_table_confirm_timeout?: number;
  product_order_timeout?: number;
  assistant_booking_timeout?: number;
  charging_rate?: number;
  createdAt: string;
}

// 分区
export interface Zone {
  id: string;
  store_id: string;
  name: string;
  color: string;
  sort_order: number;
  description?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

// 时段
export interface TimePeriod {
  id: string;
  store_id: string;
  name: string;
  type: 'off_peak' | 'peak' | 'golden';
  start_time: string;
  end_time: string;
  coefficient: number;
  color?: string;
  description?: string;
}

// 台桌
export interface Table {
  id: string;
  store_id: string;
  zone_id: string;
  zone_name?: string;
  zone_color?: string;
  table_type_id?: string;
  table_type_name?: string;
  number: string;
  name?: string;
  status: TableStatus;
  pricing_id?: string;
  pricing_name?: string;
  hourly_rate?: number;
  qrcode?: string;
  description?: string;
  sort_order?: number;
  total_usage_count?: number;
  total_usage_hours?: number;
  startTime?: string;
  created_at?: string;
  updated_at?: string;
}

// 班次
export interface Shift {
  id: string;
  store_id: string;
  operator_id: string;
  operator_name: string;
  start_time: string;
  end_time: string;
  opening_cash: number;
  closing_cash: number;
  total_sales: number;
  total_orders: number;
  cash_sales: number;
  electronic_sales: number;
  member_recharge: number;
  coupon_count: number;
  open_tables: number;
  close_tables: number;
  status: 'open' | 'closed';
  remark?: string;
  created_at: string;
  updated_at: string;
}

// 预约
export interface Reservation {
  id: string;
  store_id: string;
  table_id: string;
  customer_name: string;
  customer_phone: string;
  customer_count: number;
  reservation_time: string;
  duration: number;
  source: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'completed';
  remark?: string;
  notify_sent: number;
  operator_id: string;
  created_at: string;
  updated_at: string;
  cancelled_at?: string;
  checked_in_at?: string;
}

export interface PeriodPackage {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export interface PricingConfig {
  pricePerHour?: number;
  minimumMinutes?: number;
  minimumCharge?: number;
  roundingMode?: 'per_minute' | 'min_30' | 'per_hour';
  periodPackages?: PeriodPackage[];
}

export interface PricingRule {
  id: string;
  store_id: string;
  name: string;
  type: PricingRuleType;
  priority: number;
  config: PricingConfig;
  applicable_tables: string[];
  applicable_periods: string[];
  member_levels: MemberLevel[];
  weekday_types: WeekdayType[];
  status: RuleStatus;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 员工
export interface Schedule {
  id: string;
  employeeId: string;
  date: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'absent';
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'normal' | 'late' | 'absent' | 'leave';
  remark?: string;
}

export interface Employee {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: EmployeeRole;
  role_name?: string;
  role_code?: string;
  role_id?: string;
  status: EmployeeStatus;
  hire_date: string;
  gender?: string;
  position?: string;
  salary?: number;
  id_card?: string;
  store_ids?: string[];
  schedules?: Schedule[];
  attendances?: Attendance[];
  description?: string;
}

// 助教
export interface Assistant {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  avatar?: string;
  video?: string;
  level: AssistantLevel;
  level_id?: string;
  skills: string[];
  hourly_rate: number;
  billing_rule?: 'minute' | 'half_hour';
  course_price?: number;
  status: AssistantStatus;
  rating?: number;
  service_count?: number;
  total_hours?: number;
  description?: string;
  created_at?: string;
}

// 商品分类
export interface ProductCategory {
  id: string;
  store_id: string;
  name: string;
  icon?: string;
  color?: string;
  sort: number;
  description?: string;
  product_count?: number;
  status?: string;
}

// 商品
export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  barcode?: string;
  unit: string;
  purchase_price: number;
  sale_price: number;
  stock: number;
  low_stock_threshold: number;
  image?: string;
  status: ProductStatus;
  tags?: string[];
  description?: string;
}

// 库存记录
export interface InventoryRecord {
  id: string;
  store_id: string;
  product_id: string;
  type: string;
  type_label?: string;
  subtype?: string;
  quantity: number;
  price?: number;
  remark?: string;
  operator_id?: string;
  created_at: string;
  product?: Product;
  before_stock?: number;
  after_stock?: number;
}

// 会员
export interface Member {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  cardNumber: string;
  avatar?: string;
  level: MemberLevel;
  balance: number;
  points: number;
  totalConsume: number;
  totalRecharge: number;
  status: 'active' | 'frozen' | 'expired';
  expiry_date?: string;
  createdAt: string;
  lastConsumeAt?: string;
  birthday?: string;
  remark?: string;
  levelName?: string;
  levelCode?: string;
  levelColor?: string;
  levelDiscount?: number;
  levelPointsRate?: number;
}

// 会员等级规则
export interface MemberLevelRule {
  id: string;
  level: MemberLevel;
  name: string;
  icon?: string;
  threshold: number;
  discount: number;
  points_rate: number;
}

// 会员记录
export interface MemberRecord {
  id: string;
  member_id: string;
  type: 'recharge' | 'consume' | 'points_in' | 'points_out' | 'level_up';
  amount: number;
  points?: number;
  balance?: number;
  remark?: string;
  operator_id: string;
  order_id?: string;
  created_at: string;
}

// 会员等级配置
export interface MemberTier {
  id: string;
  storeId: string;
  level: string;
  name: string;
  color?: string;
  discount: number;
  pointsRate: number;
  minAmount: number;
  minPoints: number;
  status: 'active' | 'inactive';
}

// 订单项
export interface OrderItem {
  id: string;
  name: string;
  type: 'table' | 'product' | 'assistant';
  quantity: number;
  unit_price: number;
  total_price: number;
  duration?: number;
  table_id?: string;
  assistant_id?: string;
  product_id?: string;
}

// 订单来源
export type OrderSource = 'counter' | 'wechat' | 'mini_app' | 'qr_code';

// 账单状态
export type BillStatus = 'active' | 'settled' | 'cancelled' | 'refunded';

// 账单（用于合并结算）
export interface Bill {
  id: string;
  storeId: string;
  billNumber: string; // 账单编号
  status: BillStatus;
  tableId?: string;
  tableNumber?: string;
  memberId?: string;
  memberName?: string;
  memberLevel?: MemberLevel;
  orders: string[]; // 关联的订单ID列表
  totalAmount: number;
  discountAmount: number;
  actualAmount: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod?: PaymentMethod;
  startTime?: string; // 最早开始时间
  endTime?: string; // 最晚结束时间
  totalDuration?: number; // 总使用时长(分钟)
  employeeId: string;
  employeeName: string;
  remark?: string;
  createdAt: string;
  settledAt?: string;
}

// 订单
export interface Order {
  id: string;
  store_id: string;
  bill_id?: string;
  order_number: string;
  type: OrderType;
  status: OrderStatus;
  items: OrderItem[];
  table_id?: string;
  table_number?: string;
  zone_id?: string;
  zone_name?: string;
  member_id?: string;
  member_name?: string;
  member_level?: MemberLevel;
  employee_id: string;
  employee_name: string;
  total_amount: number;
  discount: number;
  actual_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method?: PaymentMethod;
  start_time?: string;
  end_time?: string;
  pause_time?: number;
  duration?: number;
  pricing_rule_id?: string;
  pricing_rule_name?: string;
  assistant_id?: string;
  assistant_name?: string;
  source: OrderSource;
  remark?: string;
  created_at: string;
  completed_at?: string;
}

// 助教订单
export interface AssistantOrder {
  id: string;
  store_id: string;
  order_number: string;
  assistant_id: string;
  assistant_name: string;
  assistant_level: AssistantLevel;
  student_name?: string;
  student_phone?: string;
  service_type: "one_on_one" | "group" | "practice" | "coaching";
  duration: number;
  hourly_rate: number;
  total_amount: number;
  discount: number;
  actual_amount: number;
  rating?: number;
  feedback?: string;
  status: OrderStatus;
  created_at: string;
  completed_at?: string;
}

export interface CommissionConfig {
  id: string;
  store_id: string;
  assistant_id: string;
  commission_mode: 'no_guarantee' | 'with_guarantee' | 'base_salary';
  commission_type: 'percentage' | 'fixed';
  commission_rate: number;
  base_salary?: number;
  guarantee_hours?: number;
  guarantee_amount?: number;
  settlement_period: string;
  effective_date?: string;
  status: number;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface CommissionRecord {
  id: string;
  store_id: string;
  assistant_id: string;
  order_item_id: string;
  order_amount: number;
  commission_type: string;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  remark?: string;
  created_at: string;
}
// 资金流水
export interface CashFlow {
  id: string;
  store_id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  payment_method?: string;
  paymentMethod?: string;
  order_id?: string;
  orderId?: string;
  order_number?: string;
  orderNumber?: string;
  remark?: string;
  operator_name?: string;
  operatorName?: string;
  created_at?: string;
  createdAt?: string;
}

// 套餐类型
export type PackageType = 'time' | 'product' | 'mixed' | 'member';

export type PackageStatus = 'active' | 'inactive';

// 时长套餐项
export interface TimePackageItem {
  id: string;
  duration: number; // 分钟
  price: number;
  description?: string;
}

// 商品套餐项
export interface ProductPackageItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

// 会员套餐权益
export interface MemberBenefit {
  type: 'time' | 'product' | 'assistant' | 'discount';
  value: string; // 如 "2小时免费" 或 "9折"
  description: string;
}

// 套餐
export interface Package {
  id: string;
  store_id: string;
  name: string;
  type: PackageType;
  price: number;
  cost_price?: number;
  validity_days: number;
  status: PackageStatus;
  time_items?: TimePackageItem[];
  product_items?: ProductPackageItem[];
  time_items_mixed?: TimePackageItem[];
  product_items_mixed?: ProductPackageItem[];
  member_level?: MemberLevel;
  benefits?: MemberBenefit[];
  applicable_tables?: string[];
  applicable_periods?: string[];
  image?: string;
  description?: string;
  sales_count?: number;
  sort: number;
  created_at: string;
  updated_at: string;
}

// 用户
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: EmployeeRole;
  storeIds: string[];
  currentStoreId?: string;
}

// 角色
export interface Role {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

// 权限
export interface Permission {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  description?: string;
  sortOrder?: number;
  status?: 'active' | 'inactive';
  children?: Permission[];
}

export interface PermissionTree extends Permission {
  children: PermissionTree[];
}

export interface PresetRole {
  id: string;
  name: string;
  code: string;
  description?: string;
  sort_order: number;
  status: number;
  is_system: number;
  permission_ids?: string[];
  permissions?: string[];
}
