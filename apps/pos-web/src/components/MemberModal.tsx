'use client';

import { useState, useEffect, useCallback } from 'react';
import { ModalShell } from '@/components/ModalShell';
import { memberApi, orderApi } from '@/lib/api/pos';
import { Button } from '@/components/ui/button';
import type { Table } from '@/types';
import { Search, User, Phone, CreditCard, Gift, Star, Check, ChevronRight, Banknote, Smartphone, Settings, History, Zap, X, RefreshCw, Loader2 } from 'lucide-react';

interface LevelOption { id: string; name: string; discount: number; color: string; minAmount: number; minPoints: number; }
interface MemberResult { id: string; name: string; phone: string; balance: number; points: number; totalConsume: number; levelId: string; levelName: string; levelColor: string; levelDiscount: number; status: string; }
interface MemberModalProps { table?: Table; onClose: () => void; onSuccess?: () => void; onMemberBound?: () => void; defaultTab?: 'search' | 'register' | 'recharge'; }

const quickRechargeAmounts = [100, 200, 500, 1000, 2000, 5000];

export function MemberModal({ table, onClose, onSuccess, onMemberBound, defaultTab = 'search' }: MemberModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'register' | 'recharge' | 'records'>(defaultTab);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bindSearchResults, setBindSearchResults] = useState<MemberResult[]>([]);
  const [bindHasSearched, setBindHasSearched] = useState(false);
  const [rechargeSearchResults, setRechargeSearchResults] = useState<MemberResult[]>([]);
  const [rechargeHasSearched, setRechargeHasSearched] = useState(false);
  const [recentMembers, setRecentMembers] = useState<MemberResult[]>([]);
  const [orderId, setOrderId] = useState<string>('');
  const [levelOptions, setLevelOptions] = useState<LevelOption[]>([]);
  const [registerForm, setRegisterForm] = useState({ phone: '', name: '', levelId: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rechargeMember, setRechargeMember] = useState<MemberResult | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [giftAmount, setGiftAmount] = useState('');
  const [giftPoints, setGiftPoints] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [rechargeSubTab, setRechargeSubTab] = useState<'cash' | 'wechat' | 'adjust'>('cash');
  const [barcodeCode, setBarcodeCode] = useState('');
  const [wechatStatus, setWechatStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [wechatError, setWechatError] = useState('');
  const [rechargeToken, setRechargeToken] = useState('');
  const [wechatResult, setWechatResult] = useState<Record<string, unknown> | null>(null);
  const [recordsList, setRecordsList] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const pageSize = 20;

  const loadRechargeRecords = async (page: number = 1, phone?: string) => {
    setRecordsLoading(true);
    try {
      const params: Record<string, any> = { page, pageSize };
      if (phone) params.phone = phone;
      else if (searchQuery.trim()) params.phone = searchQuery.trim();
      const result = await memberApi.rechargeRecords(params) as any;
      const list = result?.lists || [];
      if (page === 1) setRecordsList(list);
      else setRecordsList(prev => [...prev, ...list]);
      setRecordsTotal(result?.total || 0);
      setRecordsPage(page);
    } catch { if (page === 1) setRecordsList([]); }
    finally { setRecordsLoading(false); }
  };

  // 默认加载
  useEffect(() => {
    if (activeTab !== 'records') return;
    loadRechargeRecords(1);
    loadRecentMembers();
  }, [activeTab]);

  useEffect(() => {
    memberApi.levels().then((levels) => {
      const mapped: LevelOption[] = (levels as Record<string, unknown>[]).map((l) => ({
        id: l.id as string, name: l.name as string, discount: (l.discount as number) || 0,
        color: (l.color as string) || '#94a3b8', minAmount: (l.minAmount as number) || 0, minPoints: (l.minPoints as number) || 0,
      }));
      setLevelOptions(mapped);
      if (mapped.length > 0) setRegisterForm((f) => ({ ...f, levelId: mapped[0].id }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!table) return;
    orderApi.getCurrentOrder(table.id).then((result) => { const data = result as Record<string, unknown>; if (data?.id) setOrderId(data.id as string); }).catch(() => {});
  }, [table]);

  const loadRecentMembers = useCallback(async () => {
    try { const result = await memberApi.lists({ page: 1, page_size: 6 }); setRecentMembers((result as unknown as MemberResult[]) || []); } catch { /* ignore */ }
  }, []);
  useEffect(() => { loadRecentMembers(); }, [loadRecentMembers]);

  const clearErrors = () => { setErrorMsg(''); setFieldErrors({}); };
  const isValidPhone = (phone: string) => /^1\d{10}$/.test(phone);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (activeTab === 'recharge') setRechargeHasSearched(true); else setBindHasSearched(true);
    try { const result = await memberApi.search(searchQuery.trim()); const list = (result as unknown as MemberResult[]) || []; if (activeTab === 'recharge') setRechargeSearchResults(list); else setBindSearchResults(list); }
    catch { if (activeTab === 'recharge') setRechargeSearchResults([]); else setBindSearchResults([]); }
  };

  const handleBindMember = async (member: MemberResult) => {
    if (!orderId) return; setIsProcessing(true);
    try { await orderApi.bindMember({ order_id: orderId, member_id: member.id, member_name: member.name, member_phone: member.phone }); onSuccess?.(); onMemberBound?.(); onClose(); }
    catch { /* API client handles */ } finally { setIsProcessing(false); }
  };

  const handleRegister = async () => {
    clearErrors(); const errors: Record<string, string> = {};
    if (!registerForm.phone.trim()) errors.phone = '请输入手机号'; else if (!isValidPhone(registerForm.phone)) errors.phone = '请输入正确的11位手机号';
    if (!registerForm.name.trim()) errors.name = '请输入姓名';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setIsProcessing(true);
    try { await memberApi.create({ name: registerForm.name.trim(), phone: registerForm.phone.trim(), level_id: registerForm.levelId || levelOptions[0]?.id || 'level_normal' }); await loadRecentMembers(); onSuccess?.(); onClose(); }
    catch (err: unknown) { setErrorMsg(err instanceof Error ? err.message : '开卡失败，请重试'); } finally { setIsProcessing(false); }
  };

  const handleCashRecharge = async () => {
    if (!rechargeMember) return;
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0 || !isFinite(amount)) return;
    if (amount > 50000) { setErrorMsg('单次充值不能超过 ¥50,000'); return; }
    setIsProcessing(true);
    try {
      const result = await memberApi.cashRecharge(rechargeMember.id, {
        amount,
        gift_amount: parseFloat(giftAmount) || 0,
        gift_points: parseInt(giftPoints) || 0,
      });
      const data = result as Record<string, unknown>;
      if (data?.receipt) {
        printRechargeReceipt(data.receipt as Record<string, unknown>);
      }
      await loadRecentMembers();
      onSuccess?.();
      onClose();
    } catch {
      /* handled by api client */
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWechatRecharge = async () => {
    if (!rechargeMember || !barcodeCode) return;
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) return;

    setWechatStatus('processing');
    setWechatError('');
    setIsProcessing(true);

    try {
      let token = rechargeToken;
      if (!token) {
        const prepResult = await memberApi.prepareRecharge({
          member_id: rechargeMember.id,
          amount,
        });
        const prepData = prepResult as Record<string, unknown>;
        token = prepData?.token as string || '';
        setRechargeToken(token);
      }

      const result = await memberApi.wechatRecharge(rechargeMember.id, {
        amount,
        auth_code: barcodeCode,
        token,
        gift_amount: parseFloat(giftAmount) || 0,
        gift_points: parseInt(giftPoints) || 0,
      });
      const data = result as Record<string, unknown>;
      setWechatResult(data);
      setWechatStatus('success');
      if (data?.receipt) {
        printRechargeReceipt(data.receipt as Record<string, unknown>);
      }
      await loadRecentMembers();
      onSuccess?.();
      setTimeout(() => onClose(), 1500);
    } catch (e: unknown) {
      setWechatStatus('error');
      setWechatError(e instanceof Error ? e.message : '支付失败，请重试');
      setRechargeToken(''); // 清除旧 token，确保重试时重新 prepare
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBalanceAdjust = async () => {
    if (!rechargeMember) return;
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount === 0 || !isFinite(amount)) return;
    const remark = giftAmount || '余额调整';
    setIsProcessing(true);
    try {
      await memberApi.adjustBalance(rechargeMember.id, {
        amount,
        remark,
      });
      await loadRecentMembers();
      onSuccess?.();
      onClose();
    } catch {
      /* handled by api client */
    } finally {
      setIsProcessing(false);
    }
  };

  const printRechargeReceipt = async (receipt: Record<string, unknown>) => {
    try {
      const lines = [
        '======== 充值凭证 ========',
        `会员: ${receipt.member_name || ''}`,
        `手机: ${receipt.member_phone || ''}`,
        `类型: ${receipt.payment_method === 'cash' ? '现金充值' : '微信充值'}`,
        `充值金额: ¥${Number(receipt.amount || 0).toFixed(2)}`,
        `赠送金额: ¥${Number(receipt.gift_amount || 0).toFixed(2)}`,
        `赠送积分: ${receipt.gift_points || 0}`,
        `余额变动: ¥${Number(receipt.balance_before || 0).toFixed(2)} → ¥${Number(receipt.balance_after || 0).toFixed(2)}`,
        `单号: ${receipt.order_no || ''}`,
        `时间: ${receipt.created_at || ''}`,
        '==========================',
      ];
      const { printReceipt } = await import('@/utils/printer');
      printReceipt({ lines });
    } catch (e) {
      console.error('打印小票失败:', e);
    }
  };

  const renderMemberCard = (member: MemberResult, showBindButton: boolean = true, key?: string) => (
    <div key={key || member.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${member.levelColor}15` }}>
            <User className="w-7 h-7" style={{ color: member.levelColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">{member.name}</h3>
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium" style={{ backgroundColor: `${member.levelColor}20`, color: member.levelColor }}>
                {member.levelName || '普通'}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {member.phone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Star className="w-3.5 h-3.5" style={{ color: member.levelColor }} />
          <span>{member.levelDiscount > 0 ? `${(member.levelDiscount > 1 ? member.levelDiscount / 10 : member.levelDiscount * 10).toFixed(1)}折` : '无折扣'}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl">
        <div className="text-center">
          <p className="text-xl font-bold text-emerald-600">¥{member.balance}</p>
          <p className="text-xs text-slate-500 mt-0.5">可用余额</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-amber-500">{member.points}</p>
          <p className="text-xs text-slate-500 mt-0.5">积分</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-slate-600">¥{member.totalConsume}</p>
          <p className="text-xs text-slate-500 mt-0.5">累计消费</p>
        </div>
      </div>
      {showBindButton && orderId && (
        <button 
          onClick={() => handleBindMember(member)} 
          disabled={isProcessing}
          className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" /> 绑定到当前订单
            </>
          )}
        </button>
      )}
    </div>
  );

  const renderLevelCard = (level: LevelOption, isSelected: boolean, key?: string) => (
    <button
      key={key || level.id}
      onClick={() => setRegisterForm({ ...registerForm, levelId: level.id })}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100' 
          : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: level.color }}
        />
        <span className="text-base font-bold" style={{ color: level.color }}>
          {level.name}
        </span>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-600">
          {level.discount > 0 ? `享 ${(level.discount > 1 ? level.discount / 10 : level.discount * 10).toFixed(1)} 折优惠` : '无折扣'}
        </p>
        {level.minAmount > 0 && (
          <p className="text-xs text-slate-400">
            最低充值 ¥{level.minAmount}
          </p>
        )}
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );

  return (
    <ModalShell onClose={onClose} title="会员管理" icon={<User className="w-5 h-5" />} width="50vw">
      <div className="flex flex-col h-full">
        <div className="flex border-b border-slate-200">
          {[
            { key: 'search' as const, label: '查询', icon: Search },
            { key: 'register' as const, label: '开卡', icon: User },
            { key: 'recharge' as const, label: '充值', icon: CreditCard },
            { key: 'records' as const, label: '记录', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.key} 
                onClick={() => { clearErrors(); setActiveTab(tab.key); }}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${
                  activeTab === tab.key 
                    ? 'text-emerald-600' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-emerald-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          {activeTab === 'search' && (
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="输入手机号或姓名搜索会员..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full h-14 pl-12 pr-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                  />
                </div>
                <Button 
                  onClick={handleSearch} 
                  className="h-14 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <Search className="w-4 h-4 mr-2" />搜索
                </Button>
              </div>

              {bindHasSearched && bindSearchResults.length > 0 && (
                <div className="space-y-4">
                  {bindSearchResults.map((member) => renderMemberCard(member, true, member.id))}
                </div>
              )}

              {bindHasSearched && bindSearchResults.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                  <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium">未找到匹配的会员</p>
                  <p className="text-sm text-slate-400 mt-1">请尝试其他关键词或为顾客开卡</p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-500">最近会员</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {recentMembers.map((member) => (
                    <button 
                      key={member.id} 
                      onClick={() => { 
                        setSearchQuery(member.phone); 
                        setBindSearchResults([member]); 
                        setBindHasSearched(true); 
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${member.levelColor}15` }}>
                        <User className="w-5 h-5" style={{ color: member.levelColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800 truncate">{member.name}</p>
                          <span className="px-2 py-0.5 rounded-md text-xs" style={{ backgroundColor: `${member.levelColor}15`, color: member.levelColor }}>
                            {member.levelName || '普通'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">余额 ¥{member.balance}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'register' && (
            <div className="space-y-5">
              {errorMsg && (
                <div className="px-5 py-3.5 rounded-xl bg-red-50 border-2 border-red-200 text-red-600 text-sm font-medium flex items-center gap-2">
                  <X className="w-4 h-4" /> {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">手机号 *</label>
                  <input 
                    type="tel" 
                    placeholder="请输入11位手机号" 
                    value={registerForm.phone}
                    onChange={(e) => { 
                      setRegisterForm({ ...registerForm, phone: e.target.value }); 
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' })); 
                    }}
                    className={`w-full h-14 px-4 rounded-xl bg-slate-50 border-2 text-base outline-none focus:bg-white transition-all ${
                      fieldErrors.phone ? 'border-red-400' : 'border-slate-200 focus:border-emerald-500'
                    }`} 
                  />
                  {fieldErrors.phone && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.phone}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">姓名 *</label>
                  <input 
                    type="text" 
                    placeholder="请输入顾客姓名" 
                    value={registerForm.name}
                    onChange={(e) => { 
                      setRegisterForm({ ...registerForm, name: e.target.value }); 
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' })); 
                    }}
                    className={`w-full h-14 px-4 rounded-xl bg-slate-50 border-2 text-base outline-none focus:bg-white transition-all ${
                      fieldErrors.name ? 'border-red-400' : 'border-slate-200 focus:border-emerald-500'
                    }`} 
                  />
                  {fieldErrors.name && (
                    <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                      <X className="w-3 h-3" /> {fieldErrors.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-600 mb-3">会员等级</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {levelOptions.map((level) => renderLevelCard(level, registerForm.levelId === level.id, level.id))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700">开卡福利</span>
                </div>
                <p className="text-sm text-emerald-600">新会员开卡即享专属折扣优惠，消费累计积分可兑换礼品</p>
              </div>

            </div>
          )}

          {activeTab === 'recharge' && (
            <div className="space-y-5">
              {!rechargeMember ? (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-slate-600">选择会员</label>
                  <div className="flex gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="搜索会员手机号或姓名..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full h-12 px-12 pr-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                      />
                    </div>
                    <Button 
                      onClick={handleSearch} 
                      className="h-12 px-6 rounded-xl bg-emerald-500 text-white font-bold"
                    >
                      <Search className="w-4 h-4 mr-2" />搜索
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-auto">
                    {(rechargeHasSearched ? rechargeSearchResults : recentMembers).map((member) => (
                      <button 
                        key={member.id} 
                        onClick={() => { 
                          setRechargeMember(member); 
                          setRechargeAmount(''); 
                          setGiftAmount(''); 
                          setBarcodeCode(''); 
                          setWechatStatus('idle'); 
                          setWechatError(''); 
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${member.levelColor}15` }}>
                          <User className="w-6 h-6" style={{ color: member.levelColor }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-bold text-slate-800">{member.name}</h4>
                            <span className="px-2 py-0.5 rounded-md text-xs" style={{ backgroundColor: `${member.levelColor}15`, color: member.levelColor }}>
                              {member.levelName || '普通'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{member.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-emerald-600">¥{member.balance}</p>
                          <p className="text-xs text-slate-400">{member.points}积分</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <User className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{rechargeMember.name}</h3>
                          <p className="text-sm text-white/80 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {rechargeMember.phone}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setRechargeMember(null); }}
                        className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-all flex items-center gap-2 text-sm font-medium"
                      >
                        <X className="w-4 h-4" /> 切换
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mt-5">
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm text-white/70 mb-1">当前余额</p>
                        <p className="text-3xl font-bold">¥{rechargeMember.balance}</p>
                      </div>
                      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <p className="text-sm text-white/70 mb-1">可用积分</p>
                        <p className="text-3xl font-bold">{rechargeMember.points}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 p-2 bg-slate-100 rounded-xl">
                    {[
                      { key: 'cash' as const, label: '现金充值', icon: Banknote },
                      { key: 'wechat' as const, label: '微信充值', icon: Smartphone },
                      { key: 'adjust' as const, label: '余额调整', icon: Settings },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button 
                          key={tab.key}
                          onClick={() => { 
                            setRechargeSubTab(tab.key); 
                            setErrorMsg(''); 
                            setBarcodeCode(''); 
                            setWechatStatus('idle'); 
                            setWechatError(''); 
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                            rechargeSubTab === tab.key
                              ? 'bg-white text-emerald-600 shadow-md'
                              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    {rechargeSubTab === 'cash' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">充值金额</label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {quickRechargeAmounts.map((amount) => (
                              <button
                                key={amount}
                                onClick={() => setRechargeAmount(amount.toString())}
                                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                  rechargeAmount === amount.toString()
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                ¥{amount}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="number" 
                            placeholder="或输入自定义金额" 
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                          />
                        </div>

                        {rechargeAmount && parseFloat(rechargeAmount) > 0 && (
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-600 font-medium">实收金额</span>
                              <span className="text-3xl font-bold text-emerald-600">¥{parseFloat(rechargeAmount).toFixed(2)}</span>
                            </div>
                            {giftAmount && parseFloat(giftAmount) > 0 && (
                              <div className="flex items-center justify-between mt-2 text-sm">
                                <span className="text-slate-500">赠送金额</span>
                                <span className="text-amber-500 font-bold">+¥{parseFloat(giftAmount).toFixed(2)}</span>
                              </div>
                            )}
                            {giftPoints && parseInt(giftPoints) > 0 && (
                              <div className="flex items-center justify-between mt-1 text-sm">
                                <span className="text-slate-500">赠送积分</span>
                                <span className="text-amber-500 font-bold">+{giftPoints}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-2">
                        </div>
                      </div>
                    )}

                    {rechargeSubTab === 'wechat' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">充值金额</label>
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {quickRechargeAmounts.map((amount) => (
                              <button
                                key={amount}
                                onClick={() => setRechargeAmount(amount.toString())}
                                className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                  rechargeAmount === amount.toString()
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                ¥{amount}
                              </button>
                            ))}
                          </div>
                          <input 
                            type="number" 
                            placeholder="或输入自定义金额" 
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                          />
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-dashed border-green-300">
                          <div className="text-center mb-4">
                            <Smartphone className="w-10 h-10 mx-auto text-green-500 mb-2" />
                            <p className="text-sm font-bold text-green-700">请扫描顾客微信付款码</p>
                            <p className="text-xs text-green-600 mt-1">支持微信支付/支付宝</p>
                          </div>
                          <input
                            id="barcodeInput"
                            type="text"
                            placeholder="扫码枪自动填入..."
                            value={barcodeCode}
                            onChange={(e) => {
                              setBarcodeCode(e.target.value);
                              if (e.target.value.length >= 16) {
                                setTimeout(() => handleWechatRecharge(), 100);
                              }
                            }}
                            className="w-full h-14 px-4 rounded-xl bg-white border-2 border-green-300 text-base text-center outline-none focus:border-emerald-500 font-mono tracking-wider"
                            autoFocus
                          />
                        </div>

                        {wechatStatus === 'processing' && (
                          <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-amber-50 border border-amber-200">
                            <span className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-amber-700 font-medium">支付处理中，请稍候...</span>
                          </div>
                        )}

                        {wechatStatus === 'success' && (
                          <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-emerald-700 font-bold">支付成功</p>
                              <p className="text-xs text-emerald-600">小票已自动打印</p>
                            </div>
                          </div>
                        )}

                        {wechatStatus === 'error' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-3 py-4 rounded-xl bg-red-50 border border-red-200">
                              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                                <X className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-red-700 font-medium">{wechatError || '支付失败'}</span>
                            </div>
                            <button 
                              onClick={() => { setWechatStatus('idle'); setBarcodeCode(''); setWechatError(''); }}
                              className="w-full h-12 rounded-xl border-2 border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-4 h-4" /> 重新扫码
                            </button>
                          </div>
                        )}

                      </div>
                    )}

                    {rechargeSubTab === 'adjust' && (
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">调整金额</label>
                          <p className="text-xs text-slate-400 mb-2">正数增加余额，负数扣减余额</p>
                          <input 
                            type="number" 
                            placeholder="例如：100 或 -50" 
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-600 mb-2">调整原因</label>
                          <input 
                            type="text" 
                            placeholder="请输入调整原因（如：补偿、修正、活动赠送等）" 
                            value={giftAmount}
                            onChange={(e) => setGiftAmount(e.target.value)}
                            className="w-full h-14 px-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" 
                          />
                        </div>

                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                          <div className="flex items-start gap-3">
                            <Settings className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-amber-700">余额调整说明</p>
                              <p className="text-xs text-amber-600 mt-1">余额调整会记录到账单中，请确保有合理的原因，调整操作不可撤销</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* 充值记录 Tab */}
          {activeTab === 'records' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="text" placeholder="输入会员手机号搜索充值记录"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadRechargeRecords(1)}
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-base outline-none focus:border-emerald-500 focus:bg-white transition-all" />
                </div>
                <Button onClick={() => loadRechargeRecords(1)}
                  className="h-12 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">
                  <Search className="w-4 h-4 mr-2" />搜索
                </Button>
              </div>

              {recordsLoading ? (
                <div className="text-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" /></div>
              ) : recordsList.length > 0 ? (
                <div>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                      <span className="col-span-2">会员</span>
                      <span className="col-span-2">手机号</span>
                      <span className="col-span-2">金额</span>
                      <span className="col-span-2">类型</span>
                      <span className="col-span-4">时间</span>
                    </div>
                    {recordsList.map((rec: any, i: number) => (
                      <div key={rec.id || i} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-50 text-sm hover:bg-slate-50">
                        <span className="col-span-2 font-medium text-slate-700 truncate">{rec.memberName || rec.member_name || '-'}</span>
                        <span className="col-span-2 text-slate-500 truncate">{rec.memberPhone || rec.member_phone || '-'}</span>
                        <span className={`col-span-2 font-bold ${Number(rec.amount) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {Number(rec.amount) > 0 ? '+' : ''}¥{Number(rec.amount).toFixed(2)}
                        </span>
                        <span className="col-span-2 text-slate-500">
                          {((): string => { const m = (rec.paymentMethod || rec.payment_method || '') as string; const map: Record<string,string> = {cash:'现金充值',wechat:'微信充值',adjustment:'余额调整',wechat_recharge:'微信充值'}; return map[m] || m; })()}
                        </span>
                        <span className="col-span-4 text-xs text-slate-400">{rec.createdAt || rec.created_at || ''}</span>
                      </div>
                    ))}
                  </div>
                  {recordsTotal > recordsList.length && (
                    <button onClick={() => loadRechargeRecords(recordsPage + 1)}
                      className="w-full py-3 mt-3 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">
                      加载更多 ({recordsList.length}/{recordsTotal})
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无充值记录</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 开卡操作按钮 — 底部固定 */}
        {activeTab === 'register' && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-white">
            <div className="flex justify-end gap-3">
              <Button onClick={onClose} variant="outline"
                className="h-14 px-8 rounded-xl text-slate-600 font-bold border-2 hover:bg-slate-50">取消</Button>
              <Button onClick={handleRegister} disabled={isProcessing}
                className="h-14 px-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                {isProcessing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '确认开卡'}
              </Button>
            </div>
          </div>
        )}

        {/* 充值操作按钮 — 底部固定 */}
        {activeTab === 'recharge' && rechargeMember && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-200 bg-white">
            <div className="flex justify-end">
              {rechargeSubTab === 'cash' && (
                <button onClick={handleCashRecharge}
                  disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || isProcessing}
                  className="h-14 px-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {isProcessing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Banknote className="w-5 h-5" /> 确认收款 ¥{rechargeAmount || 0}</>}
                </button>
              )}
              {rechargeSubTab === 'wechat' && (
                <button onClick={handleWechatRecharge}
                  disabled={!rechargeAmount || parseFloat(rechargeAmount) <= 0 || isProcessing}
                  className="h-14 px-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {isProcessing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Smartphone className="w-5 h-5" /> 确认支付 ¥{rechargeAmount || 0}</>}
                </button>
              )}
              {rechargeSubTab === 'adjust' && (
                <button onClick={handleBalanceAdjust}
                  disabled={!rechargeAmount || parseFloat(rechargeAmount) === 0 || isProcessing}
                  className="h-14 px-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {isProcessing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-5 h-5" /> 确认调整 {rechargeAmount && (parseFloat(rechargeAmount) > 0 ? '+' : '')}{rechargeAmount}</>}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}