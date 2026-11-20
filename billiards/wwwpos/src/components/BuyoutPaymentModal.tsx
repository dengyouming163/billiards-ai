'use client';

import { useState, useEffect, useMemo } from 'react';
import { ModalShell } from '@/components/ModalShell';
import { orderApi } from '@/lib/api/pos';
import { CreditCard, Banknote, User, Loader2, CheckCircle, XCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface BuyoutPaymentModalProps {
  orderId: string;
  assistantId: string;
  assistantName: string;
  buyoutHours: number;
  amount: number;
  onPaid: () => void;
  onClose: () => void;
}

type PayChannel = 'wechat_micropay' | 'cash';

export function BuyoutPaymentModal({
  orderId, assistantId, assistantName, buyoutHours, amount, onPaid, onClose
}: BuyoutPaymentModalProps) {
  const [channel, setChannel] = useState<PayChannel>('wechat_micropay');
  const [cashAmount, setCashAmount] = useState(String(amount));
  const [micropayCode, setMicropayCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'paying' | 'paid' | 'failed'>('idle');
  const [error, setError] = useState('');
  const [memberInfo, setMemberInfo] = useState<{ name: string; phone: string; balance: number } | null>(null);
  const [useBalance, setUseBalance] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const result = await orderApi.getCurrentOrder(orderId) as Record<string, unknown>;
        const member = (result as any)?.memberInfo || (result as any)?.member_info;
        if (member) {
          setMemberInfo({
            name: member.name || '',
            phone: member.phone || '',
            balance: Number(member.balance) || 0,
          });
        }
      } catch { /* ignore */ }
    };
    fetchMember();
  }, [orderId]);

  const balanceDeduct = useMemo(() => {
    if (!useBalance || !memberInfo) return 0;
    return Math.min(memberInfo.balance, amount);
  }, [useBalance, memberInfo, amount]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, amount - balanceDeduct);
  }, [amount, balanceDeduct]);

  const handlePay = async () => {
    setStatus('paying');
    setError('');
    try {
      const paySteps: Promise<Record<string, unknown>>[] = [];
      
      if (balanceDeduct > 0) {
        paySteps.push(orderApi.prepayAssistant({
          order_id: orderId, assistant_id: assistantId,
          buyout_hours: buyoutHours, pay_channel: 'member_balance', auto_start: true,
        }));
      }

      if (remainingAmount > 0) {
        if (channel === 'cash') {
          if (parseFloat(cashAmount) < remainingAmount) { setError('现金金额不足'); setStatus('idle'); return; }
          paySteps.push(orderApi.prepayAssistant({
            order_id: orderId, assistant_id: assistantId,
            buyout_hours: buyoutHours, pay_channel: 'cash', auto_start: true,
          }));
        } else if (channel === 'wechat_micropay') {
          if (!micropayCode.trim()) { setError('请输入付款码'); setStatus('idle'); return; }
          paySteps.push(orderApi.prepayAssistant({
            order_id: orderId, assistant_id: assistantId,
            buyout_hours: buyoutHours, pay_channel: 'wechat_micropay', auto_start: true,
            auth_code: micropayCode.trim(),
          }));
        }
      }

      if (paySteps.length === 0) {
        setStatus('paid');
        setTimeout(onPaid, 800);
        return;
      }

      const results = await Promise.all(paySteps);
      // API 返回的 data 已被 client.ts 剥离 code 包装，直接判断有结果即为成功
      const allSuccess = results.length > 0 && results.every(res => res && !(res as any).error);

      if (allSuccess) {
        setStatus('paid');
        setTimeout(onPaid, 800);
      } else {
        setError('支付失败');
        setStatus('idle');
      }
    } catch (e: any) { 
      setError(e?.message || '支付异常'); 
      setStatus('idle'); 
    }
  };

  return (
    <ModalShell onClose={onClose} title="确认支付" icon={<CreditCard className="w-5 h-5" />}
      footer={status !== 'paid' && status !== 'failed' ? (
        <>
          <button onClick={onClose} className="h-12 px-5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium">取消</button>
          <button onClick={handlePay} disabled={status === 'paying'}
            className="h-12 px-7 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {status === 'paying' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />处理中...</span> : `确认支付 ¥${amount}`}
          </button>
        </>
      ) : undefined}
    >
      {status === 'paid' ? (
        <div className="text-center py-12 space-y-4">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-emerald-700">支付成功</h3>
          <p className="text-sm text-slate-500">{assistantName} · {buyoutHours}小时 · ¥{amount.toFixed(2)}</p>
        </div>
      ) : status === 'failed' ? (
        <div className="text-center py-12 space-y-4">
          <XCircle className="w-20 h-20 text-red-400 mx-auto" />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={() => { setStatus('idle'); setError(''); }} className="px-6 py-3 bg-slate-100 rounded-lg text-sm font-medium">重试</button>
        </div>
      ) : (
        <div className="space-y-5 max-w-md mx-auto">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg p-6 border border-emerald-200">
            <p className="text-xs text-slate-500 text-center mb-2">{assistantName} · 买断 {buyoutHours} 小时</p>
            <div className="text-center">
              <span className="text-sm text-slate-500">应付金额</span>
              <p className="text-4xl font-bold text-emerald-600 mt-1">¥{amount.toFixed(0)}</p>
            </div>
          </div>

          {memberInfo && (
            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <User className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-indigo-700">{memberInfo.name}</p>
                    <p className="text-xs text-indigo-500">{memberInfo.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-indigo-600">余额扣款</span>
                  <button onClick={() => setUseBalance(!useBalance)} className="p-1">
                    {useBalance ? <ToggleRight className="w-8 h-8 text-emerald-500" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <span className="text-xs text-indigo-500">可用余额</span>
                <p className={`text-lg font-bold ${memberInfo.balance >= amount ? 'text-emerald-600' : 'text-red-500'}`}>
                  ¥{memberInfo.balance.toFixed(2)}
                </p>
              </div>
              {useBalance && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-indigo-600">余额抵扣</span>
                  <span className="font-bold text-indigo-700">-¥{balanceDeduct.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {remainingAmount > 0 && (
            <>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
                <p className="text-sm text-amber-700">
                  差额支付: <span className="text-2xl font-bold">¥{remainingAmount.toFixed(0)}</span>
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-700 mb-3 text-center">支付方式</p>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => { setChannel('wechat_micropay'); setError(''); }}
                    className={`p-4 rounded-lg border-2 text-center transition-all shadow-sm hover:shadow-md ${channel === 'wechat_micropay' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}>
                    <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${channel === 'wechat_micropay' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">微信支付</span>
                  </button>
                  <button onClick={() => { setChannel('cash'); setError(''); }}
                    className={`p-4 rounded-lg border-2 text-center transition-all shadow-sm hover:shadow-md ${channel === 'cash' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300 bg-white'}`}>
                    <div className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${channel === 'cash' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">现金支付</span>
                  </button>
                </div>
              </div>

              {channel === 'cash' && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">收款金额</p>
                  <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg text-lg font-bold bg-white focus:border-amber-500 outline-none" placeholder={`应收 ¥${remainingAmount}`} />
                  {parseFloat(cashAmount) >= remainingAmount && <p className="text-xs text-emerald-600 mt-1.5">找零: ¥{(parseFloat(cashAmount) - remainingAmount).toFixed(2)}</p>}
                </div>
              )}

              {channel === 'wechat_micropay' && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">输入付款码</p>
                  <input value={micropayCode} onChange={(e) => setMicropayCode(e.target.value)}
                    placeholder="扫描或输入18位付款码" className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg font-mono text-base bg-white focus:border-emerald-500 outline-none" maxLength={18} />
                </div>
              )}
            </>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
        </div>
      )}
    </ModalShell>
  );
}