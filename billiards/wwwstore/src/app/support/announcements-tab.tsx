"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/api/client";
import { Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  type?: string;
}

const typeConfig: Record<string, { label: string; color: string }> = {
  important: { label: "重要", color: "bg-amber-50 text-amber-700 border-amber-200" },
  notice: { label: "通知", color: "bg-blue-50 text-blue-700 border-blue-200" },
  feature: { label: "新功能", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

const defaultType = { label: "公告", color: "bg-slate-50 text-slate-600 border-slate-200" };

export function AnnouncementsTab() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res: any = await get("/support.Support/announcements");
      setAnnouncements(res?.list || []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Megaphone className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500">暂无平台公告</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {announcements.map((item) => {
        const typeInfo = typeConfig[item.type || ""] || defaultType;
        return (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${typeInfo.color}`}
              >
                {typeInfo.label}
              </span>
              {item.created_at && (
                <span className="text-xs text-slate-400">
                  {item.created_at.substring(0, 10)}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {item.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
