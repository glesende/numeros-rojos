import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getBcraDebts, getBcraRejectedChecks } from '../../api/endpoints';
import Loader from '../common/Loader';
import { CHART_THEME, LINE_COLORS } from '../../constants/chartColors';
import {
  formatArsCompact,
  formatPeriodLabel,
  formatUsd,
  formatUsdCompact,
  translateSituation,
} from '../../utils/bcra';

function formatCheckDate(dateStr) {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0]?.payload?.total_usd ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-bold text-gray-800 mb-1 border-b border-gray-100 pb-1">{label}</p>
      <div className="flex justify-between gap-4">
        <span style={{ color: LINE_COLORS[0] }}>Deuda</span>
        <span className="font-mono font-semibold">{formatUsd(value)}</span>
      </div>
    </div>
  );
}

export default function BankDebtsChart() {
  const [data, setData] = useState([]);
  const [entities, setEntities] = useState([]);
  const [entity, setEntity] = useState('');
  const [latest, setLatest] = useState(null);
  const [checks, setChecks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getBcraDebts(entity ? { entity } : {})
      .then((res) => {
        setData(res.data?.data || []);
        setEntities(res.data?.entities || []);
        setLatest(res.data?.latest || null);
      })
      .catch(() => setError('No se pudieron cargar los datos de deuda bancaria.'))
      .finally(() => setLoading(false));
  }, [entity]);

  useEffect(() => {
    getBcraRejectedChecks()
      .then((res) => setChecks(res.data || null))
      .catch(() => setChecks(null));
  }, []);

  const chartData = data.map((d) => ({ ...d, period_label: formatPeriodLabel(d.period) }));
  const hasData = chartData.length > 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deudas bancarias</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Evolución de deuda con entidades financieras, en dólares - Fuente: BCRA
          </p>
        </div>
        <Link to="/deudas-bancarias" className="text-sm text-rojo hover:underline font-medium whitespace-nowrap">
          Ver todos →
        </Link>
      </div>

      {entities.length > 0 && (
        <div className="mb-4">
          <select
            value={entity}
            onChange={(e) => setEntity(e.target.value)}
            className="input-field text-sm w-full sm:w-auto"
          >
            <option value="">Todas las entidades</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-gray-400 text-sm">{error}</div>
      ) : !hasData ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No hay datos de deuda bancaria disponibles todavía.
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 0, left: 0, bottom: 40 }}
                barCategoryGap="20%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.grid} />
                <XAxis
                  dataKey="period_label"
                  tick={{ fontSize: 10, fill: CHART_THEME.axisText }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tickLine={false}
                  axisLine={{ stroke: CHART_THEME.axisLine }}
                  padding={{ left: 8, right: 8 }}
                />
                <YAxis
                  tickFormatter={formatUsdCompact}
                  tick={{ fontSize: 10, fill: CHART_THEME.axisText }}
                  tickLine={false}
                  axisLine={false}
                  width={54}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART_THEME.tooltipCursor }} />
                <Bar dataKey="total_usd" name="Deuda (USD)" fill={LINE_COLORS[0]} radius={[2, 2, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {latest && latest.rows.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Detalle del último período · {formatPeriodLabel(latest.period)}
              </h3>

              <div className="block md:hidden space-y-3">
                {latest.rows.map((row) => (
                  <div key={row.entity} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-800">{row.entity}</span>
                      <span className="font-mono font-semibold text-sm text-right whitespace-nowrap">
                        {formatUsdCompact(row.amount_usd)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{translateSituation(row.situation)}</span>
                      {row.under_review && <span className="text-amber-600 font-medium">En revisión</span>}
                      {row.legal_proceeding && <span className="text-red-600 font-medium">Proceso judicial</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                      <th className="pb-2 pr-4">Entidad</th>
                      <th className="pb-2 pr-4 text-right">Deuda</th>
                      <th className="pb-2 pr-4">Situación</th>
                      <th className="pb-2 pr-4">En revisión</th>
                      <th className="pb-2">Proceso judicial</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latest.rows.map((row) => (
                      <tr key={row.entity} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2 pr-4">{row.entity}</td>
                        <td className="py-2 pr-4 text-right font-mono whitespace-nowrap text-xs">
                          {formatUsd(row.amount_usd)}
                        </td>
                        <td className="py-2 pr-4 text-xs">{translateSituation(row.situation)}</td>
                        <td className="py-2 pr-4 text-xs">{row.under_review ? 'Sí' : 'No'}</td>
                        <td className="py-2 text-xs">{row.legal_proceeding ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {checks && checks.count > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
            Cheques sin fondo
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {checks.count} {checks.count === 1 ? 'cheque rechazado' : 'cheques rechazados'} · Total{' '}
            {formatUsd(checks.total_usd)}
          </p>

          <div className="block md:hidden space-y-3">
            {checks.rows.map((row, i) => (
              <div key={`${row.rejection_date}-${i}`} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-500">{formatCheckDate(row.rejection_date)}</span>
                  <div className="text-right font-mono font-semibold text-sm leading-tight">
                    <div>{formatArsCompact(row.amount_ars)}</div>
                    <div className="text-xs text-gray-400 font-normal">{formatUsdCompact(row.amount_usd)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {row.pending ? (
                    <span className="text-amber-600 font-medium">Pendiente</span>
                  ) : (
                    <span className="text-green-600 font-medium">Regularizado</span>
                  )}
                  {row.under_review && <span className="text-amber-600 font-medium">En revisión</span>}
                  {row.legal_proceeding && <span className="text-red-600 font-medium">Proceso judicial</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                  <th className="pb-2 pr-4">Fecha de rechazo</th>
                  <th className="pb-2 pr-4 text-right">Monto</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th className="pb-2 pr-4">En revisión</th>
                  <th className="pb-2">Proceso judicial</th>
                </tr>
              </thead>
              <tbody>
                {checks.rows.map((row, i) => (
                  <tr key={`${row.rejection_date}-${i}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatCheckDate(row.rejection_date)}</td>
                    <td className="py-2 pr-4 text-right font-mono whitespace-nowrap leading-tight text-xs">
                      <div>{formatArsCompact(row.amount_ars)}</div>
                      <div className="text-gray-400">{formatUsdCompact(row.amount_usd)}</div>
                    </td>
                    <td className="py-2 pr-4 text-xs">
                      {row.pending ? (
                        <span className="text-amber-600 font-medium">Pendiente</span>
                      ) : (
                        <span className="text-green-600 font-medium">Regularizado</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-xs">{row.under_review ? 'Sí' : 'No'}</td>
                    <td className="py-2 text-xs">{row.legal_proceeding ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
