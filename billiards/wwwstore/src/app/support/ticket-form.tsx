"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/lib/api/client";

interface TicketFormProps {
  onSubmitted: () => void;
  onCancel: () => void;
}

const ticketTypes = [
  { value: "bug", label: "问题反馈" },
  { value: "feature", label: "功能需求" },
  { value: "question", label: "使用咨询" },
  { value: "other", label: "其他" },
];

export function TicketForm({ onSubmitted, onCancel }: TicketFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    type: "bug",
    content: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("请填写工单标题和描述");
      return;
    }
    setSubmitting(true);
    try {
      await post("/support.Support/submitTicket", formData);
      toast.success("工单提交成功");
      onSubmitted();
    } catch (e: any) {
      toast.error(e?.message || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          新建工单
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-xl">
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>工单标题 <span className="text-red-400">*</span></Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
            placeholder="简要描述您的问题"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>工单类型</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData((p) => ({ ...p, type: v }))}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ticketTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>问题描述 <span className="text-red-400">*</span></Label>
          <Textarea
            value={formData.content}
            onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
            placeholder="请详细描述您遇到的问题或需求..."
            rows={5}
            className="rounded-xl"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="rounded-xl">
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !formData.title.trim() || !formData.content.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
          >
            <Send className="w-4 h-4 mr-2" />
            {submitting ? "提交中..." : "提交工单"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
