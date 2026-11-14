import data from '../data/accessBenchmark.json';

// Análisis resumido (tarea #379). Todas las cifras salen de los mismos datos del benchmark (#373); no hay números escritos a mano.

const fmt = (v, d = 0) => Number(v).toFixed(d).replace('.', ',');
const pick = (v) => ({ qr: v.summary.find((s) => s.method.startsWith('qr_')), face: v.summary.find((s) => s.method === 'face') });
const errs = (s) => s.false_accept + s.false_reject + s.timeouts;

export default function AccessSummary() {
  const sw = pick(data.software);
  const main = data.gpu ? pick(data.gpu) : sw;
  const w = (data.gpu || data.software).env.weights;
  const n = main.qr.n;

  return (
    <section aria-labelledby="summary-h" className="card space-y-3">
      <h2 id="summary-h" className="text-xl font-bold">Análisis resumido</h2>
      <p className="text-base">
        <strong>Para los accesos conviene el lector QR.</strong> En el benchmark de laboratorio ganó en velocidad, estabilidad, consumo y privacidad.
      </p>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>Velocidad: el QR decide en {fmt(main.qr.median_ms)} ms de mediana; el facial, en {fmt(main.face.median_ms)} ms ({fmt(main.face.median_ms / main.qr.median_ms, 1)} veces más).</li>
        <li>Sin GPU la brecha crece: {fmt(sw.qr.median_ms)} ms contra {fmt(sw.face.median_ms)} ms ({fmt(sw.face.median_ms / sw.qr.median_ms, 1)} veces más).</li>
        <li>Errores en {n} intentos: {errs(main.qr)} del QR contra {errs(main.face)} del facial (falsos accesos y rostros sin lectura, según las fotos de prueba).</li>
        <li>Recursos: el facial usa unas {Math.round(main.face.cpu_ms_per_attempt / main.qr.cpu_ms_per_attempt)} veces más CPU y descarga {fmt(w.face_models_mb, 1)} MB de modelos; el QR, {w.qr_js_gzip_kb} KB.</li>
        <li>Privacidad: el QR no usa datos biométricos; el facial exige consentimiento y análisis legal.</li>
        <li>Lo que el facial ofrece (manos libres, más difícil de prestar) no se midió; solo tendría sentido como carril opcional si una prueba en cancha muestra ventaja de flujo.</li>
      </ul>
    </section>
  );
}
