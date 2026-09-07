import * as THREE from 'three';

/**
 * Sistema de planos.
 *
 * Antes cada escena tenía un único encuadre y la cámara se quedaba orbitando.
 * Ahora una escena es una **secuencia de planos** —general, aproximación,
 * detalle— con enlaces suaves entre ellos, como una pieza montada.
 *
 * Tipos de plano:
 *   orbit  · gira alrededor de un punto
 *   dolly  · travelling recto de A a B mirando a un punto
 *   follow · la escena escribe posición y objetivo cada frame (persecución)
 *   push   · empuje hacia el objetivo cerrando el campo de visión
 */

const V = new THREE.Vector3();

/** Normaliza un rig antiguo (un solo encuadre) a una lista de planos. */
export function toShotList(rig) {
  if (!rig) return null;
  if (rig.shots) return rig;
  return { shots: [{ ...rig, duration: Infinity }], intro: rig.intro ?? 2.6 };
}

/** Duración acumulada hasta cada plano, para saber cuál toca. */
function shotAt(shots, elapsed) {
  let acc = 0;
  for (let i = 0; i < shots.length; i++) {
    const d = shots[i].duration ?? Infinity;
    if (elapsed < acc + d || i === shots.length - 1) {
      return { shot: shots[i], index: i, local: elapsed - acc, start: acc };
    }
    acc += d;
  }
  return { shot: shots.at(-1), index: shots.length - 1, local: elapsed, start: 0 };
}

/** Posición y objetivo de un plano en un instante dado. */
export function evaluateShot(shot, local, out = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: null }) {
  const ease = (k) => 1 - Math.pow(1 - Math.min(Math.max(k, 0), 1), 2.4);

  if (shot.mode === 'hold') {
    // plano fijo: ni órbita ni deriva. Si la tarjeta se lee, la cámara no se
    // mueve; es la regla que hace legible el relato.
    out.position.set(shot.position[0], shot.position[1], shot.position[2]);
    out.target.set(shot.target[0], shot.target[1], shot.target[2]);
    out.fov = shot.fov ?? null;
    return out;
  }

  if (shot.mode === 'follow') {
    out.position.set(shot.position[0], shot.position[1], shot.position[2]);
    out.target.set(shot.target[0], shot.target[1], shot.target[2]);
    out.fov = shot.fov ?? null;
    return out;
  }

  if (shot.mode === 'dolly' || shot.mode === 'push') {
    const k = ease(local / (shot.travel ?? shot.duration ?? 12));
    out.position.set(
      THREE.MathUtils.lerp(shot.from[0], shot.to[0], k),
      THREE.MathUtils.lerp(shot.from[1], shot.to[1], k),
      THREE.MathUtils.lerp(shot.from[2], shot.to[2], k)
    );
    out.target.set(shot.target[0], shot.target[1], shot.target[2]);
    // el empuje cierra ligeramente el campo: comprime la perspectiva
    out.fov = shot.mode === 'push' ? THREE.MathUtils.lerp(shot.fovFrom ?? 46, shot.fovTo ?? 36, k) : shot.fov ?? null;
    return out;
  }

  // órbita
  const angle = (shot.startAngle ?? 0) + local * (shot.speed ?? 0.05) * Math.PI * 2;
  out.position.set(
    shot.center[0] + Math.cos(angle) * shot.radius,
    shot.center[1] + shot.height,
    shot.center[2] + Math.sin(angle) * shot.radius
  );
  out.target.set(shot.center[0], shot.center[1], shot.center[2]);
  out.fov = shot.fov ?? null;
  return out;
}

const A = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: null };
const B = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: null };

/**
 * Estado de cámara para un instante de la secuencia, con enlace suave entre
 * planos consecutivos (nada de saltos bruscos a mitad de escena).
 */
export function evaluateSequence(sequence, elapsed, out = { position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 42 }) {
  const { shots } = sequence;
  // el montaje puede repetirse con el ciclo del relato: la reunión dura más
  // que la secuencia y la escena tiene que seguir contando
  let time = elapsed;
  if (sequence.loop) {
    const total = shots.reduce((a, s2) => a + (s2.duration ?? 0), 0);
    if (total > 1) time = elapsed % total;
  }
  const { shot, index, local, start } = shotAt(shots, time);
  evaluateShot(shot, local, A);

  const blend = shot.blend ?? 1.1;
  const prev = shots[index - 1];
  if (prev && local < blend) {
    // el plano anterior sigue vivo un instante y se funde con el nuevo
    const prevLocal = (prev.duration ?? 0) + local;
    evaluateShot(prev, prevLocal, B);
    const k = local / blend;
    const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    out.position.copy(B.position).lerp(A.position, eased);
    out.target.copy(B.target).lerp(A.target, eased);
    out.fov = A.fov ?? B.fov ?? null;
  } else {
    out.position.copy(A.position);
    out.target.copy(A.target);
    out.fov = A.fov;
  }
  out.index = index;
  out.local = local;
  out.start = start;
  return out;
}

/* ------------------------------------------------------------------ */
/* Constructores de planos, para que las escenas se lean bien           */
/* ------------------------------------------------------------------ */

/** Plano general: órbita amplia y lenta. */
export const wide = (center, { radius = 420, height = 260, speed = 0.02, duration = 5.5 } = {}) => ({
  mode: 'orbit',
  center,
  radius,
  height,
  speed,
  duration,
});

/** Aproximación: empuje recto hacia el sujeto cerrando el campo. */
export const pushIn = (from, to, target, { duration = 7, fovFrom = 48, fovTo = 34 } = {}) => ({
  mode: 'push',
  from,
  to,
  target,
  duration,
  travel: duration,
  fovFrom,
  fovTo,
});

/** Plano fijo: la cámara se queda quieta el tiempo que dure. */
export const hold = (position, target, { duration = 6, fov = null, blend = 1.6 } = {}) => ({
  mode: 'hold',
  position,
  target,
  duration,
  fov,
  blend,
});

/** Travelling lateral por un eje (calle, fachada, vía). */
export const dolly = (from, to, target, { duration = 9 } = {}) => ({
  mode: 'dolly',
  from,
  to,
  target,
  duration,
  travel: duration,
});

/** Plano de detalle: órbita cerrada, el que se queda al final. */
export const detail = (center, { radius = 130, height = 78, speed = 0.045 } = {}) => ({
  mode: 'orbit',
  center,
  radius,
  height,
  speed,
  duration: Infinity,
});

/** Punto a media distancia sobre un eje, útil para componer planos. */
export const along = (origin, dir, dist, height) => [
  origin[0] + dir.x * dist,
  height,
  origin[1] !== undefined && origin.length === 2 ? origin[1] + dir.z * dist : origin[2] + dir.z * dist,
];

export { V };
