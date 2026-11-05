import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { loadSettings, ARIA2_RPC_PORT, API_PORT, API_HOST, DATA_DIR } from './config.js';
import { Aria2Engine } from './aria2/engine.js';
import { Aria2Rpc } from './aria2/rpc.js';
import { TaskStore } from './tasks/store.js';
import { StreamManager } from './stream/index.js';
import { ApiServer } from './api/server.js';
import { UpnpManager } from './upnp/index.js';
import { TaskScheduler } from './tasks/scheduler.js';
import { HookRunner } from './hooks/index.js';
import { SpeedHistory } from './stats/history.js';
import { sleep } from './util/helpers.js';

/** Kill leftover aria2c processes from a previous crashed run (Motrix lesson). */
function killStaleEngines(port) {
  if (process.platform !== 'win32') return;
  try {
    const out = execSync('wmic process where "name=\'aria2c.exe\'" get ProcessId,CommandLine /format:csv', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    for (const line of out.split('\n')) {
      if (line.includes(`rpc-listen-port=${port}`)) {
        const pid = line.trim().split(',').pop();
        if (pid && /^\d+$/.test(pid)) {
          try { process.kill(Number(pid)); } catch {}
          console.log(`[boot] killed stale aria2c pid=${pid}`);
        }
      }
    }
  } catch {}
}

async function waitForAria2(rpc, tries = 30) {
  for (let i = 0; i < tries; i++) {
    try { const v = await rpc.getVersion(); return v; } catch { await sleep(300); }
  }
  throw new Error('aria2 did not become ready in time');
}

async function main() {
  console.log('[boot] rdown server starting...');
  const _earlySettings = loadSettings();
  killStaleEngines(_earlySettings.rpcPort || ARIA2_RPC_PORT);

  // aria2's OpenSSL build cannot read the Windows CA store - feed it Node's
  // bundled Mozilla roots instead.
  const tls = await import('node:tls');
  const caFile = path.join(DATA_DIR, 'cacert.pem');
  fs.writeFileSync(caFile, tls.rootCertificates.join('\n') + '\n');

  const settings = loadSettings();
  const store = new TaskStore();
  const engine = new Aria2Engine(settings);
  const rpc = new Aria2Rpc(settings.rpcSecret, settings.rpcPort || ARIA2_RPC_PORT);
  const stream = new StreamManager(store, settings);
  const upnp = new UpnpManager(settings);
  const scheduler = new TaskScheduler(rpc, stream, store);
  const hooks = new HookRunner(settings);
  const speedHistory = new SpeedHistory();

  engine.start();
  rpc.connect();
  const version = await waitForAria2(rpc);
  console.log(`[boot] aria2 ready, version ${version.version}`);
  upnp.apply(settings).catch(() => {});

  // auto-update trackers on boot when enabled and list is empty
  if (settings.btTrackerAutoUpdate && !settings.btTracker) {
    setTimeout(async () => {
      try {
        const { fetchTrackerList } = await import('./util/trackers.js');
        const { trackers, count, source } = await fetchTrackerList(settings.btTrackerSource);
        settings.btTracker = trackers;
        const { saveSettings } = await import('./config.js');
        saveSettings(settings);
        rpc.changeGlobalOption({ 'bt-tracker': trackers }).catch(() => {});
        console.log(`[boot] tracker list updated (${count} trackers from ${source})`);
      } catch (e) { console.log('[boot] tracker auto-update failed:', e.message); }
    }, 3000);
  }

  const api = new ApiServer({ engine, rpc, store, stream, settings, upnp, scheduler, hooks, speedHistory });
  await api.listen();
  // Stream error listeners must be registered before restoring scheduled jobs.
  scheduler.start().catch(e => console.error('[scheduler] restore failed:', e.message));

  const shutdown = async () => {
    console.log('\n[boot] shutting down...');
    clearInterval(api._poll);
    try { scheduler.stop(); } catch {}
    try { await stream.shutdown(); } catch {}
    try { await rpc.saveSession(); } catch {}
    rpc.close();
    try { await upnp.destroy(); } catch {}
    await engine.stop();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  console.log(`[boot] done. Web UI & API: http://${API_HOST}:${API_PORT}`);
}

main().catch((e) => { console.error('[boot] fatal:', e); process.exit(1); });
