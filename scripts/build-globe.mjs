/**
 * Hornea los datos geográficos del globo del recorrido corporativo.
 *
 *   npm run deck:globe
 *
 * Descarga una vez los países de Natural Earth a escala 1:110m (paquete
 * world-atlas, datos de dominio público) y genera public/geo/world-110m.json:
 *
 *   countries  [{ id, name, lat, lon }]    id = ISO 3166-1 numérico
 *   dots       [lat, lon, país, lat, lon, país, …]
 *              malla uniforme de puntos sobre tierra firme (espiral de
 *              Fibonacci), cada uno con el índice de su país: así se puede
 *              iluminar un país entero sin geometría extra
 *   coast      [[país, lat, lon, lat, lon, …], …] contornos, para el trazo
 *              fino y para resaltar el país seleccionado
 *
 * En ejecución la aplicación solo lee ese JSON: no depende de ninguna red.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'geo', 'world-110m.json');
const SRC = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const DOTS = 44000; // puntos sobre toda la esfera; quedan ~12.000 en tierra

const res = await fetch(SRC);
if (!res.ok) throw new Error(`No se pudo descargar ${SRC}: ${res.status}`);
const topo = await res.json();

/* --- TopoJSON → anillos de [lon, lat] ------------------------------ */
const { scale, translate } = topo.transform;
const arcs = topo.arcs.map((arc) => {
  let x = 0;
  let y = 0;
  return arc.map(([dx, dy]) => {
    x += dx;
    y += dy;
    return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
  });
});
const arcPts = (i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
const ring = (idx) => {
  const out = [];
  idx.forEach((a, k) => {
    const pts = arcPts(a);
    out.push(...(k === 0 ? pts : pts.slice(1)));
  });
  return out;
};

const countries = [];
const polys = []; // { c, rings: [outer, ...holes], bbox }
for (const g of topo.objects.countries.geometries) {
  const c = countries.length;
  const shapes = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  const rings = shapes.map((poly) => poly.map(ring));
  if (!rings.length) continue;
  // centroide aproximado: el del anillo exterior más grande
  let best = null;
  let bestLen = 0;
  for (const poly of rings) {
    const len = poly[0].length;
    if (len > bestLen) {
      bestLen = len;
      best = poly[0];
    }
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    for (const [x, y] of poly[0]) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    polys.push({ c, rings: poly, bbox: [minX, minY, maxX, maxY] });
  }
  const lon = best.reduce((s, p) => s + p[0], 0) / best.length;
  const lat = best.reduce((s, p) => s + p[1], 0) / best.length;
  countries.push({ id: g.id ?? null, name: g.properties?.name ?? '', lat: +lat.toFixed(2), lon: +lon.toFixed(2), rings });
}

/* --- punto en polígono (regla par-impar, en grados) ---------------- */
function inRing(x, y, r) {
  let inside = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i];
    const [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function countryAt(lon, lat) {
  for (const p of polys) {
    const [a, b, c, d] = p.bbox;
    if (lon < a || lon > c || lat < b || lat > d) continue;
    if (!inRing(lon, lat, p.rings[0])) continue;
    if (p.rings.slice(1).some((h) => inRing(lon, lat, h))) continue;
    return p.c;
  }
  return -1;
}

/* --- malla de puntos sobre tierra ---------------------------------- */
const dots = [];
const golden = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < DOTS; i++) {
  const y = 1 - (i / (DOTS - 1)) * 2;
  const th = golden * i;
  const lat = (Math.asin(y) * 180) / Math.PI;
  let lon = ((th * 180) / Math.PI) % 360;
  if (lon > 180) lon -= 360;
  if (lat < -60) continue; // la Antártida solo ensucia la lectura
  const c = countryAt(lon, lat);
  if (c >= 0) dots.push(+lat.toFixed(2), +lon.toFixed(2), c);
}

/* --- contornos (reducidos: uno de cada dos vértices) --------------- */
const coast = [];
countries.forEach((c, ci) => {
  for (const poly of c.rings) {
    const r = poly[0];
    if (r.length < 4) continue;
    const flat = [ci];
    for (let k = 0; k < r.length; k += 2) flat.push(+r[k][1].toFixed(2), +r[k][0].toFixed(2));
    flat.push(+r[0][1].toFixed(2), +r[0][0].toFixed(2));
    coast.push(flat);
  }
});

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify({
    source: 'Natural Earth 1:110m vía world-atlas@2.0.2 · dominio público',
    countries: countries.map(({ id, name, lat, lon }) => ({ id, name, lat, lon })),
    dots,
    coast,
  })
);
const kb = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(`${countries.length} países · ${dots.length / 3} puntos de tierra · ${coast.length} contornos → ${path.relative(ROOT, OUT)} (${kb} KB)`);
