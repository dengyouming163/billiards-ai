'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  fetchCorporateBanks,
  fetchPersonalBanks,
  fetchProvinces,
  fetchCities,
  fetchBankBranches,
  type BankInfo,
  type ProvinceInfo,
  type CityInfo,
  type BranchInfo,
} from '@/lib/api/wechat-applyment';
import { toast } from 'sonner';

/**
 * 银行选择器 — 三级联动（账户类型 → 省份 → 城市 → 支行）
 * 用于微信支付进件结算账户
 */
export function BankSelector() {
  const { register, watch, setValue } = useFormContext();

  const accountType = watch('bank_account_info.bank_account_type');
  const selectedBankCode = watch('bank_account_info.account_bank_code');

  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [provinces, setProvinces] = useState<ProvinceInfo[]>([]);
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);

  // 账户类型变更 → 加载对应银行列表
  useEffect(() => {
    if (!accountType) return;
    setLoadingBanks(true);
    const fetcher = accountType === 'BANK_ACCOUNT_TYPE_CORPORATE' ? fetchCorporateBanks : fetchPersonalBanks;
    fetcher()
      .then((res: any) => setBanks(res?.data || []))
      .catch(() => toast.error('加载银行列表失败'))
      .finally(() => setLoadingBanks(false));
  }, [accountType]);

  const [provinceCode, setProvinceCode] = useState('');
  const [cityCode, setCityCode] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const filteredBranches = branchFilter
    ? branches.filter((b) => b.bank_branch_name.includes(branchFilter))
    : branches;

  const loadProvinces = async () => {
    try {
      const res = await fetchProvinces();
      setProvinces((res as any)?.data || []);
    } catch { toast.error('加载省份失败'); }
  };

  const loadCities = async (code: string) => {
    setProvinceCode(code);
    setLoadingCities(true);
    try {
      const res = await fetchCities(code);
      setCities((res as any)?.data || []);
      setBranches([]);
    } catch { toast.error('加载城市失败'); }
    finally { setLoadingCities(false); }
  };

  const loadBranches = async (bankAliasCode: string, code: string) => {
    setCityCode(code);
    if (!bankAliasCode) return;
    setLoadingBranches(true);
    try {
      const res = await fetchBankBranches(bankAliasCode, code);
      setBranches((res as any)?.data || []);
      setBranchFilter('');
    } catch { toast.error('加载支行失败'); }
    finally { setLoadingBranches(false); }
  };

  const handleBankSelect = (bankAliasCode: string, bankAlias: string) => {
    setValue('bank_account_info.account_bank_code', bankAliasCode);
    setValue('bank_account_info.bank_name', bankAlias);
    setValue('bank_account_info.account_bank', bankAlias);
    loadProvinces();
  };

  const handleBranchSelect = (branchId: string) => {
    setValue('bank_account_info.bank_branch_id', branchId);
  };

  return (
    <div className="space-y-4">
      {/* 银行选择 */}
      {banks.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">* 开户银行</label>
          <select
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            value={selectedBankCode || ''}
            onChange={(e) => {
              const selected = banks.find((b) => b.bank_alias_code === e.target.value);
              if (selected) handleBankSelect(selected.bank_alias_code, selected.bank_alias);
            }}
            disabled={loadingBanks}
          >
            <option value="">{loadingBanks ? '加载中...' : '请选择开户银行'}</option>
            {banks.map((b) => (
              <option key={b.bank_alias_code} value={b.bank_alias_code}>
                {b.bank_alias}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 省份选择 */}
      {provinces.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">* 开户省市</label>
          <select
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            value={provinceCode}
            onChange={(e) => loadCities(e.target.value)}
          >
            <option value="">请选择省份</option>
            {provinces.map((p) => (
              <option key={p.province_code} value={p.province_code}>
                {p.province_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 城市选择 */}
      {cities.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">* 开户城市</label>
          <select
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            value={cityCode}
            onChange={(e) => loadBranches(selectedBankCode, e.target.value)}
            disabled={loadingCities}
          >
            <option value="">{loadingCities ? '加载中...' : '请选择城市'}</option>
            {cities.map((c) => (
              <option key={c.city_code} value={c.city_code}>
                {c.city_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 支行选择 */}
      {branches.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-1 block">* 支行</label>
          <input
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white mb-2"
            placeholder="输入支行名称搜索..."
            onChange={(e) => setBranchFilter(e.target.value)}
          />
          <select
            className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
            value={watch('bank_account_info.bank_branch_id') || ''}
            onChange={(e) => handleBranchSelect(e.target.value)}
            disabled={loadingBranches}
          >
            <option value="">{loadingBranches ? '加载中...' : `请选择支行 (共${filteredBranches.length}条)`}</option>
            {filteredBranches.map((br) => (
              <option key={br.bank_branch_id} value={br.bank_branch_id}>
                {br.bank_branch_name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-1">可搜索支行名称，选中后联行号自动填充</p>
        </div>
      )}

      {/* 联行号（自动填充只读） */}
      <div>
        <label className="text-sm font-medium mb-1 block">联行号</label>
        <input
          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-100 text-slate-500"
          readOnly
          placeholder="选择支行后自动填入"
          {...register('bank_account_info.bank_branch_id')}
        />
      </div>
    </div>
  );
}
