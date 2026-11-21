from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from langgraph.checkpoint.postgres import PostgresSaver
from starlette.concurrency import run_in_threadpool

from app.api import health, runs
from app.config import settings
from app.db import SessionLocal, engine
from app.graphs.knowledge import build_knowledge_graph
from app.guard.identity import BilliardsIdentityClient
from app.models.llm import LangChainModelAdapter
from app.services.runner import KnowledgeRunner
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

    app.include_router(health.router)
    app.include_router(runs.router)
    return app


app = create_app()
