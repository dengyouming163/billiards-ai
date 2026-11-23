'use client';

import { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Coffee,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SettingsCard, SettingsCardGrid, SettingsEmpty } from '../../settings/settings-card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchZones,
  createZone,
  updateZone,
  deleteZone,
  toggleZone,
  type Zone,
  type ZoneForm,
} from '@/lib/api/zone';

interface TablesZonesTabProps {
  currentStoreId: string | undefined;
  visible: boolean;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

export function TablesZonesTab({ currentStoreId, visible, success, warning }: TablesZonesTabProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<(Zone & { editing?: boolean }) | ZoneForm>({
    name: '',
    color: '#00D4AA',
    description: '',
    sort_order: 0,
    status: 1,
  });

  const loadZones = async () => {
    if (!currentStoreId) return;
    setZonesLoading(true);
    try {
      const data = await fetchZones({ store_id: currentStoreId });
      setZones(data);
    } catch (err) {
      console.error('加载分区数据失败:', err);
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    if (visible && currentStoreId) {
      loadZones();
    }
  }, [visible, currentStoreId]);

  const handleSaveZone = async () => {
    if (!currentStoreId) return;
    setZonesLoading(true);
    try {
      if ('id' in editingZone && editingZone.id) {
        await updateZone(editingZone.id, editingZone);
      } else {
        await createZone({ store_id: currentStoreId, ...(editingZone as ZoneForm) });
      }
      await loadZones();
      setZoneDialogOpen(false);
      setEditingZone({ name: '', color: '#00D4AA', description: '', sort_order: 0, status: 1 });
    } catch (err) {
      console.error('保存分区失败:', err);
      warning('保存分区失败，请稍后重试');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm('确定要删除该分区吗？')) return;
    setZonesLoading(true);
    try {
      await deleteZone(id);
      await loadZones();
    } catch (err) {
      console.error('删除分区失败:', err);
      warning('删除分区失败，请稍后重试');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleToggleZone = async (id: string) => {
    setZonesLoading(true);
    try {
      await toggleZone(id);
      await loadZones();
    } catch (err) {
      console.error('切换分区状态失败:', err);
      warning('操作失败，请稍后重试');
    } finally {
      setZonesLoading(false);
    }
  };

  const handleEditZone = (zone: Zone) => {
    setEditingZone({ ...zone });
    setZoneDialogOpen(true);
  };

  return (
    <>
      <SettingsCard
        title="分区配置"
        desc="管理台球桌区域划分"
        actions={
          <Button
            onClick={() => {
              setEditingZone({ name: '', color: '#00D4AA', description: '', sort_order: 0, status: 1 });
              setZoneDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增分区
          </Button>
        }
      >
        <div className="space-y-6">
          <SettingsCardGrid>
            {zonesLoading ? (
              <div className="col-span-full flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            ) : zones.length === 0 ? (
              <SettingsEmpty text="暂无分区" />
            ) : (
          zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2.5 rounded-xl shadow-lg"
                    style={{ backgroundColor: zone.color + '20', boxShadow: `0 4px 12px ${zone.color}30` }}
                  >
                    <LayoutGrid className="w-5 h-5" style={{ color: zone.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{zone.name}</h3>
                    <p className="text-sm text-slate-500">{zone.description || '暂无描述'}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    zone.status === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {zone.status === 1 ? '启用' : '停用'}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">0</span> 张球台
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleZone(zone.id)}
                    className={`h-8 px-2 ${zone.status === 1 ? 'text-slate-500 hover:text-amber-500' : 'text-slate-500 hover:text-green-500'}`}
                  >
                    {zone.status === 1 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditZone(zone)}
                    className="h-8 px-2 text-slate-500 hover:text-[#00D4AA]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteZone(zone.id)}
                    className="h-8 px-2 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
          </SettingsCardGrid>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-200">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">分区总数</p>
              <p className="text-2xl font-bold text-slate-900">{zones.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-200">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">启用分区</p>
              <p className="text-2xl font-bold text-slate-900">
                {zones.filter(z => z.status === 1).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">球台总数</p>
              <p className="text-2xl font-bold text-slate-900">
                {zones.reduce((sum, z) => sum + ((z as Zone & { tableCount?: number }).tableCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-200">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-500">平均每区</p>
              <p className="text-2xl font-bold text-slate-900">
                {zones.length > 0 ? Math.round(zones.reduce((sum, z) => sum + ((z as Zone & { tableCount?: number }).tableCount || 0), 0) / zones.length) : 0}
              </p>
            </div>
          </div>
        </div>
        </div>
        </div>
      </SettingsCard>

      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {('id' in editingZone && editingZone.id) ? '编辑分区' : '新增分区'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {('id' in editingZone && editingZone.id) ? '修改分区信息' : '添加新的分区区域'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zoneName">分区名称</Label>
              <Input
                id="zoneName"
                value={editingZone.name}
                onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                placeholder="例如：VIP区、普通区、竞技区"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoneDesc">分区描述</Label>
              <Input
                id="zoneDesc"
                value={editingZone.description}
                onChange={(e) => setEditingZone({ ...editingZone, description: e.target.value })}
                placeholder="分区的简短描述"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>分区颜色</Label>
              <div className="flex gap-2">
                {["#00D4AA", "#3B82F6", "#8B5CF6", "#F97316", "#EF4444", "#EC4899"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditingZone({ ...editingZone, color })}
                    className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${
                      editingZone.color === color ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingZone.status === 1}
                    onChange={() => setEditingZone({ ...editingZone, status: 1 })}
                    className="w-4 h-4 text-[#00D4AA] focus:ring-[#00D4AA]"
                  />
                  <span className="text-sm text-slate-700">启用</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingZone.status === 0}
                    onChange={() => setEditingZone({ ...editingZone, status: 0 })}
                    className="w-4 h-4 text-slate-500 focus:ring-slate-500"
                  />
                  <span className="text-sm text-slate-700">停用</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setZoneDialogOpen(false);
                setEditingZone({ name: '', color: '#00D4AA', description: '', sort_order: 0, status: 1 });
              }}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveZone}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
