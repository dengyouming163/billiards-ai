"use client";

import { useState, useEffect, useMemo } from "react";
import { get } from "@/lib/api/client";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

interface HelpItem {
  id: string;
  category: string;
  title: string;
  content?: string;
}

interface ArticlesReadViewProps {
  article: HelpItem;
  allArticles: HelpItem[];
  onBack: () => void;
  onNavigate: (article: HelpItem) => void;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function ArticlesReadView({
  article,
  allArticles,
  onBack,
  onNavigate,
}: ArticlesReadViewProps) {
  const [content, setContent] = useState(article.content || "");
  const [loading, setLoading] = useState(!article.content);

  const currentIndex = allArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  useEffect(() => {
    if (article.content) {
      setContent(article.content);
      setLoading(false);
    } else {
      setLoading(true);
      loadDetail();
    }
  }, [article.id]);

  const loadDetail = async () => {
    try {
      const res: any = await get("/support.Support/articleDetail", {
        id: article.id,
      });
      const detail = res?.data || res;
      setContent(detail?.content || "");
    } catch {
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const toc: TOCItem[] = useMemo(() => {
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    const items: TOCItem[] = [];
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      items.push({
        id: `heading-${items.length}`,
        text: match[2].trim(),
        level: match[1].length,
      });
    }
    return items;
  }, [content]);

  const processedContent = useMemo(() => {
    if (!content) return "";
    if (/^[#*>\-`\[<]/.test(content.trim())) return content;
    return content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join("\n\n");
  }, [content]);

  return (
    <div className="animate-fade-in">
      {/* Top navigation bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文档列表
        </button>
        <span className="text-xs text-slate-400">
          {article.category && `${article.category} / `}
          {article.title}
        </span>
      </div>

      <div className="flex gap-8">
        {/* TOC Sidebar */}
        {toc.length > 3 && (
          <div className="w-[180px] shrink-0 hidden lg:block">
            <div className="sticky top-4">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                目录
              </h4>
              <nav className="space-y-1">
                {toc.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={`block text-sm transition-colors hover:text-emerald-600 ${
                      item.level === 2
                        ? "text-slate-600 font-medium"
                        : item.level === 3
                        ? "text-slate-500 pl-3 text-xs"
                        : "text-slate-500"
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">
            {article.title}
          </h1>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <div className="prose prose-slate prose-headings:text-slate-800 prose-a:text-emerald-600 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-img:rounded-xl max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {processedContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
            {prevArticle ? (
              <button
                onClick={() => onNavigate(prevArticle)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <div className="text-left">
                  <div className="text-xs text-slate-400">上一篇</div>
                  <div className="font-medium truncate max-w-[200px]">
                    {prevArticle.title}
                  </div>
                </div>
              </button>
            ) : (
              <div />
            )}
            {nextArticle ? (
              <button
                onClick={() => onNavigate(nextArticle)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors group text-right"
              >
                <div>
                  <div className="text-xs text-slate-400">下一篇</div>
                  <div className="font-medium truncate max-w-[200px]">
                    {nextArticle.title}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
