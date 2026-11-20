'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api/client';
import { API_BASE_URL } from './api/config';
import { fetchEmployeePermissions } from './api/employees';
import type { components } from './api/openapi';

export type StoreUser = components['schemas']['UserInfo'];

interface AuthContextType {
  user: StoreUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  permissionCodes: string[];
  permissionsLoading: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  smsLogin: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  sendSmsCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  const [user, setUser] = useState<StoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissionCodes, setPermissionCodes] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  useEffect(() => {
    initAuth();
  }, []);

  const loadPermissions = async (storeId: string) => {
    if (!storeId) return;
    setPermissionsLoading(true);
    try {
      const codes = await fetchEmployeePermissions(storeId);
      setPermissionCodes(codes || []);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      setPermissionCodes([]);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const initAuth = async () => {
    try {
      const storedUser = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem(TOKEN_KEY);

      if (storedUser && token) {
        const parsed = JSON.parse(storedUser) as StoreUser;
        setUser(parsed);

        const isValid = await validateTokenWithRetry(token);

        if (isValid) {
          setIsAuthenticated(true);
          if (parsed.store_id) {
            loadPermissions(parsed.store_id);
          }
        } else {
          clearAuth();
        }
      }
    } catch {
      clearAuth();
    }
    setLoading(false);
  };

  const validateTokenWithRetry = async (token: string, retryCount: number = 0): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth.Auth/info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) return false;
      
      const result = await response.json();
      
      if (result.code === 1 && result.data) {
        const userInfo = {
          id: result.data?.id || '',
          username: result.data?.username || '',
          name: result.data?.name || '',
          phone: result.data?.phone || '',
          role: result.data?.role || '',
          roleName: result.data?.role_name || '',
          roles: result.data?.roles || [],
          storeId: result.data?.store_id || '',
          storeName: result.data?.store_name || '',
          status: result.data?.status || '',
        };
        
        setUser(userInfo as StoreUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
        return true;
      }
      
      return false;
    } catch (error) {
      if (retryCount < 1) {
        return validateTokenWithRetry(token, retryCount + 1);
      }
      return false;
    }
  };

  const clearAuth = () => {
    setUser(null);
    setIsAuthenticated(false);
    setPermissionCodes([]);
    setPermissionsLoading(false);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie('token');
  };

  const login = useCallback(async (phone: string, password: string) => {
    try {
      clearAuth();
      const data = await api.auth.login({ phone, password });
      
      if (!data) {
        return { success: false, error: '登录失败：数据格式错误' };
      }
      
      const token = data.token;
      
      if (!token) {
        return { success: false, error: '登录失败：数据格式错误' };
      }
      
      const userInfo = {
        id: data.employee?.id || data.id || '',
        username: data.employee?.username || data.username || '',
        name: data.employee?.name || data.name || '',
        phone: data.employee?.phone || data.phone || '',
        role: data.employee?.role || data.role || '',
        roleName: data.employee?.role_name || data.role_name || '',
        roles: data.employee?.roles || data.roles || [],
        storeId: data.employee?.store_id || data.store_id || '',
        storeName: data.employee?.store_name || data.store_name || '',
        status: data.employee?.status || data.status || '',
      };
      
      setUser(userInfo as StoreUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      localStorage.setItem(TOKEN_KEY, token);
      setCookie('token', token, 7);
      loadPermissions(userInfo.storeId);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      return { success: false, error: errorMsg };
    }
  }, []);

  const smsLogin = useCallback(async (phone: string, code: string) => {
    try {
      clearAuth();
      const data = await api.auth.smsLogin({ phone, code });
      
      if (!data) {
        return { success: false, error: '登录失败：数据格式错误' };
      }
      
      const token = data.token;
      
      if (!token) {
        return { success: false, error: '登录失败：数据格式错误' };
      }
      
      const userInfo = {
        id: data.employee?.id || data.id || '',
        username: data.employee?.username || data.username || '',
        name: data.employee?.name || data.name || '',
        phone: data.employee?.phone || data.phone || '',
        role: data.employee?.role || data.role || '',
        roleName: data.employee?.role_name || data.role_name || '',
        roles: data.employee?.roles || data.roles || [],
        storeId: data.employee?.store_id || data.store_id || '',
        storeName: data.employee?.store_name || data.store_name || '',
        status: data.employee?.status || data.status || '',
      };
      
      setUser(userInfo as StoreUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userInfo));
      localStorage.setItem(TOKEN_KEY, token);
      setCookie('token', token, 7);
      loadPermissions(userInfo.storeId);
      return { success: true };
    } catch (error) {
      console.error('SMS Login error:', error);
      const errorMsg = error instanceof Error ? error.message : '网络异常，请稍后重试';
      return { success: false, error: errorMsg };
    }
  }, []);

  const sendSmsCode = useCallback(async (phone: string) => {
    try {
      const response = await api.auth.sendSmsCode({ phone, type: 'login' });
      
      // post() already throws on code !== 1, so reaching here means success
      if (!response) {
        return { success: false, error: '发送失败' };
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
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth.Auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch {
      // ignore
    }
    
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, permissionCodes, permissionsLoading, isLoading: loading || permissionsLoading, login, smsLogin, sendSmsCode, logout }}>
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
