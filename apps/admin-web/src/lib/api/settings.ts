import { get, post } from './client';
import { ApiResponseType } from './types';
import { API_ENDPOINTS } from './config';

export interface NotificationSettings {
  tableTimeout: boolean;
  lowStock: boolean;
  newOrder: boolean;
  [key: string]: unknown;
}

export interface SecuritySettings {
  twoFactor: boolean;
  operationLog: boolean;
  dataBackup: boolean;
  [key: string]: unknown;
}

export interface DisplaySettings {
  darkMode: boolean;
  realTimeRefresh: boolean;
  [key: string]: unknown;
}

export interface BusinessSettings {
  bookingEnabled: boolean;
  bookingTimeout: boolean;
  bookingMaxHours: number;
  [key: string]: unknown;
}

export interface PaymentSettings {
  wechat: boolean;
  alipay: boolean;
  cash: boolean;
  member: boolean;
  autoChange: boolean;
  roundZero: boolean;
  receiptPrint: boolean;
  receiptCopies: number;
  [key: string]: unknown;
}

export async function updateStore(data: {
  name?: string;
  address?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  business_hours_start?: string;
  business_hours_end?: string;
}) {
  return post('/store.Store/update', data, ApiResponseType.NORMAL);
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return get('/setting.Setting/getNotification', {}, ApiResponseType.NORMAL);
}

export async function saveNotificationSettings(data: NotificationSettings) {
  return post('/setting.Setting/saveNotification', data, ApiResponseType.NORMAL);
}

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  return get('/setting.Setting/getSecurity', {}, ApiResponseType.NORMAL);
}

export async function saveSecuritySettings(data: SecuritySettings) {
  return post('/setting.Setting/saveSecurity', data, ApiResponseType.NORMAL);
}

export async function fetchDisplaySettings(): Promise<DisplaySettings> {
  return get('/setting.Setting/getDisplay', {}, ApiResponseType.NORMAL);
}

export async function saveDisplaySettings(data: DisplaySettings) {
  return post('/setting.Setting/saveDisplay', data, ApiResponseType.NORMAL);
}

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  return get('/setting.Setting/getBusiness', {}, ApiResponseType.NORMAL);
}

export async function saveBusinessSettings(data: BusinessSettings) {
  return post('/setting.Setting/saveBusiness', data, ApiResponseType.NORMAL);
}

export async function fetchPaymentSettings(): Promise<PaymentSettings> {
  return get('/setting.Setting/getPayment', {}, ApiResponseType.NORMAL);
}

export async function savePaymentSettings(data: PaymentSettings) {
  return post('/setting.Setting/savePayment', data, ApiResponseType.NORMAL);
}