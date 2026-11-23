# 助教相册入口 + 上传流程修复 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在编辑资料页添加相册管理入口，并修复前端上传流程使其与后端正确对接

**Architecture:** 三点改动 — (1) API 层 `uploadAlbum` 从 multipart 改为 POST JSON，(2) ProfileAlbum 组件拆为两段上传，(3) edit 页加相册卡片入口

**Tech Stack:** UniApp (Vue 3) + TypeScript + SCSS, ThinkPHP 8 后端 (不改)

---

## 文件改动清单

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/api/modules/profile.ts` | 修改 | 将 uploadAlbum 从 uploadFile 改为 post |
| `src/components/ProfileAlbum.vue` | 修改 | 改为两段上传（先上传文件得 URL → 再保存 URL） |
| `src/pages/profile/edit.vue` | 修改 | 在表单和信息区块之间插入相册入口卡片 |

---

### Task 1: 修复 uploadAlbum API 方法

**文件:**
- 修改: `src/api/modules/profile.ts:43-45`

- [ ] **Step 1: 将 uploadAlbum 从 uploadFile 改为 post**

将 `uploadAlbum` 函数从 multipart 上传改为 JSON POST，参数从 `filePath` 改为 `url`：

```typescript
// 修改前
export function uploadAlbum(filePath: string): Promise<{ url: string }> {
    return uploadFile('/mobile.Profile/uploadAlbum', filePath, 'file') as unknown as Promise<{ url: string }>
}

// 修改后
export function uploadAlbum(url: string): Promise<{ url: string }> {
    return post('/mobile.Profile/uploadAlbum', { file_path: url }) as unknown as Promise<{ url: string }>
}
```

不需要调整 `import` 行——`uploadFile` 仍被 `uploadAvatar` 使用。

- [ ] **Step 2: 确认 `uploadFile` import 仍被使用**

检查：`uploadFile` 也被 `uploadAvatar` 函数（第 52 行）使用，无需移除 import。

- [ ] **Step 3: Commit**

```bash
git add src/api/modules/profile.ts
git commit -m "fix: change uploadAlbum from multipart uploadFile to JSON post

Backend ProfileController expects POST param file_path (URL string),
not a multipart file upload. File upload is handled separately by
UploadController."
```

---

### Task 2: 修复 ProfileAlbum 组件两段上传

**文件:**
- 修改: `src/components/ProfileAlbum.vue`

`ProfileAlbum.vue` 当前将本地临时文件路径直接传给 `uploadAlbum()`，但修复后的 API 期望已上传到服务器的 URL。需要改为两段流程：先用 `uploadFile` 上传文件到 `UploadController` 获取 URL，再调用 `uploadAlbum` 将 URL 保存到 profile。

- [ ] **Step 1: 添加 uploadFile import**

在 `<script setup>` 顶部 import 中添加 `uploadFile`（来自 `@/api/request`）：

```typescript
import { uploadFile } from '@/api/request'
```

注意：`@/api/request` 中已导出 `uploadFile` 函数，签名：
```typescript
export function uploadFile(url: string, filePath: string, name?: string, formData?: Record<string, string>): Promise<string>
```
成功时返回服务端响应的 `data.url` 字符串。

- [ ] **Step 2: 改写 chooseImage 中的 upload 逻辑**

替换 `chooseImage` 函数的 success 回调中的上传逻辑（当前约第 69-83 行）：

```typescript
// 修改前（第 69-83 行附近）
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

// 修改后
success: async (res) => {
    const filePath = res.tempFilePaths[0]
    if (!filePath) return
    uploading.value = true
    uni.showLoading({ title: '上传中...' })
    try {
        // Step 1: 上传文件到服务器，获取 URL
        const serverUrl = await uploadFile('/upload.Upload/image', filePath, 'file')
        // Step 2: 将 URL 保存到 profile 相册
        await uploadAlbum(serverUrl)
        uni.hideLoading()
        emit('album-updated', serverUrl)
        uni.showToast({ title: '上传成功', icon: 'success' })
    } catch (e: any) {
        uni.hideLoading()
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
    } finally {
        uploading.value = false
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileAlbum.vue
git commit -m "fix: ProfileAlbum two-step upload (upload file then save URL)

Previously passed local temp filePath directly to uploadAlbum which
expects a server URL. Now uploads file to UploadController first,
then saves the returned URL to the profile album."
```

---

### Task 3: 编辑资料页添加相册入口卡片

**文件:**
- 修改: `src/pages/profile/edit.vue`

在编辑资料页的 `<form-section>` 和 `<info-section>` 之间插入相册卡片区域，使用已有的 `ProfileAlbumEntry` 组件。

- [ ] **Step 1: 导入 ProfileAlbumEntry 组件**

在 `<script setup>` 的 import 区域添加：

```typescript
import ProfileAlbumEntry from '@/components/ProfileAlbumEntry.vue'
```

插入位置：在 `import { getProfile, updateProfile, uploadAvatar, type ProfileData } from '@/api/modules/profile'` 之后。

- [ ] **Step 2: 在模板中添加相册区块**

在 `<view class="form-section">` 闭合标签和 `<view class="info-section">` 之间插入：

```html
            </view>

            <!-- 相册入口 -->
            <view class="album-section">
                <ProfileAlbumEntry :album="originalProfile.album || []" />
            </view>

            <view class="info-section">
```

完整上下文（第 47-50 行附近）：

```html
<!-- 修改前 -->
            </view>      <!-- form-section 结束 -->

            <view class="info-section">

<!-- 修改后 -->
            </view>      <!-- form-section 结束 -->

            <!-- 相册入口 -->
            <view class="album-section">
                <ProfileAlbumEntry :album="originalProfile.album || []" />
            </view>

            <view class="info-section">
```

- [ ] **Step 3: 添加 album-section 样式**

在 `<style lang="scss" scoped>` 的 `.form-section` 样式块之后（约第 253 行）添加：

```scss
.album-section {
    background: #ffffff;
    border-radius: 32rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
}
```

插入位置在 `.form-section` 闭合 `}` 之后，`.form-item` 之前。

- [ ] **Step 4: 确认 `originalProfile` 在组件挂载时就加载 album**

检查 `loadProfile()` 函数（第 119-131 行）— 它已调用 `getProfile()` 并赋值 `originalProfile.value = result`，而 `ProfileData` 类型包含 `album: string[]` 字段。`getProfile()` 后端返回 `album` 数组。无需额外修改。

- [ ] **Step 5: Commit**

```bash
git add src/pages/profile/edit.vue
git commit -m "feat: add album entry card to profile edit page"
```

---

### Task 4: 端到端验证

- [ ] **Step 1: 启动开发服务**

```bash
# 后端（如果未运行）
cd wwwapi && php think run -p 10002

# 前端
cd wwwstoreapp && pnpm dev:h5
```

- [ ] **Step 2: 验证流程**

1. 以助教角色（如 16555555555）登录 → 进入 profile 页 → 点击"编辑"
2. 确认编辑资料页表单下方出现"个人相册"卡片，显示已有照片数（可能为 0）
3. 点击相册卡片 → 跳转到 `/pages/profile/album`
4. 在相册页上传一张照片 → 验证上传成功 toast 出现 → 返回编辑页
5. 重新进入编辑页 → 确认相册卡片显示最新照片预览
6. 长按照片 → 删除 → 确认删除成功

- [ ] **Step 3: Commit（如有 follow-up fix）**

如有端到端验证中发现的问题，修复后提交。
