import React, { useEffect, useRef, useState } from 'react';
import { Kicker, Headline, LogoPlate, CityPin, MtiIcon, Icon, useDeck, useDeckUi , Swap, useGlider } from '../parts.jsx';
import { REASON_STEPS, PROJECT_ORDER } from '../choreography.js';
import { useStore } from '../../store.js';
import TrackCards from '../TrackCards.jsx';

/**
 * Capítulo 7 · clientes, cinco razones y cierre.
 *
 * 0    constelación de logos en profundidad, agrupados por la relación que la
 *      presentación acredita; reaccionan al puntero y al seleccionarlos
 * 1..5 cada razón se activa como capacidad dentro de la ciudad en operación
 * 6    la ciudad entera, activa, y el cierre con contacto
 */

const REASON_ICON = { multibrand: 'reason-multibrand', itxpt: 'reason-itxpt', pm: 'reason-pm', support: 'reason-support', hetero: 'reason-hetero' };
const CLUSTER_ORDER = ['flagship', 'sector', 'agentic', 'transformation', 'reference'];

/** Logos en tres planos de profundidad que siguen al puntero con distinto peso. */
function Constellation({ selected, onSelect }) {
  const deck = useDeck();
  const sc = deck.SCENES.why;
  const root = useRef(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    let raf = 0;
    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--rx', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      });
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => {
      window.removeEventListener('pointermove', move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const groups = CLUSTER_ORDER.map((c) => ({
    id: c,
    items: Object.entries(deck.CLIENT_LINKS)
      .filter(([, v]) => v.cluster === c)
      .map(([id, v]) => ({ id, ...v })),
  }));

  let n = 0;
  return (
    <div className="constellation" ref={root}>
      {groups.map((g, gi) => (
        <section key={g.id} className={`cluster cluster--${g.id}`} style={{ '--g': gi }}>
          <h4>{sc.clusters[g.id]}</h4>
          <div className="cluster__logos">
            {g.items.map((it) => {
              const i = n++;
              return (
                <LogoPlate
                  key={it.id}
                  id={it.id}
                  className="cluster__logo"
                  onClick={() => onSelect(selected === it.id ? null : it.id)}
                  active={selected === it.id}
                  style={{ '--i': i, '--z': (i * 37) % 3 }}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function Why({ step, sel, setSel, goto, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const sc = deck.SCENES.why;
  const c = deck.CONTACT;
  const enterExplorer = useStore((s) => s.enterExplorer);
  const webgl = useStore((s) => s.webgl);
  const restartDeck = useStore((s) => s.restartDeck);
  const toggleIndex = useStore((s) => s.toggleDeckIndex);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const reason = REASON_STEPS[step];
  const r = reason ? deck.REASONS.find((x) => x.id === reason.id) : null;
  const railRef = useGlider(r ? deck.REASONS.findIndex((x) => x.id === r.id) : -1);
  const link = sel.logo ? deck.CLIENT_LINKS[sel.logo] : null;
  const linkedProject = link?.project ? deck.PROJECTS.find((p) => p.id === link.project) : null;

  return (
    <div className={`scene scene--why s${step}`}>
      <Swap id={step <= 5 ? `w${step}` : 'close'}>
      {step === 0 && (
        <>
          <div className="scene-lead scene-lead--top">
            <Kicker>{deck.PROJECTS_META.customers.title}</Kicker>
            <Headline parts={[sc.clientsHead]} size="l" />
            <p className="scene-lead__line">{sc.clientsLine}</p>
          </div>
          <Constellation selected={sel.logo} onSelect={(id) => setSel('logo', id)} />
          {link && (
            <aside className="logo-card" key={sel.logo}>
              <LogoPlate id={sel.logo} className="logo-card__logo" />
              <em>{sc.clusters[link.cluster]}</em>
              {link.note && <strong>{link.note}</strong>}
              <div className="scene-actions">
                {linkedProject && (
                  <button className="dbtn dbtn--gold dbtn--compact" onClick={() => goto(5, PROJECT_ORDER.indexOf(linkedProject.id) + 1)}>
                    <Icon name="external" />
                    <span>{linkedProject.title}</span>
                  </button>
                )}
                {link.platform && (
                  <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => goto(4, 5)}>
                    <MtiIcon name="platform-agentic" />
                    <span>Agentic AI</span>
                  </button>
                )}
                {link.sector && (
                  <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => goto(2, deck.SECTORS.findIndex((s) => s.id === link.sector) + 1)}>
                    <span>{deck.SECTORS.find((s) => s.id === link.sector)?.title}</span>
                  </button>
                )}
              </div>
            </aside>
          )}
        </>
      )}

      {r && (
        <>
          <div className="scene-lead scene-lead--left scene-lead--low">
            <Kicker>
              {deck.CLOSING.reasonsKicker} · {r.num}
            </Kicker>
            <Headline parts={[r.title]} size="xl" />
            <p className="scene-lead__line">{r.body}</p>
            <ul className="reason-caps">
              {r.bullets.map((b, i) => (
                <li key={b} style={{ '--i': i }}>
                  <Icon name="check" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <CityPin solution={reason.anchor} lift={45} key={`pin-${r.id}`}>
            <MtiIcon name={REASON_ICON[r.id]} />
            <span>{r.title}</span>
          </CityPin>
        </>
      )}
      </Swap>
      {step >= 1 && step <= 5 && (
        <nav className="pillar-rail pillar-rail--reasons has-glider" ref={railRef} aria-label={deck.CLOSING.reasonsKicker}>
          {deck.REASONS.map((x, i) => (
            <button key={x.id} className={`pillar-rail__item${x.id === r?.id ? ' is-active' : ''}${i + 1 < step ? ' is-done' : ''}`} onClick={() => goto(6, i + 1)}>
              <MtiIcon name={REASON_ICON[x.id]} />
              <span>{x.title}</span>
            </button>
          ))}
        </nav>
      )}

      {step === 6 && (
        <div className="closing2" key="close">
          <div className="closing2__text">
            <Kicker>{deck.CLOSING.kicker}</Kicker>
            <Headline parts={sc.closing} size="xl" />
            <p className="scene-lead__line">{deck.CLOSING.lead}</p>
            <div className="closing2__cta">
              {webgl && (
                <button className="dbtn dbtn--gold dbtn--big" onClick={enterExplorer}>
                  <Icon name="city" />
                  <span>{deck.CLOSING.ctaCity}</span>
                </button>
              )}
              <button className="dbtn dbtn--ghost" onClick={() => setProjectsOpen((v) => !v)} aria-expanded={projectsOpen}>
                <Icon name="route" />
                <span>{sc.openProject}</span>
              </button>
              <button className="dbtn dbtn--ghost" onClick={toggleIndex}>
                <Icon name="grid" />
                <span>{sc.chapters}</span>
              </button>
              <button className="dbtn dbtn--ghost" onClick={restartDeck}>
                <Icon name="play" />
                <span>{sc.restart}</span>
              </button>
            </div>
            <TrackCards intent="services" title={ui.otherServices} lead={ui.otherServicesLead} className="track-cards--closing" />
            {projectsOpen && (
              <div className="closing2__projects">
                {PROJECT_ORDER.map((id, i) => {
                  const p = deck.PROJECTS.find((x) => x.id === id);
                  return (
                    <button key={id} onClick={() => goto(5, i + 1)}>
                      {p.client.split(' · ')[0]}
                      <em>{p.place}</em>
                    </button>
                  );
                })}
              </div>
            )}
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
    </div>
  );
}
