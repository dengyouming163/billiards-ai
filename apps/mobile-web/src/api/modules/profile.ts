import { get, post, uploadFile } from '@/api/request'

export interface ServiceItem {
	id?: string
	icon: string
	name: string
	description: string
	price: string
	unit: string
}

export interface ProfileData {
	id: string
	name: string
	phone: string
	role: string
	store_name: string
	join_time: string
	avatar: string
	nickname: string
	signature: string
	tags: string[]
	album: string[]
	services: ServiceItem[]
	today_income: number
	today_orders: number
	today_duration: number
	status: number
}

export function getProfile(): Promise<ProfileData> {
	return get('/mobile.Profile/index')
}

export function updateProfile(data: {
	nickname?: string
	avatar?: string
	signature?: string
	tags?: string[]
}): Promise<{ code: number; msg: string }> {
	return post('/mobile.Profile/update', data)
}

export function uploadAlbum(url: string): Promise<{ url: string }> {
	return post('/mobile.Profile/uploadAlbum', { file_path: url }) as unknown as Promise<{ url: string }>
}

export function deleteAlbum(url: string): Promise<{ code: number; msg: string }> {
	return post('/mobile.Profile/deleteAlbum', { url })
}

export function uploadAvatar(filePath: string): Promise<{ url: string }> {
	return uploadFile('/mobile.Profile/uploadAvatar', filePath, 'file') as unknown as Promise<{ url: string }>
}

export function saveService(data: ServiceItem): Promise<ServiceItem> {
	return post('/mobile.Profile/saveService', data)
}

export function deleteService(id: string): Promise<{ code: number; msg: string }> {
	return post('/mobile.Profile/deleteService', { id })
}

export interface TagItem {
	id: string
	name: string
	category: string
}

export function getTags(): Promise<TagItem[]> {
	return get('/mobile.AssistantTag/list')
}

/** 助教上线 */
export function goOnline(): Promise<{ status: number }> {
	return post('/mobile.Assistant/goOnline')
}

/** 助教下线（不接新单，不影响进行中服务） */
export function goOffline(): Promise<{ status: number }> {
	return post('/mobile.Assistant/goOffline')
}

/** 获取当前助教状态 */
export function getAssistantStatus(): Promise<{ status: number }> {
	return get('/mobile.Assistant/status')
}
