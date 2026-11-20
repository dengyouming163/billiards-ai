"use client";

import { API_BASE_URL } from "./config";
import { ApiResponse, ApiListData, ApiResponseType } from "./types";
import { login, smsLogin, sendSmsCode } from "./auth";

const API_TIMEOUT = 15000;

/**
 * 显示错误提示
 */
function showErrorToast(message: string) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("showToast", {
      detail: { type: "error", message },
    });
    window.dispatchEvent(event);
  }
}

/**
 * 显示成功提示
 */
function showSuccessToast(message: string) {
  if (typeof window !== "undefined") {
    const event = new CustomEvent("showToast", {
      detail: { type: "success", message },
    });
    window.dispatchEvent(event);
  }
}

/**
 * 处理API响应 - 标准化版本
 * @param result 原始响应
 * @param responseType 响应类型
 * @returns 处理后的数据
 */
function handleApiResult<T>(
  result: unknown,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): T {
  // 1. 直接是数组的情况（旧格式兼容）
  if (Array.isArray(result)) {
    return result as T;
  }

  // 2. 不是对象，返回空数组或null
  if (result === null || typeof result !== "object") {
    return (responseType === ApiResponseType.ARRAY ? [] : null) as T;
  }

  const response = result as ApiResponse<unknown>;

  // 3. 检查是否有code字段（标准格式）
  if ("code" in response) {
    // 处理登录超时
    if (response.code === 2002) {
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");

      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        showErrorToast(response.msg || "登录超时，请重新登录");
        setTimeout(() => {
          window.location.replace("/login");
        }, 1500);
      }

      throw new Error(response.msg || "登录超时，请重新登录");
    }

    // 处理业务错误
    if (response.code !== 1) {
      throw new Error(response.msg || "请求失败");
    }

    // 处理成功响应
    const data = response.data;

    switch (responseType) {
      case ApiResponseType.LIST:
        // 列表格式：提取 lists 字段
        if (data && typeof data === "object" && "lists" in data) {
          const listData = data as ApiListData<unknown>;
          return listData.lists as T;
        }
        // 兼容：data 本身就是数组
        if (Array.isArray(data)) {
          return data as T;
        }
        // 兼容：嵌套 data 格式
        if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
          return (data as { data: unknown }).data as T;
        }
        return [] as T;

      case ApiResponseType.ARRAY:
        // 数组格式：直接返回 data 或空数组
        if (Array.isArray(data)) {
          return data as T;
        }
        // 兼容：嵌套 data 格式
        if (data && typeof data === "object" && "data" in data && Array.isArray((data as { data: unknown }).data)) {
          return (data as { data: unknown }).data as T;
        }
        return [] as T;

      case ApiResponseType.NORMAL:
      default:
        // 普通格式：返回 data
        return data as T;
    }
  }

  // 4. 没有 code 字段，直接返回（旧格式兼容）
  return response as T;
}

/**
 * 处理API错误
 */
function handleApiError(error: unknown) {
  console.error("API Error:", error);
  if (error instanceof Error) {
    showErrorToast(error.message);
  } else {
    showErrorToast("请求失败，请稍后重试");
  }
  throw error;
}

function getStoreId(): string {
  try {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      const storeId = parsed.storeId || parsed.store_id || "";
      if (storeId) {
        console.log("[API Client] StoreId found:", storeId);
        return storeId;
      }
    }
    console.log("[API Client] No storeId in localStorage");
  } catch (error) {
    console.error("[API Client] Error getting storeId:", error);
  }
  return "";
}

function injectStoreId(params?: Record<string, unknown>): Record<string, unknown> {
  const storeId = getStoreId();
  if (!storeId) {
    console.warn("[API Client] No storeId available, request may fail!");
    return params || {};
  }
  
  if (!params) {
    return { store_id: storeId };
  }
  
  if (params.store_id) {
    return params;
  }
  
  const newParams = { ...params, store_id: storeId };
  console.log("[API Client] Injecting store_id:", storeId, "into params:", newParams);
  return newParams;
}

/**
 * 标准化GET请求
 * @param url 接口地址
 * @param params 查询参数
 * @param responseType 响应类型
 * @returns 处理后的数据
 */
export async function get<T>(
  url: string,
  params?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedParams = injectStoreId(params);
    const queryString = injectedParams
      ? "?" + new URLSearchParams(injectedParams as Record<string, string>).toString()
      : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const result = await response.json();
    return handleApiResult<T>(result, responseType);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("请求超时，请稍后重试");
      handleApiError(timeoutError);
      throw timeoutError;
    }
    handleApiError(error);
    throw error;
  }
}

/**
 * 标准化POST请求
 * @param url 接口地址
 * @param data 请求数据
 * @param responseType 响应类型
 * @returns 处理后的数据
 */
export async function post<T>(
  url: string,
  data?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedData = injectStoreId(data);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers,
      body: injectedData ? JSON.stringify(injectedData) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const result = await response.json();
    const handledResult = handleApiResult<T>(result, responseType);

    // POST操作默认显示成功提示
    if ("msg" in result && (result as ApiResponse).msg && (result as ApiResponse).show === 1) {
      showSuccessToast((result as ApiResponse).msg);
    }

    return handledResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("请求超时，请稍后重试");
      handleApiError(timeoutError);
      throw timeoutError;
    }
    handleApiError(error);
    throw error;
  }
}

/**
 * 标准化PUT请求
 * @param url 接口地址
 * @param data 请求数据
 * @param responseType 响应类型
 * @returns 处理后的数据
 */
export async function put<T>(
  url: string,
  data?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedData = injectStoreId(data);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers,
      body: injectedData ? JSON.stringify(injectedData) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const result = await response.json();
    const handledResult = handleApiResult<T>(result, responseType);

    // PUT操作默认显示成功提示
    if ("msg" in result && (result as ApiResponse).msg && (result as ApiResponse).show === 1) {
      showSuccessToast((result as ApiResponse).msg);
    }

    return handledResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("请求超时，请稍后重试");
      handleApiError(timeoutError);
      throw timeoutError;
    }
    handleApiError(error);
    throw error;
  }
}

/**
 * 标准化DELETE请求
 * @param url 接口地址
 * @param params 查询参数
 * @param responseType 响应类型
 * @returns 处理后的数据
 */
export async function del<T>(
  url: string,
  params?: Record<string, unknown>,
  responseType: ApiResponseType = ApiResponseType.NORMAL
): Promise<T> {
  try {
    const injectedParams = injectStoreId(params);
    const queryString = injectedParams
      ? "?" + new URLSearchParams(injectedParams as Record<string, string>).toString()
      : "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: "DELETE",
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`请求失败 (${response.status})`);
    }

    const result = await response.json();
    const handledResult = handleApiResult<T>(result, responseType);

    // DELETE操作默认显示成功提示
    if ("msg" in result && (result as ApiResponse).msg && (result as ApiResponse).show === 1) {
      showSuccessToast((result as ApiResponse).msg);
    }

    return handledResult;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutError = new Error("请求超时，请稍后重试");
      handleApiError(timeoutError);
      throw timeoutError;
    }
    handleApiError(error);
    throw error;
  }
}

/**
 * 文件下载请求
 * @param url 接口地址
 * @param params 查询参数
 * @param filename 文件名
 */
export async function download(
  url: string,
  params?: Record<string, unknown>,
  filename?: string
): Promise<void> {
  try {
    const injectedParams = injectStoreId(params);
    const queryString = injectedParams
      ? "?" + new URLSearchParams(injectedParams as Record<string, string>).toString()
      : "";

    const token = localStorage.getItem("token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${API_BASE_URL}${url}${queryString}`, {
      method: "GET",
      headers,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      throw new Error("下载失败");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// 导出简化的工具函数
export const api = {
  get,
  post,
  put,
  del,
  download,
  auth: {
    login,
    smsLogin,
    sendSmsCode,
  },
};
