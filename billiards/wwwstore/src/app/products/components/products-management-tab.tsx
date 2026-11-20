"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "@/hooks/use-app";
import type { Product, ProductCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Plus,
  Package,
  AlertTriangle,
} from "lucide-react";
import {
  fetchAllProducts,
  fetchAllProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  fetchProductStats,
  fetchInventoryStats,
  inbound,
  outbound,
  adjustStock,
} from "@/lib/api/products";
import { useToast } from "@/lib/toast-context";
import ProductStatCards from "../product-stat-cards";
import ProductFilterToolbar from "../product-filter-toolbar";
import ProductTable from "../product-table";
import ProductFormDialog from "../product-form-dialog";
import InventoryDialog from "../inventory-dialog";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function ProductsManagementTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [activeSubTab, setActiveSubTab] = useState("all");

  // 统计数据
  const [productStats, setProductStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    totalValue: 0,
    totalSalesValue: 0,
    potentialProfit: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inboundToday: 0,
    outboundToday: 0,
  });

  // 商品筛选状态
  const [searchInput, setSearchInput] = useState("");
  const searchQuery = useDebounce(searchInput, 300);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // 对话框状态
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 库存操作对话框
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [inventoryAction, setInventoryAction] = useState<"inbound" | "outbound" | "adjust">("inbound");
  const [selectedInventoryProduct, setSelectedInventoryProduct] = useState<Product | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string>("");

  // 新增/编辑商品表单状态
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    unit: "件",
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    barcode: "",
    image: "",
    status: "active" as "active" | "inactive",
    tags: [] as string[],
    description: "",
  });

  // 库存操作表单状态
  const [inventoryForm, setInventoryForm] = useState({
    quantity: 1,
    remark: "",
  });

  // 加载商品数据
  const loadProductData = useCallback(async () => {
    if (!currentStore?.id) return;

    try {
      const [productsResult, categoriesResult, statsResult, invStatsResult] = await Promise.all([
        fetchAllProducts(),
        fetchAllProductCategories(),
        fetchProductStats(),
        fetchInventoryStats(),
      ]);

      setProducts(productsResult);
      setCategories(categoriesResult);

      if (statsResult) {
        setProductStats({
          total: statsResult.total || 0,
          active: statsResult.active || 0,
          inactive: statsResult.inactive || 0,
          totalValue: statsResult.total_value || 0,
          totalSalesValue: statsResult.total_sales_value || 0,
          potentialProfit: statsResult.potential_profit || 0,
          lowStock: statsResult.low_stock || 0,
          outOfStock: statsResult.out_of_stock || 0,
        });
      }

      if (invStatsResult) {
        setInventoryStats({
          totalProducts: invStatsResult.total_products || 0,
          totalStock: invStatsResult.total_stock || 0,
          totalValue: invStatsResult.total_value || 0,
          lowStockCount: invStatsResult.low_stock_count || 0,
          outOfStockCount: invStatsResult.out_of_stock_count || 0,
          inboundToday: invStatsResult.inbound_today || 0,
          outboundToday: invStatsResult.outbound_today || 0,
        });
      }
    } catch (error) {
      console.error("加载商品数据失败:", error);
      warning("加载商品数据失败");
    }
  }, [currentStore?.id]);

  useEffect(() => {
    loadProductData();
  }, [loadProductData]);

  // 过滤商品
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      let matchesStatus = true;

      if (statusFilter === "all") {
        matchesStatus = true;
      } else {
        matchesStatus = product.status === statusFilter;
      }

      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = product.stock <= product.low_stock_threshold && product.stock > 0;
      } else if (stockFilter === "out") {
        matchesStock = product.stock === 0;
      } else if (stockFilter === "normal") {
        matchesStock = product.stock > product.low_stock_threshold;
      }

      const matchesSubTab =
        activeSubTab === "all" ||
        (activeSubTab === "active" && product.status === "active") ||
        (activeSubTab === "inactive" && product.status === "inactive") ||
        (activeSubTab === "low" && product.stock <= product.low_stock_threshold && product.stock > 0) ||
        (activeSubTab === "out" && product.stock === 0);

      return matchesSearch && matchesCategory && matchesStock && matchesStatus && matchesSubTab;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter, activeSubTab]);

  // 打开新增商品对话框
  const openAddDialog = () => {
    setSelectedProduct(null);
    setProductForm({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      unit: "件",
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      lowStockThreshold: 10,
      barcode: "",
      image: "",
      status: "active",
      tags: [],
      description: "",
    });
    setAddDialogOpen(true);
  };

  // 打开编辑商品对话框
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      categoryId: product.category_id,
      unit: product.unit,
      purchasePrice: product.purchase_price,
      salePrice: product.sale_price,
      stock: product.stock,
      lowStockThreshold: product.low_stock_threshold,
      barcode: product.barcode || "",
      image: product.image || "",
      status: product.status,
      tags: product.tags || [],
      description: product.description || "",
    });
    setAddDialogOpen(true);
  };

  // 打开库存操作对话框
  const openInventoryDialog = (action: "inbound" | "outbound" | "adjust", product: Product) => {
    setInventoryAction(action);
    setSelectedInventoryProduct(product);
    setInventoryForm({
      quantity: 1,
      remark: "",
    });
    setInventoryDialogOpen(true);
  };

  // 保存商品
  const handleSaveProduct = async () => {
    if (!productForm.name || !currentStore) return;

    try {
      setSaving(true);
      const productData = {
        ...productForm,
        storeId: currentStore.id,
      };

      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData);
      } else {
        await createProduct(productData);
      }

      setAddDialogOpen(false);
      await loadProductData();
    } catch (error) {
      console.error("保存商品失败:", error);
      warning("保存商品失败");
    } finally {
      setSaving(false);
    }
  };

  // 切换商品状态
  const handleToggleStatus = async (product: Product) => {
    try {
      await toggleProductStatus(product.id);
      await loadProductData();
    } catch (error) {
      console.error("切换商品状态失败:", error);
      warning("切换商品状态失败");
    }
  };

  // 删除商品
  const handleDeleteProduct = (productId: string) => {
    setDeleteTargetId(productId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    try {
      await deleteProduct(deleteTargetId);
      await loadProductData();
    } catch (error) {
      console.error("删除商品失败:", error);
      warning("删除商品失败");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // 库存操作
  const handleInventoryAction = async (targetStock?: number) => {
    if (!selectedInventoryProduct) return;

    const isTargetMode = targetStock !== undefined;
    if (inventoryAction === "adjust") {
      if (!isTargetMode && inventoryForm.quantity === 0) return;
    } else {
      if (inventoryForm.quantity <= 0) return;
    }

    if (!isTargetMode && inventoryAction === "outbound" && selectedInventoryProduct.stock < inventoryForm.quantity) {
      warning("库存不足，无法出库");
      return;
    }

    try {
      setSaving(true);
      let quantity = inventoryForm.quantity;

      if (inventoryAction === "outbound") {
        await outbound(selectedInventoryProduct.id, quantity, inventoryForm.remark);
      } else if (inventoryAction === "adjust") {
        await adjustStock(selectedInventoryProduct.id, quantity, inventoryForm.remark, targetStock);
      } else {
        await inbound(selectedInventoryProduct.id, quantity, inventoryForm.remark);
      }

      setInventoryDialogOpen(false);
      await loadProductData();
    } catch (error) {
      console.error("库存操作失败:", error);
      warning("库存操作失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">商品管理</h2>
          <p className="text-sm text-slate-500">管理商品信息、价格和库存</p>
        </div>
        <Button onClick={openAddDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <Plus className="w-4 h-4 mr-2" />添加商品
        </Button>
      </div>

      {/* 统计卡片 */}
      <ProductStatCards productStats={productStats} inventoryStats={inventoryStats} />

      {/* 子Tab切换 */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-slate-100/80 backdrop-blur-sm rounded-xl">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList className="bg-white/60 rounded-xl p-1 shadow-sm">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-gradient-to-r from-emerald-500 to-teal-500 data-[state=active]:text-white">
              全部 ({productStats.total})
            </TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-gradient-to-r from-emerald-500 to-teal-500 data-[state=active]:text-white">
              已上架 ({productStats.active})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg data-[state=active]:bg-gradient-to-r from-emerald-500 to-teal-500 data-[state=active]:text-white">
              已下架 ({productStats.inactive})
            </TabsTrigger>
            <TabsTrigger value="low" className="rounded-lg data-[state=active]:bg-gradient-to-r from-amber-500 to-orange-500 data-[state=active]:text-white">
              库存预警 ({productStats.lowStock})
            </TabsTrigger>
            <TabsTrigger value="out" className="rounded-lg data-[state=active]:bg-gradient-to-r from-rose-500 to-red-500 data-[state=active]:text-white">
              已缺货 ({productStats.outOfStock})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 库存预警提醒 */}
      {(inventoryStats.lowStockCount > 0 || inventoryStats.outOfStockCount > 0) && (
        <Card className="bg-amber-50 border-amber-200 rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-900">库存预警提醒</p>
                <p className="text-sm text-amber-700">
                  {inventoryStats.lowStockCount} 种商品库存低于预警阈值，{inventoryStats.outOfStockCount} 种商品已缺货，请及时补货
                </p>
              </div>
              <Button variant="outline" className="bg-white" onClick={() => setActiveSubTab("low")}>
                查看预警
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选工具栏 */}
      <ProductFilterToolbar
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categories={categories}
      />

      {/* 商品列表 */}
      <ProductTable
        products={filteredProducts}
        categories={categories}
        onToggleStatus={handleToggleStatus}
        onEdit={openEditDialog}
        onDelete={handleDeleteProduct}
        onInventoryAction={openInventoryDialog}
      />

      {/* 添加/编辑商品对话框 */}
      <ProductFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        selectedProduct={selectedProduct}
        productForm={productForm}
        onFormChange={(form) => setProductForm(prev => ({ ...prev, ...form }))}
        onSave={handleSaveProduct}
        saving={saving}
        categories={categories}
      />

      {/* 库存操作对话框 */}
      <InventoryDialog
        open={inventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
        action={inventoryAction}
        product={selectedInventoryProduct}
        quantity={inventoryForm.quantity}
        remark={inventoryForm.remark}
        onQuantityChange={(q) => setInventoryForm(prev => ({ ...prev, quantity: q }))}
        onRemarkChange={(r) => setInventoryForm(prev => ({ ...prev, remark: r }))}
        onConfirm={handleInventoryAction}
        saving={saving}
      />

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除该商品吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
