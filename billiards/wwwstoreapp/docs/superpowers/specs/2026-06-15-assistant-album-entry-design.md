# 助教相册入口 + 上传流程修复

> 日期: 2026-06-15 | 状态: 待实施

## 问题

1. **编辑资料页缺少相册入口**：助教角色登录后，`pages/profile/edit` 页只有头像/昵称/签名表单和制度信息，无相册管理入口
2. **上传流程有缺陷**：API 模块 `uploadAlbum()` 使用 `uni.uploadFile` 调用 `/mobile.Profile/uploadAlbum`，但后端该接口期望 POST 参数 `file_path`（URL 字符串），而非 multipart 文件 — 导致 Step 2（保存 URL 到 profile）静默失败，照片本地显示但不持久化

## 设计

### 1. 编辑资料页添加相册入口

**文件**: `src/pages/profile/edit.vue`

在表单区块和信息区块之间新增相册卡片区域：

```
┌─ page-header ──────────────────┐
│  ‹返回     编辑资料      保存   │
├─ form-section ─────────────────┤
│  头像 / 昵称 / 手机号 / 签名    │
├─ album-section ← NEW ──────────┤
│  ProfileAlbumEntry             │
│  点击 → /pages/profile/album   │
├─ info-section ─────────────────┤
│  所属门店 / 职位 / 入职时间     │
└────────────────────────────────┘
```

要点：
- 使用已有 `ProfileAlbumEntry` 组件，传入 `originalProfile.album`
- 无需角色判断（只有助教能从 profile 页点编辑进来，且其他角色无妨）
- 新增 `album-section` 白色卡片样式，与 form/info section 风格统一
- `originalProfile` 已包含 `album` 字段，可直接使用

### 2. 修复上传 API

**文件**: `src/api/modules/profile.ts`

```diff
- export function uploadAlbum(filePath: string): Promise<{ url: string }> {
-     return uploadFile('/mobile.Profile/uploadAlbum', filePath, 'file')
- }
+ export function uploadAlbum(url: string): Promise<{ url: string }> {
+     return post('/mobile.Profile/uploadAlbum', { file_path: url })
+ }
```

原因：后端 `ProfileController::uploadAlbum()` 读 `$this->request->post('file_path')`，期望 URL 字符串，不做实际文件上传。文件上传由 `UploadController::image()` 独立处理。

### 3. 修复 ProfileAlbum 组件的两段上传

**文件**: `src/components/ProfileAlbum.vue`

现有代码错误地将本地临时文件路径传给 `uploadAlbum()`，改为正确两段流程：

```
chooseImage → uploadFile(to /upload.Upload/image) → 得到 URL → uploadAlbum(URL) → 保存到 profile
```

- Step 1: 用 `uploadFile` from `@/api/request` 上传文件到 UploadController
- Step 2: 用修复后的 `uploadAlbum(url)` 将 URL 保存到 profile

### 4. 验证 album.vue 上传逻辑

**文件**: `src/pages/profile/album.vue`

该页面已正确实现两段上传（`uploadFilePromise` → `uploadAlbum`），修复 API 后自动恢复正常。

## 不改动

- TabBar 导航结构
- 后端 API 接口（已就绪）
- `pages/profile/index.vue`（不添加相册入口）
- `pages/profile/assistant.vue` "我的宣传页"
- ProfileHeader / ProfileFooter 组件
- 相册管理页 `album.vue` 的 UI 和交互

## 技术要点

| 项 | 说明 |
|---|---|
| 文件上传端点 | `/upload.Upload/image` (multipart, 字段名 `file`) |
| 相册保存端点 | `/mobile.Profile/uploadAlbum` (POST JSON `{file_path: url}`) |
| 文件大小限制 | 5MB, 格式 jpg/jpeg/png/webp/gif |
| 相册上限 | 当前后端无硬限制，前端 `album.vue` 组件展示无上限，`ProfileAlbum.vue` 显示 8 张 |
| 存储位置 | `wwwstore/public/uploads/<type>/` |
| 权限 | `mobile:profile`（7 个角色均已开放） |

## 实现顺序

1. 修复 `api/modules/profile.ts` 的 `uploadAlbum` 方法
2. 修复 `components/ProfileAlbum.vue` 的两段上传
3. 修改 `pages/profile/edit.vue` 添加 AlbumEntry 区块
4. 端到端验证：助教登录 → 个人页点编辑 → 可见相册入口 → 点击进相册 → 上传照片 → 刷新后仍在
