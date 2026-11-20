import { get, post } from '@/api/request'
import type { LoginParams, LoginResult, EmployeeInfo } from '@/types'

export function sendSmsCode(phone: string): Promise<Record<string, unknown>> {
	return post('/auth.Auth/sendSmsCode', { phone })
}

export function smsLogin(params: LoginParams): Promise<LoginResult> {
	return post('/auth.Auth/smsLogin', params)
}

export function passwordLogin(params: LoginParams): Promise<LoginResult> {
	return post('/auth.Auth/login', params)
}

export function logout(): Promise<Record<string, unknown>> {
	return post('/auth.Auth/logout')
}

export function getUserInfo(): Promise<EmployeeInfo> {
	return get('/auth.Auth/info')
}

export function changePassword(oldPassword: string, newPassword: string): Promise<Record<string, unknown>> {
	return post('/auth.Auth/password', {
		old_password: oldPassword,
		new_password: newPassword
	})
}

export function getRoles(): Promise<Array<{ id: string; name: string; type: string }>> {
	return get('/auth.Auth/roles')
}

export function switchRole(roleType: string): Promise<LoginResult> {
	return post('/auth.Auth/switchRole', { role_type: roleType })
}

export function getMyPermissions(): Promise<string[]> {
	return get('/permission.Permission/myPermissions', { module: 'mobile' })
}
