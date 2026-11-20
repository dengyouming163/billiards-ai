'use client';

import { API_BASE_URL, API_TIMEOUT } from './config';
import { ApiResponse, ApiListData, ApiResponseType } from './types';

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

function snakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map((item) => snakeToCamel(item)) as T;
  if (typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      (acc as Record<string, unknown>)[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as T);
  }
  return obj as T;
}

function showErrorToast(message: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('showToast', {
      detail: { type: 'error', message },
    });
    window.dispatchEvent(event);
  }
}

function showSuccessToast(message: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('showToast', {
      detail: { type: 'success', message },
    });
    window.dispatchEvent(event);
  }
}

function handleApiResult<T>(
  result: unknown,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): T {
  if (Array.isArray(result)) {
    return snakeToCamel<T>(result);
  }

  if (result === null || typeof result !== 'object') {
    return (responseType === ApiResponseType.ARRAY ? [] : null) as T;
  }

  const response = result as ApiResponse<unknown>;

  if ('code' in response) {
    // 2001 未登录 / 2002 登录超时 → 统一跳转登录页
    if (response.code === 2001 || response.code === 2002) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('currentOperator');
      localStorage.removeItem('currentShift');

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        showErrorToast(response.msg || '请重新登录');
        setTimeout(() => {
          window.location.replace('/login');
        }, 1500);
      }

      throw new Error(response.msg || '请重新登录');
    }

    // Accept code 1 (standard) or code 0 (external-service endpoints like setting.Setting, channel.Channel)
    if (response.code !== 1 && response.code !== 0) {
      throw new Error(response.msg || '请求失败');
    }

    const data = response.data;

    switch (responseType) {
      case ApiResponseType.LIST:
        if (data && typeof data === 'object' && 'lists' in data) {
          const listData = data as ApiListData<unknown>;
          return snakeToCamel<T>(listData.lists);
        }
        if (Array.isArray(data)) {
          return snakeToCamel<T>(data);
        }
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
          return snakeToCamel<T>((data as { data: unknown }).data);
        }
        return [] as T;

      case ApiResponseType.ARRAY:
        if (Array.isArray(data)) {
          return snakeToCamel<T>(data);
        }
        if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: unknown }).data)) {
          return snakeToCamel<T>((data as { data: unknown }).data);
        }
        return [] as T;

      case ApiResponseType.RAW:
        return data as T;

      case ApiResponseType.NORMAL:
      default:
        return snakeToCamel<T>(data);
    }
  }

  return snakeToCamel<T>(response);
}

function handleApiError(error: unknown) {
  console.error('API Error:', error);
  if (error instanceof Error) {
    showErrorToast(error.message);
  } else {
    showErrorToast('请求失败，请稍后重试');
  }
  // 不重新抛出 — toast 已通知用户，调用方通过 .catch 自行决定后续行为
}

let _cachedStoreId: string | null = null;
let _cachedUserInfo: string | null = null;

function getStoreId(): string {
  try {
    // 优先读取独立存储的 storeId（不受登录/用户切换影响）
    const dedicated = localStorage.getItem('currentStoreId');
    if (dedicated) return dedicated;

    // 兜底：从 userInfo 中读取
    const raw = localStorage.getItem('userInfo');
    if (raw === _cachedUserInfo && _cachedStoreId !== null) {
      return _cachedStoreId;
    }
    _cachedUserInfo = raw;
    if (raw) {
      const parsed = JSON.parse(raw);
      const storeId = parsed.storeId || parsed.store_id || '';
      _cachedStoreId = storeId || '';
      if (_cachedStoreId) return _cachedStoreId;
    }
  } catch (error) {
    console.error('[API Client] Error getting storeId:', error);
  }
  _cachedStoreId = '';
  return '';
}

function injectStoreId(params?: Record<string, unknown>): Record<string, unknown> {
  const storeId = getStoreId();
  if (!storeId) return params || {};
  if (!params) return { store_id: storeId };
  if (params.store_id) return params;
  return { ...params, store_id: storeId };
}

export async function get<T>(
  url: string,
  params?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedParams = injectStoreId(params);
    const queryString = injectedParams
      ? '?' + new URLSearchParams(injectedParams as Record<string, string>).toString()
      : '';

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${url}${queryString}`, {
      method: 'GET',
      headers,
    });

    const result = await response.json();
    return handleApiResult<T>(result, responseType);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function post<T>(
  url: string,
  data?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedData = injectStoreId(data);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers,
      body: injectedData ? JSON.stringify(injectedData) : undefined,
    });

    const result = await response.json();
    const handledResult = handleApiResult<T>(result, responseType);

    if ('msg' in result && (result as ApiResponse).msg && (result as ApiResponse).show === 1) {
      showSuccessToast((result as ApiResponse).msg);
    }

    return handledResult;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function put<T>(
  url: string,
  data?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedData = injectStoreId(data);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers,
      body: injectedData ? JSON.stringify(injectedData) : undefined,
    });

    const result = await response.json();
    const handledResult = handleApiResult<T>(result, responseType);

    if ('msg' in result && (result as ApiResponse).msg && (result as ApiResponse).show === 1) {
      showSuccessToast((result as ApiResponse).msg);
    }

    return handledResult;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function del<T>(
  url: string,
  params?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedParams = injectStoreId(params);
    const queryString = injectedParams
      ? '?' + new URLSearchParams(injectedParams as Record<string, string>).toString()
      : '';

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetchWithTimeout(`${API_BASE_URL}${url}${queryString}`, {
      method: 'DELETE',
      headers,
    });

    const result = await response.json();
    return handleApiResult<T>(result, responseType);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export const api = {
  get,
  post,
  put,
  del,
};
