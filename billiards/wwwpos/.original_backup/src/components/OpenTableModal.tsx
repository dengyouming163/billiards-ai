'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import type { Table, PricingPackage } from '@/types';
import { mockPricingPackages } from '@/data/mock-data';
import {
  X,
  Users,
  Clock,
  Sparkles,
  Check,
  UserCog,
  AlertCircle,
  Info,
  Minus,
  Plus,
} from 'lucide-react';

interface OpenTableModalProps {
  table: Table;
  quickStart?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OpenTableModal({
  table,
  quickStart = false,
  onClose,
  onConfirm,
}: OpenTableModalProps) {
  const { openTable, state } = useApp();
  
  const [customerCount, setCustomerCount] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string>('hourly');
  const [selectedAssistant, setSelectedAssistant] = useState<string>('');
  const [remark, setRemark] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState<string | null>(null);

  const packages = mockPricingPackages;
  const availableAssistants = state.assistants.filter((a) => a.status === 'available');
  
  // Get selected package info
  const selectedPkg = packages.find(p => p.id === selectedPackage);
  
  // Calculate estimated cost (first hour for hourly rate)
  const assistantRate = availableAssistants.find(a => a.id === selectedAssistant)?.hourlyRate || 0;
  const estimatedCost = selectedPkg ? (selectedPkg.price || (table.hourlyRate * 1)) + assistantRate : 0;

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    openTable(
      table.id,
      customerCount,
      selectedPackage,
      selectedAssistant || undefined
    );
    
    setIsProcessing(false);
    onConfirm();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[520px] max-h-[calc(100vh-2rem)] flex flex-col bg-[var(--color-bg-secondary)] rounded-xl overflow-hidden animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[var(--color-accent)]">{table.name}</span>
              <span className="text-sm text-[var(--color-text-muted)]">号桌</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              quickStart 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {quickStart ? '快速开台' : '普通开台'}
            </span>
            {state.zones && table.zoneId && (
              (() => {
                const zone = state.zones.find(z => z.id === table.zoneId);
                return zone ? (
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: zone.color }}
                  >
                    {zone.name}
                  </span>
                ) : null;
              })()
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Customer count */}
          <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              <Users className="w-4 h-4" />
              顾客人数
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCustomerCount(Math.max(1, customerCount - 1))}
                className="w-10 h-10 rounded-lg bg-[var(--color-bg-hover)] flex items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-3xl font-bold">{customerCount}</span>
                <span className="ml-2 text-[var(--color-text-muted)]">人</span>
              </div>
              <button
                onClick={() => setCustomerCount(Math.min(table.capacity, customerCount + 1))}
                className="w-10 h-10 rounded-lg bg-[var(--color-bg-hover)] flex items-center justify-center hover:bg-[var(--color-accent)]/20 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)] text-center">
              最多可容纳 {table.capacity} 人
            </p>
          </div>

          {/* Pricing packages */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              <Clock className="w-4 h-4" />
              选择计费方式
            </label>
            <div className="space-y-2">
              {/* Hourly option */}
              <button
                onClick={() => { setSelectedPackage('hourly'); setShowPackageDetail(null); }}
                className={`w-full p-4 rounded-xl border transition-all ${
                  selectedPackage === 'hourly'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPackage === 'hourly'
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                          : 'border-[var(--color-text-muted)]'
                      }`}
                    >
                      {selectedPackage === 'hourly' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">按时计费</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        ¥{table.hourlyRate}/小时，按分钟计算
                      </p>
                    </div>
                  </div>
                  <span className="money text-lg text-[var(--color-accent)]">
                    ¥{table.hourlyRate}/h
                  </span>
                </div>
              </button>

              {/* Package pricing */}
              {packages.filter(p => p.type === 'fixed').map((pkg) => (
                <div key={pkg.id}>
                  <button
                    onClick={() => { setSelectedPackage(pkg.id); setShowPackageDetail(showPackageDetail === pkg.id ? null : pkg.id); }}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedPackage === pkg.id
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                              : 'border-[var(--color-text-muted)]'
                          }`}
                        >
                          {selectedPackage === pkg.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {pkg.description}
                          </p>
                        </div>
                      </div>
                      <span className="money text-lg text-[var(--color-accent)]">
                        ¥{pkg.price}
                      </span>
                    </div>
                  </button>
                  
                  {/* Package detail */}
                  {showPackageDetail === pkg.id && (
                    <div className="mt-2 ml-8 p-3 bg-[var(--color-bg-elevated)] rounded-lg text-xs">
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
                        <Info className="w-3 h-3" />
                        套餐详情
                      </div>
                      <div className="space-y-1">
                        {pkg.products && pkg.products.length > 0 && (
                          <p>含商品：{pkg.products.join('、')}</p>
                        )}
                        {pkg.services && (
                          <p>服务：{pkg.services}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Assistant selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              <UserCog className="w-4 h-4" />
              助教服务
              <span className="text-xs text-[var(--color-text-muted)]">（可选）</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedAssistant('')}
                className={`p-3 rounded-xl border transition-all ${
                  selectedAssistant === ''
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50'
                }`}
              >
                <div className="text-center">
                  <p className="text-sm">暂不需要</p>
                </div>
              </button>
              {availableAssistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => setSelectedAssistant(assistant.id)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedAssistant === assistant.id
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 overflow-hidden">
                      {assistant.avatar ? (
                        <img src={assistant.avatar} alt={assistant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--color-accent)]">
                          {assistant.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{assistant.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        ¥{assistant.hourlyRate}/h
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {availableAssistants.length === 0 && (
              <p className="mt-2 text-sm text-[var(--color-text-muted)] text-center">
                当前没有可用助教
              </p>
            )}
          </div>

          {/* Remark */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-3">
              <Info className="w-4 h-4" />
              备注
              <span className="text-xs text-[var(--color-text-muted)]">（可选）</span>
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="例如：会员预订、特殊需求..."
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Estimated cost */}
          <div className="bg-[var(--color-accent)]/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">预计首小时费用</span>
              </div>
              <span className="text-2xl font-bold money text-[var(--color-accent)]">
                ¥{estimatedCost}
              </span>
            </div>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {selectedPackage === 'hourly' ? '按时计费超出按分钟另算' : '套餐时段内不再计费'}
              {assistantRate > 0 && `（含助教 ¥${assistantRate}/h）`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1 h-12">
              取消
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 h-12 text-lg btn-primary"
            >
              {isProcessing ? '开台中...' : '确认开台'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
