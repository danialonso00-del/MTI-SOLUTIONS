import { useEffect, useRef } from 'react';
import { useStore, flyTo, OVERVIEW, WIDE, deckAnchors } from '../store.js';
import { beatFor, poseAround, fitPose } from './choreography.js';

/**
 * Puente entre el recorrido y la ciudad 3D.
 *
 * Aplica la coreografía del paso actual a la ciudad real: cámara, capa de
 * datos, filtros y hora. No toca el catálogo ni abre casos: solo conduce el
 * decorado. Al salir del recorrido el store devuelve la ciudad a como estaba
 * (`restoreCity`), así que nada de esto se filtra a la exploración libre.
 */

/** Posición muy alta sobre la ciudad: desde aquí se «desciende» a Barcelona. */
const highPose = () => ({
  position: [WIDE.target[0] + 900, 7200, WIDE.target[2] + 2600],
  target: [...WIDE.target],
});

function resolveLook(look, solutions) {
  if (!look || look === 'overview') return { position: [...OVERVIEW.position], target: [...OVERVIEW.target] };
  if (look === 'wide') return { position: [...WIDE.position], target: [...WIDE.target] };
  if (look === 'high') return highPose();
  if (look.fit) {
    const pose = fitPose(look.fit.map((id) => solutions.find((x) => x.id === id)), look);
    if (pose) return pose;
  }
  const sol = solutions.find((x) => x.id === look.sol && x.anchor);
  if (!sol) return { position: [...WIDE.position], target: [...WIDE.target] };
  return poseAround(sol, look);
}

export function useCityDirector(chapterId, step) {
  const hadCity = useRef(false);

  useEffect(() => {
    const s = useStore.getState();
    const beat = beatFor(chapterId, step);
    const c = beat.city;

    if (!c || !s.webgl) {
      hadCity.current = false;
      s.setCityLive(false);
      return undefined;
    }

    s.setCityLive(true);
    const patch = {
      dataLayer: c.layer ?? null,
      filterIndustries: c.inds ?? [],
      filterCapabilities: c.caps ?? [],
      activeId: null,
      cityStyle: 'moderno',
      styleHour: null,
    };
    if (c.hour != null) Object.assign(patch, { hour: c.hour, night: c.hour < 7.2 || c.hour > 20.4 });
    useStore.setState(patch);

    const goal = resolveLook(c.look, s.solutions);
    let timer;
    if (c.from && !hadCity.current) {
      // corte a la pose de salida y, un instante después, el vuelo: el
      // lienzo de la ciudad necesita un frame para despertar
      const from = resolveLook(c.from, s.solutions);
      flyTo(from.position, from.target, { snap: true });
      timer = setTimeout(() => flyTo(goal.position, goal.target), 140);
    } else {
      flyTo(goal.position, goal.target);
    }
    hadCity.current = true;
    return () => clearTimeout(timer);
  }, [chapterId, step]);
}

/**
 * Registra un nodo DOM para que la ciudad lo coloque, cada frame, sobre un
 * punto del mundo: el ancla de un caso de uso, con una altura extra.
 */
export function useCityAnchor(ref, solutionId, lift = 60) {
  const solutions = useStore((s) => s.solutions);
  useEffect(() => {
    const el = ref.current;
    const sol = solutions.find((x) => x.id === solutionId && x.anchor);
    if (!el || !sol) return undefined;
    const key = Symbol(solutionId);
    const [x, y, z] = sol.anchor;
    deckAnchors.set(key, { el, pos: [x, y + lift, z] });
    return () => deckAnchors.delete(key);
  }, [ref, solutionId, lift, solutions]);
}
