import uuid
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.run import AgentRun, ToolCall
from app.schemas import Principal

# Only allowlisted argument keys are persisted. Anything else (bearer tokens,
# phone numbers, payment flows, model keys) is rebuilt away before storage.
_ARGUMENT_ALLOWLIST: dict[str, frozenset[str]] = {
    "rag_search": frozenset({"query", "kb_id", "top_k", "audience"}),
}
_DEFAULT_ARGUMENT_ALLOWLIST: frozenset[str] = frozenset(
    {"query", "store_id", "start_time", "end_time", "date", "limit"}
)


def sanitize_arguments(tool_name: str, arguments: Mapping[str, Any] | None) -> dict[str, Any]:
    if not arguments:
        return {}
    allowed = _ARGUMENT_ALLOWLIST.get(tool_name, _DEFAULT_ARGUMENT_ALLOWLIST)
    return {key: value for key, value in arguments.items() if key in allowed}


class RunRepository:
    """Persistence for agent runs; every read is scoped to the caller."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(self, *, scene: str, principal: Principal) -> AgentRun:
        run = AgentRun(
            tenant_id=principal.tenant_id,
            employee_id=principal.employee_id,
            store_id=principal.store_id,
            scene=scene,
            status="running",
        )
        self._session.add(run)
        self._session.flush()
        return run

    def get(self, run_id: uuid.UUID, principal: Principal) -> AgentRun | None:
        stmt = (
            select(AgentRun)
            .options(selectinload(AgentRun.tool_calls))
            .where(
                AgentRun.id == run_id,
                AgentRun.employee_id == principal.employee_id,
                AgentRun.tenant_id == principal.tenant_id,
            )
        )
        return self._session.execute(stmt).scalar_one_or_none()

    def list(self, principal: Principal, *, limit: int = 50, offset: int = 0) -> list[AgentRun]:
        stmt = (
            select(AgentRun)
            .where(
                AgentRun.employee_id == principal.employee_id,
                AgentRun.tenant_id == principal.tenant_id,
            )
            .order_by(AgentRun.created_at.desc(), AgentRun.id.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(self._session.execute(stmt).scalars().all())


class ToolCallRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def start(
        self,
        run_id: uuid.UUID,
        tool_name: str,
        arguments: Mapping[str, Any] | None = None,
    ) -> ToolCall:
        call = ToolCall(
            run_id=run_id,
            tool_name=tool_name,
            arguments_json=sanitize_arguments(tool_name, arguments),
            status="running",
        )
        self._session.add(call)
        self._session.flush()
        return call

    def finish(
        self,
        tool_call_id: uuid.UUID,
        *,
        status: str = "succeeded",
        result: dict[str, Any] | None = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
    ) -> ToolCall:
        call = self._session.get(ToolCall, tool_call_id)
        if call is None:
            raise LookupError(f"tool call {tool_call_id} not found")
        call.status = status
        call.result_json = result
        call.latency_ms = latency_ms
        call.error_code = error_code
        call.completed_at = datetime.now(UTC)
        self._session.flush()
        return call
