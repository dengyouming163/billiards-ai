# billiards-ai 开源化重构设计

- 日期：2026-11-23
- 状态：已确认
- 仓库：https://github.com/dengyouming163/billiards-ai
- 协议：Apache-2.0

## 1. 背景

当前仓库是「全量业务应用 + AI 能力」的混合仓：`billiards/` 下 6 个业务前端/后端、`agent/`、`eval/`、`deploy/`、`docs/`，RAG 知识库位于独立的 `rag-knowledge-base` 仓库。

作为开源项目，需要满足三点：

1. 结构专业：AI 能力位于主干位置，业务应用退到可选子目录。
2. 文档专业：以 AI 为主线，讲清能力边界、架构、安全模型与评测方法，并配有真实截图。
3. 可演示：提供公网演示地址，访客无需本地搭建即可看到对账与检索效果。

## 2. 目标与非目标

### 目标

- 将仓库重构为 `services/`（AI 服务）+ `apps/`（业务应用）+ `benchmarks/` + `docs/` 的专业结构。
- 补齐开源社区文件：LICENSE、README（中英）、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY、CHANGELOG、Issue/PR 模板、CI。
- 文档以 AI 为主线，覆盖 Agent 架构、RAG 架构、安全模型、API 参考、ADR、评测指南。
- 提供 `docs/screenshots/` 真实截图，README 内置截图画廊。
- 部署到 `132.232.166.40`，README 写明演示地址与演示账号。

### 非目标

- 不修改业务逻辑，仅做路径迁移与引用修正。
- 不为业务应用补充新的功能或测试。
- 不引入新的第三方依赖，除 CI 所需的基础镜像外。
- 不将服务器凭据写入仓库。

## 3. 范围决策

| 决策项 | 结论 | 理由 |
| --- | --- | --- |
| 开源范围 | AI 为主，业务应用作为可选子目录 | 避免把商业实现当作卖点，同时保留完整演示链路 |
| 重构强度 | 全面重构（含业务目录重命名） | 目录命名需要一次性规范，避免二次返工 |
| RAG 纳管方式 | 复制到 `services/knowledge-base`，删除内层 `.git` | 单仓单历史，降低克隆与 CI 成本 |
| 演示地址格式 | `http://132.232.166.40/<前缀>`，nginx 反代 | 不暴露 3001/8100 等非标准端口 |
| 协议 | Apache-2.0 | 含专利授权，适合 AI 项目 |

## 4. 目标目录结构

```text
billiards-ai/
├── README.md
├── README.zh-CN.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── CHANGELOG.md
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .github/
│   ├── workflows/
│   │   ├── agent-ci.yml
│   │   └── web-ci.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── PULL_REQUEST_TEMPLATE.md
├── services/
│   ├── agent/
│   └── knowledge-base/
├── benchmarks/
│   ├── run_reconciliation_eval.py
│   ├── run_sql_security_eval.py
│   ├── datasets/
│   └── fixtures/
├── apps/
│   ├── api/
│   ├── admin-web/
│   ├── pos-web/
│   ├── tablet-web/
│   ├── mobile-web/
│   └── realtime-gateway/
├── deploy/
│   ├── docker/compose.test.yml
│   ├── mysql/init/
│   └── systemd/
├── docs/
│   ├── architecture/
│   ├── guides/
│   ├── reference/
│   ├── adr/
│   ├── evidence/
│   ├── screenshots/
│   └── superpowers/
└── scripts/
```

## 5. 路径映射表

| 原路径 | 新路径 |
| --- | --- |
| `agent/` | `services/agent/` |
| `rag-knowledge-base/`（外部仓库） | `services/knowledge-base/` |
| `eval/` | `benchmarks/` |
| `billiards/wwwapi/` | `apps/api/` |
| `billiards/wwwstore/` | `apps/admin-web/` |
| `billiards/wwwpos/` | `apps/pos-web/` |
| `billiards/wwwtable/` | `apps/tablet-web/` |
| `billiards/wwwstoreapp/` | `apps/mobile-web/` |
| `billiards/wwwsocket/` | `apps/realtime-gateway/` |
| `deploy/compose.test.yml` | `deploy/docker/compose.test.yml` |
| `deploy/mysql/init/` | `deploy/mysql/init/`（不变） |

迁移要求：

- 使用 `git mv` 保留文件历史。
- 迁移前在本地打标签 `pre-oss-restructure` 便于回滚。
- 迁移后全仓检索旧路径引用并修正：`deploy/`、`docs/evidence/`、跨应用文档链接。
- 删除 `services/knowledge-base/.git`，在文档中注明上游仓库来源。
- 不迁移 `.worktrees`、`.venv`、`node_modules`、`__pycache__`、`.pytest_cache` 等本地产物。

## 6. 文档体系（AI 主线）

| 文件 | 内容 |
| --- | --- |
| `README.md` / `README.zh-CN.md` | 能力矩阵、架构总览、快速开始、演示地址、截图画廊、目录说明、路线图、许可 |
| `docs/architecture/overview.md` | 三条能力线的边界与调用关系 |
| `docs/architecture/agent.md` | LangGraph 节点流、确定性报告与模型解释分离、降级语义 |
| `docs/architecture/rag.md` | 混合检索、ACL、租户隔离、SOP 引用校验 |
| `docs/architecture/security.md` | AST Guard + 只读账号/视图 + 行数上限 + 超时、提示注入防御 |
| `docs/reference/api.md` | 对账与只读分析的 HTTP/SSE 契约、trace 与 evidence 接口 |
| `docs/guides/quickstart.md` | 最小启动路径 |
| `docs/guides/local-dev.md` | 本地开发环境与端口约定 |
| `docs/guides/evaluation.md` | 评测数据集与执行方式 |
| `docs/adr/0001-deterministic-reconciliation.md` | 为什么数值由确定性规则生成 |
| `docs/adr/0002-readonly-sql-guard.md` | 为什么采用双层只读防护 |
| `docs/adr/0003-rag-degradation.md` | 为什么 RAG 失败只降级解释 |

写作要求：

- 不出现 TBD、TODO 或占位符。
- 所有金额、差异、引用 ID 均来自真实运行结果。
- README 中的路径、命令、端口必须与实际仓库一致。

## 7. 截图规范

| 项 | 规范 |
| --- | --- |
| 来源 | 本地启动 `apps/admin-web`（端口 3001），使用演示账号登录 |
| 分辨率 | 1280×800 |
| 目录 | `docs/screenshots/{admin-web,agent,rag}/` |
| 命名 | kebab-case，语义化，如 `finance-reconciliation-report.png` |
| 数量 | 不少于 12 张，覆盖登录、仪表盘、对账全流程、Agent 运行、制度问答、订单/商品/台桌管理 |
| 校验 | 每张图落盘后执行 `git ls-files docs/screenshots/`，禁止引用不存在的文件 |
| README 引用 | 使用相对路径，确保 GitHub 渲染可见 |

## 8. 部署方案

目标主机：`132.232.166.40`，全量部署。

| 步骤 | 内容 |
| --- | --- |
| 1 | 安装运行时：git、Node 20、pnpm、PHP 8.2、Composer、Python 3.11+、Docker |
| 2 | 构建镜像：`deploy/docker/compose.test.yml` 起 MySQL 13306 与 PgVector |
| 3 | 拉取仓库到 `/opt/billiards-ai` |
| 4 | 安装依赖：`services/agent`、`services/knowledge-base`、`apps/admin-web`、`apps/api` |
| 5 | 写入各服务 `.env`，指向本机数据库与 RAG 地址 |
| 6 | systemd 托管：`billiards-agent`、`billiards-admin`、`billiards-rag`、php-fpm |
| 7 | nginx 反代：`/` → admin-web 3001、`/storeapi/` → PHP、`/agent/` → 8100、`/rag/` → RAG 8101 |
| 8 | 冒烟验证：各前缀 curl 返回 200，Agent `/health/ready` 返回 `database: ok` |
| 9 | 安全收尾：修改 root 密码或改用 SSH key；Agent 与 RAG 仅监听 127.0.0.1 |

演示地址约定：

| 服务 | 地址 |
| --- | --- |
| 管理后台 | `http://132.232.166.40/` |
| 后端 API | `http://132.232.166.40/storeapi` |
| Agent | `http://132.232.166.40/agent/docs` |
| RAG | `http://132.232.166.40/rag/docs` |

## 9. 验收标准

- Agent：`pytest` 204 passed。
- 前端：`ts-check` 通过、Vitest 13 passed、`build:win` 成功。
- PHP：Characterization 9 passed、Integration 25 passed。
- 截图：`docs/screenshots/` 不少于 12 张且全部被 git 跟踪。
- 文档：无占位符，README 链接全部有效。
- 演示：四个公网地址均返回 200；公网后台可完成一次对账且 `degraded=false`。
- 仓库：`git status` 干净，无凭据入库。

## 10. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| 业务目录重命名遗漏绝对路径引用 | 全仓 grep 校验，构建与测试兜底 |
| RAG 内层 `.git` 删除后丢失独立历史 | 保留源仓库 `rag-knowledge-base` 不动 |
| 公网直连服务无鉴权 | Agent/RAG 仅监听 127.0.0.1，由 nginx 统一入口 |
| 服务器 root 凭据泄露 | 仅一次性使用，部署后立即更换凭据，仓库内不记录 |
| 重构后需回滚 | 打标签 `pre-oss-restructure`，可整体 reset |
