import * as THREE from 'three';
import { instancedFromModel, spawnCharacter, findClip } from './assets.js';

/**
 * Tráfico y peatones sobre la red viaria REAL de OpenStreetMap.
 *
 * Los vehículos recorren segmentos de calle de verdad y, al llegar a un cruce,
 * eligen la siguiente calle conectada: no hay retícula sintética ni caminos
 * inventados. Los peatones hacen lo mismo sobre la acera.
 */

const FLEET = [
  { key: 'car-hatchback', count: 150, speed: [9, 15] },
  { key: 'car-sedan', count: 120, speed: [9, 14] },
  { key: 'car-taxi', count: 90, speed: [8, 14] },
  { key: 'car-van', count: 55, speed: [7, 12] },
  { key: 'car-police', count: 6, speed: [12, 17] },
  { key: 'car-ambulance', count: 4, speed: [12, 16] },
  { key: 'bus', count: 34, speed: [6, 9] },
  { key: 'truck-waste', count: 18, speed: [5, 8] },
];

const LANE = 2.7;
const roadTarget = new THREE.Vector3();

/** Recorre la red saltando de segmento en segmento por los cruces reales. */
export class RoadAgent {
  constructor(network, speed, laneOffset = LANE) {
    this.net = network;
    this.speed = speed;
    this.lane = laneOffset;
    this.pick(Math.floor(Math.random() * network.segments.length));
    this.t = Math.random() * this.seg.len;
    this.visual = new THREE.Vector3();
    this.rawPosition(this.visual);
    this.heading = this.targetHeading;
  }

  pick(index, dir = Math.random() > 0.5 ? 0 : 1) {
    this.index = index;
    this.dir = dir;
    this.seg = this.net.segments[index];
    this.t = 0;
    const a = this.dir === 0 ? this.seg.a : this.seg.b;
    const b = this.dir === 0 ? this.seg.b : this.seg.a;
    this.from = a;
    this.to = b;
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    this.dx = dx / len;
    this.dz = dz / len;
    this.targetHeading = Math.atan2(this.dx, this.dz);
  }

  step(dt) {
    this.t += this.speed * dt;
    while (this.t >= this.seg.len) {
      const remainder = this.t - this.seg.len;
      const node = this.net.nodes.get(this.net.key(this.to));
      const options = node ? node.filter((e) => e.index !== this.index) : [];
      if (options.length) {
        const next = options[Math.floor(Math.random() * options.length)];
        this.pick(next.index, next.end === 0 ? 0 : 1);
      } else {
        // final de calle: media vuelta
        this.pick(this.index, this.dir === 0 ? 1 : 0);
      }
      this.t = remainder;
    }
    this.rawPosition(roadTarget);
    const alpha = 1 - Math.exp(-dt * 10);
    this.visual.lerp(roadTarget, alpha);
    // Interpolate across the shortest angle, including the -PI / PI seam.
    const angle = Math.atan2(Math.sin(this.targetHeading - this.heading), Math.cos(this.targetHeading - this.heading));
    this.heading += angle * (1 - Math.exp(-dt * 7));
  }

  position(out) { return out.copy(this.visual); }

  /** Posición con desplazamiento al carril derecho. */
  rawPosition(out) {
    const p = this.t / this.seg.len;
    const x = this.from[0] + (this.to[0] - this.from[0]) * p;
    const z = this.from[1] + (this.to[1] - this.from[1]) * p;
    out.set(x - this.dz * this.lane, 0, z + this.dx * this.lane);
    return out;
  }
}

export function buildRealTraffic(network, library = {}, options = {}) {
  const root = new THREE.Group();
  root.name = 'traffic';
  const updaters = [];
  const nightTargets = [];
  const groups = {};

  if (!network.segments.length) return { root, updaters, nightTargets, groups };

  const dummy = new THREE.Object3D();
  const pos = new THREE.Vector3();
  const allAgents = [];
  const fleets = []; // para que las escenas puedan "detectar" vehículos concretos

  /* --- vehículos ------------------------------------------------------ */
  const density = options.density ?? 1;

  for (const raw of FLEET) {
    const def = { ...raw, count: Math.max(2, Math.round(raw.count * density)) };
    const model = library[def.key];
    const mesh =
      (model && instancedFromModel(model, def.count)) ||
      new THREE.InstancedMesh(
        new THREE.BoxGeometry(2, 1.5, 4.4),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8 }),
        def.count
      );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    root.add(mesh);
    groups[def.key] = mesh;

    const agents = Array.from(
      { length: def.count },
      () => new RoadAgent(network, THREE.MathUtils.lerp(def.speed[0], def.speed[1], Math.random()))
    );
    allAgents.push(...agents);
    fleets.push({ key: def.key, agents, mesh });

    updaters.push((t, dt) => {
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        a.step(dt);
        a.position(pos);
        dummy.position.copy(pos);
        dummy.position.y = 0.05;
        dummy.rotation.set(0, a.heading, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    if (def.key === 'car-police' || def.key === 'car-ambulance') {
      const sirenMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.9 });
      const sirens = new THREE.InstancedMesh(new THREE.SphereGeometry(0.45, 8, 6), sirenMat, def.count);
      sirens.frustumCulled = false;
      root.add(sirens);
      updaters.push((t) => {
        const on = Math.sin(t * 9) > 0;
        sirenMat.color.setHex(on ? 0x3b82f6 : 0xf43f5e);
        for (let i = 0; i < agents.length; i++) {
          agents[i].position(pos);
          dummy.position.set(pos.x, 2, pos.z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(1 + Math.sin(t * 9 + i) * 0.25);
          dummy.updateMatrix();
          sirens.setMatrixAt(i, dummy.matrix);
        }
        sirens.instanceMatrix.needsUpdate = true;
      });
    }
  }

  /* --- faros ----------------------------------------------------------- */
  const headMat = new THREE.MeshBasicMaterial({
    color: 0xfff3d0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const heads = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 11), headMat, allAgents.length);
  heads.frustumCulled = false;
  root.add(heads);
  updaters.push(() => {
    for (let i = 0; i < allAgents.length; i++) {
      const a = allAgents[i];
      a.position(pos);
      dummy.position.set(pos.x, 0.4, pos.z);
      dummy.rotation.set(-Math.PI / 2, 0, -a.heading);
      dummy.scale.setScalar(1);
      dummy.translateY(6.5);
      dummy.updateMatrix();
      heads.setMatrixAt(i, dummy.matrix);
    }
    heads.instanceMatrix.needsUpdate = true;
  });
  nightTargets.push({ mat: headMat, opacityDay: 0, opacityNight: 0.28 });

  /* --- peatones sobre la acera ------------------------------------------ */
  const charModels = [library['person-man'], library['person-woman']].filter(Boolean);
  const people = [];
  const walkerCount = options.people ?? 70;

  if (charModels.length) {
    for (let i = 0; i < walkerCount; i++) {
      const model = charModels[i % charModels.length];
      const { root: person, mixer, animations, faceOffset } = spawnCharacter(model);
      const clip = findClip(animations, 'walk', 'walking');
      if (clip) {
        const action = mixer.clipAction(clip);
        action.time = Math.random() * clip.duration;
        action.play();
      }
      person.traverse((o) => {
        if (o.isMesh || o.isSkinnedMesh) {
          o.material = Array.isArray(o.material) ? o.material.map((m) => m.clone()) : o.material.clone();
          const tone = 0.85 + Math.random() * 0.3;
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.color && m.color.multiplyScalar(tone));
        }
      });
      root.add(person);
      const agent = new RoadAgent(network, 1.1 + Math.random() * 0.7, (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 3));
      people.push({ obj: person, mixer, agent, faceOffset });
    }
  }

  // Nivel de detalle de peatones: animar 70 esqueletos cuesta mucho y de lejos
  // no se aprecia. Se anima solo lo cercano y el resto se oculta.
  const camPos = new THREE.Vector3();
  updaters.push((t, dt, ctx) => {
    if (ctx?.camera) camPos.copy(ctx.camera.position);
    for (const p of people) {
      p.agent.step(dt);
      p.agent.position(pos);
      const d2 = camPos.distanceToSquared(pos);
      const visible = d2 < 340 * 340;
      p.obj.visible = visible;
      if (!visible) continue;
      p.obj.position.set(pos.x, 0, pos.z);
      p.obj.rotation.y = p.agent.heading + (p.faceOffset ?? 0);
      // más lejos, la animación va a media frecuencia
      if (d2 < 150 * 150) p.mixer.update(dt);
      else {
        p.halfFrame = !p.halfFrame;
        if (p.halfFrame) p.mixer.update(dt * 2);
      }
    }
  });
  groups.people = people;
  groups.fleets = fleets;
  groups.agents = allAgents;

  /* --- drones de inspección ---------------------------------------------- */
  {
    const drones = [];
    const c = options.center ?? [0, 0];
    for (let i = 0; i < 3; i++) {
      const g = new THREE.Group();
      g.add(
        new THREE.Mesh(
          new THREE.OctahedronGeometry(3),
          new THREE.MeshStandardMaterial({ color: 0x0ea5e9, emissive: 0x0ea5e9, emissiveIntensity: 1.4 })
        )
      );
      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(6, 0.3, 6, 26),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 })
      );
      halo.rotation.x = Math.PI / 2;
      g.add(halo);
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(9, 90, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
      );
      beam.position.y = -45;
      g.add(beam);
      root.add(g);
      drones.push({ g, halo, r: 260 + i * 190, y: 190 + i * 60, speed: 0.09 + i * 0.03, phase: i * 2.1, c });
    }
    updaters.push((t) => {
      for (const d of drones) {
        const a = t * d.speed + d.phase;
        d.g.position.set(d.c[0] + Math.cos(a) * d.r, d.y + Math.sin(t * 1.1 + d.phase) * 8, d.c[1] + Math.sin(a) * d.r * 0.7);
        d.halo.rotation.z = t * 2;
      }
    });
    groups.drones = drones.map((d) => d.g);
  }

  return { root, updaters, nightTargets, groups };
}
