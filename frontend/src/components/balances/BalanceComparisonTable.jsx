import { useState, useEffect, useRef } from 'react';
import { getBalance } from '../../api/endpoints';
import Loader from '../common/Loader';

function flattenLines(lines, result = []) {
  for (const line of lines) {
    result.push(line);
    if (line.children?.length) flattenLines(line.children, result);
  }
  return result;
}

function formatARS(amount) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUSD(amount, dollarRef) {
  return 'USD ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(amount / dollarRef);
}

export default function BalanceComparisonTable({ allBalances }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef(new Set());

  // Init with 3 most recent on first load
  useEffect(() => {
    if (allBalances.length > 0 && selectedIds.length === 0) {
      setSelectedIds(allBalances.slice(0, 3).map((b) => b.id));
    }
  }, [allBalances]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch balance details for selected IDs not yet cached
  useEffect(() => {
    const toFetch = selectedIds.filter(
      (id) => id != null && !cache[id] && !pendingRef.current.has(id)
    );
    if (toFetch.length === 0) return;

    toFetch.forEach((id) => pendingRef.current.add(id));
    setLoading(true);

    Promise.all(toFetch.map((id) => getBalance(id).then((res) => ({ id, data: res.data?.data }))))
      .then((results) => {
        setCache((prev) => {
          const next = { ...prev };
          for (const { id, data } of results) next[id] = data;
          return next;
        });
      })
      .finally(() => {
        toFetch.forEach((id) => pendingRef.current.delete(id));
        setLoading(false);
      });
  }, [selectedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (index, value) => {
    const newIds = [...selectedIds];
    newIds[index] = value ? Number(value) : null;
    setSelectedIds(newIds);
  };

  // Build comparison rows
  const selectedBalances = selectedIds.map((id) => cache[id]).filter(Boolean);
  const itemMap = new Map();
  for (const balance of selectedBalances) {
    for (const line of flattenLines(balance.lines || [])) {
      if (!line.normalized_name) continue;
      if (!itemMap.has(line.normalized_name)) {
        itemMap.set(line.normalized_name, line.name);
      }
    }
  }

  const rows = Array.from(itemMap.entries()).map(([key, name]) => ({
    key,
    name,
    values: selectedIds.map((id) => {
      const balance = cache[id];
      if (!balance) return null;
      const line = flattenLines(balance.lines || []).find((l) => l.normalized_name === key);
      if (!line || line.amount == null) return null;
      return { amount: line.amount, currency: line.currency, dollarRef: balance.dollar_reference };
    }),
  }));

  if (allBalances.length < 2) return null;

  return (
    <div className="card mb-8">
      <h2 className="text-xl font-bold mb-4">Comparativa de balances</h2>

      {/* Balance selectors */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex-1 min-w-[140px]">
            <label className="text-xs text-gray-500 mb-1 block">Balance {i + 1}</label>
            <select
              className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-rojo/30"
              value={selectedIds[i] ?? ''}
              onChange={(e) => handleSelect(i, e.target.value)}
            >
              <option value="">— Sin selección —</option>
              {allBalances.map((b) => (
                <option key={b.id} value={b.id}>
                  Ejercicio {b.exercise}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">
          {selectedBalances.length === 0
            ? 'Seleccioná al menos un balance para ver la comparativa.'
            : 'Sin datos para comparar.'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4 text-left font-semibold pl-2">Concepto</th>
                {selectedIds.map((id, i) => {
                  const b = cache[id];
                  return (
                    <th key={i} className="pb-2 px-2 text-right font-semibold min-w-[130px]">
                      {b ? `Ej. ${b.exercise}` : id ? '…' : '—'}
                      {b?.dollar_reference > 0 && (
                        <div className="text-xs font-normal text-gray-400 normal-case tracking-normal mt-0.5">
                          USD 1 = ${Number(b.dollar_reference).toLocaleString('es-AR')}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr
                  key={row.key}
                  className={`border-b border-gray-100 ${ri % 2 !== 0 ? 'bg-gray-50/50' : ''}`}
                >
                  <td className="py-1.5 pr-4 pl-2 text-gray-700">{row.name}</td>
                  {row.values.map((val, vi) => (
                    <td key={vi} className="py-1.5 px-2 text-right align-top">
                      {val === null ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <>
                          <span
                            className={`block font-mono ${
                              val.amount < 0 ? 'text-red-600' : 'text-gray-800'
                            }`}
                          >
                            {formatARS(val.amount)}
                          </span>
                          {val.dollarRef > 0 && (
                            <span className="block text-xs text-gray-400 font-mono">
                              {formatUSD(val.amount, val.dollarRef)}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
