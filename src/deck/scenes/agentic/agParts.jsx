import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useDeck, MtiIcon, Icon, Counter } from '../../parts.jsx';
import { chapterIndex } from '../../../data/tracks.js';

/**
 * Piezas comunes del recorrido Agentify AI.
 *
 * Las «vistas de producto» reproducen, animadas, las maquetas que trae la
 * presentación para cada agente (borrador de correo, hoja de pre-cierre…).
 * Los datos son los ejemplos de la propia diapositiva y se rotulan siempre
 * como vista ilustrativa.
 */

export const useAg = () => useDeck().AGENTIFY;

/** Índice de capítulo dentro del recorrido Agentify, por id. */
export const agChapter = (id) => chapterIndex('agentify', id);

/**
 * Caja que siempre cabe: si su contenido es más alto que el hueco (pantallas
 * bajas, portátiles pequeños), lo escala entero en vez de cortarlo.
 */
export function FitBox({ className = '', children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return undefined;
    const fit = () => {
      const need = i.scrollHeight;
      const room = o.clientHeight;
      setK(need > room + 1 ? Math.max(0.6, room / need) : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className={`fitbox ${className}`.trim()}>
      <div ref={inner} className="fitbox__inner" style={k < 1 ? { transform: `scale(${k})`, width: `${100 / k}%` } : undefined}>
        {children}
      </div>
    </div>
  );
}

/** Insignia de agente: icono de la presentación + código. */
export function AgentBadge({ id, short, active, onClick, role, className = '' }) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag className={`ag-badge${active ? ' is-on' : ''} ${className}`.trim()} onClick={onClick} aria-pressed={onClick ? Boolean(active) : undefined}>
      <MtiIcon name={`ag-${id}`} />
      <b>{id}</b>
      {short && <span>{short}</span>}
      {role && <em>{role}</em>}
    </Tag>
  );
}

/** Texto que se escribe solo. En pausa o con movimiento reducido, entero. */
export function useTyping(text, { paused, delay = 600, cps = 38 } = {}) {
  const [n, setN] = useState(paused ? text.length : 0);
  useEffect(() => {
    if (paused) {
      setN(text.length);
      return undefined;
    }
    setN(0);
    let raf;
    let t0 = null;
    const tick = (now) => {
      if (t0 === null) t0 = now + delay;
      const k = Math.max(0, Math.floor(((now - t0) / 1000) * cps));
      setN(Math.min(text.length, k));
      if (k < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return { shown: text.slice(0, n), done: n >= text.length };
}

function Typed({ text, paused, delay, cps, className = '' }) {
  const { shown, done } = useTyping(text, { paused, delay, cps });
  return (
    <p className={`mk-typed${done ? ' is-done' : ''} ${className}`.trim()}>
      {shown}
      <i className="mk-caret" aria-hidden="true" />
    </p>
  );
}

/** Temporizador de llamada que sigue corriendo desde el valor de la maqueta. */
function CallTimer({ start, paused }) {
  const [sec, setSec] = useState(() => {
    const [m, s] = start.split(':').map(Number);
    return m * 60 + s;
  });
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setSec((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [paused]);
  return <>{`${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`}</>;
}

/* ------------------------------------------------------------------ */
/* Vistas de producto                                                  */
/* ------------------------------------------------------------------ */

export function AgentMockup({ mockup: m, paused, label, title }) {
  if (!m) return null;
  let body = null;

  switch (m.kind) {
    case 'email':
      body = (
        <>
          <div className="mk-mail">
            <span className="mk-avatar">
              <Icon name="mail" />
            </span>
            <div>
              <em>{m.from}</em>
              <p>{m.message}</p>
            </div>
          </div>
          <div className="mk-draft">
            <span className="mk-label">
              <Icon name="spark" />
              {m.draftLabel}
            </span>
            <Typed text={m.draft} paused={paused} delay={900} />
          </div>
          <div className="mk-actions">
            <span className="mk-btn mk-btn--go">
              <Icon name="check" />
              {m.approve}
            </span>
            <span className="mk-btn">{m.edit}</span>
          </div>
        </>
      );
      break;

    case 'tender':
      body = (
        <>
          <dl className="mk-rows">
            {m.rows.map(([k, v], i) => (
              <div key={k} style={{ '--i': i }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mk-verdict">
            <span>{m.verdictLabel}</span>
            <b>
              {m.verdict}
              <Icon name="check" />
            </b>
          </div>
          <p className="mk-note">
            <Icon name="alert" />
            {m.note}
          </p>
        </>
      );
      break;

    case 'call':
      body = (
        <>
          <div className="mk-call">
            <span className="mk-live">
              <i />
              {m.live} · <CallTimer start={m.time} paused={paused} />
            </span>
            <div className="mk-wave" aria-hidden="true">
              {Array.from({ length: 28 }, (_, i) => (
                <i key={i} style={{ '--i': i, '--h': `${30 + ((i * 37) % 60)}%` }} />
              ))}
            </div>
          </div>
          <dl className="mk-rows">
            <div style={{ '--i': 0 }}>
              <dt>{m.callerLabel}</dt>
              <dd>{m.caller}</dd>
            </div>
          </dl>
          <div className="mk-draft">
            <span className="mk-label">
              <Icon name="mic" />
              {m.transcriptLabel}
            </span>
            <Typed text={m.transcript} paused={paused} delay={700} cps={30} />
          </div>
        </>
      );
      break;

    case 'crm':
      body = (
        <>
          <div className="mk-kpis">
            {m.kpis.map(([v, l], i) => (
              <div key={l} style={{ '--i': i }} className={i === 2 ? 'is-alert' : ''}>
                <b>
                  <Counter value={v} run={!paused} duration={1300} />
                </b>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <div className="mk-activity">
            <span className="mk-label">{m.lastLabel}</span>
            <p>
              <Icon name="route" />
              {m.last}
            </p>
          </div>
        </>
      );
      break;

    case 'order':
      body = (
        <>
          <dl className="mk-rows">
            <div style={{ '--i': 0 }}>
              <dt>{m.clientLabel}</dt>
              <dd>{m.client}</dd>
            </div>
          </dl>
          <ul className="mk-lines">
            {m.lines.map(([ref, qty, st], i) => (
              <li key={ref} className={`is-${st}`} style={{ '--i': i }}>
                <span>{ref}</span>
                <b>{qty}</b>
                <Icon name={st === 'ok' ? 'check' : 'alert'} />
              </li>
            ))}
          </ul>
          <div className="mk-verdict mk-verdict--warn">
            <span>{m.statusLabel}</span>
            <b>{m.status}</b>
            <em className="mk-btn">{m.action}</em>
          </div>
        </>
      );
      break;

    case 'delivery':
      body = (
        <>
          <dl className="mk-rows">
            {m.rows.map(([k, v], i) => (
              <div key={k} style={{ '--i': i }}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mk-steps">
            <span style={{ '--i': 0 }}>
              <Icon name="send" />
              {m.sent}
            </span>
            <span style={{ '--i': 1 }}>
              <Icon name="check" />
              {m.ack}
            </span>
          </div>
          <div className="mk-rec">
            <span className="mk-label">{m.recLabel}</span>
            <p>
              <b>
                <Counter value={m.rec[0]} run={!paused} />
              </b>{' '}
              {m.rec[1]} · <em>{m.rec[2]}</em>
            </p>
            <div className="mk-rec__bar" aria-hidden="true">
              <i />
            </div>
          </div>
        </>
      );
      break;

    case 'rag':
      body = (
        <>
          <div className="mk-q">
            <span className="mk-label">{m.title}</span>
            <p>{m.question}</p>
          </div>
          <div className="mk-draft">
            <span className="mk-label">
              <Icon name="book" />
              {m.answerLabel}
            </span>
            <Typed text={m.answer} paused={paused} delay={900} />
          </div>
          <ol className="mk-sources">
            {m.sources.map((x, i) => (
              <li key={x} style={{ '--i': i }}>
                <span>{i + 1}</span>
                {x}
              </li>
            ))}
          </ol>
        </>
      );
      break;

    case 'nc':
      body = (
        <>
          <div className="mk-nc">
            <span className="mk-sev">{m.severity}</span>
            <b>{m.code}</b>
            <em>{m.area}</em>
          </div>
          <p className="mk-finding">
            <Icon name="gauge" />
            {m.finding}
          </p>
          <dl className="mk-rows">
            <div style={{ '--i': 0 }}>
              <dt>{m.productLabel}</dt>
              <dd>{m.product}</dd>
            </div>
            <div style={{ '--i': 1 }}>
              <dt>SLA</dt>
              <dd>{m.sla}</dd>
            </div>
          </dl>
          <div className="mk-q">
            <span className="mk-label">{m.normLabel}</span>
            <ol className="mk-sources">
              {m.norms.map((x, i) => (
                <li key={x} style={{ '--i': i }}>
                  <span>§</span>
                  {x}
                </li>
              ))}
            </ol>
          </div>
        </>
      );
      break;

    default:
      return null;
  }

  return (
    <div className={`mockup mockup--${m.kind}${paused ? ' is-paused' : ''}`}>
      <header className="mockup__head">
        <span className="mockup__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <strong>{m.kind === 'rag' ? title : m.title}</strong>
        <em>{label}</em>
      </header>
      <div className="mockup__body">{body}</div>
    </div>
  );
}
