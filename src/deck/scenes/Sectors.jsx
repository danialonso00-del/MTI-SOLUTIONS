import React from 'react';
import { useStore } from '../../store.js';
import { Kicker, Headline, Photo, CityPin, SolutionButton, MtiIcon, Telemetry, Icon, useDeck, useDeckUi , Swap, useGlider } from '../parts.jsx';
import { SECTOR_STEPS, SECTOR_ZONES } from '../choreography.js';
import FlowDiagram from '../FlowDiagram.jsx';

/**
 * Capítulo 3 · la ciudad dividida en zonas.
 *
 * Los sectores con caso de uso en la ciudad (seguridad, smart cities, recintos,
 * transportes) se cuentan sobre la propia ciudad: la cámara vuela a su zona y
 * se enciende su sistema. Industria y ciberseguridad no tienen zona en la
 * ciudad: se cuentan con su fotografía, telemetría y una red con tráfico
 * bloqueado, sin inventar un caso que no existe.
 */

/* fotos de 2.400 px (las de la presentación, de 440 px, no aguantan la altura completa) */
const SECTOR_PHOTO = {
  security: 'stock-sector-security',
  'smart-cities': 'stock-sector-smart-cities',
  'industry-naval': 'stock-sector-industry',
  cybersecurity: 'stock-sector-cyber',
  venues: 'stock-sector-venues',
  transport: 'stock-sector-transport',
};

/** Encuadre de cada foto en la franja vertical (lo importante no siempre está en el centro). */
const SECTOR_POS = { security: '46% 40%', 'smart-cities': '60% 50%', 'industry-naval': '40% 50%', cybersecurity: '50% 50%', venues: '62% 50%', transport: '38% 60%' };

const SECTOR_ICON = {
  security: 'pillar-mission',
  'smart-cities': 'twin-cities',
  'industry-naval': 'twin-industry',
  cybersecurity: 'lever-compliance',
  venues: 'twin-venues',
  transport: 'app:bus',
};

/** Red con paquetes que pasan y paquetes que se detienen en el perímetro. */
function CyberNet({ paused, labels }) {
  return (
    <svg className={`cybernet${paused ? ' is-paused' : ''}`} viewBox="0 0 600 360" aria-hidden="true">
      <defs>
        <radialGradient id="shield" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e6a817" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#e6a817" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="300" cy="180" r="120" fill="url(#shield)" />
      <circle cx="300" cy="180" r="120" className="cybernet__ring" />
      <circle cx="300" cy="180" r="84" className="cybernet__ring cybernet__ring--in" />
      {[
        [300, 180],
        [250, 150],
        [350, 150],
        [262, 222],
        [338, 222],
      ].map(([x, y], i) => (
        <g key={i}>
          <line x1="300" y1="180" x2={x} y2={y} className="cybernet__link" />
          <circle cx={x} cy={y} r={i ? 7 : 12} className="cybernet__node" />
        </g>
      ))}
      {/* tráfico legítimo: entra y llega al núcleo */}
      {[0, 1, 2].map((i) => (
        <circle key={`ok${i}`} r="4" className="cybernet__pkt cybernet__pkt--ok" style={{ '--i': i }}>
          <animateMotion dur="3.2s" begin={`${i * 1.05}s`} repeatCount="indefinite" path="M 20 60 C 160 60 220 150 300 180" />
        </circle>
      ))}
      {/* tráfico no autorizado: se detiene en el perímetro */}
      {[0, 1, 2, 3].map((i) => (
        <g key={`ko${i}`} className="cybernet__blocked" style={{ '--i': i }}>
          <circle r="4.5" className="cybernet__pkt cybernet__pkt--ko">
            <animateMotion dur="2.6s" begin={`${i * 0.7}s`} repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.6;1" calcMode="linear" path={['M 590 40 L 395 110', 'M 590 330 L 392 250', 'M 10 330 L 208 250', 'M 590 180 L 420 180'][i]} />
          </circle>
        </g>
      ))}
      <text x="24" y="48" className="cybernet__label cybernet__label--ok">{labels.allowed}</text>
      <text x="470" y="30" className="cybernet__label cybernet__label--ko">{labels.blocked}</text>
    </svg>
  );
}

export default function Sectors({ step, paused, goto, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const sc = deck.SCENES.sectors;
  const cityLive = useStore((s) => s.cityLive);
  const sectorId = SECTOR_STEPS[step];
  const sector = deck.SECTORS.find((s) => s.id === sectorId);
  const idx = deck.SECTORS.findIndex((s) => s.id === sectorId);
  const railRef = useGlider(idx);

  return (
    <div className={`scene scene--sectors s${step}${sectorId ? ` is-${sectorId}` : ''}`}>
      <Swap id={`s${step}`}>
      {/* 0 · la ciudad por zonas */}
      {step === 0 && (
        <>
          <div className="scene-lead scene-lead--left" key="intro">
            <Kicker>{deck.SECTORS_META.kicker}</Kicker>
            <Headline parts={sc.intro} size="xl" />
            <p className="scene-lead__line">{sc.introLine}</p>
          </div>
          {deck.SECTORS.filter((s) => SECTOR_ZONES.includes(s.id)).map((s, i) => (
            <CityPin key={s.id} solution={s.solution} lift={45} delay={i * 160} className="citypin--zone">
              <button className="citypin__btn" onClick={() => goto(2, deck.SECTORS.findIndex((x) => x.id === s.id) + 1)}>
                <MtiIcon name={SECTOR_ICON[s.id]} />
                <span>{s.title}</span>
              </button>
            </CityPin>
          ))}
          <div className="offmap">
            {cityLive && <span>{sc.offMap}</span>}
            {deck.SECTORS.filter((s) => !SECTOR_ZONES.includes(s.id) || !cityLive).map((s) => (
              <button key={s.id} onClick={() => goto(2, deck.SECTORS.findIndex((x) => x.id === s.id) + 1)}>
                <MtiIcon name={SECTOR_ICON[s.id]} />
                {s.title}
              </button>
            ))}
          </div>
        </>
      )}

      {/* 1-6 · un sector */}
      {sector && (
        <>
          <div className="sector-side" key={`side-${sector.id}`}>
            <div className="sector-window">
              <Photo id={SECTOR_PHOTO[sector.id]} depth={1} kenBurns eager className="sector-window__photo" position={SECTOR_POS[sector.id]} sizes="(max-width: 900px) 100vw, 45vw" />
              {sector.id === 'industry-naval' && <Telemetry rows={sc.scada} paused={paused} className="sector-window__telemetry" />}
              {sector.id === 'cybersecurity' && <CyberNet paused={paused} labels={sc} />}
              <span className="sector-window__num">{sector.num}</span>
            </div>
          </div>

          {/* «Cómo funciona»: la pieza central del paso, ancha y centrada */}
          {sc.flows?.[sector.id] && (
            <section className="sector-flow sector-flow--stage" aria-label={sc.flowTitle} key={`flow-${sector.id}`}>
              <header className="sector-flow__head">
                <Icon name="integration" />
                <span>{sc.flowTitle}</span>
                <i aria-hidden="true" />
              </header>
              <FlowDiagram {...sc.flows[sector.id]} labels={sc.flowLabels} paused={paused} size="lg" className="fd--xl" />
            </section>
          )}

          <div className="scene-lead sector-lead" key={`t-${sector.id}`}>
            <Kicker>
              {sector.num} · {sector.rank}
            </Kicker>
            <Headline parts={[sector.title]} size="l" />
            <p className="sector-problem">{sector.problem}</p>
            <ul className="systems">
              {sc.systems[sector.id].map((x, i) => (
                <li key={x} style={{ '--i': i }}>
                  <i />
                  {x}
                </li>
              ))}
            </ul>
            <p className="sector-clients">{sector.tags.join(' · ')}</p>
            <div className="scene-actions">
              <SolutionButton id={sector.solution} layer={sector.layer} />
              <button className="dbtn dbtn--ghost" onClick={() => openInfo('sector', sector.id)}>
                <Icon name="doc" />
                <span>{ui.more}</span>
              </button>
            </div>
          </div>

          {/* sin rótulo sobre la ciudad: la cámara ya vuela a la zona y el esquema ocupa la parte baja */}

        </>
      )}

      {/* 7 · y también */}
      {step === 7 && (
        <div className="scene-lead scene-lead--center" key="also">
          <Kicker>{deck.SECTORS_META.alsoLabel}</Kicker>
          <Headline parts={[sc.alsoHead]} size="l" />
          <div className="also-orbit">
            {deck.SECTORS_ALSO.map((a, i) => (
              <div key={a.id} className="also-item" style={{ '--i': i }}>
                <span>{a.label}</span>
                <SolutionButton id={a.solution} compact label="" />
              </div>
            ))}
          </div>
        </div>
      )}
      </Swap>

      {/* el selector de sectores se queda fijo: solo cambia el activo */}
      {sector && (
        <nav className="sector-rail has-glider" ref={railRef} aria-label={deck.SECTORS_META.kicker}>
          {deck.SECTORS.map((s, i) => (
            <button key={s.id} className={i === idx ? 'is-active' : ''} onClick={() => goto(2, i + 1)} title={s.title}>
              <MtiIcon name={SECTOR_ICON[s.id]} />
              <span>{s.title}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
