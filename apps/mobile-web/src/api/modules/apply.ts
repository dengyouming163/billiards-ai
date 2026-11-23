import { get, post } from '@/api/request'
import type { ApprovalListItem } from '@/types'

export function submitCheckin(params: { checkin_time: string; reason: string }): Promise<Record<string, unknown>> {
	return post('/mobile.Apply/checkin', params)
}

export function submitLeave(params: { start_time: string; end_time: string; reason: string; type: string }): Promise<Record<string, unknown>> {
	return post('/mobile.Apply/leave', params)
}

export function getApplyRecords(type?: string, pageNo: number = 1, pageSize: number = 20): Promise<{ list: ApprovalListItem[]; count: number }> {
	return get('/mobile.Apply/records', { type, page_no: pageNo, page_size: pageSize })
}