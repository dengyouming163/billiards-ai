"""Checkpoint persistence across app instances.

The first app writes a checkpoint to PostgreSQL through its ``PostgresSaver``;
after the lifespan (and the saver connection) is closed, a brand new app
instance reads the same ``thread_id`` back from the same database.
"""

import pytest
from conftest import resolve_test_database_url
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from test_runs_api import (
    AUTH,
    RUN_BODY,
    FakeIdentity,
    ScriptedAdapter,
    _assistant,
    _client,
    _parse_sse,
    _rag_call,
    _rag_hits,
    _registry,
)

from app.main import create_app


def _langgraph_database_url() -> str:
    url = make_url(resolve_test_database_url())
    return url.set(drivername="postgresql").render_as_string(hide_password=False)


@pytest.fixture()
def session_factory(session):
    return sessionmaker(
        bind=session.connection(),
        autoflush=False,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )


def _app(session_factory, adapter, *, database_url: str):
    return create_app(
        identity_client=FakeIdentity(),
        model_adapter=adapter,
        registry=_registry(_rag_hits),
        session_factory=session_factory,
        langgraph_database_url=database_url,
    )


async def test_checkpoint_survives_new_app_instance(session_factory):
    database_url = _langgraph_database_url()

    first_adapter = ScriptedAdapter(
        [_assistant(tool_calls=[_rag_call()]), _assistant(content="持久化答案")]
    )
    first_app = _app(session_factory, first_adapter, database_url=database_url)
    async with first_app.router.lifespan_context(first_app):
        assert first_app.state.checkpointer is not None
        assert first_app.state.knowledge_graph is not None
        async with _client(first_app) as client:
            response = await client.post(
                "/v1/knowledge/runs/stream", json=RUN_BODY, headers=AUTH
            )
            events = _parse_sse(response.text)
            assert events[-1]["type"] == "run.completed"
            run_id = events[0]["id"].split(":")[0]

    # The first lifespan (and its checkpointer connection) is closed here.
    second_app = _app(
        session_factory,
        ScriptedAdapter([_assistant(content="unused")]),
        database_url=database_url,
    )
    async with second_app.router.lifespan_context(second_app):
        assert second_app.state.checkpointer is not None
        graph = second_app.state.knowledge_graph
        snapshot = await graph.aget_state({"configurable": {"thread_id": run_id}})

        assert snapshot.values["final_response"] == "持久化答案"
        assert snapshot.values["round"] == 2
        assert snapshot.values["question"] == RUN_BODY["question"]
