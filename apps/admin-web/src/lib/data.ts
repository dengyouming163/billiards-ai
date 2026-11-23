// Mock 数据存储层
import { 
  Store, Zone, TimePeriod, Table, PricingRule, Employee, Assistant,
  ProductCategory, Product, Member, MemberLevelRule, MemberTier, Order, 
  CashFlow, InventoryRecord, MemberRecord, User, AssistantOrder,
  Package
} from './types';

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// ============= 模拟用户 =============
export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: '张老板',
    phone: '13800138000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
    role: 'owner',
    storeIds: ['store_1', 'store_2', 'store_3'],
    currentStoreId: 'store_1',
  },
  {
    id: 'user_2',
    name: '李店长',
    phone: '13800138001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager',
    role: 'manager',
    storeIds: ['store_1'],
    currentStoreId: 'store_1',
  },
];

// ============= 模拟门店 =============
export const mockStores: Store[] = [
  {
    id: 'store_1',
    name: '星辰台球俱乐部（国贸店）',
    address: '北京市朝阳区建国路88号SOHO现代城B座1层',
    phone: '010-65881234',
    logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=store1',
    description: '旗舰店，12张球台，含2张赛台',
    businessHours: { start: '09:00', end: '02:00' },
    status: 'active',
    createdAt: '2023-01-01',
  },
  {
    id: 'store_2',
    name: '星辰台球俱乐部（中关村店）',
    address: '北京市海淀区中关村大街1号',
    phone: '010-62561234',
    description: '8张球台，斯诺克专区',
    businessHours: { start: '10:00', end: '23:00' },
    status: 'active',
    createdAt: '2023-06-01',
  },
  {
    id: 'store_3',
    name: '星辰台球俱乐部（望京店）',
    address: '北京市朝阳区望京SOHO T3 2层',
    phone: '010-84567890',
    description: '10张球台，VIP包间',
    businessHours: { start: '10:00', end: '01:00' },
    status: 'active',
    createdAt: '2024-01-01',
  },
];

// ============= 模拟分区 =============
export const mockZones: Zone[] = [
  { id: 'zone_1', store_id: 'store_1', name: 'A区-标台区', color: '#10B981', sort_order: 1, status: 1, description: '8张标准球台' },
  { id: 'zone_2', store_id: 'store_1', name: 'B区-赛台区', color: '#3B82F6', sort_order: 2, status: 1, description: '2张比赛级球台' },
  { id: 'zone_3', store_id: 'store_1', name: 'C区-斯诺克区', color: '#8B5CF6', sort_order: 3, status: 1, description: '2张斯诺克球台' },
  { id: 'zone_4', store_id: 'store_2', name: '主厅', color: '#10B981', sort_order: 1, status: 1, description: '6张标准球台' },
  { id: 'zone_5', store_id: 'store_2', name: 'VIP区', color: '#F59E0B', sort_order: 2, status: 1, description: '2张斯诺克球台' },
];

// ============= 模拟时段 =============
export const mockTimePeriods: TimePeriod[] = [
  { id: 'period_1', store_id: 'store_1', name: '闲时', type: 'off_peak', start_time: '09:00', end_time: '17:00', coefficient: 0.8, color: 'bg-green-500' },
  { id: 'period_2', store_id: 'store_1', name: '忙时', type: 'peak', start_time: '17:00', end_time: '22:00', coefficient: 1.2, color: 'bg-orange-500' },
  { id: 'period_3', store_id: 'store_1', name: '黄金时段', type: 'golden', start_time: '19:00', end_time: '23:00', coefficient: 1.5, color: 'bg-red-500' },
  { id: 'period_4', store_id: 'store_1', name: '凌晨时段', type: 'off_peak', start_time: '00:00', end_time: '09:00', coefficient: 0.6, color: 'bg-blue-500' },
];

// ============= 模拟台桌 =============
export const mockTables: Table[] = [
  // A区-标台区
  { id: 'table_1', store_id: 'store_1', zone_id: 'zone_1', number: 'A01', name: '一号台', table_type_name: 'standard', status: 'occupied', startTime: '2024-04-15T14:30:00', pricing_id: 'rule_1' },
  { id: 'table_2', store_id: 'store_1', zone_id: 'zone_1', number: 'A02', name: '二号台', table_type_name: 'standard', status: 'idle', pricing_id: 'rule_1' },
  { id: 'table_3', store_id: 'store_1', zone_id: 'zone_1', number: 'A03', name: '三号台', table_type_name: 'standard', status: 'reserved', pricing_id: 'rule_1' },
  { id: 'table_4', store_id: 'store_1', zone_id: 'zone_1', number: 'A04', name: '四号台', table_type_name: 'standard', status: 'idle', pricing_id: 'rule_1' },
  { id: 'table_5', store_id: 'store_1', zone_id: 'zone_1', number: 'A05', table_type_name: 'standard', status: 'maintenance', pricing_id: 'rule_1' },
  { id: 'table_6', store_id: 'store_1', zone_id: 'zone_1', number: 'A06', table_type_name: 'standard', status: 'idle', pricing_id: 'rule_1' },
  { id: 'table_7', store_id: 'store_1', zone_id: 'zone_1', number: 'A07', table_type_name: 'standard', status: 'idle', pricing_id: 'rule_1' },
  { id: 'table_8', store_id: 'store_1', zone_id: 'zone_1', number: 'A08', table_type_name: 'standard', status: 'idle', pricing_id: 'rule_1' },
  // B区-赛台区
  { id: 'table_9', store_id: 'store_1', zone_id: 'zone_2', number: 'B01', name: '比赛台1', table_type_name: 'tournament', status: 'occupied', startTime: '2024-04-15T13:00:00', pricing_id: 'rule_2' },
  { id: 'table_10', store_id: 'store_1', zone_id: 'zone_2', number: 'B02', name: '比赛台2', table_type_name: 'tournament', status: 'idle', pricing_id: 'rule_2' },
  // C区-斯诺克区
  { id: 'table_11', store_id: 'store_1', zone_id: 'zone_3', number: 'C01', name: '斯诺克1', table_type_name: 'snooker', status: 'idle', pricing_id: 'rule_3' },
  { id: 'table_12', store_id: 'store_1', zone_id: 'zone_3', number: 'C02', name: '斯诺克2', table_type_name: 'snooker', status: 'idle', pricing_id: 'rule_3' },
];

// ============= 模拟计费规则 =============
export const mockPricingRules: PricingRule[] = [
  {
    id: 'rule_1',
    store_id: 'store_1',
    name: '标准球台计时',
    type: 'time',
    priority: 1,
    config: {
      pricePerHour: 30,
      minimumMinutes: 30,
      minimumCharge: 15,
      roundingMode: 'per_minute',
    },
    applicable_tables: ['standard'],
    applicable_periods: ['period_1', 'period_2', 'period_3'],
    member_levels: ['normal', 'silver', 'gold', 'diamond'],
    weekday_types: ['all'],
    status: 'active',
    description: '标准球台分时段计时收费，最低消费30分钟',
    created_at: '2024-01-01',
    updated_at: '2024-01-15',
  },
  {
    id: 'rule_2',
    store_id: 'store_1',
    name: '赛台计时收费',
    type: 'time',
    priority: 2,
    config: {
      pricePerHour: 60,
      minimumMinutes: 30,
      minimumCharge: 30,
      roundingMode: 'per_minute',
    },
    applicable_tables: ['tournament'],
    applicable_periods: [],
    member_levels: ['normal', 'silver', 'gold', 'diamond'],
    weekday_types: ['all'],
    status: 'active',
    description: '比赛级球台，设施更好，价格更高',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'rule_3',
    store_id: 'store_1',
    name: '按小时统一计费',
    type: 'hourly',
    priority: 3,
    config: {
      pricePerHour: 40,
      minimumMinutes: 30,
      minimumCharge: 20,
      roundingMode: 'per_minute',
    },
    applicable_tables: ['standard'],
    applicable_periods: [],
    member_levels: ['normal', 'silver', 'gold', 'diamond'],
    weekday_types: ['all'],
    status: 'active',
    description: '统一小时费率，不区分时段',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'rule_4',
    store_id: 'store_1',
    name: '包时段套餐',
    type: 'period',
    priority: 4,
    config: {
      pricePerHour: 40,
      minimumMinutes: 0,
      minimumCharge: 0,
      roundingMode: 'per_minute',
      periodPackages: [
        { id: 'pkg_1', name: '下午茶套餐', duration: 120, price: 80 },
        { id: 'pkg_2', name: '晚场套餐', duration: 300, price: 150 },
        { id: 'pkg_3', name: '全天畅打', duration: 600, price: 280 },
      ],
    },
    applicable_tables: ['standard', 'tournament'],
    applicable_periods: [],
    member_levels: ['gold', 'diamond'],
    weekday_types: ['all'],
    status: 'active',
    description: '包时段套餐，不限时间畅打，适合长时间休闲',
    created_at: '2024-02-01',
    updated_at: '2024-02-15',
  },
];

// ============= 模拟员工 =============
export const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    store_id: 'store_1',
    name: '王经理',
    phone: '13900139001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager1',
    role: 'manager',
    status: 'active',
    hire_date: '2023-01-15',
    salary: 8000,
    schedules: [],
    attendances: [],
    description: '店长，负责门店日常运营',
  },
  {
    id: 'emp_2',
    store_id: 'store_1',
    name: '张收银',
    phone: '13900139002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cashier1',
    role: 'cashier',
    status: 'active',
    hire_date: '2023-03-01',
    salary: 5000,
    schedules: [],
    attendances: [],
  },
  {
    id: 'emp_3',
    store_id: 'store_1',
    name: '李服务',
    phone: '13900139003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=waiter1',
    role: 'waiter',
    status: 'active',
    hire_date: '2023-06-01',
    salary: 4000,
    schedules: [],
    attendances: [],
  },
  {
    id: 'emp_4',
    store_id: 'store_1',
    name: '赵助教',
    phone: '13900139004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=assistant1',
    role: 'assistant',
    status: 'active',
    hire_date: '2023-02-01',
    salary: 6000,
    schedules: [],
    attendances: [],
    description: '专业斯诺克教练',
  },
];

// ============= 模拟助教 =============
export const mockAssistants: Assistant[] = [
  {
    id: 'asst_1',
    store_id: 'store_1',
    name: '赵教练',
    phone: '13900139004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach1',
    level: 'gold',
    skills: ['8球', '9球', '斯诺克', '花式'],
    hourly_rate: 150,
    course_price: 300,
    status: 'busy',
    rating: 4.9,
    service_count: 256,
    total_hours: 512,
    description: '从业10年，国家一级裁判',
  },
  {
    id: 'asst_2',
    store_id: 'store_1',
    name: '钱教练',
    phone: '13900139005',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach2',
    level: 'senior',
    skills: ['8球', '9球'],
    hourly_rate: 100,
    course_price: 200,
    status: 'available',
    rating: 4.7,
    service_count: 156,
    total_hours: 312,
    description: '擅长入门教学',
  },
  {
    id: 'asst_3',
    store_id: 'store_1',
    name: '孙教练',
    phone: '13900139006',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach3',
    level: 'intermediate',
    skills: ['8球', '花式'],
    hourly_rate: 80,
    status: 'available',
    rating: 4.5,
    service_count: 89,
    total_hours: 178,
  },
  {
    id: 'asst_4',
    store_id: 'store_1',
    name: '周教练',
    phone: '13900139007',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach4',
    level: 'junior',
    skills: ['8球'],
    hourly_rate: 60,
    status: 'rest',
    rating: 4.3,
    service_count: 45,
    total_hours: 90,
  },
];

// ============= 模拟商品分类 =============
export const mockProductCategories: ProductCategory[] = [
  { id: 'cat_1', store_id: 'store_1', name: '饮料', icon: 'coffee', color: 'blue', sort: 1 },
  { id: 'cat_2', store_id: 'store_1', name: '酒水', icon: 'beer', color: 'amber', sort: 2 },
  { id: 'cat_3', store_id: 'store_1', name: '零食', icon: 'cookie', color: 'green', sort: 3 },
  { id: 'cat_4', store_id: 'store_1', name: '球具', icon: 'package', color: 'purple', sort: 4 },
  { id: 'cat_5', store_id: 'store_1', name: '其他', icon: 'box', color: 'slate', sort: 5 },
];

// ============= 模拟商品 =============
export const mockProducts: Product[] = [
  { id: 'prod_1', store_id: 'store_1', category_id: 'cat_1', name: '可乐', unit: '瓶', purchase_price: 3, sale_price: 8, stock: 100, low_stock_threshold: 20, status: 'active', tags: ['热销'] },
  { id: 'prod_2', store_id: 'store_1', category_id: 'cat_1', name: '雪碧', unit: '瓶', purchase_price: 3, sale_price: 8, stock: 80, low_stock_threshold: 20, status: 'active', tags: ['热销'] },
  { id: 'prod_3', store_id: 'store_1', category_id: 'cat_1', name: '农夫山泉', unit: '瓶', purchase_price: 1, sale_price: 5, stock: 200, low_stock_threshold: 50, status: 'active' },
  { id: 'prod_4', store_id: 'store_1', category_id: 'cat_1', name: '王老吉', unit: '罐', purchase_price: 4, sale_price: 10, stock: 50, low_stock_threshold: 15, status: 'active' },
  { id: 'prod_5', store_id: 'store_1', category_id: 'cat_2', name: '青岛啤酒', unit: '瓶', purchase_price: 5, sale_price: 15, stock: 60, low_stock_threshold: 20, status: 'active', tags: ['推荐'] },
  { id: 'prod_6', store_id: 'store_1', category_id: 'cat_2', name: '雪花啤酒', unit: '瓶', purchase_price: 4, sale_price: 12, stock: 80, low_stock_threshold: 20, status: 'active' },
  { id: 'prod_7', store_id: 'store_1', category_id: 'cat_2', name: '茅台小酒', unit: '两', purchase_price: 50, sale_price: 120, stock: 20, low_stock_threshold: 5, status: 'active', tags: ['高端'] },
  { id: 'prod_8', store_id: 'store_1', category_id: 'cat_3', name: '薯片', unit: '包', purchase_price: 5, sale_price: 15, stock: 40, low_stock_threshold: 10, status: 'active' },
  { id: 'prod_9', store_id: 'store_1', category_id: 'cat_3', name: '瓜子', unit: '包', purchase_price: 3, sale_price: 10, stock: 50, low_stock_threshold: 15, status: 'active' },
  { id: 'prod_10', store_id: 'store_1', category_id: 'cat_3', name: '花生米', unit: '包', purchase_price: 3, sale_price: 10, stock: 45, low_stock_threshold: 15, status: 'active' },
  { id: 'prod_11', store_id: 'store_1', category_id: 'cat_4', name: '球杆', unit: '根', purchase_price: 200, sale_price: 500, stock: 10, low_stock_threshold: 3, status: 'active', tags: ['器材'] },
  { id: 'prod_12', store_id: 'store_1', category_id: 'cat_4', name: '巧克粉', unit: '盒', purchase_price: 10, sale_price: 25, stock: 30, low_stock_threshold: 10, status: 'active', tags: ['耗材'] },
  { id: 'prod_13', store_id: 'store_1', category_id: 'cat_4', name: '皮头', unit: '个', purchase_price: 5, sale_price: 15, stock: 50, low_stock_threshold: 15, status: 'active', tags: ['耗材'] },
];

// ============= 模拟会员等级 =============
export const mockMemberLevelRules: MemberLevelRule[] = [
  { id: 'ml_1', level: 'normal', name: '普通会员', threshold: 0, discount: 1, points_rate: 1 },
  { id: 'ml_2', level: 'silver', name: '银卡会员', threshold: 1000, discount: 0.95, points_rate: 1.2 },
  { id: 'ml_3', level: 'gold', name: '金卡会员', threshold: 5000, discount: 0.9, points_rate: 1.5 },
  { id: 'ml_4', level: 'diamond', name: '钻石会员', threshold: 20000, discount: 0.85, points_rate: 2 },
];

// ============= 模拟会员 =============
export const mockMembers: Member[] = [
  {
    id: 'mem_1',
    store_id: 'store_1',
    name: '陈会员',
    phone: '13700137001',
    cardNumber: 'XC20240001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member1',
    level: 'gold',
    balance: 2000,
    points: 15000,
    totalConsume: 6800,
    totalRecharge: 10000,
    status: 'active',
    createdAt: '2023-06-01',
    lastConsumeAt: '2024-04-10',
  },
  {
    id: 'mem_2',
    store_id: 'store_1',
    name: '林会员',
    phone: '13700137002',
    cardNumber: 'XC20240002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member2',
    level: 'silver',
    balance: 500,
    points: 3200,
    totalConsume: 2800,
    totalRecharge: 4000,
    status: 'active',
    createdAt: '2023-09-15',
    lastConsumeAt: '2024-04-12',
  },
  {
    id: 'mem_3',
    store_id: 'store_1',
    name: '周会员',
    phone: '13700137003',
    cardNumber: 'XC20240003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member3',
    level: 'diamond',
    balance: 5000,
    points: 45000,
    totalConsume: 35000,
    totalRecharge: 50000,
    status: 'active',
    createdAt: '2022-01-01',
    lastConsumeAt: '2024-04-14',
  },
  {
    id: 'mem_4',
    store_id: 'store_1',
    name: '吴会员',
    phone: '13700137004',
    cardNumber: 'XC20240004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=member4',
    level: 'normal',
    balance: 200,
    points: 580,
    totalConsume: 580,
    totalRecharge: 1000,
    status: 'active',
    createdAt: '2024-03-01',
    lastConsumeAt: '2024-03-15',
  },
];

// ============= 模拟订单 =============
export const mockOrders: Order[] = [
  {
    id: 'order_1',
    store_id: 'store_1',
    order_number: 'ORD20240415001',
    type: 'table',
    status: 'completed',
    items: [{ id: 'oi_1', name: '标台-计时', type: 'table', quantity: 1, unit_price: 0, total_price: 85, duration: 150 }],
    table_id: 'table_1',
    table_number: 'A01',
    member_id: 'mem_1',
    member_name: '陈会员',
    employee_id: 'emp_2',
    employee_name: '张收银',
    total_amount: 85,
    discount: 4.25,
    actual_amount: 80.75,
    paid_amount: 81,
    change_amount: 0.25,
    payment_method: 'wechat',
    start_time: '2024-04-15T10:00:00',
    end_time: '2024-04-15T12:30:00',
    source: 'counter',
    created_at: '2024-04-15T10:00:00',
    completed_at: '2024-04-15T12:30:00',
  },
  {
    id: 'order_2',
    store_id: 'store_1',
    order_number: 'ORD20240415002',
    type: 'product',
    status: 'completed',
    items: [
      { id: 'oi_2', name: '青岛啤酒', type: 'product', quantity: 6, unit_price: 15, total_price: 90 },
      { id: 'oi_3', name: '可乐', type: 'product', quantity: 2, unit_price: 8, total_price: 16 },
    ],
    table_id: 'table_1',
    table_number: 'A01',
    employee_id: 'emp_3',
    employee_name: '李服务',
    total_amount: 106,
    discount: 0,
    actual_amount: 106,
    paid_amount: 106,
    change_amount: 0,
    payment_method: 'cash',
    source: 'counter',
    created_at: '2024-04-15T11:00:00',
    completed_at: '2024-04-15T11:15:00',
  },
  {
    id: 'order_3',
    store_id: 'store_1',
    order_number: 'ORD20240415003',
    type: 'table',
    status: 'in_progress',
    items: [{ id: 'oi_4', name: '赛台-计时', type: 'table', quantity: 1, unit_price: 0, total_price: 0, duration: 30 }],
    table_id: 'table_9',
    table_number: 'B01',
    employee_id: 'emp_2',
    employee_name: '张收银',
    total_amount: 0,
    discount: 0,
    actual_amount: 0,
    paid_amount: 0,
    change_amount: 0,
    start_time: '2024-04-15T13:00:00',
    source: 'wechat',
    created_at: '2024-04-15T13:00:00',
  },
  {
    id: 'order_4',
    store_id: 'store_1',
    order_number: 'ORD20240414001',
    type: 'assistant',
    status: 'completed',
    items: [{ id: 'oi_5', name: '赵教练-陪练', type: 'assistant', quantity: 1, unit_price: 150, total_price: 300, duration: 120 }],
    table_id: 'table_2',
    table_number: 'A02',
    member_id: 'mem_2',
    member_name: '林会员',
    employee_id: 'asst_1',
    employee_name: '赵教练',
    total_amount: 300,
    discount: 0,
    actual_amount: 300,
    paid_amount: 300,
    change_amount: 0,
    payment_method: 'member',
    start_time: '2024-04-14T14:00:00',
    end_time: '2024-04-14T16:00:00',
    source: 'counter',
    created_at: '2024-04-14T14:00:00',
    completed_at: '2024-04-14T16:00:00',
  },
];

// 模拟助教订单
export const mockAssistantOrders: AssistantOrder[] = [
  {
    id: 'ao_1',
    store_id: 'store_1',
    order_number: 'ASST20240415001',
    assistant_id: 'assistant_1',
    assistant_name: '赵教练',
    assistant_level: 'gold',
    student_name: '王学员',
    student_phone: '13800138001',
    service_type: 'one_on_one',
    duration: 120,
    hourly_rate: 200,
    total_amount: 400,
    discount: 0,
    actual_amount: 400,
    rating: 5,
    feedback: '讲解细致，很有帮助',
    status: 'completed',
    created_at: '2024-04-15T10:00:00',
    completed_at: '2024-04-15T12:00:00',
  },
  {
    id: 'ao_2',
    store_id: 'store_1',
    order_number: 'ASST20240415002',
    assistant_id: 'assistant_2',
    assistant_name: '钱教练',
    assistant_level: 'senior',
    student_name: '李散客',
    service_type: 'practice',
    duration: 60,
    hourly_rate: 150,
    total_amount: 150,
    discount: 0,
    actual_amount: 150,
    rating: 4,
    status: 'completed',
    created_at: '2024-04-15T14:00:00',
    completed_at: '2024-04-15T15:00:00',
  },
  {
    id: 'ao_3',
    store_id: 'store_1',
    order_number: 'ASST20240414001',
    assistant_id: 'assistant_1',
    assistant_name: '赵教练',
    assistant_level: 'gold',
    student_name: '张会员',
    service_type: 'group',
    duration: 180,
    hourly_rate: 200,
    total_amount: 600,
    discount: 100,
    actual_amount: 500,
    rating: 5,
    feedback: '比赛指导非常专业',
    status: 'completed',
    created_at: '2024-04-14T09:00:00',
    completed_at: '2024-04-14T12:00:00',
  },
  {
    id: 'ao_4',
    store_id: 'store_1',
    order_number: 'ASST20240413001',
    assistant_id: 'assistant_3',
    assistant_name: '孙教练',
    assistant_level: 'intermediate',
    student_name: '周新手',
    service_type: 'one_on_one',
    duration: 90,
    hourly_rate: 100,
    total_amount: 150,
    discount: 0,
    actual_amount: 150,
    rating: 4,
    status: 'completed',
    created_at: '2024-04-13T15:00:00',
    completed_at: '2024-04-13T16:30:00',
  },
  {
    id: 'ao_5',
    store_id: 'store_1',
    order_number: 'ASST20240412001',
    assistant_id: 'assistant_2',
    assistant_name: '钱教练',
    assistant_level: 'senior',
    service_type: 'practice',
    duration: 120,
    hourly_rate: 150,
    total_amount: 300,
    discount: 0,
    actual_amount: 300,
    rating: 5,
    status: 'completed',
    created_at: '2024-04-12T19:00:00',
    completed_at: '2024-04-12T21:00:00',
  },
  {
    id: 'ao_6',
    store_id: 'store_1',
    order_number: 'ASST20240411001',
    assistant_id: 'assistant_4',
    assistant_name: '郑助教',
    assistant_level: 'junior',
    student_name: '吴体验',
    service_type: 'one_on_one',
    duration: 60,
    hourly_rate: 60,
    total_amount: 60,
    discount: 10,
    actual_amount: 50,
    rating: 4,
    status: 'completed',
    created_at: '2024-04-11T10:00:00',
    completed_at: '2024-04-11T11:00:00',
  },
];
// ============= 模拟会员记录 =============
export const mockMemberRecords: MemberRecord[] = [
  { id: 'mr_1', member_id: 'mem_1', type: 'recharge', amount: 10000, balance: 10000, operator_id: 'emp_2', created_at: '2023-06-01' },
  { id: 'mr_2', member_id: 'mem_1', type: 'consume', amount: -85, balance: 9920, operator_id: 'emp_2', order_id: 'order_1', created_at: '2024-04-15' },
  { id: 'mr_3', member_id: 'mem_1', type: 'consume', amount: -106, balance: 9814, operator_id: 'emp_2', order_id: 'order_2', created_at: '2024-04-15' },
  { id: 'mr_4', member_id: 'mem_2', type: 'recharge', amount: 4000, balance: 4000, operator_id: 'emp_2', created_at: '2023-09-15' },
  { id: 'mr_5', member_id: 'mem_2', type: 'consume', amount: -300, balance: 3700, operator_id: 'asst_1', order_id: 'order_4', created_at: '2024-04-14' },
];

// ============= 模拟会员等级配置 =============
export const mockMemberTiers: MemberTier[] = [
  {
    id: 'tier_normal',
    storeId: 'store_1',
    level: 'normal',
    name: '普通会员',
    color: '#94a3b8',
    discount: 1,
    pointsRate: 1,
    minAmount: 0,
    minPoints: 0,
    status: 'active',
  },
  {
    id: 'tier_silver',
    storeId: 'store_1',
    level: 'silver',
    name: '银卡会员',
    color: '#9ca3af',
    discount: 0.95,
    pointsRate: 1.2,
    minAmount: 1000,
    minPoints: 500,
    status: 'active',
  },
  {
    id: 'tier_gold',
    storeId: 'store_1',
    level: 'gold',
    name: '金卡会员',
    color: '#f59e0b',
    discount: 0.9,
    pointsRate: 1.5,
    minAmount: 5000,
    minPoints: 2000,
    status: 'active',
  },
  {
    id: 'tier_diamond',
    storeId: 'store_1',
    level: 'diamond',
    name: '钻石会员',
    color: '#8b5cf6',
    discount: 0.85,
    pointsRate: 2,
    minAmount: 20000,
    minPoints: 10000,
    status: 'active',
  },
];

// ============= 模拟库存记录 =============
export const mockInventoryRecords: InventoryRecord[] = [
  { id: 'inv_1', store_id: 'store_1', product_id: 'prod_1', type: 'in', subtype: 'purchase', quantity: 100, price: 3, operator_id: 'emp_1', created_at: '2024-04-01' },
  { id: 'inv_2', store_id: 'store_1', product_id: 'prod_1', type: 'out', subtype: 'sale', quantity: 20, operator_id: 'emp_3', created_at: '2024-04-10' },
];
// ============= 模拟资金流水 =============
export const mockCashFlows: CashFlow[] = [
  { id: 'cf_1', store_id: 'store_1', type: 'income', category: '台桌收入', amount: 85, payment_method: 'wechat', order_id: 'order_1', order_number: 'ORD20240415001', operator_name: '张收银', created_at: '2024-04-15T12:30:00' },
  { id: 'cf_2', store_id: 'store_1', type: 'income', category: '商品收入', amount: 106, payment_method: 'cash', order_id: 'order_2', order_number: 'ORD20240415002', operator_name: '李服务', created_at: '2024-04-15T11:15:00' },
  { id: 'cf_3', store_id: 'store_1', type: 'income', category: '助教收入', amount: 300, payment_method: 'member', order_id: 'order_4', order_number: 'ORD20240414001', operator_name: '赵教练', created_at: '2024-04-14T16:00:00' },
  { id: 'cf_4', store_id: 'store_1', type: 'income', category: '会员充值', amount: 2000, payment_method: 'wechat', operator_name: '张收银', created_at: '2024-04-13' },
  { id: 'cf_5', store_id: 'store_1', type: 'expense', category: '工资支出', amount: -25000, operator_name: '王经理', created_at: '2024-04-10', remark: '3月份员工工资' },
  { id: 'cf_6', store_id: 'store_1', type: 'expense', category: '采购支出', amount: -1500, operator_name: '王经理', created_at: '2024-04-05', remark: '4月份商品采购' },
];

// ============= 模拟套餐 =============
export const mockPackages: Package[] = [
  // 时长套餐
  {
    id: 'pkg_1',
    store_id: 'store_1',
    name: '畅打2小时',
    type: 'time',
    price: 80,
    cost_price: 60,
    validity_days: 30,
    status: 'active',
    time_items: [
      { id: 'ti_1', duration: 120, price: 80, description: '畅打2小时，不限台桌' }
    ],
    applicable_tables: [],
    applicable_periods: ['period_1', 'period_2'],
    description: '包含2小时台球畅打时间，适用于标准台桌',
    sales_count: 156,
    sort: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_2',
    store_id: 'store_1',
    name: '畅打4小时',
    type: 'time',
    price: 150,
    cost_price: 120,
    validity_days: 30,
    status: 'active',
    time_items: [
      { id: 'ti_2', duration: 240, price: 150, description: '畅打4小时，超值套餐' }
    ],
    applicable_tables: [],
    applicable_periods: ['period_1', 'period_2'],
    description: '包含4小时台球畅打时间，周末可用',
    sales_count: 89,
    sort: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_3',
    store_id: 'store_1',
    name: '赛台专享1小时',
    type: 'time',
    price: 120,
    cost_price: 90,
    validity_days: 30,
    status: 'active',
    time_items: [
      { id: 'ti_3', duration: 60, price: 120, description: '赛台专属1小时' }
    ],
    applicable_tables: ['tournament'],
    applicable_periods: [],
    description: '专享比赛级台桌1小时，适合专业选手',
    sales_count: 45,
    sort: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  // 商品套餐
  {
    id: 'pkg_4',
    store_id: 'store_1',
    name: '欢乐畅饮套餐',
    type: 'product',
    price: 58,
    cost_price: 40,
    validity_days: 30,
    status: 'active',
    product_items: [
      { product_id: 'prod_1', product_name: '可乐', quantity: 2, unit_price: 8 },
      { product_id: 'prod_3', product_name: '薯片', quantity: 1, unit_price: 15 },
      { product_id: 'prod_5', product_name: '爆米花', quantity: 1, unit_price: 12 },
    ],
    description: '2瓶可乐+薯片+爆米花，观赛必备',
    sales_count: 234,
    sort: 4,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_5',
    store_id: 'store_1',
    name: '聚会精选套餐',
    type: 'product',
    price: 128,
    cost_price: 95,
    validity_days: 30,
    status: 'active',
    product_items: [
      { product_id: 'prod_1', product_name: '可乐', quantity: 4, unit_price: 8 },
      { product_id: 'prod_2', product_name: '雪碧', quantity: 4, unit_price: 8 },
      { product_id: 'prod_3', product_name: '薯片', quantity: 2, unit_price: 15 },
      { product_id: 'prod_4', product_name: '瓜子', quantity: 2, unit_price: 10 },
    ],
    description: '适合4-6人聚会，含饮料和零食',
    sales_count: 178,
    sort: 5,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  // 混合套餐
  {
    id: 'pkg_6',
    store_id: 'store_1',
    name: '新手入门套餐',
    type: 'mixed',
    price: 98,
    cost_price: 75,
    validity_days: 30,
    status: 'active',
    time_items_mixed: [
      { id: 'tm_1', duration: 60, price: 50, description: '1小时练习时间' }
    ],
    product_items_mixed: [
      { product_id: 'prod_1', product_name: '可乐', quantity: 1, unit_price: 8 },
      { product_id: 'prod_6', product_name: '新手球杆使用', quantity: 1, unit_price: 25 },
    ],
    description: '新手入门首选，含1小时练习+饮品+球杆使用',
    sales_count: 312,
    sort: 6,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_7',
    store_id: 'store_1',
    name: '尊享私教套餐',
    type: 'mixed',
    price: 288,
    cost_price: 220,
    validity_days: 30,
    status: 'active',
    time_items_mixed: [
      { id: 'tm_2', duration: 90, price: 150, description: '90分钟专属台桌' }
    ],
    product_items_mixed: [
      { product_id: 'prod_1', product_name: '矿泉水', quantity: 2, unit_price: 5 },
      { product_id: 'asst_1', product_name: '金牌教练指导', quantity: 1, unit_price: 100 },
    ],
    applicable_tables: ['tournament', 'snooker'],
    description: '赛台90分钟+金牌教练1对1指导',
    sales_count: 56,
    sort: 7,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  // 会员套餐
  {
    id: 'pkg_8',
    store_id: 'store_1',
    name: '银卡会员月卡',
    type: 'member',
    price: 299,
    cost_price: 250,
    validity_days: 30,
    status: 'active',
    member_level: 'silver',
    benefits: [
      { type: 'time', value: '8折', description: '台球时间全单8折' },
      { type: 'product', value: '9折', description: '商品消费全单9折' },
      { type: 'discount', value: '赠送50积分', description: '开卡赠送50积分' },
    ],
    description: '银卡会员月卡，享受台球8折优惠',
    sales_count: 67,
    sort: 8,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_9',
    store_id: 'store_1',
    name: '金卡会员季卡',
    type: 'member',
    price: 799,
    cost_price: 650,
    validity_days: 90,
    status: 'active',
    member_level: 'gold',
    benefits: [
      { type: 'time', value: '7折', description: '台球时间全单7折' },
      { type: 'product', value: '85折', description: '商品消费全单85折' },
      { type: 'assistant', value: '免费体验1次', description: '每月免费助教体验1次' },
      { type: 'discount', value: '赠送200积分', description: '开卡赠送200积分' },
    ],
    description: '金卡会员季卡，享受多重专属权益',
    sales_count: 34,
    sort: 9,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'pkg_10',
    store_id: 'store_1',
    name: '钻石会员年卡',
    type: 'member',
    price: 2999,
    cost_price: 2500,
    validity_days: 365,
    status: 'active',
    member_level: 'diamond',
    benefits: [
      { type: 'time', value: '6折', description: '台球时间全单6折' },
      { type: 'product', value: '8折', description: '商品消费全单8折' },
      { type: 'assistant', value: '每月2次免费', description: '每月2次免费助教体验' },
      { type: 'discount', value: '专属VIP台桌', description: '优先预约VIP赛台' },
    ],
    description: '钻石会员年卡，全方位尊享服务',
    sales_count: 12,
    sort: 10,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

// ============= 数据存储类 =============

/**
 * API 配置说明
 * 
 * 当前 DataStore 使用本地 Mock 数据 + localStorage 存储
 * 如需切换到真实后端 API，修改 USE_API_MODE 为 true
 * 并确保后端 API 服务已启动
 * 
 * API 服务地址配置：NEXT_PUBLIC_API_BASE_URL
 */
const USE_API_MODE = false; // TODO: 迁移时改为 true

class DataStore {
  private prefix = 'billiards_';

  // API 模式开关，便于后续迁移
  static useApiMode = USE_API_MODE;

  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    const item = localStorage.getItem(this.prefix + key);
    return item ? JSON.parse(item) : defaultValue;
  }

  private setItem<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.prefix + key, JSON.stringify(value));
  }

  // 门店
  getStores(): Store[] {
    return this.getItem('stores', mockStores);
  }

  setStores(stores: Store[]): void {
    this.setItem('stores', stores);
  }

  getStoreById(id: string): Store | undefined {
    return this.getStores().find(s => s.id === id);
  }

  // 分区
  getZones(store_id?: string): Zone[] {
    const zones = this.getItem('zones', mockZones);
    return store_id ? zones.filter(z => z.store_id === store_id) : zones;
  }

  setZones(zones: Zone[]): void {
    this.setItem('zones', zones);
  }

  // 时段
  getTimePeriods(store_id?: string): TimePeriod[] {
    const periods = this.getItem('timePeriods', mockTimePeriods);
    return store_id ? periods.filter(p => p.store_id === store_id) : periods;
  }

  setTimePeriods(periods: TimePeriod[]): void {
    this.setItem('timePeriods', periods);
  }

  // 台桌
  getTables(store_id?: string): Table[] {
    const tables = this.getItem('tables', mockTables);
    return store_id ? tables.filter(t => t.store_id === store_id) : tables;
  }

  setTables(tables: Table[]): void {
    this.setItem('tables', tables);
  }

  getTableById(id: string): Table | undefined {
    return this.getTables().find(t => t.id === id);
  }

  // 计费规则
  getPricingRules(store_id?: string): PricingRule[] {
    const rules = this.getItem('pricingRules', mockPricingRules);
    return store_id ? rules.filter(r => r.store_id === store_id) : rules;
  }

  setPricingRules(rules: PricingRule[]): void {
    this.setItem('pricingRules', rules);
  }

  getPricingRuleById(id: string): PricingRule | undefined {
    return this.getPricingRules().find(r => r.id === id);
  }

  // 员工
  getEmployees(store_id?: string): Employee[] {
    const employees = this.getItem('employees', mockEmployees);
    return store_id ? employees.filter(e => e.store_id === store_id) : employees;
  }

  setEmployees(employees: Employee[]): void {
    this.setItem('employees', employees);
  }

  // 助教
  getAssistants(store_id?: string): Assistant[] {
    const assistants = this.getItem('assistants', mockAssistants);
    return store_id ? assistants.filter(a => a.store_id === store_id) : assistants;
  }

  setAssistants(assistants: Assistant[]): void {
    this.setItem('assistants', assistants);
  }

  // 商品分类
  getProductCategories(store_id?: string): ProductCategory[] {
    const categories = this.getItem('productCategories', mockProductCategories);
    return store_id ? categories.filter(c => c.store_id === store_id) : categories;
  }

  setProductCategories(categories: ProductCategory[]): void {
    this.setItem('productCategories', categories);
  }

  // 商品
  getProducts(store_id?: string): Product[] {
    const products = this.getItem('products', mockProducts);
    return store_id ? products.filter(p => p.store_id === store_id) : products;
  }

  setProducts(products: Product[]): void {
    this.setItem('products', products);
  }

  // 会员等级规则
  getMemberLevelRules(): MemberLevelRule[] {
    return this.getItem('member_levelRules', mockMemberLevelRules);
  }

  setMemberLevelRules(rules: MemberLevelRule[]): void {
    this.setItem('member_levelRules', rules);
  }

  // 会员
  getMembers(store_id?: string): Member[] {
    const members = this.getItem('members', mockMembers);
    return store_id ? members.filter(m => m.store_id === store_id) : members;
  }

  setMembers(members: Member[]): void {
    this.setItem('members', members);
  }

  // 会员记录
  getMemberRecords(member_id?: string): MemberRecord[] {
    const records = this.getItem('memberRecords', mockMemberRecords);
    return member_id ? records.filter(r => r.member_id === member_id) : records;
  }

  setMemberRecords(records: MemberRecord[]): void {
    this.setItem('memberRecords', records);
  }

  // 会员等级配置
  getMemberTiers(store_id?: string): MemberTier[] {
    const tiers = this.getItem('memberTiers', mockMemberTiers);
    return store_id ? tiers.filter(t => t.storeId === store_id) : tiers;
  }

  setMemberTiers(tiers: MemberTier[]): void {
    this.setItem('memberTiers', tiers);
  }

  // 订单
  getOrders(store_id?: string): Order[] {
    const orders = this.getItem('orders', mockOrders);
    return store_id ? orders.filter(o => o.store_id === store_id) : orders;
  }

  setOrders(orders: Order[]): void {
    this.setItem('orders', orders);
  }

  // 助教订单
  getAssistantOrders(store_id?: string): AssistantOrder[] {
    const orders = this.getItem('assistantOrders', mockAssistantOrders);
    return store_id ? orders.filter(o => o.store_id === store_id) : orders;
  }

  setAssistantOrders(orders: AssistantOrder[]): void {
    this.setItem('assistantOrders', orders);
  }

  // 库存记录
  getInventoryRecords(store_id?: string): InventoryRecord[] {
    const records = this.getItem('inventoryRecords', mockInventoryRecords);
    return store_id ? records.filter(r => r.store_id === store_id) : records;
  }

  setInventoryRecords(records: InventoryRecord[]): void {
    this.setItem('inventoryRecords', records);
  }

  // 资金流水
  getCashFlows(store_id?: string): CashFlow[] {
    const flows = this.getItem('cashFlows', mockCashFlows);
    return store_id ? flows.filter(f => f.store_id === store_id) : flows;
  }

  setCashFlows(flows: CashFlow[]): void {
    this.setItem('cashFlows', flows);
  }

  // 套餐
  getPackages(store_id?: string): Package[] {
    const packages = this.getItem('packages', mockPackages);
    return store_id ? packages.filter(p => p.store_id === store_id) : packages;
  }

  setPackages(packages: Package[]): void {
    this.setItem('packages', packages);
  }

  // 重置所有数据
  resetAll(): void {
    this.setStores(mockStores);
    this.setZones(mockZones);
    this.setTimePeriods(mockTimePeriods);
    this.setTables(mockTables);
    this.setPricingRules(mockPricingRules);
    this.setEmployees(mockEmployees);
    this.setAssistants(mockAssistants);
    this.setProductCategories(mockProductCategories);
    this.setProducts(mockProducts);
    this.setMemberLevelRules(mockMemberLevelRules);
    this.setMembers(mockMembers);
    this.setMemberRecords(mockMemberRecords);
    this.setMemberTiers(mockMemberTiers);
    this.setOrders(mockOrders);
    this.setInventoryRecords(mockInventoryRecords);
    this.setCashFlows(mockCashFlows);
    this.setPackages(mockPackages);
  }
}

export const dataStore = new DataStore();
