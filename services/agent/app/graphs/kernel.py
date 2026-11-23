"""Bounded knowledge graph kernel.

The graph is deliberately small: ``model -> tool_dispatch -> model``.

* ``model`` makes one model call per round and records any tool requests.
* ``tool_dispatch`` executes read-only registry tools and feeds structured
  observations (success or failure) back to the model. Tool errors never abort
  the run: they become ``tool.failed`` trace events and error observations.
* The loop stops after ``MAX_MODEL_ROUNDS`` model calls. A model that still
  asks for tools on the last round terminates with ``MAX_MODEL_ROUNDS``.

Checkpoints use the synchronous ``PostgresSaver`` (which is what the service
lifespan opens). ``ThreadedCheckpointSaver`` exposes that saver to LangGraph's
async execution by moving its blocking calls onto a worker thread.
"""

import asyncio
import json
import logging
import time
from collections.abc import Mapping
from typing import Any, Protocol, TypedDict

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    CheckpointMetadata,
    CheckpointTuple,
)
from langgraph.graph import END

from app.guard.identity import PermissionDenied
from app.services.redaction import redact_long_text, redact_payload, sanitize_arguments
from app.tools.registry import UnknownTool

logger = logging.getLogger(__name__)

MAX_MODEL_ROUNDS = 4
MAX_MODEL_ROUNDS_CODE = "MAX_MODEL_ROUNDS"
TOOL_NOT_FOUND = "TOOL_NOT_FOUND"
TOOL_ARGUMENTS_INVALID = "TOOL_ARGUMENTS_INVALID"
TOOL_PERMISSION_DENIED = "PERMISSION_DENIED"
TOOL_EXECUTION_FAILED = "TOOL_EXECUTION_FAILED"

SYSTEM_PROMPT = (
    "你是球房运营知识助手。只能依据工具返回的证据回答；"
    "证据不足时明确说明，不要编造。回答使用简体中文。"
)


class KnowledgeState(TypedDict, total=False):
    question: str
    scene: str | None
    round: int
    messages: list[dict[str, Any]]
    tool_calls: list[dict[str, Any]]
    evidence: list[dict[str, Any]]
    final_response: str | None
    error: dict[str, Any] | None


class TracePort(Protocol):
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


class ThreadedCheckpointSaver(BaseCheckpointSaver[str]):
    """Async facade over a synchronous checkpointer such as ``PostgresSaver``.

    LangGraph's async execution only calls the ``a*`` saver methods, which the
    sync PostgreSQL saver does not implement. Delegating them to a worker
    thread keeps the event loop free while preserving the single database
    schema shared with the sync saver.
    """

    def __init__(self, saver: BaseCheckpointSaver[str]) -> None:
        super().__init__(serde=saver.serde)
        self._saver = saver

    def get_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return self._saver.get_tuple(config)

    def list(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ):
        yield from self._saver.list(config, filter=filter, before=before, limit=limit)

    def put(
        self,
        config: RunnableConfig,
        checkpoint: Any,
        metadata: CheckpointMetadata,
        new_versions: Any,
    ) -> RunnableConfig:
        return self._saver.put(config, checkpoint, metadata, new_versions)

    def put_writes(
        self,
        config: RunnableConfig,
        writes: Any,
        task_id: str,
        task_path: str = "",
    ) -> None:
        return self._saver.put_writes(config, writes, task_id, task_path)

    def get_next_version(self, current: str | None, channel: Any) -> str:
        return self._saver.get_next_version(current, channel)

    async def aget_tuple(self, config: RunnableConfig) -> CheckpointTuple | None:
        return await asyncio.to_thread(self._saver.get_tuple, config)

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ):
        items = await asyncio.to_thread(
            lambda: list(self._saver.list(config, filter=filter, before=before, limit=limit))
        )
        for item in items:
            yield item

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Any,
        metadata: CheckpointMetadata,
        new_versions: Any,
    ) -> RunnableConfig:
        return await asyncio.to_thread(
            self._saver.put, config, checkpoint, metadata, new_versions
        )

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Any,
        task_id: str,
        task_path: str = "",
    ) -> None:
        return await asyncio.to_thread(
            self._saver.put_writes, config, writes, task_id, task_path
        )


def _system_prompt(scene: str | None) -> str:
    if scene:
        return f"{SYSTEM_PROMPT}\n当前场景：{scene}。"
    return SYSTEM_PROMPT


def _to_langchain_messages(state: KnowledgeState) -> list[BaseMessage]:
    messages: list[BaseMessage] = [SystemMessage(content=_system_prompt(state.get("scene")))]
    for item in state.get("messages") or []:
        role = item.get("role")
        content = item.get("content") or ""
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            tool_calls = [
                {
                    "id": call.get("id") or "",
                    "name": call.get("name") or "",
                    "args": dict(call.get("arguments") or {}),
                    "type": "tool_call",
                }
                for call in item.get("tool_calls") or []
            ]
            messages.append(AIMessage(content=content, tool_calls=tool_calls))
        elif role == "tool":
            messages.append(
                ToolMessage(content=content, tool_call_id=item.get("tool_call_id") or "")
            )
    return messages


async def call_model(state: KnowledgeState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    adapter = configurable["model_adapter"]
    registry = configurable["registry"]
    principal = configurable["principal"]

    round_no = int(state.get("round") or 0) + 1
    assistant = await adapter.complete(
        _to_langchain_messages(state), registry.langchain_tools(principal)
    )
    content = redact_long_text(assistant.content or "")

    tool_calls = [
        {
            "id": call.id or f"call-{round_no}-{index}",
            "name": call.name,
            "arguments": sanitize_arguments(call.name, dict(call.arguments)),
        }
        for index, call in enumerate(assistant.tool_calls)
    ]
    messages = list(state.get("messages") or [])
    messages.append({"role": "assistant", "content": content, "tool_calls": tool_calls})
    update: dict[str, Any] = {
        "round": round_no,
        "messages": messages,
        "tool_calls": tool_calls,
    }

    if tool_calls and round_no >= MAX_MODEL_ROUNDS:
        update["tool_calls"] = []
        update["error"] = {
            "code": MAX_MODEL_ROUNDS_CODE,
            "message": "model exceeded the maximum number of tool rounds",
            "status_code": 422,
            "round": round_no,
        }
        return update
    if not tool_calls:
        update["final_response"] = content
    return update


def route_after_model(state: KnowledgeState) -> str:
    if state.get("error"):
        return END
    if state.get("tool_calls"):
        return "tool_dispatch"
    return END


def _dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)


def _persistable(result: Any) -> dict[str, Any]:
    if isinstance(result, Mapping):
        return dict(result)
    if isinstance(result, list):
        return {"items": result}
    return {"value": result}


def _citations_of(name: str, result: Any) -> list[dict[str, Any]]:
    if name != "rag_search" or not isinstance(result, list):
        return []
    citations: list[dict[str, Any]] = []
    for hit in result:
        if isinstance(hit, Mapping) and hit.get("chunk_id"):
            citations.append(
                {
                    "chunk_id": hit["chunk_id"],
                    "doc_id": hit.get("doc_id"),
                    "score": hit.get("score"),
                }
            )
    return citations[:10]


def _tool_error(exc: Exception) -> dict[str, Any]:
    code = getattr(exc, "code", None)
    status = getattr(exc, "status_code", None)

    if isinstance(exc, UnknownTool):
        code, status = TOOL_NOT_FOUND, 404
    elif isinstance(exc, PermissionDenied):
        code, status = TOOL_PERMISSION_DENIED, 403
    elif isinstance(exc, (TypeError, ValueError)) and not code:
        code, status = TOOL_ARGUMENTS_INVALID, 422

    if not isinstance(code, str) or not code:
        code, status = TOOL_EXECUTION_FAILED, 500
    elif not isinstance(status, int):
        status = 502

    message = str(exc)[:300] or code
    return {"code": code, "status_code": status, "message": message}


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


async def _trace_emit(
    trace: TracePort | None, event_type: str, payload: Mapping[str, Any]
) -> None:
    if trace is None:
        return
    try:
        await trace.emit(event_type, payload)
    except Exception:
        logger.warning("trace emit failed for %s", event_type, exc_info=True)


async def _trace_finish(
    trace: TracePort | None, tool_call_id: str, **kwargs: Any
) -> None:
    if trace is None:
        return
    try:
        await trace.finish_tool(tool_call_id, **kwargs)
    except Exception:
        logger.warning("tool trace finish failed for %s", tool_call_id, exc_info=True)


async def tool_dispatch(state: KnowledgeState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    registry = configurable["registry"]
    principal = configurable["principal"]
    trace: TracePort | None = configurable.get("trace")

    messages = list(state.get("messages") or [])
    evidence = list(state.get("evidence") or [])

    for index, call in enumerate(state.get("tool_calls") or []):
        name = str(call.get("name") or "")
        arguments = dict(call.get("arguments") or {})
        model_call_id = str(call.get("id") or "")
        fallback_id = model_call_id or f"tool-{index}"
        started = time.perf_counter()
        tool_call_id = await _trace_start(trace, name, arguments, fallback_id)
        await _trace_emit(
            trace,
            "tool.started",
            {
                "tool_call_id": tool_call_id,
                "name": name,
                "arguments": redact_payload(arguments),
            },
        )

        try:
            result = await registry.call(name, arguments, principal)
        except Exception as exc:  # noqa: BLE001 - every tool error becomes an observation
            latency_ms = int((time.perf_counter() - started) * 1000)
            error = _tool_error(exc)
            await _trace_finish(
                trace,
                tool_call_id,
                status="failed",
                latency_ms=latency_ms,
                error_code=error["code"],
            )
            await _trace_emit(
                trace,
                "tool.failed",
                {
                    "tool_call_id": tool_call_id,
                    "name": name,
                    "error": error,
                    "latency_ms": latency_ms,
                },
            )
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": model_call_id or tool_call_id,
                    "name": name,
                    "content": _dump(redact_payload({"error": error})),
                }
            )
            continue

        latency_ms = int((time.perf_counter() - started) * 1000)
        citations = _citations_of(name, result)
        observation = redact_payload(result)
        await _trace_finish(
            trace,
            tool_call_id,
            status="succeeded",
            result=_persistable(result),
            latency_ms=latency_ms,
        )
        await _trace_emit(
            trace,
            "tool.completed",
            {
                "tool_call_id": tool_call_id,
                "name": name,
                "status": "succeeded",
                "latency_ms": latency_ms,
                "citations": citations,
            },
        )
        messages.append(
            {
                "role": "tool",
                "tool_call_id": model_call_id or tool_call_id,
                "name": name,
                "content": _dump(observation),
            }
        )
        evidence.append(
            {"tool": name, "tool_call_id": tool_call_id, "citations": citations}
        )

    return {"messages": messages, "tool_calls": [], "evidence": evidence}
