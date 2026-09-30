import { useMemo } from 'react';
import { useStore } from './store.js';
import { localizarSolucion, localizarMapa } from './data/solutions.js';
import { SOLUTIONS_EN, INDUSTRIES_EN, CAPABILITIES_EN } from './data/en.js';

/**
 * Dos idiomas: castellano e inglés.
 *
 * La clave de cada texto ES el texto en castellano. Suena raro la primera vez,
 * pero tiene dos ventajas grandes para una aplicación como esta: el código se
 * sigue leyendo (`t('Explorar la ciudad')`, no `t('intro.cta.primary')`) y si
 * falta una traducción se ve el castellano, nunca una clave rota en pantalla.
 *
 * El contenido del catálogo —casos de uso, relatos y cuadros de mando— se
 * traduce aparte, en los archivos `*.en.js` de `src/data`, porque son textos
 * de venta y conviene tenerlos juntos y revisables.
 */

export const EN = {
  /* --- portada ------------------------------------------------------ */
  'Solutions Explorer': 'Solutions Explorer',
  'Soluciones inteligentes': 'Smart solutions',
  para: 'for',
  ciudades: 'cities',
  estadios: 'stadiums',
  transporte: 'transport',
  residuos: 'waste',
  agua: 'water',
  seguridad: 'security',
  industria: 'industry',
  mantenimiento: 'maintenance',
  energía: 'energy',
  logística: 'logistics',
  'grandes eventos': 'major events',
  'servicios públicos': 'public services',
  'Explorar la ciudad': 'Explore the city',
  'Conocer MTI': 'Discover MTi',
  'Explorar soluciones': 'Explore solutions',
  'Volver a la presentación': 'Back to the presentation',
  'Este navegador no puede mostrar la ciudad 3D': 'This browser cannot display the 3D city',
  'Ver la matriz': 'See the matrix',
  'casos de uso': 'use cases',
  industrias: 'industries',
  soluciones: 'solutions',
  Idioma: 'Language',
  'Modo presentación': 'Presentation mode',

  /* --- barra superior ----------------------------------------------- */
  Mapa: 'Map',
  'Ciudad 3D': '3D city',
  Matriz: 'Matrix',
  Noche: 'Night',
  Día: 'Day',
  Incidente: 'Incident',
  Presentación: 'Presentation',
  'Vista general': 'Overview',
  'Matriz industrias × soluciones (M)': 'Industries × solutions matrix (M)',
  'Alternar día / noche (N)': 'Toggle day / night (N)',
  'Simular un incidente y ver reaccionar a toda la plataforma (I)':
    'Simulate an incident and watch the whole platform react (I)',
  'Recorrido automático (Espacio)': 'Automatic tour (Space)',
  'Vista general (Esc)': 'Overview (Esc)',
  'Ayuda (H)': 'Help (H)',
  'El mismo catálogo sobre el mapa vectorial de MapLibre (necesita conexión)':
    'The same catalogue on MapLibre’s vector map (needs a connection)',

  /* --- panel de exploración ----------------------------------------- */
  Explorar: 'Explore',
  INDUSTRIA: 'INDUSTRY',
  SOLUCIÓN: 'SOLUTION',
  'Plegar panel': 'Collapse panel',
  'Mostrar el panel': 'Show the panel',
  'de': 'of',

  Industria: 'Industry',
  Solución: 'Solution',
  casos: 'cases',

  /* --- ficha del caso ----------------------------------------------- */
  'Qué incluye': 'What it includes',
  'Plataformas y tecnología': 'Platforms and technology',
  Referencias: 'References',
  'Lo mismo, en otra industria': 'The same, in another industry',
  'Ver documentación': 'View documentation',
  'Abrir demo': 'Open demo',
  'Comprobando documentación…': 'Checking documentation…',
  'Cerrar (Esc)': 'Close (Esc)',
  Cerrar: 'Close',

  /* --- matriz -------------------------------------------------------- */
  'Mapa de capacidades': 'Capability map',
  'Cerrar (M)': 'Close (M)',

  Moderno: 'Modern',
  'Piedra clara, cristal y jardines urbanos': 'Light stone, glass and urban gardens',
  'Detalle y movimiento': 'Detail & motion',
  'Detalle urbano': 'Urban detail',
  'Flujos de calle': 'Street flows',
  'Órbita suave': 'Gentle orbit',
  'Animación urbana': 'City animation',
  'Amanecer': 'Morning',
  'Atardecer': 'Sunset',
  'Zonas verdes': 'Green spaces',
  'Conectividad urbana': 'Urban connectivity',
  'Capas ilustrativas sobre cartografía real': 'Illustrative layers on real city geometry',
  'Superficie verde': 'Green area',
  'Red ilustrativa': 'Illustrative network',
  'Menos': 'Less',
  'Más': 'More',
  'Nodos': 'Nodes',
  'Enlaces': 'Links',
  'Conectado': 'Connected',
  'Fluido': 'Free flow',
  'Congestión': 'Congested',
  'Sin cobertura': 'No coverage',
  'Cubierto': 'Covered',
  'Bajo': 'Low',
  'Alto': 'High',
  'Vacío': 'Empty',
  'Lleno': 'Full',
  'Buena': 'Good',
  'Pobre': 'Poor',
  'campo de visión': 'field of view',
  '% de llenado': '% full',

  /* --- controles de ciudad ------------------------------------------- */
  'Vista de la ciudad': 'City view',
  'Estilo de ciudad': 'City style',
  'Capas de datos': 'Data layers',
  'Hora del día': 'Time of day',
  'Foto aérea': 'Aerial photo',
  Maqueta: 'Model',
  Técnico: 'Technical',
  'Ortofoto real del ICGC': 'Real ICGC orthophoto',
  'Volúmenes limpios, sin fotografía': 'Clean volumes, no photography',
  'Plano oscuro de sala de control': 'Dark control-room plan',

  /* --- capas de datos e incidente ------------------------------------- */
  'Intensidad de tráfico': 'Traffic intensity',
  'Cobertura de cámaras': 'Camera coverage',
  'Consumo energético': 'Energy consumption',
  'Llenado de contenedores': 'Bin fill level',
  'Simular un incidente': 'Simulate an incident',
  'Simulación de incidente': 'Incident simulation',
  parar: 'stop',
  'Incidente detectado': 'Incident detected',
  'Correlación en el centro de mando': 'Correlation in the control centre',
  'Recurso despachado': 'Resource dispatched',
  'Tráfico desviado': 'Traffic diverted',
  'Incidente resuelto': 'Incident resolved',
  'La videoanalítica marca una colisión en la calzada y genera el aviso automáticamente.':
    'Video analytics flags a collision on the carriageway and raises the alert automatically.',
  'Smart Hypervisor cruza cámaras, aforo y sensores: confirma el incidente y abre el protocolo.':
    'Smart Hypervisor cross-checks cameras, crowd and sensors: it confirms the incident and opens the protocol.',
  'Se asigna la ambulancia más cercana y se le abre camino con prioridad semafórica.':
    'The nearest ambulance is assigned and given a green corridor through the traffic lights.',
  'Se recalculan los ciclos del corredor y se avisa a los paneles de mensaje variable.':
    'Signal timings on the corridor are recalculated and the variable message signs are updated.',
  'Vía liberada y aviso cerrado. Todo el episodio queda trazado para el informe.':
    'Road cleared and alert closed. The whole episode is logged for the report.',

  /* --- pie y ayuda ---------------------------------------------------- */
  'Escena en vivo · arrastra para tomar el control de la cámara':
    'Live scene · drag to take control of the camera',
  'Barcelona real · datos en tiempo real': 'Real Barcelona · real-time data',
  'Arrastra para girar · rueda para zoom · clic en un punto luminoso':
    'Drag to orbit · wheel to zoom · click a glowing point',
  '© colaboradores de OpenStreetMap': '© OpenStreetMap contributors',
  'Imágenes © Google': 'Imagery © Google',
  'Cómo se maneja': 'How to drive it',
  Arrastrar: 'Drag',
  Rueda: 'Wheel',
  'Clic en un punto': 'Click a point',
  Espacio: 'Space',
  'Geometría de la ciudad': 'City geometry',
  'Vehículos, personas y mobiliario': 'Vehicles, people and street furniture',
  'Modelos 3D': '3D models',
  'El detalle completo está en CREDITS.md del repositorio.':
    'The full detail is in CREDITS.md in the repository.',

  /* --- modo mapa ------------------------------------------------------ */
  'Volver a la ciudad 3D': 'Back to the 3D city',
  'Mapa · MapLibre': 'Map · MapLibre',
  Flota: 'Fleet',
  'Calidad del aire': 'Air quality',
  'Bicing en vivo': 'Bicing live',
  Lluvia: 'Rain',
  Oscuro: 'Dark',
  Claro: 'Light',
  Callejero: 'Streets',
  'Preparando el mapa…': 'Preparing the map…',
  'No se han podido descargar las teselas: este modo necesita conexión.':
    'Map tiles could not be downloaded: this mode needs a connection.',
  'Malla de sensores de calidad del aire, punto a punto':
    'Air-quality sensor mesh, point by point',
  'Estaciones de Bicing con disponibilidad real (GBFS)':
    'Bicing stations with real availability (GBFS)',
  'Radar de precipitación de RainViewer, últimas dos horas':
    'RainViewer precipitation radar, last two hours',
  'Tráfico y contenedores sobre el viario real': 'Traffic and bins on the real street network',

  /* --- relato --------------------------------------------------------- */
  Sucede: 'Happens',
  Plataforma: 'Platform',
  Decide: 'Decides',
  Resuelve: 'Resolves',
  'A bordo': 'On board',
  'EN VIVO': 'LIVE',
};

/** Traduce un texto suelto. */
export const traducir = (texto, lang) => (lang === 'en' ? (EN[texto] ?? texto) : texto);

/** El traductor, ya atado al idioma elegido. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (texto) => traducir(texto, lang);
}

/** El idioma actual, para lo que no es texto (formatos, datos). */
export function useLang() {
  return useStore((s) => s.lang);
}


/* ------------------------------------------------------------------ */
/* El catálogo, en el idioma elegido                                   */
/* ------------------------------------------------------------------ */

/** Los casos de uso, traducidos si toca. Mantienen ancla, color e id. */
export function useSolutions() {
  const lang = useStore((s) => s.lang);
  const solutions = useStore((s) => s.solutions);
  return useMemo(
    () => (lang === 'en' ? solutions.map((s) => localizarSolucion(s, 'en', SOLUTIONS_EN)) : solutions),
    [lang, solutions]
  );
}

/** Un caso concreto, ya traducido. */
export function useSolution(id) {
  const solutions = useSolutions();
  return solutions.find((s) => s.id === id) ?? null;
}

export function useIndustries() {
  const lang = useStore((s) => s.lang);
  const industries = useStore((s) => s.industries);
  return useMemo(() => localizarMapa(industries, lang, INDUSTRIES_EN), [lang, industries]);
}

export function useCapabilities() {
  const lang = useStore((s) => s.lang);
  const capabilities = useStore((s) => s.capabilities);
  return useMemo(() => localizarMapa(capabilities, lang, CAPABILITIES_EN), [lang, capabilities]);
}
