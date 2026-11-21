"""Knowledge run orchestration.

The runner owns one run end to end: it creates the ``agent_runs`` row, feeds
the compiled graph with a ``thread_id`` equal to the run id, persists tool
calls and trace events, and streams the same events as SSE. Terminal state and
terminal events are committed in one transaction; a client disconnect is
recorded as ``cancelled`` so no run is left ``running`` forever.
"""

import asyncio
import logging
import uuid
from collections.abc import AsyncIterator, Mapping
from typing import Any

from starlette.concurrency import run_in_threadpool

from app.graphs import kernel
from app.graphs.knowledge import citations_from_evidence, initial_knowledge_state
from app.models.llm import ModelInvocationError
from app.schemas import Principal
from app.services.events import EventPublisher, format_sse, max_persisted_seq
from app.services.redaction import redact_long_text
from app.services.run_repository import (
    RUN_TERMINAL_STATUSES,
    RunRepository,
    ToolCallRepository,
)

logger = logging.getLogger(__name__)

_DONE = object()
RUN_FAILED = "AGENT_RUN_FAILED"
RUN_CANCELLED = "RUN_CANCELLED"
TERMINAL_WRITE_FAILED = "TERMINAL_WRITE_FAILED"
TRACE_WRITE_FAILED = "TRACE_WRITE_FAILED"
DEFAULT_SCENE = "knowledge_qa"
SSE_PING_FRAME = ": ping\n\n"

_background_tasks: set[asyncio.Task[Any]] = set()


class DatabaseTrace:
    """TracePort implementation backed by the agent database (best effort)."""

    def __init__(
        self,
        session_factory: Any,
        run_id: uuid.UUID,
        principal: Principal,
        publisher: EventPublisher,
    ) -> None:
        self._session_factory = session_factory
        self._run_id = run_id
        self._principal = principal
        self._publisher = publisher

    async def emit(self, event_type: str, payload: Mapping[str, Any]) -> None:
        await run_in_threadpool(self._publisher.emit, event_type, payload)

    async def start_tool(self, name: str, arguments: Mapping[str, Any]) -> str:
        return await run_in_threadpool(self._start_tool, name, arguments)

    def _start_tool(self, name: str, arguments: Mapping[str, Any]) -> str:
        with self._session_factory() as session:
            call = ToolCallRepository(session).start(
                self._run_id, name, dict(arguments), principal=self._principal
            )
            tool_call_id = str(call.id)
            session.commit()
        return tool_call_id

    async def finish_tool(
        self,
        tool_call_id: str,
        *,
        status: str,
        result: Any = None,
        latency_ms: int | None = None,
        error_code: str | None = None,
    ) -> None:
        await run_in_threadpool(
            self._finish_tool,
            tool_call_id,
            status,
            result,
            latency_ms,
            error_code,
        )

    def _finish_tool(
        self,
        tool_call_id: str,
        status: str,
        result: Any,
        latency_ms: int | None,
        error_code: str | None,
    ) -> None:
        try:
            self._write_finish(tool_call_id, status, result, latency_ms, error_code)
        except Exception:
            logger.warning(
                "tool trace finish failed for %s; retrying as failed", tool_call_id,
                exc_info=True,
            )
            self._write_finish(
                tool_call_id, "failed", None, latency_ms, TRACE_WRITE_FAILED
            )

    def _write_finish(
        self,
        tool_call_id: str,
        status: str,
        result: Any,
        latency_ms: int | None,
        error_code: str | None,
    ) -> None:
        with self._session_factory() as session:
            ToolCallRepository(session).finish(
                uuid.UUID(tool_call_id),
                self._principal,
                status=status,
                result=result,
                latency_ms=latency_ms,
                error_code=error_code,
            )
            session.commit()


class KnowledgeRunner:
    def __init__(
        self,
        *,
        session_factory: Any,
        graph: Any,
        model_adapter: Any,
        registry: Any,
        sse_ping_interval: float = 15.0,
    ) -> None:
        self.session_factory = session_factory
        self.graph = graph
        self.model_adapter = model_adapter
        self.registry = registry
        self.sse_ping_interval = sse_ping_interval

    async def create_run(self, principal: Principal, question: str, scene: str | None) -> uuid.UUID:
        return await run_in_threadpool(self._create_run, principal, question, scene)

    def _create_run(self, principal: Principal, question: str, scene: str | None) -> uuid.UUID:
        with self.session_factory() as session:
            run = RunRepository(session).create(
                scene=scene or DEFAULT_SCENE,
                principal=principal,
                input_payload={"question": question, "scene": scene},
            )
            run_id = run.id
            session.commit()
        return run_id

    async def stream(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        question: str,
        scene: str | None,
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

        await run_in_threadpool(publisher.emit, "run.started", {"scene": scene or DEFAULT_SCENE})
        producer = asyncio.create_task(
            self._execute(run_id, principal, question, scene, trace, publisher, queue)
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
                logger.exception("knowledge run producer failed for %s", run_id)
            if not finished:
                await self._mark_cancelled(run_id, principal, publisher)

    async def _mark_cancelled(
        self, run_id: uuid.UUID, principal: Principal, publisher: EventPublisher
    ) -> None:
        try:
            task = asyncio.create_task(
                self._write_cancelled(run_id, principal, publisher)
            )
        except Exception:
            logger.warning("could not schedule cancellation for run %s", run_id, exc_info=True)
            return
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)
        try:
            await asyncio.shield(task)
        except asyncio.CancelledError:
            logger.info("cancellation write detached for run %s", run_id)
        except Exception:
            logger.warning("failed to mark run %s cancelled", run_id, exc_info=True)

    async def _write_cancelled(
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
                {"error": error},
                [("run.cancelled", {"status": "cancelled", "error": error})],
                publisher,
            )
        except Exception:
            logger.warning("failed to persist cancelled run %s", run_id, exc_info=True)

    async def _execute(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        question: str,
        scene: str | None,
        trace: DatabaseTrace,
        publisher: EventPublisher,
        queue: asyncio.Queue[Any],
    ) -> None:
        try:
            final_state = await self.graph.ainvoke(
                initial_knowledge_state(question, scene),
                {
                    "configurable": {
                        "thread_id": str(run_id),
                        "principal": principal,
                        "registry": self.registry,
                        "model_adapter": self.model_adapter,
                        "trace": trace,
                    },
                    "recursion_limit": kernel.MAX_MODEL_ROUNDS * 3 + 5,
                },
            )
            error = final_state.get("error") if isinstance(final_state, Mapping) else None
            if error:
                await self._finish_failed(run_id, principal, publisher, dict(error))
            else:
                await self._finish_succeeded(run_id, principal, final_state or {}, publisher)
        except ModelInvocationError as exc:
            logger.warning("model invocation failed for run %s: %s", run_id, exc.code)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {
                    "code": exc.code,
                    "message": "model request failed",
                    "status_code": 502,
                },
            )
        except Exception:
            logger.exception("knowledge graph failed for run %s", run_id)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {
                    "code": RUN_FAILED,
                    "message": "agent run failed",
                    "status_code": 500,
                },
            )
        finally:
            queue.put_nowait(_DONE)

    async def _finish_succeeded(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        final_state: Mapping[str, Any],
        publisher: EventPublisher,
    ) -> None:
        answer = redact_long_text(str(final_state.get("final_response") or ""))
        citations = citations_from_evidence(final_state.get("evidence"))
        events = [
            ("message.delta", {"delta": answer}),
            ("run.completed", {"status": "succeeded", "citations": citations}),
        ]
        try:
            await run_in_threadpool(
                self._write_terminal,
                run_id,
                principal,
                "succeeded",
                {"answer": answer, "citations": citations},
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
                {"error": error},
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
        """Commit the terminal status and its events in one transaction."""
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

    async def replay(
        self, run_id: uuid.UUID, principal: Principal, after_seq: int
    ) -> AsyncIterator[str]:
        events = await run_in_threadpool(
            self._load_events, run_id, principal, after_seq
        )
        if events is None:
            return
        for envelope in events:
            yield format_sse(envelope)

    def _load_events(
        self, run_id: uuid.UUID, principal: Principal, after_seq: int
    ) -> list[dict[str, Any]] | None:
        with self.session_factory() as session:
            run = RunRepository(session).get(run_id, principal)
            if run is None:
                return None
            return [
                {
                    "id": f"{run_id}:{event.seq}",
                    "seq": event.seq,
                    "type": event.event_type,
                    "data": event.payload_json,
                }
                for event in sorted(run.events, key=lambda item: item.seq)
                if event.seq > after_seq
            ]
