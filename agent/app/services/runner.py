"""Knowledge run orchestration.

The runner owns one run end to end: it creates the ``agent_runs`` row, feeds
the compiled graph with a ``thread_id`` equal to the run id, persists tool
calls and trace events, and streams the same events as SSE. A model or tool
failure is recorded as a failed run; previously written trace rows are never
deleted.
"""

import asyncio
import uuid
from collections.abc import AsyncIterator, Mapping
from contextlib import suppress
from typing import Any

from starlette.concurrency import run_in_threadpool

from app.graphs.knowledge import citations_from_evidence, initial_knowledge_state
from app.models.llm import ModelInvocationError
from app.schemas import Principal
from app.services.events import EventPublisher, format_sse
from app.services.run_repository import RunRepository, ToolCallRepository

_DONE = object()
RUN_FAILED = "AGENT_RUN_FAILED"
DEFAULT_SCENE = "knowledge_qa"


class DatabaseTrace:
    """TracePort implementation backed by the agent database."""

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
    ) -> None:
        self.session_factory = session_factory
        self.graph = graph
        self.model_adapter = model_adapter
        self.registry = registry

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
            loop.call_soon_threadsafe(queue.put_nowait, envelope)

        publisher = EventPublisher(self.session_factory, run_id, sink=sink)
        trace = DatabaseTrace(self.session_factory, run_id, principal, publisher)

        await run_in_threadpool(publisher.emit, "run.started", {"scene": scene or DEFAULT_SCENE})
        producer = asyncio.create_task(
            self._execute(run_id, principal, question, scene, trace, publisher, queue)
        )
        try:
            while True:
                item = await queue.get()
                if item is _DONE:
                    break
                yield format_sse(item)
        finally:
            if not producer.done():
                producer.cancel()
            with suppress(BaseException):
                await producer

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
                    }
                },
            )
            error = final_state.get("error") if isinstance(final_state, Mapping) else None
            if error:
                await self._finish_failed(run_id, principal, publisher, dict(error))
            else:
                await self._finish_succeeded(run_id, principal, final_state or {}, publisher)
        except ModelInvocationError as exc:
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
        except Exception:  # noqa: BLE001 - the trace must survive any failure
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
        answer = str(final_state.get("final_response") or "")
        citations = citations_from_evidence(final_state.get("evidence"))
        await run_in_threadpool(
            self._finish_run,
            run_id,
            principal,
            "succeeded",
            {"answer": answer, "citations": citations},
        )
        await run_in_threadpool(publisher.emit, "message.delta", {"delta": answer})
        await run_in_threadpool(
            publisher.emit,
            "run.completed",
            {"status": "succeeded", "citations": citations},
        )

    async def _finish_failed(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        publisher: EventPublisher,
        error: dict[str, Any],
    ) -> None:
        await run_in_threadpool(
            self._finish_run, run_id, principal, "failed", {"error": error}
        )
        await run_in_threadpool(
            publisher.emit,
            "run.failed",
            {"status": "failed", "error": error},
        )

    def _finish_run(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        status: str,
        result: Mapping[str, Any],
    ) -> None:
        with self.session_factory() as session:
            RunRepository(session).finish(
                run_id, principal, status=status, result=result
            )
            session.commit()
