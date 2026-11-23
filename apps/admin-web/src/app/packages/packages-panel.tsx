"use client";

import { useState, useEffect, useMemo } from "react";
import { get, post, put, del } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import { ApiResponseType } from "@/lib/api/types";
import { Package, PackageType, PackageStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package as PackageIcon,
  Search,
  Plus,
  Clock,
  ShoppingBag,
  Users,
  Star,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export function PackagesPanel() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "time" as PackageType,
    price: 0,
    cost_price: 0,
    validity_days: 30,
    status: "active" as PackageStatus,
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      console.log("Loading packages from:", API_ENDPOINTS.packages);
      const [packagesData, productsData] = await Promise.all([
        get<Package[]>(API_ENDPOINTS.packages, undefined, ApiResponseType.ARRAY),
        get<any[]>("/product.Product/all", undefined, ApiResponseType.ARRAY),
      ]);
      console.log("Packages API response:", packagesData);
      console.log("Products API response:", productsData);
      setPackages(packagesData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleOpenAddDialog = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === "packages") {
        openDialog();
      }
    };
    
    window.addEventListener("openAddDialog", handleOpenAddDialog);
    return () => {
      window.removeEventListener("openAddDialog", handleOpenAddDialog);
    };
  }, []);

  const typeConfig: Record<PackageType, { label: string; icon: typeof Clock; color: string; gradient: string }> = {
    time: { label: "时长套餐", icon: Clock, color: "text-blue-600 bg-blue-50", gradient: "from-blue-500 to-indigo-500" },
    product: { label: "商品套餐", icon: ShoppingBag, color: "text-emerald-600 bg-emerald-50", gradient: "from-emerald-500 to-teal-500" },
    mixed: { label: "混合套餐", icon: PackageIcon, color: "text-purple-600 bg-purple-50", gradient: "from-purple-500 to-violet-500" },
    member: { label: "会员套餐", icon: Users, color: "text-amber-600 bg-amber-50", gradient: "from-amber-500 to-orange-500" },
  };

  const filteredPackages = packages.filter((pkg) => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || pkg.type === typeFilter;
    const matchesStatus = statusFilter === "all" || pkg.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = useMemo(() => {
    return {
      total: packages.length,
      active: packages.filter(p => p.status === "active").length,
      totalSales: packages.reduce((sum, p) => sum + (p.sales_count || 0), 0),
      totalRevenue: packages.reduce((sum, p) => sum + (p.price * (p.sales_count || 0)), 0),
      byType: {
        time: packages.filter(p => p.type === "time").length,
        product: packages.filter(p => p.type === "product").length,
        mixed: packages.filter(p => p.type === "mixed").length,
        member: packages.filter(p => p.type === "member").length,
      },
    };
  }, [packages]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const requestData = {
        name: formData.name,
        type: formData.type,
        price: formData.price,
        cost_price: formData.cost_price,
        validity_days: formData.validity_days,
        description: formData.description,
        status: formData.status === "active" ? 1 : 0,
      };

      if (editingPackage) {
        await put(`/package.Package/update/${editingPackage.id}`, requestData);
      } else {
        await post("/package.Package/create", requestData);
      }
      await loadData();
      setDialogOpen(false);
      setEditingPackage(null);
      resetForm();
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    setLoading(true);
    try {
      await del(`/package.Package/delete/${packageToDelete}`);
      await loadData();
      setDeleteConfirmOpen(false);
      setPackageToDelete(null);
      setDialogOpen(false);
      setEditingPackage(null);
    } catch (error) {
      console.error("Delete failed:", error);
      alert("删除失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    setLoading(true);
    try {
      await post("/package.Package/toggle", { id });
      await loadData();
    } catch (error) {
      console.error("Toggle failed:", error);
      alert("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "time",
      price: 0,
      cost_price: 0,
      validity_days: 30,
      status: "active",
      description: "",
    });
  };

  const openDialog = (pkg?: Package) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        type: pkg.type,
        price: pkg.price,
        cost_price: pkg.cost_price || 0,
        validity_days: pkg.validity_days,
        status: pkg.status,
        description: pkg.description || "",
      });
    } else {
      setEditingPackage(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const openDeleteConfirm = (id: string) => {
    setPackageToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const getPackageContent = (pkg: Package) => {
    switch (pkg.type) {
      case "time":
        const timeItem = pkg.time_items?.[0];
        return timeItem ? `${timeItem.duration}分钟` : "-";
      case "product":
        const count = pkg.product_items?.length || 0;
        return `${count}件商品`;
      case "mixed":
        const tCount = pkg.time_items_mixed?.length || 0;
        const pCount = pkg.product_items_mixed?.length || 0;
        return `${tCount}时段+${pCount}商品`;
      case "member":
        return pkg.member_level || "通用";
      default:
        return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="套餐总数" value={stats.total} icon={PackageIcon} gradient="from-indigo-500 to-purple-500" />
        <StatCard label="在售套餐" value={stats.active} icon={CheckCircle} gradient="from-emerald-500 to-teal-500" />
        <StatCard label="总销量" value={stats.totalSales} icon={TrendingUp} gradient="from-blue-500 to-indigo-500" />
        <StatCard label="总销售额" value={formatCurrency(stats.totalRevenue)} icon={CreditCard} gradient="from-amber-500 to-orange-500" small />
        <StatCard label="时长套餐" value={stats.byType.time} icon={Clock} gradient="from-cyan-500 to-blue-500" />
        <StatCard label="商品套餐" value={stats.byType.product} icon={ShoppingBag} gradient="from-emerald-500 to-green-500" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.byType.time}</p>
              <p className="text-sm text-slate-500">时长套餐</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.byType.product}</p>
              <p className="text-sm text-slate-500">商品套餐</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <PackageIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.byType.mixed}</p>
              <p className="text-sm text-slate-500">混合套餐</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.byType.member}</p>
              <p className="text-sm text-slate-500">会员套餐</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="bg-white rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="搜索套餐名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(typeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] rounded-xl">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">在售</SelectItem>
                <SelectItem value="inactive">已下架</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setViewMode("cards")}
              >
                卡片
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-lg"
                onClick={() => setViewMode("list")}
              >
                列表
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredPackages.map((pkg) => {
            const config = typeConfig[pkg.type as PackageType] || typeConfig.time;
            const TypeIcon = config.icon;
            return (
              <Card key={pkg.id} className="bg-white rounded-2xl hover:shadow-lg transition-all overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.gradient} shadow-lg`}>
                        <TypeIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{pkg.name}</h3>
                        <Badge className={`${config.color} border-0 mt-1`}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                    <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                      {pkg.status === "active" ? "在售" : "已下架"}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-slate-900">{formatCurrency(pkg.price)}</span>
                      {pkg.cost_price && (
                        <span className="text-sm text-slate-400 line-through">{formatCurrency(pkg.cost_price)}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">有效期 {pkg.validity_days} 天</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">套餐内容</span>
                      <span className="font-medium text-slate-700">{getPackageContent(pkg)}</span>
                    </div>
                  </div>

                  {pkg.description && (
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{pkg.description}</p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <TrendingUp className="w-4 h-4" />
                      <span>销量 {pkg.sales_count || 0}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(pkg)}
                        disabled={loading}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => openDeleteConfirm(pkg.id)}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-white rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 text-sm font-medium text-slate-500">套餐</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">类型</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">售价</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">成本价</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">有效期</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">销量</th>
                    <th className="text-center p-4 text-sm font-medium text-slate-500">状态</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPackages.map((pkg) => {
                    const config = typeConfig[pkg.type as PackageType] || typeConfig.time;
                    const TypeIcon = config.icon;
                    return (
                      <tr key={pkg.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient}`}>
                              <TypeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{pkg.name}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{pkg.description || "-"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${config.color} border-0`}>{config.label}</Badge>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-900">
                          {formatCurrency(pkg.price)}
                        </td>
                        <td className="p-4 text-right text-slate-500">
                          {pkg.cost_price ? formatCurrency(pkg.cost_price) : "-"}
                        </td>
                        <td className="p-4 text-right text-slate-500">
                          {pkg.validity_days}天
                        </td>
                        <td className="p-4 text-right font-medium text-slate-900">
                          {pkg.sales_count || 0}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                            {pkg.status === "active" ? "在售" : "已下架"}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => openDialog(pkg)} disabled={loading}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => openDeleteConfirm(pkg.id)}
                              disabled={loading}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredPackages.length === 0 && (
              <div className="text-center py-12">
                <PackageIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">暂无套餐数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200 bg-white">
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <PackageIcon className="w-5 h-5 text-purple-500" />
              {editingPackage ? "编辑套餐" : "添加套餐"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage ? "修改套餐信息" : "创建新的销售套餐"}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">套餐名称</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="如：畅打2小时、欢乐套餐"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">套餐类型</label>
                <Select
                  value={formData.type}
                  onValueChange={(value: PackageType) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">状态</label>
                <Select
                  value={formData.status}
                  onValueChange={(value: PackageStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">在售</SelectItem>
                    <SelectItem value="inactive">已下架</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">售价 (元)</label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">成本价 (元)</label>
                <Input
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">有效期 (天)</label>
                <Input
                  type="number"
                  value={formData.validity_days}
                  onChange={(e) => setFormData({ ...formData, validity_days: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">套餐描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述套餐内容和使用说明"
                className="rounded-xl"
              />
            </div>

            {editingPackage && (
              <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">删除此套餐</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-100"
                    onClick={() => openDeleteConfirm(editingPackage.id)}
                    disabled={loading}
                  >
                    确认删除
                  </Button>
                </div>
                <p className="text-xs text-red-500 mt-1">
                  删除后无法恢复，相关订单数据不受影响
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-shrink-0 border-t border-slate-200 bg-white flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setEditingPackage(null);
              }}
              className="rounded-xl"
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.name || formData.price <= 0 || loading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              确定要删除此套餐吗？此操作无法撤销，相关订单数据不受影响。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="rounded-xl"
              disabled={loading}
            >
              取消
            </Button>
            <Button
              onClick={handleDelete}
              className="rounded-xl bg-red-500 hover:bg-red-600 text-white"
              disabled={loading}
            >
              {loading ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  small = false,
}: {
  label: string;
  value: number | string;
  icon: typeof Clock;
  gradient: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className={`font-bold text-slate-900 ${small ? "text-lg" : "text-xl"}`}>{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}