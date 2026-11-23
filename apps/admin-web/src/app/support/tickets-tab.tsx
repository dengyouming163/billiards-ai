"use client";

import { useState, useEffect, useCallback } from "react";
import { get } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketForm } from "./ticket-form";
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Bug,
  Lightbulb,
  HelpCircle,
  MoreHorizontal,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

interface Ticket {
  id: string;
  ticket_no: string;
  title: string;
  type: string;
  content: string;
  status: string;
  created_at: string;
}

interface TicketReply {
  id: string;
  sender_type: string;
  sender_name: string;
  content: string;
  created_at: string;
}

const ticketTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  bug: { label: "问题反馈", icon: Bug, color: "bg-rose-100 text-rose-700" },
  feature: { label: "功能需求", icon: Lightbulb, color: "bg-amber-100 text-amber-700" },
  question: { label: "使用咨询", icon: HelpCircle, color: "bg-blue-100 text-blue-700" },
  other: { label: "其他", icon: MoreHorizontal, color: "bg-slate-100 text-slate-700" },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  submitted: { label: "待处理", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  processing: { label: "处理中", color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  resolved: { label: "已解决", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  closed: { label: "已关闭", color: "bg-slate-50 text-slate-600 border-slate-200", icon: XCircle },
};

const statusFilters = [
  { key: "", label: "全部" },
  { key: "submitted", label: "待处理" },
  { key: "processing", label: "处理中" },
  { key: "resolved", label: "已解决" },
  { key: "closed", label: "已关闭" },
];

export function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await get("/support.Support/tickets");
      setTickets(res?.list || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleViewDetail = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDetailLoading(true);
    try {
      const res: any = await get("/support.Support/ticketDetail", { id: ticket.id });
      setSelectedTicket(res?.ticket || ticket);
      setReplies(res?.replies || []);
    } catch {
      setReplies([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const filteredTickets = statusFilter
    ? tickets.filter((t) => t.status === statusFilter)
    : tickets;

  const statusCounts = statusFilters.reduce(
    (acc, f) => {
      if (!f.key) {
        acc[f.key] = tickets.length;
      } else {
        acc[f.key] = tickets.filter((t) => t.status === f.key).length;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // ---- Detail View ----
  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.submitted;
    const type = ticketTypeConfig[selectedTicket.type] || ticketTypeConfig.other;
    const TypeIcon = type.icon;
    const StatusIcon = status.icon;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedTicket(null)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回工单列表
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {selectedTicket.title}
            </h3>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-sm text-slate-500">
                {selectedTicket.ticket_no}
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${type.color}`}>
                <TypeIcon className="w-3 h-3" />
                {type.label}
              </span>
              <Badge className={`${status.color} border font-medium`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {status.label}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">问题描述</h4>
          <div className="p-5 bg-slate-50 rounded-2xl text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {selectedTicket.content || "暂无描述"}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            回复记录
            {replies.length > 0 && (
              <span className="font-normal text-slate-400">({replies.length})</span>
            )}
          </h4>
          {detailLoading ? (
            <div className="text-center py-8 text-slate-500">加载中...</div>
          ) : replies.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl text-slate-400 text-sm">
              暂无回复，请耐心等待平台客服处理
            </div>
          ) : (
            <div className="space-y-4">
              {replies.map((reply) => {
                const isPlatform = reply.sender_type === "platform";
                return (
                  <div key={reply.id} className={`flex gap-3 ${isPlatform ? "" : "flex-row-reverse"}`}>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                        isPlatform ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {(reply.sender_name || (isPlatform ? "客服" : "我")).charAt(0)}
                    </div>
                    <div
                      className={`flex-1 max-w-[75%] p-4 rounded-2xl ${
                        isPlatform
                          ? "bg-emerald-50 rounded-tl-sm"
                          : "bg-white border border-slate-200 rounded-tr-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {reply.sender_name || (isPlatform ? "平台客服" : "我")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {reply.created_at
                            ? new Date(reply.created_at).toLocaleString("zh-CN")
                            : ""}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- List View ----
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {statusFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.key
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-slate-400">
                {statusCounts[f.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={loadTickets} className="rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
          >
            {showForm ? "取消" : <><Plus className="w-4 h-4 mr-2" />新建工单</>}
          </Button>
        </div>
      </div>

      {showForm && (
        <TicketForm
          onSubmitted={() => {
            setShowForm(false);
            loadTickets();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <Card className="rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 text-base">暂无工单</p>
              <p className="text-slate-400 text-sm mt-1">
                {statusFilter ? "该状态下暂无工单" : "点击上方按钮提交工单"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredTickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.submitted;
                const type = ticketTypeConfig[ticket.type] || ticketTypeConfig.other;
                const TypeIcon = type.icon;
                const StatusIcon = status.icon;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleViewDetail(ticket)}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <span className="font-mono text-xs text-slate-500 w-[130px] shrink-0">
                      {ticket.ticket_no}
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-800 truncate">
                      {ticket.title}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${type.color} shrink-0`}>
                      <TypeIcon className="w-3 h-3" />
                      {type.label}
                    </span>
                    <Badge className={`${status.color} border font-medium shrink-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                    <span className="text-xs text-slate-400 w-[130px] text-right shrink-0">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleString("zh-CN")
                        : "-"}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
