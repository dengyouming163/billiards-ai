'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import type { Table, PaymentMethod, Member, Order } from '@/types';
import {
  X,
  Banknote,
  QrCode,
  User,
  Ticket,
  Check,
  Minus,
  Plus,
  Sparkles,
  Clock,
  ShoppingBag,
  Percent,
  Receipt,
} from 'lucide-react';

interface CheckoutModalProps {
  table: Table;
  onClose: () => void;
  onComplete: () => void;
}

interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  label: string;
}

export function CheckoutModal({
  table,
  onClose,
  onComplete,
}: CheckoutModalProps) {
  const { state, findMember, closeTable } = useApp();

  // Calculate fees
  const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0 });
  const [tableFee, setTableFee] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [total, setTotal] = useState(0);

  // Payment state
  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[]>([]);
  const [cashReceived, setCashReceived] = useState('');
  const [change, setChange] = useState(0);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Member state
  const [memberPhone, setMemberPhone] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'payment' | 'detail'>('detail');

  // Calculate fees
  useEffect(() => {
    if (!table.currentSession) return;

    const session = table.currentSession;
    const start = new Date(session.startTime).getTime();
    const now = Date.now();
    const totalMinutes = Math.floor((now - start) / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    setElapsedTime({ hours, minutes });

    // Calculate table fee
    const roundedHours = Math.ceil(totalMinutes / 60);
    const fee = roundedHours * table.hourlyRate;
    setTableFee(fee);

    // Get product total from orders
    const tableOrders = state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
    const products = tableOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((s, item) => s + item.subtotal, 0),
      0
    );
    setProductTotal(products);
  }, [table, state.orders]);

  // Calculate total with discount
  useEffect(() => {
    let discountAmount = discount;
    if (discountType === 'percent' && discount > 0) {
      discountAmount = (tableFee + productTotal) * (discount / 100);
    }
    setTotal(tableFee + productTotal - discountAmount - couponDiscount);
  }, [tableFee, productTotal, discount, discountType, couponDiscount]);

  // Update elapsed time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!table.currentSession) return;
      const start = new Date(table.currentSession.startTime).getTime();
      const now = Date.now();
      const totalMinutes = Math.floor((now - start) / 60 / 1000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      setElapsedTime({ hours, minutes });

      const roundedHours = Math.ceil(totalMinutes / 60);
      setTableFee(roundedHours * table.hourlyRate);
    }, 60000);

    return () => clearInterval(interval);
  }, [table]);

  // Calculate total paid
  const totalPaid = useMemo(() => {
    return paymentSplits.reduce((sum, split) => sum + split.amount, 0);
  }, [paymentSplits]);

  // Remaining amount
  const remaining = useMemo(() => {
    return Math.max(0, total - totalPaid);
  }, [total, totalPaid]);

  // Cash change calculation
  useEffect(() => {
    const received = parseFloat(cashReceived) || 0;
    if (received >= remaining) {
      setChange(received - remaining);
    } else {
      setChange(0);
    }
  }, [cashReceived, remaining]);

  // Search member
  const handleSearchMember = () => {
    if (!memberPhone) return;
    const member = findMember(memberPhone);
    if (member) {
      setSelectedMember(member);
    }
  };

  // Add payment
  const addPayment = (method: PaymentMethod, label: string) => {
    const amount = method === 'cash' ? remaining + (parseFloat(cashReceived) || 0) : remaining;
    if (amount <= 0) return;

    setPaymentSplits((prev) => {
      const existing = prev.find((s) => s.method === method);
      if (existing) {
        return prev.map((s) =>
          s.method === method ? { ...s, amount } : s
        );
      }
      return [...prev, { method, amount, label }];
    });

    if (method === 'cash') {
      setCashReceived('');
    }
  };

  // Remove payment
  const removePayment = (method: PaymentMethod) => {
    setPaymentSplits((prev) => prev.filter((s) => s.method !== method));
    if (method === 'cash') {
      setCashReceived('');
    }
  };

  // Apply discount
  const applyDiscount = () => {
    if (discount <= 0) return;
  };

  // Apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode) return;
    // Simulate coupon validation
    setCouponDiscount(20);
  };

  // Complete payment
  const handleComplete = async () => {
    if (remaining > 0 || totalPaid < total) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Close table
    closeTable(table.id);

    setIsProcessing(false);
    onComplete();
  };

  // Get table orders
  const tableOrders = useMemo(() => {
    return state.orders.filter(
      (o) => o.tableId === table.id && o.status !== 'cancelled'
    );
  }, [state.orders, table.id]);

  // Payment methods config
  const paymentMethods = [
    { method: 'cash' as PaymentMethod, label: '现金', color: 'var(--color-cash)' },
    { method: 'wechat' as PaymentMethod, label: '微信', color: 'var(--color-wechat)' },
    { method: 'alipay' as PaymentMethod, label: '支付宝', color: 'var(--color-alipay)' },
    { method: 'member' as PaymentMethod, label: '会员', color: 'var(--color-accent)' },
    { method: 'meituan' as PaymentMethod, label: '美团券', color: 'var(--color-status-inuse)' },
    { method: 'douyin' as PaymentMethod, label: '抖音券', color: 'var(--color-status-vip)' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[1000px] max-h-[calc(100vh-2rem)] flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                结账收银 - {table.name}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {elapsedTime.hours > 0 && `${elapsedTime.hours}小时`}
                {elapsedTime.minutes}分钟 | {table.currentSession?.customerCount || 0}人
                {selectedMember && ` | 会员: ${selectedMember.name}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-emerald-500/20">
              <span className="text-2xl font-bold money text-emerald-400">
                ¥{total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border-subtle)]">
          <button
            onClick={() => setActiveTab('detail')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'detail'
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <Receipt className="w-4 h-4 inline mr-2" />
            费用明细
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'payment'
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <Banknote className="w-4 h-4 inline mr-2" />
            收款找零
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Details */}
          <div className="flex-1 p-6 overflow-auto">
            {activeTab === 'detail' ? (
              <>
                {/* Fee breakdown */}
                <div className="card p-5 mb-4">
                  <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">费用明细</h3>

                  {/* Table fee */}
                  <div className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">台球桌费</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          ¥{table.hourlyRate}/小时 × {elapsedTime.hours > 0 ? `${elapsedTime.hours}小时` : ''}{elapsedTime.minutes}分钟
                        </p>
                      </div>
                    </div>
                    <span className="money text-xl font-bold text-emerald-400">¥{tableFee.toFixed(2)}</span>
                  </div>

                  {/* Product fee */}
                  {productTotal > 0 && (
                    <div className="flex justify-between items-center py-3 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-[var(--color-text-primary)]">商品消费</p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {tableOrders.reduce((sum, o) => sum + o.items.length, 0)} 件商品
                          </p>
                        </div>
                      </div>
                      <span className="money text-xl font-bold text-amber-400">¥{productTotal.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Discount */}
                  {(discount > 0 || couponDiscount > 0) && (
                    <div className="flex justify-between items-center py-3 border-t border-[var(--color-border-subtle)] text-rose-400">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">优惠抵扣</p>
                          <p className="text-sm opacity-70">
                            {discount > 0 && (discountType === 'percent' ? `${discount}%` : `¥${discount}`)}
                            {discount > 0 && couponDiscount > 0 && ' + '}
                            {couponDiscount > 0 && `券码抵扣`}
                          </p>
                        </div>
                      </div>
                      <span className="money text-xl font-bold">-¥{(discount + couponDiscount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Discount */}
                <div className="card p-5 mb-4">
                  <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">整单折扣</h3>
                  <div className="flex gap-3">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                      className="px-4 py-2 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
                    >
                      <option value="percent">百分比</option>
                      <option value="amount">固定金额</option>
                    </select>
                    <input
                      type="number"
                      value={discount || ''}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      placeholder={discountType === 'percent' ? '折扣率' : '金额'}
                      className="input flex-1"
                    />
                    <Button onClick={applyDiscount} className="btn-primary">
                      应用
                    </Button>
                  </div>
                </div>

                {/* Coupon */}
                <div className="card p-5 mb-4">
                  <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">优惠券核销</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="输入券码..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="input flex-1"
                    />
                    <Button onClick={handleApplyCoupon} className="btn-secondary">
                      验证
                    </Button>
                  </div>
                  {couponDiscount > 0 && (
                    <p className="mt-3 text-sm text-emerald-400 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      优惠券已验证，抵扣 ¥{couponDiscount}
                    </p>
                  )}
                </div>

                {/* Member */}
                <div className="card p-5 mb-4">
                  <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">会员识别</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="输入手机号..."
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      className="input flex-1"
                    />
                    <Button onClick={handleSearchMember} className="btn-primary">
                      查询
                    </Button>
                  </div>
                  {selectedMember && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-emerald-400">{selectedMember.name}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">
                            {selectedMember.level === 'diamond' ? '钻石会员' :
                             selectedMember.level === 'gold' ? '黄金会员' :
                             selectedMember.level === 'silver' ? '白银会员' : '普通会员'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold money text-emerald-400">¥{selectedMember.balance}</p>
                          <p className="text-sm text-[var(--color-text-muted)]">{selectedMember.points} 积分</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Order items */}
                {tableOrders.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">商品清单</h3>
                    <div className="space-y-2">
                      {tableOrders.flatMap((order) =>
                        order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center py-2 border-b border-[var(--color-border-subtle)] last:border-0"
                          >
                            <div>
                              <p className="text-[var(--color-text-primary)]">{item.productName}</p>
                              <p className="text-sm text-[var(--color-text-muted)]">
                                ¥{item.unitPrice} × {item.quantity}
                              </p>
                            </div>
                            <span className="money font-medium">¥{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Payment methods */}
                <div className="card p-5 mb-4">
                  <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">选择支付方式</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map(({ method, label, color }) => {
                      const isSelected = paymentSplits.some((s) => s.method === method);
                      return (
                        <button
                          key={method}
                          onClick={() => !isSelected && addPayment(method, label)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/20'
                              : 'border-[var(--color-border-subtle)] hover:border-[var(--color-accent)] bg-[var(--color-bg-primary)]'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <QrCode className="w-8 h-8" style={{ color: isSelected ? '#10b981' : color }} />
                            <span className="font-medium text-[var(--color-text-primary)]">{label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash input */}
                {paymentSplits.some((s) => s.method === 'cash') && (
                  <div className="card p-5 mb-4">
                    <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">现金收款</h3>
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-[var(--color-text-muted)]">¥</span>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="input pl-10 text-2xl money"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      {[50, 100, 200, 500].map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setCashReceived(amount.toString())}
                          className="flex-1 py-2 rounded-xl bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-elevated)] transition-colors font-medium"
                        >
                          ¥{amount}
                        </button>
                      ))}
                    </div>
                    {change > 0 && (
                      <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 flex justify-between items-center">
                        <span className="text-emerald-400">找零金额</span>
                        <span className="text-2xl font-bold money text-emerald-400">¥{change.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment summary */}
                {paymentSplits.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-semibold mb-4 text-[var(--color-text-primary)]">支付明细</h3>
                    <div className="space-y-2 mb-4">
                      {paymentSplits.map((split) => (
                        <div
                          key={split.method}
                          className="flex justify-between items-center py-2"
                        >
                          <span className="text-[var(--color-text-primary)]">{split.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="money font-medium">¥{split.amount.toFixed(2)}</span>
                            <button
                              onClick={() => removePayment(split.method)}
                              className="p-1 text-rose-400 hover:text-rose-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right - Summary */}
          <div className="w-80 border-l border-[var(--color-border-subtle)] p-6 flex flex-col bg-[var(--color-bg-primary)]">
            <h3 className="font-semibold mb-6 text-[var(--color-text-primary)]">收银汇总</h3>

            {/* Summary items */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">台球桌费</span>
                <span className="money font-medium">¥{tableFee.toFixed(2)}</span>
              </div>
              {productTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">商品消费</span>
                  <span className="money font-medium">¥{productTotal.toFixed(2)}</span>
                </div>
              )}
              {(discount + couponDiscount) > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>优惠抵扣</span>
                  <span className="money font-medium">-¥{(discount + couponDiscount).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-[var(--color-border-subtle)] mb-4" />

            {/* Total */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-lg font-semibold text-[var(--color-text-primary)]">应收金额</span>
              <span className="text-3xl font-bold money text-[var(--color-accent)]">
                ¥{total.toFixed(2)}
              </span>
            </div>

            {/* Payment status */}
            {paymentSplits.length > 0 && (
              <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[var(--color-text-muted)]">已收</span>
                  <span className="money text-emerald-400">¥{totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">待收</span>
                  <span className={`money font-bold ${remaining > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ¥{remaining.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Complete button */}
            <Button
              onClick={handleComplete}
              disabled={remaining > 0 || isProcessing}
              className="w-full btn-primary h-14 text-lg font-semibold mt-auto"
            >
              {isProcessing ? (
                '处理中...'
              ) : remaining > 0 ? (
                '请选择支付方式'
              ) : (
                <>
                  <Check className="w-6 h-6" />
                  确认收款 ¥{total.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
