# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-23

First public release.

### Added

- **Shift reconciliation agent** (`services/agent`): LangGraph workflow that collects shift
  evidence, retrieves the matching SOP, produces a deterministic reconciliation report and asks
  the model only for an explanation. Figures are never produced by the model.
- **Read-only SQL analysis** (`services/agent`): SQL AST allowlist, dedicated read-only database
  account, analysis views, row limit and server-side timeout; the guard appends the store scope
  to every query.
- **RAG knowledge base** (`services/knowledge-base`): hybrid retrieval (vector + BM25 + RRF),
  tenant isolation through request headers, document-level ACL, citation validation and SSE chat
  streaming.
- **Admin console** (`apps/admin-web`): reconciliation console with run trace, deterministic
  report, SOP citations, follow-up questions and read-only SQL analysis panel.
- **Benchmarks** (`benchmarks`): reconciliation golden dataset and SQL attack dataset with
  runner scripts.
- **Documentation**: architecture, security model, API reference, ADRs, guides and product
  screenshots.

### Changed

- Repository reorganised from a mixed layout into `services/`, `apps/`, `benchmarks/`,
  `deploy/` and `docs/`.
- Business applications moved under `apps/` with descriptive names.
- Product renamed to **VenueIQ**; positioning broadened from billiards venues to multi-venue
  operations covering billiards clubs, KTV rooms and board-game lounges.

### Security

- Invalid `GIT_SHA` requests now return a JSON `503` instead of an HTML error page.
- Prompt-injection text found in retrieved documents cannot alter computed values or trigger
  write operations.

[0.1.0]: https://github.com/dengyouming163/billiards-ai/releases/tag/v0.1.0
