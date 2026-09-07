import * as THREE from 'three';
import { SOLUTIONS as DEFAULT_SOLUTIONS, INDUSTRIES } from '../data/solutions.js';

/** Textura radial reutilizada por los halos de los hotspots. */
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Crea un marcador 3D por solución: haz de luz vertical, anillos expansivos
 * en el suelo, pin flotante y esfera invisible para el raycast.
 */
export function buildHotspots(solutions = DEFAULT_SOLUTIONS) {
  const root = new THREE.Group();
  root.name = 'hotspots';

  const glow = glowTexture();
  const updaters = [];
  const hotspots = [];
  const pickables = [];

  // el catálogo llega ya proyectado a metros locales; sin anchor no hay hotspot
  solutions.filter((s) => Array.isArray(s.anchor)).forEach((sol, index) => {
    // el catálogo puede venir del backend: si trae una industria que la
    // interfaz ya no conoce, se pinta con el azul de marca en vez de romper
    const color = new THREE.Color(INDUSTRIES[sol.industry]?.color ?? '#0ea5e9');
    const [x, y, z] = sol.anchor;
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    // haz vertical
    const beamMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(5, 9, y, 18, 1, true), beamMat);
    beam.position.y = y / 2;
    g.add(beam);

    // anillos expansivos en el suelo
    const rings = [0, 1, 2].map(() => {
      const m = new THREE.Mesh(
        new THREE.RingGeometry(0.94, 1, 64),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.y = 0.4;
      g.add(m);
      return m;
    });

    // disco base
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(16, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.1, depthWrite: false })
    );
    disc.rotation.x = -Math.PI / 2;
    disc.position.y = 0.3;
    g.add(disc);

    // pin
    const pin = new THREE.Mesh(
      new THREE.OctahedronGeometry(4.6),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.8, roughness: 0.25, metalness: 0.4 })
    );
    pin.position.y = y;
    g.add(pin);

    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glow, color, transparent: true, opacity: 0.75, depthWrite: false })
    );
    halo.scale.setScalar(38);
    halo.position.y = y;
    g.add(halo);

    // onda que sale del punto al seleccionarlo
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1, 72),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.y = 1.4;
    g.add(ripple);

    // objetivo de click (invisible, generoso)
    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(20, 12, 10),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hit.position.y = y;
    hit.userData.solutionId = sol.id;
    g.add(hit);
    pickables.push(hit);

    root.add(g);

    const state = {
      id: sol.id,
      solution: sol,
      group: g,
      pin,
      halo,
      beam,
      rings,
      disc,
      anchor: new THREE.Vector3(x, y, z),
      color,
      visibleByFilter: true,
      active: false,
      ripple,
      rippleAt: -10,
      opacity: 1,
      target: 1,
    };
    hotspots.push(state);

    const phase = index * 0.7;
    let wasActive = false;
    updaters.push((t, dt) => {
      // al pasar a activo, se lanza una onda desde el punto
      if (state.active && !wasActive) state.rippleAt = t;
      wasActive = state.active;
      const age = t - state.rippleAt;
      if (age < 1.4) {
        const k = age / 1.4;
        ripple.scale.setScalar(6 + k * 70);
        ripple.material.opacity = 0.55 * (1 - k) * state.opacity;
      } else {
        ripple.material.opacity = 0;
      }

      state.opacity += (state.target - state.opacity) * Math.min(1, dt * 6);
      const o = state.opacity;
      rings.forEach((r, i) => {
        const p = (t * 0.45 + i / 3 + phase) % 1;
        const s = 8 + p * 34;
        r.scale.set(s, s, s);
        r.material.opacity = (state.active ? 0.22 : 0.55) * (1 - p) * o;
      });
      const pulse = 1 + Math.sin(t * 2.4 + phase) * 0.12;
      pin.scale.setScalar(pulse * (state.active ? 1.5 : 1));
      pin.rotation.y = t * 0.9;
      pin.rotation.x = Math.sin(t * 0.6) * 0.25;
      pin.position.y = state.anchor.y + Math.sin(t * 1.6 + phase) * 2.4;
      halo.position.y = pin.position.y;
      halo.scale.setScalar((state.active ? 44 : 38) * (0.96 + Math.sin(t * 2 + phase) * 0.05));
      halo.material.opacity = (state.active ? 0.6 : 0.5) * o;
      // al abrirse la escena el haz se aparta: la propia escena ya es el foco
      beamMat.opacity = (state.active ? 0.045 : 0.1) * o;
      disc.material.opacity = (state.active ? 0.05 : 0.07) * o;
      pin.material.emissiveIntensity = (state.active ? 3.2 : 1.8) * Math.max(o, 0.15);
      g.visible = o > 0.02;
    });
  });

  return { root, updaters, hotspots, pickables };
}
