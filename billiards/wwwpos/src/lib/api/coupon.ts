import { get, post } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';

export const couponApi = {
  prepare: (platform: string, couponCode: string) =>
    post<Record<string, unknown>>(API_ENDPOINTS.couponPrepare, {
      platform,
      coupon_code: couponCode,
    }),

  confirm: (params: Record<string, unknown>) =>
    post<Record<string, unknown>>(API_ENDPOINTS.couponConfirm, params),

  revoke: (verifyId: string) =>
    post<Record<string, unknown>>(API_ENDPOINTS.couponRevoke, {
      verify_id: verifyId,
    }),

  getRecords: (params: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.couponRecords, params),

  listInternal: () =>
    get<Record<string, unknown>>(API_ENDPOINTS.couponInternalList, { platform: 'internal' }),

  confirmInternal: (params: { package_id: string; table_id: string; player_count: number }) =>
    post<Record<string, unknown>>(API_ENDPOINTS.couponInternalConfirm, params),

  payAndOpen: (params: { package_id: string; table_id: string; player_count: number; payment_method: string; verify_code?: string; cash_amount?: number }) =>
    post<Record<string, unknown>>(API_ENDPOINTS.couponPayAndOpen, params),

  /** 外部渠道券码核销 (美团/抖音/团券) — 使用 RAW 响应类型保留返回字段原名 */
  verifyCoupon: (data: { channel: string; code: string; amount: number }) =>
    post<{ valid: boolean; channel?: string; amount?: number; message?: string }>(
      API_ENDPOINTS.channelVerifyCoupon,
      data as Record<string, unknown>,
      ApiResponseType.RAW,
    ),
};
