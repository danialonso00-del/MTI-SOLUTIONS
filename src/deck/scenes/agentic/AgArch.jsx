import React from 'react';
import { Kicker, Headline, Icon, BrandLogo } from '../../parts.jsx';
import { useAg } from './agParts.jsx';

/**
 * Agentify AI · 2 · un orquestador, muchos especialistas.
 *
 * La escena 3D hace el trabajo: en cada paso el orquestador cambia de modo
 * (detecta → encamina → actúa). Aquí, a la izquierda, la línea de tres
 * tiempos con el paso activo y lo que entra o sale en ese momento.
 */
export default function AgArch({ step, goto }) {
  const ag = useAg();
  const a = ag.ARCH;
  const chapter = ag.CHAPTERS.findIndex((c) => c.id === 'ag-arch');

  return (
    <div className={`scene scene--ag-arch s${step}`}>
      <div className="scene-lead scene-lead--left ag-arch">
        <Kicker>{a.kicker}</Kicker>
        <Headline parts={a.title} size="l" />
        <p className="scene-lead__body">{a.lead}</p>

        <nav className="ag-steps" style={{ '--k': step }}>
          {a.steps.map((s, i) => (
            <button key={s.id} className={`ag-step${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`} onClick={() => goto(chapter, i)} aria-current={i === step ? 'step' : undefined}>
              <span className="ag-step__num">{s.num}</span>
              <span className="ag-step__text">
                <strong>{s.title}</strong>
                <em>{s.body}</em>
              </span>
            </button>
          ))}
        </nav>

        <div className="ag-io" key={step}>
          {step === 0 &&
            a.inputs.map((x, i) => (
              <span key={x.id} className="ag-io__chip ag-io__chip--in" style={{ '--i': i }}>
                {x.logos?.length ? x.logos.map((l) => <BrandLogo key={l} id={l} size="xs" />) : <Icon name={x.icon} />}
                {x.label}
              </span>
            ))}
          {step === 1 &&
            ag.AGENTS.map((x, i) => (
              <span key={x.id} className="ag-io__chip ag-io__chip--agent" style={{ '--i': i }}>
                <b>{x.id}</b>
                {x.short}
              </span>
            ))}
          {step === 2 &&
            a.outputs.map((x, i) => (
              <span key={x.id} className="ag-io__chip ag-io__chip--out" style={{ '--i': i }}>
                {x.logos?.length ? x.logos.map((l) => <BrandLogo key={l} id={l} size="xs" />) : <Icon name={x.icon} />}
                {x.label}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
