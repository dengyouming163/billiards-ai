"""Redaction and size limits applied before any payload is persisted.

Security boundaries are enforced here, in one place:

* tool arguments are rebuilt from a per-tool allowlist and only scalar values
  are accepted (no nested mappings or sequences);
* strings are scrubbed for bearer tokens, ``sk-`` style keys and phone numbers,
  then truncated;
* payloads are capped at ``MAX_PAYLOAD_BYTES`` of JSON, with an oversized
  payload replaced by a marked summary.
"""

import json
import re
from collections.abc import Mapping
from typing import Any

MAX_STRING_LENGTH = 512
MAX_TEXT_LENGTH = 20_000
MAX_PAYLOAD_BYTES = 64 * 1024
SUMMARY_LENGTH = 4096
REDACTED = "[redacted]"
TRUNCATION_MARKER = "...[truncated]"

# User questions and model answers are long-form text: redact secrets but keep
# the content (up to MAX_TEXT_LENGTH) instead of the 512 character payload cap.
_TEXT_KEYS = frozenset({"question", "answer", "final_response", "delta"})


_ARGUMENT_ALLOWLIST: dict[str, frozenset[str]] = {
    "rag_search": frozenset({"query", "kb_id", "top_k", "audience"}),
}

_SECRET_PATTERNS = (
    re.compile(r"bearer\s+[A-Za-z0-9._~+/=-]+", re.IGNORECASE),
    re.compile(r"\bsk-[A-Za-z0-9_-]{8,}"),
    re.compile(r"(?<!\d)(?:\+?86[\s-]?)?1[3-9]\d(?:[\s-]?\d){8}(?!\d)"),
)
_SENSITIVE_KEY = re.compile(
    r"(authorization|token|secret|password|passwd|api[_-]?key|phone|mobile|"
    r"payment|card[_-]?no|id[_-]?card)",
    re.IGNORECASE,
)


def redact_long_text(value: str, *, max_length: int = MAX_TEXT_LENGTH) -> str:
    """Scrub secrets/PII from long text while keeping the content readable."""
    redacted = value
    for pattern in _SECRET_PATTERNS:
        redacted = pattern.sub(REDACTED, redacted)
    if len(redacted) > max_length:
        redacted = redacted[:max_length] + TRUNCATION_MARKER
    return redacted


def _redact_string(value: str) -> str:
    return redact_long_text(value, max_length=MAX_STRING_LENGTH)


def _redact_scalar(value: Any) -> Any:
    if isinstance(value, str):
        return _redact_string(value)
    if value is None or isinstance(value, (bool, float)):
        return value
    if isinstance(value, int):
        text = str(value)
        redacted = _redact_string(text)
        return REDACTED if redacted != text else value
    return _redact_string(str(value))


def _redact_value(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): _redact_value(item)
            for key, item in value.items()
            if not _SENSITIVE_KEY.search(str(key))
        }
    if isinstance(value, (list, tuple)):
        return [_redact_value(item) for item in value]
    return _redact_scalar(value)


def redact_payload(value: Any) -> Any:
    """Recursively redact a payload and cap its serialized size."""
    redacted = _redact_value(value)
    if not isinstance(redacted, (dict, list)):
        return redacted
    text = json.dumps(redacted, ensure_ascii=False, default=str)
    size = len(text.encode("utf-8"))
    if size <= MAX_PAYLOAD_BYTES:
        return redacted
    return {
        "truncated": True,
        "original_bytes": size,
        "summary": text[:SUMMARY_LENGTH],
    }


def _cap_record(record: dict[str, Any]) -> dict[str, Any]:
    """Cap a record at MAX_PAYLOAD_BYTES, shrinking long text (never replacing it)."""
    serialized = json.dumps(record, ensure_ascii=False, default=str)
    if len(serialized.encode("utf-8")) <= MAX_PAYLOAD_BYTES:
        return record

    capped = dict(record)
    capped["truncated"] = True
    for key, value in list(capped.items()):
        if key not in _TEXT_KEYS or not isinstance(value, str):
            continue
        overflow = len(json.dumps(capped, ensure_ascii=False, default=str).encode("utf-8"))
        overflow -= MAX_PAYLOAD_BYTES
        if overflow <= 0:
            break
        per_char = max(1.0, len(value.encode("utf-8")) / max(1, len(value)))
        keep = max(0, len(value) - int(overflow / per_char) - 32)
        capped[key] = redact_long_text(value, max_length=keep)
    return capped


def redact_record(value: Any) -> Any:
    """Redact a run input/result, keeping question/answer text nearly intact."""
    if not isinstance(value, Mapping):
        return redact_payload(value)
    result: dict[str, Any] = {}
    for key, item in value.items():
        name = str(key)
        if _SENSITIVE_KEY.search(name):
            continue
        if name in _TEXT_KEYS and isinstance(item, str):
            result[name] = redact_long_text(item)
        else:
            result[name] = _redact_value(item)
    return _cap_record(result)


def redact_event(value: Mapping[str, Any]) -> dict[str, Any]:
    """Redact an SSE/trace event payload; ``delta`` stays a string."""
    redacted = redact_record(value)
    return dict(redacted) if isinstance(redacted, Mapping) else {}


def sanitize_arguments(tool_name: str, arguments: Mapping[str, Any] | None) -> dict[str, Any]:
    """Rebuild arguments from the tool allowlist; unknown tools keep nothing.

    Nested mappings/sequences are rejected rather than recursively filtered,
    which closes allowlisted-key bypasses such as ``{"query": {...}}``.
    """
    allowed = _ARGUMENT_ALLOWLIST.get(tool_name)
    if not arguments or allowed is None:
        return {}
    sanitized: dict[str, Any] = {}
    for key, value in arguments.items():
        if key not in allowed:
            continue
        if value is None or isinstance(value, (str, bool, int, float)):
            sanitized[key] = _redact_scalar(value)
    return sanitized
