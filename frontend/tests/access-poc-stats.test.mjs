import test from 'node:test';
import assert from 'node:assert/strict';
import { percentile, median, summarize, classify, toCsv, euclidean, meanAbsDiff } from '../src/lib/accessPoc/stats.js';

const att = (over) => ({
  method: 'qr', trigger: 'presence', expected: 'ok', decision: 'ok', correct: true, error: '',
  totalMs: 100, computeMs: 10, engine: 'jsqr', backend: '', videoRes: '640x480', faceThreshold: null, sequence: false, ...over,
});

test('mediana y percentil (rango más cercano)', () => {
  assert.equal(median([1, 2, 3]), 2);
  assert.equal(median([1, 2, 3, 4]), 2.5);
  assert.equal(median([]), null);
  const xs = Array.from({ length: 20 }, (_, i) => i + 1);
  assert.equal(percentile(xs, 95), 19);
  assert.equal(percentile([5], 95), 5);
  assert.equal(percentile([], 95), null);
});

test('classify distingue falso positivo, falso negativo y timeout', () => {
  assert.deepEqual(classify('ok', 'ok'), { correct: true, error: '' });
  assert.equal(classify('denied', 'ok').error, 'false_accept');
  assert.equal(classify('ok', 'denied').error, 'false_reject');
  assert.equal(classify('ok', 'timeout').error, 'timeout');
});

test('summarize excluye timeouts de los tiempos pero no de la tasa de acierto', () => {
  const s = summarize([
    att({ totalMs: 100 }), att({ totalMs: 300 }),
    att({ decision: 'timeout', correct: false, error: 'timeout', totalMs: 5000 }),
    att({ decision: 'ok', expected: 'denied', correct: false, error: 'false_accept', totalMs: 200 }),
  ]);
  assert.equal(s.n, 4);
  assert.equal(s.nTimed, 3);
  assert.equal(s.median, 200);
  assert.equal(s.min, 100);
  assert.equal(s.max, 300);
  assert.equal(s.accuracy, 0.5);
  assert.equal(s.timeouts, 1);
  assert.equal(s.falseAccept, 1);
});

test('summarize de lista vacía no revienta', () => {
  const s = summarize([]);
  assert.equal(s.n, 0);
  assert.equal(s.median, null);
  assert.equal(s.accuracy, null);
});

test('toCsv: encabezado, escape y sin datos biométricos', () => {
  const csv = toCsv([att({ engine: '=cmd,"x"' })]);
  const [head, row] = csv.trim().split('\n');
  assert.ok(head.startsWith('method,attempt,trigger'));
  assert.ok(row.includes(`"'=cmd,""x"""`));
  assert.ok(!/descriptor|image|data:image/i.test(csv));
});

test('euclidean y meanAbsDiff', () => {
  assert.equal(euclidean([0, 0], [3, 4]), 5);
  assert.equal(meanAbsDiff([0, 10], [10, 0]), 10);
});
