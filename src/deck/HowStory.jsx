import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../components/icons.jsx';
import { MtiIcon } from './parts.jsx';

/**
 * «¿Cómo?»: una secuencia que se reproduce sola, sin pasar diapositivas.
 *
 * Todo vive en un plano virtual de 1440 × 760 «píxeles de diseño». Una cámara
 * (transformación CSS) recorre el plano siguiendo un guion de tiempos; los
 * elementos aparecen cuando el reloj llega a su momento y las conexiones se
 * dibujan solas. Arriba, una frase grande narra cada momento.
 *
 *    ¿Cómo?  →  la persona y sus necesidades  →  entra MTi  →  hardware
 *    →  software  →  instalación y mantenimiento 24/7  →  vista completa
 *    →  las industrias a las que hemos ayudado
 *
 * El reloj se para con la pausa. Con movimiento reducido se va al final.
 */

const VW = 1440;
const VH = 760;

/* ------------------------------------------------------------------ */
/* Guion: dónde está cada cosa y cuándo aparece                       */
/* ------------------------------------------------------------------ */

const P = {
  how: [720, -560],
  person: [430, 380],
  needs: [
    [180, 170],
    [700, 190],
    [720, 590],
    [190, 600],
  ],
  mti: [1650, 380],
  hw: [2330, 170],
  sw: [2330, 610],
  hwItems: [
    [2860, 60],
    [2860, 170],
    [2860, 280],
  ],
  swItems: [
    [2860, 440],
    [2860, 525],
    [2860, 610],
    [2860, 695],
    [2860, 780],
  ],
  ops: [3480, 420],
  industries: [2000, 1500],
};

const T = {
  how: 0.2,
  person: 3.2,
  needs: [4.4, 5.9, 7.4, 8.9],
  mtiWire: 10.6,
  mti: 11.4,
  hw: 14.2,
  hwItems: [15, 15.6, 16.2],
  sw: 17.6,
  swItems: [18.4, 19, 19.6, 20.2, 20.8],
  opsWires: 22.6,
  ops: 23.4,
  overview: 26.5,
  industries: 30,
  end: 34,
};

/** Cámara: [desde segundo, centro x, centro y, zoom]. */
const CAMERA = [
  [0, 720, -560, 1.25],
  [2.4, 460, 390, 1],
  [10.2, 1040, 390, 0.78],
  [13.4, 2420, 190, 0.92],
  [17, 2420, 600, 0.92],
  [22.2, 3060, 420, 0.82],
  [26.5, 1860, 420, 0.38],
  [29.6, 2000, 1500, 1],
];

/** La misma cámara en pantallas estrechas: planos más abiertos y recentrados. */
const CAMERA_NARROW = [
  [0, 720, -560, 1],
  [2.4, 450, 390, 1],
  [10.2, 1040, 390, 0.58],
  [13.4, 2600, 180, 0.92],
  [17, 2600, 610, 0.92],
  [22.2, 3160, 420, 0.82],
  [26.5, 1860, 420, 0.27],
  [29.6, 2000, 1500, 1],
];

/** Frase del momento: [desde segundo, clave de texto]. */
const CAPTIONS = [
  [0, null],
  [2.6, 'need'],
  [10.4, 'mti'],
  [13.4, 'help'],
  [22.2, 'ops'],
  [26.5, 'e2e'],
  [29.6, 'industries'],
];

const pick = (list, t) => list.reduce((acc, row) => (t >= row[0] ? row : acc), list[0]);

/* ------------------------------------------------------------------ */

function useClock(paused, runKey) {
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [t, setT] = useState(reduced ? T.end : 0);
  const acc = useRef(reduced ? T.end : 0);
  useEffect(() => {
    acc.current = reduced ? T.end : 0;
    setT(acc.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);
  useEffect(() => {
    if (paused || reduced) return undefined;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      acc.current = Math.min(T.end + 1, acc.current + (now - last) / 1000);
      last = now;
      setT(acc.current);
      if (acc.current > T.end) clearInterval(id);
    }, 80);
    return () => clearInterval(id);
  }, [paused, reduced, runKey]);
  return t;
}

function useFit(ref) {
  const [box, setBox] = useState({ w: VW, h: VH });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return box;
}

/** Curva suave entre dos puntos, horizontal. */
const curve = ([x1, y1], [x2, y2]) => {
  const m = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${m} ${y1}, ${m} ${y2}, ${x2} ${y2}`;
};

function Wire({ from, to, at, t, tone = 'gold' }) {
  const on = t >= at;
  const d = curve(from, to);
  return (
    <g className={`hs-wire hs-wire--${tone}${on ? ' is-in' : ''}`}>
      <path d={d} className="hs-wire__line" pathLength="1" />
      {on && (
        <circle r="5" className="hs-wire__pulse">
          <animateMotion dur="2.6s" begin="1s" repeatCount="indefinite" path={d} />
        </circle>
      )}
    </g>
  );
}

const pos = ([x, y]) => ({ left: `${x}px`, top: `${y}px` });
const isIn = (t, at) => (t >= at ? ' is-in' : '');

export default function HowStory({ data, industries, paused }) {
  const root = useRef(null);
  const [run, setRun] = useState(0);
  const t = useClock(paused, run);
  const { w, h } = useFit(root);

  // encaje del plano en la pantalla (en móvil se recorta para que se lea)
  const narrow = w < 700;
  const fit = narrow ? w / 1060 : Math.min(w / VW, h / VH);
  const [, cx, cy, zoom] = pick(narrow ? CAMERA_NARROW : CAMERA, t);
  const s = fit * zoom;
  const tx = w / 2 - cx * s;
  const ty = h / 2 - cy * s;
  const captionKey = pick(CAPTIONS, t)[1];

  const hwIn = (i) => P.hwItems[i];
  const swIn = (i) => P.swItems[i];

  return (
    <div className={`hs${paused ? ' is-paused' : ''}${t >= T.end ? ' is-done' : ''}`}>
      {/* la frase del momento */}
      <p className="hs__caption" key={captionKey ?? 'none'} aria-live="polite">
        {captionKey ? data.captions[captionKey] : ' '}
      </p>

      <div className="hs__viewport" ref={root}>
        <div className="hs__world" style={{ transform: `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})` }}>
          <svg className="hs__wires" aria-hidden="true">
            <Wire from={P.person} to={P.mti} at={T.mtiWire} t={t} />
            <Wire from={P.mti} to={P.hw} at={T.hw - 0.4} t={t} tone="cyan" />
            <Wire from={P.mti} to={P.sw} at={T.sw - 0.4} t={t} />
            {data.hardware.items.map((_, i) => (
              <Wire key={`h${i}`} from={P.hw} to={hwIn(i)} at={T.hwItems[i] - 0.3} t={t} tone="cyan" />
            ))}
            {data.software.items.map((_, i) => (
              <Wire key={`s${i}`} from={P.sw} to={swIn(i)} at={T.swItems[i] - 0.3} t={t} />
            ))}
            {[...P.hwItems.slice(0, data.hardware.items.length), ...P.swItems.slice(0, data.software.items.length)].map((p, i) => (
              <Wire key={`o${i}`} from={p} to={P.ops} at={T.opsWires + i * 0.06} t={t} tone="green" />
            ))}
          </svg>

          {/* ¿Cómo? */}
          <div className={`hs-how${isIn(t, T.how)}${t >= T.person ? ' is-gone' : ''}`} style={pos(P.how)}>
            {data.how}
          </div>

          {/* la persona y sus necesidades */}
          <div className={`hs-person${isIn(t, T.person)}`} style={pos(P.person)}>
            <span className="hs-person__ring" aria-hidden="true" />
            <span className="hs-person__ring hs-person__ring--2" aria-hidden="true" />
            <Icon name="user" />
            <em>{data.client}</em>
          </div>
          {data.needs.map((n, i) => (
            <div key={n} className={`hs-need hs-need--${i}${isIn(t, T.needs[i])}`} style={pos(P.needs[i])}>
              <Icon name="message" />
              {n}
            </div>
          ))}

          {/* entra MTi */}
          <div className={`hs-mti${isIn(t, T.mti)}`} style={pos(P.mti)}>
            <span className="hs-mti__wave" aria-hidden="true" />
            <span className="hs-mti__wave hs-mti__wave--2" aria-hidden="true" />
            <img src="/brand/logo-mti.png" alt="MTi" />
          </div>

          {/* hardware y software */}
          <div className={`hs-group hs-group--hw${isIn(t, T.hw)}`} style={pos(P.hw)}>
            <Icon name="cube" />
            {data.hardware.label}
          </div>
          {data.hardware.items.map((it, i) => (
            <div key={it.label} className={`hs-item hs-item--hw${isIn(t, T.hwItems[i])}`} style={pos(hwIn(i))}>
              <span className="hs-item__icon">{it.mti ? <MtiIcon name={it.mti} /> : <Icon name={it.icon} />}</span>
              {it.label}
            </div>
          ))}
          <div className={`hs-group hs-group--sw${isIn(t, T.sw)}`} style={pos(P.sw)}>
            <Icon name="layers" />
            {data.software.label}
          </div>
          {data.software.items.map((it, i) => (
            <div key={it.label} className={`hs-item hs-item--sw${isIn(t, T.swItems[i])}`} style={pos(swIn(i))}>
              <span className="hs-item__icon">{it.mti ? <MtiIcon name={it.mti} /> : <Icon name={it.icon} />}</span>
              {it.label}
            </div>
          ))}

          {/* instalación y mantenimiento */}
          <div className={`hs-ops${isIn(t, T.ops)}`} style={pos(P.ops)}>
            <span className="hs-ops__icon">
              <MtiIcon name="service-om" />
            </span>
            <span>
              <strong>{data.ops.label}</strong>
              <em>{data.ops.sub}</em>
            </span>
          </div>

          {/* las industrias */}
          <div className={`hs-ind${isIn(t, T.industries)}`} style={pos(P.industries)}>
            {industries.map((x, i) => (
              <span key={x.label} className="hs-ind__tile" style={{ '--i': i }}>
                <Icon name={x.icon} />
                {x.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button className={`hs__replay dbtn dbtn--ghost dbtn--compact${t >= T.end ? ' is-in' : ''}`} onClick={() => setRun((r) => r + 1)}>
        <Icon name="play" />
        <span>{data.replay}</span>
      </button>
      <div className="hs__progress" aria-hidden="true">
        <i style={{ transform: `scaleX(${Math.min(1, t / T.end).toFixed(3)})` }} />
      </div>
    </div>
  );
}
