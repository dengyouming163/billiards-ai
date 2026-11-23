# VenueIQ 品牌重塑与多业态文档实施计划

> **REQUIRED SUB-SKILL:** 使用 superpowers:executing-plans 执行本计划。

**Goal:** 把系统从「台屏智联」重塑为 **VenueIQ**，补写多业态使用场景文档，并重拍全部截图。

**Architecture:** 分三条并行线：代码与文案替换 → 演示数据替换 → 文档重写；三线完成后统一重拍管理端、移动端、收银端截图，最后处理仓库改名。

**Tech Stack:** Next.js 16（admin/pos）、uni-app + Vue3（mobile）、ThinkPHP 8（api）、MySQL 8、Playwright。

---

## Task 1: 代码与前端文案替换

**Files:**
- Modify: `apps/admin-web/src/app/layout.tsx`
- Modify: `apps/admin-web/src/app/login/layout.tsx`
- Modify: `apps/admin-web/src/app/login/page.tsx`
- Modify: `apps/admin-web/AGENTS.md`
- Modify: `apps/pos-web/src/app/login/page.tsx`
- Modify: `apps/pos-web/src/app/select-store/page.tsx`
- Modify: `apps/mobile-web/src/pages/login/index.vue`
- Modify: `apps/mobile-web/index.html`
- Modify: `apps/mobile-web/src/manifest.json`
- Modify: `apps/mobile-web/hybrid/html/service-agreement.html`
- Modify: `apps/mobile-web/hybrid/html/privacy-policy.html`
- Modify: `apps/tablet-web/index.html`

**替换规则：**

| 旧 | 新 |
| --- | --- |
| `台屏智联` | `VenueIQ` |
| `PREMIUM BILLIARDS` | `SMART VENUE OPERATIONS` |
| `台球行业数字化管理平台` | `多业态场馆智能运营平台` |
| `球房管理系统` / `球房管理` | `场馆智能运营平台` |
| `BilliardsHub` | `VenueIQ` |

不要改历史文档 `docs/superpowers/**`、`docs/plans/**` 与 `docs/evidence/**`。

**Step 1: 执行替换后检索残留**

Run:
```powershell
git grep -n -I -E "台屏智联|PREMIUM BILLIARDS|BilliardsHub" -- ':!docs/superpowers' ':!docs/plans' ':!docs/evidence'
```
Expected: 无输出。

**Step 2: 前端类型检查与单测**

Run:
```powershell
cd apps/admin-web
pnpm run ts-check
pnpm exec vitest run
```
Expected: ts-check 无错误；Vitest `13 passed`。

**Step 3: 提交**

Run:
```powershell
git add -A
git commit -m "feat: rebrand product to VenueIQ across apps"
```

---

## Task 2: 种子数据与演示门店改名

**Files:**
- Modify: `apps/api/database/migrations/20240101000000_init_business_tables.sql`

**Step 1: 更新种子**

把项目配置中的 `台屏智联` 改为 `VenueIQ`。

**Step 2: 本地数据库改名**

```powershell
docker exec billiards-agent-m0m1-mysql-1 mysql -uroot -ptest-root-only billiards_test -e "UPDATE config SET value='VenueIQ' WHERE type='project' AND name='name'; UPDATE store SET name='VenueIQ 体验店' WHERE id=1;"
```

实际表名与字段先核对：`SHOW TABLES LIKE '%store%';`、`DESC config;`。若项目名不在 `config` 表，用
`SELECT * FROM config WHERE value LIKE '%台屏智联%';` 定位后再改。

**Step 3: 服务器同步**

用 plink 在服务器 `billiards-mysql` 容器执行等价 SQL。

**Step 4: 重启接口容器使缓存失效**

```bash
docker restart billiards-api billiards-web
```

**Step 5: 验证**

```powershell
$r = Invoke-RestMethod -Uri 'http://127.0.0.1:10002/storeapi' -TimeoutSec 30
$r
```
以及服务器 `curl -s http://132.232.166.40/storeapi`。

---

## Task 3: 多业态文档

**Files:**
- Create: `docs/architecture/use-cases.md`
- Modify: `README.md`
- Modify: `README.zh-CN.md`
- Modify: `docs/architecture/overview.md`
- Modify: `CHANGELOG.md`

**Step 1: 写 `use-cases.md`**

必须包含：

1. 三类业态的场景表：台球俱乐部、KTV/量贩、棋牌桌游。
2. 统一计费抽象：时间计费、服务计费、商品计费、预付与分成。
3. 每类业态的典型对账差异与 AI 介入点。
4. 一段「为什么同一套对账引擎能跨业态」的解释，落到字段而非口号。

**Step 2: README 重写抬头与场景**

- 一句话定位改为：`AI-first operations platform for timed and serviced venues — billiards clubs, KTV, board-game lounges.`
- 新增 `Use cases` 表格（业态 / 时间计费 / 服务计费 / 商品 / AI 关注点）。
- 保持能力矩阵、架构图、演示地址、截图、质量门禁不变。

**Step 3: overview 与 CHANGELOG**

overview 首段加入多业态定位；CHANGELOG 增加 `### Changed` 条目记录品牌重塑。

**Step 4: 校验**

```powershell
git grep -n -I -E "TBD|TODO|待补充" -- docs ':!docs/plans' ':!docs/superpowers'
```
Expected: 无输出。

---

## Task 4: 重拍管理端截图

**Files:**
- Overwrite: `docs/screenshots/admin-web/*.png`

**Step 1: 启动服务**

确认 `10002` API、`8100` agent、`8081`/`3001` 前端可用；必要时按 `docs/guides/local-dev.md` 启动。

**Step 2: 用 Playwright 重新采集**

复用 `D:\tmp\shots` 的脚本，视口 1280×800，账号 `18085092430 / 123456`，班次 `att_6a473dc4e6f95`。
覆盖 14 个页面，其中对账需重新触发一次运行后再截图。

**Step 3: 校验**

```powershell
Get-ChildItem docs/screenshots/admin-web -Filter *.png | Where-Object { $_.Length -lt 10000 }
```
Expected: 无输出（无空白小图）。

---

## Task 5: 重拍移动端截图

**Files:**
- Overwrite: `docs/screenshots/mobile-web/*.png`

**Step 1: 启动 H5**

临时把 `apps/mobile-web/src/config/env.ts` 的开发 `BASE_URL` 改为 `/storeapi`，`pnpm run dev:h5`。

**Step 2: 采集 15 张**

390×844 视口，登录后逐页截图，工作台等异步页面等待 9 秒。

**Step 3: 还原临时改动**

```powershell
git checkout -- apps/mobile-web/src/config/env.ts
```

**Step 4: 校验登录页文案**

截图需显示 `VenueIQ` 与 `SMART VENUE OPERATIONS`。

---

## Task 6: 补收银端截图

**Files:**
- Create: `docs/screenshots/pos-web/*.png`

**Step 1: 安装依赖并启动**

```powershell
cd apps/pos-web
pnpm install --no-frozen-lockfile --registry=https://registry.npmmirror.com
pnpm run dev
```
记录实际端口。

**Step 2: 采集 4 张**

登录页、选择门店、收银台、开台。

**Step 3: 校验**

每张文件大于 10KB，页面无空白。

---

## Task 7: README 画廊与截图校验

**Files:**
- Modify: `README.md`
- Modify: `README.zh-CN.md`

**Step 1: 增加收银端小节**

与移动端并列，4 张图，宽度 240。

**Step 2: 校验全部引用**

```powershell
$refs = Select-String -Path README.md,README.zh-CN.md -Pattern 'docs/screenshots/[^")]+' -AllMatches | ForEach-Object { $_.Matches.Value } | Sort-Object -Unique
$refs | Where-Object { -not (Test-Path $_) }
```
Expected: 无输出。

**Step 3: 提交**

```powershell
git add docs/screenshots README.md README.zh-CN.md
git commit -m "docs: refresh screenshots for the VenueIQ brand"
```

---

## Task 8: 仓库改名与部署同步

**Files:**
- Modify: `deploy/nginx/billiards-ai.conf` → `deploy/nginx/venueiq.conf`
- Modify: `docs/guides/deployment.md`

**Step 1: 用户在 GitHub 执行仓库改名**

Settings → Repository name → `venueiq`。这一步必须由用户在网页完成。

**Step 2: 本地更新远端**

```powershell
git remote set-url origin https://github.com/dengyouming163/venueiq.git
git push origin feature/m0-m1:main
```

**Step 3: 服务器同步**

```bash
cd /opt/billiards-ai
git remote set-url origin https://github.com/dengyouming163/venueiq.git
```
服务器无法直连 GitHub 时，继续用本地 `git bundle` 同步。

**Step 4: nginx 重命名与重载**

复制 `deploy/nginx/venueiq.conf` 到站点目录，删除旧 `billiards-ai.conf`，`nginx -t` 通过后 reload。

**Step 5: 公网验证**

```powershell
@('http://132.232.166.40/storeapi','http://132.232.166.40/login') | ForEach-Object { (Invoke-WebRequest -UseBasicParsing $_).StatusCode }
```
Expected: 均 200；登录页标题含 VenueIQ。

---

## Task 9: 全量回归

**Step 1: 前端**

```powershell
cd apps/admin-web; pnpm run ts-check; pnpm exec vitest run; pnpm run build:win
```

**Step 2: Agent 与 PHP**

```powershell
cd services/agent; .\.venv\Scripts\python.exe -m pytest -q
cd ..\..\apps\api; php vendor\bin\phpunit --testsuite Characterization; php vendor\bin\phpunit --testsuite Integration
```

**Step 3: 公网对账**

登录后跑一次对账，确认 `"degraded": false` 且门店名显示 `VenueIQ 体验店`。

**Step 4: 汇报**

分「已通过 / 未通过 / 未复验」三类如实汇报，不得笼统宣称全部通过。
