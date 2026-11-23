"""AST-level SQL guard tests.

These tests cover every attack vector named in the M1 plan plus the legal
aggregate shapes the analysis agent needs. No database connection is used.
"""

import pytest

from app.guard.sql_guard import SqlRejected, validate_and_scope

REJECTED = [
    ("UPDATE agent_order_analysis SET final_amount = 0", "SINGLE_SELECT_REQUIRED"),
    ("DELETE FROM agent_order_analysis", "SINGLE_SELECT_REQUIRED"),
    ("DROP TABLE agent_order_analysis", "SINGLE_SELECT_REQUIRED"),
    (
        "INSERT INTO agent_order_analysis (store_id) VALUES ('store-b')",
        "SINGLE_SELECT_REQUIRED",
    ),
    ("SELECT 1; SELECT 2", "SINGLE_SELECT_REQUIRED"),
    (
        "SELECT store_id FROM agent_order_analysis UNION SELECT store_id FROM bi_busi_order",
        "SINGLE_SELECT_REQUIRED",
    ),
    (
        (
            "SELECT o.store_id FROM agent_order_analysis o "
            "JOIN bi_busi_order b ON o.order_id = b.id"
        ),
        "QUERY_SHAPE_FORBIDDEN",
    ),
    (
        "SELECT store_id FROM (SELECT store_id FROM agent_order_analysis) t",
        "QUERY_SHAPE_FORBIDDEN",
    ),
    (
        "WITH x AS (SELECT store_id FROM agent_order_analysis) SELECT store_id FROM x",
        "QUERY_SHAPE_FORBIDDEN",
    ),
    (
        "SELECT a.store_id FROM agent_order_analysis a, agent_recharge_analysis r",
        "QUERY_SHAPE_FORBIDDEN",
    ),
    ("SELECT store_id FROM bi_busi_order", "TABLE_NOT_ALLOWED"),
    (
        "SELECT store_id FROM billiards_test.agent_order_analysis",
        "SCHEMA_PREFIX_FORBIDDEN",
    ),
    ("SELECT phone FROM agent_order_analysis", "COLUMN_NOT_ALLOWED"),
    ("SELECT * FROM agent_order_analysis", "SELECT_STAR_FORBIDDEN"),
    ("SELECT o.* FROM agent_order_analysis o", "SELECT_STAR_FORBIDDEN"),
    ("SELECT SLEEP(1) FROM agent_order_analysis", "FUNCTION_NOT_ALLOWED"),
    ("SELECT LOAD_FILE('/etc/passwd') FROM agent_order_analysis", "FUNCTION_NOT_ALLOWED"),
    ("SELECT NOW() FROM agent_order_analysis", "FUNCTION_NOT_ALLOWED"),
    ("SELECT SUBSTRING(order_no, 1, 2) FROM agent_order_analysis", "FUNCTION_NOT_ALLOWED"),
    (
        "SELECT store_id FROM agent_order_analysis INTO OUTFILE '/tmp/x'",
        "SQL_PARSE_ERROR",
    ),
    ("SELECT store_id FROM agent_order_analysis FOR UPDATE", "QUERY_SHAPE_FORBIDDEN"),
    ("SELECT store_id FROM agent_order_analysis LIMIT 201", "LIMIT_EXCEEDED"),
    ("SELECT store_id FROM agent_order_analysis LIMIT 0", "LIMIT_INVALID"),
    ("SELECT store_id FROM agent_order_analysis LIMIT ALL", "LIMIT_INVALID"),
    ("SELECT store_id FROM agent_order_analysis WHERE store_id = :x", "PLACEHOLDER_FORBIDDEN"),
    ("", "SQL_EMPTY"),
    ("SELECT " + "store_id, " * 500 + "store_id FROM agent_order_analysis", "SQL_TOO_LONG"),
]


@pytest.mark.parametrize("sql,code", REJECTED, ids=[code for _, code in REJECTED])
def test_guard_rejects_attack_vector(sql, code):
    with pytest.raises(SqlRejected) as excinfo:
        validate_and_scope(sql)
    assert excinfo.value.code == code


def test_missing_limit_is_injected_at_the_row_cap():
    guarded = validate_and_scope(
        "SELECT store_id, SUM(final_amount) AS total "
        "FROM agent_order_analysis GROUP BY store_id"
    )
    assert "LIMIT 200" in guarded
    assert "store_id = :__agent_store_id" in guarded


def test_existing_limit_is_kept_when_within_cap():
    guarded = validate_and_scope("SELECT store_id FROM agent_order_analysis LIMIT 50")
    assert "LIMIT 50" in guarded
    assert "LIMIT 200" not in guarded


def test_where_clause_is_parenthesised_before_store_scope():
    guarded = validate_and_scope(
        "SELECT order_id FROM agent_order_analysis "
        "WHERE store_id = 'store-b' OR 1 = 1"
    )
    assert "(store_id = 'store-b' OR 1 = 1)" in guarded
    assert "AND store_id = :__agent_store_id" in guarded


def test_existing_store_filter_is_still_scoped():
    guarded = validate_and_scope(
        "SELECT order_id FROM agent_order_analysis WHERE store_id = 'store-a'"
    )
    assert "(store_id = 'store-a') AND store_id = :__agent_store_id" in guarded


def test_alias_qualified_columns_are_allowed():
    guarded = validate_and_scope(
        "SELECT o.order_id FROM agent_order_analysis o WHERE o.store_id = 'store-a'"
    )
    assert "o.order_id" in guarded
    assert "store_id = :__agent_store_id" in guarded


def test_count_star_is_allowed():
    guarded = validate_and_scope("SELECT COUNT(*) AS n FROM agent_recharge_analysis")
    assert "COUNT(*)" in guarded


def test_round_and_date_are_allowed():
    guarded = validate_and_scope(
        "SELECT ROUND(SUM(final_amount), 2) AS total, DATE(created_at) AS day "
        "FROM agent_order_analysis GROUP BY DATE(created_at)"
    )
    assert "ROUND(SUM(final_amount), 2)" in guarded
    assert "DATE(created_at)" in guarded


def test_guard_rejects_select_without_from():
    with pytest.raises(SqlRejected) as excinfo:
        validate_and_scope("SELECT 1")
    assert excinfo.value.code == "QUERY_SHAPE_FORBIDDEN"
