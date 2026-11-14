import test from 'node:test';
import assert from 'node:assert/strict';
import { percentile, median, summarize, euclidean } from '../bench/lib/stats.js';

test('mediana y percentil (rango más cercano)', () => {
  assert.equal(median([1, 2, 3]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
  const xs = Array.from({ length: 20 }, (_, i) => i + 1);
  assert.equal(percentile(xs, 95), 19);
  assert.equal(percentile([5], 95), 5);
  assert.equal(percentile([], 95), null);
});

test('summarize excluye timeouts de los tiempos y cuenta errores', () => {
  const s = summarize([
    { decision: 'ok', correct: true, error: '', totalMs: 10 },
    { decision: 'ok', correct: true, error: '', totalMs: 30 },
    { decision: 'ok', correct: false, error: 'false_accept', totalMs: 20 },
    { decision: 'timeout', correct: false, error: 'timeout', totalMs: null },
  ]);
  assert.equal(s.n, 4);
  assert.equal(s.nTimed, 3);
  assert.equal(s.median, 20);
  assert.equal(s.accuracy, 0.5);
  assert.equal(s.falseAccept, 1);
  assert.equal(s.timeouts, 1);
});

test('euclidean', () => {
  assert.equal(euclidean([0, 0], [3, 4]), 5);
});
