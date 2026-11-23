# Reconciliation Agent

The reconciliation agent turns a shift into an auditable report. The model explains the result;
it never produces it.

## Graph

```text
START
  │
  ▼
load_evidence ──(no evidence)──────────────────────────► END (failed, SHIFT_EVIDENCE_UNAVAILABLE)
  │
  ▼
reconcile ──(invalid evidence)──────────────────────────► END (failed, EVIDENCE_INVALID)
  │
  ▼
retrieve_sop
  │
  ▼
narrate
  │
  ▼
END
```

| Node | Responsibility | Output |
| --- | --- | --- |
| `load_evidence` | Fetch the shift snapshot and recomputed evidence from `apps/api` | Raw evidence payload |
| `reconcile` | Apply deterministic rules; compare snapshot with recomputation | Report with totals, differences and uncertainty items |
| `retrieve_sop` | Query the knowledge base for the shift reconciliation SOP | Ranked chunks with ACL metadata |
| `narrate` | Ask the model for a summary, review suggestions and citation IDs | Narrative object or a degraded marker |

Conditional edges end the run early when evidence is missing or a rule raises a fatal error. A
missing SOP hit set is not fatal; the run continues with zero citations.

## Deterministic report

`reconcile` produces:

- Per-field comparison between the shift snapshot and recomputed evidence: order revenue, order
  count, cash, WeChat, balance, table fee, product revenue, assistant revenue, recharge revenue.
- Differences with a stable field name and a stable code, for example
  `product_revenue · PRODUCT_REVENUE_MISMATCH`.
- Uncertainty items that cannot be derived from the evidence, for example
  `OPEN_TABLE_COUNT_NOT_IN_EVIDENCE` and `EXTERNAL_CONFIRMATION_REQUIRED`.
- A status: `ok`, `insufficient_data` or `review_required`.

Money is handled with decimal arithmetic. Rounding to two decimals happens once, at presentation.

## Narrative contract

The `narrate` node accepts only a JSON object:

```json
{
  "summary": "检测到 2 项对账差异，请按报告明细复核。",
  "recommended_checks": [
    "核对差异项对应的原始订单和支付流水。",
    "完成现金实盘及外部渠道账单确认。"
  ],
  "citation_chunk_ids": [
    "billiards-sop-kd-174cce55#2",
    "billiards-sop-kd-174cce55#3"
  ]
}
```

Rules enforced before a narrative is accepted:

| Rule | Violation result |
| --- | --- |
| Response is a JSON object | `MODEL_OUTPUT_INVALID`, degraded |
| `summary` is a non-empty string | `MODEL_OUTPUT_INVALID`, degraded |
| `recommended_checks` is a string array | `MODEL_OUTPUT_INVALID`, degraded |
| `citation_chunk_ids` is a string array | `MODEL_OUTPUT_INVALID`, degraded |
| Every citation ID exists in this run's SOP hits | Unmatched IDs are dropped |

A degraded run still returns the full deterministic report. `degraded` and `degraded_reason` are
returned to the console, which shows that the explanation is unavailable rather than inventing one.

## Identity and permissions

- The caller is resolved through the PHP `agent.Auth/context` endpoint from the Bearer token.
- The reconciliation route requires the finance permission; other roles receive `403`.
- `store_id` in the request body is compared with the store access resolved for the token. The
  model never selects a store.
- The token is kept in a request-scoped context variable and used by tools; it is never included
  in a model prompt.

## Persistence

Each run stores:

- The request (store, shift).
- Status transitions and events: `run.started`, `tool.started`, `tool.completed`, terminal status.
- Every tool call with arguments and result.
- The final payload: report, narrative, citations and degradation flags.

The console reads this record for the trace view; the follow-up endpoint reads only the saved
report and never re-queries business evidence.

## Follow-up questions

`POST /v1/reconciliation/runs/{run_id}/messages/stream` accepts a question only. Identity and store
come from the stored run, which is checked against the caller before answering.

## Failure modes

| Symptom | Cause | Behaviour |
| --- | --- | --- |
| `MODEL_UNAVAILABLE` | Model request failed | Report returned, narrative `null` |
| `MODEL_OUTPUT_INVALID` | Non-JSON or wrong shape | Report returned, narrative `null` |
| Empty `sop_citations` | Retrieval returned nothing, or all IDs unmatched | Report returned unchanged |
| `SHIFT_EVIDENCE_UNAVAILABLE` | Evidence endpoint returned no usable shift | Run fails, no report |
| `EVIDENCE_INVALID` | Evidence payload failed validation | Run fails, no report |
| `PERMISSION_DENIED` | Caller lacks finance permission | `403`, no run created |
