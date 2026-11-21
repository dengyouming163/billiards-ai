"""Thin LangChain model adapter.

LangChain owns the HTTP client; this module only adds the boundaries the agent
needs: tool-call JSON validation, bounded retries for transient failures, and
a normalised ``AssistantMessage`` with usage/latency. Model name, base URL,
API key, timeout and retry budget come from server-side settings only.
"""

import json
import time
from collections.abc import Sequence
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
from openai import APIConnectionError, APIStatusError, APITimeoutError
from pydantic import BaseModel, Field

from app.config import settings

MODEL_OUTPUT_INVALID = "MODEL_OUTPUT_INVALID"
MODEL_UNAVAILABLE = "MODEL_UNAVAILABLE"
MODEL_REQUEST_REJECTED = "MODEL_REQUEST_REJECTED"
MODEL_NOT_CONFIGURED = "MODEL_NOT_CONFIGURED"

_RETRYABLE_STATUS = 429


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: dict[str, Any]


class Usage(BaseModel):
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0


class AssistantMessage(BaseModel):
    content: str = ""
    tool_calls: list[ToolCall] = Field(default_factory=list)
    usage: Usage = Field(default_factory=Usage)
    model: str
    latency_ms: int


class ModelInvocationError(Exception):
    def __init__(self, message: str, *, code: str = MODEL_UNAVAILABLE) -> None:
        super().__init__(message)
        self.code = code


def build_chat_model() -> ChatOpenAI:
    if not settings.model_api_key:
        raise ModelInvocationError(
            "model API key is not configured", code=MODEL_NOT_CONFIGURED
        )
    return ChatOpenAI(
        model=settings.model_name,
        base_url=settings.model_base_url,
        api_key=settings.model_api_key,
        timeout=settings.model_timeout_seconds,
        max_retries=0,
        temperature=0,
    )


class LangChainModelAdapter:
    """Invoke a chat model with bounded retries and validated tool calls."""

    def __init__(self, chat_model: BaseChatModel | None = None) -> None:
        self._chat_model = chat_model

    @property
    def chat_model(self) -> BaseChatModel:
        if self._chat_model is None:
            self._chat_model = build_chat_model()
        return self._chat_model

    async def complete(
        self,
        messages: Sequence[BaseMessage],
        tools: Sequence[BaseTool] | None = None,
    ) -> AssistantMessage:
        model = self.chat_model.bind_tools(list(tools)) if tools else self.chat_model
        attempts = max(0, settings.model_max_retries) + 1
        started = time.perf_counter()
        response: AIMessage | None = None

        for attempt in range(attempts):
            try:
                response = await model.ainvoke(list(messages))
                break
            except Exception as exc:  # noqa: BLE001 - provider SDKs raise unrelated error types
                if not _is_retryable(exc) or attempt == attempts - 1:
                    # Do not chain: provider exceptions can carry the API key.
                    raise _map_error(exc) from None

        latency_ms = int((time.perf_counter() - started) * 1000)
        if response is None:
            raise ModelInvocationError("model request failed")
        return _to_assistant_message(response, latency_ms)


def _is_retryable(exc: Exception) -> bool:
    if isinstance(exc, (APITimeoutError, APIConnectionError)):
        return True
    status = getattr(exc, "status_code", None)
    if isinstance(status, int):
        return status == _RETRYABLE_STATUS or status >= 500
    return False


def _map_error(exc: Exception) -> ModelInvocationError:
    status = getattr(exc, "status_code", None)
    if isinstance(exc, APIStatusError) or isinstance(status, int):
        if isinstance(status, int) and (status == _RETRYABLE_STATUS or status >= 500):
            return ModelInvocationError("model is temporarily unavailable")
        return ModelInvocationError(
            "model rejected the request", code=MODEL_REQUEST_REJECTED
        )
    return ModelInvocationError("model request failed")


def _to_assistant_message(message: AIMessage, latency_ms: int) -> AssistantMessage:
    return AssistantMessage(
        content=_content_text(message.content),
        tool_calls=_parse_tool_calls(message),
        usage=_usage_of(message),
        model=settings.model_name,
        latency_ms=latency_ms,
    )


def _content_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and isinstance(block.get("text"), str):
                parts.append(block["text"])
        return "".join(parts)
    return "" if content is None else str(content)


def _parse_tool_calls(message: AIMessage) -> list[ToolCall]:
    if message.invalid_tool_calls:
        raise ModelInvocationError(
            "model returned malformed tool arguments", code=MODEL_OUTPUT_INVALID
        )

    calls: list[ToolCall] = []
    for raw in message.tool_calls:
        name = raw.get("name")
        arguments = raw.get("args")
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError as exc:
                raise ModelInvocationError(
                    "model returned malformed tool arguments", code=MODEL_OUTPUT_INVALID
                ) from exc
        if not isinstance(name, str) or not name or not isinstance(arguments, dict):
            raise ModelInvocationError(
                "model returned malformed tool arguments", code=MODEL_OUTPUT_INVALID
            )
        calls.append(
            ToolCall(id=str(raw.get("id") or ""), name=name, arguments=arguments)
        )
    return calls


def _usage_of(message: AIMessage) -> Usage:
    metadata = message.usage_metadata or {}
    return Usage(
        input_tokens=int(metadata.get("input_tokens") or 0),
        output_tokens=int(metadata.get("output_tokens") or 0),
        total_tokens=int(metadata.get("total_tokens") or 0),
    )
