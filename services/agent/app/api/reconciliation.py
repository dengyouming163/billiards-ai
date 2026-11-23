"""Reconciliation HTTP API.

Identity always comes from the bearer token. The request body only carries
``store_id``/``shift_id`` (start) or ``question`` (follow-up); spoofed identity
fields are rejected with 422 by the request models. Every read is scoped to the
verified employee, so a foreign run or evidence request looks like 404.

The fixed reconciliation flow requires ``finance:cashflow``. Follow-up answers
explain the already persisted report; they never re-query business evidence.
"""

import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Header, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from starlette.concurrency import run_in_threadpool

from app.guard.identity import IdentityError, PermissionDenied, Principal, access_token_scope
from app.schemas import ReconciliationFollowupRequest, ReconciliationRunRequest
from app.services.reconciliation_runner import EVIDENCE_KINDS
from app.services.run_repository import RunRepository

router = APIRouter()

UNAUTHENTICATED = "UNAUTHENTICATED"
RUN_NOT_FOUND = "RUN_NOT_FOUND"
PERMISSION_DENIED = "PERMISSION_DENIED"
RECONCILIATION_UNAVAILABLE = "RECONCILIATION_UNAVAILABLE"
INVALID_EVIDENCE_KIND = "INVALID_EVIDENCE_KIND"

REQUIRED_PERMISSION = "finance:cashflow"

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
        raise HTTPException(
            status_code=exc.status_code,
            detail={"code": exc.code, "message": str(exc)},
        ) from None


async def _resolve_run_principal(request: Request, token: str, store_id: str) -> Principal:
    try:
        return await _resolve_principal(request, token, store_id)
    except HTTPException:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        ) from None


def _require_finance(principal: Principal) -> None:
    try:
        principal.require(REQUIRED_PERMISSION)
    except PermissionDenied as exc:
        raise HTTPException(
            status_code=403,
            detail={"code": PERMISSION_DENIED, "message": str(exc)},
        ) from None


def _load_store_id(state: Any, run_id: uuid.UUID) -> str | None:
    with state.session_factory() as session:
        return RunRepository(session).get_store_id(run_id)


def _run_is_owned(state: Any, run_id: uuid.UUID, principal: Principal) -> bool:
    with state.session_factory() as session:
        return RunRepository(session).get(run_id, principal) is not None


@router.post("/v1/reconciliation/runs/stream")
async def stream_reconciliation_run(
    payload: ReconciliationRunRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state
    runner = state.reconciliation_runner
    if runner is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": RECONCILIATION_UNAVAILABLE,
                "message": "reconciliation runner is not configured",
            },
        )

    principal = await _resolve_principal(request, token, payload.store_id)
    _require_finance(principal)
    try:
        run_id = await runner.create_run(principal, payload.shift_id)
    except Exception:  # noqa: BLE001 - never leak database details
        raise HTTPException(
            status_code=503,
            detail={"code": "RUN_STORE_UNAVAILABLE", "message": "run could not be created"},
        ) from None

    async def event_stream():
        with access_token_scope(token):
            async for chunk in runner.stream(run_id, principal, payload.shift_id):
                yield chunk

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.post("/v1/reconciliation/runs/{run_id}/messages/stream")
async def stream_reconciliation_followup(
    run_id: uuid.UUID,
    payload: ReconciliationFollowupRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state
    runner = state.reconciliation_runner

    store_id = await run_in_threadpool(_load_store_id, state, run_id)
    if store_id is None:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    principal = await _resolve_run_principal(request, token, store_id)
    owned = await run_in_threadpool(_run_is_owned, state, run_id, principal)
    if not owned:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    _require_finance(principal)

    return StreamingResponse(
        runner.stream_followup(run_id, principal, payload.question),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )


@router.get("/v1/reconciliation/runs/{run_id}/evidence")
async def get_reconciliation_evidence(
    run_id: uuid.UUID,
    request: Request,
    kind: Annotated[str, Query(min_length=1, max_length=32)] = "orders",
    ids: Annotated[str, Query(min_length=1, max_length=4000)] = ...,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state
    if kind not in EVIDENCE_KINDS:
        raise HTTPException(
            status_code=422,
            detail={"code": INVALID_EVIDENCE_KIND, "message": f"unsupported kind: {kind}"},
        )
    wanted = [item.strip() for item in ids.split(",") if item.strip()]
    if not wanted:
        raise HTTPException(
            status_code=422,
            detail={"code": INVALID_EVIDENCE_KIND, "message": "at least one id is required"},
        )

    store_id = await run_in_threadpool(_load_store_id, state, run_id)
    if store_id is None:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    principal = await _resolve_run_principal(request, token, store_id)
    owned = await run_in_threadpool(_run_is_owned, state, run_id, principal)
    if not owned:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    _require_finance(principal)

    body = await state.reconciliation_runner.saved_evidence(
        run_id, principal, kind, wanted
    )
    if body is None:
        raise HTTPException(
            status_code=404,
            detail={"code": RUN_NOT_FOUND, "message": "run not found"},
        )
    return body
