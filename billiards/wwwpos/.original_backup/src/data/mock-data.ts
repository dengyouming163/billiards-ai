// ============================================================
// 模拟数据 - 商业台球系统
// ============================================================

import type {
  Table,
  Assistant,
  Product,
  ProductCategory,
  Member,
  RechargeTier,
  PricingPackage,
  Operator,
  Technician,
  Package,
  Promotion,
  Reservation,
  TimeSlot,
  DailyReport,
  Zone,
} from '@/types';

// 分区数据
export const mockZones: Zone[] = [
  { id: 'z1', name: 'A区', color: '#10E0A2' },
  { id: 'z2', name: 'B区', color: '#F59E0B' },
  { id: 'z3', name: 'C区', color: '#3B82F6' },
];

// 台球桌数据 - 12张桌，按分区分配
export const mockTables: Table[] = [
  { id: 't1', name: '01', type: 'standard', status: 'idle', capacity: 6, hourlyRate: 40, zoneId: 'z1' },
  { id: 't2', name: '02', type: 'standard', status: 'inuse', capacity: 6, hourlyRate: 40, zoneId: 'z1', currentSession: { id: 's1', tableId: 't2', startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(), customerCount: 3, pricingType: 'hourly', status: 'active', tableFee: 30, createdAt: new Date().toISOString() } },
  { id: 't3', name: '03', type: 'standard', status: 'idle', capacity: 6, hourlyRate: 40, zoneId: 'z1' },
  { id: 't4', name: '04', type: 'standard', status: 'reserved', capacity: 6, hourlyRate: 40, zoneId: 'z1' },
  { id: 't5', name: '05', type: 'standard', status: 'idle', capacity: 6, hourlyRate: 40, zoneId: 'z2' },
  { id: 't6', name: '06', type: 'standard', status: 'cleaning', capacity: 6, hourlyRate: 40, zoneId: 'z2' },
  { id: 't7', name: '07', type: 'standard', status: 'inuse', capacity: 6, hourlyRate: 40, zoneId: 'z2', currentSession: { id: 's2', tableId: 't7', startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(), customerCount: 2, assistantId: 'a1', assistantName: '小李', pricingType: 'hourly', status: 'active', tableFee: 60, createdAt: new Date().toISOString() } },
  { id: 't8', name: '08', type: 'standard', status: 'idle', capacity: 6, hourlyRate: 40, zoneId: 'z2' },
  { id: 't9', name: '09', type: 'standard', status: 'idle', capacity: 6, hourlyRate: 40, zoneId: 'z3' },
  { id: 't10', name: '10', type: 'vip', status: 'inuse', capacity: 10, hourlyRate: 80, zoneId: 'z3', currentSession: { id: 's3', tableId: 't10', startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), customerCount: 8, pricingType: 'hourly', status: 'active', tableFee: 40, createdAt: new Date().toISOString() } },
  { id: 't11', name: '11', type: 'vip', status: 'idle', capacity: 10, hourlyRate: 80, zoneId: 'z3' },
  { id: 't12', name: '12', type: 'vip', status: 'idle', capacity: 10, hourlyRate: 80, zoneId: 'z3' },
];

// 助教数据
export const mockAssistants: Assistant[] = [
  { id: 'a1', name: '小李', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoli', status: 'busy', hourlyRate: 100 },
  { id: 'a2', name: '小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaowang', status: 'available', hourlyRate: 100 },
  { id: 'a3', name: '阿强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aqiang', status: 'available', hourlyRate: 120 },
  { id: 'a4', name: '小陈', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaochen', status: 'off', hourlyRate: 100 },
  { id: 'a5', name: '阿明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=aming', status: 'available', hourlyRate: 110 },
];

// 商品分类
export const mockCategories: ProductCategory[] = [
  { id: 'c1', name: '全部', sort: 0 },
  { id: 'c2', name: '饮品', sort: 1, icon: 'cup-soda' },
  { id: 'c3', name: '零食', sort: 2, icon: 'cookie' },
  { id: 'c4', name: '水果', sort: 3, icon: 'apple' },
  { id: 'c5', name: '香烟', sort: 4, icon: 'cigarette' },
  { id: 'c6', name: '主食', sort: 5, icon: 'utensils' },
  { id: 'c7', name: '其他', sort: 6, icon: 'package' },
];

// 商品数据
export const mockProducts: Product[] = [
  // 饮品
  { id: 'p1', name: '矿泉水', categoryId: 'c2', price: 5, unit: '瓶', available: true },
  { id: 'p2', name: '可乐', categoryId: 'c2', price: 8, unit: '瓶', available: true },
  { id: 'p3', name: '雪碧', categoryId: 'c2', price: 8, unit: '瓶', available: true },
  { id: 'p4', name: '橙汁', categoryId: 'c2', price: 12, unit: '杯', available: true },
  { id: 'p5', name: '柠檬茶', categoryId: 'c2', price: 15, unit: '杯', available: true },
  { id: 'p6', name: '奶茶', categoryId: 'c2', price: 20, unit: '杯', available: true },
  { id: 'p7', name: '红牛', categoryId: 'c2', price: 15, unit: '罐', available: true },
  { id: 'p8', name: '王老吉', categoryId: 'c2', price: 10, unit: '罐', available: true },
  // 零食
  { id: 'p9', name: '爆米花', categoryId: 'c3', price: 20, available: true },
  { id: 'p10', name: '薯片', categoryId: 'c3', price: 15, available: true },
  { id: 'p11', name: '花生米', categoryId: 'c3', price: 12, available: true },
  { id: 'p12', name: '瓜子', categoryId: 'c3', price: 10, available: true },
  { id: 'p13', name: '巧克力', categoryId: 'c3', price: 18, available: true },
  // 水果
  { id: 'p14', name: '果盘（小）', categoryId: 'c4', price: 35, available: true },
  { id: 'p15', name: '果盘（大）', categoryId: 'c4', price: 58, available: true },
  { id: 'p16', name: '西瓜', categoryId: 'c4', price: 25, available: true },
  // 香烟
  { id: 'p17', name: '中华（硬）', categoryId: 'c5', price: 45, unit: '包', available: true },
  { id: 'p18', name: '中华（软）', categoryId: 'c5', price: 70, unit: '包', available: true },
  { id: 'p19', name: '芙蓉王', categoryId: 'c5', price: 25, unit: '包', available: true },
  { id: 'p20', name: '利群', categoryId: 'c5', price: 20, unit: '包', available: true },
  // 主食
  { id: 'p21', name: '炒饭', categoryId: 'c6', price: 25, available: true },
  { id: 'p22', name: '炒面', categoryId: 'c6', price: 25, available: true },
  { id: 'p23', name: '饺子', categoryId: 'c6', price: 30, available: true },
  { id: 'p24', name: '方便面', categoryId: 'c6', price: 12, available: true },
  // 其他
  { id: 'p25', name: '纸巾', categoryId: 'c7', price: 3, unit: '包', available: true },
  { id: 'p26', name: '球杆蜡', categoryId: 'c7', price: 30, available: true },
  { id: 'p27', name: '手套', categoryId: 'c7', price: 15, available: true },
];

// 会员数据
export const mockMembers: Member[] = [
  { id: 'm1', phone: '138****1234', name: '张先生', level: 'gold', balance: 1580, points: 5800, createdAt: '2024-01-15', updatedAt: '2024-03-20' },
  { id: 'm2', phone: '139****5678', name: '李女士', level: 'diamond', balance: 5000, points: 12000, createdAt: '2023-06-10', updatedAt: '2024-03-18' },
  { id: 'm3', phone: '136****9012', name: '王老板', level: 'silver', balance: 680, points: 2100, createdAt: '2024-02-01', updatedAt: '2024-03-15' },
  { id: 'm4', phone: '137****3456', name: '赵经理', level: 'normal', balance: 120, points: 380, createdAt: '2024-03-10', updatedAt: '2024-03-12' },
];

// 充值档位
export const mockRechargeTiers: RechargeTier[] = [
  { id: 'r1', amount: 100, bonus: 0, points: 100 },
  { id: 'r2', amount: 300, bonus: 30, points: 330 },
  { id: 'r3', amount: 500, bonus: 80, points: 580 },
  { id: 'r4', amount: 1000, bonus: 200, points: 1200 },
  { id: 'r5', amount: 2000, bonus: 500, points: 2500 },
];

// 时段套餐
export const mockPricingPackages: PricingPackage[] = [
  { id: 'pkg1', name: '时计', type: 'hourly', duration: 60, price: 40, description: '按时计费' },
  { id: 'pkg2', name: '畅打4小时', type: 'session', duration: 240, price: 120, description: '4小时畅打' },
  { id: 'pkg3', name: '包场', type: 'day', duration: 720, price: 280, description: '全天包场' },
];

// 操作员
export const mockOperators: Operator[] = [
  { id: 'op1', name: '收银员A', role: 'cashier' },
  { id: 'op2', name: '收银员B', role: 'cashier' },
  { id: 'op3', name: '店长', role: 'manager' },
  { id: 'op4', name: '管理员', role: 'admin' },
];

// ============================================================
// 增强功能模拟数据
// ============================================================

// 时段配置
export const mockTimeSlots: TimeSlot[] = [
  {
    id: 'ts1',
    name: '工作日白天',
    startHour: 9,
    endHour: 18,
    rates: { standard: 40, vip: 80 },
    isWeekend: false,
    isHoliday: false,
  },
  {
    id: 'ts2',
    name: '工作日晚间',
    startHour: 18,
    endHour: 23,
    rates: { standard: 50, vip: 100 },
    isWeekend: false,
    isHoliday: false,
  },
  {
    id: 'ts3',
    name: '周末白天',
    startHour: 9,
    endHour: 18,
    rates: { standard: 50, vip: 100 },
    isWeekend: true,
    isHoliday: false,
  },
  {
    id: 'ts4',
    name: '周末晚间',
    startHour: 18,
    endHour: 23,
    rates: { standard: 60, vip: 120 },
    isWeekend: true,
    isHoliday: false,
  },
  {
    id: 'ts5',
    name: '节假日',
    startHour: 0,
    endHour: 24,
    rates: { standard: 60, vip: 120 },
    isWeekend: false,
    isHoliday: true,
  },
];

// 助教数据
export const mockTechnicians: Technician[] = [
  {
    id: 't1',
    name: '小李',
    phone: '138****1234',
    level: 'senior',
    status: 'busy',
    schedule: {
      0: null,
      1: { start: '09:00', end: '22:00' },
      2: { start: '09:00', end: '22:00' },
      3: { start: '09:00', end: '22:00' },
      4: { start: '09:00', end: '22:00' },
      5: { start: '09:00', end: '22:00' },
      6: { start: '10:00', end: '23:00' },
    },
    commissionType: 'percentage',
    commissionRate: 30,
    services: [
      { serviceId: 'sv1', name: '台球陪练', price: 100, duration: 60, commissionRate: 30 },
      { serviceId: 'sv2', name: '私人教学', price: 150, duration: 60, commissionRate: 35 },
      { serviceId: 'sv3', name: '比赛指导', price: 200, duration: 90, commissionRate: 40 },
    ],
    totalServices: 156,
    totalCommission: 4680,
    rating: 4.8,
    createdAt: '2023-06-01',
  },
  {
    id: 't2',
    name: '小王',
    phone: '139****5678',
    level: 'master',
    status: 'available',
    schedule: {
      0: { start: '10:00', end: '23:00' },
      1: { start: '10:00', end: '23:00' },
      2: null,
      3: { start: '10:00', end: '23:00' },
      4: { start: '10:00', end: '23:00' },
      5: { start: '10:00', end: '23:00' },
      6: { start: '10:00', end: '23:00' },
    },
    commissionType: 'percentage',
    commissionRate: 35,
    services: [
      { serviceId: 'sv1', name: '台球陪练', price: 120, duration: 60, commissionRate: 35 },
      { serviceId: 'sv2', name: '私人教学', price: 180, duration: 60, commissionRate: 40 },
      { serviceId: 'sv3', name: '比赛指导', price: 250, duration: 90, commissionRate: 45 },
    ],
    totalServices: 234,
    totalCommission: 8190,
    rating: 4.9,
    createdAt: '2022-01-15',
  },
  {
    id: 't3',
    name: '阿强',
    phone: '136****9012',
    level: 'junior',
    status: 'available',
    schedule: {
      0: { start: '14:00', end: '22:00' },
      1: { start: '14:00', end: '22:00' },
      2: { start: '14:00', end: '22:00' },
      3: { start: '14:00', end: '22:00' },
      4: { start: '14:00', end: '22:00' },
      5: null,
      6: { start: '10:00', end: '23:00' },
    },
    commissionType: 'percentage',
    commissionRate: 25,
    services: [
      { serviceId: 'sv1', name: '台球陪练', price: 80, duration: 60, commissionRate: 25 },
      { serviceId: 'sv2', name: '私人教学', price: 120, duration: 60, commissionRate: 30 },
    ],
    totalServices: 89,
    totalCommission: 1780,
    rating: 4.5,
    createdAt: '2024-03-01',
  },
  {
    id: 't4',
    name: '小陈',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaochen2024',
    phone: '137****3456',
    level: 'champion',
    status: 'off',
    schedule: {
      0: { start: '10:00', end: '22:00' },
      1: { start: '10:00', end: '22:00' },
      2: { start: '10:00', end: '22:00' },
      3: { start: '10:00', end: '22:00' },
      4: { start: '10:00', end: '22:00' },
      5: { start: '10:00', end: '22:00' },
      6: { start: '10:00', end: '22:00' },
    },
    commissionType: 'mixed',
    commissionRate: 40,
    baseSalary: 5000,
    services: [
      { serviceId: 'sv1', name: '台球陪练', price: 150, duration: 60, commissionRate: 40 },
      { serviceId: 'sv2', name: '私人教学', price: 220, duration: 60, commissionRate: 45 },
      { serviceId: 'sv3', name: '比赛指导', price: 300, duration: 90, commissionRate: 50 },
      { serviceId: 'sv4', name: '专业陪打', price: 200, duration: 60, commissionRate: 50 },
    ],
    totalServices: 412,
    totalCommission: 24720,
    rating: 5.0,
    createdAt: '2021-08-20',
  },
];

// 套餐数据
export const mockPackages: Package[] = [
  {
    id: 'pkg1',
    name: '新人体验套餐',
    type: 'time',
    originalPrice: 80,
    actualPrice: 59,
    description: '包含2小时畅打，适合新手体验',
    duration: 120,
    available: true,
    sort: 1,
  },
  {
    id: 'pkg2',
    name: '下午茶套餐',
    type: 'mixed',
    originalPrice: 120,
    actualPrice: 88,
    description: '2小时畅打 + 2杯饮品 + 1份爆米花',
    timeDuration: 120,
    includedProducts: [
      { productId: 'p6', quantity: 2 },
      { productId: 'p9', quantity: 1 },
    ],
    available: true,
    sort: 2,
  },
  {
    id: 'pkg3',
    name: '晚间畅打套餐',
    type: 'time',
    originalPrice: 200,
    actualPrice: 158,
    description: '4小时畅打，超时享8折优惠',
    duration: 240,
    available: true,
    sort: 3,
  },
  {
    id: 'pkg4',
    name: 'VIP尊享套餐',
    type: 'mixed',
    originalPrice: 380,
    actualPrice: 298,
    description: 'VIP桌4小时 + 4杯饮品 + 果盘 + 助教陪练1小时',
    timeDuration: 240,
    includeAssistant: true,
    includedProducts: [
      { productId: 'p6', quantity: 4 },
      { productId: 'p15', quantity: 1 },
    ],
    memberLevel: 'gold',
    available: true,
    sort: 4,
  },
  {
    id: 'pkg5',
    name: '团建套餐',
    type: 'mixed',
    originalPrice: 600,
    actualPrice: 468,
    description: '包场4小时 + 8杯饮品 + 2份果盘 + 助教陪练2小时',
    timeDuration: 240,
    includeAssistant: true,
    includedProducts: [
      { productId: 'p6', quantity: 8 },
      { productId: 'p14', quantity: 2 },
    ],
    available: true,
    sort: 5,
  },
  {
    id: 'pkg6',
    name: '会员专享月卡',
    type: 'membership',
    originalPrice: 999,
    actualPrice: 799,
    description: '30天内无限次畅打（每日限4小时），专享会员价商品',
    memberLevel: 'silver',
    validDays: 30,
    available: true,
    sort: 6,
  },
];

// 促销数据
export const mockPromotions: Promotion[] = [
  {
    id: 'promo1',
    name: '限时8折',
    type: 'discount',
    description: '下午场（14:00-18:00）台费限时8折',
    discountValue: 0.8,
    discountType: 'rate',
    rules: [{ type: 'threshold', discountRate: 0.8 }],
    scope: 'all',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    usedCount: 156,
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'promo2',
    name: '满100减20',
    type: 'discount',
    description: '消费满100元减20元',
    discountValue: 20,
    discountType: 'amount',
    rules: [{ type: 'full_reduction', minAmount: 100, discountAmount: 20 }],
    scope: 'all',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    usedCount: 89,
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'promo3',
    name: '会员日双倍积分',
    type: 'points_multiplier',
    description: '每周三会员消费享双倍积分',
    discountValue: 2,
    discountType: 'rate',
    rules: [],
    scope: 'all',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    usedCount: 234,
    status: 'active',
    memberLevels: ['silver', 'gold', 'diamond'],
    createdAt: '2024-01-01',
  },
  {
    id: 'promo4',
    name: '周末畅打7折',
    type: 'flash_sale',
    description: '周六周日台费7折优惠',
    discountValue: 0.7,
    discountType: 'rate',
    rules: [{ type: 'discount', discountRate: 0.7 }],
    scope: 'all',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    usedCount: 312,
    status: 'active',
    createdAt: '2024-01-01',
  },
  {
    id: 'promo5',
    name: '新客首单立减30',
    type: 'discount',
    description: '新会员首次消费立减30元',
    discountValue: 30,
    discountType: 'amount',
    rules: [{ type: 'threshold', minAmount: 50, discountAmount: 30 }],
    scope: 'all',
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-12-31T23:59:59Z',
    usedCount: 67,
    perPersonLimit: 1,
    status: 'active',
    createdAt: '2024-01-01',
  },
];

// 预约数据
export const mockReservations: Reservation[] = [
  {
    id: 'res1',
    tableId: 't4',
    customerName: '张先生',
    customerPhone: '138****1234',
    reservationTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    duration: 180,
    customerCount: 4,
    status: 'confirmed',
    source: 'phone',
    remarks: '需要安排靠近窗户的位置',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    operatorId: 'op1',
    notifySent: true,
  },
  {
    id: 'res2',
    customerName: '李女士',
    customerPhone: '139****5678',
    reservationTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    customerCount: 2,
    status: 'pending',
    source: 'wechat',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    operatorId: 'op1',
    notifySent: false,
  },
  {
    id: 'res3',
    tableId: 't10',
    customerName: '王老板',
    customerPhone: '136****9012',
    reservationTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    duration: 240,
    customerCount: 8,
    status: 'confirmed',
    source: 'app',
    remarks: '团建活动，需要准备果盘和饮品',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    operatorId: 'op2',
    notifySent: true,
  },
];

// 模拟日报数据
export const mockDailyReport: DailyReport = {
  date: new Date().toISOString().split('T')[0],
  timeSlots: [
    { name: '上午场（9:00-14:00）', openTables: 6, tableRevenue: 480, productRevenue: 156, assistantRevenue: 200, totalRevenue: 836 },
    { name: '下午场（14:00-18:00）', openTables: 8, tableRevenue: 720, productRevenue: 234, assistantRevenue: 300, totalRevenue: 1254 },
    { name: '晚场（18:00-23:00）', openTables: 10, tableRevenue: 1200, productRevenue: 456, assistantRevenue: 500, totalRevenue: 2156 },
  ],
  summary: {
    totalRevenue: 4246,
    tableRevenue: 2400,
    productRevenue: 846,
    assistantRevenue: 1000,
    discountAmount: 320,
    couponAmount: 180,
    memberRecharge: 1500,
    newMembers: 3,
    totalCustomers: 48,
    avgTableDuration: 156,
  },
  paymentMethods: [
    { method: 'wechat', count: 28, amount: 1896 },
    { method: 'alipay', count: 15, amount: 1280 },
    { method: 'cash', count: 8, amount: 520 },
    { method: 'member', count: 5, amount: 350 },
    { method: 'bankcard', count: 4, amount: 200 },
  ],
  tables: [
    { tableId: 't1', tableName: '01', openCount: 4, totalDuration: 420, revenue: 280 },
    { tableId: 't2', tableName: '02', openCount: 3, totalDuration: 320, revenue: 213 },
    { tableId: 't3', tableName: '03', openCount: 5, totalDuration: 480, revenue: 320 },
    { tableId: 't4', tableName: '04', openCount: 2, totalDuration: 180, revenue: 150 },
    { tableId: 't5', tableName: '05', openCount: 4, totalDuration: 380, revenue: 253 },
    { tableId: 't6', tableName: '06', openCount: 3, totalDuration: 280, revenue: 187 },
    { tableId: 't7', tableName: '07', openCount: 4, totalDuration: 400, revenue: 267 },
    { tableId: 't8', tableName: '08', openCount: 3, totalDuration: 300, revenue: 200 },
    { tableId: 't9', tableName: '09', openCount: 2, totalDuration: 180, revenue: 150 },
    { tableId: 't10', tableName: 'VIP1', openCount: 3, totalDuration: 360, revenue: 480 },
  ],
  technicians: [
    { technicianId: 't1', name: '小李', serviceCount: 12, revenue: 1200, commission: 360 },
    { technicianId: 't2', name: '小王', serviceCount: 8, revenue: 960, commission: 336 },
    { technicianId: 't3', name: '阿强', serviceCount: 5, revenue: 400, commission: 100 },
  ],
  topProducts: [
    { productId: 'p6', name: '奶茶', quantity: 28, revenue: 560 },
    { productId: 'p15', name: '果盘（大）', quantity: 12, revenue: 696 },
    { productId: 'p7', name: '红牛', quantity: 25, revenue: 375 },
    { productId: 'p14', name: '果盘（小）', quantity: 10, revenue: 350 },
    { productId: 'p5', name: '柠檬茶', quantity: 15, revenue: 225 },
  ],
};
