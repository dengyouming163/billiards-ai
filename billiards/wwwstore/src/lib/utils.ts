// 工具函数集合
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化金额
 */
export function formatCurrency(amount: number | string | undefined): string {
  const num = typeof amount === 'number' ? amount : (typeof amount === 'string' ? parseFloat(amount) : 0);
  return `¥${(isNaN(num) ? 0 : num).toFixed(2)}`;
}

/**
 * 格式化金额（不带货币符号）
 */
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * 格式化时长（分钟转小时:分钟）
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分钟`;
  if (mins === 0) return `${hours}小时`;
  return `${hours}小时${mins}分钟`;
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

export const formatDistanceToNow = formatRelativeTime;

/**
 * 格式化日期时间
 */
export function formatDateTime(date: string | Date): string {
  if (!date || date === '0000-00-00') return '-';
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '-';
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  if (!date || date === '0000-00-00') return '-';
  const d = new Date(date);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '-';
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化时间
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 生成订单号
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${date}${random}`;
}

/**
 * 状态颜色映射
 */
export const tableStatusColors: Record<string, string> = {
  idle: 'text-green-500',
  occupied: 'text-red-500',
  reserved: 'text-amber-500',
  maintenance: 'text-gray-500',
};

export const tableStatusBgColors: Record<string, string> = {
  idle: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-amber-500',
  maintenance: 'bg-gray-500',
};

export const tableStatusLabels: Record<string, string> = {
  idle: '空闲',
  occupied: '使用中',
  reserved: '预约',
  maintenance: '维护',
};

/**
 * 台型标签
 */
export const tableTypeLabels: Record<string, string> = {
  standard: '标台',
  tournament: '赛台',
  snooker: '斯诺克',
};

/**
 * 台型颜色
 */
export const tableTypeColors: Record<string, string> = {
  standard: 'bg-[#07C160]',
  tournament: 'bg-[#06B6D4]',
  snooker: 'bg-[#8B5CF6]',
};

/**
 * 助教等级标签
 */
export const assistantLevelLabels: Record<string, string> = {
  junior: '初级',
  intermediate: '中级',
  senior: '高级',
  gold: '金牌',
};

/**
 * 助教等级颜色
 */
export const assistantLevelColors: Record<string, string> = {
  junior: 'bg-gray-100 text-gray-700',
  intermediate: 'bg-blue-100 text-blue-700',
  senior: 'bg-purple-100 text-purple-700',
  gold: 'bg-amber-100 text-amber-700',
};

/**
 * 会员等级标签
 */
export const memberLevelLabels: Record<string, string> = {
  normal: '普通',
  silver: '银卡',
  gold: '金卡',
  diamond: '钻石',
};

/**
 * 会员等级颜色
 */
export const memberLevelColors: Record<string, string> = {
  normal: 'bg-gray-100 text-gray-700',
  silver: 'bg-slate-200 text-slate-700',
  gold: 'bg-amber-100 text-amber-700',
  diamond: 'bg-violet-100 text-violet-700',
};

/**
 * 订单状态标签
 */
export const orderStatusLabels: Record<string, string> = {
  pending: '待支付',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

/**
 * 订单状态颜色
 */
export const orderStatusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

/**
 * 员工角色标签
 */
export const employeeRoleLabels: Record<string, string> = {
  owner: '老板',
  manager: '店长',
  cashier: '收银员',
  waiter: '服务员',
  assistant: '助教',
};

/**
 * 计算使用时长
 */
export function calculateDuration(startTime: string | Date): number {
  const start = new Date(startTime);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 60000);
}

/**
 * 计算订单费用
 */
export function calculateOrderFee(
  duration: number,
  pricePerHour: number,
  minimumCharge: number = 0,
  minimumMinutes: number = 0
): number {
  if (duration <= minimumMinutes) return minimumCharge;
  const hours = duration / 60;
  return Math.max(minimumCharge, hours * pricePerHour);
}

/**
 * 获取当前时段
 */
export function getCurrentPeriod(periods: { startTime: string; endTime: string }[]): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  for (let i = 0; i < periods.length; i++) {
    const [startH, startM] = periods[i].startTime.split(':').map(Number);
    const [endH, endM] = periods[i].endTime.split(':').map(Number);
    const start = startH * 60 + startM;
    const end = endH * 60 + endM;
    
    if (currentMinutes >= start && currentMinutes < end) {
      return i;
    }
  }
  
  return 0;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 数字动画
 */
export function animateValue(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void {
  const startTime = performance.now();
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * easeOut;
    
    callback(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * 中文数字
 */
export function toChineseNumber(num: number): string {
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  if (num <= 10) return chineseNumbers[num];
  if (num < 20) return `十${chineseNumbers[num - 10]}`;
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${chineseNumbers[tens]}十${ones > 0 ? chineseNumbers[ones] : ''}`;
  }
  return num.toString();
}

/**
 * 验证手机号
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 脱敏手机号
 */
export function maskPhone(phone: string): string {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 脱敏姓名
 */
export function maskName(name: string): string {
  if (name.length <= 1) return name;
  return name[0] + '*'.repeat(name.length - 1);
}

/**
 * 百分比格式化
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 数字千分位格式化
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}
