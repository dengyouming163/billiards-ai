'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { UserCog, Building2, Shield, CheckCheck } from 'lucide-react';
import EmployeeManagement from './components/EmployeeManagement';
import StoreManagement from './components/StoreManagement';
import RoleManagement from './components/RoleManagement';
import ApprovalConfig from './components/ApprovalConfig';
import { useAuth } from '@/lib/auth-context';

export default function EmployeesPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('employee:list')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState('employees');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="员工管理" 
        description="管理员工档案、门店和角色权限" 
        icon={UserCog}
      />

      <div className="flex flex-wrap gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === "employees" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "employees" 
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl" 
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("employees")}
        >
          <UserCog className="w-4 h-4 mr-2" />
          员工管理
        </Button>
        <Button
          variant={activeTab === "stores" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "stores" 
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl" 
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("stores")}
        >
          <Building2 className="w-4 h-4 mr-2" />
          门店管理
        </Button>
        <Button
          variant={activeTab === "roles" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "roles" 
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl" 
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("roles")}
        >
          <Shield className="w-4 h-4 mr-2" />
          角色权限
        </Button>
        <Button
          variant={activeTab === "approval" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "approval" 
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl" 
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("approval")}
        >
          <CheckCheck className="w-4 h-4 mr-2" />
          审批配置
        </Button>
      </div>

      <div className="rounded-[24px] border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
        <div className="p-4">
        {activeTab === 'employees' && <EmployeeManagement />}
        {activeTab === 'stores' && <StoreManagement />}
        {activeTab === 'roles' && <RoleManagement />}
        {activeTab === 'approval' && <ApprovalConfig />}
        </div>
      </div>
    </div>
  );
}