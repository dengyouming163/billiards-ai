import { get, post } from '@/api/request'

export interface NotificationItem {
	id: number | string
	type: string
	title: string
	content: string
	is_read: number
	link?: string
	create_time: string
}

interface NotificationListResponse {
	list: NotificationItem[]
	total: number
}

export function getNotifications(params?: { type?: string; page_no?: number; page_size?: number }): Promise<NotificationListResponse> {
	return get('/mobile.Notification/lists', params)
}

export function getNotificationDetail(id: string | number): Promise<NotificationItem> {
	return get('/mobile.Notification/detail', { id })
}

export function markRead(id: string | number): Promise<Record<string, unknown>> {
	return post('/mobile.Notification/read', { id })
}

export function markAllRead(): Promise<Record<string, unknown>> {
	return post('/mobile.Notification/readAll')
}

export function deleteNotification(id: string | number): Promise<Record<string, unknown>> {
	return post('/mobile.Notification/delete', { id })
}

export function getUnreadCount(): Promise<{ count: number }> {
	return get('/mobile.Notification/unreadCount')
}
