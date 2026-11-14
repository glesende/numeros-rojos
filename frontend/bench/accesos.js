// Benchmark de laboratorio QR vs facial (tarea #373). Lo maneja scripts/benchmark-accesos/run.mjs.
// Usa los motores de bench/lib/engines.js y una cámara sintética:
// un <canvas> 1280x720 -> captureStream() -> <video>. No se usa cámara real ni datos de socios.
// Imágenes de rostros: fotos de demostración de la librería face-api (MIT), leídas de node_modules en
// tiempo de ejecución; no se copian ni se publican. Nada sale del navegador.
import QRCode from 'qrcode';
import { createQrEngine, loadFaceEngine, describeFace } from '/bench/lib/engines.js';
import { euclidean } from '/bench/lib/stats.js';

const W = 1280, H = 720, TIMEOUT_MS = 5000, FACE_THRESHOLD = 0.6;
const canvas = document.createElement('canvas');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');
const video = document.getElementById('cam');
const stream = canvas.captureStream(0);
const track = stream.getVideoTracks()[0];
video.srcObject = stream;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

function prng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function paintBackground() {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#8a8f98'); g.addColorStop(1, '#5d626b');
  ctx.filter = 'none'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  track.requestFrame?.();
}

function drawTarget(img, j) {
  paintBackground();
  const size = j.size, x = j.cx - size / 2, y = j.cy - size / 2;
  ctx.save();
  ctx.filter = `brightness(${j.brightness})`;
  ctx.translate(j.cx, j.cy); ctx.rotate(j.angle); ctx.translate(-j.cx, -j.cy);
  ctx.drawImage(img, x, y, size, size);
  ctx.restore();
  ctx.filter = 'none';
  track.requestFrame?.();
}

async function qrImage(text) {
  const c = document.createElement('canvas');
  await QRCode.toCanvas(c, text, { width: 480, margin: 4, errorCorrectionLevel: 'M' });
  return c;
}

async function loadImage(src) {
  const img = new Image(); img.src = src; await img.decode(); return img;
}

// Recortes cuadrados de los 3 rostros de la foto de demostración sample1.jpg.
async function faceCrops(faceapi) {
  const img = await loadImage('/node_modules/@vladmandic/face-api/demo/sample1.jpg');
  const dets = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }));
  dets.sort((a, b) => a.box.x - b.box.x);
  if (dets.length < 3) throw new Error(`se esperaban 3 rostros de prueba, hay ${dets.length}`);
  return dets.slice(0, 3).map(({ box }) => {
    const side = Math.max(box.width, box.height) * 2.2;
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    const c = document.createElement('canvas'); c.width = c.height = 480;
    c.getContext('2d').drawImage(img, cx - side / 2, cy - side / 2, side, side, 0, 0, 480, 480);
    return c;
  });
}

function makeJitter(rand) {
  return {
    size: 340 + rand() * 160, // 340-500 px de 720
    cx: 360 + rand() * 560, cy: 270 + rand() * 180,
    brightness: 0.75 + rand() * 0.5, angle: (rand() - 0.5) * 0.17, // ±5°
  };
}

async function waitEmpty(detect) {
  paintBackground();
  await sleep(150);
  for (let i = 0, ok = 0; i < 60 && ok < 3; i++) { // 3 lecturas seguidas sin objetivo, como la PoC
    await nextFrame();
    ok = (await detect()) ? 0 : ok + 1;
  }
}


/**
 * @param {{method:'qr'|'face', engine?:'auto'|'jsqr', n:number, seed:number}} opts
 */
window.runBench = async function runBench({ method, engine = 'auto', n, seed }) {
  paintBackground(); await video.play().catch(() => {});
  const rand = prng(seed);
  const t = {}; // tiempos de carga
  let detect, engineName, backend = '', ref, plan;
  let seqTargets = [];

  if (method === 'qr') {
    const t0 = performance.now();
    const eng = await createQrEngine(engine);
    t.load_ms = performance.now() - t0; engineName = eng.name;
    const valid = new Set(Array.from({ length: 10 }, (_, i) => `NR-VALID-${seed}-${i}-${Math.floor(rand() * 1e9)}`));
    const validList = [...valid];
    for (let i = 0; i < n; i++) {
      const expected = i % 2 === 0 ? 'ok' : 'denied';
      const text = expected === 'ok' ? validList[Math.floor(rand() * validList.length)] : `NR-FAKE-${seed}-${i}-${Math.floor(rand() * 1e9)}`;
      seqTargets.push({ expected, img: await qrImage(text), j: makeJitter(rand) });
    }
    detect = async () => { const code = await eng.detect(video); return code === null ? null : (valid.has(code) ? 'ok' : 'denied'); };
  } else {
    const t0 = performance.now();
    const { faceapi, backend: be } = await loadFaceEngine();
    t.load_ms = performance.now() - t0; engineName = 'face-api tiny+recognition'; backend = be;
    const crops = await faceCrops(faceapi);
    ref = await describeFace(faceapi, crops[0]);
    if (!ref) throw new Error('sin vector de referencia');
    for (let i = 0; i < n; i++) {
      const expected = i % 2 === 0 ? 'ok' : 'denied';
      const img = expected === 'ok' ? crops[0] : crops[1 + Math.floor(rand() * 2)]; // otra persona
      seqTargets.push({ expected, img, j: makeJitter(rand) });
    }
    detect = async () => {
      const d = await describeFace(faceapi, video);
      return d ? (euclidean(ref, d) < FACE_THRESHOLD ? 'ok' : 'denied') : null;
    };
  }

  // Calentamiento (no se mide): 3 pasadas con un objetivo.
  for (let i = 0; i < 3; i++) { drawTarget(seqTargets[i].img, seqTargets[i].j); await sleep(200); await detect(); }

  const rows = [];
  let maxHeap = 0;
  for (let i = 0; i < n; i++) {
    const { expected, img, j } = seqTargets[i];
    await waitEmpty(detect);
    await sleep(100);
    const t0 = performance.now();
    drawTarget(img, j);
    let decision = 'timeout', compute = null, frames = 0;
    while (performance.now() - t0 < TIMEOUT_MS) {
      await nextFrame();
      const c0 = performance.now();
      const r = await detect();
      frames++;
      if (r) { decision = r; compute = performance.now() - c0; break; }
    }
    const total = performance.now() - t0;
    const correct = decision === expected;
    rows.push({
      method: method === 'qr' ? `qr_${engineName}` : 'face', attempt: i + 1, expected, decision, correct: correct ? 1 : 0,
      error: correct ? '' : decision === 'timeout' ? 'timeout' : decision === 'ok' ? 'false_accept' : 'false_reject',
      total_ms: decision === 'timeout' ? '' : Math.round(total * 10) / 10,
      compute_ms: compute === null ? '' : Math.round(compute * 10) / 10, frames,
    });
    if (performance.memory) maxHeap = Math.max(maxHeap, performance.memory.usedJSHeapSize);
  }
  return { rows, engine: engineName, backend, load_ms: t.load_ms, max_heap_bytes: maxHeap, video: `${video.videoWidth}x${video.videoHeight}` };
};

window.benchReady = true;
