from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langgraph.checkpoint.postgres import PostgresSaver
from starlette.concurrency import run_in_threadpool

from app.api import analysis, health, reconciliation, runs
from app.config import settings
from app.db import SessionLocal, engine
from app.graphs.knowledge import build_knowledge_graph
from app.graphs.reconciliation import build_reconciliation_graph
from app.graphs.sql_analysis import build_sql_analysis_graph
from app.guard.identity import BilliardsIdentityClient
from app.models.llm import LangChainModelAdapter
from app.services.reconciliation_runner import ReconciliationRunner
from app.services.runner import KnowledgeRunner
from app.services.sql_analysis_runner import SqlAnalysisRunner
from app.tools.billiards import shift_evidence
from app.tools.rag import search_sop
from app.tools.registry import default_registry

_UNSET = object()

# Arbitrary application-wide advisory lock key for LangGraph DDL migrations.
CHECKPOINT_SETUP_LOCK_ID = 872_315_442


def prepare_checkpointer(saver: Any) -> None:
    """Run the checkpointer DDL under a PostgreSQL advisory lock.

    Several workers may start at once; the lock makes ``setup()`` idempotent
    instead of racing on ``CREATE TABLE IF NOT EXISTS``.
    """
    conn = getattr(saver, "conn", None)
    if conn is None:
        saver.setup()
        return
    conn.execute("SELECT pg_advisory_lock(%s)", (CHECKPOINT_SETUP_LOCK_ID,))
    try:
        saver.setup()
    finally:
        conn.execute("SELECT pg_advisory_unlock(%s)", (CHECKPOINT_SETUP_LOCK_ID,))


def create_app(
    *,
    identity_client: Any = None,
    model_adapter: Any = None,
    registry: Any = None,
    session_factory: Any = None,
    checkpointer: Any = None,
    knowledge_graph: Any = None,
    reconciliation_graph: Any = None,
    reconciliation_evidence_loader: Any = None,
    reconciliation_sop_search: Any = None,
    analysis_graph: Any = None,
    analysis_executor: Any = None,
    langgraph_database_url: Any = _UNSET,
    sse_ping_interval: float = 15.0,
) -> FastAPI:
    """Build the agent app; every dependency can be injected for tests."""
    owns_engine = session_factory is None
    resolved_session_factory = session_factory or SessionLocal
    resolved_url = (
        settings.langgraph_database_url
        if langgraph_database_url is _UNSET
        else langgraph_database_url
    )
    if knowledge_graph is None and checkpointer is not None:
        knowledge_graph = build_knowledge_graph(checkpointer)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        try:
            if (
                app.state.checkpointer is None
                and app.state.knowledge_graph is None
                and app.state.langgraph_database_url
            ):
                with PostgresSaver.from_conn_string(app.state.langgraph_database_url) as saver:
                    await run_in_threadpool(prepare_checkpointer, saver)
                    app.state.checkpointer = saver
                    app.state.knowledge_graph = build_knowledge_graph(saver)
                    app.state.runner.graph = app.state.knowledge_graph
                    yield
            else:
                yield
        finally:
            if app.state.owns_engine:
                engine.dispose()

    app = FastAPI(
        title="Billiards AI Agent",
        version="0.1.0",
        lifespan=lifespan,
    )

    resolved_model = model_adapter or LangChainModelAdapter()
    resolved_registry = registry or default_registry()

    app.state.identity_client = identity_client or BilliardsIdentityClient()
    app.state.model_adapter = resolved_model
    app.state.registry = resolved_registry
    app.state.session_factory = resolved_session_factory
    app.state.checkpointer = checkpointer
    app.state.knowledge_graph = knowledge_graph
    app.state.langgraph_database_url = resolved_url
    app.state.owns_engine = owns_engine
    app.state.runner = KnowledgeRunner(
        session_factory=resolved_session_factory,
        graph=knowledge_graph,
        model_adapter=resolved_model,
        registry=resolved_registry,
        sse_ping_interval=sse_ping_interval,
    )
    app.state.reconciliation_runner = ReconciliationRunner(
        session_factory=resolved_session_factory,
        graph=reconciliation_graph or build_reconciliation_graph(),
        model_adapter=resolved_model,
        evidence_loader=reconciliation_evidence_loader or shift_evidence,
        sop_search=reconciliation_sop_search or search_sop,
        sse_ping_interval=sse_ping_interval,
    )
    app.state.analysis_runner = SqlAnalysisRunner(
        session_factory=resolved_session_factory,
        graph=analysis_graph or build_sql_analysis_graph(),
        model_adapter=resolved_model,
        sql_executor=analysis_executor,
        sse_ping_interval=sse_ping_interval,
    )

    cors_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins or ["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(runs.router)
    app.include_router(reconciliation.router)
    app.include_router(analysis.router)
    return app


app = create_app()
