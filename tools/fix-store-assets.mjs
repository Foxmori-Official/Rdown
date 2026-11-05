// 商店截图后处理：把 .scratch/compose-raw/<locale>-shot-0N.png（浏览器截图，RGBA）// 批量合成到白底转为 24 位 RGB（商店要求无 Alpha），写入 docs/store-assets/<locale>/shot-0N.png
import zlib from 'node:zlib';

function decodePNG(buf) {
  let off = 8, w = 0, h = 0, colorType = 6;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') { w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12); colorType = buf[off + 17]; }
    else if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : 3;
  const stride = w * ch;
  const out = Buffer.alloc(h * stride);
  let pos = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    for (let x = 0; x < stride; x++) {
      const v = raw[pos++];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let recon;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = v + a; break;
        case 2: recon = v + b; break;
        case 3: recon = v + ((a + b) >> 1); break;
        case 4: { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); recon = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new Error('bad filter');
      }
      out[y * stride + x] = recon & 0xff;
    }
  }
  return { w, h, ch, data: out };
}
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t })();
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crcT[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function chunk(t, d) { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'ascii'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b }
function encodePNG(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const stride = w * 3, raw = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const LOCS = ['en','de','es','fr','ja','ko','pt_BR','zh_CN','zh_TW'];
let fail = 0;
for (const loc of LOCS) {
  fs.mkdirSync(`docs/store-assets/${loc}`, { recursive: true });
  for (let n = 1; n <= 4; n++) {
    const src = decodePNG(fs.readFileSync(`.scratch/compose-raw/${loc}-shot-0${n}.png`));
    if (src.w !== 1280 || src.h !== 800) { console.log(`FAIL ${loc}-0${n}: ${src.w}x${src.h}`); fail++; continue; }
    const rgb = Buffer.alloc(src.w * src.h * 3);
    for (let i = 0; i < src.w * src.h; i++) {
      const si = i * src.ch, o = i * 3;
      const a = src.ch === 4 ? src.data[si + 3] / 255 : 1;
      rgb[o] = Math.round(src.data[si] * a + 255 * (1 - a));
      rgb[o + 1] = Math.round(src.data[si + 1] * a + 255 * (1 - a));
      rgb[o + 2] = Math.round(src.data[si + 2] * a + 255 * (1 - a));
    }
    fs.writeFileSync(`docs/store-assets/${loc}/shot-0${n}.png`, encodePNG(src.w, src.h, rgb));
  }
}
// 终验
for (const loc of LOCS) {
  const row = [];
  for (let n = 1; n <= 4; n++) {
    const b = fs.readFileSync(`docs/store-assets/${loc}/shot-0${n}.png`);
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20), ct = b[25];
    if (w !== 1280 || h !== 800 || ct !== 2) { row.push(`shot-0${n}=BAD(${w}x${h}ct${ct})`); fail++; }
    else row.push(`shot-0${n}=OK(${Math.round(b.length / 1024)}KB)`);
  }
  console.log(loc.padEnd(6), row.join(' '));
}
console.log(fail === 0 ? 'ALL 36 PASSED' : `${fail} FAILED`);
