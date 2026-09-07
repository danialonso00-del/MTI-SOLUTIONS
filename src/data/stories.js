/**
 * Los relatos de cada caso de uso.
 *
 * Un caso se cuenta en cuatro tiempos —sucede · llega a la plataforma · se
 * decide · se resuelve— y cada caso tiene VARIAS tandas, que se van turnando
 * para que en una reunión larga no se repita siempre lo mismo.
 *
 * Viven aquí, y no dentro de las escenas 3D, porque los cuenta también el modo
 * mapa (MapLibre). Un solo texto, dos lecturas.
 */

/** Rótulo de cada paso, en orden. */
export const STORY_KIND = ['Sucede', 'Plataforma', 'Decide', 'Resuelve'];
export const STORY_KIND_EN = ['Happens', 'Platform', 'Decides', 'Resolves'];
export const kindsFor = (lang) => (lang === 'en' ? STORY_KIND_EN : STORY_KIND);

/** Ritmo del relato, en segundos desde que arranca la escena. */
export const STORY_AT = [7, 16.5, 26, 35.5];
export const STORY_TTL = 7.5;

export const STORY_SETS = {
  'flood-monitoring': [
    [
      { title: 'El nivel sube 1,8 m', sub: 'Cuarenta minutos · umbral de aviso superado', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cruza nivel, lluvia aguas arriba y la imagen de la cámara', icon: 'signal', tone: 'info' },
      { title: 'Emergencias avisadas', sub: 'Paso inferior cortado y panel al ciudadano', icon: 'check', tone: 'ok' },
      { title: 'Sin nadie atrapado', sub: 'El agua llegó al paso con la vía ya cerrada', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'La cámara se dispara sola', sub: 'El umbral la enciende: dato e imagen a la vez', icon: 'camera', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'La imagen descarta el falso positivo: hay arrastre de troncos', icon: 'signal', tone: 'info' },
      { title: 'Brigada al puente', sub: 'Retirada de la obstrucción antes de la punta', icon: 'check', tone: 'ok' },
      { title: 'Ojo puesto donde importa', sub: 'Sin mandar a nadie a mirar el río de madrugada', icon: 'check', tone: 'ok' },
    ],
    [
      { title: '42 puntos críticos', sub: 'Rieras, pasos inferiores y puentes de la ciudad', icon: 'signal', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Una sola pantalla con nivel, lluvia y cámara de cada punto', icon: 'signal', tone: 'info' },
      { title: 'Umbral por tramo', sub: 'Cada punto tiene el suyo, no un número para toda la ciudad', icon: 'check', tone: 'ok' },
      { title: 'Diez años de autonomía', sub: 'Estaciones en arqueta, sin cablear ni dar corriente', icon: 'bolt', tone: 'ok' },
    ],
  ],
  'slope-monitoring': [
    [
      { title: 'El talud se mueve', sub: '4,2 mm en 12 h · el triple de lo normal', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cruza desplazamiento, lluvia y nivel freático', icon: 'signal', tone: 'info' },
      { title: 'Vía cortada a tiempo', sub: 'Aviso al geotécnico y a explotación', icon: 'check', tone: 'ok' },
      { title: 'Sin descarrilamiento', sub: 'La cuña cayó de madrugada, con la vía vacía', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Anclaje perdiendo carga', sub: 'Célula 12 · −18% en dos semanas', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compara con el resto de anclajes de la fila', icon: 'signal', tone: 'info' },
      { title: 'Retesado programado', sub: 'Antes de que arrastre a los de al lado', icon: 'check', tone: 'ok' },
      { title: 'Refuerzo justificado', sub: 'Con la curva del propio anclaje, no con una estimación', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Episodio de lluvia', sub: '48 mm en 6 h · piezómetros subiendo', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Umbral por velocidad, no solo por valor', icon: 'signal', tone: 'info' },
      { title: 'Drenaje revisado', sub: 'Y limitación de velocidad mientras dura', icon: 'check', tone: 'ok' },
      { title: 'Talud estabilizado', sub: 'Cinco años de batería por nodo, sin cablear nada', icon: 'leaf', tone: 'ok' },
    ],
  ],
  'air-quality': [
    [
      { title: 'NO₂ por encima del umbral', sub: '212 µg/m³ en el corredor · hora punta', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cruza el dato con tráfico, viento y la estación oficial', icon: 'signal', tone: 'info' },
      { title: 'Semáforos y aviso', sub: 'Menos verde al corredor · aviso a las escuelas', icon: 'check', tone: 'ok' },
      { title: 'Episodio contenido', sub: 'Vuelta a umbral en 90 min · queda registrado', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Pico de partículas', sub: 'PM10 x3 · obra en la manzana de al lado', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Descarta el tráfico: el patrón es de polvo, no de humo', icon: 'signal', tone: 'info' },
      { title: 'Riego y malla en obra', sub: 'Requerimiento con el dato en la mano', icon: 'check', tone: 'ok' },
      { title: 'Sin reincidencia', sub: 'La medida se ve en la curva del día siguiente', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Sensor descalibrado', sub: 'Se separa de la estación de referencia', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Calibración continua contra la red oficial', icon: 'signal', tone: 'info' },
      { title: 'Dato corregido', sub: 'Y aviso de mantenimiento del equipo', icon: 'check', tone: 'ok' },
      { title: 'Malla que se sostiene', sub: '128 puntos con dato defendible ante el ciudadano', icon: 'check', tone: 'ok' },
    ],
  ],
  'smart-crane': [
    [
      { title: 'Racha de 78 km/h', sub: 'Anemómetro en punta de pluma · umbral 72', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cruza viento, carga y altura de gancho', icon: 'signal', tone: 'info' },
      { title: 'Parada preventiva', sub: 'Grúa en veleta y aviso al jefe de obra', icon: 'check', tone: 'ok' },
      { title: 'Sin incidente', sub: 'La maniobra se reanuda 40 min después', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Sobrecarga en el gancho', sub: '4,8 t a 42 m · momento fuera de tabla', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compara carga, radio y curva del fabricante', icon: 'signal', tone: 'info' },
      { title: 'Maniobra bloqueada', sub: 'Aviso al gruista con la carga máxima admisible', icon: 'check', tone: 'ok' },
      { title: 'Cada maniobra registrada', sub: 'Trazabilidad completa del turno', icon: 'check', tone: 'ok' },
    ],
    [
      { title: '38 ciclos esta mañana', sub: 'Carga media 2,1 t · 26% de tiempo muerto', icon: 'chart', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Compara con el histórico de la obra', icon: 'signal', tone: 'info' },
      { title: 'Mantenimiento por horas reales', sub: 'Cable y freno, no por calendario', icon: 'check', tone: 'ok' },
      { title: '32% menos tiempos muertos', sub: 'La obra sabe qué grúa va sobrada', icon: 'bolt', tone: 'ok' },
    ],
  ],
  'urban-security': [
    [
      { title: 'Intrusión en perímetro', sub: 'Analítica en el edge · confianza 97%', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cruza la alerta con cámaras vecinas y accesos', icon: 'signal', tone: 'info' },
      { title: 'Protocolo abierto', sub: 'Aviso al operador · patrulla más cercana', icon: 'check', tone: 'ok' },
      { title: 'Evidencia guardada', sub: 'Cadena de custodia · RGPD por diseño', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Aglomeración en la acera', sub: '14 personas en 40 m² · umbral 12', icon: 'people', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compara con el patrón habitual de la zona', icon: 'signal', tone: 'info' },
      { title: 'Aviso a la unidad de barrio', sub: 'Sin llamar a nadie: el sistema lo propone', icon: 'check', tone: 'ok' },
      { title: '92% menos falsas alarmas', sub: 'El operador solo ve lo que importa', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Matrícula identificada', sub: 'LPR 4821-KDR · vehículo en busca', icon: 'car', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Consulta la lista y avisa al centro de mando', icon: 'signal', tone: 'info' },
      { title: 'Seguimiento entre cámaras', sub: 'La ficha pasa sola a la siguiente cámara', icon: 'camera', tone: 'ok' },
      { title: 'Búsqueda forense en 3 min', sub: 'Antes eran horas de grabación', icon: 'check', tone: 'ok' },
    ],
  ],
  'mobility-fleet': [
    [
      { kind: 'A bordo', title: 'Validación de pago', sub: 'Contactless, QR y tarjeta de transporte', icon: 'ticket', tone: 'info' },
      { kind: 'A bordo', title: 'Cámaras interior y exterior', sub: 'Grabación embarcada y ángulo muerto', icon: 'camera', tone: 'info' },
      { kind: 'A bordo', title: 'Conteo de pasajeros', sub: 'Ocupación real por parada y franja', icon: 'people', tone: 'ok' },
      { kind: 'A bordo', title: 'SAE y panel al viajero', sub: 'Posición, próxima parada y tiempo real', icon: 'signal', tone: 'ok' },
    ],
    [
      { title: 'Bus 47 · +4 min', sub: 'Retraso detectado en cabecera', icon: 'car', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cruza posición, ocupación y demanda por franja', icon: 'signal', tone: 'info' },
      { title: 'Refuerzo asignado', sub: 'Unidad extra · V15 cada 6 min', icon: 'check', tone: 'ok' },
      { title: 'Puntualidad 94%', sub: 'Pasaje informado en los paneles de parada', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Aviso del vehículo', sub: 'Telemetría CAN · presión y temperatura', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Compara con el histórico de la flota', icon: 'signal', tone: 'info' },
      { title: 'Entrada a taller programada', sub: 'Sin dejar tirada la línea', icon: 'check', tone: 'ok' },
      { title: '25% menos averías en ruta', sub: 'Mantenimiento predictivo de flota', icon: 'check', tone: 'ok' },
    ],
  ],
  'waste-management': [
    [
      { title: 'Contenedor 214 · 92%', sub: 'Sensor de llenado ToF · fracción orgánica', icon: 'bin', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Lectura recibida · cruzada con la ruta del día', icon: 'signal', tone: 'info' },
      { title: 'Ruta recalculada', sub: 'Camión 3 asignado · 6 paradas descartadas', icon: 'check', tone: 'ok' },
      { title: 'Recogida completada', sub: 'Trazabilidad por fracción · 38% menos km', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Contenedor vacío', sub: 'Al 12% tres días seguidos', icon: 'bin', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Compara llenado real con la ruta programada', icon: 'signal', tone: 'info' },
      { title: 'Parada descartada', sub: 'El camión no pasa a recoger aire', icon: 'check', tone: 'ok' },
      { title: '45% menos recogidas en vacío', sub: 'Menos km, menos emisiones, menos coste', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Depósito identificado', sub: 'Tarjeta ciudadana en contenedor de orgánica', icon: 'people', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Trazabilidad por fracción y por usuario', icon: 'signal', tone: 'info' },
      { title: 'Tasa variable aplicada', sub: 'Paga por generación, con datos que se sostienen', icon: 'check', tone: 'ok' },
      { title: '28% más separación selectiva', sub: 'El vecino ve su propio dato', icon: 'check', tone: 'ok' },
    ],
  ],
  'water-metering': [
    [
      { title: 'Caudal continuo 38 h', sub: 'Contador 4821 · 0,6 l/min sin corte nocturno', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Balance del sector: 12 m³/día sin registrar', icon: 'signal', tone: 'info' },
      { title: 'Fuga confirmada', sub: 'Orden de trabajo a la brigada de guardia', icon: 'check', tone: 'ok' },
      { title: 'Sector estabilizado', sub: '12 m³/día recuperados · aviso al abonado', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Consumo anómalo', sub: 'Vivienda 12-3 · x4 sobre su media', icon: 'gauge', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Contrasta con el histórico y con el sector', icon: 'signal', tone: 'info' },
      { title: 'Aviso al abonado', sub: 'Portal ciudadano · posible fuga interior', icon: 'check', tone: 'ok' },
      { title: 'Consumo normalizado', sub: 'Sin desplazar a nadie a leer el contador', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Lectura completa', sub: '98% de contadores en la ventana nocturna', icon: 'check', tone: 'ok' },
      { title: 'Smart Hypervisor', sub: 'Telelectura NB-IoT · sin visita a domicilio', icon: 'signal', tone: 'info' },
      { title: 'Facturación con datos reales', sub: 'Cero estimaciones este trimestre', icon: 'chart', tone: 'ok' },
      { title: '24% menos pérdidas', sub: 'Agua registrada frente a agua inyectada', icon: 'leaf', tone: 'ok' },
    ],
  ],
  'smart-lighting': [
    [
      { title: 'Luminaria 1182 apagada', sub: 'Sin respuesta en dos ciclos · nodo NB-IoT', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: '18.000 puntos de luz · tercer fallo en el mismo cuadro', icon: 'signal', tone: 'info' },
      { title: 'Orden a mantenimiento', sub: 'Brigada de guardia · sustitución programada', icon: 'check', tone: 'ok' },
      { title: '40% menos avisos en calle', sub: 'La avería se detecta antes de que la vea el vecino', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Calle sin tráfico', sub: 'Las 02:40 · sensores de paso a cero', icon: 'car', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Regula por tráfico real y luz natural', icon: 'signal', tone: 'info' },
      { title: 'Regulación al 40%', sub: 'Sin apagar: la calle sigue siendo segura', icon: 'bolt', tone: 'ok' },
      { title: '62% de ahorro energético', sub: 'Punto a punto, calle a calle', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'La farola, sensor', sub: 'Calidad del aire y ruido en el mismo báculo', icon: 'signal', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'La red de alumbrado sirve a otros verticales', icon: 'signal', tone: 'info' },
      { title: 'Cámara y wifi sobre la misma red', sub: 'Se aprovecha la infraestructura que ya está', icon: 'camera', tone: 'ok' },
      { title: 'Una red, muchos servicios', sub: 'NB-IoT / LoRaWAN reutilizable', icon: 'check', tone: 'ok' },
    ],
  ],
  'building-management': [
    [
      { title: 'Planta 7 · 26,4 °C', sub: 'Clima al 100% con las salas vacías', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cruza BMS, ocupación real y contadores de planta', icon: 'signal', tone: 'info' },
      { title: 'Clima ajustado por planta', sub: 'Consigna 23 °C · aviso al mantenedor del fancoil', icon: 'check', tone: 'ok' },
      { title: '28% menos consumo', sub: 'Confort estable y reparto por inquilino', icon: 'bolt', tone: 'ok' },
    ],
    [
      { title: 'Sala vacía y reservada', sub: 'Cuarta vez esta semana', icon: 'people', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Ocupación real por espacio, no por agenda', icon: 'signal', tone: 'info' },
      { title: 'Reserva liberada', sub: 'La sala vuelve a estar disponible sola', icon: 'check', tone: 'ok' },
      { title: 'Metro cuadrado aprovechado', sub: 'Se sabe qué espacio sobra y cuál falta', icon: 'chart', tone: 'ok' },
    ],
    [
      { title: 'Bomba fuera de curva', sub: 'Vibración y consumo por encima del patrón', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Compara con el histórico del propio equipo', icon: 'signal', tone: 'info' },
      { title: 'Correctivo evitado', sub: 'Intervención programada fuera de horario', icon: 'check', tone: 'ok' },
      { title: '35% menos avisos correctivos', sub: 'El edificio avisa antes de romperse', icon: 'check', tone: 'ok' },
    ],
  ],
  'stadium': [
    [
      { title: 'Acceso norte saturado', sub: '1.240 personas/min · 4 tornos abiertos', icon: 'ticket', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Cruza aforo, tornos y CCTV del recinto', icon: 'signal', tone: 'info' },
      { title: 'Abrir tornos 12–16', sub: 'Refuerzo enviado · megafonía en acceso este', icon: 'check', tone: 'ok' },
      { title: 'Flujo normalizado', sub: 'Espera media 6 min · aforo bajo control', icon: 'people', tone: 'ok' },
    ],
    [
      { title: 'Pico de consumo', sub: 'Climatización de grada sur al 100%', icon: 'bolt', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Consumo por zona cruzado con ocupación real', icon: 'signal', tone: 'info' },
      { title: 'Clima por sectores', sub: 'Se apaga lo que está vacío antes del partido', icon: 'check', tone: 'ok' },
      { title: '21% menos energía', sub: 'Mismo confort con la grada llena', icon: 'leaf', tone: 'ok' },
    ],
    [
      { title: 'Objeto abandonado', sub: 'Vomitorio 4 · detectado por analítica de vídeo', icon: 'alert', tone: 'alert' },
      { title: 'Smart Hypervisor', sub: 'Cámara, acceso y megafonía en el mismo protocolo', icon: 'signal', tone: 'info' },
      { title: 'Equipo enviado', sub: 'Zona acotada sin parar el evento', icon: 'check', tone: 'ok' },
      { title: 'Incidencia cerrada', sub: 'Evidencia guardada · 4 min de principio a fin', icon: 'check', tone: 'ok' },
    ],
  ],
};

/** Relatos por industria, para los casos sin escena propia. */
export const STORY_BY_INDUSTRY = {
  'smart-cities': [
    [
      { title: 'Incidencia en la vía', sub: 'Aviso ciudadano y sensor de calle, a la vez', icon: 'alert', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Federa 23 sistemas y correlaciona el evento', icon: 'signal', tone: 'info' },
      { title: 'Protocolo propuesto', sub: 'Agentic AI · brigada de guardia asignada', icon: 'check', tone: 'ok' },
      { title: 'Incidencia cerrada', sub: '47% menos tiempo de respuesta', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Tres avisos, un mismo hecho', sub: 'Cámara, 112 y sensor apuntan al mismo cruce', icon: 'camera', tone: 'warn' },
      { title: 'Smart Hypervisor', sub: 'Los agrupa en un único incidente', icon: 'signal', tone: 'info' },
      { title: 'Un solo operador', sub: 'Con el protocolo guiado paso a paso', icon: 'check', tone: 'ok' },
      { title: 'Sin duplicar recursos', sub: 'No salen tres patrullas al mismo sitio', icon: 'check', tone: 'ok' },
    ],
    [
      { title: 'Panel único de ciudad', sub: 'Tráfico, agua, residuos, alumbrado y seguridad', icon: 'chart', tone: 'info' },
      { title: 'Smart Hypervisor', sub: 'Cada vertical sigue con su sistema; aquí se ven juntos', icon: 'signal', tone: 'info' },
      { title: 'Decisión con contexto', sub: 'Lo que pasa y lo que va a pasar', icon: 'check', tone: 'ok' },
      { title: '99,9% de disponibilidad', sub: 'La sala de control no se para', icon: 'check', tone: 'ok' },
    ],
  ],
};

import { STORIES_EN } from './en.js';

/**
 * El relato de un caso: el suyo, o el de su industria. Con `lang = 'en'` se
 * sirve la versión inglesa si existe; si no, se cae al castellano, que siempre
 * es mejor que una pantalla vacía.
 */
export const storyFor = (id, industry, lang = 'es') => {
  if (lang === 'en') {
    const en = STORIES_EN[id] ?? STORIES_EN[industry];
    if (en) return en;
  }
  return STORY_SETS[id] ?? STORY_BY_INDUSTRY[industry] ?? STORY_BY_INDUSTRY['smart-cities'];
};
