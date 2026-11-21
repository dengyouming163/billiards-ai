"""Verified identity boundary tests.

The agent service never trusts tenant/employee/role/permissions from the
browser or the model: those fields are rejected, and a ``Principal`` is only
built from the PHP ``agent.Auth/context`` response.
"""

import httpx
import pytest
import respx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import settings
from app.guard.identity import (
    BilliardsIdentityClient,
    IdentityError,
    PermissionDenied,
    Principal,
)
from app.schemas import KnowledgeRunRequest
from app.tools.rag import build_rag_request


@pytest.fixture()
def client():
    """Minimal app that only validates the run payload.

    Task 7 does not own the streaming route yet; this fixture proves the real
    FastAPI 422 behaviour for spoofed identity fields without faking it.
    """
    app = FastAPI()

    @app.post("/v1/knowledge/runs/stream", status_code=501)
    def stream(payload: KnowledgeRunRequest) -> dict[str, bool]:
        return {"accepted": True}

    return TestClient(app)


@pytest.mark.parametrize("field", ["tenant_id", "employee_id", "role", "permissions"])
def test_identity_spoofing_fields_are_rejected(client, field):
    response = client.post(
        "/v1/knowledge/runs/stream",
        json={"store_id": "store-a", "question": "x", field: "spoof"},
    )
    assert response.status_code == 422


def test_verified_request_shape_is_accepted(client):
    response = client.post(
        "/v1/knowledge/runs/stream",
        json={"store_id": "store-a", "question": "今天交班差异"},
    )
    assert response.status_code == 501


def test_principal_forbids_extra_identity_fields():
    with pytest.raises(ValidationError):
        Principal(
            employee_id="emp-a",
            tenant_id="merchant-a",
            store_id="store-a",
            role="finance",
            permissions=frozenset({"finance:cashflow"}),
            tenant_id_override="merchant-b",
        )


def test_rag_identity_comes_from_verified_principal(monkeypatch):
    monkeypatch.setattr(settings, "rag_base_url", "http://rag.test")
    monkeypatch.setattr(settings, "rag_kb_id", "billiards-sop-test")
    monkeypatch.setattr(settings, "rag_audience", "internal")

    principal = Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id="store-a",
        role="finance",
        permissions=frozenset({"finance:cashflow"}),
    )
    url, payload, headers = build_rag_request("交班", principal)

    assert url.endswith("/v1/kbs/billiards-sop-test/search")
    assert payload == {"query": "交班", "top_k": 5, "mode": "hybrid", "audience": "internal"}
    assert headers == {"X-Tenant-Id": "merchant-a", "X-User-Id": "emp-a"}
    assert not {"tenant_id", "user_id", "kb_id"}.intersection(payload)


def test_principal_require_accepts_wildcard_and_exact_permission():
    boss = Principal(
        employee_id="emp-boss",
        tenant_id="merchant-a",
        store_id="store-a",
        role="boss",
        permissions=frozenset({"*"}),
    )
    finance = Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id="store-a",
        role="finance",
        permissions=frozenset({"finance:cashflow"}),
    )

    boss.require("finance:cashflow")
    finance.require("finance:cashflow")


def test_principal_require_rejects_missing_permission():
    principal = Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id="store-a",
        role="staff",
        permissions=frozenset({"order:read"}),
    )

    with pytest.raises(PermissionDenied) as excinfo:
        principal.require("finance:cashflow")
    assert excinfo.value.permission == "finance:cashflow"
    assert excinfo.value.code == "PERMISSION_DENIED"


@respx.mock
async def test_identity_client_builds_principal_from_php_context(monkeypatch):
    monkeypatch.setattr(settings, "billiards_base_url", "http://php.test/storeapi")
    route = respx.get("http://php.test/storeapi/agent.Auth/context").mock(
        return_value=httpx.Response(
            200,
            json={
                "employee_id": "emp-a",
                "merchant_id": "merchant-a",
                "store_id": "store-a",
                "role": "finance",
                "permissions": ["finance:cashflow", "order:read"],
            },
        )
    )

    principal = await BilliardsIdentityClient().resolve("token-abc", "store-a")

    assert principal == Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id="store-a",
        role="finance",
        permissions=frozenset({"finance:cashflow", "order:read"}),
    )
    request = route.calls.last.request
    assert request.headers["Authorization"] == "Bearer token-abc"
    assert request.url.params["store_id"] == "store-a"


@respx.mock
async def test_identity_client_maps_unauthorized_without_leaking_token(monkeypatch):
    monkeypatch.setattr(settings, "billiards_base_url", "http://php.test/storeapi")
    respx.get("http://php.test/storeapi/agent.Auth/context").mock(
        return_value=httpx.Response(401, json={"code": 2001, "message": "token expired"})
    )

    with pytest.raises(IdentityError) as excinfo:
        await BilliardsIdentityClient().resolve("super-secret-token", "store-a")

    assert excinfo.value.status_code == 401
    assert excinfo.value.code == "UNAUTHENTICATED"
    assert "super-secret-token" not in str(excinfo.value)


@respx.mock
async def test_identity_client_rejects_unavailable_service(monkeypatch):
    monkeypatch.setattr(settings, "billiards_base_url", "http://php.test/storeapi")
    respx.get("http://php.test/storeapi/agent.Auth/context").mock(
        side_effect=httpx.ConnectError("connection refused")
    )

    with pytest.raises(IdentityError) as excinfo:
        await BilliardsIdentityClient().resolve("token-abc", "store-a")

    assert excinfo.value.code == "IDENTITY_UNAVAILABLE"
