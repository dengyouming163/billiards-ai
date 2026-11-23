'use client';

import { useState } from 'react';
import { useApp } from '@/hooks/use-app';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchRunTrace,
  streamReconciliationFollowup,
  streamReconciliationRun,
  type AgentCitation,
  type AgentStreamEvent,
  type ReconciliationReport as Report,
  type ReconciliationResult,
} from '@/lib/api/agent';
import { AlertCircle, Play, Search } from 'lucide-react';
import { EvidenceDrawer } from './evidence-drawer';
import { ReconciliationReport } from './reconciliation-report';
import { SqlAnalysisPanel } from './sql-analysis-panel';

type RunState = 'idle' | 'running' | 'completed' | 'failed';

function errorText(detail: unknown, fallback: string): string {
  if (detail && typeof detail === 'object') {
    const code = String((detail as { code?: unknown }).code ?? fallback);
    const reason = (detail as { reason?: unknown }).reason;
    return reason ? `${code}：${String(reason)}` : code;
  }
  return fallback;
}

async function fetchRunTraceWithRetry(runId: string) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetchRunTrace(runId);
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw lastError;
}

export function AgentReconciliationTab() {
  const { state } = useApp();
  const store = state.currentStore;

  const [shiftId, setShiftId] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [report, setReport] = useState<Report | null>(null);
  const [citations, setCitations] = useState<AgentCitation[]>([]);
  const [narrative, setNarrative] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [followup, setFollowup] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [followupRunning, setFollowupRunning] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRefs, setDrawerRefs] = useState<string[]>([]);

  const handleRun = async () => {
    const trimmed = shiftId.trim();
    if (!trimmed || !store) return;

    setRunState('running');
    setRunId(null);
    setReport(null);
    setCitations([]);
    setNarrative('');
    setError(null);
    setAnswers([]);

    let currentRunId: string | null = null;
    const handleEvent = (event: AgentStreamEvent) => {
      if (event.runId) currentRunId = event.runId;
      if (event.type === 'message.delta') {
        const delta = event.data.delta ?? event.data.text;
        if (typeof delta === 'string') setNarrative((previous) => previous + delta);
      }
      if (event.type === 'run.failed') {
        setError(errorText(event.data.error, '对账运行失败'));
        setRunState('failed');
      }
    };

    try {
      const events = await streamReconciliationRun(store.id, trimmed, handleEvent);
      currentRunId = currentRunId ?? events.find((event) => event.runId)?.runId ?? null;
      setRunId(currentRunId);

      if (currentRunId) {
        const trace = await fetchRunTraceWithRetry(currentRunId);
        const result = (trace.result ?? null) as unknown as ReconciliationResult | null;
        if (result?.report) setReport(result.report);
        setCitations(result?.sop_citations ?? []);
      }
      if (!events.some((event) => event.type === 'run.failed')) {
        setRunState('completed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '对账服务暂不可用');
      setRunState('failed');
    }
  };

  const handleFollowup = async () => {
    const question = followup.trim();
    if (!question || !runId) return;

    setFollowupRunning(true);
    setFollowup('');
    setError(null);

    let answer = '';
    try {
      await streamReconciliationFollowup(runId, question, (event) => {
        if (event.type === 'message.delta') {
          const delta = event.data.delta ?? event.data.text;
          if (typeof delta === 'string') answer += delta;
        }
        if (event.type === 'run.failed') {
          setError(errorText(event.data.error, '追问失败'));
        }
      });
      if (answer) setAnswers((previous) => [...previous, answer]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '追问暂不可用');
    } finally {
      setFollowupRunning(false);
    }
  };

  const openEvidence = (refs: string[]) => {
    setDrawerRefs(refs);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="rounded-xl border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-sm text-[#666666]">
        固定对账由服务端确定性规则生成，模型只负责解释。报告不提供审批、退款或记账按钮；
        “系统核对一致”仍需要现金实盘与外部渠道账单确认。
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 space-y-1 text-sm text-[#666666]">
          <span>历史班次 ID</span>
          <input
            value={shiftId}
            onChange={(event) => setShiftId(event.target.value)}
            placeholder="例如：shift-20260101-a"
            className="w-full rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm text-[#333333] outline-none focus:border-[#07C160]"
            disabled={runState === 'running'}
          />
        </label>
        <Button
          className="bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white"
          onClick={handleRun}
          disabled={runState === 'running' || !shiftId.trim() || !store}
        >
          <Play className="w-4 h-4 mr-2" />
          {runState === 'running' ? '对账中...' : '开始对账'}
        </Button>
      </div>

      {!store && <p className="text-sm text-[#C62828]">请先选择门店。</p>}

      {runState !== 'idle' && (
        <p className="text-xs text-[#999999]">
          状态：{runState}
          {runId ? ` · run id: ${runId}` : ''}
        </p>
      )}

      {runId && (
        <a
          href={`/agent?run_id=${encodeURIComponent(runId)}`}
          className="inline-block text-sm text-[#067A46] underline"
        >
          查看运行 Trace 与工具调用
        </a>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-[#FF5252]/10 px-3 py-2 text-sm text-[#C62828]">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {narrative && (
        <p className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#333333] whitespace-pre-wrap">
          {narrative}
        </p>
      )}

      {report && <ReconciliationReport report={report} onOpenEvidence={openEvidence} />}

      {citations.length > 0 && (
        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[#333333]">
            <Search className="w-4 h-4 text-[#07C160]" />
            SOP 引用
          </h3>
          <ul className="space-y-2">
            {citations.map((citation) => (
              <li
                key={String(citation.chunk_id ?? citation.doc_id)}
                className="rounded-xl border border-[#e5e5e5] px-3 py-2 text-sm text-[#666666]"
              >
                <p className="font-mono text-xs text-[#333333]">
                  {citation.chunk_id} · {citation.doc_id}
                </p>
                {citation.text ? <p className="mt-1">{citation.text}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {runId && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-[#333333]">追问解释</h3>
          <p className="text-xs text-[#999999]">
            追问只读取本次运行已保存的报告，不会重新查询业务证据。
          </p>
          <Textarea
            value={followup}
            onChange={(event) => setFollowup(event.target.value)}
            placeholder="例如：为什么这里需要人工复核？"
            rows={2}
            maxLength={1000}
            disabled={followupRunning}
          />
          <Button
            variant="outline"
            onClick={handleFollowup}
            disabled={followupRunning || !followup.trim()}
          >
            {followupRunning ? '回答中...' : '发送追问'}
          </Button>
          {answers.map((answer, index) => (
            <p
              key={index}
              className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#333333] whitespace-pre-wrap"
            >
              {answer}
            </p>
          ))}
        </section>
      )}

      <EvidenceDrawer
        open={drawerOpen}
        runId={runId}
        refs={drawerRefs}
        evidenceRefs={report?.evidence_refs ?? []}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="border-t border-[#e5e5e5] pt-5">
        <SqlAnalysisPanel storeId={store?.id ?? null} />
      </div>
    </div>
  );
}
