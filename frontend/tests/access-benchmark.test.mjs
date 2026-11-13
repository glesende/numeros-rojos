// Los resultados publicados del benchmark (#373) deben estar completos y ser coherentes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'src/data/accessBenchmark.json'), 'utf8'));

for (const variant of ['software', 'gpu']) {
  test(`benchmark ${variant}: N>=50, QR y facial con estadísticas finitas y QR más rápido`, () => {
    const { env, summary } = data[variant];
    const qr = summary.find((s) => s.method.startsWith('qr_'));
    const face = summary.find((s) => s.method === 'face');
    assert.ok(qr && face);
    for (const s of [qr, face]) {
      assert.ok(s.n >= 50);
      for (const k of ['median_ms', 'p95_ms', 'min_ms', 'max_ms', 'accuracy_pct', 'cpu_ms_per_attempt']) assert.ok(Number.isFinite(s[k]), `${s.method}.${k}`);
      assert.ok(s.min_ms <= s.median_ms && s.median_ms <= s.p95_ms && s.p95_ms <= s.max_ms);
    }
    assert.ok(qr.median_ms < face.median_ms);
    assert.ok(env.machine && env.browser && env.weights.face_models_mb > 0);
  });
}
