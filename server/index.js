import express from 'express';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SOLUTIONS, INDUSTRIES, CAPABILITIES, buildMatrix } from '../src/data/solutions.js';

/**
 * Backend del MTI Solutions Explorer.
 *  - GET /api/solutions   catálogo + disponibilidad real de cada PDF
 *  - GET /api/health      ping
 *  - /docs/*              PDFs de documentación (carpeta server/docs)
 *  - en producción sirve además el build de React desde /dist
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, 'docs');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 5181;

fs.mkdirSync(DOCS_DIR, { recursive: true });

const app = express();
app.use(compression());
app.use(express.json());

/** ¿Existe el PDF de esta solución en server/docs? */
const docExists = (pdf) => {
  if (!pdf) return false;
  const file = path.basename(pdf);
  return fs.existsSync(path.join(DOCS_DIR, file));
};

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'mti-solutions-explorer', time: new Date().toISOString() });
});

app.get('/api/solutions', (_req, res) => {
  res.json({
    industries: INDUSTRIES,
    capabilities: CAPABILITIES,
    matrix: buildMatrix(),
    solutions: SOLUTIONS.map((s) => ({
      ...s,
      docUrl: s.pdf ? `/docs/${path.basename(s.pdf)}` : null,
      docAvailable: docExists(s.pdf),
    })),
  });
});

app.get('/api/solutions/:id', (req, res) => {
  const sol = SOLUTIONS.find((s) => s.id === req.params.id);
  if (!sol) return res.status(404).json({ error: 'solution not found' });
  res.json({ ...sol, docUrl: sol.pdf ? `/docs/${path.basename(sol.pdf)}` : null, docAvailable: docExists(sol.pdf) });
});

app.use(
  '/docs',
  express.static(DOCS_DIR, {
    setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
  })
);

// Build de producción (npm run build && npm start)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get(/^\/(?!api|docs).*/, (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));
}

app.listen(PORT, () => {
  console.log(`\n  MTI Solutions Explorer · API  →  http://localhost:${PORT}/api/solutions`);
  console.log(`  Documentación (PDFs)          →  ${DOCS_DIR}\n`);
});
