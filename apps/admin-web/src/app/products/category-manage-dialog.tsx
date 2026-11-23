"use client";

import type { Product, ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit,
  Trash2,
  Plus,
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

interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ProductCategory[];
  products: Product[];
  onAddCategory: () => void;
  onEditCategory: (category: ProductCategory) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export default function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  products,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: CategoryManageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>分类管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">分类列表</span>
            <Button size="sm" onClick={onAddCategory}>
              <Plus className="w-4 h-4 mr-1" />新增分类
            </Button>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {categories.map((category) => {
              const Icon = categoryIcons[category.icon || "box"] || Box;
              const count = products.filter((p) => p.category_id === category.id).length;
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-slate-400">{count} 个商品</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditCategory(category)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDeleteCategory(category.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && (
              <div className="text-center py-8 text-slate-400">暂无分类</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
