import uuid
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.run import AgentRun, AuditLog, ToolCall
from app.schemas import Principal
from app.services.redaction import redact_payload, sanitize_arguments

RUN_TERMINAL_STATUSES: frozenset[str] = frozenset({"succeeded", "failed", "cancelled"})


class AuditLogRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def record(
        self,
        principal: Principal,
        action: str,
        target_type: str,
        target_id: str | None = None,
        metadata: Mapping[str, Any] | None = None,
        *,
        run_id: uuid.UUID | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            run_id=run_id,
            tenant_id=principal.tenant_id,
            employee_id=principal.employee_id,
            store_id=principal.store_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=redact_payload(dict(metadata or {})),
        )
        self._session.add(entry)
        self._session.flush()
        return entry


class RunRepository:
    """Persistence for agent runs; every read is scoped to the caller."""

    def __init__(self, session: Session) -> None:
        self._session = session

    def create(
        self,
        *,
        scene: str,
        principal: Principal,
        input_payload: Mapping[str, Any] | None = None,
    ) -> AgentRun:
        run = AgentRun(
            tenant_id=principal.tenant_id,
            employee_id=principal.employee_id,
            store_id=principal.store_id,
            scene=scene,
            status="running",
            input_json=redact_payload(dict(input_payload)) if input_payload else None,
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

    def finish(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        *,
        status: str,
        result: Mapping[str, Any] | None = None,
    ) -> AgentRun:
        if status not in RUN_TERMINAL_STATUSES:
            raise ValueError(f"invalid terminal run status: {status!r}")
        stmt = select(AgentRun).where(
            AgentRun.id == run_id,
            AgentRun.employee_id == principal.employee_id,
            AgentRun.tenant_id == principal.tenant_id,
        )
        run = self._session.execute(stmt).scalar_one_or_none()
        if run is None:
            raise LookupError(f"agent run {run_id} not found for principal")
        if run.status in RUN_TERMINAL_STATUSES or run.completed_at is not None:
            raise ValueError(f"agent run {run_id} is already finished")

        run.status = status
        run.result_json = redact_payload(result)
        run.completed_at = datetime.now(UTC)
        AuditLogRepository(self._session).record(
            principal,
            "run.finish",
            "agent_run",
            str(run.id),
            {"status": status},
            run_id=run.id,
        )
        self._session.flush()
        return run


class ToolCallRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    def start(
        self,
        run_id: uuid.UUID,
        tool_name: str,
        arguments: Mapping[str, Any] | None = None,
        *,
        principal: Principal,
    ) -> ToolCall:
        owned_run_id = self._session.execute(
            select(AgentRun.id).where(
                AgentRun.id == run_id,
                AgentRun.employee_id == principal.employee_id,
                AgentRun.tenant_id == principal.tenant_id,
            )
        ).scalar_one_or_none()
        if owned_run_id is None:
            raise LookupError(f"agent run {run_id} not found for principal")

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
        principal: Principal,
        *,
        status: str = "succeeded",
        result: Mapping[str, Any] | None = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
    ) -> ToolCall:
        stmt = (
            select(ToolCall)
            .join(AgentRun, ToolCall.run_id == AgentRun.id)
            .where(
                ToolCall.id == tool_call_id,
                AgentRun.employee_id == principal.employee_id,
                AgentRun.tenant_id == principal.tenant_id,
            )
        )
        call = self._session.execute(stmt).scalar_one_or_none()
        if call is None:
            raise LookupError(f"tool call {tool_call_id} not found for principal")

        call.status = status
        call.result_json = redact_payload(result)
        call.latency_ms = latency_ms
        call.error_code = error_code
        call.completed_at = datetime.now(UTC)
        self._session.flush()
        return call
