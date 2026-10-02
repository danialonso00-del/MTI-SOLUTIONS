import React, { useEffect, useState } from 'react';
import Icon from '../components/icons.jsx';
import { MtiIcon, Photo } from './parts.jsx';

/**
 * El reel de un proyecto: un monitor con una foto real y, debajo, los cuatro
 * tiempos de lo que se hizo (instalamos → captamos → integramos → resultado),
 * que avanzan solos. Lo que se dibuja sobre el monitor cambia con el tiempo
 * activo: primero aparecen los equipos, luego lo que captan, luego el sistema
 * que lo integra y por último el resultado.
 *
 * Todo lo que aparece en el monitor es ilustrativo y se rotula así.
 */

const STAGE_MS = 3600;

function useStage(n, paused, key) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    setStage(0);
  }, [key]);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setStage((s) => (s + 1) % n), STAGE_MS);
    return () => clearInterval(id);
  }, [n, paused, key]);
  return [stage, setStage];
}

function useClock(paused) {
  const [t, setT] = useState(() => new Date());
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setT(new Date()), 1000);
    return () => clearInterval(id);
  }, [paused]);
  return t.toLocaleTimeString('es-ES', { hour12: false });
}

/* recuadros de detección: sitio fijo para cada etiqueta, en % del monitor */
const BOXES = [
  { x: 14, y: 30, w: 20, h: 44 },
  { x: 46, y: 22, w: 17, h: 38 },
  { x: 70, y: 40, w: 18, h: 42 },
];

function Overlay({ type, tags, stage }) {
  if (type === 'cctv') {
    return (
      <div className={`reel-ov reel-ov--cctv s${stage}`}>
        {tags.map((t, i) => {
          const b = BOXES[i % BOXES.length];
          return (
            <span key={t} className="reel-box" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, '--i': i }}>
              <em>{t}</em>
            </span>
          );
        })}
        <span className="reel-scan" />
      </div>
    );
  }
  if (type === 'route') {
    return (
      <div className={`reel-ov reel-ov--route s${stage}`}>
        <svg viewBox="0 0 100 60" preserveAspectRatio="none">
          <path d="M 6 50 C 20 44, 22 30, 34 30 S 52 42, 62 30 S 78 12, 94 14" className="reel-route" />
          {[
            [6, 50],
            [34, 30],
            [62, 30],
            [94, 14],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.6" className="reel-stop" style={{ '--i': i }} />
          ))}
          <circle r="1.4" className="reel-truck">
            <animateMotion dur="7s" repeatCount="indefinite" path="M 6 50 C 20 44, 22 30, 34 30 S 52 42, 62 30 S 78 12, 94 14" />
          </circle>
        </svg>
        <div className="reel-tags">
          {tags.map((t, i) => (
            <span key={t} style={{ '--i': i }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }
  // telemetría, capas de mando y sensores: una columna de lecturas que se encienden
  return (
    <div className={`reel-ov reel-ov--list reel-ov--${type} s${stage}`}>
      <ul>
        {tags.map((t, i) => (
          <li key={t} style={{ '--i': i }}>
            <i />
            <span>{t}</span>
            <b className="reel-bar">
              <u style={{ '--w': `${40 + ((i * 29) % 50)}%` }} />
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ProjectReel({ id, reel, ui, paused }) {
  const [stage, setStage] = useStage(reel.steps.length, paused, id);
  const clock = useClock(paused);
  const step = reel.steps[stage];

  return (
    <section className={`reel${paused ? ' is-paused' : ''}`} key={id} aria-label={ui.kicker}>
      <header className="reel__head">
        <span className="reel__kicker">{ui.kicker}</span>
        <span className="reel__illus">{ui.illustrative}</span>
      </header>

      <div className="reel__screen">
        <Photo id={reel.feed} kenBurns eager className="reel__feed" sizes="(max-width: 900px) 100vw, 40vw" />
        <Overlay type={reel.monitor} tags={reel.tags} stage={stage} />
        <div className="reel__hud" aria-hidden="true">
          <span className="reel__rec">
            <i />
            {ui.live}
          </span>
          <span className="reel__cam">{reel.cam}</span>
          <span className="reel__time">{clock}</span>
          <i className="reel__corner reel__corner--tl" />
          <i className="reel__corner reel__corner--tr" />
          <i className="reel__corner reel__corner--bl" />
          <i className="reel__corner reel__corner--br" />
        </div>
        {/* el tiempo activo, grande, sobre el monitor */}
        <div className="reel__caption" key={stage}>
          <span className="reel__caption-icon">{step.mti ? <MtiIcon name={step.mti} /> : <Icon name={step.icon} />}</span>
          <div>
            <em>
              {String(stage + 1).padStart(2, '0')} · {step.label}
            </em>
            <strong>{step.text}</strong>
          </div>
        </div>
      </div>

      <ol className="reel__steps">
        {reel.steps.map((s, i) => (
          <li key={s.label} className={`${i === stage ? 'is-on' : ''}${i < stage ? ' is-done' : ''}`}>
            <button onClick={() => setStage(i)}>
              <span className="reel__step-icon">{s.mti ? <MtiIcon name={s.mti} /> : <Icon name={s.icon} />}</span>
              <span>{s.label}</span>
              <i className="reel__progress" style={{ animationDuration: `${STAGE_MS}ms` }} />
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
