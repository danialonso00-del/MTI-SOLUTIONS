import * as THREE from 'three';

/**
 * Panel de datos de una escena.
 *
 * Es un canvas que se repinta a 10 Hz y se muestra en 3D delante de la cámara,
 * siempre en la misma franja de pantalla. Diseño: una foto real del activo a la
 * izquierda, tres cifras grandes, una serie temporal y dos líneas de registro.
 * Nada se solapa: cada bloque tiene su carril.
 */

const W = 1160;
const H = 480;
const PAD = 34;
const PHOTO_W = 392;

const FONT = (weight, size, family = "'Inter', system-ui, sans-serif") => `${weight} ${size}px ${family}`;
const MONO = (weight, size) => `${weight} ${size}px 'JetBrains Mono', ui-monospace, monospace`;

/**
 * Iconos de KPI dibujados en el propio canvas (trazo, 24×24 como los de la UI).
 * Cada caso de uso elige el suyo: energía, personas, vehículos, alertas…
 */
const ICONS = {
  people: (c) => {
    c.arc(9, 8, 3.2, 0, Math.PI * 2);
    c.moveTo(3.5, 19);
    c.arc(9, 15.5, 5.5, Math.PI, Math.PI * 2, true);
    c.moveTo(16, 9.5);
    c.arc(17.5, 8, 2.4, 0, Math.PI * 2);
    c.moveTo(13.5, 19);
    c.arc(17.5, 16, 4, Math.PI, Math.PI * 2, true);
  },
  car: (c) => {
    c.moveTo(3, 15);
    c.lineTo(3, 11.5);
    c.lineTo(5.5, 6.5);
    c.lineTo(18.5, 6.5);
    c.lineTo(21, 11.5);
    c.lineTo(21, 15);
    c.lineTo(3, 15);
    c.moveTo(3, 11.8);
    c.lineTo(21, 11.8);
    c.moveTo(6.5, 15);
    c.lineTo(6.5, 17.5);
    c.moveTo(17.5, 15);
    c.lineTo(17.5, 17.5);
  },
  bus: (c) => {
    c.moveTo(5, 4.5);
    c.lineTo(19, 4.5);
    c.lineTo(19, 17);
    c.lineTo(5, 17);
    c.lineTo(5, 4.5);
    c.moveTo(5, 11);
    c.lineTo(19, 11);
    c.moveTo(7.5, 20);
    c.lineTo(7.5, 17);
    c.moveTo(16.5, 20);
    c.lineTo(16.5, 17);
  },
  alert: (c) => {
    c.moveTo(12, 3.5);
    c.lineTo(21.5, 19.5);
    c.lineTo(2.5, 19.5);
    c.closePath();
    c.moveTo(12, 9);
    c.lineTo(12, 14);
    c.moveTo(12, 16.8);
    c.lineTo(12, 17);
  },
  bolt: (c) => {
    c.moveTo(13.5, 2.5);
    c.lineTo(5, 13.5);
    c.lineTo(11.5, 13.5);
    c.lineTo(10.5, 21.5);
    c.lineTo(19, 10.5);
    c.lineTo(12.5, 10.5);
    c.closePath();
  },
  clock: (c) => {
    c.arc(12, 12, 8.5, 0, Math.PI * 2);
    c.moveTo(12, 7);
    c.lineTo(12, 12.5);
    c.lineTo(16, 14.5);
  },
  route: (c) => {
    c.arc(6, 6, 2.6, 0, Math.PI * 2);
    c.moveTo(20.6, 18);
    c.arc(18, 18, 2.6, 0, Math.PI * 2);
    c.moveTo(6, 8.6);
    c.lineTo(6, 13);
    c.bezierCurveTo(6, 17, 10, 18, 15.4, 18);
  },
  leaf: (c) => {
    c.moveTo(4.5, 19.5);
    c.bezierCurveTo(4.5, 9, 11, 4.5, 19.5, 4.5);
    c.bezierCurveTo(19.5, 14, 14, 19.5, 4.5, 19.5);
    c.moveTo(4.5, 19.5);
    c.lineTo(14, 10);
  },
  camera: (c) => {
    c.moveTo(3.5, 8);
    c.lineTo(15, 8);
    c.lineTo(15, 14.5);
    c.lineTo(3.5, 14.5);
    c.closePath();
    c.moveTo(15, 10);
    c.lineTo(20.5, 7.5);
    c.lineTo(20.5, 15);
    c.lineTo(15, 12.5);
    c.moveTo(6, 14.5);
    c.lineTo(6, 20);
  },
  shield: (c) => {
    c.moveTo(12, 3);
    c.lineTo(19.5, 6);
    c.lineTo(19.5, 12);
    c.bezierCurveTo(19.5, 16.5, 16, 19.5, 12, 21);
    c.bezierCurveTo(8, 19.5, 4.5, 16.5, 4.5, 12);
    c.lineTo(4.5, 6);
    c.closePath();
  },
  gauge: (c) => {
    c.arc(12, 15, 8, Math.PI, Math.PI * 2);
    c.moveTo(12, 15);
    c.lineTo(16.5, 10.5);
  },
  chart: (c) => {
    c.moveTo(3.5, 20);
    c.lineTo(20.5, 20);
    c.moveTo(6.5, 20);
    c.lineTo(6.5, 13);
    c.moveTo(12, 20);
    c.lineTo(12, 6.5);
    c.moveTo(17.5, 20);
    c.lineTo(17.5, 10);
  },
  building: (c) => {
    c.moveTo(4, 20.5);
    c.lineTo(4, 6);
    c.lineTo(13, 3.5);
    c.lineTo(13, 20.5);
    c.moveTo(13, 10);
    c.lineTo(20, 12);
    c.lineTo(20, 20.5);
    c.moveTo(2.5, 20.5);
    c.lineTo(21.5, 20.5);
  },
  ticket: (c) => {
    c.moveTo(3.5, 8.5);
    c.lineTo(20.5, 8.5);
    c.lineTo(20.5, 11);
    c.bezierCurveTo(19, 11, 19, 13.5, 20.5, 13.5);
    c.lineTo(20.5, 16);
    c.lineTo(3.5, 16);
    c.lineTo(3.5, 13.5);
    c.bezierCurveTo(5, 13.5, 5, 11, 3.5, 11);
    c.closePath();
  },
  signal: (c) => {
    c.arc(12, 14, 2.2, 0, Math.PI * 2);
    c.moveTo(8, 10.5);
    c.arc(12, 14, 5.4, Math.PI * 1.25, Math.PI * 1.75);
    c.moveTo(5, 8);
    c.arc(12, 14, 9.2, Math.PI * 1.2, Math.PI * 1.8);
  },
};

/** Dibuja un icono de 24×24 escalado y centrado en (x, y). */
function drawIcon(ctx, name, x, y, size, color, width = 2) {
  const path = ICONS[name];
  if (!path) return;
  const k = size / 24;
  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);
  ctx.scale(k, k);
  ctx.strokeStyle = color;
  ctx.lineWidth = width / k;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path(ctx);
  ctx.stroke();
  ctx.restore();
}

/** Caché de fotos: se comparten entre escenas. */
const photoCache = new Map();
function loadPhoto(key) {
  if (!key) return null;
  if (photoCache.has(key)) return photoCache.get(key);
  const img = new Image();
  img.src = `/photos/${key}.jpg`;
  const entry = { img, ready: false };
  img.onload = () => {
    entry.ready = true;
  };
  img.onerror = () => {
    entry.failed = true;
  };
  photoCache.set(key, entry);
  return entry;
}

export class DataPanel {
  /**
   * @param {object} opts
   * @param {string} opts.title    rótulo del panel
   * @param {string} opts.subtitle línea secundaria (ubicación o activo)
   * @param {string} opts.accent   color de acento (#rrggbb)
   * @param {string} opts.photo    clave de foto en /public/photos
   * @param {Array}  opts.metrics  hasta 3 { label, value, suffix, live, jitter }
   * @param {string} opts.chart    'line' | 'bars' | 'gauge'
   * @param {Array}  opts.rows     hasta 2 { text, tone }
   */
  constructor({ title, subtitle = '', accent = '#0ea5e9', photo = null, metrics = [], chart = 'line', rows = [] } = {}) {
    Object.assign(this, { title, subtitle, accent, metrics, chart, rows });
    this.photo = loadPhoto(photo);

    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d');

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 8;

    this.baseWidth = 100;
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.baseWidth, (this.baseWidth * H) / W),
      new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: false,
      })
    );
    this.mesh.renderOrder = 30;

    this.series = Array.from({ length: 44 }, (_, i) => 0.45 + Math.sin(i * 0.4) * 0.12);
    this.bars = Array.from({ length: 14 }, () => 0.3 + Math.random() * 0.55);
    this.opacity = 0;
    this.target = 0;
    this.appear = 0;
    this.redrawIn = 0;

    // el panel ocupa siempre la misma fracción de pantalla, en la franja libre
    this.anchor = { dist: 130, right: -0.12, up: 0.19, widthFraction: 0.34 };
  }

  show() {
    this.target = 1;
  }
  hide() {
    this.target = 0;
  }

  update(t, dt, camera) {
    this.opacity += (this.target - this.opacity) * Math.min(1, dt * 3.5);
    this.mesh.material.opacity = this.opacity;
    this.mesh.visible = this.opacity > 0.01;
    if (!this.mesh.visible) return;

    this.appear = Math.min(1, this.appear + dt * 0.8);

    if (camera) {
      this.mesh.quaternion.copy(camera.quaternion);
      const { dist, right, up, widthFraction } = this.anchor;
      const halfW = Math.tan((camera.fov * Math.PI) / 360) * dist * camera.aspect;
      this.mesh.scale.setScalar((halfW * 2 * widthFraction) / this.baseWidth);
      const q = camera.quaternion;
      const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(q);
      const rgt = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
      const upv = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      this.mesh.position
        .copy(camera.position)
        .addScaledVector(fwd, dist)
        .addScaledVector(rgt, right * dist)
        .addScaledVector(upv, up * dist);
    }

    // la serie avanza ~8 veces por segundo
    this.acc = (this.acc ?? 0) + dt;
    if (this.acc > 0.13) {
      this.acc = 0;
      const last = this.series.at(-1);
      this.series.push(THREE.MathUtils.clamp(last + (Math.random() - 0.48) * 0.14, 0.15, 0.92));
      this.series.shift();
      this.bars = this.bars.map((b) => THREE.MathUtils.clamp(b + (Math.random() - 0.5) * 0.1, 0.18, 1));
    }

    // repintado a 10 Hz: a 60 fps no aporta nada y cuesta mucho
    this.redrawIn -= dt;
    if (this.redrawIn <= 0) {
      this.redrawIn = 0.1;
      this.draw(t);
      this.texture.needsUpdate = true;
    }
  }

  /* ---------------------------------------------------------------- */

  draw(t) {
    const { ctx, accent } = this;
    const reveal = ease(this.appear);
    ctx.clearRect(0, 0, W, H);

    // ---- fondo -----------------------------------------------------
    ctx.fillStyle = 'rgba(7, 11, 20, 0.9)';
    round(ctx, 0, 0, W, H, 22);
    ctx.fill();
    ctx.strokeStyle = rgba(accent, 0.4);
    ctx.lineWidth = 2;
    round(ctx, 1, 1, W - 2, H - 2, 22);
    ctx.stroke();
    // filo superior de acento
    ctx.fillStyle = rgba(accent, 0.9);
    round(ctx, 22, 0, W - 44, 4, 2);
    ctx.fill();

    const contentX = PAD + PHOTO_W + 30;
    const contentW = W - contentX - PAD;

    // ---- foto real del activo --------------------------------------
    const photoY = PAD + 54;
    const photoH = H - photoY - PAD;
    ctx.save();
    round(ctx, PAD, photoY, PHOTO_W, photoH, 14);
    ctx.clip();
    if (this.photo?.ready) {
      const img = this.photo.img;
      const scale = Math.max(PHOTO_W / img.width, photoH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.globalAlpha = reveal;
      ctx.drawImage(img, PAD + (PHOTO_W - dw) / 2, photoY + (photoH - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
      // velo para que el texto de encima siempre se lea
      const grad = ctx.createLinearGradient(0, photoY, 0, photoY + photoH);
      grad.addColorStop(0, 'rgba(7,11,20,0.15)');
      grad.addColorStop(1, 'rgba(7,11,20,0.85)');
      ctx.fillStyle = grad;
      ctx.fillRect(PAD, photoY, PHOTO_W, photoH);
    } else {
      ctx.fillStyle = 'rgba(148,163,184,0.09)';
      ctx.fillRect(PAD, photoY, PHOTO_W, photoH);
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(148,163,184,0.22)';
    ctx.lineWidth = 1.5;
    round(ctx, PAD, photoY, PHOTO_W, photoH, 14);
    ctx.stroke();

    // rótulo sobre la foto
    if (this.subtitle) {
      ctx.fillStyle = '#e8eef7';
      ctx.font = FONT(600, 21);
      ctx.textBaseline = 'alphabetic';
      wrap(ctx, this.subtitle, PAD + 18, photoY + photoH - 24, PHOTO_W - 36, 24, 2);
    }

    // ---- cabecera ---------------------------------------------------
    ctx.textBaseline = 'middle';
    const pulse = 0.45 + Math.abs(Math.sin(t * 2.2)) * 0.55;
    ctx.fillStyle = rgba(accent, pulse);
    ctx.beginPath();
    ctx.arc(PAD + 9, PAD + 22, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f4f7fb';
    ctx.font = FONT(650, 24);
    ctx.fillText(this.title, PAD + 28, PAD + 22);

    ctx.font = FONT(600, 15);
    ctx.fillStyle = rgba(accent, 0.95);
    ctx.textAlign = 'right';
    ctx.fillText('EN VIVO', W - PAD - 20, PAD + 22);
    ctx.fillStyle = rgba(accent, pulse);
    ctx.beginPath();
    ctx.arc(W - PAD - 6, PAD + 22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';

    // ---- cifras -----------------------------------------------------
    const metrics = this.metrics.slice(0, 3);
    const colW = contentW / Math.max(metrics.length, 1);
    const my = PAD + 104;
    metrics.forEach((m, i) => {
      if (i / metrics.length > reveal) return;
      const x = contentX + i * colW;

      // chip con el icono del KPI
      if (m.icon) {
        ctx.fillStyle = rgba(accent, 0.14);
        round(ctx, x, my - 44, 34, 34, 10);
        ctx.fill();
        drawIcon(ctx, m.icon, x + 17, my - 27, 21, accent, 1.9);
      }

      ctx.fillStyle = 'rgba(148,163,184,0.85)';
      ctx.font = FONT(600, 14);
      ctx.fillText(m.label.toUpperCase(), x + (m.icon ? 44 : 0), my - 22);

      const v = m.live ? m.value + Math.round(Math.sin(t * (1.1 + i * 0.4)) * (m.jitter ?? 2)) : m.value;
      ctx.fillStyle = accent;
      ctx.font = MONO(700, 40);
      ctx.fillText(`${v}${m.suffix ?? ''}`, x, my + 24);
    });

    // ---- gráfico ----------------------------------------------------
    const gx = contentX;
    const gy = my + 62;
    const gw = contentW;
    const gh = 118;

    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(gx, gy + (gh / 2) * i);
      ctx.lineTo(gx + gw, gy + (gh / 2) * i);
      ctx.stroke();
    }

    if (this.chart === 'bars') {
      const n = this.bars.length;
      const bw = (gw / n) * 0.58;
      for (let i = 0; i < n; i++) {
        if (i / n > reveal) break;
        const h = this.bars[i] * gh;
        const x = gx + (gw * i) / n + (gw / n - bw) / 2;
        ctx.fillStyle = rgba(accent, 0.3 + this.bars[i] * 0.55);
        round(ctx, x, gy + gh - h, bw, h, 3);
        ctx.fill();
      }
    } else if (this.chart === 'gauge') {
      const cx = gx + gw / 2;
      const cy = gy + gh;
      const r = gh * 0.92;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(148,163,184,0.14)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * 2);
      ctx.stroke();
      const v = 0.58 + Math.sin(t * 0.6) * 0.22;
      ctx.strokeStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI, Math.PI * (1 + v * reveal));
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#f4f7fb';
      ctx.font = MONO(700, 34);
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(v * 100)}%`, cx, cy - 30);
      ctx.textAlign = 'left';
    } else {
      const n = this.series.length;
      const cut = Math.max(2, Math.floor(n * reveal));
      const px = (i) => gx + (gw * i) / (n - 1);
      const py = (i) => gy + gh - this.series[i] * gh;

      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      for (let i = 1; i < cut; i++) ctx.lineTo(px(i), py(i));
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.lineTo(px(cut - 1), gy + gh);
      ctx.lineTo(px(0), gy + gh);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, gy, 0, gy + gh);
      fill.addColorStop(0, rgba(accent, 0.28));
      fill.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(px(cut - 1), py(cut - 1), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(accent, 0.25);
      ctx.beginPath();
      ctx.arc(px(cut - 1), py(cut - 1), 12 + Math.sin(t * 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ---- registro ---------------------------------------------------
    let ry = gy + gh + 40;
    this.rows.slice(0, 2).forEach((row, i) => {
      if ((i + 1) / 3 > reveal) return;
      const alert = row.tone === 'alert';
      const blink = alert && Math.sin(t * 3.4) > -0.2;
      ctx.fillStyle = alert ? (blink ? '#fb7185' : '#7f1d2c') : rgba(accent, 0.85);
      ctx.beginPath();
      ctx.arc(gx + 6, ry - 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = alert ? '#fecdd3' : 'rgba(219,229,241,0.9)';
      ctx.font = FONT(500, 18);
      ctx.fillText(clip(ctx, row.text, gw - 30), gx + 24, ry - 6);
      ry += 30;
    });
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.texture.dispose();
  }
}

/* ------------------------------------------------------------------ */

const ease = (k) => 1 - Math.pow(1 - Math.min(k, 1), 3);

function round(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function rgba(hex, alpha) {
  const c = new THREE.Color(hex);
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

/** Recorta el texto que no cabe, con puntos suspensivos. */
function clip(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 4 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
  return `${out}…`;
}

/** Texto en varias líneas, de abajo hacia arriba. */
function wrap(ctx, text, x, bottomY, maxWidth, lineHeight, maxLines) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const shown = lines.slice(-maxLines);
  shown.forEach((l, i) => ctx.fillText(l, x, bottomY - (shown.length - 1 - i) * lineHeight));
}
