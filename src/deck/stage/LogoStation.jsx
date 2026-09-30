import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneClock, damp } from './fx.jsx';

/**
 * El logotipo de MTI construyéndose con partículas.
 *
 * Se muestrea el propio logo extraído de la presentación: cada píxel opaco es
 * un destino, con su color real (dorado en «MTi.», blanco en «GROUP
 * MINGOTHINGS»). Las partículas llegan desde la oscuridad, se asientan, y al
 * avanzar salen disparadas hacia la cámara mientras aparece la ciudad.
 */

const LOGO = '/assets/mti-presentation/brand/mti-logo-group-mingothings.webp';
const WIDTH = 9.5; // ancho del logo en unidades de mundo
const LIFT = 2.1; // el logo queda en la mitad alta: el claim va debajo

let sampleCache = null;
function sampleLogo(max) {
  if (sampleCache) return sampleCache;
  sampleCache = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const n = img.naturalWidth;
      const c = document.createElement('canvas');
      c.width = n;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      const pts = [];
      for (let y = 0; y < c.height; y += 2) {
        for (let x = 0; x < c.width; x += 2) {
          const i = (y * c.width + x) * 4;
          if (data[i + 3] > 150) pts.push([x / n, y / n, data[i] / 255, data[i + 1] / 255, data[i + 2] / 255]);
        }
      }
      // reparto uniforme hasta el máximo pedido
      const step = Math.max(1, pts.length / max);
      const out = [];
      for (let k = 0; k < pts.length && out.length < max; k += step) out.push(pts[Math.floor(k)]);
      resolve(out);
    };
    img.onerror = reject;
    img.src = LOGO;
  });
  return sampleCache;
}

const vert = /* glsl */ `
  uniform float uAssemble;
  uniform float uExplode;
  uniform float uTime;
  uniform float uPixelRatio;
  attribute vec3 aStart;
  attribute vec3 aColor;
  attribute float aDelay;
  attribute float aRand;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float k = clamp((uAssemble - aDelay * 0.55) / 0.45, 0.0, 1.0);
    k = k * k * (3.0 - 2.0 * k);
    vec3 p = mix(aStart, position, k);
    // respiración mínima una vez asentado
    p.xy += vec2(sin(uTime * 1.3 + aRand * 30.0), cos(uTime * 1.1 + aRand * 20.0)) * 0.018 * k;
    float e = uExplode * uExplode;
    p.xy += normalize(position.xy + vec2(0.001)) * e * (2.0 + aRand * 9.0);
    p.z += e * (8.0 + aRand * 26.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vColor = aColor;
    vAlpha = (0.25 + 0.75 * k) * (1.0 - smoothstep(0.55, 1.0, uExplode));
    gl_PointSize = (1.6 + aRand * 1.2) * uPixelRatio * (33.0 / max(-mv.z, 0.5));
  }
`;
const frag = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor * 0.92, a * vAlpha * 0.9);
  }
`;

export default function LogoStation({ phase, paused, count = 3200 }) {
  const [pts, setPts] = useState(null);
  const clock = useSceneClock(paused);
  const assemble = useRef(0);
  const explode = useRef(0);
  const glow = useRef();

  useEffect(() => {
    let alive = true;
    sampleLogo(count).then((p) => alive && setPts(p)).catch(() => alive && setPts([]));
    return () => {
      alive = false;
    };
  }, [count]);

  const geometry = useMemo(() => {
    if (!pts?.length) return null;
    const n = pts.length;
    const pos = new Float32Array(n * 3);
    const start = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const delay = new Float32Array(n);
    const rand = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const [u, v, r, g, b] = pts[i];
      pos[i * 3] = (u - 0.5) * WIDTH;
      pos[i * 3 + 1] = (0.5 - v) * WIDTH + LIFT;
      pos[i * 3 + 2] = 0;
      // llegan desde una nube amplia y profunda
      const a = Math.random() * Math.PI * 2;
      const rr = 8 + Math.random() * 22;
      start[i * 3] = Math.cos(a) * rr;
      start[i * 3 + 1] = (Math.random() - 0.5) * 16;
      start[i * 3 + 2] = -10 - Math.random() * 40;
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
      // se construye de izquierda a derecha, con algo de desorden
      delay[i] = u * 0.75 + Math.random() * 0.25;
      rand[i] = Math.random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
    return geo;
  }, [pts]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uAssemble: { value: 0 },
          uExplode: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const glowTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(230,168,23,0.55)');
    grd.addColorStop(0.45, 'rgba(230,168,23,0.12)');
    grd.addColorStop(1, 'rgba(230,168,23,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  useEffect(
    () => () => {
      geometry?.dispose();
      material.dispose();
      glowTex.dispose();
    },
    [geometry, material, glowTex]
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    // en pausa las transiciones se completan al instante: no se queda a medias
    const speed = paused ? 1 : dt;
    if (phase === 'assemble') {
      assemble.current = Math.min(1.6, assemble.current + speed * 0.55);
      explode.current = damp(explode.current, 0, 3, paused ? 5 : dt);
    } else if (phase === 'explode') {
      assemble.current = Math.max(assemble.current, 1.6);
      explode.current = damp(explode.current, 1, 1.4, paused ? 5 : dt);
    }
    material.uniforms.uAssemble.value = assemble.current;
    material.uniforms.uExplode.value = explode.current;
    material.uniforms.uTime.value = clock.current;
    if (glow.current) {
      const k = Math.min(1, assemble.current) * (1 - explode.current);
      glow.current.material.opacity = k * 0.9;
      glow.current.scale.setScalar(16 + Math.sin(clock.current * 0.8) * 0.6);
    }
  });

  return (
    <group visible={phase !== 'hidden'}>
      <mesh ref={glow} position={[0, LIFT, -1.5]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {geometry && <points geometry={geometry} material={material} frustumCulled={false} />}
    </group>
  );
}
