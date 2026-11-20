'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { MembersManagementTab } from './components/members-management-tab';
import { MembersLevelsTab } from './components/members-levels-tab';

type TabKey = 'management' | 'levels';

export default function MembersPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('member:list')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('management');

  return (
    <div className="space-y-6">
      <PageHeader
        title="会员管理"
        description="管理会员信息和等级配置"
        icon={Users}
      />

      <div className="flex flex-wrap gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === 'management' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'management'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('management')}
        >
          <Users className="w-4 h-4 mr-2" />
          会员管理
        </Button>
        <Button
          variant={activeTab === 'levels' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === 'levels'
              ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('levels')}
        >
          <Award className="w-4 h-4 mr-2" />
          会员等级
        </Button>
      </div>

      <div className="rounded-[24px] border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
        {activeTab === 'management' && <MembersManagementTab />}
        {activeTab === 'levels' && <MembersLevelsTab />}
      </div>
    </div>
  );
}
