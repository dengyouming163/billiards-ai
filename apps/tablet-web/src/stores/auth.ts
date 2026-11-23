import { reactive } from 'vue'
import type { TableInfo, LoginResult } from '@/types'
import { tableLogin, logout, getTableInfo } from '@/api/modules/auth'

interface AuthState {
  token: string
  tableInfo: TableInfo | null
  isLoading: boolean
}

class AuthStore {
  private state = reactive<AuthState>({
    token: '',
    tableInfo: null,
    isLoading: false
  })

  get token(): string {
    return this.state.token
  }

  set token(v: string) {
    this.state.token = v
  }

  get tableInfo(): TableInfo | null {
    return this.state.tableInfo
  }

  set tableInfo(v: TableInfo | null) {
    this.state.tableInfo = v
  }

  get isLoading(): boolean {
    return this.state.isLoading
  }

  set isLoading(v: boolean) {
    this.state.isLoading = v
  }

  get isLoggedIn(): boolean {
    return !!this.state.token && !!this.state.tableInfo
  }

  get tableId(): string | number {
    return this.state.tableInfo?.id || ''
  }

  get tableCode(): string {
    return this.state.tableInfo?.code || ''
  }

  get storeId(): string | number {
    return this.state.tableInfo?.store_id || ''
  }

  get tableName(): string {
    return this.state.tableInfo?.name || ''
  }

  get tableStatus(): string {
    return this.state.tableInfo?.status || 'idle'
  }

  async login(code: string): Promise<LoginResult | null> {
    this.isLoading = true
    try {
      const result = await tableLogin({ code })
      this.token = result.token
      this.tableInfo = result.table

      uni.setStorageSync('token', result.token)
      uni.setStorageSync('tableInfo', result.table)

      if (result.table.store_id) {
        uni.setStorageSync('storeId', result.table.store_id)
      }

      return result
    } catch {
      return null
    } finally {
      this.isLoading = false
    }
  }

  async logout(): Promise<void> {
    try {
      await logout()
    } catch {
    } finally {
      this.token = ''
      this.tableInfo = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('tableInfo')
      uni.removeStorageSync('storeId')
    }
  }

  async fetchTableInfo(): Promise<TableInfo | null> {
    if (!this.state.token) return null

    try {
      const info = await getTableInfo()
      this.tableInfo = info
      uni.setStorageSync('tableInfo', info)

      if (info.store_id) {
        uni.setStorageSync('storeId', info.store_id)
      }

      return info
    } catch {
      if (this.state.token) {
        this.token = ''
        this.tableInfo = null
        uni.removeStorageSync('token')
        uni.removeStorageSync('tableInfo')
        uni.removeStorageSync('storeId')
      }
      return null
    }
  }

  initFromStorage(): boolean {
    const storedToken = uni.getStorageSync('token')
    const storedTableInfo = uni.getStorageSync('tableInfo')

    if (storedToken && storedTableInfo) {
      this.token = storedToken  // triggers reactive setter
      this.tableInfo = storedTableInfo  // triggers reactive setter
      return true
    }
    return false
  }

  setTableInfo(info: TableInfo): void {
    this.tableInfo = info
    uni.setStorageSync('tableInfo', info)
  }

  async validateToken(retryCount: number = 0, clearOnFail: boolean = true): Promise<boolean> {
    if (!this.state.token) return false

    try {
      const info = await getTableInfo()
      this.tableInfo = info
      uni.setStorageSync('tableInfo', info)

      if (info.store_id) {
        uni.setStorageSync('storeId', info.store_id)
      }

      return true
    } catch (error) {
      if (retryCount < 1) {
        return this.validateToken(retryCount + 1, clearOnFail)
      }
      if (clearOnFail) {
        this.token = ''
        this.tableInfo = null
        uni.removeStorageSync('token')
        uni.removeStorageSync('tableInfo')
        uni.removeStorageSync('storeId')
      }
      return false
    }
  }
}

export const authStore = new AuthStore()
