from conftest import principal

from app.models.run import AuditLog
from app.services.run_repository import RunRepository, ToolCallRepository


def test_run_and_tool_call_are_persisted(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    ToolCallRepository(session).start(run.id, "rag_search", {"query": "交班"})
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
    )

    assert call.arguments_json == {"query": "交班", "kb_id": "billiards-sop-test"}


def test_finish_persists_status_latency_and_error(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    repo = ToolCallRepository(session)
    call = repo.start(run.id, "rag_search", {"query": "交班"})

    finished = repo.finish(call.id, status="failed", latency_ms=123, error_code="TOOL_TIMEOUT")

    assert finished.status == "failed"
    assert finished.latency_ms == 123
    assert finished.error_code == "TOOL_TIMEOUT"
    assert finished.completed_at is not None


def test_audit_log_persists_metadata(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())

    entry = AuditLog(
        run_id=run.id,
        employee_id="emp-1001",
        store_id="store-1",
        action="run.read",
        target_type="agent_run",
        target_id=str(run.id),
        metadata_json={"scene": "knowledge_qa"},
    )
    session.add(entry)
    session.flush()
    session.refresh(entry)

    assert entry.id is not None
    assert entry.metadata_json == {"scene": "knowledge_qa"}
