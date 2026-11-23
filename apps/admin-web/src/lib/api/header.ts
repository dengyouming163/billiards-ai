import { get, post } from './client';
import { ApiResponseType } from './types';

export interface Notification {
  id: string;
  type: string;
  typeText: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResult {
  list: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HelpItem {
  id: string;
  category: string;
  title: string;
  content?: string;
  summary?: string;
  created_at?: string;
}

export interface HelpCategory {
  key: string;
  label: string;
}

export interface Profile {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role: string;
  storeId: string;
}

export interface SecuritySettings {
  twoFactor: boolean;
  loginAlert: boolean;
  sessionTimeout: number;
  [key: string]: unknown;
}

export async function fetchNotifications(params?: { page?: number; page_size?: number }): Promise<NotificationListResult> {
  return get('/notification.Notification/lists', params, ApiResponseType.NORMAL);
}

export async function markNotificationRead(id: string): Promise<void> {
  return post('/notification.Notification/read', { id }, ApiResponseType.NORMAL);
}

export async function markAllNotificationsRead(): Promise<void> {
  return post('/notification.Notification/readAll', {}, ApiResponseType.NORMAL);
}

export async function deleteNotification(id: string): Promise<void> {
  return post('/notification.Notification/delete', { id }, ApiResponseType.NORMAL);
}

export async function fetchUnreadCount(): Promise<{ count: number }> {
  return get('/notification.Notification/unreadCount', {}, ApiResponseType.NORMAL);
}

const HELP_BASE = 'https://api.tpzl88.com/api/help.php';

export async function fetchHelpList(params?: { category?: string }): Promise<HelpItem[]> {
  const query = params?.category ? '&category=' + params.category : '';
  const resp = await fetch(`${HELP_BASE}?type=articles${query}`);
  const json = await resp.json();
  return json?.data?.list || [];
}

export async function fetchHelpCategories(): Promise<HelpCategory[]> {
  const resp = await fetch(`${HELP_BASE}?type=articles`);
  const json = await resp.json();
  const items = json?.data?.list || [];
  const catMap = new Map<string, string>();
  items.forEach((item: any) => {
    if (item.category && !catMap.has(item.category)) catMap.set(item.category, item.category);
  });
  return Array.from(catMap, ([key, label]) => ({ key, label }));
}

export async function fetchProfile(): Promise<Profile> {
  return get('/profile.Profile/detail', {}, ApiResponseType.NORMAL);
}

export async function updateProfile(data: { name?: string; phone?: string }): Promise<Profile> {
  return post('/profile.Profile/update', data, ApiResponseType.NORMAL);
}

export async function updateAvatar(avatar: string): Promise<{ avatar: string }> {
  return post('/profile.Profile/avatar', { avatar }, ApiResponseType.NORMAL);
}

export async function changePassword(data: { oldPassword: string; newPassword: string; confirmPassword: string }): Promise<void> {
  return post('/account.Account/password', data, ApiResponseType.NORMAL);
}

export async function fetchSecuritySettings(): Promise<SecuritySettings> {
  return get('/account.Account/security', {}, ApiResponseType.NORMAL);
}

export async function saveSecuritySettings(data: SecuritySettings): Promise<SecuritySettings> {
  return post('/account.Account/saveSecurity', data, ApiResponseType.NORMAL);
}