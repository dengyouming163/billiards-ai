"""Bounded agent loop tests: round limit and tool error observations.

These tests drive the graph directly with a scripted model adapter and a test
tool registry. Nothing here talks to a real model, RAG service or PHP.
"""

from typing import Any

from langgraph.checkpoint.memory import InMemorySaver

from app.graphs.knowledge import build_knowledge_graph, initial_knowledge_state
from app.models.llm import AssistantMessage, ToolCall, Usage
from app.schemas import Principal
from app.tools.rag import RagUnavailable
from app.tools.registry import RagSearchArgs, ToolRegistry, ToolSpec


def _principal() -> Principal:
    return Principal(
        tenant_id="tenant-1",
        employee_id="emp-1001",
        store_id="store-1",
        role="staff",
        permissions=frozenset(),
    )


def _assistant(content: str = "", tool_calls: list[ToolCall] | None = None) -> AssistantMessage:
    return AssistantMessage(
        content=content,
        tool_calls=list(tool_calls or []),
        usage=Usage(),
        model="fake-model",
        latency_ms=1,
    )


def _rag_call(call_id: str = "call-1") -> ToolCall:
    return ToolCall(id=call_id, name="rag_search", arguments={"query": "交班差异"})


class ScriptedAdapter:
    """Return scripted assistant messages; the last entry repeats forever."""

    def __init__(self, responses: list[AssistantMessage]) -> None:
        if not responses:
            raise ValueError("at least one scripted response is required")
        self._responses = responses
        self.calls: list[list[Any]] = []

    async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
        self.calls.append(list(messages))
        index = min(len(self.calls) - 1, len(self._responses) - 1)
        return self._responses[index]


class RecordingTrace:
    def __init__(self) -> None:
        self.events: list[tuple[str, dict[str, Any]]] = []
        self.tools: dict[str, dict[str, Any]] = {}

    async def emit(self, event_type: str, payload: dict[str, Any]) -> None:
        self.events.append((event_type, payload))

    async def start_tool(self, name: str, arguments: dict[str, Any]) -> str:
        tool_call_id = f"tc-{len(self.tools) + 1}"
        self.tools[tool_call_id] = {"name": name, "arguments": arguments, "status": "running"}
        return tool_call_id

    async def finish_tool(
        self,
        tool_call_id: str,
        *,
        status: str,
        result: Any = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
    ) -> None:
        self.tools[tool_call_id].update(
            {"status": status, "result": result, "error_code": error_code, "latency_ms": latency_ms}
        )


def _registry(handler: Any) -> ToolRegistry:
    return ToolRegistry(
        [
            ToolSpec(
                name="rag_search",
                description="test rag search",
                args_schema=RagSearchArgs,
                handler=handler,
            )
        ]
    )


async def _invoke(adapter: ScriptedAdapter, registry: ToolRegistry, trace: RecordingTrace):
    graph = build_knowledge_graph(InMemorySaver())
    config = {
        "configurable": {
            "thread_id": "thread-limits",
            "principal": _principal(),
            "model_adapter": adapter,
            "registry": registry,
            "trace": trace,
        }
    }
    return await graph.ainvoke(initial_knowledge_state("交班差异怎么处理？", "knowledge_qa"), config)


async def test_model_tool_loop_stops_after_four_model_calls():
    async def handler(principal: Principal, *, query: str) -> list[dict[str, Any]]:
        return [{"chunk_id": "c1", "doc_id": "d1", "score": 0.5, "text": f"hit for {query}"}]

    adapter = ScriptedAdapter([_assistant(tool_calls=[_rag_call()])])
    trace = RecordingTrace()

    result = await _invoke(adapter, _registry(handler), trace)

    assert len(adapter.calls) == 4
    assert result["round"] == 4
    assert result["final_response"] is None
    assert result["error"]["code"] == "MAX_MODEL_ROUNDS"
    # The fourth tool request is not executed: only rounds 1-3 dispatch tools.
    assert [event for event, _ in trace.events].count("tool.started") == 3
    assert all(item["status"] == "succeeded" for item in trace.tools.values())


async def test_tool_failure_is_reported_and_observation_returns_to_model():
    async def handler(principal: Principal, *, query: str) -> list[dict[str, Any]]:
        raise RagUnavailable("rag is down")

    adapter = ScriptedAdapter(
        [_assistant(tool_calls=[_rag_call()]), _assistant(content="暂时无法检索，请稍后再试。")]
    )
    trace = RecordingTrace()

    result = await _invoke(adapter, _registry(handler), trace)

    assert result["final_response"] == "暂时无法检索，请稍后再试。"
    assert len(adapter.calls) == 2
    assert trace.tools["tc-1"]["status"] == "failed"
    assert trace.tools["tc-1"]["error_code"] == "RAG_UNAVAILABLE"

    failed = [payload for event, payload in trace.events if event == "tool.failed"]
    assert len(failed) == 1
    assert failed[0]["error"]["code"] == "RAG_UNAVAILABLE"
    assert failed[0]["error"]["status_code"] == 502

    tool_messages = [message for message in adapter.calls[1] if message.type == "tool"]
    assert len(tool_messages) == 1
    assert "RAG_UNAVAILABLE" in tool_messages[0].content


async def test_unknown_tool_is_reported_as_structured_failure():
    async def handler(principal: Principal, *, query: str) -> list[dict[str, Any]]:
        return []

    adapter = ScriptedAdapter(
        [
            _assistant(tool_calls=[ToolCall(id="call-x", name="sql_analysis", arguments={})]),
            _assistant(content="没有可用工具。"),
        ]
    )
    trace = RecordingTrace()

    result = await _invoke(adapter, _registry(handler), trace)

    assert result["final_response"] == "没有可用工具。"
    failed = [payload for event, payload in trace.events if event == "tool.failed"]
    assert failed[0]["error"]["code"] == "TOOL_NOT_FOUND"


async def test_tool_success_records_citations_and_feeds_model():
    async def handler(principal: Principal, *, query: str) -> list[dict[str, Any]]:
        return [{"chunk_id": "c1", "doc_id": "d1", "score": 0.75, "text": "交班 SOP"}]

    adapter = ScriptedAdapter([_assistant(tool_calls=[_rag_call()]), _assistant(content="按 SOP 执行。")])
    trace = RecordingTrace()

    result = await _invoke(adapter, _registry(handler), trace)

    assert result["final_response"] == "按 SOP 执行。"
    assert trace.tools["tc-1"]["status"] == "succeeded"
    completed = [payload for event, payload in trace.events if event == "tool.completed"]
    assert completed[0]["citations"][0]["chunk_id"] == "c1"
    assert result["evidence"][0]["citations"][0]["doc_id"] == "d1"
