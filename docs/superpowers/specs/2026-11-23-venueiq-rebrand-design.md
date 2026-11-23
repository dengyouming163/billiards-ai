# VenueIQ 品牌重塑与多业态定位设计

- 日期：2026-11-23
- 状态：已确认
- 品牌名：**VenueIQ**
- 仓库名：`venueiq`（由 `billiards-ai` 改名）
- 原系统名：台屏智联 / BilliardsHub

## 1. 背景

当前系统名「台屏智联」把产品限制在台球场景，且中英文混用、缺少明确价值主张。项目实际能力是
「时间计费 + 服务计费 + 商品计费」的通用场馆运营，覆盖台球、KTV、棋牌、桌游等多业态，并叠加
确定性对账、只读 SQL 分析与 RAG 制度检索三层 AI 能力。

品牌与文档需要同步升级：名称国际化、定位多业态、介绍从功能清单转为业务价值叙事。

## 2. 目标与非目标

### 目标

- 系统名统一为 **VenueIQ**，所有用户可见界面、页面标题、种子数据、法务文案中的旧名全部替换。
- README 与架构文档改为「多业态场馆智能运营」叙事，新增使用场景专章。
- 按新品牌与新演示门店重拍全部截图，并新增收银端截图。
- 仓库更名为 `venueiq`，同步远端地址、部署路径与文档链接。

### 非目标

- 不重写业务逻辑，不改计费算法与数据库结构。
- 不重命名 npm 包名（`wwwstore`、`wwwstoreapp` 等）与容器名，避免破坏锁文件与线上运行。
- 不改写历史计划文档中的旧名（保留决策痕迹）。
- 不改 `wwwapi`、`wwwsocket` 的目录结构。

## 3. 品牌规范

| 项 | 值 |
| --- | --- |
| 品牌名 | VenueIQ |
| 品牌副标 | Smart Venue Operations |
| 中文定位 | 多业态场馆智能运营平台 |
| 一句话介绍 | 面向台球、KTV、棋牌等计时与服务型场馆的 AI 运营底座 |
| 演示门店 | VenueIQ 体验店 |
| 主色 | 沿用现有青绿 #10b981 体系，不做视觉改版 |

替换映射：

| 旧值 | 新值 |
| --- | --- |
| 台屏智联 | VenueIQ |
| PREMIUM BILLIARDS | SMART VENUE OPERATIONS |
| 台球行业数字化管理平台 | 多业态场馆智能运营平台 |
| 球房管理系统 / 球房管理 | 场馆智能运营平台 |
| BilliardsHub | VenueIQ |
| KD台球总店 | VenueIQ 体验店 |

## 4. 多业态定位

### 统一计费抽象

| 维度 | 台球俱乐部 | KTV / 量贩 | 棋牌 / 桌游 |
| --- | --- | --- | --- |
| 时间计费 | 台费（按小时、包段、会员价） | 包厢费（按时段、最低消费） | 桌费（按小时、包场） |
| 服务计费 | 助教陪练费、计时分成 | 服务费、公主/少爷费 | 服务费、陪打费 |
| 商品计费 | 饮品、器材、零食 | 酒水、果盘、小食 | 茶水、零食 |
| 预付 | 会员储值、次卡 | 储值、存酒 | 储值、月卡 |
| 对账重点 | 台费时长 × 单价、助教单量 | 包厢时长、最低消费补差 | 桌时、服务单 |

### AI 三层能力与场景的关系

| 能力 | 解决什么 | 典型场景 |
| --- | --- | --- |
| 确定性交班对账 | 签退快照与重算证据逐项比对，差异可追溯 | 台费漏记、助教单未入账、商品未过机 |
| 只读 SQL 分析 | 自然语言问经营数据，不碰写操作 | 各支付渠道营收、台桌利用率、助教产出 |
| RAG 制度检索 | 差异处置与SOP引用，带租户与文档 ACL | 差异超过阈值如何复核、退款与挂账规则 |

## 5. 改造范围

### 代码与文案

| 文件 | 改动 |
| --- | --- |
| `apps/admin-web/src/app/layout.tsx` | 页面标题与模板 |
| `apps/admin-web/src/app/login/layout.tsx` | 登录页标题 |
| `apps/admin-web/src/app/login/page.tsx` | 登录页品牌、副标、页脚 |
| `apps/admin-web/AGENTS.md` | 项目名与定位描述 |
| `apps/pos-web/src/app/login/page.tsx` | 品牌、页脚 |
| `apps/pos-web/src/app/select-store/page.tsx` | 页脚 |
| `apps/mobile-web/src/pages/login/index.vue` | 品牌名与英文副标 |
| `apps/mobile-web/index.html` | 标题 |
| `apps/mobile-web/src/manifest.json` | 应用名（若存在 app 名称字段） |
| `apps/mobile-web/hybrid/html/{service-agreement,privacy-policy}.html` | 主体名称与场景描述 |
| `apps/tablet-web/index.html` | 标题 |
| `apps/api/database/migrations/*init_business_tables.sql` | 项目配置种子名 |
| `deploy/nginx/billiards-ai.conf` → `venueiq.conf` | 文件名与注释 |
| `deploy/docker/compose.prod.yml` | 仅为注释与镜像说明，服务名保持不变 |

### 数据

| 位置 | 改动 |
| --- | --- |
| 本地 MySQL `billiards_test` | 项目配置名、演示门店名 |
| 服务器 MySQL | 同上 |
| 移动端缓存 | 重新登录即可刷新 |

### 文档

| 文件 | 改动 |
| --- | --- |
| `README.md` / `README.zh-CN.md` | 抬头、定位、能力矩阵、场景章节、画廊 |
| `docs/architecture/overview.md` | 定位与场景边界 |
| `docs/architecture/use-cases.md`（新增） | 多业态场景与计费抽象、AI 对应关系 |
| `CHANGELOG.md` | 新增品牌重塑条目 |
| `docs/guides/deployment.md` | 仓库名、nginx 文件名 |

### 截图

全部重拍，品牌更新后：

- 管理端 14 张：登录、仪表盘、台桌、订单、商品、会员、员工、助教、报表、财务、对账报告、差异明细、运行轨迹、制度问答。
- 移动端 15 张：登录、首页（今日/本月）、工作台、台桌、订单、签到、签到记录、审批、通知、排班、员工、业绩、我的、宣传页、设置。
- 收银端 4 张：登录、选择门店、收银台、开台。

## 6. 仓库改名步骤

1. 用户在 GitHub Settings → Rename repository 改为 `venueiq`。
2. 本地执行 `git remote set-url origin https://github.com/dengyouming163/venueiq.git` 并推送。
3. 服务器更新 `/opt/billiards-ai` 的 origin，部署路径暂不变（避免容器与 systemd 引用失效）。
4. 文档中的克隆地址同步为 `venueiq.git`。

## 7. 验收标准

- 全仓检索 `台屏智联|PREMIUM BILLIARDS|BilliardsHub|KD台球` 在非历史文档中无命中。
- 管理端 `ts-check` 通过、Vitest 13 passed、`build:win` 成功。
- 移动端 H5 可启动，登录页显示 VenueIQ 与 SMART VENUE OPERATIONS。
- 收银端登录页显示 VenueIQ，收银台可打开。
- 新增 `docs/architecture/use-cases.md`，覆盖台球、KTV、棋牌三类场景的台费/服务费/商品费。
- 33 张截图全部更新，README 引用全部可达。
- 公网演示：登录、对账仍 `degraded=false`，门店名显示 VenueIQ 体验店。

## 8. 风险

| 风险 | 缓解 |
| --- | --- |
| 仓库改名后旧链接失效 | 保留改名说明；GitHub 会自动重定向旧 URL |
| 数据改名影响历史订单展示 | 只改门店与项目配置名，不改订单表 |
| 截图与代码不一致 | 先改代码与数据，再统一重拍 |
| 移动端缓存旧品牌 | 清缓存并重新登录后截图 |
