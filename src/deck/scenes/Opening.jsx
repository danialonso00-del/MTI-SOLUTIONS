import React from 'react';
import { useStore } from '../../store.js';
import { Kicker, Headline, CityPin, Counter, Swap, useDeck } from '../parts.jsx';
import HowStory from '../HowStory.jsx';

/**
 * Capítulo 1 · MTI en una frase.
 *
 * 0   el logo se construye con partículas (en el lienzo 3D) y aparece el claim
 * 1   la cámara atraviesa el logo y aterriza sobre Barcelona
 * 2   ¿cómo?: una secuencia que se reproduce sola (HowStory) — la necesidad,
 *     entra MTi, hardware y software, instalación y mantenimiento, industrias
 * 3   las cifras de grupo aparecen ancladas sobre edificios
 */

const INDUSTRY_ICON = {
  security: 'shield',
  'smart-cities': 'city',
  'industry-naval': 'factory',
  cybersecurity: 'lock',
  venues: 'stadium',
  transport: 'bus',
  water: 'gauge',
  datacenter: 'database',
  telecom: 'signal',
  health: 'people',
  public: 'building',
  retail: 'cart',
};

export default function Opening({ step, paused, goto, openInfo }) {
  const deck = useDeck();
  const sc = deck.SCENES.opening;
  const o = deck.OPENING;
  const cityLive = useStore((s) => s.cityLive);
  const how = sc.how;
  // industrias: las seis del capítulo 3 y las de «también damos servicio a»
  const industries = [
    ...deck.SECTORS.map((x) => ({ label: x.title, icon: INDUSTRY_ICON[x.id] ?? 'grid' })),
    ...deck.SECTORS_ALSO.map((x) => ({ label: x.label, icon: INDUSTRY_ICON[x.id] ?? 'grid' })),
  ];

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
      <Swap id={step === 1 ? 'arrival' : step === 3 ? 'metrics' : 'none'}>
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

      {/* 3 · cifras sobre edificios */}
      {step === 3 && (
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

      {/* 2 · ¿cómo?: se reproduce sola, sin pasar pasos */}
      {step === 2 && <HowStory data={sc.how} industries={industries} paused={paused} />}
    </div>
  );
}
