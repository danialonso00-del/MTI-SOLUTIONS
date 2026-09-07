/**
 * Catálogo MTI — modelo de dos ejes.
 *
 *   INDUSTRIES    (verticales)  ·  dónde se aplica: ciudad, transporte, recinto…
 *   CAPABILITIES  (soluciones)  ·  qué se despliega: centro de control, IoT,
 *                                  agentic AI, videovigilancia, analítica…
 *
 * Un mismo caso de uso pertenece a UNA industria y combina VARIAS soluciones.
 * Así, "IoT y Sensórica" aparece en agua, residuos y flota, que es justo la
 * conversación que se tiene en una reunión.
 *
 * Cada entrada genera automáticamente: el punto luminoso en la ciudad 3D, la
 * tarjeta del panel, la celda de la matriz y la ficha con PDF y demo.
 *
 * `realPlace` marca los casos que están donde de verdad se hicieron —el Camp
 * Nou y los autobuses de TMB—. Los demás se colocan por la ciudad solo para
 * poder enseñarlos, así que su ubicación NO se rotula en pantalla.
 *
 * El anclaje es GEOGRÁFICO: `latlon` + `height`. Las coordenadas locales en
 * metros (`anchor`) las calcula el store al cargar la ciudad, así que se puede
 * cambiar de zona o de ciudad sin tocar este archivo.
 */

export const INDUSTRIES = {
  'smart-cities': { id: 'smart-cities', label: 'Smart Cities', short: 'Ciudad', color: '#0ea5e9', icon: 'city' },
  transport: { id: 'transport', label: 'Transporte y Movilidad', short: 'Movilidad', color: '#E6A817', icon: 'bus' },
  environment: { id: 'environment', label: 'Medio Ambiente y Residuos', short: 'Residuos', color: '#10b981', icon: 'recycle' },
  venues: { id: 'venues', label: 'Estadios y Grandes Recintos', short: 'Recintos', color: '#f43f5e', icon: 'stadium' },
  buildings: { id: 'buildings', label: 'Edificios y Facilities', short: 'Edificios', color: '#a855f7', icon: 'building' },
  construction: { id: 'construction', label: 'Construcción y Obra', short: 'Obra', color: '#fb923c', icon: 'crane' },
};

export const CAPABILITIES = {
  'command-control': { id: 'command-control', label: 'Centro de Control', icon: 'command', blurb: 'Smart Hypervisor: toda la operación en un cristal' },
  iot: { id: 'iot', label: 'IoT y Sensórica', icon: 'sensor', blurb: 'Captura de datos en campo a escala' },
  security: { id: 'security', label: 'Seguridad y Videovigilancia', icon: 'shield', blurb: 'CCTV, analítica de vídeo y control de accesos' },
  'agentic-ai': { id: 'agentic-ai', label: 'Agentic AI', icon: 'ai', blurb: 'Agentes autónomos en procesos reales' },
  predictive: { id: 'predictive', label: 'Analítica y Predictivo', icon: 'chart', blurb: 'Mantenimiento predictivo y optimización' },
  integration: { id: 'integration', label: 'Integración de Sistemas', icon: 'integration', blurb: 'Federar legacy, SCADA, ERP y verticales' },
  connectivity: { id: 'connectivity', label: 'Conectividad y Edge', icon: 'edge', blurb: 'Redes privadas, 5G, LoRaWAN y edge computing' },
  'digital-twin': { id: 'digital-twin', label: 'Gemelo Digital', icon: 'twin', blurb: 'Réplica 3D viva del activo o del territorio' },
};

export const SOLUTIONS = [
  /* ------------------------------------------------------ SMART CITIES */
  {
    id: 'command-control',
    industry: 'smart-cities',
    capabilities: ['command-control', 'integration', 'agentic-ai', 'digital-twin'],
    title: 'Smart Hypervisor · Centro de Control',
    tagline: 'Un único cristal para toda la operación.',
    latlon: [41.4035, 2.18953],
    height: 158,
    place: 'Torre Glòries',
    summary:
      'La plataforma que federa tráfico, seguridad, agua, residuos y servicios municipales en una sola sala de control. Correlaciona eventos, guía protocolos y propone la siguiente mejor acción con agentes de IA.',
    bullets: [
      'Integración de sistemas legacy (SCADA, CCTV, ITS, 112)',
      'Motor de reglas y protocolos de emergencia guiados',
      'Agentic AI para triaje y priorización de incidencias',
      'Gemelo digital 3D sincronizado en tiempo real',
    ],
    kpis: [
      { value: 47, suffix: '%', label: 'Menor tiempo de respuesta' },
      { value: 23, suffix: '', label: 'Sistemas federados' },
      { value: 99.9, suffix: '%', label: 'Disponibilidad' },
    ],
    stack: ['Smart Hypervisor', 'MTi Agentive AI', 'Digital Twin Platform'],
    references: ['Ajuntament de L Hospitalet', 'Operadores de infraestructura'],
    pdf: 'docs/mti-command-control.pdf',
    demo: 'https://www.mingothings.com/',
  },
  {
    id: 'water-metering',
    industry: 'smart-cities',
    capabilities: ['iot', 'predictive', 'integration', 'connectivity'],
    title: 'Consumo de Agua y Contadores Inteligentes',
    tagline: 'Cada litro medido. Cada fuga, a la primera.',
    latlon: [41.38795, 2.18695],
    height: 26,
    place: 'Parc de la Ciutadella',
    summary:
      'Telelectura de contadores de agua a escala de ciudad y plataforma que convierte esas lecturas en operación: detección temprana de fugas, consumos anómalos, balance hídrico por sector y facturación con datos reales, sin visita a domicilio.',
    bullets: [
      'Telelectura NB-IoT / LoRaWAN sobre contadores nuevos y existentes',
      'Detección de fuga, caudal continuo y consumo anómalo por vivienda',
      'Balance hídrico por sector: agua registrada frente a agua inyectada',
      'Portal ciudadano de consumo y alertas de exceso',
      'Integración con facturación y con el centro de control',
    ],
    kpis: [
      { value: 24, suffix: '%', label: 'Menos pérdidas en red' },
      { value: 98, suffix: '%', label: 'Lecturas válidas' },
      { value: 72, suffix: 'h', label: 'Antes en detectar fuga' },
    ],
    stack: ['thethings.io', 'Smart Hypervisor', 'NB-IoT / LoRaWAN'],
    references: ['Operadores del ciclo urbano del agua'],
    pdf: 'docs/mti-water-metering.pdf',
    demo: 'https://www.mingothings.com/',
  },
  {
    id: 'urban-security',
    industry: 'smart-cities',
    capabilities: ['security', 'command-control', 'agentic-ai', 'connectivity'],
    title: 'Videovigilancia Urbana y Seguridad Ciudadana',
    tagline: 'Miles de cámaras. Un operador. Solo lo que importa.',
    latlon: [41.40116, 2.18638],
    height: 40,
    place: 'Mercat dels Encants',
    summary:
      'Plataforma de gestión de vídeo (VMS) integrada con el centro de control: analítica en el edge que convierte horas de grabación en alertas accionables, con trazabilidad y gestión de evidencias conforme a normativa.',
    bullets: [
      'VMS federado sobre cámaras de distintos fabricantes y generaciones',
      'Analítica de vídeo en el edge: intrusión, aglomeración, objeto abandonado, LPR',
      'Búsqueda forense por atributos sobre grabaciones históricas',
      'Cadena de custodia de evidencias y cumplimiento RGPD por diseño',
      'Despliegue mixto: cámaras fijas, domos PTZ y unidades móviles',
    ],
    kpis: [
      { value: 92, suffix: '%', label: 'Menos falsas alarmas' },
      { value: 3, suffix: ' min', label: 'Búsqueda forense media' },
      { value: 2400, suffix: '', label: 'Cámaras gestionadas' },
    ],
    stack: ['Smart Hypervisor', 'Video Analytics Edge', 'VMS federado', 'thethings.io'],
    references: ['Municipios y operadores de espacio público'],
    pdf: 'docs/mti-urban-security.pdf',
    demo: 'https://www.mingothings.com/',
  },

  {
    id: 'smart-lighting',
    industry: 'smart-cities',
    capabilities: ['iot', 'connectivity', 'predictive', 'integration'],
    title: 'Smart Lighting & Alumbrado Conectado',
    tagline: 'Cada luminaria, un sensor. Cada calle, un dato.',
    latlon: [41.40333, 2.17399],
    height: 130,
    place: 'Basílica de la Sagrada Família',
    summary:
      'Telegestión punto a punto del alumbrado público con regulación adaptativa por tráfico y luz natural. La red de luminarias se convierte en la columna vertebral IoT de la ciudad: soporta sensores de calidad del aire, ruido, aforo y cámaras.',
    bullets: [
      'Regulación adaptativa y calendarios astronómicos por zona',
      'Detección automática de fallo de luminaria y aviso a mantenimiento',
      'Red NB-IoT / LoRaWAN reutilizable para otros verticales',
      'Cuadros de mando de consumo y huella de carbono',
    ],
    kpis: [
      { value: 62, suffix: '%', label: 'Ahorro energético' },
      { value: 40, suffix: '%', label: 'Menos avisos en calle' },
      { value: 18, suffix: 'k', label: 'Puntos de luz gestionados' },
    ],
    stack: ['thethings.io', 'Smart Hypervisor', 'LoRaWAN / NB-IoT'],
    references: ['KSA Smart Lighting', 'L Hospitalet de Llobregat'],
    pdf: 'docs/mti-smart-lighting.pdf',
    demo: 'https://www.mingothings.com/',
  },

  /* -------------------------------------------------------- EDIFICIOS */
  {
    id: 'building-management',
    industry: 'buildings',
    capabilities: ['iot', 'predictive', 'integration', 'command-control'],
    title: 'Gestión Inteligente de Edificios',
    tagline: 'El edificio se explica solo: consumo, uso y averías.',
    latlon: [41.38845, 2.13594],
    height: 48,
    place: "L'Illa Diagonal · edificio de oficinas",
    summary:
      'Plataforma de gestión de edificios que federa el BMS, la climatización, la iluminación, los contadores y el control de accesos. Convierte el consumo y la ocupación reales en decisiones: qué planta climatizar, qué equipo revisar y qué espacio sobra.',
    bullets: [
      'Federación del BMS y de la climatización planta a planta',
      'Ocupación real por espacio: salas, plantas y puestos',
      'Mantenimiento predictivo de clima, ascensores y bombas',
      'Contadores de luz, agua y gas con reparto por inquilino',
      'Confort medido: temperatura, CO₂, humedad y ruido',
    ],
    kpis: [
      { value: 28, suffix: '%', label: 'Ahorro energético' },
      { value: 35, suffix: '%', label: 'Menos avisos correctivos' },
      { value: 4, suffix: 'h', label: 'Antes en detectar la avería' },
    ],
    stack: ['thethings.io', 'Smart Hypervisor', 'BMS / BACnet · Modbus'],
    references: ['Operadores patrimoniales y facility managers'],
    pdf: 'docs/mti-building-management.pdf',
    demo: 'https://www.mingothings.com/',
  },

  {
    id: 'air-quality',
    industry: 'smart-cities',
    capabilities: ['iot', 'predictive', 'connectivity', 'integration'],
    title: 'Calidad del Aire Urbana',
    tagline: 'Medir el aire calle a calle, no ciudad a ciudad.',
    latlon: [41.38878, 2.16702],
    height: 34,
    place: 'Gran Via · Passeig de Gràcia',
    summary:
      'Red de sensores de calidad del aire de bajo coste repartidos por el viario, calibrados contra las estaciones oficiales. Mide NO₂, partículas, ozono, ruido y meteorología a escala de calle, que es donde se respira, y convierte esa malla en decisiones: cortar tráfico, avisar a escuelas o justificar una zona de bajas emisiones.',
    bullets: [
      'Sensores en báculo de alumbrado, marquesina y fachada municipal',
      'NO₂, PM2,5, PM10, ozono, ruido, temperatura y humedad',
      'Calibración continua contra las estaciones oficiales de referencia',
      'Mapa de exposición por barrio, colegio y hora del día',
      'Avisos automáticos al superar umbrales y aviso a la ciudadanía',
      'Correlación con tráfico para saber qué medida funciona',
    ],
    kpis: [
      { value: 128, suffix: '', label: 'Puntos de medida' },
      { value: 31, suffix: '%', label: 'Menos NO₂ en el corredor' },
      { value: 15, suffix: ' min', label: 'Dato actualizado cada' },
    ],
    stack: ['thethings.io', 'Smart Hypervisor', 'LoRaWAN / NB-IoT'],
    references: ['Ayuntamientos y consorcios metropolitanos'],
    pdf: 'docs/mti-air-quality.pdf',
    demo: 'https://www.mingothings.com/',
  },

  {
    id: 'flood-monitoring',
    industry: 'smart-cities',
    capabilities: ['iot', 'connectivity', 'command-control', 'predictive'],
    title: 'Monitorización de Inundaciones',
    tagline: 'El nivel sube, la cámara lo confirma y emergencias ya lo sabe.',
    latlon: [41.41185, 2.19255],
    height: 22,
    place: 'Paso inferior y puente',
    summary:
      'Estación autónoma de vigilancia de nivel de agua en puentes, rieras y pasos inferiores: sensor de nivel, pluviómetro y una cámara de campo que se dispara sola al superar el umbral. La imagen llega junto al dato, así que el operador ve lo que está pasando antes de decidir, y la plataforma coordina el aviso a emergencias, el corte del paso y la información al ciudadano.',
    bullets: [
      'Sensor de nivel radar o de presión, sin contacto con el agua',
      'Cámara de campo disparada por umbral: dato e imagen en el mismo aviso',
      'Pluviómetro y estación meteorológica para anticipar la crecida',
      'Radio de largo alcance desde arqueta, sin cobertura ni cableado',
      'Estación autónoma con batería de años y respaldo 4G',
      'Aviso automático a emergencias, corte del paso y panel al ciudadano',
    ],
    kpis: [
      { value: 40, suffix: ' min', label: 'Antes del desbordamiento' },
      { value: 42, suffix: '', label: 'Puntos críticos vigilados' },
      { value: 10, suffix: ' años', label: 'Autonomía por estación' },
    ],
    stack: ['Worldsensing Thread X3', 'thethings.io', 'Smart Hypervisor'],
    references: ['Protección civil, carreteras y confederaciones hidrográficas'],
    pdf: 'docs/mti-flood-monitoring.pdf',
    demo: 'https://www.mingothings.com/',
  },

  /* ------------------------------------------------------------- OBRA */
  {
    id: 'smart-crane',
    industry: 'construction',
    capabilities: ['iot', 'predictive', 'connectivity', 'integration'],
    title: 'Grúas Inteligentes',
    tagline: 'La grúa dice cómo trabaja y cuándo hay que pararla.',
    latlon: [41.41355, 2.18765],
    height: 62,
    place: 'Obras de La Sagrera',
    summary:
      'Sensórica embarcada en la propia grúa torre: viento, carga, momento, giro, altura de gancho y horas de trabajo. Los datos suben a la plataforma y se convierten en seguridad —parar antes de que sea tarde— y en productividad: cuántos ciclos, con cuánta carga y cuánto tiempo muerto.',
    bullets: [
      'Anemómetro y sensor de carga y momento en tiempo real',
      'Parada preventiva y puesta en veleta por viento fuera de umbral',
      'Conteo de ciclos, cargas medias y tiempos muertos por turno',
      'Aviso de sobrecarga y de maniobra fuera de zona permitida',
      'Mantenimiento predictivo de cable, freno y motor por horas reales',
      'Conectividad propia en obra (LTE/LoRaWAN) sin depender del wifi',
    ],
    kpis: [
      { value: 100, suffix: '%', label: 'Maniobras registradas' },
      { value: 32, suffix: '%', label: 'Menos tiempos muertos' },
      { value: 4, suffix: 'h', label: 'Antes en detectar la avería' },
    ],
    stack: ['thethings.io', 'Smart Hypervisor', 'LTE / LoRaWAN en obra'],
    references: ['Constructoras y alquiladores de maquinaria'],
    pdf: 'docs/mti-smart-crane.pdf',
    demo: 'https://www.mingothings.com/',
  },

  {
    id: 'slope-monitoring',
    industry: 'construction',
    capabilities: ['iot', 'predictive', 'connectivity', 'command-control'],
    title: 'Monitorización de Taludes',
    tagline: 'El terreno avisa antes de moverse. Hay que estar escuchando.',
    latlon: [41.41215, 2.19125],
    height: 24,
    place: 'Trinchera ferroviaria',
    summary:
      'Instrumentación geotécnica inalámbrica sobre el talud: inclinómetros, células de carga en anclajes, piezómetros, fisurómetros y estación meteorológica, todos enviando por radio de largo alcance. La plataforma cruza desplazamiento con lluvia y nivel freático, y avisa cuando la tendencia se acelera, no cuando ya se ha caído.',
    bullets: [
      'Inclinómetros y nodos de desplazamiento sin cablear el talud',
      'Piezómetros y pluviómetro: el agua es la que mueve el terreno',
      'Células de carga en anclajes y bulones',
      'Umbrales por velocidad de desplazamiento, no solo por valor absoluto',
      'Alarma a obra, a explotación ferroviaria y al geotécnico de guardia',
      'Radio de largo alcance en obra, sin cobertura móvil ni wifi',
    ],
    kpis: [
      { value: 72, suffix: ' h', label: 'Aviso antes del colapso' },
      { value: 0.2, suffix: ' mm', label: 'Resolución de medida' },
      { value: 5, suffix: ' años', label: 'Batería por nodo' },
    ],
    stack: ['Worldsensing Loadsensing', 'thethings.io', 'Smart Hypervisor'],
    references: ['Obra civil, minería y explotación ferroviaria'],
    pdf: 'docs/mti-slope-monitoring.pdf',
    demo: 'https://www.mingothings.com/',
  },

  /* -------------------------------------------------------- MOVILIDAD */
  {
    id: 'mobility-fleet',
    industry: 'transport',
    capabilities: ['iot', 'predictive', 'integration', 'connectivity'],
    title: 'Flota Conectada y Transporte Público',
    tagline: 'Cada vehículo sabe dónde está y qué le pasa.',
    latlon: [41.39384, 2.18304],
    height: 34,
    place: 'TMB · Barcelona',
    realPlace: true, // proyecto real con TMB
    summary:
      'Plataforma de gestión de flota y sistemas de información al pasajero: localización en tiempo real, predicción de llegada, salud del vehículo y explotación de datos de ocupación para redimensionar la oferta.',
    bullets: [
      'Tracking IoT a bordo y telemetría CAN-bus',
      'SAE y paneles de información al pasajero (SIP)',
      'Mantenimiento predictivo de flota',
      'Analítica de ocupación y demanda por franja',
    ],
    kpis: [
      { value: 31, suffix: '%', label: 'Mejora de puntualidad' },
      { value: 25, suffix: '%', label: 'Menos averías en ruta' },
      { value: 1.2, suffix: 'M', label: 'Eventos/día procesados' },
    ],
    stack: ['thethings.io', 'Edge Gateways', 'Smart Hypervisor'],
    references: ['TMB · Transports Metropolitans de Barcelona', 'Abertis'],
    pdf: 'docs/mti-fleet-mobility.pdf',
    demo: 'https://www.mingothings.com/',
  },

  /* --------------------------------------------------------- RESIDUOS */
  {
    id: 'waste-management',
    industry: 'environment',
    capabilities: ['iot', 'predictive', 'integration'],
    title: 'Waste Management Inteligente',
    tagline: 'Recoger solo lo que está lleno.',
    latlon: [41.39545, 2.18247],
    height: 30,
    place: 'Mercat del Fort Pienc',
    summary:
      'Sensorización volumétrica de contenedores, identificación de usuario en el depósito y optimización dinámica de rutas de recogida. Trazabilidad completa del residuo para justificar tasas variables y objetivos de reciclaje.',
    bullets: [
      'Sensores de llenado ultrasónicos / ToF en contenedor',
      'Rutas dinámicas recalculadas cada día por llenado real',
      'Identificación ciudadana (RFID/NFC) y pago por generación',
      'KPIs de separación selectiva y trazabilidad por fracción',
    ],
    kpis: [
      { value: 38, suffix: '%', label: 'Menos km recorridos' },
      { value: 45, suffix: '%', label: 'Menos recogidas en vacío' },
      { value: 28, suffix: '%', label: 'Más separación selectiva' },
    ],
    stack: ['thethings.io', 'Route Optimizer', 'Smart Hypervisor'],
    references: ['Municipios del área metropolitana de Barcelona'],
    pdf: 'docs/mti-waste-management.pdf',
    demo: 'https://www.mingothings.com/',
  },

  /* --------------------------------------------------------- RECINTOS */
  {
    id: 'stadium',
    industry: 'venues',
    capabilities: ['command-control', 'security', 'connectivity', 'iot'],
    title: 'Smart Stadium & Grandes Eventos',
    tagline: 'De 90.000 personas a una operación previsible.',
    latlon: [41.3809, 2.12282],
    height: 56,
    rigRadius: 330,
    rigHeight: 115,
    place: 'Camp Nou',
    realPlace: true, // proyecto real: la ubicación sí se rotula
    summary:
      'Digitalización integral del recinto: control de aforo y flujos, seguridad integrada, conectividad de alta densidad, experiencia de fan y eficiencia energética del edificio. Toda la operación del evento en un único centro de control.',
    bullets: [
      'Conteo de personas y mapas de calor de flujos en tiempo real',
      'Seguridad integrada: CCTV analítica, accesos y megafonía',
      'Wi-Fi/5G de alta densidad y servicios al aficionado',
      'Gestión energética y de climatización del recinto',
    ],
    kpis: [
      { value: 90, suffix: 'k', label: 'Asistentes gestionados' },
      { value: 52, suffix: '%', label: 'Accesos más rápidos' },
      { value: 21, suffix: '%', label: 'Ahorro energético' },
    ],
    stack: ['Smart Hypervisor', 'Video Analytics', 'High-density networking'],
    references: ['Grandes recintos deportivos y feriales'],
    pdf: 'docs/mti-smart-stadium.pdf',
    demo: 'https://www.mingothings.com/',
  },
];

/* ------------------------------------------------------------------ */
/* Idioma                                                              */
/* ------------------------------------------------------------------ */

/**
 * Devuelve el caso de uso en el idioma pedido. Solo cambia lo que se lee:
 * identificadores, coordenadas y colores son los mismos.
 */
export function localizarSolucion(sol, lang, en) {
  if (lang !== 'en' || !sol) return sol;
  const t = en?.[sol.id];
  if (!t) return sol;
  return {
    ...sol,
    realPlace: sol.realPlace,
    title: t.title ?? sol.title,
    tagline: t.tagline ?? sol.tagline,
    place: t.place ?? sol.place,
    summary: t.summary ?? sol.summary,
    bullets: t.bullets ?? sol.bullets,
    kpis: (sol.kpis ?? []).map((k, i) => ({ ...k, label: t.kpis?.[i] ?? k.label })),
  };
}

/** Lo mismo para las etiquetas de industrias y soluciones. */
export const localizarMapa = (base, lang, en) => {
  if (lang !== 'en' || !en) return base;
  const salida = {};
  for (const [id, v] of Object.entries(base)) salida[id] = { ...v, ...(en[id] ?? {}) };
  return salida;
};

/** Índice inverso: qué casos de uso existen para cada par industria × solución. */
export const buildMatrix = (solutions = SOLUTIONS) => {
  const matrix = {};
  for (const industry of Object.keys(INDUSTRIES)) {
    matrix[industry] = {};
    for (const cap of Object.keys(CAPABILITIES)) matrix[industry][cap] = [];
  }
  for (const s of solutions) {
    for (const cap of s.capabilities ?? []) {
      if (matrix[s.industry]?.[cap]) matrix[s.industry][cap].push(s.id);
    }
  }
  return matrix;
};

// Compatibilidad con la primera versión del catálogo (color e icono por vertical).
export const CATEGORIES = INDUSTRIES;
