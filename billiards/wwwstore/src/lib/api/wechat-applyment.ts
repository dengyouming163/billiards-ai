import { get, post } from './client';

export interface ApplymentStatus {
  has_applyment: boolean;
  applyment?: {
    applyment_id: string;
    applyment_state: string;
    state_msg: string;
    sub_mchid: string;
    sign_url: string;
    audit_detail: Array<{ field_name: string; reject_reason: string }>;
    business_code: string;
    sub_mchname: string;
    created_at: string;
  };
}

export interface ApplyFormData {
  contact_info: {
    contact_type: string;
    contact_name: string;
    contact_id_number: string;
    mobile_phone: string;
    contact_email: string;
  };
  subject_info: {
    subject_type: string;
    business_license_info?: {
      license_copy: string;
      license_number: string;
      merchant_name: string;
      legal_person: string;
      license_address: string;
      period_begin: string;
      period_end: string;
    };
    identity_info: {
      id_holder_type: string;
      id_doc_type: string;
      id_card_info: {
        id_card_copy: string;
        id_card_national: string;
        id_card_name: string;
        id_card_number: string;
        id_card_address: string;
        card_period_begin: string;
        card_period_end: string;
      };
    };
  };
  business_info: {
    merchant_shortname: string;
    service_phone: string;
    sales_info: { sales_scenes_type: string[] };
  };
  settlement_info: {
    settlement_id: number;
    qualification_type: string;
    qualifications: string[];
  };
  bank_account_info: {
    bank_account_type: string;
    account_name: string;
    account_bank: string;
    account_bank_code: string;
    account_number: string;
    bank_name: string;
    bank_branch_id: string;
  };
  addition_info?: {
    legal_person_commitment?: string;
    legal_person_video?: string;
    business_addition_pics?: string[];
    business_addition_msg?: string;
  };
}

/** 查询进件状态 */
export async function fetchApplymentStatus(): Promise<ApplymentStatus> {
  return get('/setting.WechatApplyment/status');
}

/** 提交进件申请 */
export async function submitApplyment(data: ApplyFormData): Promise<{
  applyment_id: string;
  business_code: string;
  state: string;
}> {
  return post('/setting.WechatApplyment/apply', data as unknown as Record<string, unknown>);
}

/** 重新提交（驳回后） */
export async function resubmitApplyment(data: ApplyFormData): Promise<{
  applyment_id: string;
  business_code: string;
  state: string;
}> {
  return post('/setting.WechatApplyment/apply', data as unknown as Record<string, unknown>);
}

/** 同步进件状态 */
export async function syncApplymentStatus(): Promise<{
  applyment_state: string;
  state_msg: string;
  sub_mchid: string;
  sign_url: string;
  audit_detail?: Array<{ field_name: string; reject_reason: string }>;
}> {
  return post('/setting.WechatApplyment/sync');
}

/** 获取签约链接 */
export async function fetchSignUrl(): Promise<{ sign_url: string }> {
  return get('/setting.WechatApplyment/signUrl');
}

// ---- 银行查询（进件结算账户辅助） ----

export interface BankInfo {
  bank_alias_code: string;
  bank_alias: string;
  account_bank: string;
  need_bank_branch: boolean;
}

export interface ProvinceInfo {
  province_code: string;
  province_name: string;
}

export interface CityInfo {
  city_code: string;
  city_name: string;
}

export interface BranchInfo {
  bank_branch_id: string;
  bank_branch_name: string;
}

/** 对私银行列表 */
export async function fetchPersonalBanks(offset = 0, limit = 200): Promise<{ data: BankInfo[]; total_count: number }> {
  return get('/bank.Bank/personalBanks', { offset, limit });
}

/** 对公银行列表 */
export async function fetchCorporateBanks(offset = 0, limit = 200): Promise<{ data: BankInfo[]; total_count: number }> {
  return get('/bank.Bank/corporateBanks', { offset, limit });
}

/** 按银行账号搜索银行 */
export async function searchBanksByAccount(accountNumber: string): Promise<BankInfo[]> {
  return get('/bank.Bank/searchByAccount', { account_number: accountNumber });
}

/** 省份列表 */
export async function fetchProvinces(): Promise<{ data: ProvinceInfo[] }> {
  return get('/bank.Bank/provinces');
}

/** 城市列表 */
export async function fetchCities(provinceCode: string): Promise<{ data: CityInfo[] }> {
  return get('/bank.Bank/cities', { province_code: provinceCode });
}

/** 支行列表 */
export async function fetchBankBranches(
  bankAliasCode: string,
  cityCode: string,
  offset = 0,
  limit = 200,
): Promise<{ data: BranchInfo[]; total_count: number }> {
  return get('/bank.Bank/branches', { bank_alias_code: bankAliasCode, city_code: cityCode, offset, limit });
}
