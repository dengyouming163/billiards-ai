# Evaluation

Two quality gates live in `benchmarks/`. Both run without a model: they measure the deterministic
rules and the SQL guard, so a failure is a real regression rather than model variance.

## Reconciliation gate

```bash
python benchmarks/run_reconciliation_eval.py
```

| Item | Value |
| --- | --- |
| Dataset | `benchmarks/datasets/reconciliation_golden.json` |
| Fixtures | `services/agent/tests/fixtures/evidence/` |
| Output | `benchmarks/results/m1-reconciliation.json` |
| Exit code | `0` pass, `1` mismatch |

What it checks:

- Every case in the golden dataset is reconciled and compared field by field.
- Every numeric value in the report is backed by an evidence reference that resolves to a real
  source identifier.
- `insufficient_data` semantics hold: a missing snapshot field must surface an unknown item, not a
  zero.
- Repeating the run produces identical output, so the report is deterministic.

Options:

| Flag | Default | Meaning |
| --- | --- | --- |
| `--dataset` | `benchmarks/datasets/reconciliation_golden.json` | Dataset path relative to the repository root |
| `--output` | `benchmarks/results/m1-reconciliation.json` | Report path relative to the repository root |
| `--repeats` | `20` | Repetitions used to measure in-process latency |

Latency numbers are in-process rule evaluation, not production latency, and the report says so.

Latest local result:

```text
reconciliation eval: PASSED
cases=13 exact=13/13 ref_coverage=100.00%
anomaly_recall=100.00% false_positive_rate=0.00%
```

## SQL security gate

```bash
python benchmarks/run_sql_security_eval.py
```

| Item | Value |
| --- | --- |
| Dataset | `benchmarks/datasets/sql_attacks.json` |
| Output | `benchmarks/results/m1-sql-security.json` |
| Requires | MySQL from `deploy/docker/compose.test.yml` |

What it checks:

- Every attack in the dataset is rejected by the guard with the recorded error code.
- Every legal aggregate passes and is rewritten with a `LIMIT` and the server-side store scope.
- The read-only account cannot read base tables and cannot write.
- The read-only account's grants cover only the `agent_*` views.

Use `--skip-database` to run only the parser gates when MySQL is unavailable. Database gates are
then reported as skipped, which is not a pass.

Connection strings default to the Compose test values and can be overridden with
`BILLIARDS_MYSQL_RO_URL` and `BILLIARDS_MYSQL_ADMIN_URL`.

## Unit and integration suites

```bash
cd services/agent && python -m pytest -q                 # 204 tests
cd apps/admin-web && pnpm exec vitest run                # 13 tests
cd apps/api && php vendor/bin/phpunit --testsuite Characterization
cd apps/api && php vendor/bin/phpunit --testsuite Integration
```

## Interpreting results

| Observation | Meaning |
| --- | --- |
| Reconciliation exact match below 100% | A rule changed behaviour; inspect the differing field |
| Reference coverage below 100% | A value was produced without a resolvable evidence reference |
| False positive rate above 0 | A rule flags a difference that is not real |
| Attack accepted by the guard | Security regression; do not ship |
| Legal aggregate rejected | The allowlist is too strict; fix the allowlist, not the test |

Never adjust a dataset expectation to make a gate pass. A change to expected values is a change to
the contract and needs its own review.
