import { reactive } from 'vue'
import { getDashboardData } from '@/api/modules/dashboard'
import { getStoreList, type Store } from '@/api/modules/store'

export interface StoreInfo {
	id: number
	name: string
	address: string
	phone: string
}

export interface DashboardStats {
	today_revenue: number
	today_orders: number
	occupancy_rate: number
	avg_customer_spend: number
	revenue_change: number
	occupancy_rate_change: number
}

class StoreStore {
	currentStore: StoreInfo | null = null
	storeList: Store[] = []
	stats: DashboardStats = {
		today_revenue: 0,
		today_orders: 0,
		occupancy_rate: 0,
		avg_customer_spend: 0,
		revenue_change: 0,
		occupancy_rate_change: 0
	}
	isLoading: boolean = false
	isStoreListLoaded: boolean = false

	async loadStats(storeId?: string): Promise<void> {
		this.isLoading = true
		try {
			const result = await getDashboardData()
			this.stats = { ...this.stats, ...result }
		} catch (e) {
			console.error('[StoreStore] loadDashboard failed:', e)
			this.stats = {
				today_revenue: 0,
				today_orders: 0,
				occupancy_rate: 0,
				avg_customer_spend: 0,
				revenue_change: 0,
				occupancy_rate_change: 0
			}
		} finally {
			this.isLoading = false
		}
	}

	async loadStoreList(): Promise<void> {
		try {
			const result = await getStoreList()
			this.storeList = Array.isArray(result) ? result : (result.data || [])
			this.isStoreListLoaded = true
			uni.setStorageSync('storeList', this.storeList)
		} catch (e) {
			console.error('[StoreStore] loadStoreList failed:', e)
			// Preserve cached data on failure; fall back to storage
				if (!this.storeList.length) {
					const cached = uni.getStorageSync('storeList')
					if (Array.isArray(cached)) this.storeList = cached
				}
			this.isStoreListLoaded = true
		}
	}

	async selectFirstStore(): Promise<void> {
		if (this.storeList.length > 0) {
			const cachedStoreId = uni.getStorageSync('storeId')
			
			if (cachedStoreId) {
				const cachedStore = this.storeList.find(store => String(store.id) === String(cachedStoreId))
				if (cachedStore) {
					this.setCurrentStore(cachedStore)
					return
				}
			}
			
			const firstStore = this.storeList[0]
			this.setCurrentStore(firstStore)
		}
	}

	setCurrentStore(store: Store): void {
		this.currentStore = {
			id: store.id,
			name: store.name,
			address: store.address || '',
			phone: store.phone || ''
		}
		uni.setStorageSync('currentStore', this.currentStore)
		uni.setStorageSync('storeId', store.id)
		uni.setStorageSync('storeName', store.name)
		uni.$emit('storeChange')
	}

	get currentStoreId(): number | string {
		if (this.currentStore) return this.currentStore.id
		const cached = uni.getStorageSync('storeId')
		return cached || 0
	}

	get currentStoreName(): string {
		if (this.currentStore) return this.currentStore.name
		const cached = uni.getStorageSync('storeName')
		return cached || ''
	}

	initFromStorage(): void {
		const storedStore = uni.getStorageSync('currentStore')
		if (storedStore) {
			this.currentStore = storedStore
		}
		
		const storedList = uni.getStorageSync('storeList')
		if (storedList && Array.isArray(storedList)) {
			this.storeList = storedList
			this.isStoreListLoaded = true
		}
	}
}

export const storeStore = reactive(new StoreStore()) as StoreStore