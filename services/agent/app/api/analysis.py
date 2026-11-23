"""Open-ended read-only analysis API.

The request body only accepts ``store_id``/``question``; account, timeout, row
cap, views, tenant and store scope are server-side. The result keeps the
database rows and the model explanation in separate fields.
"""

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.guard.identity import IdentityError, PermissionDenied, Principal
from app.schemas import SqlAnalysisRunRequest

router = APIRouter()

UNAUTHENTICATED = "UNAUTHENTICATED"
PERMISSION_DENIED = "PERMISSION_DENIED"
ANALYSIS_UNAVAILABLE = "ANALYSIS_UNAVAILABLE"
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


def _require_finance(principal: Principal) -> None:
    try:
        principal.require(REQUIRED_PERMISSION)
    except PermissionDenied as exc:
        raise HTTPException(
            status_code=403,
            detail={"code": PERMISSION_DENIED, "message": str(exc)},
        ) from None


@router.post("/v1/analysis/runs/stream")
async def stream_analysis_run(
    payload: SqlAnalysisRunRequest,
    request: Request,
    authorization: Annotated[str | None, Header()] = None,
):
    token = _bearer_token(authorization)
    state = request.app.state
    runner = state.analysis_runner
    if runner is None:
        raise HTTPException(
            status_code=503,
            detail={
                "code": ANALYSIS_UNAVAILABLE,
                "message": "analysis runner is not configured",
            },
        )

    principal = await _resolve_principal(request, token, payload.store_id)
    _require_finance(principal)
    try:
        run_id = await runner.create_run(principal, payload.question)
    except Exception:  # noqa: BLE001 - never leak database details
        raise HTTPException(
            status_code=503,
            detail={"code": "RUN_STORE_UNAVAILABLE", "message": "run could not be created"},
        ) from None

    return StreamingResponse(
        runner.stream(run_id, principal, payload.question),
        media_type="text/event-stream",
        headers=SSE_HEADERS,
    )
