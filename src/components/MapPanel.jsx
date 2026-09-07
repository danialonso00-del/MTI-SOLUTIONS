import React, { useEffect, useMemo, useRef, useState } from 'react';
import { panelFor } from '../data/panels.js';
import Icon from './icons.jsx';
import { useLang, useT } from '../i18n.js';

/**
 * El cuadro de mando del caso, sobre el mapa.
 *
 * Es el mismo panel que flota en la ciudad 3D —mismo título, misma foto,
 * mismas tres cifras, mismo registro— pero aquí en HTML, que sobre un mapa se
 * lee más nítido que una textura. Los datos salen de `src/data/panels.js`, que
 * comparten las dos lecturas.
 */

/** Serie de ejemplo, estable por caso: la misma forma en cada apertura. */
function serie(semilla, n = 26) {
  const out = [];
  let v = 0.5;
  let s = semilla;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    v = Math.min(0.95, Math.max(0.12, v + (s / 233280 - 0.45) * 0.22));
    out.push(v);
  }
  return out;
}

const Grafica = ({ tipo, datos, id }) => {
  if (tipo === 'gauge') {
    const k = datos.at(-1);
    const r = 34;
    const largo = Math.PI * r;
    return (
      <svg className="mappanel__chart" viewBox="0 0 96 58" aria-hidden="true">
        <path d="M14 50a34 34 0 0 1 68 0" className="mappanel__gaugebg" />
        <path
          d="M14 50a34 34 0 0 1 68 0"
          className="mappanel__gauge"
          style={{ strokeDasharray: largo, strokeDashoffset: largo * (1 - k) }}
        />
        <text x="48" y="46" className="mappanel__gaugetxt">
          {Math.round(k * 100)}%
        </text>
      </svg>
    );
  }
  if (tipo === 'bars') {
    return (
      <svg className="mappanel__chart" viewBox="0 0 200 58" preserveAspectRatio="none" aria-hidden="true">
        {datos.map((v, i) => (
          <rect
            key={i}
            x={i * (200 / datos.length) + 1}
            y={56 - v * 52}
            width={200 / datos.length - 2.5}
            height={v * 52}
            rx="1.5"
            className="mappanel__bar"
            style={{ animationDelay: `${i * 26}ms` }}
          />
        ))}
      </svg>
    );
  }
  const puntos = datos
    .map((v, i) => `${(i * 200) / (datos.length - 1)},${56 - v * 50}`)
    .join(' ');
  return (
    <svg className="mappanel__chart" viewBox="0 0 200 58" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={puntos} className="mappanel__line" key={id} />
      <circle
        cx="200"
        cy={56 - datos.at(-1) * 50}
        r="3"
        className="mappanel__dot"
      />
    </svg>
  );
};

export default function MapPanel({ solution, accent }) {
  const lang = useLang();
  const t = useT();
  const cfg = useMemo(() => panelFor(solution, lang), [solution, lang]);
  const datos = useMemo(
    () => serie(solution ? solution.id.length * 977 : 7),
    [solution]
  );
  const [tic, setTic] = useState(0);
  const base = useRef(new Map());

  // las cifras marcadas como `live` respiran, igual que en la ciudad 3D
  useEffect(() => {
    base.current = new Map();
    const id = setInterval(() => setTic((n) => n + 1), 1400);
    return () => clearInterval(id);
  }, [solution]);

  if (!cfg) return null;

  const valor = (m) => {
    if (!m.live) return m.value;
    const clave = m.label;
    if (!base.current.has(clave)) base.current.set(clave, m.value);
    const salto = (Math.sin(tic * 1.7 + clave.length) * (m.jitter ?? 1));
    const v = base.current.get(clave) + salto;
    return Number.isInteger(m.value) ? Math.round(v) : Math.round(v * 10) / 10;
  };

  return (
    <section className="mappanel" style={{ '--accent': accent }}>
      <header className="mappanel__head">
        <span className="mappanel__dotlive" />
        <h3>{cfg.title}</h3>
        <span className="mappanel__live">{t('EN VIVO')}</span>
      </header>

      <div className="mappanel__body">
        <figure className="mappanel__photo">
          <img src={`/photos/${cfg.photo}.jpg`} alt="" loading="lazy" />
          <figcaption>{cfg.subtitle}</figcaption>
        </figure>

        <div className="mappanel__data">
          <div className="mappanel__kpis">
            {cfg.metrics.map((m) => (
              <div key={m.label} className="mappanel__kpi">
                <span className="mappanel__kpilabel">
                  <Icon name={m.icon ?? 'chart'} />
                  {m.label}
                </span>
                <b>
                  {valor(m)}
                  {m.suffix ?? ''}
                </b>
              </div>
            ))}
          </div>

          <Grafica tipo={cfg.chart} datos={datos} id={solution?.id} />

          <ul className="mappanel__rows">
            {cfg.rows.map((r) => (
              <li key={r.text} className={r.tone === 'alert' ? 'alerta' : ''}>
                <i />
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
