import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getBalance,
  createBalance,
  updateBalance,
  getBalanceItems,
  createBreakdown,
  updateBreakdown,
  deleteBreakdown,
  analyzeBalance,
  getBalanceDownloadUrl,
  getSettings,
  createBalanceItem,
  createBalanceSubitem,
} from '../api/endpoints';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';

const CURRENCIES = ['ARS', 'USD', 'EUR'];

export default function AdminBalanceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Balance form state
  const [exercise, setExercise] = useState('');
  const [dollarReference, setDollarReference] = useState('');
  const [publishedAt, setPublishedAt] = useState('');
  const [file, setFile] = useState(null);
  const [existingFile, setExistingFile] = useState(null);

  // Breakdown state
  const [breakdown, setBreakdown] = useState([]);
  const [items, setItems] = useState([]);

  // New breakdown row state
  const [newItemId, setNewItemId] = useState('');
  const [newSubitemId, setNewSubitemId] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('ARS');

  // AI Analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [hasOpenAiKey, setHasOpenAiKey] = useState(false);

  // Apply breakdown
  const [applyingBreakdown, setApplyingBreakdown] = useState(false);
  const [applyResult, setApplyResult] = useState(null);

  // Creating suggested items/subitems
  const [creatingItems, setCreatingItems] = useState({});

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchItems = useCallback(() => {
    getBalanceItems().then((res) => setItems(res.data?.data || []));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    getSettings()
      .then((res) => {
        const key = res.data?.data?.openai_api_key;
        setHasOpenAiKey(!!key);
      })
      .catch(() => setHasOpenAiKey(false));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getBalance(id)
      .then((res) => {
        const d = res.data?.data || {};
        setExercise(d.exercise || '');
        setDollarReference(d.dollar_reference ?? '');
        setPublishedAt(d.published_at || '');
        setExistingFile(d.has_file ? d.file_original_name : null);
        setBreakdown(d.breakdown || []);
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!exercise.trim()) {
      setError('El ejercicio es obligatorio');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('exercise', exercise.trim());
    if (dollarReference) formData.append('dollar_reference', dollarReference);
    if (publishedAt) formData.append('published_at', publishedAt);
    if (file) formData.append('file', file);

    try {
      if (isEdit) {
        await updateBalance(id, formData);
        setSuccess('Balance actualizado correctamente');
      } else {
        const res = await createBalance(formData);
        const newId = res.data?.data?.id;
        setSuccess('Balance creado correctamente');
        setTimeout(() => navigate(`/admin/balances/${newId}/editar`), 800);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el balance');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBreakdown = async (e) => {
    e.preventDefault();
    if (!newItemId || !newAmount) return;

    try {
      const res = await createBreakdown(id, {
        balance_item_id: parseInt(newItemId),
        balance_subitem_id: newSubitemId ? parseInt(newSubitemId) : null,
        amount: parseFloat(newAmount),
        currency: newCurrency,
      });
      setBreakdown((prev) => [...prev, res.data.data]);
      setNewItemId('');
      setNewSubitemId('');
      setNewAmount('');
      setNewCurrency('ARS');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar el desglose');
    }
  };

  const handleDeleteBreakdown = async (breakdownId) => {
    if (!window.confirm('¿Eliminar este registro del desglose?')) return;
    await deleteBreakdown(id, breakdownId);
    setBreakdown((prev) => prev.filter((b) => b.id !== breakdownId));
  };

  const handleAnalyze = async () => {
    if (!existingFile && !file) {
      setAnalysisError('Primero guarda el balance con un archivo para poder analizar.');
      return;
    }
    setAnalyzing(true);
    setAnalysisError('');
    setAnalysisResult(null);
    setApplyResult(null);
    try {
      const res = await analyzeBalance(id);
      setAnalysisResult(res.data?.data || {});
    } catch (err) {
      setAnalysisError(err.response?.data?.error || 'Error al analizar el balance con IA');
    } finally {
      setAnalyzing(false);
    }
  };

  /**
   * Create a suggested item from stage 1 and refresh the catalog.
   */
  const handleCreateSuggestedItem = async (name) => {
    const key = `item:${name}`;
    setCreatingItems((prev) => ({ ...prev, [key]: true }));
    try {
      await createBalanceItem({ name });
      await fetchItems();
      setCreatingItems((prev) => ({ ...prev, [key]: 'done' }));
    } catch {
      setCreatingItems((prev) => ({ ...prev, [key]: 'error' }));
    }
  };

  /**
   * Create a suggested subitem from stage 1 and refresh the catalog.
   */
  const handleCreateSuggestedSubitem = async (parentItemName, subName) => {
    const key = `subitem:${parentItemName}:${subName}`;
    setCreatingItems((prev) => ({ ...prev, [key]: true }));
    try {
      // Find parent item ID (may have been just created, so use refreshed items)
      const refreshed = await getBalanceItems();
      const catalog = refreshed.data?.data || [];
      setItems(catalog);

      const parent = catalog.find(
        (i) => i.name.toLowerCase() === parentItemName.toLowerCase()
      );
      if (!parent) {
        setCreatingItems((prev) => ({ ...prev, [key]: 'error' }));
        return;
      }
      await createBalanceSubitem(parent.id, { name: subName });
      await fetchItems();
      setCreatingItems((prev) => ({ ...prev, [key]: 'done' }));
    } catch {
      setCreatingItems((prev) => ({ ...prev, [key]: 'error' }));
    }
  };

  /**
   * Apply the breakdown from stage 2 to the balance.
   * Matches items/subitems by name against the current catalog.
   * Skips rows where the item is not found in the catalog.
   */
  const handleApplyBreakdown = async () => {
    const breakdownRows = analysisResult?.stage2?.breakdown || analysisResult?.breakdown || [];
    if (!breakdownRows.length) return;

    setApplyingBreakdown(true);
    setApplyResult(null);

    // Refresh catalog before matching
    const refreshed = await getBalanceItems();
    const catalog = refreshed.data?.data || [];
    setItems(catalog);

    let applied = 0;
    let skipped = 0;
    const newRows = [];

    for (const row of breakdownRows) {
      const item = catalog.find(
        (i) => i.name.toLowerCase() === (row.item || '').toLowerCase()
      );
      if (!item) {
        skipped++;
        continue;
      }

      let subitemId = null;
      if (row.subitem) {
        const subitem = item.subitems?.find(
          (s) => s.name.toLowerCase() === row.subitem.toLowerCase()
        );
        if (subitem) subitemId = subitem.id;
      }

      try {
        const res = await createBreakdown(id, {
          balance_item_id: item.id,
          balance_subitem_id: subitemId,
          amount: row.amount,
          currency: row.currency || 'ARS',
        });
        newRows.push(res.data.data);
        applied++;
      } catch {
        skipped++;
      }
    }

    setBreakdown((prev) => [...prev, ...newRows]);
    setApplyResult({ applied, skipped });
    setApplyingBreakdown(false);
  };

  const selectedItem = items.find((item) => item.id === parseInt(newItemId));
  const subitems = selectedItem?.subitems || [];

  const formatMoney = (amount, currency) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  if (loading) return <Loader />;

  const stage1 = analysisResult?.stage1 || {};
  const stage2 = analysisResult?.stage2 || {};
  const breakdownRows = stage2.breakdown || analysisResult?.breakdown || [];
  const newItemsSuggested = stage1.new_items || analysisResult?.new_items || [];
  const newSubitemsSuggested = stage1.new_subitems || analysisResult?.new_subitems || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/admin/balances" className="text-rojo text-sm hover:underline">&larr; Balances</Link>
        <h1 className="text-2xl font-extrabold">{isEdit ? 'Editar balance' : 'Nuevo balance'}</h1>
      </div>

      {/* Balance metadata form */}
      <div className="card mb-6">
        <h2 className="text-lg font-bold mb-4">Datos del balance</h2>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Ejercicio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={exercise}
                onChange={(e) => setExercise(e.target.value)}
                className="input-field w-full"
                placeholder="2024/2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha de publicación</label>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Valor de referencia del dólar (ARS)
            </label>
            <input
              type="number"
              value={dollarReference}
              onChange={(e) => setDollarReference(e.target.value)}
              className="input-field w-full"
              placeholder="1250"
              min="0"
              step="0.01"
            />
            <p className="text-xs text-gray-400 mt-1">
              Tipo de cambio al momento de publicación, para cálculos posteriores.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Archivo del balance</label>
            {existingFile && (
              <div className="flex items-center gap-2 mb-2 text-sm text-green-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Archivo actual: <strong>{existingFile}</strong>
              </div>
            )}
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-rojo file:text-white hover:file:bg-red-800 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, Word o Excel. Máximo 20 MB.</p>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Guardando...' : isEdit ? 'Actualizar balance' : 'Crear balance'}
          </button>
        </form>
      </div>

      {/* Breakdown section - only shown in edit mode */}
      {isEdit && (
        <>
          {/* AI Analysis */}
          <div className="card mb-6 border border-purple-100 bg-purple-50">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-purple-900">Análisis con IA</h2>
                <p className="text-sm text-purple-700 mt-1">
                  El análisis se realiza en dos etapas: primero evalúa el catálogo de items y luego
                  genera el desglose completo del balance.
                </p>
                {!hasOpenAiKey && (
                  <p className="text-sm text-amber-700 mt-2 font-medium">
                    API Key de OpenAI no configurada.{' '}
                    <Link to="/admin/settings" className="underline">
                      Configurala en Ajustes
                    </Link>{' '}
                    para habilitar esta función.
                  </p>
                )}
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !hasOpenAiKey}
                title={!hasOpenAiKey ? 'Configurá la API Key de OpenAI en Ajustes para usar esta función' : undefined}
                className="flex-shrink-0 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analizando...' : 'Analizar balance'}
              </button>
            </div>

            {analyzing && (
              <div className="mt-3 p-3 bg-purple-100 text-purple-800 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Procesando documento en dos etapas... esto puede tomar hasta 2 minutos.
                </div>
              </div>
            )}

            {analysisError && (
              <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {analysisError}
              </div>
            )}

            {analysisResult && (
              <div className="mt-4 space-y-4">

                {/* Stage 1: Catalog evaluation */}
                <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                  <div className="px-4 py-2 bg-purple-100 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-700 text-white text-xs font-bold">1</span>
                    <span className="text-sm font-semibold text-purple-900">Evaluación del catálogo</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {stage1.catalog_assessment && (
                      <p className="text-sm text-gray-700">{stage1.catalog_assessment}</p>
                    )}
                    {stage1.notes && (
                      <p className="text-xs text-gray-500 italic">{stage1.notes}</p>
                    )}

                    {newItemsSuggested.length === 0 && newSubitemsSuggested.length === 0 && (
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        El catálogo actual es suficiente para este balance.
                      </div>
                    )}

                    {newItemsSuggested.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-800 mb-2">
                          Items nuevos sugeridos ({newItemsSuggested.length}):
                        </p>
                        <ul className="space-y-1">
                          {newItemsSuggested.map((name, i) => {
                            const key = `item:${name}`;
                            const status = creatingItems[key];
                            return (
                              <li key={i} className="flex items-center justify-between gap-2 bg-yellow-50 rounded px-3 py-1.5 text-sm">
                                <span className="text-gray-800">{name}</span>
                                {status === 'done' ? (
                                  <span className="text-xs text-green-600 font-medium">✓ Creado</span>
                                ) : status === 'error' ? (
                                  <span className="text-xs text-red-600">Error</span>
                                ) : (
                                  <button
                                    onClick={() => handleCreateSuggestedItem(name)}
                                    disabled={status === true}
                                    className="text-xs px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
                                  >
                                    {status === true ? 'Creando...' : 'Crear'}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {newSubitemsSuggested.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-800 mb-2">
                          Subitems nuevos sugeridos ({newSubitemsSuggested.length}):
                        </p>
                        <ul className="space-y-1">
                          {newSubitemsSuggested.map((s, i) => {
                            const key = `subitem:${s.item}:${s.name}`;
                            const status = creatingItems[key];
                            return (
                              <li key={i} className="flex items-center justify-between gap-2 bg-yellow-50 rounded px-3 py-1.5 text-sm">
                                <span className="text-gray-800">
                                  <span className="text-gray-500">{s.item}</span>
                                  <span className="mx-1 text-gray-400">→</span>
                                  {s.name}
                                </span>
                                {status === 'done' ? (
                                  <span className="text-xs text-green-600 font-medium">✓ Creado</span>
                                ) : status === 'error' ? (
                                  <span className="text-xs text-red-600">Error</span>
                                ) : (
                                  <button
                                    onClick={() => handleCreateSuggestedSubitem(s.item, s.name)}
                                    disabled={status === true}
                                    className="text-xs px-2 py-0.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
                                  >
                                    {status === true ? 'Creando...' : 'Crear'}
                                  </button>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stage 2: Breakdown */}
                {breakdownRows.length > 0 && (
                  <div className="bg-white rounded-lg border border-purple-100 overflow-hidden">
                    <div className="px-4 py-2 bg-purple-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-700 text-white text-xs font-bold">2</span>
                        <span className="text-sm font-semibold text-purple-900">
                          Desglose generado ({breakdownRows.length} filas)
                        </span>
                      </div>
                      <button
                        onClick={handleApplyBreakdown}
                        disabled={applyingBreakdown}
                        className="text-xs px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold disabled:opacity-50"
                      >
                        {applyingBreakdown ? 'Aplicando...' : 'Aplicar desglose'}
                      </button>
                    </div>

                    <div className="p-4">
                      {stage2.notes && (
                        <p className="text-xs text-gray-600 mb-3 italic">{stage2.notes}</p>
                      )}

                      {applyResult && (
                        <div className={`mb-3 p-2 rounded text-xs font-medium ${applyResult.skipped > 0 ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
                          {applyResult.applied} filas aplicadas
                          {applyResult.skipped > 0 && ` · ${applyResult.skipped} omitidas (item no encontrado en catálogo)`}
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-gray-500">
                              <th className="pb-1 pr-3 text-left">Item</th>
                              <th className="pb-1 pr-3 text-left">Subitem</th>
                              <th className="pb-1 pr-3 text-right">Monto</th>
                              <th className="pb-1 text-left">Moneda</th>
                            </tr>
                          </thead>
                          <tbody>
                            {breakdownRows.map((row, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="py-1 pr-3">{row.item}</td>
                                <td className="py-1 pr-3 text-gray-500">{row.subitem || '-'}</td>
                                <td className={`py-1 pr-3 text-right font-mono ${row.amount < 0 ? 'text-red-600' : ''}`}>
                                  {Number(row.amount).toLocaleString('es-AR')}
                                </td>
                                <td className="py-1">{row.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <p className="mt-3 text-xs text-purple-600">
                        Revisá los items sugeridos en la Etapa 1, creá los que falten en el catálogo
                        y luego hacé clic en &quot;Aplicar desglose&quot; para cargar los datos automáticamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Breakdown CRUD */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Desglose del balance</h2>
              {existingFile && (
                <a
                  href={getBalanceDownloadUrl(id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rojo hover:underline"
                >
                  Descargar archivo →
                </a>
              )}
            </div>

            {/* Add new breakdown row */}
            <form onSubmit={handleAddBreakdown} className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold mb-3 text-gray-700">Agregar registro</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium mb-1">Item</label>
                  <select
                    value={newItemId}
                    onChange={(e) => { setNewItemId(e.target.value); setNewSubitemId(''); }}
                    className="input-field w-full text-sm"
                    required
                  >
                    <option value="">Seleccionar item</option>
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium mb-1">Subitem (opcional)</label>
                  <select
                    value={newSubitemId}
                    onChange={(e) => setNewSubitemId(e.target.value)}
                    className="input-field w-full text-sm"
                    disabled={!newItemId || subitems.length === 0}
                  >
                    <option value="">Sin subitem</option>
                    {subitems.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Monto</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="input-field w-full text-sm"
                    placeholder="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Moneda</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="input-field w-full text-sm"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-primary text-sm px-4 py-2">
                + Agregar
              </button>
            </form>

            {/* Breakdown table */}
            {breakdown.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">
                No hay desglose cargado aún.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500 uppercase">
                      <th className="pb-2 pr-3">Item</th>
                      <th className="pb-2 pr-3">Subitem</th>
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2">Moneda</th>
                      <th className="pb-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.map((bd) => (
                      <tr key={bd.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-3 font-medium">{bd.item_name}</td>
                        <td className="py-2 pr-3 text-gray-500">{bd.subitem_name || '-'}</td>
                        <td className="py-2 pr-3 text-right font-mono">
                          <span className={bd.amount < 0 ? 'text-red-600' : ''}>
                            {formatMoney(bd.amount, bd.currency)}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500">{bd.currency}</td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => handleDeleteBreakdown(bd.id)}
                            className="text-red-500 text-xs hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
