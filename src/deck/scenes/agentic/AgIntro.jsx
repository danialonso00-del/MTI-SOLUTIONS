import React, { useEffect, useState } from 'react';
import { Kicker, Headline, Counter, LogoPlate, MtiIcon, Icon, Swap, BrandLogo } from '../../parts.jsx';
import { CONNECTOR_LOGO } from '../../../data/logos.js';
import { useAg } from './agParts.jsx';

/**
 * Agentify AI · 1 · IA que actúa.
 *
 *   0  portada: el titular, cuatro cifras y los clientes pasando
 *   1  lo que creemos: un chat se queda en la respuesta; un agente sigue
 *      trabajando dentro de los sistemas (comparación animada)
 *   2  qué es la IA agentiva: cuatro rasgos
 */

// clientes de la portada de la presentación, con logo disponible
const COVER_LOGOS = [
  'client-copegal',
  'client-ferri',
  'client-rcfil',
  'ag-logo-regenasa',
  'client-galmetec',
  'client-radiovigo',
  'ag-logo-promega',
  'ag-logo-ucalsa',
  'client-galpi',
  'client-sergas',
  'ag-logo-frioteis',
  'ag-logo-aspol',
];

const WORK_ICONS = ['mail', 'database', 'send', 'check'];

/** Un chat responde y se acaba; el agente encadena acciones en los sistemas. */
function ChatVsAgent({ belief, paused }) {
  const [k, setK] = useState(paused ? belief.work.length : 0);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setK((x) => (x + 1) % (belief.work.length + 3)), 900);
    return () => clearInterval(id);
  }, [paused, belief.work.length]);
  const lit = Math.min(k, belief.work.length);
  return (
    <div className="cva">
      <div className="cva__col cva__col--chat">
        <span className="cva__label">{belief.chatLabel}</span>
        {belief.chat.map((x, i) => (
          <span key={x} className={`cva__bubble${i === belief.chat.length - 1 ? ' is-end' : ''}${i % 2 ? ' is-them' : ''}`} style={{ '--i': i }}>
            {x}
          </span>
        ))}
      </div>
      <div className="cva__col cva__col--agent">
        <span className="cva__label">{belief.workLabel}</span>
        {belief.work.map((x, i) => (
          <span key={x} className={`cva__step${i < lit ? ' is-done' : ''}${i === lit ? ' is-now' : ''}`} style={{ '--i': i }}>
            <i>
              <Icon name={i < lit ? 'check' : WORK_ICONS[i]} />
            </i>
            {x}
            {belief.workLogos?.[i]?.length > 0 && (
              <span className="cva__logos">
                {belief.workLogos[i].map((l) => (
                  <BrandLogo key={l} id={l} size="xs" />
                ))}
              </span>
            )}
          </span>
        ))}
        <span className="cva__track" aria-hidden="true">
          <i style={{ transform: `scaleY(${lit / belief.work.length})` }} />
        </span>
      </div>
    </div>
  );
}

export default function AgIntro({ step, paused }) {
  const ag = useAg();
  const it = ag.INTRO;

  return (
    <div className={`scene scene--ag-intro s${step}`}>
      <Swap id={`s${step}`}>
        {step === 0 && (
          <>
            <div className="scene-lead scene-lead--left ag-cover" key="cover">
              <Kicker>{it.kicker}</Kicker>
              <Headline parts={it.title} size="xxl" as="h1" />
              <p className="ag-cover__line">{it.line}</p>
              <p className="scene-lead__body">{it.lead}</p>
              <div className="ag-stats">
                {it.stats.map((s, i) => (
                  <div key={s.label} className="ag-stat" style={{ '--i': i }}>
                    <strong>
                      <Counter value={s.value} run={!paused} />
                      {s.unit && <small>{s.unit}</small>}
                    </strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`logo-marquee${paused ? ' is-paused' : ''}`} aria-hidden="true">
              <div className="logo-marquee__track">
                {[...COVER_LOGOS, ...COVER_LOGOS].map((id, i) => (
                  <LogoPlate key={`${id}-${i}`} id={id} />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="scene-lead scene-lead--left ag-belief" key="belief">
            <Kicker>{it.belief.kicker}</Kicker>
            <Headline parts={it.belief.title} size="l" />
            <p className="scene-lead__body">{it.belief.body}</p>
            <ChatVsAgent belief={it.belief} paused={paused} />
            <div className="ag-promises">
              {it.belief.promises.map((p, i) => (
                <div key={p.id} className="ag-promise" style={{ '--i': i }}>
                  <Icon name={p.icon} />
                  <span>
                    {p.num} · {p.label}
                  </span>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="scene-lead scene-lead--left ag-traits-lead" key="traits-lead">
              <Kicker>{it.traits.kicker}</Kicker>
              <Headline parts={it.traits.title} size="xl" />
            </div>
            <div className="ag-traits" key="traits">
              {it.traits.items.map((t, i) => (
                <article key={t.id} className="ag-trait" style={{ '--i': i }}>
                  <span className="ag-trait__icon">
                    <MtiIcon name={`ag-${t.id}`} />
                  </span>
                  <span className="ag-trait__num">
                    {t.num} · {t.label}
                  </span>
                  <h3>{t.head}</h3>
                  <p>{t.body}</p>
                  {t.id === 'integrated' && (
                    <div className="ag-connectors ag-connectors--logos">
                      {ag.CONNECTORS.map((c, k) => (
                        <span key={c} style={{ '--k': k }}>
                          {CONNECTOR_LOGO[c] ? <BrandLogo id={CONNECTOR_LOGO[c]} size="xs" /> : <Icon name={c === 'IoT' ? 'sensor' : 'mail'} />}
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </Swap>
    </div>
  );
}
