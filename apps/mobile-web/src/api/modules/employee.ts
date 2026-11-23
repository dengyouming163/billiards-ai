import { get, post, del } from '@/api/request'

export interface EmployeeRecord {
	id: string
	name: string
	phone: string
	gender?: number
	avatar?: string
	id_card?: string
	role: string
	position?: string
	salary?: number
	status: number
	hire_date?: string
	leave_date?: string
	description?: string
	store_id?: string
	created_at?: string
	updated_at?: string
}

export interface EmployeeListResponse {
	list: EmployeeRecord[]
	total: number
	page: number
	page_size: number
}

export function getEmployeeList(params?: Record<string, unknown>): Promise<EmployeeListResponse> {
	return get('/employee.Employee/lists', params)
}

export function getEmployeeDetail(id: string): Promise<EmployeeRecord> {
	return get('/employee.Employee/detail', { id })
}

export function createEmployee(params: Record<string, unknown>): Promise<{ id: string }> {
	return post('/employee.Employee/create', params)
}

export function updateEmployee(id: string, params: Record<string, unknown>): Promise<{ msg: string }> {
	return post(`/employee.Employee/update?id=${id}`, params)
}

export function deleteEmployee(id: string): Promise<{ msg: string }> {
	return del(`/employee.Employee/delete?id=${id}`)
}
