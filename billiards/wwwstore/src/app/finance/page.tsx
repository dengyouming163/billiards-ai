'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Wallet, Banknote, BarChart3, ArrowLeftRight, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { FinanceIncomeTab } from './components/finance-income-tab';
import { FinanceRevenueTab } from './components/finance-revenue-tab';
import { FinanceRechargeTab } from './components/finance-recharge-tab';
import { AgentReconciliationTab } from './components/agent-reconciliation-tab';

type TabKey = 'income' | 'revenue' | 'recharge' | 'agent';

export default function FinancePage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('finance:cashflow')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('income');

  return (
    <div className="space-y-6">
      <PageHeader
        title="财务对账"
        description="查看收入方式、营业额项目和充值明细报表"
        icon={Wallet}
      />

      <div className="flex flex-wrap gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'income' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'income'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('income')}
        >
          <Banknote className="w-4 h-4 mr-2" />
          收入方式明细
        </Button>
        <Button
          variant={activeTab === 'revenue' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'revenue'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('revenue')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          营业额项目统计
        </Button>
        <Button
          variant={activeTab === 'recharge' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'recharge'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('recharge')}
        >
          <ArrowLeftRight className="w-4 h-4 mr-2" />
          充值明细报表
        </Button>
        <Button
          variant={activeTab === 'agent' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'agent'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('agent')}
        >
          <Bot className="w-4 h-4 mr-2" />
          智能交班
        </Button>
      </div>

      <div className="rounded-[24px] border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
        {activeTab === 'income' && <FinanceIncomeTab />}
        {activeTab === 'revenue' && <FinanceRevenueTab />}
        {activeTab === 'recharge' && <FinanceRechargeTab />}
        {activeTab === 'agent' && <AgentReconciliationTab />}
      </div>
    </div>
  );
}
