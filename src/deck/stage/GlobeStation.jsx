import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneClock, damp, makePulseMaterial, pulseLineGeometry, GOLD } from './fx.jsx';

/**
 * Globo de presencia internacional.
 *
 * QUÉ FALLABA EN LA VERSIÓN ANTERIOR (y cómo se resuelve aquí):
 *
 * 1. El halo atmosférico era una esfera un 14 % mayor que el globo, con la
 *    cámara tan cerca que no cabía en el encuadre: se veía un cuadrado azul
 *    recortado alrededor del globo. Ahora el halo es un 8 % mayor y la
 *    distancia de cámara se calcula a partir del encuadre real (ancho y alto
 *    del lienzo), así que el globo entero cabe también en un móvil vertical.
 * 2. No había geografía: puntos sobre una retícula, sin continentes, así que
 *    no se sabía dónde estaba Barcelona. Ahora los países son reales (Natural
 *    Earth 1:110m horneado en public/geo/world-110m.json).
 * 3. Los marcadores de la cara oculta recibían clics a través del globo (el
 *    sistema de eventos de R3F no tiene en cuenta la oclusión). Ahora la
 *    esfera intercepta y detiene los eventos: solo responde lo que se ve.
 * 4. La rotación estaba desactivada. Ahora se arrastra con inercia.
 * 5. Cada entrada al capítulo montaba un lienzo WebGL nuevo, y una sonda de
 *    compatibilidad creaba otro contexto que nunca se liberaba; sumados al de
 *    la ciudad, al entrar y salir varias veces el navegador acaba tirando el
 *    contexto más antiguo, que es el de la ciudad. Ahora el globo vive en el
 *    lienzo único y persistente del recorrido.
 */

export const GLOBE_CENTER = new THREE.Vector3(0, 0, -160);
const R = 10;
const DEG = Math.PI / 180;

/** Latitud/longitud → punto sobre la esfera (sistema local del globo). */
export function toVec(lat, lon, radius = R) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Giro del globo que pone lat/lon de cara a la cámara (+Z). */
const faceYaw = (lon) => -(lon + 90) * DEG;
const facePitch = (lat) => lat * DEG * 0.85;

/* ------------------------------------------------------------------ */
/* Datos geográficos: se piden una sola vez                            */
/* ------------------------------------------------------------------ */

let worldPromise = null;
export function loadWorld() {
  if (!worldPromise) {
    worldPromise = fetch('/geo/world-110m.json').then((r) => {
      if (!r.ok) throw new Error(`world-110m.json: ${r.status}`);
      return r.json();
    });
    worldPromise.catch(() => {
      worldPromise = null; // se podrá reintentar
    });
  }
  return worldPromise;
}

/* ------------------------------------------------------------------ */
/* Encuadre                                                            */
/* ------------------------------------------------------------------ */

/**
 * Distancia a la que el globo (con su halo) cabe en pantalla con margen, sea
 * cual sea la proporción del lienzo.
 */
export function fitDistance(aspect, fov = 38) {
  const v = (fov / 2) * DEG;
  const h = Math.atan(Math.tan(v) * aspect);
  const half = Math.min(v, h);
  return (R * 1.12) / Math.sin(half * 0.86);
}

/** Pose de cámara del capítulo 2 según el paso y la selección. */
export function globePose(step, selected, aspect) {
  const fit = fitDistance(aspect);
  let k = 1;
  if (step === 1) k = 0.95;
  if (step === 3 && selected) k = 0.78;
  // en pantallas anchas el globo se desplaza a la derecha: el texto va a la izquierda
  const shift = aspect > 1.2 ? -R * 0.55 : 0;
  const lift = aspect > 1.2 ? 0 : -R * 0.35;
  return {
    position: [GLOBE_CENTER.x + shift, GLOBE_CENTER.y + lift + 1.5, GLOBE_CENTER.z + fit * k],
    target: [GLOBE_CENTER.x + shift, GLOBE_CENTER.y + lift, GLOBE_CENTER.z],
  };
}

/* ------------------------------------------------------------------ */
/* Sombreadores                                                        */
/* ------------------------------------------------------------------ */

const MAX_HI = 16;

const dotsVert = /* glsl */ `
  uniform float uReveal;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uHi[${MAX_HI}];
  uniform vec3 uHiCol[${MAX_HI}];
  uniform float uHiAmt[${MAX_HI}];
  uniform float uSel;
  uniform float uWave;
  uniform vec3 uOrigin;
  attribute float aCountry;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 n = normalize(position);
    vec3 col = vec3(0.30, 0.40, 0.58);
    float lift = 0.0;
    for (int i = 0; i < ${MAX_HI}; i++) {
      if (abs(uHi[i] - aCountry) < 0.5) {
        col = mix(col, uHiCol[i], uHiAmt[i]);
        lift = max(lift, uHiAmt[i]);
      }
    }
    if (abs(uSel - aCountry) < 0.5) {
      col = mix(col, vec3(1.0, 0.86, 0.45), 0.6 + 0.4 * sin(uTime * 3.0));
      lift = 1.4;
    }
    // onda de actividad que sale de Barcelona y recorre el planeta
    if (uWave > 0.0) {
      float ang = acos(clamp(dot(n, uOrigin), -1.0, 1.0));
      float band = exp(-pow((ang - uWave) * 9.0, 2.0));
      col += vec3(0.9, 0.62, 0.1) * band * 0.9;
      lift += band;
    }
    vec3 p = position * (1.0 + lift * 0.004);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vec3 vn = normalize(normalMatrix * n);
    float limb = smoothstep(-0.02, 0.35, dot(vn, normalize(-mv.xyz)));
    float shown = step(aRand, uReveal);
    vColor = col;
    vAlpha = limb * shown * (0.55 + 0.45 * min(lift, 1.0));
    gl_PointSize = (1.45 + lift * 0.9) * uPixelRatio * (60.0 / -mv.z);
  }
`;
const dotsFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vColor, a * vAlpha * uFade);
  }
`;

const coreVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const coreFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(1.0 - max(dot(vN, vV), 0.0), 2.6);
    vec3 base = vec3(0.027, 0.047, 0.098) * (0.85 + 0.25 * vN.y);
    vec3 col = base + vec3(0.12, 0.33, 0.72) * f * 0.85 + vec3(0.9, 0.62, 0.1) * f * 0.06;
    gl_FragColor = vec4(col, uFade);
  }
`;
const haloFrag = /* glsl */ `
  uniform float uFade;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float i = pow(max(0.62 - dot(vN, vV), 0.0), 2.4);
    gl_FragColor = vec4(vec3(0.16, 0.42, 0.9) * i * 1.6, i * uFade);
  }
`;

/* ------------------------------------------------------------------ */
/* Marcadores                                                          */
/* ------------------------------------------------------------------ */

function Marker({ place, color, visible, active, isHq, onSelect, clock, label, kindLabel }) {
  const pos = useMemo(() => toVec(place.lat, place.lon, R * 1.004), [place.lat, place.lon]);
  const g = useRef();
  const ringA = useRef();
  const ringB = useRef();
  const beam = useRef();
  const labelRef = useRef();
  const grow = useRef(0);
  const [hover, setHover] = useState(false);
  const world = useMemo(() => new THREE.Vector3(), []);
  const normal = useMemo(() => new THREE.Vector3(), []);
  const toCam = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera }, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    grow.current = damp(grow.current, visible ? 1 : 0, 5, dt);
    const s = grow.current;
    if (g.current) g.current.visible = s > 0.01;
    const t = clock.current;
    const pulse = (t * 0.6 + place.lon * 0.01) % 1;
    const base = (active ? 1.6 : hover ? 1.3 : 1) * s * (isHq ? 1.4 : 1);
    if (ringA.current) {
      ringA.current.scale.setScalar(base * (1 + pulse * 2.6));
      ringA.current.material.opacity = (1 - pulse) * 0.7 * s;
    }
    if (ringB.current) {
      const p2 = (pulse + 0.5) % 1;
      ringB.current.scale.setScalar(base * (1 + p2 * 2.6));
      ringB.current.material.opacity = (1 - p2) * 0.45 * s;
    }
    if (beam.current) {
      beam.current.scale.set(1, s * (active ? 1.25 : 1), 1);
      beam.current.material.opacity = 0.55 * s;
    }
    // la etiqueta solo se ve si el punto mira a la cámara
    if (labelRef.current && g.current) {
      g.current.getWorldPosition(world);
      normal.copy(world).sub(g.current.parent.getWorldPosition(toCam)).normalize();
      toCam.copy(camera.position).sub(world).normalize();
      const facing = normal.dot(toCam);
      labelRef.current.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.4) * 5)) * s);
    }
  });

  return (
    <group ref={g} position={pos} onUpdate={(self) => self.lookAt(0, 0, 0)}>
      <mesh>
        <sphereGeometry args={[isHq ? 0.2 : place.satellite ? 0.08 : 0.13, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh ref={ringA}>
        <ringGeometry args={[0.18, 0.24, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={ringB}>
        <ringGeometry args={[0.18, 0.22, 40]} />
        <meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {isHq && (
        // haz de luz que sale de la sede: el origen de todas las conexiones
        <mesh ref={beam} position={[0, 0, -1.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.12, 3.2, 12, 1, true]} />
          <meshBasicMaterial color={color} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
      {/* diana generosa para el clic y el tacto */}
      <mesh
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!visible) return;
          setHover(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHover(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (visible) onSelect(place.id);
        }}
      >
        <sphereGeometry args={[0.7, 8, 8]} />
      </mesh>
      {label && (
        <Html center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }} position={[0, 0, -0.5]}>
          <div ref={labelRef} className={`globe-label${isHq ? ' globe-label--hq' : ''}${active ? ' is-active' : ''}${place.labelSide ? ` globe-label--${place.labelSide}` : ''}`} style={{ '--k': `#${new THREE.Color(color).getHexString()}` }}>
            {place.flag && <img className="globe-label__flag" src={`/assets/flags/${place.flag}.svg`} alt="" />}
            <span className="globe-label__text">
              <b>{place.label ?? place.name}</b>
              <span>{kindLabel}</span>
            </span>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Arcos desde la sede                                                 */
/* ------------------------------------------------------------------ */

function Arc({ from, to, color, visible, clock, phase }) {
  const { geometry, material } = useMemo(() => {
    const a = toVec(from.lat, from.lon, R * 1.005);
    const b = toVec(to.lat, to.lon, R * 1.005);
    const lift = 1 + a.distanceTo(b) / (R * 2.4);
    const mid = a.clone().add(b).normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    return {
      geometry: pulseLineGeometry(curve.getPoints(64)),
      material: makePulseMaterial(color, { speed: 0.28, phase, opacity: 2 }),
    };
  }, [from.lat, from.lon, to.lat, to.lon, color, phase]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const u = material.uniforms;
    u.uOpacity.value = 2;
    u.uDraw.value = damp(u.uDraw.value, visible ? 1.001 : 0, visible ? 1.6 : 6, dt);
    u.uTime.value = clock.current;
  });

  return <line geometry={geometry} material={material} renderOrder={3} />;
}

/* ------------------------------------------------------------------ */
/* Estación                                                            */
/* ------------------------------------------------------------------ */

export default function GlobeStation({ active, step, places, kinds, selectedId, onSelect, paused, lowPower, countryHighlights }) {
  const [world, setWorld] = useState(null);
  const [failed, setFailed] = useState(false);
  const clock = useSceneClock(paused);
  const root = useRef();
  const spin = useRef();
  const fade = useRef(0);
  const reveal = useRef(0);
  const wave = useRef(-1);
  const rot = useRef({ yaw: faceYaw(2), pitch: facePitch(41), vYaw: 0, vPitch: 0, dragUntil: 0, userYaw: 0, userPitch: 0, base: faceYaw(2) });
  const drag = useRef(null);
  const { gl } = useThree();

  useEffect(() => {
    let alive = true;
    loadWorld()
      .then((w) => alive && setWorld(w))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const hq = places.find((p) => p.kind === 'sede') ?? places[0];
  const countryIndex = useMemo(() => {
    const m = new Map();
    world?.countries.forEach((c, i) => m.set(Number(c.id), i));
    return m;
  }, [world]);

  /* --- puntos de tierra ------------------------------------------- */
  const dots = useMemo(() => {
    if (!world) return null;
    const n = world.dots.length / 3;
    const pos = new Float32Array(n * 3);
    const country = new Float32Array(n);
    const rand = new Float32Array(n);
    // en equipos modestos, uno de cada dos puntos: se lee igual
    const stride = lowPower ? 2 : 1;
    let k = 0;
    for (let i = 0; i < n; i += stride) {
      const v = toVec(world.dots[i * 3], world.dots[i * 3 + 1], R * 1.002);
      pos.set([v.x, v.y, v.z], k * 3);
      country[k] = world.dots[i * 3 + 2];
      rand[k] = Math.random();
      k++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, k * 3), 3));
    g.setAttribute('aCountry', new THREE.BufferAttribute(country.subarray(0, k), 1));
    g.setAttribute('aRand', new THREE.BufferAttribute(rand.subarray(0, k), 1));
    return g;
  }, [world, lowPower]);

  const dotsMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uReveal: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uHi: { value: new Array(MAX_HI).fill(-1) },
          uHiCol: { value: Array.from({ length: MAX_HI }, () => new THREE.Color()) },
          uHiAmt: { value: new Array(MAX_HI).fill(0) },
          uSel: { value: -1 },
          uWave: { value: -1 },
          uOrigin: { value: toVec(41.39, 2.17, 1) },
          uFade: { value: 0 },
        },
        vertexShader: dotsVert,
        fragmentShader: dotsFrag,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  /* --- contornos: todos tenues, el país elegido en dorado ------------ */
  const coast = useMemo(() => {
    if (!world) return null;
    const pts = [];
    for (const ring of world.coast) {
      for (let i = 1; i + 3 < ring.length; i += 2) {
        const a = toVec(ring[i], ring[i + 1], R * 1.001);
        const b = toVec(ring[i + 2], ring[i + 3], R * 1.001);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [world]);

  const selectedPlace = places.find((p) => p.id === selectedId);
  const selCountry = selectedPlace?.iso != null ? countryIndex.get(selectedPlace.iso) ?? -1 : -1;

  const selCoast = useMemo(() => {
    if (!world || selCountry < 0) return null;
    const pts = [];
    for (const ring of world.coast) {
      if (ring[0] !== selCountry) continue;
      for (let i = 1; i + 3 < ring.length; i += 2) {
        const a = toVec(ring[i], ring[i + 1], R * 1.004);
        const b = toVec(ring[i + 2], ring[i + 3], R * 1.004);
        pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [world, selCountry]);

  const coreMat = useMemo(
    () => new THREE.ShaderMaterial({ uniforms: { uFade: { value: 0 } }, vertexShader: coreVert, fragmentShader: coreFrag, transparent: true }),
    []
  );
  const haloMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uFade: { value: 0 } },
        vertexShader: coreVert,
        fragmentShader: haloFrag,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const coastMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#4a6ea8', transparent: true, opacity: 0, depthWrite: false }), []);
  const selMat = useMemo(() => new THREE.LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }), []);

  useEffect(
    () => () => {
      [dots, coast, selCoast].forEach((g) => g?.dispose());
      [dotsMat, coreMat, haloMat, coastMat, selMat].forEach((m) => m.dispose());
    },
    [dots, coast, selCoast, dotsMat, coreMat, haloMat, coastMat, selMat]
  );

  /* --- países resaltados según el paso ------------------------------ */
  useEffect(() => {
    const u = dotsMat.uniforms;
    const list = countryHighlights.filter((h) => h.fromStep <= step).slice(0, MAX_HI);
    for (let i = 0; i < MAX_HI; i++) {
      const h = list[i];
      u.uHi.value[i] = h ? countryIndex.get(h.iso) ?? -1 : -1;
      if (h) u.uHiCol.value[i].set(h.color);
    }
  }, [countryHighlights, step, countryIndex, dotsMat]);

  /* --- arrastre con inercia ---------------------------------------- */
  useEffect(() => {
    const el = gl.domElement;
    const move = (e) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      d.x = e.clientX;
      d.y = e.clientY;
      const r = rot.current;
      r.vYaw = dx * 0.0055;
      r.vPitch = dy * 0.004;
      r.userYaw += r.vYaw;
      r.userPitch = THREE.MathUtils.clamp(r.userPitch + r.vPitch, -0.9, 0.9);
      d.moved += Math.abs(dx) + Math.abs(dy);
    };
    const up = () => {
      if (drag.current) rot.current.dragUntil = performance.now() + 3500;
      drag.current = null;
      el.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.style.cursor = '';
    };
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    const r = rot.current;

    fade.current = damp(fade.current, active ? 1 : 0, active ? 1.8 : 4, dt);
    if (root.current) root.current.visible = fade.current > 0.01;
    if (!root.current?.visible) return;

    // el globo «emerge»: los puntos se encienden al azar
    reveal.current = damp(reveal.current, active && world ? 1.01 : 0, 1.1, dt);

    // orientación objetivo según el paso
    let goalYaw;
    let goalPitch;
    const now = performance.now();
    const autoSpin = !paused && !drag.current && now > r.dragUntil;
    if (step === 3 && selectedPlace) {
      goalYaw = faceYaw(selectedPlace.lon);
      goalPitch = facePitch(selectedPlace.lat);
      r.userYaw = damp(r.userYaw, 0, 1.2, dt);
      r.userPitch = damp(r.userPitch, 0, 1.2, dt);
    } else if (step >= 1) {
      // tras 1,5 s de pausa sobre Europa, el globo gira hacia el este y va
      // descubriendo Oriente Medio, África, Asia y, al completar la vuelta,
      // América: las oficinas aparecen una tras otra mientras se habla
      if (r.spinStep !== step) {
        r.spinStep = step;
        r.spinFrom = clock.current;
        if (step === 1) r.base = faceYaw(24);
      }
      const held = clock.current - r.spinFrom < 1.5;
      if (autoSpin && !held) r.base -= dt * 0.085;
      goalYaw = r.base;
      goalPitch = facePitch(step === 1 ? 22 : 18);
    } else {
      r.spinStep = 0;
      goalYaw = faceYaw(2);
      goalPitch = facePitch(38);
      r.base = goalYaw;
    }
    // inercia tras soltar
    if (!drag.current) {
      r.userYaw += r.vYaw;
      r.userPitch = THREE.MathUtils.clamp(r.userPitch + r.vPitch, -0.9, 0.9);
      r.vYaw *= Math.exp(-4 * dt);
      r.vPitch *= Math.exp(-4 * dt);
    }
    let dy = goalYaw + r.userYaw - r.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy)); // siempre por el camino corto
    r.yaw += dy * (1 - Math.exp(-2.4 * dt));
    r.pitch = damp(r.pitch, goalPitch + r.userPitch, 2.4, dt);
    if (spin.current) spin.current.rotation.set(r.pitch, r.yaw, 0, 'XYZ');

    // uniformes
    const f = fade.current;
    coreMat.uniforms.uFade.value = f;
    haloMat.uniforms.uFade.value = f;
    const u = dotsMat.uniforms;
    u.uFade.value = f;
    u.uReveal.value = reveal.current;
    u.uTime.value = t;
    u.uSel.value = step === 3 ? selCountry : -1;
    for (let i = 0; i < MAX_HI; i++) u.uHiAmt.value[i] = damp(u.uHiAmt.value[i], u.uHi.value[i] >= 0 ? 1 : 0, 2, dt);
    // onda de actividad: en el paso 2, cada 5 s sale una desde Barcelona
    if (step === 2 && !paused) {
      wave.current = (t % 5) / 5 * Math.PI;
      u.uWave.value = wave.current;
    } else {
      u.uWave.value = -1;
    }
    coastMat.opacity = f * 0.22;
    selMat.opacity = f * (0.75 + Math.sin(t * 3) * 0.2);
  });

  if (failed) return null;

  const visibleIds = new Set(
    places
      .filter((p) => p.kind === 'sede' || (p.kind !== 'proyecto' ? step >= 1 : step >= 2))
      .map((p) => p.id)
  );

  return (
    <group ref={root} position={GLOBE_CENTER.toArray()}>
      <mesh material={haloMat} scale={1.08} renderOrder={0}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
      <group ref={spin}>
        {/* la esfera intercepta los eventos: lo que queda detrás no responde */}
        <mesh
          material={coreMat}
          renderOrder={1}
          onPointerDown={(e) => {
            e.stopPropagation();
            drag.current = { x: e.clientX, y: e.clientY, moved: 0 };
            rot.current.vYaw = 0;
            rot.current.vPitch = 0;
            gl.domElement.style.cursor = 'grabbing';
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerOver={(e) => {
            e.stopPropagation();
            gl.domElement.style.cursor = 'grab';
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = '';
          }}
        >
          <sphereGeometry args={[R, 64, 64]} />
        </mesh>
        {coast && <lineSegments geometry={coast} material={coastMat} renderOrder={2} />}
        {selCoast && step === 3 && <lineSegments geometry={selCoast} material={selMat} renderOrder={4} />}
        {dots && <points geometry={dots} material={dotsMat} renderOrder={3} frustumCulled={false} />}

        {/* las oficinas satélite de la sede (a pocos km) no llevan arco: sería un punto */}
        {places
          .filter((p) => p.id !== hq.id && !p.satellite)
          .map((p, i) => (
            <Arc key={p.id} from={hq} to={p} color={kinds[p.kind]?.color ?? '#e6a817'} visible={visibleIds.has(p.id)} clock={clock} phase={i * 0.13} />
          ))}
        {places.map((p) => (
          <Marker
            key={p.id}
            place={p}
            isHq={p.id === hq.id}
            color={kinds[p.kind]?.color ?? '#e6a817'}
            visible={visibleIds.has(p.id)}
            active={selectedId === p.id}
            onSelect={onSelect}
            clock={clock}
            label={
              active &&
              (selectedId === p.id ||
                p.id === hq.id ||
                (!selectedId && !p.satellite && ((step === 1 && p.kind === 'oficina') || (step === 2 && p.kind === 'proyecto' && p.projects?.length))))
            }
            kindLabel={kinds[p.kind]?.label}
          />
        ))}
      </group>
    </group>
  );
}
