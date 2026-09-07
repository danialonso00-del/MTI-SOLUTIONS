import * as THREE from 'three';

/**
 * Capas de datos sobre la ciudad.
 *
 * Cada capa es un mapa de calor generado a partir de los datos reales de la zona
 * (la trama viaria, las huellas de edificio, las cámaras…) y se proyecta sobre
 * el suelo con mezcla aditiva. Es la lectura "de gemelo digital": la misma
 * ciudad, mirada por tráfico, por consumo, por cobertura o por residuos.
 *
 * Se generan bajo demanda y se cachean: cambiar de capa es instantáneo.
 */

export const LAYERS = {
  traffic: {
    id: 'traffic',
    label: 'Intensidad de tráfico',
    unit: 'veh/h',
    color: '#f97316',
    icon: 'car',
    legend: ['Fluido', 'Denso', 'Congestión'],
  },
  coverage: {
    id: 'coverage',
    label: 'Cobertura de cámaras',
    unit: 'campo de visión',
    color: '#38bdf8',
    icon: 'shield',
    legend: ['Sin cobertura', 'Parcial', 'Cubierto'],
  },
  energy: {
    id: 'energy',
    label: 'Consumo energético',
    unit: 'kWh/m²',
    color: '#a855f7',
    icon: 'bolt',
    legend: ['Bajo', 'Medio', 'Alto'],
  },
  waste: {
    id: 'waste',
    label: 'Llenado de contenedores',
    unit: '% de llenado',
    color: '#10b981',
    icon: 'leaf',
    legend: ['Vacío', 'Medio', 'Lleno'],
  },
  air: {
    id: 'air',
    label: 'Calidad del aire',
    unit: 'NO₂ µg/m³',
    color: '#22d3ee',
    icon: 'sensor',
    legend: ['Buena', 'Moderada', 'Pobre'],
  },
};

const SIZE = 2048;

/** Ruido suave y determinista, para que la capa no cambie entre sesiones. */
function makeNoise(seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const grid = Array.from({ length: 18 * 18 }, () => rnd());
  return (u, v) => {
    const x = u * 17;
    const y = v * 17;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const at = (i, j) => grid[(Math.min(j, 17) * 18 + Math.min(i, 17)) % grid.length];
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };
}

/** Rampa de color de la capa: transparente → color → blanco caliente. */
function rampStyle(ctx, color, x, y, r, intensity) {
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${0.85 * intensity})`);
  g.addColorStop(0.45, `rgba(${rgb}, ${0.38 * intensity})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  return g;
}

function drawLayer(id, data, world) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  const spanX = world.maxX - world.minX;
  const spanZ = world.maxZ - world.minZ;
  const toX = (x) => ((x - world.minX) / spanX) * SIZE;
  const toY = (z) => ((z - world.minZ) / spanZ) * SIZE;
  const scale = SIZE / spanX;
  const noise = makeNoise(id.length * 31 + 5);
  const color = LAYERS[id].color;

  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.globalCompositeOperation = 'lighter';

  if (id === 'traffic') {
    // la intensidad sale del tipo de vía: las primarias concentran el tráfico
    const weight = { motorway: 1, trunk: 0.95, primary: 0.85, secondary: 0.7, tertiary: 0.5 };
    for (const road of data.roads) {
      const w = weight[road.k];
      if (!w) continue;
      const mid = road.p[Math.floor(road.p.length / 2)] ?? road.p[0];
      const local = 0.55 + noise(toX(mid[0]) / SIZE, toY(mid[1]) / SIZE) * 0.75;
      const intensity = Math.min(w * local, 1);
      ctx.strokeStyle = rampStyle(ctx, intensity > 0.82 ? '#ef4444' : color, 0, 0, 1, 1);
      const c = new THREE.Color(intensity > 0.82 ? '#ef4444' : color);
      ctx.strokeStyle = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${0.42 * intensity})`;
      ctx.lineWidth = Math.max(road.w * scale * 1.9, 6);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      road.p.forEach((p, i) => (i ? ctx.lineTo(toX(p[0]), toY(p[1])) : ctx.moveTo(toX(p[0]), toY(p[1]))));
      ctx.stroke();
    }
  }

  if (id === 'coverage') {
    for (const c of data.cameras ?? []) {
      const r = 92 * scale;
      ctx.fillStyle = rampStyle(ctx, color, toX(c.x), toY(c.z), r, 0.9);
      ctx.beginPath();
      ctx.arc(toX(c.x), toY(c.z), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (id === 'energy') {
    // consumo aproximado por volumen construido
    for (const b of data.buildings) {
      if (b.r.length < 4) continue;
      const cx = b.r.reduce((s, p) => s + p[0], 0) / b.r.length;
      const cz = b.r.reduce((s, p) => s + p[1], 0) / b.r.length;
      const intensity = Math.min(0.25 + (b.h / 60) * 0.75, 1);
      const r = Math.max(18, Math.min(b.h * 1.6, 70)) * scale;
      ctx.fillStyle = rampStyle(ctx, intensity > 0.8 ? '#f472b6' : color, toX(cx), toY(cz), r, intensity * 0.6);
      ctx.beginPath();
      ctx.arc(toX(cx), toY(cz), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (id === 'waste') {
    const step = 9;
    (data.streetPoints ?? []).forEach((p, i) => {
      if (i % step) return;
      const fill = noise(toX(p.x) / SIZE, toY(p.z) / SIZE);
      const tone = fill > 0.72 ? '#ef4444' : fill > 0.45 ? '#f59e0b' : color;
      const r = 46 * scale;
      ctx.fillStyle = rampStyle(ctx, tone, toX(p.x), toY(p.z), r, 0.35 + fill * 0.65);
      ctx.beginPath();
      ctx.arc(toX(p.x), toY(p.z), r, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (id === 'air') {
    const cells = 46;
    const cell = SIZE / cells;
    for (let j = 0; j < cells; j++) {
      for (let i = 0; i < cells; i++) {
        const n = noise(i / cells, j / cells);
        const tone = n > 0.68 ? '#f59e0b' : n > 0.5 ? color : '#34d399';
        const c = new THREE.Color(tone);
        ctx.fillStyle = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${0.05 + n * 0.3})`;
        ctx.fillRect(i * cell, j * cell, cell + 1, cell + 1);
      }
    }
    ctx.filter = 'blur(14px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  ctx.globalCompositeOperation = 'source-over';

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function buildDataLayers(city, cityData) {
  const { extent } = city.bounds;
  const world = {
    minX: extent.minX - 200,
    maxX: extent.maxX + 200,
    minZ: extent.minZ - 200,
    maxZ: extent.maxZ + 200,
  };
  // el lienzo es cuadrado: se ajusta al lado mayor para no deformar
  const span = Math.max(world.maxX - world.minX, world.maxZ - world.minZ);
  const cx = (world.minX + world.maxX) / 2;
  const cz = (world.minZ + world.maxZ) / 2;
  const square = { minX: cx - span / 2, maxX: cx + span / 2, minZ: cz - span / 2, maxZ: cz + span / 2 };

  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(span, span), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, 1.6, cz);
  mesh.renderOrder = 6;
  mesh.visible = false;
  mesh.name = 'datalayer';

  // frente de barrido que revela la capa al activarla
  const sweepMat = new THREE.MeshBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(span, span * 0.055), sweepMat);
  sweep.rotation.x = -Math.PI / 2;
  sweep.position.set(cx, 2.2, cz);
  sweep.renderOrder = 7;
  sweep.visible = false;

  const cache = new Map();
  const source = {
    roads: cityData.roads,
    buildings: cityData.buildings,
    cameras: city.cameraState,
    streetPoints: city.streetPoints,
  };

  let active = null;
  let shownAt = 0;
  let fade = 0;

  const setLayer = (id, now = 0) => {
    if (!id || !LAYERS[id]) {
      active = null;
      return;
    }
    if (!cache.has(id)) cache.set(id, drawLayer(id, source, square));
    material.map = cache.get(id);
    material.needsUpdate = true;
    material.color.set('#ffffff');
    active = id;
    shownAt = now;
  };

  const update = (t, dt) => {
    const goal = active ? 1 : 0;
    fade += (goal - fade) * Math.min(1, dt * 4);
    material.opacity = fade * (0.78 + Math.sin(t * 1.1) * 0.07);
    mesh.visible = fade > 0.01;

    // el barrido recorre la capa una vez al activarla
    const since = t - shownAt;
    const sweeping = active && since < 1.9;
    sweep.visible = Boolean(sweeping);
    if (sweeping) {
      const k = since / 1.9;
      sweep.position.z = square.minZ + (square.maxZ - square.minZ) * k;
      sweepMat.opacity = 0.22 * Math.sin(k * Math.PI);
    }
  };

  return { mesh, sweep, setLayer, update, get active() { return active; } };
}
