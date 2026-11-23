# VenueIQ

**多业态场馆智能运营平台**

**面向台球、KTV、棋牌等计时与服务型场馆的 AI 运营平台。**

[English](README.md) · [架构说明](docs/architecture/overview.md) · [使用场景](docs/architecture/use-cases.md) · [快速开始](docs/guides/quickstart.md) · [API 参考](docs/reference/api.md)

[![agent-ci](https://github.com/dengyouming163/billiards-ai/actions/workflows/agent-ci.yml/badge.svg)](https://github.com/dengyouming163/billiards-ai/actions/workflows/agent-ci.yml)
[![web-ci](https://github.com/dengyouming163/billiards-ai/actions/workflows/web-ci.yml/badge.svg)](https://github.com/dengyouming163/billiards-ai/actions/workflows/web-ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

---

## 为什么做这个项目

一家多业态运营商可能同时经营台球俱乐部、KTV 包厢与棋牌桌游区：收入来自时间（台费、包厢费）、
来自人（助教费、服务费）、也来自商品（酒水、茶水、零食），三笔钱由不同人在不同时点分别结算。
交班时店长需要三件事：**数字必须准确**、**差异必须能解释**、**处置必须依据制度**。

常见的做法是把三件事都塞进一个对话框。本项目刻意把它们分开：

| 要求 | 实现方式 | 模型可以做什么 |
| --- | --- | --- |
| 数字必须准确 | 确定性规则比对签退快照与重算证据 | 不做任何计算 |
| 数据不能被修改 | SQL AST 白名单 + 只读账号 + 行数与超时限制 | 只能提出查询，由守卫校验 |
| 处置必须可溯源 | 混合检索 + 租户与文档级 ACL | 只能引用本次真实召回的片段 |

模型变慢、出错或不可用时，报告依然生成，只是被标记为 `degraded`，并在界面明确提示说明缺失——**金额永远不会因此改变**。

## 使用场景

| 业态 | 时间计费 | 服务计费 | 商品计费 | 预付与卡券 | 对账重点 |
| --- | --- | --- | --- | --- | --- |
| 台球俱乐部 | 台费按小时、包段或会员价 | 助教陪练费、计时分成 | 饮品、器材、零食 | 会员储值、次卡 | 台费时长 × 单价、助教单量 |
| KTV·量贩 | 包厢费按时段，常与最低消费绑定 | 服务费按人头、包厢服务人员 | 酒水、果盘、小食 | 储值、存酒 | 包厢时长、最低消费补差、服务人头 |
| 棋牌·桌游 | 桌费按小时或包场 | 服务费、陪打费 | 茶水、零食 | 储值、月卡 | 包场时段归属、茶水加钟、月卡抵扣 |

三类业态共用同一套计费模型：计时、计服务、计商品、预收。最低消费规则、存酒台账、跨零点包场
切分等属于行业配置与扩展，而不是另一套产品。计费原语、差异成因与当前边界见
[使用场景](docs/architecture/use-cases.md)。

## 能力矩阵

| 能力 | 接口 | 保证 |
| --- | --- | --- |
| 交班对账 | `POST /v1/reconciliation/runs/stream` | 数值由规则计算，每个值可回溯到证据来源 |
| 对账追问 | `POST /v1/reconciliation/runs/{id}/messages/stream` | 只基于已保存报告回答 |
| 只读 SQL 分析 | `POST /v1/analysis/runs/stream` | 单条 `SELECT`、视图白名单、强制门店作用域、被拒绝即不执行 |
| 制度问答 | `POST /v1/knowledge/runs/stream` | 引用必须出现在本次召回结果中 |
| 运行轨迹 | `GET /v1/runs/{id}` | 可回放工具调用、事件与结果 |

## 架构

```text
┌─────────────────────────────┐
│ apps/admin-web (Next.js 16) │  财务对账 · 运行轨迹 · 制度问答
└──────────────┬──────────────┘
               │ Bearer Token
┌──────────────▼──────────────┐        ┌─────────────────────────────┐
│ apps/api (ThinkPHP 8)       │◄───────┤ agent.Auth/context          │
│ 门店隔离的业务数据           │        │ 解析租户、门店、角色         │
└──────────────┬──────────────┘        └──────────────▲──────────────┘
               │ 对账证据                             │ 身份
┌──────────────▼──────────────────────────────────────┴──────────────┐
│ services/agent (FastAPI + LangGraph)                               │
│  对账图 │ 分析图 │ 知识问答图                                       │
│  守卫：身份、SQL AST 白名单、门店作用域、行数与超时                  │
└──────────┬──────────────────────────────┬──────────────────────────┘
           │ 只读账号 SQL                  │ POST /v1/kbs/{id}/search
┌──────────▼────────────┐      ┌──────────▼──────────────────────────┐
│ MySQL（业务库）        │      │ services/knowledge-base (FastAPI)    │
│ 仅暴露分析视图         │      │ PostgreSQL + pgvector + BM25 + RRF   │
└───────────────────────┘      └─────────────────────────────────────┘
```

深入阅读：

- [架构总览](docs/architecture/overview.md)
- [对账 Agent](docs/architecture/agent.md)：节点流、说明合约、降级语义
- [知识库](docs/architecture/rag.md)：混合检索、ACL、租户隔离
- [安全模型](docs/architecture/security.md)：身份、SQL 守卫分层、提示注入防护

## 演示环境

| 服务 | 地址 | 说明 |
| --- | --- | --- |
| 管理后台 | http://132.232.166.40/ | 使用下方演示账号登录 |
| 业务 API | http://132.232.166.40/storeapi | ThinkPHP JSON 接口 |
| Agent API | http://132.232.166.40/agent/docs | OpenAPI 文档 |
| 知识库 | http://132.232.166.40/rag/docs | 检索与问答接口 |

演示账号：`18085092430` / `123456`

该环境为单机演示部署，使用测试数据，可能随时重置，不得用于生产流量或存放机密资料。上报方式见 [SECURITY.md](SECURITY.md)。

## 界面截图

| 交班对账 | 汇总与差异明细 |
| --- | --- |
| ![交班对账](docs/screenshots/admin-web/finance-reconciliation.png) | ![汇总与差异明细](docs/screenshots/admin-web/finance-differences.png) |

| 运行轨迹 | 制度问答 |
| --- | --- |
| ![运行轨迹](docs/screenshots/admin-web/agent-trace.png) | ![制度问答](docs/screenshots/admin-web/knowledge-qa.png) |

| 首页仪表盘 | 订单管理 |
| --- | --- |
| ![首页仪表盘](docs/screenshots/admin-web/dashboard.png) | ![订单管理](docs/screenshots/admin-web/orders.png) |

更多截图：[登录](docs/screenshots/admin-web/login.png)、
[财务对账](docs/screenshots/admin-web/finance.png)、
[台桌](docs/screenshots/admin-web/tables.png)、
[商品](docs/screenshots/admin-web/products.png)、
[会员](docs/screenshots/admin-web/members.png)、
[员工](docs/screenshots/admin-web/employees.png)、
[助教](docs/screenshots/admin-web/assistants.png)、
[报表](docs/screenshots/admin-web/reports.png)。

### 移动端员工 App

`apps/mobile-web` 基于 uni-app，可编译为微信小程序与 H5。以下截图取自 H5 版本，390×844 视口，
使用演示店长账号登录。

| 登录 | 门店总览 |
| --- | --- |
| <img src="docs/screenshots/mobile-web/login.png" width="240" alt="移动端登录" /> | <img src="docs/screenshots/mobile-web/home.png" width="240" alt="门店总览" /> |

| 工作台 | 台桌看板 |
| --- | --- |
| <img src="docs/screenshots/mobile-web/work.png" width="240" alt="工作台" /> | <img src="docs/screenshots/mobile-web/table.png" width="240" alt="台桌看板" /> |

| 订单中心 | 打卡签到 |
| --- | --- |
| <img src="docs/screenshots/mobile-web/orders.png" width="240" alt="订单中心" /> | <img src="docs/screenshots/mobile-web/checkin.png" width="240" alt="打卡签到" /> |

更多移动端截图：[本月经营](docs/screenshots/mobile-web/home-month.png)、
[审批中心](docs/screenshots/mobile-web/approval.png)、
[消息通知](docs/screenshots/mobile-web/notification.png)、
[排班查询](docs/screenshots/mobile-web/schedule.png)、
[员工列表](docs/screenshots/mobile-web/employees.png)、
[我的业绩](docs/screenshots/mobile-web/performance.png)、
[个人中心](docs/screenshots/mobile-web/profile.png)、
[设置](docs/screenshots/mobile-web/settings.png)。

## 目录结构

```text
services/agent            FastAPI + LangGraph：对账、分析、知识问答
services/knowledge-base   RAG 服务：入库、混合检索、流式问答
apps/admin-web            Next.js 管理后台
apps/api                  ThinkPHP 业务 API 与对账证据接口
apps/pos-web              收银台
apps/tablet-web           台桌屏
apps/mobile-web           移动端员工端
apps/realtime-gateway     WebSocket 网关
benchmarks                金标数据集与评测脚本
deploy                    Compose、MySQL 初始化、nginx 与 systemd
docs                      架构、指南、参考、ADR、截图
```

## 快速开始

```bash
git clone https://github.com/dengyouming163/billiards-ai.git
cd billiards-ai
docker compose -f deploy/docker/compose.test.yml up -d

cd services/agent
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --host 127.0.0.1 --port 8100
```

包含知识库与管理后台的完整流程见 [docs/guides/quickstart.md](docs/guides/quickstart.md)。

## 质量门禁

| 检查项 | 命令 | 预期 |
| --- | --- | --- |
| Agent 测试 | `cd services/agent && python -m pytest -q` | 204 passed |
| 前端类型 | `cd apps/admin-web && pnpm run ts-check` | 无错误 |
| 前端测试 | `cd apps/admin-web && pnpm exec vitest run` | 13 passed |
| 对账评测 | `python benchmarks/run_reconciliation_eval.py` | 全部用例精确匹配 |
| SQL 安全评测 | `python benchmarks/run_sql_security_eval.py` | 全部攻击被拒绝 |
| 业务 API | `cd apps/api && php vendor/bin/phpunit --testsuite Integration` | 25 passed |

每道门禁在保护什么，见 [评测指南](docs/guides/evaluation.md)。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [架构总览](docs/architecture/overview.md) | 组件边界与请求生命周期 |
| [使用场景](docs/architecture/use-cases.md) | 三类业态、统一计费抽象、差异成因 |
| [Agent](docs/architecture/agent.md) | 节点、说明合约、失败模式 |
| [知识库](docs/architecture/rag.md) | 检索契约、ACL、入库流程 |
| [安全模型](docs/architecture/security.md) | 身份、SQL 守卫、提示注入 |
| [API 参考](docs/reference/api.md) | 请求、响应与错误码 |
| [快速开始](docs/guides/quickstart.md) | 本地跑通全链路 |
| [本地开发](docs/guides/local-dev.md) | 端口、环境文件、常见问题 |
| [评测](docs/guides/evaluation.md) | 数据集与质量门禁 |
| [ADR](docs/adr/) | 为什么数值确定性、为什么双层 SQL 防护、为什么检索失败只降级 |

## 路线图

- 长文本说明的流式渲染。
- 基于既有 trace 记录构建检索质量看板。
- 新增分析视图时，在同一变更内补齐授权与白名单。
- 可插拔模型供应商与按租户的预算控制。

## 参与贡献

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下上报。

## 许可

[Apache-2.0](LICENSE)
