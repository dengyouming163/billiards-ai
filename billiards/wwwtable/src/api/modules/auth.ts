import { get, post } from '@/api/request'
import type { LoginResult, TableInfo } from '@/types'

export function tableLogin(params: { code: string }): Promise<LoginResult> {
  return post('/tablet.Auth/login', params)
}

export function logout(): Promise<any> {
  return post('/tablet.Auth/logout')
}

export function getTableInfo(): Promise<TableInfo> {
  return get('/tablet.Auth/info')
}