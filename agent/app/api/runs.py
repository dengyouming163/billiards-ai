"""Knowledge run streaming and trace lookup.

Identity comes only from the ``Authorization: Bearer`` header: the request
body carries ``store_id``/``question``/``scene`` and any identity field is
rejected with 422 by ``KnowledgeRunRequest``. Every read is scoped to the
verified ``(tenant_id, employee_id)`` pair; a foreign run looks like a
missing one (404).
"""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.guard.identity import IdentityError, Principal, access_token_scope
from app.schemas import KnowledgeRunRequest
from app.services.run_repository import RunRepository

router = APIRouter()

CHECKPOINT_UNAVAILABLE = "CHECKPOINT_UNAVAILABLE"
RUN_NOT_FOUND = "RUN_NOT_FOUND"
UNAUTHENTICATED = "UNAUTHENTICATED"

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
    "Connection": "keep-alive",
}


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail={"code": UNAUTHENTICATED, "message": "missing bearer token"},
        )
    scheme, _, token = authorization.partition(" ")
    token = token.strip()
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=401,
            detail={"code": UNAUTHENTICATED, "message": "invalid authorization header"},
        )
    return token


async def _resolve_principal(request: Request, token: str, store_id: str) -> Principal:
    try:
        return await request.app.state.identity_client.resolve(token, store_id)
    except IdentityError as exc:
        # Do not chain: identity errors never need to echo the bearer token.
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": str(exc)},
        ) from None


async def _resolve_run_principal(request: Request, token: str, store_id: str) -> Principal:
    """Resolve identity for a run read, hiding context mismatches as 404."""
    try:
        return await _resolve_principal(request, token, store_id)
    except HTTPException:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        ) from None


def _parse_last_event_id(value: str | None) -> tuple[uuid.UUID, int] | None:
    """Parse the ``{run_id}:{seq}`` ids emitted by this service."""
    if not value:
        return None
    run_part, separator, seq_part = value.rpartition(":")
    if not separator:
        return None
    try:
        run_id = uuid.UUID(run_part)
        sequence = int(seq_part)
    except (TypeError, ValueError):
        return None
    if sequence < 0:
        return None
    return run_id, sequence


def _load_store_id(state: Any, run_id: uuid.UUID) -> str | None:
    with state.session_factory() as session:
        return RunRepository(session).get_store_id(run_id)


def _run_is_owned(state: Any, run_id: uuid.UUID, principal: Principal) -> bool:
    with state.session_factory() as session:
        return RunRepository(session).get(run_id, principal) is not None


def _isoformat(value: Any) -> str | None:
    return value.isoformat() if value is not None else None


def _serialise_run(run: Any) -> dict[str, Any]:
    result = run.result_json or {}
    return {
        "id": str(run.id),
        "scene": run.scene,
        "status": run.status,
        "store_id": run.store_id,
        "created_at": _isoformat(run.created_at),
        "completed_at": _isoformat(run.completed_at),
        "input": run.input_json,
        "result": run.result_json,
        "citations": result.get("citations", []) if isinstance(result, dict) else [],
        "events": [
            {
                "seq": event.seq,
                "type": event.event_type,
                "data": event.payload_json,
                "created_at": _isoformat(event.created_at),
            }
            for event in sorted(run.events, key=lambda item: item.seq)
        ],
        "tool_calls": [
            {
                "id": str(call.id),
                "name": call.tool_name,
                "arguments": call.arguments_json,
                "status": call.status,
                "result": call.result_json,
                "error_code": call.error_code,
                "latency_ms": call.latency_ms,
            }
            for call in sorted(run.tool_calls, key=lambda item: item.created_at)
        ],
    }


@router.post("/v1/knowledge/runs/stream")
async def stream_knowledge_run(
    payload: KnowledgeRunRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
    last_event_id: Annotated[str | None, Header(alias="Last-Event-ID")] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state
    if state.checkpointer is None or state.knowledge_graph is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": CHECKPOINT_UNAVAILABLE,
                "message": "checkpoint storage is not configured",
            },
        )

    resume = _parse_last_event_id(last_event_id)
    if resume is not None:
        resume_run_id, after_seq = resume
        store_id = await run_in_threadpool(_load_store_id, state, resume_run_id)
        if store_id is None:
            raise HTTPException(
                status_code=404,
                detail={"code": RUN_NOT_FOUND, "message": "run not found"},
            )
        principal = await _resolve_run_principal(request, token, store_id)
        owned = await run_in_threadpool(_run_is_owned, state, resume_run_id, principal)
        if not owned:
            raise HTTPException(
                status_code=404,
                detail={"code": RUN_NOT_FOUND, "message": "run not found"},
            )
        return StreamingResponse(
            state.runner.replay(resume_run_id, principal, after_seq),
            media_type="text/event-stream",
            headers=SSE_HEADERS,
        )

    principal = await _resolve_principal(request, token, payload.store_id)
    runner = state.runner
    try:
        run_id = await runner.create_run(principal, payload.question, payload.scene)
    except Exception:  # noqa: BLE001 - never leak database details to the caller
        raise HTTPException(
            status_code=503,
            detail={"code": "RUN_STORE_UNAVAILABLE", "message": "run could not be created"},
        ) from None

    async def event_stream():
        with access_token_scope(token):
            async for chunk in runner.stream(
                run_id, principal, payload.question, payload.scene
            ):
                yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.get("/v1/runs/{run_id}")
async def get_run(
    run_id: uuid.UUID,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state

    store_id = await run_in_threadpool(_load_store_id, state, run_id)
    if store_id is None:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )

    principal = await _resolve_run_principal(request, token, store_id)

    def load_run() -> dict[str, Any] | None:
        with state.session_factory() as session:
            run = RunRepository(session).get(run_id, principal)
            if run is None:
                return None
            return _serialise_run(run)

    body = await run_in_threadpool(load_run)
    if body is None:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    return body
