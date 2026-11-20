"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, BookOpen, Megaphone } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { TicketsTab } from "./tickets-tab";
import { ArticlesTab } from "./articles-tab";
import { AnnouncementsTab } from "./announcements-tab";
import { useAuth } from "@/lib/auth-context";

const tabs = [
  { key: "tickets", label: "工单", icon: MessageSquare },
  { key: "articles", label: "帮助文档", icon: BookOpen },
  { key: "announcements", label: "平台公告", icon: Megaphone },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function SupportPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('overview')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);

  const [activeTab, setActiveTab] = useState<TabKey>("tickets");

  return (
    <div className="space-y-6">
      <PageHeader
        title="帮助与支持"
        description="查阅帮助文档、提交工单、了解平台公告"
        icon={MessageSquare}
      />

      {/* Tab Bar */}
      <div className="flex gap-2 p-2 bg-[#f7f7f7] backdrop-blur-sm rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-lg shadow-[#07C160]/25"
                  : "text-[#999999] hover:text-[#333333] hover:bg-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "tickets" && <TicketsTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "announcements" && <AnnouncementsTab />}
      </div>
    </div>
  );
}
