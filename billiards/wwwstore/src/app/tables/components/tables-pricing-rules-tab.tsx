"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { get, post, put, del } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { ApiResponseType } from "@/lib/api/types";
import type { PricingRule, PricingRuleType, MemberLevel, WeekdayType, PeriodPackage } from "@/lib/types";
import {
  Calculator,
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Settings,
  Save,
  X,
  Table,
  LayoutTemplate,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface FormSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FormSection({ title, icon: Icon, children, defaultOpen = true }: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface TimePeriod {
  id: string;
  name: string;
  color: string;
  start_time: string;
  end_time: string;
  coefficient: number;
  priority: number;
  status: number;
}

interface PricingRuleFormData {
  name: string;
  type: PricingRuleType;
  description: string;
  weekdayTypes: WeekdayType[];
  memberLevels: MemberLevel[];
  priority: number;
  status: "active" | "inactive";

  pricePerHour: number;
  minimumMinutes: number;
  minimumCharge: number;
  roundingMode: 'per_minute' | 'min_30' | 'per_hour';

  periodPackages: PeriodPackage[];
}

const defaultFormData: PricingRuleFormData = {
  name: "",
  type: "time",
  description: "",
  weekdayTypes: ["all"],
  memberLevels: [],
  priority: 1,
  status: "active",

  pricePerHour: 30,
  minimumMinutes: 30,
  minimumCharge: 0,
  roundingMode: 'per_minute',

  periodPackages: [],
};

const pricingTypeLabels: Record<string, { label: string; desc: string; icon: React.ElementType }> = {
  time: { label: "按时段计费", desc: "按时段系数差异化定价", icon: Clock },
  hourly: { label: "按小时计费", desc: "统一小时费率，精确到分钟", icon: Clock },
  // period: removed per customer request
};

const roundingModeLabels: Record<string, { label: string; desc: string }> = {
  per_minute: { label: "精确到分钟", desc: "按实际使用分钟数计算" },
  min_30: { label: "不足30分钟按30分钟", desc: "最低消费30分钟" },
  per_hour: { label: "不足1小时按1小时", desc: "按整小时计算" },
};

const memberLevelLabels: Record<MemberLevel, string> = {
  normal: "普通会员",
  silver: "银卡会员",
  gold: "金卡会员",
  diamond: "钻石会员",
};

const weekdayLabels: Record<string, string> = {
  all: "全天",
  weekday: "工作日",
  weekend: "周末",
  holiday: "节假日",
};

function getPricePreview(rule: PricingRule): { label: string; price: string; color: string }[] {
  const results: { label: string; price: string; color: string }[] = [];
  
  const config = rule.config || {};
  
  if (rule.type === "time" || rule.type === "hourly") {
    const pricePerHour = config.pricePerHour || 0;
    const roundingMode = config.roundingMode || 'per_minute';
    if (pricePerHour > 0) {
      results.push({
        label: "单价",
        price: `¥${pricePerHour}/小时`,
        color: "text-green-600",
      });
      results.push({
        label: "计费",
        price: roundingModeLabels[roundingMode as keyof typeof roundingModeLabels]?.label || "精确到分钟",
        color: "text-slate-500",
      });
    }
  } else if (rule.type === "period") {
    const packages = config.periodPackages as PeriodPackage[] | undefined;
    if (packages && packages.length > 0) {
      packages.slice(0, 2).forEach((pkg) => {
        results.push({ label: pkg.name, price: `¥${pkg.price}`, color: "text-amber-600" });
      });
    }
  }

  return results.length > 0 ? results : [{ label: "价格", price: "未配置", color: "text-slate-400" }];
}

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (type === 'success') toast.success(message);
  else if (type === 'error') toast.error(message);
  else toast(message);
};

export function PricingRulesTab() {
  const { state } = useApp();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [timePeriods, setTimePeriods] = useState<TimePeriod[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState<PricingRuleFormData>({ ...defaultFormData });
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    message: "",
    type: "delete" as const,
    ruleId: "",
    ruleName: "",
  });

  const loadRules = async () => {
    try {
      console.log("Loading pricing rules from:", API_ENDPOINTS.pricingRules);
      const data = await get<PricingRule[]>(API_ENDPOINTS.pricingRules, undefined, ApiResponseType.ARRAY);
      console.log("API response data:", data);
      if (Array.isArray(data)) {
        setRules(data);
        console.log("Rules loaded successfully, count:", data.length);
      } else {
        console.warn("API returned non-array data:", data);
        setRules([]);
      }
    } catch (error) {
      console.error("Failed to load rules:", error);
      setRules([]);
    }
  };

  const loadTimePeriods = async () => {
    if (!state.currentStore?.id) return;
    
    try {
      const data = await get<TimePeriod[]>(API_ENDPOINTS.timePeriods, { store_id: state.currentStore.id });
      if (Array.isArray(data)) {
        setTimePeriods(data);
        console.log("Time periods loaded successfully, count:", data.length);
      } else {
        setTimePeriods([]);
      }
    } catch (error) {
      console.error("Failed to load time periods:", error);
      setTimePeriods([]);
    }
  };

  useEffect(() => {
    loadRules();
    loadTimePeriods();
  }, []);

  useEffect(() => {
    const handleOpenAddDialog = (_event: Event) => {
      openAddDialog();
    };
    
    window.addEventListener('openAddPricingRule', handleOpenAddDialog);
    return () => {
      window.removeEventListener('openAddPricingRule', handleOpenAddDialog);
    };
  }, []);

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || rule.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.status === "active").length,
    byType: {
      time: rules.filter(r => r.type === "time").length,
      hourly: rules.filter(r => r.type === "hourly").length,
      period: rules.filter(r => r.type === "period").length,
    },
  };

  const updateForm = <K extends keyof PricingRuleFormData>(key: K, value: PricingRuleFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const openAddDialog = () => {
    setEditingRule(null);
    setFormData({ ...defaultFormData });
    setDialogOpen(true);
  };

  const openEditDialog = (rule: PricingRule) => {
    setEditingRule(rule);
    const config = rule.config || {};
    setFormData({
      name: rule.name,
      type: rule.type,
      description: rule.description ?? "",
      weekdayTypes: Array.isArray(rule.weekday_types) ? rule.weekday_types : defaultFormData.weekdayTypes,
      memberLevels: Array.isArray(rule.member_levels) ? rule.member_levels : defaultFormData.memberLevels,
      priority: rule.priority,
      status: rule.status,
      pricePerHour: (config.pricePerHour as number) || defaultFormData.pricePerHour,
      minimumMinutes: (config.minimumMinutes as number) || defaultFormData.minimumMinutes,
      minimumCharge: (config.minimumCharge as number) || defaultFormData.minimumCharge,
      roundingMode: ((config.roundingMode as string) as PricingRuleFormData["roundingMode"]) || defaultFormData.roundingMode,
      periodPackages: (config.periodPackages as PeriodPackage[]) || defaultFormData.periodPackages,
    });
    setDialogOpen(true);
  };

  const handleSaveRule = async () => {
    if (!formData.name.trim()) return;

    const buildConfig = (): Record<string, unknown> => {
      const base = {
        pricePerHour: formData.pricePerHour,
        minimumMinutes: formData.minimumMinutes,
        minimumCharge: formData.minimumCharge,
        roundingMode: formData.roundingMode,
      };

      if (formData.type === "period") {
        return {
          ...base,
          periodPackages: formData.periodPackages.map((p) => ({
            name: p.name,
            duration: p.duration,
            price: p.price,
          })),
        };
      }

      return base;
    };

    const ruleData = {
      store_id: state.currentStore?.id || '',
      name: formData.name,
      type: formData.type,
      description: formData.description,
      weekdayTypes: formData.weekdayTypes,
      memberLevels: formData.memberLevels,
      priority: formData.priority,
      status: formData.status,
      config: buildConfig(),
    };

    try {
      if (editingRule) {
        await put(`${API_ENDPOINTS.pricingRuleUpdate}/${editingRule.id}`, ruleData);
        showToast("规则更新成功", "success");
      } else {
        await post(API_ENDPOINTS.pricingRuleCreate, ruleData);
        showToast("规则创建成功", "success");
      }
      setDialogOpen(false);
      loadRules();
    } catch (error) {
      showToast("操作失败，请重试", "error");
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await put(`${API_ENDPOINTS.pricingRuleToggle}/${id}`);
      showToast("状态已更新", "success");
      loadRules();
    } catch (error) {
      showToast("操作失败，请重试", "error");
    }
  };

  const handleDeleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    
    setConfirmConfig({
      title: "删除计费规则",
      message: `确定要删除「${rule.name}」吗？`,
      type: "delete",
      ruleId: id,
      ruleName: rule.name,
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    try {
      await del(`${API_ENDPOINTS.pricingRuleDelete}/${confirmConfig.ruleId}`);
      showToast("删除成功", "success");
      loadRules();
    } catch (error) {
      showToast("删除失败，请重试", "error");
    }
    setConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">标准计费规则</h2>
          <p className="text-sm text-slate-500">管理和配置门店球台的计费规则</p>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索计费规则..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl px-4 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-white" />
                <div>
                  <p className="text-sm font-bold text-white">{stats.total}</p>
                  <p className="text-xs text-white/80">规则</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl px-4 py-2 shadow-md">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <div>
                  <p className="text-sm font-bold text-white">{stats.active}</p>
                  <p className="text-xs text-white/80">启用</p>
                </div>
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] rounded-2xl">
                <SelectValue placeholder="计费类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="time">按时段计费</SelectItem>
                <SelectItem value="hourly">按小时计费</SelectItem>

              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filteredRules.map((rule) => {
          const typeInfo = pricingTypeLabels[rule.type] || pricingTypeLabels.time;
          const TypeIcon = typeInfo.icon;
          const pricePreview = getPricePreview(rule);
          return (
            <Card key={rule.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-slate-200 bg-white rounded-3xl">
              <CardContent className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                    (rule.type === "time") && "bg-gradient-to-br from-blue-500 to-cyan-500 text-white",
                    (rule.type === "hourly") && "bg-gradient-to-br from-emerald-500 to-teal-500 text-white",
                    rule.type === "period" && "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
                  )}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{rule.name}</h3>
                      <Badge variant={rule.status === "active" ? "default" : "outline"} className={
                        rule.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }>
                        {rule.status === "active" ? "启用" : "停用"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{typeInfo.label}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-400 truncate">{rule.description || "无描述"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {pricePreview.slice(0, 2).map((item, index) => (
                        <span key={index} className={`text-xs font-semibold ${item.color}`}>
                          {item.price}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(rule.id)} className="h-7 w-7">
                      {rule.status === "active" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(rule)} className="h-7 w-7">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    {rule.status === "inactive" && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteRule(rule.id)} className="h-7 w-7 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filteredRules.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-slate-100 flex items-center justify-center">
              <Table className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无计费规则</h3>
            <p className="text-slate-500 mb-4">创建第一条计费规则开始管理您的定价方案</p>
            <Button onClick={openAddDialog} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <Plus className="w-4 h-4 mr-2" />
              创建规则
            </Button>
          </div>
        )}
      </div>


      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200">
            <DialogTitle>{editingRule ? "编辑计费规则" : "新建计费规则"}</DialogTitle>
            <DialogDescription>{editingRule ? "修改计费规则的配置" : "创建一个新的计费规则"}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-3">
            <FormSection title="基本信息" icon={Settings}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>规则名称</Label>
                  <Input value={formData.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="例如：标准球台计时" />
                </div>
                <div className="space-y-2">
                  <Label>计费类型</Label>
                  <Select value={formData.type} onValueChange={(v) => updateForm("type", v as PricingRuleType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(pricingTypeLabels).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <info.icon className="w-4 h-4" />
                            {info.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>规则描述</Label>
                <Input value={formData.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="简要描述这条规则..." />
              </div>
            </FormSection>

            <FormSection title="适用场景" icon={Calendar}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>适用日期</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(weekdayLabels).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={formData.weekdayTypes.includes(key as WeekdayType)} onChange={(e) => {
                          const types = formData.weekdayTypes;
                          if (e.target.checked) {
                            updateForm("weekdayTypes", [...types, key as WeekdayType]);
                          } else {
                            updateForm("weekdayTypes", types.filter(t => t !== key));
                          }
                        }} className="rounded" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {(formData.type === "time" || formData.type === "hourly") && (
              <FormSection title="计费配置" icon={Clock}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>单价(元/小时)</Label>
                    <Input type="number" min="0" value={formData.pricePerHour} onChange={(e) => updateForm("pricePerHour", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>最低消费(元)</Label>
                      <span className="text-xs text-slate-400 cursor-help" title="设置最低消费金额，不足时按此金额收费">?</span>
                    </div>
                    <Input type="number" min="0" value={formData.minimumCharge} onChange={(e) => updateForm("minimumCharge", Number(e.target.value))} />
                    <p className="text-xs text-slate-400">消费低于此金额时，按此金额收费</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-1">
                      <Label>最低时长(分钟)</Label>
                      <span className="text-xs text-slate-400 cursor-help" title="设置最短计费时间，不足时按此时长计算">?</span>
                    </div>
                    <Input type="number" min="0" value={formData.minimumMinutes} onChange={(e) => updateForm("minimumMinutes", Number(e.target.value))} />
                    <p className="text-xs text-slate-400">使用时间低于此时长，按此时长计费</p>
                  </div>
                  <div className="space-y-2">
                    <Label>计费精度</Label>
                    <Select value={formData.roundingMode} onValueChange={(v) => updateForm("roundingMode", v as PricingRuleFormData["roundingMode"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(roundingModeLabels).map(([key, info]) => (
                          <SelectItem key={key} value={key} className="items-start">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{info.label}</span>
                              <span className="text-xs text-slate-500">{info.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.type === "time" && timePeriods.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm font-medium text-blue-800 mb-2">已配置时段（系统自动应用时段系数）</p>
                    <div className="flex flex-wrap gap-2">
                      {timePeriods.map((period) => (
                        <Badge key={period.id} className="bg-white border-blue-200 text-blue-700">
                          {period.name} ({period.start_time}-{period.end_time}) ×{period.coefficient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </FormSection>
            )}

            {formData.type === "period" && (
              <FormSection title="套餐配置" icon={Package}>
                <div className="space-y-4">
                  {formData.periodPackages.length > 0 ? (
                    formData.periodPackages.map((pkg, index) => (
                      <div key={pkg.id} className="grid grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-xs">套餐名称</Label>
                          <Input value={pkg.name} onChange={(e) => {
                            const packages = [...formData.periodPackages];
                            packages[index] = { ...pkg, name: e.target.value };
                            updateForm("periodPackages", packages);
                          }} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">时长(分钟)</Label>
                          <Input type="number" min="1" value={pkg.duration} onChange={(e) => {
                            const packages = [...formData.periodPackages];
                            packages[index] = { ...pkg, duration: Number(e.target.value) };
                            updateForm("periodPackages", packages);
                          }} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">价格(元)</Label>
                          <Input type="number" min="0" value={pkg.price} onChange={(e) => {
                            const packages = [...formData.periodPackages];
                            packages[index] = { ...pkg, price: Number(e.target.value) };
                            updateForm("periodPackages", packages);
                          }} className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">操作</Label>
                          <Button type="button" variant="outline" size="sm" onClick={() => {
                            const packages = formData.periodPackages.filter((_, i) => i !== index);
                            updateForm("periodPackages", packages);
                          }} className="h-8 w-full">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无套餐，请添加</p>
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={() => {
                    const newPkg: PeriodPackage = {
                      id: `pkg${Date.now()}`,
                      name: `新套餐${formData.periodPackages.length + 1}`,
                      duration: 120,
                      price: 68,
                    };
                    updateForm("periodPackages", [...formData.periodPackages, newPkg]);
                  }} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    添加套餐
                  </Button>
                </div>
              </FormSection>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button type="button" onClick={handleSaveRule} disabled={!formData.name.trim()} className="bg-gradient-to-r from-emerald-500 to-teal-500">
              <Save className="w-4 h-4 mr-2" />
              {editingRule ? "保存修改" : "创建规则"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmConfig.title}</DialogTitle>
            <DialogDescription>{confirmConfig.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmDialogOpen(false)}>取消</Button>
            <Button type="button" onClick={handleConfirm} className={cn(confirmConfig.type === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600")}>
              {confirmConfig.type === "delete" ? "确认删除" : "确认"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
