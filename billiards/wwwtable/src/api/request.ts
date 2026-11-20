import config from '@/config/index'
import { authStore } from '@/stores/auth'

export interface ApiResponse<T = any> {
  code: number
  show: number
  msg: string
  data: T
}

interface RequestError {
  code: number
  msg: string
  raw?: any
}

const { BASE_URL } = config

interface RequestOptions {
  url: string
  data?: any
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  header?: any
  showLoading?: boolean
  showError?: boolean
  /** 覆写默认 BASE_URL（如支付接口不走 /storeapi 前缀） */
  baseURL?: string
  /** 跳过 table_id 自动注入（如支付接口不需要桌台上下文） */
  skipTableId?: boolean
}

function getToken(): string {
  try {
    return uni.getStorageSync('token') || ''
  } catch {
    return ''
  }
}

function getTableId(): string {
  try {
    const tableId = authStore.tableId
    if (tableId) return String(tableId)
    const cached = uni.getStorageSync('tableInfo')
    if (cached && cached.id) return cached.id
    return ''
  } catch {
    return ''
  }
}

function getStoreId(): string {
  try {
    const storeId = authStore.storeId
    if (storeId && typeof storeId !== 'object') return String(storeId)
    const cached = uni.getStorageSync('tableInfo')
    if (cached && cached.store_id && typeof cached.store_id !== 'object') return String(cached.store_id)
    const storedStoreId = uni.getStorageSync('storeId')
    if (storedStoreId && typeof storedStoreId !== 'object') return String(storedStoreId)
    return ''
  } catch {
    return ''
  }
}

function buildResponseError(msg: string, raw?: any, code: number = 0): RequestError {
  return { code, msg, raw }
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  let { url, data = {}, method = 'GET', header = {}, showLoading = false, showError = true, baseURL, skipTableId } = options

  return new Promise((resolve, reject) => {
    if (showLoading) {
      uni.showLoading({ title: '加载中...', mask: true })
    }

    const token = getToken()
    const headers: any = {
      'Content-Type': 'application/json',
      ...header
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const tableId = skipTableId ? '' : getTableId()
    const storeId = getStoreId()

    if (!url.includes('/tablet.Auth/login')) {
      if (method === 'GET') {
        let params: string[] = []
        const requestData = data && typeof data === 'object' ? data : {}

        Object.keys(requestData).forEach((key) => {
          const value = requestData[key]
          if (value !== undefined && value !== null && value !== '') {
            params.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          }
        })

        if (tableId) params.push(`table_id=${tableId}`)
        if (storeId) params.push(`store_id=${storeId}`)

        if (params.length > 0) {
          const separator = url.includes('?') ? '&' : '?'
          url += `${separator}${params.join('&')}`
        }
        data = undefined
      } else {
        if (tableId) data = { ...data, table_id: tableId }
        if (storeId) data = { ...data, store_id: storeId }
      }
    }

    const finalBaseURL = baseURL !== undefined ? baseURL : BASE_URL

    uni.request({
      url: `${finalBaseURL}${url}`,
      data,
      method,
      header: headers,
      success: (res: any) => {
        if (showLoading) {
          uni.hideLoading()
        }

        const response = res.data as ApiResponse

        if (typeof response === 'string') {
          const error = buildResponseError('服务端返回了异常页面，请检查接口或数据库配置', response)
          if (showError) {
            uni.showToast({ title: error.msg, icon: 'none' })
          }
          reject(error)
          return
        }

        if (!response || typeof response !== 'object' || typeof response.code !== 'number') {
          const error = buildResponseError('接口返回格式无效', response)
          if (showError) {
            uni.showToast({ title: error.msg, icon: 'none' })
          }
          reject(error)
          return
        }

        if (response.code === 2002) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('tableInfo')
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/login/index' })
          }, 1500)
          reject(response)
          return
        }

        if (response.code === 0) {
          if (showError && response.msg) {
            uni.showToast({ title: response.msg, icon: 'none' })
          }
          reject(response)
          return
        }

        if (response.code !== 1) {
          if (showError && response.msg) {
            uni.showToast({ title: response.msg, icon: 'none' })
          }
          reject(response)
          return
        }

        resolve(response.data as T)
      },
      fail: (err: any) => {
        if (showLoading) {
          uni.hideLoading()
        }

        if (showError) {
          uni.showToast({ title: '网络请求失败', icon: 'none' })
        }
        reject(err)
      }
    })
  })
}

export function get<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({
    url,
    data,
    method: 'GET',
    ...options
  })
}

export function post<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({
    url,
    data,
    method: 'POST',
    ...options
  })
}

export function put<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({
    url,
    data,
    method: 'PUT',
    ...options
  })
}

export function del<T = any>(url: string, data?: any, options?: Partial<RequestOptions>): Promise<T> {
  return request<T>({
    url,
    data,
    method: 'DELETE',
    ...options
  })
}
