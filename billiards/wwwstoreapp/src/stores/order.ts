import { reactive } from 'vue'
import {
	getPendingOrders,
	getActiveOrder,
	acceptOrder,
	rejectOrder,
	startOrder,
	completeOrder,
	getOrderHistory,
	getAssistantRecords,
	getAssistantStats,
	getAllAssistantOrders,
	getAssistantOrderList
} from '@/api/modules/order'

export interface AssistantOrder {
	id: string
	order_no: string
	table_id: string
	table_no: string
	student_name: string
	student_phone: string
	service_type: string
	duration: number
	actual_duration: number
	unit_price: number
	total_amount: number
	actual_amount: number
	status: string
	status_name: string
	start_time: string
	end_time: string
	order_id: string
	created_at: string
	completed_at: string
	remark?: string
}

export interface AssistantRecord {
	id: string
	order_no: string
	table_no: string
	start_time: string
	end_time: string
	duration_minutes: number
	assistant_fee: number
	table_fee: number
	product_fee: number
	total_fee: number
	final_amount: number
	status: string
	assistant_order_no: string
}

export interface AssistantStats {
	total_income: number
	order_count: number
	total_duration: number
	avg_order_amount: number
	this_month_income: number
	this_month_count: number
}

class OrderStore {
	pendingOrders: AssistantOrder[] = []
	activeOrder: AssistantOrder | null = null
	historyOrders: AssistantOrder[] = []
	records: AssistantRecord[] = []
	stats: AssistantStats | null = null
	isLoading: boolean = false
	pageNo: number = 1
	pageSize: number = 20
	hasMore: boolean = true

	get pendingCount(): number {
		return this.pendingOrders.length
	}

	get acceptedCount(): number {
		return this.pendingOrders.filter(o => o.status === 'accepted').length
	}

	async loadPendingOrders(): Promise<void> {
		this.isLoading = true
		try {
			const result = await getPendingOrders()
			if (Array.isArray(result)) {
				this.pendingOrders = result as unknown as AssistantOrder[]
			} else if (result && typeof result === 'object') {
				this.pendingOrders = (result as unknown as { list: AssistantOrder[] }).list || []
			} else {
				this.pendingOrders = []
			}
		} catch (e) {
			console.error('[OrderStore] loadPendingOrders failed:', e)
			this.pendingOrders = []
		} finally {
			this.isLoading = false
		}
	}

	async loadActiveOrder(): Promise<void> {
		try {
			const result = await getActiveOrder()
			this.activeOrder = (result && typeof result === 'object') ? result : null
		} catch (e) {
			console.error('[OrderStore] loadActiveOrder failed:', e)
			this.activeOrder = null
		}
	}

	async loadHistoryOrders(page: number = 1, reset: boolean = false): Promise<void> {
		if (reset) {
			this.pageNo = 1
			this.historyOrders = []
			this.hasMore = true
		}

		if (!this.hasMore) return

		try {
			const result = await getOrderHistory(page, this.pageSize)
			if (result && typeof result === 'object') {
				const data = result as unknown as { list?: AssistantOrder[]; lists?: AssistantOrder[]; count?: number }
				const list = Array.isArray(data.list) ? data.list : (Array.isArray(data.lists) ? data.lists : [])
				if (reset) {
					this.historyOrders = list
				} else {
					this.historyOrders = [...this.historyOrders, ...list]
				}
				this.hasMore = this.historyOrders.length < (data.count || 0)
				this.pageNo = page
			}
		} catch (e) {
			console.error('[OrderStore] loadHistoryOrders failed:', e)
		}
	}

	async loadRecords(params?: { page_no?: number; page_size?: number; start_date?: string; end_date?: string }): Promise<void> {
		try {
			const result = await getAssistantRecords(params || {})
			if (result && typeof result === 'object') {
				const data = result as unknown as { list?: AssistantRecord[] }
				this.records = Array.isArray(data.list) ? data.list : []
			}
		} catch (e) {
			console.error('[OrderStore] loadRecords failed:', e)
			this.records = []
		}
	}

	async loadStats(): Promise<void> {
		try {
			const result = await getAssistantStats()
			if (result && typeof result === 'object') {
				this.stats = result as unknown as AssistantStats
			}
		} catch (e) {
			console.error('[OrderStore] loadStats failed:', e)
			this.stats = null
		}
	}

	async loadAllOrders(params?: { status?: string; page_no?: number; page_size?: number }): Promise<{ list: AssistantOrder[]; count: number }> {
		try {
			const result = await getAllAssistantOrders(params || {})
			if (result && typeof result === 'object') {
				const data = result as unknown as { list?: AssistantOrder[]; count?: number }
				return {
					list: Array.isArray(data.list) ? data.list : [],
					count: data.count || 0
				}
			}
			return { list: [], count: 0 }
		} catch (e) {
			console.error('[OrderStore] loadAllOrders failed:', e)
			return { list: [], count: 0 }
		}
	}

	async loadOrderList(params?: { status?: string; page_no?: number; page_size?: number }): Promise<{ list: AssistantOrder[]; count: number }> {
		try {
			const result = await getAssistantOrderList(params || {})
			if (result && typeof result === 'object') {
				const data = result as unknown as { list?: AssistantOrder[]; count?: number }
				return {
					list: Array.isArray(data.list) ? data.list : [],
					count: data.count || 0
				}
			}
			return { list: [], count: 0 }
		} catch (e) {
			console.error('[OrderStore] loadOrderList failed:', e)
			return { list: [], count: 0 }
		}
	}

	async accept(orderId: string | number): Promise<boolean> {
		try {
			const result = await acceptOrder({ order_id: String(orderId) })
			if (result && typeof result === 'object') {
				this.pendingOrders = this.pendingOrders.filter(o => String(o.id) !== String(orderId))
				return true
			}
			return false
		} catch (e) {
			console.error('[OrderStore] accept failed:', e)
			return false
		}
	}

	async reject(orderId: string | number, reason?: string): Promise<boolean> {
		try {
			const result = await rejectOrder({ order_id: String(orderId), reason })
			if (result && typeof result === 'object') {
				this.pendingOrders = this.pendingOrders.filter(o => String(o.id) !== String(orderId))
				return true
			}
			return false
		} catch (e) {
			console.error('[OrderStore] reject failed:', e)
			return false
		}
	}

	async start(orderId: string | number): Promise<boolean> {
		try {
			const result = await startOrder({ order_id: String(orderId) })
			if (result && typeof result === 'object') {
				return true
			}
			return false
		} catch (e) {
			console.error('[OrderStore] start failed:', e)
			return false
		}
	}

	async complete(orderId: string | number, remark?: string): Promise<boolean> {
		try {
			const result = await completeOrder({ order_id: String(orderId), remark })
			if (result && typeof result === 'object') {
				this.activeOrder = null
				return true
			}
			return false
		} catch (e) {
			console.error('[OrderStore] complete failed:', e)
			return false
		}
	}
}

export const orderStore = reactive(new OrderStore()) as OrderStore