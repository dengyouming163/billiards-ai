import type { ApiResponse } from '@/types'

export enum ErrorType {
  AUTH_ERROR = 'AUTH_ERROR',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

export interface HandledError {
  type: ErrorType
  message: string
  raw: unknown
}

export function classifyError(res: ApiResponse): HandledError | null {
  if (res.code === 2001 || res.code === 2002) {
    return {
      type: ErrorType.AUTH_ERROR,
      message: res.msg || '登录已过期，请重新登录',
      raw: res,
    }
  }
  if (res.code === 0) {
    return {
      type: ErrorType.BUSINESS_ERROR,
      message: res.msg || '操作失败',
      raw: res,
    }
  }
  return null
}

export function classifyNetworkError(err: unknown): HandledError {
  if (err && typeof err === 'object' && 'errMsg' in err) {
    const msg = (err as Record<string, string>).errMsg
    if (msg?.includes('timeout')) {
      return { type: ErrorType.NETWORK_ERROR, message: '请求超时，请检查网络', raw: err }
    }
    if (msg?.includes('fail')) {
      return { type: ErrorType.NETWORK_ERROR, message: '网络连接失败', raw: err }
    }
  }
  return { type: ErrorType.NETWORK_ERROR, message: '网络异常，请稍后重试', raw: err }
}
