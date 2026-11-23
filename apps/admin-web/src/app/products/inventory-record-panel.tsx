"use client";

import type { Product, InventoryRecord } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  History,
} from "lucide-react";

function getInventoryTypeStyle(type: string) {
  const styles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    inbound: { bg: "bg-emerald-100", text: "text-emerald-700", icon: ArrowUpCircle },
    outbound: { bg: "bg-rose-100", text: "text-rose-700", icon: ArrowDownCircle },
    adjustment: { bg: "bg-purple-100", text: "text-purple-700", icon: ArrowRightLeft },
    adjust_in: { bg: "bg-blue-100", text: "text-blue-700", icon: ArrowUpCircle },
    adjust_out: { bg: "bg-amber-100", text: "text-amber-700", icon: ArrowDownCircle },
  };
  return styles[type] || { bg: "bg-slate-100", text: "text-slate-600", icon: History };
}

interface InventoryRecordPanelProps {
  records: InventoryRecord[];
  products: Product[];
  typeFilter: string;
  productFilter: string;
  onTypeFilterChange: (v: string) => void;
  onProductFilterChange: (v: string) => void;
}

export default function InventoryRecordPanel({
  records,
  products,
  typeFilter,
  productFilter,
  onTypeFilterChange,
  onProductFilterChange,
}: InventoryRecordPanelProps) {
  return (
    <Card className="bg-white rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">库存变动记录</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Select value={typeFilter} onValueChange={onTypeFilterChange}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="inbound">入库</SelectItem>
                <SelectItem value="outbound">出库</SelectItem>
                <SelectItem value="adjustment">调整</SelectItem>
                <SelectItem value="adjust_in">调整(增加)</SelectItem>
                <SelectItem value="adjust_out">调整(减少)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={productFilter} onValueChange={onProductFilterChange}>
              <SelectTrigger className="w-[200px] rounded-xl">
                <SelectValue placeholder="选择商品" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部商品</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 border-b border-slate-100">
                <TableHead className="text-slate-600">操作类型</TableHead>
                <TableHead className="text-slate-600">商品信息</TableHead>
                <TableHead className="text-slate-600">变动数量</TableHead>
                <TableHead className="text-slate-600">操作前库存</TableHead>
                <TableHead className="text-slate-600">操作后库存</TableHead>
                <TableHead className="text-slate-600">备注</TableHead>
                <TableHead className="text-slate-600">操作时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-400">暂无库存记录</TableCell>
                </TableRow>
              ) : (
                records.map((record) => {
                  const typeStyle = getInventoryTypeStyle(record.type);
                  const TypeIcon = typeStyle.icon;

                  const typeLabel = (record as any).type_label || (record as any).typeLabel || record.type;
                  return (
                    <TableRow key={record.id} className="border-b border-slate-50">
                      <TableCell>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                          <TypeIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">{typeLabel}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{record.product?.name}</p>
                          <p className="text-xs text-slate-400">{record.product?.barcode || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-medium ${(record.type as string) === 'inbound' || (record.type as string) === 'adjustment' || (record.type as string) === 'adjust_in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {(record.type as string) === 'inbound' || (record.type as string) === 'adjustment' || (record.type as string) === 'adjust_in' ? '+' : '-'}{record.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-slate-600">{record.before_stock}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-medium ${(record.after_stock ?? 0) > (record.before_stock ?? 0) ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {record.after_stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{record.remark || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-500">{record.created_at}</span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
