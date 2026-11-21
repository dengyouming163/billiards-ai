"""Knowledge-scene graph wiring.

The compiled graph keeps the same ``thread_id`` as the agent run so a run can
be inspected (and later resumed) through the PostgreSQL checkpointer.
"""

from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.graphs.kernel import (
    KnowledgeState,
    ThreadedCheckpointSaver,
    call_model,
    route_after_model,
    tool_dispatch,
)
from app.services.redaction import redact_long_text


def initial_knowledge_state(question: str, scene: str | None = None) -> KnowledgeState:
    # The state is checkpointed verbatim, so secrets/PII are scrubbed first.
    safe_question = redact_long_text(question)
    return {
        "question": safe_question,
        "scene": scene,
        "round": 0,
        "messages": [{"role": "user", "content": safe_question}],
        "tool_calls": [],
        "evidence": [],
        "final_response": None,
        "error": None,
    }


def build_knowledge_graph(
    checkpointer: BaseCheckpointSaver | None = None,
) -> CompiledStateGraph:
    saver: BaseCheckpointSaver | None = None
    if checkpointer is not None:
        saver = (
            checkpointer
            if isinstance(checkpointer, ThreadedCheckpointSaver)
            else ThreadedCheckpointSaver(checkpointer)
        )

    builder = StateGraph(KnowledgeState)
    builder.add_node("model", call_model)
    builder.add_node("tool_dispatch", tool_dispatch)
    builder.add_edge(START, "model")
    builder.add_conditional_edges(
        "model",
        route_after_model,
        {"tool_dispatch": "tool_dispatch", END: END},
    )
    builder.add_edge("tool_dispatch", "model")
    return builder.compile(checkpointer=saver)


def citations_from_evidence(evidence: Any) -> list[dict[str, Any]]:
    """Flatten per-tool citation lists into one de-duplicated list."""
    seen: set[str] = set()
    citations: list[dict[str, Any]] = []
    for entry in evidence or []:
        if not isinstance(entry, dict):
            continue
        for citation in entry.get("citations") or []:
            chunk_id = citation.get("chunk_id") if isinstance(citation, dict) else None
            if not chunk_id or chunk_id in seen:
                continue
            seen.add(chunk_id)
            citations.append(citation)
    return citations[:10]
