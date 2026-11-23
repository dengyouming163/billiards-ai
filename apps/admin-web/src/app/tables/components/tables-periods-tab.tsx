'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { SettingsCard, SettingsEmpty } from '../../settings/settings-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchTimePeriods,
  createTimePeriod,
  updateTimePeriod,
  deleteTimePeriod,
  toggleTimePeriod,
  type TimePeriod,
} from '@/lib/api/time-period';
import { get, post } from '@/lib/api/client';

interface TimePeriodForm {
  name: string;
  color: string;
  start_time: string;
  end_time: string;
  coefficient: number;
  priority: number;
}

interface TablesPeriodsTabProps {
  currentStoreId: string | undefined;
  visible: boolean;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

export function TablesPeriodsTab({ currentStoreId, visible, success, warning }: TablesPeriodsTabProps) {
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [periodForm, setPeriodForm] = useState<TimePeriodForm>({
    name: '',
    color: '#22c55e',
    start_time: '09:00',
    end_time: '18:00',
    coefficient: 1,
    priority: 10,
  });
  const [editingPeriod, setEditingPeriod] = useState<TimePeriod | null>(null);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  const loadTimePeriods = async () => {
    if (!currentStoreId) return;

    setLoading(true);
    setError('');
    try {
      const result = await fetchTimePeriods({ store_id: currentStoreId });
      setTimePeriods(Array.isArray(result) ? result : []);
    } catch (err) {
      setError('加载时段配置失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && currentStoreId) {
      loadTimePeriods();
    }
  }, [visible, currentStoreId]);

  const openPeriodDialog = (period?: TimePeriod) => {
    if (period) {
      setEditingPeriod(period);
      setPeriodForm({
        name: period.name,
        color: period.color || '#22c55e',
        start_time: period.start_time,
        end_time: period.end_time,
        coefficient: period.coefficient,
        priority: (period as TimePeriod & { priority?: number }).priority || 10,
      });
    } else {
      setEditingPeriod(null);
      setPeriodForm({
        name: '',
        color: '#22c55e',
        start_time: '09:00',
        end_time: '18:00',
        coefficient: 1,
        priority: 10,
      });
    }
    setValidationErrors([]);
    setPeriodDialogOpen(true);
  };

  const handleSavePeriod = async () => {
    if (!currentStoreId) return;

    setLoading(true);
    setValidationErrors([]);

    try {
      if (editingPeriod) {
        await updateTimePeriod(editingPeriod.id, {
          name: periodForm.name,
          start_time: periodForm.start_time,
          end_time: periodForm.end_time,
          coefficient: periodForm.coefficient || 1.0,
          sort_order: periodForm.priority || 0,
        });
      } else {
        await createTimePeriod({
          store_id: currentStoreId,
          name: periodForm.name,
          start_time: periodForm.start_time,
          end_time: periodForm.end_time,
          coefficient: periodForm.coefficient || 1.0,
          sort_order: periodForm.priority || 0,
        });
      }
      setPeriodDialogOpen(false);
      setEditingPeriod(null);
      await loadTimePeriods();
    } catch (err: any) {
      setValidationErrors(err?.message ? [err.message] : ['保存失败']);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePeriod = async (id: string) => {
    setLoading(true);
    try {
      await deleteTimePeriod(id);
      await loadTimePeriods();
    } catch (err) {
      setError('删除失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePeriod = async (id: string) => {
    setLoading(true);
    try {
      await toggleTimePeriod(id);
      await loadTimePeriods();
    } catch (err) {
      setError('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SettingsCard
        title="时段配置"
        desc="设置不同时段的计费系数"
        actions={
          <Button
            onClick={() => openPeriodDialog()}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增时段
          </Button>
        }
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : timePeriods.length === 0 ? (
          <SettingsEmpty text="暂无时段配置" />
        ) : (
          <div className="divide-y divide-slate-100">
            {timePeriods.map((period) => {
              const p = period as TimePeriod & { status?: number; priority?: number };
              return (
              <div
                key={period.id}
                className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: `${period.color || '#22c55e'}20` }}
                  >
                    <Clock className="w-6 h-6" style={{ color: period.color || '#22c55e' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{period.name}</span>
                      <Badge
                        className={`${p.status === 1 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
                      >
                        {p.status === 1 ? '启用' : '禁用'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${period.color || '#22c55e'}20`,
                          color: period.color || '#22c55e',
                        }}
                      >
                        系数 {Number(period.coefficient).toFixed(2)}x
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {period.start_time} - {period.end_time}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      优先级: {p.priority}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.status === 1}
                    onCheckedChange={() => handleTogglePeriod(period.id)}
                    disabled={loading}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPeriodDialog(period)}
                    disabled={loading}
                    className="h-8 px-2 text-slate-500 hover:text-[#00D4AA]"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePeriod(period.id)}
                    disabled={loading}
                    className="h-8 px-2 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </SettingsCard>

      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPeriod ? "编辑时段" : "新增时段"}
            </DialogTitle>
            <DialogDescription>
              配置时段的时间范围和价格系数
            </DialogDescription>
          </DialogHeader>

          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">验证错误</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {validationErrors.map((err, index) => (
                  <li key={index}>- {err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">时段名称</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                placeholder="如：平时段、高峰段、黄金段"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">开始时间</Label>
                <Input
                  type="time"
                  value={periodForm.start_time}
                  onChange={(e) => setPeriodForm({ ...periodForm, start_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">结束时间</Label>
                <Input
                  type="time"
                  value={periodForm.end_time}
                  onChange={(e) => setPeriodForm({ ...periodForm, end_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">时段颜色</Label>
              <div className="flex gap-2">
                {["#22c55e", "#f97316", "#ef4444", "#8b5cf6", "#3b82f6", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPeriodForm({ ...periodForm, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      periodForm.color === color ? "border-slate-900 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">价格系数</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="5"
                  value={periodForm.coefficient}
                  onChange={(e) =>
                    setPeriodForm({ ...periodForm, coefficient: Math.round(parseFloat(e.target.value) * 100) / 100 || 1 })
                  }
                  placeholder="1.00"
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">优先级</Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={periodForm.priority}
                  onChange={(e) =>
                    setPeriodForm({ ...periodForm, priority: parseInt(e.target.value) || 10 })
                  }
                  placeholder="10"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500">
                <strong>提示：</strong>优先级数值越大，优先级越高。系统不允许时段重叠，请确保时间范围不冲突。
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPeriodDialogOpen(false);
                setEditingPeriod(null);
              }}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSavePeriod}
              disabled={loading}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
