"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/hooks/use-app";
import { Table as TableData, TableStatus, TableType as TableTypeModel, Zone, PricingRule } from "@/lib/types";
import { get, post, put, del } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { ApiResponseType } from "@/lib/api/types";

import { useToast } from "@/lib/toast-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  MoreVertical,
  MapPin,
  Settings,
  RefreshCw,
  LayoutGrid,
  List,
  TrendingUp,
  X,
  Gamepad2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const tableStatusLabels: Record<TableStatus, string> = {
  idle: "空闲",
  occupied: "使用中",
  reserved: "预约",
  maintenance: "维护",
};

const tableStatusColors: Record<TableStatus, string> = {
  idle: "bg-emerald-100 text-emerald-700",
  occupied: "bg-rose-100 text-rose-700",
  reserved: "bg-amber-100 text-amber-700",
  maintenance: "bg-slate-100 text-slate-600",
};

function getStatusStyle(status: TableStatus): string {
  return tableStatusColors[status];
}

function StatCard({
  label,
  value,
  subValue,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  color: "green" | "red" | "amber" | "gray" | "slate" | "cyan";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colorMap = {
    green: { bg: "from-emerald-400 to-teal-500", text: "text-emerald-600", light: "bg-emerald-50" },
    red: { bg: "from-rose-400 to-red-500", text: "text-rose-600", light: "bg-rose-50" },
    amber: { bg: "from-amber-400 to-orange-500", text: "text-amber-600", light: "bg-amber-50" },
    gray: { bg: "from-slate-400 to-slate-500", text: "text-slate-600", light: "bg-slate-50" },
    slate: { bg: "from-slate-400 to-slate-500", text: "text-slate-600", light: "bg-slate-50" },
    cyan: { bg: "from-cyan-400 to-teal-500", text: "text-cyan-600", light: "bg-cyan-50" },
  };

  return (
    <div className={`rounded-2xl border border-slate-200/60 p-5 shadow-sm hover:shadow-lg transition-all duration-300 ${colorMap[color].light}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">{label}</p>
          <p className={`text-2xl font-bold ${colorMap[color].text}`}>{value}</p>
          {subValue && <p className="text-sm text-slate-600 mt-1">{subValue}</p>}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TablesManagementTab() {
  const { state } = useApp();
  const { currentStore } = state;
  const { toast, warning } = useToast();

  // 状态
  const [tables, setTables] = useState<TableData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [tableTypes, setTableTypes] = useState<TableTypeModel[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");

  // 对话框状态
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [editTableOpen, setEditTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<TableData | null>(null);

  // 新增台桌表单
  const [newTable, setNewTable] = useState({
    number: "",
    name: "",
    type: "standard" as string,
    tableTypeId: "none",
    zoneId: "",
    pricingRuleId: "none",
  });

  // 编辑台桌表单
  const [editForm, setEditForm] = useState({
    number: "",
    name: "",
    type: "standard" as string,
    tableTypeId: "none",
    zoneId: "",
    pricingRuleId: "none",
  });

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!currentStore) return;

      try {
        const zonesData = await get<Zone[]>(API_ENDPOINTS.zonesAll, {}, ApiResponseType.ARRAY);
        setZones(zonesData);

        const tableTypesData = await get<TableTypeModel[]>(API_ENDPOINTS.tableTypeAll, {}, ApiResponseType.ARRAY);
        setTableTypes(tableTypesData);

        const rulesData = await get<PricingRule[]>(API_ENDPOINTS.pricingRules, {}, ApiResponseType.ARRAY);
        const rules = rulesData.filter((r: PricingRule) => r.status === 'active');
        setPricingRules(rules);

        const tablesData = await get<TableData[]>(API_ENDPOINTS.tables, { store_id: currentStore.id }, ApiResponseType.ARRAY);
        setTables(tablesData);
      } catch (error) {
        console.error('Failed to load table data:', error);
        warning("加载台桌数据失败，请刷新页面重试");
      }
    };

    loadData();
  }, [currentStore]);

  const refreshData = async () => {
    if (!currentStore) return;
    try {
      const tablesData = await get<TableData[]>(API_ENDPOINTS.tables, { store_id: currentStore.id }, ApiResponseType.ARRAY);
      setTables(tablesData);

      const rulesData = await get<PricingRule[]>(API_ENDPOINTS.pricingRules, {}, ApiResponseType.ARRAY);
      const rules = Array.isArray(rulesData) ? rulesData.filter((r: PricingRule) => r.status === 'active') : [];
      setPricingRules(rules);
    } catch (error) {
      console.error('Failed to refresh table data:', error);
      toast("warning", "刷新数据失败，请重试");
    }
  };

  // 统计数据
  const stats = {
    total: tables.length,
    idle: tables.filter((t) => t.status === "idle").length,
    occupied: tables.filter((t) => t.status === "occupied").length,
    reserved: tables.filter((t) => t.status === "reserved").length,
    maintenance: tables.filter((t) => t.status === "maintenance").length,
  };

  // 筛选台桌
  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      searchQuery === "" ||
      table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.name &&
        table.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || table.status === statusFilter;
    const matchesZone =
      zoneFilter === "all" ||
      table.zone_id === zoneFilter;
    return matchesSearch && matchesStatus && matchesZone;
  });

  // 筛选分区（只显示有台桌的分区，或显示全部当筛选为all时）
  const filteredZones = zones.filter((zone) => {
    const hasTables = filteredTables.some((t) => t.zone_id === zone.id);
    return zoneFilter === "all" || zone.id === zoneFilter ? true : hasTables;
  });

  // 处理新增台桌
  const handleAddTable = async () => {
    if (!newTable.zoneId || !currentStore) return;

    try {
      const result = await post<TableData>('/table.Table/create', {
        store_id: currentStore?.id || '',
        number: newTable.number || undefined,
        name: newTable.name || '',
        type: newTable.type || 'standard',
        table_type_id: newTable.tableTypeId === "none" ? "" : newTable.tableTypeId,
        zone_id: newTable.zoneId,
        pricing_id: newTable.pricingRuleId === "none" ? "" : newTable.pricingRuleId,
      });

      if (result) {
        await refreshData();
        setNewTable({
          number: "",
          name: "",
          type: "standard",
          tableTypeId: "none",
          zoneId: "",
          pricingRuleId: "none",
        });
        setAddTableOpen(false);
      }
    } catch (error) {
      console.error('Failed to add table:', error);
      toast("warning", "添加台桌失败，请重试");
    }
  };

  // 打开编辑对话框
  const handleEditTable = (table: TableData) => {
    setEditingTable(table);
    setEditForm({
      number: table.number,
      name: table.name || "",
      type: (table as any).type || "standard",
      tableTypeId: table.table_type_id || "none",
      zoneId: table.zone_id || "",
      pricingRuleId: table.pricing_id || "none",
    });
    setEditTableOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingTable) return;

    try {
      const result = await put<TableData>(`/table.Table/update/${editingTable.id}`, {
        store_id: currentStore?.id || '',
        number: editForm.number,
        name: editForm.name || '',
        type: editForm.type || 'standard',
        table_type_id: editForm.tableTypeId === "none" ? "" : editForm.tableTypeId,
        zone_id: editForm.zoneId,
        pricing_id: editForm.pricingRuleId === "none" ? "" : editForm.pricingRuleId,
      });

      if (result) {
        await refreshData();
        setEditTableOpen(false);
        setEditingTable(null);
      }
    } catch (error) {
      console.error('Failed to update table:', error);
      toast("warning", "更新台桌失败，请重试");
    }
  };

  // 打开删除确认对话框
  const handleOpenDeleteConfirm = (table: TableData) => {
    setTableToDelete(table);
    setDeleteConfirmOpen(true);
  };

  // 确认删除台桌
  const handleConfirmDelete = async () => {
    if (!tableToDelete) return;

    try {
      await del(`/table.Table/delete/${tableToDelete.id}`);
      await refreshData();
      setDeleteConfirmOpen(false);
      setTableToDelete(null);
      setEditTableOpen(false);
      setEditingTable(null);
    } catch (error) {
      console.error('Failed to delete table:', error);
      warning("删除台桌失败，请重试");
    }
  };

  // 获取台桌绑定的计费规则名称
  const getPricingRuleName = (ruleId: string | undefined) => {
    if (!ruleId) return "未设置";
    const rule = pricingRules.find((r) => r.id === ruleId);
    return rule ? rule.name : "未设置";
  };

  // 获取台型名称
  const getTableTypeName = (typeId: string | undefined) => {
    if (!typeId || typeId === "none") return "未设置";
    const type = tableTypes.find((t) => t.id === typeId);
    return type ? type.name : "未设置";
  };

  // 渲染状态图标
  const renderStatusIcon = (status: TableStatus, isActive: boolean) => {
    const iconClass = `w-4 h-4 ${
      isActive ? "text-emerald-600" :
      status === 'reserved' ? "text-amber-600" :
      status === 'maintenance' ? "text-slate-500" :
      "text-slate-400"
    }`;

    switch (status) {
      case "idle":
        return <CheckCircle className={iconClass} />;
      case "occupied":
        return <XCircle className={iconClass} />;
      case "reserved":
        return <Calendar className={iconClass} />;
      case "maintenance":
        return <Settings className={iconClass} />;
      default:
        return <CheckCircle className={iconClass} />;
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">台桌管理</h2>
          <p className="text-sm text-slate-500">管理和配置场馆台桌信息</p>
        </div>
        <Button
          onClick={() => setAddTableOpen(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          新增台桌
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="全部台桌" value={stats.total} subValue={`${stats.occupied} 使用中`} color="slate" icon={Gamepad2} />
        <StatCard label="空闲" value={stats.idle} color="green" icon={CheckCircle} />
        <StatCard label="使用中" value={stats.occupied} color="red" icon={XCircle} />
        <StatCard label="预约中" value={stats.reserved} color="amber" icon={Calendar} />
        <StatCard label="维护中" value={stats.maintenance} color="gray" icon={Settings} />
        <StatCard label="使用率" value={`${stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0}%`} color="cyan" icon={TrendingUp} />
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="搜索台桌编号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TableStatus | "all")}
          >
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="台桌状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="idle">空闲</SelectItem>
              <SelectItem value="occupied">使用中</SelectItem>
              <SelectItem value="reserved">预约中</SelectItem>
              <SelectItem value="maintenance">维护中</SelectItem>
            </SelectContent>
          </Select>

          {/* Zone Filter */}
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="分区" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分区</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    {zone.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            <Button
              variant={viewMode === "card" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("card")}
              className="rounded-lg"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-lg"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 hover:border-emerald-300 hover:bg-emerald-50"
            onClick={refreshData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
        </div>
      </Card>

      {/* Table Cards - Grouped by Zone */}
      {viewMode === "card" ? (
        <div className="space-y-6">
          {(() => {
            const noZoneTables = filteredTables.filter(t => !t.zone_id);
            if (noZoneTables.length === 0) return null;
            return (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm">
                    <MapPin className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">未分区</h3>
                    <p className="text-sm text-slate-500">{noZoneTables.length} 张台桌</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {noZoneTables.map((table) => {
                    const isActive = table.status === "occupied";
                    return (
                      <Card
                        key={table.id}
                        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                          isActive 
                            ? "border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white" 
                            : table.status === 'reserved'
                              ? "border-amber-200 bg-gradient-to-br from-amber-50/30 to-white"
                              : table.status === 'maintenance'
                                ? "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white"
                                : "border-slate-100 bg-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-3 right-3">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          </div>
                        )}
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                              isActive ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white" :
                              table.status === 'reserved' ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                              table.status === 'maintenance' ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white" :
                              "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"
                            }`}>
                              {table.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold text-slate-800 truncate">
                                {table.name || `台桌 ${table.number}`}
                              </CardTitle>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-xs text-slate-500">{getTableTypeName(table.table_type_id)}</span>
                                {(table as any).code && <span className="text-xs text-slate-400 font-mono">{(table as any).code}</span>}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel className="text-xs">操作</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditTable(table)} className="text-sm"><Settings className="w-4 h-4 mr-2" />编辑</DropdownMenuItem>
                                <DropdownMenuItem className="text-sm text-red-500" onClick={() => handleOpenDeleteConfirm(table)}><Trash2 className="w-4 h-4 mr-2" />删除</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderStatusIcon(table.status, isActive)}
                              <Badge variant="secondary" className={`text-xs font-medium ${getStatusStyle(table.status)}`}>
                                {tableStatusLabels[table.status]}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500">计费规则: <span className="text-slate-700 font-medium">{getPricingRuleName(table.pricing_id)}</span></p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Zone Groups */}
          {filteredZones.map((zone) => {
            const zoneTables = filteredTables.filter(t => t.zone_id === zone.id);
            if (zoneTables.length === 0) return null;
            return (
              <div key={zone.id}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${zone.color}20` }}>
                    <MapPin className="w-5 h-5" style={{ color: zone.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{zone.name}</h3>
                    <p className="text-sm text-slate-500">{zoneTables.length} 张台桌 · {zone.description || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {zoneTables.map((table) => {
                    const isActive = table.status === "occupied";
                    return (
                      <Card
                        key={table.id}
                        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                          isActive
                            ? "border-emerald-200 bg-gradient-to-br from-emerald-50/30 to-white"
                            : table.status === 'reserved'
                              ? "border-amber-200 bg-gradient-to-br from-amber-50/30 to-white"
                              : table.status === 'maintenance'
                                ? "border-slate-200 bg-gradient-to-br from-slate-50/50 to-white"
                                : "border-slate-100 bg-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-3 right-3">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                          </div>
                        )}
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-md ${
                              isActive ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white" :
                              table.status === 'reserved' ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                              table.status === 'maintenance' ? "bg-gradient-to-br from-slate-400 to-slate-500 text-white" :
                              "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"
                            }`}>
                              {table.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base font-semibold text-slate-800 truncate">
                                {table.name || `台桌 ${table.number}`}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-0.5">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: zone.color }} />
                                <span className="text-xs text-slate-500">{getTableTypeName(table.table_type_id)}</span>
                                {(table as any).code && <span className="text-xs text-slate-400 font-mono">{(table as any).code}</span>}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuLabel className="text-xs">操作</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleEditTable(table)} className="text-sm"><Settings className="w-4 h-4 mr-2" />编辑</DropdownMenuItem>
                                <DropdownMenuItem className="text-sm text-red-500" onClick={() => handleOpenDeleteConfirm(table)}><Trash2 className="w-4 h-4 mr-2" />删除</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderStatusIcon(table.status, isActive)}
                              <Badge variant="secondary" className={`text-xs font-medium ${getStatusStyle(table.status)}`}>
                                {tableStatusLabels[table.status]}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-500">计费规则: <span className="text-slate-700 font-medium">{getPricingRuleName(table.pricing_id)}</span></p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          
          {filteredTables.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Gamepad2 className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-base">暂无台桌数据</p>
              <p className="text-slate-400 text-sm mt-1">点击上方"新增台桌"按钮添加</p>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-white border-slate-200/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 hover:bg-transparent">
                  <TableHead className="text-slate-500">台桌编号</TableHead>
                  <TableHead className="text-slate-500">编码</TableHead>
                  <TableHead className="text-slate-500">名称</TableHead>
                  <TableHead className="text-slate-500">分区</TableHead>
                  <TableHead className="text-slate-500">台型</TableHead>
                  <TableHead className="text-slate-500">计费规则</TableHead>
                  <TableHead className="text-slate-500">状态</TableHead>
                  <TableHead className="text-right text-slate-500">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTables.map((table) => {
                  const zone = zones.find((z) => z.id === table.zone_id);
                  const isActive = table.status === "occupied";

                  return (
                    <TableRow key={table.id} className="border-slate-100">
                      <TableCell className="font-medium text-slate-900">
                        {table.number}
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">
                        {(table as any).code || "-"}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {table.name || "-"}
                      </TableCell>
                      <TableCell>
                        {zone && (
                          <Badge variant="outline" className="border-slate-300">
                            <div
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ backgroundColor: zone.color }}
                            />
                            {zone.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {getTableTypeName(table.table_type_id)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {getPricingRuleName(table.pricing_id)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusStyle(table.status)}>
                          {tableStatusLabels[table.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-600"
                            onClick={() => handleEditTable(table)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleOpenDeleteConfirm(table)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


      {/* 新增台桌对话框 */}
      <Dialog open={addTableOpen} onOpenChange={setAddTableOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col bg-white border-slate-200">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200 bg-white">
            <DialogTitle className="text-slate-900">新增台桌</DialogTitle>
            <DialogDescription>添加新的球台到当前门店</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">台桌编号 *</Label>
              <Input
                id="tableNumber"
                placeholder="例如：A01"
                value={newTable.number}
                onChange={(e) =>
                  setNewTable({ ...newTable, number: e.target.value })
                }
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableName">台桌名称</Label>
              <Input
                id="tableName"
                placeholder="可选名称"
                value={newTable.name}
                onChange={(e) =>
                  setNewTable({ ...newTable, name: e.target.value })
                }
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableCategory">台桌类别</Label>
              <Select
                value={newTable.type}
                onValueChange={(v) =>
                  setNewTable({ ...newTable, type: v })
                }
              >
                <SelectTrigger id="tableCategory" className="border-slate-300">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">普通台</SelectItem>
                  <SelectItem value="virtual">虚拟台</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableType">台型</Label>
              <Select
                value={newTable.tableTypeId}
                onValueChange={(v) =>
                  setNewTable({ ...newTable, tableTypeId: v })
                }
              >
                <SelectTrigger id="tableType" className="border-slate-300">
                  <SelectValue placeholder="选择台型（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定</SelectItem>
                  {tableTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        {type.description && (
                          <span className="text-xs text-slate-500">{type.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableZone">所属分区 *</Label>
              <Select
                value={newTable.zoneId}
                onValueChange={(v) =>
                  setNewTable({ ...newTable, zoneId: v })
                }
              >
                <SelectTrigger id="tableZone" className="border-slate-300">
                  <SelectValue placeholder="选择分区" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                        {zone.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricingRule">计费规则</Label>
              <Select
                value={newTable.pricingRuleId}
                onValueChange={(v) =>
                  setNewTable({ ...newTable, pricingRuleId: v })
                }
              >
                <SelectTrigger id="pricingRule" className="border-slate-300">
                  <SelectValue placeholder="选择计费规则（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定</SelectItem>
                  {pricingRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{rule.name}</span>
                        <span className="text-xs text-slate-500">
                          {rule.type === 'time' ? '按时段计费' : rule.type === 'period' ? '包时段计费' : rule.type} · 
                          ¥{(rule.config?.pricePerHour || 0)}/小时
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                不指定则使用分区默认计费规则
              </p>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-white">
            <Button variant="outline" onClick={() => setAddTableOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleAddTable}
              disabled={!newTable.number || !newTable.zoneId}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加台桌
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑台桌对话框 */}
      <Dialog open={editTableOpen} onOpenChange={setEditTableOpen}>
        <DialogContent className="max-h-[80vh] flex flex-col bg-white border-slate-200">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200 bg-white">
            <DialogTitle className="text-slate-900">编辑台桌</DialogTitle>
            <DialogDescription>修改台桌配置信息</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editNumber">台桌编号 *</Label>
              <Input
                id="editNumber"
                placeholder="例如：A01"
                value={editForm.number}
                onChange={(e) =>
                  setEditForm({ ...editForm, number: e.target.value })
                }
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editName">台桌名称</Label>
              <Input
                id="editName"
                placeholder="可选名称"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editCategory">台桌类别</Label>
              <Select
                value={editForm.type}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, type: v })
                }
              >
                <SelectTrigger id="editCategory" className="border-slate-300">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">普通台</SelectItem>
                  <SelectItem value="virtual">虚拟台</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editType">台型</Label>
              <Select
                value={editForm.tableTypeId}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, tableTypeId: v })
                }
              >
                <SelectTrigger id="editType" className="border-slate-300">
                  <SelectValue placeholder="选择台型（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定</SelectItem>
                  {tableTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.name}</span>
                        {type.description && (
                          <span className="text-xs text-slate-500">{type.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editZone">所属分区 *</Label>
              <Select
                value={editForm.zoneId}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, zoneId: v })
                }
              >
                <SelectTrigger id="editZone" className="border-slate-300">
                  <SelectValue placeholder="选择分区" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: zone.color }}
                        />
                        {zone.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPricingRule">计费规则</Label>
              <Select
                value={editForm.pricingRuleId}
                onValueChange={(v) =>
                  setEditForm({ ...editForm, pricingRuleId: v })
                }
              >
                <SelectTrigger id="editPricingRule" className="border-slate-300">
                  <SelectValue placeholder="选择计费规则（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不指定</SelectItem>
                  {pricingRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{rule.name}</span>
                        <span className="text-xs text-slate-500">
                          {rule.type === 'time' ? '按时段计费' : rule.type === 'period' ? '包时段计费' : rule.type} · 
                          ¥{(rule.config?.pricePerHour || 0)}/小时
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                不指定则使用分区默认计费规则
              </p>
            </div>

          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-white">
            <Button variant="outline" onClick={() => setEditTableOpen(false)}>
              取消
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600"
              onClick={handleSaveEdit}
              disabled={!editForm.number || !editForm.zoneId}
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white border-slate-200">
          <div className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-slate-900">确认删除</DialogTitle>
              <DialogDescription className="text-slate-600 mt-1">
                确定要删除台桌 <span className="font-medium">{tableToDelete?.number}</span> 吗？此操作不可撤销。
              </DialogDescription>
            </div>
          </div>
          <DialogFooter className="border-t border-slate-200">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={handleConfirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

{/* 使用统计对话框 */}
    </div>
  );
}
