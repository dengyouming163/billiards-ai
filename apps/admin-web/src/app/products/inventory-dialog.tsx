"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "inbound" | "outbound" | "adjust";
  product: Product | null;
  quantity: number;
  remark: string;
  onQuantityChange: (q: number) => void;
  onRemarkChange: (r: string) => void;
  onConfirm: (targetStock?: number) => void;
  saving: boolean;
}

export default function InventoryDialog({
  open,
  onOpenChange,
  action,
  product,
  quantity,
  remark,
  onQuantityChange,
  onRemarkChange,
  onConfirm,
  saving,
}: InventoryDialogProps) {
  // 调整模式切换：false=增量调整，true=设为目标值
  const [isTargetMode, setIsTargetMode] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === "inbound" && "库存入库"}
            {action === "outbound" && "库存出库"}
            {action === "adjust" && "库存调整"}
          </DialogTitle>
          <DialogDescription>
            {product && `商品：${product.name}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {action === "adjust" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">调整方式：</span>
              <button
                type="button"
                onClick={() => { setIsTargetMode(false); onQuantityChange(0); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  !isTargetMode ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                增量调整
              </button>
              <button
                type="button"
                onClick={() => { setIsTargetMode(true); onQuantityChange(product?.stock ?? 0); }}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  isTargetMode ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                设为目标值
              </button>
            </div>
          )}

          <div>
            <Label>
              {action === "adjust" && isTargetMode ? "目标库存 *" : "变动数量 *"}
            </Label>
            <Input
              type="number"
              min={isTargetMode ? 0 : undefined}
              value={quantity}
              onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
              placeholder={
                isTargetMode
                  ? "输入目标库存数量"
                  : action === "adjust"
                  ? "正数增加库存，负数减少库存"
                  : "请输入数量"
              }
            />
            {action === "adjust" && !isTargetMode && (
              <p className="text-xs text-slate-500 mt-1">提示：输入正数增加库存，输入负数减少库存</p>
            )}
            {action === "adjust" && isTargetMode && (
              <p className="text-xs text-slate-500 mt-1">
                提示：直接设置库存为目标值，{product ? `当前库存为 ${product.stock}${product.unit ? ` ${product.unit}` : ""}` : ""}
              </p>
            )}
          </div>
          <div>
            <Label>备注</Label>
            <Input
              value={remark}
              onChange={(e) => onRemarkChange(e.target.value)}
              placeholder="可选，输入备注信息"
            />
          </div>
          {product && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-600">
                当前库存：<span className="font-medium">{product.stock}</span> {product.unit}
              </p>
              {action === "adjust" && isTargetMode && product && quantity !== undefined && (
                <p className="text-sm text-slate-600 mt-1">
                  调整后：<span className="font-medium">{quantity - product.stock > 0 ? "+" : ""}{quantity - product.stock}</span>
                  {" → "}
                  <span className="font-medium text-blue-600">{quantity}</span>
                </p>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            onClick={() => onConfirm(isTargetMode ? quantity : undefined)}
            disabled={saving || (action === "adjust" && isTargetMode && quantity < 0)}
          >
            {saving ? "处理中..." : (
              <>
                {action === "inbound" && "确认入库"}
                {action === "outbound" && "确认出库"}
                {action === "adjust" && "确认调整"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
