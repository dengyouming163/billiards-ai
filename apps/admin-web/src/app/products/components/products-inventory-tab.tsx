"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "@/hooks/use-app";
import type { Product, InventoryRecord } from "@/lib/types";
import {
  fetchAllProducts,
  fetchInventoryStats,
  fetchInventoryRecords,
} from "@/lib/api/products";
import { useToast } from "@/lib/toast-context";
import InventoryRecordPanel from "../inventory-record-panel";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Package,
  TrendingUp,
} from "lucide-react";

export function ProductsInventoryTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { warning } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inboundToday: 0,
    outboundToday: 0,
  });

  const [inventoryTypeFilter, setInventoryTypeFilter] = useState<string>("all");
  const [inventoryProductFilter, setInventoryProductFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    if (!currentStore?.id) return;

    try {
      setLoading(true);

      const [recordsResult, statsResult, productsResult] = await Promise.all([
        fetchInventoryRecords({ page: 1, pageSize: 20 }),
        fetchInventoryStats(),
        fetchAllProducts(),
      ]);

      if (recordsResult) {
        setInventoryRecords(recordsResult.data || []);
      }

      if (statsResult) {
        setInventoryStats({
          totalProducts: statsResult.total_products || 0,
          totalStock: statsResult.total_stock || 0,
          totalValue: statsResult.total_value || 0,
          lowStockCount: statsResult.low_stock_count || 0,
          outOfStockCount: statsResult.out_of_stock_count || 0,
          inboundToday: statsResult.inbound_today || 0,
          outboundToday: statsResult.outbound_today || 0,
        });
      }

      setProducts(productsResult);
    } catch (error) {
      console.error("加载库存数据失败:", error);
      warning("加载库存数据失败");
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 过滤库存记录
  const filteredInventoryRecords = useMemo(() => {
    return inventoryRecords.filter((record) => {
      if (inventoryTypeFilter !== "all" && record.type !== inventoryTypeFilter) {
        return false;
      }
      if (inventoryProductFilter !== "all" && record.product_id !== inventoryProductFilter) {
        return false;
      }
      return true;
    });
  }, [inventoryRecords, inventoryTypeFilter, inventoryProductFilter]);

  return (
    <div className="p-4 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">库存记录</h2>
          <p className="text-sm text-slate-500">查看商品库存变动历史和统计数据</p>
        </div>
      </div>

      {/* 库存统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-2xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">商品种类</p>
                <p className="text-2xl font-bold text-slate-900">{inventoryStats.totalProducts}</p>
              </div>
              <div className="p-2 rounded-xl bg-blue-100">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">总库存</p>
                <p className="text-2xl font-bold text-slate-900">{inventoryStats.totalStock}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">今日入库</p>
                <p className="text-2xl font-bold text-emerald-600">{inventoryStats.inboundToday}</p>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100">
                <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-2xl border-slate-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">今日出库</p>
                <p className="text-2xl font-bold text-rose-600">{inventoryStats.outboundToday}</p>
              </div>
              <div className="p-2 rounded-xl bg-rose-100">
                <ArrowDownCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 库存记录面板 */}
      <InventoryRecordPanel
        records={filteredInventoryRecords}
        products={products}
        typeFilter={inventoryTypeFilter}
        productFilter={inventoryProductFilter}
        onTypeFilterChange={setInventoryTypeFilter}
        onProductFilterChange={setInventoryProductFilter}
      />
    </div>
  );
}
