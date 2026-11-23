# Contributing to billiards-ai

Thanks for your interest. This document covers the workflow, coding standards and the
checks a change must pass before it can be merged.

## Before you start

- Search existing issues and pull requests before opening a new one.
- For anything larger than a bug fix, open an issue first so the approach can be agreed on.
- Security issues must **not** be reported as public issues. See [SECURITY.md](SECURITY.md).

## Development setup

| Service | Directory | Runtime |
| --- | --- | --- |
| Agent API | `services/agent` | Python 3.11+ |
| Knowledge base | `services/knowledge-base` | Python 3.11+ |
| Admin console | `apps/admin-web` | Node 20 + pnpm |
| Business API | `apps/api` | PHP 8.2 + Composer |

Local ports used by the project:

| Port | Service |
| --- | --- |
| 3000 / 3001 | Next.js apps |
| 10002 | ThinkPHP API |
| 8100 | Agent API |
| 8101 | Knowledge base API |
| 13306 | MySQL |
| 15432 | PostgreSQL |

Start the datastores first:

```bash
docker compose -f deploy/docker/compose.test.yml up -d
```

Then install the service you are working on:

```bash
cd services/agent
python -m venv .venv
.venv/bin/pip install -e ".[dev]"        # Windows: .venv\Scripts\pip.exe
cp .env.example .env
```

```bash
cd apps/admin-web
pnpm install
cp .env.example .env.local
```

## Branches and commits

- Branch from `main`, use a descriptive name: `feat/rag-rerank`, `fix/sql-timeout`.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Keep a commit focused on one change. Do not mix formatting-only edits with behaviour changes.

## Tests you must run

Run the suite that covers the area you touched. All commands are run from the directory
listed below.

```bash
# Agent
cd services/agent
.venv/bin/python -m pytest -q

# Admin console
cd apps/admin-web
pnpm run ts-check
pnpm exec vitest run

# Business API
cd apps/api
php vendor/bin/phpunit --testsuite Characterization
php vendor/bin/phpunit --testsuite Integration
```

Rules:

- Do not weaken or delete an assertion to make a test pass.
- Do not skip a failing test with `@pytest.mark.skip` unless the issue is documented and linked.
- A bug fix needs a regression test that fails before the fix and passes after it.

## Pull request checklist

- [ ] The change is scoped to one problem and the description explains why it is needed.
- [ ] Relevant tests pass locally; the commands and output are pasted in the PR.
- [ ] New behaviour is covered by tests.
- [ ] Documentation is updated when behaviour, configuration or interfaces change.
- [ ] No secrets, tokens, credentials or personal data are included.
- [ ] No unrelated formatting churn.

## Documentation conventions

- Architecture documents live in `docs/architecture/`, reference material in `docs/reference/`,
  step-by-step guides in `docs/guides/`, and decisions in `docs/adr/`.
- Every decision record states context, decision, consequences and the alternatives considered.
- Screenshots go to `docs/screenshots/<area>/` in PNG format at 1280×800.

## License

By contributing you agree that your contributions are licensed under the Apache License 2.0.
