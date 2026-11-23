'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Percent } from 'lucide-react';
import {
  fetchDiscountList,
  saveDiscount,
  deleteDiscount,
  type DiscountConfig,
} from '@/lib/api/discount';

const ROUNDING_MODES = [
  { value: 'none', label: '不取整' },
  { value: 'yuan', label: '取整到元' },
  { value: 'jiao', label: '取整到角' },
  { value: 'half_yuan', label: '取整到0.5元' },
] as const;

const DISCOUNT_TYPES = [
  { value: 'rate', label: '打折', hint: '输入折扣率，如 85 表示 8.5 折' },
  { value: 'amount', label: '减钱', hint: '输入减免金额，如 10 表示减 10 元' },
] as const;

interface Props {
  currentStore: { id: string; name: string } | null;
  success: (msg: string) => void;
  warning: (msg: string) => void;
  visible: boolean;
}

export default function SettingsDiscountTab({ currentStore, success, warning, visible }: Props) {
  const [discounts, setDiscounts] = useState<DiscountConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountConfig | null>(null);
  const [form, setForm] = useState({
    discount_name: '',
    type: 'rate' as 'rate' | 'amount',
    value: 0,
    rounding_mode: 'none' as 'none' | 'yuan' | 'jiao' | 'half_yuan',
    status: 1,
    sort_order: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !currentStore) return;
    loadDiscounts();
  }, [visible, currentStore]);

  const loadDiscounts = async () => {
    setLoading(true);
    try {
      const data = await fetchDiscountList();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      warning(e?.message || '加载折扣配置失败');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingDiscount(null);
    setForm({
      discount_name: '',
      type: 'rate',
      value: 0,
      rounding_mode: 'none',
      status: 1,
      sort_order: discounts.length,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (discount: DiscountConfig) => {
    setEditingDiscount(discount);
    setForm({
      discount_name: discount.discount_name,
      type: discount.discount_type,
      value: discount.discount_value,
      rounding_mode: discount.rounding_mode,
      status: discount.status,
      sort_order: discount.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.discount_name) {
      warning('请输入折扣名称');
      return;
    }
    setSaving(true);
    try {
      await saveDiscount({
        ...(editingDiscount?.id ? { id: editingDiscount.id } : {}),
        discount_name: form.discount_name,
        discount_type: form.type,
        discount_value: form.value,
        rounding_mode: form.rounding_mode,
        status: form.status,
        sort_order: form.sort_order,
      });
      success(editingDiscount ? '折扣已更新' : '折扣已添加');
      setDialogOpen(false);
      loadDiscounts();
    } catch (e: any) {
      warning(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该折扣配置吗？')) return;
    try {
      await deleteDiscount(id);
      success('折扣已删除');
      loadDiscounts();
    } catch (e: any) {
      warning(e?.message || '删除失败');
    }
  };

  const getTypeLabel = (type: string) => {
    return DISCOUNT_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getRoundingLabel = (mode: string) => {
    return ROUNDING_MODES.find((m) => m.value === mode)?.label || mode;
  };

  const formatValue = (type: string, value: number) => {
    if (type === 'rate') return `${value}% (${(value / 10).toFixed(1)}折)`;
    return `-¥${value}`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Percent className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">折扣配置</CardTitle>
                <p className="text-sm text-slate-500 mt-1">管理订单结算时的折扣规则</p>
              </div>
            </div>
            <Button
              onClick={openAddDialog}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加折扣
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Percent className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无折扣配置</p>
              <p className="text-sm mt-1">点击上方按钮添加折扣规则</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>排序</TableHead>
                  <TableHead>折扣名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>值</TableHead>
                  <TableHead>取整方式</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-24">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell className="text-slate-500">{discount.sort_order}</TableCell>
                    <TableCell className="font-medium">{discount.discount_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(discount.discount_type)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatValue(discount.discount_type, discount.discount_value)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {getRoundingLabel(discount.rounding_mode)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={discount.status === 1 ? 'default' : 'secondary'}>
                        {discount.status === 1 ? '启用' : '禁用'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(discount)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(discount.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDiscount ? '编辑折扣' : '添加折扣'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>折扣名称</Label>
              <Input
                value={form.discount_name}
                onChange={(e) => setForm({ ...form, discount_name: e.target.value })}
                placeholder="如：会员9折、新客立减"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>折扣类型</Label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, type: value as 'rate' | 'amount' })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {form.type === 'rate' ? '折扣率(%)' : '减免金额(元)'}
              </Label>
              <Input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                placeholder={form.type === 'rate' ? '如 85 表示 8.5 折' : '如 10 表示减 10 元'}
                className="rounded-xl"
              />
              <p className="text-xs text-slate-400">
                {form.type === 'rate'
                  ? `当前：${form.value > 0 ? (form.value / 10).toFixed(1) + '折' : '未设置'}`
                  : `当前：${form.value > 0 ? '减 ¥' + form.value : '未设置'}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>取整方式</Label>
              <Select
                value={form.rounding_mode}
                onValueChange={(value) => setForm({ ...form, rounding_mode: value as any })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUNDING_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>排序</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <Label className="text-sm">启用状态</Label>
              <Switch
                checked={form.status === 1}
                onCheckedChange={(checked) => setForm({ ...form, status: checked ? 1 : 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl">
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.discount_name}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
