import { get, post } from '@/api/request'

export interface Store {
	id: number
	name: string
	address: string
	phone: string
}

export function getStoreList(): Promise<Store[]> {
	return get<Store[]>('/store.Store/lists')
}

export function switchStore(storeId: number | string): Promise<any> {
	return post('/store.Store/switch', { store_id: storeId })
}
