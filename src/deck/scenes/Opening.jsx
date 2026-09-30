import React from 'react';
import { useStore } from '../../store.js';
import { Kicker, Headline, CityPin, Counter, MtiIcon, Swap, useGlider, useDeck } from '../parts.jsx';
import { PILLAR_STEPS } from '../choreography.js';

/**
 * Capítulo 1 · MTI en una frase.
 *
 * 0  el logo se construye con partículas (en el lienzo 3D) y aparece el claim
 * 1  la cámara atraviesa el logo y aterriza sobre Barcelona
 * 2-5 los cuatro pilares: columnas y hologramas en el lienzo 3D
 * 6  las cifras de grupo aparecen ancladas sobre edificios
 */

const PILLAR_ICON = { mission: 'pillar-mission', 'end-to-end': 'pillar-end-to-end', platforms: 'pillar-platforms', roi: 'pillar-roi' };

export default function Opening({ step, goto, openInfo }) {
  const deck = useDeck();
  const sc = deck.SCENES.opening;
  const o = deck.OPENING;
  const cityLive = useStore((s) => s.cityLive);
  const pillarId = PILLAR_STEPS[step];
  const pillarIdx = o.pillars.findIndex((p) => p.id === pillarId);
  const railRef = useGlider(pillarIdx);

  return (
    <div className={`scene scene--opening s${step}`}>
      {/* 0 · el claim, bajo el logo de partículas */}
      <div className={`op-claim${step === 0 ? ' is-on' : ''}`}>
        <Kicker>{o.kicker}</Kicker>
        <p className="op-claim__en">{sc.claim}</p>
        <p className="op-claim__sub">{sc.claimSub}</p>
        <p className="op-claim__facts">
          {sc.facts.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </p>
      </div>

      {/* cada tramo releva al anterior con un fundido: nada desaparece de golpe */}
      <Swap id={step === 1 ? 'arrival' : pillarId ?? (step === 6 ? 'metrics' : 'none')}>
      {/* 1 · llegada a la ciudad */}
      {step === 1 && (
        <div className="scene-lead" key="arrival">
          <Kicker>{deck.CONTACT.hq}</Kicker>
          <Headline parts={sc.arrival} size="xl" />
          <p className="scene-lead__line">{sc.arrivalLine}</p>
          <div className="op-divisions">
            {o.divisions.map((d, i) => (
              <button key={d.id} className="op-division" style={{ '--i': i }} onClick={() => openInfo('division', d.id)}>
                <em>{d.label}</em>
                <strong>{d.title}</strong>
                <span>{d.tags.join(' · ')}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2-5 · pilares: el holograma está en el lienzo 3D; aquí, el relato */}
      {pillarId && (
        <div className="pillar-copy">
          <span className="pillar-copy__num" aria-hidden="true">
            {o.pillars[pillarIdx].num}
          </span>
          <div className="pillar-copy__meta">
            <span className="pillar-copy__icon">
              <MtiIcon name={PILLAR_ICON[pillarId]} />
            </span>
            <Kicker>
              {sc.pillarsLabel} · {pillarIdx + 1}/{o.pillars.length}
            </Kicker>
          </div>
          <Headline parts={[o.pillars[pillarIdx].title]} size="xl" className="pillar-copy__title" />
          <p className="pillar-copy__head">{sc.pillars[pillarId].head}</p>
          <p className="pillar-copy__line">{sc.pillars[pillarId].line}</p>
          {pillarId === 'roi' && sc.pillarViz?.roi?.note && <p className="pillar-copy__note">{sc.pillarViz.roi.note}</p>}
        </div>
      )}

      {/* 6 · cifras sobre edificios */}
      {step === 6 && (
        <>
          <div className="scene-lead scene-lead--top">
            <Headline parts={sc.metricsHead} size="xl" />
          </div>
          {/* sin ciudad (equipo sin WebGL) las cifras se ordenan en rejilla */}
          {!cityLive && (
            <div className="metric-wall">
              {sc.metrics.map((m, i) => (
                <div key={m.id} style={{ '--i': i }}>
                  <strong>
                    <Counter value={m.value} />
                  </strong>
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          )}
          {sc.metrics.map((m, i) => (
            <CityPin key={m.id} solution={m.anchor} lift={40} tone="metric" delay={i * 180}>
              <strong>
                <Counter value={m.value} />
              </strong>
              <span>{m.label}</span>
            </CityPin>
          ))}
        </>
      )}
      </Swap>

      {(pillarId || step === 6) && (
        <nav className="pillar-rail has-glider" ref={railRef} aria-label={sc.pillarsLabel}>
          {o.pillars.map((p, i) => (
            <button
              key={p.id}
              className={`pillar-rail__item${p.id === pillarId ? ' is-active' : ''}${step === 6 || i < pillarIdx ? ' is-done' : ''}`}
              onClick={() => goto(0, 2 + i)}
            >
              <MtiIcon name={PILLAR_ICON[p.id]} />
              <span>{p.title}</span>
            </button>
          ))}
        </nav>
      )}

    </div>
  );
}
