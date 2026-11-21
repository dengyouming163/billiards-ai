# M0 测试数据库环境证据

## 结论

**状态：通过（Task 2）。**

用户明确授权的备份已完整导入本地隔离 Docker 测试库。未连接生产数据库，未修改原 ZIP，未操作非本任务容器或卷。完整 SQL、ZIP 和业务数据均未复制到 `deploy/mysql/init`，也未纳入 Git。

## 备份安全检查与完整导入

- 备份来源：用户提供的本地 MySQL 全库备份；转储头标识来源为 MySQL 5.7.40。
- 原 ZIP SHA-256：`5c3f7d5d98bb3ad456555dca1c7fdf64cb3f7d08d9fbd885fd7fc1af9580c775`。
- ZIP 预检：1 个条目、0 个不安全条目；仅含 `.sql` 文件，无路径穿越、绝对路径或符号链接。
- 解压位置：仓库外任务专用目录 `D:\tmp\billiards-agent-m0m1-full-import`；验收后临时 SQL 已从该目录移除，原 ZIP 保留且未修改。
- 解压 SQL SHA-256：`47a4a42e5060734e67b82ec282e48625a031b5134e28f31c5e4678bcc6c60ecc`。
- SQL 预检：无 `CREATE DATABASE`、`USE`、账号授权语句或 `mysql` 系统库写入语句，因此无需改写库名，导入时显式指定 `billiards_test`。
- 完整导入结果：命令退出码 0；实际导入库包含 **103 张基础表、1 个视图**。
- 容器重建后复核：仍为 103 张基础表、1 个视图，临时验证 Schema 数量为 0。

## 独立重建全量数据对照

- 复核方法：从原 ZIP 在仓库外目录 `D:\tmp\billiards-agent-m0m1-import-verify-c6d08b2` 重新解压同一 SQL，ZIP 与 SQL 的 SHA-256 均和上文记录一致；源 SQL SHA-256 为 `47a4a42e5060734e67b82ec282e48625a031b5134e28f31c5e4678bcc6c60ecc`。
- 独立重建：在本任务 MySQL 容器内创建唯一临时库 `billiards_import_verify_c6d08b2`，导入同一完整 dump，退出码为 0；临时库包含 103 张基础表、1 个视图。未使用 `mysql` 系统库。
- 对照方法：以 `information_schema` 获取双方基础表集合，对全部基础表逐表执行 `COUNT(*)`，根据逐表行数生成非空表集合，并对双方每张基础表执行 `CHECKSUM TABLE`。全程只汇总匹配数和差异数，未输出或记录业务行。
- 表集合：`billiards_test` 与临时验证库均为 103 张基础表，表集合差异 **0**。
- 逐表行数：**103/103 张表匹配，差异 0**。
- 非空表集合：双方均为 **77 张非空表**，集合差异 **0**。
- 内容校验：**103/103 张表 `CHECKSUM TABLE` 结果匹配，差异 0，不支持校验的表为 0**。
- 视图：双方均存在同名的 1 个视图。原始 `VIEW_DEFINITION` 包含各自不同的 Schema 限定符；去除各自 Schema 限定符后，**1/1 视图定义匹配，语义差异 0**。
- 清理：对照完成后仅删除本次临时验证库；目标 `billiards_test` 保留。容器内临时 SQL 已删除，仓库外解压 SQL 已从任务临时目录移除。删除受平台回收站机制约束，不主张安全擦除。

## 实际运行环境

| 项目 | 实际结果 |
| --- | --- |
| Git 分支 | `feature/m0-m1` |
| Docker Server | 29.5.2 |
| Docker Compose | v5.1.3 |
| Compose 项目 | `billiards-agent-m0m1` |
| MySQL | 8.0.46，`healthy` |
| PostgreSQL | 16.16，`healthy` |
| MySQL 数据库 | `billiards_test` |
| PostgreSQL 数据库 | `agent_test` |
| MySQL 端口 | `127.0.0.1:13306 -> 3306` |
| PostgreSQL 端口 | `127.0.0.1:15432 -> 5432` |
| MySQL 卷 | `billiards-agent-m0m1_mysql-test-data` |
| PostgreSQL 卷 | `billiards-agent-m0m1_postgres-test-data` |

启动前检查结果：本任务项目容器和卷均不存在，13306/15432 无本机监听或容器发布冲突。最终端口仅绑定 IPv4 回环地址。

## Schema 基线与权限验证

- `001-schema.sql` 来源：对实际完成全量导入的 `billiards_test` 执行 `mysqldump`。
- 导出参数：`--no-data --single-transaction --skip-comments --set-gtid-purged=OFF`。
- 文件大小：167,645 字节；2,386 行。
- 导出后仅移除 1 处行尾空白和末尾多余空行，未改动 SQL 语义。
- SHA-256：`bc03a6730cb456cd7d77b970cfdf7287b083442672040586b491bc29bcbd541b`。
- 结构计数：103 个 `CREATE TABLE`，与实际基础表数量一致。
- 安全扫描：`INSERT`、`REPLACE`、`UPDATE` 数据写入语句为 0；`GRANT`、`REVOKE`、账号管理语句为 0；建库和切库语句为 0。
- 可执行性验证：在临时 `billiards_schema_check` 数据库中完整执行成功，随后已删除该临时数据库。
- `002-agent-readonly.sql` 已在初始化时成功执行；复核 `bi_agent_ro` 仅具有 `USAGE`，非 `USAGE` 授权数量为 0，尚无基础表或视图权限。

## 边界与保留风险

- 隔离 MySQL 卷包含授权导入的完整测试数据，必须继续限制在本机使用，不得提交、导出或共享该卷。
- 环境删除操作会由当前平台转入回收站；本证据不主张已对临时 SQL 做安全擦除。
- 来源为 MySQL 5.7 转储，目标为 MySQL 8.0.46；本次证明完整导入与结构执行成功，不代表应用层兼容性测试已经完成。
- 本任务未启动或修改 RAG，未开始 Task 3。
