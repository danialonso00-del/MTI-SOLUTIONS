/**
 * Extrae y optimiza los recursos visuales de la presentación corporativa.
 *
 *   npm run deck:assets
 *
 * Lee public/MTI_GROUP_Presentation_v.01.pptx SIN modificarlo, saca los medios
 * que declara src/data/presentationAssets.js y los deja optimizados en
 * public/assets/mti-presentation/<carpeta>/<nombre-descriptivo>.webp
 *
 *   fotografías   WebP q82 a su tamaño original (tope 2560 px) + versión de
 *                 960 px para móvil y pantallas pequeñas
 *   logos         WebP sin pérdida, con transparencia, tope 900 px
 *   SVG           se copian tal cual (son vectoriales)
 *   iconos        se recolorean al dorado MTI usando su alfa como máscara, para
 *                 que los que venían en azul marino sobre tarjeta dorada
 *                 casen con el resto
 *
 * Además escribe src/data/presentationAssets.meta.json con el ancho, alto y
 * una vista previa diminuta (LQIP) de cada recurso: la aplicación reserva el
 * hueco exacto y muestra el desenfoque mientras llega la imagen buena.
 *
 * La aplicación NUNCA abre el .pptx: solo consume lo que deja este script.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PRESENTATION_ASSETS, outputExt } from '../src/data/presentationAssets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// cada recurso declara de qué presentación sale (`source`); por defecto, la corporativa
const SOURCES = {
  corporate: path.join(ROOT, 'public', 'MTI_GROUP_Presentation_v.01.pptx'),
  agentic: path.join(ROOT, 'public', 'MTi_Group_IA_Agentiva_Recort_v.01.pptx'),
};
const OUT = path.join(ROOT, 'public', 'assets', 'mti-presentation');
// fotografías descargadas aparte (npm run deck:stock)
const STOCK_DIR = path.join(ROOT, 'assets-src', 'stock');
const META = path.join(ROOT, 'src', 'data', 'presentationAssets.meta.json');
const GOLD = { r: 230, g: 168, b: 23 };

/* ------------------------------------------------------------------ */
/* Lector ZIP mínimo: un .pptx es un zip y no hace falta otra dependencia */
/* ------------------------------------------------------------------ */

function readZip(buf) {
  // fin del directorio central: firma 0x06054b50, buscando desde el final
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('No es un archivo zip válido');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Directorio central corrupto');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    entries.set(name, { method, compSize, localOff });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return {
    names: [...entries.keys()],
    read(name) {
      const e = entries.get(name);
      if (!e) return null;
      const lnl = buf.readUInt16LE(e.localOff + 26);
      const lel = buf.readUInt16LE(e.localOff + 28);
      const start = e.localOff + 30 + lnl + lel;
      const data = buf.subarray(start, start + e.compSize);
      if (e.method === 0) return Buffer.from(data);
      if (e.method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Compresión no soportada (${e.method}) en ${name}`);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Procesado por tipo                                                  */
/* ------------------------------------------------------------------ */

async function lqip(input) {
  const b = await sharp(input).resize(24, 24, { fit: 'inside' }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${b.toString('base64')}`;
}

async function processAsset(a, data) {
  const dir = path.join(OUT, a.folder);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${a.name}.${outputExt(a)}`);

  if (outputExt(a) === 'svg') {
    fs.writeFileSync(target, data);
    const m = await sharp(data).metadata();
    return { width: m.width, height: m.height, bytes: data.length };
  }

  const src = sharp(data, { failOn: 'none' }).rotate();
  const meta = await src.metadata();
  let out;

  if (a.kind === 'photo' || a.kind === 'screenshot' || (a.kind === 'graphic' && !meta.hasAlpha)) {
    /* La presentación trae muchas fotos pequeñas (440-1.000 px). En pantalla se
       ven a 500-900 px CSS, que en un portátil con pantalla de alta densidad son
       el doble de píxeles reales: si se deja escalar al navegador (bilineal)
       la foto queda blanda. Aquí se remuestrean a doble tamaño con Lanczos y un
       enfoque suave, que es lo más nítido que se puede sacar de esos píxeles
       sin inventar detalle. */
    // las descargadas ya son grandes (3.840 px): a 2.400 sobran para ir a sangre
    const target2x = a.source === 'stock' ? Math.min(2400, meta.width) : Math.min(2560, meta.width < 1600 ? meta.width * 2 : meta.width);
    const full = sharp(data)
      .rotate()
      .resize({ width: target2x, kernel: 'lanczos3' })
      .sharpen({ sigma: meta.width < 1600 ? 0.8 : 0.4, m1: 0.6, m2: 1.4 });
    // las originales muy grandes ya tienen detalle de sobra: menos calidad, mucho menos peso
    out = await full.webp({ quality: a.source === 'stock' ? 78 : meta.width > 3000 ? 80 : 90, effort: 6, smartSubsample: true }).toBuffer();
    const small = await sharp(data)
      .rotate()
      .resize({ width: Math.min(1280, meta.width * 2), kernel: 'lanczos3' })
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 86, effort: 6, smartSubsample: true })
      .toBuffer();
    fs.writeFileSync(path.join(dir, `${a.name}-960.webp`), small);
  } else if (a.kind === 'icon' && a.tint) {
    // el alfa del icono como máscara sobre un plano dorado
    const { width, height } = meta;
    const alpha = await sharp(data).ensureAlpha().extractChannel('alpha').toBuffer();
    out = await sharp({ create: { width, height, channels: 3, background: GOLD } })
      .joinChannel(alpha)
      .webp({ lossless: true })
      .toBuffer();
  } else {
    // logos, marca y gráficos con transparencia: sin pérdida
    out = await sharp(data).rotate().resize({ width: 900, withoutEnlargement: true }).webp({ lossless: true, effort: 5 }).toBuffer();
  }

  fs.writeFileSync(target, out);
  const done = await sharp(out).metadata();
  return {
    width: done.width,
    height: done.height,
    // tamaño original en la presentación: decide si una foto aguanta ir a sangre
    srcWidth: meta.width,
    bytes: out.length,
    lqip: a.kind === 'photo' || a.kind === 'screenshot' ? await lqip(out) : undefined,
  };
}

/* ------------------------------------------------------------------ */

const zips = {};
for (const [key, file] of Object.entries(SOURCES)) {
  if (!fs.existsSync(file)) {
    console.warn(`  ! no encuentro ${path.relative(ROOT, file)}: se omiten sus recursos`);
    continue;
  }
  zips[key] = readZip(fs.readFileSync(file));
}
const meta = {};
let total = 0;
const seen = new Set();

for (const a of PRESENTATION_ASSETS) {
  if (seen.has(a.id)) throw new Error(`id repetido: ${a.id}`);
  seen.add(a.id);
  let data;
  if (a.source === 'stock') {
    const f = path.join(STOCK_DIR, a.file);
    data = fs.existsSync(f) ? fs.readFileSync(f) : null;
    if (!data) {
      console.warn(`  ! falta ${path.relative(ROOT, f)}: ejecuta npm run deck:stock`);
      continue;
    }
  } else {
    const zip = zips[a.source ?? 'corporate'];
    data = zip?.read(`ppt/media/${a.media}`);
  }
  if (!data) {
    console.warn(`  ! ${a.media} no está en el .pptx «${a.source ?? 'corporate'}» (${a.id})`);
    continue;
  }
  const info = await processAsset(a, data);
  meta[a.id] = info;
  total += info.bytes;
  console.log(
    `  ${a.folder.padEnd(12)} ${`${a.name}.${outputExt(a)}`.padEnd(48)} ${String(info.width).padStart(5)}×${String(info.height).padEnd(5)} ${(info.bytes / 1024).toFixed(0).padStart(5)} KB`
  );
}

fs.writeFileSync(META, JSON.stringify(meta, null, 1) + '\n');
console.log(`\n${Object.keys(meta).length} recursos · ${(total / 1024 / 1024).toFixed(2)} MB en ${path.relative(ROOT, OUT)}`);
console.log(`metadatos → ${path.relative(ROOT, META)}`);
