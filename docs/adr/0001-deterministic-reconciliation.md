# ADR 0001: Deterministic reconciliation, model explains only

- Status: accepted
- Date: 2026-11-23

## Context

A shift reconciliation report is used to decide whether cash is short and whether a manager must
review the shift. A wrong number is a financial error, not a bad answer. Large language models
produce plausible text but are not reliable arithmetic engines, and their output varies between
runs with the same input.

## Decision

The report is produced by deterministic rules in `services/agent/app/domain/reconciliation.py`.
Every total, difference and uncertainty item is computed from an evidence payload and references the
source identifiers it came from. The model is called afterwards, in the `narrate` node, and may only
produce:

- a one-sentence summary,
- up to a few review suggestions,
- citation identifiers that must exist in the retrieved SOP hits.

The narrative is rejected as a whole if it is not a JSON object with those fields. Rejection marks
the run `degraded` but leaves the report untouched.

## Consequences

Positive:

- The same shift always produces the same figures.
- A model outage cannot change a financial result.
- Every number is traceable to evidence, which is what an auditor needs.
- The narrative can be regenerated or improved without re-running the rules.

Negative:

- Two code paths to maintain: rules and narration.
- The narrative cannot correct a rule that is wrong; the rule must be fixed.
- Users see a degraded state when the model is unavailable, which is visible but less polished.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Let the model compute totals from raw evidence | Not reproducible; arithmetic errors are silent |
| Let the model repair rule output | Blurs responsibility and hides rule bugs |
| Drop the narrative entirely | Loses the explanation and review suggestions that make the report usable |

## Enforcement

- `services/agent/tests/test_reconciliation_rules.py` pins rule behaviour.
- `benchmarks/run_reconciliation_eval.py` fails on any field mismatch or missing evidence reference.
- `services/agent/tests/test_reconciliation_degradation.py` asserts the report survives model
  failure and invalid output.
