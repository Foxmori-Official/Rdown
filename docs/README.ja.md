# Rdown

aria2、Motrix、N_m3u8DL-RE、Gopeed、Aria2-Explorer、Gopeed 拡張機能、cat-catch の長所を融合したフル機能ダウンロードマネージャー — 1 つのエンジン層、1 つの Web UI、1 つのブラウザー拡張機能。

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | **日本語** | [한국어](docs/README.ko.md)

## ハイライト

| ソースプロジェクト | Rdown が継承するもの |
|---|---|
| [aria2](https://github.com/aria2/aria2) | ダウンロードコア：HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink、マルチ接続セグメント、JSON-RPC 制御 |
| [Motrix](https://github.com/agalwood/Motrix) | デスクトップ級の体験：エンジンホスティング、セッション永続化、トラッカー自動更新、64 接続ビルド（Motrix の aria2 ビルドを同梱） |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | ストリームダウンロード：HLS (m3u8) / DASH (mpd) の VOD とライブ録画、AES-128 復号（カスタム Key/IV）、セレクター DSL、広告セグメントフィルタリング、カスタム範囲、ffmpeg リマックス |
| [Gopeed](https://github.com/GopeedLab/gopeed) | モダン API：resolve→create の 2 段階、統一タスクモデル、REST + WebSocket プッシュ、MCP Server（9 ツール）、NDJSON 出力の CLI |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | ブラウザーキャプチャ：自動インターセプト、マルチサーバー URL ルーティング、オフラインフォールバック、magnet キャプチャ、ミドルウェア API |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | 正確なリクエストヘッダー透過（webRequest 経由で Cookie/UA/Referer/Origin/Authorization） |
| [cat-catch](https://github.com/xifangczy/cat-catch) | メディアスニッフィング：リソース検出、ディープサーチ、正規表現フィルター、メディアプレビュー、ファイル名テンプレート、自動ダウンロード |

## アーキテクチャ

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

## クイックスタート

要件：Windows 10+、Node.js 20+（中国向け npm ミラー設定済み）。

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

Windows ワンクリック：`start.bat` をダブルクリック。

## 機能概要

- **HTTP/FTP ダウンロード** — タスクあたり最大 64 接続、レジューム、バッチ URL、カスタム UA/Referer/Cookie、3 プリセットの速度制限
- **BitTorrent & magnet** — DHT/LPD/PEX、トラッカー自動更新（マルチミラー）、シード比/時間、選択的ファイルダウンロード、メタデータ永続化、UPnP/NAT-PMP ポートマッピング
- **ストリーム (m3u8/mpd)** — 自動検出、画質選択（best/worst/帯域/N_m3u8DL-RE セレクター DSL（`res=^1280:for=best` や drop など））、AES-128 復号（自動取得またはカスタム Key/IV）、広告セグメント正規表現フィルタリング、カスタム範囲（インデックスまたは `05:00-20:00`）、時間制限付きライブ録画、自動 TS→MP4 リマックス
- **タスク管理** — 一時停止/再開/再試行/削除（ファイルごと）、すべて一時停止/再開、キュー優先度（先頭/末尾/上げる/下げる）、キーワード検索、スケジュール開始（`startAt`）、クラッシュ復旧
- **後処理** — 完了/失敗時の webhook、ダウンロード後スクリプト（`RDOWN_*` 環境変数）、自動展開（zip/tar/tgz）、速度履歴ダッシュボードデータ
- **ブラウザー拡張機能** — グレースフルフォールバック付き自動キャプチャ、リクエストヘッダー透過、メディアスニッフィングとディープサーチ、メディアプレビュー（hls.js 同梱）、ファイル名テンプレート、マルチサーバー URL ルーティング、ドメイン/拡張子/サイズフィルター、magnet キャプチャ、他拡張機能用ミドルウェア API、初回起動オンボーディング
- **インターフェース** — REST API + WebSocket プッシュ、MCP Server（AI エージェント向け 9 ツール）、CLI（`node cli/rdown.mjs add/list/watch --stats/doctor`）、環境ドクター（`/api/v1/doctor`）、16800 番ポートの aria2 ネイティブ JSON-RPC（AriaNG 互換、secret は設定内）
- **国際化** — Web UI：アプリ内切り替えで 10 言語（Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어）；拡張機能：9 ロケール、ブラウザーに追従またはリロード不要の手動上書き
- **デプロイ** — Dockerfile + docker-compose（非 root、NAS 対応）、Electron デスクトップシェル（トレイ、magnet プロトコル、.torrent 関連付け、自動起動）

## ブラウザー拡張機能のインストール

1. バックエンドを起動（`npm start`）
2. Chrome/Edge → `chrome://extensions` → デベロッパーモード → パッケージ化されていない拡張機能を読み込む → `extension/` を選択
3. オンボーディングウィザードが開きます：サーバーアドレス（デフォルト `http://127.0.0.1:16801`）を設定して接続をテスト
4. 以降、ブラウザーのダウンロードは自動的にキャプチャされます。リンク/メディアを右クリックで手動送信

## オプション：フル機能ストリームエンジン

`N_m3u8DL-RE.exe` を `bin/` に入れると、MSS（Smooth Streaming）、DRM 復号（外部 CDM 経由）、字幕ダウンロードが解放されます。設定の `preferExternalStreamEngine` がエンジン優先度を制御します。

## プロジェクト構成

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

## セキュリティに関する注意

- バックエンドはデフォルトで `127.0.0.1` のみリッスン。aria2 RPC はランダムな secret を使用（`data/settings.json` に永続化）
- リモートアクセスには `rpcListenAll` を有効化し、`apiToken` を設定
- aria2 の CA バンドルは Node 組み込みの Mozilla ルート証明書から生成（起動時に `data/cacert.pem` に書き込み）

## ライセンス

MIT（プロジェクトコード）。`tools/download-engines.mjs` が取得する aria2c / ffmpeg / ffprobe バイナリは、それぞれ独自のライセンス（GPL-2.0 / GPL）で配布されています。
