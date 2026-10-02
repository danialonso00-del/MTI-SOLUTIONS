/**
 * Recursos extraídos de la presentación corporativa
 * =================================================
 *
 * Origen: public/MTI_GROUP_Presentation_v.01.pptx (no se modifica ni se sirve
 * procesado: la aplicación solo consume lo que hay en
 * public/assets/mti-presentation/).
 *
 * Este archivo es la ÚNICA fuente de verdad de los recursos:
 *   - `scripts/extract-presentation.mjs` lo lee para saber qué medio del
 *     PowerPoint sacar, cómo llamarlo y cómo optimizarlo;
 *   - la aplicación lo lee para saber qué imagen va en cada escena.
 *
 * Campos
 *   media     nombre del archivo dentro de ppt/media del .pptx
 *   slide     diapositiva donde aparece (para auditar)
 *   kind      photo · logo · icon · screenshot · brand · graphic
 *   folder    subcarpeta de salida
 *   name      nombre de archivo de salida, sin extensión
 *   client / project / sector / platform / chapter   relaciones
 *   alt       texto alternativo (castellano; la versión inglesa en `altEn`)
 *   solution  id de caso de uso de la ciudad 3D, SOLO si la relación es real
 *   onLight   el logo está diseñado para fondo claro: se muestra sobre placa
 *   tint      los iconos se recolorean al dorado MTI al extraerlos
 */

export const ASSET_BASE = '/assets/mti-presentation';

import { STOCK_PHOTOS } from './stockPhotos.js';

export const PRESENTATION_ASSETS = [
  /* ------------------------------------------------------------ marca */
  {
    id: 'brand-mti-group',
    media: 'image4.png',
    slide: 1,
    kind: 'brand',
    folder: 'brand',
    name: 'mti-logo-group-mingothings',
    chapter: 'opening',
    description: 'Logotipo MTi · Group Mingothings de la portada',
    alt: 'MTi · Group Mingothings',
    altEn: 'MTi · Group Mingothings',
  },

  /* --------------------------------------------------------- clientes */
  { id: 'client-aena', media: 'image29.png', slide: 7, kind: 'logo', folder: 'clients', name: 'aena', client: 'AENA', project: 'aena', sector: 'transport', chapter: 'projects', alt: 'Logotipo de AENA', altEn: 'AENA logo', onLight: true, solution: 'urban-security' },
  { id: 'client-tmb', media: 'image43.png', slide: 7, kind: 'logo', folder: 'clients', name: 'tmb-transports-metropolitans-de-barcelona', client: 'TMB', project: 'metro', sector: 'transport', chapter: 'projects', alt: 'Logotipo de TMB · Transports Metropolitans de Barcelona', altEn: 'TMB · Transports Metropolitans de Barcelona logo', onLight: true, solution: 'mobility-fleet' },
  { id: 'client-navantia', media: 'image39.png', slide: 7, kind: 'logo', folder: 'clients', name: 'navantia', client: 'Navantia', project: 'navantia', sector: 'industry-naval', chapter: 'projects', alt: 'Logotipo de Navantia', altEn: 'Navantia logo', onLight: true },
  { id: 'client-fcb', media: 'image40.png', slide: 7, kind: 'logo', folder: 'clients', name: 'fc-barcelona', client: 'FC Barcelona', sector: 'venues', chapter: 'why', alt: 'Escudo del FC Barcelona', altEn: 'FC Barcelona crest', solution: 'stadium' },
  { id: 'client-abertis', media: 'image42.svg', slide: 7, kind: 'logo', folder: 'clients', name: 'abertis', client: 'Abertis', sector: 'transport', chapter: 'why', alt: 'Logotipo de Abertis', altEn: 'Abertis logo', onLight: true },
  { id: 'client-moventia', media: 'image24.png', slide: 7, kind: 'logo', folder: 'clients', name: 'moventia', client: 'Moventia', sector: 'transport', chapter: 'why', alt: 'Logotipo de Moventia', altEn: 'Moventia logo', onLight: true },
  { id: 'client-fujitsu', media: 'image25.png', slide: 7, kind: 'logo', folder: 'clients', name: 'fujitsu', client: 'Fujitsu', chapter: 'why', alt: 'Logotipo de Fujitsu', altEn: 'Fujitsu logo', onLight: true },
  { id: 'client-indra', media: 'image41.png', slide: 7, kind: 'logo', folder: 'clients', name: 'indra', client: 'Indra', chapter: 'why', alt: 'Logotipo de Indra', altEn: 'Indra logo', onLight: true },
  { id: 'client-gmv', media: 'image38.png', slide: 7, kind: 'logo', folder: 'clients', name: 'gmv', client: 'GMV', chapter: 'why', alt: 'Logotipo de GMV', altEn: 'GMV logo', onLight: true },
  { id: 'client-etra', media: 'image26.png', slide: 7, kind: 'logo', folder: 'clients', name: 'etra', client: 'Etra', chapter: 'why', alt: 'Logotipo de Etra', altEn: 'Etra logo', onLight: true },
  { id: 'client-ferri', media: 'image31.png', slide: 7, kind: 'logo', folder: 'clients', name: 'ferri', client: 'Ferri', sector: 'industry-naval', chapter: 'why', alt: 'Logotipo de Ferri', altEn: 'Ferri logo', onLight: true },
  { id: 'client-copegal', media: 'image37.png', slide: 7, kind: 'logo', folder: 'clients', name: 'copegal', client: 'Copegal', chapter: 'why', alt: 'Logotipo de Copegal', altEn: 'Copegal logo', onLight: true },
  { id: 'client-rcfil', media: 'image30.jpeg', slide: 7, kind: 'logo', folder: 'clients', name: 'rcfil-non-tex', client: 'RCFIL', chapter: 'why', alt: 'Logotipo de RCfil Non-Tex', altEn: 'RCfil Non-Tex logo', onLight: true },
  { id: 'client-merchant-union', media: 'image36.png', slide: 7, kind: 'logo', folder: 'clients', name: 'merchant-union', client: 'Merchant Union', chapter: 'why', alt: 'Logotipo de Merchant Union', altEn: 'Merchant Union logo', onLight: true },
  { id: 'client-galpi', media: 'image34.png', slide: 7, kind: 'logo', folder: 'clients', name: 'galpi', client: 'Galpi', chapter: 'why', alt: 'Logotipo de Galpi', altEn: 'Galpi logo', onLight: true },
  { id: 'client-galmetec', media: 'image32.jpeg', slide: 7, kind: 'logo', folder: 'clients', name: 'galmetec', client: 'Galmetec', chapter: 'why', alt: 'Logotipo de Galmetec', altEn: 'Galmetec logo', onLight: true },
  { id: 'client-radiovigo', media: 'image33.png', slide: 7, kind: 'logo', folder: 'clients', name: 'radiovigo', client: 'RadioVigo', chapter: 'why', alt: 'Logotipo de RadioVigo', altEn: 'RadioVigo logo', onLight: true },
  { id: 'client-sergas', media: 'image35.png', slide: 7, kind: 'logo', folder: 'clients', name: 'servizo-galego-de-saude', client: 'Servizo Galego de Saúde', sector: 'health', chapter: 'why', alt: 'Logotipo del Servizo Galego de Saúde', altEn: 'Servizo Galego de Saúde logo', onLight: true },

  /* -------------------------------------------------------- proyectos */
  { id: 'project-aena', media: 'image113.jpg', slide: 23, kind: 'photo', folder: 'projects', name: 'aena-barcelona-el-prat-t1-terminal', client: 'AENA', project: 'aena', sector: 'transport', chapter: 'projects', alt: 'Interior de la terminal T1 del aeropuerto de Barcelona-El Prat', altEn: 'Inside Terminal 1 at Barcelona-El Prat airport', solution: 'urban-security' },
  { id: 'project-metro', media: 'image117.jpeg', slide: 24, kind: 'photo', folder: 'projects', name: 'tmb-metro-barcelona-anden', client: 'TMB', project: 'metro', sector: 'transport', chapter: 'projects', alt: 'Andén del metro de Barcelona con un tren de TMB entrando', altEn: 'Barcelona metro platform with a TMB train arriving', solution: 'urban-security' },
  { id: 'project-buses', media: 'image119.jpeg', slide: 25, kind: 'photo', folder: 'projects', name: 'tmb-autobuses-flota-articulada', client: 'TMB', project: 'buses', sector: 'transport', chapter: 'projects', alt: 'Autobuses articulados de TMB circulando en Barcelona', altEn: 'TMB articulated buses in Barcelona', solution: 'mobility-fleet' },
  { id: 'project-hospitalet', media: 'image121.jpg', slide: 26, kind: 'photo', folder: 'projects', name: 'hospitalet-de-llobregat-vista-aerea', client: "L'Hospitalet de Llobregat", project: 'hospitalet', sector: 'smart-cities', chapter: 'projects', alt: "Vista aérea de edificios en L'Hospitalet de Llobregat", altEn: "Aerial view of buildings in L'Hospitalet de Llobregat", solution: 'building-management' },
  { id: 'project-navantia', media: 'image124.jpeg', slide: 27, kind: 'photo', folder: 'projects', name: 'navantia-astillero-vista-aerea', client: 'Navantia', project: 'navantia', sector: 'industry-naval', chapter: 'projects', alt: 'Vista aérea de un astillero de Navantia con grúas pórtico', altEn: 'Aerial view of a Navantia shipyard with gantry cranes' },
  { id: 'project-kafd', media: 'image126.jpeg', slide: 28, kind: 'photo', folder: 'projects', name: 'kafd-riad-distrito-nocturno', client: 'KAFD', project: 'kafd', sector: 'smart-cities', chapter: 'projects', alt: 'Torres iluminadas del distrito KAFD de noche', altEn: 'Illuminated towers of the KAFD district at night', solution: 'command-control', review: 'La fotografía lleva la marca de agua de un tercero («Mohammed Younos · The Middle Frame»). Confirmar derechos de uso o sustituirla por una imagen propia antes de enseñarla a clientes.' },
  { id: 'project-qatar', media: 'image127.jpeg', slide: 28, kind: 'photo', folder: 'projects', name: 'qatar-smart-waste-skyline', client: 'Qatar · Municipal', project: 'qatar-waste', sector: 'smart-cities', chapter: 'projects', alt: 'Skyline urbano al atardecer que acompaña el caso de gestión de residuos en Qatar', altEn: 'City skyline at sunset accompanying the Qatar waste management case', solution: 'waste-management', review: 'La fotografía es la que usa la presentación para este caso, pero no se identifica la ciudad retratada. Confirmar que representa el área del proyecto antes de rotularla.' },
  { id: 'project-nsu', media: 'image128.jpeg', slide: 28, kind: 'photo', folder: 'projects', name: 'nsu-florida-living-lab', client: 'NSU Florida', project: 'nsu', sector: 'smart-cities', chapter: 'projects', alt: 'Recreación aérea del Living Lab de Nova Southeastern University', altEn: 'Aerial render of the Nova Southeastern University Living Lab', solution: 'air-quality' },
  { id: 'project-malaysia', media: 'image130.jfif', slide: 28, kind: 'photo', folder: 'projects', name: 'malasia-calidad-del-aire', client: 'Malasia', project: 'malaysia-aqi', sector: 'smart-cities', chapter: 'projects', alt: 'Paisaje urbano junto a un lago en Malasia', altEn: 'Urban landscape by a lake in Malaysia', solution: 'air-quality' },

  /* ---------------------------------------------------------- sectores */
  { id: 'sector-security', media: 'image17.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'seguridad-camara-cctv', sector: 'security', chapter: 'sectors', alt: 'Cámara CCTV montada en una estructura', altEn: 'CCTV camera mounted on a structure', solution: 'urban-security' },
  { id: 'sector-smart-cities', media: 'image18.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'smart-cities-mobiliario-urbano-conectado', sector: 'smart-cities', chapter: 'sectors', alt: 'Tótem digital y contenedores inteligentes en una calle', altEn: 'Digital kiosk and smart bins on a street', solution: 'command-control' },
  { id: 'sector-industry', media: 'image19.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'industria-naval-astillero', sector: 'industry-naval', chapter: 'sectors', alt: 'Astillero con dique y grúas visto desde el aire', altEn: 'Shipyard dock and cranes seen from the air' },
  { id: 'sector-cyber', media: 'image20.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'ciberseguridad-sala-tecnica', sector: 'cybersecurity', chapter: 'sectors', alt: 'Sala técnica en penumbra con iluminación roja', altEn: 'Dim technical room lit in red' },
  { id: 'sector-venues', media: 'image21.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'recintos-deportivos-grada-llena', sector: 'venues', chapter: 'sectors', alt: 'Grada de un estadio llena de público', altEn: 'Packed stadium stand', solution: 'stadium' },
  { id: 'sector-transport', media: 'image22.jpeg', slide: 6, kind: 'photo', folder: 'sectors', name: 'transportes-tren-en-estacion', sector: 'transport', chapter: 'sectors', alt: 'Tren de alta velocidad en una estación', altEn: 'High-speed train in a station', solution: 'mobility-fleet' },

  /* ---------------------------------------------------------- servicios */
  { id: 'service-integration', media: 'image56.jpeg', slide: 11, kind: 'photo', folder: 'services', name: 'integracion-de-sistemas-rack-de-red', chapter: 'delivery', alt: 'Técnico conectando cables en un rack de red', altEn: 'Technician patching cables in a network rack' },
  { id: 'service-cctv', media: 'image69.jpeg', slide: 13, kind: 'photo', folder: 'services', name: 'cctv-sala-de-control-videovigilancia', chapter: 'delivery', alt: 'Sala de control con monitores de videovigilancia', altEn: 'Control room with video surveillance monitors', solution: 'urban-security' },
  { id: 'service-maintenance', media: 'image74.jpeg', slide: 14, kind: 'photo', folder: 'services', name: 'mantenimiento-tecnico-en-planta', chapter: 'delivery', alt: 'Técnico con casco revisando datos en un portátil en una planta industrial', altEn: 'Technician in a hard hat checking data on a laptop in an industrial plant' },

  /* -------------------------------------------------------- plataformas */
  { id: 'platform-thethings-logo', media: 'image89.png', slide: 17, kind: 'logo', folder: 'platforms', name: 'thethingsio-logotipo', platform: 'thethings', chapter: 'platforms', alt: 'Logotipo de thethings.io', altEn: 'thethings.io logo', onLight: true },
  { id: 'platform-thethings-dashboard', media: 'image90.png', slide: 17, kind: 'screenshot', folder: 'platforms', name: 'thethingsio-cuadro-de-mando', platform: 'thethings', chapter: 'platforms', alt: 'Cuadro de mando de thethings.io con mapa mundial de dispositivos y métricas', altEn: 'thethings.io dashboard with a world map of devices and metrics', solution: 'water-metering' },
  { id: 'platform-hypervisor-room', media: 'image93.jpeg', slide: 18, kind: 'photo', folder: 'platforms', name: 'mti-hypervisor-sala-de-control', platform: 'hypervisor', chapter: 'platforms', alt: 'Sala de control con pantallas holográficas frente a una ciudad', altEn: 'Control room with holographic screens overlooking a city', solution: 'command-control' },
  { id: 'platform-agentic-orchestrator', media: 'image101.png', slide: 20, kind: 'graphic', folder: 'platforms', name: 'agentic-ai-arquitectura-orquestador', platform: 'agentic', chapter: 'platforms', alt: 'Arquitectura del agente orquestador conectado a ERP, CRM, IoT y documentos', altEn: 'Orchestrator agent architecture connected to ERP, CRM, IoT and documents' },

  /* ------------------------------------------------------------ fondos */
  { id: 'bg-cover-network', media: 'image2.png', slide: 1, kind: 'graphic', folder: 'backgrounds', name: 'portada-red-de-nodos', chapter: 'opening', alt: '', altEn: '' },
  { id: 'bg-closing-network', media: 'image137.png', slide: 30, kind: 'graphic', folder: 'backgrounds', name: 'cierre-red-de-nodos', chapter: 'why', alt: '', altEn: '' },

  /* ------------------------------------------------------------ iconos */
  ...[
    ['image12.png', 4, 'pilar-foco-operaciones-criticas', 'pillar-mission'],
    ['image13.png', 4, 'pilar-entrega-extremo-a-extremo', 'pillar-end-to-end'],
    ['image14.png', 4, 'pilar-plataformas-propias', 'pillar-platforms'],
    ['image15.png', 4, 'pilar-roi-medible', 'pillar-roi'],
    ['image48.png', 10, 'servicio-diseno-ingenieria', 'service-design'],
    ['image49.png', 10, 'servicio-instalacion-integracion', 'service-install'],
    ['image50.png', 10, 'servicio-iot-conectividad', 'service-iot'],
    ['image51.png', 10, 'servicio-agentic-ai', 'service-ai'],
    ['image52.png', 10, 'servicio-digital-twin-bim', 'service-twin'],
    ['image53.png', 10, 'servicio-plataformas-smart-city', 'service-smartcity'],
    ['image54.png', 10, 'servicio-certificacion-auditoria', 'service-cert'],
    ['image55.png', 10, 'servicio-configuracion-om-24-7', 'service-om'],
    ['image83.png', 16, 'plataforma-mti-hypervisor', 'platform-hypervisor'],
    ['image84.png', 16, 'plataforma-thethingsio', 'platform-thethings'],
    ['image85.png', 16, 'plataforma-digital-twin', 'platform-twin'],
    ['image86.png', 16, 'plataforma-agentic-ai', 'platform-agentic'],
    ['image103.png', 21, 'agente-c01-email-operations', 'agent-C01'],
    ['image104.png', 21, 'agente-c02-tender-offer-engine', 'agent-C02'],
    ['image105.png', 21, 'agente-c03-voice-support', 'agent-C03'],
    ['image106.png', 21, 'agente-c04-sales-intelligence', 'agent-C04'],
    ['image107.png', 21, 'agente-c05-order-processing', 'agent-C05'],
    ['image108.png', 21, 'agente-c06-delivery-docs', 'agent-C06'],
    ['image109.png', 21, 'agente-c07-knowledge-assistant', 'agent-C07'],
    ['image110.png', 21, 'agente-c08-incident-quality', 'agent-C08'],
    ['image131.png', 29, 'razon-instalacion-multimarca', 'reason-multibrand'],
    ['image132.png', 29, 'razon-experiencia-itxpt', 'reason-itxpt'],
    ['image133.png', 29, 'razon-gestion-de-proyectos', 'reason-pm'],
    ['image134.png', 29, 'razon-soporte-posventa', 'reason-support'],
    ['image135.png', 29, 'razon-sistemas-heterogeneos', 'reason-hetero'],
    ['image77.png', 14, 'mantenimiento-preventivo', 'maint-preventive'],
    ['image78.png', 14, 'mantenimiento-correctivo', 'maint-corrective'],
    ['image79.png', 14, 'mantenimiento-predictivo', 'maint-predictive'],
    ['image80.png', 14, 'mantenimiento-garantia-extendida', 'maint-warranty'],
    ['image63.png', 12, 'palanca-reingenieria-procesos', 'lever-process'],
    ['image64.png', 12, 'palanca-cimientos-de-datos', 'lever-data'],
    ['image65.png', 12, 'palanca-casos-de-ia', 'lever-ai'],
    ['image66.png', 12, 'palanca-personas-adopcion', 'lever-people'],
    ['image67.png', 12, 'palanca-cumplimiento-seguridad', 'lever-compliance'],
    ['image94.png', 19, 'twin-edificios-facilities', 'twin-buildings'],
    ['image95.png', 19, 'twin-centros-de-datos', 'twin-datacenters'],
    ['image96.png', 19, 'twin-industria-naval', 'twin-industry'],
    ['image97.png', 19, 'twin-recintos-deportivos', 'twin-venues'],
    ['image98.png', 19, 'twin-smart-cities', 'twin-cities'],
    ['image99.png', 19, 'twin-infraestructuras', 'twin-infrastructure'],
  ].map(([media, slide, name, key]) => ({
    id: `icon-${key}`,
    media,
    slide,
    kind: 'icon',
    folder: 'icons',
    name,
    tint: true,
    alt: '',
    altEn: '',
  })),
];


/* ------------------------------------------------------------------ */
/* Presentación de IA Agentiva (Agentify AI)                           */
/* public/MTi_Group_IA_Agentiva_Recort_v.01.pptx                        */
/* ------------------------------------------------------------------ */

const AG = { source: 'agentic', chapter: 'agentic' };

export const AGENTIC_ASSETS = [
  /* casos: fotografía */
  { ...AG, id: 'ag-case-coplegal', media: 'image67.jpeg', slide: 15, kind: 'photo', folder: 'agentic/cases', name: 'coplegal-taller-mecanizado', client: 'COPLEGAL', project: 'coplegal', alt: 'Taller de fabricación con piezas metálicas mecanizadas', altEn: 'Workshop with machined metal parts' },
  { ...AG, id: 'ag-case-galmetec', media: 'image74.png', slide: 19, kind: 'photo', folder: 'agentic/cases', name: 'galmetec-mecanizado-precision', client: 'GALMETEC', project: 'galmetec', alt: 'Taller de mecanizado de precisión', altEn: 'Precision machining workshop' },
  { ...AG, id: 'ag-case-prisa', media: 'image76.jpeg', slide: 20, kind: 'photo', folder: 'agentic/cases', name: 'radio-vigo-estudio-emision', client: 'Radio Vigo · Grupo PRISA', project: 'prisa', alt: 'Estudio de radio con micrófono y mesa de mezclas', altEn: 'Radio studio with microphone and mixing desk' },
  { ...AG, id: 'ag-case-promega', media: 'image78.png', slide: 21, kind: 'photo', folder: 'agentic/cases', name: 'promega-fabricacion-industrial', client: 'PROMEGA', project: 'promega', alt: 'Planta de fabricación industrial', altEn: 'Industrial manufacturing plant' },
  { ...AG, id: 'ag-case-sigi', media: 'image85.jpeg', slide: 24, kind: 'photo', folder: 'agentic/cases', name: 'sigi-hospital-pasillo', client: 'SIGI · SERGAS', project: 'sigi', alt: 'Pasillo luminoso de un hospital', altEn: 'Bright hospital corridor' },
  { ...AG, id: 'ag-case-frioteis', media: 'image87.png', slide: 25, kind: 'photo', folder: 'agentic/cases', name: 'frioteis-almacen-frigorifico', client: 'FRIOTEIS', project: 'frioteis', alt: 'Almacén frigorífico con carretilla elevadora', altEn: 'Cold storage warehouse with a forklift' },
  { ...AG, id: 'ag-case-aspol', media: 'image90.png', slide: 26, kind: 'photo', folder: 'agentic/cases', name: 'aspol-camiones-al-atardecer', client: 'ASPOL', project: 'aspol', alt: 'Camiones de transporte al atardecer', altEn: 'Freight trucks at sunset' },
  { ...AG, id: 'ag-case-nautia', media: 'image93.jpeg', slide: 27, kind: 'photo', folder: 'agentic/cases', name: 'nautia-puerto-contenedores', client: 'NAUTIA', project: 'nautia', alt: 'Vista aérea de un puerto de contenedores', altEn: 'Aerial view of a container port' },
  { ...AG, id: 'ag-case-tecnicas', media: 'image95.png', slide: 28, kind: 'photo', folder: 'agentic/cases', name: 'tecnicas-del-mar-buque', client: 'Técnicas del Mar', project: 'tecnicas', alt: 'Buque de carga navegando', altEn: 'Cargo ship at sea' },

  /* casos: gráficos propios de la presentación */
  { ...AG, id: 'ag-graphic-rcfil', media: 'image70.png', slide: 16, kind: 'graphic', folder: 'agentic/cases', name: 'rcfil-rutas-camiones', project: 'rcfil', alt: 'Esquema de rutas de camiones', altEn: 'Truck route diagram' },
  { ...AG, id: 'ag-graphic-regenasa', media: 'image72.png', slide: 18, kind: 'graphic', folder: 'agentic/cases', name: 'regenasa-revision-de-planos', project: 'regenasa', alt: 'Esquema de revisiones de planos', altEn: 'Drawing revision diagram' },

  /* logos de clientes que no estaban en la corporativa */
  { ...AG, id: 'ag-logo-regenasa', media: 'image73.png', slide: 18, kind: 'logo', folder: 'clients', name: 'regenasa', client: 'REGENASA', project: 'regenasa', alt: 'Logotipo de Regenasa Marine Interiors', altEn: 'Regenasa Marine Interiors logo', onLight: true },
  { ...AG, id: 'ag-logo-promega', media: 'image80.png', slide: 21, kind: 'logo', folder: 'clients', name: 'promega', client: 'PROMEGA', project: 'promega', alt: 'Logotipo de Promega', altEn: 'Promega logo', onLight: true },
  { ...AG, id: 'ag-logo-ucalsa', media: 'image81.png', slide: 22, kind: 'logo', folder: 'clients', name: 'ucalsa', client: 'UCALSA', project: 'ucalsa', alt: 'Logotipo de Ucalsa', altEn: 'Ucalsa logo', onLight: true },
  { ...AG, id: 'ag-logo-frioteis', media: 'image89.png', slide: 25, kind: 'logo', folder: 'clients', name: 'frioteis', client: 'FRIOTEIS', project: 'frioteis', alt: 'Logotipo de Frioteis', altEn: 'Frioteis logo', onLight: true },
  { ...AG, id: 'ag-logo-aspol', media: 'image92.png', slide: 26, kind: 'logo', folder: 'clients', name: 'aspol', client: 'ASPOL', project: 'aspol', alt: 'Logotipo de Aspol', altEn: 'Aspol logo', onLight: true },

  /* iconografía de la presentación */
  ...[
    ['image102.png', 31, 'agente-c01-correo', 'ag-C01'],
    ['image123.png', 33, 'agente-c02-licitacion', 'ag-C02'],
    ['image138.png', 35, 'agente-c03-voz', 'ag-C03'],
    ['image150.png', 37, 'agente-c04-crm', 'ag-C04'],
    ['image157.png', 39, 'agente-c05-pedidos', 'ag-C05'],
    ['image162.png', 41, 'agente-c06-albaranes', 'ag-C06'],
    ['image165.png', 43, 'agente-c07-conocimiento', 'ag-C07'],
    ['image172.png', 45, 'agente-c08-incidencias', 'ag-C08'],
    ['image48.png', 10, 'rasgo-autonomo', 'ag-autonomous'],
    ['image49.png', 10, 'rasgo-integrado', 'ag-integrated'],
    ['image50.png', 10, 'rasgo-explicable', 'ag-explainable'],
    ['image51.png', 10, 'rasgo-productivizado', 'ag-productized'],
  ].map(([media, slide, name, key]) => ({ ...AG, id: `icon-${key}`, media, slide, kind: 'icon', folder: 'icons', name, tint: true, alt: '', altEn: '' })),
];

PRESENTATION_ASSETS.push(...AGENTIC_ASSETS);

/* ------------------------------------------------------------------ */
/* Fotografías de alta resolución que no vienen de las presentaciones   */
/* (ver stockPhotos.js): sectores, fondos de proyecto y sus «monitores»  */
/* ------------------------------------------------------------------ */

export const STOCK_ASSETS = STOCK_PHOTOS.map((s) => ({
  id: s.id,
  source: 'stock',
  file: `${s.name}.jpg`,
  kind: 'photo',
  folder: 'stock',
  name: s.name,
  alt: s.alt,
  altEn: s.altEn,
  credit: s.credit,
}));

PRESENTATION_ASSETS.push(...STOCK_ASSETS);

/* ------------------------------------------------------------------ */
/* Resolución de rutas                                                  */
/* ------------------------------------------------------------------ */

/** Extensión de salida según el tipo de recurso. */
export const outputExt = (a) => ((a.media ?? a.file ?? '').endsWith('.svg') ? 'svg' : 'webp');

/** Ruta pública del recurso optimizado (versión completa). */
export const assetPath = (a) => `${ASSET_BASE}/${a.folder}/${a.name}.${outputExt(a)}`;

/** Ruta de la versión reducida (solo fotografías y capturas). */
export const assetPathSmall = (a) =>
  a.kind === 'photo' || a.kind === 'screenshot' ? `${ASSET_BASE}/${a.folder}/${a.name}-960.webp` : null;
