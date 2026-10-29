import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAnalyticsSummary } from '../api/endpoints';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

const SECTION_LABELS = {
  home: 'Inicio',
  economia: 'Economía',
  contratos: 'Contratos',
  balances: 'Balances',
  estadisticas: 'Estadísticas',
  estadio: 'Estadio',
  derechos: 'Derechos',
  elecciones: 'Elecciones',
  bcra: 'Deudas bancarias (BCRA)',
  rumores: 'Rumores y mercado',
};

export default function AdminUsagePage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getAnalyticsSummary(days)
      .then((res) => setData(res.data.data))
      .catch(() => setError('No se pudieron cargar las métricas'))
      .finally(() => setLoading(false));
  }, [days]);

  const maxUnique = Math.max(1, ...(data?.sections || []).map((s) => s.unique_visitors));
  const pct = (v) => (v === null || v === undefined ? '—' : `${v}%`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/admin" className="text-sm text-gray-500 hover:underline">← Panel</Link>
      <div className="flex items-center justify-between my-4">
        <h1 className="text-2xl font-extrabold">Uso del sitio</h1>
        <div className="flex gap-2">
          {[7, 30].map((d) => (
            <button key={d} onClick={() => setDays(d)} className={days === d ? 'btn-primary text-sm' : 'btn-secondary text-sm'}>
              {d} días
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} />}
      {loading ? <Loader /> : data && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="card"><div className="text-2xl font-extrabold">{data.site.unique_visitors}</div><div className="text-xs text-gray-500">Visitantes únicos (sitio)</div></div>
            <div className="card"><div className="text-2xl font-extrabold">{data.site.views}</div><div className="text-xs text-gray-500">Visitas a secciones</div></div>
            <div className="card"><div className="text-2xl font-extrabold">{pct(data.site.unique_visitors ? Math.round((data.site.returning_visitors * 1000) / data.site.unique_visitors) / 10 : null)}</div><div className="text-xs text-gray-500">Vuelven (2+ días)</div></div>
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-2">Sección</th>
                  <th className="py-2 pr-2 w-1/3">Usuarios únicos</th>
                  <th className="py-2 pr-2 text-right">Visitas</th>
                  <th className="py-2 text-right">% que vuelve</th>
                </tr>
              </thead>
              <tbody>
                {data.sections.map((s) => (
                  <tr key={s.section} className="border-t">
                    <td className="py-2 pr-2 font-medium">{SECTION_LABELS[s.section] || s.section}</td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 bg-rojo rounded" style={{ width: `${(s.unique_visitors / maxUnique) * 100}%`, minWidth: s.unique_visitors ? 4 : 0 }} />
                        <span>{s.unique_visitors}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 text-right">{s.views}</td>
                    <td className="py-2 text-right">{pct(s.return_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold mt-8 mb-2">Origen del tráfico</h2>
          <div className="card overflow-x-auto">
            {data.origins.length === 0 ? (
              <p className="text-sm text-gray-500">Todavía no hay sesiones registradas en esta ventana.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-2">Origen (utm_source)</th>
                    <th className="py-2 pr-2">Campaña (utm_campaign)</th>
                    <th className="py-2 pr-2 text-right">Sesiones</th>
                    <th className="py-2 pr-2 text-right">Únicos</th>
                    <th className="py-2 text-right">% que vuelve</th>
                  </tr>
                </thead>
                <tbody>
                  {data.origins.map((o) => (
                    <tr key={`${o.source}|${o.campaign}`} className="border-t">
                      <td className="py-2 pr-2 font-medium">
                        {o.source || 'directo / sin utm'}
                        {o.mediums.length > 0 && <span className="text-xs text-gray-500"> ({o.mediums.join(', ')})</span>}
                      </td>
                      <td className="py-2 pr-2">{o.campaign || '—'}</td>
                      <td className="py-2 pr-2 text-right">{o.sessions}</td>
                      <td className="py-2 pr-2 text-right">{o.unique_visitors}</td>
                      <td className="py-2 text-right">{pct(o.return_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 className="text-lg font-bold mt-8 mb-2">Páginas de entrada</h2>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.entries.map((e) => (
                  <tr key={e.entry_path} className="border-t first:border-t-0">
                    <td className="py-2 pr-2 font-mono">{e.entry_path}</td>
                    <td className="py-2 pr-2 text-right">{e.sessions} sesiones</td>
                    <td className="py-2 text-right">{e.unique_visitors} únicos</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Últimos {data.days} días (desde {data.since}). «Vuelve» = visitante que entró en 2 o más días distintos de la ventana.
            Datos anónimos: no se guarda IP ni datos personales. Se cuentan desde que se activó la medición.
          </p>
        </>
      )}
    </div>
  );
}
