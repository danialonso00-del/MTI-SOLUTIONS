import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Ambiente común a todas las escenas del recorrido: un campo de partículas que
 * deriva despacio y líneas de datos que lo cruzan. Todo el movimiento se
 * calcula en la GPU a partir de un único uniforme de tiempo, así que cuesta lo
 * mismo con 1.500 partículas que con 4.000.
 */

export const GOLD = new THREE.Color('#e6a817');
export const GOLD_SOFT = new THREE.Color('#f6d074');
export const STEEL = new THREE.Color('#6d86b3');
export const CYAN = new THREE.Color('#38bdf8');

/** Reloj de escena que se congela en pausa, sin saltos al reanudar. */
export function useSceneClock(paused) {
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!paused) t.current += Math.min(dt, 0.1);
  });
  return t;
}

/* ------------------------------------------------------------------ */
/* Campo de partículas                                                 */
/* ------------------------------------------------------------------ */

const fieldVert = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSize;
  attribute float aSeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    // deriva lenta y distinta para cada partícula
    p.x += sin(uTime * 0.07 + aSeed * 6.28) * 1.6;
    p.y += cos(uTime * 0.09 + aSeed * 12.1) * 1.1;
    p.z += sin(uTime * 0.05 + aSeed * 3.7) * 1.4;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
    vAlpha = twinkle * smoothstep(160.0, 20.0, -mv.z);
    vColor = aColor;
    gl_PointSize = uSize * uPixelRatio * (0.6 + aSeed) * (40.0 / -mv.z);
  }
`;

const fieldFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
  }
`;

export function ParticleField({ count = 2600, paused, opacity = 1, bounds = [260, 70, 260], center = [0, 0, -40] }) {
  const clock = useSceneClock(paused);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      pos[i * 3] = center[0] + (Math.random() - 0.5) * bounds[0];
      pos[i * 3 + 1] = center[1] + (Math.random() - 0.5) * bounds[1];
      pos[i * 3 + 2] = center[2] + (Math.random() - 0.5) * bounds[2];
      // una de cada ocho, dorada: la energía de MTI entre el azul acero
      tmp.copy(Math.random() < 0.12 ? GOLD : STEEL).multiplyScalar(0.7 + Math.random() * 0.5);
      tmp.toArray(col, i * 3);
      seed[i] = Math.random();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, bounds, center]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uSize: { value: 2.4 },
          uOpacity: { value: opacity },
        },
        vertexShader: fieldVert,
        fragmentShader: fieldFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, dt) => {
    material.uniforms.uTime.value = clock.current;
    const u = material.uniforms.uOpacity;
    u.value += (opacity - u.value) * Math.min(1, dt * 2);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Líneas de datos                                                     */
/* ------------------------------------------------------------------ */

const streakVert = /* glsl */ `
  uniform float uTime;
  attribute vec3 aStart;
  attribute vec3 aDir;
  attribute float aEnd;
  attribute float aSpeed;
  attribute float aOffset;
  varying float vAlpha;
  varying float vEnd;
  void main() {
    float k = fract(uTime * aSpeed + aOffset);
    vec3 head = aStart + aDir * k * 120.0;
    vec3 p = head - aDir * aEnd * 5.0;
    vAlpha = sin(k * 3.14159);
    vEnd = aEnd;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const streakFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vEnd;
  void main() {
    // cabeza brillante, cola que se apaga
    gl_FragColor = vec4(uColor, vAlpha * (1.0 - vEnd) * uOpacity);
  }
`;

export function DataStreaks({ count = 90, paused, opacity = 0.6, color = GOLD, center = [0, 0, -40] }) {
  const clock = useSceneClock(paused);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const n = count * 2;
    const start = new Float32Array(n * 3);
    const dir = new Float32Array(n * 3);
    const end = new Float32Array(n);
    const speed = new Float32Array(n);
    const off = new Float32Array(n);
    for (let i = 0; i < count; i++) {
      // la mayoría horizontales, como buses de datos; algunas verticales
      const vertical = Math.random() < 0.18;
      const d = vertical ? [0, 1, 0] : [Math.random() < 0.5 ? 1 : -1, 0, 0];
      const s = [
        center[0] + (vertical ? (Math.random() - 0.5) * 220 : -d[0] * 60),
        center[1] + (vertical ? -40 : (Math.random() - 0.5) * 50),
        center[2] + (Math.random() - 0.5) * 200,
      ];
      const sp = 0.02 + Math.random() * 0.05;
      const o = Math.random();
      for (let e = 0; e < 2; e++) {
        const k = i * 2 + e;
        start.set(s, k * 3);
        dir.set(d, k * 3);
        end[k] = e;
        speed[k] = sp;
        off[k] = o;
      }
    }
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aDir', new THREE.BufferAttribute(dir, 3));
    g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    g.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
    g.setAttribute('aOffset', new THREE.BufferAttribute(off, 1));
    return g;
  }, [count, center]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uColor: { value: color.clone() }, uOpacity: { value: opacity } },
        vertexShader: streakVert,
        fragmentShader: streakFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((_, dt) => {
    material.uniforms.uTime.value = clock.current;
    const u = material.uniforms.uOpacity;
    u.value += (opacity - u.value) * Math.min(1, dt * 2);
  });

  return <lineSegments geometry={geometry} material={material} frustumCulled={false} />;
}

/* ------------------------------------------------------------------ */
/* Líneas con pulso: conexiones que se dibujan y por las que viaja un dato */
/* ------------------------------------------------------------------ */

export const pulseLineVert = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const pulseLineFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDraw;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform float uPhase;
  varying float vT;
  void main() {
    if (vT > uDraw) discard;
    float head = fract(uTime * uSpeed + uPhase);
    float pulse = exp(-pow((vT - head) * 14.0, 2.0));
    float a = (0.22 + pulse * 1.2) * uOpacity;
    gl_FragColor = vec4(uColor + pulse * 0.35, a);
  }
`;

/** Material de línea con dibujado progresivo y pulso viajero. */
export function makePulseMaterial(color, { speed = 0.35, phase = 0, opacity = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDraw: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uPhase: { value: phase },
    },
    vertexShader: pulseLineVert,
    fragmentShader: pulseLineFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Geometría de línea a partir de puntos, con el parámetro 0..1 en `aT`. */
export function pulseLineGeometry(points) {
  const g = new THREE.BufferGeometry().setFromPoints(points);
  const t = new Float32Array(points.length);
  for (let i = 0; i < points.length; i++) t[i] = i / (points.length - 1);
  g.setAttribute('aT', new THREE.BufferAttribute(t, 1));
  return g;
}

/** Suavizado exponencial independiente de los fps. */
export const damp = (current, target, lambda, dt) => current + (target - current) * (1 - Math.exp(-lambda * dt));
