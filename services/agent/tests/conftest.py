"""PostgreSQL fixtures for the agent service.

Tests run against the dedicated ``agent_test`` database only. A different
database name fails the fixture loudly so a misconfigured environment can
never touch business data.
"""

import os

import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session

DEFAULT_TEST_DATABASE_URL = "postgresql+psycopg://agent:test-agent-only@127.0.0.1:15432/agent_test"
TEST_DATABASE_NAME = "agent_test"


def resolve_test_database_url() -> str:
    return (
        os.environ.get("AGENT_TEST_DATABASE_URL")
        or os.environ.get("DATABASE_URL")
        or DEFAULT_TEST_DATABASE_URL
    )


# Application settings are required and validated at import time. Inject the
# test database explicitly instead of relying on an ambient value or default.
os.environ["AGENT_DATABASE_URL"] = resolve_test_database_url()

from app.schemas import Principal


def principal(
    employee_id: str = "emp-1001",
    tenant_id: str = "tenant-1",
    store_id: str = "store-1",
    role: str = "staff",
    permissions: frozenset[str] = frozenset(),
) -> Principal:
    return Principal(
        tenant_id=tenant_id,
        employee_id=employee_id,
        store_id=store_id,
        role=role,
        permissions=permissions,
    )


@pytest.fixture(scope="session")
def engine():
    url = resolve_test_database_url()
    parsed = make_url(url)
    if parsed.database != TEST_DATABASE_NAME:
        pytest.fail(
            f"refusing to run tests against database {parsed.database!r}; "
            f"only {TEST_DATABASE_NAME!r} is allowed"
        )
    test_engine = create_engine(url, pool_pre_ping=True)
    if not inspect(test_engine).has_table("agent_runs"):
        test_engine.dispose()
        pytest.fail("database is not migrated; run `alembic upgrade head` first")
    yield test_engine
    test_engine.dispose()


@pytest.fixture()
def session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()
