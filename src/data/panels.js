/**
 * Los cuadros de mando de cada caso de uso.
 *
 * Igual que los relatos, viven fuera de las escenas porque los pintan DOS
 * sitios: el panel flotante de la ciudad 3D (dibujado en un lienzo dentro de
 * la escena) y el panel HTML del modo mapa. Un solo dato, dos lecturas.
 *
 *   title/subtitle · qué se está viendo
 *   photo          · foto real del activo (public/photos)
 *   metrics        · tres cifras, con su icono; `live` las hace latir
 *   chart          · line · bars · gauge
 *   rows           · las dos líneas de registro de abajo
 */

export const PANELS = {
  'flood-monitoring': {
    title: 'Vigilancia de nivel',
    subtitle: 'Estación autónoma · nivel, lluvia y cámara',
    photo: 'flood',
    metrics: [
      { label: 'Nivel', value: 2.8, suffix: ' m', live: true, jitter: 0.2, icon: 'gauge' },
      { label: 'Lluvia', value: 34, suffix: ' mm/h', live: true, jitter: 3, icon: 'chart' },
      { label: 'Puntos', value: 42, icon: 'signal' },
    ],
    chart: 'line',
    rows: [
      { text: 'Umbral de aviso superado · cámara activada', tone: 'alert' },
      { text: 'Emergencias avisadas y paso inferior cortado' },
    ],
  },
  'slope-monitoring': {
    title: 'Talud instrumentado',
    subtitle: 'Inclinómetros, anclajes y piezómetros',
    photo: 'slope',
    metrics: [
      { label: 'Desplazamiento', value: 4.2, suffix: ' mm', live: true, jitter: 0.3, icon: 'gauge' },
      { label: 'Lluvia 6 h', value: 48, suffix: ' mm', live: true, jitter: 2, icon: 'chart' },
      { label: 'Nodos', value: 46, icon: 'signal' },
    ],
    chart: 'line',
    rows: [
      { text: 'Velocidad de desplazamiento por encima del umbral', tone: 'alert' },
      { text: 'Piezómetros subiendo tras el episodio de lluvia' },
    ],
  },
  'air-quality': {
    title: 'Calidad del aire en la calle',
    subtitle: 'Corredor urbano · 128 puntos de medida',
    photo: 'air',
    metrics: [
      { label: 'NO₂', value: 212, suffix: ' µg/m³', live: true, jitter: 9, icon: 'gauge' },
      { label: 'PM2,5', value: 34, suffix: ' µg/m³', live: true, jitter: 3, icon: 'leaf' },
      { label: 'Sensores', value: 128, icon: 'signal' },
    ],
    chart: 'line',
    rows: [
      { text: 'NO₂ por encima del umbral en hora punta', tone: 'alert' },
      { text: 'Calibrado contra la estación oficial de referencia' },
    ],
  },
  'command-control': {
    title: 'Sala de control',
    subtitle: 'Smart Hypervisor · 23 sistemas federados',
    photo: 'control-room',
    metrics: [
      { label: 'Incidencias abiertas', value: 7, live: true, jitter: 2, icon: 'alert' },
      { label: 'Respuesta', value: 47, suffix: '%', icon: 'clock' },
      { label: 'Disponibilidad', value: 99.9, suffix: '%', icon: 'signal' },
    ],
    chart: 'line',
    rows: [
      { text: 'Tres avisos agrupados en un mismo incidente' },
      { text: 'Protocolo propuesto por Agentic AI · brigada asignada' },
    ],
  },
  'urban-security': {
    title: 'Analítica de vídeo en el edge',
    subtitle: 'Cámara 042 · corredor urbano',
    photo: 'cctv',
    metrics: [
      { label: 'Personas', value: 14, live: true, jitter: 3, icon: 'people' },
      { label: 'Vehículos', value: 37, live: true, jitter: 4, icon: 'car' },
      { label: 'Alertas', value: 2, icon: 'alert' },
  ],
    chart: 'bars',
    rows: [
      { text: 'Vehículo identificado · LPR 4821-KDR' },
      { text: 'Intrusión en perímetro · aviso al operador', tone: 'alert' },
    ],
  },
  'mobility-fleet': {
    title: 'Smart Bus · tecnología a bordo',
    subtitle: 'TMB · autobús en servicio',
    photo: 'bus',
    metrics: [
      { label: 'Ocupación', value: 62, suffix: '%', live: true, jitter: 4, icon: 'people' },
      { label: 'Validaciones', value: 128, live: true, jitter: 5, icon: 'ticket' },
      { label: 'Próxima parada', value: 240, suffix: ' m', live: true, jitter: 30, icon: 'bus' },
  ],
    chart: 'line',
    rows: [
      { text: 'Validador contactless y QR operativos' },
      { text: 'Cámaras a bordo y conteo de pasajeros activos' },
    ],
  },
  'waste-management': {
    title: 'Recogida optimizada',
    subtitle: 'Sensores de llenado · ruta del día',
    photo: 'containers',
    metrics: [
      { label: 'Contenedores', value: 144, icon: 'leaf' },
      { label: 'Llenos', value: 34, suffix: '%', live: true, jitter: 3, icon: 'gauge' },
      { label: 'Km evitados', value: 38, suffix: '%', icon: 'route' },
  ],
    chart: 'gauge',
    rows: [
      { text: 'Contenedor 214 al 92% · prioridad alta', tone: 'alert' },
      { text: 'Ruta recalculada: 6 contenedores descartados' },
    ],
  },
  'water-metering': {
    title: 'Telelectura de agua',
    subtitle: 'Contadores inteligentes · balance de sector',
    photo: 'water',
    metrics: [
      { label: 'Contadores', value: 552, icon: 'gauge' },
      { label: 'Lecturas válidas', value: 98, suffix: '%', live: true, jitter: 1, icon: 'chart' },
      { label: 'Pérdidas', value: 24, suffix: '%', icon: 'leaf' },
  ],
    chart: 'line',
    rows: [
      { text: 'Contador 4821: caudal continuo 38 h', tone: 'alert' },
      { text: 'Balance del sector cuadrado al 88%' },
    ],
  },
  'smart-lighting': {
    title: 'Alumbrado telegestionado',
    subtitle: 'Regulación adaptativa · punto a punto',
    photo: 'streetlight',
    metrics: [
      { label: 'Puntos de luz', value: 18, suffix: 'k', icon: 'bolt' },
      { label: 'Ahorro', value: 62, suffix: '%', live: true, jitter: 2, icon: 'chart' },
      { label: 'Averías abiertas', value: 3, icon: 'alert' },
  ],
    chart: 'line',
    rows: [
      { text: 'Luminaria 1182 sin respuesta', tone: 'alert' },
      { text: 'Regulación al 40% en tramo sin tráfico' },
    ],
  },
  'building-management': {
    title: 'Gestión del edificio',
    subtitle: 'BMS federado · consumo y ocupación reales',
    photo: 'building',
    metrics: [
      { label: 'Ocupación', value: 54, suffix: '%', live: true, jitter: 3, icon: 'people' },
      { label: 'Consumo', value: 148, suffix: ' kW', live: true, jitter: 6, icon: 'bolt' },
      { label: 'Confort', value: 92, suffix: '%', icon: 'gauge' },
  ],
    chart: 'bars',
    rows: [
      { text: 'Planta 7: clima al 100% sin ocupación', tone: 'alert' },
      { text: 'Fancoil 7-B fuera de curva · aviso emitido' },
    ],
  },
  'smart-crane': {
    title: 'Grúa 3 · torre 42 m',
    subtitle: 'Sensórica embarcada · grúa torre en obra',
    photo: 'crane',
    metrics: [
      { label: 'Viento', value: 62, suffix: ' km/h', live: true, jitter: 6, icon: 'gauge' },
      { label: 'Carga', value: 2.1, suffix: ' t', live: true, jitter: 0.4, icon: 'chart' },
      { label: 'Ciclos hoy', value: 38, live: true, jitter: 1, icon: 'route' },
  ],
    chart: 'line',
    rows: [
      { text: 'Racha de 78 km/h · umbral 72', tone: 'alert' },
      { text: 'Puesta en veleta automática · maniobra detenida' },
    ],
  },
  'stadium': {
    title: 'Operación del evento',
    subtitle: 'Camp Nou · operación de partido',
    photo: 'stadium',
    metrics: [
      { label: 'Aforo', value: 78, suffix: '%', live: true, jitter: 2, icon: 'people' },
      { label: 'Accesos/min', value: 1240, live: true, jitter: 60, icon: 'ticket' },
      { label: 'Espera', value: 11, suffix: ' min', live: true, jitter: 1, icon: 'clock' },
  ],
    chart: 'bars',
    rows: [
      { text: 'Acceso norte por encima del umbral', tone: 'alert' },
      { text: 'Tornos 12–16 abiertos · refuerzo en camino' },
    ],
  },
};

import { PANELS_EN } from './en.js';

/** Panel de un caso; si no tiene el suyo, se arma con los KPI del catálogo. */
export function panelFor(solution, lang = 'es') {
  if (!solution) return null;
  const propio = PANELS[solution.id];
  if (propio) {
    const en = lang === 'en' ? PANELS_EN[solution.id] : null;
    if (!en) return propio;
    // en inglés solo cambian los textos: cifras, iconos y gráfica se quedan
    return {
      ...propio,
      title: en.title ?? propio.title,
      subtitle: en.subtitle ?? propio.subtitle,
      metrics: propio.metrics.map((m, i) => ({ ...m, label: en.metrics?.[i] ?? m.label })),
      rows: propio.rows.map((r, i) => ({ ...r, text: en.rows?.[i] ?? r.text })),
    };
  }
  return {
    title: 'Operación en tiempo real',
    subtitle: solution.place ?? solution.title,
    photo: 'control-room',
    metrics: (solution.kpis ?? []).slice(0, 3).map((k) => ({
      label: k.label,
      value: k.value,
      suffix: k.suffix,
      live: true,
      jitter: 1,
      icon: 'chart',
    })),
    chart: 'line',
    rows: [
      { text: `${solution.stack?.[0] ?? 'Plataforma'} conectado · integración activa` },
      { text: 'Sin incidencias en las últimas 24 h' },
    ],
  };
}
