import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

import { buildHotspots } from '../three/hotspots.js';
import { applyDayNight, PALETTE } from '../three/theme.js';
import { createDirector } from '../three/cinematics.js';
import { buildDataLayers } from '../three/datalayers.js';
import { buildCityDetails } from '../three/moderncity.js';
import { buildAtmosphere, lightAtHour } from '../three/atmosphere.js';
import { createIncident, INCIDENT_DURATION } from '../three/incident.js';
import { toShotList, evaluateSequence } from '../three/shots.js';
import { useStore, cameraGoal, labelNodes, deckAnchors } from '../store.js';
import { useSolutions } from '../i18n.js';
import PhotoCity from './PhotoCity.jsx';

const TOUR_SECONDS = 14;
const damp = (dt, speed) => 1 - Math.exp(-speed * dt);

/* ------------------------------------------------------------------ */
/* Contenido de la escena                                              */
/* ------------------------------------------------------------------ */

function World({ onReady, world }) {
  const { camera, scene, gl } = useThree();
  const photoMode = useStore((s) => s.photoMode);
  const quality = useStore((s) => s.quality);
  const lowQ = quality === 'baja';
  const photoKey = import.meta.env.VITE_GOOGLE_TILES_KEY;
  const controls = useRef();
  const followGoal = useRef(true);
  const goalVersion = useRef(-1);
  const nightK = useRef(0);
  const tourTimer = useRef(0);
  const rig = useRef(null); // coreografía de cámara de la escena activa
  const rigTime = useRef(0);
  const rigFrom = useRef(new THREE.Vector3());
  const rigTargetFrom = useRef(new THREE.Vector3());
  const rigCenter = useRef(new THREE.Vector3());
  const shotState = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3(), fov: 42, index: 0 });
  const fpsAcc = useRef(0);
  const fpsFrames = useRef(0);
  const perf = useRef(2); // 2 alto · 1 medio · 0 ligero
  const moodBackup = useRef(null); // hora previa, para restaurarla al salir
  const lastShot = useRef(-1);
  const playedId = useRef(null);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const ambientTime = useRef(0);
  const cityDetails = useRef(null);
  const atmosphere = useRef(null);
  const stars = useRef(null);
  const interactionUntil = useRef(0);

  // ciudad y tráfico ya construidos en App (la ortofoto se carga antes)
  const { city, traffic, cityData } = world;
  // el catálogo ya viene proyectado sobre la zona cargada
  const solutions = useSolutions();
  const hotspots = useMemo(() => buildHotspots(solutions), [solutions]);

  const nightTargets = useMemo(
    () => [...city.nightTargets, ...traffic.nightTargets],
    [city, traffic]
  );

  const director = useMemo(
    () =>
      createDirector({
        scene,
        city,
        traffic,
        library: world.library,
        industries: useStore.getState().industries,
        onMood: (mood) => {
          const st = useStore.getState();
          if (mood?.hour !== undefined) {
            if (moodBackup.current === null) moodBackup.current = st.hour;
            st.setHour(mood.hour);
          } else if (moodBackup.current !== null) {
            st.setHour(moodBackup.current);
            moodBackup.current = null;
          }
        },
      }),
    [scene, city, traffic, world]
  );

  useEffect(() => () => director.stop(), [director]);

  // capas de datos sobre el suelo
  const layers = useRef(null);
  useEffect(() => {
    const data = buildDataLayers(city, cityData);
    const detail = buildCityDetails(cityData);
    const sky = buildAtmosphere();
    layers.current = data;
    cityDetails.current = detail;
    atmosphere.current = sky;
    data.setLayer(useStore.getState().dataLayer, performance.now() / 1000);
    scene.add(data.root, detail.root, sky.mesh);
    return () => {
      scene.remove(data.root, detail.root, sky.mesh);
      data.dispose();
      detail.dispose();
      sky.dispose();
      layers.current = cityDetails.current = atmosphere.current = null;
    };
  }, [scene, city, cityData]);
  // estilo de ciudad
  const cityStyle = useStore((s) => s.cityStyle);
  useEffect(() => {
    city.styles?.apply(cityStyle);
  }, [city, cityStyle]);

  const dataLayer = useStore((s) => s.dataLayer);
  useEffect(() => {
    layers.current?.setLayer(dataLayer, performance.now() / 1000);
  }, [dataLayer]);

  // simulación de incidente
  const incident = useMemo(
    () => createIncident({ city, traffic, industries: useStore.getState().industries }),
    [city, traffic]
  );
  const incidentOn = useStore((s) => s.incident);
  const incidentStart = useRef(0);
  useEffect(() => {
    if (incidentOn) {
      scene.add(incident.group);
      incident.start();
      incidentStart.current = performance.now() / 1000;
      rig.current = { ...incident.rig, startAngle: 0 };
      rigTime.current = performance.now() / 1000;
      rigFrom.current.copy(camera.position);
      rigTargetFrom.current.copy(controls.current ? controls.current.target : new THREE.Vector3());
      return () => {
        scene.remove(incident.group);
        rig.current = null;
      };
    }
    return undefined;
  }, [incidentOn, incident, scene, camera]);

  // anillo de selección que acompaña al hotspot activo
  const ring = useMemo(() => {
    const g = new THREE.Group();
    const mk = (r, w, op) =>
      new THREE.Mesh(
        new THREE.RingGeometry(r, r + w, 64),
        new THREE.MeshBasicMaterial({
          color: '#ffffff',
          transparent: true,
          opacity: op,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
    const a = mk(34, 1.1, 0.75);
    const b = mk(44, 0.5, 0.4);
    const c = mk(24, 2.2, 0.25);
    [a, b, c].forEach((m) => {
      m.rotation.x = -Math.PI / 2;
      g.add(m);
    });
    g.position.y = 0.7;
    g.visible = false;
    return g;
  }, []);

  useEffect(() => {
    scene.add(ring);
    return () => scene.remove(ring);
  }, [scene, ring]);

  // luces
  const sun = useRef();
  const hemi = useRef();
  const ambient = useRef();

  useEffect(() => {
    scene.background = PALETTE.skyDay.clone();
    scene.fog = new THREE.Fog(PALETTE.fogDay.clone(), 1600, 6500);
    applyDayNight(nightTargets, nightK.current);
    gl.shadowMap.enabled = !lowQ;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    const id = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(id);
  }, [scene, gl, onReady, nightTargets, lowQ]);

  /**
   * Ajuste automático de calidad. Si el equipo no da los 30 fps, se recortan
   * primero las sombras y después el post-proceso, sin tocar la escena.
   */
  const applyPerf = (level) => {
    const sunLight = sun.current ?? scene.getObjectByName('sun');
    if (sunLight) sunLight.castShadow = level >= 1 && !lowQ;
    gl.shadowMap.enabled = level >= 1 && !lowQ;
    gl.setPixelRatio(Math.min(window.devicePixelRatio, level >= 2 ? 1.75 : 1));
    useStore.setState({ perfLevel: level });
  };

  const handlePick = (e) => {
    let o = e.object;
    while (o && !o.userData.solutionId) o = o.parent;
    if (o?.userData.solutionId) {
      e.stopPropagation();
      const state = useStore.getState();
      state.stopTour();
      state.select(o.userData.solutionId);
    }
  };

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    // la transición día/noche usa un dt menos recortado: con el clamp normal,
    // en equipos lentos el cambio tardaba una eternidad en completarse
    const dtSlow = Math.min(rawDt, 0.4);
    const t = performance.now() / 1000;
    const s = useStore.getState();

    /* medida de rendimiento: si el equipo no llega, se recorta solo */
    fpsAcc.current += rawDt;
    fpsFrames.current++;
    if (fpsAcc.current > 1.4) {
      const fps = fpsFrames.current / fpsAcc.current;
      fpsAcc.current = 0;
      fpsFrames.current = 0;
      if (fps < 26 && perf.current > 0) {
        perf.current -= 1;
        applyPerf(perf.current);
      } else if (fps > 52 && perf.current < 2) {
        perf.current += 1;
        applyPerf(perf.current);
      }
    }

    /* animación de la ciudad */
    const motionDt = s.motionEnabled ? dt : 0;
    ambientTime.current += motionDt;
    const motionT = ambientTime.current;
    const ctx = { camera };
    for (const u of city.updaters) u(motionT, motionDt, ctx);
    for (const u of traffic.updaters) u(motionT, motionDt, ctx);
    for (const u of hotspots.updaters) u(motionT, motionDt, ctx);

    /* día / noche */
    const lighting = lightAtHour(s.hour);
    const targetK = lighting.night;
    if (Math.abs(nightK.current - targetK) > 0.001) {
      nightK.current += (targetK - nightK.current) * damp(dtSlow, 1.9);
      const k = nightK.current;
      applyDayNight(nightTargets, k);
      scene.background.copy(PALETTE.skyDay).lerp(PALETTE.skyNight, k);
      scene.fog.color.copy(PALETTE.fogDay).lerp(PALETTE.fogNight, k);
      const sunLight = sun.current ?? scene.getObjectByName('sun');
      const hemiLight = hemi.current ?? scene.getObjectByName('hemi');
      const ambientLight = ambient.current ?? scene.getObjectByName('ambient');
      if (sunLight) {
        sunLight.color.copy(PALETTE.sunDay).lerp(PALETTE.sunNight, k);
        sunLight.intensity = THREE.MathUtils.lerp(2.25, 0.48, k);
      }
      if (hemiLight) {
        hemiLight.color.copy(PALETTE.hemiSkyDay).lerp(PALETTE.hemiSkyNight, k);
        hemiLight.groundColor.copy(PALETTE.hemiGroundDay).lerp(PALETTE.hemiGroundNight, k);
        hemiLight.intensity = THREE.MathUtils.lerp(1.25, 0.8, k);
      }
      if (ambientLight) ambientLight.intensity = THREE.MathUtils.lerp(0.28, 0.3, k);
    }

    city.styles?.update(nightK.current);
    cityDetails.current?.update(motionT, nightK.current, s);
    atmosphere.current?.update(camera, s.hour, nightK.current, lighting.golden, dtSlow, scene.fog, sun.current);
    if (stars.current) stars.current.visible = nightK.current > 0.65;

    /* sombras: la caja sigue al punto que mira la cámara, así son nítidas
       en la zona visible aunque la ciudad mida kilómetros */
    if (controls.current) {
      const sunLight = sun.current ?? scene.getObjectByName('sun');
      if (sunLight) {
        const c = controls.current.target;
        // el sol describe su arco según la hora: sombras largas a primera y
        // última hora, cenitales al mediodía
        const dayK = THREE.MathUtils.clamp((s.hour - 7) / 13.5, 0, 1);
        const azimuth = Math.PI * (0.15 + dayK * 0.7);
        const altitude = Math.sin(dayK * Math.PI) * 0.85 + 0.12;
        sunLight.position.set(
          c.x + Math.cos(azimuth) * 620,
          160 + altitude * 780,
          c.z - Math.sin(azimuth) * 480
        );
        sunLight.target.position.copy(c);
        sunLight.target.updateMatrixWorld();
      }
    }

    /* Filtros de dos ejes y FOCO.
       Cuando hay un caso abierto, la escena es solo suya: el resto de puntos
       se apagan del todo para que no aparezcan cosas de otros casos por
       encima del relato que se está contando. */
    const fInd = s.filterIndustries;
    const fCap = s.filterCapabilities;
    const enfocado = Boolean(s.activeId) && director.active;
    for (const h of hotspots.hotspots) {
      const sol = h.solution;
      const visible =
        (!fInd.length || fInd.includes(sol.industry)) &&
        (!fCap.length || (sol.capabilities ?? []).some((c) => fCap.includes(c)));
      h.active = h.id === s.activeId;
      h.target = enfocado ? (h.active ? 1 : 0) : visible ? 1 : 0.06;
    }

    /* la red de cámaras se enciende con los casos de seguridad */
    if (city.cameras) {
      const activeSol = s.solutions.find((x) => x.id === s.activeId);
      const securityOn =
        fCap.includes('security') || (activeSol?.capabilities ?? []).includes('security');
      city.cameras.target = securityOn ? 1 : 0;
    }

    /* escena cinematográfica del caso de uso */
    if (playedId.current !== s.activeId) {
      playedId.current = s.activeId;
      const sol = s.solutions.find((x) => x.id === s.activeId);
      const nextRig = toShotList(director.play(sol ?? null, t));
      if (nextRig) {
        rig.current = nextRig;
        rigTime.current = t; // instante de arranque, no contador
        rigFrom.current.copy(camera.position);
        rigTargetFrom.current.copy(controls.current ? controls.current.target : new THREE.Vector3());
        // el centro inicial sale del primer plano de la secuencia
        // la órbita de apertura arranca desde donde está la cámara, para que
        // el enlace con el plano anterior sea natural
        const first = nextRig.shots?.[0];
        if (first?.center) {
          first.startAngle = Math.atan2(
            camera.position.z - first.center[2],
            camera.position.x - first.center[0]
          );
        }
        lastShot.current = -1;

        // si el salto es largo, se corta con un fundido en vez de volar minutos
        const seq = evaluateSequence(nextRig, 0, shotState.current);
        rigCenter.current.copy(seq.target);
        if (camera.position.distanceTo(seq.position) > 900) {
          s.flashCut();
          camera.position.copy(seq.position);
          if (controls.current) controls.current.target.copy(seq.target);
          rigFrom.current.copy(seq.position);
          rigTargetFrom.current.copy(seq.target);
        }
      } else {
        rig.current = null;
      }
    }

    /* movimiento de cámara: primero la coreografía, si la hay */
    if (goalVersion.current !== cameraGoal.version) {
      goalVersion.current = cameraGoal.version;
      followGoal.current = true;
      if (cameraGoal.snap && controls.current) {
        camera.position.set(...cameraGoal.position);
        controls.current.target.set(...cameraGoal.target);
        controls.current.update();
        followGoal.current = false;
      }
    }

    if (rig.current && controls.current) {
      const r = rig.current;
      const rigElapsed = t - rigTime.current;
      const seq = evaluateSequence(r, rigElapsed, shotState.current);
      const desired = seq.position;
      rigCenter.current.copy(seq.target);

      // el campo de visión acompaña a los planos de aproximación
      if (seq.fov && Math.abs(camera.fov - seq.fov) > 0.05) {
        camera.fov += (seq.fov - camera.fov) * damp(dt, 2.4);
        camera.updateProjectionMatrix();
      } else if (!seq.fov && Math.abs(camera.fov - 42) > 0.05) {
        camera.fov += (42 - camera.fov) * damp(dt, 1.6);
        camera.updateProjectionMatrix();
      }

      // marca de corte cuando cambia el plano: sirve para el destello de la UI
      if (seq.index !== lastShot.current) {
        if (lastShot.current >= 0) s.markShotChange(seq.index);
        // al repetirse el ciclo del relato la cámara vuelve al plano general:
        // se corta en seco en vez de volar 300 m a la vista de todos
        if (seq.index < lastShot.current && camera.position.distanceTo(desired) > 300) {
          s.flashCut();
          camera.position.copy(desired);
          controls.current.target.copy(rigCenter.current);
        }
        lastShot.current = seq.index;
      }

      if (rigElapsed < (r.intro ?? 2.6)) {
        // entrada suave desde donde estuviera la cámara
        const k = rigElapsed / (r.intro ?? 2.6);
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        camera.position.lerpVectors(rigFrom.current, desired, eased);
        controls.current.target.lerpVectors(rigTargetFrom.current, rigCenter.current, eased);
      } else {
        const follow = r.shots?.[seq.index]?.mode === 'follow';
        camera.position.lerp(desired, damp(dt, follow ? 1.8 : 3.6));
        controls.current.target.lerp(rigCenter.current, damp(dt, follow ? 2.6 : 2.6));
      }
      followGoal.current = false;
      controls.current.autoRotate = false;
      controls.current.update();
    } else if (followGoal.current && controls.current) {
      const [px, py, pz] = cameraGoal.position;
      const [tx, ty, tz] = cameraGoal.target;
      const f = damp(dtSlow, 2.1);
      camera.position.lerp({ x: px, y: py, z: pz }, f);
      controls.current.target.lerp(new THREE.Vector3(tx, ty, tz), f);
      if (camera.position.distanceTo(new THREE.Vector3(px, py, pz)) < 0.6) followGoal.current = false;
    }

    /* giro suave cuando no hay nada seleccionado */
    if (controls.current && !rig.current) {
      // en el recorrido corporativo la ciudad es decorado: gira despacio
      // mientras se habla, salvo que el presentador haya pausado
      const inDeck = s.mode === 'deck' && s.cityLive;
      controls.current.autoRotate =
        s.autoOrbit &&
        s.motionEnabled &&
        t > interactionUntil.current &&
        (inDeck ? !s.deckPaused : s.phase === 'explore') &&
        !s.activeId &&
        !followGoal.current;
      controls.current.autoRotateSpeed = inDeck ? 0.28 : 0.14;
      controls.current.update();
    }

    /* ortofoto de detalle: se pide al bajar y se retira al subir */
    if (city.detail) {
      const alt = camera.position.y;
      const wants = alt < 420 && s.cityStyle === 'foto';
      if (wants && city.detail.state === 'idle') {
        city.detail.load(cityData.preset ?? 'barcelona');
      }
      city.detail.group.userData.wanted = wants;
      city.detail.group.visible = wants && city.detail.state === 'listo' && s.cityStyle === 'foto';
    }

    /* capas de datos e incidente */
    layers.current?.update(t, dt, motionT, s.photoMode);
    if (s.incident) {
      const elapsed = t - incidentStart.current;
      incident.update(t, dt, elapsed);
      incident.updatePanel(t, dt, camera);
      const step = incident.steps.filter((x) => elapsed >= x.at).length;
      s.setIncidentState(Math.max(step - 1, 0), Math.min(elapsed / INCIDENT_DURATION, 1));
      if (elapsed > INCIDENT_DURATION) s.stopIncident();
    }

    // la escena se actualiza al final: así los paneles usan la cámara ya movida
    director.update(t, dt, camera);
    // y después se renderiza la vista de la cámara CCTV a su textura
    director.renderAuxViews(gl, scene);

    /* anillo de selección */
    const active = hotspots.hotspots.find((h) => h.id === s.activeId);
    ring.visible = !!active;
    if (active) {
      ring.position.set(active.anchor.x, 0.7, active.anchor.z);
      ring.rotation.y = t * 0.35;
      ring.children.forEach((m, i) => {
        const p = 1 + Math.sin(t * 1.8 + i) * 0.035;
        m.scale.setScalar(p);
        m.material.color.set(active.color);
        m.material.opacity = (i === 0 ? 0.8 : i === 1 ? 0.45 : 0.22) * (0.75 + Math.sin(t * 2.2) * 0.25);
      });
    }

    /* etiquetas HTML proyectadas, ordenadas por cercanía y sin solaparse */
    const w = gl.domElement.clientWidth;
    const h2 = gl.domElement.clientHeight;

    /* anclajes del recorrido corporativo: cifras y rótulos sobre edificios.
       Si dos se pisan, el más lejano sube su tallo; si ya no cabe, se oculta. */
    if (s.mode === 'deck' && deckAnchors.size) {
      const items = [];
      for (const a of deckAnchors.values()) {
        projected.set(a.pos[0], a.pos[1], a.pos[2]).project(camera);
        const x = (projected.x * 0.5 + 0.5) * w;
        const y = (-projected.y * 0.5 + 0.5) * h2;
        const out = projected.z > 1 || x < 20 || x > w - 20 || y < 90 || y > h2 - 70;
        if (!a.w) {
          const body = a.el.firstElementChild;
          if (body?.offsetWidth) {
            a.w = body.offsetWidth;
            a.h = body.offsetHeight;
          }
        }
        items.push({ a, x, y, out, z: projected.z });
      }
      items.sort((p, q) => p.z - q.z); // los más cercanos se colocan primero
      const boxes = [];
      for (const it of items) {
        const { a, x, y } = it;
        const edge = x > w - 230 ? 'r' : x < 230 ? 'l' : '';
        const bw = a.w || 180;
        const bh = a.h || 48;
        const left = edge === 'r' ? x - bw + 22 : edge === 'l' ? x - 22 : x - bw / 2;
        let stack = 0;
        let hidden = it.out;
        for (let k = 0; k < 4 && !hidden; k++) {
          const bottom = y - 64 - stack;
          const top = bottom - bh;
          const hit = boxes.find((b) => left < b.r && left + bw > b.l && top < b.b && bottom > b.t);
          if (!hit) {
            if (top < 84) {
              // demasiado arriba: se acorta el tallo (hasta 24 px) antes de ocultarlo
              const room = y - 64 - bh - 84;
              if (room >= -40 && k === 0) {
                stack = room;
                boxes.push({ l: left - 6, r: left + bw + 6, t: 78, b: y - 64 - stack + 6 });
              } else hidden = true;
            } else boxes.push({ l: left - 6, r: left + bw + 6, t: top - 6, b: bottom + 6 });
            break;
          }
          stack += bottom - hit.t + 4;
          if (k === 3) hidden = true;
        }
        a.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        a.el.style.visibility = hidden ? 'hidden' : 'visible';
        a.el.style.setProperty('--stack', `${Math.round(stack)}px`);
        if (a.el.dataset.edge !== edge) a.el.dataset.edge = edge;
      }
    }

    const placed = [];
    const candidates = [];
    for (const h of hotspots.hotspots) {
      const node = labelNodes.get(h.id);
      if (!node) continue;
      projected.copy(h.anchor);
      projected.y += 30;
      const dist = camera.position.distanceTo(projected);
      projected.project(camera);
      candidates.push({
        h,
        node,
        dist,
        behind: projected.z > 1,
        x: (projected.x * 0.5 + 0.5) * w,
        y: (-projected.y * 0.5 + 0.5) * h2,
      });
    }
    // el activo primero, después de cerca a lejos
    candidates.sort((a, b) => (b.h.active ? 1 : 0) - (a.h.active ? 1 : 0) || a.dist - b.dist);

    for (const c of candidates) {
      const dim = c.h.target < 0.5;
      const tooFar = c.dist > 3400;
      // con un caso abierto, solo se rotula ese
      let hidden = c.behind || tooFar || (enfocado && !c.h.active);

      if (!hidden && !c.h.active) {
        const hw = (c.node.offsetWidth || 150) / 2 + 6;
        const hh = 17;
        for (const q of placed) {
          if (Math.abs(c.x - q.x) < hw + q.hw && Math.abs(c.y - q.y) < hh + q.hh) {
            hidden = true;
            break;
          }
        }
      }
      if (!hidden) placed.push({ x: c.x, y: c.y, hw: (c.node.offsetWidth || 150) / 2 + 6, hh: 17 });

      c.node.style.transform = `translate(-50%,-50%) translate3d(${c.x.toFixed(1)}px, ${c.y.toFixed(1)}px, 0)`;
      c.node.style.opacity = hidden ? 0 : dim ? 0.16 : 1;
      c.node.style.pointerEvents = hidden || dim ? 'none' : 'auto';
      c.node.classList.toggle('active', c.h.active);
    }

    /* modo presentación */
    if (s.tour) {
      tourTimer.current += dt;
      const p = Math.min(tourTimer.current / TOUR_SECONDS, 1);
      if (Math.abs(p - s.tourProgress) > 0.02) s.setTourProgress(p);
      if (tourTimer.current >= TOUR_SECONDS) {
        tourTimer.current = 0;
        const list = s.visibleSolutions();
        const i = list.findIndex((x) => x.id === s.activeId);
        const next = list[(i + 1) % list.length];
        if (next) {
          const sol = next;
          const [ax, ay, az] = sol.anchor;
          useStore.setState({ activeId: sol.id });
          cameraGoal.position = sol.camera ?? [ax + 46, ay + 34, az + 58];
          cameraGoal.target = [ax, ay * 0.55, az];
          cameraGoal.version++;
        }
      }
    } else if (tourTimer.current !== 0) {
      tourTimer.current = 0;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} name="hemi" args={['#d6e5e9', '#708985', 1.25]} />
      <directionalLight
        ref={sun}
        name="sun"
        position={[900, 1400, 700]}
        intensity={2.25}
        color="#fff4dd"
        castShadow={!lowQ}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-620}
        shadow-camera-right={620}
        shadow-camera-top={620}
        shadow-camera-bottom={-620}
        shadow-camera-far={2400}
        shadow-bias={-0.0012}
        shadow-normalBias={0.6}
      />
      <ambientLight ref={ambient} name="ambient" intensity={0.28} />
      <group ref={stars} visible={false}>
        <Stars radius={4200} depth={600} count={1400} factor={12} saturation={0} fade speed={0} />
      </group>

      <primitive object={city.root} onClick={handlePick} visible={!photoMode} />
      <primitive object={traffic.root} visible={!photoMode} />
      {photoMode && photoKey && <PhotoCity apiKey={photoKey} center={cityData.center} />}
      <primitive
        object={hotspots.root}
        onClick={handlePick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.07}
        autoRotateSpeed={0.14}
        rotateSpeed={0.65}
        zoomSpeed={0.75}
        minDistance={70}
        maxDistance={4200}
        maxPolarAngle={Math.PI * 0.47}
        onEnd={() => { interactionUntil.current = performance.now() / 1000 + 8; }}
        onStart={() => {
          interactionUntil.current = Infinity;
          followGoal.current = false;
          rig.current = null; // el usuario toma el control de la cámara
          if (Math.abs(camera.fov - 42) > 0.1) {
            camera.fov = 42;
            camera.updateProjectionMatrix();
          }
        }}
      />
      <AdaptiveDpr pixelated />
      {lowQ && <PerfHint />}
    </>
  );
}

/* ------------------------------------------------------------------ */

/** En modo bajo apagamos el post-proceso: es lo que más cuesta. */
function PerfHint() {
  return null;
}

export default function CityScene({ onReady, world, deckOpen = false }) {
  const mapMode = useStore((s) => s.mapMode);
  // el recorrido usa la ciudad como decorado en algunas escenas
  const cityLive = useStore((s) => s.cityLive);
  const lang = useStore((s) => s.lang);
  const night = useStore((s) => s.night);
  const perfLevel = useStore((s) => s.perfLevel);
  const quality = useStore((s) => s.quality);
  const lowQ = quality === 'baja';
  const [dpr] = useState(() => (typeof window !== 'undefined' && window.devicePixelRatio > 1 ? [1, 1.75] : [1, 1]));

  return (
    <Canvas
      className="scene-canvas"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh' }}
      /* con el mapa delante, o con una escena del recorrido que no usa la
         ciudad, la ciudad 3D deja de dibujar: libera la GPU para MapLibre o
         para las escenas propias del recorrido */
      frameloop={mapMode || (deckOpen && !cityLive) ? 'never' : 'always'}
      shadows={!lowQ}
      dpr={lowQ ? 1 : dpr}
      camera={{ position: [420, 1900, 2400], fov: 42, near: 2, far: 12000 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
      }}
    >
      <World onReady={onReady} world={world} />
      {!lowQ && perfLevel > 0 && (
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom
          intensity={night ? 0.55 : 0.14}
          luminanceThreshold={night ? 0.72 : 0.9}
          luminanceSmoothing={0.22}
          mipmapBlur
        />
        <Vignette eskil={false} offset={0.2} darkness={0.3} />
      </EffectComposer>
      )}
    </Canvas>
  );
}
