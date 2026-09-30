import React from 'react';
import { Kicker, Headline, Counter, MtiIcon, Icon, Swap, useGlider, BrandLogo } from '../../parts.jsx';
import FlowDiagram from '../../FlowDiagram.jsx';
import { useAg, agChapter, AgentMockup, FitBox } from './agParts.jsx';
import { STACK_LOGO } from '../../../data/logos.js';

/**
 * Agentify AI · 3 · ocho agentes.
 *
 *   0    catálogo: los ocho, con su promesa; el orquestador los trae al
 *        frente al pasar por encima
 *   1-8  un agente por dentro: qué entra, qué hace la plataforma, qué sale
 *        (el mismo esquema animado que los sectores), su vista de producto,
 *        su stack y los clientes donde ya está en producción
 */

/** Caso de la presentación donde aparece un cliente, si lo hay. */
export function caseForClient(cases, name) {
  const n = name.toUpperCase();
  return cases.findIndex((c) => c.client.toUpperCase().includes(n) || c.aliases?.some((a) => a.toUpperCase() === n));
}

export default function AgAgents({ step, paused, sel, setSel, goto }) {
  const ag = useAg();
  const m = ag.AGENTS_META;
  const agent = step > 0 ? ag.AGENTS[step - 1] : null;
  const railRef = useGlider(step - 1);
  const me = agChapter('ag-agents');
  const casesCh = agChapter('ag-cases');

  return (
    <div className={`scene scene--ag-agents s${step}`}>
      <Swap id={`s${step}`} ms={600}>
        {step === 0 && (
          <>
            <div className="scene-lead scene-lead--left ag-cat-lead" key="lead">
              <Kicker>{m.kicker}</Kicker>
              <Headline parts={m.title} size="l" />
              <p className="scene-lead__body">{m.lead}</p>
              <div className="ag-stats ag-stats--compact">
                {m.stats.map((s, i) => (
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
            <div className="ag-catalog" key="grid" onPointerLeave={() => setSel('agent', null)}>
              {ag.AGENTS.map((a, i) => (
                <button
                  key={a.id}
                  className={`ag-card${sel.agent === a.id ? ' is-on' : ''}`}
                  style={{ '--i': i }}
                  onClick={() => goto(me, i + 1)}
                  onPointerEnter={() => setSel('agent', a.id)}
                  onFocus={() => setSel('agent', a.id)}
                >
                  <span className="ag-card__icon">
                    <MtiIcon name={`ag-${a.id}`} />
                  </span>
                  <span className="ag-card__id">{a.id}</span>
                  <strong>{a.name}</strong>
                  <em>{a.catalog}</em>
                  <Icon name="external" />
                </button>
              ))}
              <p className="ag-catalog__hint">{m.hint}</p>
            </div>
          </>
        )}

        {agent && (
          <FitBox className="agx" key={`a-${agent.id}`}>
            <header className="agx__head">
              <div className="agx__title">
                <Kicker>
                  {agent.id} · {agent.area}
                </Kicker>
                <Headline parts={[agent.name]} size="l" />
                <p className="ag-agent__tag">{agent.tagline}</p>
              </div>
              <nav className="sector-rail ag-rail has-glider" ref={railRef} aria-label={m.kicker}>
                {ag.AGENTS.map((a, i) => (
                  <button key={a.id} className={i === step - 1 ? 'is-active' : ''} onClick={() => goto(me, i + 1)} title={a.name}>
                    <MtiIcon name={`ag-${a.id}`} />
                    <span>{a.id}</span>
                  </button>
                ))}
              </nav>
            </header>

            {/* el esquema es la pieza central: qué entra, qué hace, qué sale, con los logos reales */}
            <section className="sector-flow agx__flow" aria-label={`${agent.id} · ${agent.name}`}>
              <header className="sector-flow__head">
                <MtiIcon name={`ag-${agent.id}`} />
                <span>
                  {agent.id} · {agent.name}
                </span>
                <i aria-hidden="true" />
              </header>
              <FlowDiagram
                inputs={agent.inputs}
                core={{
                  icon: 'ai',
                  kicker: `${ag.META.kicker} · ${agent.id}`,
                  title: agent.name,
                  steps: agent.steps,
                  logos: [...new Set(agent.stack.map((x) => STACK_LOGO[x]).filter(Boolean))],
                }}
                outputs={agent.outputs}
                labels={m.flowLabels}
                paused={paused}
                size="lg"
              />
            </section>

            <div className="agx__foot">
              <div className="agx__info">
                <p className="agx__body">{agent.body}</p>
                <ul className="ag-caps">
                  {agent.capabilities.map((c, i) => (
                    <li key={c} style={{ '--i': i }}>
                      <Icon name="check" />
                      {c}
                    </li>
                  ))}
                </ul>
                <div className="ag-agent__meta">
                  <div>
                    <span className="ag-label">{m.stack}</span>
                    <div className="ag-chips ag-chips--stack">
                      {agent.stack.map((x, i) => (
                        <span key={x} style={{ '--i': i }}>
                          {STACK_LOGO[x] && <BrandLogo id={STACK_LOGO[x]} size="xs" />}
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="ag-label">
                      <i className="ag-live" aria-hidden="true" />
                      {m.production}
                    </span>
                    <div className="ag-chips ag-chips--clients">
                      {agent.clients.map((c) => {
                        const k = caseForClient(ag.CASES, c);
                        return k >= 0 ? (
                          <button key={c} onClick={() => goto(casesCh, k + 1)} title={`${m.seeCase} · ${c}`}>
                            {c}
                            <Icon name="external" />
                          </button>
                        ) : (
                          <span key={c}>{c}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <AgentMockup mockup={agent.mockup} paused={paused} label={ag.UI.illustrative} title={agent.name} />
            </div>
          </FitBox>
        )}
      </Swap>

    </div>
  );
}
