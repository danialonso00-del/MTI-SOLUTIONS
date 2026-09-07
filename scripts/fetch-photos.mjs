#!/usr/bin/env node
/**
 * Descarga las fotos reales que ilustran los paneles de las escenas.
 *
 * Fuente: Wikimedia Commons, quedándose solo con licencias reutilizables
 * (CC0 / CC BY / CC BY-SA / dominio público). Guarda también la atribución,
 * que es obligatoria en CC BY y CC BY-SA.
 *
 *   npm run city:photos
 *
 * Salida: public/photos/<clave>.jpg + public/photos/credits.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const WANTED = [
  { key: 'bus', query: 'TMB autobus Barcelona', hint: /tmb|autob|bus/i },
  { key: 'waste-truck', query: 'refuse collection vehicle city', hint: /refuse|garbage|waste|truck/i },
  { key: 'cctv', query: 'surveillance camera street pole', hint: /camera/i },
  { key: 'traffic', query: 'Avinguda Diagonal Barcelona', hint: /diagonal|barcelona/i },
  { key: 'stadium', query: 'Camp Nou stadium Barcelona', hint: /camp nou|stadium/i },
  { key: 'control-room', query: 'control room monitors operator', hint: /control ?room|leitstelle|sala de control/i },
  { key: 'streetlight', query: 'street lamp LED illumination city night', hint: /lamp|light/i },
  { key: 'factory', query: 'industrial robot assembly line factory', hint: /robot|assembly|factory/i },
  { key: 'hospital', query: 'hospital corridor modern', hint: /hospital/i },
  { key: 'containers', query: 'waste containers recycling street', hint: /container|recycl/i },
  { key: 'water', query: 'water meter', hint: /water.?meter|wasserz|contador de agua/i },
  { key: 'building', query: 'modern office building facade glass', hint: /office|building/i },
  { key: 'crane', query: 'tower crane construction site', hint: /crane|kran|gr.a/i },
  { key: 'air', query: 'air quality monitoring station street', hint: /air quality|monitoring/i },
  { key: 'slope', query: 'landslide slope monitoring', hint: /slope|landslide|erdrutsch|talud/i },
  { key: 'flood', query: 'river flood bridge high water', hint: /flood|river|hochwasser|inundaci/i },
];

const OK_LICENSE = /^(cc0|cc by|cc-by|public domain|pd)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Commons corta el grifo (429) si se le piden diez cosas seguidas: se espera y
// se reintenta en vez de dejar la foto sin descargar
const api = async (params, intento = 0) => {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MTI-Solutions-Explorer/1.0 (demo)' } });
  if (res.status === 429 && intento < 3) {
    await sleep(4000 * (intento + 1));
    return api(params, intento + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const outDir = path.join(process.cwd(), 'public', 'photos');
await fs.mkdir(outDir, { recursive: true });

// si solo se piden algunas fotos, se conservan los créditos de las demás
let credits = [];
try {
  const previos = JSON.parse(await fs.readFile(path.join(outDir, 'credits.json'), 'utf8'));
  if (Array.isArray(previos)) credits = previos;
} catch {
  // primera ejecución: no hay créditos previos
}

// se puede pedir solo una foto: `node scripts/fetch-photos.mjs water`
const soloEstas = process.argv.slice(2);
const lista = soloEstas.length ? WANTED.filter((w) => soloEstas.includes(w.key)) : WANTED;

for (const want of lista) {
  process.stdout.write(`  ${want.key.padEnd(14)} `);
  await sleep(700); // respirar entre peticiones
  try {
    const data = await api({
      action: 'query',
      generator: 'search',
      gsrsearch: want.query,
      gsrnamespace: '6',
      gsrlimit: '12',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime',
      iiurlwidth: '1200',
    });

    const pages = Object.values(data.query?.pages ?? []);
    const candidate = pages
      .map((p) => ({ page: p, ii: p.imageinfo?.[0] }))
      .filter(({ ii }) => ii && /jpeg|png/.test(ii.mime ?? ''))
      .filter(({ ii }) => OK_LICENSE.test(ii.extmetadata?.LicenseShortName?.value ?? ''))
      .sort((a, b) => {
        const score = ({ page }) => (want.hint.test(page.title) ? 0 : 1);
        return score(a) - score(b);
      })[0];

    if (!candidate) {
      console.log('sin resultados con licencia reutilizable');
      continue;
    }

    const { page, ii } = candidate;
    const img = await fetch(ii.thumburl ?? ii.url, {
      headers: { 'User-Agent': 'MTI-Solutions-Explorer/1.0 (demo)' },
    });
    const buf = Buffer.from(await img.arrayBuffer());
    await fs.writeFile(path.join(outDir, `${want.key}.jpg`), buf);

    const strip = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    credits = credits.filter((c) => c.key !== want.key);
    credits.push({
      key: want.key,
      title: page.title.replace('File:', ''),
      author: strip(ii.extmetadata?.Artist?.value) || 'desconocido',
      license: ii.extmetadata?.LicenseShortName?.value ?? '?',
      source: ii.descriptionurl,
    });
    console.log(`${Math.round(buf.length / 1024)} KB · ${credits.at(-1).license}`);
  } catch (err) {
    console.log(`error: ${err.message}`);
  }
}

await fs.writeFile(path.join(outDir, 'credits.json'), JSON.stringify(credits, null, 2));
console.log(`\n  ${credits.length} fotos → public/photos/\n`);
for (const c of credits) console.log(`   · ${c.key}: ${c.title} — ${c.author} (${c.license})`);
