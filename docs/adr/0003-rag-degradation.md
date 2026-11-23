# ADR 0003: Retrieval failures degrade the explanation, never the report

- Status: accepted
- Date: 2026-11-23

## Context

Reconciliation depends on two external services: the model and the knowledge base. Both can be slow,
misconfigured or unavailable. Treating either as a hard dependency means a model outage stops
finance from closing a shift, which is the moment the tool is most needed. Treating a failure as
"no findings" would be worse: it would present a clean report when the SOP lookup never happened.

## Decision

- `retrieve_sop` is best-effort. A retrieval error yields zero SOP hits and records
  `RAG_UNAVAILABLE`; the graph continues to `narrate`.
- `narrate` is best-effort. A model error yields a `null` narrative with `MODEL_UNAVAILABLE`; an
  unparseable or wrongly shaped response yields `MODEL_OUTPUT_INVALID`.
- The run still finishes `succeeded` and returns the deterministic report. `degraded` and
  `degraded_reason` are returned and shown in the console.
- Citations are validated against the hits of the same request. A citation that was not retrieved
  is dropped rather than displayed.

The distinction that makes this safe: the report is complete without the model, so degradation
removes explanation, not evidence.

## Consequences

Positive:

- A model or retrieval outage does not block shift close.
- Users can see exactly which part is missing instead of guessing.
- The same policy covers the first-run narrative and the follow-up question.

Negative:

- A degraded run looks less complete; the UI must make the difference obvious.
- Two failure codes must be handled by the frontend.
- A wrong SOP retrieval is not an error, so a low-quality citation set is only visible through the
  citations themselves.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Fail the run when the model is unavailable | Blocks finance on an unrelated outage |
| Return the report as if fully explained | Hides the missing explanation |
| Invent review suggestions locally | Duplicates policy text and drifts from the SOP |
| Retry indefinitely | Couples run latency to an external dependency |

## Enforcement

- `services/agent/tests/test_reconciliation_degradation.py` covers model failure and invalid output.
- `services/agent/tests/test_rag_tool.py` covers retrieval errors.
- The public result always carries `degraded` and `degraded_reason`, so a silent degradation is a
  test failure rather than a UI assumption.
