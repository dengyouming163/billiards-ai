"""M1 reconciliation quality gate.

Runs the deterministic rules over the golden dataset and fails (exit code 1)
unless every report matches field by field, every numeric value is backed by a
resolvable evidence reference, and the insufficient-data semantics hold.

No model, RAG or network call happens here. Latency is measured in-process and
is *not* production latency; the report says so explicitly.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import re
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
AGENT_ROOT = REPO_ROOT / "services" / "agent"
FIXTURES_DIR = AGENT_ROOT / "tests" / "fixtures" / "evidence"
sys.path.insert(0, str(AGENT_ROOT))

from app.domain.reconciliation import Evidence, reconcile  # noqa: E402

EVAL_VERSION = "m1-reconciliation-eval/v1"
REPORT_SCHEMA = "reconciliation-report/v1"
MIN_CASES = 12

RULE_SOURCES: dict[str, tuple[str, ...]] = {
    "shift_scope": ("shift",),
    "legacy_snapshot": ("shift",),
    "order_totals": ("orders",),
    "order_payment_totals": ("payments",),
    "item_payment_excluded": ("payments",),
    "recharge_totals": ("recharges",),
    "recharge_cash_flow": ("cash_flows",),
    "merge_same_shift": ("orders",),
    "merge_attribution": ("orders", "payments"),
    "payment_attribution": ("payments",),
    "cash_flow_attribution": ("cash_flows",),
}


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


def _is_number(value: Any) -> bool:
    if isinstance(value, bool) or value is None:
        return False
    if isinstance(value, (int, float, Decimal)):
        return True
    return isinstance(value, str) and re.fullmatch(r"-?\d+(?:\.\d+)?", value) is not None


def numeric_claims(report: dict[str, Any]) -> list[dict[str, Any]]:
    """Every numeric output of the report plus the refs that back it."""
    claims: list[dict[str, Any]] = []

    def add(path: str, refs: list[str] | None) -> None:
        claims.append({"path": path, "refs": list(refs or [])})

    for field, value in report["legacy_summary"].items():
        if _is_number(value):
            # The frozen snapshot is one evidence object; ref-snapshot points to it.
            add(f"legacy_summary.{field}", ["ref-snapshot"])
    for name, item in report["recomputed"].items():
        if _is_number(item["value"]):
            add(f"recomputed.{name}", item["refs"])
    for index, item in enumerate(report["differences"]):
        if any(_is_number(item[key]) for key in ("legacy", "recomputed", "delta")):
            add(f"differences[{index}]", item["refs"])
    for index, item in enumerate(report["explained"]):
        if _is_number(item.get("value")):
            add(f"explained[{index}]", item["refs"])
    for index, item in enumerate(report["unknowns"]):
        if _is_number(item.get("value")):
            add(f"unknowns[{index}]", item["refs"])
    return claims


def resolution_problems(evidence: dict[str, Any], report: dict[str, Any]) -> list[str]:
    """Check every evidence ref resolves to an id that exists in the payload."""
    available = {
        "shift": {evidence["shift"]["id"]},
        "orders": {order["id"] for order in evidence.get("orders", [])},
        "payments": {payment["id"] for payment in evidence.get("payments", [])},
        "recharges": {recharge["id"] for recharge in evidence.get("recharges", [])},
        "cash_flows": {flow["id"] for flow in evidence.get("cash_flows", [])},
    }
    problems: list[str] = []
    for ref in report["evidence_refs"]:
        collections = RULE_SOURCES.get(ref["rule_id"])
        if not collections:
            problems.append(f"{ref['ref_id']}: unknown rule {ref['rule_id']}")
            continue
        allowed: set[str] = set()
        for name in collections:
            allowed.update(available[name])
        for source_id in ref["source_ids"]:
            if source_id not in allowed:
                problems.append(f"{ref['rule_id']}: {source_id} not in evidence")
    return problems


def check_case(case: dict[str, Any], repeats: int) -> dict[str, Any]:
    evidence_path = FIXTURES_DIR / case["evidence_file"]
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    expected = case["expected"]

    # One warm-up pass keeps first-call import noise out of the latency sample.
    reconcile(Evidence.model_validate(evidence))

    samples: list[float] = []
    report: dict[str, Any] | None = None
    for _ in range(repeats):
        started = time.perf_counter()
        report = reconcile(Evidence.model_validate(evidence)).model_dump(mode="json")
        samples.append((time.perf_counter() - started) * 1000)
    assert report is not None

    known_refs = {ref["ref_id"] for ref in report["evidence_refs"]}
    claims = numeric_claims(report)
    covered = [claim for claim in claims if claim["refs"] and set(claim["refs"]) <= known_refs]
    unresolved = resolution_problems(evidence, report)
    exact_match = report == expected
    expected_status = expected["status"]
    actual_status = report["status"]

    return {
        "id": case["id"],
        "expected_status": expected_status,
        "actual_status": actual_status,
        "exact_match": exact_match,
        "difference_count": len(report["differences"]),
        "unknown_codes": sorted({item["code"] for item in report["unknowns"]}),
        "numeric_claims": len(claims),
        "covered_claims": len(covered),
        "unresolved_refs": unresolved,
        "latency_ms": round(statistics.median(samples), 3),
        "mismatched_top_level": [
            key
            for key in ("status", "legacy_summary", "recomputed", "differences", "explained", "unknowns", "evidence_refs")
            if report.get(key) != expected.get(key)
        ],
    }


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(ratio * (len(ordered) - 1))))
    return round(ordered[index], 3)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default="benchmarks/datasets/reconciliation_golden.json")
    parser.add_argument("--output", default="benchmarks/results/m1-reconciliation.json")
    parser.add_argument("--repeats", type=int, default=20)
    args = parser.parse_args()

    dataset_path = (REPO_ROOT / args.dataset).resolve()
    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    cases = payload["cases"]

    results = [check_case(case, max(1, args.repeats)) for case in cases]

    total = len(results)
    exact_matches = sum(1 for item in results if item["exact_match"])
    total_claims = sum(item["numeric_claims"] for item in results)
    covered_claims = sum(item["covered_claims"] for item in results)
    unresolved = [f"{item['id']}: {problem}" for item in results for problem in item["unresolved_refs"]]

    anomaly_cases = [item for item in results if item["expected_status"] != "ok"]
    ok_cases = [item for item in results if item["expected_status"] == "ok"]
    anomaly_recall = (
        sum(1 for item in anomaly_cases if item["actual_status"] == item["expected_status"])
        / len(anomaly_cases)
        if anomaly_cases
        else 1.0
    )
    false_positive_rate = (
        sum(1 for item in ok_cases if item["actual_status"] != "ok") / len(ok_cases)
        if ok_cases
        else 0.0
    )

    status_counts: dict[str, int] = {}
    for item in results:
        status_counts[item["expected_status"]] = status_counts.get(item["expected_status"], 0) + 1

    latencies = [item["latency_ms"] for item in results]
    coverage = covered_claims / total_claims if total_claims else 0.0

    gates = [
        {
            "name": "golden_dataset_size",
            "passed": total >= MIN_CASES,
            "detail": f"{total} cases (minimum {MIN_CASES})",
        },
        {
            "name": "golden_exact_report_match",
            "passed": exact_matches == total,
            "detail": f"{exact_matches}/{total} reports match field by field",
        },
        {
            "name": "numeric_evidence_ref_coverage",
            "passed": coverage == 1.0,
            "detail": f"{covered_claims}/{total_claims} numeric claims carry resolvable refs",
        },
        {
            "name": "evidence_ref_resolution",
            "passed": not unresolved,
            "detail": "every ref source id exists in the evidence payload" if not unresolved else f"{len(unresolved)} unresolved",
        },
        {
            "name": "insufficient_data_never_matched",
            "passed": all(
                item["difference_count"] == 0
                for item in results
                if item["expected_status"] == "insufficient_data"
            ),
            "detail": "insufficient_data cases never emit differences",
        },
    ]

    passed = all(gate["passed"] for gate in gates)
    output = {
        "version": EVAL_VERSION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "status": "passed" if passed else "failed",
        "metadata": {
            "dataset": str(dataset_path.relative_to(REPO_ROOT)).replace("\\", "/"),
            "dataset_sha256": sha256_file(dataset_path),
            "report_schema_version": REPORT_SCHEMA,
            "business_code_git": git_state(),
            "python": platform.python_version(),
            "sample_count": total,
            "class_distribution": status_counts,
            "model": None,
            "prompt": "none (deterministic rules, model never touches numbers)",
            "tools": [],
            "rag_kb_id": None,
            "notes": [
                "synthetic store-a/store-b fixtures only; no authorized historical production data",
                "latency is in-process rule execution, not HTTP/RAG/model time",
                "model tokens/cost are null because no model participates in reconciliation",
            ],
        },
        "metrics": {
            "exact_report_match_rate": round(exact_matches / total, 4) if total else 0.0,
            "anomaly_recall": round(anomaly_recall, 4),
            "false_positive_rate": round(false_positive_rate, 4),
            "evidence_ref_coverage": round(coverage, 4),
            "unresolved_ref_count": len(unresolved),
            "tool_selection_accuracy": None,
            "tool_selection_note": "the fixed graph selects no model-driven tools",
            "latency_ms": {
                "samples": total,
                "repeats_per_case": max(1, args.repeats),
                "p50": percentile(latencies, 0.5),
                "p95": percentile(latencies, 0.95),
                "max": round(max(latencies), 3) if latencies else 0.0,
                "scope": "in-process rules only",
            },
            "model_usage": None,
        },
        "gates": gates,
        "cases": results,
    }

    output_path = (REPO_ROOT / args.output).resolve()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"reconciliation eval: {'PASSED' if passed else 'FAILED'}")
    print(f"cases={total} exact={exact_matches}/{total} ref_coverage={coverage:.2%}")
    print(f"anomaly_recall={anomaly_recall:.2%} false_positive_rate={false_positive_rate:.2%}")
    print(f"latency_ms p50={percentile(latencies, 0.5)} p95={percentile(latencies, 0.95)}")
    print(f"output: {output_path}")
    if unresolved:
        for problem in unresolved:
            print(f"  unresolved ref: {problem}")
    for item in results:
        if not item["exact_match"]:
            print(f"  mismatch: {item['id']} sections={item['mismatched_top_level']}")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
