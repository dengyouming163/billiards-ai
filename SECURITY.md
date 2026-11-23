# Security Policy

## Supported versions

The `main` branch receives security fixes. Tagged releases are supported until the next minor
release.

## Reporting a vulnerability

Do not open a public issue for a security problem.

Use GitHub's private reporting flow: open the repository **Security** tab → **Report a vulnerability**.
This creates a private advisory visible only to the maintainers.

Please include:

- Affected component (`services/agent`, `services/knowledge-base`, `apps/api`, `apps/admin-web`).
- Steps to reproduce, with the minimum input that triggers the issue.
- Impact: what an attacker can read, change or bypass.
- Whether the issue requires an authenticated tenant or store scope.

## Response process

| Stage | Target |
| --- | --- |
| Acknowledgement | 3 business days |
| Triage and severity assessment | 7 business days |
| Fix or mitigation plan shared with the reporter | 30 days for high severity |
| Public advisory | After a fix is released |

We credit reporters in the advisory unless they ask to stay anonymous.

## Threat model highlights

- **Read-only SQL analysis** is guarded by a SQL AST allowlist, a dedicated read-only database
  account, a row limit and a server-side execution timeout. Bypasses of any of these layers are
  in scope.
- **Prompt injection** in retrieved documents must never change computed figures or trigger write
  operations. Retrieved text is treated as evidence, not as instructions.
- **Tenant isolation** for the knowledge base relies on the `X-Tenant-Id` and `X-User-Id` headers
  and on row-level ACL filtering. Cross-tenant reads are in scope.
- **Unknown columns** in the analysis views are rejected before execution; leaking schema details
  from an error message is in scope.

## Demo environment

The public demo is a demonstration deployment, not a production service:

- It runs on a single host with a shared test dataset and may be reset without notice.
- The credentials published in the README are intentionally public and grant access only to demo
  data.
- Do not upload confidential material to the demo instance.

Never reuse demo credentials anywhere else. Please report any exposure of real data through the
demo environment as a security issue.
