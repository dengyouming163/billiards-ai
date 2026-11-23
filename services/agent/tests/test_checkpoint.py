"""Checkpoint persistence across app instances.

The first app writes a checkpoint to PostgreSQL through its ``PostgresSaver``;
after the lifespan (and the saver connection) is closed, a brand new app
instance reads the same ``thread_id`` back from the same database.
"""

import pytest
from conftest import resolve_test_database_url
from sqlalchemy import text
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

from app.main import create_app, prepare_checkpointer


def _cleanup_checkpoints(engine, thread_id: str) -> None:
    with engine.connect() as connection:
        for table in ("checkpoint_writes", "checkpoint_blobs", "checkpoints"):
            connection.execute(
                text(f"DELETE FROM {table} WHERE thread_id = :thread_id"),
                {"thread_id": thread_id},
            )
        connection.commit()


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


async def test_checkpoint_survives_new_app_instance(session_factory, engine):
    database_url = _langgraph_database_url()
    run_id = None
    try:
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
    finally:
        if run_id is not None:
            _cleanup_checkpoints(engine, run_id)


async def test_checkpoint_does_not_store_raw_phone_numbers(session_factory, engine):
    phone = "13800138000"
    question = f"顾客手机号 {phone} 的储值怎么处理？"
    answer = f"不要记录 {phone}，按 SOP 处理。"
    run_id = None
    try:
        first_app = _app(
            session_factory,
            ScriptedAdapter([_assistant(content=answer)]),
            database_url=_langgraph_database_url(),
        )

        async with first_app.router.lifespan_context(first_app):
            async with _client(first_app) as client:
                response = await client.post(
                    "/v1/knowledge/runs/stream",
                    json=dict(RUN_BODY, question=question),
                    headers=AUTH,
                )
                events = _parse_sse(response.text)
                assert events[-1]["type"] == "run.completed"
                run_id = events[0]["id"].split(":")[0]

                body = (await client.get(f"/v1/runs/{run_id}", headers=AUTH)).json()
                assert phone not in body["result"]["answer"]
                assert "[redacted]" in body["result"]["answer"]

            snapshot = await first_app.state.knowledge_graph.aget_state(
                {"configurable": {"thread_id": run_id}}
            )
            assert phone not in snapshot.values["question"]
            assert phone not in (snapshot.values["final_response"] or "")

        with engine.connect() as connection:
            blobs = connection.execute(
                text("SELECT blob FROM checkpoint_blobs WHERE thread_id = :thread_id"),
                {"thread_id": run_id},
            ).scalars().all()
            writes = connection.execute(
                text("SELECT blob FROM checkpoint_writes WHERE thread_id = :thread_id"),
                {"thread_id": run_id},
            ).scalars().all()

        assert blobs
        stored = [blob or b"" for blob in list(blobs) + list(writes)]
        assert all(phone.encode("utf-8") not in blob for blob in stored)
    finally:
        if run_id is not None:
            _cleanup_checkpoints(engine, run_id)


def test_prepare_checkpointer_takes_and_releases_advisory_lock():
    calls: list[str] = []

    class FakeConn:
        def execute(self, sql, params=None):
            calls.append(str(sql).lower())

    class FakeSaver:
        conn = FakeConn()

        def setup(self):
            calls.append("setup")

    prepare_checkpointer(FakeSaver())

    assert "pg_advisory_lock" in calls[0]
    assert calls[1] == "setup"
    assert "pg_advisory_unlock" in calls[2]


def test_prepare_checkpointer_unlocks_when_setup_fails():
    calls: list[str] = []

    class FakeConn:
        def execute(self, sql, params=None):
            calls.append(str(sql).lower())

    class FailingSaver:
        conn = FakeConn()

        def setup(self):
            raise RuntimeError("ddl failed")

    with pytest.raises(RuntimeError):
        prepare_checkpointer(FailingSaver())

    assert any("pg_advisory_unlock" in call for call in calls)
