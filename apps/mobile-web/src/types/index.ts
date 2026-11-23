export interface ApiResponse<T = unknown> {
	code: number
	show: number
	msg: string
	data: T
}

export interface PaginatedData<T = any> {
	lists: T[]
	count: number
	page_no: number
	page_size: number
}

/** 订单项记录 — 对应 busi_order_item 表 */
export interface OrderItemRecord {
	id: string
	order_id: string
	item_type: 'table' | 'product' | 'assistant' | 'merge_fee'
	item_name: string
	product_id?: string
	assistant_id?: string
	quantity: number
	unit: string
	unit_price: number
	total_price: number
	discount_rate: number
	final_price: number
	status: string
	delivered_at?: string
	created_at?: string
}

/** 订单支付记录 — 对应 OrderPayment 模型 */
export interface OrderPaymentRecord {
	id: string
	order_id: string
	store_id: string
	order_no: string
	payment_method: string
	amount: number
	status: string
	paid_at: string
	operator_id: string
	operator_name: string
}

/** 台桌主订单 — 对应 busi_order 表 + formatOrder() 的返回格式 */
export interface MainOrder {
	id: string
	order_no: string
	store_id: string
	type: string
	status: string
	table_id: string
	table_name: string
	member_id: string
	member_name: string
	assistant_id: string
	original_amount: number
	discount_amount: number
	final_amount: number
	balance_paid: number
	cash_paid: number
	wechat_paid: number
	alipay_paid: number
	card_paid: number
	points_deduct: number
	points_gained: number
	payment_status: string
	start_time: string
	end_time: string
	duration_minutes: number
	prepaid_hours: number
	remaining_minutes: number
	operator_id: string
	operator_name: string
	remark: string
	cancel_time: string
	cancel_reason: string
	refund_amount: number
	created_at: string
	updated_at: string
	items: OrderItemRecord[]
	payments: OrderPaymentRecord[]
}

/** 订单列表分页响应 — 对应 OrderLogic::getList() 的返回格式 */
export interface OrderListResponse {
	data: MainOrder[]
	pagination: {
		page: number
		page_size: number
		total: number
		total_pages: number
	}
}

export interface ApiError {
	code: number
	msg: string
}

export type UserRole = 'owner' | 'admin' | 'manager' | 'cashier' | 'waiter' | 'assistant'

export const ROLE_MAP: Record<number, { label: string; color: string }> = {
	1: { label: '老板', color: '#ef4444' },
	2: { label: '经理', color: '#f59e0b' },
	3: { label: '财务', color: '#8b5cf6' },
	4: { label: '教练', color: '#06b6d4' },
	5: { label: '收银员', color: '#10b981' },
	6: { label: '助教', color: '#059669' },
	7: { label: '服务员', color: '#6366f1' },
}

export const ROLE_COLOR_MAP: Record<UserRole, string> = {
	owner: '#8B5CF6',
	admin: '#64748B',
	manager: '#10B981',
	cashier: '#3B82F6',
	waiter: '#F59E0B',
	assistant: '#EC4899',
}

export interface LoginParams {
	phone: string
	code?: string
	password?: string
}

export interface LoginResult {
	token: string
	employee: EmployeeInfo
}

export interface EmployeeInfo {
	id: number
	name: string
	phone: string
	avatar?: string
	role: UserRole
	store_id: number
	store_name: string
	role_name: string
}

export interface StoreInfo {
	id: number
	name: string
	address?: string
	phone?: string
	business_hours?: {
		start: string
		end: string
	}
	latitude?: number
	longitude?: number
}

export interface DashboardStats {
	today_revenue: number
	yesterday_revenue: number
	revenue_change: number
	today_orders: number
	yesterday_orders: number
	orders_change: number
	occupied_tables: number
	total_tables: number
	occupancy_rate: number
	avg_customer_spend: number
	week_revenue: number[]
}

export type NotificationType = 'warning' | 'order' | 'system' | 'approval'

export interface Notification {
	id: number
	type: NotificationType
	title: string
	content: string
	is_read: number
	create_time: string
	data?: Record<string, any>
}

export type OrderStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export interface AssistantOrder {
	id: number
	order_no: string
	customer_name: string
	customer_phone?: string
	table_id?: number
	table_name?: string
	assistant_id: number
	assistant_name: string
	start_time?: string
	end_time?: string
	duration: number
	price: number
	total_amount: number
	status: OrderStatus
	remark?: string
	create_time: string
}

export interface CheckInRecord {
	id: number
	employee_id: number
	employee_name: string
	type: 'sign_in' | 'sign_out' | 'outwork'
	latitude: number
	longitude: number
	distance: number
	location_address?: string
	create_time: string
	status: 'normal' | 'abnormal'
	checkin_time?: string
	checkout_time?: string
	is_late?: boolean
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalType = 'checkin' | 'leave' | 'outwork' | 'exchange' | 'overtime' | 'schedule'

export interface ApprovalRecord {
	id: number
	type: ApprovalType
	employee_id: number
	employee_name: string
	employee_avatar?: string
	status: ApprovalStatus
	reason?: string
	start_date?: string
	end_date?: string
	duration?: number
	remark?: string
	approver_id?: number
	approver_name?: string
	approve_time?: string
	approve_remark?: string
	create_time: string
}

export interface ApprovalListItem extends ApprovalRecord {
	approval_type_text: string
	status_text: string
	create_time_text: string
}

export interface PerformanceStats {
	today_duration: number
	today_orders: number
	today_income: number
	week_duration: number
	week_orders: number
	week_income: number
	month_duration: number
	month_orders: number
	month_income: number
	trend_data: {
		date: string
		duration: number
		orders: number
		income: number
	}[]
}

export interface EmployeeListItem {
	id: number
	name: string
	phone: string
	avatar?: string
	role: string
	role_name: string
	status: 'active' | 'inactive' | 'vacation'
	status_text: string
	latest_checkin?: {
		type: 'sign_in' | 'sign_out'
		time: string
	}
}

export interface Employee {
	id: string
	name: string
	phone: string
	gender?: number
	avatar?: string
	id_card?: string
	role: string
	position?: string
	salary?: number
	password?: string
	status: number
	hire_date?: string
	leave_date?: string
	description?: string
	store_id?: string
	created_at?: string
	updated_at?: string
}

export interface ApprovalApplyParams {
	type: ApprovalType
	reason?: string
	start_date?: string
	end_date?: string
	duration?: number
}

export interface CheckInParams {
	type: 'sign_in' | 'sign_out'
	latitude: number
	longitude: number
	address?: string
}

export interface OutWorkParams {
	latitude: number
	longitude: number
	address: string
	reason: string
}

export interface CurrentOrder {
	id?: string
	order_id: string
	order_no: string
	table_name: string
	table_id: string
	start_time: string
	player_count: number
	status: string
	total_amount: number
	paid_amount: number
	hourly_rate?: number
	assistants: AssistantInOrder[]
	products: ProductInOrder[]
}

export interface AssistantInOrder {
	item_id: string
	assistant_id: string
	assistant_name: string
	avatar: string
	status: string
	start_time?: string
	end_time?: string
	duration?: number
	fee?: number
}

export interface ProductInOrder {
	item_id: string
	product_id: string
	product_name: string
	quantity: number
	price: number
	status: string
}

export interface TableStats {
	total_tables: number
	idle_tables: number
	occupied_tables: number
	reserved_tables: number
	settled_tables: number
	revenue: number
}

export interface BillItem {
	name: string
	quantity: number
	unit_price: number
	amount: number
	type: string
}

export interface TableLog {
	id: string
	table_id: string
	action: string
	operator: string
	detail: string
	created_at: string
}

export interface PendingProduct {
	order_id: string
	table_name: string
	products: PendingProductItem[]
	created_at: string
}

export interface PendingProductItem {
	product_name: string
	quantity: number
	status: string
}

export interface PendingAssistant {
	order_id: string
	table_name: string
	assistant_name: string
	created_at: string
}

export interface ProductItem {
	product_id: string
	name: string
	price: number
	category: string
	image?: string
	stock?: number
}

export interface AssistantItem {
	assistant_id: string
	name: string
	avatar: string
	status: string
	tags?: string[]
}

export interface MemberInfo {
	member_id: string
	name: string
	nickname?: string
	phone: string
	level: string
	balance: number
}

export interface ScheduleRecord {
	id: string
	employee_id: string
	employee_name?: string
	employee_type?: string
	store_id?: string
	work_date: string
	shift_type: 'morning' | 'afternoon' | 'evening' | 'full' | 'off'
	shift_name?: string
	start_time: string
	end_time: string
	status?: string
	check_in_time?: string
	check_out_time?: string
	description?: string
	remark?: string
	created_at?: string
	updated_at?: string
}

export const SHIFT_MAP: Record<string, { label: string; color: string; timeRange: string }> = {
	morning: { label: '早班', color: '#4A90D9', timeRange: '09:00 - 17:00' },
	afternoon: { label: '中班', color: '#F5A623', timeRange: '14:00 - 22:00' },
	evening: { label: '晚班', color: '#9B59B6', timeRange: '18:00 - 02:00' },
	full: { label: '全天', color: '#27AE60', timeRange: '09:00 - 22:00' },
	off: { label: '休息', color: '#95A5A6', timeRange: '' },
}
