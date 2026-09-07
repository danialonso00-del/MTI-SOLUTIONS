/**
 * Capas vivas del modo mapa.
 *
 * El mapa vectorial es un plano: lo que lo convierte en "ciudad" es que se
 * mueva. Aquí se reutiliza el MISMO viario descargado de OpenStreetMap que usa
 * la ciudad 3D (`public/city/barcelona.json`, en metros locales) y se recorre
 * con agentes: coches, autobuses y el camión de la basura. Los contenedores
 * van fijos, con su color según lo llenos que estén.
 *
 * Todo se pinta con dos fuentes GeoJSON que se refrescan a 12 Hz: es barato y
 * no necesita ni un modelo ni una textura.
 */

const M_PER_DEG_LAT = 111320;

/** Metros locales → longitud y latitud, invirtiendo la proyección del volcado. */
export function makeToLngLat(center) {
  const [lat0, lon0] = center;
  const mPorGradoLon = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  return (x, z) => [lon0 + x / mPorGradoLon, lat0 - z / M_PER_DEG_LAT];
}

/** Metros locales del volcado a partir de latitud y longitud. */
export function makeToMetros(center) {
  const [lat0, lon0] = center;
  const mPorGradoLon = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  return (lat, lon) => [(lon - lon0) * mPorGradoLon, (lat0 - lat) * M_PER_DEG_LAT];
}

/**
 * La calle más larga cerca de un punto, en metros locales. Sirve para que un
 * modelo 3D del mapa —el camión de la basura— recorra viario de verdad.
 */
export function rutaCerca(cityData, latlon, radio = 260) {
  const aMetros = makeToMetros(cityData.center);
  const [cx, cz] = aMetros(latlon[0], latlon[1]);
  let mejor = null;
  let mejorLargo = 0;
  for (const via of cityData.roads ?? []) {
    const p = via.p ?? via;
    if (!Array.isArray(p) || p.length < 3) continue;
    // ¿pasa cerca del caso?
    let cerca = false;
    for (const q of p) {
      if (Math.hypot(q[0] - cx, q[1] - cz) < radio) {
        cerca = true;
        break;
      }
    }
    if (!cerca) continue;
    let largo = 0;
    for (let i = 1; i < p.length; i++) largo += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (largo > mejorLargo) {
      mejorLargo = largo;
      mejor = p;
    }
  }
  return mejor;
}

/**
 * Malla de sensores de calidad del aire, repartida por el viario. Cada punto
 * respira su propia lectura, así que el mapa enseña lo que enseña la red: que
 * el aire no es igual en toda la ciudad, sino calle a calle.
 */
export function createAire({ map, cityData }) {
  const toLngLat = makeToLngLat(cityData.center);
  const vias = (cityData.roads ?? []).map((r) => r.p ?? r).filter((p) => Array.isArray(p) && p.length > 2);
  const features = [];
  for (let i = 0; i < 130 && vias.length; i++) {
    const via = vias[Math.floor(Math.random() * vias.length)];
    const p = via[Math.floor(Math.random() * via.length)];
    features.push({
      type: 'Feature',
      properties: { no2: 40 + Math.random() * 180, fase: Math.random() * 6.28 },
      geometry: { type: 'Point', coordinates: toLngLat(p[0], p[1]) },
    });
  }

  const montar = () => {
    if (!map.getSource('mti-aire')) {
      map.addSource('mti-aire', { type: 'geojson', data: { type: 'FeatureCollection', features } });
    }
    if (!map.getLayer('mti-aire')) {
      map.addLayer({
        id: 'mti-aire',
        type: 'circle',
        source: 'mti-aire',
        layout: { visibility: 'none' },
        paint: {
          // verde, ámbar o rojo según el NO₂ medido en ese punto
          'circle-color': [
            'interpolate', ['linear'], ['get', 'no2'],
            40, '#10b981',
            120, '#e6a817',
            200, '#f43f5e',
          ],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 3, 18, 14],
          'circle-opacity': 0.55,
          'circle-blur': 0.6,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255,255,255,0.25)',
        },
      });
    }
  };
  montar();

  let animacion = null;
  return {
    id: 'aire',
    setVisible(v) {
      if (map.getLayer('mti-aire')) {
        map.setLayoutProperty('mti-aire', 'visibility', v ? 'visible' : 'none');
      }
      clearInterval(animacion);
      if (v) {
        // la lectura se mueve despacio: es una medida, no un parpadeo
        animacion = setInterval(() => {
          const t = performance.now() / 1000;
          for (const f of features) {
            f.properties.no2 = Math.max(
              25,
              f.properties.no2 + Math.sin(t * 0.4 + f.properties.fase) * 2.5
            );
          }
          map.getSource('mti-aire')?.setData({ type: 'FeatureCollection', features });
        }, 900);
      }
    },
    reañadir: montar,
    dispose() {
      clearInterval(animacion);
      if (map.getLayer('mti-aire')) map.removeLayer('mti-aire');
      if (map.getSource('mti-aire')) map.removeSource('mti-aire');
    },
  };
}

const TIPOS = [
  { key: 'coche', color: '#e2e8f0', radio: 3.4, peso: 12, vel: [11, 17] },
  { key: 'taxi', color: '#fbbf24', radio: 3.6, peso: 3, vel: [10, 15] },
  { key: 'bus', color: '#E6A817', radio: 5.4, peso: 2, vel: [7, 10] },
  { key: 'camion', color: '#10b981', radio: 5, peso: 1, vel: [6, 9] },
];

const elegirTipo = () => {
  const total = TIPOS.reduce((a, t) => a + t.peso, 0);
  let r = Math.random() * total;
  for (const t of TIPOS) {
    r -= t.peso;
    if (r <= 0) return t;
  }
  return TIPOS[0];
};

/**
 * Crea los agentes y devuelve `update()`, que escribe las posiciones nuevas en
 * las fuentes del mapa. Se le pasa el volcado de la ciudad tal cual.
 */
export function createLiveLayers({ map, cityData, cuantos = 110 }) {
  const toLngLat = makeToLngLat(cityData.center);

  // solo el viario con recorrido suficiente para que se vea circular
  const vias = (cityData.roads ?? [])
    .map((r) => r.p ?? r.points ?? r)
    .filter((p) => Array.isArray(p) && p.length > 2)
    .slice(0, 2600);
  if (!vias.length) return null;

  const largo = (via) => {
    let d = 0;
    for (let i = 1; i < via.length; i++) {
      d += Math.hypot(via[i][0] - via[i - 1][0], via[i][1] - via[i - 1][1]);
    }
    return d;
  };

  const agentes = [];
  for (let i = 0; i < cuantos; i++) {
    const via = vias[Math.floor(Math.random() * vias.length)];
    const tipo = elegirTipo();
    agentes.push({
      via,
      tipo,
      largoVia: largo(via),
      s: Math.random() * largo(via),
      dir: Math.random() > 0.5 ? 1 : -1,
      vel: tipo.vel[0] + Math.random() * (tipo.vel[1] - tipo.vel[0]),
    });
  }

  /** Punto a `s` metros del inicio de la polilínea. */
  const puntoEn = (via, s) => {
    let acc = 0;
    for (let i = 1; i < via.length; i++) {
      const d = Math.hypot(via[i][0] - via[i - 1][0], via[i][1] - via[i - 1][1]);
      if (acc + d >= s) {
        const k = d ? (s - acc) / d : 0;
        return [
          via[i - 1][0] + (via[i][0] - via[i - 1][0]) * k,
          via[i - 1][1] + (via[i][1] - via[i - 1][1]) * k,
        ];
      }
      acc += d;
    }
    return via.at(-1);
  };

  // contenedores: repartidos por el viario, con su nivel de llenado
  const contenedores = [];
  for (let i = 0; i < 90; i++) {
    const via = vias[Math.floor(Math.random() * vias.length)];
    const p = puntoEn(via, Math.random() * largo(via));
    const nivel = Math.random();
    contenedores.push({
      type: 'Feature',
      properties: { nivel, color: nivel > 0.8 ? '#f43f5e' : nivel > 0.5 ? '#e6a817' : '#10b981' },
      geometry: { type: 'Point', coordinates: toLngLat(p[0], p[1]) },
    });
  }

  const fuenteFlota = {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  };

  const añadir = () => {
    if (!map.getSource('mti-flota')) map.addSource('mti-flota', fuenteFlota);
    if (!map.getSource('mti-contenedores')) {
      map.addSource('mti-contenedores', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: contenedores },
      });
    }
    if (!map.getLayer('mti-contenedores')) {
      map.addLayer({
        id: 'mti-contenedores',
        type: 'circle',
        source: 'mti-contenedores',
        minzoom: 14,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 2, 18, 5],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(8,12,20,0.8)',
        },
      });
    }
    if (!map.getLayer('mti-flota')) {
      map.addLayer({
        id: 'mti-flota',
        type: 'circle',
        source: 'mti-flota',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 13, 1.6, 18, ['get', 'radio']],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.95,
          'circle-blur': 0.15,
          'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 15, 0, 17, 1.2],
          'circle-stroke-color': 'rgba(8,12,20,0.65)',
        },
      });
    }
  };

  añadir();

  let ultimo = performance.now() / 1000;
  let pasos = 0; // cuántas veces se ha refrescado la flota
  const features = agentes.map(() => ({
    type: 'Feature',
    properties: {},
    geometry: { type: 'Point', coordinates: [0, 0] },
  }));

  return {
    /** Reañade capas y fuentes tras un cambio de estilo. */
    reañadir: añadir,
    update() {
      const ahora = performance.now() / 1000;
      const dt = Math.min(ahora - ultimo, 0.25);
      ultimo = ahora;

      for (let i = 0; i < agentes.length; i++) {
        const a = agentes[i];
        a.s += a.vel * dt * a.dir;
        if (a.s > a.largoVia || a.s < 0) {
          // se cambia de calle en vez de rebotar: parece tráfico, no un péndulo
          a.via = vias[Math.floor(Math.random() * vias.length)];
          a.largoVia = largo(a.via);
          a.dir = Math.random() > 0.5 ? 1 : -1;
          a.s = a.dir > 0 ? 0 : a.largoVia;
        }
        const p = puntoEn(a.via, a.s);
        const f = features[i];
        f.geometry.coordinates = toLngLat(p[0], p[1]);
        f.properties = { color: a.tipo.color, radio: a.tipo.radio };
      }

      pasos++;
      map.getSource('mti-flota')?.setData({ type: 'FeatureCollection', features });
    },
    /** Para comprobar de un vistazo que la ciudad está viva. */
    stats: () => ({ agentes: agentes.length, contenedores: contenedores.length, pasos,
      muestra: features[0]?.geometry.coordinates }),
    dispose() {
      for (const id of ['mti-flota', 'mti-contenedores']) {
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      }
    },
  };
}
