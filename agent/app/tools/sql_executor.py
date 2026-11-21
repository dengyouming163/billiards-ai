"""Execute guarded SQL with a dedicated read-only MySQL identity.

The guard (``app.guard.sql_guard``) is the only producer of the SQL text passed
here. The executor adds defence in depth: a read-only transaction, a bounded
server-side execution timeout, a bound ``__agent_store_id`` parameter and a
hard row cap. Timeouts are reported as ``SQL_TIMEOUT`` and are never retried.
"""

import time
from dataclasses import dataclass
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError
from sqlalchemy.pool import QueuePool

from app.config import settings
from app.guard.sql_guard import (
    SqlExecutionError,
    SqlTimeout,
    validate_result_columns,
)

_MAX_TIMEOUT_MS = 60000
_MAX_ROWS = 500
_TIMEOUT_ERROR_CODES = frozenset({1317, 3024})


@dataclass(frozen=True)
class QueryResult:
    sql: str
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    latency_ms: int


def _readonly_engine_url() -> str:
    url = settings.billiards_mysql_ro_url
    if not url:
        raise SqlExecutionError(
            "SQL_READONLY_DATABASE_NOT_CONFIGURED",
            "BILLIARDS_MYSQL_RO_URL is not configured",
        )
    return url


def build_readonly_engine(url: str | None = None) -> Engine:
    return create_engine(
        url or _readonly_engine_url(),
        poolclass=QueuePool,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=1,
    )


def _bounded_timeout(timeout_ms: int | None) -> int:
    value = settings.sql_timeout_ms if timeout_ms is None else timeout_ms
    return max(1, min(int(value), _MAX_TIMEOUT_MS))


def _bounded_rows(max_rows: int | None) -> int:
    value = settings.sql_max_rows if max_rows is None else max_rows
    return max(1, min(int(value), _MAX_ROWS))


def _dbapi_error_code(exc: DBAPIError) -> int | None:
    original = exc.orig
    args = getattr(original, "args", None)
    if args and isinstance(args[0], int):
        return args[0]
    return None


def execute_guarded_query(
    guarded_sql: str,
    store_id: str,
    *,
    engine: Engine | None = None,
    timeout_ms: int | None = None,
    max_rows: int | None = None,
) -> QueryResult:
    """Run already-guarded SQL and return at most ``max_rows`` rows."""
    if not store_id:
        raise SqlExecutionError("SQL_STORE_SCOPE_MISSING", "store_id is required")
    limit = _bounded_rows(max_rows)
    timeout = _bounded_timeout(timeout_ms)
    ro_engine = engine or build_readonly_engine()

    started = time.monotonic()
    try:
        with ro_engine.connect() as connection:
            # Session settings are server-side constants; the timeout is clamped
            # to an integer before interpolation.
            connection.exec_driver_sql("SET SESSION TRANSACTION READ ONLY")
            connection.exec_driver_sql(f"SET SESSION MAX_EXECUTION_TIME = {timeout}")
            connection.commit()

            result = connection.execute(
                text(guarded_sql), {"__agent_store_id": store_id}
            )
            columns = list(result.keys())
            validate_result_columns(columns)
            fetched = result.fetchmany(limit + 1)
            connection.rollback()
    except DBAPIError as exc:
        if _dbapi_error_code(exc) in _TIMEOUT_ERROR_CODES:
            raise SqlTimeout() from None
        raise SqlExecutionError(
            "SQL_EXECUTION_FAILED", "guarded query could not be executed"
        ) from None

    rows = [dict(zip(columns, row, strict=True)) for row in fetched[:limit]]
    latency_ms = int((time.monotonic() - started) * 1000)
    return QueryResult(
        sql=guarded_sql,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        latency_ms=latency_ms,
    )
