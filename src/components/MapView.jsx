import React, { useEffect, useRef, useState } from 'react';
// v6 de MapLibre publica solo exportaciones con nombre: nada de default
import { Map as MapLibreMap, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useStore } from '../store.js';
import { useT, useSolutions, useIndustries } from '../i18n.js';
import MapStory from './MapStory.jsx';
import MapPanel from './MapPanel.jsx';
import { createLiveLayers, createAire, makeToLngLat, rutaCerca } from './MapLive.js';
import { createModelLayer } from './MapModels.js';
import { createBicing, createLluvia } from './MapFeeds.js';

/**
 * La misma ciudad sobre un mapa vectorial (MapLibre GL).
 *
 * Diferencias con la ciudad 3D: aquí el suelo se descarga en directo (estilos
 * de CARTO sobre datos de OpenStreetMap, gratis y sin clave) y los edificios se
 * levantan con `fill-extrusion`. Encima se pintan las **capas vivas** —flota y
 * contenedores, sobre el mismo viario real— y el **relato del caso**, con las
 * mismas tarjetas de cuatro tiempos.
 *
 * Se monta con la aplicación, no al pulsar el botón: así el mapa ya está
 * cargado —estilo, teselas y capas— cuando toca enseñarlo. Y se acota a la
 * zona de Barcelona, que es la única que se usa.
 */

/* MapLibre carga su worker con una URL relativa a su propio bundle. Vite no
   emite ese archivo, así que se sirve desde `public/maplibre/` (worker + su
   módulo compartido) y se le dice a la librería dónde está. Sin esto el mapa
   se queda cargando para siempre y sin dar error. */
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const ESTILOS = {
  oscuro: {
    id: 'oscuro',
    label: 'Oscuro',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    edificio: '#243050',
  },
  claro: {
    id: 'claro',
    label: 'Claro',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    edificio: '#c9ced8',
  },
  calle: {
    id: 'calle',
    label: 'Callejero',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    edificio: '#d8d2c6',
  },
};

/* Modelos 3D que se plantan en el mapa. Son los mismos GLB de la ciudad, así
   que el autobús del mapa es el autobús de la ciudad. Al pulsarlos se abre su
   caso de uso y arranca su relato. */
const MODELOS = [
  {
    id: 'mobility-fleet',
    url: '/models/bus.glb',
    altura: 3.4,
    latlon: [41.39384, 2.18304], // Estació del Nord
    rotacion: Math.PI * 0.15,
    etiqueta: 'Smart Bus',
  },
  {
    id: 'waste-management',
    url: '/models/truck-waste.glb',
    altura: 3.6,
    latlon: [41.39545, 2.18247], // Mercat del Fort Pienc
    velocidad: 7, // recorre su calle de ida y vuelta
    etiqueta: 'Camión de recogida',
  },
  {
    id: 'smart-crane',
    url: '/models/crane-tower.glb',
    altura: 62,
    latlon: [41.41355, 2.18765], // obras de La Sagrera
    girar: 0.12, // la pluma busca su carga
    etiqueta: 'Grúa inteligente',
  },
];

/** Levanta los edificios del mapa vectorial en 3D. */
function añadirVolumen(map, estilo) {
  if (map.getLayer('mti-3d')) map.removeLayer('mti-3d');
  const fuente = map.getStyle().sources.carto ? 'carto' : Object.keys(map.getStyle().sources)[0];
  try {
    map.addLayer({
      id: 'mti-3d',
      type: 'fill-extrusion',
      source: fuente,
      'source-layer': 'building',
      minzoom: 13,
      paint: {
        'fill-extrusion-color': estilo.edificio,
        // el dato de altura viene en la tesela; si falta, una planta tipo
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 12],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.94,
      },
    });
  } catch (err) {
    console.warn('MapLibre: sin capa de edificios en este estilo', err?.message);
  }
}

export default function MapView({ cityData }) {
  const t = useT();
  const abierto = useStore((s) => s.mapMode);
  const solutions = useSolutions();
  const industries = useIndustries();
  const select = useStore((s) => s.select);
  const activeId = useStore((s) => s.activeId);

  const solucion = solutions.find((s) => s.id === activeId && Array.isArray(s.latlon)) ?? null;

  const contenedor = useRef(null);
  const mapa = useRef(null);
  const vivas = useRef(null);
  const modelos = useRef(null);
  const feeds = useRef({});
  const [capas, setCapas] = useState({ flota: true, aire: false, bicing: false, lluvia: false });
  const marcas = useRef([]);
  const [estilo, setEstilo] = useState('oscuro');
  const [listo, setListo] = useState(false);
  const [error, setError] = useState(null);

  /* --- el mapa se crea una vez, con la aplicación ----------------------- */
  useEffect(() => {
    if (!contenedor.current || mapa.current || !cityData) return undefined;
    const cfg = ESTILOS.oscuro;
    const [lat0, lon0] = cityData.center;
    const toLngLat = makeToLngLat(cityData.center);
    const { minX, maxX, minZ, maxZ } = cityData.extent;
    const [oeste, sur] = toLngLat(minX, maxZ);
    const [este, norte] = toLngLat(maxX, minZ);

    const map = new MapLibreMap({
      container: contenedor.current,
      style: cfg.url,
      center: [lon0, lat0],
      zoom: 15.2,
      pitch: 60,
      bearing: -22,
      antialias: true,
      preserveDrawingBuffer: true,
      // solo Barcelona: acotar la zona evita descargar teselas de medio mundo
      maxBounds: [
        [oeste - 0.01, sur - 0.01],
        [este + 0.01, norte + 0.01],
      ],
      minZoom: 13,
      maxZoom: 18.5,
      attributionControl: { compact: false },
    });
    mapa.current = map;

    const observador = new ResizeObserver(() => map.resize());
    observador.observe(contenedor.current);
    map.addControl(new NavigationControl({ visualizePitch: true }), 'bottom-left');

    map.once('styledata', () => {
      añadirVolumen(map, cfg);
      vivas.current = createLiveLayers({ map, cityData });
      modelos.current = createModelLayer({
        map,
        center: cityData.center,
        // al camión se le da una calle de verdad para que la recorra
        modelos: MODELOS.map((m) =>
          m.velocidad ? { ...m, ruta: rutaCerca(cityData, m.latlon) } : m
        ),
        onPick: (id) => id && select(id),
      });
      feeds.current = {
        aire: createAire({ map, cityData }),
        bicing: createBicing({ map }),
        lluvia: createLluvia({ map }),
      };
      Object.values(feeds.current).forEach((f) => f.setVisible(false));
      setListo(true);
      requestAnimationFrame(() => map.resize());
    });
    map.on('error', (e) => {
      const msg = e?.error?.message ?? String(e?.error ?? 'error');
      console.warn('MapLibre:', msg);
      if (/fetch|network|Failed|abort/i.test(msg) || e?.error?.status === 0) {
        setError('No se han podido descargar las teselas: este modo necesita conexión.');
      }
    });

    return () => {
      observador.disconnect();
      vivas.current?.dispose();
      modelos.current?.dispose();
      Object.values(feeds.current).forEach((f) => f?.dispose?.());
      vivas.current = null;
      modelos.current = null;
      feeds.current = {};
      map.remove();
      mapa.current = null;
    };
  }, [cityData]);

  /* --- la flota se mueve solo con el mapa a la vista --------------------
     Con temporizador y no con requestAnimationFrame: el bucle de la ciudad 3D
     también pide fotogramas y, en equipos justos, la flota se quedaba parada. */
  useEffect(() => {
    if (!listo || !abierto) return undefined;
    const id = setInterval(() => vivas.current?.update(), 80); // 12 Hz
    return () => clearInterval(id);
  }, [listo, abierto]);

  /* --- capas que se encienden y se apagan ------------------------------- */
  useEffect(() => {
    if (!listo) return;
    const map = mapa.current;
    if (map?.getLayer('mti-flota')) {
      map.setLayoutProperty('mti-flota', 'visibility', capas.flota ? 'visible' : 'none');
      map.setLayoutProperty('mti-contenedores', 'visibility', capas.flota ? 'visible' : 'none');
    }
    feeds.current.aire?.setVisible(capas.aire);
    feeds.current.bicing?.setVisible(capas.bicing);
    feeds.current.lluvia?.setVisible(capas.lluvia);
  }, [capas, listo]);

  /* --- cambio de estilo sin recrear el mapa ----------------------------- */
  const primerEstilo = useRef(true);
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo) return;
    if (primerEstilo.current) {
      primerEstilo.current = false;
      return;
    }
    const cfg = ESTILOS[estilo];
    map.setStyle(cfg.url);
    map.once('styledata', () => {
      // al cambiar de estilo, MapLibre se lleva por delante fuentes y capas
      añadirVolumen(map, cfg);
      vivas.current?.reañadir();
      Object.values(feeds.current).forEach((f) => f?.reañadir?.());
      feeds.current.aire?.setVisible(capas.aire);
      feeds.current.bicing?.setVisible(capas.bicing);
      feeds.current.lluvia?.setVisible(capas.lluvia);
    });
  }, [estilo, listo]);

  /* --- los casos de uso, sobre el mapa ---------------------------------- */
  useEffect(() => {
    const map = mapa.current;
    if (!map) return undefined;
    marcas.current.forEach((m) => m.remove());
    marcas.current = solutions
      .filter((s) => Array.isArray(s.latlon))
      .map((s) => {
        const ind = industries[s.industry];
        const el = document.createElement('button');
        el.className = `mapmark${s.id === activeId ? ' active' : ''}`;
        el.style.setProperty('--accent', ind?.color ?? '#0ea5e9');
        el.innerHTML = `<i></i><span>${s.title.split(/[·&]/)[0].trim()}</span>`;
        el.onclick = () => select(s.id);
        return new Marker({ element: el, anchor: 'bottom' })
          .setLngLat([s.latlon[1], s.latlon[0]])
          .addTo(map);
      });
    return () => marcas.current.forEach((m) => m.remove());
  }, [solutions, industries, activeId, select, listo]);

  /* --- al elegir un caso (aquí o en el panel lateral) la cámara va a él -- */
  useEffect(() => {
    const map = mapa.current;
    if (!map || !listo || !abierto || !solucion) return;
    map.flyTo({
      center: [solucion.latlon[1], solucion.latlon[0]],
      zoom: 17.4,
      pitch: 62,
      bearing: -24,
      duration: 2400,
      essential: true,
    });
  }, [solucion, listo, abierto]);

  // al abrirse hay que remedir: el contenedor estaba oculto
  useEffect(() => {
    if (abierto) requestAnimationFrame(() => mapa.current?.resize());
  }, [abierto]);

  return (
    <div className={`mapview${abierto ? ' open' : ''}`} aria-hidden={!abierto}>
      <div ref={contenedor} className="mapview__canvas" />

      {/* la barra propia del mapa va abajo: arriba manda la de la aplicación,
          que ya trae el botón para volver a la ciudad 3D */}
      <div className="mapview__bar">
        <div className="mapview__styles">
          {[
            { id: 'flota', label: t('Flota') },
            { id: 'aire', label: t('Calidad del aire') },
            { id: 'bicing', label: t('Bicing en vivo') },
            { id: 'lluvia', label: t('Lluvia') },
          ].map((c) => (
            <button
              key={c.id}
              className={`mapview__style${capas[c.id] ? ' active' : ''}`}
              onClick={() => setCapas((v) => ({ ...v, [c.id]: !v[c.id] }))}
              title={
                c.id === 'aire'
                  ? 'Malla de sensores de calidad del aire, punto a punto'
                  : c.id === 'bicing'
                  ? 'Estaciones de Bicing con disponibilidad real (GBFS)'
                  : c.id === 'lluvia'
                    ? 'Radar de precipitación de RainViewer, últimas dos horas'
                    : 'Tráfico y contenedores sobre el viario real'
              }
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="mapview__sep" />
        <div className="mapview__styles">
          {Object.values(ESTILOS).map((e) => (
            <button
              key={e.id}
              className={`mapview__style${estilo === e.id ? ' active' : ''}`}
              onClick={() => setEstilo(e.id)}
            >
              {t(e.label)}
            </button>
          ))}
        </div>
      </div>

      {/* el cuadro de mando y el relato del caso: los mismos que en la 3D */}
      {abierto && solucion && (
        <MapPanel solution={solucion} accent={industries[solucion.industry]?.color ?? '#0ea5e9'} />
      )}
      {listo && abierto && solucion && (
        <MapStory map={mapa.current} solution={solucion} listo={listo} />
      )}

      {abierto && !listo && !error && <div className="mapview__load">{t('Preparando el mapa…')}</div>}
      {abierto && error && <div className="mapview__load mapview__load--err">{error}</div>}
    </div>
  );
}
