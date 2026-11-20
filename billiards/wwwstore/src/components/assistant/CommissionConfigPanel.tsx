"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/hooks/use-app";
import { Plus, Trash2, Edit, Percent, DollarSign, Users, ChevronDown, ShieldCheck } from "lucide-react";
import {
  fetchAllCommissionConfigs,
  saveCommissionConfig,
  deleteCommissionConfig,
  fetchCommissionStats,
  batchSettleCommission,
  type CommissionConfig as ApiCommissionConfig,
} from "@/lib/api/assistants";
import type { CommissionConfig } from "@/lib/types";
import type { Assistant } from "@/lib/api/assistants";

const COMMISSION_MODES = [
  { value: "no_guarantee", label: "无保底提成", description: "按比例或固定金额提成，无保底保障", icon: Percent },
  { value: "with_guarantee", label: "保底提成", description: "月实际上桌 < 保底工时发保底金额，达标按实际提成", icon: ShieldCheck },
  { value: "base_salary", label: "固定底薪", description: "应发 = 底薪 + 提成", icon: DollarSign },
] as const;

const COMMISSION_SUB_TYPES = [
  { value: "percentage", label: "按比例(%)" },
  { value: "fixed", label: "固定金额(元)" },
] as const;

interface CommissionConfigPanelProps {
  assistants: Assistant[];
}

export default function CommissionConfigPanel({ assistants }: CommissionConfigPanelProps) {
  const [configs, setConfigs] = useState<CommissionConfig[]>([]);
  const [stats, setStats] = useState({ total_commission: 0, paid_commission: 0, pending_commission: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<Partial<CommissionConfig> | null>(null);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<string[]>([]);
  const [assistantDropdownOpen, setAssistantDropdownOpen] = useState(false);
  const [selectedConfigIds, setSelectedConfigIds] = useState<Set<string>>(new Set());
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    commission_mode: "no_guarantee" as string,
    commission_type: "percentage" as string,
    commission_rate: 30 as number,
    base_salary: undefined as number | undefined,
    guarantee_hours: undefined as number | undefined,
    guarantee_amount: undefined as number | undefined,
    settlement_period: "monthly",
    effective_date: "",
    status: 1,
  });
  const { toast } = useToast();
  const { state: { currentStore } } = useApp();
  const [batchSettling, setBatchSettling] = useState(false);
  const [batchResult, setBatchResult] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [configsRes, statsRes] = await Promise.all([
      fetchAllCommissionConfigs().catch(() => []),
      fetchCommissionStats().catch(() => ({ total_commission: 0, paid_commission: 0, pending_commission: 0 })),
    ]);
    setConfigs(configsRes as CommissionConfig[]);
    setStats(statsRes as { total_commission: number; paid_commission: number; pending_commission: number });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!editingConfig?.commission_type) return;
    const assistantIds = selectedAssistantIds.length > 0
      ? selectedAssistantIds
      : (editingConfig?.assistant_id ? [editingConfig.assistant_id] : []);
    if (assistantIds.length === 0) return;
    await saveCommissionConfig({
      assistant_ids: assistantIds,
      commission_mode: (editingConfig as any).commission_mode || "no_guarantee",
      commission_type: editingConfig.commission_type,
      commission_rate: editingConfig.commission_rate || 0,
      base_salary: editingConfig.base_salary,
      guarantee_hours: (editingConfig as any).guarantee_hours,
      guarantee_amount: (editingConfig as any).guarantee_amount,
      settlement_period: (editingConfig as any).settlement_period || "monthly",
      effective_date: (editingConfig as any).effective_date || undefined,
      status: editingConfig.status,
      remark: editingConfig.remark,
    });
    toast({ title: `已更新提成配置` });
    setDialogOpen(false);
    setSelectedAssistantIds([]);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await deleteCommissionConfig(id);
    toast({ title: "删除成功" });
    loadData();
  };

  const toggleAssistant = (id: string) => {
    setSelectedAssistantIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleAllAssistants = () => {
    if (selectedAssistantIds.length === assistants.length) {
      setSelectedAssistantIds([]);
    } else {
      setSelectedAssistantIds(assistants.map((a) => a.id));
    }
  };

  const getSelectedAssistantNames = () => {
    return assistants
      .filter((a) => selectedAssistantIds.includes(a.id))
      .map((a) => a.name)
      .join("、");
  };

  const toggleConfigSelect = (id: string) => {
    const next = new Set(selectedConfigIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedConfigIds(next);
  };

  const toggleSelectAllConfigs = () => {
    if (selectedConfigIds.size === configs.length && configs.length > 0) {
      setSelectedConfigIds(new Set());
    } else {
      setSelectedConfigIds(new Set(configs.map((c) => c.id)));
    }
  };

  const handleBatchSave = async () => {
    const selectedConfigs = configs.filter((c) => selectedConfigIds.has(c.id));
    const assistantIds = selectedConfigs.map((c) => c.assistant_id);
    if (assistantIds.length === 0) return;

    await saveCommissionConfig({
      assistant_ids: assistantIds,
      commission_mode: batchForm.commission_mode,
      commission_type: batchForm.commission_type,
      commission_rate: batchForm.commission_rate,
      base_salary: batchForm.base_salary,
      guarantee_hours: batchForm.guarantee_hours,
      guarantee_amount: batchForm.guarantee_amount,
      settlement_period: batchForm.settlement_period,
      effective_date: batchForm.effective_date || undefined,
      status: batchForm.status,
    });
    toast({ title: `已为 ${assistantIds.length} 名助教批量配置提成` });
    setBatchDialogOpen(false);
    setSelectedConfigIds(new Set());
    loadData();
  };

  const handleBatchSettle = async () => {
    setBatchSettling(true);
    setBatchResult(null);
    try {
      const res = await batchSettleCommission(currentStore?.id || '');
      toast({ title: res?.message || '结算完成', variant: 'success' });
      setBatchResult(`共 ${res.total} 笔，成功 ${res.processed} 笔，跳过 ${res.skipped} 笔${res.errors > 0 ? `，失败 ${res.errors} 笔` : ''}`);
      loadData();
    } catch (e: any) {
      toast({ title: e?.message || '结算失败', variant: 'error' });
    } finally {
      setBatchSettling(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return COMMISSION_SUB_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getModeLabel = (mode: string) => {
    return COMMISSION_MODES.find((m) => m.value === mode)?.label || mode;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">待发放</Badge>;
      case "paid":
        return <Badge variant="default">已发放</Badge>;
      case "cancelled":
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">累计提成</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.total_commission.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已发放</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{stats.paid_commission.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待发放</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">¥{stats.pending_commission.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 space-y-2">
        <Button
          onClick={handleBatchSettle}
          disabled={batchSettling}
          variant="outline"
          className="w-full"
        >
          {batchSettling ? '结算中...' : '一键结算历史提成'}
        </Button>
        {batchResult && (
          <p className="text-sm text-emerald-600 text-center">{batchResult}</p>
        )}
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-center">
            {selectedConfigIds.size > 0 && (
              <span className="text-sm text-muted-foreground">
                已选 {selectedConfigIds.size} 项
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              {selectedConfigIds.size > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setBatchForm({
                      commission_mode: "no_guarantee",
                      commission_type: "percentage",
                      commission_rate: 30,
                      base_salary: undefined,
                      guarantee_hours: undefined,
                      guarantee_amount: undefined,
                      settlement_period: "monthly",
                      effective_date: "",
                      status: 1,
                    });
                    setBatchDialogOpen(true);
                  }}
                >
                  <Users className="h-4 w-4 mr-2" />
                  批量配置 ({selectedConfigIds.size})
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingConfig({ commission_mode: "no_guarantee", commission_type: "percentage", commission_rate: 30, status: 1, settlement_period: "monthly", effective_date: "" } as any);
                  setSelectedAssistantIds([]);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加配置
              </Button>
            </div>
          </div>

          {configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无提成配置</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={configs.length > 0 && selectedConfigIds.size === configs.length}
                      onCheckedChange={toggleSelectAllConfigs}
                    />
                  </TableHead>
                  <TableHead>助教</TableHead>
                  <TableHead>提成模式</TableHead>
                  <TableHead>提成类型</TableHead>
                  <TableHead>提成比例/金额</TableHead>
                  <TableHead>保底/底薪</TableHead>
                  <TableHead>生效日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedConfigIds.has(config.id)}
                        onCheckedChange={() => toggleConfigSelect(config.id)}
                      />
                    </TableCell>
                    <TableCell>{assistants.find((a) => a.id === config.assistant_id)?.name || config.assistant_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getModeLabel((config as any).commission_mode || "no_guarantee")}</Badge>
                    </TableCell>
                    <TableCell>{getTypeLabel(config.commission_type)}</TableCell>
                    <TableCell>
                      {config.commission_type === "percentage"
                        ? `${config.commission_rate}%`
                        : `¥${config.commission_rate}`}
                    </TableCell>
                    <TableCell>
                      {(config as any).commission_mode === "with_guarantee"
                        ? `${(config as any).guarantee_hours || "-"}h / ¥${(config as any).guarantee_amount || "-"}`
                        : (config as any).commission_mode === "base_salary"
                        ? `¥${config.base_salary || "-"}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(config as any).effective_date || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.status === 1 ? "default" : "secondary"}>
                        {config.status === 1 ? "启用" : "禁用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingConfig(config);
                            setDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(config.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
      </div>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingConfig?.id ? "编辑提成配置" : "添加提成配置"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingConfig?.id && (
              <div className="space-y-2">
                <Label>选择助教</Label>
                <Popover open={assistantDropdownOpen} onOpenChange={setAssistantDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between text-left font-normal rounded-xl"
                    >
                      <span className={selectedAssistantIds.length > 0 ? "" : "text-slate-400"}>
                        {selectedAssistantIds.length > 0
                          ? `已选 ${selectedAssistantIds.length} 人：${getSelectedAssistantNames().slice(0, 30)}${getSelectedAssistantNames().length > 30 ? "…" : ""}`
                          : "请选择助教"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-2 z-[102]" align="start">
                    <div className="flex items-center px-2 pb-2 border-b mb-2">
                      <Checkbox
                        checked={assistants.length > 0 && selectedAssistantIds.length === assistants.length}
                        onCheckedChange={toggleAllAssistants}
                      />
                      <span className="ml-2 text-sm font-medium">全选</span>
                    </div>
                    <div className="max-h-[200px] overflow-auto space-y-1">
                      {assistants.length === 0 ? (
                        <p className="text-sm text-slate-400 px-2 py-1">暂无助教</p>
                      ) : (
                        assistants.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center px-2 py-1.5 rounded hover:bg-slate-100 cursor-pointer"
                            onClick={() => toggleAssistant(a.id)}
                          >
                            <Checkbox
                              checked={selectedAssistantIds.includes(a.id)}
                            />
                            <span className="ml-2 text-sm">{a.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Commission Mode Radio Buttons */}
            <div className="space-y-2">
              <Label>提成模式</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMMISSION_MODES.map((mode) => {
                  const currentMode = (editingConfig as any)?.commission_mode || "no_guarantee";
                  const isActive = currentMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      type="button"
                      onClick={() =>
                        setEditingConfig((prev) => ({
                          ...prev,
                          commission_mode: mode.value,
                        } as any))
                      }
                      className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                        <mode.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{mode.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{mode.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-type for no_guarantee mode */}
            {((editingConfig as any)?.commission_mode || "no_guarantee") === "no_guarantee" && (
              <div className="space-y-2">
                <Label>提成方式</Label>
                <Select
                  value={editingConfig?.commission_type || "percentage"}
                  onValueChange={(value) =>
                    setEditingConfig((prev) => ({ ...prev, commission_type: value as "percentage" | "fixed" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMISSION_SUB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rate / Amount input */}
            <div className="space-y-2">
              <Label>
                {editingConfig?.commission_type === "fixed" ? "固定金额(元)" : "提成比例(%)"}
              </Label>
              <Input
                type="number"
                placeholder={editingConfig?.commission_type === "fixed" ? "请输入固定金额" : "请输入百分比"}
                value={editingConfig?.commission_rate || ""}
                onChange={(e) =>
                  setEditingConfig((prev) => ({ ...prev, commission_rate: Number(e.target.value) }))
                }
              />
            </div>

            {/* Guarantee fields */}
            {((editingConfig as any)?.commission_mode || "no_guarantee") === "with_guarantee" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>保底工时(小时/月)</Label>
                    <Input
                      type="number"
                      placeholder="例如：160"
                      value={(editingConfig as any)?.guarantee_hours || ""}
                      onChange={(e) =>
                        setEditingConfig((prev) => ({ ...prev, guarantee_hours: Number(e.target.value) } as any))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>保底金额(元)</Label>
                    <Input
                      type="number"
                      placeholder="例如：3000"
                      value={(editingConfig as any)?.guarantee_amount || ""}
                      onChange={(e) =>
                        setEditingConfig((prev) => ({ ...prev, guarantee_amount: Number(e.target.value) } as any))
                      }
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  月实际上桌 &lt; 保底工时时，发放保底金额；实际工时 &ge; 保底工时时，按实际提成计算。
                </div>
              </>
            )}

            {/* Base salary field */}
            {((editingConfig as any)?.commission_mode || "no_guarantee") === "base_salary" && (
              <>
                <div className="space-y-2">
                  <Label>底薪(元/月)</Label>
                  <Input
                    type="number"
                    placeholder="请输入底薪"
                    value={editingConfig?.base_salary || ""}
                    onChange={(e) =>
                      setEditingConfig((prev) => ({ ...prev, base_salary: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                  应发 = 底薪 + 提成。提成按上述比例/金额计算后叠加在底薪之上。
                </div>
              </>
            )}

            {/* Settlement period */}
            <div className="space-y-2">
              <Label>结算周期</Label>
              <Select
                value={(editingConfig as any)?.settlement_period || "monthly"}
                onValueChange={(value) =>
                  setEditingConfig((prev) => ({ ...prev, settlement_period: value } as any))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">按月结算</SelectItem>
                  <SelectItem value="weekly">按周结算</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Effective date */}
            <div className="space-y-2">
              <Label>生效日期</Label>
              <Input
                type="date"
                value={(editingConfig as any)?.effective_date || ""}
                onChange={(e) =>
                  setEditingConfig((prev) => ({ ...prev, effective_date: e.target.value } as any))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={String(editingConfig?.status ?? 1)}
                onValueChange={(value) =>
                  setEditingConfig((prev) => ({ ...prev, status: Number(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!editingConfig?.id && selectedAssistantIds.length === 0}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>批量配置提成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
              将为选中的 {selectedConfigIds.size} 名助教统一设置提成配置，已有配置将被覆盖。
            </div>

            {/* Commission Mode */}
            <div className="space-y-2">
              <Label>提成模式</Label>
              <div className="grid grid-cols-3 gap-2">
                {COMMISSION_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => setBatchForm((prev) => ({ ...prev, commission_mode: mode.value }))}
                    className={`flex flex-col items-center text-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      batchForm.commission_mode === mode.value
                        ? "border-emerald-500 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${batchForm.commission_mode === mode.value ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                      <mode.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{mode.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{mode.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {batchForm.commission_mode === "no_guarantee" && (
              <div className="space-y-2">
                <Label>提成方式</Label>
                <Select
                  value={batchForm.commission_type}
                  onValueChange={(value) =>
                    setBatchForm((prev) => ({ ...prev, commission_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMISSION_SUB_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>
                {batchForm.commission_type === "fixed" ? "固定金额(元)" : "提成比例(%)"}
              </Label>
              <Input
                type="number"
                placeholder={batchForm.commission_type === "fixed" ? "请输入固定金额" : "请输入百分比"}
                value={batchForm.commission_rate}
                onChange={(e) =>
                  setBatchForm((prev) => ({ ...prev, commission_rate: Number(e.target.value) }))
                }
              />
            </div>

            {batchForm.commission_mode === "with_guarantee" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>保底工时(h)</Label>
                    <Input
                      type="number"
                      placeholder="例如：160"
                      value={batchForm.guarantee_hours || ""}
                      onChange={(e) =>
                        setBatchForm((prev) => ({ ...prev, guarantee_hours: Number(e.target.value) }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>保底金额(元)</Label>
                    <Input
                      type="number"
                      placeholder="例如：3000"
                      value={batchForm.guarantee_amount || ""}
                      onChange={(e) =>
                        setBatchForm((prev) => ({ ...prev, guarantee_amount: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  月实际上桌 &lt; 保底工时时，发放保底金额；实际工时 &ge; 保底工时时，按实际提成计算。
                </div>
              </>
            )}

            {batchForm.commission_mode === "base_salary" && (
              <>
                <div className="space-y-2">
                  <Label>底薪(元/月)</Label>
                  <Input
                    type="number"
                    placeholder="请输入底薪"
                    value={batchForm.base_salary || ""}
                    onChange={(e) =>
                      setBatchForm((prev) => ({ ...prev, base_salary: Number(e.target.value) }))
                    }
                  />
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                  应发 = 底薪 + 提成
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>生效日期</Label>
              <Input
                type="date"
                value={batchForm.effective_date}
                onChange={(e) =>
                  setBatchForm((prev) => ({ ...prev, effective_date: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={String(batchForm.status)}
                onValueChange={(value) =>
                  setBatchForm((prev) => ({ ...prev, status: Number(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchSave}>
              确认保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
