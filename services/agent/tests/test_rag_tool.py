"""RAG search tool contract tests.

Identity is only sent through ``X-Tenant-Id`` / ``X-User-Id`` headers; the
payload is fixed to the server-side contract. A RAG outage is always
``RAG_UNAVAILABLE`` and is never reported as "no such SOP".
"""

import json
from collections.abc import Iterator

import httpx
import pytest
import respx

from app.config import settings
from app.guard.identity import Principal
from app.tools.rag import RagUnavailable, build_rag_request, search_sop


def _principal() -> Principal:
    return Principal(
        employee_id="emp-a",
        tenant_id="merchant-a",
        store_id="store-a",
        role="finance",
        permissions=frozenset({"finance:cashflow"}),
    )


@pytest.fixture(autouse=True)
def rag_settings(monkeypatch) -> Iterator[None]:
    monkeypatch.setattr(settings, "rag_base_url", "http://rag.test")
    monkeypatch.setattr(settings, "rag_kb_id", "billiards-sop-test")
    monkeypatch.setattr(settings, "rag_audience", "internal")
    yield


def test_build_rag_request_keeps_identity_out_of_payload():
    url, payload, headers = build_rag_request("交班", _principal())

    assert url == "http://rag.test/v1/kbs/billiards-sop-test/search"
    assert payload == {"query": "交班", "top_k": 5, "mode": "hybrid", "audience": "internal"}
    assert headers == {"X-Tenant-Id": "merchant-a", "X-User-Id": "emp-a"}
    assert not {"tenant_id", "user_id", "kb_id"}.intersection(payload)


@respx.mock
async def test_search_sop_sends_verified_identity_and_returns_hits():
    route = respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        return_value=httpx.Response(
            200,
            json={
                "kb_id": "billiards-sop-test",
                "query": "交班",
                "mode": "hybrid",
                "hits": [
                    {
                        "chunk_id": "chunk-1",
                        "doc_id": "doc-1",
                        "score": 0.87,
                        "text": "交班前必须核对现金与流水。",
                        "metadata": {"section": "交班"},
                    }
                ],
            },
        )
    )

    hits = await search_sop("交班", _principal())

    assert [hit.chunk_id for hit in hits] == ["chunk-1"]
    assert hits[0].doc_id == "doc-1"
    assert hits[0].text == "交班前必须核对现金与流水。"
    assert hits[0].metadata == {"section": "交班"}

    request = route.calls.last.request
    assert request.headers["X-Tenant-Id"] == "merchant-a"
    assert request.headers["X-User-Id"] == "emp-a"
    assert "Authorization" not in request.headers
    assert json.loads(request.content) == {
        "query": "交班",
        "top_k": 5,
        "mode": "hybrid",
        "audience": "internal",
    }


@respx.mock
async def test_empty_hits_are_not_an_outage():
    respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        return_value=httpx.Response(
            200, json={"kb_id": "billiards-sop-test", "query": "交班", "mode": "hybrid", "hits": []}
        )
    )

    assert await search_sop("交班", _principal()) == []


@respx.mock
@pytest.mark.parametrize("status", [429, 500, 503])
async def test_rag_http_failures_map_to_rag_unavailable(status):
    respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        return_value=httpx.Response(status, json={"detail": "down"})
    )

    with pytest.raises(RagUnavailable) as excinfo:
        await search_sop("交班", _principal())

    assert excinfo.value.code == "RAG_UNAVAILABLE"


@respx.mock
async def test_rag_transport_failure_maps_to_rag_unavailable():
    respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        side_effect=httpx.ConnectError("connection refused")
    )

    with pytest.raises(RagUnavailable) as excinfo:
        await search_sop("交班", _principal())

    assert excinfo.value.code == "RAG_UNAVAILABLE"
    assert excinfo.value.__cause__ is None


@respx.mock
async def test_malformed_rag_response_is_unavailable_not_empty():
    respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        return_value=httpx.Response(200, json={"hits": [{"chunk_id": "chunk-1"}]})
    )

    with pytest.raises(RagUnavailable) as excinfo:
        await search_sop("交班", _principal())

    assert excinfo.value.code == "RAG_UNAVAILABLE"
    assert excinfo.value.__cause__ is None


@respx.mock
async def test_hits_are_truncated_to_server_side_top_k():
    hits = [
        {"chunk_id": f"chunk-{index}", "doc_id": "doc-1", "text": "交班制度"}
        for index in range(8)
    ]
    respx.post("http://rag.test/v1/kbs/billiards-sop-test/search").mock(
        return_value=httpx.Response(200, json={"hits": hits})
    )

    result = await search_sop("交班", _principal())

    assert len(result) == 5
    assert [hit.chunk_id for hit in result] == [f"chunk-{index}" for index in range(5)]
