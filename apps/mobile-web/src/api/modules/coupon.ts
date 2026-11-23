import { get, post } from '../request'

export interface CouponPackage {
  id: string
  name: string
  duration_hours: number
  price: number
  original_price: number
  status?: string
}

export function getCouponPackageList(): Promise<CouponPackage[]> {
  return get('/coupon.Package/list', { platform: 'internal' })
}

export function confirmInternalCoupon(data: {
  package_id: string
  table_id: string
  player_count: number
}): Promise<Record<string, unknown>> {
  return post('/pos.Coupon/confirmInternal', data)
}

// === 外部团购验券（美团/抖音）— 保留给 verify.vue 使用 ===
export interface PrepareResult {
  coupon_code: string
  platform: string
  valid: boolean
  package_name?: string
  original_price?: number
  [key: string]: any
}

export interface VerifyResult {
  success: boolean
  order_no?: string
  [key: string]: any
}

export const couponApi = {
  prepare: (platform: string, couponCode: string) =>
    post<PrepareResult>('/pos.Coupon/prepare', { platform, coupon_code: couponCode }),

  confirm: (params: Record<string, unknown>) =>
    post<VerifyResult>('/pos.Coupon/confirm', params),

  revoke: (verifyId: string) =>
    post<Record<string, unknown>>('/pos.Coupon/revoke', { verify_id: verifyId }),

  getRecords: (params: Record<string, unknown>) =>
    get<Record<string, unknown>[]>('/pos.Coupon/records', params),

  listInternal: () =>
    get<Record<string, unknown>>('/coupon.Package/list', { platform: 'internal' }),

  confirmInternal: (params: { package_id: string; table_id: string; player_count: number }) =>
    post<Record<string, unknown>>('/pos.Coupon/confirmInternal', params),

  payAndOpen: (params: { package_id: string; table_id: string; player_count: number; payment_method: string; verify_code?: string; cash_amount?: number }) =>
    post<Record<string, unknown>>('/pos.Coupon/payAndOpen', params),
}
