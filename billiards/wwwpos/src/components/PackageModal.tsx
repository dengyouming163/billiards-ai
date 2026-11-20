'use client';

import { useState } from 'react';
import { Package, Clock, Users, Gift, Crown, Check, CreditCard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { ModalContainer } from './ModalContainer';
import type { Package as PackageType } from '@/types';

interface PackageModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSelect?: (pkg: PackageType) => void;
  tableId?: string;
}

export default function PackageModal({ isOpen = true, onClose, onSelect, tableId }: PackageModalProps) {
  const { state } = useApp();
  const [selectedType, setSelectedType] = useState<PackageType['type'] | 'all'>('all');
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);

  if (!isOpen) return null;

  const filteredPackages = state.packages.filter((pkg) => {
    if (!pkg.available) return false;
    if (selectedType === 'all') return true;
    return pkg.type === selectedType;
  });

  const packageTypeLabels: Record<PackageType['type'], { label: string; icon: React.ReactNode; color: string }> = {
    time: { label: '时长', icon: <Clock className="w-3 h-3" />, color: 'bg-amber-100 text-amber-700' },
    product: { label: '商品', icon: <Gift className="w-3 h-3" />, color: 'bg-emerald-100 text-emerald-700' },
    mixed: { label: '混合', icon: <Package className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
    membership: { label: '会员', icon: <Crown className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
    membership_card: { label: '会员卡', icon: <CreditCard className="w-3 h-3" />, color: 'bg-pink-100 text-pink-700' },
  };

  const handleSelect = () => {
    if (selectedPackage && onSelect) {
      onSelect(selectedPackage);
      onClose();
      setSelectedPackage(null);
    }
  };

  const footer = selectedPackage ? (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-xs text-slate-500">已选择：</span>
        <span className="text-sm font-bold text-slate-900 ml-1">{selectedPackage.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors text-sm"
        >
          取消
        </button>
        <button
          onClick={handleSelect}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium hover:shadow-sm transition-all"
        >
          确认选择
        </button>
      </div>
    </div>
  ) : null;

  return (
    <ModalContainer
      title="选择套餐"
      icon={<Package className="w-4 h-4 text-white" />}
      onClose={onClose}
      footer={footer}
      width="max-w-4xl"
    >
      {/* Type Filter */}
      <div className="p-3 border-b border-slate-100 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedType === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          全部
        </button>
        {Object.entries(packageTypeLabels).map(([type, config]) => (
          <button
            key={type}
            onClick={() => setSelectedType(type as PackageType['type'])}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              selectedType === type
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Package List */}
      <div className="p-3 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPackages.map((pkg) => {
            const typeConfig = packageTypeLabels[pkg.type];
            const isSelected = selectedPackage?.id === pkg.id;
            const discount = pkg.originalPrice > 0 ? Math.round((1 - pkg.actualPrice / pkg.originalPrice) * 100) : 0;

            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mb-2 ${typeConfig.color}`}>
                  {typeConfig.icon}
                  {typeConfig.label}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mb-3">{pkg.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {pkg.duration && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-xs text-slate-600">
                      <Clock className="w-3 h-3" />
                      {pkg.duration}分钟
                    </span>
                  )}
                  {pkg.includeAssistant && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 rounded text-xs text-blue-600">
                      <Users className="w-3 h-3" />
                      含助教
                    </span>
                  )}
                  {pkg.products && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 rounded text-xs text-emerald-600">
                      <Gift className="w-3 h-3" />
                      含商品
                    </span>
                  )}
                </div>

                <div className="flex items-end gap-2">
                  <span className="text-lg font-bold text-emerald-600">¥{pkg.actualPrice}</span>
                  <span className="text-xs text-slate-400 line-through">¥{pkg.originalPrice}</span>
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-xs font-medium">
                    省{discount}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-8">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">暂无可用套餐</p>
          </div>
        )}
      </div>
    </ModalContainer>
  );
}
