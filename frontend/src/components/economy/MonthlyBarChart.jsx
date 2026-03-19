import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getEconomyMonthlySummary, getEconomyRecords } from '../../api/endpoints';
import Loader from '../common/Loader';
import OfficialBadge from '../OfficialBadge';
import { financialColors } from '../../../tailwind.config.js';

const COLORS = {
  ingresos: financialColors.ingreso,
  egresos: financialColors.egreso,
  today: '#1d4ed8',
};

function formatAmount(value, currency) {
  if (value === 0) {
    if (currency === 'ARS') return '$ 0';
    if (currency === 'USD') return 'USD 0';
    return 'EUR 0';
  }
  const abs = Math.abs(value);
  let formatted;
  if (abs >= 1_000_000_000) {
    formatted = (value / 1_000_000_000).toFixed(1) + 'B';
  } else if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(1) + 'M';
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(0) + 'K';
  } else {
    formatted = value.toFixed(0);
  }
  if (currency === 'ARS') return `$ ${formatted}`;
  if (currency === 'USD') return `USD ${formatted}`;
  return `EUR ${formatted}`;
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  const ingresos = payload.find((p) => p.dataKey === `ingresos_${currency.toLowerCase()}`);
  const egresos = payload.find((p) => p.dataKey === `egresos_${currency.toLowerCase()}`);
  const balance = (ingresos?.value ?? 0) - (egresos?.value ?? 0);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[160px]">
      <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">{label}</p>
      {ingresos && (
        <div className="flex justify-between gap-4">
          <span className="text-ingreso">Ingresos</span>
          <span className="font-mono font-semibold text-ingreso">
            {formatAmount(ingresos.value, currency)}
          </span>
        </div>
      )}
      {egresos && (
        <div className="flex justify-between gap-4">
          <span className="text-egreso">Egresos</span>
          <span className="font-mono font-semibold text-egreso">
            {formatAmount(egresos.value, currency)}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-4 mt-1 pt-1 border-t border-gray-100">
        <span className="text-gray-600">Balance</span>
        <span
          className={`font-mono font-semibold ${balance >= 0 ? 'text-ingreso' : 'text-egreso'}`}
        >
          {formatAmount(balance, currency)}
        </span>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}-${month}-${year}`;
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency || 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MonthlyBarChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const scrollRef = useRef(null);
  const [upcoming, setUpcoming] = useState([]);
  const [pending, setPending] = useState([]);

  useEffect(() => {
    setLoading(true);
    getEconomyMonthlySummary()
      .then((res) => setData(res.data.data || []))
      .catch(() => setError('No se pudieron cargar los datos del gráfico.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    getEconomyRecords({ date_from: today, sort_by: 'record_date', sort_dir: 'asc', per_page: 5 })
      .then((res) => setUpcoming(res.data.data || []))
      .catch(() => setUpcoming([]));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    getEconomyRecords({ carried_out: false, date_to: today, sort_by: 'record_date', sort_dir: 'desc' })
      .then((res) => setPending(res.data.data || []))
      .catch(() => setPending([]));
  }, []);

  // Scroll to the "today" area on mount (month index 24 out of 49)
  useEffect(() => {
    if (data.length > 0 && scrollRef.current) {
      const container = scrollRef.current;
      const barWidth = 52; // approximate px per month
      const todayIndex = 24;
      const scrollTarget = Math.max(0, todayIndex * barWidth - container.clientWidth / 2);
      container.scrollLeft = scrollTarget;
    }
  }, [data]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const ingresosKey = `ingresos_${currency.toLowerCase()}`;
  const egresosKey = `egresos_${currency.toLowerCase()}`;

  const hasData = data.some((d) => d[ingresosKey] > 0 || d[egresosKey] > 0);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compromisos económicos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Últimos 24 meses · Mes actual · Próximos 24 meses
          </p>
        </div>
        {/* Currency toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
          {['USD', 'EUR', 'ARS'].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                currency === c
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16">
          <Loader />
        </div>
      ) : error ? (
        <div className="py-12 text-center text-gray-400 text-sm">{error}</div>
      ) : !hasData ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          No hay datos registrados en {currency} para el período seleccionado.
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-ingreso inline-block" />
              <span className="text-gray-600">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-egreso inline-block" />
              <span className="text-gray-600">Egresos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-0.5 h-4 bg-blue-700 inline-block" />
              <span className="text-gray-600">Mes actual</span>
            </div>
          </div>

          {/* Scrollable chart container */}
          <div
            ref={scrollRef}
            className="overflow-x-auto pb-2"
            role="region"
            aria-label="Gráfico de ingresos y egresos mensuales"
          >
            {/* Fixed minimum width so bars are readable on mobile */}
            <div style={{ minWidth: `${data.length * 52}px`, height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{ top: 8, right: 8, left: 8, bottom: 40 }}
                  barCategoryGap="20%"
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month_label"
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: '#e5e7eb' }}
                  />
                  <YAxis
                    tickFormatter={(v) => formatAmount(v, currency)}
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    content={<CustomTooltip currency={currency} />}
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  />
                  {/* Reference line for current month */}
                  {data.findIndex((d) => d.month === todayKey) !== -1 && (
                    <ReferenceLine
                      x={data.find((d) => d.month === todayKey)?.month_label}
                      stroke={COLORS.today}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}
                  <Bar
                    dataKey={ingresosKey}
                    name="Ingresos"
                    fill={COLORS.ingresos}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                  <Bar
                    dataKey={egresosKey}
                    name="Egresos"
                    fill={COLORS.egresos}
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Upcoming commitments */}
      {upcoming.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Próximos compromisos
            </h3>
            <Link to="/economia" className="text-xs text-rojo hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Descripción</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4 text-right">Monto</th>
                  <th className="pb-2">Fuentes</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500 text-xs">{formatDate(r.record_date)}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium">
                        {r.description || '-'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={r.type === 'cobro' ? 'badge-cobro' : 'badge-pago'}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono whitespace-nowrap text-xs">
                      {formatMoney(r.amount, r.currency)}
                    </td>
                    <td className="py-2">
                      {Array.isArray(r.links) && r.links.length > 0 ? (
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {r.links.slice(0, 2).map((link, i) => {
                            let label = link.url;
                            try { label = new URL(link.url).hostname.replace('www.', ''); } catch {}
                            return (
                              <li key={i} className="flex items-center gap-1">
                                {link.official && <OfficialBadge />}
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline truncate block">
                                  {label}
                                </a>
                              </li>
                            );
                          })}
                          {r.links.length > 2 && <li className="text-gray-400">+{r.links.length - 2} más</li>}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending confirmation */}
      {pending.length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Pago/cobro no confirmado
            </h3>
            <Link to="/economia" className="text-xs text-rojo hover:underline font-medium">
              Ver todos →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Descripción</th>
                  <th className="pb-2 pr-4">Tipo</th>
                  <th className="pb-2 pr-4 text-right">Monto</th>
                  <th className="pb-2">Fuentes</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-4 whitespace-nowrap text-gray-500 text-xs">{formatDate(r.record_date)}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium">
                        {r.description || '-'}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={r.type === 'cobro' ? 'badge-cobro' : 'badge-pago'}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono whitespace-nowrap text-xs">
                      {formatMoney(r.amount, r.currency)}
                    </td>
                    <td className="py-2">
                      {Array.isArray(r.links) && r.links.length > 0 ? (
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {r.links.slice(0, 2).map((link, i) => {
                            let label = link.url;
                            try { label = new URL(link.url).hostname.replace('www.', ''); } catch {}
                            return (
                              <li key={i} className="flex items-center gap-1">
                                {link.official && <OfficialBadge />}
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-rojo hover:underline truncate block">
                                  {label}
                                </a>
                              </li>
                            );
                          })}
                          {r.links.length > 2 && <li className="text-gray-400">+{r.links.length - 2} más</li>}
                        </ul>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
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
