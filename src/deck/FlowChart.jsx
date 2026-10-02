import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '../components/icons.jsx';
import { MtiIcon } from './parts.jsx';

/**
 * Diagrama de flujo que se construye despacio, nodo a nodo, para poder
 * contarlo en voz alta: pasos (rectángulos), preguntas (rombos) y respuestas.
 *
 * Cada nodo lleva su momento de entrada (`t`, en segundos) y su sitio en una
 * rejilla (`col`, `row`). Cada conexión se dibuja en su momento y, una vez
 * dibujada, la recorren pulsos. Mientras un nodo entra, se ilumina: la
 * mirada sigue el relato.
 *
 * Las conexiones se calculan sobre la maquetación real (sin transformaciones),
 * así que el diagrama se adapta a cualquier ancho.
 */

function layoutRect(el, root) {
  let left = 0;
  let top = 0;
  for (let n = el; n && n !== root; n = n.offsetParent) {
    left += n.offsetLeft;
    top += n.offsetTop;
  }
  return { left, top, right: left + el.offsetWidth, bottom: top + el.offsetHeight, cx: left + el.offsetWidth / 2, cy: top + el.offsetHeight / 2 };
}

function useEdgePaths(root, edges, key) {
  const [paths, setPaths] = useState([]);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const measure = () => {
      const r = (id) => {
        const n = el.querySelector(`[data-fc="${id}"]`);
        return n ? layoutRect(n, el) : null;
      };
      const out = [];
      for (const e of edges) {
        const a = r(e.from);
        const b = r(e.to);
        if (!a || !b) continue;
        let d;
        let lx;
        let ly;
        if (e.loop) {
          // vuelta atrás por debajo de todo el diagrama
          const y = el.offsetHeight - 26;
          d = `M ${a.cx} ${a.bottom} C ${a.cx} ${y}, ${a.cx - 40} ${y}, ${a.cx - 80} ${y} L ${b.cx + 80} ${y} C ${b.cx + 40} ${y}, ${b.cx} ${y}, ${b.cx} ${b.bottom}`;
          lx = (a.cx + b.cx) / 2;
          ly = y - 8;
        } else if (Math.abs(b.cy - a.cy) < 6) {
          d = `M ${a.right} ${a.cy} L ${b.left} ${b.cy}`;
          lx = (a.right + b.left) / 2;
          ly = a.cy - 8;
        } else {
          const m = (a.right + b.left) / 2;
          d = `M ${a.right} ${a.cy} C ${m} ${a.cy}, ${m} ${b.cy}, ${b.left} ${b.cy}`;
          // la etiqueta, pegada a la pregunta de la que sale
          lx = a.right + 6;
          ly = a.cy + (b.cy - a.cy) * 0.3 + (b.cy > a.cy ? 14 : -6);
        }
        out.push({ ...e, d, lx, ly });
      }
      setPaths(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, key]);
  return paths;
}

function Node({ n }) {
  const style = { gridColumn: n.col, gridRow: n.row, '--t': `${n.t}s` };
  if (n.type === 'decision') {
    return (
      <div className="fc-node fc-node--decision" data-fc={n.id} style={style}>
        <span className="fc-diamond" aria-hidden="true" />
        <strong>{n.title}</strong>
      </div>
    );
  }
  return (
    <div className={`fc-node fc-node--${n.type}${n.tone ? ` is-${n.tone}` : ''}`} data-fc={n.id} style={style}>
      {n.num && <span className="fc-node__num">{n.num}</span>}
      <header>
        {(n.icon || n.mti) && <span className="fc-node__icon">{n.mti ? <MtiIcon name={n.mti} /> : <Icon name={n.icon} />}</span>}
        <strong>{n.title}</strong>
      </header>
      {n.body && <p>{n.body}</p>}
      {n.chips?.length > 0 && (
        <div className="fc-node__chips">
          {n.chips.map((c, i) => (
            <span key={c.label} style={{ '--k': i }}>
              {c.mti && <MtiIcon name={c.mti} />}
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FlowChart({ nodes, edges, paused = false, replayLabel }) {
  const root = useRef(null);
  const svg = useRef(null);
  const [run, setRun] = useState(0);
  const paths = useEdgePaths(root, edges, run);

  useEffect(() => {
    const el = svg.current;
    if (!el?.pauseAnimations) return;
    if (paused) el.pauseAnimations();
    else el.unpauseAnimations();
  }, [paused, paths]);

  return (
    <div className={`fc${paused ? ' is-paused' : ''}`} key={run} ref={root}>
      <svg ref={svg} className="fc__wires" aria-hidden="true">
        <defs>
          <marker id="fc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fc__arrow" />
          </marker>
        </defs>
        {paths.map((p) => (
          <g key={`${p.from}-${p.to}`} className={`fc-edge${p.no ? ' is-no' : ''}${p.loop ? ' is-loop' : ''}`} style={{ '--t': `${p.t}s` }}>
            <path d={p.d} className="fc-edge__line" pathLength="1" markerEnd="url(#fc-arrow)" />
            <path d={p.d} className="fc-edge__flow" />
            {p.label && (
              <text x={p.lx} y={p.ly} className="fc-edge__label" textAnchor={p.loop ? 'middle' : 'start'}>
                {p.label}
              </text>
            )}
            <circle r="4" className="fc-edge__pulse" opacity="0">
              <animateMotion dur={p.loop ? '5s' : '2.6s'} begin={`${(p.t + 1.2).toFixed(1)}s`} repeatCount="indefinite" path={p.d} />
              <animate attributeName="opacity" dur={p.loop ? '5s' : '2.6s'} begin={`${(p.t + 1.2).toFixed(1)}s`} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.08;0.9;1" />
            </circle>
          </g>
        ))}
      </svg>
      {nodes.map((n) => (
        <Node key={n.id} n={n} />
      ))}
      {replayLabel && (
        <button className="fc__replay dbtn dbtn--ghost dbtn--compact" onClick={() => setRun((x) => x + 1)}>
          <Icon name="play" />
          <span>{replayLabel}</span>
        </button>
      )}
    </div>
  );
}
