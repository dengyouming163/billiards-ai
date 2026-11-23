"""Database-level security tests for the analysis identity.

These tests use the real ``bi_agent_ro`` account. They prove the second layer:
even if the AST guard were bypassed, MySQL still denies base tables and writes.
The server timeout is verified without the guard, as required by the plan.
"""

import uuid

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import DBAPIError

from app.guard.sql_guard import validate_and_scope
from app.tools.sql_executor import execute_guarded_query

RO_URL = (
    "mysql+mysqlconnector://bi_agent_ro:test-readonly-only@127.0.0.1:13306/billiards_test"
)
ADMIN_URL = (
    "mysql+mysqlconnector://billiards:test-billiards-only@127.0.0.1:13306/billiards_test"
)
BASE_TABLES = ("bi_busi_order", "bi_busi_member_recharge", "bi_busi_employee_attendance")
ANALYSIS_VIEWS = ("agent_order_analysis", "agent_recharge_analysis", "agent_shift_analysis")


def _engine(url):
    engine = create_engine(url, pool_pre_ping=True)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception as exc:  # noqa: BLE001 - the test environment is required
        engine.dispose()
        pytest.fail(f"test MySQL is not reachable: {exc}")
    return engine


@pytest.fixture(scope="module")
def ro_engine():
    engine = _engine(RO_URL)
    yield engine
    engine.dispose()


@pytest.fixture(scope="module")
def admin_engine():
    engine = _engine(ADMIN_URL)
    yield engine
    engine.dispose()


@pytest.mark.parametrize("view", ANALYSIS_VIEWS)
def test_readonly_identity_can_select_analysis_views(ro_engine, view):
    with ro_engine.connect() as connection:
        row = connection.execute(text(f"SELECT COUNT(*) AS n FROM {view}")).one()
    assert row.n >= 0


@pytest.mark.parametrize("table", BASE_TABLES)
def test_readonly_identity_cannot_select_base_tables(ro_engine, table):
    with ro_engine.connect() as connection, pytest.raises(DBAPIError):
        connection.execute(text(f"SELECT COUNT(*) FROM {table}"))


WRITE_STATEMENTS = (
    "INSERT INTO bi_busi_order (id) VALUES ('forbidden')",
    "UPDATE bi_busi_order SET final_amount = 0 WHERE id = 'forbidden'",
    "DELETE FROM bi_busi_order WHERE id = 'forbidden'",
    "CREATE TABLE agent_forbidden_write (id INT)",
    "DROP TABLE agent_order_analysis",
)


@pytest.mark.parametrize("statement", WRITE_STATEMENTS, ids=[s.split()[0] for s in WRITE_STATEMENTS])
def test_readonly_identity_cannot_write(ro_engine, statement):
    with ro_engine.connect() as connection, pytest.raises(DBAPIError):
        connection.exec_driver_sql(statement)


def test_readonly_grants_cover_only_analysis_views(ro_engine):
    with ro_engine.connect() as connection:
        grants = [
            row[0]
            for row in connection.exec_driver_sql("SHOW GRANTS FOR CURRENT_USER()")
        ]
    select_grants = [grant for grant in grants if grant.startswith("GRANT SELECT ON")]
    assert len(select_grants) == 3
    assert all("agent_" in grant for grant in select_grants)
    assert not any("bi_busi_" in grant for grant in grants)
    assert not any("`billiards_test`.*" in grant for grant in grants)


def test_server_side_timeout_interrupts_long_query(ro_engine):
    # MySQL 8.0 does not interrupt SLEEP() via MAX_EXECUTION_TIME, so the
    # timeout is verified with a server-side fixed row-scanning query instead.
    with ro_engine.connect() as connection:
        connection.exec_driver_sql("SET SESSION MAX_EXECUTION_TIME = 100")
        with pytest.raises(DBAPIError) as excinfo:
            connection.exec_driver_sql(
                "SELECT COUNT(*) FROM agent_order_analysis a, agent_order_analysis b, "
                "agent_order_analysis c, agent_order_analysis d"
            )
    assert excinfo.value.orig.args[0] in (1317, 3024)


def test_guarded_query_cannot_read_another_store(ro_engine, admin_engine):
    suffix = uuid.uuid4().hex[:10]
    prefix = f"SYN-SQL-{suffix}"
    statements = [
        text(
            "INSERT INTO bi_busi_order "
            "(id, store_id, order_no, type, status, final_amount, cash_paid, created_at) "
            "VALUES (:id, :store_id, :order_no, 'table', 'completed', 10.00, 10.00, "
            "'2026-01-01 12:00:00')"
        )
    ]
    try:
        with admin_engine.begin() as connection:
            for store_id in ("store-a", "store-b"):
                connection.execute(
                    statements[0],
                    {
                        "id": uuid.uuid4().hex,
                        "store_id": store_id,
                        "order_no": f"{prefix}-{store_id}",
                    },
                )

        guarded = validate_and_scope(
            "SELECT store_id, order_id FROM agent_order_analysis "
            f"WHERE order_no LIKE '{prefix}%' OR 1 = 1"
        )
        result = execute_guarded_query(guarded, "store-a", engine=ro_engine)

        assert result.row_count == 1
        assert result.rows[0]["store_id"] == "store-a"
        assert set(result.columns) == {"store_id", "order_id"}
    finally:
        with admin_engine.begin() as connection:
            connection.execute(
                text("DELETE FROM bi_busi_order WHERE order_no LIKE :prefix"),
                {"prefix": f"{prefix}%"},
            )
