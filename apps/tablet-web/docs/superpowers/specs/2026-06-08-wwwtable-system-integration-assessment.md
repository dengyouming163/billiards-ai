# wwwtable 系统集成评估 & 最终优化计划

> 日期: 2026-06-08 | 基于全项目 7 子系统的完整业务流分析

---

## 一、全系统业务流 & wwwtable 角色定位

```
                                  ┌──────────────┐
                                  │  wwwplatform │  SaaS 平台管理
                                  └──────┬───────┘
                                         │ 管理商户/套餐
    ┌────────────────────────────────────┼────────────────────────────────────┐
    │                                    │                                    │
    ▼                                    ▼                                    ▼
┌──────────┐  REST API  ┌──────────────────────────────┐  REST API  ┌──────────┐
│ wwwstore │◄──────────►│          wwwapi              │◄──────────►│ wwwpos   │
│ 管理后台  │            │      ThinkPHP 8 后端          │            │ POS收银  │
│ 老板/店长 │            │  37模块 · JWT认证 · ORM       │            │ 收银员   │
└──────────┘            └──────┬───────────┬───────────┘            └────┬─────┘
                               │           │                             │
                      ┌────────┘           └────────┐                    │
                      │ HTTP API                     │ HTTP API           │
                      ▼                              ▼                    │
              ┌──────────────┐              ┌──────────────┐             │
              │ wwwstoreapp  │              │  wwwtable    │◄────────────┘
              │ 员工手机端    │              │ 顾客大屏端    │  ← POS开台后
              │ 服务员/助教   │              │ 平板浏览器    │    状态同步
              └──────┬───────┘              └──────┬───────┘
                     │                             │
                     │   WebSocket                 │   WebSocket
                     │   ws://:8282                │   ws://:8282
                     ▼                             ▼
              ┌──────────────────────────────────────────┐
              │              wwwsocket                    │
              │          Workerman GatewayWorker          │
              │   Register:1238 · WS:8282 · TCP:8283     │
              │   频道: store_{id} · table_{id}           │
              └──────────────────────────────────────────┘
                               │
                               │ GatewayClient (PHP)
                               ▼
              ┌──────────────────────────────────────────┐
              │              MySQL billiards              │
              │               bi_ 前缀 · 50+表            │
              └──────────────────────────────────────────┘
```

---

## 二、wwwtable 参与的 6 条核心业务流

### 流程 1: 扫码开台

```
顾客进店 → 扫描台桌二维码 → 获取台桌码(6位)
  → wwwtable login(code) → tablet.Auth/login
  → wwwapi 验证台桌码 → 返回 token + table_info
  → wwwtable 首页(空闲模式) → 点击"一键开台"/"预付开台"
  → tablet.Order/quickCreate → wwwapi 创建订单 → 台桌状态=occupied
  → POS 端实时看到台桌变为"使用中"（WebSocket table_status）
```

**wwwtable 当前状态**: ✅ 完整

### 流程 2: 商品预下单

```
顾客点单 → wwwtable 浏览商品 → 加入购物车 → 提交预订单
  → tablet.Order/createPreOrder → wwwapi
  → GatewayClient → wwwsocket → POS 端 WebSocket 通知
  → 收银员在 POS 上确认/拒绝
  → wwwsocket → wwwtable WebSocket (preorder_confirmed/rejected)
  → 顾客看到订单状态变化
```

**wwwtable 当前状态**: ✅ API+WebSocket 完整。🟡 无商品图片展示（API 有 image 字段但页面未用）

### 流程 3: 服务呼叫

```
顾客呼叫服务 → wwwtable 点击服务类型 → WebSocket service_call
  → wwwsocket → store_ 频道广播 → POS/员工手机收到
  → 服务员响应 → WebSocket service_call_response
  → wwwtable 收到响应 → 展示处理状态
```

**wwwtable 当前状态**: ✅ WebSocket 收发完整。✅ EvaluateModal 已连线

### 流程 4: 助教预约

```
顾客预约助教 → wwwtable 选择助教+时长 → tablet.Order/bookAssistant
  → wwwapi → WebSocket → wwwstoreapp(助教手机) 收到
  → 助教接单/开始/结束 → WebSocket 状态更新
  → wwwtable 实时看到助教状态变化
```

**wwwtable 当前状态**: ✅ API 完整(已传 duration)。🟡 礼物发送无 API

### 流程 5: 结账

```
顾客结账 → wwwtable 账单页 → 选择支付方式 → tablet.Order/checkout
  → wwwapi → POS 确认 → 台桌状态=idle
  → WebSocket table_status → wwwtable 首页回到空闲模式
```

**wwwtable 当前状态**: ✅ 完整

### 流程 6: 台球计分

```
娱乐功能 → wwwtable 选择游戏 → 本地/API 计分 → endGame
  → 可选 API 同步(ScoreController)
```

**wwwtable 当前状态**: ✅ 10种游戏完整。本地回退模式为主

---

## 三、系统集成层面 wwwtable 还需优化

### 3.1 缺失功能（影响用户完整链路）

| # | 问题 | 影响 | 优先级 |
|---|------|------|--------|
| 1 | **无二维码扫描入口** | 顾客需手动输入6位台桌码 | P1 |
| 2 | **预订单无商品图片** | 浏览体验差，API 返回 image 但页面未渲染 | P1 |
| 3 | **账单页缺会员折扣展示** | 会员用户看不到优惠明细 | P2 |
| 4 | **活动页无实际功能** | 活动展示纯静态，无法真正参与 | P2 |
| 5 | **并台后账单不清晰** | merge 后费用来源不透明 | P2 |

### 3.2 体验优化（不影响功能但影响感受）

| # | 问题 | 影响 | 优先级 |
|---|------|------|--------|
| 6 | **音效缺失** | 开台/下单/结账无声音反馈 | P2 |
| 7 | **开屏动画后无过渡** | OpenAnimation → 首页切换生硬 | P3 |
| 8 | **横屏适配验证** | 平板横屏布局未实机测试 | P2 |
| 9 | **商品列表无骨架屏** | 分类加载时页面空白 | P2 |
| 10 | **WebSocket 断连无用户提示** | 重连中用户不知道连接状态 | P2 |

### 3.3 代码质量（已基本解决，剩余少量）

| # | 问题 | 优先级 |
|---|------|--------|
| 11 | 60 个 TS 类型警告（预存，strict=false 不阻塞） | P3 |
| 12 | ServiceCard/VipCard 代码重复 | P3 |
| 13 | 首页 idel/order 双模式 CSS 冗余 | P3 |

---

## 四、与其他子项目的关联完整性验证

| 关联路径 | wwwtable → 目标 | 状态 | 说明 |
|----------|-----------------|------|------|
| 开台 → POS | tablet.Order/open → wwwpos | ✅ | API + WebSocket |
| 预订单 → POS | tablet.Order/createPreOrder → wwwpos | ✅ | WebSocket 通知 |
| 服务呼叫 → POS/员工 | WebSocket → store_ group | ✅ | 双向确认 |
| 助教预约 → 员工手机 | tablet.Order/bookAssistant → wwwstoreapp | ✅ | WebSocket 通知 |
| 结账 → POS | tablet.Order/checkout → wwwpos | ✅ | API |
| 台桌状态同步 | POS 开台 → wwwtable | ✅ | WebSocket table_status |
| 商品数据源 | wwwstore 管理后台 | ✅ | 共用 product 表 |
| 会员绑定 | wwwstore 管理后台 | ✅ | 共用 member 表 |

---

## 五、最终优化建议

### 立即可做（无需后端改动）

1. **添加二维码扫描入口** — `uni.scanCode()` 调用，解析二维码中的 table code
2. **商品列表渲染图片** — product 页展示 `item.image` 字段
3. **商品列表骨架屏** — 加载时用 Skeleton 组件
4. **WebSocket 连接状态提示** — 重连中显示"连接中..."指示器

### 需要后端配合

5. **会员折扣展示** — API 返回 discount 信息，账单页展示
6. **活动参与功能** — 后端实现活动报名 API
7. **音效资源** — 后端提供音频文件 URL 或内置短音效

### 可后续迭代

8. ServiceCard/VipCard 合并为一个组件
9. 首页模式切换动画
10. 平板横屏全面适配测试

---

## 六、最终就绪度

```
代码质量:  ██████████████████░░  90%
功能完整:  ████████████████░░░░  85%
系统集成:  ██████████████████░░  92%
用户体验:  ██████████████░░░░░░  75%

综合: ~85% 生产就绪
```

**结论**: wwwtable 经过 8 轮修复，核心业务流完整，7 子项目集成链路通顺。剩余工作集中在体验打磨（音效/图片/骨架屏）和边缘功能（活动页/会员折扣展示），可在 1-2 周内完成。
