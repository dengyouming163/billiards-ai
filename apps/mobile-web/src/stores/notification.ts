import { reactive } from 'vue'
import { getNotifications, getUnreadCount, markRead, markAllRead, type NotificationItem } from '@/api/modules/notification'

class NotificationStore {
	notifications: NotificationItem[] = []
	unreadCount: number = 0
	isLoading: boolean = false

	async loadNotifications(type?: string): Promise<void> {
		this.isLoading = true
		try {
			const result = await getNotifications({ type, page_no: 1, page_size: 20 })
			this.notifications = result.list || []
		} catch (e) {
			console.error('[NotificationStore] loadNotifications failed:', e)
			this.notifications = []
		} finally {
			this.isLoading = false
		}
	}

	async loadUnreadCount(): Promise<void> {
		try {
			const result = await getUnreadCount()
			this.unreadCount = result.count || 0
		} catch (e) {
			console.error('[NotificationStore] loadUnreadCount failed:', e)
			this.unreadCount = 0
		}
	}

	async markAsRead(id: number): Promise<void> {
		try {
			await markRead(String(id))
			const item = this.notifications.find(n => n.id === id)
			if (item) {
				item.is_read = 1
				this.unreadCount = Math.max(0, this.unreadCount - 1)
			}
		} catch (e) {
			console.error('[NotificationStore] markAsRead failed:', e)
		}
	}

	async markAllAsRead(): Promise<void> {
		try {
			await markAllRead()
			this.notifications.forEach(n => n.is_read = 1)
			this.unreadCount = 0
		} catch (e) {
			console.error('[NotificationStore] markAllAsRead failed:', e)
		}
	}

	removeNotification(id: number): void {
		this.notifications = this.notifications.filter(n => n.id !== id)
	}
}

export const notificationStore = reactive(new NotificationStore()) as NotificationStore
