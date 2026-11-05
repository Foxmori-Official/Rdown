// Lossless source images for MCP text-only bootstrap. No credentials or remote downloads.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const images = JSON.parse(fs.readFileSync(new URL('./assets.json', import.meta.url), 'utf8'));
for (const [relative, asset] of Object.entries(images)) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) || !target.endsWith('.png')) throw new Error('Invalid asset path');
  const bytes = Buffer.from(asset.base64, 'base64');
  if (createHash('sha256').update(bytes).digest('hex') !== asset.sha256) throw new Error('Invalid image checksum');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(bytes)) fs.writeFileSync(target, bytes);
}
console.log(`Verified ${Object.keys(images).length} local image assets.`);
