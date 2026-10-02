/**
 * Descarga las fotografías de src/data/stockPhotos.js (Wikimedia Commons).
 *
 *   npm run deck:stock
 *
 * Se guardan a 3.200 px de ancho en assets-src/stock/<nombre>.jpg, fuera de
 * public/: son originales de trabajo. `npm run deck:assets` las optimiza
 * después (WebP, versión de 960 px y vista previa) como al resto.
 * Solo descarga las que faltan.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STOCK_PHOTOS } from '../src/data/stockPhotos.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'assets-src', 'stock');
const UA = { 'User-Agent': 'MTI-Solutions-Explorer/1.0 (deck photo fetch)' };
const WIDTH = 3200;

fs.mkdirSync(DIR, { recursive: true });

for (const s of STOCK_PHOTOS) {
  const file = path.join(DIR, `${s.name}.jpg`);
  if (fs.existsSync(file)) {
    console.log(`  = ${s.name}`);
    continue;
  }
  const base = decodeURIComponent(s.url.split('?')[0].split('/').pop());
  const url = `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${encodeURIComponent(base)}&width=${WIDTH}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) {
    console.warn(`  ! ${s.name}: HTTP ${res.status}`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  console.log(`  + ${s.name} (${(buf.length / 1024 / 1024).toFixed(1)} MB)`);
  await new Promise((r) => setTimeout(r, 800));
}
