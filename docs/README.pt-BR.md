# Rdown

Um gerenciador de downloads completo que funde o melhor do aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, da extensão do Gopeed e do cat-catch — uma camada de motor, uma interface Web, uma extensão de navegador.

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | [Français](docs/README.fr.md) | **Português (Brasil)** | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## Destaques

| Projeto de origem | O que o Rdown herda |
|---|---|
| [aria2](https://github.com/aria2/aria2) | Núcleo de download: HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink, segmentos multiconexão, controle JSON-RPC |
| [Motrix](https://github.com/agalwood/Motrix) | Experiência de desktop: hospedagem do motor, persistência de sessão, atualização automática de trackers, build de 64 conexões (acompanha o build do aria2 do Motrix) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | Downloads de streaming: HLS (m3u8) / DASH (mpd) VOD e gravação ao vivo, descriptografia AES-128 (Key/IV personalizados), DSL de seletor, filtragem de segmentos de anúncio, intervalo personalizado, remux com ffmpeg |
| [Gopeed](https://github.com/GopeedLab/gopeed) | API moderna: resolve→create em duas etapas, modelo de tarefas unificado, REST + push via WebSocket, MCP Server (9 ferramentas), CLI com saída NDJSON |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | Captura no navegador: interceptação automática, roteamento de URL multisservidor, fallback offline, captura de magnet, API de middleware |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | Repasse preciso de cabeçalhos de requisição (Cookie/UA/Referer/Origin/Authorization via webRequest) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | Detecção de mídia: descoberta de recursos, busca profunda, filtros regex, pré-visualização de mídia, modelos de nome de arquivo, download automático |

## Arquitetura

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

## Início rápido

Requisitos: Windows 10+, Node.js 20+ (mirror do npm pré-configurado para a China).

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

Windows com um clique: clique duas vezes em `start.bat`.

## Visão geral dos recursos

- **Downloads HTTP/FTP** — até 64 conexões por tarefa, retomada, URLs em lote, UA/Referer/Cookie personalizados, limites de velocidade com 3 predefinições
- **BitTorrent e magnet** — DHT/LPD/PEX, atualização automática de trackers (multi-mirror), proporção/tempo de seed, download seletivo de arquivos, persistência de metadados, mapeamento de portas UPnP/NAT-PMP
- **Streams (m3u8/mpd)** — detecção automática, seleção de qualidade (best/worst/largura de banda/DSL de seletor do N_m3u8DL-RE como `res=^1280:for=best` e drop), descriptografia AES-128 (busca automática ou Key/IV personalizados), filtragem regex de segmentos de anúncio, intervalo personalizado (índice ou `05:00-20:00`), gravação ao vivo com limite de tempo, remux automático TS→MP4
- **Gerenciamento de tarefas** — pausar/retomar/tentar novamente/excluir (com arquivos), pausar/retomar tudo, prioridade de fila (topo/fim/subir/descer), busca por palavra-chave, início agendado (`startAt`), recuperação de falhas
- **Pós-processamento** — webhook em conclusão/falha, script pós-download (variáveis de ambiente `RDOWN_*`), extração automática (zip/tar/tgz), dados do painel de histórico de velocidade
- **Extensão de navegador** — captura automática com fallback elegante, repasse de cabeçalhos, detecção de mídia e busca profunda, pré-visualização de mídia (hls.js embutido), modelos de nome de arquivo, roteamento de URL multisservidor, filtros por domínio/extensão/tamanho, captura de magnet, API de middleware para outras extensões, onboarding na primeira execução
- **Interfaces** — REST API + push WebSocket, MCP Server (9 ferramentas para agentes de IA), CLI (`node cli/rdown.mjs add/list/watch --stats/doctor`), doctor de ambiente (`/api/v1/doctor`), JSON-RPC nativo do aria2 na 16800 (compatível com AriaNG, secret nas configurações)
- **Internacionalização** — Interface Web: 10 idiomas com seletor no app (Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어); extensão: 9 idiomas, segue o navegador ou substituição manual sem recarregar
- **Implantação** — Dockerfile + docker-compose (não-root, pronto para NAS), shell de desktop Electron (bandeja, protocolo magnet, associação .torrent, inicialização automática)

## Instalação da extensão de navegador

1. Inicie o backend (`npm start`)
2. Chrome/Edge → `chrome://extensions` → Modo de desenvolvedor → Carregar sem compactação → selecione `extension/`
3. O assistente de onboarding abre: defina o endereço do servidor (padrão `http://127.0.0.1:16801`) e teste a conexão
4. Os downloads do navegador passam a ser capturados automaticamente; clique com o botão direito em links/mídias para envio manual

## Opcional: motor de streaming completo

Coloque o `N_m3u8DL-RE.exe` em `bin/` para desbloquear MSS (Smooth Streaming), descriptografia DRM (via CDM externo) e download de legendas. `preferExternalStreamEngine` nas configurações controla a prioridade do motor.

## Estrutura do projeto

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

## Notas de segurança

- O backend escuta em `127.0.0.1` por padrão; o RPC do aria2 usa um secret aleatório (persistido em `data/settings.json`)
- Para acesso remoto, ative `rpcListenAll` e defina `apiToken`
- O pacote de CA do aria2 vem das raízes Mozilla embutidas do Node (gravado em `data/cacert.pem` na inicialização)

## Licença

MIT (código do projeto). Os binários aria2c / ffmpeg / ffprobe baixados por `tools/download-engines.mjs` são distribuídos sob suas próprias licenças (GPL-2.0 / GPL).
