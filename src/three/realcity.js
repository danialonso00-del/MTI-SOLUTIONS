import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { instancedFromModel } from './assets.js';
import { makeFacadeTextures, makeUVGenerator } from './facades.js';
import { createStyleSwitch } from './citystyles.js';

/**
 * Ciudad REAL de Barcelona.
 *
 *  · geometría: huellas y alturas reales de OpenStreetMap
 *  · suelo: ortofoto aérea real del ICGC (calles, plazas, árboles, patios…)
 *  · cubiertas: la misma ortofoto proyectada sobre cada tejado
 *  · fachadas: módulo de fachada con las proporciones del Eixample
 *
 * Coordenadas: metros locales, X al este y Z al sur, origen en el centro de la
 * zona descargada. Es el mismo sistema que usan los hotspots y las escenas.
 *
 * Datos © OpenStreetMap (ODbL) · Ortofoto © ICGC (CC BY 4.0)
 */

/**
 * Da volumen a un edificio sin coste de render: pinta en los vértices
 *  · el sombreado según a dónde mira cada fachada (la que da al sol, más clara)
 *  · una cornisa oscura en el remate, que separa el tejado de la fachada
 *  · oclusión en el arranque, que asienta el edificio en la calle
 * Es lo que hace que la ciudad se lea en 3D y no como una foto plana.
 */
function shadeVolume(geometry, height) {
  const pos = geometry.attributes.position;
  const nor = geometry.attributes.normal;
  if (!pos || !nor) return geometry;

  const colors = new Float32Array(pos.count * 3);
  // dirección del sol en planta, la misma que usa la luz direccional
  const sunX = 0.62;
  const sunZ = -0.48;

  for (let i = 0; i < pos.count; i++) {
    const ny = nor.getY(i);
    let shade = 1;

    if (ny < 0.6) {
      // fachada: más luz si mira al sol, menos si queda a contraluz
      const d = nor.getX(i) * sunX + nor.getZ(i) * sunZ;
      shade = 0.84 + Math.max(d, -1) * 0.16;

      const y = pos.getY(i);
      // cornisa: banda algo más oscura en el remate
      if (height - y < 1.6) shade *= 0.82;
      // oclusión de contacto con la acera
      if (y < 3) shade *= 0.86 + (y / 3) * 0.14;
    }

    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geometry;
}

/**
 * Extrae un grupo de una geometría no indexada como geometría independiente.
 *
 * Hace falta porque `mergeGeometries(..., true)` NO conserva el índice de
 * material original: asigna uno por geometría de entrada. Con 30.000 edificios
 * eso genera 30.000 grupos y solo se dibujan los dos primeros. Separando
 * cubiertas y fachadas antes de fusionar, cada malla lleva un único material.
 */
function sliceGroup(geometry, group) {
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const attr = geometry.attributes[name];
    if (!attr) continue;
    const from = group.start * attr.itemSize;
    const to = (group.start + group.count) * attr.itemSize;
    out.setAttribute(name, new THREE.BufferAttribute(attr.array.slice(from, to), attr.itemSize));
  }
  return out;
}

/** Cinta a lo largo de una polilínea: calles y aceras dibujadas. */
function ribbon(points, width, y) {
  const half = width / 2;
  const pos = [];
  const idx = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, points.length - 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    pos.push(points[i][0] - dz * half, y, points[i][1] + dx * half);
    pos.push(points[i][0] + dz * half, y, points[i][1] - dx * half);
  }
  for (let i = 0; i < points.length - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Polígono (x, z) → Shape. Se invierte Z para compensar el giro posterior. */
function ringToShape(ring) {
  const shape = new THREE.Shape();
  shape.moveTo(ring[0][0], -ring[0][1]);
  for (let i = 1; i < ring.length; i++) shape.lineTo(ring[i][0], -ring[i][1]);
  shape.closePath();
  return shape;
}

/* ------------------------------------------------------------------ */
/* Red viaria: grafo real para el tráfico                              */
/* ------------------------------------------------------------------ */

export function buildRoadNetwork(roads) {
  const segments = [];
  const nodes = new Map();
  const key = (p) => `${Math.round(p[0])},${Math.round(p[1])}`;

  for (const road of roads.filter((r) => r.k !== 'pedestrian')) {
    for (let i = 0; i < road.p.length - 1; i++) {
      const a = road.p[i];
      const b = road.p[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 1) continue;
      const index = segments.length;
      segments.push({ a, b, len, w: road.w, k: road.k });
      for (const [p, end] of [
        [a, 0],
        [b, 1],
      ]) {
        const k = key(p);
        if (!nodes.has(k)) nodes.set(k, []);
        nodes.get(k).push({ index, end });
      }
    }
  }
  return { segments, nodes, key };
}

/* ------------------------------------------------------------------ */
/* Carga de datos                                                      */
/* ------------------------------------------------------------------ */

export async function loadCityData(preset = 'barcelona') {
  const url = `/city/${preset || 'barcelona'}.json`;
  const res = await fetch(url);
  // en un alojamiento estático, lo que no existe devuelve el index.html: si no
  // se comprueba, el fallo aparece como un error de JSON incomprensible
  if (!res.ok) throw new Error(`no se encuentra ${url} (HTTP ${res.status})`);
  if (!/json/i.test(res.headers.get('content-type') ?? '')) {
    throw new Error(`${url} no devuelve JSON: revisa que el archivo esté publicado`);
  }
  const city = await res.json();

  // ?ortho=off dibuja la ciudad sin foto aérea (útil para comparar y depurar)
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ortho') === 'off') {
    city.ortho = null;
    return city;
  }

  // la ortofoto es opcional: sin ella la ciudad se dibuja igual, con suelo liso
  try {
    const orthoRes = await fetch(`/city/${preset}-ortho/ortho.json`);
    if (orthoRes.ok) city.ortho = await orthoRes.json();
  } catch {
    city.ortho = null;
  }
  return city;
}

/** Carga las teselas de ortofoto como texturas. */
async function loadOrthoTextures(ortho, onProgress) {
  if (!ortho?.tiles?.length) return new Map();
  const loader = new THREE.TextureLoader();
  let done = 0;
  const entries = await Promise.all(
    ortho.tiles.map(async (tile) => {
      try {
        const tex = await loader.loadAsync(`/city/${tile.file}`);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 16;
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        onProgress?.(++done / ortho.tiles.length);
        return [`${tile.col}-${tile.row}`, { tile, tex }];
      } catch {
        onProgress?.(++done / ortho.tiles.length);
        return null;
      }
    })
  );
  return new Map(entries.filter(Boolean));
}

/* ------------------------------------------------------------------ */
/* Construcción                                                        */
/* ------------------------------------------------------------------ */

export async function buildRealCity(data, library = {}, onProgress) {
  const root = new THREE.Group();
  root.name = 'city';
  const updaters = [];
  const nightTargets = [];
  const landmarks = {};

  const dummy = new THREE.Object3D();
  const place = (mesh, i, x, y, z, scale = 1, rotY = 0) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, rotY, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  const propMesh = (key, count, fallbackGeo, fallbackMat) => {
    const model = library[key];
    const mesh = model ? instancedFromModel(model, count) : null;
    const out = mesh ?? new THREE.InstancedMesh(fallbackGeo, fallbackMat, count);
    out.frustumCulled = false;
    out.castShadow = true;
    out.receiveShadow = true;
    return out;
  };

  const { extent } = data;
  const spanX = extent.maxX - extent.minX;
  const spanZ = extent.maxZ - extent.minZ;

  const orthoTex = await loadOrthoTextures(data.ortho, onProgress);
  const hasOrtho = orthoTex.size > 0;

  /* --- suelo: la foto aérea real ------------------------------------ */

  const groundMats = [];
  const orthoMeshes = [];
  if (hasOrtho) {
    for (const { tile, tex } of orthoTex.values()) {
      const w = tile.maxX - tile.minX;
      const h = tile.maxZ - tile.minZ;
      const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set((tile.minX + tile.maxX) / 2, 0, (tile.minZ + tile.maxZ) / 2);
      mesh.receiveShadow = true;
      mesh.name = `ortho-${tile.col}-${tile.row}`;
      root.add(mesh);
      groundMats.push(mat);
      orthoMeshes.push(mesh);
    }
    // de noche la foto se apaga: si no, parece mediodía con las farolas dadas
    nightTargets.push({ mats: groundMats, colorDay: 0xffffff, colorNight: 0x2a3140 });
  }

  // suelo de respaldo por debajo, para que nunca se vea el vacío
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x2d3340, roughness: 1 });
  nightTargets.push({ mat: baseMat, day: 0x2d3340, night: 0x0d1016 });
  const base = new THREE.Mesh(new THREE.PlaneGeometry(spanX * 6, spanZ * 6), baseMat);
  base.rotation.x = -Math.PI / 2;
  base.position.y = -0.5;
  base.name = 'ground';
  root.add(base);

  /* --- calles y zonas verdes dibujadas (estilos sin fotografía) -------- */

  const roadsGroup = new THREE.Group();
  roadsGroup.name = 'roads-drawn';
  roadsGroup.visible = false;
  root.add(roadsGroup);
  {
    const walkGeoms = [];
    const roadGeoms = [];
    for (const road of data.roads) {
      if (road.p.length < 2) continue;
      walkGeoms.push(ribbon(road.p, road.w + 7, 0.06));
      if (road.k !== 'pedestrian') roadGeoms.push(ribbon(road.p, road.w, 0.12));
    }
    const mk = (geoms, kind, color) => {
      if (!geoms.length) return;
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
      const mesh = new THREE.Mesh(mergeGeometries(geoms, false), mat);
      mesh.receiveShadow = true;
      mesh.userData.kind = kind;
      roadsGroup.add(mesh);
      geoms.forEach((g) => g.dispose());
    };
    mk(walkGeoms, 'walk', 0x8f95a3);
    mk(roadGeoms, 'asphalt', 0x5b6172);
  }

  const parksGroup = new THREE.Group();
  parksGroup.name = 'parks-drawn';
  parksGroup.visible = false;
  root.add(parksGroup);
  {
    const geoms = [];
    for (const park of data.parks ?? []) {
      try {
        const g = new THREE.ShapeGeometry(ringToShape(park.r));
        g.rotateX(-Math.PI / 2);
        g.translate(0, 0.16, 0);
        geoms.push(g);
      } catch {
        /* polígono degenerado */
      }
    }
    if (geoms.length) {
      const mesh = new THREE.Mesh(
        mergeGeometries(geoms, false),
        new THREE.MeshStandardMaterial({ color: 0x7fa98a, roughness: 1 })
      );
      mesh.receiveShadow = true;
      parksGroup.add(mesh);
      geoms.forEach((g) => g.dispose());
    }
  }

  /* --- edificios ----------------------------------------------------- */

  const { map: facadeMap, emissiveMap: facadeEmissive } = makeFacadeTextures();

  const facadeMat = new THREE.MeshStandardMaterial({
    map: facadeMap,
    emissiveMap: facadeEmissive,
    emissive: 0xffffff,
    emissiveIntensity: 0.02,
    roughness: 0.85,
    metalness: 0.02,
    vertexColors: true, // sombreado de volumen horneado en la geometría
  });
  nightTargets.push({ mat: facadeMat, emissiveDay: 0.02, emissiveNight: 0.85 });

  // un material de cubierta por tesela: cada tejado lleva su propia foto aérea
  const roofMats = new Map();
  const roofFallback = new THREE.MeshStandardMaterial({ color: 0x8a7f6d, roughness: 0.95, vertexColors: true });
  for (const [k, { tex }] of orthoTex) {
    roofMats.set(k, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, metalness: 0, vertexColors: true }));
  }
  if (roofMats.size) {
    nightTargets.push({ mats: [...roofMats.values()], colorDay: 0xffffff, colorNight: 0x39404f });
  }

  const tiles = [...orthoTex.values()];
  const tileOf = (x, z) => {
    for (const entry of tiles) {
      const t = entry.tile;
      if (x >= t.minX && x < t.maxX && z >= t.minZ && z < t.maxZ) return entry;
    }
    return null;
  };

  const byTile = new Map();
  const buildingIndex = [];

  data.buildings.forEach((b, i) => {
    const height = Math.max(b.h - (b.m ?? 0), 3);
    const cx = b.r.reduce((s, p) => s + p[0], 0) / b.r.length;
    const cz = b.r.reduce((s, p) => s + p[1], 0) / b.r.length;
    const entry = hasOrtho ? tileOf(cx, cz) : null;

    let geo;
    try {
      geo = new THREE.ExtrudeGeometry(ringToShape(b.r), {
        depth: height,
        bevelEnabled: false,
        UVGenerator: makeUVGenerator((i % 5) * 0.23, entry?.tile ?? null),
      });
    } catch {
      return;
    }
    geo.rotateX(-Math.PI / 2);
    if (b.m) geo.translate(0, b.m, 0);
    shadeVolume(geo, height + (b.m ?? 0));

    const key = entry ? `${entry.tile.col}-${entry.tile.row}` : 'none';
    if (!byTile.has(key)) byTile.set(key, { roofs: [], walls: [] });
    const bucket = byTile.get(key);
    // grupo 0 = cubierta y solera, grupo 1 = fachadas
    const [capGroup, wallGroup] = geo.groups;
    if (capGroup) bucket.roofs.push(sliceGroup(geo, capGroup));
    if (wallGroup) bucket.walls.push(sliceGroup(geo, wallGroup));
    geo.dispose();

    if (b.n) landmarks[b.n] = { x: cx, z: cz, h: b.h };

    // índice para poder resaltar el edificio protagonista de cada escena
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const [px, pz] of b.r) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (pz < minZ) minZ = pz;
      if (pz > maxZ) maxZ = pz;
    }
    if ((maxX - minX) * (maxZ - minZ) > 300) {
      buildingIndex.push({ x: cx, z: cz, h: b.h, minX, maxX, minZ, maxZ, name: b.n });
    }
  });

  let buildingCount = 0;
  for (const [key, bucket] of byTile) {
    const roofMat = roofMats.get(key) ?? roofFallback;

    if (bucket.roofs.length) {
      const merged = mergeGeometries(bucket.roofs, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, roofMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `roofs-${key}`;
        root.add(mesh);
      }
      bucket.roofs.forEach((g) => g.dispose());
    }

    if (bucket.walls.length) {
      const merged = mergeGeometries(bucket.walls, false);
      if (merged) {
        const mesh = new THREE.Mesh(merged, facadeMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `walls-${key}`;
        root.add(mesh);
      }
      buildingCount += bucket.walls.length;
      bucket.walls.forEach((g) => g.dispose());
    }
  }

  /* --- Sagrada Família: OSM solo trae la planta, faltan las torres ---- */

  const basilica =
    landmarks['Basílica de la Sagrada Família'] ?? landmarks['Temple Expiatori de la Sagrada Família'];
  if (basilica) {
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xb9a684, roughness: 0.9 });
    const heights = [92, 78, 84, 70, 98, 74, 88, 66, 116];
    heights.forEach((h, i) => {
      const a = (i / heights.length) * Math.PI * 2;
      const r = i === heights.length - 1 ? 0 : 15 + (i % 2) * 7;
      const tower = new THREE.Mesh(new THREE.ConeGeometry(4.6 - (i % 3) * 0.5, h, 8), stone);
      tower.position.set(Math.cos(a) * r, 16 + h / 2, Math.sin(a) * r * 0.7);
      tower.castShadow = true;
      g.add(tower);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0xe6a817, emissive: 0xe6a817, emissiveIntensity: 1.6 })
      );
      tip.position.set(tower.position.x, 16 + h + 1.4, tower.position.z);
      g.add(tip);
    });
    g.position.set(basilica.x, 0, basilica.z);
    root.add(g);
    landmarks['Sagrada Família'] = { x: basilica.x, z: basilica.z, h: 130 };
  }

  /* --- mobiliario urbano sobre las aceras reales ---------------------- */

  const streetPoints = [];
  for (const road of data.roads) {
    if (road.k === 'pedestrian') continue;
    for (let i = 1; i < road.p.length; i++) {
      const a = road.p[i - 1];
      const b = road.p[i];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.floor(len / 26);
      for (let s = 1; s <= steps; s++) {
        const t = s / (steps + 1);
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[1] + (b[1] - a[1]) * t;
        const nx = -(b[1] - a[1]) / len;
        const nz = (b[0] - a[0]) / len;
        const off = road.w / 2 + 2.4;
        streetPoints.push({ x: x + nx * off, z: z + nz * off });
        streetPoints.push({ x: x - nx * off, z: z - nz * off });
      }
    }
  }

  const rnd = (() => {
    let s = 12345;
    return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  })();
  const pick = (fraction, cap) => streetPoints.filter(() => rnd() < fraction).slice(0, cap);

  // farolas con su bombilla emisiva
  const lampSpots = pick(0.05, 1000);
  const lamps = propMesh(
    'street-lamp',
    lampSpots.length,
    new THREE.CylinderGeometry(0.16, 0.22, 7, 6),
    new THREE.MeshStandardMaterial({ color: 0x3f4a60 })
  );
  root.add(lamps);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0x1b2437, emissive: 0xffd08a, emissiveIntensity: 0 });
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), bulbMat, lampSpots.length);
  bulbs.frustumCulled = false;
  root.add(bulbs);
  const lampState = [];
  lampSpots.forEach((p, i) => {
    place(lamps, i, p.x, 0, p.z, 1, rnd() * 6.28);
    place(bulbs, i, p.x, 6.6, p.z);
    lampState.push({ x: p.x, z: p.z, y: 6.6 });
  });
  lamps.count = lampSpots.length;
  bulbs.count = lampSpots.length;
  lamps.instanceMatrix.needsUpdate = true;
  bulbs.instanceMatrix.needsUpdate = true;
  nightTargets.push({ mat: bulbMat, emissiveDay: 0, emissiveNight: 3.4 });

  // semáforos y bancos
  const lightSpots = pick(0.02, 420);
  const trafficLights = propMesh(
    'traffic-light',
    lightSpots.length,
    new THREE.BoxGeometry(0.5, 3.4, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  root.add(trafficLights);
  lightSpots.forEach((p, i) => place(trafficLights, i, p.x, 0, p.z, 1, rnd() * 6.28));
  trafficLights.count = lightSpots.length;
  trafficLights.instanceMatrix.needsUpdate = true;

  const benchSpots = pick(0.008, 180);
  const benches = propMesh(
    'bench',
    benchSpots.length,
    new THREE.BoxGeometry(2.2, 0.6, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x6b5b45 })
  );
  root.add(benches);
  benchSpots.forEach((p, i) => place(benches, i, p.x, 0, p.z, 1, rnd() * 6.28));
  benches.count = benchSpots.length;
  benches.instanceMatrix.needsUpdate = true;

  /* --- red de videovigilancia ---------------------------------------- */

  const camSpots = pick(0.004, 120);
  const cams = propMesh(
    'cctv-camera',
    camSpots.length,
    new THREE.BoxGeometry(1.4, 0.6, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0 })
  );
  root.add(cams);
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(6, 20, 14, 1, true), coneMat, camSpots.length);
  cones.frustumCulled = false;
  root.add(cones);

  const camState = camSpots.map((p, i) => ({ ...p, y: 8 + rnd() * 4, phase: i * 0.7, sweep: 0.5 + rnd() * 0.6 }));
  const cameras = { focus: 0, target: 0, count: camState.length };
  updaters.push((t, dt) => {
    cameras.focus += (cameras.target - cameras.focus) * Math.min(1, dt * 4);
    coneMat.opacity = 0.16 * cameras.focus;
    for (let i = 0; i < camState.length; i++) {
      const c = camState[i];
      const yaw = Math.sin(t * 0.35 * c.sweep + c.phase) * 0.9;
      place(cams, i, c.x, c.y, c.z, 1, yaw);
      // desplazado hacia donde mira, para que el cono no atraviese la fachada
      dummy.position.set(c.x + Math.sin(yaw) * 8, c.y - 8.5, c.z + Math.cos(yaw) * 8);
      dummy.rotation.set(Math.PI * 0.86, yaw, 0);
      dummy.scale.setScalar(cameras.focus > 0.02 ? 1 : 0.0001);
      dummy.updateMatrix();
      cones.setMatrixAt(i, dummy.matrix);
    }
    cams.instanceMatrix.needsUpdate = true;
    cones.instanceMatrix.needsUpdate = true;
  });

  /* --- ortofoto de detalle: se carga al acercarse ---------------------- */

  const detailGroup = new THREE.Group();
  detailGroup.name = 'ortho-detail';
  detailGroup.visible = false;
  detailGroup.userData.wanted = false;
  root.add(detailGroup);

  let detailState = 'idle'; // idle · cargando · listo · sin-datos
  const loadDetail = async (preset) => {
    if (detailState !== 'idle') return detailState;
    detailState = 'cargando';
    try {
      const res = await fetch(`/city/${preset}-ortho-detail/ortho.json`);
      if (!res.ok) throw new Error('sin capa de detalle');
      const manifest = await res.json();
      const loader = new THREE.TextureLoader();
      await Promise.all(
        manifest.tiles.map(async (tile) => {
          const tex = await loader.loadAsync(`/city/${tile.file}`);
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 16;
          tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
          const w = tile.maxX - tile.minX;
          const h = tile.maxZ - tile.minZ;
          const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0 })
          );
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set((tile.minX + tile.maxX) / 2, 0.05, (tile.minZ + tile.maxZ) / 2);
          mesh.receiveShadow = true;
          detailGroup.add(mesh);
        })
      );
      detailState = 'listo';
    } catch {
      detailState = 'sin-datos';
    }
    return detailState;
  };

  const styles = createStyleSwitch({
    groundMats,
    roofMats: [...roofMats.values(), roofFallback],
    roofTextures: [...orthoTex.values()].map((e) => e.tex).concat([null]),
    facadeMat,
    baseMat,
    orthoMeshes,
    roadsGroup,
    parksGroup,
    detailGroup,
    facadeTextures: { map: facadeMap, emissiveMap: facadeEmissive },
  });

  const network = buildRoadNetwork(data.roads);

  return {
    root,
    updaters,
    nightTargets,
    landmarks,
    cameras,
    cameraState: camState,
    lampState,
    network,
    streetPoints,
    bounds: { spanX, spanZ, extent },
    buildingIndex,
    styles,
    detail: {
      group: detailGroup,
      load: loadDetail,
      get state() {
        return detailState;
      },
    },
    stats: { buildings: buildingCount, orthoTiles: orthoTex.size },
    attribution: data.attribution,
  };
}
