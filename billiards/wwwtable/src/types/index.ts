export interface ApiResponse<T = any> {
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

export interface ApiError {
	code: number
	msg: string
}

export interface TableInfo {
	id: string | number
	code: string
	number: string
	name: string
	type: string
	status: 'idle' | 'occupied' | 'reserved' | 'maintenance'
	store_id: string | number
	hourly_rate: number
	zone_id?: string
	zone_name?: string
}

export interface LoginResult {
	token: string
	table: TableInfo
}

export interface Product {
	id: string | number
	name: string
	price: number
	unit: string
	image: string
	category_id: string | number
	stock?: number
	sort?: number
	status?: number
}

export interface Category {
	id: string | number
	name: string
	icon?: string
	sort?: number
}

export type OrderStatus = 'pending' | 'paid' | 'in_progress' | 'completed' | 'cancelled' | 'idle'

export interface Order {
	id: string | number
	order_no: string
	table_id: string | number
	table_name?: string
	status: OrderStatus
	total_amount?: number
	created_at?: string
	start_time?: string
	paid_at?: string
	completed_at?: string
	duration_minutes?: number
	remaining_minutes?: number
	hourly_rate?: number | string
	current_rate?: number | string
	prepaid_hours?: number
	customer_count?: number
	table_fee?: number | string
	product_fee?: number | string
	assistant_fee?: number | string
	total_fee?: number | string
	final_amount?: number | string
	discount?: number | string
	items?: OrderItem[]
	pricing_info?: {
		pricing_type: string
		current_rate: number
		is_member_discount: boolean
	}
}

export interface OrderItem {
  id: string | number
  order_id?: string | number
  product_id: string | number
  product_name?: string
  item_name?: string
  name?: string
  quantity: number
  unit_price: number
  total_price?: number
  final_price?: number
  image?: string
  emoji?: string
  unit?: string
  description?: string
  status?: string
}

export interface Assistant {
	id: string | number
	name: string
	avatar?: string
	level_id: string | number
	level_name?: string
	hourly_rate: number
	is_online: number
	is_busy?: number
	skill_tags?: string[]
}

export interface AssistantLevel {
	id: string | number
	name: string
	code: string
	color?: string
	hourly_rate?: number
	description?: string
	sort_order?: number
	status?: number
}

export interface AssistantOrder {
	id: string | number
	order_no: string
	assistant_id: string | number
	assistant_name: string
	table_id: string | number
	duration: number
	total_amount: number
	status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
	start_time?: string
	end_time?: string
	created_at: string
}

export interface Activity {
	id: string | number
	title: string
	description: string
	image: string
	start_time: string
	end_time: string
	status: number
	sort?: number
}

export interface ServiceItem {
	id: number
	code: string
	name: string
	icon: string
	color: string
	description: string
	type: 'normal' | 'vip'
}

export interface ServiceEvaluate {
	id: string
	call_id: string
	service_type: string
	service_name: string
	service_attitude: number
	service_speed: number
	service_professional: number
	feedback?: string
	created_at: string
}

export type ServiceCallType = 'clean' | 'refill' | 'repair' | 'other'

export interface ServiceCall {
	id: string | number
	type: ServiceCallType
	type_text?: string
	service_name?: string
	status: 'pending' | 'processing' | 'completed'
	table_id: string | number
	table_name?: string
	remark?: string
	created_at: string
	processed_at?: string
	completed_at?: string
}

export interface Notification {
	id: string | number
	type: 'order' | 'service' | 'system' | 'assistant'
	title: string
	content: string
	is_read: number
	created_at: string
	data?: Record<string, any>
}

export const TABLE_STATUS_MAP: Record<string, string> = {
	idle: '空闲',
	occupied: '使用中',
	reserved: '已预订',
	maintenance: '维护中'
}

export const ORDER_STATUS_MAP: Record<OrderStatus, string> = {
	idle: '空闲',
	pending: '待支付',
	paid: '已支付',
	in_progress: '进行中',
	completed: '已完成',
	cancelled: '已取消'
}

export const SERVICE_CALL_TYPE_MAP: Record<ServiceCallType, string> = {
	clean: '清洁服务',
	refill: '加水服务',
	repair: '维修服务',
	other: '其他服务'
}

export const GAME_TYPE_MAP: Record<string, string> = {
	'8ball': '美式八球',
	'9ball': '美式九球',
	snooker: '斯诺克',
	carom: '开仑'
}

export interface GameConfig {
  id: string
  code: string
  name: string
  icon: string
  description?: string
  ball_count: number
  scoring_type: 'win_only' | 'simple' | 'cumulative' | 'special'
  target_score?: number
  default_player_count: number
}

export interface GameRules {
  title: string
  basic: string[]
  win: string[]
  foul: string[]
}

export interface Ball {
  id: string | number
  type: string
  color: string
  points?: number
}

export interface ScoreBoard {
  id: string
  table_id: string
  game_type: string
  game_name: string
  status: 'waiting' | 'playing' | 'ended'
  players: Array<{
    id: number
    name: string
    balls: (string | number)[]
    is_online: boolean
  }>
  current_player_index: number
  balls_remaining: (string | number)[]
  balls_sunk: Array<{
    player_index: number
    balls: (string | number)[]
  }>
  scores: number[]
  target_score?: number
  winner?: number
  created_at?: string
}
