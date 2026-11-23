"use client";

import type { ProductCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Coffee, Beer, Cookie, Box } from "lucide-react";

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: ProductCategory | null;
  categoryForm: { name: string; icon: string; color: string; description: string };
  onFormChange: (form: CategoryFormDialogProps["categoryForm"]) => void;
  onSave: () => void;
  saving: boolean;
}

export default function CategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  categoryForm,
  onFormChange,
  onSave,
  saving,
}: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingCategory ? "编辑分类" : "新增分类"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>分类名称 *</Label>
            <Input
              value={categoryForm.name}
              onChange={(e) => onFormChange({ ...categoryForm, name: e.target.value })}
              placeholder="输入分类名称"
            />
          </div>
          <div>
            <Label>分类颜色</Label>
            <div className="flex gap-2">
              {['blue', 'green', 'amber', 'purple'].map((color) => (
                <button
                  key={color}
                  onClick={() => onFormChange({ ...categoryForm, color })}
                  className={`w-8 h-8 rounded-full ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-emerald-500' : color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'} ${categoryForm.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                />
              ))}
            </div>
          </div>
          <div>
            <Label>分类图标</Label>
            <div className="flex gap-2">
              {[
                { value: 'box', icon: Box },
                { value: 'coffee', icon: Coffee },
                { value: 'beer', icon: Beer },
                { value: 'cookie', icon: Cookie },
              ].map(({ value, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => onFormChange({ ...categoryForm, icon: value })}
                  className={`w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center ${categoryForm.icon === value ? 'ring-2 ring-violet-500' : ''}`}
                >
                  <Icon className="w-5 h-5 text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? "保存中..." : (editingCategory ? "保存" : "创建")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
