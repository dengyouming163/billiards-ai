"use client";

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/hooks/use-app";
import type { Product, ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchAllProducts,
  fetchAllProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory,
} from "@/lib/api/products";
import { useToast } from "@/lib/toast-context";
import {
  Plus,
  Edit,
  Trash2,
  Coffee,
  Beer,
  Cookie,
  Box,
  Layers,
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

export function ProductsCategoriesTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "box",
    color: "blue",
    description: "",
  });

  const loadData = useCallback(async () => {
    if (!currentStore?.id) return;

    try {
      setLoading(true);
      const [categoriesResult, productsResult] = await Promise.all([
        fetchAllProductCategories(),
        fetchAllProducts(),
      ]);
      setCategories(categoriesResult);
      setProducts(productsResult);
    } catch (error) {
      console.error("加载分类数据失败:", error);
      warning("加载分类数据失败");
    } finally {
      setLoading(false);
    }
  }, [currentStore?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getProductCount = (categoryId: string) => {
    return products.filter((p) => p.category_id === categoryId).length;
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      icon: "box",
      color: "blue",
      description: "",
    });
    setFormOpen(true);
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon || "box",
      color: category.color || "blue",
      description: category.description || "",
    });
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = async () => {
    if (!categoryForm.name || !currentStore) return;

    try {
      setSaving(true);
      const categoryData = {
        ...categoryForm,
        storeId: currentStore.id,
      };

      if (editingCategory) {
        await updateProductCategory(editingCategory.id, categoryData);
        success("分类更新成功");
      } else {
        await createProductCategory(categoryData);
        success("分类创建成功");
      }

      setFormOpen(false);
      setEditingCategory(null);
      await loadData();
    } catch (error) {
      console.error("保存分类失败:", error);
      warning("保存分类失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("确定要删除该分类吗？")) return;

    try {
      await deleteProductCategory(categoryId);
      success("分类已删除");
      await loadData();
    } catch (error) {
      console.error("删除分类失败:", error);
      warning("删除分类失败");
    }
  };

  return (
    <div className="p-4">
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">商品分类</h2>
          <p className="text-sm text-slate-500">管理商品分类，方便筛选和统计</p>
        </div>
        <Button
          onClick={handleAddCategory}
          disabled={formOpen}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />添加分类
        </Button>
      </div>

      {/* 内联表单：新增/编辑分类 */}
      {formOpen && (
        <div className="mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="font-medium text-slate-800 mb-4">
            {editingCategory ? "编辑分类" : "新增分类"}
          </h3>
          <div className="space-y-4">
            <div>
              <Label>分类名称 *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="输入分类名称"
                className="mt-1"
              />
            </div>
            <div>
              <Label>分类颜色</Label>
              <div className="flex gap-2 mt-1">
                {["blue", "green", "amber", "purple"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                    className={`w-8 h-8 rounded-full ${
                      color === "blue"
                        ? "bg-blue-500"
                        : color === "green"
                        ? "bg-emerald-500"
                        : color === "amber"
                        ? "bg-amber-500"
                        : "bg-purple-500"
                    } ${
                      categoryForm.color === color
                        ? "ring-2 ring-offset-2 ring-slate-400"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>分类图标</Label>
              <div className="flex gap-2 mt-1">
                {[
                  { value: "box", icon: Box },
                  { value: "coffee", icon: Coffee },
                  { value: "beer", icon: Beer },
                  { value: "cookie", icon: Cookie },
                ].map(({ value, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, icon: value })}
                    className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center ${
                      categoryForm.icon === value ? "ring-2 ring-violet-500" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 text-slate-600" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={handleCancelForm}>
                取消
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={saving || !categoryForm.name}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
              >
                {saving ? "保存中..." : editingCategory ? "保存" : "创建"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 分类列表 */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">
          <Layers className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>加载中...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
            <Layers className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-700 mb-1">暂无分类</h3>
          <p className="text-sm text-slate-400 mb-4">创建商品分类，方便管理不同类型的商品</p>
          <Button
            onClick={handleAddCategory}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />添加第一个分类
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => {
            const Icon = categoryIcons[category.icon || "box"] || Box;
            const count = getProductCount(category.id);
            return (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      category.color === "blue"
                        ? "bg-blue-100 text-blue-600"
                        : category.color === "green"
                        ? "bg-emerald-100 text-emerald-600"
                        : category.color === "amber"
                        ? "bg-amber-100 text-amber-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{category.name}</p>
                    <p className="text-xs text-slate-400">{count} 个商品</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditCategory(category)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
