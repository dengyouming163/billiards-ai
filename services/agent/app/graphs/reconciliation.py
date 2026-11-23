"""Fixed shift-reconciliation graph.

The graph is intentionally not model-driven:

``load_evidence -> reconcile -> has_review_items?``
``                           -> yes: retrieve_sop -> narrate -> END``
``                           -> no:  narrate -> END``

* ``load_evidence`` reuses the M0 read-only shift evidence tool with the
  caller's bearer token; the model never sees or chooses a store.
* ``reconcile`` calls the Task 10 pure function; no model or SQL is involved,
  so totals cannot be influenced by generation.
* ``retrieve_sop`` only retrieves SOP snippets for review items. A RAG failure
  degrades the narrative but never changes the deterministic report.
* ``narrate`` asks the model for ``summary/recommended_checks/
  citation_chunk_ids`` only. Every citation is re-validated against this run's
  hits; numbers are injected from the report outside the model.
"""

import json
import logging
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph
from pydantic import ValidationError

from app.domain.reconciliation import Evidence, reconcile
from app.guard.identity import Principal

logger = logging.getLogger(__name__)

RECONCILIATION_SCENE = "shift_reconciliation"
EVIDENCE_INVALID = "EVIDENCE_INVALID"
MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
MODEL_OUTPUT_INVALID = "MODEL_OUTPUT_INVALID"
RAG_UNAVAILABLE = "RAG_UNAVAILABLE"

SOP_QUERY = "交班对账差异处理流程"
DEGRADED_NARRATIVE = (
    "说明生成不可用：模型服务暂不可用，确定性报告数值不受影响，请直接查看报告明细。"
)

EvidenceLoader = Callable[[str, Principal], Awaitable[dict[str, Any]]]
SopSearch = Callable[[str, Principal], Awaitable[list[Any]]]

_NARRATIVE_SYSTEM_PROMPT = (
    "你是球房交班对账解释助手。只能解释给定的确定性报告，禁止修改任何金额、"
    "差异分类或证据引用；禁止调用任何工具。只能引用提供的 SOP chunk_id，"
    "不得引用未提供的来源。输出必须是简体中文 JSON 对象，结构为 "
    '{"summary": "一句话结论", "recommended_checks": ["复核动作"], '
    '"citation_chunk_ids": ["chunk-id"]}。没有可用引用时 citation_chunk_ids 为空数组。'
)


class ReconciliationState(TypedDict, total=False):
    shift_id: str
    evidence: dict[str, Any] | None
    report: dict[str, Any] | None
    sop_hits: list[dict[str, Any]]
    narrative: dict[str, Any] | None
    citations: list[dict[str, Any]]
    degraded: bool
    degraded_reason: str | None
    error: dict[str, Any] | None


class TracePort:
    async def emit(self, event_type: str, payload: Mapping[str, Any]) -> None: ...

    async def start_tool(self, name: str, arguments: Mapping[str, Any]) -> str: ...

    async def finish_tool(
        self,
        tool_call_id: str,
        *,
        status: str,
        result: Any = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
    ) -> None: ...


def initial_reconciliation_state(shift_id: str) -> ReconciliationState:
    return {
        "shift_id": shift_id,
        "evidence": None,
        "report": None,
        "sop_hits": [],
        "narrative": None,
        "citations": [],
        "degraded": False,
        "degraded_reason": None,
        "error": None,
    }


async def _trace_start(
    trace: TracePort | None, name: str, arguments: Mapping[str, Any], fallback_id: str
) -> str:
    if trace is None:
        return fallback_id
    try:
        return await trace.start_tool(name, arguments)
    except Exception:
        logger.warning("tool trace start failed for %s", name, exc_info=True)
        return fallback_id


async def _trace_finish(
    trace: TracePort | None, tool_call_id: str, **kwargs: Any
) -> None:
    if trace is None:
        return
    try:
        await trace.finish_tool(tool_call_id, **kwargs)
    except Exception:
        logger.warning("tool trace finish failed for %s", tool_call_id, exc_info=True)


async def _trace_emit(
    trace: TracePort | None, event_type: str, payload: Mapping[str, Any]
) -> None:
    if trace is None:
        return
    try:
        await trace.emit(event_type, payload)
    except Exception:
        logger.warning("trace emit failed for %s", event_type, exc_info=True)


def _error_payload(exc: Exception) -> dict[str, Any]:
    code = getattr(exc, "code", None)
    status = getattr(exc, "status_code", None)
    if not isinstance(code, str) or not code:
        code = "SHIFT_EVIDENCE_UNAVAILABLE"
    if not isinstance(status, int):
        status = 502
    return {"code": code, "status_code": status, "message": str(exc)[:300] or code}


async def load_evidence(state: ReconciliationState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    principal = configurable["principal"]
    loader: EvidenceLoader = configurable["evidence_loader"]
    trace: TracePort | None = configurable.get("trace")
    shift_id = state["shift_id"]

    tool_call_id = await _trace_start(
        trace, "shift_evidence", {"shift_id": shift_id}, f"shift-{shift_id}"
    )
    await _trace_emit(
        trace,
        "tool.started",
        {"tool_call_id": tool_call_id, "name": "shift_evidence", "arguments": {"shift_id": shift_id}},
    )
    try:
        payload = await loader(shift_id, principal)
    except Exception as exc:  # noqa: BLE001 - evidence failures end the run with a code
        error = _error_payload(exc)
        await _trace_finish(
            trace, tool_call_id, status="failed", error_code=error["code"]
        )
        await _trace_emit(
            trace,
            "tool.failed",
            {"tool_call_id": tool_call_id, "name": "shift_evidence", "error": error},
        )
        return {"error": error}

    await _trace_finish(trace, tool_call_id, status="succeeded", result={"shift_id": shift_id})
    await _trace_emit(
        trace,
        "tool.completed",
        {"tool_call_id": tool_call_id, "name": "shift_evidence", "status": "succeeded"},
    )
    return {"evidence": payload}


def route_after_load(state: ReconciliationState) -> str:
    if state.get("error"):
        return END
    return "reconcile"


def reconcile_node(state: ReconciliationState, config: RunnableConfig) -> dict[str, Any]:
    try:
        report = reconcile(Evidence.model_validate(state.get("evidence") or {}))
    except ValidationError:
        return {
            "error": {
                "code": EVIDENCE_INVALID,
                "status_code": 422,
                "message": "shift evidence payload is invalid",
            }
        }
    return {"report": report.model_dump(mode="json")}


def route_after_reconcile(state: ReconciliationState) -> str:
    if state.get("error"):
        return END
    report = state.get("report") or {}
    if report.get("status") == "review_required":
        return "retrieve_sop"
    return "narrate"


async def retrieve_sop(state: ReconciliationState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    principal = configurable["principal"]
    searcher: SopSearch = configurable["sop_search"]
    trace: TracePort | None = configurable.get("trace")

    tool_call_id = await _trace_start(
        trace, "rag_search", {"query": SOP_QUERY}, "rag-sop"
    )
    await _trace_emit(
        trace,
        "tool.started",
        {"tool_call_id": tool_call_id, "name": "rag_search", "arguments": {"query": SOP_QUERY}},
    )
    try:
        hits = await searcher(SOP_QUERY, principal)
    except Exception as exc:  # noqa: BLE001 - RAG failure only degrades the narrative
        await _trace_finish(
            trace, tool_call_id, status="failed", error_code=RAG_UNAVAILABLE
        )
        await _trace_emit(
            trace,
            "tool.failed",
            {
                "tool_call_id": tool_call_id,
                "name": "rag_search",
                "error": {
                    "code": RAG_UNAVAILABLE,
                    "status_code": 502,
                    "message": str(exc)[:300] or RAG_UNAVAILABLE,
                },
            },
        )
        return {"sop_hits": [], "degraded": True, "degraded_reason": RAG_UNAVAILABLE}

    normalized = [
        hit.model_dump() if hasattr(hit, "model_dump") else dict(hit) for hit in hits
    ]
    await _trace_finish(trace, tool_call_id, status="succeeded", result={"hits": normalized})
    await _trace_emit(
        trace,
        "tool.completed",
        {
            "tool_call_id": tool_call_id,
            "name": "rag_search",
            "status": "succeeded",
            "citations": [
                {"chunk_id": hit["chunk_id"], "doc_id": hit.get("doc_id")}
                for hit in normalized
                if isinstance(hit, dict) and hit.get("chunk_id")
            ],
        },
    )
    return {"sop_hits": normalized}


def _parse_narrative(content: str) -> dict[str, Any] | None:
    try:
        payload = json.loads(content)
    except (TypeError, ValueError):
        return None
    if not isinstance(payload, dict):
        return None
    summary = payload.get("summary")
    checks = payload.get("recommended_checks")
    chunk_ids = payload.get("citation_chunk_ids")
    if not isinstance(summary, str) or not summary.strip():
        return None
    if not isinstance(checks, list) or not all(isinstance(item, str) for item in checks):
        return None
    if not isinstance(chunk_ids, list) or not all(isinstance(item, str) for item in chunk_ids):
        return None
    return {
        "summary": summary.strip(),
        "recommended_checks": [item.strip() for item in checks if item.strip()],
        "citation_chunk_ids": chunk_ids,
    }


def _citations_from_hits(
    hits: list[dict[str, Any]], chunk_ids: list[str]
) -> list[dict[str, Any]]:
    by_id = {
        hit["chunk_id"]: hit
        for hit in hits
        if isinstance(hit, dict) and isinstance(hit.get("chunk_id"), str)
    }
    citations: list[dict[str, Any]] = []
    seen: set[str] = set()
    for chunk_id in chunk_ids:
        hit = by_id.get(chunk_id)
        if hit is None or chunk_id in seen:
            continue
        seen.add(chunk_id)
        citations.append(
            {
                "chunk_id": hit["chunk_id"],
                "doc_id": hit.get("doc_id"),
                "text": hit.get("text"),
                "metadata": hit.get("metadata") or {},
            }
        )
    return citations


def _narrative_prompt(
    report: dict[str, Any], hits: list[dict[str, Any]]
) -> str:
    return json.dumps(
        {
            "report": report,
            "sop_hits": [
                {
                    "chunk_id": hit.get("chunk_id"),
                    "doc_id": hit.get("doc_id"),
                    "text": hit.get("text"),
                }
                for hit in hits
                if isinstance(hit, dict)
            ],
        },
        ensure_ascii=False,
    )


async def narrate(state: ReconciliationState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    adapter = configurable["model_adapter"]
    report = state.get("report") or {}
    hits = state.get("sop_hits") or []
    degraded = bool(state.get("degraded"))
    reason = state.get("degraded_reason")

    try:
        assistant = await adapter.complete(
            [
                SystemMessage(content=_NARRATIVE_SYSTEM_PROMPT),
                HumanMessage(content=_narrative_prompt(report, hits)),
            ]
        )
    except Exception:  # noqa: BLE001 - model failure must keep the deterministic report
        return {
            "narrative": None,
            "citations": [],
            "degraded": True,
            "degraded_reason": reason or MODEL_UNAVAILABLE,
        }

    parsed = _parse_narrative(assistant.content or "")
    if parsed is None:
        return {
            "narrative": None,
            "citations": [],
            "degraded": True,
            "degraded_reason": reason or MODEL_OUTPUT_INVALID,
        }

    citations = _citations_from_hits(hits, parsed["citation_chunk_ids"])
    return {
        "narrative": parsed,
        "citations": citations,
        "degraded": degraded,
        "degraded_reason": reason,
    }


def build_reconciliation_graph() -> CompiledStateGraph:
    builder = StateGraph(ReconciliationState)
    builder.add_node("load_evidence", load_evidence)
    builder.add_node("reconcile", reconcile_node)
    builder.add_node("retrieve_sop", retrieve_sop)
    builder.add_node("narrate", narrate)
    builder.add_edge(START, "load_evidence")
    builder.add_conditional_edges(
        "load_evidence",
        route_after_load,
        {"reconcile": "reconcile", END: END},
    )
    builder.add_conditional_edges(
        "reconcile",
        route_after_reconcile,
        {"retrieve_sop": "retrieve_sop", "narrate": "narrate", END: END},
    )
    builder.add_edge("retrieve_sop", "narrate")
    builder.add_edge("narrate", END)
    return builder.compile()
