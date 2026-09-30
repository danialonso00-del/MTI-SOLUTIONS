import React, { useEffect, useState } from 'react';
import { Kicker, Headline, Counter, Icon, Swap, useDeck, useDeckUi } from '../../parts.jsx';
import { useStore } from '../../../store.js';
import { useAg, agChapter } from './agParts.jsx';

/**
 * Agentify AI · 6 · por qué MTi.
 *
 *   0  cinco razones; el foco pasa de una a otra solo (o con el puntero)
 *   1  resultados agregados, con su alcance (proyecto, plataforma, grupo)
 *   2  cierre: del reto al resultado, contacto y salidas
 */

function Reasons({ w, paused }) {
  const [k, setK] = useState(0);
  const [hold, setHold] = useState(false);
  useEffect(() => {
    if (paused || hold) return undefined;
    const id = setInterval(() => setK((x) => (x + 1) % w.reasons.length), 3200);
    return () => clearInterval(id);
  }, [paused, hold, w.reasons.length]);
  return (
    <ol className="agw-reasons" onPointerEnter={() => setHold(true)} onPointerLeave={() => setHold(false)}>
      {w.reasons.map((r, i) => (
        <li key={r.id} className={i === k ? 'is-on' : ''} style={{ '--i': i }} onPointerEnter={() => setK(i)}>
          <span className="agw-reasons__num">{r.num}</span>
          <span className="agw-reasons__icon">
            <Icon name={r.icon} />
          </span>
          <div>
            <strong>{r.title}</strong>
            <p>{r.body}</p>
          </div>
          <i className="agw-reasons__bar" aria-hidden="true" />
        </li>
      ))}
    </ol>
  );
}

export default function AgWhy({ step, paused, goto }) {
  const ag = useAg();
  const deck = useDeck();
  const ui = useDeckUi();
  const w = ag.WHY;
  const c = deck.CONTACT;
  const webgl = useStore((s) => s.webgl);
  const enterExplorer = useStore((s) => s.enterExplorer);
  const backToMain = useStore((s) => s.backToMainTrack);
  const restartDeck = useStore((s) => s.restartDeck);
  const casesCh = agChapter('ag-cases');

  return (
    <div className={`scene scene--ag-why s${step}`}>
      <Swap id={`s${step}`}>
        {step === 0 && (
          <>
            <div className="scene-lead scene-lead--left agw-lead" key="lead">
              <Kicker>{w.kicker}</Kicker>
              <Headline parts={w.title} size="l" />
              <p className="agw-motto">{w.motto}</p>
            </div>
            <Reasons w={w} paused={paused} />
          </>
        )}

        {step === 1 && (
          <div className="agw-results" key="results">
            <header>
              <Kicker>{w.resultsKicker}</Kicker>
              <Headline parts={w.resultsTitle} size="l" />
            </header>
            <div className="agw-results__grid">
              {w.results.map((r, i) => {
                const k = r.case ? ag.CASES.findIndex((x) => x.id === r.case) : -1;
                const Tag = k >= 0 ? 'button' : 'div';
                return (
                  <Tag key={r.label} className={`agw-result${k >= 0 ? ' is-link' : ''}`} style={{ '--i': i }} onClick={k >= 0 ? () => goto(casesCh, k + 1) : undefined}>
                    <strong>
                      <Counter value={r.value} run={!paused} />
                    </strong>
                    <span>{r.label}</span>
                    <em>{r.note}</em>
                    {r.scope && <small>{ui.scope?.[r.scope] ?? r.scope}</small>}
                  </Tag>
                );
              })}
            </div>
            <p className="agw-motto agw-motto--center">{w.resultsMotto}</p>
          </div>
        )}

        {step === 2 && (
          <div className="closing2 agw-close" key="close">
            <div className="closing2__text">
              <Kicker>{w.closing.kicker}</Kicker>
              <Headline parts={w.closing.title} size="xl" />
              <p className="scene-lead__line">{w.closing.body}</p>
              <div className="closing2__cta">
                <button className="dbtn dbtn--gold dbtn--big" onClick={backToMain}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 12H5M11 18l-6-6 6-6" />
                  </svg>
                  <span>{ag.UI.backToMtiLong}</span>
                </button>
                <button className="dbtn dbtn--ghost" onClick={() => goto(casesCh, 0)}>
                  <Icon name="grid" />
                  <span>{ui.seeCases}</span>
                </button>
                {webgl && (
                  <button className="dbtn dbtn--ghost" onClick={enterExplorer}>
                    <Icon name="city" />
                    <span>{ui.explore}</span>
                  </button>
                )}
                <button className="dbtn dbtn--ghost" onClick={restartDeck}>
                  <Icon name="play" />
                  <span>{ui.restart}</span>
                </button>
              </div>
            </div>
            <aside className="contact2">
              <span className="contact2__label">{ui.contact}</span>
              <a href={`mailto:${c.email}`}>
                <span>Email</span>
                <strong>{c.email}</strong>
              </a>
              <a href={`tel:${c.phone.replace(/\s/g, '')}`}>
                <span>{ui.phone}</span>
                <strong>{c.phone}</strong>
              </a>
              <a href={c.webUrl} target="_blank" rel="noreferrer">
                <span>Web</span>
                <strong>{c.web}</strong>
              </a>
              <p>{c.hq}</p>
              <small>{c.legal}</small>
            </aside>
          </div>
        )}
      </Swap>
    </div>
  );
}
