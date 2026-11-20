'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/lib/toast-context';
import { formatCurrency } from '@/lib/utils';
import type { MemberTier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  Award,
  RefreshCw,
} from 'lucide-react';
import {
  fetchStatistics,
  fetchMemberLevels,
  createMemberLevel,
  updateMemberLevel,
  deleteMemberLevel,
} from '@/lib/api/members';

export function MembersLevelsTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();

  const [memberTiers, setMemberTiers] = useState<MemberTier[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTier, setEditingTier] = useState<MemberTier | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);

  const [statistics, setStatistics] = useState<{
    total_member: number;
    active_member: number;
    total_balance: number;
    level_stats: Array<{ id: string; name: string; code: string; color: string; count: number }>;
  } | null>(null);

  const [tierForm, setTierForm] = useState({
    name: '',
    discount: 1,
    pointsRate: 1,
    minAmount: 0,
    minPoints: 0,
  });

  useEffect(() => {
    loadMemberLevels();
    loadStatistics();
  }, [currentStore]);

  const loadMemberLevels = async () => {
    try {
      const result = await fetchMemberLevels();
      setMemberTiers(result);
    } catch (error) {
      console.error('Failed to load member levels:', error);
      warning('加载会员等级数据失败，请稍后重试');
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await fetchStatistics();
      setStatistics(result);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      warning('加载统计数据失败，请稍后重试');
    }
  };

  const openAddTierDialog = () => {
    setEditingTier(null);
    setTierForm({
      name: '',
      discount: 1,
      pointsRate: 1,
      minAmount: 0,
      minPoints: 0,
    });
    setTierDialogOpen(true);
  };

  const openEditTierDialog = (tier: MemberTier) => {
    setEditingTier(tier);
    setTierForm({
      name: tier.name,
      discount: tier.discount,
      pointsRate: tier.pointsRate,
      minAmount: tier.minAmount,
      minPoints: tier.minPoints,
    });
    setTierDialogOpen(true);
  };

  const handleSaveTier = async () => {
    if (!tierForm.name || !currentStore) return;

    setLoading(true);
    try {
      if (editingTier) {
        const tierUpdate = {
          name: tierForm.name,
          discount: tierForm.discount,
          pointsRate: tierForm.pointsRate,
          minAmount: tierForm.minAmount,
          minPoints: tierForm.minPoints,
        };
        await updateMemberLevel(editingTier.id, tierUpdate);
        setMemberTiers(prev => prev.map(t =>
          t.id === editingTier.id ? { ...t, ...tierUpdate } : t
        ));
        success('等级更新成功');
      } else {
        const sortOrder = memberTiers.length + 1;
        const code = `custom_${Date.now()}`;
        const result = await createMemberLevel({
          name: tierForm.name,
          discount: tierForm.discount,
          pointsRate: tierForm.pointsRate,
          minAmount: tierForm.minAmount,
          minPoints: tierForm.minPoints,
          code,
          sort_order: sortOrder,
        });
        // Map server response (snake_case from createLevel) to MemberTier (camelCase)
        const newTier: MemberTier = {
          id: (result as any).id,
          storeId: (result as any).store_id || currentStore.id,
          level: (result as any).code || code,
          name: (result as any).name || tierForm.name,
          discount: ((result as any).discount_rate ?? tierForm.discount * 100) / 100,
          pointsRate: (result as any).points_multiplier ?? tierForm.pointsRate,
          minAmount: (result as any).min_amount ?? tierForm.minAmount,
          minPoints: (result as any).min_points ?? tierForm.minPoints,
          status: (result as any).status === 1 ? 'active' : 'inactive',
        };
        setMemberTiers(prev => [...prev, newTier]);
        success('等级创建成功');
      }
      setTierDialogOpen(false);
      loadStatistics();
    } catch (error) {
      console.error('Failed to save tier:', error);
      warning('保存等级失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    const tier = memberTiers.find(t => t.id === tierId);
    if (!tier) return;

    // Check if any members are assigned to this level via statistics
    const levelStat = statistics?.level_stats?.find(s => s.id === tierId);
    if (levelStat && levelStat.count > 0) {
      warning(`已有 ${levelStat.count} 名会员使用「${tier.name}」等级，无法删除`);
      return;
    }

    setLoading(true);
    try {
      await deleteMemberLevel(tierId);
      setMemberTiers(prev => prev.filter(t => t.id !== tierId));
      success('等级删除成功');
      loadStatistics();
    } catch (error) {
      console.error('Failed to delete tier:', error);
      warning('删除等级失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const levelStats = statistics?.level_stats ?? [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">会员等级</h2>
          <p className="text-sm text-slate-500">配置会员等级折扣和升级规则</p>
        </div>
        <Button onClick={openAddTierDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <Plus className="w-4 h-4 mr-2" />新增等级
        </Button>
      </div>

      {/* Level Distribution Card */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">会员等级分布</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadStatistics}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          {levelStats.map((level) => (
            <div
              key={level.id}
              className="flex items-center gap-3 px-4 py-2 bg-white/80 rounded-xl shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: level.color + '30', color: level.color }}>
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: level.color }}>
                  {level.name}
                </p>
                <p className="text-xl font-bold text-slate-800">{level.count}</p>
              </div>
            </div>
          ))}
          {levelStats.length === 0 && (
            <p className="text-sm text-slate-500 py-4">暂无等级数据</p>
          )}
        </div>
      </div>

      {/* Tier List */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">等级配置</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMemberLevels}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="space-y-4">
          {memberTiers.map((tier) => (
            <div key={tier.id} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge style={tier.color ? { backgroundColor: `${tier.color}20`, color: tier.color, borderColor: `${tier.color}40` } : undefined} className="border">
                    {tier.name}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    折扣: {tier.discount === 1 ? '无折扣' : `${(tier.discount * 10).toFixed(1)}折`}
                  </span>
                  <span className="text-sm text-slate-500">
                    积分: {tier.pointsRate}倍
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditTierDialog(tier)}
                    className="h-8 px-2 text-slate-500 hover:text-slate-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTier(tier.id)}
                    className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">累计消费满</span>
                  <span className="text-slate-700 font-mono">¥{(tier.minAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">最低积分</span>
                  <span className="text-slate-700 font-mono">{(tier.minPoints || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}

          {memberTiers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              暂无等级配置，点击上方按钮新增
            </div>
          )}
        </div>
      </div>

      {/* Tier Add/Edit Dialog */}
      <Dialog open={tierDialogOpen} onOpenChange={setTierDialogOpen}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">
              {editingTier ? '编辑等级' : '新增等级'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-700">等级名称 *</Label>
              <Input
                placeholder="如：白银会员"
                value={tierForm.name}
                onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">消费折扣</Label>
              <Select
                value={tierForm.discount.toString()}
                onValueChange={(v) => setTierForm({ ...tierForm, discount: parseFloat(v) })}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">无折扣</SelectItem>
                  <SelectItem value="0.98">98折</SelectItem>
                  <SelectItem value="0.95">95折</SelectItem>
                  <SelectItem value="0.9">9折</SelectItem>
                  <SelectItem value="0.85">85折</SelectItem>
                  <SelectItem value="0.8">8折</SelectItem>
                  <SelectItem value="0.75">75折</SelectItem>
                  <SelectItem value="0.7">7折</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700">累计消费满（升级条件）</Label>
              <Input
                type="number"
                placeholder="0"
                value={tierForm.minAmount || ''}
                onChange={(e) => setTierForm({ ...tierForm, minAmount: Number(e.target.value) || 0 })}
                className="rounded-lg font-mono"
              />
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialogOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleSaveTier}
              disabled={!tierForm.name || loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {editingTier ? '保存修改' : '确认添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
