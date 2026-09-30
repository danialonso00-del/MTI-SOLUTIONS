import React, { useLayoutEffect, useRef, useState } from 'react';
import Icon from '../components/icons.jsx';
import { MtiIcon, BrandLogo } from './parts.jsx';

/**
 * Esquema animado «qué entra → qué hace MTi → qué sale».
 *
 * Todo el movimiento sigue un único ciclo (por defecto 6,4 s):
 *
 *   0–25 %   cada entrada se enciende y lanza un pulso hacia el núcleo
 *   28–62 %  el núcleo recorre sus pasos, uno tras otro
 *   62–90 %  salen los pulsos hacia las salidas, que se encienden al llegar
 *
 * Los cables se calculan sobre la maquetación real (se miden las fichas), así
 * que el esquema se adapta a cualquier ancho sin que las líneas se desvíen.
 * Con pausa o movimiento reducido todo queda quieto y legible.
 */

const CYCLE = 6.4;

function useWires(rootRef, deps) {
  const [geo, setGeo] = useState(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const measure = () => {
      const wires = root.querySelectorAll('.fd__wire');
      if (wires.length < 2) return;
      const core = root.querySelector('.fd__core').getBoundingClientRect();
      const out = [];
      wires.forEach((w, side) => {
        const r = w.getBoundingClientRect();
        const chips = root.querySelectorAll(side === 0 ? '.fd__in .fd__chip' : '.fd__out .fd__chip');
        const ys = [...chips].map((c) => {
          const b = c.getBoundingClientRect();
          return b.top + b.height / 2 - r.top;
        });
        out.push({ w: r.width, h: r.height, ys, cy: core.top + core.height / 2 - r.top });
      });
      setGeo(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return geo;
}

function Wire({ g, side, paused, n }) {
  const svg = useRef(null);
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el?.pauseAnimations) return;
    if (paused) el.pauseAnimations();
    else el.unpauseAnimations();
  }, [paused, g]);

  if (!g) return <div className={`fd__wire fd__wire--${side}`} />;
  const { w, h, ys, cy } = g;
  const paths = ys.map((y) =>
    side === 'in'
      ? `M 0 ${y.toFixed(1)} C ${(w * 0.55).toFixed(1)} ${y.toFixed(1)}, ${(w * 0.45).toFixed(1)} ${cy.toFixed(1)}, ${w.toFixed(1)} ${cy.toFixed(1)}`
      : `M 0 ${cy.toFixed(1)} C ${(w * 0.55).toFixed(1)} ${cy.toFixed(1)}, ${(w * 0.45).toFixed(1)} ${y.toFixed(1)}, ${w.toFixed(1)} ${y.toFixed(1)}`
  );
  return (
    <div className={`fd__wire fd__wire--${side}`}>
      <svg ref={svg} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden="true">
        {paths.map((d, i) => {
          // fase de este pulso dentro del ciclo
          const start = side === 'in' ? 0.03 + i * (0.2 / Math.max(1, n)) : 0.63 + i * (0.16 / Math.max(1, n));
          const begin = `${(start * CYCLE).toFixed(2)}s`;
          return (
            <g key={i}>
              <path d={d} className="fd__path" />
              <path d={d} className="fd__path fd__path--glow" style={{ '--d': begin }} />
              <circle r="4" className="fd__dot" opacity="0">
                <animateMotion dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" path={d} keyPoints="0;1;1" keyTimes="0;0.16;1" calcMode="linear" />
                <animate attributeName="opacity" dur={`${CYCLE}s`} begin={begin} repeatCount="indefinite" values="1;1;0;0" keyTimes="0;0.16;0.17;1" />
              </circle>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Chip({ item, side, i, n }) {
  // las entradas se encienden al salir su pulso; las salidas, cuando les llega
  const start = side === 'in' ? 0.03 + i * (0.2 / Math.max(1, n)) : 0.63 + i * (0.16 / Math.max(1, n)) + 0.16;
  // logos reales de la herramienta (Gmail, Odoo…); si no hay, icono
  const logos = item.logos ?? (item.logo ? [item.logo] : []);
  return (
    <div className={`fd__chip fd__chip--${side}`} style={{ '--d': `${-(CYCLE - start * CYCLE).toFixed(2)}s`, '--i': i }}>
      {logos.length > 0 ? (
        <span className={`fd__logos fd__logos--${logos.length}`}>
          {logos.map((l) => (
            <BrandLogo key={l} id={l} size="s" />
          ))}
        </span>
      ) : (
        <span className="fd__icon">{item.mti ? <MtiIcon name={item.mti} /> : <Icon name={item.icon ?? 'spark'} />}</span>
      )}
      <span className="fd__text">
        <b>{item.label}</b>
        {item.sub && <em>{item.sub}</em>}
      </span>
      {side === 'out' && (
        <span className="fd__tick" aria-hidden="true">
          <Icon name="check" />
        </span>
      )}
    </div>
  );
}

export default function FlowDiagram({ inputs, core, outputs, labels, paused = false, className = '', compact = false, size = 'm' }) {
  const root = useRef(null);
  const geo = useWires(root, [inputs.length, outputs.length, core.steps?.length, compact, size]);
  const steps = core.steps ?? [];

  return (
    <div ref={root} className={`fd fd--${size}${paused ? ' is-paused' : ''}${compact ? ' fd--compact' : ''} ${className}`.trim()} style={{ '--cyc': `${CYCLE}s` }}>
      <div className="fd__heads" aria-hidden="true">
        <span>{labels?.in ?? 'Entrada'}</span>
        <span>{labels?.core ?? 'MTi'}</span>
        <span>{labels?.out ?? 'Salida'}</span>
      </div>

      <div className="fd__col fd__in">
        {inputs.map((it, i) => (
          <Chip key={it.label} item={it} side="in" i={i} n={inputs.length} />
        ))}
      </div>

      <Wire g={geo?.[0]} side="in" paused={paused} n={inputs.length} />

      <div className="fd__core">
        <div className="fd__core-glow" aria-hidden="true" />
        <div className="fd__core-scan" aria-hidden="true" />
        <div className="fd__core-head">
          {core.icon && (
            <span className="fd__core-icon">
              {core.mti ? <MtiIcon name={core.mti} /> : <Icon name={core.icon} />}
            </span>
          )}
          <span>
            {core.kicker && <em>{core.kicker}</em>}
            <strong>{core.title}</strong>
          </span>
        </div>
        {steps.length > 0 && (
          <ol className="fd__steps">
            {steps.map((st, k) => {
              const at = 0.28 + (k * 0.34) / steps.length;
              return (
                <li key={st} style={{ '--d': `${-(CYCLE - at * CYCLE).toFixed(2)}s` }}>
                  <span>{k + 1}</span>
                  {st}
                </li>
              );
            })}
          </ol>
        )}
        <div className="fd__progress" aria-hidden="true">
          <i />
        </div>
        {(core.logos?.length > 0 || core.agents?.length > 0) && (
          <div className="fd__core-foot">
            {core.agents?.map((a) => (
              <span key={a} className="fd__agent" title={a}>
                <MtiIcon name={`ag-${a}`} />
                {a}
              </span>
            ))}
            {core.logos?.map((l) => (
              <BrandLogo key={l} id={l} size="xs" />
            ))}
          </div>
        )}
        {core.tags?.length > 0 && (
          <div className="fd__tags">
            {core.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        )}
      </div>

      <Wire g={geo?.[1]} side="out" paused={paused} n={outputs.length} />

      <div className="fd__col fd__out">
        {outputs.map((it, i) => (
          <Chip key={it.label} item={it} side="out" i={i} n={outputs.length} />
        ))}
      </div>
    </div>
  );
}
