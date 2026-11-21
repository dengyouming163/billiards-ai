"""Trace event persistence and SSE formatting.

Every event is written to ``agent_events`` before it is streamed, so the SSE
output and the query API read from the same source. Sequence numbers are
allocated per run and the database enforces ``UNIQUE(run_id, seq)``.
"""

import json
import threading
import uuid
from collections.abc import Callable, Mapping
from typing import Any

from app.models.run import AgentEvent
from app.services.redaction import redact_payload

EventSink = Callable[[dict[str, Any]], None]


class EventPublisher:
    """Persist one run's events and fan them out to an SSE sink."""

    def __init__(
        self,
        session_factory: Callable[[], Any],
        run_id: uuid.UUID,
        *,
        sink: EventSink | None = None,
    ) -> None:
        self._session_factory = session_factory
        self._run_id = run_id
        self._sink = sink
        self._seq = 0
        self._lock = threading.Lock()

    @property
    def seq(self) -> int:
        return self._seq

    def emit(
        self, event_type: str, payload: Mapping[str, Any] | None = None
    ) -> dict[str, Any]:
        data = redact_payload(dict(payload or {}))
        with self._lock:
            self._seq += 1
            seq = self._seq

        with self._session_factory() as session:
            session.add(
                AgentEvent(
                    run_id=self._run_id,
                    seq=seq,
                    event_type=event_type,
                    payload_json=data,
                )
            )
            session.commit()

        envelope = {"id": f"{self._run_id}:{seq}", "seq": seq, "type": event_type, "data": data}
        if self._sink is not None:
            try:
                self._sink(envelope)
            except RuntimeError:
                # The client went away and its loop is closed: persistence is
                # already done, so the trace stays queryable.
                pass
        return envelope


def format_sse(envelope: Mapping[str, Any]) -> str:
    data = json.dumps(envelope["data"], ensure_ascii=False, default=str)
    return f"id: {envelope['id']}\nevent: {envelope['type']}\ndata: {data}\n\n"
