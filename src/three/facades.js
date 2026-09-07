import * as THREE from 'three';

/**
 * Fachadas.
 *
 * La versión anterior tileaba una ventana pequeña y muy contrastada, y de lejos
 * los edificios parecían un gofre. Aquí se dibuja un módulo de fachada con las
 * proporciones reales del Eixample —planta de 3,3 m, hueco vertical alto,
 * balcón con barandilla y línea de forjado— con poco contraste, y se varía en
 * una rejilla de 4×4 módulos para que la repetición no se note.
 */

const BAY_W = 4.0; // ancho de un módulo de fachada, en metros
const FLOOR_H = 3.3; // altura de planta

export const FACADE_SCALE = { bay: BAY_W, floor: FLOOR_H };

/** Paleta de la piedra y el estuco del Eixample. */
const STONE = [
  [216, 203, 178],
  [206, 194, 172],
  [223, 213, 192],
  [198, 183, 160],
  [212, 199, 176],
];

const rnd = (() => {
  let s = 987654321;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
})();

function drawBay(ctx, x0, y0, w, h, opts) {
  const { stone, balcony, shutter } = opts;

  // muro
  ctx.fillStyle = `rgb(${stone[0]}, ${stone[1]}, ${stone[2]})`;
  ctx.fillRect(x0, y0, w, h);

  // grano fino de la piedra
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(0,0,0,${rnd() * 0.035})`;
    ctx.fillRect(x0 + rnd() * w, y0 + rnd() * h, 2 + rnd() * 3, 1 + rnd() * 2);
  }
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(255,255,255,${rnd() * 0.05})`;
    ctx.fillRect(x0 + rnd() * w, y0 + rnd() * h, 3 + rnd() * 4, 1);
  }

  // línea de forjado con su sombra: es lo que da escala al edificio
  ctx.fillStyle = 'rgba(120,106,88,0.35)';
  ctx.fillRect(x0, y0, w, Math.max(2, h * 0.022));
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(x0, y0 + h * 0.022, w, Math.max(1, h * 0.012));

  // hueco: alto y estrecho, como los balcones del Eixample
  const ww = w * 0.34;
  const wh = h * 0.6;
  const wx = x0 + (w - ww) / 2;
  const wy = y0 + h * 0.2;

  // jamba
  ctx.fillStyle = 'rgba(238,232,218,0.9)';
  ctx.fillRect(wx - w * 0.035, wy - h * 0.03, ww + w * 0.07, wh + h * 0.05);

  // cristal con reflejo de cielo arriba
  const g = ctx.createLinearGradient(wx, wy, wx, wy + wh);
  if (shutter) {
    g.addColorStop(0, '#8d8873');
    g.addColorStop(1, '#6f6a58');
  } else {
    g.addColorStop(0, '#9fb3c6');
    g.addColorStop(0.45, '#63788c');
    g.addColorStop(1, '#46586a');
  }
  ctx.fillStyle = g;
  ctx.fillRect(wx, wy, ww, wh);

  // partición de la carpintería
  ctx.strokeStyle = 'rgba(245,240,230,0.75)';
  ctx.lineWidth = Math.max(1, w * 0.012);
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.stroke();

  if (balcony) {
    // losa y barandilla de forja
    const by = wy + wh;
    ctx.fillStyle = 'rgba(160,148,128,0.95)';
    ctx.fillRect(wx - w * 0.1, by, ww + w * 0.2, h * 0.035);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(wx - w * 0.1, by + h * 0.035, ww + w * 0.2, h * 0.03);
    ctx.strokeStyle = 'rgba(58,54,48,0.8)';
    ctx.lineWidth = Math.max(1, w * 0.01);
    const bars = 7;
    for (let i = 0; i <= bars; i++) {
      const bx = wx - w * 0.08 + ((ww + w * 0.16) * i) / bars;
      ctx.beginPath();
      ctx.moveTo(bx, by - h * 0.14);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(wx - w * 0.09, by - h * 0.14);
    ctx.lineTo(wx + ww + w * 0.09, by - h * 0.14);
    ctx.stroke();
  }

  return { wx, wy, ww, wh };
}

/**
 * Genera el par de texturas de fachada: color y emisión (ventanas encendidas).
 * La rejilla es de 4×4 módulos, así que un metro de fachada equivale a
 * 1 / (4 · BAY_W) de textura en horizontal.
 */
export function makeFacadeTextures() {
  const T = 4;
  const CELL = 256;
  const S = T * CELL;

  const albedo = document.createElement('canvas');
  albedo.width = albedo.height = S;
  const a = albedo.getContext('2d');

  const emissive = document.createElement('canvas');
  emissive.width = emissive.height = S;
  const e = emissive.getContext('2d');
  e.fillStyle = '#000';
  e.fillRect(0, 0, S, S);

  for (let ty = 0; ty < T; ty++) {
    for (let tx = 0; tx < T; tx++) {
      const stone = STONE[(tx + ty * T) % STONE.length].map((c) => c + Math.round((rnd() - 0.5) * 10));
      const balcony = rnd() > 0.35;
      const shutter = rnd() > 0.78;
      const x0 = tx * CELL;
      const y0 = ty * CELL;
      const w = drawBay(a, x0, y0, CELL, CELL, { stone, balcony, shutter });

      // de noche solo se enciende una parte de las ventanas, y en tonos cálidos
      if (!shutter && rnd() > 0.45) {
        const warm = rnd() > 0.25;
        const inten = 0.5 + rnd() * 0.4;
        e.fillStyle = warm
          ? `rgba(255, ${(196 + rnd() * 40) | 0}, ${(140 + rnd() * 40) | 0}, ${inten})`
          : `rgba(${(170 + rnd() * 40) | 0}, 220, 255, ${inten * 0.8})`;
        e.fillRect(w.wx, w.wy, w.ww, w.wh);
      }
    }
  }

  const mk = (canvas) => {
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    return t;
  };

  return { map: mk(albedo), emissiveMap: mk(emissive) };
}

/**
 * UVs de un edificio.
 *  - caras verticales: tileado por metros reales de fachada
 *  - cubierta: coordenadas dentro de la tesela de ortofoto, para que el tejado
 *    sea la foto aérea de ese tejado
 */
export function makeUVGenerator(offsetU, tile) {
  const tileW = tile ? tile.maxX - tile.minX : 1;
  const tileH = tile ? tile.maxZ - tile.minZ : 1;

  return {
    generateTopUV(_geometry, vertices, ia, ib, ic) {
      const uv = (i) => {
        const wx = vertices[i * 3];
        const wz = -vertices[i * 3 + 1]; // la forma se creó con la Z invertida
        if (!tile) return new THREE.Vector2(wx * 0.05, wz * 0.05);
        return new THREE.Vector2((wx - tile.minX) / tileW, (tile.maxZ - wz) / tileH);
      };
      return [uv(ia), uv(ib), uv(ic)];
    },
    generateSideWallUV(_geometry, vertices, ia, ib, ic) {
      const ax = vertices[ia * 3];
      const ay = vertices[ia * 3 + 1];
      const az = vertices[ia * 3 + 2];
      const bx = vertices[ib * 3];
      const by = vertices[ib * 3 + 1];
      const cz = vertices[ic * 3 + 2];
      const len = Math.hypot(bx - ax, by - ay);
      const u0 = offsetU;
      const u1 = offsetU + len / (BAY_W * 4);
      const v0 = az / (FLOOR_H * 4);
      const v1 = cz / (FLOOR_H * 4);
      return [
        new THREE.Vector2(u0, v0),
        new THREE.Vector2(u1, v0),
        new THREE.Vector2(u1, v1),
        new THREE.Vector2(u0, v1),
      ];
    },
  };
}
