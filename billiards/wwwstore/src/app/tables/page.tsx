'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/hooks/use-app';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { Gamepad2, LayoutGrid, Coffee, Clock, DollarSign, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { TablesManagementTab } from './components/tables-management-tab';
import { TablesZonesTab } from './components/tables-zones-tab';
import { TablesTableTypesTab } from './components/tables-table-types-tab';
import { TablesPeriodsTab } from './components/tables-periods-tab';
import { PricingRulesTab } from './components/tables-pricing-rules-tab';
import { PricingCouponTab } from './components/tables-pricing-coupon-tab';

type TabKey = 'management' | 'zones' | 'tableTypes' | 'periods' | 'pricingRules' | 'coupon';

export default function TablesPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('settings:table')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('management');

  return (
    <div className="space-y-6">
      <PageHeader
        title="台桌管理"
        description="管理球房台桌、分区、台型、时段和计费规则配置"
        icon={Gamepad2}
      />

      {/* Tab bar — exact match with employees/page.tsx */}
      <div className="flex flex-wrap gap-2 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'management' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'management'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('management')}
        >
          <Gamepad2 className="w-4 h-4 mr-2" />
          台桌管理
        </Button>
        <Button
          variant={activeTab === 'zones' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'zones'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('zones')}
        >
          <LayoutGrid className="w-4 h-4 mr-2" />
          分区配置
        </Button>
        <Button
          variant={activeTab === 'tableTypes' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'tableTypes'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('tableTypes')}
        >
          <Coffee className="w-4 h-4 mr-2" />
          台型配置
        </Button>
        <Button
          variant={activeTab === 'periods' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'periods'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('periods')}
        >
          <Clock className="w-4 h-4 mr-2" />
          时段配置
        </Button>
        <Button
          variant={activeTab === 'pricingRules' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'pricingRules'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('pricingRules')}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          标准计费规则
        </Button>
        <Button
          variant={activeTab === 'coupon' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'coupon'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('coupon')}
        >
          <Package className="w-4 h-4 mr-2" />
          套餐券管理
        </Button>
      </div>

      {/* Content container — exact match with employees/page.tsx */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
        {activeTab === 'management' && <TablesManagementTab />}
        {activeTab === 'zones' && (
          <TablesZonesTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'zones'}
            success={success}
            warning={warning}
          />
        )}
        {activeTab === 'tableTypes' && (
          <TablesTableTypesTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'tableTypes'}
            success={success}
            warning={warning}
          />
        )}
        {activeTab === 'periods' && (
          <TablesPeriodsTab
            currentStoreId={currentStore?.id}
            visible={activeTab === 'periods'}
            success={success}
            warning={warning}
          />
        )}
        {activeTab === 'pricingRules' && <PricingRulesTab />}
        {activeTab === 'coupon' && <PricingCouponTab />}
      </div>
    </div>
  );
}
