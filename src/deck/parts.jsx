import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/icons.jsx';
import { useStore } from '../store.js';
import { useCityAnchor } from './cityBridge.js';
import { PRESENTATION_ASSETS, assetPath, assetPathSmall } from '../data/presentationAssets.js';
import META from '../data/presentationAssets.meta.json';
import { LOGOS, logoSrc } from '../data/logos.js';

/* ================================================================== */
/* Contexto del recorrido                                              */
/* ================================================================== */

export const DeckContext = React.createContext(null);
export const useDeck = () => React.useContext(DeckContext);
export const useDeckUi = () => React.useContext(DeckContext)?.DECK_UI ?? {};

/* ================================================================== */
/* Recursos extraídos de la presentación                               */
/* ================================================================== */

const BY_ID = new Map(PRESENTATION_ASSETS.map((a) => [a.id, a]));

/** Datos listos para pintar un recurso: rutas, tamaño, vista previa y alt. */
export function useAsset(id) {
  const lang = useStore((s) => s.lang);
  return useMemo(() => {
    const a = BY_ID.get(id);
    if (!a) return null;
    const m = META[id] ?? {};
    return {
      ...a,
      src: assetPath(a),
      small: assetPathSmall(a),
      width: m.width,
      height: m.height,
      srcWidth: m.srcWidth ?? m.width,
      lqip: m.lqip,
      alt: lang === 'en' ? a.altEn ?? a.alt : a.alt,
    };
  }, [id, lang]);
}

/** Fotografía principal de un proyecto, según el manifiesto de recursos. */
export const projectPhotoId = (projectId) =>
  PRESENTATION_ASSETS.find((a) => a.kind === 'photo' && a.project === projectId)?.id ?? null;

/** Logo del cliente de un proyecto, si la presentación lo incluye. */
export const projectLogoId = (projectId) =>
  PRESENTATION_ASSETS.find((a) => a.kind === 'logo' && a.folder === 'clients' && a.project === projectId)?.id ?? null;

export const iconSrc = (key) => {
  const a = BY_ID.get(`icon-${key}`);
  return a ? assetPath(a) : null;
};

/**
 * Fotografía de la presentación.
 *
 * Reserva el hueco con su proporción real, muestra primero una vista previa de
 * 24 px desenfocada y la sustituye por la imagen buena al llegar. Con `srcset`
 * el móvil descarga la versión de 960 px. `depth` la mete en el paralaje: las
 * capas con más profundidad se mueven más con el puntero.
 */
export function Photo({ id, className = '', fit = 'cover', depth = 0, kenBurns = false, eager = false, position, style, sizes = '(max-width: 900px) 100vw, 60vw' }) {
  const a = useAsset(id);
  const [loaded, setLoaded] = useState(false);
  const img = useRef(null);

  useEffect(() => {
    setLoaded(Boolean(img.current?.complete && img.current.naturalWidth));
  }, [id]);

  if (!a) return null;
  // la versión «-960» mide hasta 1.280 px: el navegador elige según pantalla y densidad
  const srcSet = a.small ? `${a.small} ${Math.min(1280, a.srcWidth * 2)}w, ${a.src} ${a.width}w` : undefined;
  return (
    <div
      className={`dphoto${loaded ? ' is-loaded' : ''}${kenBurns ? ' is-kb' : ''} ${className}`.trim()}
      style={{ '--depth': depth, backgroundImage: a.lqip ? `url(${a.lqip})` : undefined, ...style }}
    >
      <img
        ref={img}
        src={a.src}
        srcSet={srcSet}
        sizes={sizes}
        alt={a.alt}
        width={a.width}
        height={a.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ objectFit: fit, objectPosition: position }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

/** Logo de cliente sobre placa clara si su diseño lo pide (casi todos). */
export function LogoPlate({ id, className = '', onClick, active, title, style }) {
  const a = useAsset(id);
  if (!a) return null;
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className={`logoplate${a.onLight ? ' logoplate--light' : ''}${active ? ' is-active' : ''} ${className}`.trim()}
      onClick={onClick}
      title={title ?? a.client}
      aria-pressed={onClick ? Boolean(active) : undefined}
      style={style}
    >
      <img src={a.src} alt={a.alt} width={a.width} height={a.height} loading="lazy" decoding="async" />
    </Tag>
  );
}

/** Icono de la iconografía propia de MTI (extraída y recoloreada al dorado). */
export function MtiIcon({ name, className = '' }) {
  // la presentación no tiene icono para todo: `app:bus` usa la iconografía de la ciudad
  if (name?.startsWith('app:')) return <Icon name={name.slice(4)} />;
  const src = iconSrc(name);
  if (!src) return null;
  return <img className={`mti-icon ${className}`.trim()} src={src} alt="" aria-hidden="true" />;
}

/**
 * Logo real de una herramienta (Gmail, Odoo, SAP…) sobre una ficha blanca: la
 * misma ficha para todos, así conviven marcas de colores muy distintos.
 */
export function BrandLogo({ id, size = 'm', className = '', title }) {
  const src = logoSrc(id);
  if (!src) return null;
  const l = LOGOS[id];
  return (
    <span
      className={`brand-logo brand-logo--${size}${l.wide ? ' brand-logo--wide' : ''} ${className}`.trim()}
      title={title ?? l.name}
      role="img"
      aria-label={l.name}
      style={{ '--logo': `url("${src}")` }}
    />
  );
}

/* ================================================================== */
/* Rótulos anclados a la ciudad 3D                                      */
/* ================================================================== */

/**
 * Un rótulo que la ciudad coloca, frame a frame, sobre el edificio de un caso
 * de uso. Es la forma de poner cifras y capacidades «dentro» del escenario.
 */
export function CityPin({ solution, lift = 70, children, className = '', tone = 'gold', show = true, delay = 0 }) {
  const ref = useRef(null);
  useCityAnchor(ref, solution, lift);
  return (
    <div ref={ref} className={`citypin citypin--${tone}${show ? ' is-on' : ''} ${className}`.trim()} style={{ '--d': `${delay}ms` }}>
      <div className="citypin__body">{children}</div>
      <i className="citypin__stem" />
      <i className="citypin__dot" />
    </div>
  );
}

/* ================================================================== */
/* Enlaces a la ciudad 3D                                              */
/* ================================================================== */

/**
 * Botón «ver esto en la ciudad 3D». Solo aparece si el caso de uso existe de
 * verdad en el catálogo cargado: si no hay relación, no se inventa.
 */
export function SolutionButton({ id, layer, compact = false, label }) {
  const solutions = useStore((s) => s.solutions);
  const jump = useStore((s) => s.jumpToSolution);
  const ui = useDeckUi();
  const webgl = useStore((s) => s.webgl);
  const sol = solutions.find((s) => s.id === id);
  if (!sol || !webgl) return null;
  return (
    <button className={`dbtn dbtn--city${compact ? ' dbtn--compact' : ''}`} onClick={() => jump(id, { layer })} title={`${ui.openSolution} · ${sol.title}`}>
      <Icon name="city" />
      <span>{label ?? ui.openSolution}</span>
      {!compact && <em>{sol.title}</em>}
    </button>
  );
}

/** Documentación, solo si el PDF existe de verdad en el servidor. */
export function DocButton({ id }) {
  const solutions = useStore((s) => s.solutions);
  const jump = useStore((s) => s.jumpToSolution);
  const openDoc = useStore((s) => s.openDoc);
  const webgl = useStore((s) => s.webgl);
  const sol = solutions.find((s) => s.id === id);
  if (!sol?.docAvailable || !webgl) return null;
  return (
    <button
      className="dbtn dbtn--ghost dbtn--compact"
      onClick={() => {
        jump(id);
        openDoc(sol);
      }}
    >
      <Icon name="doc" />
      <span>PDF</span>
    </button>
  );
}

/* ================================================================== */
/* Selector con píldora deslizante                                     */
/* ================================================================== */

/**
 * Mide el elemento activo de un selector y deja su posición en variables CSS:
 * la píldora dorada se desliza de uno a otro en vez de saltar.
 */
export function useGlider(activeIndex) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const nav = ref.current;
    if (!nav) return undefined;
    const place = () => {
      const items = nav.querySelectorAll(':scope > button');
      const el = items[activeIndex];
      if (!el) {
        nav.style.setProperty('--gw', '0px');
        return;
      }
      nav.style.setProperty('--gx', `${el.offsetLeft}px`);
      nav.style.setProperty('--gw', `${el.offsetWidth}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activeIndex]);
  return ref;
}

/* ================================================================== */
/* Relevo entre bloques                                                */
/* ================================================================== */

/**
 * Cuando cambia `id`, el bloque anterior no desaparece de golpe: se queda
 * medio segundo saliendo (se desvanece, sube y se desenfoca) mientras el nuevo
 * entra. Los dos van envueltos con su `id` como clave, así que el saliente NO
 * se vuelve a montar: sus animaciones no se repiten, solo se retira.
 */
export function Swap({ id, children, ms = 520 }) {
  const [state, setState] = useState({ id, gone: [] });
  const lastNode = useRef(children);

  // relevo calculado en el render: el bloque saliente no llega a desmontarse
  if (state.id !== id) {
    setState({ id, gone: [...state.gone.filter((g) => g.id !== id && g.id !== state.id), { id: state.id, node: lastNode.current }] });
  }

  useLayoutEffect(() => {
    lastNode.current = children;
  });

  useEffect(() => {
    if (!state.gone.length) return undefined;
    const t = setTimeout(() => setState((st) => ({ ...st, gone: [] })), ms);
    return () => clearTimeout(t);
  }, [state.gone, ms]);

  return (
    <>
      {state.gone.map((g) => (
        <div key={g.id} className="swap swap--out" aria-hidden="true">
          {g.node}
        </div>
      ))}
      <div key={id} className="swap">
        {children}
      </div>
    </>
  );
}

/* ================================================================== */
/* Tipografía y cifras                                                 */
/* ================================================================== */

export function Kicker({ children, className = '' }) {
  return (
    <span className={`dkicker ${className}`.trim()}>
      <i />
      {children}
    </span>
  );
}

/** Titular en dos tiempos: la segunda línea en dorado, cada palabra entra sola. */
export function Headline({ parts, as: Tag = 'h2', className = '', size = 'l' }) {
  const [a, b] = Array.isArray(parts) ? parts : [parts, null];
  let k = 0;
  const words = (text, gold) =>
    String(text)
      .split(' ')
      .map((w, i) => (
        <span key={`${gold}${i}`} className={`hw${gold ? ' hw--gold' : ''}`} style={{ '--i': k++ }}>
          {w}{' '}
        </span>
      ));
  return (
    <Tag className={`dhead dhead--${size} ${className}`.trim()}>
      <span className="dhead__line">{words(a, false)}</span>
      {b && <span className="dhead__line">{words(b, true)}</span>}
    </Tag>
  );
}

/** Cuenta hasta la cifra (25+, 150K+, 1.900…). Lo que no es número se deja tal cual. */
export function Counter({ value, run = true, duration = 1400 }) {
  const raw = /^([−-]?)(\d[\d.,]*)(.*)$/.exec(String(value));
  // no se animan los años («2005») ni las fracciones («24/7»): a medio
  // camino dirían algo falso («1530», «18/7»)
  const isYear = raw && /^\d{4}$/.test(raw[2]) && !raw[3].trim();
  const isRatio = raw && raw[3].trim().startsWith('/');
  // ni los rangos («6–14», «10–20%»)
  const isRange = raw && /^\s*[–-]\s*\d/.test(raw[3]);
  const m = isYear || isRatio || isRange ? null : raw;
  const target = m ? Number(m[2].replace(/\./g, '').replace(',', '.')) : NaN;
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!m || !run || !Number.isFinite(target)) return undefined;
    let raf;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, run]);
  if (!m || !Number.isFinite(target) || !run) return <>{value}</>;
  const shown = v >= target - 0.001 ? m[2] : Math.round(v).toLocaleString('es-ES');
  return (
    <>
      {m[1]}
      {shown}
      {m[3]}
    </>
  );
}

/** Lectura de telemetría ilustrativa: estado de equipos, nunca cifras de negocio. */
export function Telemetry({ rows, paused, className = '' }) {
  const ui = useDeckUi();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (paused) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 1300);
    return () => clearInterval(id);
  }, [paused]);
  const time = new Date(Date.now()).toLocaleTimeString('es-ES', { hour12: false });
  return (
    <div className={`telemetry ${className}`.trim()} aria-hidden="true">
      <div className="telemetry__head">
        <i />
        {time}
        <em>{ui.illustrative}</em>
      </div>
      {rows.map((r, i) => (
        <div key={r} className="telemetry__row" style={{ '--i': i }}>
          <span>{r}</span>
          <b className={(tick + i) % 7 === 0 ? 'is-warn' : ''}>{(tick + i) % 7 === 0 ? 'SYNC' : 'OK'}</b>
          <i className="telemetry__bar" style={{ '--w': `${35 + (((tick + i) * 37) % 60)}%` }} />
        </div>
      ))}
    </div>
  );
}

export { Icon };
