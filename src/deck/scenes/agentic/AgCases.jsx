import React from 'react';
import { Kicker, Headline, Counter, Photo, LogoPlate, MtiIcon, Icon, Swap, useAsset } from '../../parts.jsx';
import { useAg, agChapter, AgentBadge, FitBox } from './agParts.jsx';
import FlowDiagram from '../../FlowDiagram.jsx';

/**
 * Agentify AI · 4 · catorce despliegues.
 *
 *   0     mosaico de los catorce casos, filtrable por agente (el orquestador
 *         enciende el agente elegido)
 *   1-14  un caso a pantalla completa: su imagen, sus cifras, qué agentes
 *         trabajan en él y con qué sistemas está conectado
 *
 * Estos casos no están en el capítulo de proyectos del recorrido
 * corporativo: se llega aquí desde «Explorar más proyectos».
 */

const pad = (n) => String(n).padStart(2, '0');

/** Fondo del caso: su foto, el gráfico de su diapositiva o, si no hay, su inicial. */
function CaseVisual({ c, i, small = false }) {
  const asset = useAsset(c.visual);
  if (c.visual && c.visualKind !== 'graphic' && asset) {
    return <Photo id={c.visual} className="agc-visual__photo" kenBurns={!small} eager={!small} sizes={small ? '320px' : '100vw'} />;
  }
  return (
    <div className={`agc-visual__art${c.visualKind === 'graphic' ? ' has-graphic' : ''}`}>
      <span className="agc-visual__letter" aria-hidden="true">
        {c.client.replace(/[^A-Za-zÁÉÍÓÚÑ]/g, '').charAt(0)}
      </span>
      {c.visualKind === 'graphic' && asset && <img className="agc-visual__graphic" src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} />}
      {!small && <span className="agc-visual__grid" aria-hidden="true" />}
      <span className="agc-visual__num" aria-hidden="true">
        {pad(i + 1)}
      </span>
    </div>
  );
}

function Mosaic({ ag, sel, setSel, goto }) {
  const m = ag.CASES_META;
  const me = agChapter('ag-cases');
  const filter = sel.agentFilter ?? null;
  const shown = (c) => !filter || c.agents.some((a) => a.id === filter);
  const count = ag.CASES.filter(shown).length;

  return (
    <div className="agc-mosaic" key="mosaic">
      <header className="agc-mosaic__head">
        <div>
          <Kicker>{m.kicker}</Kicker>
          <Headline parts={m.title} size="l" />
        </div>
        <p className="scene-lead__body">{m.lead}</p>
      </header>

      <nav className="agc-filter" aria-label={ag.AGENTS_META.kicker}>
        <button className={!filter ? 'is-on' : ''} onClick={() => setSel('agentFilter', null)} aria-pressed={!filter}>
          {m.all}
          <b>{ag.CASES.length}</b>
        </button>
        {ag.AGENTS.map((a) => (
          <AgentBadge key={a.id} id={a.id} short={a.short} active={filter === a.id} onClick={() => setSel('agentFilter', filter === a.id ? null : a.id)} />
        ))}
        <span className="agc-filter__count" aria-live="polite">
          {count} / {ag.CASES.length}
        </span>
      </nav>

      <div className="agc-grid">
        {ag.CASES.map((c, i) => {
          const on = shown(c);
          const lead = c.metrics[0];
          return (
            <button key={c.id} className={`agc-card${on ? '' : ' is-off'}`} style={{ '--i': i }} onClick={() => goto(me, i + 1)} tabIndex={on ? 0 : -1} aria-hidden={!on}>
              <span className="agc-card__bg">
                <CaseVisual c={c} i={i} small />
              </span>
              <span className="agc-card__top">
                <em>{pad(i + 1)}</em>
                <span>{c.sector}</span>
              </span>
              <strong className="agc-card__client">{c.client}</strong>
              <span className="agc-card__metric">
                <b>{lead.value}</b>
                {lead.label}
              </span>
              <span className="agc-card__agents">
                {c.agents.map((a) => (
                  <i key={a.id} className={filter === a.id ? 'is-on' : ''}>
                    {a.id}
                  </i>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Fotos de origen pequeño (menos de 900 px): no aguantan ir a sangre. */
const SOFT_BELOW = 900;

function CaseDetail({ ag, c, i, paused, goto }) {
  const m = ag.CASES_META;
  const photo = useAsset(c.visualKind === 'graphic' ? null : c.visual);
  const soft = Boolean(photo && photo.srcWidth < SOFT_BELOW);
  const me = agChapter('ag-cases');

  return (
    <div className="agc" key={c.id}>
      <div className={`agc-visual${soft ? ' is-soft' : ''}`}>
        <CaseVisual c={c} i={i} />
      </div>
      <div className="agc-shade" aria-hidden="true" />
      <FitBox className="agc2">
        <div className="agc2__head">
          <div>
            <Kicker>
              {pad(i + 1)} / {ag.CASES.length} · {c.sector}
            </Kicker>
            <div className="agc-id">
              {c.logo && <LogoPlate id={c.logo} className="agc-id__logo" />}
              <span>
                <strong>{c.client}</strong>
                <em>{c.solution}</em>
              </span>
            </div>
            <Headline parts={[c.title]} size="l" />
            <p className="scene-lead__body">{c.body}</p>
          </div>
          <div className="agc2__side">
            <div className={`agc-metrics agc-metrics--${c.metrics.length}`}>
              {c.metrics.map((x, k) => (
                <div key={x.label} className="agc-metric" style={{ '--i': k }}>
                  <strong>
                    <Counter value={x.value} run={!paused} />
                  </strong>
                  <span>{x.label}</span>
                </div>
              ))}
            </div>
            {c.since && (
              <p className="agc-since">
                <i className="ag-live" aria-hidden="true" />
                {c.since}
              </p>
            )}
            {c.profile && <p className="agc-profile">{c.profile}</p>}
          </div>
        </div>

        {/* cómo funciona este caso: qué entra, qué hace la solución (con sus agentes) y qué sale */}
        {c.flow && (
          <section className="sector-flow agc2__flow" aria-label={m.flowTitle}>
            <header className="sector-flow__head">
              <Icon name="integration" />
              <span>
                {m.flowTitle} · {c.client}
              </span>
              <i aria-hidden="true" />
            </header>
            <FlowDiagram
              inputs={c.flow.inputs}
              core={{ icon: 'ai', kicker: ag.META.kicker, title: c.solution, steps: c.flow.steps, agents: c.agents.map((a) => a.id) }}
              outputs={c.flow.outputs}
              labels={m.flowLabels}
              paused={paused}
              size="lg"
            />
          </section>
        )}
      </FitBox>

      <nav className="agc-rail" aria-label={m.kicker}>
        <button className="agc-rail__all" onClick={() => goto(me, 0)}>
          <Icon name="grid" />
          <span>{m.back}</span>
        </button>
        <span className="agc-rail__dots">
          {ag.CASES.map((x, k) => (
            <button key={x.id} className={k === i ? 'is-active' : ''} onClick={() => goto(me, k + 1)} title={x.client} aria-label={x.client} />
          ))}
        </span>
      </nav>
    </div>
  );
}

export default function AgCases({ step, paused, sel, setSel, goto }) {
  const ag = useAg();
  const c = step > 0 ? ag.CASES[step - 1] : null;

  return (
    <div className={`scene scene--ag-cases s${step}${c ? ' is-case' : ''}`}>
      <Swap id={`s${step}`} ms={800}>
        {step === 0 && <Mosaic ag={ag} sel={sel} setSel={setSel} goto={goto} />}
        {c && <CaseDetail ag={ag} c={c} i={step - 1} paused={paused} goto={goto} />}
      </Swap>
    </div>
  );
}
