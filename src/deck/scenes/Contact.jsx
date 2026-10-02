import React, { useState } from 'react';
import { Kicker, Headline, Icon, useDeck, useDeckUi } from '../parts.jsx';
import { PROJECT_ORDER } from '../choreography.js';
import { useStore } from '../../store.js';
import TrackCards from '../TrackCards.jsx';

/**
 * Capítulo 7 · hablemos.
 *
 * Un único paso de cierre sobre la ciudad en operación: contacto y, sobre
 * todo, el salto a las presentaciones de cada línea de servicio (Agentify AI
 * y las que vengan), a la ciudad 3D o a un proyecto concreto.
 */
export default function Contact({ goto }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const sc = deck.SCENES.why;
  const c = deck.CONTACT;
  const enterExplorer = useStore((s) => s.enterExplorer);
  const webgl = useStore((s) => s.webgl);
  const restartDeck = useStore((s) => s.restartDeck);
  const toggleIndex = useStore((s) => s.toggleDeckIndex);
  const [projectsOpen, setProjectsOpen] = useState(false);

  return (
    <div className="scene scene--contact">
      <div className="closing2 contact-close">
        <div className="closing2__text">
          <Kicker>{deck.CLOSING.kicker}</Kicker>
          <Headline parts={sc.closing} size="xl" />
          <p className="scene-lead__line">{deck.CLOSING.lead}</p>

          <TrackCards intent="services" title={ui.otherServices} lead={ui.otherServicesLead} className="track-cards--closing" />

          <div className="closing2__cta">
            {webgl && (
              <button className="dbtn dbtn--gold" onClick={enterExplorer}>
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
    </div>
  );
}
