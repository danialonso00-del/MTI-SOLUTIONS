import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sharedLibrary } from '../../three/assets.js';
import { useSceneClock, damp, makePulseMaterial, pulseLineGeometry, GOLD, CYAN } from './fx.jsx';

/**
 * Capítulo 4 · una infraestructura que se construye delante del cliente.
 *
 *   0 plano técnico      la retícula y las huellas se dibujan desde el centro
 *   1 equipos            cámaras, farolas, semáforos y sensores caen en su sitio
 *   2 conectividad       cada equipo se enlaza con la pasarela, y esta con el centro
 *   3 integración        los datos suben a una capa común y aparece el gemelo
 *   4 centro de control  el edificio se enciende y aparecen las pantallas
 *   5 mantenimiento      un equipo da aviso, llega la furgoneta, vuelve a verde
 *   6 operación          todo en marcha, con tráfico en la calle
 *
 * Los modelos son los mismos glTF de la ciudad 3D (ya descargados): se clonan,
 * no se vuelven a pedir. Si la ciudad no hubiera podido cargarlos, cada equipo
 * se dibuja con una forma primitiva y la escena se cuenta igual.
 */

export const BUILD_CENTER = new THREE.Vector3(150, 0, -70);

const POSES = [
  { p: [0, 74, 30], t: [0, 0, -2] },
  { p: [38, 30, 44], t: [4, 2, 0] },
  { p: [-34, 34, 44], t: [2, 2, 0] },
  { p: [4, 50, 58], t: [0, 9, 0] },
  { p: [22, 36, 58], t: [-18, 11, -2] },
  { p: [34, 15, 26], t: [20, 3, 2] },
  { p: [48, 40, 62], t: [0, 4, 0] },
];

export function buildPose(step, aspect) {
  const s = POSES[Math.max(0, Math.min(step, POSES.length - 1))];
  // en vertical hace falta más distancia para que quepa la escena
  const k = aspect < 0.9 ? 1.55 : 1;
  const c = BUILD_CENTER;
  return {
    position: [c.x + s.p[0] * k, c.y + s.p[1] * k, c.z + s.p[2] * k],
    target: [c.x + s.t[0], c.y + s.t[1], c.z + s.t[2]],
  };
}

/* ------------------------------------------------------------------ */
/* Disposición del emplazamiento                                       */
/* ------------------------------------------------------------------ */

const DEVICES = [
  { key: 'cctv-camera', pos: [10, 0, -10], pole: 6, kind: 'cam' },
  { key: 'cctv-camera', pos: [24, 0, 8], pole: 6, kind: 'cam' },
  { key: 'cctv-camera', pos: [-6, 0, 12], pole: 6, kind: 'cam' },
  { key: 'street-lamp', pos: [2, 0, -12], kind: 'lamp' },
  { key: 'street-lamp', pos: [16, 0, -12], kind: 'lamp' },
  { key: 'street-lamp', pos: [30, 0, -12], kind: 'lamp' },
  { key: 'traffic-light', pos: [18, 0, 12], kind: 'light' },
  { key: 'traffic-light', pos: [4, 0, 12], kind: 'light' },
  { key: null, pos: [22, 0, 0], kind: 'sensor' },
  { key: null, pos: [8, 0, 2], kind: 'sensor' },
  { key: null, pos: [-2, 0, -4], kind: 'sensor' },
  { key: null, pos: [30, 0, -2], kind: 'sensor' },
];
const GATEWAY = [12, 0, -1];
const CONTROL = [-26, 0, -4];
const ALERT_DEVICE = 1; // el que dará el aviso de mantenimiento
const DATA_Y = 15;

/* ------------------------------------------------------------------ */
/* Retícula de plano                                                   */
/* ------------------------------------------------------------------ */

const gridVert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const gridFrag = /* glsl */ `
  uniform float uReveal;
  uniform float uFade;
  uniform float uTime;
  varying vec2 vP;
  float line(float v, float w) {
    float d = abs(fract(v - 0.5) - 0.5) / fwidth(v);
    return 1.0 - min(d / w, 1.0);
  }
  void main() {
    float minor = max(line(vP.x / 2.0, 1.0), line(vP.y / 2.0, 1.0)) * 0.25;
    float major = max(line(vP.x / 10.0, 1.2), line(vP.y / 10.0, 1.2)) * 0.7;
    float r = length(vP);
    float front = uReveal * 70.0;
    float shown = smoothstep(front, front - 6.0, r);
    float edge = exp(-pow((r - front) * 0.35, 2.0)) * step(0.01, uReveal) * (1.0 - step(0.999, uReveal));
    float fall = smoothstep(62.0, 20.0, r);
    vec3 col = vec3(0.32, 0.6, 0.95);
    float a = (max(minor, major) * shown * fall + edge * 0.8) * uFade;
    gl_FragColor = vec4(col + edge * vec3(0.9, 0.6, 0.1), a);
  }
`;

/* ------------------------------------------------------------------ */
/* Equipo individual                                                   */
/* ------------------------------------------------------------------ */

function makeDevice(d) {
  const g = new THREE.Group();
  const lib = sharedLibrary;
  const model = d.key && lib?.[d.key]?.scene;
  if (model) {
    const m = model.clone(true);
    m.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = false;
        o.receiveShadow = false;
      }
    });
    if (d.pole) {
      // las cámaras van en un báculo
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.16, d.pole, 8),
        new THREE.MeshStandardMaterial({ color: '#8b95a8', metalness: 0.6, roughness: 0.4 })
      );
      pole.position.y = d.pole / 2;
      g.add(pole);
      m.position.y = d.pole;
      m.scale.multiplyScalar(1.15);
    }
    g.add(m);
  } else {
    // forma primitiva: un sensor es una caja pequeña con piloto
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, d.kind === 'sensor' ? 1 : 5, 1.2),
      new THREE.MeshStandardMaterial({ color: '#c9d3e3', metalness: 0.3, roughness: 0.5 })
    );
    body.position.y = d.kind === 'sensor' ? 0.5 : 2.5;
    g.add(body);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color: GOLD, toneMapped: false }));
    led.position.y = d.kind === 'sensor' ? 1.2 : 5.2;
    g.add(led);
  }
  g.position.set(...d.pos);
  return g;
}

/* ------------------------------------------------------------------ */
/* Pantalla del centro de control (textura dibujada en un lienzo)       */
/* ------------------------------------------------------------------ */

function useScreenTexture(seed) {
  const state = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 144;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const vals = Array.from({ length: 24 }, (_, i) => 0.4 + 0.3 * Math.sin(i * 0.7 + seed));
    return { c, tex, vals, last: 0 };
  }, [seed]);

  const draw = (t) => {
    const { c, tex, vals } = state;
    const g = c.getContext('2d');
    g.fillStyle = '#07101f';
    g.fillRect(0, 0, 256, 144);
    g.strokeStyle = 'rgba(56,189,248,0.25)';
    for (let x = 0; x < 256; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 144);
      g.stroke();
    }
    vals.shift();
    vals.push(0.35 + 0.35 * Math.abs(Math.sin(t * 0.9 + seed * 3)) + Math.random() * 0.12);
    g.strokeStyle = seed % 2 ? '#e6a817' : '#38bdf8';
    g.lineWidth = 3;
    g.beginPath();
    vals.forEach((v, i) => {
      const x = (i / (vals.length - 1)) * 236 + 10;
      const y = 130 - v * 110;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();
    g.fillStyle = '#e6a817';
    g.fillRect(10, 8, 60 + (seed * 17) % 40, 6);
    tex.needsUpdate = true;
  };

  useEffect(() => () => state.tex.dispose(), [state]);
  return { tex: state.tex, draw, state };
}

function Screen({ seed, position, on, clock }) {
  const { tex, draw, state } = useScreenTexture(seed);
  const ref = useRef();
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    if (!ref.current) return;
    const m = ref.current.material;
    m.opacity = damp(m.opacity, on ? 0.95 : 0, 3, dt);
    ref.current.visible = m.opacity > 0.01;
    if (on && clock.current - state.last > 0.45) {
      state.last = clock.current;
      draw(clock.current);
    }
  });
  return (
    <mesh ref={ref} position={position} rotation={[0, Math.PI / 2 - 0.35, 0]}>
      <planeGeometry args={[7, 3.9]} />
      <meshBasicMaterial map={tex} transparent opacity={0} toneMapped={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Estación                                                            */
/* ------------------------------------------------------------------ */

export default function BuildStation({ active, step, paused, labels }) {
  const clock = useSceneClock(paused);
  const root = useRef();
  const fade = useRef(0);
  const reveal = useRef(0);
  const deviceRefs = useRef([]);
  const grow = useRef(DEVICES.map(() => 0));
  const deployAt = useRef(-1);
  const alertRing = useRef();
  const van = useRef();
  const cars = useRef([]);
  const twin = useRef();
  const dataPlane = useRef();
  const control = useRef();
  const controlGlow = useRef();

  const devices = useMemo(() => DEVICES.map(makeDevice), []);
  // el edificio va dentro de un grupo: la animación de aparición escala el
  // grupo y no pisa la escala con la que el modelo viene normalizado
  const controlBuilding = useMemo(() => {
    const g = new THREE.Group();
    const m = sharedLibrary?.['building-office']?.scene?.clone(true);
    if (m) {
      m.scale.multiplyScalar(1.25);
      g.add(m);
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 10), new THREE.MeshStandardMaterial({ color: '#d7dde8' }));
      box.position.y = 7;
      g.add(box);
    }
    return g;
  }, []);
  const controlSize = useMemo(() => {
    const b = new THREE.Box3().setFromObject(controlBuilding);
    const v = new THREE.Vector3();
    b.getSize(v);
    return v;
  }, [controlBuilding]);
  const vanModel = useMemo(() => sharedLibrary?.['car-van']?.scene?.clone(true) ?? null, []);
  const carModels = useMemo(
    () => ['car-sedan', 'car-taxi', 'bus'].map((k) => sharedLibrary?.[k]?.scene?.clone(true) ?? null).filter(Boolean),
    []
  );

  const gridMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uReveal: { value: 0 }, uFade: { value: 0 }, uTime: { value: 0 } },
        vertexShader: gridVert,
        fragmentShader: gridFrag,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  /* --- trazos del plano: calzada y huellas de edificio -------------- */
  const plan = useMemo(() => {
    const shapes = [
      [[-44, 0.05, 6], [44, 0.05, 6]],
      [[-44, 0.05, -6], [44, 0.05, -6]],
      [[-32, 0.05, -12], [-20, 0.05, -12], [-20, 0.05, 4], [-32, 0.05, 4], [-32, 0.05, -12]],
      [[36, 0.05, 14], [44, 0.05, 14], [44, 0.05, 24], [36, 0.05, 24], [36, 0.05, 14]],
      [[-12, 0.05, 14], [-2, 0.05, 14], [-2, 0.05, 22], [-12, 0.05, 22], [-12, 0.05, 14]],
    ];
    return shapes.map((s, i) => {
      const pts = [];
      for (let k = 0; k < s.length - 1; k++) {
        const a = new THREE.Vector3(...s[k]);
        const b = new THREE.Vector3(...s[k + 1]);
        for (let j = 0; j < 12; j++) pts.push(a.clone().lerp(b, j / 12));
      }
      pts.push(new THREE.Vector3(...s[s.length - 1]));
      return { geometry: pulseLineGeometry(pts), material: makePulseMaterial(i < 2 ? '#7aa7e8' : CYAN, { speed: 0.12, phase: i * 0.2 }) };
    });
  }, []);

  /* --- enlaces: equipo → pasarela → centro de control --------------- */
  const links = useMemo(() => {
    const out = [];
    const gw = new THREE.Vector3(...GATEWAY).setY(7);
    DEVICES.forEach((d, i) => {
      const a = new THREE.Vector3(...d.pos).setY(d.pole ?? (d.kind === 'sensor' ? 1.2 : 5));
      const mid = a.clone().lerp(gw, 0.5).setY(Math.max(a.y, gw.y) + 4);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, gw);
      out.push({ geometry: pulseLineGeometry(curve.getPoints(32)), material: makePulseMaterial(GOLD, { speed: 0.5, phase: i * 0.09 }) });
    });
    const ctl = new THREE.Vector3(...CONTROL).setY(16);
    const curve = new THREE.QuadraticBezierCurve3(gw, gw.clone().lerp(ctl, 0.5).setY(18), ctl);
    out.push({ geometry: pulseLineGeometry(curve.getPoints(48)), material: makePulseMaterial(GOLD, { speed: 0.6 }), trunk: true });
    return out;
  }, []);

  /* --- columnas de datos hacia la capa común ------------------------ */
  const risers = useMemo(
    () =>
      DEVICES.map((d, i) => {
        const a = new THREE.Vector3(...d.pos).setY(d.pole ?? 1);
        const b = a.clone().setY(DATA_Y);
        const pts = Array.from({ length: 12 }, (_, k) => a.clone().lerp(b, k / 11));
        return { geometry: pulseLineGeometry(pts), material: makePulseMaterial(CYAN, { speed: 0.9, phase: i * 0.07 }) };
      }),
    []
  );

  /* --- gemelo digital: aristas del emplazamiento sobre la capa ------ */
  const twinGeo = useMemo(() => {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: '#a855f7', transparent: true, opacity: 0, toneMapped: false });
    const boxes = [
      [CONTROL[0], 7, CONTROL[2], 10, 14, 10],
      [40, 3, 19, 8, 6, 10],
      [-7, 2.5, 18, 10, 5, 8],
    ];
    for (const [x, y, z, w, h, d] of boxes) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), mat);
      e.position.set(x, DATA_Y + 0.5 + y * 0.35, z);
      e.scale.y = 0.35;
      g.add(e);
    }
    g.userData.mat = mat;
    return g;
  }, []);

  useEffect(
    () => () => {
      gridMat.dispose();
      [...plan, ...links, ...risers].forEach((l) => {
        l.geometry.dispose();
        l.material.dispose();
      });
      twinGeo.traverse((o) => o.geometry?.dispose());
      twinGeo.userData.mat.dispose();
    },
    [gridMat, plan, links, risers, twinGeo]
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = clock.current;
    fade.current = damp(fade.current, active ? 1 : 0, active ? 2 : 4, dt);
    if (root.current) root.current.visible = fade.current > 0.01;
    if (!root.current?.visible) return;
    const f = fade.current;

    // 0 · plano
    reveal.current = damp(reveal.current, active ? 1 : 0, 0.9, dt);
    gridMat.uniforms.uReveal.value = reveal.current;
    gridMat.uniforms.uFade.value = f;
    plan.forEach((l, i) => {
      const u = l.material.uniforms;
      u.uDraw.value = damp(u.uDraw.value, active ? 1.001 : 0, 0.8 + i * 0.15, dt);
      u.uTime.value = t;
      u.uOpacity.value = f * 0.9;
    });

    // 1 · equipos: caen de uno en uno, escalonados, desde que empieza el paso
    if (step >= 1 && deployAt.current < 0) deployAt.current = t;
    if (step < 1) deployAt.current = -1;
    devices.forEach((g, i) => {
      const due = step >= 1 && (paused || t - deployAt.current > i * 0.14);
      grow.current[i] = damp(grow.current[i], due ? 1 : 0, due ? 4 : 8, paused ? 1 : dt);
      const s = grow.current[i];
      g.visible = s > 0.01;
      g.scale.setScalar(Math.max(0.001, s));
      g.position.y = (1 - s) * 10;
    });

    // 2 · conectividad
    links.forEach((l) => {
      const u = l.material.uniforms;
      const on = l.trunk ? step >= 2 : step >= 2;
      u.uDraw.value = damp(u.uDraw.value, on ? 1.001 : 0, on ? 1.4 : 5, dt);
      u.uTime.value = t * (step >= 6 ? 1.8 : 1);
      u.uOpacity.value = f;
    });

    // 3 · integración: columnas de datos, capa común y gemelo
    risers.forEach((l) => {
      const u = l.material.uniforms;
      u.uDraw.value = damp(u.uDraw.value, step >= 3 ? 1.001 : 0, step >= 3 ? 1.2 : 5, dt);
      u.uTime.value = t;
      u.uOpacity.value = f * 0.8;
    });
    if (dataPlane.current) {
      const m = dataPlane.current.material;
      m.opacity = damp(m.opacity, step >= 3 ? 0.14 * f : 0, 2, dt);
      dataPlane.current.visible = m.opacity > 0.005;
    }
    const tm = twinGeo.userData.mat;
    tm.opacity = damp(tm.opacity, step >= 3 ? 0.85 * f : 0, 2, dt);
    if (twin.current) twin.current.visible = tm.opacity > 0.01;

    // 4 · centro de control
    if (controlGlow.current) {
      const m = controlGlow.current.material;
      m.opacity = damp(m.opacity, step >= 4 ? 0.1 * f : 0, 2, dt);
      controlGlow.current.scale.setScalar(1 + Math.sin(t * 2) * 0.015);
    }
    if (control.current) {
      const s = damp(control.current.scale.x, step >= 1 ? 1 : 0.001, 2, dt);
      control.current.scale.setScalar(s);
    }

    // 5 · mantenimiento: aviso, furgoneta, verde
    if (alertRing.current) {
      const d = DEVICES[ALERT_DEVICE];
      const cycle = step === 5 ? (t % 9) / 9 : step > 5 ? 1 : 0;
      const alerting = step === 5 && cycle < 0.55;
      alertRing.current.visible = step >= 5;
      alertRing.current.position.set(d.pos[0], 0.2, d.pos[2]);
      const p = (t * 1.2) % 1;
      alertRing.current.scale.setScalar(1 + p * 4);
      alertRing.current.material.color.set(alerting ? '#f59e0b' : '#10b981');
      alertRing.current.material.opacity = (1 - p) * 0.8 * f;
      if (van.current) {
        van.current.visible = step === 5;
        // la furgoneta recorre la calle hasta el equipo y se detiene
        const k = Math.min(1, cycle / 0.5);
        const e = k * k * (3 - 2 * k);
        van.current.position.set(-40 + (d.pos[0] - 3 + 40) * e, 0, 3);
        van.current.rotation.y = Math.PI / 2;
      }
    }

    // 6 · operación: tráfico en la calle
    cars.current.forEach((c, i) => {
      if (!c) return;
      c.visible = step >= 6;
      const lane = i % 2 ? 3 : -3;
      const dir = i % 2 ? 1 : -1;
      const x = ((((t * (6 + i * 1.5) + i * 30) % 90) + 90) % 90) - 45;
      c.position.set(x * dir, 0, lane);
      c.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    });
  });

  return (
    <group ref={root} position={BUILD_CENTER.toArray()}>
      <hemisphereLight args={['#bcd6f2', '#10182a', 1.1]} />
      <directionalLight position={[30, 60, 40]} intensity={1.6} color="#fff4dd" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} material={gridMat} renderOrder={0}>
        <planeGeometry args={[140, 110]} />
      </mesh>
      {plan.map((l, i) => (
        <line key={i} geometry={l.geometry} material={l.material} renderOrder={1} />
      ))}

      {devices.map((g, i) => (
        <primitive key={i} object={g} ref={(el) => (deviceRefs.current[i] = el)} />
      ))}

      {/* pasarela */}
      <group position={GATEWAY}>
        <mesh position={[0, 3.5, 0]} visible={step >= 2}>
          <cylinderGeometry args={[0.15, 0.2, 7, 8]} />
          <meshStandardMaterial color="#9aa4b6" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={[0, 7.2, 0]} visible={step >= 2}>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color={GOLD} toneMapped={false} />
        </mesh>
      </group>

      <primitive object={controlBuilding} ref={control} position={CONTROL} />
      <group position={[CONTROL[0], controlSize.y / 2, CONTROL[2]]}>
        <mesh ref={controlGlow}>
          <boxGeometry args={[controlSize.x * 1.08 + 0.4, controlSize.y * 1.04 + 0.4, controlSize.z * 1.08 + 0.4]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <lineSegments visible={step >= 4}>
          <edgesGeometry args={[new THREE.BoxGeometry(controlSize.x * 1.08 + 0.4, controlSize.y * 1.04 + 0.4, controlSize.z * 1.08 + 0.4)]} />
          <lineBasicMaterial color={GOLD} transparent opacity={0.85} toneMapped={false} />
        </lineSegments>
      </group>
      <Screen seed={1} position={[CONTROL[0] + controlSize.x * 0.9, controlSize.y + 3, CONTROL[2] - 5]} on={step >= 4} clock={clock} />
      <Screen seed={2} position={[CONTROL[0] + controlSize.x * 0.9 + 1, controlSize.y + 3, CONTROL[2] + 3]} on={step >= 4} clock={clock} />
      <Screen seed={3} position={[CONTROL[0] + controlSize.x * 0.9, controlSize.y + 7.5, CONTROL[2] - 1]} on={step >= 4} clock={clock} />

      {links.map((l, i) => (
        <line key={`l${i}`} geometry={l.geometry} material={l.material} renderOrder={2} />
      ))}
      {risers.map((l, i) => (
        <line key={`r${i}`} geometry={l.geometry} material={l.material} renderOrder={2} />
      ))}
      <mesh ref={dataPlane} position={[6, DATA_Y, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 44]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <primitive object={twinGeo} ref={twin} />

      <mesh ref={alertRing} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[1.2, 1.5, 48]} />
        <meshBasicMaterial color="#f59e0b" transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {vanModel && <primitive object={vanModel} ref={van} visible={false} />}
      {carModels.map((c, i) => (
        <primitive key={`c${i}`} object={c} ref={(el) => (cars.current[i] = el)} visible={false} />
      ))}

      {/* rótulos en el espacio: dónde interviene cada línea de servicio */}
      {active && labels?.map((l) => (
        <Html key={l.id} position={l.pos} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`stage-tag${l.on ? ' is-on' : ''}`}>
            {l.icon && <img src={l.icon} alt="" />}
            <span>{l.text}</span>
          </div>
        </Html>
      ))}
    </group>
  );
}

/** Dónde se rotula cada línea de servicio dentro del emplazamiento. */
export const BUILD_TAG_POS = {
  design: [-10, 1, -22],
  install: [24, 12, 10],
  iot: [12, 11, -1],
  twin: [-8, DATA_Y + 5, 18],
  smartcity: [-26, 29, -4],
  ai: [-18, 24, 8],
  cert: [2, 9, -15],
  om: [22, 7, 4],
};
