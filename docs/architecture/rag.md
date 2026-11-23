# Knowledge Base (RAG)

`services/knowledge-base` stores documents, retrieves chunks and answers questions with citations.
It is an independent FastAPI service with its own PostgreSQL database (pgvector) and object storage.

## Retrieval contract

```http
POST /v1/kbs/{kb_id}/search
Content-Type: application/json
X-Tenant-Id: m_8ef6c7660f16b1be98abbe7a
X-User-Id: emp_5d6dfaa554fdf7001eee

{
  "query": "交班对账差异处理流程",
  "top_k": 5,
  "mode": "hybrid",
  "audience": "internal"
}
```

| Field | Meaning |
| --- | --- |
| `query` | Natural-language or keyword query |
| `top_k` | Number of chunks to return |
| `mode` | `hybrid`, `vector` or `bm25` |
| `audience` | `public` for customer-facing chat, `internal` for staff procedures |

The tenant and user are **only** taken from request headers. A `tenant_id` in the body is rejected,
so a caller cannot widen its own scope by editing the payload.

## Hybrid retrieval

| Mode | Path | Notes |
| --- | --- | --- |
| `vector` | pgvector cosine search | Semantic recall, embedding model configurable |
| `bm25` | Inverted index built per knowledge base | Exact term recall, rebuilt lazily when missing |
| `hybrid` | Weighted reciprocal rank fusion of both | Default for SOP lookup |

The BM25 index is loaded from a snapshot; when no snapshot exists it is rebuilt in place once. Both
paths apply the same ACL and audience filters, so a chunk that is invisible to the user cannot enter
the fused result.

## Tenant and ACL model

```text
knowledge_bases(tenant_id, id)          -- kb lookup is scoped by tenant
chunks(tenant_id, kb_id, meta.acl_tags) -- row level security on tenant
users(tenant_id, user_id, tags, role)   -- caller tags and admin flag
```

- A knowledge base must belong to the calling tenant; otherwise the response is `404`, which does
  not reveal whether the knowledge base exists.
- A chunk with no `acl_tags` is public within the knowledge base.
- A chunk with `acl_tags` is visible only when the caller's `tags` intersect them.
- A user without tags sees only untagged chunks; the filter fails closed.
- A user with role `admin` skips the tag check but not the tenant or knowledge base scope.

Filtering happens in SQL rather than after retrieval. Filtering afterwards would let invisible
chunks consume the `top_k` budget and collapse recall.

## Answering and citations

`POST /v1/chat/stream` runs rewrite → retrieve → gate → generate → citation validation and streams
server-sent events.

- The gate refuses when retrieval is too weak to support an answer, instead of producing a guess.
- Every cited `chunk_id` must be present in the context that was retrieved for that request;
  citations that are not in the context are rejected.
- Retrieved text is treated as evidence. Instructions embedded in a document are not executed.

## Ingestion

`POST /v1/kbs/{kb_id}/documents` returns `202` with a `job_id`. The document is persisted first and
written to object storage second, so a storage failure leaves a `failed` row rather than a permanent
`pending` row. Duplicate content is deduplicated by content hash within the knowledge base.

`GET /v1/jobs/{job_id}` exposes progress, attempts and the error for a single ingestion job.

## Operational endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /live` | Liveness, always `200` while the process runs |
| `GET /ready` | Readiness, checks PostgreSQL, `503` when unavailable |
| `GET /v1/storage` | Documents with size, status and storage backend |
| `GET /v1/ops/storage/embedding-drift` | Chunk counts per embedding version |

## Configuration used by the agent

| Setting | Purpose |
| --- | --- |
| `RAG_BASE_URL` | Base URL of this service |
| `RAG_KB_ID` | Knowledge base queried for SOP documents |
| `RAG_AUDIENCE` | `internal` for staff workflows |

The agent's SOP lookup is best-effort: a retrieval failure degrades the explanation but never
changes the deterministic reconciliation result.
