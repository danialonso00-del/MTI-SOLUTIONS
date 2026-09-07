import * as THREE from 'three';
import { DataPanel } from './datapanel.js';
import { PovMonitor } from './povmonitor.js';
import { wide, pushIn, dolly, detail, hold } from './shots.js';
import { instancedFromModel } from './assets.js';
import { createPopupFeed } from './popups.js';
import { storyFor, kindsFor, STORY_AT, STORY_TTL } from '../data/stories.js';
import { panelFor } from '../data/panels.js';

/**
 * Director de escenas.
 *
 * Al abrir un caso de uso no basta con acercar la cámara: se monta una escena
 * que enseña la solución funcionando —la cámara detectando personas, el bus
 * mandando telemetría, los contenedores llenándose, el gemelo digital
 * escaneando la ciudad— con su panel de datos en vivo.
 *
 * Cada escena declara:
 *   rig    → cómo se mueve la cámara (aproximación + órbita, o persecución)
 *   setup  → objetos 3D que se añaden a la escena
 *   update → animación por frame
 */

/* ------------------------------------------------------------------ */
/* Marcadores de detección (lo que "ve" una cámara)                    */
/* ------------------------------------------------------------------ */

function detectionTexture(label, tone = '#38bdf8', confidence = 97) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 152;
  const ctx = c.getContext('2d');
  const col = tone;

  // esquinas tipo visor
  ctx.strokeStyle = col;
  ctx.lineWidth = 6;
  const L = 46;
  const pad = 8;
  const W = c.width - pad * 2;
  const H = 104;
  const corners = [
    [pad, pad, 1, 1],
    [pad + W, pad, -1, 1],
    [pad, pad + H, 1, -1],
    [pad + W, pad + H, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + sx * L, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * L);
    ctx.stroke();
  }

  // etiqueta
  ctx.fillStyle = col;
  ctx.fillRect(pad, pad + H + 6, 172, 30);
  ctx.fillStyle = '#04121f';
  ctx.font = "700 19px 'Inter', system-ui, sans-serif";
  ctx.textBaseline = 'middle';
  ctx.fillText(`${label}  ${confidence}%`, pad + 9, pad + H + 22);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Cifra flotante que sube: para aforos y conteos en la propia escena. */
class CounterLabel {
  constructor(accent, unit) {
    this.accent = accent;
    this.unit = unit;
    this.value = 0;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 320;
    this.canvas.height = 150;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(30, 14, 1);
    this.sprite.renderOrder = 26;
    this.dirty = true;
  }

  set(value) {
    if (value !== this.value) {
      this.value = value;
      this.dirty = true;
    }
  }

  update(dt, visible) {
    const goal = visible ? 1 : 0;
    this.material.opacity += (goal - this.material.opacity) * Math.min(1, dt * 4);
    this.sprite.visible = this.material.opacity > 0.02;
    if (!this.dirty || !this.sprite.visible) return;
    this.dirty = false;

    const ctx = this.ctx;
    const c = new THREE.Color(this.accent);
    const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`;
    ctx.clearRect(0, 0, 320, 150);
    ctx.fillStyle = 'rgba(6, 11, 20, 0.82)';
    ctx.beginPath();
    ctx.roundRect(4, 4, 312, 142, 18);
    ctx.fill();
    ctx.strokeStyle = `rgba(${rgb}, 0.65)`;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.font = "700 62px 'JetBrains Mono', ui-monospace, monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.value.toLocaleString('es-ES'), 160, 66);
    ctx.fillStyle = 'rgba(226,232,240,0.75)';
    ctx.font = "600 20px 'Inter', system-ui, sans-serif";
    ctx.fillText(this.unit, 160, 116);
    ctx.textAlign = 'left';
    this.texture.needsUpdate = true;
  }
}

class DetectionMarker {
  constructor(label, tone, size = 9) {
    this.size = size;
    this.lock = 1; // 0 = acaba de enganchar, 1 = ya fijado
    this.material = new THREE.SpriteMaterial({
      map: detectionTexture(label, tone),
      transparent: true,
      depthTest: false,
      depthWrite: false,
      opacity: 0,
    });
    this.sprite = new THREE.Sprite(this.material);
    this.sprite.scale.set(size, size * 0.6, 1);
    this.sprite.renderOrder = 25;
    this._target = null;
  }

  /** Al cambiar de objetivo, el recuadro se cierra sobre él. */
  set target(value) {
    if (value && value !== this._target) this.lock = 0;
    this._target = value;
  }

  get target() {
    return this._target;
  }

  update(dt, visible) {
    const goal = visible && this.target ? 1 : 0;
    this.material.opacity += (goal - this.material.opacity) * Math.min(1, dt * 5);
    this.sprite.visible = this.material.opacity > 0.02;

    // enganche: el recuadro entra grande y se cierra sobre el objetivo
    this.lock = Math.min(1, this.lock + dt * 3.4);
    const k = 1 - Math.pow(1 - this.lock, 3);
    const grow = 1 + (1 - k) * 0.55;
    this.sprite.scale.set(this.size * grow, this.size * 0.6 * grow, 1);

    if (this.target) {
      this.sprite.position.copy(this.target).add(new THREE.Vector3(0, 3.4, 0));
    }
  }

  dispose() {
    this.material.map.dispose();
    this.material.dispose();
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const V = new THREE.Vector3();

const nearestCamera = (city, x, z) => {
  if (!city.cameraState?.length) return null;
  let best = null;
  let bestD = Infinity;
  for (const c of city.cameraState) {
    const d = (c.x - x) ** 2 + (c.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
};

const glowRing = (color, r = 20) => {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(r * 0.94, r, 64),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
};

/**
 * Coloca peatones cerca del punto de interés reasignándolos a calles próximas.
 * Sin esto, en una ciudad de 2,4 km puede no haber nadie a quien detectar en el
 * encuadre, y la escena pierde la gracia.
 */
const stageActors = (city, traffic, x, z, count = 6) => {
  const people = traffic.groups?.people ?? [];
  if (!people.length || !city.network?.segments?.length) return people.slice(0, count);

  const near = [];
  const segs = city.network.segments;
  for (let i = 0; i < segs.length; i++) {
    const a = segs[i].a;
    const d = (a[0] - x) ** 2 + (a[1] - z) ** 2;
    if (d < 130 * 130) near.push({ i, d });
    if (near.length > 60) break;
  }
  near.sort((p, q) => p.d - q.d);
  if (!near.length) return people.slice(0, count);

  const cast = people.slice(0, count);
  cast.forEach((p, k) => {
    // se reparten entre las calles más próximas, alternando sentido y acera
    const seg = near[Math.min(k, near.length - 1)];
    p.agent.pick(seg.i, k % 2);
    p.agent.t = Math.random() * p.agent.seg.len;
    p.agent.lane = (k % 2 ? 1 : -1) * (6 + Math.random() * 4);
  });
  return cast;
};

/**
 * Resalta el edificio del que habla la escena: caja de aristas luminosas y
 * anillo en la base. Se busca en el índice ligero que deja la ciudad.
 */
const highlightBuilding = (city, group, accent, x, z) => {
  const index = city.buildingIndex ?? [];
  let best = null;
  let bestD = Infinity;
  for (const b of index) {
    const d = (b.x - x) ** 2 + (b.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = b;
    }
  }
  if (!best || bestD > 160 * 160) return null;

  const w = Math.max(best.maxX - best.minX, 6);
  const d = Math.max(best.maxZ - best.minZ, 6);
  const h = Math.max(best.h, 8);
  const cx = (best.minX + best.maxX) / 2;
  const cz = (best.minZ + best.maxZ) / 2;

  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 2, h + 1.5, d + 2)),
    new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0 })
  );
  box.position.set(cx, h / 2, cz);
  group.add(box);

  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(w + 26, d + 26),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(cx, 0.6, cz);
  group.add(halo);

  return {
    box,
    halo,
    update(t, elapsed) {
      const fade = Math.min(Math.max(elapsed - 0.8, 0), 1);
      box.material.opacity = fade * (0.55 + Math.sin(t * 2) * 0.25);
      halo.material.opacity = fade * (0.1 + Math.sin(t * 2) * 0.05);
    },
  };
};

/**
 * Traza un itinerario entre dos puntos siguiendo el grafo de calles.
 * Sin esto, unir contenedores con líneas rectas hace que la ruta atraviese
 * manzanas enteras, que es justo lo que no debe verse en una demo de rutas.
 */
const routeAlongStreets = (network, from, to, maxSteps = 26) => {
  const segs = network.segments;
  if (!segs?.length) return [from, to];

  // segmento de arranque: el más cercano al origen
  let index = 0;
  let bestD = Infinity;
  for (let i = 0; i < segs.length; i++) {
    const d = (segs[i].a[0] - from[0]) ** 2 + (segs[i].a[1] - from[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      index = i;
    }
  }

  const path = [segs[index].a];
  let end = 1; // avanzamos hacia b
  for (let step = 0; step < maxSteps; step++) {
    const seg = segs[index];
    const tip = end === 1 ? seg.b : seg.a;
    path.push(tip);
    if ((tip[0] - to[0]) ** 2 + (tip[1] - to[1]) ** 2 < 40 * 40) break;

    const node = network.nodes.get(network.key(tip));
    if (!node) break;
    let best = null;
    let bestScore = Infinity;
    for (const option of node) {
      if (option.index === index) continue;
      const s2 = segs[option.index];
      const other = option.end === 0 ? s2.b : s2.a;
      const score = (other[0] - to[0]) ** 2 + (other[1] - to[1]) ** 2;
      if (score < bestScore) {
        bestScore = score;
        best = option;
      }
    }
    if (!best) break;
    index = best.index;
    end = best.end === 0 ? 1 : 0;
  }
  return path;
};

/** Dirección de la calle más próxima a un punto: para encuadrar por el eje viario. */
const streetDirection = (city, x, z) => {
  const segs = city.network?.segments ?? [];
  let best = null;
  let bestD = Infinity;
  for (const seg of segs) {
    const d = (seg.a[0] - x) ** 2 + (seg.a[1] - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = seg;
    }
  }
  if (!best) return { x: 1, z: 0 };
  const dx = best.b[0] - best.a[0];
  const dz = best.b[1] - best.a[1];
  const len = Math.hypot(dx, dz) || 1;
  return { x: dx / len, z: dz / len };
};

const pathLine = (points, color, y = 1.2) => {
  const geo = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], y, p[1])));
  const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });
  return new THREE.Line(geo, mat);
};

/* ------------------------------------------------------------------ */
/* Guion de escena                                                     */
/* ------------------------------------------------------------------ */

/**
 * Un caso de uso se cuenta igual siempre: cuatro tarjetas —sucede, llega a la
 * plataforma, se decide, se resuelve— y **un plano fijo para cada una**.
 *
 * La regla que lo hace legible: mientras hay una tarjeta en pantalla la cámara
 * NO se mueve. Se planta delante, a la distancia a la que la tarjeta se lee, y
 * espera. Entre tarjeta y tarjeta hay un travelling corto hasta el siguiente
 * encuadre. Nada de órbitas con tarjetas colgando lejos.
 *
 * @param {object} o
 * @param {THREE.Group} o.group    grupo de la escena
 * @param {Array} o.slots          geometría de cada paso: { look:[x,y,z] (a qué
 *                                 se refiere), spot?:[x,y,z] (dónde va la
 *                                 tarjeta), link?:boolean, angle?:number }
 * @param {Array} o.stories        una o varias tandas de textos:
 *                                 [[{title,sub,icon,tone}, ...4], ...]
 * @param {object} o.opening       plano de apertura (de shots.js)
 * @param {number} o.scale         ancho de la tarjeta en metros
 */
/* Idioma de las escenas. Lo fija el director al arrancar: las escenas se
   construyen de una pieza, así que basta con leerlo aquí. */
let LANG = 'es';

const STORY_FIRST = STORY_AT[0]; // la primera tarjeta, con el rótulo ya fuera
const STORY_STEP = STORY_AT[1] - STORY_AT[0]; // cada cuánto entra la siguiente
const STORY_TRANS = 2.4; // travelling entre encuadres
const STORY_PAUSE = 9; // respiro antes de repetir el ciclo

// Desde dónde mira la cámara en cada paso, medido respecto al eje de la calle:
// nunca de frente contra la medianera, siempre a lo largo del vial.
const STORY_AZIMUTH = [0.45, -0.45, 0.95, -0.95];

function storyboard({ group, slots, stories, opening, scale = 24, intro = 3.4, accent, axis = null, minDist = 0 }) {
  const at = slots.map((_, i) => STORY_AT[i] ?? STORY_FIRST + i * STORY_STEP);

  // dónde se pone la tarjeta si el caso no lo dice: al lado de lo que se
  // cuenta, girando un poco en cada paso para que no se pisen
  const spotOf = (slot, i) => {
    if (slot.spot) return slot.spot;
    const a = (slot.angle ?? 0.9) + i * 1.3;
    return [slot.look[0] + Math.cos(a) * 26, slot.look[1] + 26 + (i % 2) * 6, slot.look[2] + Math.sin(a) * 26];
  };

  /* Encuadre de un paso: la cámara mira sobre todo a la tarjeta (para que se
     lea) sin perder de vista lo que cuenta, y se corre un poco a un lado
     porque el hueco libre de la pantalla no está centrado: a la izquierda
     manda el panel de exploración y a la derecha la ficha del caso. */
  const framing = (spot, look, i, eje = axis) => {
    // se apunta casi a la tarjeta: es lo que hay que leer, y el sujeto entra
    // igual en el plano porque está justo al lado
    const mid = [
      spot[0] * 0.82 + look[0] * 0.18,
      spot[1] * 0.82 + look[1] * 0.18,
      spot[2] * 0.82 + look[2] * 0.18,
    ];
    const sep = Math.hypot(spot[0] - look[0], spot[1] - look[1], spot[2] - look[2]);
    const d = Math.max(minDist, scale * 2.8, sep * 1.15 + 24);
    // si la escena da el eje de la calle, la cámara se coloca a lo largo de
    // ella: en el Eixample, mirar de frente a una manzana es ver una pared
    const ang = eje !== null && eje !== undefined ? eje + STORY_AZIMUTH[i % 4] : 0.6 + i * 1.05;
    const cx = Math.cos(ang);
    const cz = Math.sin(ang);
    return {
      mid,
      d,
      // el desplazamiento lateral deja la tarjeta en la mitad visible; la
      // altura la sube por encima de las cornisas del Eixample, o el plano
      // saldría con una medianera delante
      // el desvío lateral corre la tarjeta hacia la izquierda del encuadre,
      // que es donde queda el hueco libre entre los dos paneles de la interfaz
      position: [mid[0] + cx * d - cz * d * 0.22, mid[1] + Math.max(d * 0.5, 26), mid[2] + cz * d + cx * d * 0.22],
    };
  };

  const geo = slots.map((slot, i) => {
    const spot = spotOf(slot, i);
    const f = framing(spot, slot.look, i);
    return { spot, look: slot.look, mid: f.mid, position: f.position, d: f.d, index: i };
  });

  const events = (story) =>
    story.map((texto, i) => ({
      ...texto,
      at: at[i],
      ttl: texto.ttl ?? STORY_TTL,
      step: i + 1,
      kind: texto.kind ?? kindsFor(LANG)[i],
      // el tamaño sale de la distancia del plano: la tarjeta ocupa siempre la
      // misma porción de pantalla, esté el plano cerca (un contenedor) o lejos
      // (un estadio entero)
      size: ((geo[i].d * 0.3) / scale) * (i === 1 ? 1.08 : 1),
      position: geo[i].spot,
      link: slots[i].link === false ? undefined : slots[i].look,
      linkColor: texto.tone === 'alert' ? 0xf43f5e : texto.tone === 'warn' ? 0xf59e0b : 0x38bdf8,
    }));

  // montaje: apertura · (travelling + plano fijo) por cada tarjeta
  const shots = [{ ...opening, duration: at[0] - STORY_TRANS }];
  geo.forEach((g, i) => {
    const from = i === 0 ? g.position : geo[i - 1].position;
    shots.push(
      dolly(from, g.position, g.mid, { duration: STORY_TRANS }),
      hold(g.position, g.mid, {
        duration: (at[i + 1] ?? at[i] + STORY_TTL + STORY_PAUSE) - STORY_TRANS - at[i],
      })
    );
  });

  // el ciclo de las tarjetas y el del montaje tienen que durar lo mismo, o la
  // cámara acabaría encuadrando el paso equivocado
  const total = shots.reduce((a, s2) => a + s2.duration, 0);

  const popups = createPopupFeed({
    group,
    sets: stories.map(events),
    scale,
    pause: total - at.at(-1),
  });

  return {
    popups,
    geo,
    at,
    total, // lo que dura una vuelta del relato
    rig: { intro, loop: true, shots },
    /** Reencuadra un paso en marcha (para lo que se mueve: camión, autobús). */
    frame(i, spot, look, eje) {
      const g = geo[i];
      if (!g) return;
      const f = framing(spot, look, i, eje ?? axis);
      // los planos del montaje apuntan a estos arrays: basta con escribirlos
      for (let k = 0; k < 3; k++) {
        g.mid[k] = f.mid[k];
        g.position[k] = f.position[k];
        g.spot[k] = spot[k];
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Escenas                                                            */
/* ------------------------------------------------------------------ */

/**
 * Videovigilancia: la cámara de la ciudad barre la calle, marca a las personas
 * y vehículos que entran en su cono y levanta una alerta de intrusión.
 */
function securityScene({ solution, city, traffic, group, accent }) {
  const [ax, , az] = solution.anchor;
  const cam = nearestCamera(city, ax, az) ?? { x: ax, y: 12, z: az, phase: 0, sweep: 1 };

  const focus = new THREE.Vector3(cam.x, 0, cam.z);
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(13, 34, 26, 1, true),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(cone);

  const scan = glowRing(accent, 14);
  group.add(scan);

  const markers = [
    new DetectionMarker('PERSONA', '#38bdf8'),
    new DetectionMarker('VEHÍCULO', '#e6a817', 11),
    new DetectionMarker('INTRUSIÓN', '#f43f5e'),
  ];
  markers.forEach((m) => group.add(m.sprite));

  /* El relato, en cuatro tiempos: la cámara ve algo · la señal sube a la
     plataforma · la plataforma decide · el caso queda cerrado. Tres tandas,
     porque en videovigilancia la conversación cambia según el cliente. */
  const dirCam = streetDirection(city, cam.x, cam.z);
  const calle = [cam.x + dirCam.x * 26, 3, cam.z + dirCam.z * 26];
  const sb = storyboard({
    group,
    accent,
    // la cámara de cine se coloca a lo largo de la calle que vigila la cámara
    // de seguridad: si no, el plano lo ocupa la fachada de enfrente
    axis: Math.atan2(dirCam.z, dirCam.x),
    opening: wide([cam.x, 10, cam.z], { radius: 220, height: 150, speed: 0.012 }),
    slots: [
      { look: calle, camAngle: 0.5, spot: [calle[0] + 14, 30, calle[2] + 12] },
      { look: [cam.x, cam.y ?? 10, cam.z], camAngle: 1.6, spot: [cam.x + 26, 58, cam.z - 20] },
      { look: calle, camAngle: 2.7, spot: [calle[0] - 18, 36, calle[2] + 16] },
      { look: [cam.x, cam.y ?? 10, cam.z], camAngle: 3.9, spot: [cam.x - 16, 40, cam.z + 20] },
    ],
    stories: storyFor('urban-security', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];
  const RESULT = sb.at[3];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  const dirS = streetDirection(city, cam.x, cam.z);
  const stageX = cam.x + dirS.x * 22;
  const stageZ = cam.z + dirS.z * 22;
  const monitor = new PovMonitor({ accent, label: 'CÁM 042 · EN VIVO' });
  group.add(monitor.group);
  monitor.show();

  const people = stageActors(city, traffic, stageX, stageZ, 8);
  // los actores caminan despacio para no salirse del plano
  people.forEach((p) => (p.agent.speed = 0.7 + Math.random() * 0.4));
  let restage = 12;
  const cars = traffic.groups.fleets?.find((f) => f.key === 'car-hatchback')?.agents ?? [];
  let retarget = 0;

  return {
    rig: sb.rig,
    panel,
    monitor,
    popups: sb.popups,
    update(t, dt) {
      // el barrido oscila alrededor del eje de la calle: así siempre encuadra
      // la acera y la calzada, que es donde pasa algo
      const baseYaw = Math.atan2(dirS.x, dirS.z);
      const yaw = baseYaw + Math.sin(t * 0.22 * (cam.sweep ?? 1) + (cam.phase ?? 0)) * 0.42;
      monitor.aim(cam.x, cam.y + 1.5, cam.z, yaw, -0.22);
      // el cono arranca por delante de la fachada donde va montada la cámara
      cone.position.set(cam.x + Math.sin(yaw) * 13, cam.y - 13, cam.z + Math.cos(yaw) * 13);
      cone.rotation.set(Math.PI * 0.87, yaw, 0);
      cone.material.opacity = 0.1 + Math.abs(Math.sin(t * 1.3)) * 0.07;

      const s = 1 + Math.sin(t * 1.6) * 0.16;
      scan.position.set(cam.x + Math.sin(yaw) * 22, 0.6, cam.z + Math.cos(yaw) * 22);
      scan.scale.setScalar(s);
      scan.material.opacity = 0.35 + Math.sin(t * 1.6) * 0.2;

      // si los actores se alejan del plano, se recolocan
      restage -= dt;
      if (restage <= 0) {
        restage = 12;
        for (const p of people) {
          if (Math.hypot(p.obj.position.x - stageX, p.obj.position.z - stageZ) > 95) {
            stageActors(city, traffic, stageX, stageZ, people.length);
            break;
          }
        }
      }

      // reasignar objetivos de vez en cuando: lo más cercano a la cámara
      retarget -= dt;
      if (retarget <= 0) {
        retarget = 1.6;
        const sorted = people
          .map((p) => ({ p, d: (p.obj.position.x - stageX) ** 2 + (p.obj.position.z - stageZ) ** 2 }))
          .sort((a, b) => a.d - b.d);
        markers[0].target = sorted[0]?.p.obj.position ?? null;
        markers[2].target = sorted[2]?.p.obj.position ?? null;
        if (cars.length) {
          const car = cars.reduce((best, a) => {
            a.position(V);
            const d = (V.x - cam.x) ** 2 + (V.z - cam.z) ** 2;
            return !best || d < best.d ? { a, d } : best;
          }, null);
          markers[1].carAgent = car?.a ?? null;
        }
      }
      if (markers[1].carAgent) {
        markers[1].carAgent.position(V);
        markers[1].target = markers[1].target ?? new THREE.Vector3();
        markers[1].target.copy(V);
      }
      markers.forEach((m, i) => m.update(dt, t > 1.2 + i * 0.35));
    },
  };
}

/**
 * Flota — el Smart Bus. El autobús circula, **se para en la parada** y ahí se
 * cuenta lo que MTI instala dentro: validación de pago, cámaras, conteo de
 * pasajeros, SAE, paneles al viajero, telemetría del vehículo. Con el autobús
 * quieto, las tarjetas se leen.
 */
function fleetScene({ solution, traffic, group, accent }) {
  const fleet = traffic.groups.fleets?.find((f) => f.key === 'bus');
  const agent = fleet?.agents?.[0];
  const cruise = agent?.speed ?? 8;

  const marker = new DetectionMarker('BUS 47 · LÍNEA V15', '#e6a817', 14);
  group.add(marker.sprite);

  // la parada: un disco en el asfalto donde el autobús se detiene
  const stop = glowRing('#e6a817', 9);
  stop.position.set(0, 0.6, 0);
  group.add(stop);

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  const trail = [];
  const trailLine = pathLine([[0, 0]], accent, 1.4);
  group.add(trailLine);

  /* Las cuatro tarjetas cuelgan del propio autobús. Como el vehículo está
     parado mientras se cuentan, ni se mueven ni tiemblan. */
  const sb = storyboard({
    group,
    accent,
    scale: 20,
    opening: wide([0, 6, 0], { radius: 200, height: 130, speed: 0.014 }),
    slots: [
      { look: [0, 3, 0], camAngle: 0.5, spot: [0, 18, 0] },
      { look: [0, 3, 0], camAngle: 1.6, spot: [0, 18, 0] },
      { look: [0, 3, 0], camAngle: 2.7, spot: [0, 18, 0] },
      { look: [0, 3, 0], camAngle: 3.8, spot: [0, 18, 0] },
    ],
    stories: storyFor('mobility-fleet', undefined, LANG),
  });

  // el autobús se detiene mientras se cuentan las tarjetas
  const PARA = sb.at[0] - 3;
  const ARRANCA = sb.at.at(-1) + 9;

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      if (!agent) return;
      const e = ctx.elapsed % sb.total;
      const parado = e > PARA && e < ARRANCA;
      agent.speed = parado ? 0 : cruise;

      agent.position(V);
      marker.target = marker.target ?? new THREE.Vector3();
      marker.target.copy(V);
      marker.update(dt, e > 1);

      stop.position.set(V.x, 0.6, V.z);
      stop.material.opacity = parado ? 0.35 + Math.abs(Math.sin(t * 1.4)) * 0.25 : 0;

      // estela del recorrido
      if (!trail.length || Math.hypot(V.x - trail.at(-1)[0], V.z - trail.at(-1)[1]) > 6) {
        trail.push([V.x, V.z]);
        if (trail.length > 60) trail.shift();
        trailLine.geometry.setFromPoints(trail.map((p) => new THREE.Vector3(p[0], 1.4, p[1])));
      }

      // los cuatro encuadres cuelgan del autobús: se recolocan con él y se
      // quedan quietos en cuanto para
      const h = agent.heading;
      // el eje de la calle: la cámara se pone a lo largo de ella, nunca contra
      // la fachada de enfrente
      const eje = Math.atan2(Math.cos(h), Math.sin(h)) + Math.PI;
      for (let i = 0; i < 4; i++) {
        const a = eje + 0.9 + i * 1.2;
        sb.frame(i, [V.x + Math.cos(a) * 9, 16, V.z + Math.sin(a) * 9], [V.x, 2.5, V.z], eje);
      }

      // la apertura sigue al autobús en marcha
      const open = ctx.rig.shots[0];
      if (open?.center) {
        open.center[0] = V.x;
        open.center[2] = V.z;
      }
    },
  };
}

/**
 * Residuos — el relato completo, contado despacio: el contenedor avisa, la
 * señal sube a la plataforma, la plataforma recalcula la ruta y el camión
 * recorre la calle hasta él. La ruta se traza sobre el viario real, así que el
 * camión nunca cruza una manzana.
 */
function wasteScene({ solution, city, traffic, library, group, accent }) {
  const [ax, , az] = solution.anchor;

  /* --- 1· el recorrido: se camina el grafo viario desde el punto de escena -- */
  const segs = city.network?.segments ?? [];
  const routePoints = [];
  if (segs.length) {
    let index = 0;
    let bestD = Infinity;
    for (let i = 0; i < segs.length; i++) {
      const d = (segs[i].a[0] - ax) ** 2 + (segs[i].a[1] - az) ** 2;
      if (d < bestD) {
        bestD = d;
        index = i;
      }
    }
    let end = 1;
    routePoints.push(segs[index].a);
    const visited = new Set([index]);
    for (let step = 0; step < 22; step++) {
      const seg = segs[index];
      const tip = end === 1 ? seg.b : seg.a;
      const tail = end === 1 ? seg.a : seg.b;
      routePoints.push(tip);
      const node = city.network.nodes.get(city.network.key(tip));
      if (!node) break;
      // se prefiere seguir recto y no repetir calle: sale una ruta creíble
      const dirX = tip[0] - tail[0];
      const dirZ = tip[1] - tail[1];
      const len = Math.hypot(dirX, dirZ) || 1;
      let best = null;
      let bestScore = -Infinity;
      for (const option of node) {
        if (option.index === index) continue;
        const s2 = segs[option.index];
        const other = option.end === 0 ? s2.b : s2.a;
        const ox = other[0] - tip[0];
        const oz = other[1] - tip[1];
        const olen = Math.hypot(ox, oz) || 1;
        const straight = (dirX / len) * (ox / olen) + (dirZ / len) * (oz / olen);
        const score = straight - (visited.has(option.index) ? 1.4 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      }
      if (!best) break;
      visited.add(best.index);
      index = best.index;
      end = best.end === 0 ? 1 : 0;
    }
  }
  if (routePoints.length < 2) routePoints.push([ax, az], [ax + 60, az + 60]);

  const route = pathLine(routePoints, accent, 1.6);
  route.material.opacity = 0;
  group.add(route);
  const routeDrawn = route.geometry.attributes.position.count;

  // tramos con distancia acumulada: el camión avanza a velocidad constante
  const legs = [];
  let total = 0;
  for (let i = 1; i < routePoints.length; i++) {
    const d = Math.hypot(
      routePoints[i][0] - routePoints[i - 1][0],
      routePoints[i][1] - routePoints[i - 1][1]
    );
    if (d < 0.5) continue;
    legs.push({ from: routePoints[i - 1], to: routePoints[i], d, acc: total });
    total += d;
  }
  const pointAt = (dist) => {
    if (!legs.length) return { x: ax, z: az, heading: 0 };
    const d = THREE.MathUtils.clamp(dist, 0, total);
    const leg = legs.find((l) => d >= l.acc && d < l.acc + l.d) ?? legs.at(-1);
    const k = leg.d ? (d - leg.acc) / leg.d : 0;
    return {
      x: leg.from[0] + (leg.to[0] - leg.from[0]) * k,
      z: leg.from[1] + (leg.to[1] - leg.from[1]) * k,
      heading: Math.atan2(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1]),
    };
  };

  /* --- 2· contenedores sobre la ruta, apartados a la acera ---------------- */
  const spots = [];
  const stride = Math.max(total / 10, 55);
  for (let dist = stride * 0.6; dist < total; dist += stride) {
    const p = pointAt(dist);
    spots.push({
      x: p.x - Math.cos(p.heading) * 7,
      z: p.z + Math.sin(p.heading) * 7,
      dist,
    });
  }
  if (!spots.length) spots.push({ x: ax, z: az, dist: total });

  // el contenedor del que va la historia: el último de la ruta, para que el
  // camión conduzca hacia él y se vea llegar
  const hero = spots.at(-1);

  const bars = [];
  const binGeo = new THREE.BoxGeometry(2.6, 2.4, 2);
  const binMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.6,
    emissive: 0x10b981,
    emissiveIntensity: 0.25,
  });
  for (const p of spots) {
    const bin = new THREE.Mesh(binGeo, binMat);
    bin.position.set(p.x, 1.2, p.z);
    group.add(bin);

    const fill = p === hero ? 0.92 : 0.15 + Math.random() * 0.5;
    const bar = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 8),
      new THREE.MeshBasicMaterial({
        color: fill > 0.75 ? 0xf43f5e : fill > 0.45 ? 0xe6a817 : 0x10b981,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: false,
      })
    );
    bar.position.set(p.x, 6, p.z);
    bar.renderOrder = 24;
    group.add(bar);
    bars.push({ bar, fill, spot: p });
  }

  // el contenedor lleno emite: anillos que salen de él mientras dura el aviso
  const emit = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 6);
    r.position.set(hero.x, 1.4, hero.z);
    group.add(r);
    return r;
  });

  /* --- 3· el camión --------------------------------------------------------- */
  const truckModel = library['truck-waste'];
  const truck = truckModel ? instancedFromModel(truckModel, 1) : null;
  if (truck) group.add(truck);
  const truckDummy = new THREE.Object3D();

  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 14, 10),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false })
  );
  pulse.visible = !truck;
  group.add(pulse);

  const pulseHalo = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 4.6, 32),
    new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );
  pulseHalo.rotation.x = -Math.PI / 2;
  group.add(pulseHalo);

  /* --- 4· el relato en tarjetas ------------------------------------------- */
  /* El guion: el contenedor avisa · la plataforma lo recibe · decide la ruta ·
     el camión llega. Cada tarjeta con su plano fijo, y el último siguiendo al
     camión, que para eso es el final del cuento. */
  const truckPos = { x: routePoints[0][0], z: routePoints[0][1] };
  const sb = storyboard({
    group,
    accent,
    // eje de la calle del contenedor: los planos miran calle abajo
    axis: (() => {
      const p = pointAt(hero.dist ?? 0);
      return Math.atan2(Math.cos(p.heading), Math.sin(p.heading));
    })(),
    opening: detail([hero.x, 6, hero.z], { radius: 70, height: 40, speed: 0.02 }),
    slots: [
      { look: [hero.x, 3, hero.z], camAngle: 0.5, spot: [hero.x + 12, 22, hero.z + 10] },
      { look: [hero.x, 6, hero.z], camAngle: 1.6, spot: [hero.x + 28, 52, hero.z - 24] },
      { look: [hero.x, 4, hero.z], camAngle: 2.7, spot: [hero.x - 24, 40, hero.z + 22] },
      { look: [hero.x, 3, hero.z], camAngle: 3.9, spot: [hero.x - 12, 24, hero.z - 12] },
    ],
    stories: storyFor('waste-management', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];
  // el camión sale cuando la plataforma decide y llega justo con la última
  // tarjeta: el cuento y el movimiento acaban a la vez
  const TRIP = sb.at[3] - sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      // el relato se repite: el reloj de la escena vuelve a empezar con él
      const e = ctx.elapsed % sb.total;

      // el contenedor emite mientras se cuenta el aviso
      const emitting = e > SIGNAL - 1 && e < DECIDE;
      emit.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(0.5 + k * 2.4);
        r.material.opacity = emitting ? 0.55 * (1 - k) : 0;
      });

      // la ruta se dibuja cuando la plataforma decide, no antes
      const draw = THREE.MathUtils.clamp((e - DECIDE) / 3.5, 0, 1);
      route.material.opacity = draw * 0.85;
      route.geometry.setDrawRange(0, Math.max(2, Math.round(routeDrawn * draw)));

      // el camión sale al decidir y tarda TRIP segundos en llegar
      const travelled = THREE.MathUtils.clamp((e - DECIDE) / TRIP, 0, 1) * total;
      const p = pointAt(travelled);
      truckPos.x = p.x;
      truckPos.z = p.z;
      const rolling = e > DECIDE;

      if (truck) {
        truckDummy.position.set(p.x, 0.05, p.z);
        truckDummy.rotation.set(0, p.heading, 0);
        truckDummy.scale.setScalar(rolling ? 1 : 0.001);
        truckDummy.updateMatrix();
        truck.setMatrixAt(0, truckDummy.matrix);
        truck.instanceMatrix.needsUpdate = true;
      } else {
        pulse.position.set(p.x, 3.2, p.z);
        pulse.material.opacity = rolling ? 0.9 : 0;
      }

      // el último paso viaja con el camión: la tarjeta y el encuadre van con él
      sb.frame(3, [p.x + 12, 24, p.z + 10], [p.x, 3, p.z]);

      pulseHalo.position.set(p.x, 0.9, p.z);
      const grow = (t * 1.1) % 1;
      pulseHalo.scale.setScalar(1 + grow * 2.4);
      pulseHalo.material.opacity = rolling ? 0.45 * (1 - grow) : 0;

      bars.forEach((b, i) => {
        const g = THREE.MathUtils.clamp((e - 1 - i * 0.12) * 1.2, 0, 1);
        const h = b.fill * 8 * g;
        b.bar.scale.set(1, Math.max(h / 8, 0.001), 1);
        b.bar.position.y = 3.2 + h / 2;
        b.bar.material.opacity = 0.85 * g;
      });
    },
  };
}

/**
 * Agua — telelectura de contadores: uno detecta caudal continuo, la plataforma
 * lo confirma contra el balance del sector y sale el aviso de fuga.
 */
function waterScene({ solution, city, group, accent }) {
  const [ax, , az] = solution.anchor;

  // contadores repartidos por las aceras del sector
  const spots = (city.streetPoints ?? [])
    .filter((p) => Math.hypot(p.x - ax, p.z - az) < 260)
    .filter((_, i) => i % 5 === 0)
    .slice(0, 70);
  if (!spots.length) spots.push({ x: ax, z: az });

  const dotGeo = new THREE.SphereGeometry(1.1, 10, 8);
  const dotMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.9 });
  const dots = new THREE.InstancedMesh(dotGeo, dotMat, spots.length);
  dots.frustumCulled = false;
  group.add(dots);
  {
    const d = new THREE.Object3D();
    spots.forEach((p, i) => {
      d.position.set(p.x, 2.4, p.z);
      d.scale.setScalar(1);
      d.updateMatrix();
      dots.setMatrixAt(i, d.matrix);
    });
    dots.instanceMatrix.needsUpdate = true;
  }

  // el contador con fuga: apartado del centro, para que se lea el sector entero
  const leak = spots[Math.min(spots.length - 1, Math.floor(spots.length * 0.6))];
  const rings = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 8);
    r.position.set(leak.x, 1.6, leak.z);
    group.add(r);
    return r;
  });

  // el sector medido: un anillo grande que se cierra al aislar la fuga
  const sector = glowRing(accent, 190);
  sector.position.set(ax, 1.2, az);
  group.add(sector);

  /* El guion: cuatro tarjetas, cada una con su plano fijo. Dos tandas, para
     que en una reunión larga no se repita siempre el mismo caso. */
  const sb = storyboard({
    group,
    accent,
    axis: (() => {
      const d = streetDirection(city, leak.x, leak.z);
      return Math.atan2(d.z, d.x);
    })(),
    opening: wide([ax, 6, az], { radius: 300, height: 190, speed: 0.012 }),
    slots: [
      { look: [leak.x, 3, leak.z], camAngle: 0.6 },
      { look: [leak.x, 6, leak.z], camAngle: 1.4 },
      { look: [ax, 4, az], camAngle: 2.4, spot: [ax + 26, 34, az + 26] },
      { look: [leak.x, 3, leak.z], camAngle: 3.6 },
    ],
    stories: storyFor('water-metering', undefined, LANG),
  });
  const DECIDE = sb.at[2];
  const SIGNAL = sb.at[0];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed;
      const solved = THREE.MathUtils.clamp((e - DECIDE) / 6, 0, 1);

      // la red respira: los contadores parpadean al ritmo de la telelectura
      dotMat.opacity = 0.55 + Math.abs(Math.sin(t * 1.1)) * 0.35;

      rings.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(0.6 + k * 2.6);
        r.material.opacity = (e > SIGNAL - 1 ? 0.6 : 0) * (1 - k) * (1 - solved * 0.75);
      });

      sector.material.opacity = 0.12 + Math.abs(Math.sin(t * 0.6)) * 0.1 + solved * 0.12;
      sector.material.color.set(solved > 0.6 ? '#10b981' : accent);
    },
  };
}

/**
 * Alumbrado — las luminarias reales de la ciudad se encienden en cascada, una
 * falla y el relato la sigue: avisa · la plataforma la agrupa con el resto ·
 * sale la orden a mantenimiento · la calle vuelve a estar al 100%.
 */
function lightingScene({ solution, city, library, group, accent }) {
  const [ax, , az] = solution.anchor;

  /* Puntos de luz de la escena: primero las farolas REALES que hay cerca —la
     ciudad reparte mil por sus seis kilómetros, así que aquí caen pocas— y
     después se completa con la acera hasta tener una calle bien iluminada. */
  const cerca = (p) => Math.hypot(p.x - ax, p.z - az) < 340;
  const spots = (city.lampState ?? []).filter(cerca).slice(0, 40);
  const acera = (city.streetPoints ?? []).filter(cerca);
  for (let i = 0; spots.length < 80 && i < acera.length; i += 4) {
    const p = acera[i];
    // no se duplica luz donde ya hay farola de ciudad
    if (spots.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 16)) continue;
    spots.push({ x: p.x, z: p.z, y: 6.6 });
  }
  if (!spots.length) spots.push({ x: ax, y: 6.6, z: az });

  // báculos de escena, para que se vea de dónde sale la luz
  const poleModel = library['street-lamp'];
  if (poleModel) {
    const poles = instancedFromModel(poleModel, spots.length);
    if (poles) {
      const d = new THREE.Object3D();
      spots.forEach((p, i) => {
        d.position.set(p.x, 0, p.z);
        d.rotation.set(0, (i * 1.7) % 6.28, 0);
        d.scale.setScalar(1);
        d.updateMatrix();
        poles.setMatrixAt(i, d.matrix);
      });
      poles.instanceMatrix.needsUpdate = true;
      group.add(poles);
    }
  }

  // orden de encendido: de la más cercana al punto de escena hacia fuera, que
  // es como se ve la cascada
  const ordered = [...spots].sort(
    (a, b) => Math.hypot(a.x - ax, a.z - az) - Math.hypot(b.x - ax, b.z - az)
  );

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xffd08a,
    emissive: 0xffd08a,
    emissiveIntensity: 1.3,
  });
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 10, 8), bulbMat, ordered.length);
  bulbs.frustumCulled = false;
  group.add(bulbs);

  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffd08a,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(5, 12.5, 18, 1, true), coneMat, ordered.length);
  cones.frustumCulled = false;
  group.add(cones);

  // charco de luz en el suelo: es lo que de verdad se lee desde el aire, que
  // es desde donde mira la cámara en este caso
  const poolMat = new THREE.MeshBasicMaterial({
    color: 0xffc978,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const pools = new THREE.InstancedMesh(new THREE.CircleGeometry(7, 24), poolMat, ordered.length);
  pools.frustumCulled = false;
  group.add(pools);

  const dummy = new THREE.Object3D();
  ordered.forEach((p, i) => {
    dummy.position.set(p.x, p.y ?? 6.6, p.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(0.001); // se encienden una a una
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 6.6, p.z);
    dummy.rotation.set(Math.PI, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    cones.setMatrixAt(i, dummy.matrix);

    dummy.position.set(p.x, 0.35, p.z);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.scale.setScalar(0.001);
    dummy.updateMatrix();
    pools.setMatrixAt(i, dummy.matrix);
  });
  bulbs.instanceMatrix.needsUpdate = true;
  cones.instanceMatrix.needsUpdate = true;
  pools.instanceMatrix.needsUpdate = true;

  // la luminaria averiada: la que protagoniza el relato
  const broken = ordered[Math.min(ordered.length - 1, 6)];
  const alarm = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 7);
    r.position.set(broken.x, 1.4, broken.z);
    group.add(r);
    return r;
  });

  const sb = storyboard({
    group,
    accent,
    axis: (() => {
      const d = streetDirection(city, broken.x, broken.z);
      return Math.atan2(d.z, d.x);
    })(),
    opening: wide([ax, 8, az], { radius: 260, height: 170, speed: 0.012 }),
    slots: [
      { look: [broken.x, 7, broken.z], camAngle: 0.5, spot: [broken.x + 14, 24, broken.z + 12] },
      { look: [broken.x, 7, broken.z], camAngle: 1.6, spot: [broken.x + 26, 46, broken.z - 22] },
      { look: [ax, 6, az], camAngle: 2.7, spot: [ax - 22, 38, az + 20] },
      { look: [broken.x, 7, broken.z], camAngle: 3.9, spot: [broken.x - 16, 28, broken.z - 14] },
    ],
    stories: storyFor('smart-lighting', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    // el alumbrado se cuenta de noche: se ve lo que hace
    mood: { hour: 21.5 },
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const fixed = THREE.MathUtils.clamp((e - DECIDE - 4) / 4, 0, 1);

      // cascada de encendido y regulación: la calle "respira" al 40-100%
      for (let i = 0; i < ordered.length; i++) {
        const on = THREE.MathUtils.clamp((e - 1.5 - i * 0.055) * 2.2, 0, 1);
        const dimmed = 0.55 + Math.sin(t * 0.7 + i) * 0.12;
        const p = ordered[i];
        const out = p === broken && fixed < 1;
        dummy.position.set(p.x, p.y ?? 6.6, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(out ? 0.001 : on);
        dummy.updateMatrix();
        bulbs.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, 6.6, p.z);
        dummy.rotation.set(Math.PI, 0, 0);
        dummy.scale.setScalar(out ? 0.001 : on * dimmed * 1.4);
        dummy.updateMatrix();
        cones.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x, 0.35, p.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.setScalar(out ? 0.001 : on * (0.75 + dimmed * 0.5));
        dummy.updateMatrix();
        pools.setMatrixAt(i, dummy.matrix);
      }
      bulbs.instanceMatrix.needsUpdate = true;
      cones.instanceMatrix.needsUpdate = true;
      pools.instanceMatrix.needsUpdate = true;

      coneMat.opacity = 0.2 + Math.abs(Math.sin(t * 0.8)) * 0.1;
      poolMat.opacity = 0.2 + Math.abs(Math.sin(t * 0.8)) * 0.08;
      bulbMat.emissiveIntensity = 1.1 + Math.sin(t * 2.1) * 0.4;

      alarm.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(0.6 + k * 2.4);
        r.material.opacity = (e > SIGNAL - 1 ? 0.6 : 0) * (1 - k) * (1 - fixed);
      });
    },
  };
}

/**
 * Edificios — el mismo relato dentro de un edificio: una planta gasta de más
 * con las salas vacías, la plataforma lo cruza con la ocupación, se ajusta el
 * clima planta a planta y el consumo baja.
 */
function buildingScene({ solution, city, group, accent }) {
  const [ax, ay, az] = solution.anchor;
  const highlight = highlightBuilding(city, group, accent, ax, az);

  // el edificio, planta a planta: cada bandeja es un nivel y su color dice
  // cómo va de consumo
  const FLOORS = 9;
  const floorH = Math.max(ay / FLOORS, 3.4);
  const floors = [];
  for (let i = 0; i < FLOORS; i++) {
    const mat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      // se leen por encima del volumen: si no, quedan dentro del edificio
      depthTest: false,
    });
    const slab = new THREE.Mesh(new THREE.RingGeometry(34, 39, 56), mat);
    slab.renderOrder = 22;
    slab.rotation.x = -Math.PI / 2;
    slab.position.set(ax, 2 + i * floorH, az);
    group.add(slab);
    floors.push({ slab, mat, load: 0.25 + Math.random() * 0.4 });
  }
  // la planta del problema: gasta de más y está vacía
  const hot = floors[6] ?? floors.at(-1);
  hot.load = 0.95;

  // barrido vertical: el edificio se "lee" de abajo arriba
  const scan = glowRing(accent, 41);
  scan.material.depthTest = false;
  scan.renderOrder = 23;
  scan.position.set(ax, 2, az);
  group.add(scan);

  const hotY = hot.slab.position.y;
  const sb = storyboard({
    group,
    accent,
    scale: 26,
    minDist: 130, // se ve el edificio entero, con sus plantas
    opening: wide([ax, ay * 0.5, az], { radius: 210, height: 150, speed: 0.012 }),
    slots: [
      { look: [ax, hotY, az], camAngle: 0.5, spot: [ax + 30, hotY + 12, az + 24] },
      { look: [ax, hotY, az], camAngle: 1.6, spot: [ax + 34, ay + 30, az - 28] },
      { look: [ax, ay * 0.6, az], camAngle: 2.7, spot: [ax - 30, ay + 16, az + 26] },
      { look: [ax, hotY, az], camAngle: 3.9, spot: [ax - 26, hotY + 10, az - 24] },
    ],
    stories: storyFor('building-management', undefined, LANG),
  });
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const fixed = THREE.MathUtils.clamp((e - DECIDE) / 5, 0, 1);

      // las plantas aparecen de abajo arriba y se colorean por consumo
      floors.forEach((f, i) => {
        const on = THREE.MathUtils.clamp((e - 1.5 - i * 0.22) * 1.6, 0, 1);
        const load = f === hot ? THREE.MathUtils.lerp(0.95, 0.42, fixed) : f.load;
        // solo la planta con problema pesa en el color: el resto acompaña
        f.mat.opacity = on * (f === hot ? 0.34 + load * 0.24 : 0.1 + load * 0.1);
        f.mat.color.set(load > 0.8 ? '#f43f5e' : load > 0.55 ? '#e6a817' : '#38bdf8');
        f.slab.scale.setScalar(0.85 + on * 0.15);
      });

      // el barrido sube por el edificio, como una lectura continua
      const k = (t * 0.16) % 1;
      scan.position.y = 2 + k * (ay + 6);
      scan.material.opacity = 0.5 * Math.sin(k * Math.PI);
      scan.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.12);

      highlight?.update(t, e);
    },
  };
}

/**
 * Grúas inteligentes — la grúa gira, iza y mide. Los sensores que se le montan
 * se ven donde van de verdad: anemómetro en la punta de la pluma, célula de
 * carga en el gancho, encoder de giro en la corona y control en la base.
 */
function craneScene({ solution, city, library, group, accent }) {
  const [ax, ay, az] = solution.anchor;
  const altura = ay || 62;

  const highlight = highlightBuilding(city, group, accent, ax, az);

  // la grúa: modelo real, escalado a la altura del caso
  const modelo = library['crane-tower'];
  const grua = modelo ? instancedFromModel(modelo, 1) : null;
  const pluma = new THREE.Group(); // lo que gira: pluma, gancho y sensores
  pluma.position.set(ax, altura, az);
  group.add(pluma);

  if (grua) {
    const d = new THREE.Object3D();
    d.position.set(ax, 0, az);
    d.rotation.set(0, 0, 0);
    d.scale.setScalar(1);
    d.updateMatrix();
    grua.setMatrixAt(0, d.matrix);
    grua.instanceMatrix.needsUpdate = true;
    group.add(grua);
  } else {
    // si el modelo no cargó, se dibuja una torre esquemática: la escena no
    // se queda coja por un GLB
    const torre = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, altura, 3.4),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 })
    );
    torre.position.set(ax, altura / 2, az);
    group.add(torre);
  }

  // pluma esquemática que gira sobre la torre (el modelo es estático)
  const brazoMat = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.5 });
  const brazo = new THREE.Mesh(new THREE.BoxGeometry(62, 0.7, 1.4), brazoMat);
  brazo.position.set(24, 0, 0);
  pluma.add(brazo);
  const contrapeso = new THREE.Mesh(new THREE.BoxGeometry(10, 2.4, 3), brazoMat);
  contrapeso.position.set(-13, -0.8, 0);
  pluma.add(contrapeso);

  // cable y gancho: suben y bajan con la maniobra
  const cable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 1, 6),
    new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.7 })
  );
  pluma.add(cable);
  const gancho = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.5 })
  );
  pluma.add(gancho);

  // los sensores, cada uno en su sitio
  const sensor = (color) => {
    const s = glowRing(color, 3.4);
    s.rotation.x = 0; // vertical: se ve desde el aire y desde el suelo
    pluma.add(s);
    return s;
  };
  const anemometro = sensor('#38bdf8'); // punta de pluma
  anemometro.position.set(52, 2.2, 0);
  const celula = sensor('#f43f5e'); // gancho
  const corona = glowRing('#10b981', 6);
  corona.rotation.x = -Math.PI / 2;
  corona.position.set(ax, altura - 2, az);
  group.add(corona);

  const contador = new CounterLabel(accent, 'km/h de viento');
  contador.sprite.position.set(ax, altura + 16, az);
  group.add(contador.sprite);

  const sb = storyboard({
    group,
    accent,
    scale: 26,
    minDist: 120,
    opening: wide([ax, altura * 0.6, az], { radius: 230, height: 175, speed: 0.013 }),
    slots: [
      // 1· el suceso, arriba del todo: donde está el anemómetro
      { look: [ax + 30, altura + 2, az], camAngle: 0.5, spot: [ax + 44, altura + 20, az + 20] },
      { look: [ax, altura, az], camAngle: 1.6, spot: [ax + 30, altura + 40, az - 28] },
      { look: [ax, altura * 0.6, az], camAngle: 2.7, spot: [ax - 30, altura + 12, az + 26] },
      { look: [ax, altura * 0.5, az], camAngle: 3.9, spot: [ax - 26, altura - 6, az - 24] },
    ],
    stories: storyFor('smart-crane', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const parada = e > DECIDE && e < DECIDE + 12; // la grúa se detiene al decidir

      // giro de la pluma: se para cuando la plataforma manda parar
      pluma.rotation.y += (parada ? 0 : 0.12) * dt;

      // la maniobra: el gancho sube y baja mientras se trabaja
      const carga = parada ? 0.1 : 0.5 + Math.sin(t * 0.5) * 0.45;
      const largoCable = 6 + carga * (altura - 16);
      cable.scale.set(1, largoCable, 1);
      cable.position.set(42, -largoCable / 2, 0);
      gancho.position.set(42, -largoCable, 0);
      celula.position.set(42, -largoCable, 0);

      // el anemómetro late más fuerte cuanto más viento hay
      const viento = 58 + Math.sin(t * 0.8) * 12 + (e > SIGNAL && e < DECIDE ? 16 : 0);
      contador.set(Math.round(viento));
      contador.update(dt, e > SIGNAL - 2);
      const alarma = viento > 72;
      anemometro.material.color.set(alarma ? '#f43f5e' : '#38bdf8');
      const k = (t * 0.9) % 1;
      anemometro.scale.setScalar(0.7 + k * 1.5);
      anemometro.material.opacity = (alarma ? 0.9 : 0.5) * (1 - k);

      celula.scale.setScalar(0.8 + ((t * 0.6) % 1) * 1.2);
      celula.material.opacity = 0.5 * (1 - ((t * 0.6) % 1));

      corona.material.opacity = 0.18 + Math.abs(Math.sin(t * 0.7)) * 0.16;
      brazoMat.opacity = 0.4 + Math.abs(Math.sin(t * 0.6)) * 0.15;

      highlight?.update(t, e);
    },
  };
}

/**
 * Calidad del aire — la malla de sensores se ve donde está: en los báculos del
 * alumbrado y en las marquesinas del corredor. Sobre ella, una nube que respira
 * y cambia de color según lo que se está midiendo, y una columna de medida en
 * cada punto. Cuando la plataforma decide, el corredor se limpia.
 */
function airScene({ solution, city, group, accent }) {
  const [ax, , az] = solution.anchor;

  // los puntos de medida: farolas reales primero, acera después
  const cerca = (p) => Math.hypot(p.x - ax, p.z - az) < 300;
  const puntos = (city.lampState ?? []).filter(cerca).slice(0, 34);
  const acera = (city.streetPoints ?? []).filter(cerca);
  for (let i = 0; puntos.length < 60 && i < acera.length; i += 6) {
    const p = acera[i];
    if (puntos.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 22)) continue;
    puntos.push({ x: p.x, z: p.z, y: 6.6 });
  }
  if (!puntos.length) puntos.push({ x: ax, z: az, y: 6.6 });

  // el sensor: una cápsula pequeña en lo alto del báculo
  const sensorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: accent,
    emissiveIntensity: 1.1,
    roughness: 0.5,
  });
  const sensores = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.55, 1.1, 4, 8),
    sensorMat,
    puntos.length
  );
  sensores.frustumCulled = false;
  group.add(sensores);

  // columna de medida sobre cada sensor: sube cuanto peor está el aire
  const columnaMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const columnas = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1, true),
    columnaMat,
    puntos.length
  );
  columnas.frustumCulled = false;
  group.add(columnas);

  const dummy = new THREE.Object3D();
  puntos.forEach((p, i) => {
    dummy.position.set(p.x, (p.y ?? 6.6) + 0.9, p.z);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    sensores.setMatrixAt(i, dummy.matrix);
  });
  sensores.instanceMatrix.needsUpdate = true;

  // la nube del corredor: un volumen bajo que cambia de color con la medida
  const nubeMat = new THREE.MeshBasicMaterial({
    color: 0xf43f5e,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const nube = new THREE.Mesh(new THREE.CylinderGeometry(200, 250, 34, 40, 1, true), nubeMat);
  nube.position.set(ax, 18, az);
  group.add(nube);

  // anillos que salen del punto peor medido
  const foco = puntos[Math.min(puntos.length - 1, Math.floor(puntos.length * 0.45))];
  const avisos = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 9);
    r.position.set(foco.x, 2, foco.z);
    group.add(r);
    return r;
  });

  const contador = new CounterLabel(accent, 'µg/m³ de NO₂');
  contador.sprite.position.set(ax, 44, az);
  group.add(contador.sprite);

  const sb = storyboard({
    group,
    accent,
    scale: 26,
    minDist: 120,
    axis: (() => {
      const d = streetDirection(city, ax, az);
      return Math.atan2(d.z, d.x);
    })(),
    opening: wide([ax, 8, az], { radius: 300, height: 190, speed: 0.013 }),
    slots: [
      { look: [foco.x, 8, foco.z], camAngle: 0.5, spot: [foco.x + 16, 30, foco.z + 12] },
      { look: [ax, 10, az], camAngle: 1.6, spot: [ax + 30, 62, az - 26] },
      { look: [ax, 6, az], camAngle: 2.7, spot: [ax - 26, 44, az + 24] },
      { look: [foco.x, 8, foco.z], camAngle: 3.9, spot: [foco.x - 18, 32, foco.z - 16] },
    ],
    stories: storyFor('air-quality', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const limpio = THREE.MathUtils.clamp((e - DECIDE) / 8, 0, 1);

      // la medida: alta mientras dura el episodio, baja cuando se actúa
      const medida = (0.75 - limpio * 0.5) + Math.sin(t * 0.7) * 0.06;
      const color = medida > 0.6 ? '#f43f5e' : medida > 0.42 ? '#e6a817' : '#10b981';
      nubeMat.color.set(color);
      nubeMat.opacity = 0.07 + medida * 0.12;
      nube.scale.setScalar(1 + Math.sin(t * 0.35) * 0.02);
      columnaMat.color.set(color);
      columnaMat.opacity = 0.22 + medida * 0.25;
      sensorMat.emissiveIntensity = 0.8 + Math.abs(Math.sin(t * 1.6)) * 0.8;

      // cada columna sube según su propia lectura: la malla no es uniforme
      puntos.forEach((p, i) => {
        const propio = medida * (0.7 + ((i * 37) % 60) / 100);
        const alto = 3 + propio * 26;
        const entra = THREE.MathUtils.clamp((e - 1 - i * 0.04) * 2, 0, 1);
        dummy.position.set(p.x, (p.y ?? 6.6) + alto / 2, p.z);
        dummy.scale.set(1, Math.max(alto * entra, 0.001), 1);
        dummy.updateMatrix();
        columnas.setMatrixAt(i, dummy.matrix);
      });
      columnas.instanceMatrix.needsUpdate = true;

      avisos.forEach((r, i) => {
        const k = (t * 0.45 + i / 3) % 1;
        r.scale.setScalar(0.7 + k * 2.6);
        r.material.color.set(color);
        r.material.opacity = (e > SIGNAL - 1 ? 0.55 : 0) * (1 - k) * (1 - limpio * 0.8);
      });

      contador.set(Math.round(60 + medida * 200));
      contador.update(dt, e > SIGNAL - 2);
    },
  };
}

/**
 * Taludes — el terreno de una trinchera, instrumentado. Los nodos se ven donde
 * van: inclinómetros repartidos por el talud, células de carga en la fila de
 * anclajes y piezómetros al pie. Las flechas de desplazamiento crecen mientras
 * dura el episodio y se apagan cuando la plataforma decide.
 */
function slopeScene({ solution, city, group, accent }) {
  const [ax, , az] = solution.anchor;
  const dir = streetDirection(city, ax, az); // el talud sigue el eje de la vía
  const ejeX = dir.x;
  const ejeZ = dir.z;
  const perpX = -dir.z;
  const perpZ = dir.x;

  const LARGO = 150; // a lo largo de la trinchera
  const ANCHO = 46; // del pie a la coronación
  const ALTO = 18;

  const punto = (u, v, alto = 0) => [
    ax + ejeX * u + perpX * v,
    alto,
    az + ejeZ * u + perpZ * v,
  ];

  // la cuña del talud: un plano inclinado del pie a la coronación
  const geo = new THREE.PlaneGeometry(LARGO, ANCHO, 24, 10);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = pos.getY(i); // a lo ancho: -ANCHO/2 (pie) → +ANCHO/2 (coronación)
    const k = (v + ANCHO / 2) / ANCHO;
    pos.setZ(i, k * k * ALTO); // perfil cóncavo, como un desmonte real
  }
  geo.computeVertexNormals();
  const taludMat = new THREE.MeshStandardMaterial({
    color: 0x8a7f6d,
    roughness: 0.95,
    transparent: true,
    opacity: 0.9,
  });
  const talud = new THREE.Mesh(geo, taludMat);
  talud.rotation.x = -Math.PI / 2;
  talud.rotation.z = -Math.atan2(ejeZ, ejeX);
  talud.position.set(ax, 0.4, az);
  group.add(talud);

  // los nodos: inclinómetros por el talud y anclajes en dos filas
  const nodos = [];
  for (let i = 0; i < 26; i++) {
    const u = -LARGO / 2 + (LARGO * (i % 13)) / 12;
    const v = i < 13 ? -6 : 12;
    const k = (v + ANCHO / 2) / ANCHO;
    nodos.push({ p: punto(u, v, k * k * ALTO + 1.2), ancla: i >= 13 });
  }
  const nodoMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: accent,
    emissiveIntensity: 1.2,
    roughness: 0.4,
  });
  const nodosMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.3, 1.3, 1.3), nodoMat, nodos.length);
  nodosMesh.frustumCulled = false;
  group.add(nodosMesh);

  // flechas de desplazamiento: crecen con el movimiento medido
  const flechaMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.8 });
  const flechas = new THREE.InstancedMesh(new THREE.ConeGeometry(0.8, 3.4, 8), flechaMat, nodos.length);
  flechas.frustumCulled = false;
  group.add(flechas);

  const dummy = new THREE.Object3D();
  nodos.forEach((n, i) => {
    dummy.position.set(n.p[0], n.p[1], n.p[2]);
    dummy.scale.setScalar(1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    nodosMesh.setMatrixAt(i, dummy.matrix);
  });
  nodosMesh.instanceMatrix.needsUpdate = true;

  // el punto que peor va, con sus anillos
  const foco = nodos[6];
  const avisos = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 8);
    r.position.set(foco.p[0], foco.p[1] - 1, foco.p[2]);
    group.add(r);
    return r;
  });

  const contador = new CounterLabel(accent, 'mm de desplazamiento');
  contador.sprite.position.set(ax, 34, az);
  group.add(contador.sprite);

  const sb = storyboard({
    group,
    accent,
    scale: 26,
    minDist: 110,
    axis: Math.atan2(ejeZ, ejeX),
    opening: wide([ax, 8, az], { radius: 260, height: 165, speed: 0.013 }),
    slots: [
      { look: [foco.p[0], foco.p[1], foco.p[2]], camAngle: 0.5, spot: [foco.p[0] + 14, foco.p[1] + 20, foco.p[2] + 12] },
      { look: [ax, 12, az], camAngle: 1.6, spot: [ax + 26, 52, az - 24] },
      { look: [ax, 6, az], camAngle: 2.7, spot: [ax - 24, 38, az + 22] },
      { look: [foco.p[0], foco.p[1], foco.p[2]], camAngle: 3.9, spot: [foco.p[0] - 16, foco.p[1] + 18, foco.p[2] - 14] },
    ],
    stories: storyFor('slope-monitoring', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    // el episodio es de madrugada, que es cuando se cae el terreno
    mood: { hour: 5.5 },
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const parado = THREE.MathUtils.clamp((e - DECIDE) / 7, 0, 1);
      const mov = (0.85 - parado * 0.7) + Math.sin(t * 0.5) * 0.06;

      const color = mov > 0.55 ? '#f43f5e' : mov > 0.35 ? '#e6a817' : '#10b981';
      flechaMat.color.set(color);
      nodoMat.emissiveIntensity = 0.9 + Math.abs(Math.sin(t * 1.7)) * 0.7;
      taludMat.color.set(mov > 0.55 ? 0x9a7b6d : 0x8a7f6d);

      // cada nodo se mueve lo suyo: el talud no cede de una pieza
      nodos.forEach((n, i) => {
        const propio = mov * (0.5 + ((i * 53) % 70) / 100);
        const entra = THREE.MathUtils.clamp((e - 1 - i * 0.05) * 2, 0, 1);
        const largo = 1.2 + propio * 7;
        dummy.position.set(n.p[0], n.p[1] + largo * 0.6, n.p[2]);
        // apuntando ladera abajo, que es hacia donde se mueve
        dummy.rotation.set(Math.PI / 2.2, Math.atan2(perpX, perpZ), 0);
        dummy.scale.set(1, largo * entra, 1);
        dummy.updateMatrix();
        flechas.setMatrixAt(i, dummy.matrix);
      });
      flechas.instanceMatrix.needsUpdate = true;
      flechaMat.opacity = 0.35 + mov * 0.5;

      avisos.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(0.6 + k * 2.4);
        r.material.color.set(color);
        r.material.opacity = (e > SIGNAL - 1 ? 0.6 : 0) * (1 - k) * (1 - parado * 0.85);
      });

      contador.set(Math.round(mov * 5 * 10) / 10);
      contador.update(dt, e > SIGNAL - 2);
    },
  };
}

/**
 * Inundaciones — una estación de vigilancia en el puente: sensor de nivel sin
 * contacto, pluviómetro y **una cámara de campo que se enciende sola** cuando
 * se supera el umbral. Aquí eso se ve literalmente: el agua sube, la escala de
 * medida se pone en rojo, el monitor de la cámara aparece y la mancha de
 * inundación crece hasta que la plataforma corta el paso.
 */
function floodScene({ solution, city, group, accent }) {
  const [ax, , az] = solution.anchor;
  const dir = streetDirection(city, ax, az); // el cauce sigue el eje del vial
  const ejeX = dir.x;
  const ejeZ = dir.z;
  const perpX = -dir.z;
  const perpZ = dir.x;

  const LARGO = 190;
  const ANCHO = 34;

  // el cauce: una lámina de agua que sube y baja con la medida
  const aguaMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    transparent: true,
    opacity: 0.62,
    roughness: 0.25,
    metalness: 0.1,
  });
  const agua = new THREE.Mesh(new THREE.PlaneGeometry(LARGO, ANCHO, 24, 6), aguaMat);
  agua.rotation.x = -Math.PI / 2;
  agua.rotation.z = -Math.atan2(ejeZ, ejeX);
  agua.position.set(ax, 0.6, az);
  group.add(agua);
  const aguaPos = agua.geometry.attributes.position;
  const aguaBase = Float32Array.from(aguaPos.array);

  // el puente: un tablero cruzando el cauce
  const tablero = new THREE.Mesh(
    new THREE.BoxGeometry(24, 1.6, ANCHO + 22),
    new THREE.MeshStandardMaterial({ color: 0xb9c0cb, roughness: 0.8 })
  );
  tablero.position.set(ax, 8.4, az);
  tablero.rotation.y = Math.atan2(ejeX, ejeZ);
  group.add(tablero);
  [-1, 1].forEach((lado) => {
    const pila = new THREE.Mesh(
      new THREE.BoxGeometry(5, 8.4, 5),
      new THREE.MeshStandardMaterial({ color: 0x9aa2ad, roughness: 0.9 })
    );
    pila.position.set(
      ax + perpX * lado * (ANCHO / 2 + 4),
      4.2,
      az + perpZ * lado * (ANCHO / 2 + 4)
    );
    group.add(pila);
  });

  // la estación: mástil con el sensor de nivel y la cámara
  const estX = ax + perpX * (ANCHO / 2 + 7) + ejeX * 12;
  const estZ = az + perpZ * (ANCHO / 2 + 7) + ejeZ * 12;
  const mastil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 12, 8),
    new THREE.MeshStandardMaterial({ color: 0x3f4a60, roughness: 0.6 })
  );
  mastil.position.set(estX, 6, estZ);
  group.add(mastil);
  const cajaMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: accent,
    emissiveIntensity: 1.2,
    roughness: 0.4,
  });
  const caja = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.4, 1.4), cajaMat);
  caja.position.set(estX, 11, estZ);
  group.add(caja);

  // escala de medida: una regla vertical que se pinta hasta el nivel de agua
  const escalaMat = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const escala = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1), escalaMat);
  escala.position.set(estX + perpX * 1.6, 1, estZ + perpZ * 1.6);
  escala.rotation.y = Math.atan2(ejeX, ejeZ);
  group.add(escala);

  // la mancha: hasta dónde llegaría el agua si sigue subiendo
  const manchaMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.16,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(70, 40), manchaMat);
  mancha.rotation.x = -Math.PI / 2;
  mancha.position.set(ax, 0.5, az);
  group.add(mancha);

  const avisos = [0, 1, 2].map(() => {
    const r = glowRing('#f43f5e', 10);
    r.position.set(estX, 1.2, estZ);
    group.add(r);
    return r;
  });

  const contador = new CounterLabel(accent, 'm de nivel');
  contador.sprite.position.set(ax, 30, az);
  group.add(contador.sprite);

  // la cámara de campo: se enciende sola al superar el umbral
  const monitor = new PovMonitor({ accent, label: 'CÁMARA DE CAMPO · UMBRAL' });
  group.add(monitor.group);

  const sb = storyboard({
    group,
    accent,
    scale: 26,
    minDist: 120,
    axis: Math.atan2(ejeZ, ejeX),
    opening: wide([ax, 8, az], { radius: 280, height: 175, speed: 0.013 }),
    slots: [
      { look: [estX, 10, estZ], camAngle: 0.5, spot: [estX + 14, 26, estZ + 12] },
      { look: [ax, 10, az], camAngle: 1.6, spot: [ax + 28, 54, az - 24] },
      { look: [ax, 6, az], camAngle: 2.7, spot: [ax - 26, 40, az + 22] },
      { look: [estX, 8, estZ], camAngle: 3.9, spot: [estX - 16, 28, estZ - 14] },
    ],
    stories: storyFor('flood-monitoring', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const PLATAFORMA = sb.at[1];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    // la crecida llega de madrugada, con el paso todavía abierto
    mood: { hour: 6 },
    rig: sb.rig,
    panel,
    monitor,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed % sb.total;
      const sube = THREE.MathUtils.clamp((e - 1) / (SIGNAL + 4), 0, 1);
      const cortado = THREE.MathUtils.clamp((e - DECIDE) / 8, 0, 1);
      const nivel = 0.6 + sube * 6.2 - cortado * 4.4; // metros sobre el cauce

      // el agua sube, y su superficie ondula
      agua.position.y = nivel;
      for (let i = 0; i < aguaPos.count; i++) {
        const x = aguaBase[i * 3];
        const y = aguaBase[i * 3 + 1];
        aguaPos.setZ(i, Math.sin(x * 0.08 + t * 1.6) * 0.35 + Math.cos(y * 0.12 + t * 1.1) * 0.25);
      }
      aguaPos.needsUpdate = true;
      const alarma = nivel > 4.2;
      aguaMat.color.set(alarma ? 0x7f1d3a : 0x1d4ed8);
      aguaMat.opacity = 0.55 + Math.abs(Math.sin(t * 0.6)) * 0.1;

      // la regla se pinta hasta el nivel y cambia de color con el umbral
      escala.scale.set(1, Math.max(nivel * 1.6, 0.001), 1);
      escala.position.y = (nivel * 1.6) / 2;
      escalaMat.color.set(alarma ? '#f43f5e' : nivel > 3 ? '#e6a817' : accent);
      escalaMat.opacity = 0.55 + Math.abs(Math.sin(t * 1.3)) * 0.25;

      // la mancha crece con el nivel y se retira cuando se corta el paso
      mancha.scale.setScalar(0.5 + nivel * 0.16);
      manchaMat.color.set(alarma ? '#f43f5e' : '#38bdf8');
      manchaMat.opacity = 0.08 + nivel * 0.022;

      cajaMat.emissiveIntensity = 0.9 + Math.abs(Math.sin(t * 2)) * 0.8;

      avisos.forEach((r, i) => {
        const k = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(0.6 + k * 2.6);
        r.material.opacity = (alarma ? 0.6 : 0) * (1 - k) * (1 - cortado * 0.8);
      });

      contador.set(Math.round(nivel * 10) / 10);
      contador.update(dt, e > SIGNAL - 2);

      /* La cámara de campo no está siempre encendida: la enciende el umbral.
         Es la gracia de la solución, así que aquí se ve encenderse. */
      if (e > PLATAFORMA - 1 && e < DECIDE + 10) monitor.show();
      else monitor.hide?.();
      monitor.aim(estX, 12.5, estZ, Math.atan2(ax - estX, az - estZ), -0.3);
    },
  };
}

/** Icono del KPI según lo que mide: el panel se lee de un vistazo. */
const iconForMetric = (label, industry) => {
  const l = label.toLowerCase();
  if (/ahorro|energ|consumo|kwh/.test(l)) return 'bolt';
  if (/persona|asistent|aforo|pacient|ciudadan/.test(l)) return 'people';
  if (/veh|coche|cami|flota|bus/.test(l)) return 'car';
  if (/tiempo|min|latencia|espera|respuesta/.test(l)) return 'clock';
  if (/alerta|incident|fraude|falsa/.test(l)) return 'alert';
  if (/km|ruta|recorrid/.test(l)) return 'route';
  if (/agua|fuga|litro|lectura|contador|pérdida|perdida/.test(l)) return 'gauge';
  if (/cámara|camara|vídeo|video/.test(l)) return 'camera';
  if (/acceso|entrada|torno|ticket/.test(l)) return 'ticket';
  if (/sistema|integra|disponibilidad/.test(l)) return 'signal';
  if (industry === 'environment') return 'leaf';
  return 'chart';
};

/** Foto real del panel según la industria del caso. */
const PHOTO_BY_INDUSTRY = {
  venues: 'stadium',
  'smart-cities': 'control-room',
  transport: 'bus',
  environment: 'containers',
  buildings: 'building',
};

/**
 * Estadio — el mismo relato en un recinto: el acceso norte se satura, la
 * plataforma lo cruza con aforo y cámaras, decide abrir tornos y el flujo se
 * normaliza. Todo alrededor del propio edificio.
 */
function stadiumScene({ solution, city, group, accent, industry }) {
  const [ax, ay, az] = solution.anchor;
  const r = solution.rigRadius ?? 300;

  const highlight = highlightBuilding(city, group, accent, ax, az);

  // la puerta norte, pegada al propio edificio: `rigRadius` es la distancia de
  // cámara, no el tamaño del recinto, así que se acota a algo creíble
  const gateDist = Math.min(r * 0.3, 105);
  const gate = { x: ax, z: az - gateDist };

  const crowd = glowRing('#f43f5e', 40);
  crowd.position.set(gate.x, 2, gate.z);
  group.add(crowd);

  const waves = [0, 1, 2].map(() => {
    const w = glowRing('#f43f5e', 22);
    w.position.set(gate.x, 2.2, gate.z);
    group.add(w);
    return w;
  });

  const counter = new CounterLabel(accent, 'personas/min');
  counter.sprite.position.set(gate.x, 30, gate.z);
  group.add(counter.sprite);

  /* Tres casuísticas del mismo recinto: gente, energía y seguridad. Se van
     turnando en cada vuelta del relato. */
  const sb = storyboard({
    group,
    accent,
    scale: 30,
    minDist: 190, // el recinto es enorme: si la cámara se acerca, solo se ve pared
    opening: wide([ax, ay * 0.5, az], { radius: r * 1.5, height: 200, speed: 0.012 }),
    slots: [
      { look: [gate.x, 8, gate.z], camAngle: 0.4, spot: [gate.x - 30, 46, gate.z - 24] },
      { look: [ax, ay * 0.7, az], camAngle: 1.5, spot: [ax + 34, ay + 44, az - 34] },
      { look: [gate.x, 8, gate.z], camAngle: 2.6, spot: [gate.x + 30, 50, gate.z + 26] },
      { look: [ax, ay * 0.5, az], camAngle: 3.9, spot: [ax - 34, ay + 30, az + 34] },
    ],
    stories: storyFor('stadium', undefined, LANG),
  });
  const SIGNAL = sb.at[0];
  const DECIDE = sb.at[2];

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      const e = ctx.elapsed;
      const solved = THREE.MathUtils.clamp((e - DECIDE) / 6, 0, 1);

      // el anillo de aglomeración se encoge cuando la decisión surte efecto
      crowd.scale.setScalar(1 - solved * 0.45);
      crowd.material.color.set(solved > 0.6 ? '#10b981' : '#f43f5e');
      crowd.material.opacity = 0.25 + Math.abs(Math.sin(t * 1.2)) * 0.2;

      waves.forEach((w, i) => {
        const k = (t * 0.35 + i / 3) % 1;
        w.scale.setScalar(0.8 + k * 2.6);
        w.material.opacity = (e > SIGNAL - 1 ? 0.5 : 0) * (1 - k) * (1 - solved * 0.7);
      });

      counter.set(Math.round(1240 - solved * 520 + Math.sin(t * 1.6) * 30));
      counter.update(dt, e > SIGNAL - 2);
      highlight?.update(t, e);
    },
  };
}

function defaultScene({ solution, city, group, accent, industry }) {
  const [ax, ay, az] = solution.anchor;

  const rings = [0, 1, 2].map(() => {
    const r = glowRing(accent, 26);
    r.position.set(ax, 1.2, az);
    group.add(r);
    return r;
  });

  const highlight = highlightBuilding(city, group, accent, ax, az);

  /* El mismo relato de cuatro tiempos, aquí visto desde el centro de control:
     algo pasa en la ciudad · llega a la plataforma · se decide · se cierra. */

  const sb = storyboard({
    group,
    accent,
    opening: wide([ax, ay * 0.45, az], { radius: (solution.rigRadius ?? 132) * 2, height: (solution.rigHeight ?? 78) * 2, speed: 0.012 }),
    slots: [
      { look: [ax, ay * 0.6, az], camAngle: 0.5, spot: [ax + 30, ay + 20, az + 26] },
      { look: [ax, ay * 0.8, az], camAngle: 1.6, spot: [ax + 34, ay + 46, az - 30] },
      { look: [ax, ay * 0.5, az], camAngle: 2.7, spot: [ax - 30, ay + 26, az + 28] },
      { look: [ax, ay * 0.6, az], camAngle: 3.9, spot: [ax - 26, ay + 16, az - 26] },
    ],
    stories: storyFor(solution.id, solution.industry, LANG),
  });

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 16, ay + 20, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.1, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.set(ax, (ay + 20) / 2, az);
  group.add(beam);

  const panel = new DataPanel({ ...panelFor(solution, LANG), accent });
  group.add(panel.mesh);

  return {
    rig: sb.rig,
    panel,
    popups: sb.popups,
    update(t, dt, ctx) {
      rings.forEach((r, i) => {
        const p = (t * 0.4 + i / 3) % 1;
        r.scale.setScalar(0.6 + p * 2.6);
        r.material.opacity = 0.5 * (1 - p);
      });
      beam.material.opacity = 0.07 + Math.abs(Math.sin(t * 1.5)) * 0.06;
      highlight?.update(t, ctx.elapsed);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Director                                                            */
/* ------------------------------------------------------------------ */

const SCENE_BY_ID = {
  'urban-security': securityScene,
  'smart-lighting': lightingScene,
  'building-management': buildingScene,
  'smart-crane': craneScene,
  'air-quality': airScene,
  'slope-monitoring': slopeScene,
  'flood-monitoring': floodScene,
  'mobility-fleet': fleetScene,
  'waste-management': wasteScene,
  stadium: stadiumScene,
  'water-metering': waterScene,
};

export function createDirector({ scene, city, traffic, industries, library = {}, onMood, lang = 'es' }) {
  LANG = lang;
  const root = new THREE.Group();
  root.name = 'cinematics';
  scene.add(root);

  let current = null;
  let group = null;
  let shown = false; // el panel aún no ha entrado
  let startedAt = 0; // marca de tiempo real: la escena no depende de los FPS

  const stop = () => {
    if (group) {
      root.remove(group);
      group.traverse((o) => {
        if (o.isMesh || o.isSprite) {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            m?.map?.dispose?.();
            m?.dispose?.();
          });
        }
      });
    }
    current?.panel?.dispose?.();
    current?.monitor?.dispose?.();
    current?.popups?.dispose?.();
    if (current?.mood) onMood?.(null); // se recupera la hora anterior
    group = null;
    current = null;
    startedAt = 0;
  };

  const play = (solution, now = performance.now() / 1000) => {
    stop();
    if (!solution) return null;
    group = new THREE.Group();
    root.add(group);

    const industry = industries?.[solution.industry];
    const accent = industry?.color ?? '#0ea5e9';
    const builder = SCENE_BY_ID[solution.id] ?? defaultScene;

    current = builder({
      solution,
      city,
      traffic,
      library,
      group,
      accent,
      industry: industry?.label ?? 'Operación',
    });
    // el panel no entra a la vez que el rótulo de escena: primero se lee el
    // título y después aparece la instrumentación
    shown = false;
    startedAt = now;
    // ambiente propio de la escena (hora del día), que se restaura al salir
    if (current.mood?.hour !== undefined) onMood?.(current.mood);
    return current.rig;
  };

  const update = (t, dt, camera) => {
    if (!current) return;
    const elapsed = t - startedAt;
    if (!shown && elapsed > 6.6) {
      shown = true;
      current.panel?.show();
      current.monitor?.show();
    }
    current.update?.(t, dt, { elapsed, rig: current.rig });
    current.popups?.update(t, dt, camera, elapsed);
    current.panel?.update(t, dt, camera);
    current.monitor?.update(t, dt, camera);
  };

  /**
   * Renderiza la vista de la cámara CCTV a su textura. Va antes del render
   * principal y oculta los paneles para que no se vean dentro del monitor.
   */
  const renderAuxViews = (gl, scene) => {
    if (!current?.monitor) return;
    const hide = [];
    if (current.panel?.mesh) hide.push(current.panel.mesh);
    if (current.popups) hide.push(...current.popups.sprites);
    current.monitor.renderView(gl, scene, hide);
  };

  return {
    root,
    play,
    stop,
    update,
    renderAuxViews,
    get rig() {
      return current?.rig ?? null;
    },
    get active() {
      return Boolean(current);
    },
  };
}
