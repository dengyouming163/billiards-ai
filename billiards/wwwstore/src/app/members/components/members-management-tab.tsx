'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/lib/toast-context';
import {
  formatCurrency,
  formatDate,
  maskPhone,
} from '@/lib/utils';
import type { Member, MemberLevel, MemberTier } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Search,
  Download,
  Eye,
  DollarSign,
  Gift,
  Award,
  Users,
  TrendingUp,
  CreditCard,
  Star,
  Trash2,
  RefreshCw,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import {
  fetchMembers,
  fetchMember,
  updateMember,
  deleteMember,
  fetchStatistics,
  createMember,
  fetchMemberLevels,
  fetchMemberRechargeRecords,
  fetchMemberConsumeRecords,
} from '@/lib/api/members';

interface MemberRecord {
  id: string;
  memberId: string;
  type: 'recharge' | 'consume' | 'points_in' | 'points_out' | 'level_up';
  amount: number;
  points?: number;
  balance?: number;
  remark?: string;
  createdAt: string;
}

export function MembersManagementTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { success, warning } = useToast();
  const [members, setMembers] = useState<Member[]>([]);

  const handleAddMember = async () => {
    if (!addMemberForm.name.trim() || !addMemberForm.phone.trim()) { alert("请填写姓名和手机号"); return; }
    try {
      await createMember(addMemberForm as any);
      setAddMemberOpen(false);
      setAddMemberForm({ name: "", phone: "", level: "normal" });
      loadMembers();
    } catch { alert("添加失败"); }
  };

  const handleExportMembers = () => {
    try {
      const headers = ['会员姓名', '手机号', '会员卡号', '会员等级', '余额', '积分', '累计消费', '累计充值', '状态', '注册时间', '到期日期', '生日', '备注'];

      const tierLabels: Record<string, string> = {};
      memberTiers.forEach(t => { tierLabels[t.level] = t.name; });

      const statusLabels: Record<string, string> = {
        active: '正常',
        frozen: '已冻结',
        expired: '已过期',
      };

      const rows = members.map(member => [
        member.name,
        member.phone,
        member.cardNumber,
        tierLabels[member.level] || member.level,
        member.balance != null ? Number(member.balance).toFixed(2) : '0.00',
        member.points != null ? Number(member.points) : 0,
        member.totalConsume != null ? Number(member.totalConsume).toFixed(2) : '0.00',
        member.totalRecharge != null ? Number(member.totalRecharge).toFixed(2) : '0.00',
        statusLabels[member.status] || member.status,
        member.createdAt,
        member.expiry_date || '',
        member.birthday || '',
        member.remark || '',
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `会员数据_${currentStore?.name}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      success('导出成功');
    } catch (error) {
      console.error('Failed to export members:', error);
      warning('导出会员数据失败，请稍后重试');
    }
  };
  const [records, setRecords] = useState<MemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ name: "", phone: "", level: "normal" });
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<{
    total_member: number;
    active_member: number;
    total_balance: number;
    level_stats: Array<{ id: string; name: string; code: string; color: string; count: number }>;
  } | null>(null);

  const [memberTiers, setMemberTiers] = useState<MemberTier[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const [editMemberForm, setEditMemberForm] = useState({
    name: '',
    phone: '',
    level: 'normal' as MemberLevel,
    birthday: '',
    status: 'active' as 'active' | 'frozen' | 'expired',
    remark: '',
  });

  useEffect(() => {
    loadStatistics();
    loadMemberLevels();
  }, [currentStore]);

  useEffect(() => {
    loadMembers();
  }, [currentStore, page, searchQuery, levelFilter, statusFilter]);

  const loadMembers = async (currentPage: number = page) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, page_size: 20 };
      if (searchQuery) params.keyword = searchQuery;
      if (levelFilter !== 'all') params.level_id = levelFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const result = await fetchMembers(params);
      if (result.data) {
        setMembers(result.data);
      }
      if (result.pagination) {
        setTotalPages(result.pagination.total_pages || 1);
        setTotalRecords(result.pagination.total || 0);
      }
    } catch (error) {
      console.error('Failed to load members:', error);
      warning('加载会员数据失败，请稍后重试');
    } finally {
      setLoading(false);
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

  const loadMemberLevels = async () => {
    try {
      const result = await fetchMemberLevels();
      setMemberTiers(result);
    } catch (error) {
      console.error('Failed to load member levels:', error);
      warning('加载会员等级数据失败，请稍后重试');
    }
  };

  const loadMemberDetail = async (memberId: string) => {
    try {
      const member = await fetchMember(memberId);
      setSelectedMember(member);

      const [rechargeResult, consumeResult] = await Promise.all([
        fetchMemberRechargeRecords(memberId),
        fetchMemberConsumeRecords(memberId),
      ]);

      const rechargeRecords: MemberRecord[] = (rechargeResult.data || []).map(r => ({
        id: r.id,
        memberId: r.member_id,
        type: 'recharge',
        amount: r.amount,
        balance: r.balance_after,
        createdAt: r.created_at,
      }));

      const consumeRecords: MemberRecord[] = (consumeResult.data || []).map(r => ({
        id: r.id,
        memberId: r.member_id,
        type: r.consume_type === 'points_exchange' ? 'points_out' : 'consume',
        amount: -r.amount,
        points: r.points_gained > 0 ? r.points_gained : -r.points_deduct,
        balance: r.balance_after,
        createdAt: r.created_at,
      }));

      setRecords([...rechargeRecords, ...consumeRecords].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ).slice(0, 20));
    } catch (error) {
      console.error('Failed to load member detail:', error);
      warning('加载会员详情失败，请稍后重试');
    }
  };

  const getLevelBadge = (level: string) => {
    const tier = memberTiers.find(t => t.level === level);
    return (
      <Badge
        style={tier?.color ? { backgroundColor: `${tier.color}20`, color: tier.color, borderColor: `${tier.color}40` } : undefined}
        className="border"
      >
        {tier?.name || level}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400',
      frozen: 'bg-slate-500/20 text-slate-400',
      expired: 'bg-red-500/20 text-red-400',
    };
    const labels: Record<string, string> = {
      active: '正常',
      frozen: '已冻结',
      expired: '已过期',
    };
    return (
      <Badge className={colors[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleDeleteMember = (memberId: string) => {
    setMemberToDelete(memberId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    setLoading(true);
    try {
      await deleteMember(memberToDelete);
      await loadMembers();
      await loadStatistics();
      success('会员删除成功');
    } catch (error) {
      console.error('Failed to delete member:', error);
      warning('删除会员失败，请重试');
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  const handleViewDetail = async (member: Member) => {
    await loadMemberDetail(member.id);
    // Resolve member.level (code) back to tier.id for the Select
    const resolvedTier = memberTiers.find(t => t.level === member.level);
    setEditMemberForm({
      name: member.name,
      phone: member.phone,
      level: (resolvedTier?.id || member.level) as MemberLevel,
      birthday: member.birthday || '',
      status: member.status,
      remark: member.remark || '',
    });
    setDetailDialogOpen(true);
  };

  const resetEditForm = () => {
    if (selectedMember) {
      setEditMemberForm({
        name: selectedMember.name,
        phone: selectedMember.phone,
        level: selectedMember.level,
        birthday: selectedMember.birthday || '',
        status: selectedMember.status,
        remark: selectedMember.remark || '',
      });
    }
  };

  const handleEditMember = async () => {
    if (!selectedMember) return;

    setLoading(true);
    try {
      await updateMember(selectedMember.id, {
        name: editMemberForm.name,
        phone: editMemberForm.phone,
        level_id: editMemberForm.level,
        birthday: editMemberForm.birthday || undefined,
        status: editMemberForm.status,
        remark: editMemberForm.remark || undefined,
      });
      await loadMembers();
      await loadMemberDetail(selectedMember.id);
      success('会员信息修改成功');
    } catch (error) {
      console.error('Failed to update member:', error);
      warning('修改会员信息失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.cardNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const filterTier = memberTiers.find(t => t.id === levelFilter);
    const matchesLevel = levelFilter === 'all' || member.level === filterTier?.level;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const stats = {
    total_member: statistics?.total_member ?? 0,
    active_member: statistics?.active_member ?? 0,
    total_balance: statistics?.total_balance ?? 0,
    ...statistics,
    level_stats: statistics?.level_stats ?? [],
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">会员管理</h2>
          <p className="text-sm text-slate-500">管理会员信息、充值和消费记录</p>
        </div>
        <Button onClick={() => setAddMemberOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
          <UserPlus className="w-4 h-4 mr-2" />添加会员
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="会员总数"
          value={stats.total_member}
          icon={Users}
          color="slate"
        />
        <StatCard
          label="总余额"
          value={formatCurrency(stats.total_balance)}
          subValue={`${stats.active_member} 活跃`}
          icon={CreditCard}
          color="cyan"
        />
        <StatCard
          label="活跃会员"
          value={stats.active_member}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="累计充值"
          value={formatCurrency(members.reduce((sum, m) => sum + Number(m.totalRecharge || 0), 0))}
          icon={DollarSign}
          color="amber"
        />
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索姓名、手机号、卡号..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 rounded-xl"
            />
          </div>

          <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="会员等级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              {memberTiers.map((tier) => (
                <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[120px] rounded-xl">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">正常</SelectItem>
              <SelectItem value="frozen">已冻结</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => loadMembers()}
            disabled={loading}
            className="rounded-xl"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          <Button
            variant="outline"
            onClick={handleExportMembers}
            className="rounded-xl"
          >
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200/50 bg-slate-50/50 hover:bg-transparent">
              <TableHead className="text-slate-600 font-semibold">会员信息</TableHead>
              <TableHead className="text-slate-600 font-semibold">会员卡号</TableHead>
              <TableHead className="text-slate-600 font-semibold">等级</TableHead>
              <TableHead className="text-slate-600 font-semibold">余额</TableHead>
              <TableHead className="text-slate-600 font-semibold">累计消费</TableHead>
              <TableHead className="text-slate-600 font-semibold">状态</TableHead>
              <TableHead className="text-right text-slate-600 font-semibold">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.map((member) => (
              <TableRow key={member.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-medium shadow-md">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-500">{maskPhone(member.phone)}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-slate-600">
                  {member.cardNumber}
                </TableCell>
                <TableCell>{member.levelName}</TableCell>
                <TableCell className="font-mono text-emerald-600 font-medium">
                  {formatCurrency(member.balance)}
                </TableCell>
                <TableCell className="font-mono text-slate-500">
                  {formatCurrency(member.totalConsume)}
                </TableCell>
                <TableCell>{getStatusBadge(member.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetail(member)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteMember(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 text-slate-400 animate-spin" />
            <p className="text-slate-500">加载中...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-400 opacity-50" />
            <p className="text-slate-500">暂无会员数据</p>
          </div>
        ) : null}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
            <span className="text-sm text-slate-500">共 {totalRecords} 条记录</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg"
              >
                上一页
              </Button>
              <span className="text-sm text-slate-600 px-3">
                第 {page} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg"
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-white border-gray-200 w-[800px] h-[600px] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-slate-900">会员详情</DialogTitle>
            <DialogDescription className="font-mono text-slate-500">
              {selectedMember?.cardNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedMember && (
            <Tabs defaultValue="info" className="w-full flex-1 overflow-auto">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">基本信息</TabsTrigger>
                <TabsTrigger value="edit">编辑信息</TabsTrigger>
                <TabsTrigger value="records">消费记录</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedMember.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-900">{selectedMember.name}</h3>
                      {getLevelBadge(selectedMember.level)}
                    </div>
                    <p className="text-slate-500 mt-1">{selectedMember.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">余额</p>
                    <p className="text-xl font-bold font-mono text-emerald-600">
                      {formatCurrency(selectedMember.balance)}
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">累计充值</p>
                    <p className="text-sm font-mono text-slate-700">
                      {formatCurrency(selectedMember.totalRecharge)}
                    </p>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500">累计消费</p>
                    <p className="text-sm font-mono text-slate-700">
                      {formatCurrency(selectedMember.totalConsume)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">注册时间</span>
                    <p className="text-slate-300 mt-1">{formatDate(selectedMember.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">最后消费</span>
                    <p className="text-slate-300 mt-1">
                      {selectedMember.lastConsumeAt
                        ? formatDate(selectedMember.lastConsumeAt)
                        : '暂无'}
                    </p>
                  </div>
                  {selectedMember.birthday && (
                    <div>
                      <span className="text-slate-500">生日</span>
                      <p className="text-slate-300 mt-1">{selectedMember.birthday}</p>
                    </div>
                  )}
                  {selectedMember.remark && (
                    <div>
                      <span className="text-slate-500">备注</span>
                      <p className="text-slate-300 mt-1">{selectedMember.remark}</p>
                    </div>
                  )}
                </div>

              </TabsContent>

              <TabsContent value="edit" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-600">姓名</Label>
                    <Input
                      value={editMemberForm.name || ''}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, name: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="请输入姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">手机号</Label>
                    <Input
                      value={editMemberForm.phone || ''}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, phone: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="请输入手机号"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">会员等级</Label>
                    <Select
                      value={editMemberForm.level || 'normal'}
                      onValueChange={(v) => setEditMemberForm({ ...editMemberForm, level: v as MemberLevel })}
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {memberTiers.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">生日</Label>
                    <Input
                      type="date"
                      value={editMemberForm.birthday || ''}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, birthday: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-600">状态</Label>
                    <Select
                      value={editMemberForm.status || 'active'}
                      onValueChange={(v) => setEditMemberForm({ ...editMemberForm, status: v as 'active' | 'frozen' | 'expired' })}
                    >
                      <SelectTrigger className="bg-white border-slate-200 text-slate-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">正常</SelectItem>
                        <SelectItem value="frozen">已冻结</SelectItem>
                        <SelectItem value="expired">已过期</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label className="text-slate-600">备注</Label>
                    <Input
                      value={editMemberForm.remark || ''}
                      onChange={(e) => setEditMemberForm({ ...editMemberForm, remark: e.target.value })}
                      className="bg-white border-slate-200 text-slate-900"
                      placeholder="请输入备注信息"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => resetEditForm()}
                  >
                    重置
                  </Button>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600"
                    onClick={handleEditMember}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    保存修改
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="records" className="mt-4">
                <div className="space-y-3">
                  {records.length > 0 ? (
                    records.map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${record.type === 'recharge' ? 'bg-emerald-500/20 text-emerald-600' :
                              record.type === 'consume' ? 'bg-red-500/20 text-red-600' :
                              record.type === 'points_in' ? 'bg-amber-500/20 text-amber-600' :
                              record.type === 'points_out' ? 'bg-orange-500/20 text-orange-600' :
                              'bg-blue-500/20 text-blue-600'}
                          `}>
                            {record.type === 'recharge' ? <DollarSign className="w-4 h-4" /> :
                             record.type === 'consume' ? <TrendingUp className="w-4 h-4" /> :
                             record.type === 'points_in' ? <Gift className="w-4 h-4" /> :
                             record.type === 'points_out' ? <Star className="w-4 h-4" /> :
                             <Award className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">
                              {record.type === 'recharge' ? '充值' :
                               record.type === 'consume' ? '消费' :
                               record.type === 'points_in' ? '积分获得' :
                               record.type === 'points_out' ? '积分使用' : '等级升级'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(record.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-medium ${
                            record.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {record.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(record.amount))}
                          </p>
                          {record.balance !== undefined && (
                            <p className="text-xs text-slate-500">
                              余额: {formatCurrency(record.balance)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      暂无记录
                    </div>
                  )}
                </div>
              </TabsContent>

            </Tabs>
          )}

          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 text-center">
              确定要删除该会员吗？此操作无法撤销。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              取消
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={confirmDeleteMember}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="bg-white border-slate-200 max-w-md">
          <DialogHeader><DialogTitle>添加会员</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="会员姓名" onChange={e => setAddMemberForm(f => ({...f, name: e.target.value}))} />
            <Input placeholder="手机号" type="tel" onChange={e => setAddMemberForm(f => ({...f, phone: e.target.value}))} />
            <Select onValueChange={v => setAddMemberForm(f => ({...f, level: v}))}>
              <SelectTrigger><SelectValue placeholder="选择等级" /></SelectTrigger>
              <SelectContent>
                {memberTiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddMemberOpen(false)} className="flex-1">取消</Button>
              <Button onClick={handleAddMember} className="flex-1 bg-emerald-600 hover:bg-emerald-700">确认添加</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  icon: Icon,
  color = 'slate',
}: {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color?: 'green' | 'red' | 'amber' | 'gray' | 'slate' | 'cyan' | 'blue' | 'purple';
}) {
  const colorMap: Record<string, { bg: string; text: string; light: string }> = {
    green: { bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50' },
    red: { bg: 'from-rose-400 to-red-500', text: 'text-rose-600', light: 'bg-rose-50' },
    amber: { bg: 'from-amber-400 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50' },
    gray: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', light: 'bg-slate-50' },
    slate: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', light: 'bg-slate-50' },
    cyan: { bg: 'from-cyan-400 to-teal-500', text: 'text-cyan-600', light: 'bg-cyan-50' },
    blue: { bg: 'from-blue-400 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50' },
    purple: { bg: 'from-purple-400 to-pink-500', text: 'text-purple-600', light: 'bg-purple-50' },
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${colorMap[color].light}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${colorMap[color].text}`}>{value}</p>
          {subValue && <p className="text-sm text-slate-600 mt-1">{subValue}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
