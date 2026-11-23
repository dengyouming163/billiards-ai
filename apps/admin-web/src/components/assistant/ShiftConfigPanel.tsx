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
import { Clock, Plus, Edit, Trash2, Settings, RotateCcw } from "lucide-react";
import { useToast } from "@/lib/toast-context";
import {
  fetchShiftConfigs,
  createShiftConfig,
  updateShiftConfig,
  deleteShiftConfig,
  initShiftConfigs,
  type ShiftConfig,
} from "@/lib/api/assistants";

export default function ShiftConfigPanel() {
  const { success, warning } = useToast();
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ShiftConfig | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingConfig, setDeletingConfig] = useState<ShiftConfig | null>(null);

  const [newConfig, setNewConfig] = useState({
    name: "",
    code: "",
    start_time: "09:00",
    end_time: "17:00",
    color: "#22c55e",
    sort_order: 0,
    description: "",
    status: 1,
  });

  useEffect(() => {
    loadShiftConfigs();
  }, []);

  const loadShiftConfigs = async () => {
    try {
      const res = await fetchShiftConfigs();
      const validConfigs = (res || []).filter((config) => config && config.code && config.code.trim());
      setShiftConfigs(validConfigs);
    } catch (error) {
      console.error("加载班次配置失败:", error);
      setShiftConfigs([]);
    }
  };

  const handleOpenConfigDialog = (config?: ShiftConfig) => {
    if (config) {
      setEditingConfig(config);
      setNewConfig({
        name: config.name,
        code: config.code,
        start_time: config.start_time,
        end_time: config.end_time,
        color: config.color,
        sort_order: config.sort_order,
        description: config.description || "",
        status: 1,
      });
    } else {
      setEditingConfig(null);
      setNewConfig({
        name: "",
        code: "",
        start_time: "09:00",
        end_time: "17:00",
        color: "#22c55e",
        sort_order: 0,
        description: "",
        status: 1,
      });
    }
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!newConfig.name || !newConfig.start_time || !newConfig.end_time) {
      warning("请填写必要信息");
      return;
    }
    setLoading(true);
    try {
      const configData = {
        ...newConfig,
        start_time: newConfig.start_time.length === 5 ? `${newConfig.start_time}:00` : newConfig.start_time,
        end_time: newConfig.end_time.length === 5 ? `${newConfig.end_time}:00` : newConfig.end_time,
      };
      if (editingConfig) {
        await updateShiftConfig(editingConfig.id, configData);
        success("班次更新成功");
      } else {
        await createShiftConfig(configData);
        success("班次创建成功");
      }
      await loadShiftConfigs();
      setConfigDialogOpen(false);
      setEditingConfig(null);
    } catch (error) {
      console.error("保存班次配置失败:", error);
      warning("保存班次配置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfig = (config: ShiftConfig) => {
    setDeletingConfig(config);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteConfig = async () => {
    if (!deletingConfig) return;
    setLoading(true);
    try {
      await deleteShiftConfig(deletingConfig.id);
      await loadShiftConfigs();
      success(`班次"${deletingConfig.name}"删除成功`);
    } catch (error) {
      console.error("删除班次配置失败:", error);
      warning("删除班次配置失败，请稍后重试");
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setDeletingConfig(null);
    }
  };

  const handleInitDefaultConfigs = async () => {
    setLoading(true);
    try {
      await initShiftConfigs();
      await loadShiftConfigs();
      success("默认班次配置初始化成功");
    } catch (error) {
      console.error("初始化班次配置失败:", error);
      warning("初始化班次配置失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4 flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            班次配置
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleInitDefaultConfigs}
              disabled={loading}
              className="rounded-xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              初始化默认班次
            </Button>
            <Button
              onClick={() => handleOpenConfigDialog()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加班次
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shiftConfigs.map((shift) => (
              <div
                key={shift.id}
                className="p-4 bg-slate-50 rounded-xl relative"
                style={{ borderLeft: `3px solid ${shift.color}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                    <span className="font-semibold text-slate-700">{shift.name}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${
                      shift.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {shift.status === 1 ? "启用" : "禁用"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {shift.start_time} - {shift.end_time}
                </div>
                {shift.description && (
                  <div className="text-xs text-slate-400 mt-2">{shift.description}</div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleOpenConfigDialog(shift)}
                    className="flex-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-3 h-3 inline mr-1" />
                    编辑
                  </button>
                  <button
                    onClick={() => handleDeleteConfig(shift)}
                    className="flex-1 px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    删除
                  </button>
                </div>
              </div>
            ))}
            {shiftConfigs.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Settings className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">暂无班次配置</p>
                <p className="text-slate-400 text-sm mt-2">点击上方按钮添加班次或初始化默认班次</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={configDialogOpen} onOpenChange={() => { setConfigDialogOpen(false); setEditingConfig(null); }}>
        <DialogContent className="bg-white rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              {editingConfig ? "编辑班次" : "添加班次"}
            </DialogTitle>
            <DialogDescription>{editingConfig ? "修改班次信息" : "创建新的班次配置"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">班次名称 *</label>
              <Input
                value={newConfig.name}
                onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                placeholder="如：早班、晚班"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">班次编码</label>
              <Input
                value={newConfig.code}
                onChange={(e) => setNewConfig({ ...newConfig, code: e.target.value })}
                placeholder="如：morning（留空自动生成）"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">开始时间 *</label>
                <Input
                  type="time"
                  value={newConfig.start_time}
                  onChange={(e) => setNewConfig({ ...newConfig, start_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">结束时间 *</label>
                <Input
                  type="time"
                  value={newConfig.end_time}
                  onChange={(e) => setNewConfig({ ...newConfig, end_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">班次颜色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newConfig.color}
                    onChange={(e) => setNewConfig({ ...newConfig, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={newConfig.color}
                    onChange={(e) => setNewConfig({ ...newConfig, color: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">排序</label>
                <Input
                  type="number"
                  value={newConfig.sort_order}
                  onChange={(e) => setNewConfig({ ...newConfig, sort_order: parseInt(e.target.value) || 0 })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">描述</label>
              <Input
                value={newConfig.description}
                onChange={(e) => setNewConfig({ ...newConfig, description: e.target.value })}
                placeholder="班次描述信息"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)} className="rounded-xl">
              取消
            </Button>
            <Button
              onClick={handleSaveConfig}
              disabled={!newConfig.name || !newConfig.start_time || !newConfig.end_time || loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={() => { setDeleteConfirmOpen(false); setDeletingConfig(null); }}>
        <DialogContent className="bg-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除班次「{deletingConfig?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setDeleteConfirmOpen(false); setDeletingConfig(null); }} className="rounded-xl">
              取消
            </Button>
            <Button
              onClick={confirmDeleteConfig}
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
