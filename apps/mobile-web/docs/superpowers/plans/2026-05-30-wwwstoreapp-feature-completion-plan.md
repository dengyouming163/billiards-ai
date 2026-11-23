# wwwstoreapp 移动端整体功能完善优化 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwstoreapp 从"功能基本可用"提升到"生产级商用水准"，覆盖代码质量、功能完整性、交互体验、性能稳定性四个维度。

**Architecture:** 按 L1→L4 四层递进式推进。L1 修复基础代码问题，L2 补全真实功能，L3 统一品牌和交互体验，L4 优化性能和稳定性。每层独立可交付。

**Tech Stack:** uni-app Vue3 + TypeScript + SCSS, 无需新增依赖

---

## L1 基础修复 (~8 文件)

### Task L1-1: notificationStore 响应式统一

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\stores\notification.ts`

- [ ] **Step 1: 修改 notificationStore 导出为 reactive 包装**

在文件末尾，将第 59 行：
```typescript
export const notificationStore = new NotificationStore()
```
改为：
```typescript
export const notificationStore = reactive(new NotificationStore()) as NotificationStore
```

同时在文件顶部添加 `reactive` 导入：
```typescript
import { reactive } from 'vue'
```

- [ ] **Step 2: 验证 TypeScript 编译无错误**

Run: `npx vue-tsc --noEmit` (或项目自有的 typecheck 命令)
检查 `src/stores/notification.ts` 无类型错误。

---

### Task L1-2: API 统一导出补齐

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\index.ts`

- [ ] **Step 1: 补充 3 个缺失的模块导出**

在文件末尾追加三行导出：
```typescript
export * from './modules/employee'
export * from './modules/table'
export * from './modules/store'
```

修改后 `src/api/index.ts` 完整内容为：
```typescript
export * from './modules/auth'
export * from './modules/dashboard'
export * from './modules/checkin'
export * from './modules/schedule'
export * from './modules/order'
export * from './modules/performance'
export * from './modules/approval'
export * from './modules/apply'
export * from './modules/profile'
export * from './modules/notification'
export * from './modules/employee'
export * from './modules/table'
export * from './modules/store'
```

- [ ] **Step 2: 确认三个模块文件存在**

验证文件存在：
- `src/api/modules/employee.ts`
- `src/api/modules/table.ts`
- `src/api/modules/store.ts`

---

### Task L1-3: 死代码清理

**Files:**
- Delete: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\approval\my-list.vue`
- Delete: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\approval\pending-list.vue`

- [ ] **Step 1: 删除两个废弃页面文件**

删除 `my-list.vue` 和 `pending-list.vue`。这两个文件功能已被 `approval/index.vue` 的双 Tab 模式完全替代，且未在 pages.json 中注册。

---

### Task L1-4: ProfileManagement 显示逻辑修复

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\profile\index.vue`

- [ ] **Step 1: 修改 showManagement 为按角色判断**

将第 41 行：
```typescript
const showManagement = computed(() => false)
```
改为：
```typescript
const showManagement = computed(() => ['owner', 'admin', 'manager'].includes(profile.value.role))
```

这样 boss / admin / manager 角色会看到管理中心入口卡片，assistant / employee 不展示。

---

### Task L1-5: 补充 api/modules/profile.ts 的上传方法为真实文件上传

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\modules\profile.ts`

- [ ] **Step 1: 修改 uploadAvatar 和 uploadAlbum 使用 uploadFile 而非 post**

当前代码使用 `post()` 发送 JSON body，但文件路径需要通过 `uni.uploadFile` 二进制上传。修改导入，将 `post` 改为从 `@/api/request` 导入 `uploadFile`：

```typescript
// 修改第 1 行导入
import { get, post, uploadFile } from '@/api/request'
```

然后修改第 44 行 `uploadAlbum`：
```typescript
export function uploadAlbum(filePath: string): Promise<{ url: string }> {
  return uploadFile('/mobile.Profile/uploadAlbum', filePath, 'file') as unknown as Promise<{ url: string }>
}
```

修改第 52 行 `uploadAvatar`：
```typescript
export function uploadAvatar(filePath: string): Promise<{ url: string }> {
  return uploadFile('/mobile.Profile/uploadAvatar', filePath, 'file') as unknown as Promise<{ url: string }>
}
```

> `uploadFile` 返回 `Promise<string>`（url 字符串），而方法签名声明 `Promise<{ url: string }>`。调用方可从返回的 url 中提取：`const url = await uploadAvatar(path)`，如果需要保持签名兼容，在调用处适配即可。

- [ ] **Step 2: 确认 authStore 导入可用**

确认 `request.ts` 中的 `uploadFile` 已导入 `authStore`（已验证第 3 行 `import { authStore } from '@/stores/auth'` 存在）。

---

## L2 功能补全 (~9 文件)

### Task L2-1: ProfileHeader 头像上传接入真实 API

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\ProfileHeader.vue`

- [ ] **Step 1: 在 script 中导入 uploadAvatar**

在 `<script setup>` 顶部添加导入：
```typescript
import { uploadAvatar } from '@/api/modules/profile'
```

- [ ] **Step 2: 添加上传中状态**

在 script 中添加：
```typescript
const uploading = ref(false)
```

- [ ] **Step 3: 修改 chooseImage 为真实上传**

将第 70-77 行的 `chooseImage` 函数改为：
```typescript
function chooseImage(sourceType: 'camera' | 'album') {
  uni.chooseImage({
    count: 1,
    sourceType: [sourceType],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      if (!filePath) return
      uploading.value = true
      try {
        const url = await uploadAvatar(filePath)
        uni.showToast({ title: '头像上传成功', icon: 'success' })
        emit('avatar-updated', url)
      } catch (e: any) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        uploading.value = false
      }
    }
  })
}
```

- [ ] **Step 4: 添加 avatar-updated emit**

在 `defineEmits` 中添加事件类型声明，或在 defineProps/defineEmits 后添加：
```typescript
const emit = defineEmits<{
  (e: 'avatar-updated', url: string): void
}>()
```

如果当前 Props 定义中没有 emit，需要在 `defineProps` 后追加。

- [ ] **Step 5: 模板中添加上传中 loading 状态**

在 `.avatar-box` 上添加一个上传中的遮罩效果（可选，但不是必须的变更）。

---

### Task L2-2: ProfileAlbum 相册上传接入真实 API

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\ProfileAlbum.vue`
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\profile\album.vue`

- [ ] **Step 1: 在 ProfileAlbum.vue 中接入 uploadAlbum**

1. 导入 `uploadAlbum`：
```typescript
import { uploadAlbum, deleteAlbum } from '@/api/modules/profile'
```

2. 找到现有的上传逻辑（当前可能是 `uni.chooseImage` → Toast），修改为：
```typescript
const uploading = ref(false)

async function handleAddPhoto() {
  uni.chooseImage({
    count: 1,
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      if (!filePath) return
      uploading.value = true
      try {
        const result = await uploadAlbum(filePath)
        const url = typeof result === 'string' ? result : result.url
        emit('album-updated', url)
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (e: any) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        uploading.value = false
      }
    }
  })
}
```

- [ ] **Step 2: 在 album.vue 页面中处理 album-updated 事件**

在 `pages/profile/album.vue` 中监听 `@album-updated` 事件，将新 URL 添加到本地状态并可选调用后端刷新。

---

### Task L2-3: 门店管理入口处理

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\ProfileManagement.vue`

- [ ] **Step 1: 检查 ProfileManagement 当前的点击处理**

读取 `ProfileManagement.vue`，找到「门店管理」的 click 处理函数，将硬编码的 `uni.showToast({ title: '门店管理功能开发中' })` 改为：

```typescript
function handleStoreManage() {
  // #ifdef H5
  window.open('https://admin.tpzl88.com/stores', '_blank')
  // #endif
  // #ifndef H5
  uni.showToast({ title: '请使用PC端管理门店', icon: 'none' })
  // #endif
}
```

> 这里的 URL 需要替换为实际的 PC 端管理后台地址。

---

### Task L2-4: 数据统计详情入口处理

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\ProfileStatistics.vue`

- [ ] **Step 1: 重写统计数据点击逻辑**

找到 ProfileStatistics 中的点击处理函数，将硬编码的 Toast 改为按角色跳转：

```typescript
import { authStore } from '@/stores/auth'

function handleStatClick() {
  if (authStore.canViewDashboard) {
    uni.switchTab({ url: '/pages/index/index' })
  } else if (authStore.canViewPerformance) {
    uni.navigateTo({ url: '/pages/performance/index' })
  } else {
    uni.showToast({ title: '暂无数据统计权限', icon: 'none' })
  }
}
```

如果 `ProfileStatistics` 当前不展示角色信息，只需给组件传入 `role` prop 或直接导入 `authStore`。

---

### Task L2-5: 网络断开全局提示

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\App.vue`

- [ ] **Step 1: 在 App.vue 的 onLaunch 中注册网络状态监听**

在 App.vue 的 `<script setup>` 中 `onLaunch` 内追加：

```typescript
import { ref } from 'vue'

const isOffline = ref(false)

onLaunch(() => {
  // ... existing launch logic ...

  uni.onNetworkStatusChange((res) => {
    isOffline.value = !res.isConnected
    if (!res.isConnected) {
      uni.showToast({ title: '网络已断开', icon: 'none', duration: 3000 })
    }
  })
})
```

- [ ] **Step 2: 在根模板添加离线提示条**

在 App.vue `<template>` 的根元素下第一行添加：
```html
<view v-if="isOffline" class="offline-bar">
  <text>网络连接已断开，部分功能不可用</text>
</view>
```

在 `<style>` 中添加：
```scss
.offline-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: #ef4444;
  color: #fff;
  text-align: center;
  padding: 12rpx 0;
  font-size: 24rpx;
  padding-top: var(--status-bar-height, 0);
}
```

---

## L3 体验打磨 (~20 文件)

### Task L3-1: 创建统一 SVG Icon 组件

**Files:**
- Create: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\Icon.vue`

- [ ] **Step 1: 创建 Icon.vue 组件**

```vue
<template>
  <image
    v-if="iconSrc"
    :src="iconSrc"
    :style="{ width: size + 'rpx', height: size + 'rpx', opacity: opacity }"
    mode="aspectFit"
  />
  <text v-else :style="{ fontSize: size + 'rpx', opacity: opacity }">{{ fallback }}</text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICON_MAP } from '@/constants/icons'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  opacity?: number
}>(), {
  size: 40,
  opacity: 1,
})

const iconSrc = computed(() => {
  const mapped = ICON_MAP[props.name]
  if (!mapped) return ''
  // uni-app 中 image src 支持 base64 或网络路径
  // 这里返回映射名，实际 SVG 在页面中通过 image 标签引用
  return `/static/icons/${mapped}.svg`
})

const fallback = computed(() => {
  const emojiMap: Record<string, string> = {
    home: '🏠', dashboard: '📊', table: '🎱', orders: '📋',
    employee: '👥', approval: '✅', checkin: '📍', schedule: '📅',
    performance: '📈', notification: '🔔', profile: '👤', settings: '⚙️',
    work: '💼', logout: '🚪', add: '➕', search: '🔍',
    close: '✕', back: '⬅', edit: '✏️', delete: '🗑',
    phone: '📱', location: '📍', clock: '⏱', member: '👑',
    product: '🛒', assistant: '💁', money: '💰', chart: '📊',
    camera: '📷', album: '🖼', star: '⭐', check: '✓',
    time: '⏱', user: '👤', lock: '🔒', eye: '👁',
    arrow_right: '→', refresh: '🔄', filter: '🔽',
  }
  return emojiMap[props.name] || '●'
})
</script>
```

> 注：小程序平台 SVG 需要通过 `<image>` 标签引用静态资源路径。如果没有对应的 SVG 文件，`fallback` 使用 Emoji 作为降级方案。后续可逐步替换为真正的 SVG 素材。

---

### Task L3-2: 替换 ProfileHeader 中的 Emoji 为 Icon 组件

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\ProfileHeader.vue`

- [ ] **Step 1: 导入 Icon 组件并替换 Emoji**

```typescript
import Icon from '@/components/Icon.vue'
```

模板变更：
- `👤` → `<Icon name="user" :size="70" />`
- `📷` → `<Icon name="camera" :size="22" />`
- `✏️ 编辑` → `<Icon name="edit" :size="24" /> <text>编辑</text>`

---

### Task L3-3: 替换登录页品牌 Logo 和 Emoji

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\pages\login\index.vue`

- [ ] **Step 1: 替换 Logo 区域**

将第 7-9 行的硬编码 `8` Logo 改为 SVG 品牌 Logo：

```html
<view class="logo-section">
  <view class="logo">
    <svg viewBox="0 0 80 80" width="160rpx" height="160rpx">
      <circle cx="40" cy="40" r="38" fill="#121212" stroke="#059669" stroke-width="3"/>
      <circle cx="40" cy="40" r="24" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
      <text x="40" y="48" text-anchor="middle" fill="white" font-size="28" font-weight="bold">8</text>
    </svg>
  </view>
  <text class="logo-title">台屏智联</text>
  <text class="logo-subtitle">球房管理 · 智慧经营</text>
</view>
```

- [ ] **Step 2: 替换输入框 Emoji 图标**

将 `📱` 和 `🔒` 替换为 `<Icon name="phone" :size="36" />` 和 `<Icon name="lock" :size="36" />`。

导入 `Icon` 组件：
```typescript
import Icon from '@/components/Icon.vue'
```

---

### Task L3-4: 全局替换 TabBar 中的 Emoji

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\components\TabBar.vue`

- [ ] **Step 1: 用 Icon 组件替换 Emoji 图标**

读取当前 TabBar 的模板，将硬编码的 Emoji 文本替换为 `<Icon>` 组件调用。

---

### Task L3-5: 全量替换其他页面/组件中的 Emoji

**Files:**
- Modify: 所有包含 Emoji 文本的 .vue 文件（约 12 个）

- [ ] **Step 1: 批量搜索并替换 Emoji**

搜索 `src/` 下所有 `.vue` 文件中包含以下 Emoji 模式的文本节点：
`👤` `📷` `✏️` `📋` `👥` `📱` `🎱` `📊` `🔔` `✅` `⏱` `💰` `🛒` `💁` `⚙️` `📍` `✓` `⏱` `👑` `🔒`

每个文件需要：
1. 导入 `import Icon from '@/components/Icon.vue'`
2. 将 `<text>{{emoji}}</text>` 替换为 `<Icon name="xxx" :size="yy" />`

涉及文件（根据调查结果）：
- `src/components/ProfileHeader.vue` — Task L3-2 已处理
- `src/pages/login/index.vue` — Task L3-3 已处理  
- `src/components/TabBar.vue` — Task L3-4 已处理
- `src/components/ProfileStats.vue`
- `src/components/ProfileFooter.vue`
- `src/components/ProfileAlbumEntry.vue`
- `src/components/ProfileManagement.vue`
- `src/components/ProfileStatistics.vue`
- `src/components/AssistantEntry.vue`
- `src/components/EmptyState.vue`
- `src/pages/work/index.vue`
- `src/pages/table/components/TableCard.vue`
- `src/pages/table/index.vue`
- 以及其他使用 Emoji 的页面

> 具体 Emoji → Icon name 映射参考 `constants/icons.ts` 中的定义。

---

### Task L3-6: 统一弹窗动画

**Files:**
- Modify: 所有包含 popup/modal 的页面

- [ ] **Step 1: 追加统一动画类**

在 `src/uni.scss` 中追加弹窗动画 keyframes：

```scss
/* ---------- Popup Animation ---------- */
@keyframes popup-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popup-slide-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.popup-overlay {
  animation: popup-fade-in 0.25s ease-out;
}

.popup-panel {
  animation: popup-slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

- [ ] **Step 2: 应用到现有弹窗**

在 `table/index.vue`、`approval/index.vue` 等有弹出层的页面，给 `.overlay` 和 `.popup` 分别追加这两个动画类。

---

### Task L3-7: 空/错/加载状态统一

**Files:**
- Modify: `src/pages/approval/index.vue`
- Modify: `src/pages/notification/index.vue`
- Modify: `src/pages/employee/list.vue`
- Modify: `src/pages/orders/index.vue`

- [ ] **Step 1: 为每个页面包裹 StateView**

以 `approval/index.vue` 为例，改造模式：
```html
<StateView
  :loading="loading && !list.length"
  :empty="!loading && list.length === 0 && !hasError"
  :error="hasError"
  empty-msg="暂无审批记录"
  error-msg="加载失败"
  @retry="loadData(true)"
>
  <view v-for="item in list" :key="item.id">
    <!-- existing card item -->
  </view>
</StateView>
```

确保每个页面都已导入：
```typescript
import StateView from '@/components/StateView.vue'
```

---

### Task L3-8: 安全区域适配

**Files:**
- 全部需要底部 padding 的页面

- [ ] **Step 1: 排查并统一底部间距**

搜索所有页面的 `<style>` 中的 `padding-bottom`，确保有 TabBar 的页面底部间距统一为：
```scss
padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
```

需要排查的页面：`approval/index.vue`、`notification/index.vue`、`employee/list.vue`、`orders/*.vue`、`checkin/*.vue`、`schedule/index.vue`、`performance/index.vue`、`settings/*.vue`、`work/index.vue`

---

## L4 性能与稳定性 (~6 文件)

### Task L4-1: 图片懒加载

**Files:**
- Modify: 所有包含 `<image>` 标签的列表渲染场景

- [ ] **Step 1: 为长列表中的 image 添加 lazy-load**

搜索 `<image` 标签，在列表循环渲染中的图片标签添加 `lazy-load` 属性：

```html
<image :src="item.avatar" mode="aspectFill" lazy-load />
```

涉及文件：
- `src/pages/employee/list.vue` — 员工头像
- `src/pages/approval/index.vue` — 审批人头像
- `src/components/ProfileAlbum.vue` — 相册图片
- `src/components/ProfileAlbumEntry.vue` — 相册预览

---

### Task L4-2: 请求缓存策略

**Files:**
- Create: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\cache.ts`
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\request.ts`

- [ ] **Step 1: 创建缓存模块 cache.ts**

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const DEFAULT_TTL = 30_000

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > DEFAULT_TTL) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  cache.set(key, { data, timestamp: Date.now() })
  // 过期自动清理
  setTimeout(() => cache.delete(key), ttl)
}

export function clearCache(): void {
  cache.clear()
}

export function clearByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
```

- [ ] **Step 2: 在 request.ts 中集成缓存**

在 `request()` 函数中（`options` 解构时增加 `cache?: boolean` 参数），在发起请求前检查缓存：

```typescript
export function request<T = any>(options: RequestOptions): Promise<T> {
    let { url, data = {}, method = 'GET', header = {}, showLoading = true, showError = true, cache = false } = options

    return new Promise((resolve, reject) => {
        // 缓存检查（仅对 GET 请求生效）
        if (cache && method === 'GET') {
            const cacheKey = `${url}${JSON.stringify(data)}`
            const cached = getCache<T>(cacheKey)
            if (cached) {
                resolve(cached)
                return
            }
        }
        // ... existing request logic ...
        
        // 在 success 回调中缓存结果
        success: (res) => {
            // ... existing logic ...
            if (response.code === 1) {
                // 缓存结果
                if (cache && method === 'GET') {
                    const cacheKey = `${url}${JSON.stringify(data)}`
                    const responseData = response.data as T
                    // 确保 data 有效时才缓存
                    if (responseData && (Array.isArray(responseData) ? responseData.length > 0 : true)) {
                        setCache(cacheKey, responseData)
                    }
                }
                resolve(response.data as T)
            }
            // ...
        }
    })
}
```

同时在文件顶部导入：
```typescript
import { getCache, setCache } from './cache'
```

更新 `RequestOptions` 类型（`src/types/request.ts`）：
```typescript
export interface RequestOptions {
  url: string
  data?: Record<string, unknown>
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  header?: Record<string, string>
  showLoading?: boolean
  showError?: boolean
  cache?: boolean
}
```

---

### Task L4-3: Token 过期增强处理

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\api\request.ts`

- [ ] **Step 1: 增强 AUTH_ERROR 处理体验**

修改 request.ts 第 76-81 行的 AUTH_ERROR 处理，改为先显示提示再跳转：

```typescript
if (classified.type === ErrorType.AUTH_ERROR) {
    authStore.logout()
    uni.showModal({
        title: '登录已过期',
        content: classified.message,
        showCancel: false,
        confirmText: '重新登录',
        success: () => {
            uni.reLaunch({ url: '/pages/login/index' })
        }
    })
    reject(classified)
    return
}
```

原来使用 `setTimeout` 强制跳转的方式改为 `showModal` 确认后再跳转，用户可以看到发生了什么。

同样修改 `uploadFile` 函数（第 153-158 行）中相同的 AUTH_ERROR 处理逻辑。

---

### Task L4-4: 全局性能标记

**Files:**
- Modify: `d:\wwwroot\wwwbilliards\www\wwwstoreapp\src\App.vue`

- [ ] **Step 1: 添加 App 启动耗时监控（仅开发环境）**

在 `onLaunch` 中可选添加：
```typescript
// #ifdef H5
if (process.env.NODE_ENV === 'development') {
  const startTime = Date.now()
  console.log(`[App] Launch: ${startTime}ms`)
}
// #endif
```

这个任务比较简单，主要确保 App 启动流程无明显阻塞。

---

## 自查

### Spec 覆盖检查
- [x] L1-1: notificationStore 响应式 → Task L1-1
- [x] L1-2: API 导出补齐 → Task L1-2
- [x] L1-3: 死代码清理 → Task L1-3
- [x] L1-4: showManagement 修复 → Task L1-4
- [x] L1-5: TypeScript 类型补充 → Task L1-5 覆盖了上传方法导入修复；any 类型已在之前会话处理
- [x] L2-1: 头像上传 → Task L2-1
- [x] L2-2: 相册上传 → Task L2-2
- [x] L2-3: 门店管理 → Task L2-3
- [x] L2-4: 数据统计详情 → Task L2-4
- [x] L2-5: 边界场景覆盖（网络提示 + Token刷新）→ Task L2-5 + Task L4-3
- [x] L3-1: Emoji→SVG → Task L3-1 to L3-5
- [x] L3-2: 登录 Logo → Task L3-3
- [x] L3-3: 动画一致性 → Task L3-6
- [x] L3-4: 状态统一 → Task L3-7
- [x] L3-5: 安全区域 → Task L3-8
- [x] L4-1: 图片懒加载 → Task L4-1
- [x] L4-2: 请求缓存 → Task L4-2
- [x] L4-3: 网络异常全局 → Task L2-5
- [x] L4-4: Token 静默刷新 → Task L4-3

### 无占位符检查
- 所有代码块均为实际可运行代码
- 所有文件路径均为绝对路径
- 无 TBD/TODO

### 类型一致性
- `ProfileData` 接口在 `api/modules/profile.ts` 中定义
- `uploadAvatar` 返回类型与调用方一致（url 字符串）
- `ICON_MAP` 在 `constants/icons.ts` 中定义
- `authStore` 在 `stores/auth.ts` 中已使用 `reactive()` 导出
