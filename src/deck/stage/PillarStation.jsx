import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Icon from '../../components/icons.jsx';
import { useSceneClock, damp, makePulseMaterial, pulseLineGeometry, ParticleField, GOLD } from './fx.jsx';

/**
 * Capítulo 1 · los cuatro pilares de MTI.
 *
 * Cuatro columnas de cristal oscuro sobre un suelo técnico. En cada paso la
 * cámara se desliza hasta una columna, que se «carga» de energía dorada desde
 * la base, y encima se despliega un holograma que explica ese pilar:
 *
 *   01 Foco en operaciones críticas   cúpula de protección con radar que
 *                                     barre aeropuertos, metros, hospitales…
 *   02 Entrega de extremo a extremo   un anillo con las cinco fases y un único
 *                                     pulso que lo recorre entero
 *   03 Plataformas propias            las cuatro plataformas se ensamblan en
 *                                     una sola pila y los datos la atraviesan
 *   04 Resultados medibles            barras «antes / con MTi» que bajan hasta
 *                                     el resultado medido en proyectos reales
 */

// cerca del logo (vuelo corto) y fuera del encuadre del globo, la obra y la cadena
export const PILLAR_CENTER = new THREE.Vector3(-60, 0, -90);
const XS = [-12, -4, 4, 12];
const COL_H = 5;
const HOLO_Y = COL_H + 3.6;
const ORDER = ['mission', 'end-to-end', 'platforms', 'roi'];
const PARTICLE_BOUNDS = [70, 26, 44];
const PARTICLE_CENTER = [0, 9, -6];

export function pillarPose(step, aspect) {
  const i = Math.max(0, Math.min(3, step - 2));
  const x = XS[i];
  const c = PILLAR_CENTER;
  if (aspect < 0.9) {
    // vertical: el holograma arriba y al centro; el texto va abajo
    return { position: [c.x + x + 1.5, c.y + 12, c.z + 31], target: [c.x + x, c.y + 4.2, c.z] };
  }
  // horizontal: el holograma es el protagonista, en la mitad derecha
  return { position: [c.x + x - 2.4, c.y + 13.2, c.z + 21.5], target: [c.x + x - 5.2, c.y + 7.4, c.z] };
}

/* ------------------------------------------------------------------ */
/* Suelo técnico con foco que sigue a la columna activa                 */
/* ------------------------------------------------------------------ */

const floorVert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const floorFrag = /* glsl */ `
  uniform float uFocus;
  uniform float uTime;
  uniform float uFade;
  varying vec2 vP;
  float grid(float v, float w) {
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
    return 1.0 - min(d / w, 1.0);
  }
  void main() {
    vec2 p = vP;
    float g = max(grid(p.x / 1.5, 1.0), grid(p.y / 1.5, 1.0)) * 0.22;
    float major = max(grid(p.x / 6.0, 1.3), grid(p.y / 6.0, 1.3)) * 0.4;
    float d = length(p - vec2(uFocus, 0.0));
    float spot = exp(-d * d * 0.02);
    // ondas que salen de la columna activa
    float ring = exp(-pow(fract(d * 0.08 - uTime * 0.35) - 0.5, 2.0) * 90.0) * exp(-d * 0.12);
    float fall = smoothstep(46.0, 6.0, length(p));
    vec3 base = vec3(0.22, 0.42, 0.78);
    vec3 gold = vec3(0.9, 0.62, 0.1);
    vec3 col = base * (g + major) + gold * (spot * 0.55 + ring * 0.6);
    float a = ((g + major) * 0.8 + spot * 0.35 + ring * 0.5) * fall * uFade;
    gl_FragColor = vec4(col, a);
  }
`;

/* energía que llena la columna desde la base */
const coreVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const coreFrag = /* glsl */ `
  uniform float uFill;
  uniform float uTime;
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    float y = vUv.y;
    if (y > uFill) discard;
    float stripes = 0.55 + 0.45 * sin((y * 26.0 - uTime * 3.2));
    float head = smoothstep(uFill - 0.08, uFill, y);
    vec3 col = mix(vec3(0.9, 0.55, 0.05), vec3(1.0, 0.9, 0.6), head);
    gl_FragColor = vec4(col * (0.7 + stripes * 0.5), (0.55 + head * 0.45) * uFade);
  }
`;

/* ------------------------------------------------------------------ */
/* Columna                                                             */
/* ------------------------------------------------------------------ */

function Column({ x, active, done, clock, num, visible }) {
  const coreMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uFill: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 } },
        vertexShader: coreVert,
        fragmentShader: coreFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#15233f',
        emissive: '#0c1a33',
        emissiveIntensity: 0.6,
        metalness: 0.55,
        roughness: 0.18,
        transparent: true,
        opacity: 0.78,
      }),
    []
  );
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: '#4a6ea8', transparent: true, opacity: 0.7, toneMapped: false }), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1.7, COL_H, 1.7)), []);
  const cap = useRef();
  const beam = useRef();
  const halo = useRef();
  const lit = useRef(0);
  const beamK = useRef(0);

  useEffect(() => () => [coreMat, glass, edgeMat, edges].forEach((o) => o.dispose()), [coreMat, glass, edgeMat, edges]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    lit.current = damp(lit.current, active ? 1 : done ? 0.35 : 0, active ? 1.6 : 3, dt);
    const k = lit.current;
    coreMat.uniforms.uFill.value = damp(coreMat.uniforms.uFill.value, active ? 1.02 : done ? 1.02 : 0, active ? 0.9 : 2, dt);
    coreMat.uniforms.uTime.value = clock.current;
    coreMat.uniforms.uFade.value = 0.35 + k * 0.65;
    edgeMat.color.setRGB(0.29 + k * 0.61, 0.43 + k * 0.23, 0.66 - k * 0.57);
    edgeMat.opacity = 0.45 + k * 0.5;
    if (cap.current) {
      cap.current.rotation.z += dt * (0.3 + k * 1.2);
      cap.current.material.opacity = 0.25 + k * 0.75;
      cap.current.scale.setScalar(1 + k * 0.25);
    }
    beamK.current = damp(beamK.current, active ? 1 : 0, active ? 1.4 : 4, dt);
    if (beam.current) {
      const b = beamK.current;
      beam.current.visible = b > 0.01;
      beam.current.material.opacity = b * (0.11 + Math.sin(clock.current * 2.2) * 0.025);
      beam.current.scale.set(1, 0.3 + b * 0.7, 1);
    }
    if (halo.current) halo.current.material.opacity = k * 0.5;
  });

  return (
    <group position={[x, 0, 0]}>
      {/* zócalo */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.3, 2.6]} />
        <meshStandardMaterial color="#0e1a30" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh ref={halo} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 2.6, 64]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* columna de cristal oscuro */}
      <mesh position={[0, COL_H / 2 + 0.3, 0]} material={glass}>
        <boxGeometry args={[1.7, COL_H, 1.7]} />
      </mesh>
      <lineSegments position={[0, COL_H / 2 + 0.3, 0]} geometry={edges} material={edgeMat} />
      {/* banda de energía en cada cara: se llena desde la base al activarse */}
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((r) => (
        <group key={r} rotation={[0, r, 0]}>
          <mesh position={[0, COL_H / 2 + 0.3, 0.862]} material={coreMat}>
            <planeGeometry args={[0.3, COL_H - 0.5]} />
          </mesh>
        </group>
      ))}
      {/* corona */}
      <mesh ref={cap} position={[0, COL_H + 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.045, 12, 80, Math.PI * 1.6]} />
        <meshBasicMaterial color={GOLD} transparent toneMapped={false} />
      </mesh>
      {/* haz de luz hacia el holograma */}
      <mesh ref={beam} position={[0, COL_H + 2.1, 0]}>
        <cylinderGeometry args={[1.5, 0.35, 3.0, 32, 1, true]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* los rótulos HTML no heredan la visibilidad del grupo: se montan solo con la escena */}
      {visible && (
        <Html position={[0, -0.9, 1.5]} center zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
          <span className={`pillar-num${active ? ' is-on' : done ? ' is-done' : ''}`}>{num}</span>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Hologramas                                                          */
/* ------------------------------------------------------------------ */

/** Crece al activarse y se recoge al salir; lo de dentro solo corre si se ve. */
function Holo({ x, active, children }) {
  const g = useRef();
  const k = useRef(0);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    k.current = damp(k.current, active ? 1 : 0, active ? 2.4 : 5, dt);
    if (!g.current) return;
    g.current.visible = k.current > 0.01;
    const s = 0.4 + k.current * 0.6;
    g.current.scale.setScalar(s);
    g.current.position.y = HOLO_Y - (1 - k.current) * 2.2;
  });
  return (
    <group ref={g} position={[x, HOLO_Y, 0]}>
      {children}
    </group>
  );
}

function Chip({ position, icon, text, on, tone = 'gold', delay = 0 }) {
  return (
    <Html position={position} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <span className={`holo-chip holo-chip--${tone}${on ? ' is-on' : ''}`} style={{ '--d': `${delay}ms` }}>
        {icon && <Icon name={icon} />}
        {text}
      </span>
    </Html>
  );
}

/* --- 01 · operaciones críticas: cúpula y radar ------------------------ */

const sweepFrag = /* glsl */ `
  uniform float uAngle;
  uniform float uFade;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0;
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);
    float d = mod(uAngle - a + 6.28318, 6.28318);
    float trail = exp(-d * 2.6);
    float rings = smoothstep(0.02, 0.0, abs(fract(r * 4.0) - 0.5) - 0.47);
    vec3 col = vec3(0.95, 0.68, 0.12);
    gl_FragColor = vec4(col, (trail * 0.55 + rings * 0.12) * (1.0 - r * 0.4) * uFade);
  }
`;

function Mission({ active, clock, viz }) {
  const sweep = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uAngle: { value: 0 }, uFade: { value: 1 } },
        vertexShader: coreVert,
        fragmentShader: sweepFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    []
  );
  const nodes = useRef([]);
  const dome = useRef();
  const items = viz.items;
  const icons = ['plane', 'train', 'health', 'factory', 'shield'];
  useEffect(() => () => sweep.dispose(), [sweep]);

  useFrame(() => {
    const t = clock.current;
    const ang = (t * 1.1) % (Math.PI * 2);
    sweep.uniforms.uAngle.value = ang;
    if (dome.current) dome.current.rotation.y = t * 0.12;
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const a = (i / items.length) * Math.PI * 2;
      // el nodo destella cuando el radar pasa por encima
      const d = (ang - a + Math.PI * 4) % (Math.PI * 2);
      const hit = Math.exp(-d * 3);
      n.scale.setScalar(1 + hit * 1.2);
      n.material.color.setRGB(0.45 + hit * 0.55, 0.65 + hit * 0.2, 0.9 - hit * 0.8);
    });
  });

  return (
    <group>
      <mesh ref={dome}>
        <sphereGeometry args={[3.3, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#4a86d8" wireframe transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={sweep}>
        <planeGeometry args={[6.8, 6.8]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.3, 3.42, 96]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.9} toneMapped={false} />
      </mesh>
      {items.map((it, i) => {
        const a = (i / items.length) * Math.PI * 2;
        const p = [Math.cos(a) * 2.7, 0.12, -Math.sin(a) * 2.7];
        return (
          <group key={it} position={p}>
            <mesh ref={(el) => (nodes.current[i] = el)}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshBasicMaterial color="#7fb4ff" toneMapped={false} />
            </mesh>
            {/* las del fondo van más altas: así ninguna tapa a otra */}
            <Chip position={[0, Math.sin(a) > 0.1 ? 1.7 : 0.45, 0]} icon={icons[i % icons.length]} text={it} on={active} delay={300 + i * 140} tone="blue" />
          </group>
        );
      })}
      <Chip position={[0, 3.8, 0]} icon="shield" text={viz.core} on={active} delay={150} tone="big" />
    </group>
  );
}

/* --- 02 · extremo a extremo: un anillo, un pulso --------------------- */

function EndToEnd({ active, clock, viz }) {
  const R2 = 3.1;
  const { geo, mat } = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const a = Math.PI / 2 - (i / 200) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * R2, Math.sin(a) * R2, 0));
    }
    return { geo: pulseLineGeometry(pts), mat: makePulseMaterial(GOLD, { speed: 0.16, opacity: 1.6 }) };
  }, []);
  const packet = useRef();
  const nodes = useRef([]);
  const stages = viz.stages;
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uDraw.value = damp(mat.uniforms.uDraw.value, active ? 1.001 : 0, 1.1, dt);
    const head = (t * 0.16) % 1;
    const a = Math.PI / 2 - head * Math.PI * 2;
    if (packet.current) packet.current.position.set(Math.cos(a) * R2, Math.sin(a) * R2, 0.05);
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const at = i / stages.length;
      const d = (head - at + 1) % 1;
      const hit = Math.exp(-d * 9);
      n.scale.setScalar(1 + hit * 0.9);
    });
  });

  return (
    <group position={[0, 0.6, 0]}>
      <mesh>
        <torusGeometry args={[R2, 0.03, 8, 160]} />
        <meshBasicMaterial color="#2b4a7a" toneMapped={false} />
      </mesh>
      <line geometry={geo} material={mat} />
      <mesh ref={packet}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshBasicMaterial color="#fff1c2" toneMapped={false} />
      </mesh>
      {stages.map((s, i) => {
        const a = Math.PI / 2 - (i / stages.length) * Math.PI * 2;
        const x = Math.cos(a) * R2;
        const y = Math.sin(a) * R2;
        return (
          <group key={s} position={[x, y, 0]}>
            <mesh ref={(el) => (nodes.current[i] = el)}>
              <circleGeometry args={[0.24, 32]} />
              <meshBasicMaterial color={GOLD} toneMapped={false} />
            </mesh>
            <Chip position={[x * -0.34, y * -0.3, 0]} text={`${i + 1} · ${s}`} on={active} delay={250 + i * 160} tone="blue" />
          </group>
        );
      })}
      <Html position={[0, 0, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`holo-core${active ? ' is-on' : ''}`}>
          <em>{viz.from}</em>
          <strong>{viz.core}</strong>
          <em>{viz.to}</em>
        </div>
      </Html>
    </group>
  );
}

/* --- 03 · plataformas propias: una pila que se ensambla --------------- */

function Platforms({ active, clock, layers }) {
  const plates = useRef([]);
  const motes = useRef();
  const k = useRef(0);
  const moteGeo = useMemo(() => {
    const n = 120;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.6;
      pos[i * 3 + 1] = Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => moteGeo.dispose(), [moteGeo]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    k.current = damp(k.current, active ? 1 : 0, 1.4, dt);
    const t = clock.current;
    plates.current.forEach((p, i) => {
      if (!p) return;
      // llegan desde fuera, girando, y encajan en su nivel
      const e = Math.min(1, Math.max(0, k.current * 1.6 - i * 0.18));
      const s = e * e * (3 - 2 * e);
      p.position.y = i * 1.25 + (1 - s) * (3 + i * 1.5);
      p.rotation.y = (1 - s) * (1.6 - i * 0.5) + Math.sin(t * 0.5 + i) * 0.04;
      p.children[0].material.opacity = 0.25 + s * 0.55;
    });
    if (motes.current) {
      const a = motes.current.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        let y = a.getY(i) + dt * (1.2 + (i % 5) * 0.2);
        if (y > 5) y = 0;
        a.setY(i, y);
      }
      a.needsUpdate = true;
      motes.current.material.opacity = k.current * 0.9;
    }
  });

  return (
    <group position={[0, -0.6, 0]}>
      {layers.map((l, i) => (
        <group key={l.id} ref={(el) => (plates.current[i] = el)}>
          <mesh>
            <boxGeometry args={[4.4, 0.22, 3]} />
            <meshStandardMaterial color={l.color} emissive={l.color} emissiveIntensity={0.55} metalness={0.3} roughness={0.4} transparent opacity={0.6} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(4.4, 0.22, 3)]} />
            <lineBasicMaterial color="#ffffff" transparent opacity={0.55} toneMapped={false} />
          </lineSegments>
          <Html position={[2.6, 0, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
            <span className={`holo-layer${active ? ' is-on' : ''}`} style={{ '--c': l.color, '--d': `${400 + i * 180}ms` }}>
              <b>{l.name}</b>
              <em>{l.role}</em>
            </span>
          </Html>
        </group>
      ))}
      <points ref={motes} geometry={moteGeo}>
        <pointsMaterial color="#ffe7a3" size={0.08} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </group>
  );
}

/* --- 04 · resultados medibles: antes / con MTi ------------------------ */

function Roi({ active, clock, viz }) {
  const bars = useRef([]);
  const start = useRef(-1);
  const H = 4.2;
  useFrame(() => {
    const t = clock.current;
    if (active && start.current < 0) start.current = t;
    if (!active) start.current = -1;
    const el = start.current < 0 ? 0 : t - start.current;
    viz.bars.forEach((b, i) => {
      const m = bars.current[i];
      if (!m) return;
      // primero sube a «antes» y luego baja hasta el resultado medido
      const rise = Math.min(1, Math.max(0, (el - i * 0.15) / 0.7));
      const drop = Math.min(1, Math.max(0, (el - 1.1 - i * 0.2) / 1.3));
      const e = drop * drop * (3 - 2 * drop);
      const h = Math.max(0.02, H * rise * (1 - (b.value / 100) * e));
      m.scale.y = h;
      m.position.y = h / 2;
    });
  });
  return (
    <group position={[0, -1.4, 0]}>
      {viz.bars.map((b, i) => {
        const x = (i - (viz.bars.length - 1) / 2) * 2.1;
        return (
          <group key={b.client} position={[x, 0, 0]}>
            {/* «antes»: el volumen completo, en fantasma */}
            <lineSegments position={[0, H / 2, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(1.2, H, 1.2)]} />
              <lineBasicMaterial color="#5b7bb0" transparent opacity={0.55} toneMapped={false} />
            </lineSegments>
            <mesh ref={(el) => (bars.current[i] = el)}>
              <boxGeometry args={[1.2, 1, 1.2]} />
              <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.7} metalness={0.3} roughness={0.35} />
            </mesh>
            <Chip position={[0, H + 0.7, 0]} text={`−${b.value}%`} on={active} delay={2000 + i * 200} tone="big" />
            <Html position={[0, -0.55, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
              <span className={`holo-bar${active ? ' is-on' : ''}`} style={{ '--d': `${600 + i * 150}ms` }}>
                <b>{b.client}</b>
                <em>{b.label}</em>
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Estación                                                            */
/* ------------------------------------------------------------------ */

export default function PillarStation({ active, step, paused, viz, layers, pillars }) {
  const clock = useSceneClock(paused);
  const root = useRef();
  const fade = useRef(0);
  const current = step - 2; // pasos 2 a 5
  const floorMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uFocus: { value: XS[0] }, uTime: { value: 0 }, uFade: { value: 0 } },
        vertexShader: floorVert,
        fragmentShader: floorFrag,
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => floorMat.dispose(), [floorMat]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    fade.current = damp(fade.current, active ? 1 : 0, active ? 1.8 : 4, dt);
    if (root.current) root.current.visible = fade.current > 0.01;
    const u = floorMat.uniforms;
    u.uFade.value = fade.current;
    u.uTime.value = clock.current;
    const want = XS[Math.max(0, Math.min(3, current))];
    // en el plano del suelo, «y» es -z del mundo; el foco solo se mueve en x
    u.uFocus.value = damp(u.uFocus.value, want, 2.2, dt);
  });

  if (!viz) return null;
  const on = (i) => active && current === i;

  return (
    <group ref={root} position={PILLAR_CENTER.toArray()}>
      <hemisphereLight args={['#bcd6f2', '#0b1224', 0.9]} />
      <directionalLight position={[8, 20, 14]} intensity={1.4} color="#fff4dd" />
      <pointLight position={[XS[Math.max(0, current)] ?? 0, HOLO_Y, 3]} intensity={active ? 30 : 0} distance={18} color="#f6c453" />

      {/* polvo en suspensión entre las columnas: da profundidad al plano */}
      <ParticleField count={900} paused={paused} opacity={active ? 0.7 : 0} bounds={PARTICLE_BOUNDS} center={PARTICLE_CENTER} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floorMat}>
        <planeGeometry args={[96, 60]} />
      </mesh>

      {ORDER.map((id, i) => (
        <Column key={id} x={XS[i]} active={on(i)} done={active && current > i} clock={clock} num={pillars?.[i]?.num ?? `0${i + 1}`} visible={active} />
      ))}

      <Holo x={XS[0]} active={on(0)}>
        <Mission active={on(0)} clock={clock} viz={viz.mission} />
      </Holo>
      <Holo x={XS[1]} active={on(1)}>
        <EndToEnd active={on(1)} clock={clock} viz={viz['end-to-end']} />
      </Holo>
      <Holo x={XS[2]} active={on(2)}>
        <Platforms active={on(2)} clock={clock} layers={layers} />
      </Holo>
      <Holo x={XS[3]} active={on(3)}>
        <Roi active={on(3)} clock={clock} viz={viz.roi} />
      </Holo>
    </group>
  );
}
