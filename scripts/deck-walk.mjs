/**
 * Comprobación de extremo a extremo del recorrido corporativo.
 *
 *   npm run dev
 *   npm run deck:check                 (sin ventana, con la GPU real del equipo)
 *   SOFTWARE_GL=1 npm run deck:check   (WebGL por software: para máquinas sin GPU; muy lento)
 *
 * Ojo: una ventana visible colocada fuera de la pantalla NO sirve para medir
 * animaciones: Windows la da por tapada y el navegador la deja a 2-3 fps.
 *
 * Recorre los siete capítulos paso a paso, el recorrido de Agentify AI
 * (entradas desde proyectos y cierre, sus seis capítulos, el filtro de casos,
 * la ida a la ciudad y la vuelta al punto exacto), prueba el globo (selección,
 * arrastre, redimensionado, salir y volver a entrar), la rueda del ratón, el
 * salto a una solución y el regreso al punto exacto con su selección, que la
 * ciudad 3D sigue funcionando sola, y el diseño en móvil. Deja capturas en
 * `.artifacts/deck/` (o en OUT) y termina con error si algo falla.
 */

import puppeteer from 'puppeteer';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5180';
const OUT = process.env.OUT || '.artifacts/deck';
const SOFTWARE = process.env.SOFTWARE_GL === '1';
fs.mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pulsa «Conocer MTI» y espera a que el recorrido esté montado (con reintento). */
async function enterDeck(pg) {
  for (let i = 0; i < 3; i++) {
    await pg.click('.choice--deck').catch(() => {});
    const ok = await pg.waitForSelector('.deck', { timeout: 20000 }).then(() => true, () => false);
    if (ok) return;
    const mode = await pg.evaluate(() => window.__mtiStore?.getState().mode).catch(() => '?');
    console.log(`  (reintento de entrada: modo ${mode})`);
  }
  throw new Error('no se consigue entrar al recorrido');
}
const log = (...a) => console.log('·', ...a);
const fail = (msg) => {
  throw new Error(msg);
};

const browser = await puppeteer.launch({
  headless: 'new',
  protocolTimeout: 240000,
  args: SOFTWARE
    ? ['--enable-unsafe-swiftshader', '--use-gl=swiftshader', '--no-sandbox', '--window-size=1440,900']
    : ['--use-angle=d3d11', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-gpu', '--window-size=1440,900'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
/* «THREE.WebGLRenderer: Context Lost.» lo escribe Three.js al LIBERAR a propósito
   un lienzo (al salir del recorrido se desmonta el suyo): no es un fallo. */
page.on('console', (m) => {
  const t = m.text();
  if (/Context Lost/.test(t)) return;
  if (m.type() === 'error' || /WebGL|Too many active/i.test(t)) errors.push(`${m.type()}: ${t.slice(0, 240)}`);
});
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
page.on('response', (r) => {
  if (r.status() >= 400 && !r.url().includes('/api/')) errors.push(`http ${r.status()}: ${r.url()}`);
});

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });
const store = (fn, arg) => page.evaluate(fn, arg);
const state = () =>
  store(() => {
    const s = window.__mtiStore.getState();
    return { mode: s.mode, chapter: s.deckChapter, step: s.deckStep, sel: s.deckSel, activeId: s.activeId, cityLive: s.cityLive, ret: s.deckReturn };
  });
const go = async (c, s, ms = 1500) => {
  await store(([a, b]) => window.__mtiStore.getState().deckGoto(a, b), [c, s]);
  await wait(ms);
};

const t0 = Date.now();
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
log('esperando la portada…');
await page.waitForFunction(() => document.querySelector('.intro:not(.hidden)'), { timeout: 300000 });
log(`portada lista en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await wait(1000);
await shot('00-portada');

/* ------------------------------------------------------------------ */
/* 1 · entrada al recorrido                                            */
/* ------------------------------------------------------------------ */

await page.click('.choice--deck');
await page.waitForSelector('.deck', { timeout: 60000 });
await page.waitForSelector('.deck-stage canvas', { timeout: 60000 });
await wait(3500); // el logo se construye
await shot('01-apertura-logo');
const introHidden = await page.$eval('.intro', (e) => e.classList.contains('hidden'));
if (!introHidden) fail('la portada sigue visible encima del recorrido');

/* ------------------------------------------------------------------ */
/* 2 · salto a la ciudad y regreso (antes de nada: ciudad fresca)       */
/* ------------------------------------------------------------------ */

log('salto desde el sector Seguridad a su solución');
await go(2, 1, 2500);
const btn = await page.$('.scene--sectors .dbtn--city');
if (!btn) fail('el sector no ofrece enlace a la solución');
const reachable = await page.evaluate((el) => {
  const r = el.getBoundingClientRect();
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return el === hit || el.contains(hit);
}, btn);
if (!reachable) fail('el enlace a la solución está tapado');
await btn.click();
await page.waitForFunction(() => !document.querySelector('.deck'), { timeout: 60000 });
await wait(2500);
let st = await state();
log('en la ciudad:', JSON.stringify({ mode: st.mode, activeId: st.activeId, ret: st.ret }));
if (st.mode !== 'city' || st.activeId !== 'urban-security' || !st.ret) fail('el salto no llegó a la solución');
await shot('02-ciudad-desde-el-recorrido');

await page.click('.chip-btn--deck');
await page.waitForSelector('.deck', { timeout: 60000 });
await wait(1500);
st = await state();
log('de vuelta:', JSON.stringify({ chapter: st.chapter, step: st.step }));
if (st.chapter !== 2 || st.step !== 1) fail('no se volvió al punto exacto');

/* ------------------------------------------------------------------ */
/* 3 · los siete capítulos, paso a paso                                */
/* ------------------------------------------------------------------ */

const chapters = await store(() => window.__mtiStore.getState().chapterSteps?.() ?? null);
const steps = [7, 4, 8, 7, 7, 10, 7];
const report = [];
for (let c = 0; c < steps.length; c++) {
  for (let s = 0; s < steps[c]; s++) {
    await go(c, s, c === 1 || c === 3 || c === 4 ? 2200 : 1800);
    const info = await page.evaluate(() => {
      const scene = document.querySelector('.deck__scene');
      const vis = [...scene.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 30 && r.height > 12 && getComputedStyle(e).visibility !== 'hidden';
      }).length;
      const stage = document.querySelector('.deck-stage');
      return { vis, stage: stage?.classList.contains('is-on') ?? false };
    });
    if (info.vis < 2) fail(`capítulo ${c + 1} paso ${s + 1}: la escena no pinta nada`);
    await shot(`c${c + 1}-p${String(s + 1).padStart(2, '0')}`);
    report.push(`${c + 1}.${s + 1}${info.stage ? '·3D' : ''}`);
  }
}
log('escenas:', report.join(' '));

/* ------------------------------------------------------------------ */
/* 3b · Agentify AI: otro recorrido, con entrada y vuelta               */
/* ------------------------------------------------------------------ */

const track = () => store(() => window.__mtiStore.getState().deckTrack);

log('Agentify AI: entrada desde «Explorar más proyectos»');
await go(5, 0, 2200);
await page.click('.track-cards--projects .track-card');
await wait(2500);
st = await state();
const tProj = await track();
if (tProj !== 'agentify' || st.chapter !== 3 || st.step !== 0) fail(`«Explorar más proyectos» no abre los casos de Agentify: ${JSON.stringify({ tProj, c: st.chapter, s: st.step })}`);
await shot('a0-casos-desde-proyectos');

// filtro por agente: deja solo los casos donde trabaja
await page.evaluate(() => [...document.querySelectorAll('.agc-filter .ag-badge')].find((x) => x.textContent.includes('C03'))?.click()); // C03 · voz
await wait(900);
const shown = await page.$$eval('.agc-card:not(.is-off)', (l) => l.length);
if (shown < 1 || shown >= 14) fail(`el filtro por agente no filtra: ${shown}`);
log(`filtro C03: ${shown} casos`);
await shot('a1-filtro-voz');
await store(() => window.__mtiStore.getState().setDeckSel('agentFilter', null));

// volver a la presentación MTI: al punto exacto (proyectos, paso 1)
await page.click('.deck__crumb');
await wait(1800);
st = await state();
if ((await track()) !== 'mti' || st.chapter !== 5 || st.step !== 0) fail(`«Presentación MTI» no devuelve al punto de salida: ${JSON.stringify(st)}`);

log('Agentify AI: entrada desde «Explorar otros servicios» y recorrido completo');
await go(6, 6, 2200);
await page.click('.track-cards--closing .track-card');
await wait(2500);
if ((await track()) !== 'agentify') fail('«Explorar otros servicios» no abre Agentify');
const AG = [3, 3, 9, 15, 5, 3];
const agReport = [];
for (let c = 0; c < AG.length; c++) {
  for (let s2 = 0; s2 < AG[c]; s2++) {
    await go(c, s2, c === 1 || c === 2 ? 2200 : 1700);
    const vis = await page.evaluate(() => [...document.querySelectorAll('.deck__scene *')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 30 && r.height > 12;
    }).length);
    if (vis < 2) fail(`Agentify ${c + 1}.${s2 + 1}: la escena no pinta nada`);
    await shot(`ag${c + 1}-p${String(s2 + 1).padStart(2, '0')}`);
    agReport.push(`${c + 1}.${s2 + 1}`);
  }
}
log('Agentify escenas:', agReport.join(' '));

// ida a la ciudad desde Agentify y vuelta: debe volver a Agentify, al mismo paso
await go(2, 3, 1500);
await page.click('.deck__cta');
await page.waitForFunction(() => !document.querySelector('.deck'), { timeout: 60000 });
await wait(2000);
await page.click('.chip-btn--deck');
await page.waitForSelector('.deck', { timeout: 60000 });
await wait(1500);
st = await state();
if ((await track()) !== 'agentify' || st.chapter !== 2 || st.step !== 3) fail(`al volver de la ciudad no se retoma Agentify: ${JSON.stringify({ c: st.chapter, s: st.step })}`);
log('Agentify: ida y vuelta a la ciudad, bien');

// índice con pestañas de recorrido
await page.keyboard.press('Escape');
await page.waitForSelector('.idx-tracks', { timeout: 8000 });
await wait(600);
await shot('a2-indice-recorridos');
await page.click('.idx-tracks button:first-child');
await wait(400);
await page.click('.idx-grid .idx-card:nth-child(3)');
await wait(1800);
st = await state();
if ((await track()) !== 'mti' || st.chapter !== 2) fail('el índice no lleva a otro recorrido');
log('índice por recorridos: bien');

/* ------------------------------------------------------------------ */
/* 4 · el globo                                                        */
/* ------------------------------------------------------------------ */

log('globo: selección, arrastre, redimensionado y reentrada');
await go(1, 3, 2500);
await page.click('.world-pill:nth-child(5)');
await wait(2200);
st = await state();
if (!st.sel.place) fail('seleccionar una ubicación no la marca');
const card = await page.$('.world-card');
if (!card) fail('la tarjeta de la ubicación no aparece');
await shot('g1-ubicacion');

// arrastre sobre el globo: la esfera ocupa el centro-derecha
const box = await page.$eval('.deck-stage canvas', (c) => {
  const r = c.getBoundingClientRect();
  return { x: r.left + r.width * 0.64, y: r.top + r.height * 0.5 };
});
await store(() => window.__mtiStore.getState().setDeckSel('place', null));
await wait(600);
await page.mouse.move(box.x, box.y);
await page.mouse.down();
for (let i = 0; i < 12; i++) {
  await page.mouse.move(box.x - i * 18, box.y + i * 3);
  await wait(16);
}
await page.mouse.up();
await wait(900);
await shot('g2-arrastre');

// cambio de tamaño
await page.setViewport({ width: 1100, height: 760 });
await wait(1500);
const sized = await page.$eval('.deck-stage canvas', (c) => ({ w: c.clientWidth, h: c.clientHeight, iw: window.innerWidth, ih: window.innerHeight }));
if (Math.abs(sized.w - sized.iw) > 2 || Math.abs(sized.h - sized.ih) > 2) fail(`el lienzo no se adapta al tamaño: ${JSON.stringify(sized)}`);
await shot('g3-redimensionado');
await page.setViewport({ width: 1440, height: 900 });
await wait(800);

// salir y volver a entrar varias veces: nada de contextos nuevos
for (let k = 0; k < 4; k++) {
  await go(3, 2, 1200);
  await go(1, 1, 1500);
}
const canvases = await page.$$eval('canvas', (l) => l.length);
log(`lienzos WebGL en la página tras 4 reentradas: ${canvases}`);
await shot('g4-reentrada');

/* ------------------------------------------------------------------ */
/* 5 · rueda del ratón y pausa                                         */
/* ------------------------------------------------------------------ */

await go(3, 0, 1200);
await page.mouse.move(700, 450);
await page.mouse.wheel({ deltaY: 240 });
await wait(900);
st = await state();
if (st.chapter !== 3 || st.step !== 1) fail(`la rueda no avanza un paso: ${JSON.stringify({ c: st.chapter, s: st.step })}`);
await page.keyboard.press('p');
await wait(300);
const paused = await store(() => window.__mtiStore.getState().deckPaused);
if (!paused) fail('P no pausa');
await page.keyboard.press('p');
log('rueda y pausa: bien');

/* ------------------------------------------------------------------ */
/* 6 · índice, fuentes, más información                                */
/* ------------------------------------------------------------------ */

await page.keyboard.press('Escape');
await page.waitForSelector('.idx-grid', { timeout: 8000 });
await wait(700);
await shot('i1-indice');
await page.keyboard.press('Escape');
await wait(300);
await page.keyboard.press('f');
await page.waitForSelector('.srctable', { timeout: 8000 });
const reviews = await page.$$eval('.reviewlist li strong', (n) => n.map((x) => x.textContent));
log(`pendientes de validación (${reviews.length}):`, reviews.join(' | '));
await shot('i2-fuentes');
await page.keyboard.press('Escape');
await go(4, 2, 1800);
await page.click('.platform-panel .dbtn--ghost');
await page.waitForSelector('.info__panel', { timeout: 8000 });
await wait(600);
await shot('i3-mas-informacion');
await page.keyboard.press('Escape');

/* ------------------------------------------------------------------ */
/* 7 · la ciudad sigue funcionando sola                                */
/* ------------------------------------------------------------------ */

await go(0, 0, 800);
await page.click('.deck__cta');
await page.waitForFunction(() => !document.querySelector('.deck'), { timeout: 60000 });
await wait(2500);
st = await state();
const city = await store(() => {
  const s = window.__mtiStore.getState();
  return { dataLayer: s.dataLayer, filters: s.filterCapabilities.length + s.filterIndustries.length, snap: Boolean(s.citySnapshot) };
});
log('ciudad tras salir:', JSON.stringify(city));
if (city.snap) fail('la ciudad no se ha devuelto a su estado');
await store(() => window.__mtiStore.getState().select('stadium'));
await wait(3500);
await shot('z1-ciudad-original');

/* ------------------------------------------------------------------ */
/* 8 · móvil                                                           */
/* ------------------------------------------------------------------ */

// cambiar a modo móvil recarga la página: hay que volver a entrar
await Promise.all([
  page.waitForNavigation({ timeout: 15000 }).catch(() => {}),
  page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }),
]);
await page.waitForFunction(() => document.querySelector('.intro:not(.hidden)'), { timeout: 300000 });
await wait(800);
await shot('m0-portada');
await page.click('.choice--deck');
await page.waitForSelector('.deck', { timeout: 60000 });
await wait(2500);
for (const [c, s, n] of [
  [0, 0, 'm1-apertura'],
  [0, 6, 'm2-cifras'],
  [1, 3, 'm3-globo'],
  [2, 3, 'm4-sector'],
  [3, 3, 'm5-entrega'],
  [4, 5, 'm6-plataforma'],
  [5, 1, 'm7-proyecto'],
  [6, 0, 'm8-clientes'],
  [6, 6, 'm9-cierre'],
]) {
  await go(c, s, 2000);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 2) fail(`desbordamiento horizontal en móvil (${n}): ${over}px`);
  await shot(n);
}
for (const [c, s2, n] of [
  [0, 0, 'ma1-portada'],
  [1, 1, 'ma2-arquitectura'],
  [2, 2, 'ma3-agente'],
  [3, 0, 'ma4-casos'],
  [3, 11, 'ma5-caso'],
  [4, 4, 'ma6-entrega'],
  [5, 0, 'ma7-razones'],
]) {
  await store(([a, b]) => window.__mtiStore.getState().openTrack('agentify', a, b), [c, s2]);
  await wait(2000);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 2) fail(`desbordamiento horizontal en móvil (${n}): ${over}px`);
  await shot(n);
}
await store(() => window.__mtiStore.getState().backToMainTrack());
log('móvil: sin desbordamiento horizontal');

/* ------------------------------------------------------------------ */
/* 9 · movimiento reducido                                             */
/* ------------------------------------------------------------------ */

// volver de la emulación móvil recarga la página: se espera a esa recarga
// antes de seguir, o las comprobaciones siguientes se hacen sobre la vieja
await Promise.all([page.waitForNavigation({ timeout: 15000 }).catch(() => {}), page.setViewport({ width: 1440, height: 900 })]);
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.querySelector('.intro:not(.hidden)'), { timeout: 300000 });
// el velo de carga tarda un instante en desvanecerse: se pulsa cuando ya no tapa
await page.waitForFunction(() => getComputedStyle(document.querySelector('.loader')).visibility === 'hidden', { timeout: 10000 });
await enterDeck(page);
const still = await page.evaluate(() => ({
  motion: window.__mtiStore.getState().motionEnabled,
  frozen: document.querySelector('.deck').classList.contains('deck--still'),
}));
log('movimiento reducido:', JSON.stringify(still));
if (still.motion || !still.frozen) fail('prefers-reduced-motion no congela el recorrido');
await go(5, 1, 1200);
await shot('r1-movimiento-reducido');
await page.emulateMediaFeatures([]);

/* ------------------------------------------------------------------ */
/* 10 · equipo sin WebGL                                                */
/* ------------------------------------------------------------------ */

const noGl = await browser.newPage();
await noGl.setViewport({ width: 1440, height: 900 });
await noGl.evaluateOnNewDocument(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    if (/webgl/i.test(type)) return null;
    return orig.call(this, type, ...rest);
  };
});
const noGlErrors = [];
noGl.on('pageerror', (e) => noGlErrors.push(e.message));
await noGl.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await noGl.waitForFunction(() => document.querySelector('.intro:not(.hidden)'), { timeout: 60000 });
await noGl.waitForFunction(() => getComputedStyle(document.querySelector('.loader')).visibility === 'hidden', { timeout: 10000 });
const cityDisabled = await noGl.$eval('.choice--city', (b) => b.disabled);
if (!cityDisabled) fail('sin WebGL, «Explorar soluciones» debería estar desactivado');
await noGl.click('.choice--deck');
await noGl.waitForSelector('.deck', { timeout: 60000 });
await noGl.evaluate(() => window.__mtiStore.getState().deckGoto(1, 2));
await wait(1200);
if (!(await noGl.$('.flatglobe'))) fail('sin WebGL no aparece el mapa plano');
await noGl.screenshot({ path: `${OUT}/w1-sin-webgl-globo.png` });
await noGl.evaluate(() => window.__mtiStore.getState().deckGoto(0, 6));
await wait(1000);
await noGl.screenshot({ path: `${OUT}/w2-sin-webgl-cifras.png` });
await noGl.evaluate(() => window.__mtiStore.getState().openTrack('agentify', 2, 1));
await wait(1500);
if (!(await noGl.$('.agx .fd'))) fail('sin WebGL, la ficha de agente de Agentify no se pinta');
await noGl.screenshot({ path: `${OUT}/w3-sin-webgl-agentify.png` });
log(`sin WebGL: portada y recorrido en versión plana · errores ${noGlErrors.length}`);
noGlErrors.forEach((e) => errors.push(`sin WebGL: ${e}`));
await noGl.close();

console.log(`\nERRORES DE CONSOLA: ${errors.length}`);
errors.slice(0, 20).forEach((e) => console.log('  !', e));
fs.writeFileSync(`${OUT}/errors.txt`, errors.join('\n'));
console.log(`capturas en ${OUT}`);
await browser.close();
if (errors.length) process.exitCode = 1;
