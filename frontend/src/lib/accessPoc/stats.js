// Estadísticas de la PoC de accesos. Funciones puras (sin DOM) para poder testearlas con node:test.
// Privacidad: solo trabajan con tiempos y resultados; nunca ven imágenes ni vectores faciales.

export const METHODS = ['qr', 'face'];
export const METHOD_LABEL = { qr: 'Lector QR', face: 'Reconocimiento facial' };

/** Percentil por rango más cercano (nearest-rank). Con n < 20, p95 coincide con el máximo. */
export function percentile(sortedAsc, p) {
  if (!sortedAsc.length) return null;
  const rank = Math.ceil((p / 100) * sortedAsc.length);
  return sortedAsc[Math.min(sortedAsc.length, Math.max(1, rank)) - 1];
}

export function median(sortedAsc) {
  const n = sortedAsc.length;
  if (!n) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? sortedAsc[mid] : (sortedAsc[mid - 1] + sortedAsc[mid]) / 2;
}

/** Clasifica el resultado de un intento contra lo esperado. */
export function classify(expected, decision) {
  if (decision === 'timeout') return { correct: false, error: 'timeout' };
  if (decision === expected) return { correct: true, error: '' };
  return { correct: false, error: decision === 'ok' ? 'false_accept' : 'false_reject' };
}

/** Resumen de los intentos de un método. Los tiempos usan solo intentos con decisión (sin timeout). */
export function summarize(attempts) {
  const n = attempts.length;
  const times = attempts
    .filter((a) => a.decision !== 'timeout' && Number.isFinite(a.totalMs))
    .map((a) => a.totalMs)
    .sort((a, b) => a - b);
  const count = (err) => attempts.filter((a) => a.error === err).length;
  const correct = attempts.filter((a) => a.correct).length;
  return {
    n,
    nTimed: times.length,
    median: median(times),
    p95: percentile(times, 95),
    min: times.length ? times[0] : null,
    max: times.length ? times[times.length - 1] : null,
    mean: times.length ? times.reduce((s, t) => s + t, 0) / times.length : null,
    accuracy: n ? correct / n : null,
    falseAccept: count('false_accept'),
    falseReject: count('false_reject'),
    timeouts: count('timeout'),
  };
}

const CSV_COLUMNS = [
  'method', 'attempt', 'trigger', 'expected', 'decision', 'correct', 'error',
  'total_ms', 'compute_ms', 'engine', 'backend', 'video_res', 'face_threshold', 'sequence',
];

function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  // Evita inyección de fórmulas al abrir en planillas y escapa comillas/separadores.
  const safe = /^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s) ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV anónimo: solo método, tiempos y resultado. Sin imágenes, vectores ni identificadores. */
export function toCsv(attempts) {
  const rows = attempts.map((a, i) => [
    a.method, i + 1, a.trigger, a.expected, a.decision, a.correct ? 1 : 0, a.error,
    a.totalMs === null ? '' : Math.round(a.totalMs * 10) / 10,
    a.computeMs === null ? '' : Math.round(a.computeMs * 10) / 10,
    a.engine, a.backend, a.videoRes, a.faceThreshold ?? '', a.sequence ? 1 : 0,
  ]);
  return [CSV_COLUMNS, ...rows].map((r) => r.map(csvCell).join(',')).join('\n') + '\n';
}

/** Distancia euclídea entre dos descriptores (arrays de 128 floats). */
export function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

/** Diferencia media absoluta entre dos cuadros en gris (detección de presencia, 0-255). */
export function meanAbsDiff(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
}
