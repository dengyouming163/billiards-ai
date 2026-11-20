import { get, post } from '@/api/request'
import type { ApprovalListItem, ApprovalRecord } from '@/types'

export function getMyApprovalList(params: {
  page?: number
  page_size?: number
  status?: string
}): Promise<{ list: ApprovalListItem[]; count: number }> {
  return get('/mobile.Approval/list', params)
}

export function getPendingApprovalList(params: {
  page?: number
  page_size?: number
}): Promise<{ list: ApprovalListItem[]; count: number }> {
  return get('/mobile.Approval/pending', params)
}

export function getApprovalDetail(params: {
  id: string
}): Promise<ApprovalRecord> {
  return get('/mobile.Approval/detail', params)
}

export function createApproval(params: {
  type: string
  reason: string
  extra_data?: Record<string, any>
}): Promise<Record<string, unknown>> {
  return post('/mobile.Approval/create', params)
}

export function approveApplication(params: {
  id: string
  remark?: string
}): Promise<Record<string, unknown>> {
  return post('/mobile.Approval/approve', params)
}

export function rejectApplication(params: {
  id: string
  remark?: string
}): Promise<Record<string, unknown>> {
  return post('/mobile.Approval/reject', params)
}

export function getApprovalConfigList(): Promise<Array<{ id: string; type: string; approvers: Array<{ id: string; name: string }> }>> {
  return get('/mobile.ApprovalConfig/list')
}

export function saveApprovalConfig(params: {
  type: string
  type_name: string
  approver_ids: string[]
  approver_names: string[]
  status?: string
}): Promise<Record<string, unknown>> {
  return post('/mobile.ApprovalConfig/save', params)
}

export function getApproverList(): Promise<Array<{ id: string; name: string; role: string }>> {
  return get('/mobile.ApprovalConfig/approvers')
}

export function getAssistantListForExchange(): Promise<{ list: Array<{ id: string; name: string; avatar: string }> }> {
  return get('/mobile.Assistant/list')
}

export function getApprovalTypes(): Promise<Array<{ type: string; label: string }>> {
  return get('/approval.Approval/types')
}

export function getApprovalCount(): Promise<{ pending: number; total: number; my: number }> {
  return get('/mobile.Approval/count')
}

export function getApprovalLists(status?: string, page?: number, pageSize?: number): Promise<{ list: ApprovalListItem[]; count: number }> {
  return get('/mobile.Approval/lists', {
    status: status || '',
    page_no: page || 1,
    page_size: pageSize || 20
  })
}