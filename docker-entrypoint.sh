#!/bin/sh
# aria2-kimi container entrypoint: pre-flight directory checks, then exec the server.
set -eu

DL="${DOWNLOAD_DIR:-/downloads}"
DT="${DATA_DIR:-/data}"
UID_NOW="$(id -u)"

fail() {
  echo "[entrypoint] ERROR: $1" >&2
  echo "[entrypoint] Hint: on the host run  chown -R $UID_NOW:$UID_NOW <host-dir>  (container user 'kimi' has uid $UID_NOW)," >&2
  echo "               or fix the volume mount so the directory is writable." >&2
  exit 1
}

for d in "$DL" "$DT"; do
  mkdir -p "$d" 2>/dev/null || fail "cannot create directory $d"
  # real writability test (-w alone can lie on some NAS bind mounts)
  if ! (touch "$d/.kimi-write-test" 2>/dev/null && rm -f "$d/.kimi-write-test"); then
    fail "directory $d is not writable by uid $UID_NOW (kimi)"
  fi
done

echo "[entrypoint] ok: DATA_DIR=$DT DOWNLOAD_DIR=$DL KIMI_HOST=${KIMI_HOST:-0.0.0.0} KIMI_PORT=${KIMI_PORT:-16801}"

exec node /app/server/src/index.js
