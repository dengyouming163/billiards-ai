"""Open-ended SQL analysis API tests.

The model, guard, executor and identity are all under test control. The fixed
reconciliation path is also exercised to prove it never calls the SQL executor.
"""

import json
from pathlib import Path
from typing import Any

import httpx
import pytest
from langgraph.checkpoint.memory import InMemorySaver
from sqlalchemy.orm import sessionmaker

from app.guard.identity import IdentityError
from app.guard.sql_guard import SqlTimeout
from app.main import create_app
from app.models.llm import AssistantMessage, Usage
from app.schemas import Principal
from app.tools.sql_executor import QueryResult

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "evidence"
AUTH = {"Authorization": "Bearer token-finance"}
START_BODY = {"store_id": "store-1", "question": "本月各门店营业额是多少？"}
VALID_SQL = (
    "SELECT store_id, SUM(final_amount) AS total FROM agent_order_analysis "
    "GROUP BY store_id"
)
EXPLANATION = "本月系统内订单合计为 80.00 元。"


class FakeIdentity:
    async def resolve(self, access_token: str | None, store_id: str | None) -> Principal:
        if access_token == "token-noperm":
            principal = _principal(permissions=frozenset())
        elif access_token == "token-finance":
            principal = _principal()
        else:
            raise IdentityError(
                "identity is not authenticated", code="UNAUTHENTICATED", status_code=401
            )
        if store_id != principal.store_id:
            raise IdentityError(
                "identity store does not match the requested store",
                code="IDENTITY_MISMATCH",
                status_code=403,
            )
        return principal


def _principal(permissions: frozenset[str] = frozenset({"finance:cashflow"})) -> Principal:
    return Principal(
        tenant_id="tenant-1",
        employee_id="emp-1001",
        store_id="store-1",
        role="staff",
        permissions=permissions,
    )


def _assistant(content: str = "") -> AssistantMessage:
    return AssistantMessage(
        content=content, tool_calls=[], usage=Usage(), model="fake-model", latency_ms=1
    )


class ScriptedAdapter:
    def __init__(self, responses: list[AssistantMessage]) -> None:
        self._responses = responses
        self.calls: list[list[Any]] = []

    async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
        self.calls.append(list(messages))
        index = min(len(self.calls) - 1, len(self._responses) - 1)
        return self._responses[index]


class FakeExecutor:
    def __init__(self, error: Exception | None = None) -> None:
        self.error = error
        self.calls: list[tuple[str, str]] = []

    async def __call__(self, guarded_sql: str, store_id: str) -> QueryResult:
        self.calls.append((guarded_sql, store_id))
        if self.error is not None:
            raise self.error
        return QueryResult(
            sql=guarded_sql,
            columns=["store_id", "total"],
            rows=[{"store_id": store_id, "total": "80.00"}],
            row_count=1,
            latency_ms=5,
        )


class ReconciliationLoader:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload
        self.calls = 0

    async def __call__(self, shift_id: str, principal: Principal) -> dict[str, Any]:
        self.calls += 1
        return json.loads(json.dumps(self.payload))


class SopSearch:
    async def __call__(self, query: str, principal: Principal) -> list[dict[str, Any]]:
        return []


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
    executor: FakeExecutor,
    reconciliation_loader: ReconciliationLoader | None = None,
) -> Any:
    return create_app(
        identity_client=FakeIdentity(),
        model_adapter=adapter,
        session_factory=session_factory,
        checkpointer=InMemorySaver(),
        langgraph_database_url="",
        analysis_executor=executor,
        reconciliation_evidence_loader=reconciliation_loader,
        reconciliation_sop_search=SopSearch(),
    )


def _client(app: Any):
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


def _parse_sse(body: str) -> list[dict[str, Any]]:
    events: list[dict[str, Any]] = []
    for block in body.strip().split("\n\n"):
        if not block.strip() or block.strip().startswith(":"):
            continue
        fields: dict[str, str] = {}
        for line in block.splitlines():
            key, _, value = line.partition(": ")
            fields[key] = value
        events.append(
            {"id": fields["id"], "type": fields["event"], "data": json.loads(fields["data"])}
        )
    return events


def _draft(sql: str, **extra: Any) -> str:
    return json.dumps({"sql": sql, **extra}, ensure_ascii=False)


def _evidence(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


async def test_valid_analysis_returns_guarded_sql_rows_and_trace(session_factory):
    executor = FakeExecutor()
    adapter = ScriptedAdapter([_assistant(_draft(VALID_SQL)), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert [event["type"] for event in events] == [
            "run.started",
            "sql.drafted",
            "tool.started",
            "tool.completed",
            "message.delta",
            "run.completed",
        ]
        assert events[-2]["data"]["delta"] == EXPLANATION
        assert events[-1]["data"]["row_count"] == 1

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    result = body["result"]
    assert body["status"] == "succeeded"
    assert "store_id = :__agent_store_id" in result["guarded_sql"]
    assert "LIMIT 200" in result["guarded_sql"]
    assert result["columns"] == ["store_id", "total"]
    assert result["rows"] == [{"store_id": "store-1", "total": "80.00"}]
    assert result["row_count"] == 1
    assert result["explanation"] == EXPLANATION
    assert result["tool_call_id"]
    assert executor.calls[0][1] == "store-1"
    assert [call["name"] for call in body["tool_calls"]] == ["sql_execute"]


@pytest.mark.parametrize(
    "sql",
    [
        "DELETE FROM agent_order_analysis",
        "SELECT * FROM bi_busi_order",
        "SELECT * FROM agent_order_analysis",
        "SELECT store_id FROM agent_order_analysis UNION SELECT store_id FROM bi_busi_order",
    ],
)
async def test_rejected_sql_fails_without_calling_the_executor(session_factory, sql):
    executor = FakeExecutor()
    adapter = ScriptedAdapter([_assistant(_draft(sql)), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert events[-1]["type"] == "run.failed"
        assert events[-1]["data"]["error"]["code"] == "SQL_REJECTED"
        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    assert executor.calls == []
    assert body["status"] == "failed"
    assert body["result"]["error"]["code"] == "SQL_REJECTED"
    assert "rows" not in body["result"]


async def test_model_cannot_override_store_scope(session_factory):
    executor = FakeExecutor()
    draft = (
        "SELECT store_id FROM agent_order_analysis "
        "WHERE store_id = 'store-b' OR 1 = 1"
    )
    adapter = ScriptedAdapter([_assistant(_draft(draft)), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    guarded_sql, store_id = executor.calls[0]
    assert store_id == "store-1"
    assert "(store_id = 'store-b' OR 1 = 1) AND store_id = :__agent_store_id" in guarded_sql
    assert body["result"]["rows"] == [{"store_id": "store-1", "total": "80.00"}]


async def test_model_cannot_override_limits_account_or_tenant(session_factory):
    executor = FakeExecutor()
    draft = _draft(
        "SELECT store_id FROM agent_order_analysis",
        max_rows=9999,
        timeout_ms=1,
        store_id="store-b",
        account="root",
        tenant_id="tenant-2",
    )
    adapter = ScriptedAdapter([_assistant(draft), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    guarded_sql, store_id = executor.calls[0]
    assert store_id == "store-1"
    assert "LIMIT 200" in guarded_sql
    assert "store_id = :__agent_store_id" in guarded_sql
    result = body["result"]
    assert set(result) == {
        "scene",
        "question",
        "guarded_sql",
        "columns",
        "rows",
        "row_count",
        "tool_call_id",
        "explanation",
        "degraded",
        "degraded_reason",
    }


async def test_sql_timeout_fails_the_run_without_retrying(session_factory):
    executor = FakeExecutor(error=SqlTimeout())
    adapter = ScriptedAdapter(
        [_assistant(_draft(VALID_SQL)), _assistant(EXPLANATION)]
    )
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert events[-1]["type"] == "run.failed"
        assert events[-1]["data"]["error"]["code"] == "SQL_TIMEOUT"
        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    assert len(executor.calls) == 1
    assert body["status"] == "failed"
    assert body["result"]["error"]["code"] == "SQL_TIMEOUT"


async def test_invalid_model_draft_never_reaches_sql(session_factory):
    executor = FakeExecutor()
    adapter = ScriptedAdapter([_assistant("不是 JSON"), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        events = _parse_sse(response.text)
        assert events[-1]["data"]["error"]["code"] == "SQL_GENERATION_FAILED"

    assert executor.calls == []


async def test_trace_redacts_sql_string_literals(session_factory):
    executor = FakeExecutor()
    draft = (
        "SELECT order_id FROM agent_order_analysis "
        "WHERE order_no = '13800000000'"
    )
    adapter = ScriptedAdapter([_assistant(_draft(draft)), _assistant(EXPLANATION)])
    app = _build_app(session_factory, adapter=adapter, executor=executor)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post("/v1/analysis/runs/stream", json=START_BODY, headers=AUTH)
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    arguments = body["tool_calls"][0]["arguments"]
    assert "13800000000" not in json.dumps(arguments, ensure_ascii=False)
    assert "'?'" in json.dumps(arguments, ensure_ascii=False)


async def test_identity_fields_in_body_are_rejected(session_factory):
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(_draft(VALID_SQL)), _assistant(EXPLANATION)]),
        executor=FakeExecutor(),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        for injected in ("tenant_id", "employee_id", "role", "permissions", "max_rows"):
            response = await client.post(
                "/v1/analysis/runs/stream",
                json={**START_BODY, injected: "spoofed"},
                headers=AUTH,
            )
            assert response.status_code == 422, injected


async def test_missing_permission_is_rejected(session_factory):
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(_draft(VALID_SQL)), _assistant(EXPLANATION)]),
        executor=FakeExecutor(),
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/analysis/runs/stream",
            json=START_BODY,
            headers={"Authorization": "Bearer token-noperm"},
        )
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "PERMISSION_DENIED"


async def test_fixed_reconciliation_never_calls_sql_executor(session_factory):
    class ExplodingExecutor(FakeExecutor):
        async def __call__(self, guarded_sql: str, store_id: str) -> QueryResult:
            raise AssertionError("fixed reconciliation must not execute SQL")

    executor = ExplodingExecutor()
    loader = ReconciliationLoader(_evidence("empty-shift.json"))
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter(
            [
                _assistant(
                    json.dumps(
                        {
                            "summary": "数据不足。",
                            "recommended_checks": [],
                            "citation_chunk_ids": [],
                        },
                        ensure_ascii=False,
                    )
                )
            ]
        ),
        executor=executor,
        reconciliation_loader=loader,
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/reconciliation/runs/stream",
            json={"store_id": "store-1", "shift_id": "shift-empty"},
            headers=AUTH,
        )
        events = _parse_sse(response.text)
        assert events[-1]["type"] == "run.completed"

    assert executor.calls == []
    assert loader.calls == 1
