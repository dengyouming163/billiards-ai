# 部署说明文档

## 项目信息
- 项目名称：台球房管理系统（BilliardsHub）
- 后端框架：ThinkPHP 8
- 前端：Next.js 16 (wwwpos/wwwstore/wwwplatform) + UniApp (wwwtable)
- 日期：2026-06-22

---

## 一、wwwapi（ThinkPHP 8 后端）

### 部署方式：Git Push 自动部署

服务器上配置了 Git bare 仓库 + post-receive hook，推送即部署：

```bash
cd d:/wwwroot/wwwbilliards-dky/www
git push server master
```

Post-receive hook 会自动 checkout 到 `/www/wwwroot/wwwapi/`。

### 手动部署

```bash
ssh root@132.232.166.40
cd /www/wwwroot/wwwbilliards.git
# 代码已通过 git push 自动同步
```

---

## 二、wwwstore（商家管理后台）

### 技术栈
- Next.js 16 + React 19 + TypeScript
- PM2 管理进程
- Nginx 反向代理：`poolstore.kyyp.cn` → `127.0.0.1:3000`

### 部署步骤

```bash
# 1. 本地构建
cd d:/wwwroot/wwwbilliards-dky/www/wwwstore
npx next build
npx tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

# 2. 打包上传
tar czf /tmp/wwwstore-deploy.tar.gz .next/ dist/ public/ package.json node_modules/
scp /tmp/wwwstore-deploy.tar.gz root@132.232.166.40:/tmp/

# 3. 服务器端解压 + 重启
ssh root@132.232.166.40 "cd /www/wwwroot/wwwstore && tar xzf /tmp/wwwstore-deploy.tar.gz && pm2 restart wwwstore"
```

### PM2 状态
```bash
ssh root@132.232.166.40 "pm2 show wwwstore"
```
- 入口：`/www/wwwroot/wwwstore/dist/server.js`
- 端口：3000
- Node 版本：22.20.0

---

## 三、wwwpos（收银端）

### 本地开发
```bash
cd d:/wwwroot/wwwbilliards-dky/www/wwwpos
npx next dev
```

### 生产构建（Next.js 生产模式）
```bash
npx next build
npx next start -p 5000
```

### Electron 桌面打包
```bash
# 1. 构建前端
npx next build
# 2. 编译服务器入口
npx tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify
# 3. 打包 EXE
npx electron-builder --win
```
输出：`release/台球收银系统 Setup 0.1.0.exe`

### 图片资源（安装向导）
| 文件 | 尺寸 | 目录 |
|------|------|------|
| icon.png | 256×256 | `build/` |
| icon.ico | 256×256 (多尺寸) | `build/` |
| installer-header.bmp | 150×57 像素 | `build/` |
| installer-sidebar.bmp | 164×314 像素 | `build/` |

---

## 四、wwwplatform（管理平台）
与 wwwstore 同样的 Next.js 架构，PM2 管理，端口 5000。

---

## 五、wwwtable（点单大屏）

### H5 构建
```bash
cd d:/wwwroot/wwwbilliards-dky/www/wwwtable
pnpm build:h5
```

### App 打包
```bash
pnpm build:app
# 通过 HBuilderX 打包为 Android APK
```

---

## 六、wwwsocket（WebSocket 服务）

Workerman GatewayWorker，运行在：
- WebSocket：`0.0.0.0:8282`
- TCP Gateway：`0.0.0.0:8283`
- Register：`127.0.0.1:1238`
