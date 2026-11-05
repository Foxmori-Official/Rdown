# Rdown

一個融合 aria2、Motrix、N_m3u8DL-RE、Gopeed、Aria2-Explorer、Gopeed 擴充功能與貓抓（cat-catch）優點的全能下載管理器 —— 一個引擎層、一個 Web UI、一個瀏覽器擴充功能。

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | **繁體中文** | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## 亮點

| 來源專案 | Rdown 繼承的能力 |
|---|---|
| [aria2](https://github.com/aria2/aria2) | 下載核心：HTTP/HTTPS/FTP/SFTP/BitTorrent/磁力/Metalink，多連線分段，JSON-RPC 控制 |
| [Motrix](https://github.com/agalwood/Motrix) | 桌面級體驗：引擎託管、工作階段持久化、tracker 自動更新、64 連線建置（隨 Motrix 客製 aria2 建置發佈） |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | 串流媒體下載：HLS (m3u8) / DASH (mpd) 點播與直播錄製、AES-128 解密（自訂 Key/IV）、選取器 DSL、廣告分段過濾、自訂範圍、ffmpeg 轉封裝 |
| [Gopeed](https://github.com/GopeedLab/gopeed) | 現代化 API：resolve→create 兩段式、統一任務模型、REST + WebSocket 推送、MCP Server（9 個工具）、NDJSON 輸出的 CLI |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | 瀏覽器接管：自動攔截、多伺服器 URL 路由、離線回退、磁力擷取、中介軟體 API |
| [Gopeed 瀏覽器擴充功能](https://github.com/GopeedLab/browser-extension) | 精確的請求標頭透傳（透過 webRequest 傳遞 Cookie/UA/Referer/Origin/Authorization） |
| [cat-catch](https://github.com/xifangczy/cat-catch) | 媒體嗅探：資源發現、深度搜尋、正則過濾、媒體預覽、檔名範本、自動下載 |

## 架構

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

## 快速開始

需求：Windows 10+，Node.js 20+（已為中國使用者預先設定 npm 鏡像）。

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

Windows 一鍵啟動：雙擊 `start.bat`。

## 功能總覽

- **HTTP/FTP 下載** —— 單任務最高 64 連線、斷點續傳、批次 URL、自訂 UA/Referer/Cookie、限速（3 檔預設）
- **BitTorrent 與磁力** —— DHT/LPD/PEX、tracker 自動更新（多鏡像）、做種比/做種時間、選擇性檔案下載、中繼資料持久化、UPnP/NAT-PMP 連接埠對應
- **串流媒體（m3u8/mpd）** —— 自動識別、清晰度選擇（best/worst/頻寬/N_m3u8DL-RE 選取器 DSL，如 `res=^1280:for=best` 與 drop）、AES-128 解密（自動拉取或自訂 Key/IV）、廣告分段正則過濾、自訂範圍（索引或 `05:00-20:00`）、限時直播錄製、自動 TS→MP4 轉封裝
- **任務管理** —— 暫停/繼續/重試/刪除（可連同檔案）、全部暫停/繼續、佇列優先順序（置頂/置底/上移/下移）、關鍵字搜尋、定時開始（`startAt`）、當機復原
- **後處理** —— 完成/失敗 webhook、下載後腳本（`RDOWN_*` 環境變數）、自動解壓（zip/tar/tgz）、速度歷史儀表板資料
- **瀏覽器擴充功能** —— 自動接管（優雅回退）、請求標頭透傳、媒體嗅探與深度搜尋、媒體預覽（內建 hls.js）、檔名範本、多伺服器 URL 路由、網域/副檔名/大小過濾、磁力擷取、面向其他擴充功能的中介軟體 API、首次執行引導
- **介面** —— REST API + WebSocket 推送、MCP Server（為 AI 代理提供 9 個工具）、CLI（`node cli/rdown.mjs add/list/watch --stats/doctor`）、環境體檢（`/api/v1/doctor`）、16800 連接埠 aria2 原生 JSON-RPC（相容 AriaNG，secret 見設定）
- **國際化** —— Web UI：10 種語言，應用程式內切換（Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어）；擴充功能：9 種語言，跟隨瀏覽器或手動覆寫，無需重新載入
- **部署** —— Dockerfile + docker-compose（非 root，NAS 友善）、Electron 桌面殼（系統匣、磁力協定、.torrent 關聯、開機自啟）

## 瀏覽器擴充功能安裝

1. 啟動後端（`npm start`）
2. Chrome/Edge → `chrome://extensions` → 開發人員模式 → 載入未封裝的擴充功能 → 選擇 `extension/`
3. 引導精靈開啟：設定伺服器位址（預設 `http://127.0.0.1:16801`）並測試連線
4. 此後瀏覽器下載會被自動接管；右鍵連結/媒體可手動傳送

## 可選：完整版串流媒體引擎

將 `N_m3u8DL-RE.exe` 放入 `bin/` 即可解鎖 MSS（Smooth Streaming）、DRM 解密（透過外部 CDM）與字幕下載。設定中的 `preferExternalStreamEngine` 控制引擎優先順序。

## 目錄結構

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

## 安全說明

- 後端預設僅監聽 `127.0.0.1`；aria2 RPC 使用隨機 secret（持久化於 `data/settings.json`）
- 遠端存取請啟用 `rpcListenAll` 並設定 `apiToken`
- aria2 的 CA 憑證包來自 Node 內建的 Mozilla 根憑證（啟動時寫入 `data/cacert.pem`）

## 授權條款

MIT（專案程式碼）。由 `tools/download-engines.mjs` 拉取的 aria2c / ffmpeg / ffprobe 二進位檔案按其各自授權條款散佈（GPL-2.0 / GPL）。
