"""Golden tests for the deterministic reconciliation rules.

The fixtures are synthetic ``reconciliation-evidence/v1`` payloads shaped like
the PHP ``agent.Reconciliation/shiftEvidence`` response. Every golden case
carries a complete expected report; equality is checked field by field through
``model_dump(mode="json")`` so a status-only assertion can never pass.
"""

import copy
import json
from pathlib import Path

import pytest

from app.domain.reconciliation import Evidence, reconcile

FIXTURES_DIR = Path(__file__).parent / "fixtures" / "evidence"
GOLDEN_PATH = Path(__file__).resolve().parents[3] / "benchmarks" / "datasets" / "reconciliation_golden.json"


def load_golden() -> list[dict]:
    payload = json.loads(GOLDEN_PATH.read_text(encoding="utf-8"))
    cases = []
    for case in payload["cases"]:
        evidence = json.loads(
            (FIXTURES_DIR / case["evidence_file"]).read_text(encoding="utf-8")
        )
        cases.append({"id": case["id"], "evidence": evidence, "expected": case["expected"]})
    return cases


@pytest.mark.parametrize("case", load_golden(), ids=lambda case: case["id"])
def test_reconciliation_matches_golden(case):
    report = reconcile(Evidence.model_validate(case["evidence"]))
    assert report.model_dump(mode="json") == case["expected"]


def test_golden_has_at_least_twelve_cases():
    cases = load_golden()
    assert len(cases) >= 12
    assert len({case["id"] for case in cases}) == len(cases)


def test_every_reported_value_has_resolvable_evidence_refs():
    for case in load_golden():
        report = reconcile(Evidence.model_validate(case["evidence"]))
        known = {ref.ref_id for ref in report.evidence_refs}
        for name, value in report.recomputed.items():
            assert value.refs, f"{case['id']}:{name} has no refs"
            assert set(value.refs) <= known, f"{case['id']}:{name} points to unknown refs"
        for item in [*report.differences, *report.explained, *report.unknowns]:
            assert item.refs, f"{case['id']}:{item.code} has no refs"
            assert set(item.refs) <= known, f"{case['id']}:{item.code} points to unknown refs"


def test_empty_or_partial_evidence_never_claims_reconciled():
    for case in load_golden():
        report = reconcile(Evidence.model_validate(case["evidence"]))
        codes = {unknown.code for unknown in report.unknowns}
        if "NO_EVIDENCE" in codes or "NO_LEGACY_SNAPSHOT" in codes:
            assert report.status == "insufficient_data", case["id"]
            assert report.differences == [], case["id"]


def test_truncated_evidence_is_insufficient_data_without_differences():
    evidence = json.loads(
        (FIXTURES_DIR / "normal-single-channel.json").read_text(encoding="utf-8")
    )
    truncated = copy.deepcopy(evidence)
    truncated["meta"]["truncated"] = True

    report = reconcile(Evidence.model_validate(truncated))

    assert report.status == "insufficient_data"
    assert "EVIDENCE_TRUNCATED" in {unknown.code for unknown in report.unknowns}
    assert report.differences == []
    assert report.recomputed["order_total"].value == "80.00"
