#!/usr/bin/env node
/**
 * Descarga la ORTOFOTO real de la zona desde el servicio WMS abierto del
 * Institut Cartogràfic i Geològic de Catalunya (ICGC) y la trocea en una
 * rejilla de imágenes que la web usa como suelo y como cubiertas de edificio.
 *
 *   npm run city:ortho                    → zona 'barcelona'
 *   npm run city:ortho -- --preset=test   → otra zona ya descargada
 *
 * Requiere haber ejecutado antes `npm run city:fetch`, porque toma la extensión
 * y el centro del JSON de la ciudad.
 *
 * Salida: public/city/<preset>-ortho/tile-<col>-<row>.jpg + ortho.json
 *
 * Ortofoto © Institut Cartogràfic i Geològic de Catalunya, licencia CC BY 4.0.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const WMS = 'https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms';
const LAYER = 'ortofoto_color_vigent';
const TILE_PX = 2048;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const preset = args.preset ?? 'barcelona';
const detail = Boolean(args.detail); // rejilla de detalle para la zona central
const cols = Number(args.cols ?? (detail ? 3 : 5));
const rows = Number(args.rows ?? 3);
const pad = Number(args.pad ?? 1.18); // margen alrededor de la ciudad
// lado del cuadrado central que se descarga a máxima resolución, en metros
const detailSpan = Number(args.span ?? 1500);

const cityFile = path.join(process.cwd(), 'public', 'city', `${preset}.json`);
const city = JSON.parse(await fs.readFile(cityFile, 'utf8'));
const [lat0, lon0] = city.center;
const M_LAT = 111320;
const M_LON = 111320 * Math.cos((lat0 * Math.PI) / 180);

// extensión de la ciudad, centrada y con margen
const cx = (city.extent.minX + city.extent.maxX) / 2;
const cz = (city.extent.minZ + city.extent.maxZ) / 2;
const halfW = ((city.extent.maxX - city.extent.minX) / 2) * pad;
const halfH = ((city.extent.maxZ - city.extent.minZ) / 2) * pad;

// la capa de detalle cubre solo el centro de operaciones, a mucha más
// resolución: es donde se acerca la cámara en las escenas
const focusX = args.x !== undefined ? Number(args.x) : cx;
const focusZ = args.z !== undefined ? Number(args.z) : cz;

const world = detail
  ? {
      minX: focusX - detailSpan / 2,
      maxX: focusX + detailSpan / 2,
      minZ: focusZ - detailSpan / 2,
      maxZ: focusZ + detailSpan / 2,
    }
  : {
      minX: cx - halfW,
      maxX: cx + halfW,
      minZ: cz - halfH,
      maxZ: cz + halfH,
    };

const toLat = (z) => lat0 - z / M_LAT;
const toLon = (x) => lon0 + x / M_LON;

console.log(`\n  ${city.label}`);
console.log(`  zona: ${Math.round(world.maxX - world.minX)} × ${Math.round(world.maxZ - world.minZ)} m`);
console.log(`  rejilla: ${cols} × ${rows} teselas de ${TILE_PX}px\n`);

const outDir = path.join(process.cwd(), 'public', 'city', `${preset}-ortho${detail ? '-detail' : ''}`);
await fs.mkdir(outDir, { recursive: true });

const tileW = (world.maxX - world.minX) / cols;
const tileH = (world.maxZ - world.minZ) / rows;
const tiles = [];
let bytes = 0;

for (let row = 0; row < rows; row++) {
  for (let col = 0; col < cols; col++) {
    const minX = world.minX + col * tileW;
    const maxX = minX + tileW;
    const minZ = world.minZ + row * tileH;
    const maxZ = minZ + tileH;

    // ojo: Z crece hacia el sur, así que la latitud mínima corresponde a maxZ
    const bbox = [toLon(minX), toLat(maxZ), toLon(maxX), toLat(minZ)];
    const url =
      `${WMS}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${LAYER}&STYLES=` +
      `&SRS=EPSG:4326&BBOX=${bbox.join(',')}&WIDTH=${TILE_PX}&HEIGHT=${TILE_PX}&FORMAT=image/jpeg`;

    process.stdout.write(`  tesela ${col},${row}… `);
    const res = await fetch(url, { headers: { 'User-Agent': 'MTI-Solutions-Explorer/1.0' } });
    if (!res.ok) {
      console.log(`error HTTP ${res.status}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) {
      console.log('respuesta no válida (¿el servicio devolvió un error?)');
      continue;
    }
    const name = `tile-${col}-${row}.jpg`;
    await fs.writeFile(path.join(outDir, name), buf);
    bytes += buf.length;
    tiles.push({ file: `${preset}-ortho${detail ? '-detail' : ''}/${name}`, col, row, minX, maxX, minZ, maxZ });
    console.log(`${Math.round(buf.length / 1024)} KB`);
  }
}

const manifest = {
  preset,
  detail,
  layer: LAYER,
  attribution: 'Ortofoto © Institut Cartogràfic i Geològic de Catalunya (CC BY 4.0)',
  world,
  cols,
  rows,
  tilePx: TILE_PX,
  metersPerPixel: +(tileW / TILE_PX).toFixed(2),
  tiles,
};
await fs.writeFile(path.join(outDir, 'ortho.json'), JSON.stringify(manifest, null, 2));

console.log(`\n  ${tiles.length} teselas · ${Math.round(bytes / 1024 / 1024)} MB · ${manifest.metersPerPixel} m/píxel`);
console.log(`  → public/city/${preset}-ortho/\n`);
