import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRunEvidence,
  fetchRunTrace,
  streamKnowledgeRun,
  streamReconciliationFollowup,
  streamReconciliationRun,
  streamSqlAnalysis,
} from './agent';

function sseResponse(chunks: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

describe('streamKnowledgeRun', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('streams deltas with the billiards bearer token and exposes run id', async () => {
    localStorage.setItem('token', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        'id: run-1:1\nevent: run.started\ndata: {"run_id":"run-1"}\n\n',
        'id: run-1:2\nevent: message.delta\ndata: {"delta":"你',
        '好"}\n\nid: run-1:3\nevent: run.completed\ndata: {}\n\n',
      ])
    );
    vi.stubGlobal('fetch', fetchMock);

    const seen: string[] = [];
    const events = await streamKnowledgeRun('store-a', '交班制度', (event) => {
      seen.push(event.type);
    });

    expect(events.map((event) => event.type)).toEqual([
      'run.started',
      'message.delta',
      'run.completed',
    ]);
    expect(events.at(-1)?.type).toBe('run.completed');
    expect(events[1].data).toEqual({ delta: '你好' });
    expect(events[1].runId).toBe('run-1');
    expect(seen).toEqual(['run.started', 'message.delta', 'run.completed']);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(body).toEqual({ store_id: 'store-a', question: '交班制度' });
    expect(body).not.toHaveProperty('tenant_id');
    expect(body).not.toHaveProperty('employee_id');
    expect(body).not.toHaveProperty('role');
  });

  it('surfaces the agent message when the service degrades', async () => {
    localStorage.setItem('token', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: { code: 'AGENT_MODEL_UNAVAILABLE', message: '模型服务不可用' },
          }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );

    await expect(streamKnowledgeRun('store-a', '交班制度')).rejects.toThrow(
      '模型服务不可用'
    );
  });
});

describe('fetchRunTrace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('queries the run trace with the bearer token', async () => {
    localStorage.setItem('token', 'test-token');
    const trace = { id: 'run-1', status: 'succeeded', events: [], tool_calls: [] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(trace), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchRunTrace('run-1');

    expect(result).toEqual(trace);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/runs/run-1'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });
});

describe('reconciliation client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('posts only store and shift to the reconciliation stream', async () => {
    localStorage.setItem('token', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue(
      sseResponse([
        'id: run-9:1\nevent: run.started\ndata: {"run_id":"run-9"}\n\n',
        'id: run-9:2\nevent: run.completed\ndata: {}\n\n',
      ])
    );
    vi.stubGlobal('fetch', fetchMock);

    const events = await streamReconciliationRun('store-a', 'shift-1');

    expect(events.map((event) => event.type)).toEqual(['run.started', 'run.completed']);
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(body).toEqual({ store_id: 'store-a', shift_id: 'shift-1' });
  });

  it('sends follow-up questions without identity fields', async () => {
    localStorage.setItem('token', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['data: {}\n\n']));
    vi.stubGlobal('fetch', fetchMock);

    await streamReconciliationFollowup('run-9', '为什么需要复核？');

    expect(fetchMock.mock.calls[0][0]).toContain(
      '/v1/reconciliation/runs/run-9/messages/stream'
    );
    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(body).toEqual({ question: '为什么需要复核？' });
  });

  it('fetches evidence by kind and ids with the bearer token', async () => {
    localStorage.setItem('token', 'test-token');
    const payload = { kind: 'orders', items: [{ id: 'order-1' }] };
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchRunEvidence('run-9', 'orders', ['order-1']);

    expect(result).toEqual(payload);
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain('/v1/reconciliation/runs/run-9/evidence');
    expect(url).toContain('kind=orders');
    expect(url).toContain('ids=order-1');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      })
    );
  });

  it('posts only store and question to the sql analysis stream', async () => {
    localStorage.setItem('token', 'test-token');
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(['data: {}\n\n']));
    vi.stubGlobal('fetch', fetchMock);

    await streamSqlAnalysis('store-a', '本月营业额');

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(body).toEqual({ store_id: 'store-a', question: '本月营业额' });
  });
});
