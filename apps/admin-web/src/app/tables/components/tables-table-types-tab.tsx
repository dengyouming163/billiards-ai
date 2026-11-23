'use client';

import { useState, useEffect } from 'react';
import {
  Coffee,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
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
  fetchTableTypes,
  createTableType,
  updateTableType,
  deleteTableType,
  toggleTableType,
  type TableType,
  type TableTypeForm,
} from '@/lib/api/table-type';

interface TablesTableTypesTabProps {
  currentStoreId: string | undefined;
  visible: boolean;
  success: (msg: string) => void;
  warning: (msg: string) => void;
}

export function TablesTableTypesTab({ currentStoreId, visible, success, warning }: TablesTableTypesTabProps) {
  const [tableTypes, setTableTypes] = useState<TableType[]>([]);
  const [tableTypesLoading, setTableTypesLoading] = useState(false);
  const [tableTypeDialogOpen, setTableTypeDialogOpen] = useState(false);
  const [editingTableType, setEditingTableType] = useState<(TableType & { editing?: boolean }) | TableTypeForm>({
    name: '',
    description: '',
    sort_order: 0,
    status: 1,
  });

  const loadTableTypes = async () => {
    if (!currentStoreId) return;
    setTableTypesLoading(true);
    try {
      const data = await fetchTableTypes({ store_id: currentStoreId });
      setTableTypes(data);
    } catch (err) {
      console.error('加载台型数据失败:', err);
    } finally {
      setTableTypesLoading(false);
    }
  };

  useEffect(() => {
    if (visible && currentStoreId) {
      loadTableTypes();
    }
  }, [visible, currentStoreId]);

  const handleSaveTableType = async () => {
    if (!currentStoreId) return;
    setTableTypesLoading(true);
    try {
      if ('id' in editingTableType && editingTableType.id) {
        await updateTableType(editingTableType.id, editingTableType);
      } else {
        await createTableType({ store_id: currentStoreId, ...(editingTableType as TableTypeForm) });
      }
      await loadTableTypes();
      setTableTypeDialogOpen(false);
      setEditingTableType({ name: '', description: '', sort_order: 0, status: 1 });
    } catch (err) {
      console.error('保存台型失败:', err);
      warning('保存台型失败，请稍后重试');
    } finally {
      setTableTypesLoading(false);
    }
  };

  const handleDeleteTableType = async (id: string) => {
    if (!confirm('确定要删除该台型吗？')) return;
    setTableTypesLoading(true);
    try {
      await deleteTableType(id);
      await loadTableTypes();
    } catch (err) {
      console.error('删除台型失败:', err);
      warning('删除台型失败，请稍后重试');
    } finally {
      setTableTypesLoading(false);
    }
  };

  const handleToggleTableType = async (id: string) => {
    setTableTypesLoading(true);
    try {
      await toggleTableType(id);
      await loadTableTypes();
    } catch (err) {
      console.error('切换台型状态失败:', err);
      warning('操作失败，请稍后重试');
    } finally {
      setTableTypesLoading(false);
    }
  };

  const handleEditTableType = (tableType: TableType) => {
    setEditingTableType({ ...tableType });
    setTableTypeDialogOpen(true);
  };

  return (
    <>
      <SettingsCard
        title="台型配置"
        desc="管理台球桌类型"
        actions={
          <Button
            onClick={() => {
              setEditingTableType({ name: '', description: '', sort_order: 0, status: 1 });
              setTableTypeDialogOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新增台型
          </Button>
        }
      >
        <SettingsCardGrid>
          {tableTypesLoading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
          ) : tableTypes.length === 0 ? (
            <SettingsEmpty />
          ) : (
          tableTypes.map((tableType) => (
            <div
              key={tableType.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-200">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{tableType.name}</h3>
                    <p className="text-sm text-slate-500">{tableType.description || '暂无描述'}</p>
                  </div>
                </div>
                <Badge
                  className={`${
                    tableType.status === 1
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tableType.status === 1 ? '启用' : '停用'}
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
                    onClick={() => handleToggleTableType(tableType.id)}
                    className={`h-8 px-2 ${tableType.status === 1 ? 'text-slate-500 hover:text-amber-500' : 'text-slate-500 hover:text-green-500'}`}
                  >
                    {tableType.status === 1 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTableType(tableType)}
                    className="h-8 px-2 text-slate-500 hover:text-blue-500"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTableType(tableType.id)}
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
      </SettingsCard>

      <Dialog open={tableTypeDialogOpen} onOpenChange={setTableTypeDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {('id' in editingTableType && editingTableType.id) ? '编辑台型' : '新增台型'}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {('id' in editingTableType && editingTableType.id) ? '修改台型信息' : '添加新的台型类型'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tableTypeName">台型名称</Label>
              <Input
                id="tableTypeName"
                value={editingTableType.name}
                onChange={(e) => setEditingTableType({ ...editingTableType, name: e.target.value })}
                placeholder="例如：中式八球、美式九球、斯诺克"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tableTypeDesc">台型描述</Label>
              <Input
                id="tableTypeDesc"
                value={editingTableType.description}
                onChange={(e) => setEditingTableType({ ...editingTableType, description: e.target.value })}
                placeholder="台型的简短描述"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingTableType.status === 1}
                    onChange={() => setEditingTableType({ ...editingTableType, status: 1 })}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">启用</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={editingTableType.status === 0}
                    onChange={() => setEditingTableType({ ...editingTableType, status: 0 })}
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
                setTableTypeDialogOpen(false);
                setEditingTableType({ name: '', description: '', sort_order: 0, status: 1 });
              }}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveTableType}
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
