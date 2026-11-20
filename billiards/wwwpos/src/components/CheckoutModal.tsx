'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { paymentApi, orderApi, settingApi, memberApi } from '@/lib/api/pos';

import type { Table, PaymentMethod, Member } from '@/types';
import { X, Banknote, User, ScanLine, CreditCard, ChevronRight } from 'lucide-react';
import { extractReceiptData, printReceipt } from '@/utils/printer';

interface CheckoutModalProps { table: Table; onClose: () => void; onComplete: () => void; }
interface PaymentSplit { method: PaymentMethod; amount: number; label: string; }

export function CheckoutModal({ table, onClose, onComplete }: CheckoutModalProps) {
  const { state, findMember, closeTable } = useApp();
  const storeName = (state as any).currentStore?.name || '';
  const cashier = state.currentOperator?.name || '';
  const storeId = (state as any).currentStore?.id || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('userInfo') || '{}')?.storeId || '' : '');
  const [billData, setBillData] = useState<Record<string, unknown> | null>(null);
  const [billLoading, setBillLoading] = useState(true);
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);
  const [barcodeCode, setBarcodeCode] = useState('');
  const [wechatProcessing, setWechatProcessing] = useState(false);
  const [wechatResult, setWechatResult] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberPhone, setMemberPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useBalance, setUseBalance] = useState(true);
  const [useRounding, setUseRounding] = useState(true);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const [discountList, setDiscountList] = useState<any[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState('');
  const [customDiscountValue, setCustomDiscountValue] = useState('');
  const [paymentChannel, setPaymentChannel] = useState('wechat');

  useEffect(() => {
    if (!table || table.status !== 'occupied') { setBillLoading(false); return; }
    let m = true; setBillLoading(true);
    orderApi.getCurrentOrder(table.id).then(r => {
      if (m) { setBillData(r as any); setBillLockedAt((r as any)?.billLockedAt || (r as any)?.bill_locked_at || ''); setCountdown(60); }
    }).catch(() => {}).finally(() => { if (m) setBillLoading(false); });
    return () => { m = false; };
  }, [table]);

  // 60秒倒计时 — 超时自动重载账单
  const [billLockedAt, setBillLockedAt] = useState('');
  const [countdown, setCountdown] = useState(60);
  useEffect(() => {
    if (!billLockedAt || countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { orderApi.getCurrentOrder(table.id).then(r => { setBillData(r as any); setBillLockedAt((r as any)?.billLockedAt || ''); setCountdown(60); }).catch(() => {}); return 60; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [billLockedAt, countdown, table]);

  useEffect(() => {
    let m = true;
    const loadDiscounts = async () => {
      try {
        const data = await settingApi.getDiscountList();
        if (m) setDiscountList(data || []);
      } catch (e) { console.warn('[Checkout] 折扣加载失败:', e); }
    };
    loadDiscounts();
    return () => { m = false; };
  }, []);

  const b = billData || {};
  const tableFee = (b.tableFee as number) || (b.table_fee as number) || 0;
  const productFee = (b.productFee as number) || (b.product_fee as number) || 0;
  const assistantFee = (b.assistantFee as number) || (b.assistant_fee as number) || 0;
  const chargingFee = (b.chargingFee as number) || (b.charging_fee as number) || 0;
  const mergeFee = (b.mergeFee as number) || (b.merge_fee as number) || 0;
  const duration = (b.durationMinutes as number) || (b.duration_minutes as number) || 0;
  const startTime = (b.startTime as string) || (b.start_time as string) || '';
  const memberInfo = (b.memberInfo as any) || (b.member_info as any) || null;
  const items = (b.items as any[]) || [];
  const total = tableFee + productFee + assistantFee + chargingFee + mergeFee;
  const totalAmount = (b.total_amount as number) ?? (b.totalAmount as number) ?? total;
  const paidAmount = (b.paid_amount as number) ?? (b.paidAmount as number) ?? 0;
  const payableAmount = (b.payable_amount as number) ?? (b.payableAmount as number) ?? total;
  const totalPaid = useMemo(() => paymentSplits.reduce((s, x) => s + x.amount, 0), [paymentSplits]);
  const remaining = Math.max(0, total - totalPaid);
  const fmt = (n: number) => n.toFixed(2);
  const durStr = duration ? `${Math.floor(duration / 60)}小时${duration % 60}分` : '';

  const activeDiscount = useMemo(
    () => discountList.find((d: any) => d.id === selectedDiscountId),
    [discountList, selectedDiscountId]
  );
  const discountAmount = useMemo(() => {
    if (selectedDiscountId === '__custom__') {
      const val = parseFloat(customDiscountValue);
      if (isNaN(val)) return 0;
      return val > 1 ? Math.round(total * (100 - val)) / 100 : val;
    }
    if (!activeDiscount) return 0;
    if (activeDiscount.discount_type === 'rate') {
      return Math.round(total * (100 - activeDiscount.discount_value)) / 100;
    }
    return Math.min(Number(activeDiscount.discount_value), total);
  }, [selectedDiscountId, customDiscountValue, activeDiscount, total]);

  const roundingMode = activeDiscount?.rounding_mode || 'yuan';
  const roundingAmount = useMemo(() => {
    if (!useRounding || roundingMode === 'none') return 0;
    const afterDiscount = total - discountAmount;
    let rounded: number;
    switch (roundingMode) {
      case 'yuan': rounded = Math.floor(afterDiscount); break;
      case 'jiao': rounded = Math.floor(afterDiscount * 10) / 10; break;
      case 'half_yuan': rounded = Math.round(afterDiscount * 2) / 2; break;
      default: return 0;
    }
    return Math.round((afterDiscount - rounded) * 100) / 100;
  }, [useRounding, total, discountAmount, roundingMode]);

  const finalAmount = payableAmount - discountAmount - roundingAmount;
  const memberBalance = (selectedMember?.balance as number) || (memberInfo?.balance as number) || 0;
  const balanceDeduction = useBalance ? Math.min(memberBalance, finalAmount) : 0;
  const remainingAfterBalance = Math.max(0, finalAmount - balanceDeduction);

  useEffect(() => {
    const v = parseFloat(cashReceived) || 0;
    setChange(v >= remainingAfterBalance ? v - remainingAfterBalance : 0);
  }, [cashReceived, remainingAfterBalance]);

  const addPayment = (method: PaymentMethod, label: string, amount?: number) => {
    if (paymentSplits.find(s => s.method === method)) return;
    const amt = amount ?? remaining;
    if (amt <= 0) return;
    setPaymentSplits(prev => [...prev, { method, amount: amt, label }]);
    if (method === 'cash') setCashReceived('');
  };

  const handleWechat = async () => {
    const orderId = (billData?.id as string) || table.currentSession?.orderId || '';
    if (!barcodeCode || !orderId) {
      setWechatResult('缺少付款码或订单ID');
      return;
    }
    setWechatProcessing(true); setWechatResult(null);
    try {
      const prep = await paymentApi.prepare(orderId) as any;
      if (!prep?.token) {
        setWechatResult('准备支付失败: ' + (prep?.msg || '无token'));
        return;
      }
      const result = await paymentApi.micropay({ order_id: orderId, auth_code: barcodeCode, token: prep.token }) as any;
      if (result?.success) {
        setWechatResult('success');
        addPayment('wechat', '微信支付', Number(prep.amount) || remaining);
        setBarcodeCode('');
        // 走完整结账流程（折扣/抹零/会员余额/checkout API）
        setTimeout(() => handleCheckout('wechat'), 500);
      } else setWechatResult(result?.msg || result?.message || '支付失败');
    } catch (e: any) {
      setWechatResult(e?.msg || e?.message || '支付异常');
    }
    finally { setWechatProcessing(false); }
  };

  const doPrint = (method: string) => {
    if (!billData) return;
    try {
      const receipt = extractReceiptData(billData as Record<string, unknown>, table.name, storeName, cashier, method);
      receipt.total = total;
      printReceipt(receipt);
    } catch (err) {
      console.error('[Checkout] 打印小票失败:', err);
    }
  };

  const handleCheckout = async (channel: string) => {
    if (isProcessing || finalAmount < 0) return;
    const oid = (billData?.id as string) || table.currentSession?.orderId || '';
    if (!oid) return;
    setIsProcessing(true);
    try {
      const payAmount = channel === 'cash' ? (parseFloat(cashReceived) || remainingAfterBalance) : remainingAfterBalance;
      const discountType = selectedDiscountId === '__custom__'
        ? (parseFloat(customDiscountValue) > 1 ? 'rate' : 'amount')
        : activeDiscount?.discount_type || null;
      const discountValue = selectedDiscountId === '__custom__'
        ? parseFloat(customDiscountValue)
        : activeDiscount?.discount_value ?? null;

      await orderApi.checkout(oid, {
        order_id: oid,
        cash_paid: channel === 'cash' ? payAmount : 0,
        wechat_paid: channel === 'wechat' ? payAmount : 0,
        alipay_paid: 0,
        balance_paid: balanceDeduction,
        card_paid: 0,
        discount: discountAmount,
        discount_type: discountType,
        discount_value: discountValue,
        rounding_mode: useRounding ? roundingMode : 'none',
        rounding_amount: roundingAmount,
        pay_type: channel,
        pay_amount: payAmount + balanceDeduction,
        channel,
        remark: '',
        bill_locked_at: billLockedAt,
        operator_id: state.currentOperator?.id || '',
        operator_name: state.currentOperator?.name || '',
      } as any);
      closeTable(table.id);
      const labelMap: Record<string, string> = { cash: '现金', wechat: '微信', member_balance: '会员余额' };
      setTimeout(() => doPrint(labelMap[channel] || channel), 500);
      onComplete();
    } catch (e: any) {
      // error handled by toast in API client
    } finally {
      setIsProcessing(false);
    }
  };

  // 加钟 (付费+赠品, 已结束的也可加)
  const handleAddOvertime = async (item: any) => {
    const hoursStr = prompt(`${item.item_name || '助教'} 加钟\n输入小时数 (默认1):`, '1');
    if (!hoursStr) return;
    const hours = parseFloat(hoursStr);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      alert('请输入有效小时数 (1-24)');
      return;
    }
    const isGift = confirm('是否为赠品加钟?\n\n"确定" = 赠品(免费)\n"取消" = 付费加钟');
    try {
      const orderId = (billData?.id as string) || table.currentSession?.orderId || '';
      await orderApi.addGiftHours({
        item_id: item.id,
        gift_hours: isGift ? hours : 0,
        overtime_hours: isGift ? 0 : hours,
        hourly_rate: item.unit_price || item.hourly_rate || 0,
      });
      if (orderId) {
        setBillLoading(true);
        const bill = await orderApi.getBill(orderId);
        if (bill) setBillData(bill);
        setBillLoading(false);
      }
    } catch { alert('加钟失败'); }
  };

  // 赠品加钟 (保留旧接口兼容)
  const handleAddGift = async (itemId: string, hours: number) => {
    try {
      await orderApi.addGiftHours({ item_id: itemId, gift_hours: hours });
      const oid = (billData?.id as string) || table.currentSession?.orderId || '';
      if (oid) {
        setBillLoading(true);
        const bill = await orderApi.getBill(oid);
        if (bill) setBillData(bill);
        setBillLoading(false);
      }
    } catch { alert('加钟失败'); }
  };

  // Per-item assistant pause/resume
  const handleTogglePauseAssistant = async (item: any) => {
    const orderId = (billData?.id as string) || table.currentSession?.orderId || '';
    if (!orderId || !item.id) return;
    try {
      if (item.is_paused) {
        await orderApi.resumeAssistantFee(orderId, item.id);
      } else {
        await orderApi.pauseAssistantFee(orderId, item.id);
      }
      const bill = await orderApi.getBill(orderId);
      if (bill) setBillData(bill);
    } catch { /* ignore */ }
  };

  const handleSearchMember = async () => {
    if (!memberPhone) return;
    try {
      const members = await memberApi.search(memberPhone);
      if (members && members.length > 0) {
        const m = members[0];
        setSelectedMember(m);
        const oid = (billData?.id as string) || table.currentSession?.orderId || '';
        if (oid) {
          await orderApi.bindMember({ order_id: oid, member_id: m.id });
          setBillLoading(true);
          const bill = await orderApi.getBill(oid);
          if (bill) setBillData(bill);
          setBillLoading(false);
        }
      } else {
        alert('未找到会员');
      }
    } catch {
      alert('查找会员失败');
    }
  };

  const getPaymentLabel = () => {
    if (balanceDeduction > 0 && remainingAfterBalance > 0) {
      return `余额 ¥${fmt(balanceDeduction)} + ${paymentChannel === 'cash' ? '现金' : '微信'} ¥${fmt(remainingAfterBalance)}`;
    }
    if (balanceDeduction > 0) {
      return `余额支付 ¥${fmt(finalAmount)}`;
    }
    return `${paymentChannel === 'cash' ? '现金' : '微信'}结算 ¥${fmt(finalAmount)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col" style={{ width: '58vw', height: '90vh' }} onClick={e => e.stopPropagation()}>
        {/* === Header === */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">结账 · {table.name}</h2>
            {durStr && <p className="text-white/80 text-sm mt-0.5">已用 {durStr}</p>}
          </div>
          <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-white/20 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        {/* === Body — 左右分栏 === */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* ===== 左栏：账单 + 会员 ===== */}
          <div className="w-[45%] bg-gray-50 overflow-auto p-5 space-y-4">
            {billLoading ? (
              <div className="flex items-center justify-center h-full text-[#999999] text-lg">加载中...</div>
            ) : (
              <>
                {/* 应收总额 */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#e5e5e5] text-center">
                  <p className="text-sm font-medium text-[#999999] mb-1">应收总额</p>
                  <p className="text-4xl font-extrabold text-[#333333]">¥{fmt(total)}</p>
                  {((b.prepaid_hours as number) || (b.prepaidHours as number) || 0) > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-left">
                      <p className="text-sm font-bold text-amber-700">
                        🎫 {String((b.coupon_package_name as string) || (b.couponPackageName as string) || '套餐')} ¥{(b.coupon_price as number) || (b.couponPrice as number) || 0}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        预付 {String(b.prepaid_hours || b.prepaidHours || 0)}小时 · 剩余 {String(Math.max(0, ((b.remaining_minutes as number) || (b.remainingMinutes as number) || 0)))}分钟
                      </p>
                    </div>
                  )}
                  {paidAmount > 0 && (
                    <div className="mt-3 flex justify-between items-center px-4 py-2 bg-[#07C160]/10 rounded-2xl text-sm">
                      <span className="text-[#07C160]">已付</span>
                      <span className="font-bold text-[#07C160]">-¥{fmt(paidAmount)}</span>
                    </div>
                  )}
                </div>

                {/* 费用明细 */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                  <p className="text-sm font-bold text-[#333333] mb-4">费用明细</p>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-[#999999]">台费</span><span className="text-[#333333] font-medium">¥{fmt(tableFee)}</span></div>
                    {mergeFee > 0 && <div className="flex justify-between"><span className="text-[#999999]">并入台费</span><span className="text-[#333333] font-medium">¥{fmt(mergeFee)}</span></div>}
                    <div className="flex justify-between"><span className="text-[#999999]">商品费</span><span className="text-[#333333] font-medium">¥{fmt(productFee)}</span></div>
                    {assistantFee > 0 && <div className="flex justify-between"><span className="text-[#999999]">助教费</span><span className="text-[#333333] font-medium">¥{fmt(assistantFee)}</span></div>}
                    {chargingFee > 0 && <div className="flex justify-between"><span className="text-[#999999]">充电费</span><span className="text-[#333333] font-medium">¥{fmt(chargingFee)}</span></div>}
                  </div>
                </div>

                {/* 助教服务 */}
                {items.filter((i: any) => (i.item_type === 'assistant' || i.item_type === 'assistant_overtime') && !['cancelled','rejected'].includes(i.status)).length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                    <p className="text-sm font-bold text-[#333333] mb-4">助教服务</p>
                    {items.filter((i: any) => (i.item_type === 'assistant' || i.item_type === 'assistant_overtime') && !['cancelled','rejected'].includes(i.status)).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2.5 text-sm border-b border-[#e5e5e5]/30 last:border-0">
                        <span className="text-[#333333]">{item.item_name || '助教服务'}{item.item_type === 'assistant_overtime' ? ` (加钟${item.quantity || 0}h)` : item.billing_mode === 'flat_rate' ? ' (买断)' : ''}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#999999] text-xs">
                            {item.item_type === 'assistant_overtime' ? `¥${item.price || 0}` : ''}
                            {item.billing_mode === 'flat_rate' && item.item_type !== 'assistant_overtime' ? `${item.quantity || '-'}h` : ''}
                            {item.gift_hours > 0 ? `实${item.actual_hours || '-'}h+赠${item.gift_hours}h` : ''}
                          </span>
                          {item.billing_mode !== 'flat_rate' && item.item_type !== 'assistant_overtime' && (
                            <button onClick={() => handleTogglePauseAssistant(item)}
                              className={`px-2.5 py-1 text-[10px] rounded-xl font-medium ${
                                item.is_paused ? 'bg-[#07C160]/10 text-[#07C160] hover:bg-[#07C160]/20' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              }`}>{item.is_paused ? '▶恢复' : '⏸暂停'}</button>
                          )}
                          {item.item_type !== 'assistant_overtime' && (
                            <button onClick={() => handleAddOvertime(item)}
                              className="px-2.5 py-1 text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-medium">+加钟</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 会员信息 */}
                {memberInfo && !selectedMember && (
                  <div className="bg-gray-50 rounded-3xl p-5 border border-[#e5e5e5]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#07C160]/10 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-[#07C160]" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#333333]">{memberInfo.name || ''}</p>
                        <p className="text-xs text-[#999999]">余额 ¥{(memberInfo.balance as number) || 0}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 会员余额扣款 */}
            {(memberInfo || selectedMember || billData) && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#07C160]/10 flex items-center justify-center shrink-0">
                      <User className="w-6 h-6 text-[#07C160]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#333333]">会员余额扣款</p>
                      <p className="text-xs text-[#999999]">{selectedMember?.name || memberInfo?.name || '未绑定会员'} · 余额 ¥{fmt(memberBalance)}</p>
                    </div>
                  </div>
                  {memberBalance > 0 && (
                    <button onClick={() => setUseBalance(!useBalance)}
                      className={`w-14 h-8 rounded-full transition-all shrink-0 ${useBalance ? 'bg-[#07C160]' : 'bg-gray-300'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${useBalance ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  )}
                </div>

                {!selectedMember && !memberInfo && (
                  <div className="flex gap-2 mb-3">
                    <input value={memberPhone} onChange={e => setMemberPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearchMember()}
                      placeholder="输入会员手机号" className="flex-1 px-4 py-3 rounded-2xl border-2 border-[#e5e5e5] text-sm outline-none focus:border-[#07C160]" />
                    <button onClick={handleSearchMember} disabled={!memberPhone}
                      className="px-5 py-3 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white text-sm font-bold disabled:opacity-50 hover:opacity-90 transition-colors">查找</button>
                  </div>
                )}

                {useBalance && memberBalance > 0 && (
                  <div className="flex justify-between items-center px-4 py-3 bg-[#07C160]/10 rounded-2xl">
                    <span className="text-sm text-[#07C160] font-medium">抵扣金额</span>
                    <span className="text-xl font-extrabold text-[#07C160]">-¥{fmt(balanceDeduction)}</span>
                  </div>
                )}

                {useBalance && memberBalance > 0 && memberBalance < finalAmount && (
                  <p className="text-xs text-amber-600 mt-3 font-medium">余额不足，剩余 ¥{fmt(remainingAfterBalance)} 需其他方式支付</p>
                )}
              </div>
            )}
          </div>

          {/* ===== 右栏：折扣 · 抹零 · 支付 ===== */}
          <div className="flex-1 overflow-auto p-5 space-y-4">
            {billLoading ? null : (
              <>
                {/* 待支付金额 */}
                <div className="bg-gradient-to-br from-[#07C160]/5 to-[#06AD56]/5 rounded-3xl p-6 border border-[#07C160]/20 text-center">
                  <p className="text-sm font-medium text-[#07C160] mb-1">待支付金额</p>
                  <p className="text-5xl font-extrabold text-[#07C160]">¥{fmt(finalAmount)}</p>
                  {countdown > 0 && (
                    <p className="text-sm text-[#07C160]/80 mt-2">
                      金额锁定 <span className={countdown <= 10 ? 'text-red-500 font-bold' : 'text-amber-500 font-medium'}>{countdown}s</span>
                    </p>
                  )}
                  {(discountAmount > 0 || roundingAmount > 0) && (
                    <div className="mt-4 pt-4 border-t border-[#07C160]/20 space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-[#999999]">应收</span><span className="text-[#333333] font-medium">¥{fmt(total)}</span></div>
                      {discountAmount > 0 && <div className="flex justify-between"><span className="text-red-500">折扣</span><span className="text-red-500 font-medium">-¥{fmt(discountAmount)}</span></div>}
                      {roundingAmount > 0 && <div className="flex justify-between"><span className="text-amber-500">抹零</span><span className="text-amber-500 font-medium">-¥{fmt(roundingAmount)}</span></div>}
                    </div>
                  )}
                </div>

                {/* 折扣优惠 */}
                {discountList.length > 0 && (
                  <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                    <p className="text-sm font-bold text-[#333333] mb-3">折扣优惠</p>
                    <div className="flex flex-wrap gap-2">
                      <button type="button"
                        onClick={() => { setSelectedDiscountId(''); setCustomDiscountValue(''); }}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                          !selectedDiscountId ? 'border-[#333333] bg-[#333333] text-white' : 'border-[#e5e5e5] bg-white text-[#333333] hover:border-gray-300'
                        }`}>无折扣</button>
                      {discountList.filter((d: any) => d.status === 1).map((d: any) => {
                        const label = d.discount_type === 'rate' ? `${d.discount_value}折` : `减¥${d.discount_value}`;
                        return (
                          <button key={d.id} type="button"
                            onClick={() => { setSelectedDiscountId(d.id); setCustomDiscountValue(''); }}
                            className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                              selectedDiscountId === d.id ? 'border-red-400 bg-red-50 text-red-600' : 'border-[#e5e5e5] bg-white text-[#333333] hover:border-red-300'
                            }`}>{d.discount_name} · {label}</button>
                        );
                      })}
                      <button type="button"
                        onClick={() => { setSelectedDiscountId('__custom__'); setCustomDiscountValue(''); }}
                        className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${
                          selectedDiscountId === '__custom__' ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-dashed border-gray-300 bg-white text-[#999999] hover:border-amber-300'
                        }`}>✏️ 自定义</button>
                    </div>
                    {selectedDiscountId === '__custom__' && (
                      <input type="number" value={customDiscountValue}
                        onChange={(e) => setCustomDiscountValue(e.target.value)}
                        placeholder="85 = 8.5折"
                        className="w-full mt-3 px-4 py-3 rounded-2xl border-2 border-amber-300 bg-amber-50 text-amber-700 text-base font-bold placeholder-amber-300 outline-none focus:border-amber-500" />
                    )}
                  </div>
                )}

                {/* 抹零 */}
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center">
                        <ScanLine className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#333333]">抹零</p>
                        <p className="text-sm text-[#999999]">¥{fmt(roundingAmount)}</p>
                      </div>
                    </div>
                    <button onClick={() => setUseRounding(!useRounding)}
                      className={`w-14 h-8 rounded-full transition-all ${useRounding ? 'bg-amber-500' : 'bg-gray-300'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${useRounding ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                {/* 收款方式 */}
                {remainingAfterBalance > 0 && (
                  <>
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-[#e5e5e5]">
                      <p className="text-sm font-bold text-[#333333] mb-3">收款 ¥{fmt(remainingAfterBalance)}</p>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button type="button"
                          onClick={() => setPaymentChannel('cash')}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            paymentChannel === 'cash' ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-[#e5e5e5] bg-white hover:border-gray-300'
                          }`}>
                          <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center ${paymentChannel === 'cash' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-[#999999]'}`}>
                            <Banknote className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-bold ${paymentChannel === 'cash' ? 'text-amber-700' : 'text-[#333333]'}`}>现金</span>
                        </button>
                        <button type="button"
                          onClick={() => setPaymentChannel('wechat')}
                          className={`p-4 rounded-2xl border-2 text-center transition-all ${
                            paymentChannel === 'wechat' ? 'border-[#07C160] bg-[#07C160]/5 shadow-sm' : 'border-[#e5e5e5] bg-white hover:border-gray-300'
                          }`}>
                          <div className={`w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center ${paymentChannel === 'wechat' ? 'bg-[#07C160] text-white' : 'bg-gray-100 text-[#999999]'}`}>
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-bold ${paymentChannel === 'wechat' ? 'text-[#07C160]' : 'text-[#333333]'}`}>微信</span>
                        </button>
                      </div>

                      {paymentChannel === 'cash' && (
                        <div>
                          <input type="number" value={cashReceived || String(remainingAfterBalance)}
                            onChange={e => setCashReceived(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCheckout('cash')}
                            placeholder="实收金额" min={0} step={0.01}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-amber-300 text-[#333333] text-2xl font-extrabold outline-none focus:border-amber-500 bg-amber-50/30" />
                          {(parseFloat(cashReceived || '0') || 0) > remainingAfterBalance && (
                            <p className="text-sm text-amber-600 mt-3 text-center font-medium">找零 ¥{fmt((parseFloat(cashReceived || '0') || 0) - remainingAfterBalance)}</p>
                          )}
                        </div>
                      )}

                      {paymentChannel === 'wechat' && (
                        <div>
                          <input ref={barcodeRef} value={barcodeCode} onChange={e => setBarcodeCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleWechat()}
                            placeholder="扫描或输入18位付款码" autoFocus
                            className="w-full px-4 py-3 rounded-2xl border-2 border-[#07C160]/30 text-[#333333] text-base outline-none focus:border-[#07C160]" />
                          {wechatProcessing && <p className="text-sm text-[#999999] mt-2 text-center">支付处理中...</p>}
                          {wechatResult === 'success' && <p className="text-sm text-[#07C160] mt-2 text-center font-medium">✅ 支付成功 · 结算中...</p>}
                          {wechatResult && wechatResult !== 'success' && <p className="text-sm text-red-500 mt-2 text-center">{wechatResult}</p>}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* === Footer === */}
        <div className="px-5 py-4 border-t border-[#e5e5e5] bg-white flex justify-between items-center shrink-0 gap-4">
          <button onClick={onClose} className="flex-1 h-14 rounded-full bg-white border-2 border-[#07C160] text-[#07C160] font-bold text-base hover:bg-[#07C160]/5 transition-colors">取消</button>
          <button onClick={() => {
            if (balanceDeduction > 0 && remainingAfterBalance <= 0) {
              handleCheckout('member_balance');
            } else {
              handleCheckout(paymentChannel);
            }
          }} disabled={isProcessing || finalAmount < 0}
            className="flex-[2] h-14 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-base transition-all shadow-lg shadow-[#07C160]/30">
            {isProcessing ? '结算中...' : getPaymentLabel()}
          </button>
        </div>
      </div>
    </div>
  );
}