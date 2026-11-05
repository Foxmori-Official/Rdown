// Rdown 引擎二进制下载器：aria2c（Motrix 定制构建，单任务 64 连接上限）+ ffmpeg/ffprobe
// 用法: node tools/download-engines.mjs
// 说明：aria2c 取自 Motrix v1.8.19 仓库内嵌二进制（GitHub Blob API）；
//      ffmpeg/ffprobe 取自 npmmirror 二进制镜像（gyan.dev 构建）。
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(ROOT, 'bin');
fs.mkdirSync(BIN, { recursive: true });

const WIN = process.platform === 'win32';
const ARIA2_BLOB = 'https://api.github.com/repos/agalwood/Motrix/git/blobs/d950831a06a7ccad96491dc3d034869c6637eda5';
const FFMPEG_BASE = 'https://registry.npmmirror.com/-/binary/ffmpeg-static/b6.1.1';

async function fetchJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'rdown-bootstrap' }, signal: AbortSignal.timeout(60000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  return r.json();
}

async function download(url, dest) {
  console.log(`  GET ${url}`);
  const r = await fetch(url, { headers: { 'User-Agent': 'rdown-bootstrap' }, signal: AbortSignal.timeout(600000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  if (!WIN) {
    console.log('非 Windows 平台：请用系统包管理器安装 aria2 与 ffmpeg（如 apt install aria2 ffmpeg），或 Docker 部署。');
    return;
  }
  const aria2 = path.join(BIN, 'aria2c.exe');
  const ffmpeg = path.join(BIN, 'ffmpeg.exe');
  const ffprobe = path.join(BIN, 'ffprobe.exe');

  if (!fs.existsSync(aria2)) {
    console.log('[1/3] 下载 aria2c.exe（Motrix v1.8.19 定制构建）…');
    const blob = await fetchJson(ARIA2_BLOB);
    fs.writeFileSync(aria2, Buffer.from(blob.content, 'base64'));
    console.log(`  ✓ aria2c.exe (${fs.statSync(aria2).size} bytes)`);
  } else console.log('  ✓ aria2c.exe 已存在');

  if (!fs.existsSync(ffmpeg)) {
    console.log('[2/3] 下载 ffmpeg.exe（gyan.dev 6.1.1，npmmirror 镜像）…');
    const gz = path.join(BIN, 'ffmpeg.exe.gz');
    await download(`${FFMPEG_BASE}/ffmpeg-win32-x64.gz`, gz);
    fs.writeFileSync(ffmpeg, zlib.gunzipSync(fs.readFileSync(gz)));
    fs.unlinkSync(gz);
    console.log(`  ✓ ffmpeg.exe (${fs.statSync(ffmpeg).size} bytes)`);
  } else console.log('  ✓ ffmpeg.exe 已存在');

  if (!fs.existsSync(ffprobe)) {
    console.log('[3/3] 下载 ffprobe.exe …');
    const gz = path.join(BIN, 'ffprobe.exe.gz');
    await download(`${FFMPEG_BASE}/ffprobe-win32-x64.gz`, gz);
    fs.writeFileSync(ffprobe, zlib.gunzipSync(fs.readFileSync(gz)));
    fs.unlinkSync(gz);
    console.log(`  ✓ ffprobe.exe (${fs.statSync(ffprobe).size} bytes)`);
  } else console.log('  ✓ ffprobe.exe 已存在');

  console.log('\n引擎就绪。可选：把 N_m3u8DL-RE.exe 放入 bin/ 解锁 MSS/DRM 完整能力。');
}

main().catch((e) => { console.error('下载失败:', e.message); process.exit(1); });
