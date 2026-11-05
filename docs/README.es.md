# Rdown

Un gestor de descargas completo que fusiona lo mejor de aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, la extensión de Gopeed y cat-catch: una capa de motor, una interfaz web y una extensión de navegador.

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | **Español** | [Français](docs/README.fr.md) | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## Aspectos destacados

| Proyecto de origen | Lo que Rdown hereda |
|---|---|
| [aria2](https://github.com/aria2/aria2) | Núcleo de descarga: HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink, segmentos multiconexión, control JSON-RPC |
| [Motrix](https://github.com/agalwood/Motrix) | Experiencia de escritorio: alojamiento del motor, persistencia de sesión, actualización automática de trackers, compilación de 64 conexiones (se distribuye con la compilación de aria2 de Motrix) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | Descargas de streaming: HLS (m3u8) / DASH (mpd) VOD y grabación en vivo, descifrado AES-128 (Key/IV personalizados), DSL de selector, filtrado de segmentos publicitarios, rango personalizado, remultiplexado con ffmpeg |
| [Gopeed](https://github.com/GopeedLab/gopeed) | API moderna: resolve→create en dos pasos, modelo de tareas unificado, REST + push por WebSocket, MCP Server (9 herramientas), CLI con salida NDJSON |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | Captura en el navegador: interceptación automática, enrutamiento URL multiservidor, respaldo sin conexión, captura de magnet, API de middleware |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | Transferencia precisa de cabeceras de solicitud (Cookie/UA/Referer/Origin/Authorization vía webRequest) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | Detección de medios: descubrimiento de recursos, búsqueda profunda, filtros regex, vista previa de medios, plantillas de nombre de archivo, descarga automática |

## Arquitectura

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

## Inicio rápido

Requisitos: Windows 10+, Node.js 20+ (mirror de npm preconfigurado para China).

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

Windows con un clic: doble clic en `start.bat`.

## Resumen de funciones

- **Descargas HTTP/FTP** — hasta 64 conexiones por tarea, reanudación, URLs por lotes, UA/Referer/Cookie personalizados, límites de velocidad con 3 preajustes
- **BitTorrent y magnet** — DHT/LPD/PEX, actualización automática de trackers (multiespejo), ratio/tiempo de seed, descarga selectiva de archivos, persistencia de metadatos, mapeo de puertos UPnP/NAT-PMP
- **Streams (m3u8/mpd)** — detección automática, selección de calidad (best/worst/ancho de banda/DSL de selector de N_m3u8DL-RE como `res=^1280:for=best` y drop), descifrado AES-128 (obtención automática o Key/IV personalizados), filtrado regex de segmentos publicitarios, rango personalizado (índice o `05:00-20:00`), grabación en vivo con límite de tiempo, remux automático TS→MP4
- **Gestión de tareas** — pausar/reanudar/reintentar/eliminar (con archivos), pausar/reanudar todo, prioridad de cola (arriba/abajo/subir/bajar), búsqueda por palabra clave, inicio programado (`startAt`), recuperación ante fallos
- **Postprocesamiento** — webhook al completar/fallar, script post-descarga (variables de entorno `RDOWN_*`), extracción automática (zip/tar/tgz), datos del panel de historial de velocidad
- **Extensión de navegador** — captura automática con respaldo elegante, transferencia de cabeceras, detección de medios y búsqueda profunda, vista previa (hls.js incluido), plantillas de nombre, enrutamiento URL multiservidor, filtros por dominio/extensión/tamaño, captura de magnet, API de middleware para otras extensiones, asistente de primera ejecución
- **Interfaces** — REST API + push WebSocket, MCP Server (9 herramientas para agentes de IA), CLI (`node cli/rdown.mjs add/list/watch --stats/doctor`), doctor de entorno (`/api/v1/doctor`), JSON-RPC nativo de aria2 en 16800 (compatible con AriaNG, secret en ajustes)
- **Internacionalización** — Interfaz web: 10 idiomas con selector integrado (Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어); extensión: 9 idiomas, sigue al navegador o anulación manual sin recargar
- **Despliegue** — Dockerfile + docker-compose (sin root, listo para NAS), shell de escritorio Electron (bandeja, protocolo magnet, asociación .torrent, inicio automático)

## Instalar la extensión de navegador

1. Inicia el backend (`npm start`)
2. Chrome/Edge → `chrome://extensions` → Modo de desarrollador → Cargar extensión sin empaquetar → selecciona `extension/`
3. Se abre el asistente de incorporación: define la dirección del servidor (por defecto `http://127.0.0.1:16801`) y prueba la conexión
4. Las descargas del navegador se capturan automáticamente; clic derecho en enlaces/medios para envío manual

## Opcional: motor de streaming completo

Coloca `N_m3u8DL-RE.exe` en `bin/` para desbloquear MSS (Smooth Streaming), descifrado DRM (vía CDM externo) y descarga de subtítulos. `preferExternalStreamEngine` en los ajustes controla la prioridad del motor.

## Estructura del proyecto

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

## Notas de seguridad

- El backend escucha en `127.0.0.1` por defecto; el RPC de aria2 usa un secret aleatorio (persistido en `data/settings.json`)
- Para acceso remoto, activa `rpcListenAll` y define `apiToken`
- El paquete de CA de aria2 proviene de las raíces Mozilla integradas de Node (escrito en `data/cacert.pem` al arrancar)

## Licencia

MIT (código del proyecto). Los binarios aria2c / ffmpeg / ffprobe descargados por `tools/download-engines.mjs` se distribuyen bajo sus propias licencias (GPL-2.0 / GPL).
