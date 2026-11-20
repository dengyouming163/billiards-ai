'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import type { Member, MemberLevel, RechargeTier } from '@/types';
import { mockRechargeTiers } from '@/data/mock-data';
import {
  Search,
  User,
  Phone,
  CreditCard,
  Gift,
  Star,
  Check,
} from 'lucide-react';
import { ModalContainer } from './ModalContainer';

interface MemberModalProps {
  onClose: () => void;
  defaultTab?: 'search' | 'register' | 'recharge';
}

const LEVEL_CONFIG: Record<MemberLevel, { label: string; color: string; discount: number }> = {
  normal: { label: '普通', color: '#64748b', discount: 0 },
  silver: { label: '银卡', color: '#c0c0c0', discount: 5 },
  gold: { label: '金卡', color: '#10b981', discount: 10 },
  diamond: { label: '钻石', color: '#8b5cf6', discount: 15 },
};

export function MemberModal({ onClose, defaultTab = 'search' }: MemberModalProps) {
  const { state, findMember, rechargeMember, createMember } = useApp();
  
  const [activeTab, setActiveTab] = useState<'search' | 'register' | 'recharge'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<Member | null>(null);
  
  // Register form
  const [registerForm, setRegisterForm] = useState({
    phone: '',
    name: '',
    level: 'normal' as MemberLevel,
  });
  
  // Recharge state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedTier, setSelectedTier] = useState<RechargeTier | null>(null);
  const [customAmount, setCustomAmount] = useState('');

  const rechargeTiers = mockRechargeTiers;

  const handleSearch = () => {
    const member = findMember(searchQuery);
    if (member) {
      setSearchResult(member);
    } else {
      setSearchResult(null);
    }
  };

  const handleRegister = () => {
    if (!registerForm.phone || !registerForm.name) return;
    createMember({
      phone: registerForm.phone,
      name: registerForm.name,
      level: registerForm.level,
    });
    setRegisterForm({ phone: '', name: '', level: 'normal' });
    onClose();
  };

  const handleRecharge = () => {
    if (!selectedMember) return;
    const amount = selectedTier?.amount || parseFloat(customAmount);
    if (amount > 0) {
      rechargeMember(selectedMember.id, amount, { bonus: selectedTier?.bonus || 0, points: selectedTier?.points || 0 });
      setSelectedTier(null);
      setCustomAmount('');
      setSelectedMember(null);
      onClose();
    }
  };

  const footer = (
    <div className="flex items-center gap-2">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm hover:bg-slate-200 transition-colors"
      >
        取消
      </button>
      {activeTab === 'register' && (
        <button
          onClick={handleRegister}
          disabled={!registerForm.phone || !registerForm.name}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-sm transition-all disabled:opacity-50"
        >
          确认开卡
        </button>
      )}
      {activeTab === 'recharge' && selectedMember && (
        <button
          onClick={handleRecharge}
          disabled={!selectedTier && !customAmount}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-sm transition-all disabled:opacity-50"
        >
          确认充值 ¥{selectedTier?.amount || customAmount || 0}
        </button>
      )}
    </div>
  );

  return (
    <ModalContainer
      title="会员管理"
      icon={<User className="w-4 h-4 text-white" />}
      onClose={onClose}
      footer={activeTab !== 'search' ? footer : undefined}
      width="max-w-2xl"
    >
      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        {[
          { id: 'search', label: '查询' },
          { id: 'register', label: '开卡' },
          { id: 'recharge', label: '充值' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-emerald-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="输入手机号查询..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <button onClick={handleSearch} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Search result */}
            {searchResult && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${LEVEL_CONFIG[searchResult.level].color}20` }}
                    >
                      <User className="w-6 h-6" style={{ color: LEVEL_CONFIG[searchResult.level].color }} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{searchResult.name}</p>
                      <p className="text-sm text-slate-500">{searchResult.phone}</p>
                    </div>
                  </div>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${LEVEL_CONFIG[searchResult.level].color}20`,
                      color: LEVEL_CONFIG[searchResult.level].color,
                    }}
                  >
                    {LEVEL_CONFIG[searchResult.level].label}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-bold text-emerald-600">¥{searchResult.balance}</p>
                    <p className="text-xs text-slate-500">余额</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-600">{searchResult.points}</p>
                    <p className="text-xs text-slate-500">积分</p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent members */}
            <div>
              <h3 className="text-xs font-medium text-slate-500 mb-2">最近会员</h3>
              <div className="space-y-1">
                {state.members.slice(0, 5).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setSearchQuery(member.phone);
                      setSearchResult(member);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${LEVEL_CONFIG[member.level].color}20` }}
                    >
                      <User className="w-4 h-4" style={{ color: LEVEL_CONFIG[member.level].color }} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.phone}</p>
                    </div>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: `${LEVEL_CONFIG[member.level].color}20`,
                        color: LEVEL_CONFIG[member.level].color,
                      }}
                    >
                      {LEVEL_CONFIG[member.level].label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Register Tab */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">手机号</label>
              <input
                type="tel"
                placeholder="请输入手机号"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">姓名</label>
              <input
                type="text"
                placeholder="请输入姓名"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">会员等级</label>
              <div className="grid grid-cols-2 gap-2">
                {(['normal', 'silver', 'gold', 'diamond'] as MemberLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setRegisterForm({ ...registerForm, level })}
                    className={`p-3 rounded-lg border transition-all text-center ${
                      registerForm.level === level
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className="text-sm font-medium"
                      style={{ color: LEVEL_CONFIG[level].color }}
                    >
                      {LEVEL_CONFIG[level].label}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {LEVEL_CONFIG[level].discount > 0 ? `享${LEVEL_CONFIG[level].discount}%折扣` : '无折扣'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recharge Tab */}
        {activeTab === 'recharge' && (
          <div className="space-y-4">
            {!selectedMember ? (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">选择会员</label>
                <div className="space-y-1 max-h-48 overflow-auto">
                  {state.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${LEVEL_CONFIG[member.level].color}20` }}
                      >
                        <User className="w-4 h-4" style={{ color: LEVEL_CONFIG[member.level].color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-slate-400">¥{member.balance} | {member.points}积分</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Selected member info */}
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${LEVEL_CONFIG[selectedMember.level].color}20` }}
                      >
                        <User className="w-5 h-5" style={{ color: LEVEL_CONFIG[selectedMember.level].color }} />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{selectedMember.name}</p>
                        <p className="text-xs text-slate-400">{selectedMember.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      切换
                    </button>
                  </div>
                </div>

                {/* Recharge tiers */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">选择充值档位</label>
                  <div className="grid grid-cols-2 gap-2">
                    {rechargeTiers.map((tier) => (
                      <button
                        key={tier.id}
                        onClick={() => setSelectedTier(tier)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTier?.id === tier.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg font-bold text-emerald-600">¥{tier.amount}</span>
                          {tier.bonus > 0 && (
                            <span className="text-xs text-rose-500">送¥{tier.bonus}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom amount */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">自定义金额</label>
                  <input
                    type="number"
                    placeholder="输入充值金额"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTier(null);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </ModalContainer>
  );
}
