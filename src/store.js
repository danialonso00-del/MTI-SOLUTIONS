import { create } from 'zustand';
import { SOLUTIONS as LOCAL, INDUSTRIES, CAPABILITIES, buildMatrix } from './data/solutions.js';

/** Registro de nodos DOM de las etiquetas 3D (se actualizan fuera de React, por frame). */
export const labelNodes = new Map();

/** Objetivo de cámara: mutado imperativamente para no re-renderizar en cada frame. */
export const cameraGoal = {
  position: [340, 1180, 1620],
  target: [180, 0, 60],
  version: 0,
};

export const flyTo = (position, target) => {
  cameraGoal.position = position;
  cameraGoal.target = target;
  cameraGoal.version++;
};

export const OVERVIEW = { position: [340, 1180, 1620], target: [180, 0, 60] };

/**
 * Vista por defecto: un barrio en escorzo, no la ciudad entera desde arriba.
 * A 4 km de altura los edificios de 20 m no se ven y todo parece plano; a ~1 km
 * y 32° de inclinación se leen las fachadas, las sombras y el relieve.
 */
export const setOverview = (extent, focus) => {
  const cx = focus ? focus[0] : (extent.minX + extent.maxX) / 2;
  const cz = focus ? focus[1] : (extent.minZ + extent.maxZ) / 2;
  const dist = 1150;
  OVERVIEW.target = [cx, 0, cz];
  OVERVIEW.position = [cx + dist * 0.34, dist * 0.62, cz + dist * 0.82];
  WIDE.target = [(extent.minX + extent.maxX) / 2, 0, (extent.minZ + extent.maxZ) / 2];
  const span = Math.max(extent.maxX - extent.minX, extent.maxZ - extent.minZ);
  WIDE.position = [
    (extent.minX + extent.maxX) / 2 + span * 0.16,
    span * 0.5,
    (extent.minZ + extent.maxZ) / 2 + span * 0.66,
  ];
};

/** Vista amplia de toda la zona (botón "Vista general" al pulsarlo dos veces). */
export const WIDE = { position: [0, 3000, 4000], target: [0, 0, 0] };

const withDocs = (list) =>
  list.map((s) => ({ ...s, docUrl: `/docs/${s.pdf.split('/').pop()}`, docAvailable: false }));

/**
 * Proyecta el anclaje geográfico de cada caso a los metros locales de la zona
 * cargada. Así el catálogo no depende del trozo de ciudad que se descargue.
 */
export const projectSolutions = (list, center) => {
  const [lat0, lon0] = center;
  const mLat = 111320;
  const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
  return list.map((s) => {
    if (!s.latlon) return s;
    const [lat, lon] = s.latlon;
    const x = +((lon - lon0) * mLon).toFixed(1);
    const z = +((lat0 - lat) * mLat).toFixed(1);
    const y = s.height ?? 40;
    return {
      ...s,
      anchor: [x, y, z],
      camera: [x + 210, y + 130, z + 260],
    };
  });
};

export const useStore = create((set, get) => ({
  /* --- catálogo ---------------------------------------------------- */
  industries: INDUSTRIES,
  capabilities: CAPABILITIES,
  solutions: withDocs(LOCAL),
  matrix: buildMatrix(LOCAL),
  apiOnline: false,

  /** Recoloca el catálogo sobre la zona de ciudad recién cargada. */
  applyCityCenter: (center, extent) => {
    // el foco por defecto es el corredor Sagrada Família – Glòries, donde está
    // la mayoría de casos de uso
    const [lat0, lon0] = center;
    const mLon = 111320 * Math.cos((lat0 * Math.PI) / 180);
    const focus = [(2.1815 - lon0) * mLon, (lat0 - 41.4025) * 111320];
    if (extent) setOverview(extent, focus);
    set({
      cityCenter: center,
      solutions: projectSolutions(get().solutions, center),
    });
  },
  cityCenter: null,

  loadSolutions: async () => {
    try {
      const res = await fetch('/api/solutions');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const center = get().cityCenter;
      set({
        solutions: center ? projectSolutions(data.solutions, center) : data.solutions,
        industries: data.industries,
        capabilities: data.capabilities,
        matrix: data.matrix ?? buildMatrix(data.solutions),
        apiOnline: true,
      });
    } catch {
      set({ apiOnline: false }); // sin backend seguimos con el catálogo local
    }
  },

  /* --- flujo ------------------------------------------------------- */
  phase: 'loading', // loading · intro · explore
  progress: 0,
  setProgress: (progress) => set({ progress }),
  setPhase: (phase) => set({ phase }),

  enterCity: () => {
    set({ phase: 'explore' });
    flyTo(OVERVIEW.position, OVERVIEW.target);
  },

  /* --- selección --------------------------------------------------- */
  activeId: null,

  select: (id) => {
    const sol = get().solutions.find((s) => s.id === id);
    if (!sol) return;
    set({ activeId: id, phase: 'explore', matrixOpen: false });
    const [ax, ay, az] = sol.anchor;
    flyTo(sol.camera ?? [ax + 220, ay + 120, az + 260], [ax, ay * 0.5, az]);
  },

  clearSelection: () => {
    set({ activeId: null });
    flyTo(OVERVIEW.position, OVERVIEW.target);
  },

  /* --- filtros de dos ejes ------------------------------------------ */
  filterIndustries: [],
  filterCapabilities: [],

  toggleIndustry: (id) => {
    const list = get().filterIndustries;
    set({ filterIndustries: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  },
  toggleCapability: (id) => {
    const list = get().filterCapabilities;
    set({ filterCapabilities: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] });
  },
  /** Salta a una celda de la matriz: una industria y una solución concretas. */
  focusCell: (industry, capability) => {
    set({ filterIndustries: [industry], filterCapabilities: [capability], matrixOpen: false });
    const list = get().visibleSolutions();
    if (list.length) get().select(list[0].id);
  },
  /** "Enséñame esta solución en todas las industrias". */
  focusCapability: (capability) => {
    set({ filterCapabilities: [capability], filterIndustries: [], matrixOpen: false, activeId: null });
    flyTo(OVERVIEW.position, OVERVIEW.target);
  },
  clearFilters: () => set({ filterIndustries: [], filterCapabilities: [] }),

  visibleSolutions: () => {
    const { solutions, filterIndustries, filterCapabilities } = get();
    return solutions.filter(
      (s) =>
        (!filterIndustries.length || filterIndustries.includes(s.industry)) &&
        (!filterCapabilities.length || (s.capabilities ?? []).some((c) => filterCapabilities.includes(c)))
    );
  },

  isVisible: (sol) => {
    const { filterIndustries, filterCapabilities } = get();
    return (
      (!filterIndustries.length || filterIndustries.includes(sol.industry)) &&
      (!filterCapabilities.length || (sol.capabilities ?? []).some((c) => filterCapabilities.includes(c)))
    );
  },

  /* --- carga: si algo falla, se cuenta en pantalla ---------------------- */
  loadError: null,
  setLoadError: (loadError) => set({ loadError }),

  /* --- idioma de la presentación --------------------------------------- */
  lang: (typeof localStorage !== 'undefined' && localStorage.getItem('mti-lang')) || 'es',
  setLang: (lang) => {
    try {
      localStorage.setItem('mti-lang', lang);
    } catch {
      // navegación privada: se queda solo en memoria
    }
    set({ lang });
  },

  /* --- el mismo catálogo sobre un mapa vectorial (MapLibre) -------------- */
  mapMode: false,
  toggleMapMode: () => set({ mapMode: !get().mapMode }),

  /* --- rendimiento: nivel que el propio motor va ajustando -------------- */
  perfLevel: 2, // 2 alto · 1 medio · 0 ligero

  /* --- montaje: fundido de corte entre planos lejanos ------------------ */
  cut: 0, // se incrementa para disparar el fundido
  shotIndex: 0,
  flashCut: () => set({ cut: get().cut + 1 }),
  markShotChange: (shotIndex) => set({ shotIndex }),

  /* --- controles de ciudad (plegables para no comer sitio) ------------- */
  controlsOpen: false,
  toggleControls: () => set({ controlsOpen: !get().controlsOpen }),

  /* --- estilo de la ciudad -------------------------------------------- */
  cityStyle: 'maqueta', // foto · maqueta · tecnico (arranque: maqueta)
  setCityStyle: (cityStyle) => {
    // el estilo técnico es un plano de sala de control: se ve como debe de noche
    if (cityStyle === 'tecnico') set({ cityStyle, night: true });
    else if (get().cityStyle === 'tecnico') set({ cityStyle, night: false });
    else set({ cityStyle });
  },
  cycleCityStyle: () => {
    const order = ['foto', 'maqueta', 'tecnico'];
    const i = order.indexOf(get().cityStyle);
    set({ cityStyle: order[(i + 1) % order.length] });
  },

  /* --- capas de datos ------------------------------------------------ */
  dataLayer: null, // 'traffic' | 'coverage' | 'energy' | 'waste' | 'air'
  setDataLayer: (id) => set({ dataLayer: get().dataLayer === id ? null : id }),

  /* --- simulación de incidente --------------------------------------- */
  incident: false,
  incidentStep: 0,
  incidentProgress: 0,
  setIncidentState: (step, progress) => {
    if (step !== get().incidentStep || Math.abs(progress - get().incidentProgress) > 0.02) {
      set({ incidentStep: step, incidentProgress: progress });
    }
  },
  startIncident: () => {
    set({ incident: true, incidentStep: 0, incidentProgress: 0, activeId: null, tour: false, matrixOpen: false });
  },
  stopIncident: () => set({ incident: false, incidentStep: 0, incidentProgress: 0 }),
  toggleIncident: () => (get().incident ? get().stopIncident() : get().startIncident()),

  /* --- hora del día --------------------------------------------------- */
  // 0..1 = 00:00..24:00. Mueve el sol, el encendido y la densidad de tráfico.
  hour: 13,
  setHour: (hour) => set({ hour, night: hour < 7.2 || hour > 20.4 }),

  /* --- modos de presentación ---------------------------------------- */
  night: false,
  toggleNight: () => set({ night: !get().night }),

  /**
   * Calidad gráfica. 'alta' con sombras y bloom; 'baja' para portátiles flojos o
   * proyectores (sin sombras, sin post-proceso, menos tráfico). Se puede forzar
   * con ?quality=baja en la URL.
   */
  quality:
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('quality')) ||
    (typeof window !== 'undefined' && window.localStorage?.getItem('mti-quality')) ||
    'alta',
  setQuality: (quality) => {
    try {
      window.localStorage?.setItem('mti-quality', quality);
    } catch {
      /* modo privado: da igual */
    }
    set({ quality });
  },
  toggleQuality: () => get().setQuality(get().quality === 'alta' ? 'baja' : 'alta'),

  // modo fotorrealista (Google 3D Tiles): solo si hay clave configurada
  photoAvailable: Boolean(import.meta.env?.VITE_GOOGLE_TILES_KEY),
  photoMode: false,
  togglePhoto: () => get().photoAvailable && set({ photoMode: !get().photoMode }),

  matrixOpen: false,
  toggleMatrix: () => set({ matrixOpen: !get().matrixOpen }),

  tour: false,
  tourProgress: 0,
  setTourProgress: (tourProgress) => set({ tourProgress }),
  startTour: () => {
    set({ tour: true, phase: 'explore', tourProgress: 0, matrixOpen: false });
    const list = get().visibleSolutions();
    if (list.length) get().select(list[0].id);
  },
  stopTour: () => set({ tour: false, tourProgress: 0 }),
  toggleTour: () => (get().tour ? get().stopTour() : get().startTour()),

  /* --- overlays ------------------------------------------------------ */
  docSolution: null,
  openDoc: (sol) => set({ docSolution: sol }),
  closeDoc: () => set({ docSolution: null }),

  helpOpen: false,
  toggleHelp: () => set({ helpOpen: !get().helpOpen }),

  creditsOpen: false,
  toggleCredits: () => set({ creditsOpen: !get().creditsOpen }),

  sidebarCollapsed: false,
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
}));
