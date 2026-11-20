'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { get, post } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiResponseType } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Clock, DollarSign, Package } from 'lucide-react';

export function PricingCouponTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const storeId = currentStore?.id || '';

  const [packages, setPackages] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', duration_hours: 2, price: 0, original_price: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (storeId) loadPackages();
  }, [storeId]);

  // Listen for external open-add-dialog event from page header
  useEffect(() => {
    const handleOpenAdd = () => {
      setEditingId(null);
      setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
      setShowForm(true);
    };
    window.addEventListener('openAddCouponPackage', handleOpenAdd);
    return () => window.removeEventListener('openAddCouponPackage', handleOpenAdd);
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await get<any[]>(
        API_ENDPOINTS.couponPackageList,
        { store_id: storeId, page_size: 100 },
        ApiResponseType.LIST,
      );
      const list = (data as any)?.lists || data || [];
      setPackages(Array.isArray(list) ? list.filter((p: any) => p.platform === 'internal') : []);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.duration_hours) {
      toast.error('请填写套餐名称和时长');
      return;
    }
    setSaving(true);
    try {
      await post(API_ENDPOINTS.couponPackageSave, {
        ...form,
        id: editingId,
        store_id: storeId,
      });
      toast.success(editingId ? '套餐已更新' : '套餐已添加');
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
      loadPackages();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pkg: Record<string, any>) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      duration_hours: Number(pkg.duration_hours) || 2,
      price: Number(pkg.price) || 0,
      original_price: Number(pkg.original_price) || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该套餐券？')) return;
    try {
      await post(API_ENDPOINTS.couponPackageDelete, { id });
      toast.success('已删除');
      loadPackages();
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">套餐券管理</h3>
          <p className="text-sm text-slate-500">管理验券开台套餐，套餐时长内台费不计费</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setForm({ name: '', duration_hours: 2, price: 0, original_price: 0 });
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> 新建套餐
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">套餐名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：2小时畅打券"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">时长(小时)</Label>
              <Input
                type="number"
                value={form.duration_hours}
                onChange={(e) =>
                  setForm({ ...form, duration_hours: Number(e.target.value) || 1 })
                }
                min={0.5}
                step={0.5}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">售价(元)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: Number(e.target.value) || 0 })
                }
                min={0}
                step={0.01}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">原价(元)</Label>
              <Input
                type="number"
                value={form.original_price}
                onChange={(e) =>
                  setForm({ ...form, original_price: Number(e.target.value) || 0 })
                }
                min={0}
                step={0.01}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? '保存中...' : '保存'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
              取消
            </Button>
          </div>
        </div>
      )}

      {/* Package List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>暂无套餐券</p>
          <p className="text-sm">点击「新建套餐」创建门店套餐券</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-slate-500">
                <th className="pb-3 font-medium w-[200px]">套餐名称</th>
                <th className="pb-3 font-medium">时长</th>
                <th className="pb-3 font-medium">售价</th>
                <th className="pb-3 font-medium">原价</th>
                <th className="pb-3 font-medium">状态</th>
                <th className="pb-3 font-medium w-[100px]">操作</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg: Record<string, any>) => (
                <tr key={pkg.id} className="border-b">
                  <td className="py-3 font-medium">{pkg.name}</td>
                  <td className="py-3 text-sm">
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <Clock className="w-3.5 h-3.5" /> {pkg.duration_hours}小时
                    </span>
                  </td>
                  <td className="py-3 text-sm font-medium text-amber-600">
                    <span className="inline-flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> {pkg.price}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-slate-400 line-through">
                    ¥{pkg.original_price}
                  </td>
                  <td className="py-3">
                    <Badge variant={pkg.status === 1 ? 'default' : 'secondary'}>
                      {pkg.status === 1 ? '启用' : '禁用'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(pkg)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
