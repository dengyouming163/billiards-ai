"""Billiards business evidence tools.

The model only chooses ``shift_id``; store and tenant come from the verified
``Principal`` and the bearer token from the request context. PHP re-checks
store access and permission on every call, so the agent cannot widen scope.
"""

from typing import Any

import httpx

from app.config import settings
from app.guard.identity import Principal, current_access_token


class ShiftEvidenceError(Exception):
    """Shift evidence could not be retrieved."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "SHIFT_EVIDENCE_UNAVAILABLE",
        status_code: int = 502,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _error_for_status(status_code: int) -> ShiftEvidenceError:
    if status_code == 401:
        return ShiftEvidenceError(
            "shift evidence is not authenticated",
            code="SHIFT_EVIDENCE_UNAUTHENTICATED",
            status_code=401,
        )
    if status_code == 403:
        return ShiftEvidenceError(
            "shift evidence is not accessible for this store",
            code="SHIFT_EVIDENCE_FORBIDDEN",
            status_code=403,
        )
    if status_code == 404:
        return ShiftEvidenceError(
            "shift evidence not found", code="SHIFT_EVIDENCE_NOT_FOUND", status_code=404
        )
    return ShiftEvidenceError("shift evidence service unavailable")


async def shift_evidence(
    shift_id: str,
    principal: Principal,
    *,
    client: httpx.AsyncClient | None = None,
) -> dict[str, Any]:
    principal.require("finance:cashflow")

    access_token = current_access_token()
    if not access_token:
        raise ShiftEvidenceError(
            "missing access token", code="MISSING_ACCESS_TOKEN", status_code=401
        )

    url = f"{settings.billiards_base_url.rstrip('/')}/agent.Reconciliation/shiftEvidence"
    params = {"shift_id": shift_id, "store_id": principal.store_id}
    headers = {"Authorization": f"Bearer {access_token}"}

    try:
        if client is not None:
            response = await client.get(url, params=params, headers=headers)
        else:
            async with httpx.AsyncClient(timeout=10.0) as http:
                response = await http.get(url, params=params, headers=headers)
    except httpx.HTTPError:
        # Do not chain: the underlying request carries the bearer token.
        raise ShiftEvidenceError("shift evidence service unavailable") from None

    if response.status_code != 200:
        raise _error_for_status(response.status_code)

    try:
        payload = response.json()
    except ValueError as exc:
        raise ShiftEvidenceError("shift evidence service returned an invalid payload") from exc
    if not isinstance(payload, dict):
        raise ShiftEvidenceError("shift evidence service returned an invalid payload")
    return payload
