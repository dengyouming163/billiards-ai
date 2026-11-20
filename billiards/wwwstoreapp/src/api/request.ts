import config from '@/config/index'
import { storeStore } from '@/stores/store'
import { authStore } from '@/stores/auth'
import type { ApiResponse } from '@/types'
import type { RequestOptions } from '@/types/request'
import { ErrorType, classifyError, classifyNetworkError, type HandledError } from './error-handler'
import { getCache, setCache } from './cache'

const { BASE_URL } = config

function getToken(): string {
    try {
        return uni.getStorageSync('token') || ''
    } catch (e) {
        console.error('[Request] getToken failed:', e)
        return ''
    }
}

function getStoreId(): number | string | null {
    try {
        // Prioritize storage (updated immediately on switch) over store object (async init)
        const cached = uni.getStorageSync('storeId')
        if (cached) return cached
        const storeId = storeStore.currentStoreId
        if (storeId) return storeId
        const userInfo = uni.getStorageSync('userInfo')
        if (userInfo && userInfo.store_id) return userInfo.store_id
        return null
    } catch (e) {
        console.error('[Request] getStoreId failed:', e)
        return null
    }
}

export function request<T = any>(options: RequestOptions): Promise<T> {
    let { url, data = {}, method = 'GET', header = {}, showLoading = true, showError = true, cache = false } = options

    return new Promise((resolve, reject) => {
        if (cache && method === 'GET') {
            const cacheKey = `${url}${JSON.stringify(data)}`
            const cached = getCache<T>(cacheKey)
            if (cached) {
                resolve(cached)
                return
            }
        }

        if (showLoading) {
            uni.showLoading({ title: 'Loading...', mask: true })
        }

        const token = getToken()
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...header
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        const storeId = getStoreId()
        if (storeId && !url.includes('/auth.Auth/login') && !url.includes('/auth.Auth/sms') && !url.includes('/auth.Auth/password')) {
            if (method === 'GET') {
                const separator = url.includes('?') ? '&' : '?'
                url += `${separator}store_id=${storeId}`
            } else {
                data = { ...data, store_id: storeId }
            }
        }

        uni.request({
            url: `${BASE_URL}${url}`,
            data,
            method,
            header: headers,
            success: (res: UniApp.RequestSuccessCallbackResult) => {
                if (showLoading) {
                    uni.hideLoading()
                }

                const response = res.data as ApiResponse

                const classified = classifyError(response)
                if (classified) {
                    if (classified.type === ErrorType.AUTH_ERROR) {
                        authStore.logout(true) // silent: no API call, token already invalid
                        uni.showModal({
                            title: '登录已过期',
                            content: classified.message || '请重新登录',
                            showCancel: false,
                            confirmText: '重新登录',
                            success: () => {
                                uni.reLaunch({ url: '/pages/login/index' })
                            }
                        })
                    } else if (showError) {
                        uni.showToast({ title: classified.message, icon: 'none' })
                    }
                    reject(classified)
                    return
                }

                if (response.code === 1) {
                    if (cache && method === 'GET') {
                        const cacheKey = `${url}${JSON.stringify(data)}`
                        const responseData = response.data as T
                        if (responseData) {
                            setCache(cacheKey, responseData)
                        }
                    }
                    resolve(response.data as T)
                } else {
                    const unknownError: HandledError = {
                        type: ErrorType.BUSINESS_ERROR,
                        message: response.msg || '未知错误',
                        raw: response
                    }
                    if (showError) {
                        uni.showToast({ title: unknownError.message, icon: 'none' })
                    }
                    reject(unknownError)
                }
            },
            fail: (err: UniApp.GeneralCallbackResult) => {
                if (showLoading) {
                    uni.hideLoading()
                }

                const handled = classifyNetworkError(err)
                if (showError) {
                    uni.showToast({ title: handled.message, icon: 'none' })
                }
                reject(handled)
            }
        })
    })
}

function createMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE') {
    return <T>(
        url: string,
        data?: Record<string, unknown>,
        options?: { showLoading?: boolean; showError?: boolean }
    ): Promise<T> => {
        return request<T>({ url, data, method, ...options })
    }
}

export const get = createMethod('GET')
export const post = createMethod('POST')
export const put = createMethod('PUT')
export const del = createMethod('DELETE')

export function uploadFile(url: string, filePath: string, name: string = 'file', formData?: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        uni.showLoading({ title: 'Uploading...', mask: true })

        const token = getToken()

        uni.uploadFile({
            url: `${BASE_URL}${url}`,
            filePath,
            name,
            formData,
            header: {
                Authorization: token ? `Bearer ${token}` : ''
            },
            success: (res: UniApp.UploadFileSuccessCallbackResult) => {
                uni.hideLoading()
                if (res.data) {
                    try {
                        const data = JSON.parse(res.data)
                        const classified = classifyError(data)
                        if (classified) {
                            if (classified.type === ErrorType.AUTH_ERROR) {
                                authStore.logout(true) // silent
                                uni.showModal({
                                    title: '登录已过期',
                                    content: classified.message || '请重新登录',
                                    showCancel: false,
                                    confirmText: '重新登录',
                                    success: () => {
                                        uni.reLaunch({ url: '/pages/login/index' })
                                    }
                                })
                            } else {
                                uni.showToast({ title: classified.message, icon: 'none' })
                            }
                            reject(new Error(classified.message))
                            return
                        }
                        if (data.code === 1 && data.data?.url) {
                            resolve(data.data.url)
                        } else {
                            uni.showToast({ title: data.msg || '上传失败', icon: 'none' })
                            reject(new Error(data.msg || '上传失败'))
                        }
                    } catch (e) {
                        console.error('[Request] uploadFile parse failed:', e)
                        uni.showToast({ title: '解析失败', icon: 'none' })
                        reject(res.data)
                    }
                } else {
                    uni.showToast({ title: '上传失败', icon: 'none' })
                    reject(res)
                }
            },
            fail: (err: UniApp.GeneralCallbackResult) => {
                uni.hideLoading()
                const handled = classifyNetworkError(err)
                uni.showToast({ title: handled.message, icon: 'none' })
                reject(handled)
            }
        })
    })
}
