# Quickstart

Get the agent, the knowledge base and the admin console running locally.

## Prerequisites

- Python 3.11+
- Node 20 + pnpm
- Docker with the Compose plugin
- Git

## 1. Start the datastores

```bash
git clone https://github.com/dengyouming163/billiards-ai.git
cd billiards-ai
docker compose -f deploy/docker/compose.test.yml up -d
docker compose -f deploy/docker/compose.test.yml ps
```

Expected: `mysql` and `postgres` both report `healthy`. MySQL listens on `127.0.0.1:13306`,
PostgreSQL on `127.0.0.1:15432`. The init scripts in `deploy/mysql/init` create the analysis views
and the read-only account.

## 2. Start the agent

```bash
cd services/agent
python -m venv .venv
# Windows: .venv\Scripts\activate
source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8100
```

Check readiness:

```bash
curl -s http://127.0.0.1:8100/health/ready
```

Expected:

```json
{"status":"ready","checks":{"checkpoint":"ok","migration":"0001","database":"ok"}}
```

The agent resolves callers through the PHP API, so a reconciliation run needs `apps/api` and a valid
token. If you only want to exercise the code paths, the test suite is self-contained:

```bash
cd services/agent
python -m pytest -q
```

Expected: `204 passed`.

## 3. Start the knowledge base

```bash
cd services/knowledge-base
python -m venv .venv
source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8101
```

```bash
curl -s http://127.0.0.1:8101/ready
```

Expected: a JSON body with a healthy status. The API contract is available at
`http://127.0.0.1:8101/docs`.

## 4. Start the admin console

```bash
cd apps/admin-web
pnpm install
pnpm run dev:win        # Windows
pnpm run dev            # Linux / macOS
```

Open the URL printed by Next (3000 by default; use `pnpm exec next dev --webpack -p 3001` if that
port is already taken) and sign in with the demo credentials listed in the README.

## 5. Run one reconciliation

1. Open the finance page and select the **智能交班** tab.
2. Enter a shift ID and start the run.
3. Wait for the status line to show `completed`.
4. Open **查看运行 Trace 与工具调用** to inspect the stored run.

Expected for a shift with real differences: a report with `review_required` status, at least one
difference row, SOP citations and a narrative summary. If the model is not configured the report is
still produced and the narrative area reports a degraded explanation.

## Next steps

- [Local development](local-dev.md) for ports, environment files and reset procedures.
- [Evaluation](evaluation.md) to run the golden datasets.
- [Agent architecture](../architecture/agent.md) to understand what each graph node guarantees.
