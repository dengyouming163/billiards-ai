'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Package, Package2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/page-header';
import { ProductsManagementTab } from './components/products-management-tab';
import { ProductsCategoriesTab } from './components/products-categories-tab';
import { ProductsInventoryTab } from './components/products-inventory-tab';

type TabKey = 'management' | 'categories' | 'inventory';

export default function ProductsPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('settings:product')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>('management');

  return (
    <div className="space-y-6">
      <PageHeader
        title="商品管理"
        description="管理商品信息、分类和库存记录"
        icon={Package}
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
          <Package2 className="w-4 h-4 mr-2" />
          商品管理
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'categories'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          <Package className="w-4 h-4 mr-2" />
          商品分类
        </Button>
        <Button
          variant={activeTab === 'inventory' ? 'default' : 'ghost'}
          size="sm"
          className={`rounded-xl transition-all duration-200 px-4 ${
            activeTab === 'inventory'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl'
              : 'hover:bg-white/80'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          <Archive className="w-4 h-4 mr-2" />
          库存记录
        </Button>
      </div>

      {/* Content container — exact match with employees/page.tsx */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
        {activeTab === 'management' && <ProductsManagementTab />}
        {activeTab === 'categories' && <ProductsCategoriesTab />}
        {activeTab === 'inventory' && <ProductsInventoryTab />}
      </div>
    </div>
  );
}
