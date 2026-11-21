"""HTTP trace API tests: SSE ordering, run lookup isolation, auth and errors.

The app is built with injected fakes (identity, model, tools) and a test
session factory bound to the conftest transaction. No real model, RAG, PHP or
business database is contacted.
"""

import asyncio
import json
import uuid
from typing import Any

import httpx
import pytest
from langgraph.checkpoint.memory import InMemorySaver
from sqlalchemy.orm import sessionmaker

from app.graphs import kernel
from app.graphs.knowledge import build_knowledge_graph
from app.guard.identity import IdentityError
from app.main import create_app
from app.models.llm import (
    MODEL_UNAVAILABLE,
    AssistantMessage,
    ModelInvocationError,
    ToolCall,
    Usage,
)
from app.schemas import Principal
from app.services import run_repository as run_repository_module
from app.services.events import EventPublisher, max_persisted_seq
from app.services.run_repository import RunRepository
from app.tools.rag import RagUnavailable
from app.tools.registry import RagSearchArgs, ToolRegistry, ToolSpec


def _principal(employee_id: str = "emp-1001", store_id: str = "store-1") -> Principal:
    return Principal(
        tenant_id="tenant-1",
        employee_id=employee_id,
        store_id=store_id,
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


class FakeIdentity:
    def __init__(self) -> None:
        self.tokens = {
            "token-emp1": _principal(),
            "token-emp2": _principal(employee_id="emp-other"),
            "token-emp3": _principal(employee_id="emp-foreign", store_id="store-2"),
        }

    async def resolve(self, access_token: str | None, store_id: str | None) -> Principal:
        if not access_token or access_token not in self.tokens:
            raise IdentityError("identity is not authenticated", code="UNAUTHENTICATED", status_code=401)
        principal = self.tokens[access_token]
        if store_id != principal.store_id:
            raise IdentityError(
                "identity store does not match the requested store",
                code="IDENTITY_MISMATCH",
                status_code=403,
            )
        return principal


class ScriptedAdapter:
    def __init__(self, responses: list[AssistantMessage]) -> None:
        self._responses = responses
        self.calls: list[list[Any]] = []

    async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
        self.calls.append(list(messages))
        index = min(len(self.calls) - 1, len(self._responses) - 1)
        return self._responses[index]


class FailingAdapter:
    async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
        raise ModelInvocationError("model is temporarily unavailable", code=MODEL_UNAVAILABLE)


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


async def _rag_hits(principal: Principal, *, query: str) -> list[dict[str, Any]]:
    return [{"chunk_id": "c1", "doc_id": "d1", "score": 0.8, "text": f"hit for {query}"}]


async def _rag_down(principal: Principal, *, query: str) -> list[dict[str, Any]]:
    raise RagUnavailable("rag is down")


@pytest.fixture()
def session_factory(session):
    return sessionmaker(
        bind=session.connection(),
        autoflush=False,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )


def _build_app(
    session_factory: Any,
    *,
    adapter: Any,
    registry: ToolRegistry,
    checkpointer: Any = "default",
    knowledge_graph: Any = None,
    sse_ping_interval: float = 15.0,
) -> Any:
    return create_app(
        identity_client=FakeIdentity(),
        model_adapter=adapter,
        registry=registry,
        session_factory=session_factory,
        checkpointer=InMemorySaver() if checkpointer == "default" else checkpointer,
        knowledge_graph=knowledge_graph,
        langgraph_database_url="",
        sse_ping_interval=sse_ping_interval,
    )


def _client(app: Any):
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


def _parse_sse(body: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for block in body.strip().split("\n\n"):
        if not block.strip():
            continue
        fields: dict[str, str] = {}
        for line in block.splitlines():
            key, _, value = line.partition(": ")
            fields[key] = value
        events.append(
            {
                "id": fields["id"],
                "type": fields["event"],
                "data": json.loads(fields["data"]),
            }
        )
    return events


RUN_BODY = {"store_id": "store-1", "question": "交班差异怎么处理？", "scene": "knowledge_qa"}
AUTH = {"Authorization": "Bearer token-emp1"}


async def test_stream_events_are_ordered_persisted_and_queryable(session_factory):
    adapter = ScriptedAdapter([_assistant(tool_calls=[_rag_call()]), _assistant(content="按 SOP 执行。")])
    app = _build_app(session_factory, adapter=adapter, registry=_registry(_rag_hits))

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")
        events = _parse_sse(response.text)

        assert [event["type"] for event in events] == [
            "run.started",
            "tool.started",
            "tool.completed",
            "message.delta",
            "run.completed",
        ]
        run_id = events[0]["id"].split(":")[0]
        assert [event["id"] for event in events] == [
            f"{run_id}:{seq}" for seq in range(1, len(events) + 1)
        ]
        assert events[-2]["data"]["delta"] == "按 SOP 执行。"

        detail = await client.get(f"/v1/runs/{run_id}", headers=AUTH)
        assert detail.status_code == 200
        body = detail.json()
        assert body["status"] == "succeeded"
        assert body["scene"] == "knowledge_qa"
        assert [event["type"] for event in body["events"]] == [
            event["type"] for event in events
        ]
        assert body["tool_calls"][0]["name"] == "rag_search"
        assert body["tool_calls"][0]["status"] == "succeeded"
        assert body["citations"][0]["chunk_id"] == "c1"
        assert body["result"]["answer"] == "按 SOP 执行。"

        foreign = await client.get(
            f"/v1/runs/{run_id}", headers={"Authorization": "Bearer token-emp2"}
        )
        assert foreign.status_code == 404


async def test_tool_failure_event_and_trace_are_preserved(session_factory):
    adapter = ScriptedAdapter([_assistant(tool_calls=[_rag_call()]), _assistant(content="稍后再试。")])
    app = _build_app(session_factory, adapter=adapter, registry=_registry(_rag_down))

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        types = [event["type"] for event in events]
        assert types == [
            "run.started",
            "tool.started",
            "tool.failed",
            "message.delta",
            "run.completed",
        ]
        failed = events[2]["data"]
        assert failed["name"] == "rag_search"
        assert failed["error"]["code"] == "RAG_UNAVAILABLE"
        assert failed["error"]["status_code"] == 502

        run_id = events[0]["id"].split(":")[0]
        detail = await client.get(f"/v1/runs/{run_id}", headers=AUTH)
        body = detail.json()
        assert body["status"] == "succeeded"
        assert body["tool_calls"][0]["status"] == "failed"
        assert body["tool_calls"][0]["error_code"] == "RAG_UNAVAILABLE"
        assert [event["type"] for event in body["events"]] == types


async def test_model_failure_finishes_run_and_keeps_events(session_factory):
    app = _build_app(session_factory, adapter=FailingAdapter(), registry=_registry(_rag_hits))

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert [event["type"] for event in events] == ["run.started", "run.failed"]
        assert events[1]["data"]["error"]["code"] == MODEL_UNAVAILABLE

        run_id = events[0]["id"].split(":")[0]
        detail = await client.get(f"/v1/runs/{run_id}", headers=AUTH)
        body = detail.json()
        assert body["status"] == "failed"
        assert body["result"]["error"]["code"] == MODEL_UNAVAILABLE
        assert [event["type"] for event in body["events"]] == [
            "run.started",
            "run.failed",
        ]


async def test_identity_fields_in_body_are_rejected(session_factory):
    app = _build_app(session_factory, adapter=ScriptedAdapter([_assistant(content="ok")]), registry=_registry(_rag_hits))
    async with app.router.lifespan_context(app), _client(app) as client:
        for injected in ("tenant_id", "employee_id", "role", "permissions"):
            body = dict(RUN_BODY, **{injected: "spoofed"})
            response = await client.post(
                "/v1/knowledge/runs/stream", json=body, headers=AUTH
            )
            assert response.status_code == 422, injected


async def test_missing_or_unknown_bearer_token_is_rejected(session_factory):
    app = _build_app(session_factory, adapter=ScriptedAdapter([_assistant(content="ok")]), registry=_registry(_rag_hits))
    async with app.router.lifespan_context(app), _client(app) as client:
        missing = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY)
        assert missing.status_code == 401
        unknown = await client.post(
            "/v1/knowledge/runs/stream",
            json=RUN_BODY,
            headers={"Authorization": "Bearer nope"},
        )
        assert unknown.status_code == 401


async def test_missing_checkpointer_degrades_to_503(session_factory):
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="ok")]),
        registry=_registry(_rag_hits),
        checkpointer=None,
    )
    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        assert response.status_code == 503
        assert response.json()["detail"]["code"] == "CHECKPOINT_UNAVAILABLE"
        ready = await client.get("/health/ready")
        assert ready.status_code == 503
        live = await client.get("/health/live")
        assert live.status_code == 200
        assert live.json() == {"status": "ok"}


async def test_ready_reports_database_and_migration(session_factory):
    app = _build_app(session_factory, adapter=ScriptedAdapter([_assistant(content="ok")]), registry=_registry(_rag_hits))
    async with app.router.lifespan_context(app), _client(app) as client:
        ready = await client.get("/health/ready")
        assert ready.status_code == 200
        body = ready.json()
        assert body["status"] == "ready"
        assert body["checks"]["migration"] == "0001"


async def test_stream_disconnect_does_not_break_following_requests(session_factory):
    adapter = ScriptedAdapter([_assistant(content="完成。")])
    app = _build_app(session_factory, adapter=adapter, registry=_registry(_rag_hits))

    async with app.router.lifespan_context(app):
        runner = app.state.runner
        principal = _principal()
        first_run = await runner.create_run(principal, RUN_BODY["question"], RUN_BODY["scene"])
        stream = runner.stream(first_run, principal, RUN_BODY["question"], RUN_BODY["scene"])
        first_chunk = await stream.__anext__()
        assert "event: run.started" in first_chunk
        await stream.aclose()

        second_run = await runner.create_run(principal, RUN_BODY["question"], RUN_BODY["scene"])
        chunks = [
            chunk
            async for chunk in runner.stream(
                second_run, principal, RUN_BODY["question"], RUN_BODY["scene"]
            )
        ]
        assert "event: run.started" in chunks[0]
        assert "event: run.completed" in chunks[-1]


async def test_long_question_and_answer_are_not_truncated(session_factory):
    question = "问" * 1000
    answer = "答" * 1000
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content=answer)]),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/knowledge/runs/stream",
            json={"store_id": "store-1", "question": question, "scene": "knowledge_qa"},
            headers=AUTH,
        )
        events = _parse_sse(response.text)
        delta = next(event for event in events if event["type"] == "message.delta")
        assert isinstance(delta["data"]["delta"], str)
        assert delta["data"]["delta"] == answer

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()
        assert body["result"]["answer"] == answer
        assert body["input"]["question"] == question


async def test_terminal_event_write_failure_keeps_single_consistent_terminal(
    session_factory, monkeypatch
):
    original_add = EventPublisher.add_to_session
    failures = {"count": 0}

    def flaky_add(self, session, envelope):
        if envelope["type"] == "message.delta" and failures["count"] == 0:
            failures["count"] += 1
            raise RuntimeError("terminal event write failed")
        return original_add(self, session, envelope)

    monkeypatch.setattr(EventPublisher, "add_to_session", flaky_add)
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="答案")]),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        types = [event["type"] for event in events]
        assert failures["count"] == 1
        assert types == ["run.started", "run.failed"]

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()
        assert body["status"] == "failed"
        assert body["result"]["error"]["code"] == "TERMINAL_WRITE_FAILED"
        persisted = [event["type"] for event in body["events"]]
        assert [event for event in persisted if event in ("run.completed", "run.failed")] == [
            "run.failed"
        ]


async def test_stream_disconnect_marks_run_cancelled(session_factory):
    class SlowAdapter:
        async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
            await asyncio.sleep(0.4)
            return _assistant(content="迟到")

    app = _build_app(session_factory, adapter=SlowAdapter(), registry=_registry(_rag_hits))

    async with app.router.lifespan_context(app), _client(app) as client:
        runner = app.state.runner
        principal = _principal()
        run_id = await runner.create_run(principal, "交班差异", "knowledge_qa")
        stream = runner.stream(run_id, principal, "交班差异", "knowledge_qa")
        first = await stream.__anext__()
        assert "event: run.started" in first
        await stream.aclose()

        detail = await client.get(f"/v1/runs/{run_id}", headers=AUTH)
        assert detail.status_code == 200
        assert detail.json()["status"] == "cancelled"


async def test_tool_call_is_not_left_running_when_trace_finish_fails(
    session_factory, monkeypatch
):
    original_finish = run_repository_module.ToolCallRepository.finish
    state = {"failed": False}

    def flaky_finish(self, tool_call_id, principal, **kwargs):
        if not state["failed"]:
            state["failed"] = True
            raise RuntimeError("tool call finish write failed")
        return original_finish(self, tool_call_id, principal, **kwargs)

    monkeypatch.setattr(run_repository_module.ToolCallRepository, "finish", flaky_finish)
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter(
            [_assistant(tool_calls=[_rag_call()]), _assistant(content="完成")]
        ),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert events[-1]["type"] == "run.completed"

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()
        assert body["status"] == "succeeded"
        assert body["result"]["answer"] == "完成"
        assert body["tool_calls"][0]["status"] == "failed"
        assert body["tool_calls"][0]["error_code"] == "TRACE_WRITE_FAILED"


async def test_get_run_does_not_oracle_existence_with_bad_token(session_factory):
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="ok")]),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]

        existing = await client.get(
            f"/v1/runs/{run_id}", headers={"Authorization": "Bearer nope"}
        )
        assert existing.status_code == 404
        missing = await client.get(
            f"/v1/runs/{uuid.uuid4()}", headers={"Authorization": "Bearer nope"}
        )
        assert missing.status_code == 404
        no_auth = await client.get(f"/v1/runs/{run_id}")
        assert no_auth.status_code == 401


async def test_sse_sends_keep_alive_pings(session_factory):
    class SlowAdapter:
        async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
            await asyncio.sleep(0.3)
            return _assistant(content="ok")

    app = _build_app(
        session_factory,
        adapter=SlowAdapter(),
        registry=_registry(_rag_hits),
        sse_ping_interval=0.05,
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        assert response.status_code == 200
        assert ": ping\n\n" in response.text
        assert "event: run.completed" in response.text


async def test_ready_fails_when_checkpoint_probe_fails(session_factory):
    class BadConn:
        def execute(self, *args: Any, **kwargs: Any):
            raise RuntimeError("checkpoint database is down")

    class BadSaver:
        conn = BadConn()

    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="ok")]),
        registry=_registry(_rag_hits),
        checkpointer=BadSaver(),
        knowledge_graph=build_knowledge_graph(InMemorySaver()),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        ready = await client.get("/health/ready")
        assert ready.status_code == 503
        assert ready.json()["code"] == "CHECKPOINT_UNAVAILABLE"
        live = await client.get("/health/live")
        assert live.status_code == 200


async def test_get_run_hides_foreign_store_as_404(session_factory):
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="ok")]),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]

        foreign_store = await client.get(
            f"/v1/runs/{run_id}", headers={"Authorization": "Bearer token-emp3"}
        )
        assert foreign_store.status_code == 404


async def test_event_publisher_resumes_seq_after_persisted_events(session_factory):
    with session_factory() as session:
        run = RunRepository(session).create(scene="knowledge_qa", principal=_principal())
        run_id = run.id
        session.commit()

    first = EventPublisher(session_factory, run_id)
    first.emit("custom.one", {"value": 1})
    initial = max_persisted_seq(session_factory, run_id)
    second = EventPublisher(session_factory, run_id, initial_seq=initial)
    envelope = second.emit("custom.two", {"value": 2})

    assert initial == 1
    assert envelope["seq"] == 2
    assert envelope["id"] == f"{run_id}:2"


class RecordingGraph:
    def __init__(self) -> None:
        self.config: dict[str, Any] | None = None

    async def ainvoke(self, state: Any, config: dict[str, Any]) -> dict[str, Any]:
        self.config = config
        return {"final_response": "ok", "evidence": [], "round": 1, "error": None}


async def test_recursion_limit_scales_with_model_rounds(session_factory):
    graph = RecordingGraph()
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content="unused")]),
        registry=_registry(_rag_hits),
        knowledge_graph=graph,
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        assert response.status_code == 200

    assert graph.config is not None
    assert graph.config["recursion_limit"] == kernel.MAX_MODEL_ROUNDS * 3 + 5
    assert graph.config["configurable"]["thread_id"]


async def test_last_event_id_replays_only_newer_persisted_events(session_factory):
    adapter = ScriptedAdapter([_assistant(tool_calls=[_rag_call()]), _assistant(content="完成")])
    app = _build_app(session_factory, adapter=adapter, registry=_registry(_rag_hits))

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        run_id = events[0]["id"].split(":")[0]

        replay = await client.post(
            "/v1/knowledge/runs/stream",
            json=RUN_BODY,
            headers={**AUTH, "Last-Event-ID": f"{run_id}:2"},
        )
        assert replay.status_code == 200
        replayed = _parse_sse(replay.text)
        assert [event["type"] for event in replayed] == [
            "tool.completed",
            "message.delta",
            "run.completed",
        ]
        assert [event["id"] for event in replayed] == [
            f"{run_id}:3",
            f"{run_id}:4",
            f"{run_id}:5",
        ]


async def test_message_delta_stays_string_when_answer_exceeds_limit(session_factory):
    answer = "答" * 30000
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(content=answer)]),
        registry=_registry(_rag_hits),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        delta = next(event for event in events if event["type"] == "message.delta")["data"][
            "delta"
        ]
        assert isinstance(delta, str)
        assert delta.endswith("...[truncated]")
        assert len(delta) <= 20000 + len("...[truncated]")

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()
        assert isinstance(body["result"]["answer"], str)
        assert body["result"]["answer"].endswith("...[truncated]")
