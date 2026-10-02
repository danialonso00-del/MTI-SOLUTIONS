/**
 * «Reel» de cada proyecto: la misma estructura para todos, en cuatro tiempos
 * que avanzan solos sobre un monitor con una foto real.
 *
 *   instalamos → captamos → integramos → resultado
 *
 * Los textos salen solo de la ficha del proyecto (deck.js · PROJECTS). Lo que
 * se ve en el monitor (recuadros de detección, lecturas, rutas) es una vista
 * ilustrativa y se rotula así en pantalla: no son datos del cliente.
 *
 * `bg`      fotografía del lugar real, a sangre, detrás de todo
 * `feed`    fotografía del «monitor»
 * `monitor` qué se dibuja encima: 'cctv' (recuadros de detección),
 *           'telemetry' (lecturas), 'command' (capas de sistemas),
 *           'route' (ruta GPS), 'sensors' (sensores ambientales)
 */
export const PROJECT_REELS = {
  aena: {
    bg: 'stock-aena-bg',
    feed: 'stock-aena-feed',
    monitor: 'cctv',
    cam: 'CAM 0412 · T1',
    tags: ['Zona de salidas', 'Flujo de pasajeros', 'Acceso controlado'],
    steps: [
      { icon: 'camera', label: 'Instalamos', text: '1.900 cámaras CCTV Bosch en la nueva terminal.' },
      { icon: 'signal', label: 'Captamos', text: 'Cada rincón de la T1, cubierto en vídeo.' },
      { icon: 'integration', label: 'Integramos', text: 'Sistema de información SIPA y monitorización de la torre de control.' },
      { icon: 'check', label: 'Resultado', text: 'Terminal cubierta de extremo a extremo. Torre operativa 24/7.' },
    ],
  },
  metro: {
    bg: 'stock-metro-bg',
    feed: 'stock-metro-feed',
    monitor: 'cctv',
    cam: 'CAM L9 · ANDÉN',
    tags: ['Andén', 'Interior de tren', 'Grabación'],
    steps: [
      { icon: 'camera', label: 'Instalamos', text: 'Miles de cámaras IP en la red, desde 2005.' },
      { icon: 'play', label: 'Captamos', text: 'Visualización y grabación en la L9, la línea automática.' },
      { icon: 'integration', label: 'Integramos', text: 'Software VMS a medida e integración de red completa.' },
      { icon: 'check', label: 'Resultado', text: 'Servicio ininterrumpido con SLA crítico 24/7.' },
    ],
  },
  buses: {
    bg: 'stock-buses-bg',
    feed: 'stock-buses-feed',
    monitor: 'cctv',
    cam: 'BUS · CÁMARA DE CABINA',
    tags: ['Cabina', 'Privacidad RGPD', 'Pasillo'],
    steps: [
      { icon: 'camera', label: 'Instalamos', text: 'Cámaras domo EN 50155, PIS y ticketing en 5.000 autobuses.' },
      { icon: 'lock', label: 'Captamos', text: 'Cobertura completa de cabina con enmascarado de privacidad RGPD.' },
      { icon: 'building', label: 'Integramos', text: 'Llave en mano en las cocheras de Zona Franca, Triangle, Horta y Ponent.' },
      { icon: 'check', label: 'Resultado', text: 'Una flota integrada, sin parar el servicio.' },
    ],
  },
  hospitalet: {
    bg: 'stock-hospitalet-bg',
    feed: 'stock-control-room',
    monitor: 'telemetry',
    cam: 'TELEMEDIDA · EDIFICIOS MUNICIPALES',
    tags: ['Electricidad', 'Agua', 'Climatización', 'Gas'],
    steps: [
      { icon: 'sensor', label: 'Instalamos', text: '157 cajas de telemedida en edificios municipales.' },
      { icon: 'database', label: 'Captamos', text: 'Datos en tiempo real de más de 30 fuentes distintas.' },
      { mti: 'platform-thethings', label: 'Integramos', text: 'Todo centralizado en thethings.io.' },
      { icon: 'check', label: 'Resultado', text: 'Plataforma en producción al servicio de la sostenibilidad municipal.' },
    ],
  },
  navantia: {
    bg: 'stock-navantia-bg',
    feed: 'stock-navantia-feed',
    monitor: 'telemetry',
    cam: 'ASTILLERO · ADQUISICIÓN',
    tags: ['PLC · corte', 'PLC · soldadura', 'SCADA · grúa', 'IoT · nave'],
    steps: [
      { icon: 'factory', label: 'Instalamos', text: 'Más de 80 máquinas industriales conectadas.' },
      { icon: 'network', label: 'Captamos', text: 'SCADA, PLC y sensores IoT en tiempo real.' },
      { mti: 'platform-twin', label: 'Integramos', text: 'Un único Digital Twin operativo sobre thethings.io.' },
      { icon: 'check', label: 'Resultado', text: 'Una fábrica digital medible, certificada por Dell NativeEdge.' },
    ],
  },
  kafd: {
    bg: 'stock-kafd-bg',
    feed: 'stock-kafd-feed',
    monitor: 'command',
    cam: 'KAFD · CAPA DE MANDO',
    tags: ['BMS', 'Seguridad', 'ITS', 'GIS', 'Apps ciudadanas'],
    steps: [
      { icon: 'building', label: 'Instalamos', text: 'Un backbone digital para 160 hectáreas.' },
      { icon: 'layers', label: 'Captamos', text: 'BMS, seguridad, ITS, GIS y aplicaciones ciudadanas.' },
      { mti: 'platform-hypervisor', label: 'Integramos', text: 'Todo bajo una sola capa de mando: MTi Hypervisor.' },
      { icon: 'check', label: 'Resultado', text: 'Un distrito operado desde un mando común.' },
    ],
  },
  'qatar-waste': {
    bg: 'stock-qatar-bg',
    feed: 'stock-qatar-feed',
    monitor: 'route',
    cam: 'RUTA DE RECOGIDA · GPS',
    tags: ['Contenedor RFID', 'Ruta GPS', 'Distrito'],
    steps: [
      { icon: 'box', label: 'Instalamos', text: 'Contenedores identificados con RFID.' },
      { icon: 'route', label: 'Captamos', text: 'Control de rutas de recogida por GPS.' },
      { icon: 'integration', label: 'Integramos', text: 'Integración con los sistemas municipales.' },
      { icon: 'check', label: 'Resultado', text: 'Despliegue modular sobre los distritos clave.' },
    ],
  },
  nsu: {
    feed: 'project-nsu',
    monitor: 'sensors',
    cam: 'LIVING LAB · CAMPUS',
    tags: ['Sensórica ambiental', 'Movilidad', 'Analítica'],
    steps: [
      { icon: 'sensor', label: 'Instalamos', text: 'Sensórica ambiental en el campus.' },
      { icon: 'route', label: 'Captamos', text: 'Flujos de movilidad y analítica comunitaria.' },
      { mti: 'platform-thethings', label: 'Integramos', text: 'Todo sobre thethings.io.' },
      { icon: 'check', label: 'Resultado', text: 'Un laboratorio vivo para investigar las ciudades del futuro.' },
    ],
  },
  'malaysia-aqi': {
    bg: 'stock-malaysia-bg',
    feed: 'stock-malaysia-feed',
    monitor: 'sensors',
    cam: 'CALIDAD DEL AIRE · RED DE SENSORES',
    tags: ['CO', 'NO₂', 'PM2.5', 'PM10'],
    steps: [
      { icon: 'sensor', label: 'Instalamos', text: 'Una red de sensores de CO, NO₂, PM2.5 y PM10.' },
      { icon: 'signal', label: 'Captamos', text: 'Calidad del aire en vivo.' },
      { mti: 'platform-thethings', label: 'Integramos', text: 'Datos y alertas sobre thethings.io.' },
      { icon: 'check', label: 'Resultado', text: 'Las autoridades deciden con datos en vivo.' },
    ],
  },
};

export const PROJECT_REELS_UI = {
  kicker: 'Qué hicimos',
  illustrative: 'Vista ilustrativa',
  live: 'EN VIVO',
};

export const PROJECT_REELS_EN = {
  aena: {
    tags: ['Departures', 'Passenger flow', 'Controlled access'],
    steps: [
      { label: 'We install', text: '1,900 Bosch CCTV cameras in the new terminal.' },
      { label: 'We capture', text: 'Every corner of T1, covered on video.' },
      { label: 'We integrate', text: 'SIPA information system and control tower monitoring.' },
      { label: 'Result', text: 'Terminal covered end to end. Tower operating 24/7.' },
    ],
  },
  metro: {
    cam: 'CAM L9 · PLATFORM',
    tags: ['Platform', 'Train interior', 'Recording'],
    steps: [
      { label: 'We install', text: 'Thousands of IP cameras across the network, since 2005.' },
      { label: 'We capture', text: 'Viewing and recording on L9, the automatic line.' },
      { label: 'We integrate', text: 'Custom VMS software and full network integration.' },
      { label: 'Result', text: 'Uninterrupted service under a critical 24/7 SLA.' },
    ],
  },
  buses: {
    cam: 'BUS · CABIN CAMERA',
    tags: ['Cabin', 'GDPR privacy', 'Aisle'],
    steps: [
      { label: 'We install', text: 'EN 50155 dome cameras, PIS and ticketing on 5,000 buses.' },
      { label: 'We capture', text: 'Full cabin coverage with GDPR privacy masking.' },
      { label: 'We integrate', text: 'Turnkey at the Zona Franca, Triangle, Horta and Ponent depots.' },
      { label: 'Result', text: 'An integrated fleet, without stopping service.' },
    ],
  },
  hospitalet: {
    cam: 'METERING · MUNICIPAL BUILDINGS',
    tags: ['Electricity', 'Water', 'HVAC', 'Gas'],
    steps: [
      { label: 'We install', text: '157 metering boxes in municipal buildings.' },
      { label: 'We capture', text: 'Real-time data from more than 30 different sources.' },
      { label: 'We integrate', text: 'Everything centralised on thethings.io.' },
      { label: 'Result', text: 'A live platform serving the city’s sustainability goals.' },
    ],
  },
  navantia: {
    cam: 'SHIPYARD · ACQUISITION',
    tags: ['PLC · cutting', 'PLC · welding', 'SCADA · crane', 'IoT · hall'],
    steps: [
      { label: 'We install', text: 'More than 80 industrial machines connected.' },
      { label: 'We capture', text: 'SCADA, PLC and IoT sensors in real time.' },
      { label: 'We integrate', text: 'A single operational Digital Twin on thethings.io.' },
      { label: 'Result', text: 'A measurable digital factory, Dell NativeEdge certified.' },
    ],
  },
  kafd: {
    cam: 'KAFD · COMMAND LAYER',
    tags: ['BMS', 'Security', 'ITS', 'GIS', 'Citizen apps'],
    steps: [
      { label: 'We install', text: 'A digital backbone for 160 hectares.' },
      { label: 'We capture', text: 'BMS, security, ITS, GIS and citizen applications.' },
      { label: 'We integrate', text: 'All under one command layer: MTi Hypervisor.' },
      { label: 'Result', text: 'A district run from a common command layer.' },
    ],
  },
  'qatar-waste': {
    cam: 'COLLECTION ROUTE · GPS',
    tags: ['RFID bin', 'GPS route', 'District'],
    steps: [
      { label: 'We install', text: 'Bins identified with RFID.' },
      { label: 'We capture', text: 'GPS control of collection routes.' },
      { label: 'We integrate', text: 'Integration with municipal systems.' },
      { label: 'Result', text: 'Modular rollout across the key districts.' },
    ],
  },
  nsu: {
    tags: ['Environmental sensing', 'Mobility', 'Analytics'],
    steps: [
      { label: 'We install', text: 'Environmental sensing across the campus.' },
      { label: 'We capture', text: 'Mobility flows and community analytics.' },
      { label: 'We integrate', text: 'Everything on thethings.io.' },
      { label: 'Result', text: 'A living lab to research the cities of the future.' },
    ],
  },
  'malaysia-aqi': {
    cam: 'AIR QUALITY · SENSOR NETWORK',
    steps: [
      { label: 'We install', text: 'A network of CO, NO₂, PM2.5 and PM10 sensors.' },
      { label: 'We capture', text: 'Live air quality.' },
      { label: 'We integrate', text: 'Data and alerts on thethings.io.' },
      { label: 'Result', text: 'Authorities decide with live data.' },
    ],
  },
};

export const PROJECT_REELS_UI_EN = {
  kicker: 'What we did',
  illustrative: 'Illustrative view',
  live: 'LIVE',
};
