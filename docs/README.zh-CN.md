# Rdown

一个融合 aria2、Motrix、N_m3u8DL-RE、Gopeed、Aria2-Explorer、Gopeed 扩展与猫抓（cat-catch）优点的全能下载管理器 —— 一个引擎层、一个 Web UI、一个浏览器扩展。

[English](docs/README.en.md) | **简体中文** | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## 亮点

| 来源项目 | Rdown 继承的能力 |
|---|---|
| [aria2](https://github.com/aria2/aria2) | 下载核心：HTTP/HTTPS/FTP/SFTP/BitTorrent/磁力/Metalink，多连接分段，JSON-RPC 控制 |
| [Motrix](https://github.com/agalwood/Motrix) | 桌面级体验：引擎托管、会话持久化、tracker 自动更新、64 连接构建（随 Motrix 定制 aria2 构建发布） |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | 流媒体下载：HLS (m3u8) / DASH (mpd) 点播与直播录制、AES-128 解密（自定义 Key/IV）、选择器 DSL、广告分片过滤、自定义范围、ffmpeg 转封装 |
| [Gopeed](https://github.com/GopeedLab/gopeed) | 现代化 API：resolve→create 两段式、统一任务模型、REST + WebSocket 推送、MCP Server（9 个工具）、NDJSON 输出的 CLI |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | 浏览器接管：自动拦截、多服务器 URL 路由、离线回退、磁力捕获、中间件 API |
| [Gopeed 浏览器扩展](https://github.com/GopeedLab/browser-extension) | 精确的请求头透传（通过 webRequest 传递 Cookie/UA/Referer/Origin/Authorization） |
| [cat-catch](https://github.com/xifangczy/cat-catch) | 媒体嗅探：资源发现、深度搜索、正则过滤、媒体预览、文件名模板、自动下载 |

## 架构

```
┌─────────────────────────────────────────────────────────┐
│   Browser extension (MV3)      Web UI (Vue3 + Element)  │
│   capture / sniff / magnet      tasks / settings / i18n │
└───────────┬───────────────────────────┬─────────────────┘
            │ REST /api/v1              │ WS /ws (1Hz state push)
┌───────────▼───────────────────────────▼─────────────────┐
│                 Node.js backend (server/)                │
│  ┌───────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │ aria2      │  │ Stream engine │  │ MCP / CLI / API │  │
│  │ engine+RPC │  │ HLS/DASH/live │  │ REST + WS       │  │
│  └─────┬─────┘  └──────┬────────┘  └─────────────────┘  │
└────────┼───────────────┼────────────────────────────────┘
     aria2c           native engine /      ffmpeg
   (Motrix build)   optional N_m3u8DL-RE  (remux)
```

## 快速开始

要求：Windows 10+，Node.js 20+（已为中国用户预配置 npm 镜像）。

```bash
# 1. Download engine binaries (aria2c / ffmpeg / ffprobe)
node tools/download-engines.mjs

# 2. Install dependencies
cd server && npm install && cd ../web && npm install && cd ..

# 3. Build the Web UI
npm run build:web

# 4. Start (backend + Web UI in one process)
npm start        # open http://127.0.0.1:16801
```

Windows 一键启动：双击 `start.bat`。

## 功能总览

- **HTTP/FTP 下载** —— 单任务最高 64 连接、断点续传、批量 URL、自定义 UA/Referer/Cookie、限速（3 档预设）
- **BitTorrent 与磁力** —— DHT/LPD/PEX、tracker 自动更新（多镜像）、做种比/做种时间、选择性文件下载、元数据持久化、UPnP/NAT-PMP 端口映射
- **流媒体（m3u8/mpd）** —— 自动识别、清晰度选择（best/worst/带宽/N_m3u8DL-RE 选择器 DSL，如 `res=^1280:for=best` 与 drop）、AES-128 解密（自动拉取或自定义 Key/IV）、广告分片正则过滤、自定义范围（索引或 `05:00-20:00`）、限时直播录制、自动 TS→MP4 转封装
- **任务管理** —— 暂停/继续/重试/删除（可连同文件）、全部暂停/继续、队列优先级（置顶/置底/上移/下移）、关键词搜索、定时开始（`startAt`）、崩溃恢复
- **后处理** —— 完成/失败 webhook、下载后脚本（`RDOWN_*` 环境变量）、自动解压（zip/tar/tgz）、速度历史仪表盘数据
- **浏览器扩展** —— 自动接管（优雅回退）、请求头透传、媒体嗅探与深度搜索、媒体预览（内置 hls.js）、文件名模板、多服务器 URL 路由、域名/后缀/大小过滤、磁力捕获、面向其他扩展的中间件 API、首次运行引导
- **接口** —— REST API + WebSocket 推送、MCP Server（为 AI 代理提供 9 个工具）、CLI（`node cli/rdown.mjs add/list/watch --stats/doctor`）、环境体检（`/api/v1/doctor`）、16800 端口 aria2 原生 JSON-RPC（兼容 AriaNG，secret 见设置）
- **国际化** —— Web UI：10 种语言，应用内切换（Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어）；扩展：9 种语言，跟随浏览器或手动覆盖，无需重载
- **部署** —— Dockerfile + docker-compose（非 root，NAS 友好）、Electron 桌面壳（托盘、磁力协议、.torrent 关联、开机自启）

## 浏览器扩展安装

1. 启动后端（`npm start`）
2. Chrome/Edge → `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序 → 选择 `extension/`
3. 引导向导打开：设置服务器地址（默认 `http://127.0.0.1:16801`）并测试连接
4. 此后浏览器下载会被自动接管；右键链接/媒体可手动发送

## 可选：完整版流媒体引擎

将 `N_m3u8DL-RE.exe` 放入 `bin/` 即可解锁 MSS（Smooth Streaming）、DRM 解密（通过外部 CDM）与字幕下载。设置中的 `preferExternalStreamEngine` 控制引擎优先级。

## 目录结构

```
bin/         engine binaries (download via tools/download-engines.mjs)
server/      Node.js backend (engine hosting, RPC, stream engine, REST/WS/MCP API)
web/         Vue3 Web UI source (build output served by backend)
extension/   Chrome/Edge MV3 extension
cli/         rdown.mjs command-line client
electron/    desktop shell (tray, protocol handlers)
docs/        API contract, roadmap, localized READMEs
test/        logic tests (extension, units, i18n, stream fixtures)
tools/       bootstrap & utility scripts
Dockerfile / docker-compose.yml   headless NAS deployment
```

## 安全说明

- 后端默认仅监听 `127.0.0.1`；aria2 RPC 使用随机 secret（持久化于 `data/settings.json`）
- 远程访问请启用 `rpcListenAll` 并设置 `apiToken`
- aria2 的 CA 证书包来自 Node 内置的 Mozilla 根证书（启动时写入 `data/cacert.pem`）

## 许可证

MIT（项目代码）。由 `tools/download-engines.mjs` 拉取的 aria2c / ffmpeg / ffprobe 二进制文件按其各自许可证分发（GPL-2.0 / GPL）。
