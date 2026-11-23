import { get, post, del } from '@/api/request'

export interface AssistantSchedule {
  id: string
  assistant_id: string
  employee_name?: string
  date?: string
  shift?: string
  shift_type?: string
  start_time: string
  end_time: string
  status?: string
  work_date?: string
  remark?: string
}

export interface ShiftConfig {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  color: string
  sort_order: number
  status: number
}

// PC-aligned: assistant schedule APIs
export function getScheduleList(params?: Record<string, unknown>): Promise<{ list: AssistantSchedule[]; total: number }> {
  return get('/assistant.Assistant/getSchedules', params)
}

export function getShiftConfigs(): Promise<ShiftConfig[]> {
  return get('/assistant.Assistant/getShiftConfigs')
}

export function createSchedule(params: Record<string, unknown>): Promise<{ id: string }> {
  // Transform mobile format to backend format: {assistant_id, schedules:[{date,shift,start_time,end_time}]}
  const body = {
    assistant_id: params.employee_id || params.assistant_id,
    schedules: [{
      date: params.work_date || params.date,
      shift: params.shift_type || params.shift,
      start_time: params.start_time || '09:00',
      end_time: params.end_time || '17:00',
      remark: params.remark || '',
    }]
  }
  return post('/assistant.Assistant/setSchedule', body)
}

export function updateSchedule(id: string, params: Record<string, unknown>): Promise<{ msg: string }> {
  // Map mobile field names to backend field names
  const body: Record<string, unknown> = { id }
  if (params.employee_id) body.employee_id = params.employee_id
  if (params.work_date) body.date = params.work_date
  if (params.shift_type) body.shift = params.shift_type
  if (params.start_time) body.start_time = params.start_time
  if (params.end_time) body.end_time = params.end_time
  if (params.remark) body.remark = params.remark
  return post('/assistant.Assistant/updateSchedule', body)
}

export function deleteSchedule(id: string): Promise<{ msg: string }> {
  return post('/assistant.Assistant/deleteSchedule', { id })
}

// Mobile: employee's own schedule (used by EmployeeHome)
export function getMySchedule(week?: number): Promise<{ list: any[] }> {
  return get('/mobile.Schedule/mySchedule', { week: week ?? 0 })
}

// Backward compat: employee-based schedule (keep for non-breaking)
export function getEmployeeScheduleList(params?: Record<string, unknown>): Promise<{ list: AssistantSchedule[]; total: number }> {
  return get('/employee.Employee/schedules', params)
}
