import { get, post } from '@/api/request'

// ── Member Recharge ──

export interface MemberInfo {
	id: string
	name: string
	phone: string
	level: string
	balance: number | string
}

export interface RechargeResult {
	receipt: {
		member_name: string
		member_phone: string
		amount: number
		payment_method: string
		balance_after: number
	}
}

/** Search members by phone or name */
export function searchMembers(keyword: string): Promise<MemberInfo[]> {
	return get('/pos.Member/search', { keyword })
}

/** Cash recharge */
export function cashRecharge(data: {
	member_id: string
	amount: number
	gift_amount?: number
	gift_points?: number
	operator_id?: string
	operator_name?: string
}): Promise<RechargeResult> {
	return post('/pos.Member/rechargeCash', data)
}

// ── Employee Recharge Report ──

export interface DailyRechargeItem {
	recharge_date: string
	total_amount: number
	recharge_count: number
	operator_count: number
}

export interface EmployeeRechargeData {
	summary: {
		total_amount: number
		total_count: number
	}
	list: DailyRechargeItem[]
}

/** Individual recharge record */
export interface RechargeRecord {
	id: string
	member_id: string
	member_name: string
	member_phone: string
	amount: number
	gift_amount: number
	payment_method: string
	operator_id: string
	operator_name: string
	created_at: string
}

export interface RechargeRecordData {
	lists: RechargeRecord[]
	total: number
}

/** Get recharge detail records by operator */
export function getRechargeRecords(params: {
	operator_id?: string
	phone?: string
	page?: number
	pageSize?: number
}): Promise<RechargeRecordData> {
	return get('/pos.Member/rechargeRecords', params as any)
}

/** Get employee recharge report */
export function getEmployeeRecharge(startDate: string, endDate: string): Promise<EmployeeRechargeData> {
	return get('/report.Report/employeeRecharge', { start_date: startDate, end_date: endDate })
}

// ── Assistant Product Sales Report ──

export interface AssistantProductItem {
	product_name: string
	quantity: number
	unit_price: number
	total: number
	split_amount: number
	split_count: number
	split_label: string
}

export interface AssistantSalesItem {
	assistant_id: string
	employee_name: string
	role: string
	total_amount: number
	product_count: number
	products: AssistantProductItem[]
}

export interface AssistantSalesData {
	summary: {
		total_amount: number
		assistant_count: number
	}
	list: AssistantSalesItem[]
}

/** Get assistant product sales report */
export function getAssistantProductSales(startDate: string, endDate: string): Promise<AssistantSalesData> {
	return get('/report.Report/assistantProductSales', { start_date: startDate, end_date: endDate })
}
