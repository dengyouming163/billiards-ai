"""Reconciliation run orchestration.

One reconciliation run persists its deterministic report, narrative, SOP
citations and the sanitized evidence snapshot, so a follow-up question can be
answered from the same report without querying the business API again.
"""

import asyncio
import json
import logging
import uuid
from collections.abc import AsyncIterator, Mapping
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from starlette.concurrency import run_in_threadpool

from app.graphs.reconciliation import (
    DEGRADED_NARRATIVE,
    RECONCILIATION_SCENE,
    EvidenceLoader,
    SopSearch,
    initial_reconciliation_state,
)
from app.models.llm import ModelInvocationError
from app.schemas import Principal
from app.services.events import EventPublisher, format_sse, max_persisted_seq
from app.services.redaction import redact_long_text
from app.services.run_repository import RUN_TERMINAL_STATUSES, RunRepository
from app.services.runner import DatabaseTrace

logger = logging.getLogger(__name__)

_DONE = object()
RUN_FAILED = "AGENT_RUN_FAILED"
RUN_CANCELLED = "RUN_CANCELLED"
TERMINAL_WRITE_FAILED = "TERMINAL_WRITE_FAILED"
SSE_PING_FRAME = ": ping\n\n"

EVIDENCE_KINDS = ("orders", "payments", "recharges", "cash_flows")

_background_tasks: set[asyncio.Task[Any]] = set()


class ReconciliationRunner:
    def __init__(
        self,
        *,
        session_factory: Any,
        graph: Any,
        model_adapter: Any,
        evidence_loader: EvidenceLoader,
        sop_search: SopSearch,
        sse_ping_interval: float = 15.0,
    ) -> None:
        self.session_factory = session_factory
        self.graph = graph
        self.model_adapter = model_adapter
        self.evidence_loader = evidence_loader
        self.sop_search = sop_search
        self.sse_ping_interval = sse_ping_interval

    async def create_run(self, principal: Principal, shift_id: str) -> uuid.UUID:
        return await run_in_threadpool(self._create_run, principal, shift_id)

    def _create_run(self, principal: Principal, shift_id: str) -> uuid.UUID:
        with self.session_factory() as session:
            run = RunRepository(session).create(
                scene=RECONCILIATION_SCENE,
                principal=principal,
                input_payload={"shift_id": shift_id},
            )
            run_id = run.id
            session.commit()
        return run_id

    async def stream(
        self, run_id: uuid.UUID, principal: Principal, shift_id: str
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
            {"scene": RECONCILIATION_SCENE, "shift_id": shift_id},
        )
        producer = asyncio.create_task(
            self._execute(run_id, principal, shift_id, trace, publisher, queue)
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
                logger.exception("reconciliation run producer failed for %s", run_id)
            if not finished:
                await self._mark_cancelled(run_id, principal, publisher)

    async def _execute(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        shift_id: str,
        trace: DatabaseTrace,
        publisher: EventPublisher,
        queue: asyncio.Queue[Any],
    ) -> None:
        try:
            final_state = await self.graph.ainvoke(
                initial_reconciliation_state(shift_id),
                {
                    "configurable": {
                        "thread_id": str(run_id),
                        "principal": principal,
                        "model_adapter": self.model_adapter,
                        "evidence_loader": self.evidence_loader,
                        "sop_search": self.sop_search,
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
            logger.warning("reconciliation model failed for run %s: %s", run_id, exc.code)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {"code": exc.code, "message": "model request failed", "status_code": 502},
            )
        except Exception:
            logger.exception("reconciliation graph failed for run %s", run_id)
            await self._finish_failed(
                run_id,
                principal,
                publisher,
                {"code": RUN_FAILED, "message": "agent run failed", "status_code": 500},
            )
        finally:
            queue.put_nowait(_DONE)

    def _public_result(
        self, final_state: Mapping[str, Any]
    ) -> dict[str, Any]:
        report = dict(final_state.get("report") or {})
        narrative = final_state.get("narrative")
        degraded = bool(final_state.get("degraded"))
        summary = narrative.get("summary") if isinstance(narrative, Mapping) else None
        if not summary and degraded:
            summary = DEGRADED_NARRATIVE
        report["narrative"] = summary
        report["degraded"] = degraded
        return {
            "scene": RECONCILIATION_SCENE,
            "shift_id": final_state.get("shift_id"),
            "report": report,
            "narrative": narrative,
            "sop_citations": list(final_state.get("citations") or []),
            "degraded": degraded,
            "degraded_reason": final_state.get("degraded_reason"),
            "evidence": final_state.get("evidence"),
        }

    async def _finish_succeeded(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        final_state: Mapping[str, Any],
        publisher: EventPublisher,
    ) -> None:
        result = self._public_result(final_state)
        report = result["report"]
        answer = redact_long_text(str(report.get("narrative") or DEGRADED_NARRATIVE))
        events = [
            ("message.delta", {"delta": answer}),
            (
                "run.completed",
                {
                    "status": "succeeded",
                    "report_status": report.get("status"),
                    "degraded": result["degraded"],
                    "citations": result["sop_citations"],
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
                {"scene": RECONCILIATION_SCENE, "error": error},
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
                {"scene": RECONCILIATION_SCENE, "error": error},
                [("run.cancelled", {"status": "cancelled", "error": error})],
                publisher,
            )
        except Exception:
            logger.warning("failed to persist cancelled run %s", run_id, exc_info=True)

    async def stream_followup(
        self, run_id: uuid.UUID, principal: Principal, question: str
    ) -> AsyncIterator[str]:
        result = await run_in_threadpool(self._load_result, run_id, principal)
        if result is None:
            return

        initial_seq = await run_in_threadpool(max_persisted_seq, self.session_factory, run_id)
        publisher = EventPublisher(self.session_factory, run_id, initial_seq=initial_seq)
        try:
            answer = await self._answer_followup(question, result)
        except Exception:
            logger.warning("follow-up model failed for run %s", run_id, exc_info=True)
            answer = DEGRADED_NARRATIVE
        yield format_sse(publisher.emit("message.delta", {"delta": answer}))
        yield format_sse(
            publisher.emit("run.completed", {"status": "succeeded", "followup": True})
        )

    def _load_result(self, run_id: uuid.UUID, principal: Principal) -> dict[str, Any] | None:
        with self.session_factory() as session:
            run = RunRepository(session).get(run_id, principal)
            if run is None or not isinstance(run.result_json, dict):
                return None
            return dict(run.result_json)

    async def _answer_followup(self, question: str, result: Mapping[str, Any]) -> str:
        report = result.get("report")
        if not isinstance(report, Mapping):
            return "该运行没有可解释的对账报告。"
        prompt = {
            "question": question,
            "report": report,
        }
        assistant = await self.model_adapter.complete(
            [
                SystemMessage(
                    content=(
                        "你是交班对账解释助手。只能依据给定报告回答，禁止修改金额、"
                        "差异分类或证据引用，禁止调用任何工具；回答使用简体中文。"
                    )
                ),
                HumanMessage(content=_dump(prompt)),
            ]
        )
        return redact_long_text(assistant.content or "")

    async def saved_evidence(
        self,
        run_id: uuid.UUID,
        principal: Principal,
        kind: str,
        ids: list[str],
    ) -> dict[str, Any] | None:
        result = await run_in_threadpool(self._load_result, run_id, principal)
        if result is None:
            return None
        evidence = result.get("evidence") or {}
        rows = evidence.get(kind) or []
        wanted = set(ids)
        items = [
            row
            for row in rows
            if isinstance(row, dict) and str(row.get("id")) in wanted
        ]
        return {"kind": kind, "items": items}


def _dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, default=str)
