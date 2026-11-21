"""Shift evidence tool contract tests.

The tool takes only ``shift_id``: store, tenant and permission come from the
verified ``Principal``, and the bearer token comes from the request context.
The token must never leak into logs or exception messages.
"""

import logging
from collections.abc import Iterator

import httpx
import pytest
import respx

from app.config import settings
from app.guard.identity import PermissionDenied, Principal, access_token_scope
from app.tools.billiards import ShiftEvidenceError, shift_evidence


def _principal(
    *,
    role: str = "finance",
    permissions: frozenset[str] = frozenset({"finance:cashflow"}),
    store_id: str = "store-a",
) -> Principal:
    return Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id=store_id,
        role=role,
        permissions=permissions,
    )


@pytest.fixture(autouse=True)
def php_settings(monkeypatch) -> Iterator[None]:
    monkeypatch.setattr(settings, "billiards_base_url", "http://php.test/storeapi")
    yield


@respx.mock
async def test_shift_evidence_uses_principal_store_and_context_token():
    evidence = {
        "shift_id": "shift-a",
        "store_id": "store-a",
        "business_date": "2026-11-20",
        "lines": [{"type": "cash", "amount": "100.00"}],
    }
    route = respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(200, json=evidence)
    )

    with access_token_scope("token-abc"):
        result = await shift_evidence("shift-a", _principal())

    assert result == evidence
    request = route.calls.last.request
    assert request.url.params["shift_id"] == "shift-a"
    assert request.url.params["store_id"] == "store-a"
    assert request.headers["Authorization"] == "Bearer token-abc"


async def test_shift_evidence_requires_finance_permission():
    with access_token_scope("token-abc"), pytest.raises(PermissionDenied):
        await shift_evidence(
            "shift-a",
            _principal(role="staff", permissions=frozenset({"order:read"})),
        )


@respx.mock
async def test_boss_wildcard_permission_is_allowed():
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(200, json={"shift_id": "shift-a"})
    )

    with access_token_scope("token-abc"):
        result = await shift_evidence(
            "shift-a", _principal(role="boss", permissions=frozenset({"*"}))
        )

    assert result == {"shift_id": "shift-a"}


@respx.mock
async def test_cross_store_is_forbidden():
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(403, json={"code": "forbidden"})
    )

    with access_token_scope("token-abc"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-other-store", _principal(store_id="store-b"))

    assert excinfo.value.code == "SHIFT_EVIDENCE_FORBIDDEN"
    assert excinfo.value.status_code == 403


async def test_missing_token_does_not_call_php():
    with respx.mock() as router, pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert excinfo.value.code == "MISSING_ACCESS_TOKEN"
    assert router.calls == []


@respx.mock
async def test_token_never_appears_in_logs_or_exceptions(caplog):
    caplog.set_level(logging.DEBUG)
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        side_effect=httpx.ConnectError("connection refused")
    )

    with access_token_scope("super-secret-token"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert excinfo.value.code == "SHIFT_EVIDENCE_UNAVAILABLE"
    assert "super-secret-token" not in str(excinfo.value)
    assert "super-secret-token" not in caplog.text


@respx.mock
async def test_php_unauthenticated_response_is_mapped():
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(401, json={"code": 2001})
    )

    with access_token_scope("token-abc"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert excinfo.value.code == "SHIFT_EVIDENCE_UNAUTHENTICATED"
    assert excinfo.value.status_code == 401


@pytest.mark.parametrize(
    ("php_code", "expected_code"),
    [
        ("invalid_evidence_context", "SHIFT_EVIDENCE_REJECTED"),
        ("invalid_shift_window", "SHIFT_WINDOW_INVALID"),
        ("evidence_too_large", "SHIFT_EVIDENCE_TOO_LARGE"),
        ("unexpected_code", "SHIFT_EVIDENCE_REJECTED"),
    ],
)
@respx.mock
async def test_php_422_maps_to_explicit_error_code(php_code, expected_code):
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(422, json={"code": php_code, "message": "rejected"})
    )

    with access_token_scope("token-abc"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert excinfo.value.status_code == 422
    assert excinfo.value.code == expected_code


@respx.mock
async def test_php_422_without_json_body_is_rejected():
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(422, text="not-json")
    )

    with access_token_scope("token-abc"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert excinfo.value.status_code == 422
    assert excinfo.value.code == "SHIFT_EVIDENCE_REJECTED"


@respx.mock
async def test_php_422_message_is_not_leaked():
    respx.get("http://php.test/storeapi/agent.Reconciliation/shiftEvidence").mock(
        return_value=httpx.Response(
            422,
            json={"code": "invalid_shift_window", "message": "employee 13800138000"},
        )
    )

    with access_token_scope("token-abc"), pytest.raises(ShiftEvidenceError) as excinfo:
        await shift_evidence("shift-a", _principal())

    assert "13800138000" not in str(excinfo.value)
