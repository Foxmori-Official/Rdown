# Rdown

aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, Gopeed 확장 프로그램, cat-catch의 장점을 융합한 완전한 기능의 다운로드 관리자 — 하나의 엔진 레이어, 하나의 웹 UI, 하나의 브라우저 확장 프로그램.

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | **한국어**

## 주요 특징

| 원본 프로젝트 | Rdown이 계승한 것 |
|---|---|
| [aria2](https://github.com/aria2/aria2) | 다운로드 코어: HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink, 다중 연결 세그먼트, JSON-RPC 제어 |
| [Motrix](https://github.com/agalwood/Motrix) | 데스크톱급 경험: 엔진 호스팅, 세션 지속성, 트래커 자동 업데이트, 64연결 빌드(Motrix aria2 빌드 탑재) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | 스트림 다운로드: HLS (m3u8) / DASH (mpd) VOD 및 라이브 녹화, AES-128 복호화(사용자 지정 Key/IV), 셀렉터 DSL, 광고 세그먼트 필터링, 사용자 지정 범위, ffmpeg 리먹싱 |
| [Gopeed](https://github.com/GopeedLab/gopeed) | 모던 API: resolve→create 2단계, 통합 작업 모델, REST + WebSocket 푸시, MCP Server(도구 9개), NDJSON 출력 CLI |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | 브라우저 캡처: 자동 가로채기, 멀티 서버 URL 라우팅, 오프라인 폴백, magnet 캡처, 미들웨어 API |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | 정확한 요청 헤더 전달(webRequest를 통해 Cookie/UA/Referer/Origin/Authorization) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | 미디어 스니핑: 리소스 검색, 딥 서치, 정규식 필터, 미디어 미리보기, 파일 이름 템플릿, 자동 다운로드 |

## 아키텍처

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

## 빠른 시작

요구 사항: Windows 10+, Node.js 20+ (중국용 npm 미러 사전 구성됨).

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

Windows 원클릭: `start.bat`을 더블 클릭.

## 기능 개요

- **HTTP/FTP 다운로드** — 작업당 최대 64개 연결, 이어받기, 일괄 URL, 사용자 지정 UA/Referer/Cookie, 3개 프리셋 속도 제한
- **BitTorrent 및 magnet** — DHT/LPD/PEX, 트래커 자동 업데이트(멀티 미러), 시드 비율/시간, 선택적 파일 다운로드, 메타데이터 지속성, UPnP/NAT-PMP 포트 매핑
- **스트림 (m3u8/mpd)** — 자동 감지, 화질 선택(best/worst/대역폭/N_m3u8DL-RE 셀렉터 DSL, 예: `res=^1280:for=best` 및 drop), AES-128 복호화(자동 가져오기 또는 사용자 지정 Key/IV), 광고 세그먼트 정규식 필터링, 사용자 지정 범위(인덱스 또는 `05:00-20:00`), 시간 제한 라이브 녹화, 자동 TS→MP4 리먹스
- **작업 관리** — 일시 중지/재개/재시도/삭제(파일 포함), 전체 일시 중지/재개, 대기열 우선순위(맨 위/맨 아래/위로/아래로), 키워드 검색, 예약 시작(`startAt`), 충돌 복구
- **후처리** — 완료/실패 시 webhook, 다운로드 후 스크립트(`RDOWN_*` 환경 변수), 자동 압축 해제(zip/tar/tgz), 속도 기록 대시보드 데이터
- **브라우저 확장 프로그램** — 우아한 폴백을 갖춘 자동 캡처, 요청 헤더 전달, 미디어 스니핑 및 딥 서치, 미디어 미리보기(번들 hls.js), 파일 이름 템플릿, 멀티 서버 URL 라우팅, 도메인/확장자/크기 필터, magnet 캡처, 다른 확장용 미들웨어 API, 첫 실행 온보딩
- **인터페이스** — REST API + WebSocket 푸시, MCP Server(AI 에이전트용 도구 9개), CLI(`node cli/rdown.mjs add/list/watch --stats/doctor`), 환경 닥터(`/api/v1/doctor`), 16800 포트의 aria2 네이티브 JSON-RPC(AriaNG 호환, secret은 설정에)
- **국제화** — 웹 UI: 앱 내 전환으로 10개 언어(Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어); 확장 프로그램: 9개 로케일, 브라우저를 따르거나 새로고침 없이 수동 지정
- **배포** — Dockerfile + docker-compose(비루트, NAS 지원), Electron 데스크톱 셸(트레이, magnet 프로토콜, .torrent 연결, 자동 실행)

## 브라우저 확장 프로그램 설치

1. 백엔드 시작(`npm start`)
2. Chrome/Edge → `chrome://extensions` → 개발자 모드 → 압축 해제된 확장 프로그램 로드 → `extension/` 선택
3. 온보딩 마법사가 열립니다: 서버 주소(기본값 `http://127.0.0.1:16801`)를 설정하고 연결 테스트
4. 이제 브라우저 다운로드가 자동으로 캡처됩니다. 링크/미디어를 마우스 오른쪽 버튼으로 클릭해 수동 전송

## 선택 사항: 전체 스트림 엔진

`N_m3u8DL-RE.exe`를 `bin/`에 넣으면 MSS(Smooth Streaming), DRM 복호화(외부 CDM 경유), 자막 다운로드가 활성화됩니다. 설정의 `preferExternalStreamEngine`이 엔진 우선순위를 제어합니다.

## 프로젝트 구조

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

## 보안 참고 사항

- 백엔드는 기본적으로 `127.0.0.1`에서만 수신합니다. aria2 RPC는 무작위 secret을 사용합니다(`data/settings.json`에 저장)
- 원격 접근이 필요하면 `rpcListenAll`을 활성화하고 `apiToken`을 설정하세요
- aria2의 CA 번들은 Node 내장 Mozilla 루트에서 가져옵니다(부팅 시 `data/cacert.pem`에 기록)

## 라이선스

MIT(프로젝트 코드). `tools/download-engines.mjs`가 가져오는 aria2c / ffmpeg / ffprobe 바이너리는 각자의 라이선스(GPL-2.0 / GPL)로 배포됩니다.
