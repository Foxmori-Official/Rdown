// Logo 处理管线：解码 PNG → 圆角 alpha 蒙版（4x 超采样抗锯齿）→ 双线性缩放到各尺寸 → 编码 PNG
// 用法: node tools/make-logo.mjs <src.png>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2] || path.join(ROOT, '.scratch', 'logo-src.png');

// ---------- PNG 解码 ----------
function decodePNG(buf) {
  if (!buf.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('not a png');
  let off = 8, w = 0, h = 0, bitDepth = 8, colorType = 6;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12);
      bitDepth = buf[off + 16]; colorType = buf[off + 17];
      if (bitDepth !== 8 || colorType !== 6) throw new Error(`unsupported png: bitDepth=${bitDepth} colorType=${colorType} (need 8-bit RGBA)`);
    } else if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++];
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let recon;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = v + a; break;
        case 2: recon = v + b; break;
        case 3: recon = v + ((a + b) >> 1); break;
        case 4: {
          const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
          recon = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default: throw new Error('bad filter ' + filter);
      }
      out[y * stride + x] = recon & 0xff;
    }
  }
  return { w, h, data: out };
}

// ---------- PNG 编码 ----------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const b = Buffer.alloc(12 + data.length);
  b.writeUInt32BE(data.length, 0);
  b.write(type, 4, 'ascii');
  data.copy(b, 8);
  b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
  return b;
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- 圆角蒙版（4x 超采样抗锯齿；premultiply 采样避免白边） ----------
function roundedMask(size, radiusFrac) {
  const r = size * radiusFrac;
  const mask = new Float32Array(size * size);
  const SS = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let covered = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
          // 圆角矩形 SDF
          const qx = Math.max(Math.abs(px - size / 2) - (size / 2 - r), 0);
          const qy = Math.max(Math.abs(py - size / 2) - (size / 2 - r), 0);
          if (Math.hypot(qx, qy) <= r) covered++;
        }
      }
      mask[y * size + x] = covered / (SS * SS);
    }
  }
  return mask;
}

// ---------- 双线性缩放（premultiplied alpha 防白边） ----------
function resizeBilinear(src, size) {
  const { w, h, data } = src;
  const out = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    const gy = (y + 0.5) * h / size - 0.5;
    const y0 = Math.max(0, Math.floor(gy)), y1 = Math.min(h - 1, y0 + 1);
    const fy = gy - y0;
    for (let x = 0; x < size; x++) {
      const gx = (x + 0.5) * w / size - 0.5;
      const x0 = Math.max(0, Math.floor(gx)), x1 = Math.min(w - 1, x0 + 1);
      const fx = gx - x0;
      const acc = [0, 0, 0, 0];
      for (const [yy, wy] of [[y0, 1 - fy], [y1, fy]]) {
        for (const [xx, wx] of [[x0, 1 - fx], [x1, fx]]) {
          const i = (yy * w + xx) * 4, a = data[i + 3] / 255, wgt = wx * wy;
          acc[0] += data[i] * a * wgt; acc[1] += data[i + 1] * a * wgt;
          acc[2] += data[i + 2] * a * wgt; acc[3] += a * wgt;
        }
      }
      const o = (y * size + x) * 4;
      const a = acc[3];
      if (a > 0) { out[o] = acc[0] / a; out[o + 1] = acc[1] / a; out[o + 2] = acc[2] / a; }
      out[o + 3] = a * 255;
    }
  }
  return out;
}

function applyMask(data, size, mask) {
  const out = Buffer.from(data);
  for (let i = 0; i < size * size; i++) out[i * 4 + 3] = Math.round(out[i * 4 + 3] * mask[i]);
  return out;
}

// ---------- 主流程 ----------
const src = decodePNG(fs.readFileSync(SRC));
console.log(`source: ${src.w}x${src.h}`);

const RADIUS_FRAC = 0.22; // 圆角半径（边长比例，接近 iOS 应用图标观感）
const TARGETS = [
  { size: 512, out: path.join(ROOT, 'web', 'public', 'logo.png') },
  { size: 64,  out: path.join(ROOT, 'web', 'public', 'favicon.png') },
  { size: 128, out: path.join(ROOT, 'extension', 'icons', 'icon128.png') },
  { size: 48,  out: path.join(ROOT, 'extension', 'icons', 'icon48.png') },
  { size: 16,  out: path.join(ROOT, 'extension', 'icons', 'icon16.png') },
  { size: 256, out: path.join(ROOT, 'extension', 'store', 'icon256.png') },
];

for (const t of TARGETS) {
  const mask = roundedMask(t.size, RADIUS_FRAC);
  const scaled = resizeBilinear(src, t.size);
  const out = applyMask(scaled, t.size, mask);
  fs.mkdirSync(path.dirname(t.out), { recursive: true });
  fs.writeFileSync(t.out, encodePNG(t.size, t.size, out));
  console.log(`wrote ${t.out} (${t.size}x${t.size})`);
}
