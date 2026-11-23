# Agent API Reference

Base URL: `http://127.0.0.1:8100` (local) or `http://132.232.166.40/agent` (demo, nginx prefix).

All business endpoints require `Authorization: Bearer <token>`. The token is resolved through the
PHP `agent.Auth/context` endpoint; tenant, store, role and permissions come from that response.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/health/live` | Liveness, always `200` while running |
| `GET` | `/health/ready` | Readiness, checks database and migrations |
| `POST` | `/v1/reconciliation/runs/stream` | Run a shift reconciliation (SSE) |
| `POST` | `/v1/reconciliation/runs/{run_id}/messages/stream` | Follow-up question on a saved report (SSE) |
| `GET` | `/v1/reconciliation/runs/{run_id}/evidence` | Evidence attached to a run |
| `POST` | `/v1/analysis/runs/stream` | Read-only SQL analysis (SSE) |
| `POST` | `/v1/knowledge/runs/stream` | SOP question answering (SSE) |
| `GET` | `/v1/runs/{run_id}` | Stored run with events, tool calls and result |

## Reconciliation run

```http
POST /v1/reconciliation/runs/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "store_id": "m_8ef6c7660f16b1be98abbe7a",
  "shift_id": "att_6a473dc4e6f95"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `store_id` | string, 1-64 | Must match a store the token may access |
| `shift_id` | string, 1-64 | Attendance record that defines the shift window |

Extra fields are rejected with `422`.

Response `200` is an SSE stream. Event types:

| Event | Payload |
| --- | --- |
| `run.started` | `scene`, `shift_id` |
| `tool.started` | `name`, `arguments`, `tool_call_id` |
| `tool.completed` | `name`, `status`, `tool_call_id` |
| `message.delta` | `delta` (rendered narrative text) |
| `run.completed` | `status`, `report_status`, `degraded`, `citations` |
| `run.failed` | `status`, `error` (`code`, `message`, `status_code`) |

Final result shape (fields trimmed):

```json
{
  "run_id": "fd882d16-d2d9-4ee0-9732-5225562784e1",
  "status": "succeeded",
  "report": {
    "schema_version": "1",
    "status": "review_required",
    "legacy_summary": {
      "order_revenue": "219.00",
      "cash_paid": "219.00",
      "product_revenue": "0.00",
      "assistant_revenue": "0.00"
    },
    "recomputed": {
      "order_revenue": { "value": "219.00", "refs": ["ref-orders"] },
      "cash_paid": { "value": "219.00", "refs": ["ref-cash"] },
      "product_revenue": { "value": "99.00", "refs": ["ref-orders"] },
      "assistant_revenue": { "value": "120.00", "refs": ["ref-orders"] }
    },
    "differences": [
      {
        "code": "PRODUCT_REVENUE_MISMATCH",
        "field": "product_revenue",
        "legacy": "0.00",
        "recomputed": "99.00",
        "delta": "99.00",
        "refs": ["ref-orders"]
      },
      {
        "code": "ASSISTANT_REVENUE_MISMATCH",
        "field": "assistant_revenue",
        "legacy": "0.00",
        "recomputed": "120.00",
        "delta": "120.00",
        "refs": ["ref-orders"]
      }
    ],
    "explained": [],
    "unknowns": [
      { "code": "OPEN_TABLE_COUNT_NOT_IN_EVIDENCE", "message": "…", "refs": [] },
      { "code": "EXTERNAL_CONFIRMATION_REQUIRED", "message": "…", "refs": [] }
    ],
    "evidence_refs": [
      { "ref_id": "ref-orders", "rule_id": "order_revenue", "source_endpoint": "/agent.Reconciliation/evidence", "source_ids": [] }
    ]
  },
  "narrative": {
    "summary": "检测到 2 项对账差异，请按报告明细复核。",
    "recommended_checks": [
      "核对差异项对应的原始订单和支付流水。",
      "完成现金实盘及外部渠道账单确认。"
    ],
    "citation_chunk_ids": ["billiards-sop-kd-174cce55#2"]
  },
  "sop_citations": [
    { "chunk_id": "billiards-sop-kd-174cce55#2", "doc_id": "billiards-sop-kd-174cce55" }
  ],
  "degraded": false,
  "degraded_reason": null
}
```

`report.status` is one of `ok`, `insufficient_data` or `review_required`. `narrative` is `null`
and `degraded` is `true` when the model is unavailable or returns an invalid shape. `report` is
unaffected in both cases.

## Follow-up

```http
POST /v1/reconciliation/runs/{run_id}/messages/stream
Authorization: Bearer <token>
Content-Type: application/json

{ "question": "商品差异为什么是 99 元？" }
```

Only `question` is accepted. The store and identity are taken from the stored run, which must
belong to the caller. The endpoint reads the saved report and does not re-query business evidence.

## Analysis run

```http
POST /v1/analysis/runs/stream
Authorization: Bearer <token>
Content-Type: application/json

{ "store_id": "m_8ef6c7660f16b1be98abbe7a", "question": "本月各支付方式的营业额合计是多少？" }
```

| Error code | Where | Meaning |
| --- | --- | --- |
| `SQL_GENERATION_FAILED` | stream `run.failed` | Model produced no usable query |
| `SQL_REJECTED` | stream `run.failed` | Guard rejected the statement or a referenced object |
| `SQL_EXECUTION_FAILED` | stream `run.failed` | Database rejected the guarded query |
| `SQL_TIMEOUT` | stream `run.failed` | Server-side time limit exceeded |
| `SQL_STORE_SCOPE_MISSING` | raised by executor | Store scope was not supplied |

A rejected query is never executed.

## Knowledge run

```http
POST /v1/knowledge/runs/stream
Authorization: Bearer <token>
Content-Type: application/json

{ "store_id": "m_8ef6c7660f16b1be98abbe7a", "question": "交班对账的标准流程是什么？" }
```

## Run record

```http
GET /v1/runs/{run_id}
Authorization: Bearer <token>
```

Returns the stored run with status, scene, timestamps, events, tool calls and the final result.
Runs belonging to another principal return `404`.

## Error envelope

HTTP errors use:

```json
{ "detail": { "code": "PERMISSION_DENIED", "message": "missing permission: finance:cashflow" } }
```

| Code | Status |
| --- | --- |
| `UNAUTHENTICATED` | 401 |
| `STORE_ACCESS_DENIED` | 403 |
| `PERMISSION_DENIED` | 403 |
| `INVALID_STORE_CONTEXT` | 422 |
| `IDENTITY_UNAVAILABLE` | 502 |
| `IDENTITY_MISMATCH` | 502 |
| `RUN_NOT_FOUND` | 404 |
| `RECONCILIATION_UNAVAILABLE` | 503 |
| `ANALYSIS_UNAVAILABLE` | 503 |
| `CHECKPOINT_UNAVAILABLE` | 503 |

Reconciliation and analysis both require the `finance:cashflow` permission.
