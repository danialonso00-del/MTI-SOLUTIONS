import React from 'react';
import { Kicker, Headline, Photo, SolutionButton, Counter, Icon, Swap, useDeck, useDeckUi, projectPhotoId } from '../parts.jsx';
import { PROJECT_ORDER } from '../choreography.js';

/**
 * Capítulo 2 · presencia internacional (el globo está en el lienzo 3D).
 *
 * 0 el globo sale de la oscuridad y Barcelona, la sede, se enciende
 * 1 salen las conexiones hacia las oficinas, con su bandera
 * 2 aparecen los proyectos y una onda de actividad recorre el planeta
 * 3 exploración libre: al elegir un sitio, el globo gira, el país se ilumina
 *   y aparecen sus oficinas y proyectos con fotografía real
 */

const Flag = ({ code, lg = false }) =>
  code ? <img className={`flag${lg ? ' flag--lg' : ''}`} src={`/assets/flags/${code}.svg`} alt="" loading="lazy" /> : null;

export default function World({ step, sel, setSel, goto, fallback }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const w = deck.WORLD;
  const sc = deck.SCENES.world;
  const kinds = deck.PLACE_KINDS;
  const places = deck.PLACES;
  const hq = places.find((p) => p.kind === 'sede');
  const selected = places.find((p) => p.id === sel.place) ?? null;
  const projectsHere = (selected?.projects ?? []).map((id) => deck.PROJECTS.find((p) => p.id === id)).filter(Boolean);
  const siblings = selected?.kind === 'sede' ? places.filter((p) => p.satellite) : [];
  const visible = places.filter((p) => p.kind === 'sede' || (p.kind !== 'proyecto' ? step >= 1 : step >= 2));

  // una bandera por país con oficina, en el orden en que se despliegan
  const officeFlags = [];
  for (const p of places) if (p.kind !== 'proyecto' && !officeFlags.some((x) => x.flag === p.flag)) officeFlags.push(p);

  const pick = (id) => {
    setSel('place', sel.place === id ? null : id);
    if (step < 3) goto(1, 3);
  };

  return (
    <div className={`scene scene--world s${step}`}>
      {fallback}

      <Swap id={step >= 2 ? 'w2' : `w${step}`}>
      <div className={`scene-lead scene-lead--left${step === 3 && selected ? ' is-hidden' : ''}`}>
        {step === 0 && (
          <>
            <Kicker>{w.kicker}</Kicker>
            <div className="hq-title">
              <Flag code={hq.flag} lg />
              <Headline parts={[sc.hq]} size="xxl" />
            </div>
            <p className="scene-lead__line">{sc.hqSub}</p>
          </>
        )}
        {step === 1 && (
          <>
            <Kicker>{w.kicker}</Kicker>
            <Headline parts={w.title} size="l" />
            <p className="scene-lead__line">{w.lead}</p>
            <div className="flag-strip">
              {officeFlags.map((p, i) => (
                <button key={p.flag} style={{ '--i': i }} onClick={() => pick(p.id)} title={p.country}>
                  <Flag code={p.flag} />
                  <span>{p.kind === 'sede' ? p.country : p.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {step >= 2 && (
          <>
            <Kicker>{step === 3 ? sc.explore : w.kicker}</Kicker>
            <Headline parts={[sc.projects]} size="m" />
            <div className="world-stats">
              {w.stats.map((s) => (
                <div key={s.label} className="world-stat" data-scope={s.scope}>
                  <strong>
                    <Counter value={s.value} />
                  </strong>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
            <p className="scene-note">{w.disclosure}</p>
          </>
        )}
      </div>
      </Swap>

      {step >= 1 && (
        <ul className="world-legend" aria-label={w.legendTitle}>
          {Object.entries(kinds).map(([id, k]) => {
            const n = visible.filter((p) => p.kind === id).length;
            if (!n) return null;
            return (
              <li key={id} style={{ '--k': k.color }}>
                <i />
                {k.label}
                <b>{n}</b>
              </li>
            );
          })}
        </ul>
      )}

      {/* ubicaciones: siempre accesibles también sin ratón sobre el globo */}
      {step >= 2 && (
        <div className="world-pills" role="group" aria-label={sc.explore}>
          {visible.map((p, i) => (
            <button
              key={p.id}
              className={`world-pill${sel.place === p.id ? ' is-active' : ''}`}
              style={{ '--k': kinds[p.kind]?.color, '--i': i }}
              onClick={() => pick(p.id)}
              aria-pressed={sel.place === p.id}
            >
              <Flag code={p.flag} />
              {p.label ?? p.name}
              <i />
            </button>
          ))}
        </div>
      )}

      {step === 3 && selected && (
        <aside className="world-card" key={selected.id} aria-live="polite">
          {projectsHere[0] && projectPhotoId(projectsHere[0].id) && (
            <Photo id={projectPhotoId(projectsHere[0].id)} className="world-card__photo" kenBurns eager />
          )}
          <div className="world-card__body">
            <div className="world-card__head">
              <Flag code={selected.flag} lg />
              <div>
                <span className="world-card__kind" style={{ '--k': kinds[selected.kind]?.color }}>
                  {kinds[selected.kind]?.label}
                </span>
                <h3>{selected.name}</h3>
                {selected.country !== selected.name && <span className="world-card__country">{selected.country}</span>}
              </div>
            </div>
            <p>{selected.body}</p>

            {siblings.length > 0 && (
              <div className="world-card__offices">
                {siblings.map((o) => (
                  <span key={o.id}>
                    <Icon name="building" />
                    {o.name}
                  </span>
                ))}
              </div>
            )}

            {projectsHere.length > 0 && (
              <>
                <span className="world-card__label">{selected.projectsLabel ?? sc.selectedProjects}</span>
                <div className="world-card__projects">
                  {projectsHere.map((p) => (
                    <button key={p.id} onClick={() => goto(5, PROJECT_ORDER.indexOf(p.id) + 1)}>
                      <Photo id={projectPhotoId(p.id)} className="world-card__thumb" sizes="96px" />
                      <span>
                        <b>{p.client.split(' · ')[0]}</b>
                        <em>{p.title}</em>
                      </span>
                      <Icon name="external" />
                    </button>
                  ))}
                </div>
                {projectsHere.length === 1 && <SolutionButton id={projectsHere[0].solutionId} compact />}
              </>
            )}
          </div>
          <button className="world-card__close" onClick={() => setSel('place', null)} aria-label={ui.close}>
            ×
          </button>
        </aside>
      )}
    </div>
  );
}
