import * as THREE from 'three';
import { DataPanel } from './datapanel.js';

/**
 * Simulación de incidente: la historia completa de la plataforma en 45 segundos.
 *
 * Un incidente en la vía → lo detecta la videoanalítica → el centro de mando
 * correlaciona y abre protocolo → despacha una ambulancia que llega conduciendo
 * por calles reales → se desvía el tráfico → se cierra el aviso.
 *
 * Es lo que permite contar en una reunión cómo encajan las verticales entre sí,
 * en vez de enseñarlas por separado.
 */

export const INCIDENT_STEPS = [
  {
    at: 0,
    title: 'Incidente detectado',
    text: 'La videoanalítica marca una colisión en la calzada y genera el aviso automáticamente.',
    tone: 'alert',
  },
  {
    at: 7,
    title: 'Correlación en el centro de mando',
    text: 'Smart Hypervisor cruza cámaras, aforo y sensores: confirma el incidente y abre el protocolo.',
  },
  {
    at: 15,
    title: 'Recurso despachado',
    text: 'Se asigna la ambulancia más cercana y se le abre camino con prioridad semafórica.',
  },
  {
    at: 26,
    title: 'Tráfico desviado',
    text: 'Se recalculan los ciclos del corredor y se avisa a los paneles de mensaje variable.',
  },
  {
    at: 36,
    title: 'Incidente resuelto',
    text: 'Vía liberada y aviso cerrado. Todo el episodio queda trazado para el informe.',
  },
];

export const INCIDENT_DURATION = 45;

/** Enrutado voraz por el grafo: en cada cruce elige el vecino que más acerca. */
function routeTowards(network, agent, target) {
  const node = network.nodes.get(network.key(agent.to));
  if (!node) return;
  let best = null;
  let bestD = Infinity;
  for (const option of node) {
    if (option.index === agent.index) continue;
    const seg = network.segments[option.index];
    const end = option.end === 0 ? seg.b : seg.a;
    const d = (end[0] - target[0]) ** 2 + (end[1] - target[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = option;
    }
  }
  if (best) agent.pick(best.index, best.end === 0 ? 0 : 1);
}

export function createIncident({ city, traffic, industries }) {
  const group = new THREE.Group();
  group.name = 'incident';

  const accent = industries?.['smart-cities']?.color ?? '#0ea5e9';
  const alert = '#f43f5e';

  // el incidente se coloca en un cruce real con cámara cerca
  const cam = (city.cameraState ?? [])[Math.floor((city.cameraState?.length ?? 1) / 3)] ?? { x: 0, z: 0, y: 10 };
  const point = [cam.x + 14, cam.z + 14];

  /* --- señalización del punto ---------------------------------------- */
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(0.92, 1, 64),
      new THREE.MeshBasicMaterial({ color: alert, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(point[0], 0.9, point[1]);
    group.add(m);
    return m;
  });

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(3.2),
    new THREE.MeshStandardMaterial({ color: alert, emissive: alert, emissiveIntensity: 2.4, roughness: 0.3 })
  );
  beacon.position.set(point[0], 16, point[1]);
  group.add(beacon);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 9, 32, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: alert, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })
  );
  beam.position.set(point[0], 16, point[1]);
  group.add(beam);

  /* --- cono de la cámara que lo ve ------------------------------------ */
  const cone = new THREE.Mesh(
    new THREE.ConeGeometry(12, 30, 22, 1, true),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  group.add(cone);

  /* --- corredor de desvío --------------------------------------------- */
  const detourMat = new THREE.LineBasicMaterial({ color: '#e6a817', transparent: true, opacity: 0 });
  const detourPts = [];
  {
    // se toma una calle próxima como itinerario alternativo
    const segs = city.network.segments;
    let start = 0;
    let bestD = Infinity;
    for (let i = 0; i < segs.length; i++) {
      const d = (segs[i].a[0] - point[0]) ** 2 + (segs[i].a[1] - point[1]) ** 2;
      if (d > 900 && d < bestD) {
        bestD = d;
        start = i;
      }
    }
    let cur = { index: start, end: 1 };
    let p = segs[start].a;
    detourPts.push(new THREE.Vector3(p[0], 2, p[1]));
    for (let k = 0; k < 14; k++) {
      const seg = segs[cur.index];
      const end = cur.end === 1 ? seg.b : seg.a;
      detourPts.push(new THREE.Vector3(end[0], 2, end[1]));
      const node = city.network.nodes.get(city.network.key(end));
      const next = node?.find((o) => o.index !== cur.index);
      if (!next) break;
      cur = { index: next.index, end: next.end === 0 ? 1 : 0 };
    }
  }
  const detour = new THREE.Line(new THREE.BufferGeometry().setFromPoints(detourPts), detourMat);
  group.add(detour);

  /* --- panel de la sala de control ------------------------------------ */
  const panel = new DataPanel({
    title: 'Protocolo de incidente',
    subtitle: 'Centro de mando · corredor urbano',
    accent: alert,
    photo: 'control-room',
    metrics: [
      { label: 'Aviso', value: 1, icon: 'alert' },
      { label: 'Recursos', value: 2, icon: 'car' },
      { label: 'Tiempo resp.', value: 4, suffix: ' min', live: true, jitter: 1, icon: 'clock' },
    ],
    chart: 'line',
    rows: [
      { text: 'Colisión detectada por analítica de vídeo', tone: 'alert' },
      { text: 'Ambulancia 12 en camino · prioridad semafórica' },
    ],
  });
  group.add(panel.mesh);

  /* --- ambulancia despachada ------------------------------------------ */
  const fleet = traffic.groups?.fleets?.find((f) => f.key === 'car-ambulance');
  const unit = fleet?.agents?.[0] ?? null;
  const unitPos = new THREE.Vector3();

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(4.4, 5.6, 40),
    new THREE.MeshBasicMaterial({ color: alert, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  halo.rotation.x = -Math.PI / 2;
  group.add(halo);

  let arrived = false;
  let routeTimer = 0;

  return {
    group,
    point,
    panel,
    /** Encuadre: vuelo lento alrededor del punto del incidente. */
    rig: { center: [point[0], 8, point[1]], radius: 232, height: 158, speed: 0.045, intro: 3 },

    steps: INCIDENT_STEPS,
    duration: INCIDENT_DURATION,

    start() {
      panel.show();
      if (unit) unit.speed = 21;
    },

    update(t, dt, elapsed) {
      const phase = INCIDENT_STEPS.filter((s) => elapsed >= s.at).length;

      // el punto del incidente late desde el primer segundo
      rings.forEach((r, i) => {
        const p = (t * 0.5 + i / 3) % 1;
        r.scale.setScalar(4 + p * 26);
        r.material.opacity = 0.75 * (1 - p) * Math.min(elapsed, 1);
      });
      beacon.position.y = 16 + Math.sin(t * 2.4) * 1.4;
      beacon.rotation.y = t * 1.2;
      beacon.material.emissiveIntensity = 1.6 + (Math.sin(t * 7) > 0 ? 1.6 : 0);
      beam.material.opacity = 0.1 + Math.abs(Math.sin(t * 1.6)) * 0.12;

      // la cámara lo enfoca en la fase 2
      const camOn = phase >= 2 ? 1 : 0;
      cone.material.opacity += (camOn * 0.17 - cone.material.opacity) * Math.min(1, dt * 2);
      const yaw = Math.atan2(point[0] - cam.x, point[1] - cam.z);
      cone.position.set(cam.x + Math.sin(yaw) * 9, (cam.y ?? 10) - 13, cam.z + Math.cos(yaw) * 9);
      cone.rotation.set(Math.PI * 0.86, yaw, 0);

      // fase 3: la ambulancia va hacia el punto por calles reales
      if (unit && phase >= 3 && !arrived) {
        routeTimer -= dt;
        if (routeTimer <= 0) {
          routeTimer = 0.4;
          routeTowards(city.network, unit, point);
        }
        unit.position(unitPos);
        halo.position.set(unitPos.x, 1.2, unitPos.z);
        halo.material.opacity = 0.5 + Math.sin(t * 6) * 0.3;
        halo.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
        if (Math.hypot(unitPos.x - point[0], unitPos.z - point[1]) < 26) arrived = true;
      } else if (arrived) {
        halo.material.opacity = Math.max(halo.material.opacity - dt * 0.6, 0.18);
      }

      // fase 4: se dibuja el desvío
      const detourOn = phase >= 4 ? 0.85 : 0;
      detourMat.opacity += (detourOn - detourMat.opacity) * Math.min(1, dt * 2);

      // fase 5: se apaga la alerta
      if (phase >= 5) {
        beacon.material.color.lerp(new THREE.Color('#10b981'), Math.min(dt * 1.2, 1));
        beacon.material.emissive.lerp(new THREE.Color('#10b981'), Math.min(dt * 1.2, 1));
        panel.rows = [
          { text: 'Vía liberada · aviso cerrado' },
          { text: 'Episodio trazado para el informe' },
        ];
      }
    },

    updatePanel(t, dt, camera) {
      panel.update(t, dt, camera);
    },

    dispose() {
      panel.dispose();
      group.traverse((o) => {
        if (o.isMesh || o.isLine) {
          o.geometry?.dispose?.();
          o.material?.dispose?.();
        }
      });
    },
  };
}
