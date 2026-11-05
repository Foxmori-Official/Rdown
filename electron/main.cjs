// Rdown - Electron main process (CommonJS)
// Spawns the Node backend (server/src/index.js), hosts the Web UI in a
// BrowserWindow, provides tray / auto-launch / magnet+torrent protocol glue.
const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');

const APP_HOST = '127.0.0.1';
const APP_PORT = 16801;
const APP_URL = `http://${APP_HOST}:${APP_PORT}`;
const HEALTH_URL = `${APP_URL}/api/v1/health`;
const TASKS_URL = `${APP_URL}/api/v1/tasks`;
const HEALTH_TIMEOUT_MS = 15000;

const isDev = !app.isPackaged;

let mainWindow = null;
let tray = null;
let serverProc = null;
let isQuitting = false;
// Minimize-to-tray on close (could later be exposed as a settings toggle).
let minimizeToTray = true;

function logoPath() {
  return path.join(app.getAppPath(), 'web', 'public', 'logo.png');
}

// ---------------------------------------------------------------------------
// Backend server child process
// ---------------------------------------------------------------------------
function spawnServer() {
  const appPath = app.getAppPath();
  const entry = path.join(appPath, 'server', 'src', 'index.js');
  // In packaged builds the server lives under resources/app (extraResources).
  const cwd = appPath;
  const env = Object.assign({}, process.env, {
    NODE_ENV: isDev ? 'dev' : 'production',
    KIMI_ELECTRON: '1'
  });
  // Use the same Node runtime that ships with Electron to avoid requiring a
  // system Node install in production: spawn electron itself with
  // ELECTRON_RUN_AS_NODE=1.
  const runner = isDev ? process.execPath : process.execPath;
  env.ELECTRON_RUN_AS_NODE = '1';

  serverProc = spawn(runner, [entry], {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true
  });
  serverProc.stdout.on('data', (d) => console.log('[server]', String(d).trimEnd()));
  serverProc.stderr.on('data', (d) => console.error('[server!]', String(d).trimEnd()));
  serverProc.on('exit', (code, signal) => {
    console.log(`[server] exited code=${code} signal=${signal}`);
    serverProc = null;
    if (!isQuitting) {
      // Backend died unexpectedly: quit the shell rather than show a dead UI.
      app.quit();
    }
  });
}

function killServer() {
  if (!serverProc) return;
  try {
    serverProc.kill();
  } catch (_) { /* ignore */ }
  serverProc = null;
}

// Wait until the backend health endpoint answers, up to HEALTH_TIMEOUT_MS.
function waitForServer(timeoutMs = HEALTH_TIMEOUT_MS) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(HEALTH_URL, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve();
        retry();
      });
      req.on('error', retry);
      req.setTimeout(1000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('server health check timed out'));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

// ---------------------------------------------------------------------------
// Forward magnet links / torrent files to the backend
// ---------------------------------------------------------------------------
function postTask(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(TASKS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      res.resume();
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('post task timeout')));
    req.write(data);
    req.end();
  });
}

function handleMagnet(url) {
  if (!/^magnet:\?/i.test(url)) return;
  console.log('[protocol] magnet:', url.slice(0, 80));
  postTask({ url }).catch((e) => console.error('[protocol] post magnet failed:', e.message));
  showMainWindow();
}

function handleTorrentFile(filePath) {
  if (!/\.torrent$/i.test(filePath)) return;
  fs.readFile(filePath, (err, buf) => {
    if (err) return console.error('[torrent] read failed:', err.message);
    console.log('[torrent] file:', filePath);
    postTask({ torrentBase64: buf.toString('base64') })
      .catch((e) => console.error('[torrent] post failed:', e.message));
    showMainWindow();
  });
}

// Extract magnet links / .torrent paths from a command-line arg list.
function handleArgv(argv) {
  for (const arg of argv || []) {
    if (/^magnet:\?/i.test(arg)) handleMagnet(arg);
    else if (/\.torrent$/i.test(arg) && fs.existsSync(arg)) handleTorrentFile(arg);
  }
}

// ---------------------------------------------------------------------------
// Window + tray
// ---------------------------------------------------------------------------
function createMainWindow() {
  if (mainWindow) return mainWindow;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Rdown',
    backgroundColor: '#f7f9fa',
    icon: logoPath(),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting && minimizeToTray) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });

  // Open external links in the system browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(APP_URL);
  return mainWindow;
}

function showMainWindow() {
  if (!mainWindow) return createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createTray() {
  tray = new Tray(logoPath());
  tray.setToolTip('Rdown');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '显示主窗口', click: showMainWindow },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]));
  tray.on('click', showMainWindow);
}

// ---------------------------------------------------------------------------
// IPC: login item (auto-launch) settings
// ---------------------------------------------------------------------------
ipcMain.handle('get-login-item', () => {
  const s = app.getLoginItemSettings();
  return { openAtLogin: s.openAtLogin };
});

ipcMain.handle('set-login-item', (_e, openAtLogin) => {
  app.setLoginItemSettings({ openAtLogin: !!openAtLogin });
  return { openAtLogin: !!openAtLogin };
});

// ---------------------------------------------------------------------------
// Single instance + lifecycle
// ---------------------------------------------------------------------------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_e, argv) => {
    showMainWindow();
    handleArgv(argv);
  });

  // macOS open-url (harmless no-op on Windows, but keep parity).
  app.on('open-url', (e, url) => {
    e.preventDefault();
    handleMagnet(url);
  });

  app.whenReady().then(async () => {
    app.setAsDefaultProtocolClient('magnet');

    spawnServer();
    try {
      await waitForServer();
    } catch (e) {
      console.error('[main] backend not ready:', e.message);
      // Still open the window; the UI can surface the error state.
    }

    createMainWindow();
    createTray();

    // magnet: / .torrent passed at first launch.
    handleArgv(process.argv.slice(isDev ? 2 : 1));

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on('window-all-closed', () => {
    // Stay alive in tray; explicit quit happens via tray menu.
    if (process.platform === 'darwin' && !isQuitting) return;
    if (isQuitting) app.quit();
  });

  app.on('before-quit', () => {
    isQuitting = true;
    killServer();
  });
}
