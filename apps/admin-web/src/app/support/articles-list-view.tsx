"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/api/client";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, BookOpen } from "lucide-react";

interface HelpItem {
  id: string;
  category: string;
  title: string;
  content?: string;
  summary?: string;
  created_at?: string;
}

interface ArticlesListViewProps {
  onSelectArticle: (article: HelpItem) => void;
}

export function ArticlesListView({ onSelectArticle }: ArticlesListViewProps) {
  const [articles, setArticles] = useState<HelpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res: any = await get("/support.Support/articles");
      setArticles(res?.list || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(
    new Map(
      articles
        .filter((a) => a.category)
        .map((a) => [a.category, { key: a.category, label: a.category }])
    ).values()
  );

  const filtered = articles.filter((a) => {
    const matchCat = !selectedCategory || a.category === selectedCategory;
    const matchSearch =
      !search ||
      (a.title || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Category Sidebar */}
      <div className="w-[160px] shrink-0 hidden md:block">
        <div className="sticky top-4 space-y-1">
          <button
            onClick={() => setSelectedCategory("")}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? "bg-emerald-50 text-emerald-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            📚 全部文档
          </button>
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === cat.key ? "" : cat.key
                )
              }
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === cat.key
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article List */}
      <div className="flex-1 min-w-0">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            className="pl-10 rounded-xl"
            placeholder="搜索帮助文档..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">
              {search ? "未找到匹配的文档" : "暂无帮助文档"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-emerald-500 text-sm mt-2 hover:underline"
              >
                清除搜索
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200/60 rounded-2xl overflow-hidden bg-white">
            {filtered.map((article) => (
              <div
                key={article.id}
                onClick={() => onSelectArticle(article)}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-medium text-slate-800 truncate">
                    {article.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {article.category && (
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {article.category}
                      </span>
                    )}
                    {article.created_at && (
                      <span className="text-xs text-slate-400">
                        {article.created_at.substring(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-3" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
