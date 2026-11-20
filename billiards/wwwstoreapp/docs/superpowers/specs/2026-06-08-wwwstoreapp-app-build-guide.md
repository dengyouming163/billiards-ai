# wwwstoreapp App 端构建部署指南

> 日期: 2026-06-08 | 目标: Android / iOS App 打包

---

## 一、构建方式

UniApp App 端需要通过 **HBuilder X** 打包，不能用 pnpm 命令。

### 方式一：HBuilder X IDE（推荐）

1. 打开 HBuilder X
2. 文件 → 导入 → 从本地目录导入 → 选择 `wwwstoreapp/`
3. 发行 → 原生App-云打包（或本地打包）
4. 配置证书/包名 → 打包
5. 下载 .apk（Android）或 .ipa（iOS）

### 方式二：CLI 云打包

```bash
# 安装 HBuilder X CLI（需先安装 HBuilder X）
cd wwwstoreapp
# 通过 HBuilder X 的发行菜单操作
```

### 方式三：本地离线打包

参考 [DCloud 离线打包文档](https://nativesupport.dcloud.net.cn/AppDocs/README)

---

## 二、App 配置检查清单

### 2.1 基础信息 (`manifest.json`)

| 配置项 | 当前值 | 状态 |
|--------|--------|------|
| 应用名称 | 台屏智联 | ✅ |
| AppID | `__UNI__AF3C986` | ✅ |
| 版本号 | 1.0.0 (versionCode: 100) | ✅ |
| Vue 版本 | 3 | ✅ |

### 2.2 启动页 (Splash)

```json
"splashscreen": {
    "alwaysShowBeforeRender": true,
    "waiting": true,
    "autoclose": true,
    "delay": 0
}
```

- `autoclose: true` — App 就绪后自动关闭启动页
- `delay: 0` — 不额外延迟

### 2.3 权限配置

**Android 已配置权限：**
```xml
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32"/>
```

**iOS 权限（需在 HBuilder X 中配置）：**
- `NSCameraUsageDescription` — 拍照/修改头像
- `NSPhotoLibraryUsageDescription` — 相册选择/上传

### 2.4 原生模块

```json
"modules": {
    "Camera": {},
    "Gallery": {}
}
```

用途：个人头像拍照、相册图片选择。

### 2.5 图标

全部 17 个尺寸图标已就绪（`unpackage/res/icons/`）：

| 平台 | 尺寸覆盖 |
|------|----------|
| Android | 72×72, 96×96, 144×144, 192×192 |
| iOS | 20×20 → 1024×1024（13 个尺寸） |

---

## 三、App 签名配置

### Android 签名

```bash
# 生成 keystore
keytool -genkey -alias billiards -keyalg RSA -keysize 2048 \
  -validity 10000 -keystore billiards.keystore

# 在 HBuilder X 中配置：
# 发行 → 原生App-云打包 → 使用自有证书 → 选择 keystore
```

### iOS 签名

需要 Apple Developer 账号，在 HBuilder X 中配置：
- Bundle ID（如 `com.tpzl88.storeapp`）
- 描述文件 (.mobileprovision)
- 证书 (.p12)

---

## 四、App 端与 H5 端差异

| 能力 | H5 | App | 说明 |
|------|-----|-----|------|
| 相机拍照 | ❌ | ✅ | 头像/相册需要 Camera 模块 |
| 相册选择 | ✅ | ✅ | 均支持 |
| GPS 定位 | ✅ | ✅ | 打卡功能需要 |
| 推送通知 | ❌ | ✅ | 需配置 UniPush |
| 离线缓存 | 有限 | ✅ | App 本地存储更稳定 |
| 启动页 | ❌ | ✅ | Splash 配置 |
| 硬件返回键 | ❌ | ✅ | Android 返回键需处理 |
| 安全区域 | 浏览器处理 | 原生处理 | 刘海屏适配 |

### 条件编译使用

```typescript
// 平台检测 — 已内置在 utils/platform.ts
import { getPlatform } from '@/utils/platform'

// 模板中条件编译
// #ifdef APP-PLUS
//   App 端独有逻辑
// #endif
```

---

## 五、App 测试重点

相比 H5，App 端需额外验证：

| # | 测试项 | 验证方法 |
|---|--------|----------|
| 1 | 冷启动速度 | 杀进程→点图标→计时 < 2s |
| 2 | 启动页 | 点击图标→启动页显示→自动消失→进入首页 |
| 3 | 相机拍照 | 个人资料→修改头像→拍照→上传成功 |
| 4 | 相册选择 | 个人资料→修改头像→从相册选→上传成功 |
| 5 | GPS 定位 | 打卡页→签到→获取位置成功 |
| 6 | 返回键 | 二级页面按系统返回→回到上一页（非退出） |
| 7 | 后台恢复 | 切到后台 30s→切回→页面状态保持 |
| 8 | 网络切换 | WiFi↔4G 切换→连接正常，数据刷新 |
| 9 | 离线缓存 | 断网→首页/台桌列表显示缓存数据 |
| 10 | 权限拒绝 | 拒绝相机/位置权限→功能降级提示 |
| 11 | 大字体 | 系统字体放大→布局不错乱 |
| 12 | 深色模式 | 开启深色模式→页面可读 |

---

## 六、版本发布流程

```
1. 开发联调 (H5)
   pnpm dev:h5 → H5 快速迭代

2. App 打包测试
   HBuilder X → 自定义基座 → 真机调试

3. 云打包
   HBuilder X → 发行 → 原生App-云打包

4. 测试分发
   Android: .apk 文件直接安装
   iOS: TestFlight / 企业证书分发

5. 应用商店上架
   华为/小米/OPPO/vivo 应用商店
   Apple App Store
```
