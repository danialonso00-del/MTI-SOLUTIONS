#!/usr/bin/env node
/**
 * Descarga la geometría REAL de un trozo de ciudad desde OpenStreetMap
 * (Overpass API) y la hornea a un único archivo compacto que la web carga.
 *
 *   npm run city:fetch                 → Eixample / Sagrada Família / Glòries
 *   npm run city:fetch -- --preset=... → otra ciudad de las definidas abajo
 *
 * Salida: public/city/<preset>.json
 *   { center, size, buildings[], roads[], parks[], water[], landmarks[] }
 *
 * Coordenadas ya proyectadas a metros locales (x este, z sur) sobre el centro,
 * de modo que el navegador no hace ninguna conversión geográfica.
 *
 * Datos © colaboradores de OpenStreetMap, licencia ODbL.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/* ------------------------------------------------------------------ */
/* Zonas disponibles                                                   */
/* ------------------------------------------------------------------ */

const PRESETS = {
  // Eixample: la retícula de Cerdà con chaflanes, Sagrada Família y Torre Glòries
  barcelona: {
    label: 'Barcelona · del Camp Nou a Glòries',
    // cubre Camp Nou, Les Corts, Eixample, Sagrada Família y Glòries
    center: [41.3955, 2.1555],
    halfLat: 0.0185,
    halfLon: 0.0385,
  },
  'barcelona-mar': {
    label: 'Barcelona · Vila Olímpica y frente marítimo',
    center: [41.3888, 2.1968],
    halfLat: 0.009,
    halfLon: 0.013,
  },
  madrid: {
    label: 'Madrid · Salamanca / Castellana',
    center: [40.4302, -3.6862],
    halfLat: 0.009,
    halfLon: 0.012,
  },
  // zona mínima alrededor de la Sagrada Família: sirve para probar en equipos
  // sin GPU y para comprobar cambios rápido
  test: {
    label: 'Barcelona · prueba (Sagrada Família)',
    center: [41.4036, 2.1744],
    halfLat: 0.0016,
    halfLon: 0.0022,
  },
  paris: {
    label: 'París · Ópera',
    center: [48.8709, 2.3317],
    halfLat: 0.0075,
    halfLon: 0.011,
  },
};

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const presetName = args.preset ?? 'barcelona';
const preset = PRESETS[presetName];
if (!preset) {
  console.error(`Zona desconocida: ${presetName}. Disponibles: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}

const [lat0, lon0] = preset.center;
const bbox = [lat0 - preset.halfLat, lon0 - preset.halfLon, lat0 + preset.halfLat, lon0 + preset.halfLon];

/* ------------------------------------------------------------------ */
/* Proyección local: grados → metros                                   */
/* ------------------------------------------------------------------ */

const M_PER_DEG_LAT = 111320;
const mPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
const project = ([lat, lon]) => [
  +((lon - lon0) * mPerDegLon).toFixed(2), // x → este
  +((lat0 - lat) * M_PER_DEG_LAT).toFixed(2), // z → sur
];

/* ------------------------------------------------------------------ */
/* Consulta                                                            */
/* ------------------------------------------------------------------ */

const QUERY = `[out:json][timeout:180];
(
  way["building"](${bbox});
  relation["building"](${bbox});
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|living_street|unclassified|pedestrian)$"](${bbox});
  way["leisure"~"^(park|garden|pitch)$"](${bbox});
  way["landuse"~"^(grass|forest|recreation_ground)$"](${bbox});
  way["natural"="water"](${bbox});
  way["waterway"="riverbank"](${bbox});
);
out geom;`;

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function overpass() {
  let lastErr;
  for (const url of ENDPOINTS) {
    try {
      process.stdout.write(`  consultando ${new URL(url).host}… `);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          // Overpass rechaza el user-agent por defecto de Node con un 406
          'User-Agent': 'MTI-Solutions-Explorer/1.0 (city data baker)',
          Accept: '*/*',
        },
        body: `data=${encodeURIComponent(QUERY)}`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      console.log(`${json.elements.length} elementos`);
      return json;
    } catch (err) {
      console.log(`falló (${err.message})`);
      lastErr = err;
    }
  }
  throw lastErr;
}

/* ------------------------------------------------------------------ */
/* Altura de cada edificio                                             */
/* ------------------------------------------------------------------ */

const FLOOR = 3.1; // metros por planta

function heightOf(tags = {}) {
  const h = parseFloat(tags.height ?? tags['building:height']);
  if (Number.isFinite(h) && h > 1) return h;
  const levels = parseFloat(tags['building:levels']);
  if (Number.isFinite(levels) && levels > 0) return levels * FLOOR + 1.2;
  // sin datos: altura típica según el uso
  const type = tags.building;
  if (type === 'apartments' || type === 'residential') return 7 * FLOOR;
  if (type === 'house' || type === 'garage' || type === 'shed' || type === 'hut') return 6;
  if (type === 'retail' || type === 'commercial' || type === 'office') return 5 * FLOOR;
  if (type === 'church' || type === 'cathedral') return 28;
  if (type === 'industrial' || type === 'warehouse') return 10;
  return 6 * FLOOR;
}

const minHeightOf = (tags = {}) => {
  const m = parseFloat(tags.min_height ?? '');
  if (Number.isFinite(m)) return m;
  const l = parseFloat(tags['building:min_level'] ?? '');
  return Number.isFinite(l) ? l * FLOOR : 0;
};

const ROAD_WIDTH = {
  motorway: 22,
  trunk: 20,
  primary: 18,
  secondary: 15,
  tertiary: 12,
  residential: 9,
  living_street: 8,
  unclassified: 9,
  pedestrian: 7,
};

/* ------------------------------------------------------------------ */

const ringOf = (el) => (el.geometry ?? []).filter((p) => p).map((p) => project([p.lat, p.lon]));

/** Área con signo: sirve para descartar polígonos degenerados. */
const areaOf = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(a / 2);
};

console.log(`\n  ${preset.label}`);
console.log(`  bbox ${bbox.map((n) => n.toFixed(4)).join(', ')}\n`);

const data = await overpass();

const buildings = [];
const roads = [];
const parks = [];
const water = [];
const landmarks = [];

for (const el of data.elements) {
  const tags = el.tags ?? {};

  if (tags.building) {
    // las relaciones traen varios anillos: nos quedamos con el exterior mayor
    let rings = [];
    if (el.type === 'way') rings = [ringOf(el)];
    else if (el.members) {
      rings = el.members
        .filter((m) => m.role === 'outer' && m.geometry)
        .map((m) => m.geometry.map((p) => project([p.lat, p.lon])));
    }
    for (const ring of rings) {
      if (ring.length < 4) continue;
      const area = areaOf(ring);
      if (area < 18) continue;
      let height = heightOf(tags);
      // estadios y grandes recintos: OSM no suele traer altura y quedaban planos
      if (area > 12000 && (tags.building === 'stadium' || tags.building === 'construction' || tags.leisure === 'stadium')) {
        height = Math.max(height, 42);
      }
      const b = {
        r: ring.map(([x, z]) => [x, z]),
        h: +height.toFixed(1),
        m: +minHeightOf(tags).toFixed(1),
        t: tags.building,
      };
      if (tags.name) b.n = tags.name;
      buildings.push(b);
      if (tags.name && (area > 2500 || tags.tourism || tags.amenity === 'hospital' || tags.building === 'cathedral')) {
        const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length;
        const cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
        landmarks.push({ name: tags.name, x: +cx.toFixed(1), z: +cz.toFixed(1), h: b.h, area: Math.round(area), tags: { amenity: tags.amenity, tourism: tags.tourism, building: tags.building } });
      }
    }
    continue;
  }

  if (tags.highway) {
    const line = ringOf(el);
    if (line.length < 2) continue;
    roads.push({ p: line, w: ROAD_WIDTH[tags.highway] ?? 9, k: tags.highway, n: tags.name });
    continue;
  }

  if (tags.leisure || tags.landuse) {
    const ring = ringOf(el);
    if (ring.length > 3 && areaOf(ring) > 200) parks.push({ r: ring, k: tags.leisure ?? tags.landuse });
    continue;
  }

  if (tags.natural === 'water' || tags.waterway === 'riverbank') {
    const ring = ringOf(el);
    if (ring.length > 3) water.push({ r: ring });
  }
}

const extent = buildings.reduce(
  (acc, b) => {
    for (const [x, z] of b.r) {
      acc.minX = Math.min(acc.minX, x);
      acc.maxX = Math.max(acc.maxX, x);
      acc.minZ = Math.min(acc.minZ, z);
      acc.maxZ = Math.max(acc.maxZ, z);
    }
    return acc;
  },
  { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
);

landmarks.sort((a, b) => b.area - a.area);

const out = {
  preset: presetName,
  label: preset.label,
  attribution: 'Datos © colaboradores de OpenStreetMap (ODbL)',
  center: preset.center,
  extent,
  counts: { buildings: buildings.length, roads: roads.length, parks: parks.length, water: water.length },
  buildings,
  roads,
  parks,
  water,
  landmarks: landmarks.slice(0, 60),
};

const dir = path.join(process.cwd(), 'public', 'city');
await fs.mkdir(dir, { recursive: true });
const file = path.join(dir, `${presetName}.json`);
await fs.writeFile(file, JSON.stringify(out));

const kb = Math.round((await fs.stat(file)).size / 1024);
console.log(`  edificios: ${buildings.length}`);
console.log(`  calles:    ${roads.length}`);
console.log(`  parques:   ${parks.length}   agua: ${water.length}`);
console.log(`  extensión: ${Math.round(extent.maxX - extent.minX)} × ${Math.round(extent.maxZ - extent.minZ)} m`);
console.log(`\n  → ${path.relative(process.cwd(), file)}  (${kb} KB)\n`);
console.log('  landmarks detectados:');
for (const l of out.landmarks.slice(0, 12)) {
  console.log(`   · ${l.name} — ${l.area} m², h≈${l.h}m  @ ${l.x}, ${l.z}`);
}
