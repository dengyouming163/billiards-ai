"""RAG SOP search tool.

The RAG service is a SOP evidence source, not a live fact source. Identity is
mapped to ``X-Tenant-Id`` / ``X-User-Id`` headers; the request payload is fixed
server-side and never carries identity or a caller-chosen knowledge base.
"""

from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.config import settings
from app.guard.identity import Principal

RAG_TOP_K = 5
RAG_MODE = "hybrid"


class RagHit(BaseModel):
    model_config = ConfigDict(extra="ignore")

    chunk_id: str
    doc_id: str
    score: float = 0.0
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RagUnavailable(Exception):
    """RAG could not be reached or returned an invalid payload."""

    code = "RAG_UNAVAILABLE"


def build_rag_request(query: str, principal: Principal) -> tuple[str, dict[str, Any], dict[str, str]]:
    """Build the server-side RAG request; identity never enters the payload."""
    url = f"{settings.rag_base_url.rstrip('/')}/v1/kbs/{settings.rag_kb_id}/search"
    payload = {
        "query": query,
        "top_k": RAG_TOP_K,
        "mode": RAG_MODE,
        "audience": settings.rag_audience,
    }
    headers = {"X-Tenant-Id": principal.tenant_id, "X-User-Id": principal.employee_id}
    return url, payload, headers


async def search_sop(
    query: str,
    principal: Principal,
    *,
    client: httpx.AsyncClient | None = None,
) -> list[RagHit]:
    url, payload, headers = build_rag_request(query, principal)
    try:
        if client is not None:
            response = await client.post(url, json=payload, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=settings.rag_timeout_seconds) as http:
                response = await http.post(url, json=payload, headers=headers)
    except httpx.HTTPError:
        raise RagUnavailable("rag service unavailable") from None

    if response.status_code != 200:
        raise RagUnavailable(f"rag service returned status {response.status_code}")

    try:
        hits = response.json()["hits"]
        if not isinstance(hits, list):
            raise TypeError("hits must be a list")
        return [RagHit.model_validate(hit) for hit in hits[:RAG_TOP_K]]
    except (KeyError, TypeError, ValueError, ValidationError):
        raise RagUnavailable("rag service returned an invalid payload") from None
