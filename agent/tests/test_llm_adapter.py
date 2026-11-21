"""Model adapter contract tests.

The adapter is the only place that talks to the model. It must normalise
tool-call JSON, retry transient failures at most once, never retry a 4xx, and
record model/usage/latency without ever logging the API key.
"""

import logging
from collections.abc import Iterator
from typing import Any

import httpx
import pytest
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from openai import APITimeoutError, BadRequestError, InternalServerError, RateLimitError
from pydantic import Field

from app.config import settings
from app.models.llm import AssistantMessage, LangChainModelAdapter, ModelInvocationError
from app.tools.registry import default_registry

VALID_TOOL_CALL = {
    "name": "rag_search",
    "args": {"query": "交班差异怎么核对"},
    "id": "call-1",
    "type": "tool_call",
}


class ScriptedChatModel(BaseChatModel):
    """Fake chat model that replays messages or raises scripted exceptions."""

    responses: list[Any] = Field(default_factory=list)
    calls: int = 0

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: list[str] | None = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        item = self.responses[min(self.calls, len(self.responses) - 1)]
        self.calls += 1
        if isinstance(item, Exception):
            raise item
        return ChatResult(generations=[ChatGeneration(message=item)])

    def bind_tools(self, tools: Any, **kwargs: Any) -> "ScriptedChatModel":
        return self


def _request() -> httpx.Request:
    return httpx.Request("POST", "http://model.test/v1/chat/completions")


def _timeout() -> APITimeoutError:
    return APITimeoutError(request=_request())


def _rate_limit() -> RateLimitError:
    return RateLimitError("rate limited", response=httpx.Response(429, request=_request()), body=None)


def _server_error() -> InternalServerError:
    return InternalServerError(
        "upstream failed", response=httpx.Response(500, request=_request()), body=None
    )


def _bad_request() -> BadRequestError:
    return BadRequestError("bad payload", response=httpx.Response(400, request=_request()), body=None)


def _tool_message() -> AIMessage:
    return AIMessage(
        content="先查制度",
        tool_calls=[VALID_TOOL_CALL],
        usage_metadata={"input_tokens": 11, "output_tokens": 7, "total_tokens": 18},
    )


def _adapter(model: BaseChatModel) -> LangChainModelAdapter:
    return LangChainModelAdapter(chat_model=model)


async def _complete(model: BaseChatModel) -> AssistantMessage:
    return await _adapter(model).complete([HumanMessage(content="交班")], tools=[])


@pytest.fixture(autouse=True)
def model_settings(monkeypatch) -> Iterator[None]:
    monkeypatch.setattr(settings, "model_name", "test-tool-model")
    monkeypatch.setattr(settings, "model_max_retries", 1)
    yield


async def test_valid_tool_arguments_are_parsed():
    result = await _complete(ScriptedChatModel(responses=[_tool_message()]))

    assert result.content == "先查制度"
    assert len(result.tool_calls) == 1
    call = result.tool_calls[0]
    assert call.name == "rag_search"
    assert call.id == "call-1"
    assert call.arguments == {"query": "交班差异怎么核对"}


async def test_invalid_tool_arguments_json_is_rejected_without_retry():
    model = ScriptedChatModel(
        responses=[
            AIMessage(
                content="",
                invalid_tool_calls=[
                    {
                        "type": "invalid_tool_call",
                        "id": "call-1",
                        "name": "rag_search",
                        "args": "{not-json",
                        "error": "bad json",
                    }
                ],
            )
        ]
    )

    with pytest.raises(ModelInvocationError) as excinfo:
        await _complete(model)

    assert excinfo.value.code == "MODEL_OUTPUT_INVALID"
    assert model.calls == 1


@pytest.mark.parametrize("failure", [_timeout, _rate_limit, _server_error])
async def test_transient_failures_retry_once_then_succeed(failure):
    model = ScriptedChatModel(responses=[failure(), _tool_message()])

    result = await _complete(model)

    assert result.model == "test-tool-model"
    assert model.calls == 2


@pytest.mark.parametrize("failure", [_timeout, _rate_limit, _server_error])
async def test_transient_failures_are_bounded_to_one_retry(failure):
    model = ScriptedChatModel(responses=[failure(), failure(), _tool_message()])

    with pytest.raises(ModelInvocationError) as excinfo:
        await _complete(model)

    assert excinfo.value.code == "MODEL_UNAVAILABLE"
    assert model.calls == 2


async def test_client_error_is_not_retried():
    model = ScriptedChatModel(responses=[_bad_request(), _tool_message()])

    with pytest.raises(ModelInvocationError) as excinfo:
        await _complete(model)

    assert excinfo.value.code == "MODEL_REQUEST_REJECTED"
    assert model.calls == 1


async def test_usage_model_and_latency_are_recorded():
    result = await _complete(ScriptedChatModel(responses=[_tool_message()]))

    assert result.usage.input_tokens == 11
    assert result.usage.output_tokens == 7
    assert result.usage.total_tokens == 18
    assert result.model == "test-tool-model"
    assert result.latency_ms >= 0
    assert result.tool_calls[0].arguments == {"query": "交班差异怎么核对"}


async def test_api_key_is_never_logged(monkeypatch, caplog):
    monkeypatch.setattr(settings, "model_api_key", "sk-super-secret-key")
    caplog.set_level(logging.DEBUG)

    result = await _complete(ScriptedChatModel(responses=[_tool_message()]))

    assert "sk-super-secret-key" not in caplog.text
    assert "sk-super-secret-key" not in repr(result)


def test_registry_only_exposes_read_only_m0_tools():
    registry = default_registry()

    assert registry.names() == ("rag_search", "shift_evidence")
    for write_tool in ("reconcile_shift", "sql_analysis", "write_report"):
        assert write_tool not in registry.names()
