"""Streaming runner for the open-ended SQL analysis graph.

The runner persists the generated draft, guarded SQL, database rows and the
model explanation as separate result fields. A rejection or execution failure
ends the run with a code and never retries a rewritten statement.
"""

import asyncio
import logging
import uuid
from collections.abc import AsyncIterator, Mapping
from typing import Any

from starlette.concurrency import run_in_threadpool

from app.graphs.sql_analysis import (
    ANALYSIS_SCENE,
    DEGRADED_EXPLANATION,
    SqlExecutor,
    initial_sql_analysis_state,
)
from app.models.llm import ModelInvocationError
from app.schemas import Principal
from app.services.events import EventPublisher, format_sse, max_persisted_seq
from app.services.redaction import redact_long_text
from app.services.run_repository import RUN_TERMINAL_STATUSES, RunRepository
from app.services.runner import DatabaseTrace
from app.tools.sql_executor import execute_guarded_query

logger = logging.getLogger(__name__)

_DONE = object()
RUN_FAILED = "AGENT_RUN_FAILED"
RUN_CANCELLED = "RUN_CANCELLED"
TERMINAL_WRITE_FAILED = "TERMINAL_WRITE_FAILED"
SSE_PING_FRAME = ": ping\n\n"

_background_tasks: set[asyncio.Task[Any]] = set()


async def default_sql_executor(guarded_sql: str, store_id: str) -> Any:
    return await run_in_threadpool(execute_guarded_query, guarded_sql, store_id)


class SqlAnalysisRunner:
    def __init__(
        self,
        *,
        session_factory: Any,
        graph: Any,
        model_adapter: Any,
        sql_executor: SqlExecutor | None = None,
        sse_ping_interval: float = 15.0,
    ) -> None:
        self.session_factory = session_factory
        self.graph = graph
        self.model_adapter = model_adapter
        self.sql_executor = sql_executor or default_sql_executor
        self.sse_ping_interval = sse_ping_interval

    async def create_run(self, principal: Principal, question: str) -> uuid.UUID:
        return await run_in_threadpool(self._create_run, principal, question)

    def _create_run(self, principal: Principal, question: str) -> uuid.UUID:
        with self.session_factory() as session:
            run = RunRepository(session).create(
                scene=ANALYSIS_SCENE,
                principal=principal,
                input_payload={"question": question},
            )
            run_id = run.id
            session.commit()
        return run_id

    async def stream(
        self, run_id: uuid.UUID, principal: Principal, question: str
    ) -> AsyncIterator[str]:
        loop = asyncio.get_running_loop()
        queue: asyncio.Queue[Any] = asyncio.Queue()

        def sink(envelope: dict[str, Any]) -> None:
            try:
                loop.call_soon_threadsafe(queue.put_nowait, envelope)
            except RuntimeError:
                logger.debug("event sink loop is closed for run %s", run_id)

        initial_seq = await run_in_threadpool(max_persisted_seq, self.session_factory, run_id)
        publisher = EventPublisher(
            self.session_factory, run_id, sink=sink, initial_seq=initial_seq
        )
        trace = DatabaseTrace(self.session_factory, run_id, principal, publisher)

        await run_in_threadpool(
            publisher.emit,
            "run.started",
            {"scene": ANALYSIS_SCENE},
        )
        producer = asyncio.create_task(
            self._execute(run_id, principal, question, trace, publisher, queue)
        )
        finished = False
        ping_timeout = self.sse_ping_interval if self.sse_ping_interval > 0 else None
        try:
            while True:
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=ping_timeout)
                except TimeoutError:
                    yield SSE_PING_FRAME
                    continue
                if item is _DONE:
                    finished = True
                    break
                yield format_sse(item)
        finally:
            if not producer.done():
                producer.cancel()
            try:
                await producer
            except asyncio.CancelledError:
                pass
            except Exception:
                logger.exception("sql analysis producer failed for %s", run_id)
            if not finished:
                await self._mark_cancelled(run_id, principal, publisher)

    async def _execute(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        question: str,
        trace: DatabaseTrace,
        publisher: EventPublisher,
        queue: asyncio.Queue[Any],
    ) -> None:
        try:
            final_state = await self.graph.ainvoke(
                initial_sql_analysis_state(question),
                {
                    "configurable": {
                        "thread_id": str(run_id),
                        "principal": principal,
                        "model_adapter": self.model_adapter,
                        "sql_executor": self.sql_executor,
                        "trace": trace,
                    },
                    "recursion_limit": 20,
                },
            )
            error = final_state.get("error") if isinstance(final_state, Mapping) else None
            if error:
                await self._finish_failed(run_id, principal, publisher, dict(error))
            else:
                await self._finish_succeeded(run_id, principal, final_state or {}, publisher)
        except ModelInvocationError as exc:
            logger.warning("sql analysis model failed for run %s: %s", run_id, exc.code)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {"code": exc.code, "message": "model request failed", "status_code": 502},
            )
        except Exception:
            logger.exception("sql analysis graph failed for run %s", run_id)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {"code": RUN_FAILED, "message": "agent run failed", "status_code": 500},
            )
        finally:
            queue.put_nowait(_DONE)

    def _public_result(self, final_state: Mapping[str, Any]) -> dict[str, Any]:
        return {
            "scene": ANALYSIS_SCENE,
            "question": final_state.get("question"),
            "guarded_sql": final_state.get("guarded_sql"),
            "columns": list(final_state.get("columns") or []),
            "rows": list(final_state.get("rows") or []),
            "row_count": final_state.get("row_count") or 0,
            "tool_call_id": final_state.get("tool_call_id"),
            "explanation": final_state.get("explanation"),
            "degraded": bool(final_state.get("degraded")),
            "degraded_reason": final_state.get("degraded_reason"),
        }

    async def _finish_succeeded(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        final_state: Mapping[str, Any],
        publisher: EventPublisher,
    ) -> None:
        result = self._public_result(final_state)
        answer = redact_long_text(result.get("explanation") or DEGRADED_EXPLANATION)
        events = [
            ("message.delta", {"delta": answer}),
            (
                "run.completed",
                {
                    "status": "succeeded",
                    "row_count": result["row_count"],
                    "degraded": result["degraded"],
                },
            ),
        ]
        try:
            await run_in_threadpool(
                self._write_terminal,
                run_id,
                principal,
                "succeeded",
                result,
                events,
                publisher,
            )
        except Exception:
            logger.warning(
                "terminal write failed for run %s; marking it failed", run_id, exc_info=True
            )
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {
                    "code": TERMINAL_WRITE_FAILED,
                    "message": "terminal trace write failed",
                    "status_code": 500,
                },
            )

    async def _finish_failed(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        publisher: EventPublisher,
        error: dict[str, Any],
    ) -> None:
        try:
            await run_in_threadpool(
                self._write_terminal,
                run_id,
                principal,
                "failed",
                {"scene": ANALYSIS_SCENE, "error": error},
                [("run.failed", {"status": "failed", "error": error})],
                publisher,
            )
        except Exception:
            logger.exception("failed to persist failure for run %s", run_id)

    def _write_terminal(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        status: str,
        result: Mapping[str, Any],
        events: list[tuple[str, Mapping[str, Any]]],
        publisher: EventPublisher,
    ) -> bool:
        envelopes = [publisher.build(event_type, payload) for event_type, payload in events]
        with self.session_factory() as session:
            repo = RunRepository(session)
            run = repo.get(run_id, principal)
            if run is None or run.status in RUN_TERMINAL_STATUSES:
                logger.info("run %s is already terminal; skipping %s write", run_id, status)
                return False
            repo.finish(run_id, principal, status=status, result=result)
            for envelope in envelopes:
                publisher.add_to_session(session, envelope)
            session.commit()
        for envelope in envelopes:
            publisher.publish(envelope)
        return True

    async def _mark_cancelled(
        self, run_id: uuid.UUID, principal: Principal, publisher: EventPublisher
    ) -> None:
        error = {
            "code": RUN_CANCELLED,
            "message": "client disconnected before the run finished",
            "status_code": 499,
        }
        try:
            await run_in_threadpool(
                self._write_terminal,
                run_id,
                principal,
                "cancelled",
                {"scene": ANALYSIS_SCENE, "error": error},
                [("run.cancelled", {"status": "cancelled", "error": error})],
                publisher,
            )
        except Exception:
            logger.warning("failed to persist cancelled run %s", run_id, exc_info=True)
