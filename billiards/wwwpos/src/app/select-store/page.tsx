'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { fetchStores, switchStore, Store } from '@/lib/api/stores';
import { Store as StoreIcon, ChevronRight, Waves, Building2 } from 'lucide-react';

export default function SelectStorePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await fetchStores();
      setStores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取门店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const [switching, setSwitching] = useState(false);

  const handleSelectStore = async (store: Store) => {
    setSwitching(true);
    try {
      await switchStore(store.id);
    } catch (e: any) {
      console.warn('Store switch API failed, using query param fallback:', e?.message || e);
    }

    // 独立存储 storeId，不受后续登录/用户切换影响
    localStorage.setItem('currentStoreId', store.id);
    if (user) {
      updateUser({
        ...user,
        storeId: store.id,
        storeName: store.name,
      });
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-3xl shadow-xl mb-6">
            <Waves className="w-12 h-12 text-white animate-pulse" />
          </div>
          <p className="text-xl text-[#999999]">加载门店列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f7f7f7] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-3xl shadow-xl mb-6">
            <StoreIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-[#333333] mb-3">选择门店</h1>
          <p className="text-lg text-[#999999]">请选择您要管理的门店</p>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-[3rem] shadow-lg p-10">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-[#07C160] border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-lg text-[#999999]">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-500 mb-6">{error}</p>
              <button
                onClick={loadStores}
                className="px-8 py-4 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white text-base rounded-full hover:opacity-90 transition-opacity shadow-lg"
              >
                重新加载
              </button>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-20 h-20 text-[#cccccc] mx-auto mb-4" />
              <p className="text-lg text-[#999999]">暂无门店数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  disabled={switching}
                  className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-[#e5e5e5] hover:border-[#07C160] hover:bg-[#D1FAE5]/50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
                      {store.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-xl text-[#333333]">{store.name}</h3>
                      {store.address && (
                        <p className="text-base text-[#999999]">{store.address}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-7 h-7 text-[#cccccc] group-hover:text-[#07C160] transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-base text-[#999999] mt-10">
          © 2026 客稻云 · 台球行业数字化管理平台
        </p>
      </div>
    </div>
  );
}
