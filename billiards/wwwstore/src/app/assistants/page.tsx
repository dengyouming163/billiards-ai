"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Assistant, AssistantLevel } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { useApp } from "@/hooks/use-app";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
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
  GraduationCap,
  Search,
  Plus,
  Star,
  Award,
  Edit,
  DollarSign,
  Calendar,
  TrendingUp,
  Trophy,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  Trash2,
  Settings,
} from "lucide-react";
import {
  fetchAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  fetchAssistantLevels,
  createAssistantLevel,
  updateAssistantLevel,
  deleteAssistantLevel,
  initLevels,
  fetchAssistantStats,
  fetchAssistantAlbum,
  uploadAssistantAlbum,
  deleteAssistantAlbum,
  type AssistantLevel as ApiAssistantLevel,
} from "@/lib/api/assistants";
import ScheduleManager from "@/components/assistant/ScheduleManager";
import ShiftConfigPanel from "@/components/assistant/ShiftConfigPanel";
import CommissionConfigPanel from "@/components/assistant/CommissionConfigPanel";
import { AssistantsSalaryTab } from "./components/assistants-salary-tab";
import { AssistantsLevelsTab } from "./components/assistants-levels-tab";

export default function AssistantsPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('assistant:list')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const { state } = useApp();
  const { currentStore } = state;
  const [activeTab, setActiveTab] = useState<"list" | "levels" | "schedule" | "commission" | "salary">("list");
  const [scheduleSubTab, setScheduleSubTab] = useState<"calendar" | "config">("calendar");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [levels, setLevels] = useState<ApiAssistantLevel[]>([]);
  const [stats, setStats] = useState({
    total_assistants: 0,
    today_orders: 0,
    month_revenue: 0,
    total_revenue: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [albumDialogOpen, setAlbumDialogOpen] = useState(false);
  const [albumImages, setAlbumImages] = useState<string[]>([]);
  const [albumUploading, setAlbumUploading] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null);
  const [expandedAssistant, setExpandedAssistant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  const [newAssistant, setNewAssistant] = useState({
    name: "",
    level: "junior" as AssistantLevel,
    phone: "",
    skills: [] as string[],
    hourly_rate: 60,
    billing_rule: "half_hour" as "minute" | "half_hour",
    description: "",
    avatar: "",
  });

  const skillOptions = [
    "基础教学",
    "技术提升",
    "比赛指导",
    "花式台球",
    "心理辅导",
    "新手入门",
    "战术分析",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    
    try {
      const [assistantsRes, levelsRes, statsRes] = await Promise.all([
        fetchAssistants(),
        fetchAssistantLevels(),
        fetchAssistantStats(),
      ]);
      setAssistants(assistantsRes.data || []);
      setLevels(levelsRes || []);
      setStats(statsRes || { total_assistants: 0, today_orders: 0, month_revenue: 0, total_revenue: 0 });
    } catch (error) {
      console.error("加载数据失败:", error);
    } finally {
      
    }
  };

  const levelConfig: Record<AssistantLevel, { label: string; color: string; gradient: string }> = {
    junior: { label: "初级", color: "text-green-600 bg-green-50", gradient: "from-green-500 to-emerald-500" },
    intermediate: { label: "中级", color: "text-blue-600 bg-blue-50", gradient: "from-blue-500 to-indigo-500" },
    senior: { label: "高级", color: "text-purple-600 bg-purple-50", gradient: "from-purple-500 to-violet-500" },
    gold: { label: "金牌", color: "text-amber-600 bg-amber-50", gradient: "from-amber-500 to-orange-500" },
  };

  const getLevelConfig = (levelId: string) => {
    const level = levels.find((l) => l.id === levelId || l.code === levelId);
    if (level) {
      return {
        label: level.name,
        color: level.color || `#64748b`,
        gradient: `from-slate-500 to-slate-600`,
        customColor: level.color,
      };
    }
    return levelConfig[levelId as AssistantLevel] || levelConfig.junior;
  };

  const filteredAssistants = assistants.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === "all" || a.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const ranking = assistants
    .map((a) => ({
      ...a,
    }))
    .slice(0, 5);

  const handleSaveAssistant = async () => {

    try {
      const level = levels.find((l) => l.code === newAssistant.level) || levels[0];
      await createAssistant({
        store_id: currentStore?.id || "",
        name: newAssistant.name,
        phone: newAssistant.phone,
        level_id: level?.id || "",
        level: newAssistant.level,
        skills: newAssistant.skills,
        hourly_rate: newAssistant.hourly_rate || level?.hourly_rate || 60,
        billing_rule: newAssistant.billing_rule || "half_hour",
        description: newAssistant.description,
        avatar: newAssistant.avatar,
        status: "available",
        rating: 5,
        service_count: 0,
        total_hours: 0,
      });
      await loadData();
      setAddDialogOpen(false);
      setNewAssistant({
        name: "",
        level: "junior",
        phone: "",
        skills: [],
        hourly_rate: level?.hourly_rate || 60,
        billing_rule: "half_hour",
        description: "",
        avatar: "",
      });
    } catch (error) {
      console.error("创建助教失败:", error);
    } finally {
      
    }
  };

  const handleUpdateAssistant = async () => {
    if (!editingAssistant) return;

    try {
      const levelId = levels.find((l) => l.code === (editingAssistant as any).level)?.id || (editingAssistant as any).level_id;
      await updateAssistant(editingAssistant.id, { ...editingAssistant, level_id: levelId });
      await loadData();
      setEditingAssistant(null);
      setDetailDialogOpen(false);
    } catch (error) {
      console.error("更新助教失败:", error);
    } finally {
      
    }
  };

  const handleDeleteAssistant = async (id: string) => {
    if (!confirm("确定要删除该助教吗？删除后可在数据库恢复。")) return;
    try {
      await deleteAssistant(id);
      await loadData();
      setDetailDialogOpen(false);
    } catch (error) {
      console.error("删除助教失败:", error);
    }
  };

  const openAlbumManager = async (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setAlbumDialogOpen(true);
    setAlbumUploading(false);
    try {
      const res = await fetchAssistantAlbum(assistant.id);
      setAlbumImages(res.album || []);
    } catch {
      setAlbumImages([]);
    }
  };

  const handleAlbumUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAssistant) return;
    if (file.size > 5 * 1024 * 1024) { alert('图片大小不能超过5MB'); return; }
    setAlbumUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'product');
      const res = await fetch('http://poolapi.kyyp.cn/storeapi/upload.Upload/image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.code === 1 && data.data?.url) {
        await uploadAssistantAlbum(selectedAssistant.id, data.data.url);
        setAlbumImages(prev => [...prev, data.data.url]);
      } else {
        alert('上传失败');
      }
    } catch { alert('上传失败'); }
    finally { setAlbumUploading(false); }
  };

  const handleAlbumDelete = async (url: string) => {
    if (!selectedAssistant || !confirm('确定要删除这张照片吗？')) return;
    try {
      await deleteAssistantAlbum(selectedAssistant.id, url);
      setAlbumImages(prev => prev.filter(u => u !== url));
    } catch { alert('删除失败'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="助教管理" 
        description="管理教练团队、排班、评价等功能" 
        icon={GraduationCap}
      >
        <Button
          className="rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#06AD56] hover:to-[#07C160] text-white shadow-lg shadow-[#07C160]/25"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加助教
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl">
        <Button
          variant={activeTab === "list" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "list"
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl"
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("list")}
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          助教列表
        </Button>
        <Button
          variant={activeTab === "levels" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "levels"
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl"
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("levels")}
        >
          <Award className="w-4 h-4 mr-2" />
          助教等级
        </Button>
        <Button
          variant={activeTab === "schedule" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "schedule"
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl"
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("schedule")}
        >
          <Calendar className="w-4 h-4 mr-2" />
          排班管理
        </Button>
        <Button
          variant={activeTab === "commission" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "commission"
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl"
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("commission")}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          提成管理
        </Button>
        <Button
          variant={activeTab === "salary" ? "default" : "ghost"}
          size="sm"
          className={`rounded-full transition-all duration-200 px-4 ${
            activeTab === "salary"
              ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25 hover:shadow-xl"
              : "hover:bg-white/80"
          }`}
          onClick={() => setActiveTab("salary")}
        >
          <DollarSign className="w-4 h-4 mr-2" />
          助教薪资
        </Button>
      </div>

      {activeTab === "list" && (
        <div className="rounded-[24px] border border-[#e5e5e5] bg-white shadow-sm overflow-hidden">
          <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-black">助教列表</h2>
                <p className="text-sm text-[#999999]">管理助教档案、等级和相册信息</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="助教总数"
              value={stats.total_assistants}
              icon={GraduationCap}
              gradient="from-[#FF976A] to-[#FF7A45]"
            />
            <StatCard
              label="今日订单"
              value={stats.today_orders}
              icon={CalendarCheck}
              gradient="from-[#06B6D4] to-[#0891B2]"
            />
            <StatCard
              label="本月营收"
              value={formatCurrency(stats.month_revenue)}
              icon={TrendingUp}
              gradient="from-[#07C160] to-[#06AD56]"
            />
            <StatCard
              label="累计营收"
              value={formatCurrency(stats.total_revenue)}
              icon={DollarSign}
              gradient="from-[#8B5CF6] to-[#7C3AED]"
            />
          </div>

{/* 业绩排行榜 - 暂时隐藏，后续启用 */}
      {/* <Card className="bg-white rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            业绩排行榜
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking.map((assistant, index) => {
              const levelInfo = getLevelConfig(assistant.level);
              return (
                <div
                  key={assistant.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? "bg-amber-500" :
                      index === 1 ? "bg-slate-400" :
                      index === 2 ? "bg-amber-700" :
                      "bg-slate-300"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-3">
                      {assistant.avatar ? (
                        <img src={assistant.avatar} alt={assistant.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${levelInfo.gradient} flex items-center justify-center text-white font-bold`}>
                          {assistant.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{assistant.name}</p>
                        <p className="text-xs text-slate-500">{levelInfo.label}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">{formatCurrency(0)}</p>
                      <p className="text-xs text-slate-500">本月营收</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{assistant.service_count || 0}</p>
                      <p className="text-xs text-slate-500">订单数</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{assistant.rating || 5}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {ranking.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                暂无排行数据
              </div>
            )}
          </div>
        </CardContent>
      </Card> */}
{/* 业绩排行榜结束 */}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索助教姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl h-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-[140px] rounded-xl h-9">
            <SelectValue placeholder="等级筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部等级</SelectItem>
            {levels.map((level) => (
              <SelectItem key={level.id} value={level.id}>
                {level.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg h-7 px-3"
            onClick={() => setViewMode("cards")}
          >
            卡片
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="rounded-lg h-7 px-3"
            onClick={() => setViewMode("list")}
          >
            列表
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssistants.map((assistant) => {
            const levelInfo = getLevelConfig(assistant.level);
            const isExpanded = expandedAssistant === assistant.id;

            return (
              <Card
                key={assistant.id}
                className="bg-white rounded-2xl hover:shadow-lg transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {assistant.avatar ? (
                        <img
                          src={assistant.avatar}
                          alt={assistant.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm`} style={{ background: `linear-gradient(135deg, ${(levelInfo as any).customColor || levelInfo.color}, ${((levelInfo as any).customColor || levelInfo.color)}aa)` }}>
                          {assistant.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{assistant.name}</p>
                        <Badge variant="secondary" className={`text-xs mt-0.5`} style={{ backgroundColor: `${((levelInfo as any).customColor || levelInfo.color)}20`, color: (levelInfo as any).customColor || levelInfo.color }}>
                          {levelInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleDeleteAssistant(assistant.id); }}
                        className="text-slate-400 hover:text-red-500 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedAssistant(isExpanded ? null : assistant.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {assistant.skills.slice(0, 3).map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {assistant.skills.length > 3 && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">
                        +{assistant.skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-slate-900">
                        {assistant.service_count || 0}
                      </p>
                      <p className="text-xs text-slate-500">订单数</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-emerald-600">
                        {formatCurrency(0)}
                      </p>
                      <p className="text-xs text-slate-500">营收</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold font-mono text-slate-900">
                        {assistant.total_hours || 0}h
                      </p>
                      <p className="text-xs text-slate-500">课时</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <p className="text-lg font-bold text-slate-900">{assistant.rating || 5}</p>
                      </div>
                      <p className="text-xs text-slate-500">评分</p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-slate-700">详细信息</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAssistant(assistant);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">课时费</span>
                          <span className="font-medium">¥{assistant.hourly_rate}/小时</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500">联系电话</span>
                          <span className="font-medium">{assistant.phone}</span>
                        </div>
                        {assistant.description && (
                          <div className="text-sm">
                            <span className="text-slate-500">简介：</span>
                            <span>{assistant.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
                    <th className="text-left p-4 text-sm font-medium text-slate-500">助教</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">等级</th>
                    <th className="text-left p-4 text-sm font-medium text-slate-500">擅长领域</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">订单数</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">课时</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">评分</th>
                    <th className="text-right p-4 text-sm font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssistants.map((assistant) => {
                    const levelInfo = getLevelConfig(assistant.level);
                    return (
                      <tr
                        key={assistant.id}
                        className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {assistant.avatar ? (
                              <img src={assistant.avatar} alt={assistant.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${(levelInfo as any).customColor || levelInfo.color}, ${((levelInfo as any).customColor || levelInfo.color)}aa)` }}>
                                {assistant.name.charAt(0)}
                              </div>
                            )}
                            <span className="font-medium text-slate-900">{assistant.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className="border-0" style={{ backgroundColor: `${((levelInfo as any).customColor || levelInfo.color)}20`, color: (levelInfo as any).customColor || levelInfo.color }}>
                            {levelInfo.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {assistant.skills.slice(0, 2).map((skill, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-900">
                          {assistant.service_count || 0}
                        </td>
                        <td className="p-4 text-right font-medium text-slate-900">
                          {assistant.total_hours || 0}h
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium">{assistant.rating || 5}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAssistant(assistant);
                              setDetailDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filteredAssistants.length === 0 && (
              <div className="text-center py-12">
                <GraduationCap className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500">暂无助教数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">添加助教</DialogTitle>
            <DialogDescription>填写助教基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">姓名</label>
                <Input
                  value={newAssistant.name}
                  onChange={(e) => setNewAssistant({ ...newAssistant, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">联系电话</label>
                <Input
                  value={newAssistant.phone}
                  onChange={(e) => setNewAssistant({ ...newAssistant, phone: e.target.value })}
                  placeholder="请输入电话"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">等级</label>
                <Select
                  value={newAssistant.level}
                  onValueChange={(value: string) => {
                    const level = levels.find((l) => l.id === value || l.code === value);
                    setNewAssistant({
                      ...newAssistant,
                      level: value as AssistantLevel,
                      hourly_rate: level?.hourly_rate || 60,
                    });
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.code || level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">课时费 (元/小时)</label>
                <Input
                  type="number"
                  value={newAssistant.hourly_rate}
                  onChange={(e) => setNewAssistant({ ...newAssistant, hourly_rate: Number(e.target.value) })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-medium text-slate-700">计费方式</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setNewAssistant({ ...newAssistant, billing_rule: "half_hour" })}
                    className={`flex-1 p-4 text-left transition-colors ${
                      newAssistant.billing_rule === "half_hour"
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">以半小时为计费单位</div>
                    <div className="text-xs text-slate-500 mt-1">不满半小时按半小时算</div>
                    <div className="text-xs text-amber-600 mt-1.5 font-medium">示例：70分钟 → 1.5h × 时薪</div>
                  </button>
                  <div className="w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => setNewAssistant({ ...newAssistant, billing_rule: "minute" })}
                    className={`flex-1 p-4 text-left transition-colors ${
                      newAssistant.billing_rule === "minute"
                        ? "bg-emerald-50 border-emerald-500"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">按分钟计费</div>
                    <div className="text-xs text-slate-500 mt-1">精确到分钟，公平透明</div>
                    <div className="text-xs text-amber-600 mt-1.5 font-medium">示例：70分钟 → 70÷60×时薪</div>
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">擅长领域</label>
              <div className="flex flex-wrap gap-2">
                {skillOptions.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      const skills = newAssistant.skills.includes(skill)
                        ? newAssistant.skills.filter((s) => s !== skill)
                        : [...newAssistant.skills, skill];
                      setNewAssistant({ ...newAssistant, skills });
                    }}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      newAssistant.skills.includes(skill)
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">个人简介</label>
              <Input
                value={newAssistant.description}
                onChange={(e) => setNewAssistant({ ...newAssistant, description: e.target.value })}
                placeholder="简要介绍助教背景和特长"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            保存后将同步创建员工账号，默认密码为 <strong>888888</strong>，请提醒员工登录后修改密码。
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} className="rounded-xl">
              取消
            </Button>
            <Button
              onClick={handleSaveAssistant}
              disabled={!newAssistant.name || loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">助教详情</DialogTitle>
          </DialogHeader>

          {selectedAssistant && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {selectedAssistant.avatar ? (
                  <img
                    src={selectedAssistant.avatar}
                    alt={selectedAssistant.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-xl font-bold">
                    {selectedAssistant.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-xl font-bold text-slate-900">{selectedAssistant.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-slate-100 text-slate-700 border-0">
                      {getLevelConfig(selectedAssistant.level).label}
                    </Badge>
                    <span className="text-sm text-slate-500">
                      课时费: ¥{selectedAssistant.hourly_rate}/小时
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{selectedAssistant.service_count || 0}</p>
                  <p className="text-xs text-slate-500">完成订单</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(0)}</p>
                  <p className="text-xs text-slate-500">总营收</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{selectedAssistant.total_hours || 0}h</p>
                  <p className="text-xs text-slate-500">累计课时</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <p className="text-2xl font-bold text-slate-900">{selectedAssistant.rating || 5}</p>
                  </div>
                  <p className="text-xs text-slate-500">平均评分</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">擅长领域</p>
                <div className="flex flex-wrap gap-2">
                  {selectedAssistant.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-100 text-slate-700 text-sm rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">联系方式</p>
                <p className="text-slate-700">{selectedAssistant.phone}</p>
              </div>

              {selectedAssistant.description && (
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">个人简介</p>
                  <p className="text-slate-700">{selectedAssistant.description}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={() => {
                if (selectedAssistant) {
                  setDetailDialogOpen(false);
                  setTimeout(() => openAlbumManager(selectedAssistant), 100);
                }
              }}
            >
              相册管理
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setSelectedAssistant(null);
                setDetailDialogOpen(false);
              }}
            >
              关闭
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                if (selectedAssistant) {
                  setEditingAssistant({ ...selectedAssistant });
                  setDetailDialogOpen(false);
                }
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={albumDialogOpen} onOpenChange={setAlbumDialogOpen}>
        <DialogContent className="bg-white rounded-2xl max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-slate-900">相册管理 - {selectedAssistant?.name}</DialogTitle>
            <DialogDescription className="text-slate-500">管理助教相册照片</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            {albumImages.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg mb-2">暂无照片</p>
                <p className="text-sm">点击下方按钮上传照片</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {albumImages.map((url, i) => (
                  <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleAlbumDelete(url)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 pt-4 border-t">
            <label className={`cursor-pointer px-6 py-2 rounded-xl text-sm font-medium text-white ${albumUploading ? 'bg-amber-400' : 'bg-amber-500 hover:bg-amber-600'}`}>
              {albumUploading ? '上传中...' : '上传照片'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAlbumUpload} disabled={albumUploading} />
            </label>
            <Button variant="outline" className="rounded-xl" onClick={() => setAlbumDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAssistant} onOpenChange={() => setEditingAssistant(null)}>
        <DialogContent className="bg-white rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-900">编辑助教</DialogTitle>
          </DialogHeader>

          {editingAssistant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">姓名</label>
                  <Input
                    value={editingAssistant.name}
                    onChange={(e) => setEditingAssistant({ ...editingAssistant, name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">联系电话</label>
                  <Input
                    value={editingAssistant.phone}
                    onChange={(e) => setEditingAssistant({ ...editingAssistant, phone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">等级</label>
                  <Select
                    value={editingAssistant.level}
                    onValueChange={(value: string) => {
                      const level = levels.find((l) => l.id === value || l.code === value);
                      setEditingAssistant({
                        ...editingAssistant,
                        level: value as AssistantLevel,
                        hourly_rate: level?.hourly_rate || editingAssistant.hourly_rate,
                      });
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.code || level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">课时费 (元/小时)</label>
                  <Input
                    type="number"
                    value={editingAssistant.hourly_rate}
                    onChange={(e) => setEditingAssistant({ ...editingAssistant, hourly_rate: Number(e.target.value) })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">计费方式</label>
                <div className="flex rounded-xl overflow-hidden border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingAssistant({ ...editingAssistant, billing_rule: "half_hour" })}
                    className={`flex-1 p-4 text-left transition-colors ${
                      (editingAssistant as any).billing_rule === "half_hour" || !(editingAssistant as any).billing_rule
                        ? "bg-emerald-50"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">以半小时为计费单位</div>
                    <div className="text-xs text-slate-500 mt-1">不满半小时按半小时算</div>
                  </button>
                  <div className="w-px bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => setEditingAssistant({ ...editingAssistant, billing_rule: "minute" })}
                    className={`flex-1 p-4 text-left transition-colors ${
                      (editingAssistant as any).billing_rule === "minute"
                        ? "bg-emerald-50"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-sm font-semibold text-slate-800">按分钟计费</div>
                    <div className="text-xs text-slate-500 mt-1">精确到分钟，公平透明</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">擅长领域</label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const skills = editingAssistant.skills.includes(skill)
                          ? editingAssistant.skills.filter((s) => s !== skill)
                          : [...editingAssistant.skills, skill];
                        setEditingAssistant({ ...editingAssistant, skills });
                      }}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        editingAssistant.skills.includes(skill)
                          ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingAssistant) {
                  handleDeleteAssistant(editingAssistant.id);
                  setEditingAssistant(null);
                }
              }}
              className="rounded-xl"
            >
              删除
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingAssistant(null)} className="rounded-xl">
                取消
              </Button>
              <Button onClick={handleUpdateAssistant} disabled={loading} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                {loading ? "保存中..." : "保存"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

          </div>
        </div>
      )}

      {activeTab === "levels" && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
          <AssistantsLevelsTab />
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">排班管理</h2>
                <p className="text-sm text-slate-500">管理助教排班和班次配置</p>
              </div>
            </div>
            <div className="flex gap-2">
            <Button
              variant={scheduleSubTab === "calendar" ? "default" : "outline"}
              size="sm"
              className={scheduleSubTab === "calendar" ? "bg-green-500 hover:bg-green-600" : ""}
              onClick={() => setScheduleSubTab("calendar")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              排班表
            </Button>
            <Button
              variant={scheduleSubTab === "config" ? "default" : "outline"}
              size="sm"
              className={scheduleSubTab === "config" ? "bg-green-500 hover:bg-green-600" : ""}
              onClick={() => setScheduleSubTab("config")}
            >
              <Settings className="w-4 h-4 mr-2" />
              班次配置
            </Button>
          </div>
          {scheduleSubTab === "calendar" ? <ScheduleManager /> : <ShiftConfigPanel />}
          </div>
        </div>
      )}


      {activeTab === "commission" && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">提成管理</h2>
                <p className="text-sm text-slate-500">配置助教提成规则和结算方式</p>
              </div>
            </div>
            <CommissionConfigPanel assistants={assistants} />
          </div>
        </div>
      )}

      {activeTab === "salary" && (
        <div className="rounded-2xl border border-slate-200/60 bg-white/95 backdrop-blur-xl shadow-lg overflow-hidden">
          <AssistantsSalaryTab />
        </div>
      )}
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
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  small?: boolean;
}) {
  return (
    <Card className="bg-white rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-slate-200`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <p className={`font-bold font-mono mt-3 text-slate-900 ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
        <p className="text-sm text-slate-500 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}