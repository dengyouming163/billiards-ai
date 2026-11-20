"use client";

import type { Product, ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/image-upload";

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProduct: Product | null;
  productForm: {
    name: string;
    categoryId: string;
    unit: string;
    purchasePrice: number;
    salePrice: number;
    stock: number;
    lowStockThreshold: number;
    barcode: string;
    image: string;
    status: "active" | "inactive";
  };
  onFormChange: (form: ProductFormDialogProps["productForm"]) => void;
  onSave: () => void;
  saving: boolean;
  categories: ProductCategory[];
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  selectedProduct,
  productForm,
  onFormChange,
  onSave,
  saving,
  categories,
}: ProductFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedProduct ? "编辑商品" : "添加商品"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>商品名称 *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => onFormChange({ ...productForm, name: e.target.value })}
                placeholder="输入商品名称"
              />
            </div>
            <div>
              <Label>商品分类</Label>
              <Select value={productForm.categoryId} onValueChange={(v) => onFormChange({ ...productForm, categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>单位</Label>
              <Input
                value={productForm.unit}
                onChange={(e) => onFormChange({ ...productForm, unit: e.target.value })}
                placeholder="件、瓶、杯等"
              />
            </div>
            <div>
              <Label>条码</Label>
              <Input
                value={productForm.barcode}
                onChange={(e) => onFormChange({ ...productForm, barcode: e.target.value })}
                placeholder="商品条码"
              />
            </div>
            <div>
              <Label>进货价</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <Input
                  type="number"
                  value={productForm.purchasePrice}
                  onChange={(e) => onFormChange({ ...productForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <Label>销售价 *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">¥</span>
                <Input
                  type="number"
                  value={productForm.salePrice}
                  onChange={(e) => onFormChange({ ...productForm, salePrice: parseFloat(e.target.value) || 0 })}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <Label>当前库存</Label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(e) => onFormChange({ ...productForm, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>库存预警阈值</Label>
              <Input
                type="number"
                value={productForm.lowStockThreshold}
                onChange={(e) => onFormChange({ ...productForm, lowStockThreshold: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div>
            <Label>商品头图</Label>
            <div className="w-32 h-32">
              <ImageUpload
                value={productForm.image}
                onChange={(url) => onFormChange({ ...productForm, image: url })}
                type="product"
                placeholder="上传"
              />
            </div>
          </div>
          <div>
            <Label>商品状态</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={productForm.status === "active"}
                  onChange={() => onFormChange({ ...productForm, status: "active" })}
                  className="w-4 h-4 text-violet-600"
                />
                <span>上架</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="status"
                  checked={productForm.status === "inactive"}
                  onChange={() => onFormChange({ ...productForm, status: "inactive" })}
                  className="w-4 h-4 text-violet-600"
                />
                <span>下架</span>
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : (selectedProduct ? "保存修改" : "添加商品")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
