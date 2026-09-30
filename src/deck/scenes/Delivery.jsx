import React from 'react';
import { Kicker, Headline, Photo, MtiIcon, SolutionButton, Icon, useDeck, useDeckUi , Swap } from '../parts.jsx';

/**
 * Capítulo 4 · cómo entrega MTI (la infraestructura se construye en el lienzo 3D).
 *
 * Cada paso añade una capa a la obra y en ese momento entra la línea de
 * servicio que la hace posible: nunca aparecen las ocho de golpe. Las cuatro
 * líneas con desarrollo propio en la presentación (CCTV, integración,
 * mantenimiento, transformación) entran como ventana fotográfica con su dato.
 */

const SERVICE_ICON = {
  design: 'service-design',
  install: 'service-install',
  iot: 'service-iot',
  ai: 'service-ai',
  twin: 'service-twin',
  smartcity: 'service-smartcity',
  cert: 'service-cert',
  om: 'service-om',
};

const FEATURE_PHOTO = {
  cctv: 'service-cctv',
  integration: 'service-integration',
  maintenance: 'service-maintenance',
  // la diapositiva de transformación digital no tiene fotografía: solo sus iconos
};

const MAINT_ICONS = ['maint-preventive', 'maint-corrective', 'maint-predictive', 'maint-warranty'];
const LEVER_ICONS = ['lever-process', 'lever-data', 'lever-ai', 'lever-people', 'lever-compliance'];

export default function Delivery({ step, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const sc = deck.SCENES.delivery;
  const beat = sc.beats[Math.min(step, sc.beats.length - 1)];
  const lines = beat.lines.map((id) => deck.SERVICE_LINES.find((l) => l.id === id)).filter(Boolean);
  const feature = beat.feature ? deck.SERVICE_FEATURES.find((f) => f.id === beat.feature) : null;
  const done = sc.beats.slice(0, step + 1).flatMap((b) => b.lines);

  return (
    <div className={`scene scene--delivery s${step}`}>
      {/* etapas: diseñar → desplegar → integrar → operar */}
      <ol className="stages" aria-label={deck.DELIVERY_META.cycleTitle}>
        {sc.stages.map((s, i) => (
          <li key={s} className={`${i === beat.stage ? 'is-active' : ''}${i < beat.stage ? ' is-done' : ''}`}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
        <i className="stages__fill" style={{ '--p': (beat.stage + 1) / sc.stages.length }} />
      </ol>

      <Swap id={`b${step}`}>
      <div className="scene-lead scene-lead--left scene-lead--low">
        <Kicker>
          {deck.DELIVERY_META.kicker} · {step + 1}/{sc.beats.length}
        </Kicker>
        <Headline parts={[beat.head]} size="l" />
        <ul className="service-list">
          {lines.map((l, i) => (
            <li key={l.id} style={{ '--i': i }}>
              <MtiIcon name={SERVICE_ICON[l.id]} />
              <div>
                <strong>{l.title}</strong>
                <span>{l.body}</span>
              </div>
            </li>
          ))}
        </ul>
        {step === sc.beats.length - 1 && (
          <div className="service-all">
            {deck.SERVICE_LINES.map((l, i) => (
              <span key={l.id} style={{ '--i': i }} className={done.includes(l.id) ? 'is-on' : ''}>
                <MtiIcon name={SERVICE_ICON[l.id]} />
                {l.title}
              </span>
            ))}
          </div>
        )}
      </div>

      {feature && (
        <aside className={`feature-window${FEATURE_PHOTO[feature.id] ? '' : ' feature-window--nophoto'}`}>
          {FEATURE_PHOTO[feature.id] && <Photo id={FEATURE_PHOTO[feature.id]} depth={1.2} kenBurns eager className="feature-window__photo" />}
          <div className="feature-window__body">
            <Kicker>{feature.num}</Kicker>
            <h3>{feature.title}</h3>
            <p className="feature-window__claim">{feature.claim}</p>
            {feature.id === 'maintenance' && (
              <div className="feature-modes">
                {feature.chips.map((c, i) => (
                  <span key={c} style={{ '--i': i }}>
                    <MtiIcon name={MAINT_ICONS[i]} />
                    {c}
                  </span>
                ))}
              </div>
            )}
            {feature.id === 'transformation' && (
              <div className="feature-modes">
                {feature.chips.map((c, i) => (
                  <span key={c} style={{ '--i': i }}>
                    <MtiIcon name={LEVER_ICONS[i]} />
                    {c}
                  </span>
                ))}
              </div>
            )}
            {(feature.id === 'cctv' || feature.id === 'integration') && (
              <div className="feature-chips">
                {feature.chips.map((c, i) => (
                  <span key={c} style={{ '--i': i }}>
                    {c}
                  </span>
                ))}
              </div>
            )}
            <p className="feature-window__footer">{feature.footer}</p>
            <div className="scene-actions">
              <SolutionButton id={feature.solution} compact />
              <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => openInfo('feature', feature.id)}>
                <Icon name="doc" />
                <span>{ui.more}</span>
              </button>
            </div>
          </div>
        </aside>
      )}
      </Swap>
    </div>
  );
}

/** Rótulos de las líneas de servicio dentro de la obra 3D, en su momento. */
export function buildLabels(deck, step, positions) {
  const beats = deck.SCENES.delivery.beats;
  const out = [];
  beats.forEach((b, i) => {
    b.lines.forEach((id) => {
      const l = deck.SERVICE_LINES.find((x) => x.id === id);
      if (!l || !positions[id] || i > step) return;
      out.push({ id, pos: positions[id], text: l.title, icon: null, on: i === step });
    });
  });
  return out;
}
