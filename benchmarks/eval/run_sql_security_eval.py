"""M1 SQL security quality gate.

Checks the two defence layers with real execution:

1. AST guard: every attack in ``sql_attacks.json`` must be rejected with the
   recorded code; every legal aggregate must pass and be rewritten with a
   ``LIMIT`` and the server-side ``store_id`` scope.
2. MySQL identity: the read-only account must be unable to read base tables or
   write anything, and its grants must cover only the three ``agent_*`` views.

Legal aggregate results are executed against the test MySQL instance. Seeded
rows use synthetic ``store-a``/``store-b`` values and are removed afterwards.
No model is called; model usage is therefore reported as null.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import subprocess
import sys
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

REPO_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = REPO_ROOT / "agent"
sys.path.insert(0, str(AGENT_ROOT))

from app.guard.sql_guard import SqlRejected, validate_and_scope  # noqa: E402
from app.tools.sql_executor import execute_guarded_query  # noqa: E402

EVAL_VERSION = "m1-sql-security-eval/v1"
RO_DEFAULT = "mysql+mysqlconnector://bi_agent_ro:test-readonly-only@127.0.0.1:13306/billiards_test"
ADMIN_DEFAULT = "mysql+mysqlconnector://billiards:test-billiards-only@127.0.0.1:13306/billiards_test"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def git_state() -> dict[str, Any]:
    sha = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    ).stdout.strip()
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    ).stdout.strip()
    return {"sha": sha or None, "dirty": bool(status)}


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(ratio * (len(ordered) - 1))))
    return round(ordered[index], 3)


def dbapi_code(exc: DBAPIError) -> int | None:
    args = getattr(exc.orig, "args", None)
    if args and isinstance(args[0], int):
        return args[0]
    return None


def check_guard_attacks(attacks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results = []
    for attack in attacks:
        started = time.perf_counter()
        actual_code: str | None = None
        accepted_sql: str | None = None
        try:
            accepted_sql = validate_and_scope(attack["sql"])
        except SqlRejected as exc:
            actual_code = exc.code
        latency = (time.perf_counter() - started) * 1000
        passed = actual_code == attack["expected_code"]
        results.append(
            {
                "id": attack["id"],
                "category": attack["category"],
                "expected_code": attack["expected_code"],
                "actual_code": actual_code,
                "passed": passed,
                "rejected": actual_code is not None,
                "accepted_sql": accepted_sql,
                "latency_ms": round(latency, 3),
            }
        )
    return results


def check_database_attacks(
    attacks: list[dict[str, Any]], engine: Engine
) -> list[dict[str, Any]]:
    results = []
    for attack in attacks:
        started = time.perf_counter()
        actual_code: int | None = None
        error: str | None = None
        succeeded = False
        try:
            with engine.connect() as connection:
                connection.exec_driver_sql(attack["sql"])
                succeeded = True
                connection.rollback()
        except DBAPIError as exc:
            actual_code = dbapi_code(exc)
            error = str(exc.orig)
        except SQLAlchemyError as exc:  # pragma: no cover - defensive
            error = str(exc)
        latency = (time.perf_counter() - started) * 1000
        passed = not succeeded and actual_code in attack["expected_mysql_error"]
        results.append(
            {
                "id": attack["id"],
                "category": attack["category"],
                "expected_mysql_error": attack["expected_mysql_error"],
                "actual_mysql_error": actual_code,
                "passed": passed,
                "error": error,
                "latency_ms": round(latency, 3),
            }
        )
    return results


def check_grants(engine: Engine) -> dict[str, Any]:
    with engine.connect() as connection:
        grants = [
            row[0] for row in connection.exec_driver_sql("SHOW GRANTS FOR CURRENT_USER()")
        ]
    select_grants = [grant for grant in grants if grant.startswith("GRANT SELECT ON")]
    passed = (
        len(select_grants) == 3
        and all("agent_" in grant for grant in select_grants)
        and not any("bi_busi_" in grant for grant in grants)
        and not any("`billiards_test`.*" in grant for grant in grants)
    )
    return {
        "grants": grants,
        "select_grant_count": len(select_grants),
        "passed": passed,
    }


def seed_synthetic_rows(admin: Engine, prefix: str) -> dict[str, Any]:
    order_ids = {
        "store-a": [f"{prefix}-a1", f"{prefix}-a2"],
        "store-b": [f"{prefix}-b1"],
    }
    recharge_ids = [f"{prefix}-r1", f"{prefix}-r2", f"{prefix}-r3"]
    amounts = {"store-a": [("10.00", "2.00"), ("20.00", "3.00")], "store-b": [("99.00", "0.00")]}

    with admin.begin() as connection:
        for store_id, ids in order_ids.items():
            for index, order_id in enumerate(ids):
                connection.execute(
                    text(
                        "INSERT INTO bi_busi_order "
                        "(id, store_id, order_no, type, status, final_amount, cash_paid, created_at) "
                        "VALUES (:id, :store_id, :order_no, 'table', 'completed', :amount, :amount, "
                        "'2026-01-01 12:00:00')"
                    ),
                    {
                        "id": order_id,
                        "store_id": store_id,
                        "order_no": f"{prefix}-{store_id}-{index}",
                        "amount": Decimal("11.00") + index,
                    },
                )

        cursor = 0
        for store_id, rows in amounts.items():
            for amount, gift in rows:
                connection.execute(
                    text(
                        "INSERT INTO bi_busi_member_recharge "
                        "(id, member_id, store_id, order_no, amount, gift_amount, payment_method, "
                        "operator_id, remark, created_at, status) "
                        "VALUES (:id, 'eval-member', :store_id, :order_no, :amount, :gift, "
                        "'cash', :operator_id, '', '2026-01-01 12:00:00', 1)"
                    ),
                    {
                        "id": recharge_ids[cursor],
                        "store_id": store_id,
                        "order_no": f"{prefix}-recharge-{cursor}",
                        "amount": Decimal(amount),
                        "gift": Decimal(gift),
                        "operator_id": prefix,
                    },
                )
                cursor += 1

    return {
        "prefix": prefix,
        "order_ids": order_ids,
        "recharge_ids": recharge_ids,
    }


def cleanup_synthetic_rows(admin: Engine, prefix: str) -> None:
    with admin.begin() as connection:
        connection.execute(
            text("DELETE FROM bi_busi_order WHERE order_no LIKE :pattern"),
            {"pattern": f"{prefix}%"},
        )
        connection.execute(
            text("DELETE FROM bi_busi_member_recharge WHERE order_no LIKE :pattern"),
            {"pattern": f"{prefix}%"},
        )


def check_legal_cases(
    cases: list[dict[str, Any]],
    engine: Engine,
    seeded: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    results = []
    for case in cases:
        prefix = seeded["prefix"] if seeded else ""
        sql = case["sql"].replace("__PREFIX__", prefix)
        must_contain = [value.replace("__PREFIX__", prefix) for value in case["must_contain"]]

        started = time.perf_counter()
        record: dict[str, Any] = {
            "id": case["id"],
            "execution": case["execution"],
            "guard_passed": False,
            "execution_passed": False,
            "passed": False,
        }
        try:
            guarded = validate_and_scope(sql)
            record["guarded_sql"] = guarded
            missing = [value for value in must_contain if value not in guarded]
            record["missing_assertions"] = missing
            record["guard_passed"] = not missing
            if not record["guard_passed"]:
                results.append(record)
                continue
        except SqlRejected as exc:
            record["rejected_code"] = exc.code
            results.append(record)
            continue

        try:
            outcome = execute_guarded_query(guarded, "store-a", engine=engine)
            record["columns"] = outcome.columns
            record["row_count"] = outcome.row_count
            record["rows"] = [
                {key: str(value) if isinstance(value, Decimal) else value for key, value in row.items()}
                for row in outcome.rows[:5]
            ]
            problems: list[str] = []
            if outcome.columns != case["expected_columns"]:
                problems.append(
                    f"columns {outcome.columns} != {case['expected_columns']}"
                )
            if outcome.row_count > 200:
                problems.append(f"row_count {outcome.row_count} exceeds the cap")

            expected_all_store = case.get("expected_all_store")
            if expected_all_store:
                foreign = [row for row in outcome.rows if row.get("store_id") != expected_all_store]
                if foreign:
                    problems.append(f"{len(foreign)} rows leaked outside {expected_all_store}")

            if case["execution"] == "seeded-orders" and seeded:
                returned = {row["order_id"] for row in outcome.rows}
                missing_seed = set(seeded["order_ids"]["store-a"]) - returned
                if missing_seed:
                    problems.append(f"seeded store-a orders missing: {sorted(missing_seed)}")
                leaked = set(seeded["order_ids"]["store-b"]) & returned
                if leaked:
                    problems.append(f"store-b orders leaked: {sorted(leaked)}")

            if case["execution"] == "seeded-recharges":
                expected_rows = case.get("expected_rows")
                if expected_rows is not None and outcome.row_count != expected_rows:
                    problems.append(
                        f"row_count {outcome.row_count} != expected {expected_rows}"
                    )
                expected_values = case.get("expected_values", {})
                if outcome.rows:
                    row = outcome.rows[0]
                    for key, expected in expected_values.items():
                        actual = row.get(key)
                        if key == "recharge_count":
                            equal = actual is not None and int(actual) == int(expected)
                        elif key == "store_id":
                            equal = actual == expected
                        else:
                            equal = actual is not None and Decimal(str(actual)) == Decimal(str(expected))
                        if not equal:
                            problems.append(f"{key} {actual} != {expected}")
                else:
                    problems.append("no aggregate row returned")

            record["problems"] = problems
            record["execution_passed"] = not problems
        except SQLAlchemyError as exc:  # includes SqlExecutionError
            record["problems"] = [f"execution error: {exc}"]
        except Exception as exc:  # noqa: BLE001 - report, do not hide
            record["problems"] = [f"execution error: {exc}"]

        record["latency_ms"] = round((time.perf_counter() - started) * 1000, 3)
        record["passed"] = record["guard_passed"] and record["execution_passed"]
        results.append(record)
    return results


def _count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        value = item.get(key, "unknown")
        counts[value] = counts.get(value, 0) + 1
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default="eval/datasets/sql_attacks.json")
    parser.add_argument("--output", default="eval/results/m1-sql-security.json")
    parser.add_argument(
        "--skip-database",
        action="store_true",
        help="run only the AST guard gates (database gates are reported as skipped)",
    )
    args = parser.parse_args()

    dataset_path = (REPO_ROOT / args.dataset).resolve()
    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    guard_attacks = payload["guard_attacks"]
    database_attacks = payload["database_attacks"]
    legal_cases = payload["legal"]

    guard_results = check_guard_attacks(guard_attacks)

    database_results: list[dict[str, Any]] = []
    grants: dict[str, Any] | None = None
    legal_results: list[dict[str, Any]] = []
    database_checks = "skipped"
    database_setup_error: str | None = None
    seeded: dict[str, Any] | None = None
    ro_engine: Engine | None = None
    admin_engine: Engine | None = None

    if not args.skip_database:
        ro_url = os.environ.get("BILLIARDS_MYSQL_RO_URL", RO_DEFAULT)
        admin_url = os.environ.get("BILLIARDS_MYSQL_ADMIN_URL", ADMIN_DEFAULT)
        try:
            ro_engine = create_engine(ro_url, pool_pre_ping=True)
            with ro_engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            admin_engine = create_engine(admin_url, pool_pre_ping=True)
            with admin_engine.connect() as connection:
                connection.execute(text("SELECT 1"))

            database_checks = "executed"
            database_results = check_database_attacks(database_attacks, ro_engine)
            grants = check_grants(ro_engine)
            prefix = f"EVAL-{uuid.uuid4().hex[:8]}"
            seeded = seed_synthetic_rows(admin_engine, prefix)
            legal_results = check_legal_cases(legal_cases, ro_engine, seeded)
        except SQLAlchemyError as exc:
            database_setup_error = str(exc)
            database_checks = "failed"
        finally:
            if seeded and admin_engine is not None:
                try:
                    cleanup_synthetic_rows(admin_engine, seeded["prefix"])
                except SQLAlchemyError as exc:  # pragma: no cover - cleanup guard
                    database_setup_error = f"cleanup failed: {exc}"
            if ro_engine is not None:
                ro_engine.dispose()
            if admin_engine is not None:
                admin_engine.dispose()
    else:
        # Guard-only run still validates the legal rewrites, just without rows.
        for case in legal_cases:
            try:
                guarded = validate_and_scope(case["sql"].replace("__PREFIX__", ""))
                missing = [
                    value.replace("__PREFIX__", "")
                    for value in case["must_contain"]
                    if value.replace("__PREFIX__", "") not in guarded
                ]
                legal_results.append(
                    {
                        "id": case["id"],
                        "execution": case["execution"],
                        "guard_passed": not missing,
                        "execution_passed": None,
                        "missing_assertions": missing,
                        "passed": not missing,
                        "problems": ["database checks skipped"] if missing else [],
                    }
                )
            except SqlRejected as exc:
                legal_results.append(
                    {
                        "id": case["id"],
                        "execution": case["execution"],
                        "guard_passed": False,
                        "execution_passed": False,
                        "rejected_code": exc.code,
                        "passed": False,
                    }
                )

    def rate(items: list[dict[str, Any]]) -> float:
        return sum(1 for item in items if item["passed"]) / len(items) if items else 0.0

    guard_rate = rate(guard_results)
    database_rate = rate(database_results) if database_results else 0.0
    legal_rate = rate(legal_results)
    grant_ok = bool(grants and grants["passed"])

    gates = [
        {
            "name": "ast_guard_blocks_all_attacks",
            "passed": guard_rate == 1.0,
            "detail": f"{sum(1 for item in guard_results if item['passed'])}/{len(guard_results)} rejected with the expected code",
        },
        {
            "name": "legal_queries_pass_guard_and_execute",
            "passed": bool(legal_results) and legal_rate == 1.0,
            "detail": f"{sum(1 for item in legal_results if item['passed'])}/{len(legal_results)} legal cases passed",
        },
        {
            "name": "database_identity_blocks_all_attacks",
            "passed": (
                True
                if database_checks == "skipped"
                else database_checks == "executed" and database_rate == 1.0
            ),
            "detail": (
                f"{sum(1 for item in database_results if item['passed'])}/{len(database_results)} blocked"
                if database_checks == "executed"
                else database_checks
            ),
        },
        {
            "name": "grants_cover_only_analysis_views",
            "passed": (
                True
                if database_checks == "skipped"
                else grant_ok
            ),
            "detail": "skipped" if database_checks == "skipped" else f"select grants={grants['select_grant_count'] if grants else 'n/a'}",
        },
    ]
    if database_checks == "failed":
        gates.append(
            {
                "name": "database_reachable",
                "passed": False,
                "detail": database_setup_error or "unknown database error",
            }
        )

    passed = all(gate["passed"] for gate in gates)

    guard_latencies = [item["latency_ms"] for item in guard_results]
    execution_latencies = [
        item["latency_ms"] for item in legal_results if "latency_ms" in item and item.get("execution_passed")
    ]

    output = {
        "version": EVAL_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "passed" if passed else "failed",
        "metadata": {
            "dataset": str(dataset_path.relative_to(REPO_ROOT)).replace("\\", "/"),
            "dataset_sha256": sha256_file(dataset_path),
            "dataset_version": payload["version"],
            "business_code_git": git_state(),
            "python": platform.python_version(),
            "sample_count": len(guard_attacks) + len(database_attacks) + len(legal_cases),
            "class_distribution": {
                "guard_attacks": len(guard_attacks),
                "database_attacks": len(database_attacks),
                "legal": len(legal_cases),
            },
            "guard_categories": _count_by(guard_attacks, "category"),
            "database_checks": database_checks,
            "database_setup_error": database_setup_error,
            "model": None,
            "prompt": "none (SQL is generated outside this gate; the gate tests the defences)",
            "tools": ["sql_guard.validate_and_scope", "sql_executor.execute_guarded_query"],
            "rag_kb_id": None,
            "notes": [
                "synthetic store-a/store-b rows are inserted for legal result checks and removed afterwards",
                "the read-only URL defaults to the local test container and can be overridden by env",
                "no model tokens or cost are recorded because no model runs in this gate",
            ],
        },
        "metrics": {
            "ast_guard_block_rate": round(guard_rate, 4),
            "database_block_rate": round(database_rate, 4) if database_results else None,
            "legal_case_pass_rate": round(legal_rate, 4),
            "guard_latency_ms": {
                "samples": len(guard_latencies),
                "p50": percentile(guard_latencies, 0.5),
                "p95": percentile(guard_latencies, 0.95),
            },
            "execution_latency_ms": {
                "samples": len(execution_latencies),
                "p50": percentile(execution_latencies, 0.5),
                "p95": percentile(execution_latencies, 0.95),
            },
            "model_usage": None,
        },
        "gates": gates,
        "guard_results": guard_results,
        "database_results": database_results,
        "grants": grants,
        "legal_results": legal_results,
    }

    output_path = (REPO_ROOT / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8"
    )

    print(f"sql security eval: {'PASSED' if passed else 'FAILED'}")
    print(f"guard_block_rate={guard_rate:.2%} database_checks={database_checks}")
    print(f"legal_pass_rate={legal_rate:.2%}")
    print(f"output: {output_path}")
    for gate in gates:
        if not gate["passed"]:
            print(f"  gate failed: {gate['name']} ({gate['detail']})")
    for item in [*guard_results, *database_results, *legal_results]:
        if not item["passed"]:
            print(f"  case failed: {item['id']} {item.get('problems') or item.get('actual_code') or item.get('error')}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
