/**
 * 会员管理 API 服务
 */

import { get, post, put, del } from './client';
import { API_ENDPOINTS } from './config';
import type { Member, MemberTier } from '@/lib/types';

interface ListParams {
  page?: number;
  page_size?: number;
  keyword?: string;
  level_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

interface MemberStatistics {
  total_member: number;
  active_member: number;
  total_balance: number;
  total_points: number;
  level_stats: Array<{
    id: string;
    name: string;
    code: string;
    color: string;
    count: number;
  }>;
}

interface RechargeRecord {
  id: string;
  member_id: string;
  order_no: string;
  amount: number;
  gift_amount: number;
  gift_points: number;
  payment_method: string;
  balance_before: number;
  balance_after: number;
  points_before: number;
  points_after: number;
  created_at: string;
}

interface ConsumeRecord {
  id: string;
  member_id: string;
  order_id?: string;
  order_no?: string;
  amount: number;
  points_gained: number;
  points_deduct: number;
  balance_deduct: number;
  discount_amount: number;
  consume_type: string;
  balance_before: number;
  balance_after: number;
  points_before: number;
  points_after: number;
  created_at: string;
}

interface RechargeResult {
  recharge_id: string;
  order_no: string;
  amount: number;
  gift_amount: number;
  balance_before: number;
  balance_after: number;
  gift_points: number;
  earned_points: number;
  points_before: number;
  points_after: number;
}

interface ConsumeResult {
  amount: number;
  discount_amount: number;
  points_gained: number;
  points_deduct: number;
  balance_deduct: number;
  balance_before: number;
  balance_after: number;
  points_before: number;
  points_after: number;
  total_consume: number;
  upgrade?: {
    member_id: string;
    old_level_id: string;
    old_level_name: string;
    new_level_id: string;
    new_level_name: string;
    upgrade_reason: string;
  };
}

interface UpgradeResult {
  member_id: string;
  old_level_id: string;
  old_level_name: string;
  new_level_id: string;
  new_level_name: string;
  upgrade_reason: string;
}

export async function fetchMembers(params?: ListParams) {
  return get<{ data: Member[]; pagination: { page: number; page_size: number; total: number; total_pages: number } }>(
    API_ENDPOINTS.members,
    params as Record<string, string | number>
  );
}

export async function fetchMember(id: string) {
  return get<Member>(`/member.Member/detail/${id}`);
}

export async function createMember(data: { [key: string]: unknown }) {
  const payload = {
    name: data.name,
    phone: data.phone,
    gender: 'unknown',
    birthday: data.birthday,
    card_number: data.card_number || data.cardNumber,
    balance: data.balance,
    points: data.points,
    remark: data.remark,
    level_id: data.level,
    status: data.status === 'active' ? 1 : 0,
    total_consume: data.total_consume,
    total_recharge: data.total_recharge,
  };
  return post<Member>('/member.Member/create', payload);
}

export async function updateMember(id: string, data: Partial<Member> & { level_id?: string }) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.level_id !== undefined) payload.level_id = data.level_id;
  if (data.birthday !== undefined) payload.birthday = data.birthday;
  if (data.status !== undefined) payload.status = data.status === 'active' ? 1 : 0;
  if (data.remark !== undefined) payload.remark = data.remark;
  return put<Member>(`/member.Member/update/${id}`, payload);
}

export async function deleteMember(id: string) {
  return del<void>(`/member.Member/delete/${id}`);
}

export async function recharge(memberId: string, amount: number, giftAmount: number = 0, paymentMethod: string = 'wechat') {
  return post<RechargeResult>(`/member.Member/recharge/${memberId}`, {
    amount,
    gift_amount: giftAmount,
    payment_method: paymentMethod,
  });
}

export async function fetchMemberRechargeRecords(memberId: string, params?: ListParams) {
  return get<{ data: RechargeRecord[]; pagination: { page: number; page_size: number; total: number; total_pages: number } }>(
    `/member.Member/recharges/${memberId}`,
    params as Record<string, string | number>
  );
}

export async function fetchMemberConsumeRecords(memberId: string, params?: ListParams) {
  return get<{ data: ConsumeRecord[]; pagination: { page: number; page_size: number; total: number; total_pages: number } }>(
    `/member.Member/consumes/${memberId}`,
    params as Record<string, string | number>
  );
}

export async function fetchStatistics() {
  return get<MemberStatistics>('/member.Member/statistics');
}

export async function fetchMemberLevels() {
  return get<MemberTier[]>('/member.Member/levels');
}

export async function createMemberLevel(data: Omit<MemberTier, 'id' | 'storeId' | 'level' | 'status'> & { code: string; sort_order?: number }) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.discount !== undefined) payload.discount_rate = data.discount * 100;
  if (data.pointsRate !== undefined) payload.points_multiplier = data.pointsRate;
  if (data.minAmount !== undefined) payload.min_amount = data.minAmount;
  if (data.minPoints !== undefined) payload.min_points = data.minPoints;
  if (data.code !== undefined) payload.code = data.code;
  if (data.sort_order !== undefined) payload.sort_order = data.sort_order;
  return post<MemberTier>('/member.Member/createLevel', payload);
}

export async function updateMemberLevel(id: string, data: Partial<MemberTier>) {
  const payload: Record<string, unknown> = {};
  if (data.name !== undefined) payload.name = data.name;
  if (data.discount !== undefined) payload.discount_rate = data.discount * 100;
  if (data.pointsRate !== undefined) payload.points_multiplier = data.pointsRate;
  if (data.minAmount !== undefined) payload.min_amount = data.minAmount;
  if (data.minPoints !== undefined) payload.min_points = data.minPoints;
  if (data.status !== undefined) payload.status = data.status === 'active' ? 1 : 0;
  return put<MemberTier>(`/member.Member/updateLevel/${id}`, payload);
}

export async function deleteMemberLevel(id: string) {
  return del<void>(`/member.Member/deleteLevel/${id}`);
}

export async function upgradeMember(memberId: string, levelId?: string) {
  const payload = levelId ? { level_id: levelId } : {};
  return post<UpgradeResult>(`/member.Member/upgrade/${memberId}`, payload);
}

export async function pointsExchange(memberId: string, points: number) {
  return post<{
    points_deduct: number;
    exchange_type: string;
    amount: number;
    points_before: number;
    points_after: number;
    balance_before: number;
    balance_after: number;
  }>(`/member.Member/points-exchange/${memberId}`, { points });
}

export async function pointsAdjust(memberId: string, points: number, type: 'add' | 'deduct', reason?: string) {
  return post<{
    points: number;
    type: string;
    reason: string;
    points_before: number;
    points_after: number;
  }>(`/member.Member/points-adjust/${memberId}`, { points, type, reason });
}