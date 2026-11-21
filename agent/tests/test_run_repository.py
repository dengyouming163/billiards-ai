import json

import pytest
from conftest import principal
from sqlalchemy import select

from app.models.run import AuditLog
from app.services.redaction import MAX_PAYLOAD_BYTES, MAX_STRING_LENGTH, TRUNCATION_MARKER
from app.services.run_repository import AuditLogRepository, RunRepository, ToolCallRepository


def test_run_and_tool_call_are_persisted(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    ToolCallRepository(session).start(
        run.id, "rag_search", {"query": "交班"}, principal=principal()
    )
    saved = RunRepository(session).get(run.id, principal())
    assert saved.scene == "knowledge_qa"
    assert len(saved.tool_calls) == 1


def test_get_returns_none_for_another_employee(session):
    repo = RunRepository(session)
    run = repo.create(scene="knowledge_qa", principal=principal())

    assert repo.get(run.id, principal(employee_id="emp-other")) is None


def test_list_only_returns_own_runs(session):
    repo = RunRepository(session)
    repo.create(scene="shift_reconcile", principal=principal())
    repo.create(scene="knowledge_qa", principal=principal(employee_id="emp-other"))

    runs = repo.list(principal())

    assert [run.scene for run in runs] == ["shift_reconcile"]


def test_tool_call_arguments_are_rebuilt_from_allowlist(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())

    call = ToolCallRepository(session).start(
        run.id,
        "rag_search",
        {
            "query": "交班",
            "kb_id": "billiards-sop-test",
            "authorization": "Bearer secret-token",
            "phone": "13800138000",
            "payment_flow": {"trade_no": "4200001234"},
            "model_api_key": "sk-test-secret",
        },
        principal=principal(),
    )

    assert call.arguments_json == {"query": "交班", "kb_id": "billiards-sop-test"}


def test_unknown_tool_arguments_are_dropped(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())

    call = ToolCallRepository(session).start(
        run.id, "unknown_tool", {"query": "交班"}, principal=principal()
    )

    assert call.arguments_json == {}


def test_tool_call_arguments_reject_nested_values(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())

    call = ToolCallRepository(session).start(
        run.id,
        "rag_search",
        {"query": {"$ne": "交班"}, "top_k": ["5"], "kb_id": "billiards-sop-test"},
        principal=principal(),
    )

    assert call.arguments_json == {"kb_id": "billiards-sop-test"}


def test_tool_call_arguments_redact_secrets_and_truncate(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    raw_query = "Bearer abc.def-123 13800138000 sk-live-abcdefghij " + "x" * 2000

    call = ToolCallRepository(session).start(
        run.id, "rag_search", {"query": raw_query, "top_k": 5}, principal=principal()
    )

    stored = call.arguments_json["query"]
    assert call.arguments_json["top_k"] == 5
    assert "abc.def-123" not in stored
    assert "13800138000" not in stored
    assert "sk-live-abcdefghij" not in stored
    assert stored.endswith(TRUNCATION_MARKER)
    assert len(stored) <= MAX_STRING_LENGTH + len(TRUNCATION_MARKER)


def test_tool_call_start_rejects_foreign_run(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)

    with pytest.raises(LookupError):
        repo.start(
            run.id,
            "rag_search",
            {"query": "交班"},
            principal=principal(employee_id="emp-other"),
        )
    with pytest.raises(LookupError):
        repo.start(
            run.id,
            "rag_search",
            {"query": "交班"},
            principal=principal(tenant_id="tenant-2"),
        )


def test_finish_persists_status_latency_and_error(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)
    call = repo.start(run.id, "rag_search", {"query": "交班"}, principal=principal())

    finished = repo.finish(
        call.id, principal(), status="failed", latency_ms=123, error_code="TOOL_TIMEOUT"
    )

    assert finished.status == "failed"
    assert finished.latency_ms == 123
    assert finished.error_code == "TOOL_TIMEOUT"
    assert finished.completed_at is not None


def test_tool_call_finish_rejects_foreign_principal(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)
    call = repo.start(run.id, "rag_search", {"query": "交班"}, principal=principal())

    with pytest.raises(LookupError):
        repo.finish(call.id, principal(employee_id="emp-other"))
    with pytest.raises(LookupError):
        repo.finish(call.id, principal(tenant_id="tenant-2"))

    session.refresh(call)
    assert call.status == "running"
    assert call.completed_at is None


def test_tool_call_finish_redacts_result(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)
    call = repo.start(run.id, "rag_search", {"query": "交班"}, principal=principal())

    finished = repo.finish(
        call.id,
        principal(),
        result={
            "authorization": "Bearer secret-token",
            "phone": "13800138000",
            "note": "sk-live-abcdefghij",
            "ok": 1,
        },
    )

    assert finished.result_json == {"note": "[redacted]", "ok": 1}


def test_tool_call_finish_caps_oversized_result(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)
    call = repo.start(run.id, "rag_search", {"query": "交班"}, principal=principal())

    finished = repo.finish(
        call.id,
        principal(),
        result={
            "authorization": "Bearer secret-token",
            "phone": "13800138000",
            "rows": [{"note": "x" * 400} for _ in range(300)],
        },
    )

    stored = finished.result_json
    assert stored["truncated"] is True
    assert stored["original_bytes"] > MAX_PAYLOAD_BYTES
    assert "secret-token" not in stored["summary"]
    assert "13800138000" not in stored["summary"]


def test_create_redacts_input_payload(session):
    run = RunRepository(session).create(
        scene="knowledge_qa",
        principal=principal(),
        input_payload={
            "question": "交班差异",
            "phone": "13800138000",
            "authorization": "Bearer secret-token",
        },
    )

    assert run.input_json == {"question": "交班差异"}


def test_finish_run_rejects_foreign_principal(session):
    repo = RunRepository(session)
    run = repo.create(scene="knowledge_qa", principal=principal())

    with pytest.raises(LookupError):
        repo.finish(run.id, principal(employee_id="emp-other"), status="succeeded")
    with pytest.raises(LookupError):
        repo.finish(run.id, principal(tenant_id="tenant-2"), status="succeeded")

    session.refresh(run)
    assert run.status == "running"
    assert run.completed_at is None


def test_finish_run_rejects_invalid_and_repeated_status(session):
    repo = RunRepository(session)
    run = repo.create(scene="knowledge_qa", principal=principal())

    with pytest.raises(ValueError):
        repo.finish(run.id, principal(), status="running")

    finished = repo.finish(
        run.id,
        principal(),
        status="succeeded",
        result={"answer": "ok", "phone": "13800138000"},
    )
    assert finished.status == "succeeded"
    assert finished.completed_at is not None
    assert finished.result_json == {"answer": "ok"}

    with pytest.raises(ValueError):
        repo.finish(run.id, principal(), status="failed")


def test_finish_run_records_audit_log(session):
    repo = RunRepository(session)
    run = repo.create(scene="knowledge_qa", principal=principal())

    repo.finish(run.id, principal(), status="succeeded", result={"answer": "ok"})

    entry = session.execute(select(AuditLog).where(AuditLog.run_id == run.id)).scalar_one()
    assert entry.tenant_id == "tenant-1"
    assert entry.employee_id == "emp-1001"
    assert entry.store_id == "store-1"
    assert entry.action == "run.finish"
    assert entry.target_type == "agent_run"
    assert entry.target_id == str(run.id)


def test_audit_log_repository_redacts_metadata(session):
    entry = AuditLogRepository(session).record(
        principal(),
        "run.read",
        "agent_run",
        "run-1",
        {"scene": "knowledge_qa", "phone": "13800138000", "authorization": "Bearer secret"},
    )

    assert entry.tenant_id == "tenant-1"
    assert entry.metadata_json == {"scene": "knowledge_qa"}


def test_audit_metadata_is_json_serialisable(session):
    entry = AuditLogRepository(session).record(
        principal(), "run.read", "agent_run", None, {"scene": "knowledge_qa"}
    )

    json.dumps(entry.metadata_json)
    assert entry.id is not None
