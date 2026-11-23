# ADR 0002: Two independent layers for read-only SQL

- Status: accepted
- Date: 2026-11-23

## Context

The analysis feature lets a user ask a question in natural language; the model writes SQL that is
executed against business data. A prompt instruction such as "only produce SELECT statements" is a
suggestion, not a control. A single parser bug must not become a data-loss incident, and a query
that is technically read-only can still read another store's rows or scan for minutes.

## Decision

Read-only analysis is enforced by layers that fail independently:

| Layer | Implementation | Failure it contains |
| --- | --- | --- |
| Parser allowlist | `sqlglot` AST validation in `app/guard/sql_guard.py` | DDL, DML, stacked statements, forbidden functions |
| Object allowlist | Only the `agent_*` analysis views and their columns | Reading base tables or unknown schema |
| Scope injection | `AND store_id = :__agent_store_id` appended by the guard | Cross-store reads |
| Read-only account | `bi_agent_ro` with `SELECT` on the views only | Any write that reaches the database |
| Session limits | `TRANSACTION READ ONLY`, `MAX_EXECUTION_TIME`, row cap | Long scans and unbounded result sets |

The model never chooses the database account, the limits or the store. Those come from configuration
and from the verified principal.

## Consequences

Positive:

- A parser bypass alone is not enough to write data.
- A query that passes the parser but targets the wrong store is still scoped by a bound parameter.
- Runaway queries fail at the time limit instead of exhausting the connection pool.
- Rejections produce stable error codes, which the console and the tests assert.

Negative:

- Two places to maintain: the allowlist and the database grants.
- Legitimate questions about tables outside the views must be answered by adding a view, not by
  loosening the guard.
- The danger of drift: a new view needs its grant and its allowlist entry in the same change.

## Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Prompt-only restriction | No enforcement; one wording change defeats it |
| Read-write account with a `LIMIT` | A mistake becomes an incident |
| Static query templates only | Cannot answer open-ended questions |
| Query review by a second model | Adds latency and a second failure mode without a guarantee |

## Enforcement

- `services/agent/tests/test_sql_guard.py` covers parser behaviour.
- `services/agent/tests/test_sql_database_security.py` asserts the read-only account cannot read base
  tables or write, and that a guarded query cannot read another store.
- `benchmarks/run_sql_security_eval.py` replays the attack dataset against a real database.
