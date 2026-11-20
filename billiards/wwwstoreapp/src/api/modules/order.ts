import { get, post } from '@/api/request'
import type { AssistantOrder, MainOrder, OrderListResponse } from '@/types'

export function getPendingOrders(): Promise<AssistantOrder[]> {
	return get('/mobile.AssistantOrder/pending')
}

export function getActiveOrder(): Promise<AssistantOrder | null> {
	return get('/mobile.AssistantOrder/active')
}

export function acceptOrder(params: { order_id: string }): Promise<Record<string, unknown>> {
	return post('/mobile.AssistantOrder/accept', params)
}

export function startOrder(params: { order_id: string }): Promise<Record<string, unknown>> {
	return post('/mobile.AssistantOrder/start', params)
}

export function rejectOrder(params: { order_id: string; reason?: string }): Promise<Record<string, unknown>> {
	return post('/mobile.AssistantOrder/reject', params)
}

export function completeOrder(params: { order_id: string; remark?: string }): Promise<Record<string, unknown>> {
	return post('/mobile.AssistantOrder/complete', params)
}

export function getOrderHistory(pageNo: number = 1, pageSize: number = 20): Promise<{ list: AssistantOrder[]; count: number; page_no: number }> {
	return get('/mobile.AssistantOrder/history', { page_no: pageNo, page_size: pageSize })
}

export function getAssistantRecords(params: {
	page_no?: number
	page_size?: number
	start_date?: string
	end_date?: string
}): Promise<{ list: AssistantOrder[]; count: number }> {
	return get('/mobile.AssistantOrder/records', params)
}

export function getAssistantStats(params?: {
	start_date?: string
	end_date?: string
}): Promise<{ total_orders: number; total_hours: number; total_revenue: number }> {
	return get('/mobile.AssistantOrder/stats', params || {})
}

export function getAllAssistantOrders(params: {
	status?: string
	page_no?: number
	page_size?: number
}): Promise<{ list: AssistantOrder[]; count: number; total: number }> {
	return get('/mobile.AssistantOrder/all', params)
}

export function getAssistantOrderList(params: {
	status?: string
	page_no?: number
	page_size?: number
}): Promise<{ list: AssistantOrder[]; count: number; total: number }> {
	return get('/mobile.AssistantOrder/list', params)
}

export function getOrderList(params: {
	status?: string
	dateRange?: string
	type?: string
	keyword?: string
	page?: number
	page_size?: number
}): Promise<OrderListResponse> {
	return get('/mobile.Order/lists', params)
}

export function getOrderDetail(orderId: string): Promise<MainOrder> {
	return get('/mobile.Order/detail', { order_id: orderId })
}