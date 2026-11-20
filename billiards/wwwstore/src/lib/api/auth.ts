import { post } from './client';
import { API_ENDPOINTS } from './config';

export interface LoginResponse {
  token: string;
  employee?: {
    id: string;
    username: string;
    name: string;
    phone: string;
    role: string;
    role_name: string;
    roles: string[];
    store_id: string;
    store_name: string;
    status: string;
  };
  id?: string;
  username?: string;
  name?: string;
  phone?: string;
  role?: string;
  role_name?: string;
  roles?: string[];
  store_id?: string;
  store_name?: string;
  status?: string;
}

export interface LoginParams {
  phone: string;
  password: string;
  [key: string]: unknown;
}

export interface SmsLoginParams {
  phone: string;
  code: string;
  [key: string]: unknown;
}

export interface SendSmsParams {
  phone: string;
  type: string;
  [key: string]: unknown;
}

export async function login(params: LoginParams): Promise<LoginResponse> {
  return post<LoginResponse>(API_ENDPOINTS.login, params);
}

export async function smsLogin(params: SmsLoginParams): Promise<LoginResponse> {
  return post<LoginResponse>(API_ENDPOINTS.smsLogin, params);
}

export async function sendSmsCode(params: SendSmsParams): Promise<{ code: number; msg: string }> {
  return post<{ code: number; msg: string }>(API_ENDPOINTS.sendSms, params);
}