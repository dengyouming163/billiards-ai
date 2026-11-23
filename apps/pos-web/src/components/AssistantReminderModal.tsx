'use client';

import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '@/lib/api/pos';
import { X, Users, MapPin, CheckCircle, RefreshCw, Clock } from 'lucide-react';

interface BookingItem {
  itemId: string; orderId: string; tableId: string; tableName: string;
  zoneName: string; assistantId: string; assistantName: string;
  hourlyRate: number; status: string; createdAt: string; expiresAt?: string;
}
interface AssistantReminderModalProps { onClose: () => void; onSuccess?: () => void; }

export function AssistantReminderModal({ onClose, onSuccess }: AssistantReminderModalProps) {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [confirmBooking, setConfirmBooking] = useState<BookingItem | null>(null);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await orderApi.pendingAssistantBookings();
      setBookings(result as unknown as BookingItem[]);
    } catch (e) { console.warn('[AssistantReminder] 加载失败:', e); setBookings([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); const poll = setInterval(loadData, 10000); const tick = setInterval(() => setNow(Math.floor(Date.now()/1000)), 1000); return () => { clearInterval(poll); clearInterval(tick); }; }, [loadData]);

  const handleAccept = async (itemId: string) => {
    setConfirmBooking(null); setAcceptingId(itemId);
    try {
      await orderApi.acceptAssistant({ item_id: itemId })
      // 同意上桌后从列表移除，提示到台桌开始服务
      setBookings(prev => prev.filter(b => b.itemId !== itemId))
      onSuccess?.()
    }
    catch {} finally { setAcceptingId(null); }
  };

  const handleIgnore = async (itemId: string) => {
    setBookings(prev => prev.filter(b => b.itemId !== itemId))
    await orderApi.cancelItem({ item_id: itemId }).catch(() => {})
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-rose-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">上桌提醒</h2>
            {bookings.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 text-xs font-bold">
                {bookings.length}条待处理
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-rose-100"><RefreshCw className="w-4 h-4 text-slate-500" /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-rose-100"><X className="w-5 h-5 text-slate-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin mr-2" />加载中...
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <CheckCircle className="w-12 h-12 mb-3 text-emerald-400" />
              <p className="text-sm">暂无待安排上桌</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {bookings.map((b, i) => (
                <div key={b.itemId || `b-${i}`} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <span className="font-bold text-slate-800">{b.zoneName ? `${b.zoneName} · ` : ''}{b.tableName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm pl-6">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600">{b.assistantName}</span>
                        <span className="text-xs text-slate-400">¥{b.hourlyRate}/时</span>
                        {b.createdAt && <span className="text-xs text-slate-400 ml-2">{new Date(b.createdAt).toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'})} 预约</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {b.expiresAt && (
                        <span className={`text-xs font-mono ${new Date(b.expiresAt).getTime()/1000 - now <= 0 ? 'text-red-500' : new Date(b.expiresAt).getTime()/1000 - now <= 60 ? 'text-amber-500' : 'text-slate-400'}`}>
                          {(() => { const r = Math.floor(new Date(b.expiresAt).getTime()/1000 - now); return r <= 0 ? '已超时' : r >= 60 ? `${Math.floor(r/60)}分${r%60}秒` : `${r}秒`; })()}
                        </span>
                      )}
                      <button
                        onClick={() => setConfirmBooking(b)}
                        disabled={acceptingId === b.itemId}
                        className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium shrink-0 disabled:opacity-50"
                      >
                        {acceptingId === b.itemId ? '...' : '同意上桌'}
                      </button>
                      <button
                        onClick={() => handleIgnore(b.itemId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-500 text-xs font-medium shrink-0"
                      >
                        忽略
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmBooking && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center" onClick={() => setConfirmBooking(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold">确认上桌</h3>
              <p className="text-sm text-slate-400 mt-1">{confirmBooking.tableName} · {confirmBooking.assistantName}</p>
              <p className="text-xs text-amber-600 mt-2">同意上桌后请到台桌点击「开始服务」</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBooking(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm">取消</button>
              <button onClick={() => handleAccept(confirmBooking.itemId)} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold">确认上桌</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
