import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneClock, damp, makePulseMaterial, pulseLineGeometry, GOLD, CYAN } from './fx.jsx';
import Icon from '../../components/icons.jsx';
import { BrandLogo } from '../parts.jsx';

/**
 * Agentify AI · el orquestador y sus ocho especialistas.
 *
 *   entradas (PDF, correo, IoT, CRM, voz) → orquestador → agente → acciones
 *
 * Un núcleo de razonamiento en el centro, los ocho agentes en órbita a su
 * alrededor y, debajo, el anillo de la capa de datos (traza, memoria,
 * auditoría). Cada paso del recorrido pone la escena en un «modo»:
 *
 *   idle      todo respira, sin protagonista
 *   detect    las entradas se encienden y sus datos viajan al núcleo
 *   route     el núcleo reparte trabajo a los agentes, de uno en uno
 *   act       salen las acciones y el anillo de datos registra cada paso
 *   catalog   los ocho agentes en primer plano, con su nombre
 *   agent     un agente al frente (la órbita gira hasta traerlo) y el resto en calma
 *   delivery  el anillo se completa por cuartos: las cuatro fases de entrega
 */

export const ORCH_CENTER = new THREE.Vector3(90, 0, -120);

const CORE_Y = 3.4;
const RING_R = 7.2;
const IN_X = -15;
const OUT_X = 15;

export function orchPose(mode, step, aspect) {
  const c = ORCH_CENTER;
  const narrow = aspect < 0.9;
  const k = narrow ? 1.75 : 1;
  // en pantalla ancha el conjunto queda a la derecha: a la izquierda va el texto
  const lead = narrow ? 0 : aspect > 1.5 ? 10 : 7;
  switch (mode) {
    case 'detect':
      return { position: [c.x - lead * 1.5, 12 * k, c.z + 44 * k], target: [c.x - lead * 1.7, CORE_Y, c.z] };
    case 'route':
      return { position: [c.x - 2, 22 * k, c.z + 28 * k], target: [c.x - lead, CORE_Y - 1, c.z] };
    case 'act':
      return { position: [c.x + 6 - lead * 0.6, 12 * k, c.z + 44 * k], target: [c.x + 4 - lead, CORE_Y, c.z] };
    case 'catalog':
      return { position: [c.x - lead * 0.3, 15 * k, c.z + 30 * k], target: [c.x - lead, CORE_Y - 0.5, c.z + 1] };
    case 'agent':
      return { position: [c.x - lead * 0.2, 7.5 * k, c.z + 25 * k], target: [c.x - lead * 0.9, CORE_Y + 0.8, c.z + 2] };
    case 'delivery':
      // desde arriba y por detrás del texto: el anillo queda arriba a la derecha
      return { position: [c.x - lead * 1.6, 30 * k, c.z + 52 * k], target: [c.x - lead * 1.8, 0, c.z + 16] };
    case 'dim':
      return { position: [c.x - lead * 0.6, 18 * k, c.z + 50 * k], target: [c.x - lead * 1.2, CORE_Y, c.z] };
    default:
      return { position: [c.x - lead * 0.3, 13 * k, c.z + 40 * k], target: [c.x - lead, CORE_Y, c.z] };
  }
}

/* ------------------------------------------------------------------ */
/* Suelo: rejilla polar con barrido                                    */
/* ------------------------------------------------------------------ */

const floorVert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const floorFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSweep;
  uniform vec3 uGold;
  uniform vec3 uSteel;
  varying vec2 vP;
  void main() {
    float r = length(vP);
    float a = atan(vP.y, vP.x);
    float rings = smoothstep(0.06, 0.0, abs(fract(r / 2.4) - 0.5) - 0.44);
    float spokes = smoothstep(0.02, 0.0, abs(fract(a / 6.28318 * 32.0) - 0.5) - 0.47) * step(4.0, r);
    float fade = smoothstep(34.0, 6.0, r);
    // barrido de radar: el orquestador «mira» su entorno
    float sweep = fract((a / 6.28318) + uTime * 0.08);
    float beam = smoothstep(0.9, 1.0, sweep) * uSweep;
    vec3 col = mix(uSteel, uGold, beam);
    float alpha = (rings * 0.35 + spokes * 0.18 + beam * 0.35) * fade * uOpacity;
    gl_FragColor = vec4(col, alpha);
  }
`;

function Floor({ clock, fade, sweep }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uSweep: { value: 0 },
          uGold: { value: GOLD.clone() },
          uSteel: { value: new THREE.Color('#3b5b8f') },
        },
        vertexShader: floorVert,
        fragmentShader: floorFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    mat.uniforms.uTime.value = clock.current;
    mat.uniforms.uOpacity.value = fade.current;
    mat.uniforms.uSweep.value = damp(mat.uniforms.uSweep.value, sweep ? 1 : 0.25, 2, dt);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={mat}>
      <planeGeometry args={[70, 70]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Anillo de la capa de datos                                          */
/* ------------------------------------------------------------------ */

const ringFrag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uFill;
  uniform float uPulse;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    // vUv.x recorre el anillo; vUv.y lo atraviesa
    float dash = step(0.45, fract(vUv.x * 72.0 - uTime * 0.6));
    float edge = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
    float filled = step(vUv.x, uFill);
    // borde brillante en la cabeza del relleno: se ve avanzar
    float head = exp(-pow((vUv.x - uFill) * 60.0, 2.0)) * step(uFill, 0.999);
    float glow = 0.25 + dash * 0.55 + uPulse * 0.4;
    gl_FragColor = vec4(uColor * (0.8 + uPulse * 0.6 + head * 1.5), (glow * mix(0.07, 1.0, filled) + head) * edge * uOpacity);
  }
`;
const ringVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** Anillo plano con coordenadas «a lo largo» (u) y «a través» (v). */
function ringGeometry(inner, outer, segs = 256) {
  const g = new THREE.BufferGeometry();
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2 + Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    pos.push(c * inner, 0, s * inner, c * outer, 0, s * outer);
    uv.push(i / segs, 0, i / segs, 1);
    if (i < segs) {
      const k = i * 2;
      idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
    }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function DataRing({ clock, fade, mode, step }) {
  const geo = useMemo(() => ringGeometry(11.2, 12.2), []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 }, uFill: { value: 1 }, uPulse: { value: 0 }, uColor: { value: GOLD.clone() } },
        vertexShader: ringVert,
        fragmentShader: ringFrag,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const inner = useRef();
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const u = mat.uniforms;
    u.uTime.value = clock.current;
    u.uOpacity.value = fade.current;
    // en entrega, el anillo se completa por cuartos: una fase cada vez
    const fill = mode === 'delivery' ? Math.min(1, (step + 1) / 4 + 0.001) : 1.001;
    u.uFill.value = damp(u.uFill.value, fill, 2.2, dt);
    u.uPulse.value = damp(u.uPulse.value, mode === 'act' || mode === 'delivery' ? 1 : 0, 2, dt);
    if (inner.current) inner.current.rotation.y -= dt * 0.12;
  });
  return (
    <group position={[0, 0.05, 0]}>
      <mesh geometry={geo} material={mat} />
      <group ref={inner}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.9, 10, 128, 1, 0, Math.PI * 1.3]} />
          <meshBasicMaterial color={CYAN} transparent opacity={0.35} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Núcleo: el orquestador                                              */
/* ------------------------------------------------------------------ */

const coreVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const coreFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uEnergy;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
    float pulse = 0.5 + 0.5 * sin(uTime * 3.0);
    vec3 col = uColor * (0.35 + fres * 1.6 + uEnergy * pulse * 0.4);
    gl_FragColor = vec4(col, 0.35 + fres * 0.65);
  }
`;

function Core({ clock, energy }) {
  const shell = useRef();
  const wire = useRef();
  const arcs = useRef([]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uColor: { value: GOLD.clone() }, uEnergy: { value: 0 }, uTime: { value: 0 } },
        vertexShader: coreVert,
        fragmentShader: coreFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uEnergy.value = damp(mat.uniforms.uEnergy.value, energy, 2, dt);
    const e = mat.uniforms.uEnergy.value;
    if (shell.current) shell.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.04 + e * 0.08);
    if (wire.current) {
      wire.current.rotation.y += dt * (0.25 + e * 0.6);
      wire.current.rotation.x += dt * 0.12;
    }
    arcs.current.forEach((a, i) => {
      if (!a) return;
      a.rotation.z += dt * (0.4 + i * 0.25) * (i % 2 ? -1 : 1) * (1 + e);
    });
  });
  return (
    <group position={[0, CORE_Y, 0]}>
      <mesh ref={shell} material={mat}>
        <sphereGeometry args={[1.7, 48, 48]} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshBasicMaterial color="#fff1c2" toneMapped={false} />
      </mesh>
      <mesh ref={wire}>
        <icosahedronGeometry args={[2.35, 1]} />
        <meshBasicMaterial color={GOLD} wireframe transparent opacity={0.45} toneMapped={false} />
      </mesh>
      {[3.1, 3.6, 4.1].map((r, i) => (
        <mesh key={r} ref={(el) => (arcs.current[i] = el)} rotation={[Math.PI / 2 + (i - 1) * 0.5, i * 0.7, 0]}>
          <torusGeometry args={[r, 0.035, 8, 120, Math.PI * (0.9 + i * 0.25)]} />
          <meshBasicMaterial color={i === 1 ? CYAN : GOLD} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Conexiones con pulso                                                */
/* ------------------------------------------------------------------ */

function useLinks(defs) {
  const links = useMemo(
    () =>
      defs.map((d) => {
        const a = new THREE.Vector3(...d.from);
        const b = new THREE.Vector3(...d.to);
        const mid = a.clone().lerp(b, 0.5);
        mid.y += d.arc ?? 1.5;
        const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
        return { ...d, curve, geometry: pulseLineGeometry(curve.getPoints(64)), material: makePulseMaterial(d.color ?? GOLD, { speed: d.speed ?? 0.6, phase: d.phase ?? 0 }) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  useEffect(() => () => links.forEach((l) => (l.geometry.dispose(), l.material.dispose())), [links]);
  return links;
}

/* ------------------------------------------------------------------ */
/* Estación                                                            */
/* ------------------------------------------------------------------ */

/** Cuánto se ven entradas y salidas: solo en los modos que las explican. */
const ioLevel = (mode) => (mode === 'detect' || mode === 'route' || mode === 'act' ? 1 : 0);

const inPos = (i, n) => [IN_X - Math.abs(i - (n - 1) / 2) * 0.9, CORE_Y + 4.2 - (8.4 * i) / Math.max(1, n - 1), 1.5];
const outPos = (i, n) => [OUT_X + Math.abs(i - (n - 1) / 2) * 0.9, CORE_Y + 3 - (6 * i) / Math.max(1, n - 1), 1.5];

export default function OrchestratorStation({ active, mode = 'idle', step = 0, paused, agents = [], litAgents = [], focusAgent = null, inputs = [], outputs = [], ring, core }) {
  const clock = useSceneClock(paused);
  const root = useRef();
  const orbit = useRef();
  const fade = useRef(0);
  const orbitAngle = useRef(0);
  const sats = useRef([]);
  const beacons = useRef([]);
  const n = agents.length || 8;

  const inLinks = useLinks(inputs.map((x, i) => ({ id: x.id, from: inPos(i, inputs.length), to: [-1.6, CORE_Y, 0], color: CYAN, speed: 0.55, phase: i * 0.17, arc: 2.2 })));
  const outLinks = useLinks(outputs.map((x, i) => ({ id: x.id, from: [1.6, CORE_Y, 0], to: outPos(i, outputs.length), color: GOLD, speed: 0.6, phase: i * 0.22, arc: 2.2 })));
  // los radios del núcleo a cada agente viven dentro de la órbita (giran con ella)
  const spokes = useLinks(
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return { id: i, from: [0, CORE_Y, 0], to: [Math.cos(a) * RING_R, CORE_Y + Math.sin(a * 2) * 0.5, Math.sin(a) * RING_R], color: GOLD, speed: 0.9, phase: i / n, arc: 0.6 };
    })
  );

  const focusIdx = agents.findIndex((a) => a.id === focusAgent);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    fade.current = damp(fade.current, active ? 1 : 0, active ? 2 : 4, dt);
    if (root.current) root.current.visible = fade.current > 0.01;
    if (!root.current?.visible) return;
    const f = fade.current;

    // la órbita: gira sola; con un agente elegido, lo trae al frente (+z)
    if (focusIdx >= 0) {
      const a = (focusIdx / n) * Math.PI * 2;
      let goal = -Math.PI / 2 + a; // rotation.y positiva gira de +x hacia -z
      const cur = orbitAngle.current;
      goal += Math.round((cur - goal) / (Math.PI * 2)) * Math.PI * 2;
      orbitAngle.current = damp(cur, goal, 2.4, dt);
    } else if (!paused) {
      orbitAngle.current += dt * (mode === 'route' ? 0.22 : 0.08);
    }
    if (orbit.current) orbit.current.rotation.y = orbitAngle.current;

    // en «route» el núcleo reparte trabajo: un agente cada 0,7 s
    const routeIdx = mode === 'route' ? Math.floor(t / 0.7) % n : -1;

    spokes.forEach((l, i) => {
      const u = l.material.uniforms;
      u.uTime.value = t;
      const on = (mode === 'route' && i === routeIdx) || i === focusIdx || litAgents.includes(agents[i]?.id);
      const base = mode === 'route' || mode === 'catalog' ? 0.35 : mode === 'agent' ? 0.12 : 0.18;
      u.uOpacity.value = damp(u.uOpacity.value, (on ? 1 : base) * f, 4, dt);
      u.uDraw.value = damp(u.uDraw.value, 1.001, 1.4, dt);
    });
    const io = ioLevel(mode);
    inLinks.forEach((l) => {
      const u = l.material.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = damp(u.uOpacity.value, (mode === 'detect' ? 1 : io * 0.3) * f, 3, dt);
      u.uDraw.value = damp(u.uDraw.value, io > 0 ? 1.001 : 0, 1.2, dt);
    });
    outLinks.forEach((l) => {
      const u = l.material.uniforms;
      u.uTime.value = t;
      u.uOpacity.value = damp(u.uOpacity.value, (mode === 'act' ? 1 : io * 0.3) * f, 3, dt);
      u.uDraw.value = damp(u.uDraw.value, mode === 'act' || mode === 'route' ? 1.001 : 0, 1.4, dt);
    });
    beacons.current.forEach((b, i) => {
      if (!b) return;
      // entradas mientras llegan y se reparten; salidas mientras se reparte y se actúa
      const isIn = i < inputs.length;
      const show = isIn ? mode === 'detect' || mode === 'route' : mode === 'route' || mode === 'act';
      const s = damp(b.scale.x, show ? 1 : 0.001, 3, dt);
      b.scale.setScalar(s);
      b.visible = s > 0.01;
      b.rotation.y += dt * 0.8;
    });

    sats.current.forEach((s, i) => {
      if (!s) return;
      const on = i === focusIdx || i === routeIdx || litAgents.includes(agents[i]?.id);
      const dim = focusIdx >= 0 || litAgents.length ? !on : false;
      const k = damp(s.userData.k ?? 0, on ? 1 : 0, 4, dt);
      s.userData.k = k;
      s.scale.setScalar(1 + k * 0.55);
      s.position.y = Math.sin(t * 1.2 + i) * 0.18 + k * 0.6;
      s.rotation.y += dt * (0.6 + k);
      const m = s.children[0]?.material;
      if (m) {
        m.color.copy(GOLD).lerp(new THREE.Color('#9fb4d8'), 1 - k);
        m.opacity = (dim ? 0.35 : 0.95) * f;
      }
    });
  });

  // qué rótulos se ven: nunca con la escena apagada, y solo los que cuentan algo en este modo
  const agentLabel = (on) => active && (mode === 'route' || (mode === 'catalog' && on));
  const showIn = active && mode === 'detect';
  const showOut = active && mode === 'act';

  return (
    <group ref={root} position={ORCH_CENTER.toArray()}>
      <Floor clock={clock} fade={fade} sweep={mode === 'detect' || mode === 'route'} />
      <DataRing clock={clock} fade={fade} mode={mode} step={step} />
      <Core clock={clock} energy={mode === 'route' || mode === 'act' ? 1 : mode === 'detect' ? 0.6 : 0.2} />

      {inLinks.map((l) => (
        <line key={`i${l.id}`} geometry={l.geometry} material={l.material} />
      ))}
      {outLinks.map((l) => (
        <line key={`o${l.id}`} geometry={l.geometry} material={l.material} />
      ))}

      {/* entradas y salidas: balizas en los extremos */}
      {inputs.map((x, i) => (
        <group key={x.id} position={inPos(i, inputs.length)}>
          <mesh ref={(el) => (beacons.current[i] = el)}>
            <octahedronGeometry args={[0.55]} />
            <meshBasicMaterial color={CYAN} wireframe toneMapped={false} />
          </mesh>
          {showIn && (
            <Html center position={[-0.2, 1.3, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
              <span className={`orch-tag orch-tag--in${mode === 'detect' ? ' is-on' : ''}`} style={{ '--i': i }}>
                {x.logos?.length ? <span className="brand-logos">{x.logos.map((l) => <BrandLogo key={l} id={l} size="xs" />)}</span> : <Icon name={x.icon} />}
                {x.label}
              </span>
            </Html>
          )}
        </group>
      ))}
      {outputs.map((x, i) => (
        <group key={x.id} position={outPos(i, outputs.length)}>
          <mesh ref={(el) => (beacons.current[inputs.length + i] = el)}>
            <boxGeometry args={[0.9, 0.9, 0.9]} />
            <meshBasicMaterial color={GOLD} wireframe toneMapped={false} />
          </mesh>
          {showOut && (
            <Html center position={[0.2, 1.3, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
              <span className={`orch-tag orch-tag--out${mode === 'act' ? ' is-on' : ''}`} style={{ '--i': i }}>
                {x.logos?.length ? <span className="brand-logos">{x.logos.map((l) => <BrandLogo key={l} id={l} size="xs" />)}</span> : <Icon name={x.icon} />}
                {x.label}
              </span>
            </Html>
          )}
        </group>
      ))}

      {/* la órbita de agentes y sus radios */}
      <group ref={orbit}>
        {spokes.map((l) => (
          <line key={`s${l.id}`} geometry={l.geometry} material={l.material} />
        ))}
        {agents.map((a, i) => {
          const ang = (i / n) * Math.PI * 2;
          const on = a.id === focusAgent || litAgents.includes(a.id);
          return (
            <group key={a.id} position={[Math.cos(ang) * RING_R, CORE_Y + Math.sin(ang * 2) * 0.5, Math.sin(ang) * RING_R]}>
              <group ref={(el) => (sats.current[i] = el)}>
                <mesh>
                  <dodecahedronGeometry args={[0.62, 0]} />
                  <meshBasicMaterial color="#9fb4d8" transparent opacity={0.9} wireframe toneMapped={false} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.26, 16, 16]} />
                  <meshBasicMaterial color={on ? '#fff1c2' : '#c7d6f0'} toneMapped={false} />
                </mesh>
              </group>
              {agentLabel(on) && (
                <Html center position={[0, 1.55, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
                  <span className={`orch-agent${on ? ' is-on' : ''}`}>
                    <b>{a.id}</b>
                    {a.short}
                  </span>
                </Html>
              )}
            </group>
          );
        })}
      </group>

      {active && core && (mode === 'detect' || mode === 'route' || mode === 'act') && (
        <Html center position={[0, CORE_Y + 3.4, 0]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <span className="orch-core">{core}</span>
        </Html>
      )}
      {active && ring && mode === 'act' && (
        <Html center position={[0, 0.4, 12.8]} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <span className="orch-ring">{ring}</span>
        </Html>
      )}
    </group>
  );
}
