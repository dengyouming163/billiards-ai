'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  Trash2,
  MessageSquare,
  ScanLine,
  Check,
  Package,
} from 'lucide-react';
import { ModalShell } from '@/components/ModalShell';
import { useApp } from '@/context/AppContext';
import { orderApi } from '@/lib/api/pos';
import { Product, ProductCategory } from '@/types';

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
  orderId?: string;
}

export default function ProductOrderModal({
  tableId,
  tableName,
  onClose,
  orderId: propOrderId,
}: ProductOrderModalProps) {
  const { state, dispatch } = useApp();
  const { products, assistants } = state;

  // Cart state
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [orderRemarks, setOrderRemarks] = useState('');
  const [itemRemarks, setItemRemarks] = useState<Record<string, string>>({});
  const [showRemarksModal, setShowRemarksModal] = useState<string | null>(null);
  const [tempRemarks, setTempRemarks] = useState('');
  const [submittedItems, setSubmittedItems] = useState<Record<string, unknown>[]>([]);
  const [orderId, setOrderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');



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

  // Get unique categories from state
  const categories = useMemo(() => {
    const cats: Array<{ id: string; name: string; icon: string }> = [
      { id: 'all', name: '全部', icon: '📋' },
      ...state.categories.map((c: ProductCategory) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || '📦',
      })),
    ];
    return cats;
  }, [state.categories]);

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

  // Fetch current order
  useEffect(() => {
    if (propOrderId) {
      setOrderId(propOrderId);
      return;
    }
    const fetchOrderId = async () => {
      try {
        const result = await orderApi.getCurrentOrder(tableId) as Record<string, unknown>;
        if (result?.id) {
          setOrderId(result.id as string);
          const items = (result.items || []) as Record<string, unknown>[];
          const productItems = items.filter((i) => i.itemType === 'product');
          setSubmittedItems(productItems);
        }
      } catch {
        // 静默失败
      }
    };
    fetchOrderId();
  }, [tableId, propOrderId]);

  // Submit order
  const handleSubmit = useCallback(async () => {
    if (localCart.length === 0 || !orderId) return;
    setIsSubmitting(true);
    setSubmitError('');
    const submittedIds: string[] = [];
    try {
      for (const item of localCart) {
        try {
          await orderApi.addProductItem({
            order_id: orderId,
            product_id: item.productId,
            quantity: item.quantity,
            remark: itemRemarks[item.id] || '',
          });
          submittedIds.push(item.id);
        } catch (itemErr) {
          const msg = itemErr instanceof Error ? itemErr.message : '提交失败';
          throw new Error(`商品 ${item.productName} 提交失败: ${msg}`);
        }
      }
      setLocalCart((prev) => prev.filter((i) => !submittedIds.includes(i.id)));
      const refreshResult = await orderApi.getCurrentOrder(tableId) as Record<string, unknown>;
      const refreshedItems = (refreshResult.items || []) as Record<string, unknown>[];
      const productItems = refreshedItems.filter((i) => i.itemType === 'product');
      setSubmittedItems(productItems);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '提交订单失败，请重试';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [localCart, orderId, tableId]);

  return (
    <ModalShell onClose={onClose} title={`为桌 ${tableName} 点单`} icon={<ShoppingCart className="w-5 h-5" />}>
        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left - Categories & Products */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-[#e5e5e5]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999]" />
                <input
                  type="text"
                  placeholder="搜索商品名称或扫码..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white border border-[#e5e5e5] focus:border-[#07C160] focus:outline-none transition-colors"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#999999] text-sm">
                  <ScanLine className="w-4 h-4" />
                  <span>扫码</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <div className="flex gap-2 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-[#07C160] text-white'
                        : 'bg-white text-[#333333] hover:bg-gray-50 border border-[#e5e5e5]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Products grid */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => product.available && handleAddToCart(product)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && product.available) {
                        e.preventDefault();
                        handleAddToCart(product);
                      }
                    }}
                    className={`card p-4 text-left transition-all relative ${
                      !product.available
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105 hover:shadow-lg cursor-pointer'
                    }`}
                  >
                    {!product.available && (
                      <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                        <span className="text-sm text-white bg-red-500 px-2 py-1 rounded-lg">
                          售罄
                        </span>
                      </div>
                    )}
                    <div className="w-full h-16 bg-gray-50 rounded-xl mb-3 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded-xl" />
                      ) : (
                        <Package className="w-8 h-8 text-[#999999]" />
                      )}
                    </div>
                    <h4 className="font-medium text-sm text-[#333333] truncate">{product.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="money text-[#07C160] font-bold">
                        ¥{product.price}
                      </span>
                      {product.unit && (
                        <span className="text-xs text-[#999999]">
                          /{product.unit}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product.available) handleAddToCart(product);
                      }}
                      className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#07C160] text-white flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
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
          <div className="w-[420px] border-l border-[#e5e5e5] flex flex-col bg-white">
          {/* Cart Header */}
          <div className="p-4 border-b border-[#e5e5e5]">
            <h3 className="font-bold text-lg text-[#333333] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#07C160]" />
              已选商品
            </h3>
          </div>

            {/* Submitted items */}
            {submittedItems.length > 0 && (
              <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <h4 className="text-sm font-medium text-amber-800 mb-2">已提交商品 ({submittedItems.length} 件)</h4>
                <div className="space-y-1.5">
                  {submittedItems.map((item: Record<string, unknown>) => (
                    <div key={item.id as string} className="flex items-center justify-between text-sm">
                      <span className="text-amber-700">
                        {(item.item_name as string)} x{(item.quantity as number)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        (item.status as string) === 'preorder_pending' ? 'bg-amber-200 text-amber-800' :
                        (item.status as string) === 'pending' ? 'bg-blue-200 text-blue-800' :
                        (item.status as string) === 'processing' ? 'bg-purple-200 text-purple-800' :
                        (item.status as string) === 'delivered' ? 'bg-green-200 text-green-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {(item.status as string) === 'preorder_pending' ? '待确认' :
                         (item.status as string) === 'pending' ? '待接单' :
                         (item.status as string) === 'processing' ? '处理中' :
                         (item.status as string) === 'delivered' ? '已送达' : (item.status as string)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-[#e5e5e5]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#333333] truncate">{item.productName}</p>
                      <p className="text-sm text-[#999999]">
                        ¥{item.unitPrice}/件
                      </p>
                      {itemRemarks[item.id] && (
                        <p className="text-xs text-[#07C160] mt-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {itemRemarks[item.id]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[#07C160] hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-bold text-[#333333]">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-[#07C160] hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="w-20 text-right">
                      <span className="font-bold money text-[#07C160]">
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
            <div className="p-4 border-t border-[#e5e5e5]">
              <label className="text-sm text-[#999999] mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                整单备注
              </label>
              <input
                type="text"
                placeholder="可输入备注信息，如：少冰、不要辣..."
                value={orderRemarks}
                onChange={(e) => setOrderRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#e5e5e5] focus:border-[#07C160] focus:outline-none transition-colors"
              />
            </div>

            {/* Total & Submit */}
            <div className="p-4 border-t border-[#e5e5e5] bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[#999999]">
                  共 {cartCount} 件商品
                </span>
                <span className="text-3xl font-bold money text-[#07C160]">
                  ¥{cartTotal}
                </span>
              </div>
              {submitError && (
                <p className="text-rose-500 text-sm mb-2">{submitError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={localCart.length === 0 || !orderId || isSubmitting}
                className="w-full py-4 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-6 h-6" />
                {isSubmitting ? '提交中...' : '提交订单'}
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
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[400px] bg-white rounded-2xl p-6 shadow-xl border border-[#e5e5e5]">
              <h3 className="font-bold text-lg text-[#333333] mb-4">单品备注</h3>
              <input
                type="text"
                placeholder="输入备注信息..."
                value={tempRemarks}
                onChange={(e) => setTempRemarks(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-[#e5e5e5] focus:border-[#07C160] focus:outline-none mb-4"
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
                  className="flex-1 py-3 rounded-full bg-white border-2 border-[#e5e5e5] text-[#999999] font-medium hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => updateItemRemarks(showRemarksModal, tempRemarks)}
                  className="flex-1 py-3 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-medium"
                >
                  确认
                </button>
              </div>
            </div>
          </>
        )}
    </ModalShell>
  );
}
