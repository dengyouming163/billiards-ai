"""Reconciliation degradation tests.

RAG or model failures may only degrade the narrative. Deterministic report
fields must stay byte-identical to the golden report, and every reported number
must keep a resolvable evidence reference.
"""

import json
from pathlib import Path
from typing import Any

import httpx
import pytest
from langgraph.checkpoint.memory import InMemorySaver
from sqlalchemy.orm import sessionmaker

from app.graphs.reconciliation import DEGRADED_NARRATIVE
from app.guard.identity import IdentityError
from app.main import create_app
from app.models.llm import (
    MODEL_UNAVAILABLE,
    AssistantMessage,
    ModelInvocationError,
    Usage,
)
from app.schemas import Principal

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "evidence"
GOLDEN_PATH = Path(__file__).resolve().parents[2] / "eval" / "datasets" / "reconciliation_golden.json"

AUTH = {"Authorization": "Bearer token-finance"}
START_BODY = {"store_id": "store-1", "shift_id": "shift-cash-flow-gift-missing"}

NARRATIVE = json.dumps(
    {
        "summary": "现金流差异需要复核。",
        "recommended_checks": ["核对赠送金额"],
        "citation_chunk_ids": [],
    },
    ensure_ascii=False,
)


def _principal() -> Principal:
    return Principal(
        tenant_id="tenant-1",
        employee_id="emp-1001",
        store_id="store-1",
        role="staff",
        permissions=frozenset({"finance:cashflow"}),
    )


def _assistant(content: str = "") -> AssistantMessage:
    return AssistantMessage(
        content=content, tool_calls=[], usage=Usage(), model="fake-model", latency_ms=1
    )


class FakeIdentity:
    async def resolve(self, access_token: str | None, store_id: str | None) -> Principal:
        if access_token != "token-finance":
            raise IdentityError(
                "identity is not authenticated", code="UNAUTHENTICATED", status_code=401
            )
        principal = _principal()
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
    def __init__(self, fail_after: int = 0) -> None:
        self._fail_after = fail_after
        self.calls = 0

    async def complete(self, messages: Any, tools: Any = None) -> AssistantMessage:
        self.calls += 1
        if self.calls > self._fail_after:
            raise ModelInvocationError("model is down", code=MODEL_UNAVAILABLE)
        return _assistant(NARRATIVE)


class EvidenceLoader:
    def __init__(self, payload: dict[str, Any]) -> None:
        self.payload = payload
        self.calls = 0

    async def __call__(self, shift_id: str, principal: Principal) -> dict[str, Any]:
        self.calls += 1
        return json.loads(json.dumps(self.payload))


class SopSearch:
    def __init__(self, hits: list[dict[str, Any]]) -> None:
        self.hits = hits

    async def __call__(self, query: str, principal: Principal) -> list[dict[str, Any]]:
        return [dict(hit) for hit in self.hits]


def _evidence(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES_DIR / name).read_text(encoding="utf-8"))


def _golden_expected(case_id: str) -> dict[str, Any]:
    payload = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    for case in payload["cases"]:
        if case["id"] == case_id:
            return case["expected"]
    raise AssertionError(f"unknown golden case: {case_id}")


def _deterministic(report: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in report.items() if key not in ("narrative", "degraded")}


@pytest.fixture()
def session_factory(session):
    return sessionmaker(
        bind=session.connection(),
        autoflush=False,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )


def _build_app(session_factory: Any, *, adapter: Any, loader: Any) -> Any:
    return create_app(
        identity_client=FakeIdentity(),
        model_adapter=adapter,
        session_factory=session_factory,
        checkpointer=InMemorySaver(),
        langgraph_database_url="",
        reconciliation_evidence_loader=loader,
        reconciliation_sop_search=SopSearch([]),
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


async def test_model_failure_keeps_deterministic_report(session_factory):
    loader = EvidenceLoader(_evidence("cash-flow-without-gift.json"))
    app = _build_app(session_factory, adapter=FailingAdapter(), loader=loader)

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/reconciliation/runs/stream", json=START_BODY, headers=AUTH
        )
        events = _parse_sse(response.text)
        assert events[-1]["type"] == "run.completed"
        assert events[-1]["data"]["degraded"] is True
        assert events[-2]["data"]["delta"] == DEGRADED_NARRATIVE

        run_id = events[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    assert body["status"] == "succeeded"
    report = body["result"]["report"]
    assert report["narrative"] == DEGRADED_NARRATIVE
    assert report["degraded"] is True
    assert body["result"]["degraded_reason"] == MODEL_UNAVAILABLE
    assert _deterministic(report) == _deterministic(_golden_expected("cash-flow-without-gift"))


async def test_invalid_model_output_degrades_without_changing_numbers(session_factory):
    loader = EvidenceLoader(_evidence("cash-flow-without-gift.json"))
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant("不是 JSON")]),
        loader=loader,
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/reconciliation/runs/stream", json=START_BODY, headers=AUTH
        )
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    report = body["result"]["report"]
    assert body["status"] == "succeeded"
    assert body["result"]["degraded_reason"] == "MODEL_OUTPUT_INVALID"
    assert report["narrative"] == DEGRADED_NARRATIVE
    assert _deterministic(report) == _deterministic(_golden_expected("cash-flow-without-gift"))


async def test_followup_model_failure_degrades_without_touching_report(session_factory):
    loader = EvidenceLoader(_evidence("normal-single-channel.json"))
    adapter = FailingAdapter(fail_after=1)
    app = _build_app(session_factory, adapter=adapter, loader=loader)

    async with app.router.lifespan_context(app), _client(app) as client:
        initial = await client.post(
            "/v1/reconciliation/runs/stream",
            json={"store_id": "store-1", "shift_id": "shift-single"},
            headers=AUTH,
        )
        run_id = _parse_sse(initial.text)[0]["id"].split(":")[0]

        followup = await client.post(
            f"/v1/reconciliation/runs/{run_id}/messages/stream",
            json={"question": "差异在哪里？"},
            headers=AUTH,
        )
        events = _parse_sse(followup.text)
        assert [event["type"] for event in events] == ["message.delta", "run.completed"]
        assert events[0]["data"]["delta"] == DEGRADED_NARRATIVE

        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    assert body["status"] == "succeeded"
    assert body["result"]["report"]["status"] == "ok"
    assert body["result"]["report"]["recomputed"]["order_total"]["value"] == "80.00"
    assert loader.calls == 1


def _assert_references(node: Any, known: set[str]) -> None:
    if isinstance(node, dict):
        if "refs" in node:
            refs = node["refs"]
            assert refs, f"missing refs on {node}"
            assert set(refs) <= known, f"unresolvable refs on {node}"
        for value in node.values():
            _assert_references(value, known)
    elif isinstance(node, list):
        for item in node:
            _assert_references(item, known)


async def test_every_reported_number_has_resolvable_evidence_refs(session_factory):
    loader = EvidenceLoader(_evidence("cash-flow-without-gift.json"))
    app = _build_app(
        session_factory,
        adapter=ScriptedAdapter([_assistant(NARRATIVE)]),
        loader=loader,
    )

    async with app.router.lifespan_context(app), _client(app) as client:
        response = await client.post(
            "/v1/reconciliation/runs/stream", json=START_BODY, headers=AUTH
        )
        run_id = _parse_sse(response.text)[0]["id"].split(":")[0]
        body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()

    report = body["result"]["report"]
    known = {ref["ref_id"] for ref in report["evidence_refs"]}
    assert known
    for name, value in report["recomputed"].items():
        assert value["refs"], name
    _assert_references(report["recomputed"], known)
    _assert_references(report["differences"], known)
    _assert_references(report["explained"], known)
    _assert_references(report["unknowns"], known)
