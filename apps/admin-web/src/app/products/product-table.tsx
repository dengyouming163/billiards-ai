"use client";

import { formatCurrency } from "@/lib/utils";
import type { Product, ProductCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowUpCircle,
  ArrowDownCircle,
  SlidersHorizontal,
  Coffee,
  Beer,
  Cookie,
  Box,
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  coffee: Coffee,
  beer: Beer,
  cookie: Cookie,
  package: Box,
  box: Box,
  drink: Beer,
  snack: Cookie,
  tobacco: Box,
  accessory: Box,
};

function getStockStatus(product: Product) {
  if (product.stock === 0) {
    return { label: "已缺货", color: "bg-rose-100 text-rose-700", icon: AlertTriangle };
  }
  if (product.stock <= product.low_stock_threshold) {
    return { label: "库存低", color: "bg-amber-100 text-amber-700", icon: AlertTriangle };
  }
  return { label: "库存正常", color: "bg-emerald-100 text-emerald-700", icon: null };
}

interface ProductTableProps {
  products: Product[];
  categories: ProductCategory[];
  onToggleStatus: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onInventoryAction: (action: "inbound" | "outbound" | "adjust", product: Product) => void;
}

export default function ProductTable({
  products,
  categories,
  onToggleStatus,
  onEdit,
  onDelete,
  onInventoryAction,
}: ProductTableProps) {
  return (
    <Card className="bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 border-b border-slate-100">
              <TableHead className="text-slate-600">商品信息</TableHead>
              <TableHead className="text-slate-600">分类</TableHead>
              <TableHead className="text-slate-600">进价</TableHead>
              <TableHead className="text-slate-600">售价</TableHead>
              <TableHead className="text-slate-600">利润</TableHead>
              <TableHead className="text-slate-600">库存</TableHead>
              <TableHead className="text-slate-600">状态</TableHead>
              <TableHead className="text-right text-slate-600">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-slate-400">暂无商品</TableCell>
              </TableRow>
            ) : (
              products.map((product) => {
                const stockStatus = getStockStatus(product);
                const profit = product.sale_price - product.purchase_price;
                const profitRate = product.purchase_price > 0
                  ? ((profit / product.purchase_price) * 100).toFixed(0)
                  : "0";
                const category = categories.find((c) => c.id === product.category_id);
                const Icon = categoryIcons[category?.icon || "box"] || Box;

                return (
                  <TableRow key={product.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-8 h-8 rounded object-cover" />
                          ) : (
                            <Icon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-400">
                            {product.unit} {product.barcode && `· ${product.barcode}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-600">
                        {category?.name || "未分类"}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-slate-600">
                      {formatCurrency(product.purchase_price)}
                    </TableCell>
                    <TableCell className="font-mono text-slate-900 font-medium">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className={`font-mono ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
                        </span>
                        <span className="text-xs text-slate-400">({profitRate}%)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-medium ${
                          product.stock <= product.low_stock_threshold
                            ? product.stock === 0 ? "text-rose-600" : "text-amber-600"
                            : "text-slate-900"
                        }`}>
                          {product.stock}
                        </span>
                        {stockStatus.icon && (
                          <stockStatus.icon className={`w-4 h-4 ${
                            product.stock === 0 ? "text-rose-500" : "text-amber-500"
                          }`} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                          onClick={() => onToggleStatus(product)}
                          title={product.status === "active" ? "下架" : "上架"}
                        >
                          {product.status === "active" ? (
                            <EyeOff className="w-4 h-4 text-slate-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-emerald-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                          onClick={() => onEdit(product)}
                        >
                          <Edit className="w-4 h-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                          onClick={() => onDelete(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-lg text-emerald-600 hover:bg-emerald-50"
                          onClick={() => onInventoryAction("inbound", product)}
                        >
                          <ArrowUpCircle className="w-4 h-4 mr-1" />
                          入库
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-lg text-rose-600 hover:bg-rose-50"
                          onClick={() => onInventoryAction("outbound", product)}
                        >
                          <ArrowDownCircle className="w-4 h-4 mr-1" />
                          出库
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 rounded-lg text-amber-600 hover:bg-amber-50"
                          onClick={() => onInventoryAction("adjust", product)}
                        >
                          <SlidersHorizontal className="w-4 h-4 mr-1" />
                          调整
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
