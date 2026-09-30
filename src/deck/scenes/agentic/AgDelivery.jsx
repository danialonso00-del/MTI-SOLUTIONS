import React from 'react';
import { Kicker, Headline, Icon } from '../../parts.jsx';
import { useAg, agChapter } from './agParts.jsx';

/**
 * Agentify AI · 5 · cómo lo entregamos.
 *
 *   0-3  las cuatro fases se van sumando a la línea de tiempo (y el anillo de
 *        la capa de datos se completa un cuarto en cada una)
 *   4    qué recibes desde el día uno
 */
export default function AgDelivery({ step, goto }) {
  const ag = useAg();
  const d = ag.DELIVERY;
  const me = agChapter('ag-delivery');
  const phase = Math.min(step, 3);
  const dayOne = step === 4;

  return (
    <div className={`scene scene--ag-delivery s${step}`}>
      <div className="scene-lead scene-lead--top agd-lead">
        <Kicker>{d.kicker}</Kicker>
        <Headline parts={d.title} size="xl" />
        <p className="scene-lead__body">{d.lead}</p>
      </div>

      <ol className={`agd-line${dayOne ? ' is-complete' : ''}`} style={{ '--p': dayOne ? 4 : phase + 1 }}>
        <span className="agd-line__rail" aria-hidden="true">
          <i />
        </span>
        {d.phases.map((p, i) => {
          const state = dayOne || i < phase ? 'is-done' : i === phase ? 'is-now' : 'is-next';
          return (
            <li key={p.id} className={`agd-phase ${state}`} style={{ '--i': i }}>
              <button onClick={() => goto(me, i)} aria-current={i === phase && !dayOne ? 'step' : undefined}>
                <span className="agd-phase__dot">
                  <Icon name={state === 'is-done' ? 'check' : p.icon} />
                </span>
                <span className="agd-phase__num">{p.num}</span>
                <strong>{p.title}</strong>
                <em>{p.time}</em>
                <p>{p.body}</p>
              </button>
            </li>
          );
        })}
      </ol>

      {dayOne && (
        <div className="agd-dayone">
          <span className="ag-label">{d.dayOneTitle}</span>
          <div className="agd-dayone__grid">
            {d.dayOne.map((x, i) => (
              <div key={x.label} style={{ '--i': i }}>
                <Icon name={x.icon} />
                <span>{x.label}</span>
              </div>
            ))}
          </div>
          <p className="agd-motto">{d.motto}</p>
        </div>
      )}
    </div>
  );
}
