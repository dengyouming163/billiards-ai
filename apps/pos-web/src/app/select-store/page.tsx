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
      <div className="h-screen w-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl shadow-xl mb-6">
            <Waves className="w-12 h-12 text-white animate-pulse" />
          </div>
          <p className="text-xl text-slate-500">加载门店列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-xl mb-6">
            <StoreIcon className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">选择门店</h1>
          <p className="text-lg text-slate-500">请选择您要管理的门店</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-10">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-lg text-slate-500">加载中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg text-red-500 mb-6">{error}</p>
              <button
                onClick={loadStores}
                className="px-8 py-4 bg-emerald-500 text-white text-base rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg"
              >
                重新加载
              </button>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-20 h-20 text-slate-300 mx-auto mb-4" />
              <p className="text-lg text-slate-500">暂无门店数据</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => handleSelectStore(store)}
                  disabled={switching}
                  className="w-full flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group disabled:opacity-50"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                      {store.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-xl text-slate-800">{store.name}</h3>
                      {store.address && (
                        <p className="text-base text-slate-400">{store.address}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-7 h-7 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-base text-slate-400 mt-10">
          © 2026 台屏智联 · 台球行业数字化管理平台
        </p>
      </div>
    </div>
  );
}
