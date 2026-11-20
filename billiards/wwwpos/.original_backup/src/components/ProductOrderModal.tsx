'use client';

import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import {
  X,
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  MessageSquare,
  ScanLine,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Product } from '@/types';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  remarks?: string;
}

interface ProductOrderModalProps {
  tableId: string;
  tableName: string;
  onClose: () => void;
}

export default function ProductOrderModal({
  tableId,
  tableName,
  onClose,
}: ProductOrderModalProps) {
  const { state, dispatch } = useApp();
  const { products, assistants } = state;

  // Cart state
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [orderRemarks, setOrderRemarks] = useState('');
  const [itemRemarks, setItemRemarks] = useState<Record<string, string>>({});
  const [showRemarksModal, setShowRemarksModal] = useState<string | null>(null);
  const [tempRemarks, setTempRemarks] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Quick add buttons
  const quickAddItems = useMemo(() => {
    const items: Array<{ id: string; name: string; price: number; icon: string }> = [
      { id: 'p1', name: '矿泉水', price: 5, icon: '💧' },
      { id: 'p2', name: '可乐', price: 10, icon: '🥤' },
      { id: 'p3', name: '雪碧', price: 10, icon: '🥤' },
      { id: 'p4', name: '红牛', price: 15, icon: '🐂' },
    ];
    return items;
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [
      { id: 'all', name: '全部', icon: '📋' },
      { id: 'c2', name: '饮料', icon: '🥤' },
      { id: 'c3', name: '零食', icon: '🍿' },
      { id: 'c4', name: '果盘', icon: '🍉' },
      { id: 'c5', name: '香烟', icon: '🚬' },
      { id: 'c6', name: '简餐', icon: '🍜' },
      { id: 'c7', name: '其他', icon: '📦' },
    ];
    return cats;
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Calculate totals
  const cartCount = localCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = localCart.reduce((sum, item) => sum + item.subtotal, 0);

  // Generate unique ID
  const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add to cart
  const handleAddToCart = useCallback((product: Product) => {
    if (!product.available) return;

    setLocalCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
          subtotal: (updated[existingIndex].quantity + 1) * product.price,
        };
        return updated;
      }
      return [
        ...prev,
        {
          id: generateItemId(),
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          subtotal: product.price,
        },
      ];
    });
  }, []);

  // Quick add from shortcuts
  const handleQuickAdd = useCallback(
    (item: typeof quickAddItems[0]) => {
      setLocalCart((prev) => {
        const existingIndex = prev.findIndex(
          (cartItem) => cartItem.productId === item.id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + 1,
            subtotal: (updated[existingIndex].quantity + 1) * item.price,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: generateItemId(),
            productId: item.id,
            productName: item.name,
            quantity: 1,
            unitPrice: item.price,
            subtotal: item.price,
          },
        ];
      });
    },
    []
  );

  // Update quantity
  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setLocalCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: Math.max(0, item.quantity + delta),
                subtotal: Math.max(0, item.quantity + delta) * item.unitPrice,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setLocalCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // Update item remarks
  const updateItemRemarks = useCallback(
    (itemId: string, remarks: string) => {
      setItemRemarks((prev) => ({ ...prev, [itemId]: remarks }));
      setLocalCart((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, remarks } : item))
      );
      setShowRemarksModal(null);
      setTempRemarks('');
    },
    []
  );

  // Scan barcode (simulated)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const handleScan = useCallback((barcode: string) => {
    const product = products.find(
      (p) => p.id === barcode || p.barcode === barcode
    );
    if (product && product.available) {
      handleAddToCart(product);
    }
  }, [products, handleAddToCart]);

  // Listen for scanner input
  useEffect(() => {
    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;

      if (e.key === 'Enter' && buffer.length > 0) {
        handleScan(buffer);
        buffer = '';
        return;
      }

      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        buffer += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScan]);

  // Submit order
  const handleSubmit = useCallback(() => {
    if (localCart.length === 0) return;

    const order = {
      id: `ord_${Date.now()}`,
      tableId,
      sessionId: '',
      items: localCart.map((item) => ({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        remarks: itemRemarks[item.id] || '',
      })),
      totalAmount: cartTotal,
      remarks: orderRemarks,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced' as const,
    };

    dispatch({ type: 'ADD_ORDER', payload: order });
    onClose();
  }, [localCart, tableId, cartTotal, orderRemarks, itemRemarks, dispatch, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex flex-col bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold">为桌 {tableName} 点单</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium">
              已选 {cartCount} 件
            </div>
            <div className="text-2xl font-bold money text-[var(--color-accent)]">
              ¥{cartTotal}
            </div>
          </div>
        </div>

        {/* Quick Add Bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <span className="text-sm text-[var(--color-text-muted)]">快捷添加:</span>
          <div className="flex gap-2">
            {quickAddItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleQuickAdd(item)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                <span className="opacity-80">¥{item.price}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Categories & Products */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  placeholder="搜索商品名称或扫码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[var(--color-text-muted)] text-sm">
                  <ScanLine className="w-4 h-4" />
                  <span>扫码</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-5 gap-4">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.available}
                    className={`card p-4 text-left transition-all relative ${
                      !product.available
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 hover:shadow-lg'
                    }`}
                  >
                    {!product.available && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-sm text-white bg-red-500 px-2 py-1 rounded-lg">
                          售罄
                        </span>
                      </div>
                    )}
                    <div className="w-full h-16 bg-[var(--color-bg-hover)] rounded-xl mb-3 flex items-center justify-center text-3xl">
                      {product.categoryId === 'c2' && '🥤'}
                      {product.categoryId === 'c3' && '🍿'}
                      {product.categoryId === 'c4' && '🍉'}
                      {product.categoryId === 'c5' && '🚬'}
                      {product.categoryId === 'c6' && '🍜'}
                      {product.categoryId === 'c7' && '📦'}
                    </div>
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="money text-[var(--color-accent)] font-bold">
                        ¥{product.price}
                      </span>
                      {product.unit && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          /{product.unit}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.available) handleAddToCart(product);
                      }}
                      className="absolute bottom-3 right-3 w-7 h-7 rounded-lg bg-[var(--color-accent)] text-white flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                  <Search className="w-12 h-12 mb-4" />
                  <p>没有找到商品</p>
                </div>
              )}
            </div>
          </div>

          {/* Right - Cart */}
          <div className="w-[420px] border-l border-[var(--color-border)] flex flex-col bg-[var(--color-bg-card)]">
            {/* Cart Header */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                已选商品
              </h3>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {localCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-muted)]">
                  <ShoppingCart className="w-16 h-16 mb-4 opacity-50" />
                  <p>购物车是空的</p>
                  <p className="text-sm mt-1">点击商品添加到购物车</p>
                </div>
              ) : (
                localCart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        ¥{item.unitPrice}/件
                      </p>
                      {itemRemarks[item.id] && (
                        <p className="text-xs text-[var(--color-accent)] mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {itemRemarks[item.id]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--color-bg-hover)] rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-[var(--color-bg-card)] flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-20 text-right">
                      <span className="font-bold money text-[var(--color-accent)]">
                        ¥{item.subtotal}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setShowRemarksModal(item.id);
                          setTempRemarks(itemRemarks[item.id] || '');
                        }}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]"
                        title="添加备注"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-400"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Order remarks */}
            <div className="p-4 border-t border-[var(--color-border)]">
              <label className="text-sm text-[var(--color-text-muted)] mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                整单备注
              </label>
              <input
                type="text"
                placeholder="可输入备注信息，如：少冰、不要辣..."
                value={orderRemarks}
                onChange={(e) => setOrderRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none transition-colors"
              />
            </div>

            {/* Total & Submit */}
            <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[var(--color-text-muted)]">
                  共 {cartCount} 件商品
                </span>
                <span className="text-3xl font-bold money text-[var(--color-accent)]">
                  ¥{cartTotal}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={localCart.length === 0}
                className="w-full py-4 rounded-xl bg-[var(--color-accent)] text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-6 h-6" />
                提交订单
              </button>
            </div>
          </div>
        </div>

        {/* Item remarks modal */}
        {showRemarksModal && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-[60]"
              onClick={() => {
                setShowRemarksModal(null);
                setTempRemarks('');
              }}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[400px] bg-[var(--color-bg-secondary)] rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-lg mb-4">单品备注</h3>
              <input
                type="text"
                placeholder="输入备注信息..."
                value={tempRemarks}
                onChange={(e) => setTempRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:outline-none mb-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateItemRemarks(showRemarksModal, tempRemarks);
                  }
                }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRemarksModal(null);
                    setTempRemarks('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-[var(--color-bg-hover)] font-medium"
                >
                  取消
                </button>
                <button
                  onClick={() => updateItemRemarks(showRemarksModal, tempRemarks)}
                  className="flex-1 py-3 rounded-xl bg-[var(--color-accent)] text-white font-medium"
                >
                  确认
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
