'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { orderApi, assistantApi } from '@/lib/api/pos';
import { Button } from '@/components/ui/button';
import type { Table, Assistant } from '@/types';
import { ModalShell } from '@/components/ModalShell';
import { BuyoutPaymentModal } from '@/components/BuyoutPaymentModal';
import { UserCog, Check, Clock, Search, Loader2 } from 'lucide-react';

interface AssistantModalProps {
  table: Table;
  onClose: () => void;
  onSuccess?: () => void;
  orderId?: string;
}

type Step = 'select' | 'mode' | 'configure';

export function AssistantModal({ table, onClose, onSuccess, orderId: propOrderId }: AssistantModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssistant, setSelectedAssistant] = useState<string>(
    table.currentSession?.assistantId || ''
  );
  const [selectedAssistantData, setSelectedAssistantData] = useState<Assistant | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [billingMode, setBillingMode] = useState<'realtime' | 'flat_rate'>('realtime');
  const [buyoutHours, setBuyoutHours] = useState(1);
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [payMode, setPayMode] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [busyError, setBusyError] = useState('');

  const fetchAssistants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assistantApi.lists();
      setAssistants(data || []);
    } catch {
      setAssistants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssistants(); }, [fetchAssistants]);

  useEffect(() => {
    setSelectedAssistant(table.currentSession?.assistantId || '');
  }, [table.currentSession?.assistantId]);

  useEffect(() => {
    if (propOrderId) { setOrderId(propOrderId); return; }
    const fetchOrder = async () => {
      try {
        const result = await orderApi.getCurrentOrder(table.id) as Record<string, unknown>;
        if (result?.id) setOrderId(result.id as string);
      } catch { /* silent */ }
    };
    fetchOrder();
  }, [table.id, propOrderId]);

  // 返回上一步时重置状态
  const goBack = (toStep: Step) => {
    setBusyError('');
    if (toStep === 'select') {
      setBillingMode('realtime');
      setBuyoutHours(1);
      setCustomHoursInput('');
      setPayMode('prepaid');
    }
    setStep(toStep);
  };

  const handleRealtime = async () => {
    if (!selectedAssistant || !orderId) return;
    setIsProcessing(true);
    try {
      await orderApi.addAssistantItem({
        order_id: orderId, assistant_id: selectedAssistant,
        auto_start: true, billing_mode: 'realtime',
      });
      onSuccess?.(); onClose();
    } catch (err: any) {
      if (err?.message?.includes('忙')) { setBusyError('该助教已被其他桌台抢占，请重新选择'); goBack('select'); }
    } finally { setIsProcessing(false); }
  };

  const handleBuyout = async () => {
    if (!selectedAssistant || !orderId || !selectedAssistantData) return;
    if (payMode === 'prepaid') { setShowPayment(true); return; }
    setIsProcessing(true);
    try {
      await orderApi.addAssistantItem({
        order_id: orderId, assistant_id: selectedAssistant,
        auto_start: false, billing_mode: 'flat_rate',
        buyout_hours: buyoutHours, pay_mode: 'postpaid',
      });
      onSuccess?.(); onClose();
    } catch (err: any) {
      if (err?.message?.includes('忙')) { setBusyError('该助教已被抢占，请重新选择'); goBack('select'); }
    } finally { setIsProcessing(false); }
  };

  const normalizedAssistants = useMemo(() => {
    return assistants.map((a) => ({
      ...a,
      status: a.status === 'available' ? 'available' : a.status === 'busy' ? 'busy' : 'off',
    }));
  }, [assistants]);

  const levelOptions = useMemo(() => {
    const levels = new Set<string>();
    normalizedAssistants.forEach((a) => { if (a.level_name) levels.add(a.level_name); });
    return Array.from(levels).sort();
  }, [normalizedAssistants]);

  const filteredAssistants = useMemo(() => {
    return normalizedAssistants.filter((a) => {
      const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = levelFilter === 'all' || a.level_name === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [normalizedAssistants, searchQuery, levelFilter]);

  const availableAssistants = filteredAssistants.filter((a) => a.status === 'available');
  const busyAssistants = filteredAssistants.filter((a) => a.status === 'busy');
  const currentAssistantId = table.currentSession?.assistantId;
  const currentAssistant = assistants.find((a) => a.id === currentAssistantId);
  const hourlyRate = selectedAssistantData?.hourlyRate || 0;
  const buyoutAmount = hourlyRate * buyoutHours;

  const renderAssistantCard = (assistant: Assistant, isAvailable: boolean, isSelected: boolean) => {
    const levelBadge = assistant.level_name
      ? { label: assistant.level_name, bg: 'bg-white/20', color: 'text-white' }
      : { label: '初级', bg: 'bg-white/20', color: 'text-white' };
    return (
      <button key={assistant.id}
        onClick={() => isAvailable && setSelectedAssistant(assistant.id)}
        disabled={!isAvailable}
        className={`relative rounded-xl border-2 overflow-hidden transition-all ${
          isSelected ? 'border-emerald-500 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-500/50'
            : isAvailable ? 'border-[var(--color-border-subtle)] hover:border-emerald-500/50 hover:shadow-lg bg-[var(--color-bg-primary)]'
            : 'border-[var(--color-border-subtle)] opacity-50 cursor-not-allowed'
        }`}>
        {isSelected && (
          <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {!isAvailable && (
          <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-medium shadow">忙碌</div>
        )}
        <div className="aspect-square relative">
          {(() => {
            const img = ((assistant as any).album?.[0]) || assistant.avatar;
            return img
              ? <img src={img} alt={assistant.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-br from-emerald-500/30 to-emerald-500/5 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-500/60">{assistant.name.charAt(0)}</span>
                </div>;
          })()}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-3 text-left">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-sm text-white">{assistant.name}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${levelBadge.bg} ${levelBadge.color}`}>{levelBadge.label}</span>
            </div>
            <div className="text-xs text-white/80"><span className="font-medium">¥{assistant.hourlyRate}/小时</span></div>
          </div>
        </div>
      </button>
    );
  };

  const stepTitle = step === 'select' ? `为桌 ${table.name} 选择助教`
    : step === 'mode' ? '选择服务方式'
    : '买断时长配置';

  return (
    <>
    <ModalShell onClose={onClose} title={stepTitle} icon={<UserCog className="w-5 h-5" />}
      footer={step === 'select' ? (
        <>
          <Button onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl text-sm">取消</Button>
          <Button onClick={() => {
            const ast = assistants.find(a => a.id === selectedAssistant);
            setSelectedAssistantData(ast || null);
            setBusyError('');
            setStep('mode');
          }} disabled={!selectedAssistant || !orderId}
            className="h-12 px-7 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-sm font-medium">
            {!orderId ? '请先开台' : '下一步 →'}
          </Button>
        </>
      ) : step === 'mode' ? (
        <Button onClick={() => goBack('select')} variant="outline" className="h-12 px-5 rounded-xl text-sm">← 上一步</Button>
      ) : step === 'configure' ? (
        <>
          <Button onClick={() => goBack('mode')} variant="outline" className="h-12 px-5 rounded-xl text-sm">← 上一步</Button>
          <Button onClick={handleBuyout} disabled={isProcessing}
            className="h-12 px-7 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 text-sm font-medium">
            {payMode === 'prepaid'
              ? `确认支付 · ¥${buyoutAmount.toFixed(0)}`
              : `确认买断 · ¥${buyoutAmount.toFixed(0)}`}
          </Button>
        </>
      ) : undefined}
    >

      {/* ============ STEP 1: Select Assistant ============ */}
      {step === 'select' && (
        <>
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input type="text" placeholder="搜索助教姓名..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-sm outline-none focus:border-emerald-500 transition-colors" />
            </div>
            {levelOptions.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setLevelFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${levelFilter === 'all' ? 'bg-emerald-500 text-white' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] hover:border-emerald-500/50'}`}>全部</button>
                {levelOptions.map((level) => (
                  <button key={level} onClick={() => setLevelFilter(level)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${levelFilter === level ? 'bg-emerald-500 text-white' : 'bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] hover:border-emerald-500/50'}`}>{level}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-5">
            {currentAssistant && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-pink-500/5 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  {(() => {
                    const img = ((currentAssistant as any).album?.[0]) || currentAssistant.avatar;
                    return img
                      ? <img src={img} alt={currentAssistant.name} className="w-12 h-12 rounded-xl object-cover" />
                      : <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-pink-500 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">{currentAssistant.name.charAt(0)}</span>
                        </div>;
                  })()}
                  <div>
                    <p className="font-bold text-emerald-600">{currentAssistant.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" />服务中（可在桌台详情结束服务）</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">可选助教</h3>
                <span className="text-xs text-[var(--color-text-muted)]">{availableAssistants.length} 位空闲</span>
              </div>
              {loading ? (
                <div className="text-center py-10 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)]">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-emerald-500 animate-spin" />
                  <p className="text-sm text-[var(--color-text-muted)]">加载中...</p>
                </div>
              ) : availableAssistants.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {availableAssistants.map((a) => renderAssistantCard(a, true, selectedAssistant === a.id))}
                </div>
              ) : (
                <div className="text-center py-10 bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-subtle)]">
                  <UserCog className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
                  <p className="text-sm text-[var(--color-text-muted)]">暂没有空闲助教</p>
                </div>
              )}
            </div>

            {busyAssistants.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">服务中</h3>
                  <span className="text-xs text-[var(--color-text-muted)]">{busyAssistants.length} 位忙碌</span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {busyAssistants.map((a) => renderAssistantCard(a, false, false))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ STEP 2: Select Mode ============ */}
      {step === 'mode' && selectedAssistantData && (
        <div className="space-y-6 max-w-lg mx-auto">
          {busyError && <div className="p-4 bg-red-50 text-red-600 text-base rounded-lg">{busyError}</div>}

          <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-emerald-500/40">
              {selectedAssistantData.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-xl text-slate-800">{selectedAssistantData.name}</p>
              <p className="text-base text-slate-500">¥{selectedAssistantData.hourlyRate}/小时</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button onClick={handleRealtime} disabled={isProcessing}
              className="p-7 rounded-xl border-2 border-emerald-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 transition-all flex flex-col items-center justify-center text-center h-48 shadow-sm hover:shadow-xl">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/40">
                <span className="text-white text-4xl">⚡</span>
              </div>
              <p className="font-bold text-emerald-700 text-xl">直接上桌</p>
              <p className="text-sm text-emerald-600 mt-2">实时计费</p>
            </button>

            <button onClick={() => { setBillingMode('flat_rate'); setStep('configure'); }}
              className="p-7 rounded-xl border-2 border-amber-200 bg-white hover:border-amber-500 hover:bg-amber-50 transition-all flex flex-col items-center justify-center text-center h-48 shadow-sm hover:shadow-xl">
              <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-4 shadow-xl shadow-amber-500/40">
                <span className="text-white text-4xl">⏱️</span>
              </div>
              <p className="font-bold text-amber-700 text-xl">买断时长</p>
              <p className="text-sm text-amber-600 mt-2">一口价</p>
            </button>
          </div>

          </div>
      )}

      {/* ============ STEP 3: Configure Buyout ============ */}
      {step === 'configure' && selectedAssistantData && (
        <div className="space-y-5 max-w-md mx-auto">
          <div>
            <p className="text-xs font-medium text-slate-700 mb-3 text-center">选择时长</p>
            <div className="flex justify-center gap-3">
              {[0.5, 1, 2, 3].map(h => {
                const price = (h * hourlyRate);
                return (
                  <button key={h} onClick={() => { setBuyoutHours(h); setCustomHoursInput(''); }}
                    className={`w-32 h-14 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      buyoutHours === h && !customHoursInput ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}>
                    <span>{h}小时</span>
                    <span className="text-xs font-bold">¥{price.toFixed(0)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center">
              <input type="number" step="0.5" min="0.5" max="24"
                placeholder="自定义小时"
                value={customHoursInput}
                onChange={(e) => {
                  setCustomHoursInput(e.target.value);
                  const v = parseFloat(e.target.value);
                  if (v > 0) setBuyoutHours(v);
                }}
                className="w-36 px-4 py-3 rounded-lg border-2 border-slate-200 text-sm text-center bg-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-5 text-center border border-amber-200">
            <p className="text-sm text-amber-700">
              预估: <span className="text-3xl font-bold">¥{buyoutAmount.toFixed(0)}</span>
              <span className="text-xs ml-1">= {buyoutHours}h × ¥{hourlyRate}/h</span>
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-700 mb-3 text-center">支付方式</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPayMode('prepaid')}
                className={`p-5 rounded-lg border-2 text-center transition-all shadow-sm hover:shadow-md ${payMode === 'prepaid' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-300 bg-white'}`}>
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${payMode === 'prepaid' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <span className="text-xl">💳</span>
                </div>
                <p className={`font-bold text-base ${payMode === 'prepaid' ? 'text-amber-700' : 'text-slate-600'}`}>先付</p>
                <p className="text-xs text-slate-500 mt-1">支付后开始上钟</p>
              </button>
              <button onClick={() => setPayMode('postpaid')}
                className={`p-5 rounded-lg border-2 text-center transition-all shadow-sm hover:shadow-md ${payMode === 'postpaid' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
                <div className={`w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center ${payMode === 'postpaid' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <span className="text-xl">📅</span>
                </div>
                <p className={`font-bold text-base ${payMode === 'postpaid' ? 'text-blue-700' : 'text-slate-600'}`}>后付</p>
                <p className="text-xs text-slate-500 mt-1">结账时一起支付</p>
              </button>
            </div>
          </div>

          </div>
      )}

    </ModalShell>

    {/* 支付弹窗（ModalShell 外） */}
    {showPayment && selectedAssistantData && (
      <BuyoutPaymentModal
        orderId={orderId}
        assistantId={selectedAssistant}
        assistantName={selectedAssistantData.name}
        buyoutHours={buyoutHours}
        amount={buyoutAmount}
        onPaid={() => { setShowPayment(false); onSuccess?.(); onClose(); }}
        onClose={() => setShowPayment(false)}
      />
    )}
    </>
  );
}
