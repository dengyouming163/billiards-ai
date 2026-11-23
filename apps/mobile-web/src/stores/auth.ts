export interface EmployeeInfo {
	id: number
	name: string
	phone: string
	avatar?: string
	role: string
	store_id: number
	store_name: string
	role_name: string
}

export interface LoginResult {
	token: string
	employee: EmployeeInfo
}
import { reactive } from 'vue'
import { smsLogin, passwordLogin, logout as logoutApi, getUserInfo, getMyPermissions } from '@/api/modules/auth'
import { storeStore } from '@/stores/store'

class AuthStore {
	token: string = ''
	userInfo: EmployeeInfo | null = null
	isLoading: boolean = false
	permissionCodes: string[] = []

	get isLoggedIn(): boolean {
		return !!this.token && !!this.userInfo
	}

	get role(): string {
		return this.userInfo?.role || 'employee'
	}

	get permissions() { return this.permissionCodes }

	get canViewDashboard() { return this.permissionCodes.includes('mobile:dashboard') }
	get canManageOrders() { return this.permissionCodes.includes('mobile:orders') }
	get canCheckin() { return this.permissionCodes.includes('mobile:checkin') }
	get canApply() { return this.permissionCodes.includes('mobile:apply') }
	get canApprove() { return this.permissionCodes.includes('mobile:approval') }
	get canManageEmployee() { return this.permissionCodes.includes('mobile:employee') }
	get canViewSchedule() { return this.permissionCodes.includes('mobile:schedule') }
	get canViewPerformance() { return this.permissionCodes.includes('mobile:performance') }
	get canViewNotifications() { return this.permissionCodes.includes('mobile:notification') }
	get canEditProfile() { return this.permissionCodes.includes('mobile:profile') }
	get canAccessSettings() { return this.permissionCodes.includes('mobile:settings') }
	get canAccessAssistant() { return this.permissionCodes.includes('mobile:assistant') }

	get isOwner(): boolean {
		return this.permissionCodes.includes('mobile:dashboard') || this.permissionCodes.includes('mobile:employee')
	}

	get isAssistant(): boolean {
		return this.permissionCodes.includes('mobile:orders')
	}

	get isEmployee(): boolean {
		return this.permissionCodes.includes('mobile:checkin')
	}

	get storeId(): number | string {
		const storeId = this.userInfo?.store_id
		if (storeId) return storeId
		const cachedStoreId = uni.getStorageSync('storeId')
		if (cachedStoreId) return cachedStoreId
		return 0
	}

	get storeName(): string {
		const name = this.userInfo?.store_name
		if (name) return name
		const cachedStoreName = uni.getStorageSync('storeName')
		if (cachedStoreName) return cachedStoreName
		return ''
	}

	async login(params: { phone: string; code?: string; password?: string }): Promise<LoginResult | null> {
		this.isLoading = true
		try {
			let result: LoginResult
			if (params.code) {
				result = await smsLogin(params)
			} else if (params.password) {
				result = await passwordLogin(params)
			} else {
				throw new Error('请提供验证码或密码')
			}

			this.token = result.token
			this.userInfo = result.employee

			uni.setStorageSync('token', result.token)
			uni.setStorageSync('userInfo', result.employee)
			
			if (result.employee.store_id) {
				uni.setStorageSync('storeId', result.employee.store_id)
			}
			if (result.employee.store_name) {
				uni.setStorageSync('storeName', result.employee.store_name)
			}

			await storeStore.loadStoreList()
			if (storeStore.storeList.length > 0) {
				await storeStore.selectFirstStore()
			}

			return result
		} catch (e) {
			console.error('[AuthStore] login failed:', e)
			return null
		} finally {
			this.isLoading = false
		}
	}

	_loggingOut: boolean = false

	async logout(silent?: boolean): Promise<void> {
		if (this._loggingOut) return
		this._loggingOut = true
		try {
			if (!silent) {
				try { await logoutApi() } catch (e) { /* ignore */ }
			}
		} finally {
			this.token = ''
			this.userInfo = null
			this.permissionCodes = []
			uni.removeStorageSync('token')
			uni.removeStorageSync('userInfo')
			uni.removeStorageSync('permissions')
			uni.removeStorageSync('permissionsTime')
			this._loggingOut = false
		}
	}

	async fetchUserInfo(): Promise<EmployeeInfo | null> {
		if (!this.token) return null

		try {
			const info = await getUserInfo()
			this.userInfo = info
			uni.setStorageSync('userInfo', info)
			return info
		} catch (e) {
			console.error('[AuthStore] getUserInfo failed:', e)
			if (this.token) {
				this.token = ''
				this.userInfo = null
				uni.removeStorageSync('token')
				uni.removeStorageSync('userInfo')
			}
			return null
		}
	}

	async loadPermissions() {
		try {
			const codes = await getMyPermissions()
			this.permissionCodes = Array.isArray(codes) ? codes : []
			uni.setStorageSync('permissions', this.permissionCodes)
			uni.setStorageSync('permissionsTime', Date.now())
		} catch (e) {
			console.error('[AuthStore] loadPermissions failed:', e)
			this.permissionCodes = []
		}
	}

	checkTokenExpiry(): boolean {
		const expiry = uni.getStorageSync('tokenExpiry')
		if (expiry && Date.now() > expiry) {
			this.logout()
			return false
		}
		return true
	}

	initFromStorage(): boolean {
		const storedToken = uni.getStorageSync('token')
		const storedUserInfo = uni.getStorageSync('userInfo')

		if (storedToken && storedUserInfo) {
			this.token = storedToken
			this.userInfo = storedUserInfo

			const cachedPermissions = uni.getStorageSync('permissions')
			if (Array.isArray(cachedPermissions) && cachedPermissions.length > 0) {
				this.permissionCodes = cachedPermissions
			}

			storeStore.initFromStorage()

			if (!storeStore.currentStore && storeStore.storeList.length > 0) {
				storeStore.selectFirstStore()
			}

			return true
		}
		return false
	}

	setUserInfo(info: EmployeeInfo): void {
		this.userInfo = info
		uni.setStorageSync('userInfo', info)
	}

	setStore(storeId: number, storeName: string): void {
		if (this.userInfo) {
			this.userInfo.store_id = storeId
			this.userInfo.store_name = storeName
			uni.setStorageSync('userInfo', this.userInfo)
		}
		uni.setStorageSync('storeId', storeId)
		uni.setStorageSync('storeName', storeName)
			uni.setStorageSync('currentStore', { id: storeId, name: storeName })
		uni.removeStorageSync('dashboard_cache_today')
			uni.removeStorageSync('dashboard_cache_week')
			uni.removeStorageSync('dashboard_cache_month')
		uni.removeStorageSync('permissionsTime')
		this.loadPermissions()
	}

	async validateToken(retryCount: number = 0): Promise<boolean> {
		if (!this.token) return false

		try {
			const info = await getUserInfo()
			this.userInfo = info
			uni.setStorageSync('userInfo', info)
			return true
		} catch (e) {
			console.error('[AuthStore] validateToken failed:', e)
			if (retryCount < 1) {
				return this.validateToken(retryCount + 1)
			}
			this.token = ''
			this.userInfo = null
			uni.removeStorageSync('token')
			uni.removeStorageSync('userInfo')
			return false
		}
	}
}

export const authStore = reactive(new AuthStore())
