# Rdown

Un gestionnaire de téléchargements complet qui fusionne le meilleur d'aria2, Motrix, N_m3u8DL-RE, Gopeed, Aria2-Explorer, de l'extension Gopeed et de cat-catch — une couche moteur, une interface Web, une extension de navigateur.

[English](docs/README.en.md) | [简体中文](docs/README.zh-CN.md) | [繁體中文](docs/README.zh-TW.md) | [Deutsch](docs/README.de.md) | [Español](docs/README.es.md) | **Français** | [Português (Brasil)](docs/README.pt-BR.md) | [日本語](docs/README.ja.md) | [한국어](docs/README.ko.md)

## Points forts

| Projet source | Ce que Rdown en hérite |
|---|---|
| [aria2](https://github.com/aria2/aria2) | Noyau de téléchargement : HTTP/HTTPS/FTP/SFTP/BitTorrent/magnet/Metalink, segments multi-connexions, contrôle JSON-RPC |
| [Motrix](https://github.com/agalwood/Motrix) | Expérience de bureau : hébergement du moteur, persistance de session, mise à jour automatique des trackers, build 64 connexions (livré avec le build aria2 de Motrix) |
| [N_m3u8DL-RE](https://github.com/nilaoda/N_m3u8DL-RE) | Téléchargements de flux : HLS (m3u8) / DASH (mpd) VOD et enregistrement en direct, déchiffrement AES-128 (Key/IV personnalisés), DSL de sélecteur, filtrage des segments publicitaires, plage personnalisée, remux ffmpeg |
| [Gopeed](https://github.com/GopeedLab/gopeed) | API moderne : resolve→create en deux étapes, modèle de tâches unifié, REST + push WebSocket, MCP Server (9 outils), CLI avec sortie NDJSON |
| [Aria2-Explorer](https://github.com/alexhua/Aria2-Explorer) | Capture navigateur : interception automatique, routage URL multi-serveurs, repli hors ligne, capture magnet, API middleware |
| [Gopeed browser-extension](https://github.com/GopeedLab/browser-extension) | Transmission précise des en-têtes de requête (Cookie/UA/Referer/Origin/Authorization via webRequest) |
| [cat-catch](https://github.com/xifangczy/cat-catch) | Détection de médias : découverte de ressources, recherche profonde, filtres regex, aperçu des médias, modèles de nom de fichier, téléchargement automatique |

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

## Démarrage rapide

Prérequis : Windows 10+, Node.js 20+ (miroir npm préconfiguré pour la Chine).

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

Windows en un clic : double-cliquez sur `start.bat`.

## Aperçu des fonctionnalités

- **Téléchargements HTTP/FTP** — jusqu'à 64 connexions par tâche, reprise, URLs par lot, UA/Referer/Cookie personnalisés, limites de vitesse avec 3 préréglages
- **BitTorrent & magnet** — DHT/LPD/PEX, mise à jour automatique des trackers (multi-miroirs), ratio/durée de seed, téléchargement sélectif de fichiers, persistance des métadonnées, mappage de ports UPnP/NAT-PMP
- **Flux (m3u8/mpd)** — détection automatique, sélection de qualité (best/worst/bande passante/DSL de sélecteur N_m3u8DL-RE comme `res=^1280:for=best` et drop), déchiffrement AES-128 (récupération automatique ou Key/IV personnalisés), filtrage regex des segments publicitaires, plage personnalisée (index ou `05:00-20:00`), enregistrement en direct avec limite de temps, remux automatique TS→MP4
- **Gestion des tâches** — pause/reprise/réessai/suppression (avec fichiers), pause/reprise globale, priorité de file (haut/bas/monter/descendre), recherche par mot-clé, démarrage planifié (`startAt`), reprise après crash
- **Post-traitement** — webhook à la réussite/échec, script post-téléchargement (variables d'environnement `RDOWN_*`), extraction automatique (zip/tar/tgz), données du tableau de bord d'historique de vitesse
- **Extension de navigateur** — capture automatique avec repli gracieux, transmission des en-têtes, détection de médias et recherche profonde, aperçu des médias (hls.js embarqué), modèles de nom de fichier, routage URL multi-serveurs, filtres par domaine/extension/taille, capture magnet, API middleware pour d'autres extensions, assistant de premier démarrage
- **Interfaces** — REST API + push WebSocket, MCP Server (9 outils pour agents IA), CLI (`node cli/rdown.mjs add/list/watch --stats/doctor`), docteur d'environnement (`/api/v1/doctor`), JSON-RPC natif d'aria2 sur 16800 (compatible AriaNG, secret dans les paramètres)
- **Internationalisation** — Interface Web : 10 langues avec sélecteur intégré (Auto/English/Deutsch/Español/Français/Português (Brasil)/日本語/简体中文/繁體中文/한국어) ; extension : 9 langues, suit le navigateur ou forçage manuel sans rechargement
- **Déploiement** — Dockerfile + docker-compose (non-root, prêt pour NAS), shell de bureau Electron (barre d'état, protocole magnet, association .torrent, lancement automatique)

## Installation de l'extension de navigateur

1. Démarrez le backend (`npm start`)
2. Chrome/Edge → `chrome://extensions` → Mode développeur → Charger l'extension non empaquetée → sélectionnez `extension/`
3. L'assistant d'accueil s'ouvre : définissez l'adresse du serveur (`http://127.0.0.1:16801` par défaut) et testez la connexion
4. Les téléchargements du navigateur sont désormais capturés automatiquement ; clic droit sur les liens/médias pour un envoi manuel

## Optionnel : moteur de flux complet

Déposez `N_m3u8DL-RE.exe` dans `bin/` pour débloquer MSS (Smooth Streaming), le déchiffrement DRM (via CDM externe) et le téléchargement de sous-titres. `preferExternalStreamEngine` dans les paramètres contrôle la priorité du moteur.

## Structure du projet

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

## Notes de sécurité

- Le backend écoute sur `127.0.0.1` par défaut ; le RPC d'aria2 utilise un secret aléatoire (persisté dans `data/settings.json`)
- Pour un accès distant, activez `rpcListenAll` et définissez `apiToken`
- Le bundle CA d'aria2 provient des racines Mozilla intégrées de Node (écrit dans `data/cacert.pem` au démarrage)

## Licence

MIT (code du projet). Les binaires aria2c / ffmpeg / ffprobe récupérés par `tools/download-engines.mjs` sont distribués sous leurs propres licences (GPL-2.0 / GPL).
