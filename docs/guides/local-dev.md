# Local Development

## Port map

| Port | Component | Notes |
| --- | --- | --- |
| 3000 | `apps/admin-web` production start | `next start` default |
| 3001 | `apps/admin-web` dev server | `pnpm run dev:win` |
| 3306 / 13306 | MySQL | Compose maps 13306 on the host |
| 5432 / 15432 | PostgreSQL | Compose maps 15432 on the host |
| 8100 | `services/agent` | FastAPI |
| 8101 | `services/knowledge-base` | FastAPI |
| 10002 | `apps/api` | PHP built-in server or nginx |

Do not expose 8100, 8101, 13306 or 15432 on a public interface. In the demo deployment they bind to
`127.0.0.1` and nginx is the only entry point.

## Environment files

| File | Purpose | Committed |
| --- | --- | --- |
| `services/agent/.env.example` | Template with test datastore URLs | yes |
| `services/agent/.env` | Local values | no |
| `services/knowledge-base/.env.example` | Template | yes |
| `services/knowledge-base/.env` | Local values | no |
| `apps/admin-web/.env.local` | Frontend API base URLs | no |

Copy the template, never edit the example in place:

```bash
cp services/agent/.env.example services/agent/.env
```

The agent reads its settings through `pydantic-settings`, so an unknown key is ignored but a missing
required key (`AGENT_DATABASE_URL`) fails at startup with a validation error.

## Datastores

```bash
docker compose -f deploy/docker/compose.test.yml up -d
docker compose -f deploy/docker/compose.test.yml logs -f mysql
```

Reset everything, including seeded rows:

```bash
docker compose -f deploy/docker/compose.test.yml down -v
docker compose -f deploy/docker/compose.test.yml up -d
```

`down -v` deletes the volumes. The init scripts run again on the next start.

## Agent

```bash
cd services/agent
uvicorn app.main:app --host 127.0.0.1 --port 8100 --reload
```

Useful endpoints:

| Endpoint | Purpose |
| --- | --- |
| `/health/live` | Process is up |
| `/health/ready` | Database, checkpoint and migration state |
| `/v1/runs/{run_id}` | Stored run, used by the trace view |

Notes:

- Model access is configured with `MODEL_BASE_URL`, `MODEL_API_KEY` and `MODEL_NAME`. Any
  OpenAI-compatible endpoint works; a local stub is enough for UI work.
- SQL analysis uses `BILLIARDS_MYSQL_RO_URL`. Point it at the read-only account, never at the
  application account; the guard assumes the account cannot write.
- Set `NO_PROXY=127.0.0.1,localhost,::1` (and the lowercase variant) when a system-wide proxy is
  configured, otherwise localhost calls are routed through it.

## Knowledge base

```bash
cd services/knowledge-base
uvicorn app.main:app --host 127.0.0.1 --port 8101 --reload
```

The service keeps its own Alembic history:

```bash
cd services/knowledge-base
alembic upgrade head
```

Ingestion requires object storage. For local work the filesystem backend is sufficient; configure it
in `.env` and create the target directory before the first upload.

## Admin console

```bash
cd apps/admin-web
pnpm run dev:win   # Windows, port 3001
pnpm run dev       # Linux / macOS
pnpm run ts-check
pnpm exec vitest run
```

Build the production bundle:

```bash
pnpm run build:win   # Windows
pnpm run build       # Linux / macOS
```

The Next.js build skips type validation, so always run `pnpm run ts-check` separately.

## Common problems

| Symptom | Cause | Fix |
| --- | --- | --- |
| `permission denied` when moving or building | A dev server holds files open | Stop the process and retry |
| Agent readiness `503` | PostgreSQL not reachable | Check `AGENT_DATABASE_URL` and the container |
| Every localhost call hangs | System proxy intercepts loopback | Set `NO_PROXY` and `no_proxy` |
| Analysis run returns `SQL_REJECTED` | Query referenced a table outside the allowlist | Use the `agent_*` analysis views |
| Admin console shows empty tables | Frontend points at the wrong API base URL | Check `.env.local` |
