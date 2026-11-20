'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ModalShell } from '@/components/ModalShell';
import { productApi, orderApi, paymentApi } from '@/lib/api/pos';
import { ShoppingCart, Plus, Minus, Search, Trash2, CheckCircle } from 'lucide-react';

interface CartItem { productId: string; productName: string; price: number; quantity: number; unit: string; }
interface QuickOrderModalProps { onClose: () => void; onSuccess?: () => void; }

export function QuickOrderModal({ onClose, onSuccess }: QuickOrderModalProps) {
  const [products, setProducts] = useState<Record<string, unknown>[]>([]);
  const [categories, setCategories] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]); const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [step, setStep] = useState<'cart' | 'pay' | 'done'>('cart');
  const [createdOrder, setCreatedOrder] = useState<Record<string, unknown> | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wechat'>('cash');
  const [cashReceived, setCashReceived] = useState(''); const [paying, setPaying] = useState(false);
  const [barcodeCode, setBarcodeCode] = useState(''); const [wechatPaying, setWechatPaying] = useState(false);
  const [wechatError, setWechatError] = useState(''); const barcodeRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try { const [pr, cr] = await Promise.all([productApi.all(), productApi.categories()]); setProducts(pr as any || []); setCategories(cr as any || []); }
    catch { setProducts([]); setCategories([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  const categoryList = useMemo(() => [{ id: 'all', name: '全部' }, ...categories.map(c => ({ id: c.id as string, name: c.name as string }))], [categories]);
  const filteredProducts = useMemo(() => products.filter(p => {
    const catMatch = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const name = (p.name as string) || ''; return catMatch && (searchQuery === '' || name.toLowerCase().includes(searchQuery.toLowerCase()));
  }), [products, selectedCategory, searchQuery]);

  const handleAddToCart = (product: Record<string, unknown>) => {
    setCart(prev => { const existing = prev.find(i => i.productId === (product.id as string)); if (existing) return prev.map(i => i.productId === (product.id as string) ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { productId: product.id as string, productName: product.name as string, price: parseFloat(String(product.price)) || 0, quantity: 1, unit: (product.unit as string) || '份' }]; });
  };
  const handleRemoveFromCart = (productId: string) => { setCart(prev => prev.filter(i => i.productId !== productId)); };
  const handleUpdateQuantity = (productId: string, delta: number) => { setCart(prev => prev.map(i => { if (i.productId !== productId) return i; const q = i.quantity + delta; return q > 0 ? { ...i, quantity: q } : null; }).filter(Boolean) as CartItem[]); };
  const cartTotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handleSubmit = async () => {
    if (cart.length === 0 || submitting) return; setSubmitting(true);
    try { const items = cart.map(i => ({ product_id: i.productId, quantity: i.quantity })); const result = await orderApi.quickOrder({ items }) as Record<string, unknown>; setCreatedOrder(result); setCart([]); setStep('pay'); onSuccess?.(); } catch (e: any) { alert(e?.message || '下单失败，请重试'); } finally { setSubmitting(false); }
  };

  const handleCashPay = async () => {
    if (!createdOrder || paying) return; const oid = createdOrder.orderId as string; const amount = (createdOrder.totalAmount as number) || 0;
    // auto-fill cash received to total amount
    if (!cashReceived) setCashReceived(String(amount));
    setPaying(true);
    const paidAmount = parseFloat(cashReceived || String(amount)) || amount;
    try { await orderApi.checkout(oid, { order_id: oid, cash_paid: paidAmount, wechat_paid: 0, alipay_paid: 0, balance_paid: 0, card_paid: 0, discount: 0, pay_type: 'cash', pay_amount: paidAmount, remark: '快购点单' }); setCreatedOrder(prev => ({ ...prev, change: Math.max(0, paidAmount - amount), paymentMethod: 'cash' })); setStep('done'); } catch (e: any) { alert(e?.message || '收款失败，请重试'); } finally { setPaying(false); }
  };

  const handleWechatPay = async () => {
    if (!createdOrder || !barcodeCode || wechatPaying) return; setWechatPaying(true); setWechatError('');
    try { const oid = createdOrder.orderId as string; const prep = await paymentApi.prepare(oid) as Record<string, unknown>; const token = prep.token as string; if (!token) { setWechatError('获取支付令牌失败'); setWechatPaying(false); return; } const result = await paymentApi.micropay({ order_id: oid, auth_code: barcodeCode, token }) as Record<string, unknown>; if (result.success) { setCreatedOrder(prev => ({ ...prev, paymentMethod: 'wechat' })); setStep('done'); } else setWechatError((result.error_msg as string) || (result.msg as string) || '支付失败，请重新扫码'); } catch (e: any) { setWechatError(e?.message || '支付异常'); } finally { setWechatPaying(false); }
  };

  const amount = (createdOrder?.totalAmount as number) || 0;
  const cashNum = parseFloat(cashReceived || '0');
  const change = paymentMethod === 'cash' ? Math.max(0, cashNum - amount) : 0;

  if (step === 'done' && createdOrder) {
    const chg = (createdOrder.change as number) || 0;
    const method = (createdOrder.paymentMethod as string) === 'wechat' ? '微信' : '现金';
    return (
      <ModalShell onClose={onClose} title="收款完成" icon={<CheckCircle className="w-5 h-5" />}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"><CheckCircle className="w-10 h-10 text-emerald-500" /></div>
          <p className="text-2xl font-bold mb-2">{method}收款 ¥{amount.toFixed(2)}</p>
          {chg > 0 && <p className="text-sm text-amber-600 mb-1">找零 ¥{chg.toFixed(2)}</p>}
          <p className="text-sm text-gray-500 mb-6">{createdOrder.orderNo as string}</p>
          <div className="flex gap-3 w-full max-w-sm">
            <button onClick={() => { setCreatedOrder(null); setStep('cart'); setCashReceived(''); loadData(); }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium">继续点单</button>
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold">完成</button>
          </div>
        </div>
      </ModalShell>
    );
  }

  if (step === 'pay' && createdOrder) {
    const cashChange = paymentMethod === 'cash' ? Math.max(0, cashNum - amount) : 0;
    return (
      <ModalShell onClose={onClose} title="收款" icon={<ShoppingCart className="w-5 h-5" />}>
        <div className="flex flex-col items-center py-4 space-y-6">
          <div className="text-center"><p className="text-sm text-gray-500 mb-1">{createdOrder.orderNo as string}</p><p className="text-4xl font-bold text-emerald-600">¥{amount.toFixed(2)}</p></div>
          <div className="flex gap-4 w-full justify-center">
            {(['cash', 'wechat'] as const).map(m => (
              <button key={m} onClick={() => { setPaymentMethod(m); if (m === 'cash') setCashReceived(String(amount)); }}
                className={`w-28 h-28 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
                  paymentMethod === m ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                {m === 'cash' ? <><span className="text-3xl">💵</span><span className="text-sm font-medium">现金</span></> : <><img src="/wxpay.png" alt="微信" className="w-10 h-10" /><span className="text-sm font-medium">微信</span></>}
              </button>
            ))}
          </div>
          {paymentMethod === 'cash' && (<div className="w-full text-center"><p className="text-sm text-gray-500 mb-1">收款金额（可修改）</p><input type="number" value={cashReceived || String(amount)} onChange={e => setCashReceived(e.target.value)} className="w-48 text-center px-4 py-3 rounded-xl border border-gray-200 text-xl font-bold outline-none focus:border-emerald-500" />{parseFloat(cashReceived || '0') > amount && <p className="text-sm text-amber-600 mt-2">找零: ¥{Math.max(0, parseFloat(cashReceived || '0') - amount).toFixed(2)}</p>}</div>)}
          {paymentMethod === 'wechat' && (<div className="w-full"><label className="text-xs text-gray-500 mb-1 block">扫码枪扫描顾客付款码</label><input ref={barcodeRef} type="text" value={barcodeCode} onChange={e => { setBarcodeCode(e.target.value); setWechatError(''); }} onKeyDown={e => e.key === 'Enter' && handleWechatPay()} placeholder="扫描或输入付款码数字" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-lg outline-none focus:border-emerald-500 font-mono tracking-wide" autoFocus />{wechatError && <p className="text-sm text-red-500 mt-2">{wechatError}</p>}</div>)}
        </div>
        <div className="flex gap-3 pt-2 border-t border-gray-100 mt-auto">
          <button onClick={() => { setStep('cart'); setCreatedOrder(null); setBarcodeCode(''); setWechatError(''); }} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium">返回</button>
          <button onClick={paymentMethod === 'cash' ? handleCashPay : handleWechatPay} disabled={paying || wechatPaying || (paymentMethod === 'wechat' && !barcodeCode)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold disabled:opacity-50">{paying || wechatPaying ? '处理中...' : `确认收款 ¥${amount.toFixed(2)}`}</button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title="点单" icon={<ShoppingCart className="w-5 h-5" />}>
      {loading ? (<div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>) : (<>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" placeholder="搜索商品..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm outline-none focus:border-emerald-500" /></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categoryList.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat.id ? 'bg-emerald-500 text-white' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-emerald-300'}`}>{cat.name}</button>))}
        </div>
        <div className="flex-1 overflow-auto">
          {filteredProducts.length === 0 ? (<div className="flex flex-col items-center justify-center py-16 text-gray-400"><ShoppingCart className="w-12 h-12 mb-3 opacity-50" /><p className="text-sm">暂无商品</p></div>) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {filteredProducts.map(product => { const id = product.id as string; const inCart = cart.find(c => c.productId === id); const img = (product.image as string) || (product.image_url as string) || ''; return (
                <button key={id} onClick={() => handleAddToCart(product)} className="p-2 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all text-center relative">
                  {img ? <img src={img} alt={product.name as string} className="w-full aspect-square object-cover rounded-lg mb-1" /> : <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center mb-1"><ShoppingCart className="w-6 h-6 text-gray-300" /></div>}
                  <div className="text-xs font-medium text-gray-900 line-clamp-1">{product.name as string}</div>
                  <div className="text-emerald-600 font-bold text-sm">¥{parseFloat(String(product.price)).toFixed(2)}</div>
                  {inCart && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">{inCart.quantity}</span>}
                </button>
              );})}
            </div>
          )}
        </div>
      </>)}
      {cart.length > 0 && (
        <div className="border-t border-gray-200 bg-white mt-auto">
          <div className="max-h-48 overflow-auto px-1 py-2 space-y-1">{cart.map(item => (
            <div key={item.productId} className="flex items-center justify-between py-1.5"><div className="flex items-center gap-2 min-w-0 flex-1"><span className="text-sm text-gray-900 truncate">{item.productName}</span><span className="text-xs text-gray-500 shrink-0">¥{item.price.toFixed(2)}</span></div>
              <div className="flex items-center gap-2 shrink-0 ml-2"><button onClick={() => handleUpdateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button><span className="w-6 text-center text-sm font-medium">{item.quantity}</span><button onClick={() => handleUpdateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button><button onClick={() => handleRemoveFromCart(item.productId)} className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center ml-1"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button></div>
            </div>
          ))}</div>
          <div className="flex items-center justify-between px-1 py-3 border-t border-gray-100">
            <div><span className="text-sm text-gray-500">合计 </span><span className="text-lg font-bold text-emerald-600">¥{cartTotal.toFixed(2)}</span></div>
            <div className="flex gap-2"><button onClick={() => setCart([])} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200">清空</button><button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold disabled:opacity-50 flex items-center gap-2">{submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShoppingCart className="w-4 h-4" /> 提交订单</>}</button></div>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
