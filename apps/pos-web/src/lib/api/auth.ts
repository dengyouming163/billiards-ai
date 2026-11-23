import { post } from './client';
import { API_ENDPOINTS } from './config';

export interface PosLoginResult {
  token: string;
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  roleName?: string;
  role_name?: string;
  roles: string[];
  storeId?: string;
  store_id?: string;
  storeName?: string;
  store_name?: string;
  status: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface SmsLoginParams {
  phone: string;
  code: string;
}

export interface SendSmsParams {
  phone: string;
  type: string;
}

export async function login(params: LoginParams): Promise<PosLoginResult> {
  return post<PosLoginResult>(API_ENDPOINTS.login, params as unknown as Record<string, unknown>);
}

export async function smsLogin(params: SmsLoginParams): Promise<PosLoginResult> {
  return post<PosLoginResult>(API_ENDPOINTS.smsLogin, params as unknown as Record<string, unknown>);
}

export async function sendSmsCode(params: SendSmsParams): Promise<{ code: number; msg: string }> {
  return post<{ code: number; msg: string }>(API_ENDPOINTS.sendSms, params as unknown as Record<string, unknown>);
}
