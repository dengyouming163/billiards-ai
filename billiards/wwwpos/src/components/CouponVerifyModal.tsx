'use client';

import React, { useState, useEffect } from 'react';
import { couponApi } from '@/lib/api/coupon';
import { useApp } from '@/context/AppContext';
import { ModalShell } from '@/components/ModalShell';
import type { Table } from '@/types';
import { Package, Clock, DollarSign, CheckCircle, Loader2, Banknote, MessageCircle, Music } from 'lucide-react';

interface CouponVerifyModalProps {
  onClose: () => void;
  onVerified?: (result: Record<string, unknown>) => void;
}

const PAYMENT_METHODS = [
  { key: 'cash', label: '现金', icon: Banknote, color: 'bg-amber-500' },
  { key: 'wechat', label: '微信', icon: MessageCircle, color: 'bg-green-500' },
  { key: 'meituan', label: '美团验券', icon: Package, color: 'bg-red-500' },
  { key: 'douyin', label: '抖音验券', icon: Music, color: 'bg-pink-500' },
];

export function CouponVerifyModal({ onClose, onVerified }: CouponVerifyModalProps) {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'select' | 'pay'>('select');
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [playerCount, setPlayerCount] = useState(2);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [verifyCode, setVerifyCode] = useState('');
  const [cashAmount, setCashAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');

  const { state } = useApp();
  const idleTables = (state.tables || []).filter((t: Table) => t.status === 'idle');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await couponApi.listInternal();
      const list = Array.isArray(data) ? data : (data as any)?.data?.lists || (data as any)?.data || [];
      setPackages(list);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const goToPay = () => {
    if (!selectedPkg || !selectedTableId) return;
    setError('');
    setCashAmount(String(selectedPkg?.price || 0));
    setStep('pay');
  };

  const handleConfirm = async () => {
    if (!selectedPkg || !selectedTableId) return;

    // Cash payment validation
    if (paymentMethod === 'cash' && parseFloat(cashAmount) < parseFloat(selectedPkg?.price || '0')) {
      setError('现金金额不足');
      return;
    }
    // Verify code validation
    if (['meituan', 'douyin'].includes(paymentMethod) && !verifyCode) {
      setError('请输入券码');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (['meituan', 'douyin'].includes(paymentMethod)) setVerifyStatus('verifying');
      const result = await couponApi.payAndOpen({
        package_id: selectedPkg.id,
        table_id: selectedTableId,
        player_count: playerCount,
        payment_method: paymentMethod,
        verify_code: verifyCode || undefined,
        cash_amount: parseFloat(cashAmount) || undefined,
      });
      if (['meituan', 'douyin'].includes(paymentMethod)) setVerifyStatus('success');
      if (paymentMethod === 'wechat') {
        const data = (result as any)?.data;
        if (data?.pay_url) setPayUrl(data.pay_url);
      }
      setDone(result as Record<string, unknown>);
      onVerified?.(result as Record<string, unknown>);
    } catch (e: any) {
      if (['meituan', 'douyin'].includes(paymentMethod)) setVerifyStatus('failed');
      setError(e?.message || '开台失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedPkg(null);
    setSelectedTableId('');
    setPaymentMethod('cash');
    setVerifyCode('');
    setCashAmount('');
    setError('');
    setDone(null);
    setStep('select');
  };

  const couponPrice = parseFloat(selectedPkg?.price || '0');

  return (
    <ModalShell onClose={onClose} title="套餐验券" icon={<Package className="w-5 h-5" />}
      footer={done ? undefined : (
        <div className="flex items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">人数:</span>
            {[2,3,4,5,6].map(n => (
              <button key={n} onClick={() => setPlayerCount(n)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${
                  playerCount === n ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{n}</button>
            ))}
          </div>
          <div className="flex-1" />
          {step === 'select' ? (
            <button onClick={goToPay} disabled={!selectedTableId}
              className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors">
              去支付 · ¥{couponPrice}
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={submitting}
              className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors">
              {submitting ? '处理中...' : '确认支付并开台'}
            </button>
          )}
        </div>
      )}
    >
            {done ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-bold text-emerald-700">开台成功</h3>
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">订单号</span><span className="font-medium">{String(done.order_no || '')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">套餐</span><span className="font-medium">{selectedPkg?.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">时长</span><span className="text-emerald-600 font-medium">{selectedPkg?.duration_hours}小时</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">支付方式</span><span className="font-medium">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">继续验券</button>
                  <button onClick={onClose} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium">完成</button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : packages.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>暂无可用套餐券</p>
                <p className="text-xs mt-1">请先在商家后台创建套餐券</p>
              </div>
            ) : step === 'select' ? (
              <div className="space-y-4">
                {/* Package Selection */}
                <div>
                  <p className="text-sm text-gray-500 mb-2">选择套餐券</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {packages.map((pkg) => (
                      <button
                        key={pkg.id}
                        onClick={() => { setSelectedPkg(pkg); setSelectedTableId(''); setError(''); }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedPkg?.id === pkg.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{pkg.name}</p>
                        <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {pkg.duration_hours}小时</span>
                          <span className="inline-flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> ¥{pkg.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table Selection */}
                {selectedPkg && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">选择空闲台桌</p>
                    {idleTables.length === 0 ? (
                      <p className="text-sm text-amber-600 py-2">暂无可用的空闲台桌</p>
                    ) : (
                      <div className="grid grid-cols-8 gap-2">
                        {idleTables.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTableId(t.id)}
                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all truncate ${
                              selectedTableId === t.id
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {t.name || t.id}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Payment Step */
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{selectedPkg?.name}</span>
                    <span className="font-medium">{selectedPkg?.duration_hours}小时</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold mt-1">
                    <span>应付</span>
                    <span className="text-emerald-600">¥{couponPrice}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">支付方式</p>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => { setPaymentMethod(m.key); setError(''); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          paymentMethod === m.key ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <m.icon className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === m.key ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash payment */}
                {paymentMethod === 'cash' && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">收款金额</p>
                    <input
                      type="number"
                      value={cashAmount}
                      onChange={(e) => setCashAmount(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-lg font-bold"
                      placeholder={`应收 ¥${couponPrice}`}
                    />
                    {parseFloat(cashAmount) >= couponPrice && (
                      <p className="text-sm text-emerald-600 mt-1">找零: ¥{(parseFloat(cashAmount) - couponPrice).toFixed(2)}</p>
                    )}
                  </div>
                )}

                {/* WeChat */}
                {paymentMethod === 'wechat' && (
                  <div className="text-center py-2 space-y-3">
                    {payUrl ? (
                      <>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payUrl)}`}
                          alt="支付二维码" className="w-48 h-48 mx-auto rounded-xl" />
                        <p className="text-sm text-slate-500">请引导客户微信扫码支付 ¥{couponPrice}</p>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">点击确认后生成支付二维码</p>
                    )}
                  </div>
                )}

                {/* Meituan / Douyin verify */}
                {['meituan', 'douyin'].includes(paymentMethod) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {paymentMethod === 'meituan' ? '美团券码(12位数字)' : '抖音券码(DY开头16位)'}
                    </p>
                    <input
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder={paymentMethod === 'meituan' ? '输入12位数字券码' : '输入抖音券码'}
                    />
                    {verifyStatus === 'verifying' && <p className="text-sm text-blue-500 flex items-center gap-1 mt-1"><Loader2 className="w-3 h-3 animate-spin" />验券中...</p>}
                    {verifyStatus === 'success' && <p className="text-sm text-emerald-500 mt-1">✓ 验券成功</p>}
                    {verifyStatus === 'failed' && <p className="text-sm text-red-500 mt-1">✗ 验券失败</p>}
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button onClick={() => setStep('select')} className="text-sm text-gray-400 underline">
                  ← 返回重新选择
                </button>
              </div>
            )}
    </ModalShell>
  );
}
