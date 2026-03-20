import { useState, useEffect, useRef } from 'react';
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
import { LINE_COLORS, CHART_THEME } from '../../constants/chartColors';

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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-1">Ejercicio {label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span className="truncate" style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono font-semibold" style={{ color: entry.color }}>
            USD {formatAmount(entry.value)}
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
 * - selectedItems (array of item ids): pre-filter items to show (overrides default_active)
 */
export default function BalanceLineChart({ compact = false, showLink = false, selectedItems = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeItems, setActiveItems] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setLoading(true);
    getBalancesEvolution()
      .then((res) => {
        const d = res.data?.data || { exercises: [], series: [] };
        setData(d);
        const ids = d.series.map((s) => s.id);
        if (selectedItems) {
          setActiveItems(selectedItems.filter((id) => ids.includes(id)));
        } else {
          // Use default_active configured by admin (fallback: all active)
          setActiveItems(d.series.filter((s) => s.default_active !== false).map((s) => s.id));
        }
      })
      .catch(() => setError('No se pudieron cargar los datos de evolución.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleItem = (id) => {
    setActiveItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setActiveItems(data?.series.map((s) => s.id) || []);
  const deselectAll = () => setActiveItems([]);

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
  const allSelected = activeItems.length === data.series.length;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Evolución de balances</h2>
          <p className="text-sm text-gray-500 mt-0.5">Comparativa por ejercicio</p>
        </div>
        <div className="flex items-center gap-3">
          {showLink && (
            <Link
              to="/balances"
              className="text-sm text-rojo hover:underline font-medium whitespace-nowrap"
            >
              Ver balances →
            </Link>
          )}

          {/* Item selector dropdown */}
          {data.series.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                  />
                </svg>
                <span className="text-gray-700">
                  Ítems ({activeItems.length}/{data.series.length})
                </span>
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg min-w-[220px] py-2">
                  {/* Select / Deselect all */}
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-100 mb-1">
                    <button
                      onClick={selectAll}
                      disabled={allSelected}
                      className="text-xs text-rojo hover:underline font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Seleccionar todos
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAll}
                      disabled={activeItems.length === 0}
                      className="text-xs text-gray-500 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Deseleccionar todos
                    </button>
                  </div>

                  {/* Items list */}
                  <div className="max-h-64 overflow-y-auto">
                    {data.series.map((serie, idx) => {
                      const color = LINE_COLORS[idx % LINE_COLORS.length];
                      const active = activeItems.includes(serie.id);
                      return (
                        <label
                          key={serie.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer select-none"
                        >
                          <div
                            className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                            style={
                              active
                                ? { backgroundColor: color, borderColor: color }
                                : { borderColor: CHART_THEME.checkboxBorder }
                            }
                          >
                            {active && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={active}
                            onChange={() => toggleItem(serie.id)}
                          />
                          <span className="text-sm text-gray-700 truncate">{serie.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {visibleSeries.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          Seleccioná al menos un ítem para visualizar.
        </div>
      ) : (
        <div style={{ height: compact ? 260 : 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.grid} />
              <XAxis
                dataKey="exercise"
                tick={{ fontSize: 12, fill: CHART_THEME.axisText }}
                tickLine={false}
                axisLine={{ stroke: CHART_THEME.axisLine }}
              />
              <YAxis
                tickFormatter={(v) => formatAmount(v)}
                tick={{ fontSize: 10, fill: CHART_THEME.axisText }}
                tickLine={false}
                axisLine={false}
                width={65}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: CHART_THEME.tooltipCursor }} />
              <Legend formatter={(value) => value} />
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
