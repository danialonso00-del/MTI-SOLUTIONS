import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneClock, damp, makePulseMaterial, pulseLineGeometry, GOLD, CYAN } from './fx.jsx';

/**
 * Capítulo 5 · un dato recorre la pila completa de MTI.
 *
 *   dispositivo → thethings.io → MTi Hypervisor → Digital Twin → Agentic AI → acción
 *
 * Cada plataforma es una estación en el espacio y la cámara acompaña al dato.
 * Las capturas reales de la presentación (cuadro de mando de thethings.io,
 * sala de control del Hypervisor) están dentro de la escena como paneles.
 */

export const FLOW_CENTER = new THREE.Vector3(-150, 0, -70);
export const FLOW_X = [-26, -13, 0, 13, 26, 37]; // estaciones a lo largo del eje X

const COLORS = ['#e6a817', '#38bdf8', '#e6a817', '#a855f7', '#10b981', '#f6d074'];

export function flowPose(step, aspect) {
  const c = FLOW_CENTER;
  const wide = aspect < 0.9 ? 1.7 : 1;
  if (step === 0 || step === 6) {
    return { position: [c.x + 6, c.y + 20 * wide, c.z + 66 * wide], target: [c.x + 5, c.y + 1, c.z] };
  }
  const x = FLOW_X[step - 1];
  // la estación queda en el tercio izquierdo: a la derecha va el panel de la plataforma
  const off = aspect > 1.2 ? 4.5 : 0;
  return { position: [c.x + x + off, c.y + 6.5 * wide, c.z + 23 * wide], target: [c.x + x + off, c.y + 2.6, c.z] };
}

/* ------------------------------------------------------------------ */
/* Panel con una captura de la presentación                            */
/* ------------------------------------------------------------------ */

function PhotoPanel({ url, width, position, rotation, on }) {
  const tex = useLoader(THREE.TextureLoader, url);
  const ref = useRef();
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
  }, [tex]);
  const aspect = tex.image ? tex.image.height / tex.image.width : 0.6;
  useFrame((_, rawDt) => {
    if (!ref.current) return;
    const m = ref.current.material;
    m.opacity = damp(m.opacity, on ? 1 : 0, 3, Math.min(rawDt, 0.1));
    ref.current.visible = m.opacity > 0.01;
  });
  return (
    <group position={position} rotation={rotation}>
      <mesh ref={ref}>
        <planeGeometry args={[width, width * aspect]} />
        <meshBasicMaterial map={tex} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments visible={on}>
        <edgesGeometry args={[new THREE.PlaneGeometry(width * 1.02, width * aspect * 1.02)]} />
        <lineBasicMaterial color={GOLD} transparent opacity={0.6} toneMapped={false} />
      </lineSegments>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Estaciones                                                          */
/* ------------------------------------------------------------------ */

function Devices({ lit, clock }) {
  const rings = useRef([]);
  useFrame(() => {
    const t = clock.current;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const p = (t * 0.8 + i * 0.33) % 1;
      r.scale.setScalar(1 + p * 5);
      r.material.opacity = lit ? (1 - p) * 0.7 : 0;
    });
  });
  return (
    <group>
      {[[-2.5, 0, 1.5], [0, 0, -1.5], [2.4, 0, 1]].map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 0.6, 0]}>
            <boxGeometry args={[1.1, 1.2, 0.8]} />
            <meshStandardMaterial color="#cfd7e6" metalness={0.3} roughness={0.45} />
          </mesh>
          <mesh position={[0, 1.35, 0.41]}>
            <circleGeometry args={[0.18, 16]} />
            <meshBasicMaterial color={lit && i === 1 ? '#f59e0b' : '#10b981'} toneMapped={false} />
          </mesh>
          <mesh ref={(el) => (rings.current[i] = el)} position={[0, 1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.36, 32]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* pasarela LoRaWAN */}
      <mesh position={[0, 2.6, 3.2]}>
        <cylinderGeometry args={[0.08, 0.1, 5.2, 8]} />
        <meshStandardMaterial color="#9aa4b6" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function TheThings({ lit, clock }) {
  const a = useRef();
  const b = useRef();
  useFrame((_, dt) => {
    const k = lit ? 1.4 : 0.35;
    if (a.current) a.current.rotation.z += dt * 0.6 * k;
    if (b.current) b.current.rotation.z -= dt * 0.9 * k;
  });
  return (
    <group position={[0, 3, 0]}>
      <mesh ref={a}>
        <torusGeometry args={[3, 0.09, 12, 90, Math.PI * 1.6]} />
        <meshBasicMaterial color={CYAN} toneMapped={false} />
      </mesh>
      <mesh ref={b}>
        <torusGeometry args={[2.2, 0.06, 12, 90, Math.PI * 1.2]} />
        <meshBasicMaterial color={GOLD} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.8, 24, 24]} />
        <meshBasicMaterial color={lit ? '#7dd3fc' : '#1e3a5f'} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Hypervisor({ lit, clock }) {
  const core = useRef();
  const feeds = useMemo(
    () =>
      [[-4, 5.5, -1], [4, 5.5, -1], [-4, 0.6, 1.5], [4, 0.6, 1.5]].map((p, i) => {
        const a = new THREE.Vector3(...p);
        const b = new THREE.Vector3(0, 3, 0);
        return { pos: p, geometry: pulseLineGeometry([a, a.clone().lerp(b, 0.5).setY(a.y + 1.2), b]), material: makePulseMaterial(GOLD, { speed: 0.8, phase: i * 0.25 }) };
      }),
    []
  );
  useEffect(() => () => feeds.forEach((f) => (f.geometry.dispose(), f.material.dispose())), [feeds]);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    feeds.forEach((f) => {
      f.material.uniforms.uTime.value = clock.current;
      f.material.uniforms.uDraw.value = damp(f.material.uniforms.uDraw.value, 1.001, 1.5, dt);
      f.material.uniforms.uOpacity.value = lit ? 1 : 0.35;
    });
    if (core.current) core.current.rotation.y += dt * 0.4;
  });
  return (
    <group>
      <group ref={core} position={[0, 3, 0]}>
        <mesh>
          <cylinderGeometry args={[2.2, 2.2, 1.6, 6, 1, true]} />
          <meshBasicMaterial color={GOLD} wireframe toneMapped={false} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[1.2, 1.2, 1, 6]} />
          <meshBasicMaterial color={lit ? '#f6d074' : '#6b4f0e'} toneMapped={false} />
        </mesh>
      </group>
      {feeds.map((f, i) => (
        <group key={i}>
          <line geometry={f.geometry} material={f.material} />
          <mesh position={f.pos}>
            <octahedronGeometry args={[0.45]} />
            <meshBasicMaterial color="#e2e8f0" wireframe toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Twin({ lit, clock }) {
  const floor = useRef();
  const edges = useMemo(() => {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.8, toneMapped: false });
    for (let i = 0; i < 5; i++) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4, 1.1, 3)), mat);
      e.position.y = 0.6 + i * 1.15;
      g.add(e);
    }
    g.userData.mat = mat;
    return g;
  }, []);
  useEffect(() => () => {
    edges.traverse((o) => o.geometry?.dispose());
    edges.userData.mat.dispose();
  }, [edges]);
  useFrame(() => {
    if (floor.current) floor.current.material.opacity = lit ? 0.45 + Math.sin(clock.current * 3) * 0.25 : 0.1;
  });
  return (
    <group>
      <primitive object={edges} />
      {/* la planta del activo afectado, resaltada */}
      <mesh ref={floor} position={[0, 2.9, 0]}>
        <boxGeometry args={[4.05, 1.1, 3.05]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
      {[[-3.2, 4.5, 0.5], [3.1, 3.4, -0.4], [2.7, 6, 0.8]].map((p, i) => (
        <mesh key={i} position={p} rotation={[0, (i - 1) * 0.4, 0]}>
          <planeGeometry args={[1.1, 1.45]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={lit ? 0.85 : 0.25} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Agentic({ lit, clock, agents, selectedAgent, onAgent }) {
  const core = useRef();
  const orbit = useRef();
  useFrame((_, dt) => {
    if (core.current) {
      core.current.rotation.y += dt * 0.5;
      core.current.rotation.x += dt * 0.2;
      core.current.scale.setScalar(1 + Math.sin(clock.current * 2.2) * 0.05);
    }
    if (orbit.current && !selectedAgent) orbit.current.rotation.y += dt * 0.25;
  });
  return (
    <group position={[0, 3, 0]}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshBasicMaterial color={lit ? '#34d399' : '#0f5132'} wireframe toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.6, 20, 20]} />
        <meshBasicMaterial color={lit ? '#a7f3d0' : '#14532d'} toneMapped={false} />
      </mesh>
      <group ref={orbit}>
        {agents.map((a, i) => {
          const ang = (i / agents.length) * Math.PI * 2;
          const pos = [Math.cos(ang) * 3.6, Math.sin(ang * 2) * 0.6, Math.sin(ang) * 3.6];
          const on = selectedAgent === a.id;
          return (
            <group key={a.id} position={pos}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  onAgent(on ? null : a.id);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => (document.body.style.cursor = '')}
              >
                <sphereGeometry args={[on ? 0.42 : 0.3, 16, 16]} />
                <meshBasicMaterial color={on ? GOLD : '#6ee7b7'} toneMapped={false} />
              </mesh>
              {lit && (
                <Html center zIndexRange={[4, 0]} position={[0, 0.75, 0]} style={{ pointerEvents: 'none' }}>
                  <span className={`agent-chip${on ? ' is-on' : ''}`}>{a.id}</span>
                </Html>
              )}
            </group>
          );
        })}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Estación completa                                                   */
/* ------------------------------------------------------------------ */

export default function FlowStation({ active, step, paused, labels, agents, selectedAgent, onAgent }) {
  const clock = useSceneClock(paused);
  const root = useRef();
  const fade = useRef(0);
  const packet = useRef();
  const trail = useRef();
  const progress = useRef(0);

  const { curve, pathGeo, pathMat } = useMemo(() => {
    const pts = FLOW_X.map((x, i) => new THREE.Vector3(x, 3 + (i % 2 ? 0.8 : -0.4), i % 2 ? -0.8 : 0.8));
    pts.unshift(new THREE.Vector3(FLOW_X[0] - 2, 1.5, 0));
    const c = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    return { curve: c, pathGeo: pulseLineGeometry(c.getPoints(240)), pathMat: makePulseMaterial(GOLD, { speed: 0.18 }) };
  }, []);

  useEffect(() => () => {
    pathGeo.dispose();
    pathMat.dispose();
  }, [pathGeo, pathMat]);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    fade.current = damp(fade.current, active ? 1 : 0, active ? 2 : 4, dt);
    if (root.current) root.current.visible = fade.current > 0.01;
    if (!root.current?.visible) return;

    // hasta dónde ha llegado el dato: la estación del paso actual
    const n = FLOW_X.length;
    let goal;
    if (step === 0 || step === 6) goal = ((t * 0.08) % 1) * 1; // recorre la cadena en bucle
    else goal = step / n; // la estación i está en (i + 1) / n: el primer punto es el arranque
    if (step === 0 || step === 6) progress.current = goal;
    else progress.current = damp(progress.current, goal, 1.6, dt);

    const u = pathMat.uniforms;
    u.uDraw.value = step === 0 || step === 6 ? 1.001 : damp(u.uDraw.value, Math.min(1.001, progress.current + 0.02), 2, dt);
    u.uTime.value = t;
    u.uOpacity.value = fade.current;

    const p = Math.min(0.999, Math.max(0.001, progress.current));
    curve.getPointAt(p, tmp);
    if (packet.current) {
      packet.current.position.copy(tmp);
      packet.current.scale.setScalar(1 + Math.sin(t * 8) * 0.12);
    }
    if (trail.current) {
      trail.current.position.copy(tmp);
      trail.current.material.opacity = 0.35 + Math.sin(t * 4) * 0.1;
    }
  });

  // qué estación está «encendida» en cada paso
  const lit = (i) => step === 0 || step === 6 || step - 1 === i;

  return (
    <group ref={root} position={FLOW_CENTER.toArray()}>
      <hemisphereLight args={['#bcd6f2', '#0b1224', 1]} />
      <directionalLight position={[10, 30, 20]} intensity={1.3} />

      {/* suelo técnico */}
      <gridHelper args={[110, 55, '#1d3557', '#12213a']} position={[5, -0.02, 0]} />

      <line geometry={pathGeo} material={pathMat} />
      <mesh ref={packet}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshBasicMaterial color="#fff3c4" toneMapped={false} />
      </mesh>
      <mesh ref={trail}>
        <sphereGeometry args={[0.9, 16, 16]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>

      <group position={[FLOW_X[0], 0, 0]}>
        <Devices lit={lit(0)} clock={clock} />
      </group>
      <group position={[FLOW_X[1], 0, 0]}>
        <TheThings lit={lit(1)} clock={clock} />
      </group>
      <group position={[FLOW_X[2], 0, 0]}>
        <Hypervisor lit={lit(2)} clock={clock} />
      </group>
      <group position={[FLOW_X[3], 0, 0]}>
        <Twin lit={lit(3)} clock={clock} />
      </group>
      <group position={[FLOW_X[4], 0, 0]}>
        <Agentic lit={lit(4) && active} clock={clock} agents={agents} selectedAgent={selectedAgent} onAgent={onAgent} />
      </group>
      <group position={[FLOW_X[5], 3, 0]}>
        <mesh>
          <torusKnotGeometry args={[0.9, 0.18, 90, 10]} />
          <meshBasicMaterial color={lit(5) ? '#f6d074' : '#5b4a1c'} wireframe toneMapped={false} />
        </mesh>
      </group>

      {/* capturas reales de la presentación, dentro de la escena */}
      <Suspense fallback={null}>
        <PhotoPanel
          url="/assets/mti-presentation/platforms/thethingsio-cuadro-de-mando-960.webp"
          width={8.5}
          position={[FLOW_X[1] - 8.2, 4.6, -3]}
          rotation={[0, 0.38, 0]}
          on={step === 2}
        />
        <PhotoPanel
          url="/assets/mti-presentation/platforms/mti-hypervisor-sala-de-control-960.webp"
          width={10}
          position={[FLOW_X[2] - 8.8, 5.4, -3]}
          rotation={[0, 0.38, 0]}
          on={step === 3}
        />
      </Suspense>

      {active && labels?.map((l, i) => (
        <Html key={l.id} position={[FLOW_X[i], -1.2, 1.5]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`stage-tag stage-tag--station${lit(i) ? ' is-on' : ''}`} style={{ '--k': COLORS[i] }}>
            {l.icon && <img src={l.icon} alt="" />}
            <span>{l.text}</span>
          </div>
        </Html>
      ))}
    </group>
  );
}
