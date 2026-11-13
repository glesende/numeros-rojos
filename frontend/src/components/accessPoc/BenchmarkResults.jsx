import data from '../../data/accessBenchmark.json';

// Resultados del benchmark de laboratorio (tarea #373): datos generados por scripts/benchmark-accesos.
// Se muestran arriba de la PoC interactiva. Son mediciones sintéticas, no de campo.

const fmt = (v, d = 0) => (v === null || v === undefined ? '–' : Number(v).toFixed(d).replace('.', ','));
const pick = (v) => ({ qr: v.summary.find((s) => s.method.startsWith('qr_')), face: v.summary.find((s) => s.method === 'face') });

function Bars({ rows }) {
  const max = Math.max(...rows.flatMap((r) => [r.median, r.p95]));
  return (
    <div role="img" aria-label={rows.map((r) => `${r.label}: mediana ${fmt(r.median)} ms, p95 ${fmt(r.p95)} ms`).join('. ')} className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="space-y-1">
          <div className="text-sm font-semibold">{r.label}</div>
          {[['Mediana', r.median, 1], ['p95', r.p95, 0.55]].map(([k, v, o]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="w-14 text-gray-600">{k}</span>
              <div className="flex-1 bg-gray-100 rounded h-5">
                <div className="h-5 rounded" style={{ width: `${Math.max(1.5, (v / max) * 100)}%`, background: r.color, opacity: o }} />
              </div>
              <span className="w-20 text-right tabular-nums">{fmt(v)} ms</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function BenchmarkResults() {
  const gpu = data.gpu ? pick(data.gpu) : null;
  const sw = pick(data.software);
  const main = gpu || sw; // variante principal: la más favorable al facial (GPU real) para no sesgar la comparación
  const env = (gpu ? data.gpu : data.software).env;
  const times = fmt(main.face.median_ms / main.qr.median_ms, 1);
  const timesSw = Math.round(sw.face.median_ms / sw.qr.median_ms);
  const cpuTimes = Math.round(main.face.cpu_ms_per_attempt / main.qr.cpu_ms_per_attempt);
  const n = main.qr.n;
  const errs = (s) => s.false_accept + s.false_reject + s.timeouts;
  const w = env.weights;
  const rows = [
    ['Mediana', `${fmt(main.qr.median_ms)} ms`, `${fmt(main.face.median_ms)} ms`],
    ['p95', `${fmt(main.qr.p95_ms)} ms`, `${fmt(main.face.p95_ms)} ms`],
    ['Mínimo – máximo', `${fmt(main.qr.min_ms)} – ${fmt(main.qr.max_ms)} ms`, `${fmt(main.face.min_ms)} – ${fmt(main.face.max_ms)} ms`],
    ['Aciertos', `${fmt(main.qr.accuracy_pct, 0)} % (${errs(main.qr)} errores)`, `${fmt(main.face.accuracy_pct, 0)} % (falsos accesos: ${main.face.false_accept}; sin lectura: ${main.face.timeouts})`],
    ['CPU por intento', `${fmt(main.qr.cpu_ms_per_attempt)} ms`, `${fmt(main.face.cpu_ms_per_attempt)} ms`],
    ['Descarga inicial', `${w.qr_js_gzip_kb} KB`, `${w.face_js_gzip_kb} KB + ${fmt(w.face_models_mb, 1)} MB de modelos`],
    ['Memoria JS (pico)', `${main.qr.js_heap_peak_mb} MB`, `${main.face.js_heap_peak_mb} MB`],
  ];

  return (
    <section aria-labelledby="bench-h" className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div>
        <h2 id="bench-h" className="text-xl font-bold">Resultados del benchmark: QR vs reconocimiento facial</h2>
        <p className="text-base mt-2">
          <strong>El QR decide unas {times} veces más rápido que el reconocimiento facial</strong> ({fmt(main.qr.median_ms)} ms contra {fmt(main.face.median_ms)} ms
          de mediana), sin un solo error ({fmt(main.qr.accuracy_pct)} % de aciertos contra {fmt(main.face.accuracy_pct)} %) y con unas {cpuTimes} veces menos CPU.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded bg-blue-50 p-3"><div className="text-2xl font-bold">{times}×</div><div className="text-xs text-gray-600">más rápido (mediana)</div></div>
        <div className="rounded bg-blue-50 p-3"><div className="text-2xl font-bold">{fmt(main.qr.p95_ms)} ms</div><div className="text-xs text-gray-600">p95 del QR (facial: {fmt(main.face.p95_ms)} ms)</div></div>
        <div className="rounded bg-blue-50 p-3"><div className="text-2xl font-bold">{errs(main.qr)} / {errs(main.face)}</div><div className="text-xs text-gray-600">errores QR / facial en {n} intentos (facial: falsos accesos y sin lectura)</div></div>
      </div>

      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
        <strong>Medición de laboratorio, no de cancha.</strong> {n} intentos por método, cámara sintética (imágenes de prueba, sin personas ni socios reales), {env.browser}, {env.machine}.
        Los tiempos de ambos métodos incluyen el retardo del cuadro de video; los intentos facial sin lectura no entran en los tiempos y el resultado de errores depende de las fotos de prueba (indicativo). En un torniquete real se suman la cámara, la persona y la luz. Sirven para comparar entre métodos, no como promesa absoluta.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left border-b border-gray-200"><th className="py-2 pr-3">Métrica</th><th className="py-2 pr-3">Lector QR</th><th className="py-2 pr-3">Facial</th></tr></thead>
          <tbody>
            {rows.map(([k, a, b]) => (
              <tr key={k} className="border-b border-gray-100"><th scope="row" className="py-1.5 pr-3 text-left font-semibold">{k}</th><td className="py-1.5 pr-3">{a}</td><td className="py-1.5 pr-3">{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <Bars rows={[{ label: 'Lector QR', median: main.qr.median_ms, p95: main.qr.p95_ms, color: '#1d4ed8' }, { label: 'Reconocimiento facial', median: main.face.median_ms, p95: main.face.p95_ms, color: '#0f766e' }]} />

      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <div>
          <h3 className="font-bold">Lector QR</h3>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>+</strong> Rápido y estable: {fmt(main.qr.min_ms)}–{fmt(main.qr.max_ms)} ms.</li>
            <li><strong>+</strong> Casi sin cómputo ni descarga ({w.qr_js_gzip_kb} KB): corre hasta en equipos modestos.</li>
            <li><strong>+</strong> Sin datos biométricos: menos riesgo legal.</li>
            <li><strong>−</strong> Cada hincha debe mostrar el código; puede prestarse (se mitiga con QR rotativos).</li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold">Reconocimiento facial</h3>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li><strong>+</strong> Manos libres y difícil de prestar.</li>
            <li><strong>−</strong> {times} veces más lento y más variable ({fmt(main.face.min_ms)}–{fmt(main.face.max_ms)} ms).</li>
            <li><strong>−</strong> Pesa {fmt(w.face_models_mb, 1)} MB de modelos y consume mucha más CPU (sin GPU llega a ser {timesSw}× más lento que el QR).</li>
            <li><strong>−</strong> Dato biométrico: exige consentimiento y análisis legal. Gorra, barbijo y poca luz no se midieron acá y suelen empeorarlo.</li>
          </ul>
        </div>
      </div>

      <p className="text-sm">
        <strong>Conclusión:</strong> para los accesos, el QR gana en velocidad, eficiencia, costo y privacidad. El facial solo tendría sentido como carril opcional si la prueba en cancha demuestra una ventaja de flujo.
      </p>
      <p className="text-xs text-gray-500">
        Método, máquina y datos crudos (CSV): <code>docs/benchmark-accesos.md</code> del repositorio. Reproducible con <code>make benchmark-accesos</code>. Más abajo, la PoC interactiva para medir en tu propio dispositivo.
      </p>
    </section>
  );
}
