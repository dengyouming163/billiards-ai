'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, X, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { get, post } from '@/lib/api/client';

interface HelpItem { id: string; category: string; title: string; content?: string; summary?: string; created_at?: string; }
interface HelpCategory { key: string; label: string; }

interface HelpDialogProps { onClose: () => void; }

export function HelpDialog({ onClose }: HelpDialogProps) {
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [helps, setHelps] = useState<HelpItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const [ticket, setTicket] = useState({ title: '', type: 'question', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [articleContents, setArticleContents] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res: any = await get('/support.Support/articles');
      const items: HelpItem[] = res?.list || [];
      setHelps(items);
      const catMap = new Map<string, string>();
      items.forEach((item: HelpItem) => {
        if (item.category && !catMap.has(item.category)) catMap.set(item.category, item.category);
      });
      setCategories(Array.from(catMap, ([key, label]) => ({ key, label })));
    } catch { /* */ }
    finally { setLoading(false); }
  };

  const filteredHelps = helps.filter(h => {
    const matchCat = !selectedCategory || h.category === selectedCategory;
    const matchSearch = !search || (h.title?.includes(search)) || (h.content?.includes(search));
    return matchCat && matchSearch;
  });

  const handleToggleExpand = async (help: HelpItem) => {
    if (expandedId === help.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(help.id);
    // 如果列表已含内容则无需加载，否则加载详情
    if (help.content) return;
    if (articleContents[help.id]) return;
    setDetailLoading(help.id);
    try {
      const res: any = await get('/support.Support/articleDetail', { id: help.id });
      const detail = res?.data || res;
      setArticleContents(prev => ({ ...prev, [help.id]: detail?.content || '' }));
    } catch { /* */ }
    finally { setDetailLoading(null); }
  };

  const handleSubmitTicket = async () => {
    if (!ticket.title.trim() || !ticket.content.trim()) { toast.error('请填写标题和描述'); return; }
    setSubmitting(true);
    try {
      await post('/support.Support/submitTicket', ticket);
      toast.success('工单已提交，我们会尽快处理');
      setShowTicket(false);
      setTicket({ title: '', type: 'question', content: '' });
    } catch (e: any) { toast.error(e?.message || '提交失败'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[80vw] h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 shrink-0">
          <div className="flex items-center gap-3 text-white">
            <HelpCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">帮助中心</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 text-white"><X className="w-5 h-5" /></button>
        </div>

        {/* Search + Categories */}
        <div className="p-4 border-b shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-10" placeholder="搜索帮助文档..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedCategory('')}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                !selectedCategory ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
              全部
            </button>
            {categories.map(c => (
              <button key={c.key} onClick={() => setSelectedCategory(c.key)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                  selectedCategory === c.key ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showTicket ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">提交工单</h3>
              <div>
                <Label>问题标题 *</Label>
                <Input value={ticket.title} onChange={e => setTicket({ ...ticket, title: e.target.value })} placeholder="简要描述您的问题" />
              </div>
              <div>
                <Label>问题类型</Label>
                <select className="w-full h-10 rounded-lg border px-3 text-sm" value={ticket.type} onChange={e => setTicket({ ...ticket, type: e.target.value })}>
                  <option value="bug">故障报修</option>
                  <option value="feature">功能建议</option>
                  <option value="question">使用咨询</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div>
                <Label>问题描述 *</Label>
                <Textarea className="min-h-[120px]" value={ticket.content} onChange={e => setTicket({ ...ticket, content: e.target.value })} placeholder="请详细描述您遇到的问题..." />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowTicket(false)}>取消</Button>
                <Button onClick={handleSubmitTicket} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? '提交中...' : '确认提交'}
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredHelps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <HelpCircle className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm mb-4">{search ? '未找到匹配的文档' : '暂无帮助文档'}</p>
              {search && <Button variant="outline" size="sm" onClick={() => setSearch('')}>清除搜索</Button>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHelps.map(help => (
                <div key={help.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button onClick={() => handleToggleExpand(help)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 text-left">
                    <span className="text-sm font-medium text-slate-700">{help.title}</span>
                    {expandedId === help.id ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                  {expandedId === help.id && (
                    <div className="px-4 py-3 bg-white border-t border-slate-100">
                      {detailLoading === help.id ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: help.content || articleContents[help.id] || '' }} />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        {!showTicket && (
          <div className="p-4 border-t bg-slate-50 shrink-0 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowTicket(true)}>
              <MessageSquare className="w-4 h-4 mr-2" />提交工单
            </Button>
            <Button variant="ghost" className="gap-1 text-slate-600" onClick={() => { onClose(); router.push('/support'); }}>
              查看全部 <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
