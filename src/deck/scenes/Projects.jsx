import React, { useEffect, useRef } from 'react';
import { Kicker, Headline, Photo, LogoPlate, SolutionButton, Counter, Icon, useDeck, useDeckUi, useAsset, projectPhotoId, projectLogoId , Swap } from '../parts.jsx';
import { PROJECT_ORDER } from '../choreography.js';
import { loadWorld } from '../stage/GlobeStation.jsx';
import TrackCards from '../TrackCards.jsx';

/**
 * Capítulo 6 · proyectos que lo prueban.
 *
 * 0     mapa de puntos con los nueve proyectos: se elige destino
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

function ProjectScene({ p, prev, index, total, openInfo }) {
  const deck = useDeck();
  const ui = useDeckUi();
  const labels = deck.PROJECTS_META.labels;
  const photoId = projectPhotoId(p.id);
  const photo = useAsset(photoId);
  const logoId = projectLogoId(p.id);
  // a sangre solo si la foto ORIGINAL tiene resolución para ello
  const bleed = (photo?.srcWidth ?? 0) >= 1400;

  return (
    <div className={`proj${bleed ? ' proj--bleed' : ' proj--window'}`} key={p.id}>
      <div className="proj__bg">
        <Photo id={photoId} depth={0.6} kenBurns eager className={bleed ? 'proj__photo' : 'proj__ambient'} />
      </div>
      {!bleed && (
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

      <Locator from={prev?.coords} to={p.coords} />
    </div>
  );
}

export default function Projects({ step, goto, openInfo }) {
  const deck = useDeck();
  const sc = deck.SCENES.projects;
  const ui = useDeckUi();
  const list = PROJECT_ORDER.map((id) => deck.PROJECTS.find((p) => p.id === id)).filter(Boolean);
  const current = step > 0 ? list[step - 1] : null;
  const prev = step > 1 ? list[step - 2] : null;

  return (
    <div className={`scene scene--projects s${step}`}>
      {/* un proyecto releva al anterior con un fundido de foto a foto */}
      <Swap id={current?.id ?? 'map'} ms={900}>
      {step === 0 && (
        <>
          <div className="scene-lead scene-lead--left">
            <Kicker>{deck.PROJECTS_META.kicker}</Kicker>
            <Headline parts={sc.overview} size="xl" />
            <p className="scene-lead__line">{sc.overviewLine}</p>
            {/* más casos, por línea de servicio: no alargan este capítulo */}
            <TrackCards intent="projects" title={ui.moreProjects} lead={ui.moreProjectsLead} compact className="track-cards--projects" />
          </div>
          <DotMap className="proj-map">
            {list.map((p, i) => {
              const [x, y] = proj(p.coords);
              // los cuatro de Barcelona se abren en abanico para poder pulsarlos
              const fan = p.coords[0] > 41 && p.coords[1] > 2 && p.coords[1] < 2.3;
              const k = list.filter((q) => q.coords[0] > 41 && q.coords[1] > 2 && q.coords[1] < 2.3).indexOf(p);
              const ox = fan ? -60 + k * 34 : 0;
              const oy = fan ? -70 - (k % 2) * 26 : 0;
              return (
                <g key={p.id} className="proj-map__pin" style={{ '--i': i }} onClick={() => goto(5, i + 1)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && goto(5, i + 1)} aria-label={p.title}>
                  {fan && <line x1={x} y1={y} x2={x + ox} y2={y + oy} className="proj-map__lead" />}
                  <circle cx={x + ox} cy={y + oy} r="14" className="proj-map__halo" />
                  <circle cx={x + ox} cy={y + oy} r="5.5" className="proj-map__dot" />
                  <text x={x + ox} y={y + oy - 18} textAnchor="middle">
                    {p.client.split(' · ')[0]}
                  </text>
                </g>
              );
            })}
            {/* sitios con proyectos que aún no tienen ficha: se señalan, sin enlace */}
            {deck.PLACES.filter((pl) => pl.kind === 'proyecto' && !pl.projects?.length).map((pl, i) => {
              const [x, y] = proj([pl.lat, pl.lon]);
              return (
                <g key={pl.id} className="proj-map__pin proj-map__pin--minor" style={{ '--i': list.length + i }}>
                  <circle cx={x} cy={y} r="4" className="proj-map__dot" />
                  <text x={x} y={y + 18} textAnchor="middle">
                    {pl.label ?? pl.name}
                  </text>
                </g>
              );
            })}
          </DotMap>
        </>
      )}

      {current && <ProjectScene p={current} prev={prev} index={step - 1} total={list.length} openInfo={openInfo} />}
      </Swap>

      {step > 0 && (
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
