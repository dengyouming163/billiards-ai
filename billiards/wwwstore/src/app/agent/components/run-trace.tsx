'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchRunTrace, type AgentRunTrace } from '@/lib/api/agent';
import { AlertCircle, RefreshCw, Route } from 'lucide-react';

interface RunTraceProps {
  runId: string;
}

function statusClass(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'bg-[#07C160]/10 text-[#07C160]';
    case 'failed':
      return 'bg-[#FF5252]/10 text-[#FF5252]';
    case 'cancelled':
      return 'bg-[#FFA726]/10 text-[#E65100]';
    default:
      return 'bg-[#f7f7f7] text-[#666666]';
  }
}

export function RunTrace({ runId }: RunTraceProps) {
  const [trace, setTrace] = useState<AgentRunTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTrace(await fetchRunTrace(runId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trace 查询失败');
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#07C160]/10 flex items-center justify-center">
            <Route className="w-4 h-4 text-[#07C160]" />
          </div>
          <div>
            <CardTitle className="text-base">运行 Trace</CardTitle>
            <p className="text-xs text-[#999999] font-mono break-all">{runId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {trace && (
            <Badge className={statusClass(trace.status)}>{trace.status}</Badge>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-[#FF5252]/10 px-3 py-2 text-sm text-[#C62828]">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && !trace && (
          <p className="text-sm text-[#999999]">正在读取运行记录...</p>
        )}

        {trace && (
          <>
            <div className="grid gap-2 text-sm text-[#666666] sm:grid-cols-3">
              <p>场景：{trace.scene}</p>
              <p>门店：{trace.store_id}</p>
              <p>
                完成时间：
                {trace.completed_at
                  ? new Date(trace.completed_at).toLocaleString('zh-CN')
                  : '未完成'}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#333333] mb-2">事件</h4>
              {trace.events.length === 0 ? (
                <p className="text-sm text-[#999999]">暂无事件</p>
              ) : (
                <ol className="space-y-2">
                  {trace.events.map((event) => (
                    <li
                      key={`${event.seq}-${event.type}`}
                      className="rounded-xl border border-[#f0f0f0] px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-xs text-[#999999]">
                        <span className="font-mono">#{event.seq}</span>
                        <span className="font-medium text-[#333333]">{event.type}</span>
                      </div>
                      <pre className="mt-1 overflow-x-auto text-xs text-[#666666] whitespace-pre-wrap break-all">
                        {JSON.stringify(event.data)}
                      </pre>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#333333] mb-2">工具调用</h4>
              {trace.tool_calls.length === 0 ? (
                <p className="text-sm text-[#999999]">暂无工具调用</p>
              ) : (
                <ul className="space-y-2">
                  {trace.tool_calls.map((call) => (
                    <li
                      key={call.id}
                      className="rounded-xl border border-[#f0f0f0] px-3 py-2 text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[#333333]">{call.name}</span>
                        <Badge className={statusClass(call.status)}>{call.status}</Badge>
                      </div>
                      {call.error_code && (
                        <p className="text-xs text-[#C62828] mt-1">
                          错误：{call.error_code}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#333333] mb-2">制度引用</h4>
              {trace.citations.length === 0 ? (
                <p className="text-sm text-[#999999]">本次运行没有引用</p>
              ) : (
                <ul className="space-y-2">
                  {trace.citations.map((citation, index) => (
                    <li
                      key={`${citation.chunk_id ?? index}`}
                      className="rounded-xl bg-[#f7f7f7] px-3 py-2 text-sm text-[#666666]"
                    >
                      <p className="font-mono text-xs text-[#999999]">
                        {citation.doc_id ?? '未知文档'} / {citation.chunk_id ?? '未知片段'}
                      </p>
                      {citation.text && <p className="mt-1">{citation.text}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
