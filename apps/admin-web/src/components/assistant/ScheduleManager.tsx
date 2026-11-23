"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Trash,
  UserPlus,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  fetchAssistants,
  fetchAssistantSchedules,
  setAssistantSchedule,
  updateSchedule,
  deleteSchedule,
  fetchShiftConfigs,
  type Assistant,
  type AssistantSchedule,
  type ShiftConfig,
} from "@/lib/api/assistants";

interface ScheduleManagerProps {
  onClose?: () => void;
}

export default function ScheduleManager({ onClose }: ScheduleManagerProps) {
  const { success, warning } = useToast();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistants, setSelectedAssistants] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [schedules, setSchedules] = useState<AssistantSchedule[]>([]);
  const [shiftConfigs, setShiftConfigs] = useState<ShiftConfig[]>([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [editingSchedule, setEditingSchedule] = useState<AssistantSchedule | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  const [newSchedule, setNewSchedule] = useState({
    date: "",
    shift: "",
    start_time: "09:00",
    end_time: "17:00",
    remark: "",
  });

  function getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split("T")[0];
  }

  useEffect(() => {
    loadAssistants();
    loadShiftConfigs();
  }, []);

  useEffect(() => {
    if (selectedAssistants.length > 0) {
      loadSchedules();
    }
  }, [selectedAssistants, currentWeekStart]);

  const loadAssistants = async () => {
    try {
      const res = await fetchAssistants();
      setAssistants(res.data || []);
      if (res.data?.length > 0 && selectedAssistants.length === 0) {
        setSelectedAssistants([res.data[0].id]);
      }
    } catch (error) {
      console.error("加载助教失败:", error);
    }
  };

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

  const loadSchedules = async () => {
    const primaryId = selectedAssistants[0];
    if (!primaryId) return;
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    try {
      const res = await fetchAssistantSchedules(
        primaryId,
        currentWeekStart,
        endDate.toISOString().split("T")[0]
      );
      setSchedules(res || []);
    } catch (error) {
      console.error("加载排班失败:", error);
    }
  };

  const handlePrevWeek = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() - 7);
    setCurrentWeekStart(start.toISOString().split("T")[0]);
  };

  const handleNextWeek = () => {
    const start = new Date(currentWeekStart);
    start.setDate(start.getDate() + 7);
    setCurrentWeekStart(start.toISOString().split("T")[0]);
  };

  const getDaysOfWeek = () => {
    const days = [];
    const dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split("T")[0],
        dayName: dayNames[i],
        isToday: date.toDateString() === new Date().toDateString(),
        isWeekend: i >= 5,
      });
    }
    return days;
  };

  const getScheduleForDate = (date: string) => {
    return schedules.filter((s) => s.date === date);
  };

  const handleOpenAddDialog = (date: string) => {
    setNewSchedule({
      date,
      shift: shiftConfigs[0]?.code || "",
      start_time: shiftConfigs[0]?.start_time || "09:00",
      end_time: shiftConfigs[0]?.end_time || "17:00",
      remark: "",
    });
    setEditingSchedule(null);
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (schedule: AssistantSchedule) => {
    setEditingSchedule(schedule);
    setNewSchedule({
      date: schedule.date,
      shift: schedule.shift,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      remark: (schedule as any).remark || "",
    });
    setAddDialogOpen(true);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("确定要删除这个排班吗？")) return;
    setLoading(true);
    try {
      await deleteSchedule(id);
      await loadSchedules();
      success("排班删除成功");
    } catch (error) {
      console.error("删除排班失败:", error);
      warning("删除排班失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    const primaryId = selectedAssistants[0];
    if (!primaryId || !newSchedule.date) return;
    setLoading(true);
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule.id, newSchedule);
        success("排班更新成功");
      } else {
        await setAssistantSchedule(primaryId, [newSchedule]);
        success("排班添加成功");
      }
      await loadSchedules();
      setAddDialogOpen(false);
      setEditingSchedule(null);
    } catch (error: any) {
      console.error("保存排班失败:", error);
      warning(error?.message || "保存排班失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleShiftChange = (shiftCode: string) => {
    const shift = shiftConfigs.find((s) => s.code === shiftCode);
    if (shift) {
      setNewSchedule((prev) => ({
        ...prev,
        shift: shift.code,
        start_time: shift.start_time,
        end_time: shift.end_time,
      }));
    }
  };

  const handleCopyLastWeek = async () => {
    if (selectedAssistants.length === 0) return;
    const lastWeekStart = new Date(currentWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    setLoading(true);
    try {
      let totalCopied = 0;
      for (const assistantId of selectedAssistants) {
        try {
          const lastWeekSchedules = await fetchAssistantSchedules(
            assistantId,
            lastWeekStart.toISOString().split("T")[0],
            lastWeekEnd.toISOString().split("T")[0]
          );

          if (!lastWeekSchedules || lastWeekSchedules.length === 0) continue;

          const newSchedules = lastWeekSchedules.map((s: AssistantSchedule) => ({
            date: new Date(new Date(s.date).getTime() + 7 * 86400000).toISOString().split("T")[0],
            shift: s.shift,
            start_time: s.start_time,
            end_time: s.end_time,
            remark: (s as any).remark || "",
          }));

          await setAssistantSchedule(assistantId, newSchedules);
          totalCopied++;
        } catch (e) {
          console.error(`复制 ${assistantId} 排班失败:`, e);
        }
      }
      await loadSchedules();
      success(`已为 ${totalCopied} 名助教复制上周排班`);
    } catch (error) {
      console.error("复制排班失败:", error);
      warning("复制排班失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleClearWeek = async () => {
    if (selectedAssistants.length === 0) return;

    if (!confirm(`确定要清空 ${selectedAssistants.length} 名助教本周所有排班吗？此操作不可撤销。`)) return;

    setLoading(true);
    try {
      let totalCleared = 0;
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      const endDateStr = endDate.toISOString().split("T")[0];

      for (const assistantId of selectedAssistants) {
        try {
          const weekSchedules = await fetchAssistantSchedules(
            assistantId,
            currentWeekStart,
            endDateStr
          );
          for (const schedule of weekSchedules || []) {
            await deleteSchedule(schedule.id);
          }
          totalCleared++;
        } catch (e) {
          console.error(`清空 ${assistantId} 排班失败:`, e);
        }
      }
      await loadSchedules();
      success(`${totalCleared} 名助教本周排班已清空`);
    } catch (error) {
      console.error("清空排班失败:", error);
      warning("清空排班失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const toggleDateSelection = (date: string) => {
    const next = new Set(selectedDates);
    if (next.has(date)) {
      next.delete(date);
    } else {
      next.add(date);
    }
    setSelectedDates(next);
  };

  const handleBatchAssign = () => {
    if (selectedDates.size === 0) {
      warning("请先选择要批量排班的日期");
      return;
    }
    setBatchMode(true);
    const firstDate = Array.from(selectedDates)[0];
    setNewSchedule({
      date: firstDate,
      shift: shiftConfigs[0]?.code || "",
      start_time: shiftConfigs[0]?.start_time || "09:00",
      end_time: shiftConfigs[0]?.end_time || "17:00",
      remark: "",
    });
    setEditingSchedule(null);
    setAddDialogOpen(true);
  };

  const handleSaveBatchSchedule = async () => {
    if (selectedAssistants.length === 0 || selectedDates.size === 0) return;
    setLoading(true);
    try {
      const batchSchedules = Array.from(selectedDates).map((date) => ({
        date,
        shift: newSchedule.shift,
        start_time: newSchedule.start_time,
        end_time: newSchedule.end_time,
        remark: newSchedule.remark,
      }));

      let totalSuccess = 0;
      for (const assistantId of selectedAssistants) {
        try {
          await setAssistantSchedule(assistantId, batchSchedules);
          totalSuccess++;
        } catch (e) {
          console.error(`排班 ${assistantId} 失败:`, e);
        }
      }

      success(`已为 ${totalSuccess} 名助教、${selectedDates.size} 天批量排班`);
      await loadSchedules();
      setAddDialogOpen(false);
      setBatchMode(false);
      setSelectedDates(new Set());
    } catch (error: any) {
      console.error("批量排班失败:", error);
      warning(error?.message || "批量排班失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const days = getDaysOfWeek();
  const today = new Date().toISOString().split("T")[0];
  const isTodayOrFuture = (date: string) => date >= today;

  const toggleAssistant = (id: string) => {
    setSelectedAssistants((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((a) => a !== id);
        return next.length > 0 ? next : prev;
      }
      return [...prev, id];
    });
  };

  const toggleAllAssistants = () => {
    if (selectedAssistants.length === assistants.length) {
      return;
    }
    setSelectedAssistants(assistants.map((a) => a.id));
  };

  const getSelectedAssistantNames = () => {
    return assistants
      .filter((a) => selectedAssistants.includes(a.id))
      .map((a) => a.name)
      .join("、");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">排班表</h2>
      </div>

      <Card className="bg-white rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-slate-700 mb-2 block">选择助教</label>
              <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between text-left font-normal rounded-xl"
                  >
                    <span className={selectedAssistants.length > 0 ? "" : "text-slate-400"}>
                      {selectedAssistants.length > 0
                        ? `已选 ${selectedAssistants.length} 人：${getSelectedAssistantNames().slice(0, 30)}${getSelectedAssistantNames().length > 30 ? "…" : ""}`
                        : "请选择助教"}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2" align="start">
                  <div className="flex items-center px-2 pb-2 border-b mb-2">
                    <Checkbox
                      checked={assistants.length > 0 && selectedAssistants.length === assistants.length}
                      onCheckedChange={toggleAllAssistants}
                    />
                    <span className="ml-2 text-sm font-medium">全选</span>
                  </div>
                  <div className="max-h-[200px] overflow-auto space-y-1">
                    {assistants.length === 0 ? (
                      <p className="text-sm text-slate-400 px-2 py-1">暂无助教</p>
                    ) : (
                      assistants.map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center px-2 py-1.5 rounded hover:bg-slate-100 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedAssistants.includes(a.id)}
                            onCheckedChange={() => toggleAssistant(a.id)}
                          />
                          <span className="ml-2 text-sm">{a.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 bg-slate-100 rounded-lg">
                <p className="text-sm font-medium text-slate-700">
                  {new Date(currentWeekStart).toLocaleDateString("zh-CN")} -{" "}
                  {new Date(new Date(currentWeekStart).setDate(new Date(currentWeekStart).getDate() + 6)).toLocaleDateString("zh-CN")}
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLastWeek}
              disabled={loading}
              className="text-green-600"
            >
              <Copy className="w-4 h-4 mr-2" />
              复制上周排班
            </Button>
            {selectedDates.size > 0 ? (
              <Button
                size="sm"
                onClick={handleBatchAssign}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                批量排班 ({selectedDates.size}天)
              </Button>
            ) : (
              <span className="text-xs text-slate-400 self-center">点击日期可多选，然后批量排班</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearWeek}
              disabled={loading}
              className="text-red-500 ml-auto"
            >
              <Trash className="w-4 h-4 mr-2" />
              清空本周
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-medium text-slate-500 w-24">日期</th>
                  {days.map((day) => (
                    <th
                      key={day.date}
                      className={`p-3 text-sm font-medium text-center cursor-pointer transition-colors ${
                        day.isToday ? "bg-blue-50 text-blue-600" : "text-slate-500"
                      } ${selectedDates.has(day.date) ? "bg-amber-50 text-amber-600" : ""}`}
                      onClick={() => isTodayOrFuture(day.date) && toggleDateSelection(day.date)}
                    >
                      <div>{day.dayName}</div>
                      <div className={`text-xs mt-1 ${day.isWeekend ? "text-red-500" : ""}`}>
                        {new Date(day.date).getDate()}
                      </div>
                      {isTodayOrFuture(day.date) && selectedDates.has(day.date) && (
                        <div className="text-xs text-amber-500 mt-0.5">已选</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 text-sm text-slate-500">排班</td>
                  {days.map((day) => {
                    const daySchedules = getScheduleForDate(day.date);
                    return (
                      <td
                        key={day.date}
                        className={`p-2 min-w-[120px] ${
                          day.date < today ? "bg-slate-50" : ""
                        }`}
                      >
                        <div className="space-y-2">
                          {daySchedules.map((schedule) => {
                            const shift = shiftConfigs.find((s) => s.code === schedule.shift);
                            return (
                              <div
                                key={schedule.id}
                                className={`p-2 rounded-lg text-sm ${
                                  shift?.color ? "" : "bg-slate-100"
                                }`}
                                style={{
                                  backgroundColor: `${shift?.color || "#e2e8f0"}30`,
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium" style={{ color: shift?.color }}>
                                    {shift?.name || schedule.shift}
                                  </span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleOpenEditDialog(schedule)}
                                      className="p-1 hover:bg-white/50 rounded transition-colors"
                                    >
                                      <Edit className="w-3 h-3 text-blue-500" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                      className="p-1 hover:bg-white/50 rounded transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-500" />
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {schedule.start_time} - {schedule.end_time}
                                </div>
                              </div>
                            );
                          })}
                          {day.date >= today && daySchedules.length === 0 && (
                            <button
                              onClick={() => handleOpenAddDialog(day.date)}
                              className="w-full p-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-sm hover:border-amber-500 hover:text-amber-500 transition-colors"
                            >
                              <Plus className="w-4 h-4 mx-auto" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={(open) => {
        if (!open) { setAddDialogOpen(false); setEditingSchedule(null); setBatchMode(false); setSelectedDates(new Set()); }
      }}>
        <DialogContent className="bg-white rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              {batchMode ? `批量排班（${selectedDates.size}天）` : (editingSchedule ? "编辑排班" : "添加排班")}
            </DialogTitle>
            <DialogDescription>
              {batchMode
                ? `为 ${getSelectedAssistantNames()} 批量设置排班`
                : `为 ${getSelectedAssistantNames()} ${editingSchedule ? "修改排班" : "设置排班"}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!batchMode && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">日期</label>
                <Input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  className="rounded-xl"
                  min={today}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">班次</label>
              <Select value={newSchedule.shift || ""} onValueChange={handleShiftChange}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="选择班次" />
                </SelectTrigger>
                <SelectContent>
                  {shiftConfigs.length === 0 ? (
                    <SelectItem value="__empty__" disabled>
                      请先配置班次
                    </SelectItem>
                  ) : (
                    shiftConfigs
                      .filter((shift) => shift.code && shift.code.trim())
                      .map((shift) => (
                        <SelectItem key={shift.code} value={shift.code}>
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">开始时间</label>
                <Input
                  type="time"
                  value={newSchedule.start_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">结束时间</label>
                <Input
                  type="time"
                  value={newSchedule.end_time}
                  onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">备注</label>
              <Input
                value={newSchedule.remark}
                onChange={(e) => setNewSchedule({ ...newSchedule, remark: e.target.value })}
                placeholder="如：培训、休息等"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => { setAddDialogOpen(false); setBatchMode(false); setSelectedDates(new Set()); }}
              className="rounded-xl"
            >
              取消
            </Button>
            <Button
              onClick={batchMode ? handleSaveBatchSchedule : handleSaveSchedule}
              disabled={(!batchMode && !newSchedule.date) || !newSchedule.shift || loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {loading ? "保存中..." : (batchMode ? `确认排班(${selectedDates.size}天)` : "保存")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
