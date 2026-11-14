// Estadísticas del benchmark de accesos (#373). Funciones puras (sin DOM), testeadas con node:test.

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

/** Distancia euclídea entre dos descriptores (arrays de 128 floats). */
export function euclidean(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return Math.sqrt(s);
}
