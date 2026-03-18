import { useState, useEffect } from 'react';
import { getBalancesEvolution, getSettings, updateSettings } from '../../api/endpoints';
import Loader from '../common/Loader';

const LINE_COLORS = [
  '#b91c1c',
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

export default function BalanceChartDefaultItems() {
  const [series, setSeries] = useState([]);
  const [defaultItems, setDefaultItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([getBalancesEvolution(), getSettings()])
      .then(([evoRes, settingsRes]) => {
        const evoData = evoRes.data?.data || { series: [] };
        const settings = settingsRes.data?.data || {};
        setSeries(evoData.series);

        const savedItems = settings.balance_chart_default_items;
        if (savedItems) {
          try {
            setDefaultItems(JSON.parse(savedItems));
          } catch {
            setDefaultItems(evoData.series.map((s) => s.id));
          }
        } else {
          setDefaultItems(evoData.series.map((s) => s.id));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleItem = (id) => {
    setDefaultItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setSaved(false);
  };

  const selectAll = () => {
    setDefaultItems(series.map((s) => s.id));
    setSaved(false);
  };

  const deselectAll = () => {
    setDefaultItems([]);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        balance_chart_default_items: JSON.stringify(defaultItems),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card mt-6"><Loader /></div>;
  if (series.length === 0) return null;

  const allSelected = defaultItems?.length === series.length;

  return (
    <div className="card mt-6">
      <h2 className="text-lg font-bold mb-1">Ítems activos por defecto en el gráfico</h2>
      <p className="text-sm text-gray-500 mb-4">
        Seleccioná los ítems que se mostrarán activos por defecto cuando los usuarios accedan al gráfico de evolución.
      </p>

      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={selectAll}
          disabled={allSelected}
          className="text-sm text-rojo hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Seleccionar todos
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={deselectAll}
          disabled={defaultItems?.length === 0}
          className="text-sm text-gray-500 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Deseleccionar todos
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-1 mb-5">
        {series.map((serie, idx) => {
          const color = LINE_COLORS[idx % LINE_COLORS.length];
          const active = defaultItems?.includes(serie.id) ?? true;
          return (
            <label
              key={serie.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer select-none"
            >
              <div
                className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={
                  active
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: '#d1d5db' }
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
              <span className="text-sm text-gray-700">{serie.name}</span>
            </label>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary text-sm"
      >
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar configuración'}
      </button>
    </div>
  );
}
