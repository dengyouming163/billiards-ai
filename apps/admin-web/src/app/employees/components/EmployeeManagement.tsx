'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { fetchEmployees, fetchEmployee, createEmployee, updateEmployee, deleteEmployee, resetEmployeePassword } from '@/lib/api/employees';
import { fetchRoles, type Role as ApiRole } from '@/lib/api/roles';
import { formatDate } from '@/lib/utils';
import { ROLE_CONFIG, type EmployeeRole } from '@/lib/types';
import type { Employee, Store } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  Plus,
  Download,
  Eye,
  Edit,
  Trash2,
  Users,
  UserCog,
  Calendar,
  Clock,
  KeyRound,
} from 'lucide-react';


export default function EmployeeManagement() {
  const { state } = useApp();
  const { currentStore, stores } = state;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [employeeToReset, setEmployeeToReset] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'cashier' as Employee['role'],
    gender: 'male' as string,
    position: '' as string,
    idCard: '',
    salary: 0,
    status: 'active' as Employee['status'],
  });

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, [currentStore?.id]);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      setEmployees(data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const data = await fetchRoles();
      setRoles(data);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const getRoleLabel = (employee: Employee) => {
    if (employee.role_name) return employee.role_name;
    const code = (employee.role_code || employee.role) as string;
    if (code) return ROLE_CONFIG[code as EmployeeRole]?.label || code;
    return '未知';
  };

  const getRoleGradient = (employee: Employee) => {
    const code = (employee.role_code || employee.role) as string;
    return ROLE_CONFIG[code as EmployeeRole]?.gradient || 'from-slate-500 to-slate-600';
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.name.toLowerCase().includes(searchQuery.toLowerCase()) || employee.phone.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const today = new Date().toISOString().split('T')[0];
  const todayAttendedCount = employees.filter(
    e => e.attendances?.some(a => a.date === today)
  ).length;
  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    todayAttendance: employees.some(e => e.attendances?.length)
      ? Math.round((todayAttendedCount / (employees.filter(e => e.status === 'active').length || 1)) * 100)
      : null,
    monthlySalary: employees.reduce((sum, e) => sum + (e.salary || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-emerald-100 text-emerald-700', text: '在职' },
      inactive: { bg: 'bg-gray-100 text-gray-600', text: '离职' },
      vacation: { bg: 'bg-amber-100 text-amber-700', text: '休假中' },
    };
    const config = configs[status] || configs.active;
    return <Badge className={`${config.bg} rounded-full px-3 py-1`}>{config.text}</Badge>;
  };

  const handleSaveEmployee = async () => {
    if (!formData.name || !formData.phone) {
      alert('请填写必填项');
      return;
    }
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          gender: formData.gender,
          position: formData.position || undefined,
          salary: formData.salary,
          status: formData.status,
          id_card: formData.idCard || undefined,
          store_ids: selectedStoreIds,
        });
      } else {
        await createEmployee({
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          gender: formData.gender,
          position: formData.position || undefined,
          salary: formData.salary,
          status: formData.status,
          store_id: currentStore?.id || '',
          hire_date: new Date().toISOString().split('T')[0],
          id_card: formData.idCard || undefined,
          store_ids: selectedStoreIds,
        });
      }
      await loadEmployees();
      setAddEmployeeOpen(false);
      setEditingEmployee(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save employee:', error);
      alert('保存失败');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('确定要删除这个员工吗？')) return;
    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (error) {
      console.error('Failed to delete employee:', error);
      alert('删除失败');
    }
  };

  const handleResetPassword = async () => {
    if (!employeeToReset) return;
    try {
      await resetEmployeePassword(employeeToReset.id);
      setResetPasswordOpen(false);
      setEmployeeToReset(null);
      // 显示成功提示（由 API 层自动处理）
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert('密码重置失败');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', role: 'cashier', gender: 'male', position: '', idCard: '', salary: 0, status: 'active' });
    setSelectedStoreIds([]);
  };

  const openAddDialog = () => { resetForm(); setEditingEmployee(null); setAddEmployeeOpen(true); };
  const openEditDialog = async (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      phone: employee.phone,
      role: employee.role,
      gender: employee.gender || 'male',
      position: employee.position || '',
      idCard: employee.id_card || '',
      salary: employee.salary || 0,
      status: employee.status,
    });
    // 拉取详情获取 store_ids 回填可管理门店
    try {
      const detail: any = await fetchEmployee(employee.id);
      setSelectedStoreIds(detail?.store_ids || []);
    } catch {
      setSelectedStoreIds((employee as any).store_ids || []);
    }
    setAddEmployeeOpen(true);
  };

  const handleExportEmployees = () => {
    try {
      const headers = ['姓名', '角色', '手机号', '月薪', '状态', '入职日期', '身份证号'];
      const rows = filteredEmployees.map(emp => [
        emp.name,
        getRoleLabel(emp),
        emp.phone,
        emp.salary?.toString() || '0',
        emp.status === 'active' ? '在职' : emp.status === 'vacation' ? '休假中' : '离职',
        emp.hire_date || '',
        emp.id_card || '',
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const today = new Date().toISOString().split('T')[0];
      link.download = `员工导出_${today}.csv`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export employees:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="搜索姓名、手机号..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-slate-50/80 border-slate-200/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[140px] bg-slate-50/80 border-slate-200/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20">
              <SelectValue placeholder="员工角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] bg-slate-50/80 border-slate-200/60 rounded-xl focus:ring-2 focus:ring-emerald-500/20">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">在职</SelectItem>
              <SelectItem value="inactive">离职</SelectItem>
              <SelectItem value="vacation">休假</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportEmployees} className="bg-white/80 border-slate-200/60 hover:bg-slate-50 rounded-xl">
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button onClick={openAddDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg shadow-emerald-500/25 rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            添加员工
          </Button>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
              <Clock className="w-8 h-8 text-white animate-spin" />
            </div>
            <p className="text-slate-400">加载中...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50 border-b border-slate-200/60">
                <TableHead className="text-slate-500 font-medium">员工信息</TableHead>
                <TableHead className="text-slate-500 font-medium">角色</TableHead>
                <TableHead className="text-slate-500 font-medium">联系电话</TableHead>
                <TableHead className="text-slate-500 font-medium">入职日期</TableHead>
                <TableHead className="text-slate-500 font-medium">状态</TableHead>
                <TableHead className="text-right text-slate-500 font-medium">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getRoleGradient(employee)} flex items-center justify-center text-white font-semibold shadow-lg`}>
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{employee.name}</p>
                        {employee.description && <p className="text-xs text-slate-400">{employee.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`bg-gradient-to-r ${getRoleGradient(employee)} text-white rounded-full px-3 py-1 font-medium`}>
                      {getRoleLabel(employee)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 font-medium">{employee.phone}</TableCell>
                  <TableCell className="text-slate-500">{formatDate(employee.hire_date)}</TableCell>
                  <TableCell>{getStatusBadge(employee.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl" onClick={() => { setSelectedEmployee(employee); setDetailDialogOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl" onClick={() => openEditDialog(employee)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl" onClick={() => { setEmployeeToReset(employee); setResetPasswordOpen(true); }}>
                        <KeyRound className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDeleteEmployee(employee.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filteredEmployees.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-slate-400 mt-2">暂无员工数据</p>
            <Button onClick={openAddDialog} className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg shadow-emerald-500/25 rounded-xl">
              <Plus className="w-4 h-4 mr-2" />
              添加员工
            </Button>
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">员工详情</DialogTitle>
            <DialogDescription className="text-gray-500">{selectedEmployee?.name}</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-1 bg-gray-100 rounded-xl p-1">
                <TabsTrigger value="info" className="rounded-lg data-[state=active]:bg-white">基本信息</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getRoleGradient(selectedEmployee)} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">{selectedEmployee.name}</h3>
                      <Badge className={`bg-gradient-to-r ${getRoleGradient(selectedEmployee)} text-white rounded-full px-3 py-1`}>
                        {getRoleLabel(selectedEmployee)}
                      </Badge>
                    </div>
                    <p className="text-gray-500 mt-1">{selectedEmployee.phone}</p>
                    {selectedEmployee.description && <p className="text-sm text-gray-400 mt-2">{selectedEmployee.description}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">入职日期</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedEmployee.hire_date)}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-400">员工状态</p>
                    <div className="mt-1">{getStatusBadge(selectedEmployee.status)}</div>
                  </div>
                  {selectedEmployee.salary && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400">基本工资</p>
                      <p className="text-sm font-mono font-semibold text-emerald-600 mt-1">¥{selectedEmployee.salary.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-700 mb-3">所属角色</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`bg-gradient-to-r ${getRoleGradient(selectedEmployee)} text-white rounded-full px-3 py-1`}>
                      {getRoleLabel(selectedEmployee)}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="rounded-xl">关闭</Button>
            {selectedEmployee && (
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedEmployee); }}>
                <Edit className="w-4 h-4 mr-2" />
                编辑员工
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editingEmployee ? '编辑员工' : '新增员工'}</DialogTitle>
            <DialogDescription className="text-gray-500">{editingEmployee ? '修改员工信息' : '添加新员工到当前门店'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">姓名 <span className="text-red-500">*</span></Label>
              <Input placeholder="请输入员工姓名" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">手机号 <span className="text-red-500">*</span></Label>
              <Input
                placeholder="请输入手机号码"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                readOnly={!!editingEmployee}
                className={`bg-gray-50 border-gray-200 rounded-xl ${editingEmployee ? 'text-gray-400 cursor-not-allowed' : ''}`}
              />
            </div>
            {!editingEmployee && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>初始密码为 <code className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">888888</code>，请提醒员工登录后及时修改密码</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-gray-700">角色</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value as Employee['role'] })}>
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.code || r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">性别</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl">
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">职位</Label>
                <Input placeholder="如：店长、服务员" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">身份证号</Label>
              <Input placeholder="请输入身份证号" value={formData.idCard} onChange={(e) => setFormData({ ...formData, idCard: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">月薪（元）</Label>
              <Input type="number" placeholder="请输入月薪" value={formData.salary || ''} onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">可管理门店</Label>
              {(formData.role as string) === 'boss' ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500">
                  Boss 自动管理所有门店
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedStoreIds.includes(store.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStoreIds([...selectedStoreIds, store.id]);
                          } else {
                            setSelectedStoreIds(selectedStoreIds.filter(id => id !== store.id));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{store.name}</span>
                    </label>
                  ))}
                  {stores.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">暂无门店数据</p>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">状态</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Employee['status'] })}>
                <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在职</SelectItem>
                  <SelectItem value="vacation">休假中</SelectItem>
                  <SelectItem value="inactive">离职</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEmployeeOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleSaveEmployee} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              {editingEmployee ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              重置密码
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              确定要重置 <span className="font-semibold text-gray-700">{employeeToReset?.name}</span> 的登录密码吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>重置后密码将恢复为 <code className="font-mono font-bold bg-amber-100 px-1.5 py-0.5 rounded">888888</code>，请提醒员工登录后及时修改</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordOpen(false); setEmployeeToReset(null); }} className="rounded-xl">取消</Button>
            <Button onClick={handleResetPassword} className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl">
              <KeyRound className="w-4 h-4 mr-2" />
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color = 'slate' }: { 
  label: string; 
  value: string | number; 
  subValue?: string;
  icon: React.ElementType; 
  color?: 'green' | 'red' | 'amber' | 'gray' | 'slate' | 'cyan' | 'blue';
}) {
  const colorMap = {
    green: { bg: 'from-emerald-400 to-teal-500', text: 'text-emerald-600', light: 'bg-emerald-50/50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    red: { bg: 'from-rose-400 to-red-500', text: 'text-rose-600', light: 'bg-rose-50/50', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
    amber: { bg: 'from-amber-400 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50/50', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
    gray: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', light: 'bg-slate-50/50', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    slate: { bg: 'from-slate-400 to-slate-500', text: 'text-slate-600', light: 'bg-slate-50/50', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
    cyan: { bg: 'from-cyan-400 to-teal-500', text: 'text-cyan-600', light: 'bg-cyan-50/50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
    blue: { bg: 'from-blue-400 to-indigo-500', text: 'text-blue-600', light: 'bg-blue-50/50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${colorMap[color].light}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className="text-2xl font-bold font-mono text-slate-800">{value}</p>
          {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorMap[color].iconBg}`}>
          <Icon className={`w-5 h-5 ${colorMap[color].iconColor}`} />
        </div>
      </div>
    </div>
  );
}