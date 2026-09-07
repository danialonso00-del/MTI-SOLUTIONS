import React, { useEffect, useRef, useState } from 'react';
import { kindsFor, storyFor } from '../data/stories.js';
import { useLang } from '../i18n.js';
import Icon from './icons.jsx';

/**
 * El relato de un caso de uso, contado sobre el mapa.
 *
 * Es el mismo guion que en la ciudad 3D —los mismos textos, el mismo ritmo y
 * los mismos cuatro tiempos— pero aquí las tarjetas son HTML y la cámara la
 * mueve MapLibre. La regla se mantiene: **mientras hay una tarjeta, el mapa no
 * se mueve**; el vuelo ocurre entre tarjeta y tarjeta.
 *
 * Un hilo une la tarjeta con el punto del mapa donde pasa la cosa, y se
 * redibuja cuando el mapa se mueve.
 */

/* En el mapa el relato va más rápido que en la ciudad 3D: no hay rótulo de
   entrada ni escena que montar, y la reunión no puede esperar medio minuto a
   la primera tarjeta. */
const AT = [2.5, 10, 17.5, 25];
const TTL = 6.5;
const TRANS = 1.6; // vuelo entre encuadres
const PAUSA = 5; // respiro antes de repetir
const CICLO = AT.at(-1) + TTL + PAUSA;

// cada paso mira el mismo punto desde un ángulo distinto, pero SIEMPRE de
// cerca: lo que se cuenta pasa en una calle, no en la comarca
const ENCUADRES = [
  { zoom: 17.9, pitch: 64, bearing: -24 },
  { zoom: 17.4, pitch: 56, bearing: 26 },
  { zoom: 17.7, pitch: 66, bearing: -58 },
  { zoom: 17.5, pitch: 60, bearing: 6 },
];

export default function MapStory({ map, solution, listo }) {
  const [carta, setCarta] = useState(null); // { beat, i, tanda, nacida }
  const [hilo, setHilo] = useState(null); // { x1, y1, x2, y2 }
  const [sitio, setSitio] = useState(null); // dónde se coloca la tarjeta
  const estado = useRef({ inicio: 0, paso: -1, tanda: -1, volado: -1 });

  const lang = useLang();
  const tandas = solution ? storyFor(solution.id, solution.industry, lang) : null;

  // reloj del relato
  useEffect(() => {
    if (!map || !listo || !solution || !tandas?.length) {
      setCarta(null);
      return undefined;
    }
    const centro = [solution.latlon[1], solution.latlon[0]];
    // el primer encuadre lo pone el vuelo de selección: aquí solo se encadena
    estado.current = { inicio: performance.now() / 1000, paso: -1, tanda: 0, volado: -1 };

    let vivo = true;
    const tic = () => {
      if (!vivo) return;
      const e = performance.now() / 1000 - estado.current.inicio;
      const vuelta = Math.floor(e / CICLO);
      const t = e % CICLO;
      const tanda = vuelta % tandas.length;

      // ¿toca volar al siguiente encuadre?
      const próximo = AT.findIndex((at) => t >= at - TRANS && t < at);
      if (próximo >= 0 && estado.current.volado !== vuelta * 10 + próximo) {
        estado.current.volado = vuelta * 10 + próximo;
        map.easeTo({
          center: centro,
          ...ENCUADRES[próximo % ENCUADRES.length],
          // el punto se sitúa por encima del centro: debajo va la tarjeta
          offset: [0, -70],
          duration: TRANS * 1000,
          essential: true,
        });
      }

      // ¿qué tarjeta está en pantalla?
      let paso = -1;
      for (let i = 0; i < AT.length; i++) {
        if (t >= AT[i] && t < AT[i] + TTL) paso = i;
      }
      if (paso !== estado.current.paso || tanda !== estado.current.tanda) {
        estado.current.paso = paso;
        estado.current.tanda = tanda;
        setCarta(
          paso < 0
            ? null
            : { beat: tandas[tanda][paso], i: paso, tanda, nacida: performance.now() / 1000 }
        );
      }
      requestAnimationFrame(tic);
    };
    const id = requestAnimationFrame(tic);
    return () => {
      vivo = false;
      cancelAnimationFrame(id);
    };
  }, [map, listo, solution, tandas]);

  // el hilo: de la tarjeta a la chapa clavada en el mapa
  useEffect(() => {
    if (!map || !carta || !solution) {
      setHilo(null);
      return undefined;
    }
    const dibujar = () => {
      const p = map.project([solution.latlon[1], solution.latlon[0]]);

      /* El tamaño de la tarjeta se calcula igual que en la hoja de estilos
         —clamp(440px, 27vw, 860px)— en vez de medirla: al aparecer todavía no
         tiene su ancho definitivo y la colocación salía descuadrada. */
      const ancho = Math.min(Math.max(440, window.innerWidth * 0.27), 860);
      const alto = Math.round(ancho * 0.3);

      /* Hueco libre: se miden los paneles de verdad, que en pantallas grandes
         no ocupan el porcentaje que uno supondría. */
      const lateral = document.querySelector('.sidebar:not(.hidden)')?.getBoundingClientRect();
      const ficha = document.querySelector('.detail.open')?.getBoundingClientRect();
      const izq = (lateral ? lateral.right : 0) + 28;
      const der = (ficha ? ficha.left : window.innerWidth) - 28;
      const arriba = 200; // por debajo del cuadro de mando
      const abajo = window.innerHeight - 110; // por encima de la barra del mapa

      // la tarjeta se pone AL LADO de la chapa, como en la ciudad 3D
      const holgura = 34;
      let x = p.x + holgura;
      if (x + ancho > der) x = p.x - holgura - ancho;
      x = Math.min(Math.max(x, izq), Math.max(izq, der - ancho));
      let y = p.y + holgura;
      if (y + alto > abajo) y = p.y - holgura - alto;
      y = Math.min(Math.max(y, arriba), Math.max(arriba, abajo - alto));
      setSitio({ x: Math.round(x), y: Math.round(y) });

      // el hilo sale por el lado de la tarjeta que mira hacia la chapa
      const cx = x + ancho / 2;
      const cy = y + alto / 2;
      const dx = p.x - cx;
      const dy = p.y - cy;
      const salida =
        Math.abs(dx) / (ancho / 2) > Math.abs(dy) / (alto / 2)
          ? { x: dx > 0 ? x + ancho - 6 : x + 6, y: cy }
          : { x: cx, y: dy > 0 ? y + alto - 6 : y + 6 };
      setHilo({ x1: salida.x, y1: salida.y, x2: p.x, y2: p.y });
    };

    dibujar();
    // la tarjeta cambia de tamaño con la pantalla: se remide un par de veces
    // en los primeros fotogramas, cuando ya tiene su ancho definitivo
    const t1 = setTimeout(dibujar, 60);
    const t2 = setTimeout(dibujar, 240);
    map.on('move', dibujar);
    map.on('resize', dibujar);
    window.addEventListener('resize', dibujar);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.off('move', dibujar);
      map.off('resize', dibujar);
      window.removeEventListener('resize', dibujar);
    };
  }, [map, carta, solution]);

  if (!carta) return null;
  const { beat, i } = carta;

  return (
    <>
      {hilo && (
        <>
          <svg className={`mapstory__wire t-${beat.tone}`} aria-hidden="true">
            <line x1={hilo.x1} y1={hilo.y1} x2={hilo.x2} y2={hilo.y2} />
          </svg>

          {/* la chapa de alerta: clavada sobre el sitio donde pasa la cosa */}
          <span
            className={`mapstory__pin mapstory__pin--${beat.tone}`}
            style={{ left: `${hilo.x2}px`, top: `${hilo.y2}px` }}
            aria-hidden="true"
          >
            <i className="mapstory__pinring" />
            <i className="mapstory__pinring mapstory__pinring--2" />
            <Icon name={beat.icon} />
          </span>
        </>
      )}

      {/* la tarjeta se planta junto a la chapa, dentro del hueco libre */}
      <div
        className="mapstory__wrap"
        style={sitio ? { left: `${sitio.x}px`, top: `${sitio.y}px` } : undefined}
      >
        <div
          className={`mapstory mapstory--${beat.tone}`}
          key={`${carta.tanda}-${i}-${Math.round(carta.nacida)}`}
        >
          <span className="mapstory__bar" />
          <span className="mapstory__ico">
            <Icon name={beat.icon} />
          </span>
          <div className="mapstory__txt">
            <b>{beat.title}</b>
            <span>{beat.sub}</span>
          </div>
          <span className="mapstory__step">
            {i + 1}/4 · {(beat.kind ?? kindsFor(lang)[i]).toUpperCase()}
          </span>
          <span className="mapstory__life" style={{ animationDuration: `${TTL}s` }} />
        </div>
      </div>
    </>
  );
}
