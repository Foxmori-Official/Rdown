# Rdown

> **Foxmori initial public alpha · v0.0.1-alpha.1** — This repository contains the current source and Foxmori product icons. Download test builds from [Releases](https://github.com/Foxmori-Official/Rdown/releases/tag/v0.0.1-alpha.1). Browser-store publishing and real-service/end-to-end acceptance are still pending.
>
> **首次公开测试版**：本轮修复、验证范围和已知限制见 [RELEASE_NOTES.md](RELEASE_NOTES.md)。安装依赖时会自动恢复图标；不包含真实 Key、本地数据、历史审查截图或下载引擎二进制。


A full-featured download manager that fuses the best of aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, Gopeed Extension and cat-catch — one engine layer, one Web UI, one browser extension.

**English** | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## Highlights

| Source project | What Rdown inherits |
|---|---|
| [aria2](https://github.com/aria2/aria2) | Download core: HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink, multi-connection segments, JSON-RPC control |
| [Motrix](https://github.com/agalwood/Motrix) | Desktop-grade experience: engine hosting, session persistence, tracker auto-update, 64-connection build (ships with the Motrix aria2 build) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | Stream downloads: HLS (m3u8) / DASH (mpd) VOD & live recording, AES-128 decryption (custom Key/IV), selector DSL, ad-segment filtering, custom-range, ffmpeg remuxing |
| [Gopeed](https://github.com/GopeedLab/gopeed) | Modern API: resolve→create two-step, unified task model, REST + WebSocket push, MCP Server (9 tools), CLI with NDJSON output |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | Browser capture: auto interception, multi-server URL routing, offline fallback, magnet capture, middleware API |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | Precise request-header passthrough (Cookie/UA/Referer/Origin/Authorization via webRequest) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | Media sniffing: resource discovery, deep search, regex filters, media preview, filename templates, auto-download |

## Architecture

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

## Quick start

Requirements: Windows 10+, Node.js 20+ (npm mirror pre-configured for China).

```bash
# 1. Download engine binaries (aria2c / ffmpeg / ffprobe)
node tools/download-engines.mjs

# 2. Install dependencies (root install also restores the checked-in product artwork)
npm install
cd server && npm install && cd ../web && npm install && cd ..

# 3. Build the Web UI
npm run build:web

# 4. Start (backend + Web UI in one process)
npm start        # open http://127.0.0.1:16801
```

Windows one-click: double-click `start.bat`.

## Feature overview

- **HTTP/FTP downloads** — up to 64 connections per task, resume, batch URLs, custom UA/Referer/Cookie, speed limits with 3 presets
- **BitTorrent & magnet** — DHT/LPD/PEX, tracker auto-update (multi-mirror), seed ratio/time, selective file download, metadata persistence, UPnP/NAT-PMP port mapping
- **Streams (m3u8/mpd)** — auto-detect, quality selection (best/worst/bandwidth/N_m3u8DL-RE selector DSL like `res=^1280:for=best` and drop), AES-128 decryption (auto-fetch or custom Key/IV), ad-segment regex filtering, custom-range (index or `05:00-20:00`), live recording with time limit, auto TS→MP4 remux
- **Task management** — pause/resume/retry/delete (with files), pause-all/resume-all, queue priority (top/bottom/up/down), keyword search, scheduled start (`startAt`), crash recovery
- **Post-processing** — webhook on completion/failure, post-download script (`RDOWN_*` env vars), auto-extract (zip/tar/tgz), speed history dashboard data
- **Browser extension** — auto capture with graceful fallback, request-header passthrough, media sniffing & deep search, media preview (bundled hls.js), filename templates, multi-server URL routing, domain/extension/size filters, magnet capture, middleware API for other extensions, first-run onboarding
- **Interfaces** — REST API + WebSocket push, MCP Server (9 tools for AI agents), CLI (`node cli/rdown.mjs add/list/watch --stats/doctor`), environment doctor (`/api/v1/doctor`), aria2 native JSON-RPC on 16800 (AriaNG compatible, secret in settings)
- **Internationalization** — Web UI: 9 languages plus Auto with in-app switcher (Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어); extension: 9 locales, follows browser or manual override without reload
- **Deployment** — Dockerfile + docker-compose (non-root, NAS-ready), Electron desktop shell (tray, magnet protocol, .torrent association, auto-launch)

## Browser extension install

1. Start the backend (`npm start`)
2. Chrome/Edge → `chrome://extensions` → Developer mode → Load unpacked → select `extension/`
3. The onboarding wizard opens: set the server address (default `http://127.0.0.1:16801`) and test the connection
4. Browser downloads are now captured automatically; right-click links/media for manual send

## Optional: full stream engine

Drop `N_m3u8DL-RE.exe` into `bin/` to unlock MSS (Smooth Streaming), DRM decryption (via external CDM), and subtitle downloads. `preferExternalStreamEngine` in settings controls engine priority.

## Project layout

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

## Security notes

- Backend listens on `127.0.0.1` by default; aria2 RPC uses a random secret (persisted in `data/settings.json`)
- For remote access, enable `rpcListenAll` and set `apiToken`
- aria2's CA bundle comes from Node's built-in Mozilla roots (written to `data/cacert.pem` at boot)

## License

MIT (project code). aria2c / ffmpeg / ffprobe binaries fetched by `tools/download-engines.mjs` are distributed by their own licenses (GPL-2.0 / GPL).
