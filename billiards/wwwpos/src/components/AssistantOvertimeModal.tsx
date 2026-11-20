'use client';

import { useState, memo } from 'react';
import { orderApi } from '@/lib/api/pos';

interface AssistantOvertimeModalProps {
  item: Record<string, unknown>;
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssistantOvertimeModal = memo(function AssistantOvertimeModal({
  item, orderId, onClose, onSuccess,
}: AssistantOvertimeModalProps) {
  const [hours, setHours] = useState('1');
  const [isGift, setIsGift] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const hourlyRate = (item.unitPrice || item.hourlyRate || item.hourly_rate || 0) as number;

  const handleSubmit = async () => {
    const h = parseFloat(hours);
    if (isNaN(h) || h <= 0 || h > 24) { alert('请输入有效小时数 (1-24)'); return; }
    setSubmitting(true);
    try {
      await orderApi.addGiftHours({
        item_id: item.id as string,
        gift_hours: isGift ? h : 0,
        overtime_hours: isGift ? 0 : h,
        hourly_rate: hourlyRate,
      });
      onSuccess();
      onClose();
    } catch { alert('加钟失败'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px]" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          加钟 · {item.assistantName || item.itemName || '助教'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">时长 (小时)</label>
            <div className="flex gap-2">
              {[0.5, 1, 2, 3].map(h => (
                <button key={h}
                  onClick={() => setHours(String(h))}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${hours === String(h) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >{h}h</button>
              ))}
              <input type="number" value={hours} onChange={e => setHours(e.target.value)}
                min="0.5" max="24" step="0.5"
                className="w-16 px-2 py-2 rounded-lg border border-slate-200 text-center text-sm outline-none focus:border-emerald-500" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
            <span className="text-sm text-slate-600">赠品加钟 (免费)</span>
            <button onClick={() => setIsGift(!isGift)}
              className={`w-12 h-7 rounded-full transition-colors ${isGift ? 'bg-amber-500' : 'bg-slate-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${isGift ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 text-center">
            <span className="text-sm text-emerald-700">
              {isGift ? '赠品 · 免费' : `应付 ¥${((parseFloat(hours) || 0) * (hourlyRate || 0)).toFixed(2)}`}
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors">取消</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:shadow-lg transition-all disabled:opacity-50">
            {submitting ? '处理中...' : '确认加钟'}
          </button>
        </div>
      </div>
    </div>
  );
});
