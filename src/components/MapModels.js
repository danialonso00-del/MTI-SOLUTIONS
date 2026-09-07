import * as THREE from 'three';
import { MercatorCoordinate } from 'maplibre-gl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Modelos 3D sobre el mapa.
 *
 * MapLibre permite meter una **capa personalizada**: te da el contexto WebGL y
 * la matriz de proyección de la cámara del mapa, y tú pintas lo que quieras.
 * Aquí se monta una escena de three.js con los mismos GLB que usa la ciudad
 * 3D, así que el autobús del mapa es el autobús de la ciudad.
 *
 * Cada modelo se coloca por latitud y longitud; el origen de la escena es el
 * centro de la ciudad y el resto se sitúa en metros respecto a él, que a esta
 * escala (kilómetros) no acumula error apreciable.
 *
 * Referencia: https://maplibre.org/maplibre-gl-js/docs/examples/add-a-3d-model-using-threejs/
 */

const M_PER_DEG_LAT = 111320;
const cargador = new GLTFLoader();

/** Carga un GLB y lo deja mirando al norte, apoyado en el suelo y a escala. */
function cargarModelo(url, alturaObjetivo) {
  return new Promise((resolve, reject) => {
    cargador.load(
      url,
      (gltf) => {
        const raiz = gltf.scene;
        const caja = new THREE.Box3().setFromObject(raiz);
        const tam = caja.getSize(new THREE.Vector3());
        const escala = alturaObjetivo ? alturaObjetivo / (tam.y || 1) : 1;
        raiz.scale.setScalar(escala);
        // apoyado en el suelo y centrado en planta
        const caja2 = new THREE.Box3().setFromObject(raiz);
        const centro = caja2.getCenter(new THREE.Vector3());
        raiz.position.x -= centro.x;
        raiz.position.z -= centro.z;
        raiz.position.y -= caja2.min.y;
        raiz.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = false;
            o.receiveShadow = false;
          }
        });
        resolve(raiz);
      },
      undefined,
      reject
    );
  });
}

/**
 * @param {object} o
 * @param {maplibregl.Map} o.map
 * @param {[number, number]} o.center  centro de la ciudad, [lat, lon]
 * @param {Array} o.modelos  [{ id, url, altura, latlon, rotacion, girar, ruta, velocidad }]
 *                           `ruta` son metros locales: el modelo la recorre
 * @param {Function} o.onPick  se llama con el id del modelo pulsado
 */
export function createModelLayer({ map, center, modelos, onPick }) {
  const [lat0, lon0] = center;
  const mPorGradoLon = M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180);
  const aMetros = (lat, lon) => [(lon - lon0) * mPorGradoLon, (lat0 - lat) * M_PER_DEG_LAT];

  const aLngLat = (x, z) => [lon0 + x / mPorGradoLon, lat0 - z / M_PER_DEG_LAT];
  const origen = MercatorCoordinate.fromLngLat([lon0, lat0], 0);
  const escala = origen.meterInMercatorCoordinateUnits();

  const escena = new THREE.Scene();
  escena.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sol = new THREE.DirectionalLight(0xffffff, 2.2);
  sol.position.set(-70, 180, 90);
  escena.add(sol);
  const relleno = new THREE.DirectionalLight(0x9fd0ff, 0.9);
  relleno.position.set(120, 60, -80);
  escena.add(relleno);

  const camara = new THREE.Camera();
  let renderer = null;
  let ultimo = 0;
  const piezas = new Map(); // id → { grupo, girar }

  const capa = {
    id: 'mti-modelos',
    type: 'custom',
    renderingMode: '3d',

    onAdd(mapa, gl) {
      renderer = new THREE.WebGLRenderer({ canvas: mapa.getCanvas(), context: gl, antialias: true });
      renderer.autoClear = false;

      for (const m of modelos) {
        const grupo = new THREE.Group();
        const [x, z] = aMetros(m.latlon[0], m.latlon[1]);
        grupo.position.set(x, 0, z);
        grupo.rotation.y = m.rotacion ?? 0;
        escena.add(grupo);

        // lo que recorre una calle lleva su recorrido medido de antemano
        let tramos = null;
        if (Array.isArray(m.ruta) && m.ruta.length > 1) {
          tramos = [];
          let acc = 0;
          for (let i = 1; i < m.ruta.length; i++) {
            const d = Math.hypot(m.ruta[i][0] - m.ruta[i - 1][0], m.ruta[i][1] - m.ruta[i - 1][1]);
            if (d < 0.5) continue;
            tramos.push({ a: m.ruta[i - 1], b: m.ruta[i], d, acc });
            acc += d;
          }
          tramos.total = acc;
        }
        piezas.set(m.id, { grupo, girar: m.girar ?? 0, def: m, tramos, s: 0 });

        cargarModelo(m.url, m.altura)
          .then((modelo) => grupo.add(modelo))
          .catch((err) => console.warn('Mapa 3D: no se pudo cargar', m.url, err?.message));
      }
    },

    render(gl, args) {
      // la matriz del mapa, más la del origen de la escena en metros
      const m = new THREE.Matrix4().fromArray(
        args.defaultProjectionData?.mainMatrix ?? args.mainMatrix ?? args
      );
      const l = new THREE.Matrix4()
        .makeTranslation(origen.x, origen.y, origen.z)
        .scale(new THREE.Vector3(escala, -escala, escala));
      camara.projectionMatrix = m.multiply(l);

      const t = performance.now() / 1000;
      const dt = Math.min(t - (ultimo || t), 0.2);
      ultimo = t;

      for (const pieza of piezas.values()) {
        // lo que gira, gira: la grúa busca su carga
        if (pieza.girar) pieza.grupo.rotation.y = (pieza.def.rotacion ?? 0) + t * pieza.girar;

        // lo que circula, circula: el camión recorre su calle y da la vuelta
        const tr = pieza.tramos;
        if (tr && tr.total > 1) {
          pieza.s = (pieza.s + (pieza.def.velocidad ?? 7) * dt) % (tr.total * 2);
          const ida = pieza.s < tr.total;
          const d = ida ? pieza.s : tr.total * 2 - pieza.s;
          const tramo = tr.find((x) => d >= x.acc && d < x.acc + x.d) ?? tr.at(-1);
          const k = tramo.d ? (d - tramo.acc) / tramo.d : 0;
          const px = tramo.a[0] + (tramo.b[0] - tramo.a[0]) * k;
          const pz = tramo.a[1] + (tramo.b[1] - tramo.a[1]) * k;
          pieza.grupo.position.set(px, 0, pz);
          const dir = ida ? 1 : -1;
          pieza.grupo.rotation.y =
            Math.atan2((tramo.b[0] - tramo.a[0]) * dir, (tramo.b[1] - tramo.a[1]) * dir) +
            (pieza.def.rotacion ?? 0);
          pieza.donde = [px, pz];
        }
      }

      renderer.resetState();
      renderer.render(escena, camara);
      map.triggerRepaint();
    },
  };

  map.addLayer(capa);

  /* Zona de clic: un círculo invisible por modelo. Es mucho más fiable que
     lanzar rayos contra la escena y además da el cursor de mano. */
  const puntos = {
    type: 'FeatureCollection',
    features: modelos.map((m) => ({
      type: 'Feature',
      properties: { id: m.id, etiqueta: m.etiqueta ?? '' },
      geometry: { type: 'Point', coordinates: [m.latlon[1], m.latlon[0]] },
    })),
  };
  if (!map.getSource('mti-modelos-hit')) {
    map.addSource('mti-modelos-hit', { type: 'geojson', data: puntos });
    map.addLayer({
      id: 'mti-modelos-hit',
      type: 'circle',
      source: 'mti-modelos-hit',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 8, 18, 34],
        'circle-color': '#0ea5e9',
        'circle-opacity': 0.001, // invisible, pero pulsable
      },
    });
  }

  /* La zona de clic de lo que circula tiene que ir con él: se reescribe la
     fuente tres veces por segundo, que es de sobra para pulsar un camión. */
  const seguir = setInterval(() => {
    let cambia = false;
    for (const f of puntos.features) {
      const pieza = piezas.get(f.properties.id);
      if (!pieza?.donde) continue;
      f.geometry.coordinates = aLngLat(pieza.donde[0], pieza.donde[1]);
      cambia = true;
    }
    if (cambia) map.getSource('mti-modelos-hit')?.setData(puntos);
  }, 300);

  const alPulsar = (e) => onPick?.(e.features?.[0]?.properties?.id);
  const entrar = () => (map.getCanvas().style.cursor = 'pointer');
  const salir = () => (map.getCanvas().style.cursor = '');
  map.on('click', 'mti-modelos-hit', alPulsar);
  map.on('mouseenter', 'mti-modelos-hit', entrar);
  map.on('mouseleave', 'mti-modelos-hit', salir);

  return {
    dispose() {
      clearInterval(seguir);
      map.off('click', 'mti-modelos-hit', alPulsar);
      map.off('mouseenter', 'mti-modelos-hit', entrar);
      map.off('mouseleave', 'mti-modelos-hit', salir);
      if (map.getLayer('mti-modelos-hit')) map.removeLayer('mti-modelos-hit');
      if (map.getSource('mti-modelos-hit')) map.removeSource('mti-modelos-hit');
      if (map.getLayer('mti-modelos')) map.removeLayer('mti-modelos');
      escena.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((mat) => mat?.dispose?.());
        }
      });
    },
  };
}
