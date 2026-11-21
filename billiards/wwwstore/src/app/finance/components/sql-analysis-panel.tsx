'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  fetchRunTrace,
  streamSqlAnalysis,
  type AgentStreamEvent,
  type SqlAnalysisResult,
} from '@/lib/api/agent';
import { AlertCircle, Play } from 'lucide-react';

interface SqlAnalysisPanelProps {
  storeId: string | null;
}

export function SqlAnalysisPanel({ storeId }: SqlAnalysisPanelProps) {
  const [question, setQuestion] = useState('');
  const [running, setRunning] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [result, setResult] = useState<SqlAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEvent = (event: AgentStreamEvent) => {
    if (event.type === 'message.delta') {
      const delta = event.data.delta ?? event.data.text;
      if (typeof delta === 'string') setExplanation((previous) => previous + delta);
    }
    if (event.type === 'run.failed') {
      const detail = event.data.error;
      if (detail && typeof detail === 'object') {
        const code = String((detail as { code?: unknown }).code ?? 'SQL_FAILED');
        const reason = (detail as { reason?: unknown }).reason;
        setError(reason ? `${code}：${String(reason)}` : code);
      } else {
        setError('只读分析失败');
      }
    }
  };

  const handleRun = async () => {
    const trimmed = question.trim();
    if (!trimmed || !storeId) return;

    setRunning(true);
    setExplanation('');
    setResult(null);
    setError(null);
    let runId: string | null = null;

    try {
      const events = await streamSqlAnalysis(storeId, trimmed, (event) => {
        if (event.runId) runId = event.runId;
        handleEvent(event);
      });
      const completed = events.find((event) => event.runId);
      runId = runId ?? completed?.runId ?? null;
      if (runId) {
        const trace = await fetchRunTrace(runId);
        setResult((trace.result ?? null) as unknown as SqlAnalysisResult | null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '只读分析暂不可用');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#FFE1A8] bg-[#FFF7E6] px-4 py-3 text-sm text-[#B26A00]">
        开放式只读分析，不影响固定对账。仅能查询脱敏分析视图，结果最多 200 行。
      </div>

      <div className="flex flex-col gap-3">
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="例如：本月各门店的营业额合计是多少？"
          rows={3}
          maxLength={2000}
          disabled={running}
        />
        <Button
          className="w-fit bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white"
          onClick={handleRun}
          disabled={running || !question.trim() || !storeId}
        >
          <Play className="w-4 h-4 mr-2" />
          {running ? '分析中...' : '运行只读分析'}
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-[#FF5252]/10 px-3 py-2 text-sm text-[#C62828]">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {explanation && (
        <p className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#333333] whitespace-pre-wrap">
          {explanation}
        </p>
      )}

      {result?.guarded_sql && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#333333]">受约束 SQL</h3>
          <pre className="overflow-x-auto rounded-xl bg-[#1f1f1f] px-4 py-3 text-xs text-[#f0f0f0]">
            {result.guarded_sql}
          </pre>
        </div>
      )}

      {result && result.columns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#333333]">
            查询结果（{result.row_count} 行）
          </h3>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full text-xs">
              <thead className="bg-[#f7f7f7] text-[#666666]">
                <tr>
                  {result.columns.map((column) => (
                    <th key={column} className="px-2 py-1 text-left font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={index} className="border-t border-[#f0f0f0]">
                    {result.columns.map((column) => (
                      <td key={column} className="px-2 py-1 font-mono text-[#333333]">
                        {row[column] === null || row[column] === undefined
                          ? ''
                          : String(row[column])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result?.degraded && (
        <p className="text-sm text-[#B26A00]">
          说明生成已降级，查询结果与行数保持不变。
        </p>
      )}
    </section>
  );
}
