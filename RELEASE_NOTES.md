# Rdown · v0.0.1-alpha.1

Initial public Foxmori alpha, 2026-11-05. Extension manifest version: `0.0.1`.

## Included

- Download connector, Node backend, Vue Web UI and Electron source.
- Foxmori fox/download artwork in all required sizes.
- Empty resolved-torrent selections cannot be submitted; explicit invalid `selectFile` values are rejected before engine calls.
- Changing a URL clears stale metadata; late resolve results cannot overwrite the new URL.
- Existing scheduling, range-response, authentication and extension lifecycle fixes.

## Verification

Local extension/UI/i18n/unit checks and **54 reliability tests** passed. Production Web build and **3 static dependency budget checks** passed. Real production UI + local fake-engine browser checks verified the empty-selection warning, disabled submit, and re-enabled submit after selection.

## Install / limitations

The connector ZIP does **not** contain the backend or aria2/ffmpeg. Install dependencies and start the backend from this source; follow README for engine installation. The Web ZIP is only `web/dist`, not a desktop installer. Windows engine downloads, BT/HLS/DASH recovery, Docker/NAS and desktop installation/upgrade still need real end-to-end testing. No real download engines or remote file transfers were used in the isolated regression tests.

## Source and artwork

The repository preserves the original license and attribution. `.publication/assets.json` contains only lossless public PNG artwork; `npm install` / `npm ci` restores and verifies it locally. GitHub Actions also commits the materialized PNGs before creating the initial alpha release. Generated dependency/runtime assets and user configuration are not published.

This is a prerelease for testing, not a production-readiness claim.

## Dependency advisories

Known dependency-chain advisories remain, including legacy NAT dependencies (Rdown) and test-tool dependencies (Rtranslate). See [DEPENDENCY_STATUS.md](DEPENDENCY_STATUS.md). This alpha does not claim production security readiness.
