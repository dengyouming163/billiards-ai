'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, post } from './api/client';
import { API_ENDPOINTS } from './api/config';
import { login as apiLogin, smsLogin as apiSmsLogin, sendSmsCode as apiSendSms } from './api/auth';

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  roleName: string;
  roles: string[];
  storeId: string;
  storeName: string;
  status: string;
}

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  smsLogin: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  sendSmsCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (user: UserInfo) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'userInfo';
const TOKEN_KEY = 'token';

function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Strict`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser) as UserInfo;
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch {
      clearAuth();
    }
    setLoading(false);
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie('token');
  };

  const login = useCallback(async (phone: string, password: string) => {
    try {
      const data = await apiLogin({ phone, password });

      if (!data) {
        return { success: false, error: '登录失败：数据格式错误' };
      }

      const token = data.token;
      if (!token) {
        return { success: false, error: '登录失败：数据格式错误' };
      }

      // API client 已做 snakeToCamel 转换，字段均为 camelCase
      const userInfo: UserInfo = {
        id: data.id || '',
        username: data.username || '',
        name: data.name || '',
        phone: data.phone || '',
        role: data.role || '',
        roleName: data.roleName || data.role_name || '',
        roles: data.roles || [],
        storeId: data.storeId || data.store_id || '',
        storeName: data.storeName || data.store_name || '',
        status: data.status || '',
      };

      setUser(userInfo);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      localStorage.setItem(TOKEN_KEY, token);
      setCookie('token', token, 7);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      return { success: false, error: errorMsg };
    }
  }, []);

  const smsLogin = useCallback(async (phone: string, code: string) => {
    try {
      const data = await apiSmsLogin({ phone, code });

      if (!data) {
        return { success: false, error: '登录失败：数据格式错误' };
      }

      const token = data.token;
      if (!token) {
        return { success: false, error: '登录失败：数据格式错误' };
      }

      // API client 已做 snakeToCamel 转换，字段均为 camelCase
      const userInfo: UserInfo = {
        id: data.id || '',
        username: data.username || '',
        name: data.name || '',
        phone: data.phone || '',
        role: data.role || '',
        roleName: data.roleName || data.role_name || '',
        roles: data.roles || [],
        storeId: data.storeId || data.store_id || '',
        storeName: data.storeName || data.store_name || '',
        status: data.status || '',
      };

      setUser(userInfo);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      localStorage.setItem(TOKEN_KEY, token);
      setCookie('token', token, 7);
      return { success: true };
    } catch (error) {
      console.error('SMS Login error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      return { success: false, error: errorMsg };
    }
  }, []);

  const sendSmsCode = useCallback(async (phone: string) => {
    try {
      const response = await apiSendSms({ phone, type: 'login' });
      if (!response || response.code !== 1) {
        return { success: false, error: response?.msg || '发送失败' };
      }
      return { success: true };
    } catch (error) {
      console.error('Send SMS error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await post(API_ENDPOINTS.logout, {});
    } catch {
      // ignore
    }
    clearAuth();
  }, []);

  const updateUser = useCallback((userInfo: UserInfo) => {
    setUser(userInfo);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, smsLogin, sendSmsCode, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
