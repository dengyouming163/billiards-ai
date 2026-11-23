'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useApp } from '@/hooks/use-app';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  streamKnowledgeRun,
  type AgentStreamEvent,
} from '@/lib/api/agent';
import { AlertCircle, Bot, Send, Square, Store } from 'lucide-react';
import { RunTrace } from './components/run-trace';

type RunState = 'idle' | 'running' | 'completed' | 'failed';

export default function AgentPage() {
  const { permissionCodes, isLoading } = useAuth();
  const { state } = useApp();
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [runId, setRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('overview')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes, router]);

  const currentStore = state.currentStore;

  const handleEvent = (event: AgentStreamEvent) => {
    if (event.runId) setRunId(event.runId);
    if (event.type === 'message.delta') {
      const delta = event.data.delta ?? event.data.text;
      if (typeof delta === 'string') {
        setAnswer((previous) => previous + delta);
      }
    }
    if (event.type === 'run.failed') {
      const detail = event.data.error;
      const message =
        detail && typeof detail === 'object' && 'message' in detail
          ? String((detail as { message: unknown }).message)
          : 'Agent 运行失败';
      setError(message);
      setRunState('failed');
    }
  };

  const handleRun = async () => {
    const trimmed = question.trim();
    if (!trimmed || !currentStore) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAnswer('');
    setRunId(null);
    setError(null);
    setRunState('running');

    try {
      const events = await streamKnowledgeRun(
        currentStore.id,
        trimmed,
        handleEvent,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) {
        setRunState('idle');
        return;
      }
      setRunState(events.some((event) => event.type === 'run.completed') ? 'completed' : 'failed');
    } catch (err) {
      if (controller.signal.aborted) {
        setRunState('idle');
        return;
      }
      setError(err instanceof Error ? err.message : 'Agent 服务暂不可用，请稍后重试');
      setRunState('failed');
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agent 运行"
        description="基于制度库的只读问答与运行 Trace，不执行任何业务写操作"
        icon={Bot}
      />

      <div className="rounded-2xl border border-[#e5e5e5] bg-[#f7f7f7] px-4 py-3 text-sm text-[#666666]">
        M0 阶段仅提供制度问答和运行轨迹查看。页面不会开台、收银、退款或对账，也不展示任何未经后端计算的金额。
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">制度问答</CardTitle>
          <div className="flex items-center gap-2 text-sm text-[#666666]">
            <Store className="w-4 h-4 text-[#07C160]" />
            {currentStore ? currentStore.name : '未选择门店'}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：交班时对账的标准流程是什么？"
            rows={4}
            maxLength={2000}
            disabled={runState === 'running'}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white"
              onClick={handleRun}
              disabled={runState === 'running' || !question.trim() || !currentStore}
            >
              <Send className="w-4 h-4 mr-2" />
              发送
            </Button>
            {runState === 'running' && (
              <Button variant="outline" onClick={handleCancel}>
                <Square className="w-4 h-4 mr-2" />
                停止
              </Button>
            )}
            {runState !== 'idle' && (
              <Badge className="bg-[#f7f7f7] text-[#666666]">{runState}</Badge>
            )}
            {runId && (
              <span className="text-xs text-[#999999] font-mono break-all">
                run id: {runId}
              </span>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-[#FF5252]/10 px-3 py-2 text-sm text-[#C62828]">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p>{error}</p>
                <p className="text-xs text-[#999999]">
                  制度问答不可用时，原有手工交班与对账流程不受影响。
                </p>
              </div>
            </div>
          )}

          {answer ? (
            <div className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#333333] whitespace-pre-wrap">
              {answer}
            </div>
          ) : (
            runState === 'idle' && (
              <p className="text-sm text-[#999999]">输入问题后发送，回答会在此逐字显示。</p>
            )
          )}

          {runState === 'running' && !answer && (
            <p className="text-sm text-[#999999]">正在检索制度并生成回答...</p>
          )}
        </CardContent>
      </Card>

      {runId && <RunTrace runId={runId} />}
    </div>
  );
}
