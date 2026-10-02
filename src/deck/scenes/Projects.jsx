import React, { useEffect, useRef } from 'react';
import { Kicker, Headline, Photo, LogoPlate, SolutionButton, Counter, Icon, useDeck, useDeckUi, useAsset, projectPhotoId, projectLogoId , Swap } from '../parts.jsx';
import { PROJECT_ORDER } from '../choreography.js';
import { loadWorld } from '../stage/GlobeStation.jsx';
import { useStore } from '../../store.js';
import { chapterIndex } from '../../data/tracks.js';
import ProjectReel from '../ProjectReel.jsx';
import ClientOrbit from '../ClientOrbit.jsx';

/**
 * Capítulo 6 · proyectos que lo prueban.
 *
 * 0     entrada: mosaico de proyectos en movimiento y tres formas de verlos —
 *       el recorrido de los nueve insignia, el filtro por línea de negocio
 *       (con los casos de IA agentiva) y el mapa
 * 1..9  cada proyecto es un lugar: fotografía a gran formato, datos encima,
 *       y un localizador que traza el viaje desde el proyecto anterior
 *
 * Las fotografías de más de 1.400 px de ancho van a sangre. Las pequeñas (la
 * presentación trae algunas de 550-820 px) van en ventana, con la misma foto
 * muy desenfocada de fondo: así llenan la pantalla sin verse pixeladas.
 */

const W = 1000;
const H = 480;
const proj = ([lat, lon]) => [((lon + 180) / 360) * W, ((85 - lat) / 145) * H];

/** Mapa de puntos dibujado una vez en un lienzo 2D: 6.000 puntos sin tocar el DOM. */
function DotMap({ className = '', children }) {
  const canvas = useRef(null);
  useEffect(() => {
    let alive = true;
    const draw = (world) => {
      const c = canvas.current;
      if (!alive || !c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      c.width = W * dpr;
      c.height = H * dpr;
      const g = c.getContext('2d');
      g.scale(dpr, dpr);
      g.fillStyle = 'rgba(120,150,200,0.42)';
      for (let i = 0; i < world.dots.length; i += 3) {
        const [x, y] = proj([world.dots[i], world.dots[i + 1]]);
        g.beginPath();
        g.arc(x, y, 1.35, 0, Math.PI * 2);
        g.fill();
      }
    };
    loadWorld().then(draw).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div className={`dotmap ${className}`.trim()}>
      <canvas ref={canvas} style={{ width: '100%', height: '100%' }} aria-hidden="true" />
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        {children}
      </svg>
    </div>
  );
}

function Locator({ from, to }) {
  const [x2, y2] = proj(to);
  const [x1, y1] = from ? proj(from) : [x2, y2];
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.max(40, Math.abs(x2 - x1) * 0.25);
  return (
    <DotMap className="locator">
      {from && <path key={`${x1}-${x2}`} d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`} className="locator__arc" />}
      <circle cx={x2} cy={y2} r="18" className="locator__pulse" />
      <circle cx={x2} cy={y2} r="6" className="locator__pin" />
    </DotMap>
  );
}

function ProjectScene({ p, prev, index, total, paused, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const labels = deck.PROJECTS_META.labels;
  const reel = deck.PROJECT_REELS?.[p.id];
  // fondo: la foto grande del lugar real si la hay; si no, la de la presentación
  const photoId = reel?.bg ?? projectPhotoId(p.id);
  const photo = useAsset(photoId);
  const logoId = projectLogoId(p.id);
  // a sangre solo si la foto ORIGINAL tiene resolución para ello
  const bleed = (photo?.srcWidth ?? 0) >= 1400;

  return (
    <div className={`proj${bleed ? ' proj--bleed' : ' proj--window'}${reel ? ' proj--reel' : ''}`} key={p.id}>
      <div className="proj__bg">
        <Photo id={photoId} depth={0.6} kenBurns eager className={bleed ? 'proj__photo' : 'proj__ambient'} />
      </div>
      {!bleed && !reel && (
        <div className="proj__frame">
          <Photo id={photoId} depth={1.4} eager className="proj__framephoto" />
        </div>
      )}
      <div className="proj__hud" aria-hidden="true">
        <i className="hud-corner hud-corner--tl" />
        <i className="hud-corner hud-corner--tr" />
        <i className="hud-corner hud-corner--bl" />
        <i className="hud-corner hud-corner--br" />
        <span className="proj__coords">
          {p.coords[0].toFixed(3)}° {p.coords[0] >= 0 ? 'N' : 'S'} · {Math.abs(p.coords[1]).toFixed(3)}° {p.coords[1] >= 0 ? 'E' : 'W'}
        </span>
        <span className="proj__scan" />
      </div>

      <div className="proj__content">
        <div className="proj__top">
          <span className="proj__tag">{p.tag}</span>
          <span className="proj__count">
            {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
        </div>
        {logoId && <LogoPlate id={logoId} className="proj__logo" />}
        <Headline parts={[p.title]} size="l" className="proj__title" />
        <p className="proj__place">
          <Icon name="route" />
          {p.place} · <span>{p.client}</span>
        </p>

        <div className="proj__metrics">
          {p.metrics.map((m, i) => (
            <div key={m.label} className="proj__metric" style={{ '--i': i }}>
              <strong>
                <Counter value={m.value} />
              </strong>
              <span>{m.label}</span>
            </div>
          ))}
        </div>

        <div className="proj__rsr">
          <div>
            <em>{labels.challenge}</em>
            <p>{p.challenge}</p>
          </div>
          <div>
            <em>{labels.solution}</em>
            <p>{p.solution}</p>
          </div>
          <div>
            <em>{labels.outcome}</em>
            <p>{p.outcome}</p>
          </div>
        </div>

        <div className="proj__foot">
          <ul className="proj__tech" aria-label={deck.SCENES.projects.tech}>
            {p.tech.map((t, i) => (
              <li key={t} style={{ '--i': i }}>
                {t}
              </li>
            ))}
          </ul>
          <div className="scene-actions">
            <SolutionButton id={p.solutionId} compact />
            {p.extra && (
              <button className="dbtn dbtn--ghost dbtn--compact" onClick={() => openInfo('project', p.id)}>
                <Icon name="doc" />
                <span>{ui.more}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {reel ? <ProjectReel id={p.id} reel={reel} ui={deck.PROJECT_REELS_UI} paused={paused} /> : <Locator from={prev?.coords} to={p.coords} />}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* Entrada del capítulo                                                */
/* ------------------------------------------------------------------ */

/**
 * Todos los proyectos como tarjetas: los nueve insignia y los casos de IA
 * agentiva. Cada una sabe a dónde lleva al pulsarla.
 */
function useAllProjects(deck, list) {
  const ag = deck.AGENTIFY;
  const insignia = list.map((p, i) => ({
    key: p.id,
    photo: deck.PROJECT_REELS?.[p.id]?.bg ?? projectPhotoId(p.id),
    logo: projectLogoId(p.id),
    client: p.client.split(' · ')[0],
    title: p.title,
    place: p.place,
    lines: deck.PROJECT_LINES?.[p.id] ?? [],
    go: { track: 'mti', chapter: 5, step: i + 1 },
  }));
  const casesCh = chapterIndex('agentify', 'ag-cases');
  const agentic = ag.CASES.map((c, i) => ({
    key: `ag-${c.id}`,
    photo: c.visualKind === 'graphic' ? null : c.visual,
    logo: c.logo ?? null,
    client: c.client,
    title: c.title,
    place: c.sector,
    lines: ['ai'],
    go: { track: 'agentify', chapter: casesCh, step: i + 1 },
  }));
  return [...insignia, ...agentic];
}

/** Fondo: tres filas de tarjetas que se desplazan, cada una a su ritmo. */
function Mosaic({ items, paused }) {
  const withPhoto = items.filter((x) => x.photo);
  const rows = [0, 1, 2].map((r) => withPhoto.filter((_, i) => i % 3 === r));
  return (
    <div className={`ph-mosaic${paused ? ' is-paused' : ''}`} aria-hidden="true">
      {rows.map((row, r) => (
        <div key={r} className={`ph-row ph-row--${r}`}>
          {[...row, ...row].map((x, i) => (
            <div key={`${x.key}-${i}`} className="ph-tile">
              <Photo id={x.photo} sizes="360px" />
              {x.logo ? <LogoPlate id={x.logo} className="ph-tile__logo" /> : <span className="ph-tile__name">{x.client}</span>}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Etiquetas del mapa que se pisarían: se apartan a un lado o debajo. */
const MAP_LABEL = {
  navantia: { dx: 18, dy: 18, anchor: 'start' },
  kafd: { dx: -18, dy: 5, anchor: 'end' },
  'qatar-waste': { dx: 18, dy: 5, anchor: 'start' },
  france: { dx: -10, dy: -6, anchor: 'end' },
  chile: { dx: -10, dy: 4, anchor: 'end' },
  argentina: { dx: 10, dy: 4, anchor: 'start' },
  gibraltar: { dx: -12, dy: 5, anchor: 'end' },
};

function ProjectsHub({ deck, list, view, setView, goto, paused }) {
  const hub = deck.SCENES.projects.hub;
  const items = useAllProjects(deck, list);
  const openTrack = useStore((s) => s.openTrack);
  const [line, setLine] = React.useState(null);
  const open = (x) => (x.go.track === 'mti' ? goto(x.go.chapter, x.go.step) : openTrack(x.go.track, x.go.chapter, x.go.step));
  const shown = items.filter((x) => !line || x.lines.includes(line));
  const lineLabel = Object.fromEntries(hub.lines.map((l) => [l.id, l.label]));

  return (
    <div className={`ph is-${view}`}>
      <Mosaic items={items} paused={paused} />
      <div className="ph-veil" aria-hidden="true" />

      {view === 'hero' && (
        <div className="ph-hero" key="hero">
          <Kicker>{hub.kicker}</Kicker>
          <Headline parts={hub.title} size="xl" />
          <p className="scene-lead__line">{hub.line}</p>
          <div className="ph-stats">
            {hub.stats.map((x, i) => (
              <span key={x.label} style={{ '--i': i }}>
                <b>
                  <Counter value={x.value} />
                </b>
                {x.label}
              </span>
            ))}
          </div>
          <div className="ph-actions">
            <button className="ph-btn ph-btn--walk" onClick={() => goto(5, 1)}>
              <span className="ph-btn__icon">
                <Icon name="play" />
              </span>
              <span>
                <strong>{hub.walk.title}</strong>
                <em>{hub.walk.sub}</em>
              </span>
            </button>
            <button className="ph-btn ph-btn--filter" onClick={() => setView('filter')}>
              <span className="ph-btn__icon">
                <Icon name="grid" />
              </span>
              <span>
                <strong>{hub.filter.title}</strong>
                <em>{hub.filter.sub}</em>
              </span>
            </button>
            <button className="ph-btn ph-btn--map" onClick={() => setView('map')}>
              <span className="ph-btn__icon">
                <Icon name="route" />
              </span>
              <span>
                <strong>{hub.map.title}</strong>
                <em>{hub.map.sub}</em>
              </span>
            </button>
          </div>
        </div>
      )}

      {view === 'filter' && (
        <div className="ph-panel ph-filter" key="filter">
          <header className="ph-panel__head">
            <button className="ph-back" onClick={() => setView('hero')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              {hub.back}
            </button>
            <Headline parts={hub.filterTitle} size="m" />
          </header>
          <nav className="ph-chips" aria-label={hub.filter.title}>
            <button className={!line ? 'is-on' : ''} onClick={() => setLine(null)} aria-pressed={!line}>
              {hub.all}
              <b>{items.length}</b>
            </button>
            {hub.lines.map((l) => (
              <button key={l.id} data-line={l.id} className={line === l.id ? 'is-on' : ''} onClick={() => setLine(line === l.id ? null : l.id)} aria-pressed={line === l.id}>
                <Icon name={l.icon} />
                {l.label}
                <b>{items.filter((x) => x.lines.includes(l.id)).length}</b>
              </button>
            ))}
          </nav>
          <div className="ph-grid" key={line ?? 'all'}>
            {shown.map((x, i) => (
              <button key={x.key} className="ph-card" style={{ '--i': i }} onClick={() => open(x)}>
                <span className="ph-card__photo">{x.photo ? <Photo id={x.photo} sizes="320px" /> : <i aria-hidden="true">{x.client.charAt(0)}</i>}</span>
                {x.logo && <LogoPlate id={x.logo} className="ph-card__logo" />}
                <span className="ph-card__body">
                  <em>{x.client}</em>
                  <strong>{x.title}</strong>
                  <span className="ph-card__tags">
                    {x.lines.map((l) => (
                      <i key={l}>{lineLabel[l]}</i>
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {view === 'map' && (
        <div className="ph-panel ph-map" key="map">
          <header className="ph-panel__head">
            <button className="ph-back" onClick={() => setView('hero')}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              {hub.back}
            </button>
            <Headline parts={hub.mapTitle} size="m" />
            <p className="ph-map__hint">{hub.mapHint}</p>
          </header>
          <DotMap className="proj-map ph-map__map">
            {list.map((p, i) => {
              const [x, y] = proj(p.coords);
              // los de Barcelona se abren en abanico para poder pulsarlos
              const fan = p.coords[0] > 41 && p.coords[1] > 2 && p.coords[1] < 2.3;
              const k = list.filter((q) => q.coords[0] > 41 && q.coords[1] > 2 && q.coords[1] < 2.3).indexOf(p);
              const ox = fan ? -60 + k * 34 : 0;
              const oy = fan ? -70 - (k % 2) * 26 : 0;
              return (
                <g key={p.id} className="proj-map__pin" style={{ '--i': i }} onClick={() => goto(5, i + 1)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && goto(5, i + 1)} aria-label={p.title}>
                  {fan && <line x1={x} y1={y} x2={x + ox} y2={y + oy} className="proj-map__lead" />}
                  <circle cx={x + ox} cy={y + oy} r="14" className="proj-map__halo" />
                  <circle cx={x + ox} cy={y + oy} r="5.5" className="proj-map__dot" />
                  <text x={x + ox + (MAP_LABEL[p.id]?.dx ?? 0)} y={y + oy + (MAP_LABEL[p.id]?.dy ?? -18)} textAnchor={MAP_LABEL[p.id]?.anchor ?? 'middle'}>
                    {p.client.split(' · ')[0]}
                  </text>
                </g>
              );
            })}
            {deck.PLACES.filter((pl) => pl.kind === 'proyecto' && !pl.projects?.length).map((pl, i) => {
              const [x, y] = proj([pl.lat, pl.lon]);
              return (
                <g key={pl.id} className="proj-map__pin proj-map__pin--minor" style={{ '--i': list.length + i }}>
                  <circle cx={x} cy={y} r="4" className="proj-map__dot" />
                  <text x={x + (MAP_LABEL[pl.id]?.dx ?? 0)} y={y + (MAP_LABEL[pl.id]?.dy ?? 18)} textAnchor={MAP_LABEL[pl.id]?.anchor ?? 'middle'}>
                    {pl.label ?? pl.name}
                  </text>
                </g>
              );
            })}
          </DotMap>
        </div>
      )}
    </div>
  );
}

export default function Projects({ step, paused, sel, setSel, goto, openInfo }) {
  const deck = useDeck();
  const sc = deck.SCENES.projects;
  const ui = useDeckUi();
  const list = PROJECT_ORDER.map((id) => deck.PROJECTS.find((p) => p.id === id)).filter(Boolean);
  // tras el último proyecto, los clientes en órbita alrededor de MTi
  const clientsStep = list.length + 1;
  const current = step > 0 && step < clientsStep ? list[step - 1] : null;
  const prev = step > 1 ? list[step - 2] : null;

  return (
    <div className={`scene scene--projects s${step}`}>
      {/* un proyecto releva al anterior con un fundido de foto a foto */}
      <Swap id={current?.id ?? (step === clientsStep ? 'clients' : 'map')} ms={900}>
      {step === 0 && <ProjectsHub deck={deck} list={list} view={sel.projView ?? 'hero'} setView={(v) => setSel('projView', v)} goto={goto} paused={paused} />}

      {step === clientsStep && (
        <div className="clients-orbit" key="clients">
          <div className="scene-lead scene-lead--left clients-orbit__lead">
            <Kicker>{deck.PROJECTS_META.clientsKicker}</Kicker>
            <Headline parts={deck.PROJECTS_META.clientsTitle} size="l" />
            <p className="scene-lead__line">{deck.PROJECTS_META.clientsLine}</p>
          </div>
          <ClientOrbit ids={Object.keys(deck.CLIENT_LINKS)} paused={paused} />
        </div>
      )}

      {current && <ProjectScene p={current} prev={prev} index={step - 1} total={list.length} paused={paused} openInfo={openInfo} />}
      </Swap>

      {current && (
        <nav className="proj-rail" aria-label={deck.PROJECTS_META.kicker}>
          {list.map((p, i) => (
            <button key={p.id} className={i === step - 1 ? 'is-active' : ''} onClick={() => goto(5, i + 1)} title={p.title}>
              <Photo id={projectPhotoId(p.id)} className="proj-rail__thumb" sizes="120px" />
              <span>{p.client.split(' · ')[0]}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
