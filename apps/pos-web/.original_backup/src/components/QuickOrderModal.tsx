'use client';

import { useState, useCallback, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Trash2,
  Table2,
  CreditCard,
} from 'lucide-react';
import { mockProducts } from '@/data/mock-data';
import type { Product, OrderItem } from '@/types';
import { ModalContainer } from './ModalContainer';

// Cart item type (for quick order - simplified)
interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  note: string;
}

interface QuickOrderModalProps {
  onClose: () => void;
}

export function QuickOrderModal({ onClose }: QuickOrderModalProps) {
  const { state, dispatch } = useApp();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCheckout, setShowCheckout] = useState(false);
  const [step, setStep] = useState<'order' | 'checkout'>('order');

  const idleTables = state.tables.filter((t) => t.status === 'idle');

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'drinks', name: '饮品' },
    { id: 'snacks', name: '小食' },
    { id: 'supplies', name: '用品' },
  ];

  const filteredProducts: Product[] = mockProducts.filter((product: Product) => {
    const matchesCategory =
      selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: 1,
          note: '',
        },
      ];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleSubmitOrder = useCallback(() => {
    if (cart.length === 0) return;

    if (selectedTableId) {
      dispatch({
        type: 'ADD_ORDER',
        payload: {
          id: `order-${Date.now()}`,
          tableId: selectedTableId,
          sessionId: '',
          items: cart.map((item) => ({
            id: `item-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
            remarks: '',
          })),
          totalAmount: cartTotal,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        },
      });
    } else {
      // Direct order without table
      dispatch({
        type: 'ADD_ORDER',
        payload: {
          id: `order-${Date.now()}`,
          tableId: '',
          sessionId: '',
          items: cart.map((item) => ({
            id: `item-${Date.now()}-${Math.random()}`,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
            remarks: '',
          })),
          totalAmount: cartTotal,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced' as const,
        },
      });
    }

    setCart([]);
    onClose();
  }, [cart, cartTotal, selectedTableId, dispatch, onClose]);

  const handleDirectCheckout = () => {
    if (cart.length === 0) return;
    setStep('checkout');
    setShowCheckout(true);
  };

  const handlePayment = (method: string) => {
    onClose();
  };

  const footer = (
    <div className="flex gap-2">
      <button
        onClick={() => setCart([])}
        disabled={cart.length === 0}
        className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        清空
      </button>
      <button
        onClick={handleDirectCheckout}
        disabled={cart.length === 0}
        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        直接结账 ¥{cartTotal.toFixed(2)}
      </button>
      <button
        onClick={handleSubmitOrder}
        disabled={cart.length === 0}
        className="flex-1 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selectedTableId ? '挂账' : '提交订单'}
      </button>
    </div>
  );

  return (
    <ModalContainer
      title={step === 'order' ? '点单' : '收银结账'}
      icon={<ShoppingCart className="w-4 h-4 text-white" />}
      onClose={onClose}
      footer={step === 'order' ? footer : undefined}
      width="max-w-5xl"
    >
      {step === 'order' ? (
        <>
          {/* Table Selection */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 mb-2">
              <Table2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">
                关联台球桌（可选）
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTableId('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedTableId === ''
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                不关联
              </button>
              {idleTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedTableId === table.id
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {table.name}号台
                </button>
              ))}
              {idleTables.length === 0 && (
                <span className="text-xs text-slate-500">暂无可用台球桌</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Product List */}
            <div className="flex-1 flex flex-col">
              {/* Search & Category */}
              <div className="p-3 border-b border-slate-100">
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="搜索商品名称或扫码..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="flex-1 overflow-auto p-3">
                <div className="grid grid-cols-4 gap-2">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleAddToCart(product)}
                      className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-md bg-white transition-all text-left"
                    >
                      <div className="text-sm font-medium text-slate-800 mb-1 line-clamp-2">
                        {product.name}
                      </div>
                      <div className="text-emerald-600 font-semibold">
                        ¥{product.price.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart */}
            <div className="w-72 border-l border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-800">购物车</h3>
                  <span className="text-xs text-slate-500">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} 件
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="text-center py-6 text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">购物车空空如也</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.productId}
                      className="bg-white rounded-lg p-2 border border-slate-200"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-medium text-slate-800 line-clamp-1">
                          {item.productName}
                        </span>
                        <button
                          onClick={() => handleRemoveFromCart(item.productId)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 font-medium">
                          ¥{item.price.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, -1)
                            }
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.productId, 1)
                            }
                            className="w-6 h-6 rounded bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Summary */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">合计</span>
                  <span className="text-base font-bold text-emerald-600">
                    ¥{cartTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Checkout Step */
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="text-xs text-slate-500 mb-1">应付金额</div>
            <div className="text-3xl font-bold text-slate-900">
              ¥{cartTotal.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { id: 'cash', name: '现金', icon: '💵' },
              { id: 'wechat', name: '微信', icon: '💚' },
              { id: 'alipay', name: '支付宝', icon: '💙' },
              { id: 'card', name: '银行卡', icon: '💳' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => handlePayment(method.id)}
                className="p-3 rounded-xl border-2 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
              >
                <div className="text-xl mb-1">{method.icon}</div>
                <div className="text-xs font-medium text-slate-700">
                  {method.name}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setStep('order');
                setShowCheckout(false);
              }}
              className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              返回点单
            </button>
          </div>
        </div>
      )}
    </ModalContainer>
  );
}
