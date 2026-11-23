# Deployment

The public demo runs on a single host with Docker Compose. All application containers bind to
`127.0.0.1`; nginx is the only process exposed on port 80.

## Layout on the host

| Item | Path |
| --- | --- |
| Repository | `/opt/billiards-ai` |
| Compose file | `deploy/docker/compose.prod.yml` |
| nginx site | `deploy/nginx/billiards-ai.conf` |
| MySQL data | Docker volume `billiards-ai_billiards-mysql-data` |
| Agent PostgreSQL | Docker volume `billiards-ai_billiards-agent-pg-data` |
| Knowledge base PostgreSQL | Docker volume `billiards-ai_billiards-rag-pg-data` |

## Host ports

| Host port | Container | Purpose |
| --- | --- | --- |
| 21002 | `api` | ThinkPHP business API |
| 23001 | `web` | Next.js admin console |
| 28000 | `rag-api` | Knowledge base API |
| 28100 | `agent` | Agent API |
| 13307 | `mysql` | Business database |
| 25432 | `agent-pg` | Agent state and runs |
| 35432 | `rag-pg` | Knowledge base storage |

Only nginx listens publicly.

## First deployment

```bash
cd /opt/billiards-ai

# Secrets are read from the shell environment, never committed.
export LLM_API_KEY=<deepseek-key>
export EMBED_API_KEY=<embedding-key>
export GIT_SHA=$(git rev-parse HEAD)

docker compose -f deploy/docker/compose.prod.yml up -d --build
docker compose -f deploy/docker/compose.prod.yml ps
```

`GIT_SHA` is read by the business API. Without a full commit SHA the evidence endpoint answers
`503`, because an unattributable evidence payload is not accepted.

The agent runs `alembic upgrade head` before it starts serving, so the run tables exist on first
boot.

The business API reads `apps/api/.env`, which is not tracked. Create it on the host with the
database host `mysql` and port `3306`.

## nginx

```bash
cp deploy/nginx/billiards-ai.conf /www/server/panel/vhost/nginx/billiards-ai.conf
nginx -t && nginx -s reload
```

The site matches on `server_name 132.232.166.40`, so existing domain-based sites are unaffected.

## Data

| Dataset | Source |
| --- | --- |
| Business tables | `deploy/mysql/init/001-schema.sql` runs on first MySQL start; demo rows are imported separately |
| Analysis views and read-only account | `deploy/mysql/init/002` and `003`, applied automatically on first start |
| SOP documents | Uploaded through the knowledge base API after the tenant and knowledge base exist |

Copying an existing knowledge base between hosts requires a strict order because of foreign keys:
`tenants` first, then `knowledge_bases`, `users`, `documents`, `chunks`. Copy through `\copy ... WITH
CSV` inside the container; PowerShell redirection corrupts UTF-8 in this environment.

## Verification

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://132.232.166.40/
curl -s http://132.232.166.40/agent/health/ready
curl -s -o /dev/null -w '%{http_code}\n' http://132.232.166.40/rag/ready
```

Then sign in to the console, run one reconciliation for a shift, and confirm the report,
narrative and SOP citations render.

## Operations

```bash
docker compose -f deploy/docker/compose.prod.yml logs -f agent
docker compose -f deploy/docker/compose.prod.yml restart web
docker compose -f deploy/docker/compose.prod.yml down          # keeps volumes
docker compose -f deploy/docker/compose.prod.yml down -v       # deletes data
```

## Security notes

- Demo credentials are intentionally public and grant access to demo data only.
- Agent and knowledge base containers are not reachable from the internet except through nginx.
- Rotate the host root password and any API keys after handing the environment over.
