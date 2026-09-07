/**
 * Capas de datos EN VIVO sobre el mapa.
 *
 * No son simulación: son dos fuentes públicas, abiertas y sin clave, que se
 * pueden enseñar en una reunión como lo que son, datos reales llegando ahora
 * mismo. Las dos permiten peticiones desde el navegador (CORS abierto).
 *
 *  · Bicing — estaciones de bicicleta de Barcelona en formato GBFS, con
 *    disponibilidad real. Se refresca cada 30 s.
 *    https://barcelona.publicbikesystem.net/customer/gbfs/v2/
 *
 *  · Lluvia — radar de precipitación de RainViewer, que publica las últimas
 *    dos horas en teselas. Se animan los últimos fotogramas.
 *    https://api.rainviewer.com/public/weather-maps.json
 *
 * Sirven además para explicar el argumento de venta: la plataforma no vive de
 * sus propios sensores, se alimenta de lo que ya hay.
 */

const GBFS = 'https://barcelona.publicbikesystem.net/customer/gbfs/v2/en';
const RAINVIEWER = 'https://api.rainviewer.com/public/weather-maps.json';

/* ------------------------------------------------------------------ */
/* Bicing                                                              */
/* ------------------------------------------------------------------ */

export function createBicing({ map }) {
  let paradas = null; // id → [lon, lat]
  let temporizador = null;
  let vivo = true;

  const pintar = (features) => {
    const datos = { type: 'FeatureCollection', features };
    if (map.getSource('mti-bicing')) {
      map.getSource('mti-bicing').setData(datos);
      return;
    }
    map.addSource('mti-bicing', { type: 'geojson', data: datos });
    map.addLayer({
      id: 'mti-bicing',
      type: 'circle',
      source: 'mti-bicing',
      paint: {
        // el color dice si hay bicis; el tamaño, cuántas
        'circle-color': [
          'case',
          ['<', ['get', 'bicis'], 1], '#f43f5e',
          ['<', ['get', 'bicis'], 4], '#e6a817',
          '#10b981',
        ],
        'circle-radius': ['interpolate', ['linear'], ['zoom'],
          12, 2,
          15, ['+', 3, ['*', 0.28, ['min', ['get', 'bicis'], 20]]],
          18, ['+', 6, ['*', 0.6, ['min', ['get', 'bicis'], 20]]],
        ],
        'circle-opacity': 0.9,
        'circle-stroke-width': 1.2,
        'circle-stroke-color': 'rgba(8,12,20,0.75)',
      },
    });
  };

  const refrescar = async () => {
    try {
      if (!paradas) {
        const info = await (await fetch(`${GBFS}/station_information`)).json();
        paradas = new Map(
          info.data.stations.map((s) => [String(s.station_id), [s.lon, s.lat]])
        );
      }
      const estado = await (await fetch(`${GBFS}/station_status`)).json();
      if (!vivo) return;
      const features = [];
      for (const s of estado.data.stations) {
        const donde = paradas.get(String(s.station_id));
        if (!donde) continue;
        features.push({
          type: 'Feature',
          properties: {
            bicis: s.num_bikes_available ?? 0,
            anclajes: s.num_docks_available ?? 0,
          },
          geometry: { type: 'Point', coordinates: donde },
        });
      }
      pintar(features);
    } catch (err) {
      console.warn('Bicing en vivo no disponible:', err?.message);
    }
  };

  refrescar();
  temporizador = setInterval(refrescar, 30000);

  return {
    id: 'bicing',
    setVisible(v) {
      if (map.getLayer('mti-bicing')) {
        map.setLayoutProperty('mti-bicing', 'visibility', v ? 'visible' : 'none');
      }
    },
    reañadir: () => {
      paradas = paradas; // se conserva el callejero de estaciones
      refrescar();
    },
    dispose() {
      vivo = false;
      clearInterval(temporizador);
      if (map.getLayer('mti-bicing')) map.removeLayer('mti-bicing');
      if (map.getSource('mti-bicing')) map.removeSource('mti-bicing');
    },
  };
}

/* ------------------------------------------------------------------ */
/* Lluvia (radar)                                                      */
/* ------------------------------------------------------------------ */

export function createLluvia({ map }) {
  let fotogramas = [];
  let indice = 0;
  let animacion = null;
  let host = '';
  let visible = false;

  const idDe = (i) => `mti-lluvia-${i}`;

  const montar = async () => {
    try {
      const mapa = await (await fetch(RAINVIEWER)).json();
      host = mapa.host;
      // los seis últimos fotogramas: hora y media de lluvia
      fotogramas = (mapa.radar?.past ?? []).slice(-6);
      fotogramas.forEach((f, i) => {
        const id = idDe(i);
        if (map.getSource(id)) return;
        map.addSource(id, {
          type: 'raster',
          tiles: [`${host}${f.path}/256/{z}/{x}/{y}/4/1_1.png`],
          tileSize: 256,
          // el radar no llega a zoom de calle: por encima de 9 se amplía la
          // tesela en vez de pedir uno que no existe (y que devuelve 429)
          maxzoom: 9,
          attribution: 'Radar © RainViewer',
        });
        map.addLayer({
          id,
          type: 'raster',
          source: id,
          layout: { visibility: 'none' },
          paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 },
        });
      });
    } catch (err) {
      console.warn('Radar de lluvia no disponible:', err?.message);
    }
  };

  const mostrarFotograma = (n) => {
    fotogramas.forEach((_, i) => {
      const id = idDe(i);
      if (!map.getLayer(id)) return;
      map.setPaintProperty(id, 'raster-opacity', i === n ? 0.62 : 0);
    });
  };

  montar();

  return {
    id: 'lluvia',
    setVisible(v) {
      visible = v;
      fotogramas.forEach((_, i) => {
        const id = idDe(i);
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v ? 'visible' : 'none');
      });
      clearInterval(animacion);
      if (v && fotogramas.length) {
        // media hora de radar por segundo: se ve venir el frente
        animacion = setInterval(() => {
          indice = (indice + 1) % fotogramas.length;
          mostrarFotograma(indice);
        }, 700);
        mostrarFotograma(indice);
      }
    },
    reañadir: () => {
      montar().then(() => visible && setTimeout(() => mostrarFotograma(indice), 200));
    },
    dispose() {
      clearInterval(animacion);
      fotogramas.forEach((_, i) => {
        const id = idDe(i);
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      });
    },
  };
}
