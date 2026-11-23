"use client";

import { useState, useEffect } from "react";
import { get } from "@/lib/api/client";
import { ArticlesListView } from "./articles-list-view";
import { ArticlesReadView } from "./articles-read-view";

interface HelpItem {
  id: string;
  category: string;
  title: string;
  content?: string;
  summary?: string;
  created_at?: string;
}

export function ArticlesTab() {
  const [selectedArticle, setSelectedArticle] = useState<HelpItem | null>(null);
  const [allArticles, setAllArticles] = useState<HelpItem[]>([]);

  useEffect(() => {
    loadAllArticles();
  }, []);

  const loadAllArticles = async () => {
    try {
      const res: any = await get("/support.Support/articles");
      setAllArticles(res?.list || []);
    } catch {
      setAllArticles([]);
    }
  };

  const handleSelectArticle = (article: HelpItem) => {
    setSelectedArticle(article);
  };

  const handleNavigate = (article: HelpItem) => {
    setSelectedArticle(article);
  };

  if (selectedArticle) {
    return (
      <ArticlesReadView
        article={selectedArticle}
        allArticles={allArticles}
        onBack={() => setSelectedArticle(null)}
        onNavigate={handleNavigate}
      />
    );
  }

  return <ArticlesListView onSelectArticle={handleSelectArticle} />;
}
