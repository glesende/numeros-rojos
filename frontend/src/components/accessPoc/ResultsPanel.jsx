import { METHODS, METHOD_LABEL, summarize, toCsv } from '../../lib/accessPoc/stats';

const COLOR = { qr: '#1d4ed8', face: '#0f766e' };
const ms = (v) => (v === null || v === undefined ? '–' : `${Math.round(v)} ms`);
const pct = (v) => (v === null ? '–' : `${(v * 100).toFixed(0)} %`);

function Bars({ summaries }) {
  const values = METHODS.flatMap((m) => [summaries[m].median, summaries[m].p95]).filter((v) => v !== null);
  if (!values.length) return <p className="text-sm text-gray-500">Sin mediciones todavía.</p>;
  const max = Math.max(...values);
  const rowH = 22;
  const labelW = 150;
  const barMax = 260;
  const rows = METHODS.flatMap((m) => [
    { m, kind: 'Mediana', v: summaries[m].median },
    { m, kind: 'p95', v: summaries[m].p95 },
  ]);
  return (
    <svg
      role="img"
      aria-label="Gráfico de barras: mediana y p95 del tiempo de decisión por método"
      viewBox={`0 0 ${labelW + barMax + 70} ${rows.length * (rowH + 6) + 4}`}
      className="w-full max-w-xl"
    >
      {rows.map((r, i) => {
        const y = i * (rowH + 6) + 2;
        const w = r.v === null ? 0 : Math.max(2, (r.v / max) * barMax);
        return (
          <g key={`${r.m}-${r.kind}`}>
            <text x="0" y={y + 15} fontSize="12" fill="#374151">{METHOD_LABEL[r.m].split(' ').slice(-1)[0]} · {r.kind}</text>
            <rect x={labelW} y={y} width={w} height={rowH} rx="3" fill={COLOR[r.m]} opacity={r.kind === 'p95' ? 0.55 : 1} />
            <text x={labelW + w + 6} y={y + 15} fontSize="12" fill="#111827">{ms(r.v)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function download(attempts) {
  const blob = new Blob([toCsv(attempts)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `poc-accesos-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResultsPanel({ attempts, onReset }) {
  const summaries = Object.fromEntries(
    METHODS.map((m) => [m, summarize(attempts.filter((a) => a.method === m))]),
  );
  const rows = [
    ['Intentos (n)', (s) => s.n],
    ['Con decisión (sin timeout)', (s) => s.nTimed],
    ['Mediana', (s) => ms(s.median)],
    ['p95', (s) => ms(s.p95)],
    ['Mínimo', (s) => ms(s.min)],
    ['Máximo', (s) => ms(s.max)],
    ['Tasa de acierto', (s) => pct(s.accuracy)],
    ['Falsos accesos (OK cuando debía denegar)', (s) => s.falseAccept],
    ['Falsos rechazos (denegó cuando debía OK)', (s) => s.falseReject],
    ['Sin lectura (timeout 5 s)', (s) => s.timeouts],
  ];
  const q = summaries.qr;
  const f = summaries.face;
  const live = q.median !== null && f.median !== null
    ? `Con los datos cargados: ${q.median <= f.median ? 'el QR' : 'el reconocimiento facial'} es más rápido en mediana (QR ${ms(q.median)} vs facial ${ms(f.median)}; p95 ${ms(q.p95)} vs ${ms(f.p95)}).`
    : 'Medí los dos métodos para ver la comparación.';

  return (
    <section aria-labelledby="res-h" className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h2 id="res-h" className="text-lg font-bold">Resultados</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="py-2 pr-4">Métrica</th>
              {METHODS.map((m) => <th key={m} className="py-2 pr-4">{METHOD_LABEL[m]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b border-gray-100">
                <td className="py-1.5 pr-4 text-gray-700">{label}</td>
                {METHODS.map((m) => <td key={m} className="py-1.5 pr-4 font-medium tabular-nums">{fn(summaries[m])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Bars summaries={summaries} />
      <p className="text-sm font-medium">{live}</p>
      <p className="text-xs text-gray-500">
        Con menos de 20 intentos por método el p95 es prácticamente el máximo: usá el modo secuencia para que tenga sentido.
        Los resultados viven solo en la memoria de esta pestaña; si la recargás, se pierden (exportá el CSV antes).
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!attempts.length} onClick={() => download(attempts)}
          className="px-3 py-2 rounded bg-gray-900 text-white disabled:opacity-40">Exportar CSV</button>
        <button type="button" disabled={!attempts.length} onClick={onReset}
          className="px-3 py-2 rounded border border-gray-300 disabled:opacity-40">Borrar resultados</button>
      </div>
    </section>
  );
}
