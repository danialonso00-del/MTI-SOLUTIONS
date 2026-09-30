import * as THREE from 'three';
import { buildConnectivity } from './connectivity.js';

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
  greenery: {
    id: 'greenery', label: 'Zonas verdes', unit: 'Superficie verde', color: '#34d399',
    icon: 'leaf', legend: ['Menos', 'Medio', 'Más'],
  },
  network: {
    id: 'network', label: 'Conectividad urbana', unit: 'Red ilustrativa', color: '#67e8f9',
    icon: 'signal', legend: ['Nodos', 'Enlaces', 'Conectado'],
  },
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
  const c = new THREE.Color(color).convertLinearToSRGB();
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

  if (id === 'greenery') {
    for (const park of data.parks ?? []) {
      if (park.r.length < 3) continue;
      ctx.fillStyle = 'rgba(52, 211, 153, 0.58)';
      ctx.strokeStyle = 'rgba(167, 243, 208, 0.8)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#34d399';
      ctx.beginPath();
      park.r.forEach((p, i) => i ? ctx.lineTo(toX(p[0]), toY(p[1])) : ctx.moveTo(toX(p[0]), toY(p[1])));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // Land-use polygons can include roads: keep the green overlay off pavement.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const road of data.roads) {
      if (road.p.length < 2) continue;
      ctx.lineWidth = (road.w + 7) * scale;
      ctx.beginPath();
      road.p.forEach((p, i) => i ? ctx.lineTo(toX(p[0]), toY(p[1])) : ctx.moveTo(toX(p[0]), toY(p[1])));
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'lighter';
  }

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
      const c = new THREE.Color(intensity > 0.82 ? '#ef4444' : color).convertLinearToSRGB();
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
        const c = new THREE.Color(tone).convertLinearToSRGB();
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
  const span = Math.max(extent.maxX - extent.minX, extent.maxZ - extent.minZ) + 400;
  const cx = (extent.minX + extent.maxX) / 2;
  const cz = (extent.minZ + extent.maxZ) / 2;
  const square = { minX: cx - span / 2, maxX: cx + span / 2, minZ: cz - span / 2, maxZ: cz + span / 2 };
  const root = new THREE.Group();
  root.name = 'data-layers';
  const material = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const geometry = new THREE.PlaneGeometry(span, span);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(cx, 1.6, cz);
  mesh.renderOrder = 6;
  mesh.visible = false;
  const previousMaterial = material.clone();
  const previous = new THREE.Mesh(geometry, previousMaterial);
  previous.rotation.copy(mesh.rotation);
  previous.position.copy(mesh.position);
  previous.position.y = 1.55;
  previous.renderOrder = 5;
  previous.visible = false;
  root.add(previous, mesh);

  const sweepMat = new THREE.MeshBasicMaterial({
    color: '#a5f3fc', transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(span, 5), sweepMat);
  sweep.rotation.x = -Math.PI / 2;
  sweep.position.set(cx, 2.2, cz);
  sweep.renderOrder = 7;
  sweep.visible = false;
  root.add(sweep);
  const network = buildConnectivity(city);
  root.add(network.root);
  const cache = new Map();
  const source = {
    roads: cityData.roads, buildings: cityData.buildings, parks: cityData.parks,
    cameras: city.cameraState, streetPoints: city.streetPoints,
  };
  let active = null, shownAt = -10, fade = 0;
  const setLayer = (id, now = 0) => {
    if (id === active) return;
    previousMaterial.map = material.map;
    previousMaterial.opacity = material.opacity;
    previousMaterial.needsUpdate = true;
    fade = 0;
    active = LAYERS[id] ? id : null;
    if (active && active !== 'network') {
      if (!cache.has(active)) cache.set(active, drawLayer(active, source, square));
      material.map = cache.get(active);
      material.needsUpdate = true;
    }
    material.opacity = 0;
    shownAt = now;
  };
  const update = (t, dt, motionT = t, photoMode = false) => {
    root.visible = !photoMode;
    const goal = active && active !== 'network' ? 1 : 0;
    fade += (goal - fade) * (1 - Math.exp(-dt * 3.5));
    material.opacity = fade * 0.72;
    mesh.visible = material.opacity > 0.005;
    previousMaterial.opacity *= Math.exp(-dt * 4.5);
    previous.visible = previousMaterial.opacity > 0.005;
    network.update(motionT, dt, active === 'network');
    const since = t - shownAt;
    sweep.visible = Boolean(goal && since >= 0 && since < 1.8);
    if (sweep.visible) {
      const k = since / 1.8;
      sweep.position.z = square.minZ + span * k;
      sweepMat.color.set(LAYERS[active].color);
      sweepMat.opacity = 0.28 * Math.sin(k * Math.PI);
    }
  };
  return {
    root, mesh, sweep, setLayer, update,
    get active() { return active; },
    dispose() {
      cache.forEach((tex) => tex.dispose());
      geometry.dispose(); material.dispose(); previousMaterial.dispose();
      sweep.geometry.dispose(); sweepMat.dispose(); network.dispose();
    },
  };
}
