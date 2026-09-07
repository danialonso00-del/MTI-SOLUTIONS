import * as THREE from 'three';

/**
 * Avisos en escena.
 *
 * Pequeñas tarjetas que brotan del propio sitio donde pasa algo —una persona
 * detectada, un contenedor lleno, un acceso saturado— con su icono, su hora y
 * una barra de vida. Aparecen escalonadas mientras se cuenta el caso de uso, se
 * apilan sin taparse y se retiran solas.
 */

/* La tarjeta se dibuja en un lienzo grande: cabe el texto de verdad —los
   titulares de venta son largos— sin encogerlo hasta lo ilegible ni cortarlo. */
const W = 620;
const H = 168;

/* Las tarjetas viven en el mundo y NO se recolocan por pantalla: cualquier
   corrección por fotograma las hacía temblar mientras la cámara se movía. Es
   la cámara la que se planta delante de cada una (planos `hold`). */

const TONES = {
  info: { bar: '#38bdf8', text: '#e8f4ff' },
  ok: { bar: '#10b981', text: '#dcfce7' },
  warn: { bar: '#f59e0b', text: '#fef3c7' },
  alert: { bar: '#f43f5e', text: '#ffe4e6' },
};

/* Iconos de trazo, en una rejilla de 24×24 como el resto de la aplicación. */
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
    c.closePath();
    c.moveTo(6.5, 15);
    c.lineTo(6.5, 17.5);
    c.moveTo(17.5, 15);
    c.lineTo(17.5, 17.5);
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
  bin: (c) => {
    c.moveTo(5, 7);
    c.lineTo(19, 7);
    c.moveTo(6.5, 7);
    c.lineTo(7.6, 20.5);
    c.lineTo(16.4, 20.5);
    c.lineTo(17.5, 7);
    c.moveTo(9.5, 7);
    c.lineTo(9.5, 4.2);
    c.lineTo(14.5, 4.2);
    c.lineTo(14.5, 7);
    c.moveTo(10.5, 10.5);
    c.lineTo(10.5, 17);
    c.moveTo(13.5, 10.5);
    c.lineTo(13.5, 17);
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
  bolt: (c) => {
    c.moveTo(13.5, 2.5);
    c.lineTo(5, 13.5);
    c.lineTo(11.5, 13.5);
    c.lineTo(10.5, 21.5);
    c.lineTo(19, 10.5);
    c.lineTo(12.5, 10.5);
    c.closePath();
  },
  check: (c) => {
    c.arc(12, 12, 9, 0, Math.PI * 2);
    c.moveTo(7.8, 12.2);
    c.lineTo(10.8, 15.4);
    c.lineTo(16.4, 8.8);
  },
  signal: (c) => {
    c.arc(12, 14, 2.2, 0, Math.PI * 2);
    c.moveTo(8, 10.5);
    c.arc(12, 14, 5.4, Math.PI * 1.25, Math.PI * 1.75);
    c.moveTo(5, 8);
    c.arc(12, 14, 9.2, Math.PI * 1.2, Math.PI * 1.8);
  },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Escribe un texto en una línea, encogiéndolo un poco si hace falta. Solo si
 * aun así no cabe se corta: antes se montaba encima de la chapa del paso.
 */
function textoAjustado(ctx, texto, x, y, maxAncho, { peso = 700, base = 30, min = 19 } = {}) {
  const fuente = (n) => `${peso} ${n}px 'Inter', system-ui, sans-serif`;
  let tam = base;
  ctx.font = fuente(tam);
  while (ctx.measureText(texto).width > maxAncho && tam > min) {
    tam -= 1;
    ctx.font = fuente(tam);
  }
  let salida = texto;
  if (ctx.measureText(salida).width > maxAncho) {
    while (salida.length > 4 && ctx.measureText(`${salida}…`).width > maxAncho) {
      salida = salida.slice(0, -1);
    }
    salida = `${salida.trimEnd()}…`;
  }
  ctx.fillText(salida, x, y);
}

/** Parte un texto en varias líneas por palabras, hasta un máximo. */
function textoEnLineas(ctx, texto, x, y, maxAncho, { peso = 500, tam = 20, alto = 26, maxLineas = 2 } = {}) {
  ctx.font = `${peso} ${tam}px 'Inter', system-ui, sans-serif`;
  const palabras = texto.split(' ');
  const lineas = [];
  let actual = '';
  for (const palabra of palabras) {
    const prueba = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > maxAncho && actual) {
      lineas.push(actual);
      actual = palabra;
      if (lineas.length === maxLineas) {
        actual = '';
        break;
      }
    } else {
      actual = prueba;
    }
  }
  if (lineas.length < maxLineas && actual) lineas.push(actual);

  // si algo se ha quedado fuera, la última línea lo indica
  if (lineas.join(' ').length < texto.length) {
    let ultima = lineas[lineas.length - 1] ?? '';
    while (ultima.length > 4 && ctx.measureText(`${ultima}…`).width > maxAncho) ultima = ultima.slice(0, -1);
    lineas[lineas.length - 1] = `${ultima.trimEnd()}…`;
  }
  lineas.forEach((l, i) => ctx.fillText(l, x, y + i * alto));
  return lineas.length;
}

function drawCard(ctx, { title, sub, icon, tone, life, clock, step, kind }) {
  const t = TONES[tone] ?? TONES.info;
  ctx.clearRect(0, 0, W, H);

  // cuerpo
  ctx.fillStyle = 'rgba(7, 11, 20, 0.92)';
  roundRect(ctx, 6, 6, W - 12, H - 12, 18);
  ctx.fill();
  ctx.strokeStyle = `${t.bar}66`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // banda de color
  ctx.fillStyle = t.bar;
  roundRect(ctx, 6, 6, 9, H - 12, 5);
  ctx.fill();

  // chip del icono
  ctx.fillStyle = `${t.bar}26`;
  roundRect(ctx, 32, 44, 64, 64, 18);
  ctx.fill();
  ctx.save();
  ctx.translate(47, 59);
  ctx.scale(34 / 24, 34 / 24);
  ctx.strokeStyle = t.bar;
  ctx.lineWidth = 1.9 * (24 / 34);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  (ICONS[icon] ?? ICONS.alert)(ctx);
  ctx.stroke();
  ctx.restore();

  /* Primero se dibuja lo de la derecha —chapa del paso y hora— y se guarda
     cuánto ocupa: el título y el subtítulo se escriben en el hueco que queda,
     nunca por debajo. */
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  let libreTitulo = W - 26;
  let libreSub = W - 26;

  if (step) {
    const etiqueta = `${step}/4 · ${(kind ?? '').toUpperCase()}`;
    ctx.font = "700 15px 'Inter', system-ui, sans-serif";
    const ancho = ctx.measureText(etiqueta).width + 24;
    ctx.fillStyle = `${t.bar}26`;
    roundRect(ctx, W - 30 - ancho, 22, ancho, 28, 14);
    ctx.fill();
    ctx.fillStyle = t.bar;
    ctx.fillText(etiqueta, W - 42, 37);

    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = "600 15px 'JetBrains Mono', ui-monospace, monospace";
    ctx.fillText(clock, W - 30, 66);

    // el título nunca invade la columna de la derecha
    libreTitulo = W - 30 - ancho - 18;
    libreSub = W - 30 - 18;
  } else {
    ctx.fillStyle = 'rgba(148,163,184,0.75)';
    ctx.font = "600 17px 'JetBrains Mono', ui-monospace, monospace";
    libreTitulo = W - 30 - ctx.measureText(clock).width - 18;
    libreSub = W - 30 - 18;
    ctx.fillText(clock, W - 30, 38);
  }

  ctx.textAlign = 'left';
  ctx.fillStyle = t.text;
  textoAjustado(ctx, title, 116, 62, libreTitulo - 116, { peso: 700, base: 30, min: 19 });

  ctx.fillStyle = 'rgba(203,213,225,0.82)';
  textoEnLineas(ctx, sub, 116, 100, libreSub - 116, { peso: 500, tam: 20, alto: 26, maxLineas: 2 });

  // barra de vida
  const anchoVida = W - 116 - 30;
  ctx.fillStyle = 'rgba(148,163,184,0.16)';
  roundRect(ctx, 116, H - 32, anchoVida, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = t.bar;
  roundRect(ctx, 116, H - 32, anchoVida * Math.max(life, 0), 5, 2.5);
  ctx.fill();
}

class Popup {
  constructor(event) {
    this.event = event;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
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
    this.sprite.renderOrder = 33;
    // la vida se mide con el reloj de la escena, no acumulando dt: si el equipo
    // baja de fotogramas el aviso no se queda colgado en pantalla
    this.bornAt = null;
    this.age = 0;
    this.ttl = event.ttl ?? 11; // da tiempo a leerlo en voz alta
    this.redrawIn = 0;
    this.slot = 0;

    // hilo de datos: une el punto donde ocurre con la tarjeta, y un pulso lo
    // recorre. Es lo que hace legible el relato "esto pasa · esto llega".
    this.link = null;
    if (event.link) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const mat = new THREE.LineBasicMaterial({
        color: event.linkColor ?? 0x38bdf8,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      });
      this.link = new THREE.Line(geo, mat);
      this.link.renderOrder = 32;
      this.pulse = new THREE.Mesh(
        new THREE.SphereGeometry(1, 12, 8),
        new THREE.MeshBasicMaterial({
          color: event.linkColor ?? 0x38bdf8,
          transparent: true,
          opacity: 0,
          depthTest: false,
          depthWrite: false,
        })
      );
      this.pulse.renderOrder = 32;
    }
  }

  update(t, dt, camera, scale, elapsed) {
    if (this.bornAt === null) this.bornAt = elapsed;
    this.age = elapsed - this.bornAt;
    const life = 1 - this.age / this.ttl;

    // entrada rápida, salida algo más lenta
    const appear = Math.min(this.age / 0.32, 1);
    const eased = 1 - Math.pow(1 - appear, 3);
    const out = life < 0.12 ? Math.max(life / 0.12, 0) : 1;
    this.material.opacity = eased * out;

    // tamaño fijo en metros: la cámara ya viene encuadrada a la distancia
    // adecuada, así que la tarjeta no cambia de tamaño ni salta
    const p0 = this.event.follow ? this.event.follow() : this.event.position;
    const dist = camera
      ? Math.hypot(camera.position.x - p0[0], camera.position.y - p0[1], camera.position.z - p0[2])
      : 200;
    const w = scale * (this.event.size ?? 1);
    const h = w * (H / W);
    // brota desde abajo y se asienta
    const rise = (1 - eased) * -0.35 * h;
    this.sprite.scale.set(w * (0.94 + eased * 0.06), h * (0.94 + eased * 0.06), 1);

    this.sprite.position.set(p0[0], p0[1] + rise + this.slot * h * 1.16, p0[2]);

    if (this.link) {
      const a = this.event.link;
      const from = typeof a === 'function' ? a() : a;
      const pos = this.link.geometry.attributes.position;
      pos.setXYZ(0, from[0], from[1], from[2]);
      pos.setXYZ(1, this.sprite.position.x, this.sprite.position.y - h * 0.4, this.sprite.position.z);
      pos.needsUpdate = true;
      this.link.geometry.computeBoundingSphere();
      this.link.material.opacity = this.material.opacity * (0.35 + Math.abs(Math.sin(t * 2.2)) * 0.3);

      // el pulso sube del suceso a la tarjeta cada 1,2 s: se ve la dirección
      // del dato, que es lo que cuenta el relato
      const k = ((this.age % 1.2) / 1.2) ** 0.75;
      this.pulse.position.set(
        THREE.MathUtils.lerp(from[0], this.sprite.position.x, k),
        THREE.MathUtils.lerp(from[1], this.sprite.position.y - h * 0.4, k),
        THREE.MathUtils.lerp(from[2], this.sprite.position.z, k)
      );
      // crece al salir y se apaga al llegar
      this.pulse.scale.setScalar(Math.max(dist * 0.007, 0.7) * (0.6 + Math.sin(k * Math.PI) * 0.8));
      this.pulse.material.opacity = this.material.opacity * Math.sin(k * Math.PI) * 0.95;
    }

    this.redrawIn -= dt;
    if (this.redrawIn <= 0) {
      this.redrawIn = 0.2;
      const secs = Math.floor(t) % 60;
      const mins = Math.floor(t / 60) % 60;
      drawCard(this.ctx, {
        ...this.event,
        life,
        clock: `08:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      });
      this.texture.needsUpdate = true;
    }
    return this.age < this.ttl;
  }

  dispose() {
    this.texture.dispose();
    this.material.dispose();
    this.link?.geometry.dispose();
    this.link?.material.dispose();
    this.pulse?.geometry.dispose();
    this.pulse?.material.dispose();
  }
}

/**
 * Cola de avisos de una escena.
 * @param {object} opts
 * @param {THREE.Group} opts.group  grupo de la escena
 * @param {Array} opts.events       [{ at, title, sub, icon, tone, position, ttl }]
 * @param {number} opts.scale       ancho de la tarjeta en metros
 */
export function createPopupFeed({ group, events = [], sets = null, scale = 44, pause = 16 }) {
  // `sets` son varias tandas de avisos: al repetirse el ciclo se cuenta la
  // siguiente, así el mismo caso enseña casuísticas distintas sin repetirse
  const tandas = (sets ?? [events]).map((e) => [...e].sort((a, b) => a.at - b.at));
  let tanda = 0;
  let pending = tandas[0];
  const active = [];
  let next = 0;
  // el ciclo se repite: una reunión dura más que la secuencia de avisos y la
  // escena tiene que seguir viva mientras se explica
  const cycle = pending.length ? pending.at(-1).at + pause : 0;
  let cycleStart = 0;

  return {
    // los avisos no deben verse dentro del monitor de la cámara
    get sprites() {
      return active.flatMap((p) => (p.link ? [p.sprite, p.link, p.pulse] : [p.sprite]));
    },
    update(t, dt, camera, elapsed) {
      // saca los avisos que ya toca mostrar
      while (next < pending.length && elapsed - cycleStart >= pending[next].at) {
        const popup = new Popup(pending[next]);
        group.add(popup.sprite);
        if (popup.link) group.add(popup.link, popup.pulse);
        active.push(popup);
        next++;
      }
      if (next >= pending.length && cycle > 0 && elapsed - cycleStart >= cycle) {
        cycleStart += cycle;
        next = 0;
        tanda = (tanda + 1) % tandas.length;
        pending = tandas[tanda];
      }

      // los que comparten sitio se apilan en vez de superponerse
      const buckets = new Map();
      for (const popup of active) {
        const pos = popup.event.follow ? popup.event.follow() : popup.event.position;
        const key = pos.map((n) => Math.round(n / 40)).join(',');
        const slot = buckets.get(key) ?? 0;
        popup.slot = slot;
        buckets.set(key, slot + 1);
      }

      for (let i = active.length - 1; i >= 0; i--) {
        const alive = active[i].update(t, dt, camera, scale, elapsed);
        if (!alive) {
          group.remove(active[i].sprite);
          if (active[i].link) group.remove(active[i].link, active[i].pulse);
          active[i].dispose();
          active.splice(i, 1);
        }
      }
    },
    dispose() {
      active.forEach((p) => {
        group.remove(p.sprite);
        if (p.link) group.remove(p.link, p.pulse);
        p.dispose();
      });
      active.length = 0;
    },
  };
}
