'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/lib/toast-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Settings, Edit, Trash2, Award } from 'lucide-react';
import {
  fetchAssistantLevels,
  createAssistantLevel,
  updateAssistantLevel,
  deleteAssistantLevel,
  initLevels,
  type AssistantLevel,
} from '@/lib/api/assistants';

const colorOptions = [
  { value: '#22c55e', name: '绿色' },
  { value: '#3b82f6', name: '蓝色' },
  { value: '#8b5cf6', name: '紫色' },
  { value: '#f59e0b', name: '橙色' },
  { value: '#ef4444', name: '红色' },
  { value: '#ec4899', name: '粉色' },
  { value: '#14b8a6', name: '青色' },
  { value: '#6366f1', name: '靛蓝' },
];

export function AssistantsLevelsTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { toast } = useToast();

  const [levels, setLevels] = useState<AssistantLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [levelDialogOpen, setLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<AssistantLevel | null>(null);
  const [levelForm, setLevelForm] = useState({
    name: '',
    color: '#22c55e',
    hourly_rate: 60,
    billing_rule: 'half_hour' as 'minute' | 'half_hour',
    description: '',
  });

  const loadLevels = async () => {
    setLoading(true);
    try {
      const res = await fetchAssistantLevels();
      setLevels(res || []);
    } catch (error) {
      console.error('加载等级失败:', error);
      toast('error', '加载助教等级失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevels();
  }, []);

  const openLevelDialog = (level?: AssistantLevel) => {
    if (level) {
      setEditingLevel(level);
      setLevelForm({
        name: level.name,
        color: level.color,
        hourly_rate: level.hourly_rate,
        billing_rule: (level as any).billing_rule || 'half_hour',
        description: level.description,
      });
    } else {
      setEditingLevel(null);
      setLevelForm({
        name: '',
        color: '#22c55e',
        hourly_rate: 60,
        billing_rule: 'half_hour',
        description: '',
      });
    }
    setLevelDialogOpen(true);
  };

  const handleSaveLevel = async () => {
    setLoading(true);
    try {
      if (editingLevel) {
        await updateAssistantLevel(editingLevel.id, levelForm);
        toast('success', '等级更新成功');
      } else {
        await createAssistantLevel(levelForm);
        toast('success', '等级创建成功');
      }
      await loadLevels();
      setLevelDialogOpen(false);
      setEditingLevel(null);
    } catch (error) {
      console.error('保存等级失败:', error);
      toast('error', '保存等级失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    setLoading(true);
    try {
      await deleteAssistantLevel(id);
      toast('success', '等级已删除');
      await loadLevels();
      setLevelDialogOpen(false);
    } catch (error) {
      console.error('删除等级失败:', error);
      toast('error', '删除等级失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInitLevels = async () => {
    setLoading(true);
    try {
      const res = await initLevels();
      if (res) {
        setLevels(res);
        toast('success', '默认等级初始化成功');
      }
    } catch (error) {
      console.error('初始化默认等级失败:', error);
      toast('error', '初始化默认等级失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">助教等级</h2>
          <p className="text-sm text-slate-500">配置助教等级、课时费和颜色标识</p>
        </div>
      </div>

      {/* Level Management Card */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">等级管理</h2>
              <p className="text-sm text-slate-500">配置助教等级和课时费标准</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={handleInitLevels}
              disabled={loading}
            >
              初始化默认等级
            </Button>
            <Button
              size="sm"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              onClick={() => openLevelDialog()}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增等级
            </Button>
          </div>
        </div>

        {loading && levels.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : levels.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无等级配置</p>
            <p className="text-xs mt-1">点击"新增等级"或"初始化默认等级"开始</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1.5">
            {levels.map((level) => (
              <div
                key={level.id}
                className="p-2 rounded-lg border relative group transition-colors"
                style={{ borderColor: `${level.color}40`, backgroundColor: `${level.color}10` }}
              >
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openLevelDialog(level)}
                    className="p-0.5 rounded bg-white/80 hover:bg-white shadow-sm"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mb-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: level.color }}
                  />
                  <span className="font-medium text-xs truncate">{level.name}</span>
                </div>
                <p className="text-sm font-bold" style={{ color: level.color }}>
                  ¥{level.hourly_rate}
                  <span className="text-xs font-normal opacity-50">/h</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Level Dialog */}
      <Dialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {editingLevel ? '编辑等级' : '新增等级'}
            </DialogTitle>
            <DialogDescription>
              {editingLevel ? '修改等级配置信息' : '添加新的助教等级'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">等级名称</label>
              <Input
                value={levelForm.name}
                onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                placeholder="如：初级、中级、高级"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">课时费 (元/小时)</label>
              <Input
                type="number"
                value={levelForm.hourly_rate}
                onChange={(e) => setLevelForm({ ...levelForm, hourly_rate: Number(e.target.value) })}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">计费方式</label>
              <div className="grid grid-cols-2 gap-4">
                {(['half_hour', 'minute'] as const).map((rule) => (
                  <button
                    key={rule}
                    type="button"
                    onClick={() => setLevelForm({ ...levelForm, billing_rule: rule })}
                    className={`p-4 rounded-xl text-left border-2 transition-all ${
                      levelForm.billing_rule === rule
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">
                      {rule === 'half_hour' ? '半小时计费' : '按分钟计费'}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {rule === 'half_hour' ? '不满半小时按半小时算' : '精确到分钟'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">等级颜色</label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setLevelForm({ ...levelForm, color: color.value })}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      levelForm.color === color.value
                        ? 'ring-2 ring-offset-2 ring-slate-400 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">等级描述</label>
              <Input
                value={levelForm.description}
                onChange={(e) => setLevelForm({ ...levelForm, description: e.target.value })}
                placeholder="简要描述该等级的特点"
                className="rounded-xl"
              />
            </div>

            {editingLevel && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">删除此等级</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-100"
                    onClick={() => {
                      handleDeleteLevel(editingLevel.id);
                      setLevelDialogOpen(false);
                    }}
                  >
                    确认删除
                  </Button>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  注意：删除后，该等级的助教将变为默认等级
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLevelDialogOpen(false)}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveLevel}
              disabled={!levelForm.name || loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
