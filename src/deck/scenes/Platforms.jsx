import React from 'react';
import { Kicker, Headline, MtiIcon, SolutionButton, DocButton, Counter, LogoPlate, Icon, useDeck, useDeckUi , Swap } from '../parts.jsx';

/**
 * Capítulo 5 · plataformas propias (la cadena y el dato viajero, en el lienzo 3D).
 *
 * 0 la pila completa
 * 1 el dispositivo emite una lectura (ejemplo ilustrativo, así rotulado)
 * 2 thethings.io · 3 MTi Hypervisor · 4 Digital Twin · 5 Agentic AI
 * 6 la acción operativa, trazada, y acceso a cada plataforma
 */

const ORDER = ['thethings', 'hypervisor', 'twin', 'agentic'];
const ICON = { thethings: 'platform-thethings', hypervisor: 'platform-hypervisor', twin: 'platform-twin', agentic: 'platform-agentic' };
const AGENT_ICON = (id) => `agent-${id}`;

export default function Platforms({ step, sel, setSel, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const sc = deck.SCENES.platforms;
  const byId = Object.fromEntries(deck.PLATFORMS.map((p) => [p.id, p]));
  const platform = step >= 2 && step <= 5 ? byId[ORDER[step - 2]] : null;
  const agent = deck.AGENTS.find((a) => a.id === sel.agent);

  return (
    <div className={`scene scene--platforms s${step}`}>
      {/* barra de la cadena: dónde está el dato ahora */}
      <ol className="chain" aria-label={sc.chainHead}>
        {sc.stations.map((s, i) => (
          <li key={s} className={`${step === 0 || step === 6 || step - 1 === i ? 'is-active' : ''}${step - 1 > i && step !== 6 ? ' is-done' : ''}`}>
            {i > 0 && i < 5 ? <MtiIcon name={ICON[ORDER[i - 1]]} /> : <i className="chain__dot" />}
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <Swap id={`p${step}`}>
      {step === 0 && (
        <div className="scene-lead scene-lead--left scene-lead--low">
          <Kicker>{deck.PLATFORMS_META.kicker}</Kicker>
          <Headline parts={[sc.chainHead]} size="xl" />
          <p className="scene-lead__line">{sc.chainLine}</p>
        </div>
      )}

      {step === 1 && (
        <>
          <div className="scene-lead scene-lead--left scene-lead--low">
            <Kicker>{sc.stations[0]}</Kicker>
            <Headline parts={[sc.sensorHead]} size="l" />
          </div>
          <div className="reading" aria-label={sc.example}>
            <span className="reading__id">{sc.reading.id}</span>
            <strong className="reading__value">{sc.reading.value}</strong>
            <span className="reading__meta">
              {sc.reading.proto} · <b>{sc.reading.state}</b>
            </span>
            <em className="reading__note">{sc.example}</em>
          </div>
        </>
      )}

      {platform && (
        <aside className="platform-panel" style={{ '--c': platform.color }}>
          <div className="platform-panel__head">
            <MtiIcon name={ICON[platform.id]} className="platform-panel__icon" />
            <div>
              <Kicker>
                {platform.role} · {platform.num}
              </Kicker>
              {platform.id === 'thethings' ? <LogoPlate id="platform-thethings-logo" className="platform-panel__logo" /> : <h3>{platform.name}</h3>}
            </div>
          </div>
          <p className="platform-panel__claim">{platform.claim}</p>
          <ul className="feature-tags">
            {sc.features[platform.id].map((f, i) => (
              <li key={f} style={{ '--i': i }}>
                {f}
              </li>
            ))}
          </ul>
          <div className="metric-grid">
            {platform.metrics.map((m) => (
              <div key={m.label} className="metric" data-scope={m.scope}>
                <strong>
                  <Counter value={m.value} />
                </strong>
                <span>{m.label}</span>
                <em>{ui.scope?.[m.scope] ?? m.scope}</em>
              </div>
            ))}
          </div>

          {platform.id === 'agentic' && (
            <div className="agents">
              <p className="scene-note">{sc.agentsHint}</p>
              <div className="agents__grid">
                {deck.AGENTS.map((a) => (
                  <button key={a.id} className={sel.agent === a.id ? 'is-active' : ''} onClick={() => setSel('agent', sel.agent === a.id ? null : a.id)} aria-pressed={sel.agent === a.id}>
                    <MtiIcon name={AGENT_ICON(a.id)} />
                    <span>{a.title.replace('AI ', '')}</span>
                  </button>
                ))}
              </div>
              {agent && (
                <div className="agent-card" key={agent.id}>
                  <em>{agent.id}</em>
                  <strong>{agent.title}</strong>
                  <p>{agent.body}</p>
                  <span>{agent.tags.join(' · ')}</span>
                </div>
              )}
            </div>
          )}

          <div className="scene-actions">
            <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => openInfo('platform', platform.id)}>
              <Icon name="doc" />
              <span>{ui.more}</span>
            </button>
            <SolutionButton id={platform.solution} compact />
            <DocButton id={platform.solution} />
          </div>
        </aside>
      )}

      {step === 6 && (
        <>
          <div className="scene-lead scene-lead--left scene-lead--low">
            <Kicker>{sc.stations[5]}</Kicker>
            <Headline parts={[sc.actionHead]} size="xl" />
            <ul className="action-list">
              {sc.action.map((a, i) => (
                <li key={a} style={{ '--i': i }}>
                  <Icon name="check" />
                  {a}
                </li>
              ))}
            </ul>
            <p className="scene-note">{sc.example}</p>
          </div>
          <div className="platform-dock">
            {ORDER.map((id) => {
              const p = byId[id];
              return (
                <div key={id} className="platform-dock__item" style={{ '--c': p.color }}>
                  <MtiIcon name={ICON[id]} />
                  <strong>{p.name}</strong>
                  <span>{p.role}</span>
                  <div className="platform-dock__actions">
                    <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => openInfo('platform', id)}>
                      <span>{ui.more}</span>
                    </button>
                    <SolutionButton id={p.solution} compact label="3D" />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      </Swap>
    </div>
  );
}

/** Rótulos de las estaciones dentro del lienzo 3D. */
export function flowLabels(deck) {
  const sc = deck.SCENES.platforms;
  return sc.stations.map((text, i) => ({ id: `st${i}`, text }));
}
