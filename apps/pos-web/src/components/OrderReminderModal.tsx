'use client';

import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '@/lib/api/pos';
import { X, CheckCircle, RefreshCw, Package } from 'lucide-react';

interface OrderItem {
  itemId: string; itemName: string; quantity: number;
  unitPrice: number; totalPrice: number; finalPrice: number;
  status: string; createdAt: string; expiresAt?: string;
}
interface TableGroup { tableId: string; tableName: string; zoneName: string; orderId: string; items: OrderItem[]; }
interface OrderReminderModalProps { onClose: () => void; onSuccess?: () => void; }

export function OrderReminderModal({ onClose, onSuccess }: OrderReminderModalProps) {
  const [groups, setGroups] = useState<TableGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveringId, setDeliveringId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<{ item: OrderItem; group: TableGroup } | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderApi.pendingDeliveries();
      setGroups(result as unknown as TableGroup[]);
    } catch (e) { console.warn('[OrderReminder] 加载失败:', e); setGroups([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); const poll = setInterval(loadData, 10000); const tick = setInterval(() => setNow(Math.floor(Date.now()/1000)), 1000); return () => { clearInterval(poll); clearInterval(tick); }; }, [loadData]);

  const handleDeliver = async (itemId: string) => {
    setConfirmItem(null); setDeliveringId(itemId);
    try { await orderApi.deliverItem({ item_id: itemId }); onSuccess?.(); }
    catch (e) { console.warn('[OrderReminder] 送达失败:', e); } finally { setDeliveringId(null); await loadData(); }
  };

  const handleIgnore = async (itemId: string) => {
    setGroups(prev => prev.map(g => ({
      ...g, items: g.items.filter(i => i.itemId !== itemId)
    })).filter(g => g.items.length > 0))
    await orderApi.cancelItem({ item_id: itemId }).catch((e: unknown) => { console.warn('[OrderReminder] 忽略失败:', e) })
  };

  // 展平所有台桌的商品为单一列表
  const allItems = groups.flatMap(g => g.items.map(i => ({ ...i, _table: g })));
  const totalPending = allItems.length;

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[440px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">点单提醒</h2>
            {totalPending > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-200 text-orange-800 text-xs font-bold">
                {totalPending}件待处理
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-orange-100"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-orange-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
              <p className="text-sm">暂无待处理点单</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {allItems.map((item) => {
                const group = item._table as TableGroup
                const isExpired = item.expiresAt && new Date(item.expiresAt).getTime() / 1000 - now <= 0
                return (
                  <div key={item.itemId} className={`px-5 py-3 flex items-center gap-3 ${isExpired ? 'bg-red-50/30' : ''}`}>
                    <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded shrink-0">
                          {group.tableName}
                        </span>
                        <p className="text-sm font-medium text-slate-700 truncate">{item.itemName}</p>
                        {isExpired && <span className="text-xs text-red-500 font-medium shrink-0">已超时</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-slate-500">¥{item.unitPrice} × {item.quantity} = ¥{(item.unitPrice * item.quantity).toFixed(2)}</span>
                        {item.createdAt && (
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})}
                          </span>
                        )}
                        {item.expiresAt && (
                          <span className={`text-xs font-mono ${isExpired ? 'text-red-500' : new Date(item.expiresAt).getTime()/1000 - now <= 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                            剩余 {(() => { const r = Math.floor(new Date(item.expiresAt).getTime()/1000 - now); return r <= 0 ? '0' : r >= 60 ? `${Math.floor(r/60)}分${r%60}` : `${r}`; })()}秒
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setConfirmItem({ item, group })}
                        disabled={deliveringId !== null}
                        className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium disabled:opacity-50"
                      >
                        {deliveringId === item.itemId ? '处理中...' : '送达'}
                      </button>
                      <button
                        onClick={() => handleIgnore(item.itemId)}
                        disabled={deliveringId !== null}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-medium disabled:opacity-30"
                      >
                        忽略
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {confirmItem && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setConfirmItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-lg font-bold">确认送达</h3>
              <p className="text-sm text-slate-400 mt-1">
                <span className="font-bold text-slate-700">{confirmItem.group.tableName}</span> · {confirmItem.item.itemName} × {confirmItem.item.quantity}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmItem(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">取消</button>
              <button onClick={() => handleDeliver(confirmItem.item.itemId)} className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold">确认送达</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
