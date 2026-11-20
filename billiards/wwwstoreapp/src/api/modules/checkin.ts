import { get, post, uploadFile } from '@/api/request'
import type { CheckInRecord } from '@/types'

export function signIn(params: { location?: string; remark?: string }): Promise<{ created_at?: string }> {
	return post('/mobile.Checkin/signIn', params)
}

export function signOut(params: { location?: string; remark?: string }): Promise<{ created_at?: string }> {
	return post('/mobile.Checkin/signOut', params)
}

export function getCheckinRecords(pageNo: number = 1, pageSize: number = 20): Promise<{ lists: CheckInRecord[]; count: number; page_no: number }> {
	return get('/mobile.Checkin/records', { page_no: pageNo, page_size: pageSize })
}

export function getTodayStatus(): Promise<{ is_signed_in: boolean; is_signed_out: boolean; sign_in?: { created_at?: string }; sign_out?: { created_at?: string }; checkin_time?: string; checkout_time?: string }> {
	return get('/mobile.Checkin/todayStatus')
}

export function applyOutwork(params: { start_time: string; end_time: string; reason: string }): Promise<Record<string, unknown>> {
	return post('/mobile.Checkin/applyOutwork', params)
}

/**
 * Upload checkin photos one-at-a-time using the shared uploadFile()
 * (same pattern as uploadAvatar in profile.ts).
 * Backend delegates to UploadService::image() → returns { url: "..." }.
 */
export async function uploadCheckinPhotos(filePaths: string[]): Promise<string[]> {
	const urls: string[] = []
	for (const fp of filePaths) {
		const url = await uploadFile('/mobile.Checkin/uploadPhotos', fp, 'file')
		urls.push(url)
	}
	return urls
}

/** Sign in with photos (assistant role) */
export function signInWithPhotos(data: {
	photo_urls: string[]
	latitude?: string
	longitude?: string
	location_address?: string
}): Promise<Record<string, unknown>> {
	return post('/mobile.Checkin/signInWithPhotos', data)
}

/** Sign out with photos (assistant role) */
export function signOutWithPhotos(data: {
	photo_urls: string[]
	latitude?: string
	longitude?: string
	location_address?: string
}): Promise<Record<string, unknown>> {
	return post('/mobile.Checkin/signOutWithPhotos', data)
}

/** Daily attendance response types */
export interface DailyShift {
	type: string
	label: string
	start: string
	end: string
}

export interface DailySignRecord {
	time: string
	photos: string[]
	late_minutes: number
	location: string
}

export interface DailyEmployee {
	employee_id: string
	employee_name: string
	employee_type: string
	role_name: string
	avatar: string
	shift: DailyShift | null
	is_scheduled: boolean
	status: 'checked_in' | 'not_checked' | 'off'
	sign_in: DailySignRecord | null
	sign_out: DailySignRecord | null
}

export interface DailyAttendanceData {
	date: string
	summary: {
		total: number
		checked_in: number
		not_checked: number
		off: number
	}
	list: DailyEmployee[]
}

/** Get daily attendance overview for a given date (manager view) */
export function getDailyAttendance(date: string): Promise<DailyAttendanceData> {
	return get('/mobile.Checkin/dailyAttendance', { date })
}
