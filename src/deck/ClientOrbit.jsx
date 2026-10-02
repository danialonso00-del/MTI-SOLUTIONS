import React, { useEffect, useRef } from 'react';
import { LogoPlate } from './parts.jsx';

/**
 * Los clientes, como planetas alrededor de MTi.
 *
 * Tres órbitas elípticas inclinadas, cada una a su velocidad y en su sentido.
 * La posición de cada logo se calcula por fotograma: los que pasan por delante
 * se acercan (más grandes, más nítidos, encima) y los de detrás se alejan
 * (más pequeños, más tenues). Con pausa o movimiento reducido se quedan quietos.
 */

const RINGS = [
  { rx: 0.22, ry: 0.095, speed: 0.07, dir: 1 },
  { rx: 0.33, ry: 0.155, speed: 0.045, dir: -1 },
  { rx: 0.43, ry: 0.22, speed: 0.03, dir: 1 },
];

export default function ClientOrbit({ ids, paused }) {
  const root = useRef(null);
  const items = useRef([]);
  const t = useRef(0);

  // reparto: pocos en la órbita interior, más en las exteriores
  const layout = ids.map((id, i) => {
    const ring = i < 4 ? 0 : i < 10 ? 1 : 2;
    const inRing = ids.slice(0, i + 1).filter((_, k) => (k < 4 ? 0 : k < 10 ? 1 : 2) === ring).length - 1;
    const count = ids.filter((_, k) => (k < 4 ? 0 : k < 10 ? 1 : 2) === ring).length;
    return { id, ring, phase: (inRing / count) * Math.PI * 2 + ring * 0.6 };
  });

  useEffect(() => {
    let raf;
    let last = performance.now();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!paused && !reduced) t.current += dt;
      const el = root.current;
      if (el) {
        // en pantallas estrechas las órbitas se recogen para que los logos no se salgan
        const w = el.clientWidth * (el.clientWidth < 600 ? 0.78 : 1);
        const h = el.clientHeight;
        layout.forEach((l, i) => {
          const node = items.current[i];
          if (!node) return;
          const r = RINGS[l.ring];
          const a = l.phase + t.current * r.speed * Math.PI * 2 * r.dir;
          const x = Math.cos(a) * r.rx * w;
          const y = Math.sin(a) * r.ry * h * 2;
          const depth = (Math.sin(a) + 1) / 2; // 0 detrás · 1 delante
          const s = 0.62 + depth * 0.5;
          node.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(3)})`;
          node.style.opacity = (0.35 + depth * 0.65).toFixed(3);
          node.style.zIndex = String(Math.round(depth * 100) + (y > 0 ? 100 : 0));
          node.style.filter = depth < 0.35 ? `blur(${((0.35 - depth) * 4).toFixed(2)}px)` : 'none';
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, ids.join()]);

  return (
    <div className="orbit" ref={root}>
      {RINGS.map((r, i) => (
        <span key={i} className="orbit__ring" style={{ width: `${r.rx * 200}%`, height: `${r.ry * 400}%`, '--i': i }} aria-hidden="true" />
      ))}
      <div className="orbit__sun">
        <span className="orbit__glow" aria-hidden="true" />
        <img src="/brand/logo-mti.png" alt="MTi" />
      </div>
      {layout.map((l, i) => (
        <div key={l.id} className="orbit__item" ref={(n) => (items.current[i] = n)} style={{ '--i': i }}>
          <LogoPlate id={l.id} />
        </div>
      ))}
    </div>
  );
}
