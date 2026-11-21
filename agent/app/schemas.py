from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

from app.guard.identity import PermissionDenied, Principal

__all__ = [
    "KnowledgeRunRequest",
    "PermissionDenied",
    "Principal",
    "ReconciliationFollowupRequest",
    "ReconciliationRunRequest",
    "SqlAnalysisRunRequest",
]

Question = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)
]


class KnowledgeRunRequest(BaseModel):
    """Knowledge-scene run payload.

    Identity fields are not part of the contract and must be rejected:
    ``extra="forbid"`` turns spoofed ``tenant_id``/``employee_id``/``role``/
    ``permissions`` into a 422 instead of silently ignoring them.
    """

    model_config = ConfigDict(extra="forbid")

    store_id: str = Field(min_length=1, max_length=64)
    question: Question
    scene: str | None = Field(default=None, max_length=64)


class ReconciliationRunRequest(BaseModel):
    """Fixed reconciliation payload: the model never chooses store or shift."""

    model_config = ConfigDict(extra="forbid")

    store_id: str = Field(min_length=1, max_length=64)
    shift_id: str = Field(min_length=1, max_length=64)


class ReconciliationFollowupRequest(BaseModel):
    """Explanatory follow-up: only the question, never identity or a store."""

    model_config = ConfigDict(extra="forbid")

    question: Question


class SqlAnalysisRunRequest(BaseModel):
    """Open-ended analysis input; the model cannot choose account or limits."""

    model_config = ConfigDict(extra="forbid")

    store_id: str = Field(min_length=1, max_length=64)
    question: Question
