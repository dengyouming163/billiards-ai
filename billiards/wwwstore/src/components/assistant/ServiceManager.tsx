"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Package, Plus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
  type AssistantService,
} from "@/lib/api/assistants";

export default function ServiceManager() {
  const { success, warning } = useToast();
  const [services, setServices] = useState<AssistantService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<AssistantService | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingService, setDeletingService] = useState<AssistantService | null>(null);

  const [formData, setFormData] = useState({
    icon: "",
    name: "",
    description: "",
    price: "",
    unit: "次",
    sort_order: "0",
    status: 1,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchServices();
      setServices(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("加载服务项目失败:", err);
      setError("加载服务项目失败，请稍后重试");
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: AssistantService) => {
    if (service) {
      setEditingService(service);
      setFormData({
        icon: service.icon || "",
        name: service.name,
        description: service.description || "",
        price: String(service.price),
        unit: service.unit || "次",
        sort_order: String(service.sort_order ?? 0),
        status: service.status,
      });
    } else {
      setEditingService(null);
      setFormData({
        icon: "",
        name: "",
        description: "",
        price: "",
        unit: "次",
        sort_order: "0",
        status: 1,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      warning("请填写服务名称和价格");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        icon: formData.icon,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        unit: formData.unit,
        sort_order: parseInt(formData.sort_order) || 0,
        status: formData.status,
      };
      if (editingService) {
        await updateService(editingService.id, payload);
        success("服务项目更新成功");
      } else {
        await createService(payload);
        success("服务项目创建成功");
      }
      await loadServices();
      setDialogOpen(false);
      setEditingService(null);
    } catch (err) {
      console.error("保存服务项目失败:", err);
      warning("保存服务项目失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (service: AssistantService) => {
    setDeletingService(service);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingService) return;
    setLoading(true);
    try {
      await deleteService(deletingService.id);
      await loadServices();
      success(`服务项目"${deletingService.name}"删除成功`);
    } catch (err) {
      console.error("删除服务项目失败:", err);
      warning("删除服务项目失败，请稍后重试");
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setDeletingService(null);
    }
  };

  return (
    <div>
      <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            服务项目管理
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenDialog()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加服务
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && services.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="ml-3 text-slate-500">加载中...</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-12 h-12 text-red-300 mb-4" />
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                onClick={loadServices}
                className="mt-4 rounded-xl"
              >
                重试
              </Button>
            </div>
          )}

          {!loading && !error && services.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Package className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">暂无服务项目</p>
              <p className="text-slate-400 text-sm mt-2">点击上方按钮添加服务项目</p>
            </div>
          )}

          {!loading && !error && services.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="p-4 bg-slate-50 rounded-xl relative"
                  style={{ borderLeft: `3px solid #6366f1` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-lg">
                        {service.icon || "📦"}
                      </div>
                      <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                        {service.name}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        service.status === 1
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {service.status === 1 ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold text-indigo-600">
                      ¥{Number(service.price).toFixed(2)}
                    </span>
                    <span className="text-sm text-slate-400">/ {service.unit}</span>
                  </div>
                  {service.description && (
                    <div className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {service.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <span>排序: {service.sort_order}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleOpenDialog(service)}
                      className="flex-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    >
                      <Edit className="w-3 h-3 inline mr-1" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="flex-1 px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 inline mr-1" />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={() => {
          setDialogOpen(false);
          setEditingService(null);
        }}
      >
        <DialogContent className="bg-white rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              {editingService ? "编辑服务项目" : "添加服务项目"}
            </DialogTitle>
            <DialogDescription>
              {editingService ? "修改服务项目信息" : "创建新的服务项目"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">图标</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="输入 emoji 图标，如：📦"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">服务名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：一对一教学"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="服务描述信息"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">价格 *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">单位</label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="次"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">排序</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) =>
                    setFormData({ ...formData, sort_order: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">状态</label>
                <div className="flex items-center gap-3 pt-2">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="status"
                      value={1}
                      checked={formData.status === 1}
                      onChange={() => setFormData({ ...formData, status: 1 })}
                      className="text-indigo-600"
                    />
                    启用
                  </label>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="radio"
                      name="status"
                      value={0}
                      checked={formData.status === 0}
                      onChange={() => setFormData({ ...formData, status: 0 })}
                      className="text-indigo-600"
                    />
                    禁用
                  </label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || !formData.price || loading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onOpenChange={() => {
          setDeleteConfirmOpen(false);
          setDeletingService(null);
        }}
      >
        <DialogContent className="bg-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除服务项目「{deletingService?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeletingService(null);
              }}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={loading}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
