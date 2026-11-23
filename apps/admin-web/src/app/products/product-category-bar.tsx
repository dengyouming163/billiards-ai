"use client";

import { Layers, Box, Coffee, Beer, Cookie } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Product, ProductCategory } from "@/lib/types";

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

interface ProductCategoryBarProps {
  categories: ProductCategory[];
  products: Product[];
  categoryFilter: string;
  onCategoryFilterChange: (id: string) => void;
}

export default function ProductCategoryBar({
  categories,
  products,
  categoryFilter,
  onCategoryFilterChange,
}: ProductCategoryBarProps) {
  return (
    <Card className="bg-white rounded-2xl">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">商品分类</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              categoryFilter === "all"
                ? "bg-violet-50 border-violet-200"
                : "bg-slate-50 border-slate-100 hover:border-slate-200"
            }`}
            onClick={() => onCategoryFilterChange("all")}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">全部分类</p>
                <p className="text-lg font-bold text-slate-900">{products.length}</p>
              </div>
            </div>
          </div>
          {categories.map((category) => {
            const Icon = categoryIcons[category.icon || "box"] || Box;
            const count = products.filter((p) => p.category_id === category.id).length;
            const colorMap: Record<string, string> = {
              blue: "bg-blue-100 text-blue-600",
              green: "bg-emerald-100 text-emerald-600",
              amber: "bg-amber-100 text-amber-600",
              purple: "bg-purple-100 text-purple-600",
            };
            const colorClass = colorMap[category.color || "blue"] || "bg-slate-100 text-slate-600";

            return (
              <div
                key={category.id}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  categoryFilter === category.id
                    ? "bg-violet-50 border-violet-200"
                    : "bg-slate-50 border-slate-100 hover:border-slate-200"
                }`}
                onClick={() => onCategoryFilterChange(category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{category.name}</p>
                    <p className="text-lg font-bold text-slate-900">{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
