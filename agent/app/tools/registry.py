"""Tool registry.

M0 intentionally exposes read-only tools only: SOP search and shift evidence.
Write tools, ``reconcile_shift`` and ``sql_analysis`` are not registered until
M1 and must never be reachable from the model in M0.
"""

from collections.abc import Awaitable, Callable, Mapping
from dataclasses import dataclass
from typing import Any

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field

from app.guard.identity import Principal
from app.tools.billiards import shift_evidence
from app.tools.rag import search_sop


class UnknownTool(Exception):
    def __init__(self, name: str) -> None:
        super().__init__(f"unknown tool: {name}")
        self.name = name


class RagSearchArgs(BaseModel):
    query: str = Field(min_length=1, max_length=2000)


class ShiftEvidenceArgs(BaseModel):
    shift_id: str = Field(min_length=1, max_length=64)


Handler = Callable[..., Awaitable[Any]]


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    args_schema: type[BaseModel]
    handler: Handler


async def _rag_search(principal: Principal, *, query: str) -> list[dict[str, Any]]:
    hits = await search_sop(query, principal)
    return [hit.model_dump() for hit in hits]


async def _shift_evidence(principal: Principal, *, shift_id: str) -> dict[str, Any]:
    return await shift_evidence(shift_id, principal)


class ToolRegistry:
    def __init__(self, specs: list[ToolSpec]) -> None:
        self._specs = {spec.name: spec for spec in specs}

    def names(self) -> tuple[str, ...]:
        return tuple(self._specs)

    def get(self, name: str) -> ToolSpec | None:
        return self._specs.get(name)

    async def call(
        self, name: str, arguments: Mapping[str, Any], principal: Principal
    ) -> Any:
        spec = self._specs.get(name)
        if spec is None:
            raise UnknownTool(name)
        validated = spec.args_schema.model_validate(dict(arguments))
        return await spec.handler(principal, **validated.model_dump())

    def langchain_tools(self, principal: Principal) -> list[BaseTool]:
        """Bind the registry to one principal for model tool calling."""
        tools: list[BaseTool] = []
        for spec in self._specs.values():
            tools.append(_as_langchain_tool(spec, principal))
        return tools


def _as_langchain_tool(spec: ToolSpec, principal: Principal) -> BaseTool:
    async def _run(**kwargs: Any) -> Any:
        validated = spec.args_schema.model_validate(kwargs)
        return await spec.handler(principal, **validated.model_dump())

    return StructuredTool.from_function(
        coroutine=_run,
        name=spec.name,
        description=spec.description,
        args_schema=spec.args_schema,
    )


def default_registry() -> ToolRegistry:
    return ToolRegistry(
        [
            ToolSpec(
                name="rag_search",
                description="检索球房 SOP 制度证据，返回 chunk/doc 引用。",
                args_schema=RagSearchArgs,
                handler=_rag_search,
            ),
            ToolSpec(
                name="shift_evidence",
                description="按班次查询现金与流水核对证据（只读）。",
                args_schema=ShiftEvidenceArgs,
                handler=_shift_evidence,
            ),
        ]
    )
