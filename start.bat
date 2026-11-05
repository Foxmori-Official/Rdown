@echo off
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
if not exist web\dist (
  echo [setup] building web ui...
  call npm --prefix web run build
)
start "" http://127.0.0.1:16801
node server\src\index.js
