"""Readiness and liveness probes.

``/health/live`` never touches the database. ``/health/ready`` reports ready
only when the agent database is reachable, the Alembic revision is the
expected one, and a LangGraph checkpointer is configured.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.concurrency import run_in_threadpool

EXPECTED_MIGRATION = "0001"
CHECKPOINT_UNAVAILABLE = "CHECKPOINT_UNAVAILABLE"

router = APIRouter()


@router.get("/health/live")
def live() -> dict[str, str]:
    return {"status": "ok"}


def _migration_revision(session_factory) -> str | None:
    try:
        with session_factory() as session:
            return session.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one_or_none()
    except Exception:  # noqa: BLE001 - probe failures are reported, not raised
        return None


@router.get("/health/ready")
async def ready(request: Request):
    state = request.app.state
    checks: dict[str, str] = {
        "checkpoint": "configured" if state.checkpointer is not None else "missing"
    }
    if state.checkpointer is None or state.knowledge_graph is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "code": CHECKPOINT_UNAVAILABLE,
                "checks": checks,
            },
        )

    revision = await run_in_threadpool(_migration_revision, state.session_factory)
    if revision is None:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "code": "DATABASE_UNAVAILABLE",
                "checks": checks,
            },
        )

    checks["migration"] = revision
    if revision != EXPECTED_MIGRATION:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "code": "MIGRATION_OUT_OF_DATE",
                "checks": checks,
            },
        )

    checks["database"] = "ok"
    return {"status": "ready", "checks": checks}
