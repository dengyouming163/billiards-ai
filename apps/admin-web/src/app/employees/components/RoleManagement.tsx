'use client';

import { useState, useEffect } from 'react';
import {
  fetchRoles,
  createRole,
  updateRole,
  deleteRole,
  fetchRolePermissions,
  saveRolePermissions,
  type Role,
} from '@/lib/api/roles';
import { fetchPermissions, getPermissionTree } from '@/lib/api/permissions';
import type { Permission } from '@/lib/types';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  Check,
  Minus,
  X,
  Folder,
  FileText,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionTree, setPermissionTree] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [permissionData, setPermissionData] = useState<{
    pc: { tree: Permission[]; assigned_ids: string[] };
    mobile: { tree: Permission[]; assigned_ids: string[] };
  } | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [expandedPermissions, setExpandedPermissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData, treeData] = await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        getPermissionTree(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setPermissionTree(treeData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedPermissions);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedPermissions(newExpanded);
  };

  // 递归收集所有子权限 ID
  const collectAllChildren = (items: Permission[], result: string[]) => {
    for (const item of items) {
      result.push(item.id);
      if (item.children && item.children.length > 0) {
        collectAllChildren(item.children, result);
      }
    }
  };

  // 获取指定权限的所有子权限 ID
  const getAllChildrenIds = (parentId: string): string[] => {
    const ids: string[] = [];
    const findAndCollect = (items: Permission[]) => {
      for (const item of items) {
        if (item.id === parentId) {
          if (item.children) collectAllChildren(item.children, ids);
          return true;
        }
        if (item.children && findAndCollect(item.children)) return true;
      }
      return false;
    };
    const allItems = [
      ...(permissionData?.pc?.tree || []),
      ...(permissionData?.mobile?.tree || []),
      ...permissionTree,
    ];
    findAndCollect(allItems);
    return ids;
  };

  const togglePermission = (id: string) => {
    if (isSystemRole) return;
    setRolePermissions(prev => {
      const isChecked = prev.includes(id);
      if (isChecked) {
        // 取消勾选: 移除自身 + 所有子权限
        const childrenIds = getAllChildrenIds(id);
        return prev.filter(p => p !== id && !childrenIds.includes(p));
      } else {
        // 勾选: 添加自身 + 所有子权限
        const childrenIds = getAllChildrenIds(id);
        return [...new Set([...prev, id, ...childrenIds])];
      }
    });
  };

  const toggleAllPermissions = (parentId: string, children: Permission[]) => {
    const allChildIds = getAllLeafIds(children);
    const hasAllChildren = allChildIds.every((id) => rolePermissions.includes(id));
    if (hasAllChildren) {
      // 全选 → 全部取消
      setRolePermissions(rolePermissions.filter((id) => !allChildIds.includes(id)));
    } else {
      // 非全选 → 全部勾选
      const newIds = allChildIds.filter((id) => !rolePermissions.includes(id));
      setRolePermissions([...rolePermissions, ...newIds]);
    }
  };

  // 递归获取所有叶子节点ID（跳过纯菜单父节点）
  const getAllLeafIds = (items: Permission[]): string[] => {
    const ids: string[] = [];
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        ids.push(...getAllLeafIds(item.children));
      } else {
        ids.push(item.id);
      }
    }
    return ids;
  };

  // 判断父节点选中状态: 'all' | 'partial' | 'none'
  const getParentCheckState = (item: Permission): 'all' | 'partial' | 'none' => {
    if (!item.children || item.children.length === 0) {
      return rolePermissions.includes(item.id) ? 'all' : 'none';
    }
    const leafIds = getAllLeafIds(item.children);
    const checkedCount = leafIds.filter((id) => rolePermissions.includes(id)).length;
    if (checkedCount === 0) return 'none';
    if (checkedCount === leafIds.length) return 'all';
    return 'partial';
  };

  const handleSaveRole = async () => {
    if (!formData.name) {
      toast({ title: '请填写角色名称', variant: 'warning' });
      return;
    }
    if (selectedRole && (selectedRole as any).is_system === 1) {
      toast({ title: '系统预设角色不可编辑', variant: 'warning' });
      return;
    }
    try {
      if (selectedRole) {
        await updateRole(selectedRole.id, { name: formData.name, description: formData.description, status: formData.status });
      } else {
        await createRole({ name: formData.name, description: formData.description, status: formData.status });
      }
      await loadData();
      setAddDialogOpen(false);
      setEditDialogOpen(false);
      setSelectedRole(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save role:', error);
      toast({ title: '保存失败', variant: 'error' });
    }
  };

  const handleDeleteRole = async (id: string) => {
    const role = roles.find(r => r.id === id);
    if ((role as any)?.is_system === 1) {
      toast({ title: '系统预设角色不可删除', variant: 'warning' });
      return;
    }
    if (!confirm('确定要删除这个角色吗？')) return;
    try {
      await deleteRole(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete role:', error);
      toast({ title: '删除失败', variant: 'error' });
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    if ((selectedRole as any).is_system === 1) {
      toast({ title: '系统预设角色权限不可修改', variant: 'warning' });
      return;
    }
    try {
      await saveRolePermissions(selectedRole.id, rolePermissions);
      toast({ title: '权限保存成功', variant: 'success' });
      setPermissionDialogOpen(false);
    } catch (error) {
      console.error('Failed to save permissions:', error);
      toast({ title: '保存失败', variant: 'error' });
    }
  };

  const openDetailDialog = async (role: Role) => {
    setSelectedRole(role);
    setDetailDialogOpen(true);
  };

  const openAddDialog = () => { resetForm(); setSelectedRole(null); setAddDialogOpen(true); };
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description || '', status: role.status });
    setEditDialogOpen(true);
  };

  const openPermissionDialog = async (role: Role) => {
    setSelectedRole(role);
    setIsSystemRole((role as any).is_system === 1);
    try {
      const res: any = await fetchRolePermissions(role.id);
      if (res?.pc && res?.mobile) {
        // 新格式: { pc: { tree, assigned_ids }, mobile: { tree, assigned_ids } }
        setPermissionData(res);
        const allAssigned = [
          ...(res.pc.assigned_ids || []),
          ...(res.mobile.assigned_ids || []),
        ];
        setRolePermissions(allAssigned);
        // Expand all parent nodes
        const expandIds = new Set<string>();
        [...(res.pc.tree || []), ...(res.mobile.tree || [])].forEach((p: Permission) => {
          if (p.children && p.children.length > 0) expandIds.add(p.id);
        });
        setExpandedPermissions(expandIds);
      } else if (res?.all_permissions) {
        setPermissionTree(res.all_permissions);
        setRolePermissions(res.assigned_ids || []);
      } else {
        setRolePermissions(res || []);
      }
    } catch (error) {
      console.error('Failed to get role permissions:', error);
      setRolePermissions([]);
    }
    setPermissionDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', status: 'active' });
  };

  const renderPermissionTreeItems = (items: Permission[], disabled: boolean, level = 0) => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      const checkState = getParentCheckState(item);
      return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
            disabled ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100'
          }`}
          style={{ marginLeft: level * 16 }}
          onClick={() => {
            if (disabled) return;
            if (hasChildren) {
              // 父节点：点击行 → 展开/折叠
              toggleExpand(item.id);
            } else {
              // 叶子节点：点击行 → 切换勾选
              togglePermission(item.id);
            }
          }}
        >
          {/* Checkbox */}
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              checkState === 'all'
                ? 'bg-blue-600 border-blue-600'
                : checkState === 'partial'
                ? 'bg-blue-400 border-blue-400'
                : 'border-gray-300 hover:border-blue-400'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (disabled) return;
              if (hasChildren) {
                toggleAllPermissions(item.id, item.children!);
              } else {
                togglePermission(item.id);
              }
            }}
          >
            {checkState === 'all' && <Check className="w-3 h-3 text-white" />}
            {checkState === 'partial' && <Minus className="w-3 h-3 text-white" />}
          </div>
          {/* Expand/collapse + icon */}
          {hasChildren ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }} className="p-1 hover:bg-gray-200 rounded">
                <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedPermissions.has(item.id) ? 'rotate-90' : ''}`} />
              </button>
              <Folder className="w-4 h-4 text-amber-500" />
            </>
          ) : (
            <FileText className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-sm text-gray-700 font-medium">{item.name}</span>
          {item.code && <Badge variant="outline" className="ml-auto text-xs text-gray-400">{item.code}</Badge>}
        </div>
        {hasChildren && expandedPermissions.has(item.id) && (
          <div>{renderPermissionTreeItems(item.children || [], disabled, level + 1)}</div>
        )}
      </div>
      );
    });
  };

  // Legacy fallback renderer (keeps backward compat)
  const renderPermissionTreeLegacy = (items: Permission[], disabled: boolean) => {
    return renderPermissionTreeItems(items, disabled);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-100 text-emerald-700', text: '启用', label: '启用' },
      inactive: { bg: 'bg-gray-100 text-gray-600', text: '禁用', label: '禁用' },
    };
    const config = configs[status] || configs.active;
    return <Badge className={`${config.bg} rounded-full px-3 py-1`}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-violet-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{roles.length}</p>
              <p className="text-sm text-white/80">角色总数</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{permissions.length}</p>
              <p className="text-sm text-white/80">权限总数</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{roles.filter(r => r.status === 'active').length}</p>
              <p className="text-sm text-white/80">启用角色</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索角色名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-gray-50 border-gray-200 rounded-xl" />
          </div>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            添加角色
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" />
            <p className="text-gray-400">加载中...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-100">
                <TableHead className="text-gray-500 font-medium">角色名称</TableHead>
                <TableHead className="text-gray-500 font-medium">描述</TableHead>
                <TableHead className="text-gray-500 font-medium">状态</TableHead>
                <TableHead className="text-right text-gray-500 font-medium">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white font-medium shadow-md">
                        {role.name.charAt(0)}
                      </div>
                      <div className="flex items-center">
                        <p className="font-medium text-gray-900">{role.name}</p>
                        {(role as any).is_system === 1 && (
                          <Badge className="ml-2 bg-purple-100 text-purple-600 text-xs rounded-full px-2">系统</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{role.description || '-'}</TableCell>
                  <TableCell>{getStatusBadge(role.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 rounded-xl" onClick={() => openDetailDialog(role)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {/* 权限设置 — 所有角色可查看，系统角色只读 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-purple-600 rounded-xl"
                        onClick={() => openPermissionDialog(role)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      {(role as any).is_system !== 1 && (
                        <>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600 rounded-xl" onClick={() => openEditDialog(role)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600 rounded-xl" onClick={() => handleDeleteRole(role.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400">暂无角色数据</p>
            <Button onClick={openAddDialog} className="mt-4 bg-gradient-to-r from-purple-500 to-violet-500">
              <Plus className="w-4 h-4 mr-2" />
              添加角色
            </Button>
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">角色详情</DialogTitle>
            <DialogDescription className="text-gray-500">{selectedRole?.name}</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {selectedRole.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">{selectedRole.name}</h3>
                    {(selectedRole as any).is_system === 1 && (
                      <Badge className="bg-purple-100 text-purple-600 text-xs rounded-full px-2">系统角色</Badge>
                    )}
                  </div>
                  <div className="mt-1">{getStatusBadge(selectedRole.status)}</div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400">角色描述</p>
                <p className="text-sm text-gray-700 mt-1">{selectedRole.description || '暂无描述'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-400">权限数量</p>
                <p className="text-xl font-bold text-purple-600 mt-1">{rolePermissions.length} 个权限</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="rounded-xl">关闭</Button>
            {selectedRole && (selectedRole as any).is_system !== 1 && (
              <>
                <Button className="bg-blue-600" onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedRole); }}>
                  <Edit className="w-4 h-4 mr-2" />
                  编辑角色
                </Button>
                <Button className="bg-purple-600" onClick={() => { setDetailDialogOpen(false); openPermissionDialog(selectedRole); }}>
                  <Shield className="w-4 h-4 mr-2" />
                  权限设置
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">新增角色</DialogTitle>
            <DialogDescription className="text-gray-500">创建新的系统角色</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">角色名称 <span className="text-red-500">*</span></Label>
              <Input placeholder="请输入角色名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">角色描述</Label>
              <Input placeholder="请输入角色描述（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">角色状态</Label>
              <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={() => setFormData({ ...formData, status: 'active' })}>启用</button>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.status === 'inactive' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={() => setFormData({ ...formData, status: 'inactive' })}>禁用</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleSaveRole} className="bg-gradient-to-r from-purple-500 to-violet-500">添加角色</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">编辑角色</DialogTitle>
            <DialogDescription className="text-gray-500">修改角色信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">角色名称 <span className="text-red-500">*</span></Label>
              <Input placeholder="请输入角色名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">角色描述</Label>
              <Input placeholder="请输入角色描述（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">角色状态</Label>
              <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.status === 'active' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={() => setFormData({ ...formData, status: 'active' })}>启用</button>
                <button className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.status === 'inactive' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`} onClick={() => setFormData({ ...formData, status: 'inactive' })}>禁用</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleSaveRole} className="bg-gradient-to-r from-blue-500 to-cyan-500">保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">权限分配</DialogTitle>
            <DialogDescription className="text-gray-500">为 {selectedRole?.name} 分配权限</DialogDescription>
          </DialogHeader>

          {/* 系统角色提示条 */}
          {isSystemRole && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm mx-4 mt-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>系统预设角色，仅可查看，不可编辑</span>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex gap-4 min-h-[400px] p-4">
            {/* 左侧：商家后台权限 */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-500" />
                商家后台权限
              </h4>
              {permissionData?.pc?.tree ? (
                renderPermissionTreeItems(permissionData.pc.tree, isSystemRole)
              ) : (
                renderPermissionTreeLegacy(permissionTree.filter(p => (p as any).module !== 'mobile'), isSystemRole)
              )}
            </div>
            {/* 右侧：移动端权限 */}
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                移动端权限
              </h4>
              {permissionData?.mobile?.tree ? (
                renderPermissionTreeItems(permissionData.mobile.tree, isSystemRole)
              ) : (
                renderPermissionTreeLegacy(permissionTree.filter(p => (p as any).module === 'mobile'), isSystemRole)
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPermissionDialogOpen(false)} className="rounded-xl">取消</Button>
            {!isSystemRole && (
              <Button onClick={handleSavePermissions} className="bg-gradient-to-r from-purple-500 to-violet-500">
                <Check className="w-4 h-4 mr-2" />
                保存权限
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}