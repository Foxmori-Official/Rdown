# Rdown - Electron 桌面壳

Electron 壳托管现有 Node 后端（`server/src/index.js`）与 Web UI（`http://127.0.0.1:16801`），
提供系统托盘、开机自启、magnet 协议与 .torrent 文件关联。

## 目录结构

```
electron/
  main.cjs      主进程（CommonJS）：spawn 后端、窗口、托盘、协议、IPC
  preload.cjs   contextBridge 暴露 kimiDesktop.{getLoginItem,setLoginItem}
```

## 开发调试

```bash
npm i                 # 首次安装（electron 二进制走 npmmirror 镜像，约 100MB）
npm run dev-electron  # 启动 Electron；主进程会自行 spawn server/src/index.js
```

- 主进程以 `NODE_ENV=dev`、`KIMI_ELECTRON=1` 环境变量启动后端子进程，
  并等待 `GET /api/v1/health` 就绪（最长 15s）后再加载窗口。
- 后端 stdout/stderr 会转发到主进程控制台（`[server]` / `[server!]` 前缀）。
- 若 15s 内健康检查未通过，窗口仍会打开，由 Web UI 自行呈现错误状态。

## 打包

```bash
npm run pack          # electron-builder，输出到 dist-electron/
```

打包配置在根 `package.json` 的 `build` 字段：

- `appId: com.aimao.rdown`，`productName: Rdown`
- Windows NSIS 一键安装（`oneClick: true`）
- **extraResources**：`server/`、`web/public/`、`bin/`（aria2c 等二进制）会被拷到
  `resources/app/...` 下。`app.getAppPath()` 在打包后指向 `resources/app`，因此
  `main.cjs` 中 `path.join(app.getAppPath(), 'server/src/index.js')` 与
  `path.join(app.getAppPath(), 'web/public/logo.png')` 在开发与打包两种模式下路径一致。
- 若后续后端改为从 `web/dist` 提供静态文件，请确认 `web/dist` 已先 `npm run build:web`
  生成，并视需要将其加入 `files` 或 `extraResources`。
- 图标使用 `web/public/logo.png`（512px PNG，满足 >=256px 要求）。如需更清晰的
  任务栏/安装器图标，可后续替换为 `store/icon256.png` 或专用 `.ico`。

## magnet / 种子关联

- `protocols: magnet` + `app.setAsDefaultProtocolClient('magnet')`：安装后点击
  `magnet:?xt=...` 链接会唤起 Rdown。
- `fileAssociations: ext=torrent`：安装后双击 `.torrent` 文件会唤起 Rdown。
- 两种情况统一走 `second-instance`（或首启 `process.argv`）参数解析：
  - magnet → `POST /api/v1/tasks { url }`
  - .torrent → 读文件转 base64 → `POST /api/v1/tasks { torrentBase64 }`
- 本地回环无鉴权，直接用 `http` 模块 POST。

## 托盘行为

- 关闭主窗口默认**最小化到托盘**（`minimizeToTray = true`，后续可做成设置项）。
- 托盘菜单：`显示主窗口` / `退出`；单击托盘图标也会显示主窗口。
- 通过托盘菜单「退出」才会真正退出（置 `isQuitting`），退出时杀掉后端子进程。

## 开机自启

- 渲染进程无法直接调用 `app.setLoginItemSettings`，通过 IPC：
  - `window.kimiDesktop.getLoginItem()` → `{ openAtLogin }`
  - `window.kimiDesktop.setLoginItem(true | false)`
- 设置页开关直接调这两个方法即可。

## 单实例

- `app.requestSingleInstanceLock()`：重复启动会聚焦已有窗口，并把新参数
  （magnet / .torrent）转发给已运行实例处理。
