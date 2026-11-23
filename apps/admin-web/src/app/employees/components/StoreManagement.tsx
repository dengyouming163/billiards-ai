'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/hooks/use-app';
import { useToast } from '@/hooks/use-toast';
import { fetchStores, createStore, updateStore, deleteStore, switchStore } from '@/lib/api/stores';
import type { Store } from '@/lib/types';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  Home,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function StoreManagement() {
  const { state, dispatch } = useApp();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    businessHoursStart: '09:00',
    businessHoursEnd: '23:00',
    status: 'active' as Store['status'],
    description: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setLoading(true);
    try {
      const data = await fetchStores();
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter((store) => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || store.address.toLowerCase().includes(searchQuery.toLowerCase()) || store.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSaveStore = async () => {
    if (!formData.name || !formData.address) {
      toast({ title: '请填写门店名称和地址', variant: 'warning' });
      return;
    }
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        business_hours_start: formData.businessHoursStart,
        business_hours_end: formData.businessHoursEnd,
        description: formData.description,
      };
      if (editingStore) {
        await updateStore(editingStore.id, payload);
      } else {
        await createStore(payload);
      }
      await loadStores();
      setAddDialogOpen(false);
      setEditingStore(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save store:', error);
      toast({ title: '保存失败', variant: 'error' });
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('确定要删除这个门店吗？')) return;
    try {
      await deleteStore(id);
      await loadStores();
    } catch (error) {
      console.error('Failed to delete store:', error);
      toast({ title: '删除失败', variant: 'error' });
    }
  };

  const handleSwitchStore = async (store: Store) => {
    try {
      await switchStore(store.id);
      dispatch({ type: 'SET_CURRENT_STORE', payload: store });
      toast({ title: '切换成功', variant: 'success' });
    } catch (error) {
      console.error('Failed to switch store:', error);
      toast({ title: '切换失败', variant: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', address: '', phone: '', businessHoursStart: '09:00', businessHoursEnd: '23:00', status: 'active', description: '' });
  };

  const openAddDialog = () => { resetForm(); setEditingStore(null); setAddDialogOpen(true); };
  const openEditDialog = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone || '',
      businessHoursStart: store.businessHours?.start || '09:00',
      businessHoursEnd: store.businessHours?.end || '23:00',
      status: store.status,
      description: store.description || '',
    });
    setAddDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-100 text-emerald-700', text: '营业中', label: '营业中' },
      inactive: { bg: 'bg-gray-100 text-gray-600', text: '已关闭', label: '已关闭' },
    };
    const config = configs[status] || configs.active;
    return (
      <Badge className={`${config.bg} rounded-full px-3 py-1`}>
        {status === 'active' ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
        {config.label}
      </Badge>
    );
  };

  const { currentStore } = state;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{stores.length}</p>
              <p className="text-sm text-white/80">门店总数</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{stores.filter((s) => s.status === 'active').length}</p>
              <p className="text-sm text-white/80">营业中</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">{stores.filter((s) => s.status === 'inactive').length}</p>
              <p className="text-sm text-white/80">已关闭</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm text-blue-600 font-medium">当前门店</p>
            <p className="text-lg font-semibold text-gray-900">{currentStore?.name || '未选择门店'}</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-700">{currentStore?.status === 'active' ? '营业中' : '已关闭'}</Badge>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索门店名称、地址..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-gray-50 border-gray-200 rounded-xl" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-gray-50 border-gray-200 rounded-xl">
              <SelectValue placeholder="门店状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">营业中</SelectItem>
              <SelectItem value="inactive">已关闭</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadStores}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            添加门店
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
                <TableHead className="text-gray-500 font-medium">门店信息</TableHead>
                <TableHead className="text-gray-500 font-medium">联系电话</TableHead>
                <TableHead className="text-gray-500 font-medium">营业时间</TableHead>
                <TableHead className="text-gray-500 font-medium">状态</TableHead>
                <TableHead className="text-right text-gray-500 font-medium">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id} className={`hover:bg-gray-50/50 transition-colors ${currentStore?.id === store.id ? 'bg-blue-50/50' : ''}`}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-medium shadow-md flex-shrink-0">
                        {store.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{store.name}</p>
                          {currentStore?.id === store.id && <Badge className="bg-blue-100 text-blue-700 text-xs">当前</Badge>}
                        </div>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.address}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {store.phone || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {store.businessHours?.start || '09:00'} - {store.businessHours?.end || '23:00'}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(store.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 rounded-xl" onClick={() => { setSelectedStore(store); setDetailDialogOpen(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-600 rounded-xl" onClick={() => openEditDialog(store)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      {currentStore?.id !== store.id && (
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-emerald-600 rounded-xl" onClick={() => handleSwitchStore(store)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      {stores.length > 1 && (
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-600 rounded-xl" onClick={() => handleDeleteStore(store.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-400">暂无门店数据</p>
            <Button onClick={openAddDialog} className="mt-4 bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              添加门店
            </Button>
          </div>
        )}
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-white rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">门店详情</DialogTitle>
            <DialogDescription className="text-gray-500">{selectedStore?.name}</DialogDescription>
          </DialogHeader>
          {selectedStore && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {selectedStore.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedStore.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={selectedStore.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}>
                      {selectedStore.status === 'active' ? '营业中' : '已关闭'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />地址</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedStore.address}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />联系电话</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedStore.phone || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />营业时间</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedStore.businessHours?.start || '09:00'} - {selectedStore.businessHours?.end || '23:00'}
                  </p>
                </div>
              </div>
              {selectedStore.description && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400">门店简介</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedStore.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="rounded-xl">关闭</Button>
            {selectedStore && (
              <Button className="bg-blue-600" onClick={() => { setDetailDialogOpen(false); openEditDialog(selectedStore); }}>
                <Edit className="w-4 h-4 mr-2" />
                编辑门店
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-white border-gray-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">{editingStore ? '编辑门店' : '新增门店'}</DialogTitle>
            <DialogDescription className="text-gray-500">{editingStore ? '修改门店信息' : '添加新门店'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">门店名称 <span className="text-red-500">*</span></Label>
              <Input placeholder="请输入门店名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">详细地址 <span className="text-red-500">*</span></Label>
              <Input placeholder="请输入详细地址" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">联系电话</Label>
              <Input placeholder="请输入联系电话" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">开始时间</Label>
                <Input type="time" value={formData.businessHoursStart} onChange={(e) => setFormData({ ...formData, businessHoursStart: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">结束时间</Label>
                <Input type="time" value={formData.businessHoursEnd} onChange={(e) => setFormData({ ...formData, businessHoursEnd: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">门店简介</Label>
              <Input placeholder="请输入门店简介（可选）" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-gray-50 border-gray-200 rounded-xl" />
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleSaveStore} className="bg-blue-600">
              {editingStore ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}