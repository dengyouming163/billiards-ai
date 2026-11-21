"""Single-purpose open-ended analysis graph.

``generate_sql -> validate_draft -> execute_readonly -> summarize -> END``

The model only drafts SQL. Every draft is rewritten by the Task 12 guard; the
executor is called once with the guarded SQL and a server-provided store
scope. There is no "fix and retry" loop: a rejection or execution failure ends
the run safely with a traceable error, so a failed statement is never retried
against the database.

Rows come from the database. The model explanation is stored separately and
can never replace or mutate rows.
"""

import json
import logging
from collections.abc import Awaitable, Callable, Mapping
from typing import Any, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.guard.identity import Principal
from app.guard.sql_guard import (
    VIEW_COLUMNS,
    SqlExecutionError,
    SqlRejected,
    SqlTimeout,
    redact_sql_literals,
    validate_and_scope,
)
from app.tools.sql_executor import QueryResult

logger = logging.getLogger(__name__)

ANALYSIS_SCENE = "sql_analysis"
SQL_GENERATION_FAILED = "SQL_GENERATION_FAILED"
SQL_REJECTED = "SQL_REJECTED"
SQL_EXECUTION_FAILED = "SQL_EXECUTION_FAILED"
DEGRADED_EXPLANATION = (
    "说明生成不可用：模型服务暂不可用，查询结果与行数不受影响，请直接查看结果表。"
)

SqlExecutor = Callable[[str, str], Awaitable[QueryResult]]

_SYSTEM_PROMPT = (
    "你是球房经营数据分析助手。只能生成一条 MySQL SELECT。可用视图：\n"
    + "\n".join(
        f"- {view}({', '.join(sorted(columns))})" for view, columns in VIEW_COLUMNS.items()
    )
    + "\n规则：只能查询上述视图；不得使用 JOIN、UNION、子查询、CTE、SELECT *、"
    "FOR UPDATE 或 INTO；函数仅允许 SUM/COUNT/AVG/MIN/MAX/COALESCE/ROUND/DATE；"
    "不得指定数据库账号、超时、行数上限、门店或租户，这些由服务端强制。"
    '只输出 JSON 对象 {"sql": "..."}，不要输出解释。'
)

_SUMMARY_PROMPT = (
    "你是球房经营数据分析助手。只能基于给定的查询结果解释，禁止修改数值、"
    "禁止声称执行了额外查询或写操作。使用简体中文纯文本回答。"
)


class SqlAnalysisState(TypedDict, total=False):
    question: str
    draft_sql: str | None
    guarded_sql: str | None
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    tool_call_id: str | None
    explanation: str | None
    degraded: bool
    degraded_reason: str | None
    error: dict[str, Any] | None


def initial_sql_analysis_state(question: str) -> SqlAnalysisState:
    return {
        "question": question,
        "draft_sql": None,
        "guarded_sql": None,
        "columns": [],
        "rows": [],
        "row_count": 0,
        "tool_call_id": None,
        "explanation": None,
        "degraded": False,
        "degraded_reason": None,
        "error": None,
    }


async def _trace_start(
    trace: Any, name: str, arguments: Mapping[str, Any], fallback_id: str
) -> str:
    if trace is None:
        return fallback_id
    try:
        return await trace.start_tool(name, arguments)
    except Exception:
        logger.warning("tool trace start failed for %s", name, exc_info=True)
        return fallback_id


async def _trace_finish(trace: Any, tool_call_id: str, **kwargs: Any) -> None:
    if trace is None:
        return
    try:
        await trace.finish_tool(tool_call_id, **kwargs)
    except Exception:
        logger.warning("tool trace finish failed for %s", tool_call_id, exc_info=True)


async def _trace_emit(trace: Any, event_type: str, payload: Mapping[str, Any]) -> None:
    if trace is None:
        return
    try:
        await trace.emit(event_type, payload)
    except Exception:
        logger.warning("trace emit failed for %s", event_type, exc_info=True)


def _error(code: str, status_code: int, reason: str | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"code": code, "status_code": status_code, "message": code}
    if reason:
        payload["reason"] = reason
    return payload


def _parse_draft(content: str) -> str | None:
    try:
        payload = json.loads(content)
    except (TypeError, ValueError):
        return None
    if not isinstance(payload, dict):
        return None
    sql = payload.get("sql")
    if not isinstance(sql, str) or not sql.strip():
        return None
    return sql.strip()


async def generate_sql(state: SqlAnalysisState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    adapter = configurable["model_adapter"]
    trace = configurable.get("trace")
    question = state["question"]

    try:
        assistant = await adapter.complete(
            [
                SystemMessage(content=_SYSTEM_PROMPT),
                HumanMessage(content=question),
            ]
        )
    except Exception:  # noqa: BLE001 - model failure ends the run safely
        await _trace_emit(trace, "sql.generation_failed", {"question": question})
        return {"error": _error(SQL_GENERATION_FAILED, 502)}

    draft = _parse_draft(assistant.content or "")
    if draft is None:
        await _trace_emit(trace, "sql.generation_failed", {"question": question})
        return {"error": _error(SQL_GENERATION_FAILED, 502, "invalid_sql_draft")}

    await _trace_emit(trace, "sql.drafted", {"sql": redact_sql_literals(draft)})
    return {"draft_sql": draft}


def validate_draft(state: SqlAnalysisState, config: RunnableConfig) -> dict[str, Any]:
    try:
        guarded = validate_and_scope(state.get("draft_sql") or "")
    except SqlRejected as exc:
        return {"error": _error(SQL_REJECTED, 422, exc.code)}
    return {"guarded_sql": guarded}


async def execute_readonly(
    state: SqlAnalysisState, config: RunnableConfig
) -> dict[str, Any]:
    configurable = config["configurable"]
    principal: Principal = configurable["principal"]
    executor: SqlExecutor = configurable["sql_executor"]
    trace = configurable.get("trace")
    guarded_sql = state.get("guarded_sql") or ""

    arguments = {
        "store_id": principal.store_id,
        "sql": redact_sql_literals(guarded_sql),
    }
    tool_call_id = await _trace_start(trace, "sql_execute", arguments, "sql-execute")
    await _trace_emit(
        trace,
        "tool.started",
        {
            "tool_call_id": tool_call_id,
            "name": "sql_execute",
            "arguments": arguments,
        },
    )
    try:
        result = await executor(guarded_sql, principal.store_id)
    except SqlTimeout:
        await _trace_finish(trace, tool_call_id, status="failed", error_code="SQL_TIMEOUT")
        await _trace_emit(
            trace,
            "tool.failed",
            {
                "tool_call_id": tool_call_id,
                "name": "sql_execute",
                "error": _error("SQL_TIMEOUT", 504),
            },
        )
        return {"tool_call_id": tool_call_id, "error": _error("SQL_TIMEOUT", 504)}
    except SqlExecutionError as exc:
        await _trace_finish(
            trace, tool_call_id, status="failed", error_code=SQL_EXECUTION_FAILED
        )
        await _trace_emit(
            trace,
            "tool.failed",
            {
                "tool_call_id": tool_call_id,
                "name": "sql_execute",
                "error": _error(SQL_EXECUTION_FAILED, 502, exc.code),
            },
        )
        return {
            "tool_call_id": tool_call_id,
            "error": _error(SQL_EXECUTION_FAILED, 502, exc.code),
        }

    await _trace_finish(
        trace,
        tool_call_id,
        status="succeeded",
        result={"row_count": result.row_count, "columns": result.columns},
        latency_ms=result.latency_ms,
    )
    await _trace_emit(
        trace,
        "tool.completed",
        {
            "tool_call_id": tool_call_id,
            "name": "sql_execute",
            "status": "succeeded",
            "row_count": result.row_count,
            "columns": result.columns,
            "latency_ms": result.latency_ms,
        },
    )
    return {
        "tool_call_id": tool_call_id,
        "columns": result.columns,
        "rows": result.rows,
        "row_count": result.row_count,
    }


async def summarize(state: SqlAnalysisState, config: RunnableConfig) -> dict[str, Any]:
    configurable = config["configurable"]
    adapter = configurable["model_adapter"]
    payload = {
        "question": state["question"],
        "columns": state.get("columns") or [],
        "rows": (state.get("rows") or [])[:50],
        "row_count": state.get("row_count") or 0,
    }
    try:
        assistant = await adapter.complete(
            [
                SystemMessage(content=_SUMMARY_PROMPT),
                HumanMessage(content=json.dumps(payload, ensure_ascii=False, default=str)),
            ]
        )
    except Exception:  # noqa: BLE001 - explanation failure keeps the rows
        return {
            "explanation": DEGRADED_EXPLANATION,
            "degraded": True,
            "degraded_reason": "MODEL_UNAVAILABLE",
        }
    content = (assistant.content or "").strip()
    if not content:
        return {
            "explanation": DEGRADED_EXPLANATION,
            "degraded": True,
            "degraded_reason": "MODEL_OUTPUT_INVALID",
        }
    return {"explanation": content}


def _route(state: SqlAnalysisState, next_node: str) -> str:
    return END if state.get("error") else next_node


def build_sql_analysis_graph() -> CompiledStateGraph:
    builder = StateGraph(SqlAnalysisState)
    builder.add_node("generate_sql", generate_sql)
    builder.add_node("validate_draft", validate_draft)
    builder.add_node("execute_readonly", execute_readonly)
    builder.add_node("summarize", summarize)
    builder.add_edge(START, "generate_sql")
    builder.add_conditional_edges(
        "generate_sql",
        lambda state: _route(state, "validate_draft"),
        {"validate_draft": "validate_draft", END: END},
    )
    builder.add_conditional_edges(
        "validate_draft",
        lambda state: _route(state, "execute_readonly"),
        {"execute_readonly": "execute_readonly", END: END},
    )
    builder.add_conditional_edges(
        "execute_readonly",
        lambda state: _route(state, "summarize"),
        {"summarize": "summarize", END: END},
    )
    builder.add_edge("summarize", END)
    return builder.compile()
