# Architecture Overview

VenueIQ is an AI-first operations platform for multi-venue operators — billiards clubs, KTV rooms
and board-game lounges — where revenue comes from time, from people and from goods. It has three
capability lines, each with a different correctness requirement.

| Capability | Service | Correctness requirement | Model role |
| --- | --- | --- | --- |
| Shift reconciliation | `services/agent` | Figures must be exact and reproducible | Explains a report it did not compute |
| Read-only SQL analysis | `services/agent` | Must never mutate data or cross store scope | Writes a candidate query that is then guarded |
| SOP knowledge retrieval | `services/knowledge-base` | Must respect tenant and document ACL | Rewrites, answers, cites |

## Why the split matters

The three lines fail differently, so they are isolated in code and in process boundaries:

- A model outage must not change a reconciliation figure. The report is computed by deterministic
  rules; the model only produces prose and review suggestions.
- An analysis query must be validated by a parser, not by a prompt. A prompt that says "only read"
  is not a control; an AST allowlist plus a read-only database account is.
- A retrieval answer must cite chunks that were actually retrieved for that request. Citations are
  checked against the retrieval result before they are shown.

## Component map

```text
┌──────────────────────────────┐
│ apps/admin-web (Next.js)     │
│ finance console, agent trace │
└──────────────┬───────────────┘
               │ Bearer token
┌──────────────▼───────────────┐        ┌──────────────────────────┐
│ apps/api (ThinkPHP)          │◄───────┤ agent.Auth/context       │
│ store scoped business data   │        │ resolves Principal       │
└──────────────┬───────────────┘        └────────────▲─────────────┘
               │ evidence                            │ identity
┌──────────────▼─────────────────────────────────────┴─────────────┐
│ services/agent (FastAPI + LangGraph)                             │
│  reconciliation graph │ sql analysis graph │ knowledge graph     │
│  guard/ (identity, sql_guard)   tools/ (billiards, rag, sql)      │
└──────────┬───────────────────────────────┬───────────────────────┘
           │ SQL (read-only account)       │ POST /v1/kbs/{id}/search
┌──────────▼───────────┐        ┌──────────▼───────────────────────┐
│ MySQL                │        │ services/knowledge-base (FastAPI) │
│ business + views     │        │ PostgreSQL + pgvector + BM25      │
└──────────────────────┘        └──────────────────────────────────┘
```

## Request lifecycle

1. The browser sends a Bearer token and a store identifier.
2. `services/agent` resolves the caller through the PHP `agent.Auth/context` endpoint. Tenant,
   employee, role, permissions and store access come from that response only.
3. The selected graph runs. Tool calls that need business data go back through `apps/api` with the
   caller's token; the model never receives the token.
4. The run and its events are persisted so the console can replay the trace after the stream ends.
5. The response is streamed as SSE events and ends with a terminal `completed` or `failed` event.

## Failure policy

| Failure | Behaviour |
| --- | --- |
| Model unavailable during reconciliation | Report is returned; narrative is marked degraded |
| Model returns non-JSON narrative | Report is returned; narrative is marked degraded |
| Retrieval returns no SOP hits | Report is returned with an empty citation list |
| SQL guard rejects a query | Run fails with a stable error code, no query is executed |
| Identity cannot be resolved | `401`/`403`/`502`, no run is created |

Degradation is visible in the API response and in the console. It never silently substitutes
fabricated values.

## Repository layout

```text
services/agent            FastAPI + LangGraph, reconciliation / analysis / knowledge
services/knowledge-base   RAG service: ingestion, hybrid retrieval, chat
apps/admin-web            Next.js admin console with the agent panel
apps/api                  ThinkPHP business API and reconciliation evidence endpoint
apps/pos-web              Point of sale terminal
apps/tablet-web           Table screen application
apps/mobile-web           Mobile staff application
apps/realtime-gateway     WebSocket gateway
benchmarks                Golden datasets and evaluation runners
deploy                    Compose file, MySQL init, nginx and systemd units
docs                      Architecture, guides, reference, ADRs, screenshots
```
