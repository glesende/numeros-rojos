#!/usr/bin/env node
// Benchmark local QR vs facial (tarea #373). Uso: node run.mjs [--n 100] [--seed 373] [--out ../../docs/benchmark-accesos]
// Levanta Vite (frontend/), abre Chrome headless con una cámara sintética (canvas) y corre la MISMA secuencia
// de N intentos con el motor QR y con el facial de la PoC. Sin cámara real ni datos de socios.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import { execSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const frontend = resolve(here, '../../frontend');
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const N = Number(arg('n', 100)), SEED = Number(arg('seed', 373));
const OUT = resolve(here, arg('out', '../../docs/benchmark-accesos'));
const CHROME = arg('chrome', process.env.CHROME_BIN || '/usr/bin/google-chrome');
const GL = arg('gl', 'swiftshader'); // swiftshader (GL por software, reproducible en cualquier equipo) | default (GPU real)

const { chromium } = createRequire(import.meta.url)('playwright-core');
const { createServer } = await import(pathToFileURL(createRequire(join(frontend, 'package.json')).resolve('vite')).href);
const { percentile, median, summarize } = await import(pathToFileURL(join(frontend, 'src/lib/accessPoc/stats.js')).href);

mkdirSync(OUT, { recursive: true });
const server = await createServer({ root: frontend, configFile: join(frontend, 'vite.config.js'), server: { port: 5199, host: '127.0.0.1', strictPort: true }, logLevel: 'error' });
await server.listen();
const base = 'http://127.0.0.1:5199';

const args = ['--headless=new', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
if (GL === 'swiftshader') args.push('--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist');
else args.push('--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=default');
const browser = await chromium.launch({ executablePath: CHROME, args });
const version = browser.version();
const bsession = await browser.newBrowserCDPSession();
const cpuTotal = async () => { // CPU acumulada (s) de todos los procesos de Chrome (browser + GPU + renderers)
  const { processInfo } = await bsession.send('SystemInfo.getProcessInfo');
  return processInfo.reduce((s, p) => s + p.cpuTime, 0);
};

const runs = [];
async function run(method, engine) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const bytes = { models: 0, requests: 0 };
  page.on('response', async (r) => { // peso de modelos descargados (modelos faciales servidos por Vite)
    if (r.url().includes('/poc-modelos-facial/')) { const b = await r.body().catch(() => null); if (b) bytes.models += b.length; }
  });
  page.on('console', (m) => { if (m.type() === 'error') console.error('  [page]', m.text()); });
  await page.goto(`${base}/bench/accesos.html`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction('window.benchReady === true', null, { timeout: 180000 });
  const cpu0 = await cpuTotal(); const w0 = Date.now();
  const res = await page.evaluate((o) => window.runBench(o), { method, engine, n: N, seed: SEED });
  const wall = (Date.now() - w0) / 1000; const cpu = (await cpuTotal()) - cpu0;
  await ctx.close();
  return { ...res, cpu_s: cpu, wall_s: wall, models_bytes: bytes.models };
}

console.log(`Chrome ${version} · N=${N} · seed=${SEED} · gl=${GL}`);
runs.push(await run('qr', 'jsqr'));
const native = await run('qr', 'auto');
if (native.engine === 'BarcodeDetector') runs.push(native); else console.log('BarcodeDetector no disponible en este navegador: solo jsQR.');
runs.push(await run('face', 'auto'));
await browser.close(); await server.close();

// ── Resumen ──
const toAttempt = (r) => ({ decision: r.decision, correct: !!r.correct, error: r.error, totalMs: r.total_ms === '' ? null : r.total_ms });
const r1 = (v) => (v === null ? null : Math.round(v * 10) / 10);
const summary = runs.map((r) => {
  const s = summarize(r.rows.map(toAttempt));
  const name = r.rows[0].method;
  return {
    method: name, engine: r.engine, backend: r.backend, n: s.n, median_ms: r1(s.median), p95_ms: r1(s.p95), min_ms: r1(s.min), max_ms: r1(s.max), mean_ms: r1(s.mean),
    accuracy_pct: Math.round(s.accuracy * 1000) / 10, false_accept: s.falseAccept, false_reject: s.falseReject, timeouts: s.timeouts,
    compute_median_ms: r1(median(r.rows.filter((x) => x.compute_ms !== '').map((x) => x.compute_ms).sort((a, b) => a - b))),
    cpu_s_total: r1(r.cpu_s), cpu_ms_per_attempt: Math.round((r.cpu_s * 1000) / s.n), wall_s: r1(r.wall_s),
    load_ms: Math.round(r.load_ms), js_heap_peak_mb: Math.round(r.max_heap_bytes / 1048576), models_downloaded_mb: Math.round((r.models_bytes / 1048576) * 100) / 100,
  };
});

// Peso de lo que descarga el usuario (si hay build en frontend/dist): chunk de jsQR y de face-api (gzip).
const dist = join(frontend, 'dist/assets');
const weights = {};
if (existsSync(dist)) {
  for (const f of readdirSync(dist).filter((x) => x.endsWith('.js'))) {
    const src = readFileSync(join(dist, f), 'utf8');
    const gz = gzipSync(src).length;
    if (/TinyFaceDetector/.test(src) && src.length > 500000) weights.face_js_gzip_kb = Math.round(gz / 1024);
    else if (/inversionAttempts/.test(src) && src.length < 100000) weights.qr_js_gzip_kb = Math.round(gz / 1024);
  }
}
const modelsDir = join(frontend, 'public/poc-modelos-facial');
weights.face_models_mb = Math.round((readdirSync(modelsDir).reduce((s, f) => s + statSync(join(modelsDir, f)).size, 0) / 1048576) * 10) / 10;

const cpus = os.cpus();
const gpuNote = GL === 'swiftshader' ? 'WebGL por software (SwiftShader), sin GPU' : 'GPU del equipo';
const env = {
  date: new Date().toISOString().slice(0, 10), machine: `${cpus[0].model.trim()} · ${cpus.length} hilos · ${Math.round(os.totalmem() / 2 ** 30)} GB RAM`,
  os: `${os.type()} ${os.release()}`, browser: `Chrome ${version} (headless=new)`, webgl: gpuNote, node: process.version,
  commit: (() => { try { return execSync('git rev-parse --short HEAD', { cwd: frontend }).toString().trim(); } catch { return ''; } })(),
  n: N, seed: SEED, camera: 'sintética: canvas 1280x720 → captureStream → <video>', timeout_ms: 5000, face_threshold: 0.6,
  weights,
};

const cols = ['method', 'attempt', 'expected', 'decision', 'correct', 'error', 'total_ms', 'compute_ms', 'frames'];
const csv = [cols.join(','), ...runs.flatMap((r) => r.rows.map((x) => cols.map((c) => x[c]).join(',')))].join('\n') + '\n';
writeFileSync(join(OUT, 'resultados-crudos.csv'), csv);
writeFileSync(join(OUT, 'resumen.json'), JSON.stringify({ env, summary }, null, 2) + '\n');
console.table(summary);
console.log(env);
