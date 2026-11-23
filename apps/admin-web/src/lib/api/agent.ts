export interface AgentStreamEvent {
  id: string | null;
  type: string;
  data: Record<string, unknown>;
  runId?: string;
  seq?: number;
}

export interface AgentRunEvent {
  seq: number;
  type: string;
  data: Record<string, unknown>;
  created_at?: string | null;
}

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: string;
  result: unknown;
  error_code?: string | null;
  latency_ms?: number | null;
}

export interface AgentCitation {
  chunk_id?: string;
  doc_id?: string;
  score?: number;
  text?: string;
  [key: string]: unknown;
}

export interface AgentRunTrace {
  id: string;
  scene: string;
  status: string;
  store_id: string;
  created_at?: string | null;
  completed_at?: string | null;
  input?: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  citations: AgentCitation[];
  events: AgentRunEvent[];
  tool_calls: AgentToolCall[];
}

export interface ReconciliationMoneyValue {
  value: string;
  refs: string[];
}

export interface ReconciliationDifference {
  code: string;
  field: string;
  legacy: string;
  recomputed: string;
  delta: string;
  refs: string[];
}

export interface ReconciliationExplained {
  code: string;
  message: string;
  value?: string | null;
  refs: string[];
}

export interface ReconciliationUnknown {
  code: string;
  message: string;
  attribution: string;
  refs: string[];
}

export interface ReconciliationEvidenceRef {
  ref_id: string;
  rule_id: string;
  source_endpoint: string;
  source_ids: string[];
}

export type ReconciliationStatus = 'ok' | 'insufficient_data' | 'review_required';

export interface ReconciliationReport {
  schema_version: string;
  status: ReconciliationStatus;
  legacy_summary: Record<string, string | null>;
  recomputed: Record<string, ReconciliationMoneyValue>;
  differences: ReconciliationDifference[];
  explained: ReconciliationExplained[];
  unknowns: ReconciliationUnknown[];
  evidence_refs: ReconciliationEvidenceRef[];
  narrative?: string | null;
  degraded?: boolean;
}

export interface ReconciliationResult {
  scene: string;
  shift_id?: string | null;
  report: ReconciliationReport;
  narrative?: Record<string, unknown> | null;
  sop_citations?: AgentCitation[];
  degraded?: boolean;
  degraded_reason?: string | null;
}

export interface SqlAnalysisResult {
  scene: string;
  question?: string | null;
  guarded_sql?: string | null;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  tool_call_id?: string | null;
  explanation?: string | null;
  degraded?: boolean;
  degraded_reason?: string | null;
}

export interface RunEvidence {
  kind: string;
  items: Record<string, unknown>[];
}

export interface StreamRunOptions {
  signal?: AbortSignal;
  scene?: string;
  lastEventId?: string;
}

export const AGENT_BASE_URL = (
  process.env.NEXT_PUBLIC_AGENT_BASE_URL || 'http://127.0.0.1:8100'
).replace(/\/+$/, '');

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token =
    typeof localStorage === 'undefined' ? null : localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function readError(response: Response): Promise<Error> {
  let message = `Agent 服务请求失败 (${response.status})`;
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === 'string') {
      message = detail;
    } else if (detail && typeof detail.message === 'string') {
      message = detail.message;
    }
  } catch {
    // Keep the status-based message when the body is not JSON.
  }
  return new Error(message);
}

function parseFrame(frame: string): AgentStreamEvent | null {
  const dataLines: string[] = [];
  let type = 'message';
  let id: string | null = null;

  for (const line of frame.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue;
    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') {
      type = value;
    } else if (field === 'id') {
      id = value;
    } else if (field === 'data') {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0 && id === null) {
    return null;
  }

  const raw = dataLines.join('\n');
  let data: Record<string, unknown> = {};
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      data =
        parsed !== null && typeof parsed === 'object'
          ? (parsed as Record<string, unknown>)
          : { value: parsed };
    } catch {
      data = { text: raw };
    }
  }

  const seq = id && id.includes(':') ? Number(id.split(':').pop()) : undefined;
  const runIdFromData =
    typeof data.run_id === 'string' ? (data.run_id as string) : undefined;

  return {
    id,
    type,
    data,
    runId: runIdFromData ?? (id ? id.split(':')[0] : undefined),
    seq: Number.isFinite(seq) && seq !== undefined ? seq : undefined,
  };
}

export async function readSseStream(
  stream: ReadableStream<Uint8Array>,
  onEvent?: (event: AgentStreamEvent) => void
): Promise<AgentStreamEvent[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  const events: AgentStreamEvent[] = [];
  let buffer = '';

  const flushFrame = (frame: string) => {
    const event = parseFrame(frame);
    if (!event) return;
    events.push(event);
    onEvent?.(event);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let match = buffer.match(/\r?\n\r?\n/);
    while (match && match.index !== undefined) {
      const frame = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      flushFrame(frame);
      match = buffer.match(/\r?\n\r?\n/);
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    flushFrame(buffer);
  }

  return events;
}

export async function streamKnowledgeRun(
  storeId: string,
  question: string,
  onEvent?: (event: AgentStreamEvent) => void,
  options: StreamRunOptions = {}
): Promise<AgentStreamEvent[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...authHeaders(),
  };
  if (options.lastEventId) {
    headers['Last-Event-ID'] = options.lastEventId;
  }

  const body: Record<string, unknown> = { store_id: storeId, question };
  if (options.scene) {
    body.scene = options.scene;
  }

  const response = await fetch(`${AGENT_BASE_URL}/v1/knowledge/runs/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    throw await readError(response);
  }
  if (!response.body) {
    throw new Error('Agent 服务未返回事件流');
  }

  return readSseStream(response.body, onEvent);
}

export async function fetchRunTrace(runId: string): Promise<AgentRunTrace> {
  const response = await fetch(
    `${AGENT_BASE_URL}/v1/runs/${encodeURIComponent(runId)}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders() },
    }
  );

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as AgentRunTrace;
}

async function streamJsonRun(
  path: string,
  body: Record<string, unknown>,
  onEvent?: (event: AgentStreamEvent) => void,
  options: StreamRunOptions = {}
): Promise<AgentStreamEvent[]> {
  const response = await fetch(`${AGENT_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
    signal: options.signal,
  });

  if (!response.ok) {
    throw await readError(response);
  }
  if (!response.body) {
    throw new Error('Agent 服务未返回事件流');
  }

  return readSseStream(response.body, onEvent);
}

export function streamReconciliationRun(
  storeId: string,
  shiftId: string,
  onEvent?: (event: AgentStreamEvent) => void,
  options: StreamRunOptions = {}
): Promise<AgentStreamEvent[]> {
  return streamJsonRun(
    '/v1/reconciliation/runs/stream',
    { store_id: storeId, shift_id: shiftId },
    onEvent,
    options
  );
}

export function streamReconciliationFollowup(
  runId: string,
  question: string,
  onEvent?: (event: AgentStreamEvent) => void,
  options: StreamRunOptions = {}
): Promise<AgentStreamEvent[]> {
  return streamJsonRun(
    `/v1/reconciliation/runs/${encodeURIComponent(runId)}/messages/stream`,
    { question },
    onEvent,
    options
  );
}

export function streamSqlAnalysis(
  storeId: string,
  question: string,
  onEvent?: (event: AgentStreamEvent) => void,
  options: StreamRunOptions = {}
): Promise<AgentStreamEvent[]> {
  return streamJsonRun(
    '/v1/analysis/runs/stream',
    { store_id: storeId, question },
    onEvent,
    options
  );
}

export async function fetchRunEvidence(
  runId: string,
  kind: string,
  ids: string[]
): Promise<RunEvidence> {
  const params = new URLSearchParams({ kind, ids: ids.join(',') });
  const response = await fetch(
    `${AGENT_BASE_URL}/v1/reconciliation/runs/${encodeURIComponent(
      runId
    )}/evidence?${params.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json', ...authHeaders() },
    }
  );

  if (!response.ok) {
    throw await readError(response);
  }

  return (await response.json()) as RunEvidence;
}
