"""Trace event persistence and SSE formatting.

Every event is written to ``agent_events`` before it is streamed, so the SSE
output and the query API read from the same source. Sequence numbers are
allocated per run, start above any persisted event, and the database enforces
``UNIQUE(run_id, seq)``.
"""

import json
import logging
import threading
import uuid
from collections.abc import Callable, Mapping
from typing import Any

from sqlalchemy import func, select

from app.models.run import AgentEvent
from app.services.redaction import redact_event

logger = logging.getLogger(__name__)

EventSink = Callable[[dict[str, Any]], None]


def max_persisted_seq(session_factory: Callable[[], Any], run_id: uuid.UUID) -> int:
    """Return the highest persisted event sequence for one run."""
    with session_factory() as session:
        value = session.execute(
            select(func.max(AgentEvent.seq)).where(AgentEvent.run_id == run_id)
        ).scalar()
    return int(value or 0)


class EventPublisher:
    """Persist one run's events and fan them out to an SSE sink."""

    def __init__(
        self,
        session_factory: Callable[[], Any],
        run_id: uuid.UUID,
        *,
        sink: EventSink | None = None,
        initial_seq: int = 0,
    ) -> None:
        self._session_factory = session_factory
        self._run_id = run_id
        self._sink = sink
        self._seq = int(initial_seq)
        self._lock = threading.Lock()

    @property
    def seq(self) -> int:
        return self._seq

    def build(
        self, event_type: str, payload: Mapping[str, Any] | None = None
    ) -> dict[str, Any]:
        """Allocate a sequence and redact the payload without writing it."""
        data = redact_event(dict(payload or {}))
        with self._lock:
            self._seq += 1
            seq = self._seq
        return {"id": f"{self._run_id}:{seq}", "seq": seq, "type": event_type, "data": data}

    def add_to_session(self, session: Any, envelope: Mapping[str, Any]) -> None:
        session.add(
            AgentEvent(
                run_id=self._run_id,
                seq=int(envelope["seq"]),
                event_type=str(envelope["type"]),
                payload_json=dict(envelope["data"]),
            )
        )

    def publish(self, envelope: Mapping[str, Any]) -> None:
        if self._sink is None:
            return
        try:
            self._sink(dict(envelope))
        except Exception:
            logger.warning(
                "event sink unavailable for run %s at seq %s",
                self._run_id,
                envelope.get("seq"),
                exc_info=True,
            )

    def emit(
        self, event_type: str, payload: Mapping[str, Any] | None = None
    ) -> dict[str, Any]:
        envelope = self.build(event_type, payload)
        with self._session_factory() as session:
            self.add_to_session(session, envelope)
            session.commit()
        self.publish(envelope)
        return envelope


def format_sse(envelope: Mapping[str, Any]) -> str:
    data = json.dumps(envelope["data"], ensure_ascii=False, default=str)
    return f"id: {envelope['id']}\nevent: {envelope['type']}\ndata: {data}\n\n"
