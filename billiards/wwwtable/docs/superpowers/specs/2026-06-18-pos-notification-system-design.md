# 收银端消息通知系统 — 设计方案

> 设计日期：2026-06-18 | 状态：已确认

## 一、背景与目标

### 1.1 当前状态
- wwwpos 定义了 6 个通知 API 端点（`/pos.Notification/*`）但**无通知 UI 组件**，收银员完全看不到通知
- 整个系统无语音/提示音播报
- WebSocket 基础设施已具备（Workerman 8282 端口，频道 `store_{storeId}`），wwwpos 未接入
- 后端在点单时已推送 WebSocket 消息，但开台/助教申请等缺少实时推送
- 通知存储表 `busi_notification` 无自动清理机制

### 1.2 目标
为收银端（POS）构建完整的实时消息通知系统，支持：
- **7 类业务通知**：服务呼叫、台桌开台、新点单、助教申请、超时预警、结账提醒、库存预警、系统公告
- **实时送达**：WebSocket 主通道 + HTTP 轮询补漏
- **语音播报**：浏览器 SpeechSynthesis API，零依赖
- **三种提示音**：急促三连音（紧急）/ 清脆单音（普通）/ 轻柔短音（非紧急）
- **通知历史管理**：7 天自动清理

---

## 二、架构设计

### 2.1 架构图

```
┌────────────────────────────────────────────────────────┐
│                     wwwpos (React)                      │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│  │ WebSocket│  │   HTTP   │  │  NotificationSound   │  │
│  │ Manager  │  │ Polling  │  │  (SpeechSynthesis)   │  │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘  │
│       │              │                    │             │
│       └──────┬───────┘                    │             │
│              ▼                            │             │
│  ┌───────────────────────┐               │             │
│  │  NotificationService  │◄──────────────┘             │
│  │  (单例，全局状态管理)  │                              │
│  │                       │                              │
│  │  • 消息队列 + 去重    │                              │
│  │  • 优先级路由         │                              │
│  │  • localStorage 持久化│                              │
│  │  • 对外暴露 hooks     │                              │
│  └───────────┬───────────┘                              │
│              │                                          │
│              ▼                                          │
│  ┌───────────────────────┐                             │
│  │   NotificationPanel   │  ← 右侧滑出抽屉              │
│  │   NotificationBadge   │  ← Header 未读数角标         │
│  │   NotificationToast   │  ← 右上角弹出提示            │
│  └───────────────────────┘                             │
└────────────────────────────────────────────────────────┘

后端:
┌──────────────────────┐    ┌──────────────────────────┐
│  Workerman WebSocket │◄───│ WebSocketNotification.php │
│  (channel: store_X)  │    │ (PHP 主动推送)             │
└──────────────────────┘    └──────────────────────────┘
                                      ▲
                                      │ 触发时机:
                                      │ • TableOpenLogic::quickOpen()
                                      │ • POS OrderController::addProductItem()
                                      │ • POS OrderController::addAssistantItem()
                                      │ • ServiceCallController
┌──────────────────────┐
│  /pos.Notification/* │  ← REST API (轮询补漏 + 历史)
│  Cron: 7天清理       │
└──────────────────────┘
```

### 2.2 数据流

```
业务事件发生(后端)
    │
    ├──→ busi_notification 表 (持久化)
    │
    └──→ WebSocketNotification::sendToGroup("store_X", {...})
              │
              ▼
    Workerman Gateway → WebSocket Client (POS)
              │
              ▼
    PosWebSocket.onMessage(msg)
              │
              ▼
    NotificationService.enqueue(notification)
              │
              ├──→ 去重检查 (type+tableId, 3s窗口)
              ├──→ 写入内存队列
              ├──→ localStorage 持久化
              ├──→ 优先级路由:
              │      urgent → NotificationToast + sound.alert + TTS
              │      normal → sound.ding + TTS
              │      silent → sound.subtle (仅提示音)
              ├──→ 触发 subscribe 回调
              └──→ 更新未读数

HTTP 轮询 (10s/30s)
    │
    └──→ GET /pos.Notification/lists?since={lastFetch}
              │
              ▼
    NotificationService.onHttpFetch(list)
              │
              └──→ 与本地已有 ID 对比 → 新消息入队
```

---

## 三、核心模块设计

### 3.1 NotificationService（通知服务中心）

**文件：** `wwwpos/src/services/notification-service.ts`

单例模式，全局唯一实例。负责：双通道消息聚合、去重、优先级路由、持久化。

#### 接口

```typescript
class NotificationService {
  // 生命周期
  static getInstance(): NotificationService
  init(storeId: string): void
  destroy(): void

  // 消息接入
  onWsMessage(raw: WSMessage): void
  onHttpFetch(list: any[]): void

  // 状态查询
  getNotifications(): AppNotification[]
  getUnreadCount(): number
  getNotificationsByType(type: NotificationType): AppNotification[]

  // 操作
  markAsRead(id: string): Promise<void>
  markAllAsRead(): Promise<void>
  removeNotification(id: string): Promise<void>

  // 订阅
  subscribe(cb: (n: AppNotification) => void): () => void
  onUnreadCountChange(cb: (count: number) => void): () => void
}
```

#### 去重策略

```
相同 (type + data.tableId + data.type 子字段) 在 3 秒窗口内重复出现
→ 仅保留最新一条，更新 count 字段（如 "新点单 x3"）
→ 窗口外的同名通知视为新通知
```

#### 优先级路由

```typescript
private route(notification: AppNotification): void {
  const config = NOTIFICATION_CONFIG[notification.type]
  // 1. Toast: urgent 类型弹出
  if (config.priority === 'urgent') {
    this.activeToasts.push(notification)
  }
  // 2. 提示音: 所有类型都播放
  notificationSound.playTone(config.sound)
  // 3. 语音: 仅 tts=true 的类型
  if (config.tts && config.ttsTemplate) {
    const text = fillTemplate(config.ttsTemplate, notification)
    const speakPriority = config.priority === 'urgent' ? 'urgent' : 'normal'
    notificationSound.speak(text, speakPriority)
  }
  // 4. 列表: 始终写入
  this.notifications.unshift(notification)
  // 5. 持久化
  this.persist()
}
```

#### 持久化

localStorage key: `pos_notifications`，最多保留 50 条。字段：
```typescript
interface StoredNotification {
  id: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown>
}
```

### 3.2 通知类型与优先级配置

```typescript
type NotificationPriority = 'urgent' | 'normal' | 'silent'

interface NotificationConfig {
  priority: NotificationPriority
  sound: 'alert' | 'ding' | 'subtle'
  tts: boolean
  label: string
  ttsTemplate?: string
}

const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> = {
  service_call:    { priority: 'urgent',  sound: 'alert',  tts: true,
    label: '服务呼叫',   ttsTemplate: '{table} 呼叫服务 - {type}' },
  table_timeout:   { priority: 'urgent',  sound: 'alert',  tts: true,
    label: '超时预警',   ttsTemplate: '注意，{table} 预付时间即将用完' },
  checkout_remind: { priority: 'urgent',  sound: 'alert',  tts: true,
    label: '结账提醒',   ttsTemplate: '{table} 已超时，请提醒结账' },
  table_open:      { priority: 'normal',  sound: 'ding',   tts: true,
    label: '台桌开台',   ttsTemplate: '{table} 开台，{count}人' },
  new_order:       { priority: 'normal',  sound: 'ding',   tts: true,
    label: '新点单',     ttsTemplate: '{table} 新点单，{count}件' },
  assistant_apply: { priority: 'normal',  sound: 'ding',   tts: true,
    label: '助教申请',   ttsTemplate: '{table} 申请助教 {assistant}' },
  low_stock:       { priority: 'silent',  sound: 'subtle', tts: false,
    label: '库存预警' },
  system_notice:   { priority: 'silent',  sound: 'subtle', tts: false,
    label: '系统公告' },
}
```

---

### 3.3 WebSocket 接入

**文件：** `wwwpos/src/utils/ws-notification.ts`

#### 连接配置

```
URL:     wss://api.tpzl88.com:8282 (从 config 读取)
频道:    store_{storeId}
心跳:    25s ping
重连:    指数退避 1s→2s→4s→8s→16s，最多 5 次
降级:    5 次失败后切换到纯 HTTP 模式，每 60s 尝试重连
```

#### 消息格式（与现有 Events.php 协议一致）

```typescript
interface WSMessage {
  type: 'new_order_item' | 'order_item_status' | 'table_status'
      | 'order_update' | 'notification' | 'service_call'
      | 'table_open' | 'assistant_apply' | 'subscribe_ack'
  channel: string
  data: Record<string, unknown>
  timestamp: string
}
```

#### HTTP 轮询降级

```
WS 在线:    每 30 秒 GET /pos.Notification/lists?since={lastFetch}&page_size=20
WS 离线:    每 10 秒 GET (提高频率)
增量拉取:   传 since 时间戳，后端返回该时间之后的新通知
去重:      对比本地已有 ID，过滤已存在的
```

---

### 3.4 语音播报 + 提示音

**文件：** `wwwpos/src/utils/notification-sound.ts`

#### 技术选择

- **Web Speech API** (`window.speechSynthesis`) 做 TTS 语音播报
- **Web Audio API** (`AudioContext`) 生成提示音
- 零外部依赖，Electron 打包后 Chromium 内核完全兼容

#### 语音选择策略

```
优先级:
  1. Microsoft Huihui Desktop (Windows 自带，女声)
  2. Microsoft Kangkang Desktop (Windows 自带，男声)
  3. 第一个 lang='zh-CN' 的 voice
  4. 第一个 lang='zh' 的 voice
  5. null → 降级不播报
```

#### 播报参数

```
语速: 1.1x (稍快，提高收银效率)
音调: 1.0
音量: 0.8
```

#### 播报队列

```
SpeechSynthesis 不支持并发:
  - normal 消息: 追加到队尾
  - urgent 消息: 中断当前播报，插队到队首
  - 最大队列长度: 10 条 (超出丢弃最早的非 urgent)
```

#### 提示音生成 (Web Audio API)

| 音效 | 波形 | 频率 | 时长 | 用途 |
|------|------|------|------|------|
| **alert** | square | 800/1000/1200Hz 三连音 | 0.4s | 服务呼叫、超时预警、结账提醒 |
| **ding** | sine | 880Hz 单音 | 0.2s | 台桌开台、新点单、助教申请 |
| **subtle** | sine | 520Hz 单音 | 0.1s | 库存预警、系统公告 |

#### 静音控制

```
localStorage key: pos_notification_muted
切换按钮: Header 铃铛旁
静音时: 取消所有进行中的播报，清空队列，不播放提示音
```

---

### 3.5 UI 组件

#### 3.5.1 NotificationBadge（未读数角标）

**文件：** `wwwpos/src/components/NotificationBadge.tsx`

```
显示规则:
  - 未读数 > 0:  红色圆形角标，显示数字
  - 未读数 > 99: 显示 "99+"
  - 未读数 = 0:  隐藏角标
  - 新通知到达:  scale(1→1.3→1) 弹跳动画 0.3s

Props:
  count: number
  onClick: () => void
  muted: boolean
  onToggleMute: () => void
```

#### 3.5.2 NotificationToast（即时弹出提示）

**文件：** `wwwpos/src/components/NotificationToast.tsx`

```
显示规则:
  - 仅显示 urgent 优先级通知
  - 固定右上角，宽度 360px，z-index: 100
  - 最多同时显示 3 条
  - 每条展示 3 秒后自动消失（进度条倒计时）

  - 颜色区分:
    service_call:    红色左边框 #ef4444
    table_timeout:   橙色左边框 #f59e0b
    checkout_remind: 橙色左边框 #f59e0b

  - 交互:
    点击 → 跳转到对应台桌（通知携带 tableId）
    hover → 暂停自动消失

  - 动画: translateX(100%) → translateX(0), 200ms ease
```

#### 3.5.3 NotificationPanel（右侧滑出抽屉）

**文件：** `wwwpos/src/components/NotificationPanel.tsx`

```
布局:
  ┌─────────────────────────────────────────┐
  │  消息中心                    [全部已读]  │
  ├─────────────────────────────────────────┤
  │  [全部] [订单] [服务] [预警] [系统]      │
  ├─────────────────────────────────────────┤
  │  ● 通知1                        刚刚    │
  │  │ 内容预览                            │
  │  └────────────────────────────        │
  │  ...                                   │
  │  ── 加载更多 ──                         │
  └─────────────────────────────────────────┘

特性:
  - 右侧滑出，宽度 400px
  - z-index 高于 TableDrawer
  - 分类 Tab 水平滚动
  - 未读项: 绿色圆点 + 微绿背景
  - 已读项: 无圆点，正常背景
  - 点击单条: 标记已读 + 跳转台桌(如有 tableId)
  - 左滑删除
  - 相对时间显示 (刚刚 / X分前 / X时前)
```

#### 3.5.4 useNotification Hook

**文件：** `wwwpos/src/hooks/useNotification.ts`

```typescript
function useNotification() {
  return {
    notifications: AppNotification[]      // 按当前 Tab 过滤后的
    unreadCount: number
    activeTab: NotificationType | 'all'
    setActiveTab: (tab) => void
    muted: boolean
    setMuted: (muted) => void
    markAsRead: (id) => void
    markAllAsRead: () => void
    removeNotification: (id) => void
  }
}
```

---

## 四、后端变更

### 4.1 补充 WebSocket 推送点

在以下触发点调用 `WebSocketNotification::sendToGroup("store_{storeId}", ...)`：

| 触发点 | 文件 | 推送 type | data 字段 |
|--------|------|-----------|-----------|
| 开台成功 | `TableOpenLogic.php:139` | `table_open` | `table_id, table_name, player_count, order_id` |
| 商品点单确认 | `POS OrderController::addProductItem()` | `new_order_item` | 已有，无需改 |
| 助教申请 | `POS OrderController::addAssistantItem()` | `assistant_apply` | `table_id, table_name, assistant_id, assistant_name, order_id` |
| 服务呼叫转发 | `Events.php` 已有 relay | `service_call` | 已有，无需改 |

### 4.2 补充通知写入

在以下触发点同时写入 `busi_notification` 表（当前仅 WebSocket 推送，掉线会丢）：

| 触发点 | type | title 模板 |
|--------|------|-----------|
| 开台 | `table_open` | "{table} 开台，{count}人" |
| 助教申请 | `assistant_apply` | "{table} 申请助教 {assistant}" |

### 4.3 通知自动清理

新增定时任务（cron），每天凌晨 3:00 执行：

```php
// app/cron/CleanNotifications.php
// DELETE FROM busi_notification WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
```

### 4.4 API 增强（可选）

`GET /pos.Notification/lists` 支持 `since` 参数：

```php
// 如果传入 since (ISO datetime)，只返回该时间之后的通知
if (!empty($params['since'])) {
    $query->where('created_at', '>', $params['since']);
}
```

---

## 五、文件清单

### 新增文件 (wwwpos)

| 文件 | 职责 |
|------|------|
| `src/services/notification-service.ts` | 通知中心单例 |
| `src/hooks/useNotification.ts` | React Hook 封装 |
| `src/components/NotificationPanel.tsx` | 右侧抽屉面板 |
| `src/components/NotificationBadge.tsx` | Header 未读数角标 |
| `src/components/NotificationToast.tsx` | 右上角即时弹出 |
| `src/utils/notification-sound.ts` | 语音播报 + 提示音 |
| `src/utils/ws-notification.ts` | WebSocket 客户端 |

### 修改文件 (wwwpos)

| 文件 | 变更内容 |
|------|----------|
| `src/components/HeaderBar.tsx` | 添加 NotificationBadge + 铃铛 + 静音按钮 |
| `src/app/layout.tsx` | 添加 NotificationToast + NotificationPanel 容器 |
| `src/context/AppContext.tsx` | init 时启动 NotificationService |

### 后端变更 (wwwapi)

| 文件 | 变更内容 |
|------|----------|
| `app/storeapi/logic/order/TableOpenLogic.php` | 开台后推送 WS + 写通知表 |
| `app/storeapi/controller/pos/OrderController.php` | 助教申请后推送 WS + 写通知表 |
| `app/cron/CleanNotifications.php` | **新文件**，7天清理定时任务 |
| `app/storeapi/logic/notification/NotificationLogic.php` | lists 支持 since 参数 |

---

## 六、Electron 兼容性

| 特性 | 浏览器 | Electron (Chromium) |
|------|--------|---------------------|
| `SpeechSynthesis` | ✅ Chrome/Edge | ✅ Chromium 内置 |
| `AudioContext` | ✅ | ✅ |
| `WebSocket` | ✅ | ✅ |
| `localStorage` | ✅ | ✅ |

**无需任何额外配置。** Electron `webPreferences` 默认不禁用这些 API。

---

## 七、风险与降级

| 风险 | 降级策略 |
|------|----------|
| WebSocket 连接失败 | 自动切换到 HTTP 高频轮询 (10s) |
| SpeechSynthesis 不可用 | 静默降级，仅显示 UI 通知，不报错 |
| AudioContext 不可用 | 跳过提示音 |
| localStorage 满 | 自动清理最旧的 50% |
| 语音队列堆积 | 超过 10 条丢弃最早的非 urgent |
| 浏览器不支持 Service Worker | 不影响，无需 SW |
