import React from 'react';
import { useStore } from '../store.js';
import { chapterIndex } from '../data/tracks.js';
import { useDeck, Photo, Icon } from './parts.jsx';

/**
 * Tarjetas para saltar a otro recorrido (Agentify AI y los que vengan).
 *
 *   intent 'services'  entra por el principio del recorrido de esa línea
 *   intent 'projects'  entra directamente en sus casos
 *
 * Se alimenta de SERVICE_TRACKS: una línea nueva aparece aquí sola.
 */
export default function TrackCards({ intent = 'services', title, lead, compact = false, className = '' }) {
  const deck = useDeck();
  const ui = deck.DECK_UI;
  const openTrack = useStore((s) => s.openTrack);
  const tracks = deck.SERVICE_TRACKS ?? [];
  if (!tracks.length) return null;

  return (
    <section className={`track-cards${compact ? ' track-cards--compact' : ''} ${className}`.trim()} aria-label={title}>
      {title && (
        <header className="track-cards__head">
          <strong>{title}</strong>
          {lead && <span>{lead}</span>}
        </header>
      )}
      <div className="track-cards__list">
        {tracks.map((t, i) => {
          const chapter = intent === 'projects' && t.casesChapter ? chapterIndex(t.id, t.casesChapter) : 0;
          return (
            <button key={t.id} className="track-card" style={{ '--i': i }} onClick={() => openTrack(t.id, chapter, 0)}>
              <span className="track-card__bg">
                <Photo id={t.photo} sizes="420px" />
              </span>
              <span className="track-card__body">
                <em>{t.kicker}</em>
                <strong>{t.name}</strong>
                {!compact && <span className="track-card__line">{t.line}</span>}
                <span className="track-card__stats">
                  {t.stats.map((s) => (
                    <span key={s.label}>
                      <b>{s.value}</b> {s.label}
                    </span>
                  ))}
                </span>
                <span className="track-card__go">
                  {intent === 'projects' ? ui.seeCases : ui.startTrack}
                  <Icon name="external" />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
