# billiards-ai 开源化重构实施计划

> **REQUIRED SUB-SKILL:** 使用 superpowers:executing-plans 按任务逐条执行本计划。

**Goal:** 把混合仓重构为 AI 优先的开源项目结构，补齐专业文档与真实截图，部署公网演示环境。

**Architecture:** 通过 `git mv` 将 AI 服务收敛到 `services/`、业务应用收敛到 `apps/`、评测收敛到 `benchmarks/`；文档以 Agent / RAG / 安全三条主线组织；最后用 nginx 反代对外提供演示地址。

**Tech Stack:** FastAPI + LangGraph（Agent）、ThinkPHP 8（API）、Next.js 16（admin/pos/tablet/mobile）、Docker Compose（MySQL 8 + PostgreSQL 16）、nginx、systemd。

---

## Task 1: 打回滚标签并确认工作区

**Files:**
- 无文件改动

**Step 1: 确认工作区状态**

Run:
```powershell
git status --porcelain
```
Expected: 仅剩 `?? billiards/wwwtable/docs/YNHCommonApi/.idea/`（本计划最后统一忽略）。

**Step 2: 打标签**

Run:
```powershell
git tag pre-oss-restructure
git tag --list pre-oss-restructure
```
Expected: 输出 `pre-oss-restructure`。

**Step 3: 记录当前测试基线（供 Task 9 对比）**

Run:
```powershell
cd services 2>$null; cd agent; .\.venv\Scripts\python.exe -m pytest -q 2>&1 | Select-Object -Last 3
```
Expected: `204 passed`。若目录已迁移，改用 `services\agent`。

---

## Task 2: 目录迁移

**Files:**
- Move: `agent/` → `services/agent/`
- Move: `eval/` → `benchmarks/`
- Move: `billiards/wwwapi/` → `apps/api/`
- Move: `billiards/wwwstore/` → `apps/admin-web/`
- Move: `billiards/wwwpos/` → `apps/pos-web/`
- Move: `billiards/wwwtable/` → `apps/tablet-web/`
- Move: `billiards/wwwstoreapp/` → `apps/mobile-web/`
- Move: `billiards/wwwsocket/` → `apps/realtime-gateway/`
- Move: `deploy/compose.test.yml` → `deploy/docker/compose.test.yml`

**Step 1: 创建目标目录**

Run:
```powershell
New-Item -ItemType Directory -Force services, apps, benchmarks, deploy\docker | Out-Null
```

**Step 2: 执行 git mv**

Run:
```powershell
git mv agent services/agent
git mv eval benchmarks
git mv billiards/wwwapi apps/api
git mv billiards/wwwstore apps/admin-web
git mv billiards/wwwpos apps/pos-web
git mv billiards/wwwtable apps/tablet-web
git mv billiards/wwwstoreapp apps/mobile-web
git mv billiards/wwwsocket apps/realtime-gateway
git mv deploy/compose.test.yml deploy/docker/compose.test.yml
```
Expected: 每条命令无输出；`billiards/` 目录应已为空。

**Step 3: 清理空目录**

Run:
```powershell
Remove-Item billiards -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem -Directory | Select-Object -ExpandProperty Name
```
Expected: 顶层为 `apps benchmarks deploy docs services .git .worktrees`。

**Step 4: 提交迁移（仅改名，不含内容修改）**

Run:
```powershell
git add -A
git commit -m "refactor: reorganize repository into services, apps and benchmarks"
```
Expected: 提交成功，git 识别为 rename。

---

## Task 3: 修正路径引用

**Files:**
- Modify: `.gitignore`
- Modify: `deploy/docker/compose.test.yml`
- Modify: `docs/evidence/m0/*.md`、`docs/evidence/m1/*.md`（仅路径字样）

**Step 1: 找出所有旧路径引用**

Run:
```powershell
git grep -n -I -E "billiards/(wwwapi|wwwstore|wwwpos|wwwtable|wwwstoreapp|wwwsocket)|(^|[^a-z])agent/|(^|[^a-z])eval/"
```
Expected: 列出待改文件。业务代码内部的相对引用（如 `src/...`）不在此列，属正常。

**Step 2: 更新 .gitignore**

把 `agent/data/`、`eval/results/*.json`、`!eval/results/.gitkeep` 改为：
```gitignore
services/agent/data/
benchmarks/results/*.json
!benchmarks/results/.gitkeep
```
并追加：
```gitignore
# IDE
**/.idea/
```

**Step 3: 更新 compose 挂载路径**

`deploy/docker/compose.test.yml` 中 `./mysql/init` 保持不变（仍相对 `deploy/docker/`），需确认实际路径为 `deploy/mysql/init`，改为：
```yaml
      - ../mysql/init:/docker-entrypoint-initdb.d:ro
```

**Step 4: 修正文档中的旧路径**

`docs/evidence/**` 内出现的 `agent/`、`billiards/wwwstore` 等改为新路径，仅改路径字样，不改结论与数据。

**Step 5: 验证无残留**

Run:
```powershell
git grep -n -I -E "billiards/www(api|store|pos|table|storeapp|socket)"
```
Expected: 无输出。

**Step 6: 提交**

Run:
```powershell
git add -A
git commit -m "chore: update path references after restructure"
```

---

## Task 4: 纳入 RAG 知识库

**Files:**
- Create: `services/knowledge-base/`（复制自 `D:\wwwroot\projectwork\projects\rag-knowledge-base`）

**Step 1: 复制并排除产物**

Run:
```powershell
robocopy ..\rag-knowledge-base services\knowledge-base /E /XD .git node_modules .venv __pycache__ .pytest_cache .ruff_cache data /XF .env /NFL /NDL /NJH /NJS
```
Expected: 退出码 0-7 属正常（≥8 为错误）。

**Step 2: 确认没有内层 .git**

Run:
```powershell
Test-Path services\knowledge-base\.git
```
Expected: `False`。

**Step 3: 在文档标注上游来源**

在 `services/knowledge-base/README.md` 末尾追加来源说明：
```markdown
## Upstream

This service is vendored from the private `rag-knowledge-base` repository.
Its independent history is intentionally not included; see the upstream repository for original commits.
```

**Step 4: 提交**

Run:
```powershell
git add services/knowledge-base
git commit -m "feat: vendor knowledge-base service into monorepo"
```

---

## Task 5: 开源社区文件

**Files:**
- Create: `LICENSE`、`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`、`CHANGELOG.md`
- Create: `.editorconfig`、`.gitattributes`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`、`.github/ISSUE_TEMPLATE/bug_report.yml`、`.github/ISSUE_TEMPLATE/feature_request.yml`
- Create: `.github/workflows/agent-ci.yml`、`.github/workflows/web-ci.yml`

**Step 1: 写 LICENSE**

写入 Apache License 2.0 全文，版权行为 `Copyright 2026 dengyouming163`。

**Step 2: 写 CONTRIBUTING.md**

必须包含：分支命名、提交规范（Conventional Commits）、本地测试命令（pytest / ts-check / vitest / phpunit）、PR 检查清单。

**Step 3: 写 SECURITY.md**

必须包含：漏洞上报邮箱占位改为真实可联系地址（使用仓库 Issues 的私密报告入口）、不公开披露期限、演示环境凭据声明。

**Step 4: 写 CODE_OF_CONDUCT.md 与 CHANGELOG.md**

Code of Conduct 使用 Contributor Covenant 2.1；CHANGELOG 首条记录 `0.1.0 - 2026-11-23`，列出对账、SQL 分析、RAG 三项能力。

**Step 5: 写 CI**

`agent-ci.yml`：Python 3.11，`pip install -e ".[dev]"`，`pytest -q`。
`web-ci.yml`：Node 20 + pnpm，工作目录 `apps/admin-web`，执行 `pnpm install --frozen-lockfile`、`pnpm run ts-check`、`pnpm exec vitest run`。

**Step 6: 校验 YAML**

Run:
```powershell
python -c "import yaml,glob,sys; [yaml.safe_load(open(f,encoding='utf-8')) for f in glob.glob('.github/**/*.yml',recursive=True)]; print('YAML_OK')"
```
Expected: `YAML_OK`。

**Step 7: 提交**

Run:
```powershell
git add LICENSE CONTRIBUTING.md CODE_OF_CONDUCT.md SECURITY.md CHANGELOG.md .editorconfig .gitattributes .github
git commit -m "docs: add open source governance files and CI workflows"
```

---

## Task 6: AI 主线文档

**Files:**
- Create: `docs/architecture/overview.md`、`agent.md`、`rag.md`、`security.md`
- Create: `docs/reference/api.md`
- Create: `docs/guides/quickstart.md`、`local-dev.md`、`evaluation.md`
- Create: `docs/adr/0001-deterministic-reconciliation.md`、`0002-readonly-sql-guard.md`、`0003-rag-degradation.md`

**Step 1: 写架构文档**

要求：
- `agent.md` 必须画清 LangGraph 节点顺序：取证 → SOP 检索 → 确定性报告 → 模型解释 → 持久化；并写明「模型失败只降级解释，不改数值」。
- `rag.md` 必须写明 `query/top_k/mode/audience` 契约、`X-Tenant-Id`/`X-User-Id` 身份来源、ACL 交集规则。
- `security.md` 必须列出四层防护：SQL AST 白名单、只读账号、200 行上限、服务端超时；并说明提示注入不作为指令执行。

**Step 2: 写 API 参考**

从 `services/agent/app` 路由中核对真实路径与字段，逐条列出请求体、响应体、错误码。禁止臆造字段。

**Step 3: 写指南**

- `quickstart.md`：Docker 起依赖 → 起 agent → curl 一次对账 → 看到报告。
- `local-dev.md`：端口约定（3001 前端、10002 API、8100 Agent、8101 RAG、13306 MySQL、15432 PostgreSQL）。
- `evaluation.md`：`benchmarks/datasets/*.json` 用途与执行命令。

**Step 4: 写 ADR**

每篇包含：背景、决策、后果（正/负）、替代方案。

**Step 5: 校验无占位符**

Run:
```powershell
git grep -n -I -E "TBD|TODO|FIXME|待补充" docs
```
Expected: 无输出。

**Step 6: 提交**

Run:
```powershell
git add docs
git commit -m "docs: add AI-first architecture, reference and guides"
```

---

## Task 7: README 中英双语

**Files:**
- Create: `README.md`、`README.zh-CN.md`

**Step 1: 写英文 README**

必须包含：项目一句话定位、能力矩阵表、架构图（```text 绘制）、演示地址表、截图画廊（引用 `docs/screenshots/...`）、目录结构、快速开始、测试命令、License。

**Step 2: 写中文 README**

结构与英文版一一对应，语言为中文。

**Step 3: 校验图片链接全部存在**

Run:
```powershell
Select-String -Path README.md,README.zh-CN.md -Pattern 'docs/screenshots/[^)]+' -AllMatches | ForEach-Object { $_.Matches.Value } | Sort-Object -Unique | ForEach-Object { "$_ = " + (Test-Path $_) }
```
Expected: 全部为 `True`。

**Step 4: 提交**

Run:
```powershell
git add README.md README.zh-CN.md
git commit -m "docs: add bilingual project README"
```

---

## Task 8: 采集真实截图

**Files:**
- Create: `docs/screenshots/admin-web/*.png`
- Create: `docs/screenshots/agent/*.png`

**Step 1: 启动 admin-web**

Run:
```powershell
cd apps\admin-web
pnpm run dev:win
```
Expected: 监听 `http://127.0.0.1:3000`（或 3001，按实际输出）。

**Step 2: 登录并逐页截图**

使用浏览器自动化，依次截图并落盘：
1. `login.png`
2. `dashboard.png`
3. `finance-reconciliation-report.png`（对账完成态，含 SOP 引用）
4. `finance-reconciliation-diff.png`（差异明细）
5. `finance-income-tab.png`
6. `agent-runs.png`（`/agent?run_id=<真实run>`）
7. `agent-sop-qa.png`
8. `orders.png`
9. `products.png`
10. `tables.png`
11. `members.png`
12. `employees.png`

**Step 3: 校验每张图真实存在且被跟踪**

Run:
```powershell
git add docs/screenshots
git ls-files docs/screenshots | Measure-Object -Line
Get-ChildItem docs\screenshots -Recurse -Filter *.png | Where-Object { $_.Length -lt 10000 } | Select-Object FullName
```
Expected: 计数 ≥ 12；第二条无输出（无异常小文件）。

**Step 4: 在 README 画廊补齐引用并复核**

Run:
```powershell
Select-String -Path README.md -Pattern 'docs/screenshots/[^)]+' -AllMatches | ForEach-Object { $_.Matches.Value } | Sort-Object -Unique | ForEach-Object { "$_ = " + (Test-Path $_) }
```
Expected: 全部 `True`。

**Step 5: 提交**

Run:
```powershell
git add docs/screenshots README.md README.zh-CN.md
git commit -m "docs: add product screenshots and gallery"
```

---

## Task 9: 回归验证

**Files:**
- 无改动，仅验证

**Step 1: Agent 测试**

Run:
```powershell
cd services\agent
.\.venv\Scripts\python.exe -m pytest -q
```
Expected: `204 passed`。

**Step 2: 前端检查与构建**

Run:
```powershell
cd ..\..\apps\admin-web
pnpm run ts-check
pnpm exec vitest run
pnpm run build:win
```
Expected: ts-check 无输出即通过；Vitest `13 passed`；构建 exit 0。

**Step 3: PHP 测试**

Run:
```powershell
cd ..\api
php vendor\bin\phpunit --testsuite Characterization
php vendor\bin\phpunit --testsuite Integration
```
Expected: 9 passed / 25 passed。

**Step 4: 失败则修复并重跑**

任何一项失败，先定位根因再修，禁止放宽断言或跳过测试。修复后必须重跑该项与相邻项。

**Step 5: 提交（若有修复）**

Run:
```powershell
git add -A
git commit -m "fix: address regressions after restructure"
```

---

## Task 10: 推送 GitHub

**Files:**
- 无改动

**Step 1: 确认远端与分支**

Run:
```powershell
cd D:\wwwroot\projectwork\projects\billiards-ai
git remote -v
git status -sb
```
Expected: `origin https://github.com/dengyouming163/billiards-ai.git`，本地 `feature/m0-m1` 跟踪 `origin/main`。

**Step 2: 推送**

Run:
```powershell
git push origin feature/m0-m1:main
```
Expected: 推送成功，无 `--force`。

**Step 3: 用 API 校验远端 HEAD**

Run:
```powershell
$h=@{'User-Agent'='trae-cli'}
(Invoke-RestMethod 'https://api.github.com/repos/dengyouming163/billiards-ai/commits?per_page=1' -Headers $h)[0].commit.message.Split("`n")[0]
```
Expected: 输出最新提交标题。

---

## Task 11: 部署与演示验证

**Files:**
- Create: `deploy/systemd/billiards-agent.service`、`billiards-admin.service`、`billiards-rag.service`
- Create: `deploy/nginx/billiards-ai.conf`

**Step 1: 连接服务器并准备运行时**

Run（本地）:
```powershell
ssh root@132.232.166.40 "cat /etc/os-release | head -2; free -m | head -2; df -h / | tail -1"
```
Expected: 能登录并输出版本、内存、磁盘。

**Step 2: 安装依赖**

在服务器执行：Node 20 + pnpm、PHP 8.2 + Composer、Python 3.11 + venv、Docker + compose 插件、nginx、git。

**Step 3: 拉取仓库**

Run（服务器）:
```bash
mkdir -p /opt/billiards-ai
cd /opt/billiards-ai
git clone https://github.com/dengyouming163/billiards-ai.git .
git checkout main
```
Expected: 拉取成功，目录结构与本地一致。

**Step 4: 起数据库依赖**

Run（服务器）:
```bash
cd /opt/billiards-ai
docker compose -f deploy/docker/compose.test.yml up -d
docker compose -f deploy/docker/compose.test.yml ps
```
Expected: mysql、postgres 均为 healthy。

**Step 5: 安装并启动三个服务**

- Agent：`python3 -m venv .venv` → `pip install -e ".[dev]"` → 写 `.env`（绑定 127.0.0.1:8100）
- RAG：`pip install -e .` → 写 `.env`（127.0.0.1:8101）
- admin-web：`pnpm install` → `pnpm build:win` → `next start -p 3001`

**Step 6: 配置 nginx 与 systemd**

`deploy/nginx/billiards-ai.conf` 关键规则：
```nginx
location / { proxy_pass http://127.0.0.1:3001; }
location /storeapi/ { root /opt/billiards-ai/apps/api/public; fastcgi_pass unix:/run/php/php8.2-fpm.sock; }
location /agent/ { proxy_pass http://127.0.0.1:8100/; }
location /rag/ { proxy_pass http://127.0.0.1:8101/; }
```
`deploy/systemd/*.service` 每个服务 `Restart=always`、`User=www-data`、`WorkingDirectory` 指向新路径。

**Step 7: 冒烟验证**

Run（本地）:
```powershell
@('http://132.232.166.40/','http://132.232.166.40/storeapi','http://132.232.166.40/agent/health/ready','http://132.232.166.40/rag/docs') | ForEach-Object { try { $r=Invoke-WebRequest -UseBasicParsing $_ -TimeoutSec 20; "$_ = " + $r.StatusCode } catch { "$_ = ERR " + $_.Exception.Message } }
```
Expected: 四项均 200。

**Step 8: 公网走通一次对账**

在 `http://132.232.166.40/finance` 用 `18085092430 / 123456` 与班次 `att_6a473dc4e6f95` 生成新 run，确认状态 `completed`、无降级提示、SOP 引用可见。

**Step 9: 安全收尾**

- 修改 root 密码或改用 SSH key 登录
- 确认 Agent 与 RAG 仅监听 127.0.0.1（`ss -lntp | grep -E '8100|8101'`）
- README 增加「演示环境，请勿用于生产」声明

**Step 10: 提交部署文件并推送**

Run:
```powershell
git add deploy
git commit -m "chore(deploy): add nginx and systemd units for public demo"
git push origin feature/m0-m1:main
```
