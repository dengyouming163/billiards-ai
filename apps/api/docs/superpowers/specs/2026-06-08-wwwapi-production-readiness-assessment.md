# wwwapi 生产就绪度评估报告

> 日期: 2026-06-08 | 综合评分: 3.0/5 | 框架: ThinkPHP 8 + PHP 8.0+

---

## 一、项目概况

wwwapi 是全局后端，100 个控制器 / 76 个 Logic 文件 / 113 个 Model / 31 个迁移。

| 应用 | 控制器数 | 认证方式 | 前端消费者 |
|------|:--:|------|------|
| storeapi | 37 | JWT Bearer | wwwstore/wwwpos/wwwtable/wwwstoreapp |
| mobile | 14 | JWT Bearer | wwwstoreapp (专用) |
| tablet | 8 | Cache Token | wwwtable |
| adminapi | 14 | Session/JWT | wwwplatform |
| api | 12 | 公开 | 微信/支付宝/短信回调 |

---

## 二、致命安全问题（P0 — 5 项）

| # | 文件 | 问题 | CVSS |
|---|------|------|:--:|
| 1 | AuthLogic:150 | **短信验证码返回在 API 响应中**。`sendSmsCode()` 直接返回 `['code' => $code]` 给客户端，完全绕过短信网关。任何人调用此接口即可获得验证码 | 🔴 9.1 |
| 2 | AuthLogic:44 | **遗留 MD5 密码哈希**。`md5($password) === $employee['password']` 允许通过彩虹表攻击 MD5 哈希 | 🔴 8.2 |
| 3 | AuthLogic | **公开端点无频率限制**。login/smsLogin/resetPassword/sendSmsCode 均无 rate limiting，可暴力破解 | 🔴 7.5 |
| 4 | BaseStoreController:26 | **store_id 来自用户输入未经权限验证**。控制器接受 GET/POST 中的 store_id 而无需验证用户是否有权访问该门店 | 🔴 7.0 |
| 5 | OrderLogic:16 | **跨门店数据泄露**。`getOrderDetail()` 仅按 order_id 查询，无 store_id 过滤，任何认证用户可查看任意门店订单 | 🔴 6.5 |

---

## 三、高优问题（P1 — 8 项）

| # | 类别 | 问题 |
|---|------|------|
| 6 | 认证 | Token 刷新无实现 — `refresh_token` 永远返回空字符串，token 过期后用户被强制登出 |
| 7 | 认证 | 修改密码不吊销现有 session — 旧 token 在密码变更后仍然有效 |
| 8 | 数据完整性 | 20+ 个控制器方法缺少 `$result === false` 错误检查（lists/all/types等方法） |
| 9 | 计费 | Pricing 模型定义了 `BOUNDARY_*` 和 `ROUNDING_*` 策略但计费引擎从未使用 |
| 10 | 数据模型 | Employee 模型**无 store_id** — 无法做多门店隔离 |
| 11 | 安全 | OrderLogic `generateId()` 用 `md5(uniqid(mt_rand()))` — 可预测 ID，易受 IDOR 攻击 |
| 12 | 安全 | LoginMiddleware 路径前缀 `pos/tablet` 绕过认证存在路由竞态 |
| 13 | 计费 | `estimateOrderFee()` 不处理预付订单 |

---

## 四、低优问题（P2 — 6 项）

| # | 问题 |
|---|------|
| 14 | 100 个控制器无一做服务端字段验证（全部委托 Logic 层） |
| 15 | OrderItem 无软删除（与其他所有模型不一致） |
| 16 | TableFeeCalculatorLogic 分钟级遍历循环在大时长下有性能隐患 |
| 17 | 会员折扣率硬编码在代码而非数据库 |
| 18 | OrderLogic:65 有空指针 bug（`$table->name` 在 null check 前访问） |
| 19 | `migrations/` 中表前缀不一致（`bi_busi_` vs `busi_` vs `bi_`） |

---

## 五、架构评估

### 亮点

1. **四层多应用架构** — storeapi/mobile/tablet/adminapi 分离清晰
2. **Permission 注解体系** — PHP 8 Attribute 驱动的权限控制
3. **Logic 层隔离** — 控制器薄，业务逻辑在 Logic 类中
4. **JsonService 统一响应** — `{code, msg, data}` 模式贯穿全局
5. **软删除全覆盖** — 几乎所有模型支持 `deleted_at`
6. **多支付方式** — Order 模型完整支持 wechat/alipay/cash/balance/card 五种支付

### 架构债务

1. **无输入验证层** — 100 个控制器直接透传 raw params 到 Logic
2. **URL 正则提取 ID** — 多个控制器通过 regex 解析 URL 获取 ID，路由绑定不可靠
3. **重复权限检查** — 同时使用 `#[Permission]` 注解和手动 `checkPermission()` 调用
4. **Token 服务代码重复** — EmployeeTokenService 和 PosEmployeeTokenService 95% 相同

---

## 六、就绪度

```
安全性:     ██████░░░░░░░░░░░░░░  30%  ← SMS/密码/跨店 三个致命漏洞
正确性:     ████████████░░░░░░░░  60%  ← 20+ 错误检查缺失
完整性:     ████████████████░░░░  80%  ← 100 控制器覆盖充分
代码质量:   ██████████████░░░░░░  70%  ← 结构清晰但细节粗糙

综合: ~60% 就绪
```

### 五项目对比

| 项目 | 初始 | 修复后 | 核心风险 |
|------|:--:|:--:|------|
| wwwstoreapp | 75% | 93% | — |
| wwwtable | 60% | 93% | — |
| wwwpos | 47% | 85% | — |
| wwwstore | 75% | 82% | — |
| **wwwapi** | **60%** | — | 🔴 3个安全漏洞 |

### 修复优先级

```
Phase 1 (安全): SMS不返回码 + 废弃MD5 + 限流 + store_id校验   预计 4-6h
Phase 2 (修复): 20+ 错误检查 + 计费引擎 + Employee store_id     预计 4-6h
Phase 3 (优化): 输入验证 + Token统一 + 命名规范                  预计 3-4h
```
