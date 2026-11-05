# Rdown

Ein voll ausgestatteter Download-Manager, der die Stärken von aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, der Gopeed-Erweiterung und cat-catch vereint — eine Engine-Schicht, eine Web-UI, eine Browser-Erweiterung.

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | **Deutsch** | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## Highlights

| Quellprojekt | Was Rdown übernimmt |
|---|---|
| [aria2](https://github.com/aria2/aria2) | Download-Kern: HTTP/HTTPS/FTP/SFTP/BitTorrent/Magnet/Metalink, Multi-Verbindungs-Segmente, JSON-RPC-Steuerung |
| [Motrix](https://github.com/agalwood/Motrix) | Desktop-Erlebnis: Engine-Hosting, Sitzungspersistenz, automatische Tracker-Aktualisierung, 64-Verbindungen-Build (wird mit dem Motrix-aria2-Build ausgeliefert) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | Stream-Downloads: HLS (m3u8) / DASH (mpd) VOD & Live-Aufnahme, AES-128-Entschlüsselung (eigener Key/IV), Selektor-DSL, Werbe-Segment-Filterung, benutzerdefinierter Bereich, ffmpeg-Remuxing |
| [Gopeed](https://github.com/GopeedLab/gopeed) | Moderne API: Resolve→Create in zwei Schritten, einheitliches Aufgabenmodell, REST + WebSocket-Push, MCP Server (9 Tools), CLI mit NDJSON-Ausgabe |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | Browser-Erfassung: automatische Abfangung, Multi-Server-URL-Routing, Offline-Fallback, Magnet-Erfassung, Middleware-API |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | Präzise Request-Header-Weitergabe (Cookie/UA/Referer/Origin/Authorization via webRequest) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | Medien-Sniffing: Ressourcen-Erkennung, Tiefensuche, Regex-Filter, Medienvorschau, Dateinamen-Vorlagen, Auto-Download |

## Architektur

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

## Schnellstart

Voraussetzungen: Windows 10+, Node.js 20+ (npm-Mirror für China vorkonfiguriert).

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

Windows-Ein-Klick: Doppelklick auf `start.bat`.

## Funktionsübersicht

- **HTTP/FTP-Downloads** — bis zu 64 Verbindungen pro Aufgabe, Fortsetzen, Stapel-URLs, eigene UA/Referer/Cookie, Tempolimits mit 3 Voreinstellungen
- **BitTorrent & Magnet** — DHT/LPD/PEX, automatische Tracker-Aktualisierung (Multi-Mirror), Seed-Ratio/-Zeit, selektiver Datei-Download, Metadaten-Persistenz, UPnP/NAT-PMP-Port-Mapping
- **Streams (m3u8/mpd)** — Auto-Erkennung, Qualitätsauswahl (best/worst/Bandbreite/N_m3u8DL-RE-Selektor-DSL wie `res=^1280:for=best` und drop), AES-128-Entschlüsselung (automatischer Abruf oder eigener Key/IV), Werbe-Segment-Regex-Filterung, benutzerdefinierter Bereich (Index oder `05:00-20:00`), Live-Aufnahme mit Zeitlimit, automatisches TS→MP4-Remux
- **Aufgabenverwaltung** — Pause/Fortsetzen/Wiederholen/Löschen (mit Dateien), Alle pausieren/fortsetzen, Warteschlangen-Priorität (ganz oben/unten/hoch/runter), Stichwortsuche, geplanter Start (`startAt`), Absturz-Wiederherstellung
- **Nachbearbeitung** — Webhook bei Abschluss/Fehler, Post-Download-Skript (`RDOWN_*`-Umgebungsvariablen), Auto-Entpacken (zip/tar/tgz), Daten für das Tempo-Verlaufs-Dashboard
- **Browser-Erweiterung** — automatische Erfassung mit graceful Fallback, Request-Header-Weitergabe, Medien-Sniffing & Tiefensuche, Medienvorschau (gebündeltes hls.js), Dateinamen-Vorlagen, Multi-Server-URL-Routing, Domain-/Erweiterungs-/Größenfilter, Magnet-Erfassung, Middleware-API für andere Erweiterungen, Onboarding beim ersten Start
- **Schnittstellen** — REST API + WebSocket-Push, MCP Server (9 Tools für KI-Agenten), CLI (`node cli/rdown.mjs add/list/watch --stats/doctor`), Umgebungs-Doktor (`/api/v1/doctor`), aria2-natives JSON-RPC auf 16800 (AriaNG-kompatibel, Secret in den Einstellungen)
- **Internationalisierung** — Web-UI: 10 Sprachen mit In-App-Umschalter (Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어); Erweiterung: 9 Sprachen, folgt dem Browser oder manuellem Override ohne Neuladen
- **Deployment** — Dockerfile + docker-compose (non-root, NAS-tauglich), Electron-Desktop-Shell (Tray, Magnet-Protokoll, .torrent-Zuordnung, Autostart)

## Browser-Erweiterung installieren

1. Backend starten (`npm start`)
2. Chrome/Edge → `chrome://extensions` → Entwicklermodus → Entpackte Erweiterung laden → `extension/` auswählen
3. Der Onboarding-Assistent öffnet sich: Serveradresse eintragen (Standard `http://127.0.0.1:16801`) und Verbindung testen
4. Browser-Downloads werden nun automatisch erfasst; Rechtsklick auf Links/Medien für manuelles Senden

## Optional: vollständige Stream-Engine

`N_m3u8DL-RE.exe` nach `bin/` legen, um MSS (Smooth Streaming), DRM-Entschlüsselung (via externem CDM) und Untertitel-Downloads freizuschalten. `preferExternalStreamEngine` in den Einstellungen steuert die Engine-Priorität.

## Projektstruktur

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

## Sicherheitshinweise

- Das Backend lauscht standardmäßig auf `127.0.0.1`; aria2-RPC nutzt ein zufälliges Secret (persistiert in `data/settings.json`)
- Für Fernzugriff `rpcListenAll` aktivieren und `apiToken` setzen
- Das CA-Bundle von aria2 stammt aus Nodes eingebauten Mozilla-Roots (beim Start nach `data/cacert.pem` geschrieben)

## Lizenz

MIT (Projektcode). Die von `tools/download-engines.mjs` geladenen Binärdateien aria2c / ffmpeg / ffprobe werden unter ihren eigenen Lizenzen vertrieben (GPL-2.0 / GPL).
