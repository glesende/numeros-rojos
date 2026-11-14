// La PoC /estadio-accesos (#372) debe poder abrirse por URL directa pero no estar enlazada ni indexable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const NEEDLE = 'estadio-accesos';

// Únicos archivos que pueden nombrar la ruta: la declaración de la ruta, el hook de analítica (la excluye) y el postbuild (noindex).
const ALLOWED = new Set([
  'src/App.jsx',
  'src/hooks/usePageTracking.js',
  'scripts/generate-meta-html.js',
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

const textFiles = [...walk(join(root, 'src')), ...walk(join(root, 'public')), ...walk(join(root, 'scripts')), join(root, 'index.html')]
  .filter((f) => /\.(jsx?|html|txt|json|xml|webmanifest)$/.test(f));

test('ningún archivo del frontend enlaza a la ruta oculta (salvo la declaración de la ruta)', () => {
  const offenders = textFiles
    .filter((f) => readFileSync(f, 'utf8').includes(NEEDLE))
    .map((f) => relative(root, f))
    .filter((f) => !ALLOWED.has(f));
  assert.deepEqual(offenders, []);
});

test('la ruta no figura en robots.txt, manifest ni index.html', () => {
  for (const f of ['public/robots.txt', 'public/manifest.json', 'index.html']) {
    assert.ok(!readFileSync(join(root, f), 'utf8').includes(NEEDLE), f);
  }
});

test('la ruta está declarada una sola vez y fuera de la navegación', () => {
  const app = readFileSync(join(root, 'src/App.jsx'), 'utf8');
  assert.equal(app.split(NEEDLE).length - 1, 1);
  assert.match(app, /<Route path=\{HIDDEN_POC_PATH\}/, 'la ruta se declara dentro del Layout');
  assert.match(app, /<Layout>[\s\S]*HIDDEN_POC_PATH[\s\S]*<\/Layout>/, 'la página se renderiza dentro de Layout (navbar y footer)');
  for (const nav of ['src/components/layout/Navbar.jsx', 'src/components/layout/Footer.jsx', 'src/pages/HomePage.jsx', 'src/pages/StadiumPage.jsx']) {
    assert.ok(!readFileSync(join(root, nav), 'utf8').includes(NEEDLE), nav);
  }
});

test('la página se marca noindex y no persiste datos en el navegador', () => {
  const page = readFileSync(join(root, 'src/pages/StadiumAccessPocPage.jsx'), 'utf8');
  assert.match(page, /noindex:\s*true/);
  const code = ['src/pages/StadiumAccessPocPage.jsx', 'src/lib/accessPoc/engines.js', 'src/components/accessPoc/BenchmarkResults.jsx', 'src/components/accessPoc/QrGenerator.jsx']
    .map((f) => readFileSync(join(root, f), 'utf8')).join('\n');
  assert.ok(!/localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|axios/.test(code), 'sin almacenamiento ni red');
});
