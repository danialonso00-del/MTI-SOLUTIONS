import { DECK } from './deck.js';
import { DECK_EN } from './deck.en.js';

/**
 * Mezcla el contenido del recorrido con su traducción.
 *
 * Las listas se traducen POR `id` cuando el elemento lo tiene —así se pueden
 * reordenar o añadir sectores sin desalinear nada— y por posición cuando no
 * (listas de métricas anónimas, cadenas sueltas). Lo que falte se queda en
 * castellano, que es el idioma de referencia: nunca se ve una clave rota.
 */
function merge(base, over) {
  if (over === undefined || over === null) return base;

  if (Array.isArray(base)) {
    if (Array.isArray(over)) return base.map((item, i) => merge(item, over[i]));
    // `over` es un mapa por id
    return base.map((item) => (item && item.id != null ? merge(item, over[item.id]) : item));
  }

  if (base && typeof base === 'object') {
    if (typeof over !== 'object' || Array.isArray(over)) return base;
    const out = { ...base };
    for (const key of Object.keys(over)) out[key] = merge(base[key], over[key]);
    return out;
  }

  return typeof over === 'string' || typeof over === 'number' ? over : base;
}

const CACHE = { es: DECK };

/** El recorrido completo en el idioma pedido. Memorizado: se calcula una vez. */
export function localizeDeck(lang) {
  if (CACHE[lang]) return CACHE[lang];
  const out = merge(DECK, lang === 'en' ? DECK_EN : null);
  CACHE[lang] = out;
  return out;
}

/**
 * Notas de revisión editorial pendientes, recorriendo todo el contenido.
 * No se enseña nunca al cliente: alimenta el panel de fuentes (tecla F).
 */
export function pendingReviews(deck = DECK) {
  const out = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${path}[${n?.id ?? i}]`));
    if (!node || typeof node !== 'object') return;
    if (typeof node.review === 'string') {
      out.push({ path, title: node.title ?? node.name ?? node.label ?? path, note: node.review, src: node.src });
    }
    for (const key of Object.keys(node)) {
      if (key !== 'review') walk(node[key], path ? `${path}.${key}` : key);
    }
  };
  walk(deck, '');
  return out;
}
