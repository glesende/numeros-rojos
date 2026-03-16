import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getBalancesEvolution } from '../../api/endpoints';
import Loader from '../common/Loader';

// Palette of distinct colors for chart lines
const LINE_COLORS = [
  '#b91c1c', // rojo institucional
  '#1d4ed8',
  '#15803d',
  '#7c3aed',
  '#d97706',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ea580c',
  '#6b7280',
];

function formatAmount(value) {
  if (value === null || value === undefined) return '-';
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
  return formatted;
}

function CustomTooltip({ active, payload, label, currency }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Ejercicio {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span className="truncate" style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            {currency} {formatAmount(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * BalanceLineChart
 *
 * Props:
 * - compact (bool): if true, renders a smaller version without item toggles (for landing)
 * - showLink (bool): show "Ver balances" link
 * - selectedItems (array of item ids): pre-filter items to show
 */
export default function BalanceLineChart({ compact = false, showLink = false, selectedItems = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState('ARS');
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    setLoading(true);
    getBalancesEvolution({ currency })
      .then((res) => {
        const d = res.data?.data || { exercises: [], series: [] };
        setData(d);
        // Default: show all (or first 5 in compact)
        const ids = d.series.map((s) => s.id);
        if (selectedItems) {
          setActiveItems(selectedItems.filter((id) => ids.includes(id)));
        } else {
          setActiveItems(compact ? ids.slice(0, 5) : ids);
        }
      })
      .catch(() => setError('No se pudieron cargar los datos de evolución.'))
      .finally(() => setLoading(false));
  }, [currency]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleItem = (id) => {
    setActiveItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="card py-16">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="card py-12 text-center text-gray-400 text-sm">{error}</div>;
  }

  if (!data || data.exercises.length === 0) {
    return (
      <div className="card py-12 text-center text-gray-400 text-sm">
        No hay datos de balances disponibles aún.
      </div>
    );
  }

  // Build Recharts data: array of { exercise, [itemName]: value }
  const chartData = data.exercises.map((exercise, idx) => {
    const point = { exercise };
    data.series.forEach((serie) => {
      point[`item_${serie.id}`] = serie.values[idx] ?? 0;
    });
    return point;
  });

  const visibleSeries = data.series.filter((s) => activeItems.includes(s.id));

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Evolución de balances</h2>
          <p className="text-sm text-gray-500 mt-0.5">Comparativa por ejercicio</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Currency toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
            {['ARS', 'USD'].map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                  currency === c
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {showLink && (
            <Link
              to="/balances"
              className="text-sm text-rojo hover:underline font-medium whitespace-nowrap"
            >
              Ver balances →
            </Link>
          )}
        </div>
      </div>

      {/* Item toggles (only in non-compact mode) */}
      {!compact && data.series.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {data.series.map((serie, idx) => {
            const color = LINE_COLORS[idx % LINE_COLORS.length];
            const active = activeItems.includes(serie.id);
            return (
              <button
                key={serie.id}
                onClick={() => toggleItem(serie.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  active
                    ? 'text-white'
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
                style={active ? { backgroundColor: color, borderColor: color } : {}}
              >
                {serie.name}
              </button>
            );
          })}
        </div>
      )}

      {visibleSeries.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          Seleccioná al menos un item para visualizar.
        </div>
      ) : (
        <div style={{ height: compact ? 260 : 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="exercise"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tickFormatter={(v) => formatAmount(v)}
                tick={{ fontSize: 10, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <Tooltip content={<CustomTooltip currency={currency} />} />
              {!compact && <Legend formatter={(value) => value} />}
              {visibleSeries.map((serie, idx) => {
                const colorIdx = data.series.findIndex((s) => s.id === serie.id);
                const color = LINE_COLORS[colorIdx % LINE_COLORS.length];
                return (
                  <Line
                    key={serie.id}
                    type="monotone"
                    dataKey={`item_${serie.id}`}
                    name={serie.name}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4, fill: color, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
